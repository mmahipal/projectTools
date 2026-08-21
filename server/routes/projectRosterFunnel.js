// Project Roster Funnel routes - Get contributor counts by status for each Project Objective

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');

/**
 * Get Project Roster Funnel data - Contributor counts by status for each Project Objective
 * GET /api/project-roster-funnel
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Set extended timeout for this endpoint
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000; // 4 minutes max execution time
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    
    console.log('[Project Roster Funnel] Starting data fetch...');
    
    // Support pagination with offset and limit
    const LIMIT = parseInt(req.query.limit) || 500; // Default to 500 per page
    const OFFSET = parseInt(req.query.offset) || 0;
    
    // Get total count first (for pagination info) - only on first page for efficiency
    let totalCount = 0;
    if (OFFSET === 0) {
      try {
        const countQuery = `SELECT COUNT() FROM Project_Objective__c`;
        const countResult = await conn.query(countQuery);
        totalCount = countResult.totalSize || 0;
      } catch (error) {
        console.error('[Project Roster Funnel] Error getting total count:', error);
      }
    }
    
    // Query Project Objectives with pagination
    // SOQL doesn't support OFFSET, so we fetch from the beginning and slice
    // For efficiency, only fetch what we need: OFFSET + LIMIT
    const fetchLimit = OFFSET + LIMIT;
    let projectObjectiveQuery = `SELECT Id, Name FROM Project_Objective__c ORDER BY Name LIMIT ${fetchLimit}`;
    
    // Apply GPC-Filter
    const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
    projectObjectiveQuery = applyGPCFilterToQuery(projectObjectiveQuery, req, { accountField: 'Project__r.Account__c', projectField: 'Project__c' });
    
    let projectObjectiveResult = await conn.query(projectObjectiveQuery);
    let allProjectObjectives = projectObjectiveResult.records || [];
    
    // Handle pagination by slicing the results (skip OFFSET, take LIMIT)
    const projectObjectives = allProjectObjectives.slice(OFFSET);
    
    // Check if there are more records
    // If we got exactly fetchLimit records, there might be more
    // Also check if we have totalCount and haven't reached it
    let hasMore = false;
    if (allProjectObjectives.length === fetchLimit) {
      // We got the full requested amount, likely more exist
      hasMore = true;
    } else if (totalCount > 0) {
      // Use totalCount if available
      hasMore = (OFFSET + projectObjectives.length) < totalCount;
    } else {
      // If we got fewer than requested, no more exist
      hasMore = false;
    }
    
    console.log(`[Project Roster Funnel] Found ${projectObjectives.length} Project Objectives (offset: ${OFFSET}, limit: ${LIMIT}, total: ${totalCount}, hasMore: ${hasMore})`);
    
    if (projectObjectives.length === 0) {
      return res.json({
        success: true,
        data: [],
        lastRefreshed: new Date().toISOString()
      });
    }
    
    // Get all Project Objective IDs
    const projectObjectiveIds = projectObjectives.map(po => po.Id);
    
    // Status values to count (matching the screenshot columns)
    const statuses = ['Draft', 'Invite', 'App Received', 'Matched', 'Qualified', 'Active', 'Production', 'Removed'];
    
    // Query Contributor Projects grouped by Project Objective and Status
    // Try different field names for Project Objective relationship
    const possibleProjectObjectiveFields = [
      'Project_Objective__c',
      'ProjectObjective__c',
      'Objective__c'
    ];
    
    let projectObjectiveField = null;
    for (const fieldName of possibleProjectObjectiveFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        projectObjectiveField = fieldName;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!projectObjectiveField) {
      // Fallback: try to describe the object to find the field
      try {
        const describeResult = await conn.sobject('Contributor_Project__c').describe();
        const field = describeResult.fields.find(f => 
          f.name === 'Project_Objective__c' || 
          f.name === 'ProjectObjective__c' || 
          f.name === 'Objective__c'
        );
        if (field) {
          projectObjectiveField = field.name;
        }
      } catch (error) {
        console.error('Error describing Contributor_Project__c:', error);
      }
    }
    
    if (!projectObjectiveField) {
      return res.status(500).json({
        success: false,
        error: 'Could not determine Project Objective field name on Contributor_Project__c'
      });
    }
    
    // Build query to get counts by Project Objective and Status
    // Process in batches to avoid URI too long errors and timeout
    const BATCH_SIZE = 100; // Reduced batch size for faster processing
    const statusCounts = [];
    const totalBatches = Math.ceil(projectObjectiveIds.length / BATCH_SIZE);
    const MAX_BATCHES = 20; // Limit total batches to prevent timeout
    
    console.log(`[Project Roster Funnel] Processing ${projectObjectiveIds.length} Project Objectives in ${Math.min(totalBatches, MAX_BATCHES)} batches`);
    
    // Process Project Objectives in batches with timeout checks
    const batchesToProcess = Math.min(totalBatches, MAX_BATCHES);
    for (let i = 0; i < projectObjectiveIds.length && i < (BATCH_SIZE * MAX_BATCHES); i += BATCH_SIZE) {
      checkTimeout(); // Check timeout before each batch
      
      const batch = projectObjectiveIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      
      // Query for counts grouped by Project Objective and Status for this batch
      const countQuery = `
        SELECT 
          ${projectObjectiveField} ProjectObjectiveId,
          Status__c Status,
          COUNT(Id) RecordCount
        FROM Contributor_Project__c
        WHERE ${projectObjectiveField} IN (${idsString})
          AND Status__c != null
        GROUP BY ${projectObjectiveField}, Status__c
        LIMIT 10000
      `;
      
      try {
        console.log(`[Project Roster Funnel] Processing batch ${batchNumber}/${batchesToProcess} (${batch.length} Project Objectives)`);
        const countResult = await conn.query(countQuery);
        if (countResult.records && countResult.records.length > 0) {
          statusCounts.push(...countResult.records);
        }
        
        // Limit pagination to prevent timeout
        let resultPage = countResult;
        let pageCount = 0;
        const MAX_PAGES_PER_BATCH = 5; // Reduced from 10
        
        while (resultPage.nextRecordsUrl && pageCount < MAX_PAGES_PER_BATCH) {
          checkTimeout(); // Check timeout before each page
          resultPage = await conn.queryMore(resultPage.nextRecordsUrl);
          if (resultPage.records && resultPage.records.length > 0) {
            statusCounts.push(...resultPage.records);
            pageCount++;
          } else {
            break;
          }
        }
        
        console.log(`[Project Roster Funnel] Batch ${batchNumber} completed: ${countResult.records?.length || 0} status count records`);
      } catch (error) {
        console.error(`[Project Roster Funnel] Error querying batch ${batchNumber}:`, error.message);
        // Continue with next batch even if this one fails
        continue;
      }
    }
    
    console.log(`[Project Roster Funnel] Total status count records collected: ${statusCounts.length}`);
    
    // Create a map: ProjectObjectiveId -> Status -> Count
    const countsByObjective = new Map();
    
    projectObjectives.forEach(po => {
      countsByObjective.set(po.Id, {
        id: po.Id,
        name: po.Name,
        Draft: 0,
        Invite: 0,
        'App Received': 0,
        Matched: 0,
        Qualified: 0,
        Active: 0,
        Production: 0,
        Removed: 0,
        Total: 0
      });
    });
    
    // Populate counts from query results
    statusCounts.forEach(record => {
      const objectiveId = record.ProjectObjectiveId;
      const status = record.Status || '';
      const count = record.RecordCount || 0;
      
      if (countsByObjective.has(objectiveId)) {
        const objectiveData = countsByObjective.get(objectiveId);
        
        // Map status values (case-insensitive matching with various possible formats)
        const statusLower = status.toLowerCase().trim();
        if (statusLower === 'draft') {
          objectiveData.Draft += count;
        } else if (statusLower === 'invite' || statusLower === 'invited' || statusLower === 'invitation') {
          objectiveData.Invite += count;
        } else if (statusLower === 'app received' || statusLower === 'appreceived' || statusLower === 'application received' || statusLower === 'app_received') {
          objectiveData['App Received'] += count;
        } else if (statusLower === 'matched' || statusLower === 'match') {
          objectiveData.Matched += count;
        } else if (statusLower === 'qualified' || statusLower === 'qualify') {
          objectiveData.Qualified += count;
        } else if (statusLower === 'active') {
          objectiveData.Active += count;
        } else if (statusLower === 'production' || statusLower === 'prod') {
          objectiveData.Production += count;
        } else if (statusLower === 'removed' || statusLower === 'remove') {
          objectiveData.Removed += count;
        }
      }
    });
    
    // Calculate totals for all objectives after all counts are populated
    countsByObjective.forEach((objectiveData) => {
      objectiveData.Total = 
        objectiveData.Draft +
        objectiveData.Invite +
        objectiveData['App Received'] +
        objectiveData.Matched +
        objectiveData.Qualified +
        objectiveData.Active +
        objectiveData.Production +
        objectiveData.Removed;
    });
    
    // Convert map to array and sort by name
    const result = Array.from(countsByObjective.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    const executionTime = Date.now() - startTime;
    console.log(`[Project Roster Funnel] Completed in ${executionTime}ms`);
    
    res.json({
      success: true,
      data: result,
      lastRefreshed: new Date().toISOString(),
      executionTime: executionTime,
      totalProcessed: result.length,
      limit: LIMIT,
      offset: OFFSET,
      hasMore: hasMore,
      total: totalCount || null // Return null if not fetched (subsequent pages)
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Project Roster Funnel] Error after ${executionTime}ms:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Project Roster Funnel data',
      executionTime: executionTime
    });
  }
}));

module.exports = router;

