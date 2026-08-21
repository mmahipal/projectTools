const express = require('express');
const jsforce = require('jsforce');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sanitizeSearchTerm } = require('../utils/security');
const cacheManager = require('../utils/cache');
const { createSnapshot, getAllTrends, getTrendData } = require('../utils/workstreamSnapshots');

// Helper function to get settings path
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

// Encryption key (should match other routes)
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    const key = process.env.ENCRYPTION_KEY;
    if (key.length >= 64) {
      return Buffer.from(key.slice(0, 64), 'hex');
    }
    return crypto.createHash('sha256').update(key).digest();
  }
  return crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Decrypt function
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      return text; // Return original if format is incorrect
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original if decryption fails
  }
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

// Get WorkStream Summary
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000; // 4 minutes max execution time
  
  // Set response headers early to prevent proxy timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Get filter parameters from query string (needed for cache key)
  const projectStatusFilter = req.query.projectStatus ? (Array.isArray(req.query.projectStatus) ? req.query.projectStatus : [req.query.projectStatus]) : null;
  const projectObjectiveStatusFilter = req.query.projectObjectiveStatus ? (Array.isArray(req.query.projectObjectiveStatus) ? req.query.projectObjectiveStatus : [req.query.projectObjectiveStatus]) : null;
  
  // Get GPC filter parameters for cache key
  const gpcAccounts = req.query.gpcInterestedAccounts || req.query.gpc_accounts || null;
  const gpcProjects = req.query.gpcInterestedProjects || req.query.gpc_projects || null;
  
  // Build cache key that includes all filter parameters
  // This ensures different filter combinations get different cache entries
  const filterParts = [];
  if (projectStatusFilter && projectStatusFilter.length > 0) {
    filterParts.push(`ps:${projectStatusFilter.sort().join(',')}`);
  }
  if (projectObjectiveStatusFilter && projectObjectiveStatusFilter.length > 0) {
    filterParts.push(`pos:${projectObjectiveStatusFilter.sort().join(',')}`);
  }
  if (gpcAccounts) {
    filterParts.push(`gpcA:${gpcAccounts}`);
  }
  if (gpcProjects) {
    filterParts.push(`gpcP:${gpcProjects}`);
  }
  const filterSuffix = filterParts.length > 0 ? `:${filterParts.join(':')}` : '';
  const cacheKey = `workstream:summary${filterSuffix}`;
  
  const forceRefresh = req.query.refresh === 'true';
  
  try {
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log(`Returning cached workstream summary (age: ${Math.round(cached.age / 1000)}s, stale: ${cached.isStale})`);
        return res.json({
          success: true,
          workstreams: cached.data.workstreams,
          cached: true,
          stale: cached.isStale,
          age: Math.round(cached.age / 1000) // Age in seconds
        });
      }
    }

    // Helper to check timeout
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        throw new Error(`Query timeout after ${Math.round(elapsed / 1000)}s`);
      }
    };

    console.log('Starting workstream summary fetch...');
    checkTimeout();

    // Set request timeout to prevent connection drops
    req.setTimeout(240000); // 4 minutes
    
    const conn = await getSalesforceConnection(req.user.id);
    checkTimeout();

    // Try to find the WorkStream object
    const possibleObjectNames = ['Project_Workstream__c', 'WorkStream__c', 'Work_Stream__c'];
    let workStreamObjectName = null;

    for (const objName of possibleObjectNames) {
      try {
        await conn.sobject(objName).describe();
        workStreamObjectName = objName;
        console.log(`Found WorkStream object: ${objName}`);
        break;
      } catch (error) {
        continue;
      }
    }

    if (!workStreamObjectName) {
      return res.status(400).json({
        success: false,
        error: 'WorkStream object not found in Salesforce. Please ensure Project_Workstream__c or similar object exists.'
      });
    }

    // SOQL Optimization Notes:
    // - Salesforce SOQL doesn't support GROUP BY or aggregate functions like COUNT() in SELECT
    // - We must fetch records and aggregate in memory, which is the most efficient approach
    // - Optimizations applied:
    //   1. Minimal field selection (only fields needed for aggregation)
    //   2. No ORDER BY (not needed for aggregation, reduces query time)
    //   3. Relationship queries to fetch related data in single query
    //   4. Streaming/batch processing to avoid loading all records into memory
    //   5. Early filtering (WHERE Project_Objective__c != null) to reduce data transfer
    
    // Optimized query: Remove ORDER BY (not needed for aggregation), remove Name field (not needed)
    // Process records in streaming fashion to avoid loading all into memory
    let query;
    let useRelationshipQuery = true;
    let result;
    
    // Default: Only consider project objectives with status Open, Paused, or Hidden
    const defaultStatuses = ['Open', 'Paused', 'Hidden'];
    const statusFilter = projectObjectiveStatusFilter || defaultStatuses;
    
    // Build status filter condition
    const statusCondition = statusFilter.length > 0 
      ? `AND Project_Objective__r.Status__c IN (${statusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`
      : '';
    
    // Build project status filter if provided
    let projectStatusCondition = '';
    if (projectStatusFilter && projectStatusFilter.length > 0) {
      projectStatusCondition = `AND Project_Objective__r.Project__r.Status__c IN (${projectStatusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`;
    }
    
    try {
      // First, try with relationship query - optimized: no ORDER BY, minimal fields
      // Filter out null Project_Objective__c and filter by status (default: Open, Paused, Hidden)
      // Add LIMIT to get initial batch quickly and prevent timeout
      query = `
        SELECT 
          Delivery_Tool_Name__c,
          Project_Objective__c,
          Project_Objective__r.Project__c,
          Project_Objective__r.Status__c,
          Project_Objective__r.Project__r.Status__c
        FROM ${workStreamObjectName}
        WHERE Project_Objective__c != null
        ${statusCondition}
        ${projectStatusCondition}
      `;
      
      // Apply GPC filter (filter by Project through Project_Objective relationship)
      const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
      query = applyGPCFilterToQuery(query, req, { 
        accountField: 'Project_Objective__r.Project__r.Account__c',
        projectField: 'Project_Objective__r.Project__c'
      });
      
      console.log('Executing optimized WorkStream summary query with relationship and status filters');
      console.log('Status filter:', statusFilter);
      console.log('Project status filter:', projectStatusFilter || 'none');
      result = await conn.query(query);
      console.log(`Relationship query successful. Initial workstreams fetched: ${result.records ? result.records.length : 0}`);
    } catch (relationshipError) {
      console.warn('Relationship query failed, using simpler query:', relationshipError.message);
      useRelationshipQuery = false;
      // For simpler query, we'll filter project objectives separately
      query = `
        SELECT 
          Delivery_Tool_Name__c,
          Project_Objective__c
        FROM ${workStreamObjectName}
        WHERE Project_Objective__c != null
      `;
      console.log('Executing optimized WorkStream summary query without relationship');
      result = await conn.query(query);
      console.log(`Initial workstreams fetched: ${result.records ? result.records.length : 0}`);
    }

    // Initialize aggregation structure
    const deliveryToolGroups = {};
    
    // Process records in streaming fashion - aggregate as we fetch
    // This avoids loading all records into memory at once
    const processBatch = (records) => {
      if (!records || records.length === 0) return;
      
      records.forEach(ws => {
        // Filter by status if using relationship query (status already filtered in query, but double-check)
        if (useRelationshipQuery) {
          // Check status from relationship query
          const poStatus = ws.Project_Objective__r?.Status__c;
          if (poStatus && !statusFilter.includes(poStatus)) {
            return; // Skip this workstream if status doesn't match
          }
          
          // Check project status if filter is provided
          if (projectStatusFilter && projectStatusFilter.length > 0) {
            const projectStatus = ws.Project_Objective__r?.Project__r?.Status__c;
            if (projectStatus && !projectStatusFilter.includes(projectStatus)) {
              return; // Skip this workstream if project status doesn't match
            }
          }
        }
        
        // Use "Unassigned" for null, undefined, or empty delivery tool names
        let deliveryTool;
        if (!ws.Delivery_Tool_Name__c || ws.Delivery_Tool_Name__c === null || ws.Delivery_Tool_Name__c === undefined) {
          deliveryTool = 'Unassigned';
        } else {
          const trimmed = String(ws.Delivery_Tool_Name__c).trim();
          deliveryTool = trimmed === '' ? 'Unassigned' : trimmed;
        }
        
        const projectObjectiveId = ws.Project_Objective__c;

        if (!deliveryToolGroups[deliveryTool]) {
          deliveryToolGroups[deliveryTool] = {
            deliveryToolName: deliveryTool,
            projectObjectiveIds: new Set(),
            projectIds: new Set(),
            workstreamCount: 0 // Track number of workstreams per delivery tool
          };
        }

        // Add project objective ID to set (for counting unique objectives per delivery tool)
        // Query already filters out null Project_Objective__c, but double-check for safety
        if (projectObjectiveId) {
          deliveryToolGroups[deliveryTool].projectObjectiveIds.add(projectObjectiveId);
        }
        
        // Increment workstream count
        deliveryToolGroups[deliveryTool].workstreamCount++;

        // Add project ID to set (for counting unique projects per delivery tool)
        if (useRelationshipQuery) {
          const projectId = ws.Project_Objective__r?.Project__c;
          if (projectId) {
            deliveryToolGroups[deliveryTool].projectIds.add(projectId);
          }
        }
      });
    };

    // Process initial batch
    processBatch(result.records);
    
    // Process remaining batches - use same limits as other endpoints for consistency
    // But add early exit to prevent proxy timeout
    let batchCount = 0;
    const MAX_WORKSTREAM_PAGES = 50; // Same as project-objectives, count, and download endpoints for consistency
    const FAST_RESPONSE_TIME = 15000; // Try to respond within 15 seconds to prevent proxy timeout
    let totalRecordsProcessed = result.records ? result.records.length : 0;
    
    while (result.nextRecordsUrl && batchCount < MAX_WORKSTREAM_PAGES) {
      // Check for timeout using the main execution timeout
      checkTimeout();
      
      // Early exit if we're taking too long (to prevent proxy timeout)
      if (Date.now() - startTime > FAST_RESPONSE_TIME && batchCount > 0) {
        console.warn(`Reached fast response time limit (${FAST_RESPONSE_TIME}ms). Returning partial results to prevent timeout. Processed ${totalRecordsProcessed} records.`);
        break;
      }
      
      console.log(`Processing workstream page ${batchCount + 1}/${MAX_WORKSTREAM_PAGES} (${totalRecordsProcessed} records so far)...`);
      try {
        result = await conn.queryMore(result.nextRecordsUrl);
        checkTimeout();
        if (result.records && result.records.length > 0) {
          processBatch(result.records);
          totalRecordsProcessed += result.records.length;
        }
        batchCount++;
      } catch (queryError) {
        console.error(`Error in queryMore at page ${batchCount + 1}:`, queryError.message);
        // If it's a timeout error, break and return partial results
        if (queryError.message.includes('timeout') || (Date.now() - startTime > MAX_EXECUTION_TIME)) {
          console.warn(`Timeout reached during batch processing. Returning partial results.`);
          break;
        }
        // For other errors, continue with what we have
        break;
      }
    }
    
    if (result.nextRecordsUrl && (batchCount >= MAX_WORKSTREAM_PAGES || totalRecordsProcessed >= 50000)) {
      console.warn(`Warning: Reached processing limit (${batchCount} pages, ${totalRecordsProcessed} records). Summary may be incomplete for very large datasets.`);
    }
    
    console.log(`Total workstreams processed: ${totalRecordsProcessed}`);

    console.log('Delivery tool groups:', Object.keys(deliveryToolGroups));
    console.log('Unassigned count:', deliveryToolGroups['Unassigned'] ? deliveryToolGroups['Unassigned'].projectObjectiveIds.size : 0);

    // Always query project objectives separately to get accurate project IDs
    // This ensures we have complete project ID data even if relationship query had issues
    const allProjectObjectiveIds = new Set();
    Object.values(deliveryToolGroups).forEach(group => {
      group.projectObjectiveIds.forEach(id => allProjectObjectiveIds.add(id));
    });

    const totalProjectObjectives = allProjectObjectiveIds.size;
    console.log(`Querying ${totalProjectObjectives} project objectives to get accurate project IDs...`);
    
    // Only query if we have a reasonable number (to prevent timeout)
    if (totalProjectObjectives > 0 && totalProjectObjectives <= 5000) {
      const projectObjectiveIdsArray = Array.from(allProjectObjectiveIds);
      // Query in batches of 200
      for (let i = 0; i < projectObjectiveIdsArray.length; i += 200) {
        const batch = projectObjectiveIdsArray.slice(i, i + 200);
        const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
        
        // Build status filter condition
        const statusCondition = statusFilter.length > 0 
          ? `AND Status__c IN (${statusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`
          : '';
        
        // Build project status filter if provided
        let projectStatusCondition = '';
        if (projectStatusFilter && projectStatusFilter.length > 0) {
          projectStatusCondition = `AND Project__r.Status__c IN (${projectStatusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`;
        }
        
        const projectObjectiveQuery = `
          SELECT Id, Project__c, Status__c, Project__r.Status__c
          FROM Project_Objective__c
          WHERE Id IN (${idsString})
          ${statusCondition}
          ${projectStatusCondition}
        `;
        
        try {
          const projectObjectiveResult = await conn.query(projectObjectiveQuery);
          const projectObjectiveMap = new Map();
          const validProjectObjectiveIds = new Set();
          
            (projectObjectiveResult.records || []).forEach(po => {
              // Filter by status - if no status filter, include all; otherwise check status
              // Note: status filter is already applied in the query WHERE clause, but double-check for safety
              const statusMatches = statusFilter.length === 0 || (po.Status__c && statusFilter.includes(po.Status__c));
              // Filter by project status if provided
              const projectStatusMatches = !projectStatusFilter || projectStatusFilter.length === 0 || 
                  (!po.Project__r?.Status__c || projectStatusFilter.includes(po.Project__r.Status__c));
              
              if (statusMatches && projectStatusMatches) {
                validProjectObjectiveIds.add(po.Id);
                if (po.Project__c) {
                  projectObjectiveMap.set(po.Id, po.Project__c);
                }
              }
            });

          // Update project IDs in delivery tool groups and remove invalid project objectives
          // Clear existing project IDs and rebuild from project objectives query for accuracy
          Object.values(deliveryToolGroups).forEach(group => {
            const validIds = new Set();
            const projectIdsForGroup = new Set();
            
            // Store original project IDs from relationship query before we potentially overwrite them
            const originalProjectIds = new Set(group.projectIds);
            
            group.projectObjectiveIds.forEach(poId => {
              if (validProjectObjectiveIds.has(poId)) {
                validIds.add(poId);
                const projectId = projectObjectiveMap.get(poId);
                if (projectId) {
                  projectIdsForGroup.add(projectId);
                }
              }
            });
            
            // Update project objective IDs if we found matching ones in the query
            // This applies status filters correctly
            if (validIds.size > 0) {
              group.projectObjectiveIds = validIds;
            }
            // Note: If validIds is empty, we keep the original projectObjectiveIds
            // This ensures counts don't become 0 if filters exclude all objectives
            
            // Update project IDs: prefer data from separate query, but preserve relationship query data if separate query has none
            if (projectIdsForGroup.size > 0) {
              // We got project IDs from the separate query, use them (more accurate)
              group.projectIds = projectIdsForGroup;
            } else if (originalProjectIds.size > 0) {
              // No project IDs from separate query, but we had them from relationship query
              // Preserve the original project IDs to avoid losing counts
              group.projectIds = originalProjectIds;
            }
            // If both are empty, keep projectIds as empty (accurate - no projects found)
          });
        } catch (error) {
          console.error(`Error querying project objectives for batch:`, error.message);
          // Continue with other batches - don't fail the entire request
          // Note: If this query fails, we'll use the data from the relationship query (if available)
          // or the project objective IDs collected from workstreams
        }
      }
    } else if (totalProjectObjectives > 5000) {
      console.warn(`Too many project objectives (${totalProjectObjectives}) to query separately. Using relationship query data only.`);
    }

    // Convert to array format - one row per delivery tool
    // Removed contributor project count to speed up response
    // Contributor project counts will be loaded separately via a different endpoint
    const workstreams = Object.values(deliveryToolGroups).map(group => {
      const projectObjectivesCount = group.projectObjectiveIds.size;
      const projectsCount = group.projectIds.size;
      const workstreamCount = group.workstreamCount || 0;
      
      console.log(`Delivery Tool: ${group.deliveryToolName}, Project Objectives: ${projectObjectivesCount}, Projects: ${projectsCount}, Workstreams: ${workstreamCount}, Unique Project Objective IDs: ${Array.from(group.projectObjectiveIds).slice(0, 5).join(', ')}${group.projectObjectiveIds.size > 5 ? '...' : ''}`);
      
      return {
        deliveryToolName: group.deliveryToolName,
        projectObjectivesCount: projectObjectivesCount,
        projectsCount: projectsCount,
        workstreamCount: workstreamCount, // Number of workstreams using this delivery tool
        projectObjectiveIds: Array.from(group.projectObjectiveIds) // Store IDs for later contributor project count query
      };
    });

    // Sort by delivery tool name, but put "Unassigned" at the end
    workstreams.sort((a, b) => {
      if (a.deliveryToolName === 'Unassigned') return 1;
      if (b.deliveryToolName === 'Unassigned') return -1;
      return a.deliveryToolName.localeCompare(b.deliveryToolName);
    });

    console.log(`Total delivery tool groups: ${workstreams.length}`);
    console.log(`Unassigned group exists: ${workstreams.some(ws => ws.deliveryToolName === 'Unassigned')}`);

    // Cache the result (10 minutes TTL)
    const cacheTTL = 10 * 60 * 1000; // 10 minutes
    cacheManager.set(cacheKey, { workstreams }, cacheTTL);
    console.log(`Cached workstream summary (TTL: ${cacheTTL / 1000}s)`);

    // Create daily snapshot (async, don't wait for it)
    createSnapshot(workstreams).catch(err => {
      console.error('Error creating snapshot:', err);
      // Don't fail the request if snapshot fails
    });

    const elapsed = Date.now() - startTime;
    console.log(`Workstream summary completed in ${Math.round(elapsed / 1000)}s`);

    res.json({
      success: true,
      workstreams: workstreams,
      cached: false,
      stale: false,
      executionTime: Math.round(elapsed / 1000) // Execution time in seconds
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`Error fetching workstream summary after ${Math.round(elapsed / 1000)}s:`, error);
    
    // If timeout, return partial results if available
    if (error.message && error.message.includes('timeout')) {
      // Try to return cached data if available (with matching filters)
      const cached = cacheManager.get(cacheKey);
      if (cached && cached.data && cached.data.workstreams) {
        console.log('Returning stale cached data due to timeout');
        return res.json({
          success: true,
          workstreams: cached.data.workstreams,
          cached: true,
          stale: true,
          warning: 'Request timed out. Returning cached data.',
          executionTime: Math.round(elapsed / 1000)
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workstream summary from Salesforce',
      executionTime: Math.round(elapsed / 1000)
    });
  }
}));

// Get Contributor Project Count for a specific delivery tool
router.get('/contributor-projects-count/:deliveryToolName', authenticate, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000; // 4 minutes max execution time
  
  // Set response headers early to prevent proxy timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Helper to check timeout
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error(`Query timeout after ${Math.round(elapsed / 1000)}s`);
    }
  };
  
  try {
    const { deliveryToolName } = req.params;
    const decodedDeliveryTool = decodeURIComponent(deliveryToolName);
    const forceRefresh = req.query.refresh === 'true';
    
    // Check cache first (unless force refresh)
    const cacheKey = `workstream:contributor-count:${decodedDeliveryTool}`;
    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log(`Returning cached contributor count for ${decodedDeliveryTool} (age: ${Math.round(cached.age / 1000)}s)`);
        return res.json({
          success: true,
          deliveryToolName: decodedDeliveryTool,
          contributorProjectsCount: cached.data.count,
          cached: true,
          stale: cached.isStale,
          age: Math.round(cached.age / 1000)
        });
      }
    }

    // Set request timeout
    req.setTimeout(240000); // 4 minutes
    
    const conn = await getSalesforceConnection(req.user.id);
    checkTimeout();

    // First, get all project objective IDs for this delivery tool
    // Try to find the WorkStream object
    const possibleObjectNames = ['Project_Workstream__c', 'WorkStream__c', 'Work_Stream__c'];
    let workStreamObjectName = null;

    for (const objName of possibleObjectNames) {
      try {
        await conn.sobject(objName).describe();
        workStreamObjectName = objName;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!workStreamObjectName) {
      return res.status(400).json({
        success: false,
        error: 'WorkStream object not found in Salesforce.'
      });
    }

    // Optimized: Query workstreams for this delivery tool - limit pagination
    let query;
    if (decodedDeliveryTool === 'Unassigned') {
      query = `
        SELECT Project_Objective__c
        FROM ${workStreamObjectName}
        WHERE (Delivery_Tool_Name__c = null OR Delivery_Tool_Name__c = '')
        AND Project_Objective__c != null
      `;
    } else {
      const sanitizedDeliveryTool = decodedDeliveryTool.replace(/'/g, "''");
      query = `
        SELECT Project_Objective__c
        FROM ${workStreamObjectName}
        WHERE Delivery_Tool_Name__c = '${sanitizedDeliveryTool}'
        AND Project_Objective__c != null
      `;
    }

    const workstreamResult = await conn.query(query);
    const projectObjectiveIds = new Set();
    
    // Collect project objective IDs - process workstream pages with timeout checks
    let allWorkstreamRecords = [...(workstreamResult.records || [])];
    let workstreamResultPage = workstreamResult;
    let workstreamPageCount = 0;
    const MAX_WORKSTREAM_PAGES = 50; // Increased limit to capture more data, but prevent infinite loops
    
    while (workstreamResultPage.nextRecordsUrl && workstreamPageCount < MAX_WORKSTREAM_PAGES) {
      checkTimeout(); // Check timeout before each page
      workstreamResultPage = await conn.queryMore(workstreamResultPage.nextRecordsUrl);
      if (workstreamResultPage.records && workstreamResultPage.records.length > 0) {
        allWorkstreamRecords = allWorkstreamRecords.concat(workstreamResultPage.records);
        workstreamPageCount++;
        console.log(`Fetched workstream page ${workstreamPageCount}: ${workstreamResultPage.records.length} records, total: ${allWorkstreamRecords.length}`);
      } else {
        break;
      }
    }
    
    if (workstreamResultPage.nextRecordsUrl && workstreamPageCount >= MAX_WORKSTREAM_PAGES) {
      console.warn(`Reached workstream page limit (${MAX_WORKSTREAM_PAGES}). Some project objectives may be missing.`);
    }
    
    console.log(`Total workstreams fetched: ${allWorkstreamRecords.length} for ${decodedDeliveryTool}`);

    allWorkstreamRecords.forEach(ws => {
      if (ws.Project_Objective__c) {
        projectObjectiveIds.add(ws.Project_Objective__c);
      }
    });

    // Process ALL project objectives - no artificial limit
    // The batch processing will naturally limit based on performance
    const projectObjectiveIdsArray = Array.from(projectObjectiveIds);
    const projectObjectivesToProcess = projectObjectiveIdsArray; // Process all
    
    console.log(`Processing ${projectObjectivesToProcess.length} project objectives for ${decodedDeliveryTool}`);

    if (projectObjectivesToProcess.length === 0) {
      return res.json({
        success: true,
        deliveryToolName: decodedDeliveryTool,
        contributorProjectsCount: 0
      });
    }

    // Find the Project Objective field name in Contributor_Project__c
    let projectObjectiveFieldName = null;
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const projectObjectiveField = describeResult.fields.find(f => 
        f.type === 'reference' && 
        (f.name === 'Project_Objective__c' || 
         f.name === 'ProjectObjective__c' || 
         f.name === 'Objective__c' ||
         f.relationshipName === 'Project_Objective__r')
      );
      
      if (projectObjectiveField) {
        projectObjectiveFieldName = projectObjectiveField.name;
      } else {
        projectObjectiveFieldName = 'Project_Objective__c';
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
      projectObjectiveFieldName = 'Project_Objective__c';
    }

    // Query contributor projects in batches with timeout checks
    let totalContributorProjects = 0;
    const BATCH_SIZE = 200; // Process 200 project objectives at a time
    const MAX_BATCHES = 50; // Process up to 50 batches (10,000 project objectives max)
    const MAX_CONTRIBUTOR_PAGES_PER_BATCH = 20; // Process up to 20 pages per batch (40,000 records per batch max)
    let batchCount = 0;

    for (let i = 0; i < projectObjectivesToProcess.length && batchCount < MAX_BATCHES; i += BATCH_SIZE) {
      checkTimeout(); // Check timeout before each batch
      
      const batch = projectObjectivesToProcess.slice(i, i + BATCH_SIZE);
      const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      const contributorQuery = `
        SELECT ${projectObjectiveFieldName}
        FROM Contributor_Project__c
        WHERE ${projectObjectiveFieldName} IN (${idsString})
      `;
      
      try {
        const contributorResult = await conn.query(contributorQuery);
        let allContributorRecords = [...(contributorResult.records || [])];
        let contributorResultPage = contributorResult;
        let pageCount = 0;
        
        // Process pages for this batch with limit and timeout checks
        while (contributorResultPage.nextRecordsUrl && pageCount < MAX_CONTRIBUTOR_PAGES_PER_BATCH) {
          checkTimeout(); // Check timeout before each page
          contributorResultPage = await conn.queryMore(contributorResultPage.nextRecordsUrl);
          if (contributorResultPage.records && contributorResultPage.records.length > 0) {
            allContributorRecords = allContributorRecords.concat(contributorResultPage.records);
            pageCount++;
          } else {
            break;
          }
        }
        
        if (contributorResultPage.nextRecordsUrl && pageCount >= MAX_CONTRIBUTOR_PAGES_PER_BATCH) {
          console.warn(`Batch ${batchCount + 1}: Reached pagination limit (${MAX_CONTRIBUTOR_PAGES_PER_BATCH} pages). Some contributor projects may be missing for this batch.`);
        }
        
        totalContributorProjects += allContributorRecords.length;
        batchCount++;
        console.log(`Processed batch ${batchCount} (${batch.length} project objectives): ${allContributorRecords.length} contributor projects, total: ${totalContributorProjects}`);
      } catch (error) {
        console.error(`Error querying contributor projects for batch:`, error.message);
        // If timeout, return partial results
        if (error.message.includes('timeout') || (Date.now() - startTime > MAX_EXECUTION_TIME)) {
          console.warn(`Timeout reached. Returning partial count: ${totalContributorProjects}`);
          break;
        }
        // Continue with other batches for other errors
      }
    }
    
    const processedProjectObjectives = Math.min(batchCount * BATCH_SIZE, projectObjectivesToProcess.length);
    if (batchCount >= MAX_BATCHES && processedProjectObjectives < projectObjectivesToProcess.length) {
      console.warn(`Reached batch limit (${MAX_BATCHES}). Processed ${processedProjectObjectives} project objectives out of ${projectObjectivesToProcess.length}. Count may be incomplete.`);
    }

    const elapsed = Date.now() - startTime;
    console.log(`Completed contributor count for ${decodedDeliveryTool}: ${totalContributorProjects} projects in ${Math.round(elapsed / 1000)}s`);

    // Cache the result (15 minutes TTL for contributor counts)
    const cacheTTL = 15 * 60 * 1000; // 15 minutes
    cacheManager.set(cacheKey, { count: totalContributorProjects }, cacheTTL);
    console.log(`Cached contributor count for ${decodedDeliveryTool} (TTL: ${cacheTTL / 1000}s)`);

    res.json({
      success: true,
      deliveryToolName: decodedDeliveryTool,
      contributorProjectsCount: totalContributorProjects,
      cached: false,
      stale: false,
      executionTime: Math.round(elapsed / 1000)
    });
  } catch (error) {
    console.error('Error fetching contributor projects count:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contributor projects count from Salesforce'
    });
  }
}));

// Get Project Objectives for a Delivery Tool
router.get('/project-objectives/:deliveryToolName', authenticate, asyncHandler(async (req, res) => {
  try {
    const { deliveryToolName } = req.params;
    const decodedDeliveryTool = decodeURIComponent(deliveryToolName);
    const limit = parseInt(req.query.limit) || 50; // Default limit for pagination
    const offset = parseInt(req.query.offset) || 0;
    const forceRefresh = req.query.refresh === 'true';
    
    // Get filter parameters from query string (needed for cache key and filtering)
    const projectStatusFilter = req.query.projectStatus ? (Array.isArray(req.query.projectStatus) ? req.query.projectStatus : [req.query.projectStatus]) : null;
    const projectObjectiveStatusFilter = req.query.projectObjectiveStatus ? (Array.isArray(req.query.projectObjectiveStatus) ? req.query.projectObjectiveStatus : [req.query.projectObjectiveStatus]) : null;
    
    // Get GPC filter parameters for cache key
    const gpcAccounts = req.query.gpcInterestedAccounts || req.query.gpc_accounts || null;
    const gpcProjects = req.query.gpcInterestedProjects || req.query.gpc_projects || null;
    
    // Build cache key that includes all filter parameters
    // This ensures different filter combinations get different cache entries
    const filterParts = [];
    if (projectStatusFilter && projectStatusFilter.length > 0) {
      filterParts.push(`ps:${projectStatusFilter.sort().join(',')}`);
    }
    if (projectObjectiveStatusFilter && projectObjectiveStatusFilter.length > 0) {
      filterParts.push(`pos:${projectObjectiveStatusFilter.sort().join(',')}`);
    }
    if (gpcAccounts) {
      filterParts.push(`gpcA:${gpcAccounts}`);
    }
    if (gpcProjects) {
      filterParts.push(`gpcP:${gpcProjects}`);
    }
    const filterSuffix = filterParts.length > 0 ? `:${filterParts.join(':')}` : '';
    const cacheKey = `workstream:project-objectives:${decodedDeliveryTool}${filterSuffix}`;
    
    // Check cache for first page only (unless force refresh)
    if (!forceRefresh && offset === 0) {
      const cached = cacheManager.get(cacheKey);
      if (cached && cached.data.allProjectObjectives) {
        // Return paginated results from cache
        const paginated = cached.data.allProjectObjectives.slice(offset, offset + limit);
        console.log(`Returning cached project objectives for ${decodedDeliveryTool} (page: ${offset / limit + 1}, cached: true)`);
        return res.json({
          success: true,
          deliveryToolName: decodedDeliveryTool,
          projectObjectives: paginated,
          total: cached.data.allProjectObjectives.length,
          hasMore: offset + limit < cached.data.allProjectObjectives.length,
          cached: true,
          stale: cached.isStale,
          age: Math.round(cached.age / 1000)
        });
      }
    }

    const conn = await getSalesforceConnection(req.user.id);

    // Try to find the WorkStream object
    const possibleObjectNames = ['Project_Workstream__c', 'WorkStream__c', 'Work_Stream__c'];
    let workStreamObjectName = null;

    for (const objName of possibleObjectNames) {
      try {
        await conn.sobject(objName).describe();
        workStreamObjectName = objName;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!workStreamObjectName) {
      return res.status(400).json({
        success: false,
        error: 'WorkStream object not found in Salesforce.'
      });
    }

    // Default: Only consider project objectives with status Open, Paused, or Hidden (same as summary endpoint)
    const defaultStatuses = ['Open', 'Paused', 'Hidden'];
    const statusFilter = projectObjectiveStatusFilter || defaultStatuses;
    
    // Build status filter condition
    const statusCondition = statusFilter.length > 0 
      ? `AND Project_Objective__r.Status__c IN (${statusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`
      : '';
    
    // Build project status filter if provided
    let projectStatusCondition = '';
    if (projectStatusFilter && projectStatusFilter.length > 0) {
      projectStatusCondition = `AND Project_Objective__r.Project__r.Status__c IN (${projectStatusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`;
    }
    
    // Query workstreams with the specified delivery tool name
    // Handle "Unassigned" case separately
    let query;
    if (decodedDeliveryTool === 'Unassigned') {
      query = `
        SELECT 
          Id,
          Name,
          Delivery_Tool_Name__c,
          Project_Objective__c,
          Project_Objective__r.Id,
          Project_Objective__r.Name,
          Project_Objective__r.Contributor_Facing_Project_Name__c,
          Project_Objective__r.Status__c,
          Project_Objective__r.Project__c,
          Project_Objective__r.Project__r.Name,
          Project_Objective__r.Project__r.Status__c
        FROM ${workStreamObjectName}
        WHERE (Delivery_Tool_Name__c = null OR Delivery_Tool_Name__c = '')
        AND Project_Objective__c != null
        ${statusCondition}
        ${projectStatusCondition}
        ORDER BY Project_Objective__r.Name
      `;
    } else {
      const sanitizedDeliveryTool = sanitizeSearchTerm(decodedDeliveryTool);
      query = `
        SELECT 
          Id,
          Name,
          Delivery_Tool_Name__c,
          Project_Objective__c,
          Project_Objective__r.Id,
          Project_Objective__r.Name,
          Project_Objective__r.Contributor_Facing_Project_Name__c,
          Project_Objective__r.Status__c,
          Project_Objective__r.Project__c,
          Project_Objective__r.Project__r.Name,
          Project_Objective__r.Project__r.Status__c
        FROM ${workStreamObjectName}
        WHERE Delivery_Tool_Name__c = '${sanitizedDeliveryTool}'
        AND Project_Objective__c != null
        ${statusCondition}
        ${projectStatusCondition}
        ORDER BY Project_Objective__r.Name
      `;
    }
    
    // Apply GPC filter (filter by Project through Project_Objective relationship)
    const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
    query = applyGPCFilterToQuery(query, req, { 
      accountField: 'Project_Objective__r.Project__r.Account__c',
      projectField: 'Project_Objective__r.Project__c'
    });
    
    console.log('Executing Project Objectives query for delivery tool with filters:', {
      deliveryTool: decodedDeliveryTool,
      statusFilter: statusFilter,
      projectStatusFilter: projectStatusFilter || 'none'
    });

    let result = await conn.query(query);
    console.log(`Initial workstreams found: ${result.records ? result.records.length : 0} for delivery tool: ${decodedDeliveryTool}`);

    // Collect records with same pagination limits as count/download endpoints to ensure consistency
    let allRecords = [...(result.records || [])];
    let batchCount = 0;
    const MAX_WORKSTREAM_PAGES = 50; // Same as count/download endpoints for consistency
    let totalRecordsProcessed = result.records ? result.records.length : 0;
    
    while (result.nextRecordsUrl && batchCount < MAX_WORKSTREAM_PAGES) {
      console.log(`Fetching more workstreams for delivery tool (page ${batchCount + 1}/${MAX_WORKSTREAM_PAGES})...`);
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records && result.records.length > 0) {
        allRecords = allRecords.concat(result.records);
        totalRecordsProcessed += result.records.length;
        batchCount++;
      } else {
        break;
      }
    }
    
    if (result.nextRecordsUrl && batchCount >= MAX_WORKSTREAM_PAGES) {
      console.warn(`Warning: Reached workstream page limit (${MAX_WORKSTREAM_PAGES}) for delivery tool ${decodedDeliveryTool}. Some project objectives may be missing.`);
    }
    
    console.log(`Total workstreams found: ${allRecords.length} for delivery tool: ${decodedDeliveryTool}`);

    // Group by Project Objective to get unique objectives
    const projectObjectivesMap = new Map();

    // First, collect all unique project objective IDs
    const allProjectObjectiveIds = new Set();
    allRecords.forEach(ws => {
      if (ws.Project_Objective__c) {
        allProjectObjectiveIds.add(ws.Project_Objective__c);
      }
    });
    
    // Query Project Objective names directly to ensure we get the correct Name field
    // This prevents issues where relationship queries might return incorrect or null values
    const projectObjectiveNameMap = new Map();
    if (allProjectObjectiveIds.size > 0) {
      // First, check if Project_Objective_Name__c field exists
      let hasProjectObjectiveNameField = false;
      try {
        const describeResult = await conn.sobject('Project_Objective__c').describe();
        hasProjectObjectiveNameField = describeResult.fields.some(f => f.name === 'Project_Objective_Name__c');
        console.log(`Project Objectives Endpoint: Project_Objective_Name__c field exists: ${hasProjectObjectiveNameField}`);
      } catch (describeError) {
        console.warn('Could not describe Project_Objective__c, assuming Project_Objective_Name__c does not exist');
      }
      
      const poIdsArray = Array.from(allProjectObjectiveIds);
      const PO_BATCH_SIZE = 200;
      for (let i = 0; i < poIdsArray.length; i += PO_BATCH_SIZE) {
        const batch = poIdsArray.slice(i, i + PO_BATCH_SIZE);
        const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
        // Query Project Objective with all possible name fields
        // Also include Country and Language to construct name if needed
        // Dynamically include Project_Objective_Name__c only if it exists
        const fieldsToSelect = hasProjectObjectiveNameField 
          ? 'Id, Name, Contributor_Facing_Project_Name__c, Project_Objective_Name__c, Country__c, Language__c, Project__r.Name'
          : 'Id, Name, Contributor_Facing_Project_Name__c, Country__c, Language__c, Project__r.Name';
        // Build status filter condition for project objective query
        const poStatusCondition = statusFilter.length > 0 
          ? `AND Status__c IN (${statusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`
          : '';
        
        // Build project status filter if provided
        let poProjectStatusCondition = '';
        if (projectStatusFilter && projectStatusFilter.length > 0) {
          poProjectStatusCondition = `AND Project__r.Status__c IN (${projectStatusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`;
        }
        
        const poQuery = `
          SELECT ${fieldsToSelect}, Status__c, Project__r.Status__c
          FROM Project_Objective__c
          WHERE Id IN (${idsString})
          ${poStatusCondition}
          ${poProjectStatusCondition}
        `;
        try {
          let poResult = await conn.query(poQuery);
          let allPORecords = [...(poResult.records || [])];
          let poResultPage = poResult;
          let poPageCount = 0;
          
          // Handle pagination
          while (poResultPage.nextRecordsUrl && poPageCount < 10) {
            poResultPage = await conn.queryMore(poResultPage.nextRecordsUrl);
            if (poResultPage.records && poResultPage.records.length > 0) {
              allPORecords = allPORecords.concat(poResultPage.records);
              poPageCount++;
            } else {
              break;
            }
          }
          
          allPORecords.forEach(po => {
            // Filter by status - if no status filter, include all; otherwise check status
            // Note: status filter is already applied in the query WHERE clause, but double-check for safety
            const statusMatches = statusFilter.length === 0 || (po.Status__c && statusFilter.includes(po.Status__c));
            if (!statusMatches) {
              return; // Skip this project objective if status doesn't match
            }
            
            // Check project status if filter is provided
            if (projectStatusFilter && projectStatusFilter.length > 0) {
              const projectStatus = po.Project__r?.Status__c;
              if (projectStatus && !projectStatusFilter.includes(projectStatus)) {
                return; // Skip this project objective if project status doesn't match
              }
            }
            
            const projectName = (po.Project__r?.Name || '').trim();
            const country = (po.Country__c || '').trim();
            const language = (po.Language__c || '').trim();
            
            // Priority: Contributor_Facing_Project_Name__c > Project_Objective_Name__c (if exists) > Constructed Name > Name
            // Use Contributor_Facing_Project_Name__c ONLY if it exists, is not empty, AND is different from project name
            // If Contributor_Facing_Project_Name__c equals project name, it's likely incorrect and we should construct the name
            let contributorFacingName = (po.Contributor_Facing_Project_Name__c || '').trim();
            let poName = null;
            
            // Check if Contributor_Facing_Project_Name__c is valid (exists, not empty, and different from project name)
            if (contributorFacingName && contributorFacingName !== projectName) {
              poName = contributorFacingName;
            } else {
              // Contributor_Facing_Project_Name__c is empty, null, or equals project name - try other options
              if (hasProjectObjectiveNameField && po.Project_Objective_Name__c) {
                const projectObjectiveName = (po.Project_Objective_Name__c || '').trim();
                if (projectObjectiveName && projectObjectiveName !== projectName) {
                  poName = projectObjectiveName;
                }
              }
              
              // If still no name, try to construct it from Project Name + Country + Language
              if (!poName) {
                // Construct name like "Project Name: Language-Country" (e.g., "August 12 Test Project P-UAT 1: English-United States")
                if (projectName) {
                  if (language && country) {
                    poName = `${projectName}: ${language}-${country}`;
                  } else if (language) {
                    poName = `${projectName}: ${language}`;
                  } else if (country) {
                    poName = `${projectName}: ${country}`;
                  } else {
                    // Fallback to Name field, but only if it's different from project name
                    const nameField = (po.Name || '').trim();
                    poName = (nameField && nameField !== projectName) ? nameField : projectName;
                  }
                } else {
                  // Last resort: use Name field
                  poName = (po.Name || '').trim() || 'Unknown Objective';
                }
              }
            }
            
            // Final validation: ensure we have a non-empty name
            if (!poName || poName.trim() === '') {
              poName = 'Unknown Objective';
            } else {
              poName = poName.trim(); // Ensure no leading/trailing whitespace
            }
            
            // Check for duplicate names (warn but don't prevent - multiple POs can have same name)
            if (projectObjectiveNameMap.has(po.Id)) {
              console.warn(`Project Objectives Endpoint: Duplicate Project Objective ID ${po.Id} detected. Overwriting previous name.`);
            }
            
            projectObjectiveNameMap.set(po.Id, poName);
            
            // Debug logging for first few records to verify we're getting correct names
            if (projectObjectiveNameMap.size <= 5) {
              console.log(`Project Objectives Endpoint: Project Objective ID ${po.Id}: Name="${po.Name || 'N/A'}", Project_Objective_Name="${po.Project_Objective_Name__c || 'N/A'}", Contributor_Facing="${po.Contributor_Facing_Project_Name__c || 'N/A'}", Project="${projectName}", Country="${country}", Language="${language}", Using="${poName}"`);
            }
          });
        } catch (error) {
          console.error(`Error querying project objectives for batch:`, error.message);
          // If query fails (e.g., field doesn't exist), try without Project_Objective_Name__c
          if (error.message.includes('Project_Objective_Name__c') && hasProjectObjectiveNameField) {
            console.warn('Retrying query without Project_Objective_Name__c field');
            hasProjectObjectiveNameField = false;
            i -= PO_BATCH_SIZE; // Retry this batch
            continue;
          }
        }
      }
    }
    console.log(`Fetched names for ${projectObjectiveNameMap.size} project objectives directly from Project_Objective__c`);
    
    // Now build the project objectives map using the directly queried names
    // Apply status filters to ensure consistency with summary endpoint
    allRecords.forEach(ws => {
      // Filter by status if using relationship query (status already filtered in query, but double-check)
      const poStatus = ws.Project_Objective__r?.Status__c;
      if (poStatus && statusFilter.length > 0 && !statusFilter.includes(poStatus)) {
        return; // Skip this workstream if status doesn't match
      }
      
      // Check project status if filter is provided
      if (projectStatusFilter && projectStatusFilter.length > 0) {
        const projectStatus = ws.Project_Objective__r?.Project__r?.Status__c;
        if (projectStatus && !projectStatusFilter.includes(projectStatus)) {
          return; // Skip this workstream if project status doesn't match
        }
      }
      
      const projectObjectiveId = ws.Project_Objective__c;
      if (projectObjectiveId && !projectObjectivesMap.has(projectObjectiveId)) {
        // Use the directly queried name (Contributor_Facing_Project_Name__c or Name from Project_Objective__c)
        // Fallback to relationship query only if direct query failed
        const projectObjectiveName = projectObjectiveNameMap.get(projectObjectiveId)
          || ws.Project_Objective__r?.Contributor_Facing_Project_Name__c 
          || ws.Project_Objective__r?.Name 
          || 'Unknown';
        projectObjectivesMap.set(projectObjectiveId, {
          id: projectObjectiveId,
          name: projectObjectiveName,
          projectId: ws.Project_Objective__r?.Project__c,
          projectName: ws.Project_Objective__r?.Project__r?.Name || 'Unknown',
          workstreamId: ws.Id,
          workstreamName: ws.Name || 'Unknown',
          deliveryToolName: ws.Delivery_Tool_Name__c || decodedDeliveryTool
        });
      }
    });

    const allProjectObjectives = Array.from(projectObjectivesMap.values());
    console.log(`Unique project objectives for ${decodedDeliveryTool}: ${allProjectObjectives.length}`);

    // Cache all project objectives (only for first page requests)
    if (offset === 0) {
      const cacheTTL = 10 * 60 * 1000; // 10 minutes
      cacheManager.set(cacheKey, { allProjectObjectives }, cacheTTL);
      console.log(`Cached all project objectives for ${decodedDeliveryTool} (TTL: ${cacheTTL / 1000}s)`);
    }

    // Return paginated results
    const paginated = allProjectObjectives.slice(offset, offset + limit);
    const hasMore = offset + limit < allProjectObjectives.length;

    res.json({
      success: true,
      deliveryToolName: decodedDeliveryTool,
      projectObjectives: paginated,
      total: allProjectObjectives.length,
      hasMore: hasMore,
      cached: false,
      stale: false
    });
  } catch (error) {
    console.error('Error fetching project objectives for delivery tool:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project objectives from Salesforce'
    });
  }
}));

// Get Contributor Projects for a Project Objective
router.get('/contributor-projects/:projectObjectiveId', authenticate, asyncHandler(async (req, res) => {
  try {
    const { projectObjectiveId } = req.params;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 1000;

    const conn = await getSalesforceConnection(req.user.id);

    // Try to find the Project Objective field name in Contributor_Project__c
    // Common field names: Project_Objective__c, ProjectObjective__c, Objective__c
    let projectObjectiveFieldName = null;
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const projectObjectiveField = describeResult.fields.find(f => 
        f.type === 'reference' && 
        (f.name === 'Project_Objective__c' || 
         f.name === 'ProjectObjective__c' || 
         f.name === 'Objective__c' ||
         f.relationshipName === 'Project_Objective__r')
      );
      
      if (projectObjectiveField) {
        projectObjectiveFieldName = projectObjectiveField.name;
      } else {
        // Fallback: try common field names
        projectObjectiveFieldName = 'Project_Objective__c';
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
      // Fallback: use common field name
      projectObjectiveFieldName = 'Project_Objective__c';
    }

    // Query contributor projects for the specified project objective with pagination
    const sanitizedProjectObjectiveId = sanitizeSearchTerm(projectObjectiveId);
    const query = `
      SELECT 
        Id,
        Name,
        Project__c,
        Project__r.Name,
        Status__c,
        Queue_Status__c,
        ${projectObjectiveFieldName}
      FROM Contributor_Project__c
      WHERE ${projectObjectiveFieldName} = '${sanitizedProjectObjectiveId}'
      ORDER BY Name ASC
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    console.log('Executing Contributor Projects query for Project Objective:', query);
    const result = await conn.query(query);

    // Check if there are more records using multiple methods:
    const recordsReturned = result.records ? result.records.length : 0;
    console.log(`Initial query result: recordsReturned=${recordsReturned}, limit=${limit}, offset=${offset}, totalSize=${result.totalSize}, done=${result.done}`);
    
    const hasMoreByLength = recordsReturned > limit;
    const hasMoreBySalesforce = result.done === false || (result.nextRecordsUrl && result.nextRecordsUrl.length > 0);
    const hasMoreByCount = recordsReturned === (limit + 1); // If we got exactly limit+1, there are definitely more
    
    let hasMore = hasMoreByLength || hasMoreByCount || hasMoreBySalesforce;
    console.log(`Initial hasMore check: hasMoreByLength=${hasMoreByLength}, hasMoreByCount=${hasMoreByCount}, hasMoreBySalesforce=${hasMoreBySalesforce}, hasMore=${hasMore}`);
    
    // Also check totalSize if available - this is the most reliable indicator
    if (result.totalSize !== undefined && result.totalSize !== null) {
      const totalFetched = offset + recordsReturned;
      if (result.totalSize > totalFetched) {
        hasMore = true;
        console.log(`Using totalSize to determine hasMore: totalSize=${result.totalSize}, totalFetched=${totalFetched}, hasMore=${hasMore}`);
      }
    }
    
    // If we got exactly 'limit' records (or fewer) and totalSize check didn't help, check by querying the next offset
    // This is important because Salesforce might return exactly 'limit' records even when more exist
    if (!hasMore && recordsReturned >= limit) {
      try {
        const checkQuery = `
          SELECT Id
          FROM Contributor_Project__c
          WHERE ${projectObjectiveFieldName} = '${sanitizedProjectObjectiveId}'
          ORDER BY Name ASC
          LIMIT 1
          OFFSET ${offset + limit}
        `;
        console.log('Checking for more records with query:', checkQuery);
        const checkResult = await conn.query(checkQuery);
        const checkRecordsFound = checkResult.records && checkResult.records.length > 0;
        hasMore = checkRecordsFound;
        console.log(`Additional check result: found ${checkResult.records ? checkResult.records.length : 0} records at offset ${offset + limit}, hasMore=${hasMore}`);
      } catch (checkError) {
        console.error('Error checking for more records:', checkError.message);
        console.error('Check error details:', checkError);
        // If the check fails due to OFFSET issues, try a different approach
        // Check if totalSize is greater than what we've fetched
        if (result.totalSize && result.totalSize > (offset + recordsReturned)) {
          hasMore = true;
          console.log(`Using totalSize to determine hasMore: totalSize=${result.totalSize}, fetched=${offset + recordsReturned}, hasMore=${hasMore}`);
        } else {
          hasMore = false;
        }
      }
    }
    
    // If we fetched limit+1 to check, only return the first 'limit' records
    const records = hasMoreByLength || hasMoreByCount 
      ? result.records.slice(0, limit) 
      : (result.records || []);
    
    console.log(`Final Contributor Projects pagination: offset=${offset}, limit=${limit}, recordsReturned=${recordsReturned}, recordsToReturn=${records.length}, hasMore=${hasMore}, done=${result.done}, nextRecordsUrl=${!!result.nextRecordsUrl}, totalSize=${result.totalSize}`);

    const contributorProjects = records.map(cp => ({
      id: cp.Id,
      name: cp.Name || 'Unnamed Contributor Project',
      projectId: cp.Project__c,
      projectName: cp.Project__r?.Name || 'Unknown',
      status: cp.Status__c || null,
      queueStatus: cp.Queue_Status__c || null
    }));

    res.json({
      success: true,
      projectObjectiveId: projectObjectiveId,
      contributorProjects: contributorProjects,
      count: contributorProjects.length,
      hasMore: hasMore,
      offset: offset,
      limit: limit
    });
  } catch (error) {
    console.error('Error fetching contributor projects for project objective:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contributor projects from Salesforce'
    });
  }
}));

// Get all Contributor Projects for a specific delivery tool (for download)
router.get('/contributor-projects-by-tool/:deliveryToolName', authenticate, asyncHandler(async (req, res) => {
  try {
    const { deliveryToolName } = req.params;
    const decodedDeliveryTool = decodeURIComponent(deliveryToolName);
    
    // Get filter parameters from query string (same as summary endpoint)
    const projectStatusFilter = req.query.projectStatus ? (Array.isArray(req.query.projectStatus) ? req.query.projectStatus : [req.query.projectStatus]) : null;
    const projectObjectiveStatusFilter = req.query.projectObjectiveStatus ? (Array.isArray(req.query.projectObjectiveStatus) ? req.query.projectObjectiveStatus : [req.query.projectObjectiveStatus]) : null;
    
    // Default: Only consider project objectives with status Open, Paused, or Hidden (same as summary)
    const defaultStatuses = ['Open', 'Paused', 'Hidden'];
    const statusFilter = projectObjectiveStatusFilter || defaultStatuses;
    
    // Don't fetch for Unassigned
    if (decodedDeliveryTool === 'Unassigned') {
      return res.json({
        success: true,
        deliveryToolName: decodedDeliveryTool,
        contributorProjects: []
      });
    }

    const conn = await getSalesforceConnection(req.user.id);

    // First, get all project objective IDs for this delivery tool
    const possibleObjectNames = ['Project_Workstream__c', 'WorkStream__c', 'Work_Stream__c'];
    let workStreamObjectName = null;

    for (const objName of possibleObjectNames) {
      try {
        await conn.sobject(objName).describe();
        workStreamObjectName = objName;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!workStreamObjectName) {
      return res.status(400).json({
        success: false,
        error: 'WorkStream object not found in Salesforce.'
      });
    }

    // Query workstreams for this delivery tool with status filters
    const sanitizedDeliveryTool = decodedDeliveryTool.replace(/'/g, "''");
    
    // Build status filter condition
    const statusCondition = statusFilter.length > 0 
      ? `AND Project_Objective__r.Status__c IN (${statusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`
      : '';
    
    // Build project status filter if provided
    let projectStatusCondition = '';
    if (projectStatusFilter && projectStatusFilter.length > 0) {
      projectStatusCondition = `AND Project_Objective__r.Project__r.Status__c IN (${projectStatusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ')})`;
    }
    
    let query;
    try {
      // Try with relationship query first
      query = `
        SELECT Project_Objective__c, Project_Objective__r.Status__c, Project_Objective__r.Project__r.Status__c
        FROM ${workStreamObjectName}
        WHERE Delivery_Tool_Name__c = '${sanitizedDeliveryTool}'
        AND Project_Objective__c != null
        ${statusCondition}
        ${projectStatusCondition}
      `;
    } catch (relationshipError) {
      // Fallback to simple query
      query = `
        SELECT Project_Objective__c
        FROM ${workStreamObjectName}
        WHERE Delivery_Tool_Name__c = '${sanitizedDeliveryTool}'
        AND Project_Objective__c != null
      `;
    }

    let workstreamResult;
    let useRelationshipQuery = true;
    try {
      workstreamResult = await conn.query(query);
      useRelationshipQuery = true;
    } catch (relationshipError) {
      console.warn('Relationship query failed, using simpler query:', relationshipError.message);
      useRelationshipQuery = false;
      // Fallback query without relationship
      query = `
        SELECT Project_Objective__c
        FROM ${workStreamObjectName}
        WHERE Delivery_Tool_Name__c = '${sanitizedDeliveryTool}'
        AND Project_Objective__c != null
      `;
      workstreamResult = await conn.query(query);
    }
    
    const projectObjectiveIds = new Set();
    
    // Collect project objective IDs - use same limits as count endpoint for consistency
    let allWorkstreamRecords = [...(workstreamResult.records || [])];
    let workstreamResultPage = workstreamResult;
    let workstreamPageCount = 0;
    const MAX_WORKSTREAM_PAGES = 50; // Same as count endpoint
    
    while (workstreamResultPage.nextRecordsUrl && workstreamPageCount < MAX_WORKSTREAM_PAGES) {
      workstreamResultPage = await conn.queryMore(workstreamResultPage.nextRecordsUrl);
      if (workstreamResultPage.records && workstreamResultPage.records.length > 0) {
        allWorkstreamRecords = allWorkstreamRecords.concat(workstreamResultPage.records);
        workstreamPageCount++;
        console.log(`Download: Fetched workstream page ${workstreamPageCount}: ${workstreamResultPage.records.length} records, total: ${allWorkstreamRecords.length}`);
      } else {
        break;
      }
    }
    
    if (workstreamResultPage.nextRecordsUrl && workstreamPageCount >= MAX_WORKSTREAM_PAGES) {
      console.warn(`Download: Reached workstream page limit (${MAX_WORKSTREAM_PAGES}). Some project objectives may be missing.`);
    }
    
    console.log(`Download: Total workstreams fetched: ${allWorkstreamRecords.length} for ${decodedDeliveryTool}`);

    // Filter by status if not using relationship query
    if (!useRelationshipQuery && allWorkstreamRecords.length > 0) {
      const poIds = [...new Set(allWorkstreamRecords.map(ws => ws.Project_Objective__c).filter(Boolean))];
      if (poIds.length > 0) {
        const BATCH_SIZE = 200;
        const filteredPOIds = new Set();
        
        for (let i = 0; i < poIds.length; i += BATCH_SIZE) {
          const batch = poIds.slice(i, i + BATCH_SIZE);
          const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
          const poQuery = `SELECT Id, Status__c, Project__r.Status__c FROM Project_Objective__c WHERE Id IN (${idsString})`;
          const poResult = await conn.query(poQuery);
          
          (poResult.records || []).forEach(po => {
            if (statusFilter.includes(po.Status__c || '')) {
              if (!projectStatusFilter || projectStatusFilter.length === 0 || projectStatusFilter.includes(po.Project__r?.Status__c || '')) {
                filteredPOIds.add(po.Id);
              }
            }
          });
        }
        
        allWorkstreamRecords = allWorkstreamRecords.filter(ws => filteredPOIds.has(ws.Project_Objective__c));
      }
    }

    allWorkstreamRecords.forEach(ws => {
      // If using relationship query, filter by status
      if (useRelationshipQuery) {
        const poStatus = ws.Project_Objective__r?.Status__c;
        if (poStatus && statusFilter.includes(poStatus)) {
          // Check project status if filter is provided
          if (!projectStatusFilter || projectStatusFilter.length === 0 || projectStatusFilter.includes(ws.Project_Objective__r?.Project__r?.Status__c || '')) {
            if (ws.Project_Objective__c) {
              projectObjectiveIds.add(ws.Project_Objective__c);
            }
          }
        }
      } else {
        // Already filtered above
        if (ws.Project_Objective__c) {
          projectObjectiveIds.add(ws.Project_Objective__c);
        }
      }
    });
    
    console.log(`Download: Found ${projectObjectiveIds.size} unique project objectives for ${decodedDeliveryTool}`);

    if (projectObjectiveIds.size === 0) {
      return res.json({
        success: true,
        deliveryToolName: decodedDeliveryTool,
        contributorProjects: []
      });
    }

    // Process ALL project objectives - same as count endpoint
    const projectObjectiveIdsArray = Array.from(projectObjectiveIds);
    const projectObjectivesToProcess = projectObjectiveIdsArray; // Process all
    
    console.log(`Processing ${projectObjectivesToProcess.length} project objectives for download: ${decodedDeliveryTool}`);

    if (projectObjectivesToProcess.length === 0) {
      return res.json({
        success: true,
        deliveryToolName: decodedDeliveryTool,
        contributorProjects: []
      });
    }

    // Find the Project Objective field name and relationship name in Contributor_Project__c
    let projectObjectiveFieldName = null;
    let projectObjectiveRelationshipName = null;
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const projectObjectiveField = describeResult.fields.find(f => 
        f.type === 'reference' && 
        (f.name === 'Project_Objective__c' || 
         f.name === 'ProjectObjective__c' || 
         f.name === 'Objective__c' ||
         f.relationshipName === 'Project_Objective__r')
      );
      
      if (projectObjectiveField) {
        projectObjectiveFieldName = projectObjectiveField.name;
        projectObjectiveRelationshipName = projectObjectiveField.relationshipName || projectObjectiveFieldName.replace('__c', '__r');
      } else {
        projectObjectiveFieldName = 'Project_Objective__c';
        projectObjectiveRelationshipName = 'Project_Objective__r';
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
      projectObjectiveFieldName = 'Project_Objective__c';
      projectObjectiveRelationshipName = 'Project_Objective__r';
    }

    // First, get project objective names for ALL project objectives (including those with 0 contributor projects)
    // Use same field priority as project-objectives endpoint: Contributor_Facing_Project_Name__c first, then Name
    const projectObjectiveNameMap = new Map();
    
    // First, check if Project_Objective_Name__c field exists
    let hasProjectObjectiveNameField = false;
    try {
      const describeResult = await conn.sobject('Project_Objective__c').describe();
      hasProjectObjectiveNameField = describeResult.fields.some(f => f.name === 'Project_Objective_Name__c');
      console.log(`Download: Project_Objective_Name__c field exists: ${hasProjectObjectiveNameField}`);
    } catch (describeError) {
      console.warn('Download: Could not describe Project_Objective__c, assuming Project_Objective_Name__c does not exist');
    }
    
    const PO_BATCH_SIZE = 200;
    let poBatchCount = 0;
    for (let i = 0; i < projectObjectivesToProcess.length; i += PO_BATCH_SIZE) {
      const batch = projectObjectivesToProcess.slice(i, i + PO_BATCH_SIZE);
      const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      // Query Project Objective with all possible name fields
      // Also include Country and Language to construct name if needed
      // Dynamically include Project_Objective_Name__c only if it exists
      const fieldsToSelect = hasProjectObjectiveNameField 
        ? 'Id, Name, Contributor_Facing_Project_Name__c, Project_Objective_Name__c, Country__c, Language__c, Project__r.Name'
        : 'Id, Name, Contributor_Facing_Project_Name__c, Country__c, Language__c, Project__r.Name';
      const poQuery = `
        SELECT ${fieldsToSelect}
        FROM Project_Objective__c
        WHERE Id IN (${idsString})
      `;
      try {
        let poResult = await conn.query(poQuery);
        let allPORecords = [...(poResult.records || [])];
        let poResultPage = poResult;
        let poPageCount = 0;
        
        // Handle pagination for project objectives query (in case there are many)
        while (poResultPage.nextRecordsUrl && poPageCount < 10) {
          poResultPage = await conn.queryMore(poResultPage.nextRecordsUrl);
          if (poResultPage.records && poResultPage.records.length > 0) {
            allPORecords = allPORecords.concat(poResultPage.records);
            poPageCount++;
          } else {
            break;
          }
        }
        
        allPORecords.forEach(po => {
          const projectName = (po.Project__r?.Name || '').trim();
          const country = (po.Country__c || '').trim();
          const language = (po.Language__c || '').trim();
          
          // Priority: Contributor_Facing_Project_Name__c > Project_Objective_Name__c (if exists) > Constructed Name > Name
          // Use Contributor_Facing_Project_Name__c ONLY if it exists, is not empty, AND is different from project name
          // If Contributor_Facing_Project_Name__c equals project name, it's likely incorrect and we should construct the name
          let contributorFacingName = (po.Contributor_Facing_Project_Name__c || '').trim();
          let poName = null;
          
          // Check if Contributor_Facing_Project_Name__c is valid (exists, not empty, and different from project name)
          if (contributorFacingName && contributorFacingName !== projectName) {
            poName = contributorFacingName;
          } else {
            // Contributor_Facing_Project_Name__c is empty, null, or equals project name - try other options
            if (hasProjectObjectiveNameField && po.Project_Objective_Name__c) {
              const projectObjectiveName = (po.Project_Objective_Name__c || '').trim();
              if (projectObjectiveName && projectObjectiveName !== projectName) {
                poName = projectObjectiveName;
              }
            }
            
            // If still no name, try to construct it from Project Name + Country + Language
            if (!poName) {
              // Construct name like "Project Name: Language-Country" (e.g., "August 12 Test Project P-UAT 1: English-United States")
              if (projectName) {
                if (language && country) {
                  poName = `${projectName}: ${language}-${country}`;
                } else if (language) {
                  poName = `${projectName}: ${language}`;
                } else if (country) {
                  poName = `${projectName}: ${country}`;
                } else {
                  // Fallback to Name field, but only if it's different from project name
                  const nameField = (po.Name || '').trim();
                  poName = (nameField && nameField !== projectName) ? nameField : projectName;
                }
              } else {
                // Last resort: use Name field
                poName = (po.Name || '').trim() || 'Unknown Objective';
              }
            }
          }
          
          // Final validation: ensure we have a non-empty name
          if (!poName || poName.trim() === '') {
            poName = 'Unknown Objective';
          } else {
            poName = poName.trim(); // Ensure no leading/trailing whitespace
          }
          
          // Check for duplicate IDs (warn but don't prevent - should never happen but good to catch)
          if (projectObjectiveNameMap.has(po.Id)) {
            console.warn(`Download: Duplicate Project Objective ID ${po.Id} detected. Overwriting previous name "${projectObjectiveNameMap.get(po.Id)}" with "${poName}".`);
          }
          
          projectObjectiveNameMap.set(po.Id, poName);
          
          // Debug logging for first few records to verify we're getting correct names
          if (projectObjectiveNameMap.size <= 5) {
            console.log(`Download: Project Objective ID ${po.Id}: Name="${po.Name || 'N/A'}", Project_Objective_Name="${po.Project_Objective_Name__c || 'N/A'}", Contributor_Facing="${po.Contributor_Facing_Project_Name__c || 'N/A'}", Project="${projectName}", Country="${country}", Language="${language}", Using="${poName}"`);
          }
        });
        poBatchCount++;
        console.log(`Download: Fetched project objective names batch ${poBatchCount}: ${allPORecords.length} records, total mapped: ${projectObjectiveNameMap.size}`);
      } catch (error) {
        console.error(`Error querying project objectives for batch:`, error.message);
        // If query fails (e.g., field doesn't exist), try without Project_Objective_Name__c
        if (error.message.includes('Project_Objective_Name__c') && hasProjectObjectiveNameField) {
          console.warn('Download: Retrying query without Project_Objective_Name__c field');
          hasProjectObjectiveNameField = false;
          i -= PO_BATCH_SIZE; // Retry this batch
          continue;
        }
      }
    }
    console.log(`Download: Fetched names for ${projectObjectiveNameMap.size} out of ${projectObjectivesToProcess.length} project objectives`);
    
    // Log any missing project objectives
    const missingPOs = projectObjectivesToProcess.filter(poId => !projectObjectiveNameMap.has(poId));
    if (missingPOs.length > 0) {
      console.warn(`Download: Warning - ${missingPOs.length} project objectives could not be fetched by name. IDs: ${missingPOs.slice(0, 10).join(', ')}${missingPOs.length > 10 ? '...' : ''}`);
    }

    // Track which project objectives have contributor projects
    const projectObjectivesWithContributors = new Set();
    
    // Fetch all contributor projects for these project objectives
    // Use EXACT same logic and limits as count endpoint for consistency
    const allContributorProjects = [];
    const BATCH_SIZE = 200; // Same as count endpoint
    const MAX_BATCHES = 50; // Same as count endpoint
    const MAX_CONTRIBUTOR_PAGES_PER_BATCH = 20; // Same as count endpoint
    let batchCount = 0;

    for (let i = 0; i < projectObjectivesToProcess.length && batchCount < MAX_BATCHES; i += BATCH_SIZE) {
      const batch = projectObjectivesToProcess.slice(i, i + BATCH_SIZE);
      const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      
      // Query contributor projects - we don't need relationship fields since we use directly queried names
      const contributorQuery = `
        SELECT 
          Id,
          Name,
          ${projectObjectiveFieldName},
          Status__c
        FROM Contributor_Project__c
        WHERE ${projectObjectiveFieldName} IN (${idsString})
        ORDER BY Name ASC
      `;
      
      try {
        let contributorResult = await conn.query(contributorQuery);
        let allContributorRecords = [...(contributorResult.records || [])];
        let contributorResultPage = contributorResult;
        let pageCount = 0;
        
        // Process pages for this batch with same limits as count endpoint
        while (contributorResultPage.nextRecordsUrl && pageCount < MAX_CONTRIBUTOR_PAGES_PER_BATCH) {
          contributorResultPage = await conn.queryMore(contributorResultPage.nextRecordsUrl);
          if (contributorResultPage.records && contributorResultPage.records.length > 0) {
            allContributorRecords = allContributorRecords.concat(contributorResultPage.records);
            pageCount++;
          } else {
            break;
          }
        }
        
        if (contributorResultPage.nextRecordsUrl && pageCount >= MAX_CONTRIBUTOR_PAGES_PER_BATCH) {
          console.warn(`Download batch ${batchCount + 1}: Reached pagination limit (${MAX_CONTRIBUTOR_PAGES_PER_BATCH} pages). Some contributor projects may be missing for this batch.`);
        }
        
        // Map to format with only required columns: Contributor Project, Project Objective, Status
        const batchProjects = allContributorRecords.map(cp => {
          // ALWAYS use the directly queried project objective name from projectObjectiveNameMap
          // This ensures we get the correct Name field from Project_Objective__c, not from relationship queries
          // Relationship queries can sometimes return incorrect values (like project names instead of project objective names)
          const projectObjectiveId = cp[projectObjectiveFieldName];
          const projectObjectiveName = projectObjectiveNameMap.get(projectObjectiveId) || 'Unknown Objective';
          
          // Track that this project objective has contributor projects
          projectObjectivesWithContributors.add(projectObjectiveId);
          
          return {
            id: cp.Id,
            name: cp.Name || 'Unnamed Contributor Project',
            projectObjectiveId: projectObjectiveId,
            projectObjectiveName: projectObjectiveName,
            status: cp.Status__c || null
          };
        });
        
        allContributorProjects.push(...batchProjects);
        batchCount++;
        console.log(`Download batch ${batchCount} (${batch.length} project objectives): ${allContributorRecords.length} contributor projects, total: ${allContributorProjects.length}`);
      } catch (error) {
        console.error(`Error querying contributor projects for batch:`, error.message);
        // Continue with other batches - don't fail the entire request
      }
    }
    
    // Add rows for project objectives with 0 contributor projects
    const projectObjectivesWithoutContributors = projectObjectivesToProcess.filter(poId => !projectObjectivesWithContributors.has(poId));
    console.log(`Download: Found ${projectObjectivesWithoutContributors.length} project objectives with 0 contributor projects`);
    
    projectObjectivesWithoutContributors.forEach(poId => {
      const projectObjectiveName = projectObjectiveNameMap.get(poId) || 'Unknown Objective';
      allContributorProjects.push({
        id: null,
        name: '', // Empty contributor project name
        projectObjectiveId: poId,
        projectObjectiveName: projectObjectiveName,
        status: null
      });
    });
    
    const processedProjectObjectives = Math.min(batchCount * BATCH_SIZE, projectObjectivesToProcess.length);
    if (batchCount >= MAX_BATCHES && processedProjectObjectives < projectObjectivesToProcess.length) {
      console.warn(`Download: Reached batch limit (${MAX_BATCHES}). Processed ${processedProjectObjectives} project objectives out of ${projectObjectivesToProcess.length}. Some data may be missing.`);
    }

    console.log(`Download: Total rows (${allContributorProjects.length}): ${projectObjectivesWithContributors.size} project objectives with contributors, ${projectObjectivesWithoutContributors.length} with 0 contributors`);

    res.json({
      success: true,
      deliveryToolName: decodedDeliveryTool,
      contributorProjects: allContributorProjects,
      count: allContributorProjects.length,
      projectObjectivesCount: projectObjectivesToProcess.length,
      projectObjectivesWithContributors: projectObjectivesWithContributors.size,
      projectObjectivesWithoutContributors: projectObjectivesWithoutContributors.length
    });
  } catch (error) {
    console.error('Error fetching contributor projects for delivery tool:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contributor projects from Salesforce'
    });
  }
}));

// Get Project Objective Status picklist values
router.get('/project-objective-status-values', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject('Project_Objective__c').describe();
    
    const statusField = describeResult.fields.find(f => f.name === 'Status__c');
    let statusValues = [];
    
    if (statusField && statusField.picklistValues) {
      statusValues = statusField.picklistValues
        .filter(pv => pv.active !== false)
        .map(pv => pv.value)
        .filter(v => v && v !== null && v !== '' && v !== '--None--');
    }
    
    // If no picklist found, return default values as fallback
    if (statusValues.length === 0) {
      statusValues = ['Open', 'Paused', 'Hidden', 'Closed', 'Draft'];
    }
    
    res.json({
      success: true,
      statusValues: statusValues
    });
  } catch (error) {
    console.error('Error fetching Project Objective Status values:', error);
    // Return default values on error
    res.json({
      success: true,
      statusValues: ['Open', 'Paused', 'Hidden', 'Closed', 'Draft']
    });
  }
}));

// Get Analytics/Trend Data
router.get('/analytics', authenticate, asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Default to 30 days
    const deliveryToolName = req.query.deliveryTool; // Optional: specific tool
    
    let trends;
    if (deliveryToolName) {
      // Get trend for specific delivery tool
      const decodedToolName = decodeURIComponent(deliveryToolName);
      const trendData = getTrendData(decodedToolName, days);
      trends = {
        [decodedToolName]: trendData
      };
    } else {
      // Get trends for all delivery tools
      trends = getAllTrends(days);
    }
    
    res.json({
      success: true,
      trends: trends,
      days: days
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics data'
    });
  }
}));

// Download all workstreams or workstreams by delivery tool with all fields
router.get('/download-workstreams', authenticate, asyncHandler(async (req, res) => {
  try {
    const { deliveryToolName } = req.query;
    
    // Get filter parameters from query string (same as summary endpoint)
    const projectStatusFilter = req.query.projectStatus ? (Array.isArray(req.query.projectStatus) ? req.query.projectStatus : [req.query.projectStatus]) : null;
    const projectObjectiveStatusFilter = req.query.projectObjectiveStatus ? (Array.isArray(req.query.projectObjectiveStatus) ? req.query.projectObjectiveStatus : [req.query.projectObjectiveStatus]) : null;
    
    // Default: Only consider project objectives with status Open, Paused, or Hidden (same as summary)
    const defaultStatuses = ['Open', 'Paused', 'Hidden'];
    const statusFilter = projectObjectiveStatusFilter || defaultStatuses;
    
    const conn = await getSalesforceConnection(req.user.id);

    // Try to find the WorkStream object
    const possibleObjectNames = ['Project_Workstream__c', 'WorkStream__c', 'Work_Stream__c'];
    let workStreamObjectName = null;

    for (const objName of possibleObjectNames) {
      try {
        const describe = await conn.sobject(objName).describe();
        workStreamObjectName = objName;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!workStreamObjectName) {
      return res.status(400).json({
        success: false,
        error: 'WorkStream object not found in Salesforce.'
      });
    }

    // Get all fields from the WorkStream object
    const describe = await conn.sobject(workStreamObjectName).describe();
    
    // Fields to exclude
    const excludedFields = ['SystemModstamp', 'Project_Workstream_External_Id__c', 'LastViewedDate', 'LastReferencedDate', 'Id'];
    
    // Get all fields excluding base64, excluded fields, and relationship fields
    const allFields = describe.fields
      .filter(f => f.type !== 'base64' && !excludedFields.includes(f.name))
      .map(f => f.name)
      .filter(f => !f.includes('__r'))
      .sort();

    // Find relationship fields for Owner, Project Objective, and LastModifiedBy
    let ownerField = null;
    let ownerRelationshipName = null;
    let projectObjectiveField = null;
    let projectObjectiveRelationshipName = null;
    let lastModifiedByField = null;
    let lastModifiedByRelationshipName = null;
    
    describe.fields.forEach(f => {
      if (f.type === 'reference') {
        // Find Owner field (standard OwnerId field)
        if (f.name === 'OwnerId') {
          ownerField = f.name;
          ownerRelationshipName = f.relationshipName || 'Owner';
        }
        // Find Project Objective field
        if (f.name === 'Project_Objective__c' || (f.name.includes('Objective') && f.name.includes('__c'))) {
          projectObjectiveField = f.name;
          projectObjectiveRelationshipName = f.relationshipName || f.name.replace('__c', '__r');
        }
        // Find LastModifiedBy field (standard LastModifiedById field)
        if (f.name === 'LastModifiedById') {
          lastModifiedByField = f.name;
          lastModifiedByRelationshipName = f.relationshipName || 'LastModifiedBy';
        }
      }
    });

    // Check if Project_Objective_Name__c field exists on Project_Objective__c
    let hasProjectObjectiveNameField = false;
    if (projectObjectiveRelationshipName) {
      try {
        const projectObjectiveDescribe = await conn.sobject('Project_Objective__c').describe();
        hasProjectObjectiveNameField = projectObjectiveDescribe.fields.some(f => f.name === 'Project_Objective_Name__c');
        console.log(`Download Workstreams: Project_Objective_Name__c field exists: ${hasProjectObjectiveNameField}`);
      } catch (describeError) {
        console.warn('Download Workstreams: Could not describe Project_Objective__c, assuming Project_Objective_Name__c does not exist');
      }
    }

    // Build query with relationship fields
    const relationshipFields = [];
    if (ownerRelationshipName) {
      relationshipFields.push(`${ownerRelationshipName}.Name`);
    }
    if (projectObjectiveRelationshipName) {
      // Try to get Project Objective Name field
      relationshipFields.push(`${projectObjectiveRelationshipName}.Name`);
      // Also try Project_Objective_Name__c if it exists
      if (hasProjectObjectiveNameField) {
        relationshipFields.push(`${projectObjectiveRelationshipName}.Project_Objective_Name__c`);
      }
    }
    if (lastModifiedByRelationshipName) {
      relationshipFields.push(`${lastModifiedByRelationshipName}.Name`);
    }

    // Build query - filter by delivery tool and status filters (same as summary endpoint)
    let whereConditions = [];
    
    // Filter by delivery tool if provided
    if (deliveryToolName && deliveryToolName !== 'all') {
      const sanitizedTool = String(deliveryToolName).replace(/'/g, "''");
      whereConditions.push(`Delivery_Tool_Name__c = '${sanitizedTool}'`);
    }
    
    // Filter by Project Objective Status (default: Open, Paused, Hidden)
    if (statusFilter.length > 0) {
      const statusCondition = statusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ');
      whereConditions.push(`Project_Objective__r.Status__c IN (${statusCondition})`);
    }
    
    // Filter by Project Status if provided
    if (projectStatusFilter && projectStatusFilter.length > 0) {
      const projectStatusCondition = projectStatusFilter.map(s => `'${String(s).replace(/'/g, "''")}'`).join(', ');
      whereConditions.push(`Project_Objective__r.Project__r.Status__c IN (${projectStatusCondition})`);
    }
    
    // Ensure Project_Objective__c is not null (same as summary)
    whereConditions.push(`Project_Objective__c != null`);
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Include relationship fields in SELECT for filtering
    const relationshipFieldsForQuery = [];
    if (projectObjectiveRelationshipName) {
      relationshipFieldsForQuery.push(`${projectObjectiveRelationshipName}.Status__c`);
      if (projectStatusFilter && projectStatusFilter.length > 0) {
        relationshipFieldsForQuery.push(`${projectObjectiveRelationshipName}.Project__r.Status__c`);
      }
    }
    
    const fieldsString = allFields.join(', ') + 
      (relationshipFields.length > 0 ? ', ' + relationshipFields.join(', ') : '') +
      (relationshipFieldsForQuery.length > 0 ? ', ' + relationshipFieldsForQuery.join(', ') : '');
    
    let query = `SELECT ${fieldsString} FROM ${workStreamObjectName} ${whereClause} ORDER BY CreatedDate DESC LIMIT 10000`;

    console.log(`Downloading workstreams${deliveryToolName ? ` for tool: ${deliveryToolName}` : ' (all)'}`);
    console.log(`Status filter: ${statusFilter.join(', ')}`);
    console.log(`Project status filter: ${projectStatusFilter ? projectStatusFilter.join(', ') : 'none'}`);
    
    let result;
    let useRelationshipQuery = true;
    let allWorkstreams = [];
    
    try {
      // Try with relationship query first
      result = await conn.query(query);
      allWorkstreams = [...(result.records || [])];
    } catch (relationshipError) {
      console.warn('Relationship query failed, using simpler query:', relationshipError.message);
      useRelationshipQuery = false;
      
      // Fallback: query without relationship filters, then filter in memory
      const simpleWhereConditions = [];
      if (deliveryToolName && deliveryToolName !== 'all') {
        const sanitizedTool = String(deliveryToolName).replace(/'/g, "''");
        simpleWhereConditions.push(`Delivery_Tool_Name__c = '${sanitizedTool}'`);
      }
      simpleWhereConditions.push(`Project_Objective__c != null`);
      const simpleWhereClause = `WHERE ${simpleWhereConditions.join(' AND ')}`;
      
      query = `SELECT ${allFields.join(', ')}, Project_Objective__c FROM ${workStreamObjectName} ${simpleWhereClause} ORDER BY CreatedDate DESC LIMIT 10000`;
      result = await conn.query(query);
      allWorkstreams = [...(result.records || [])];
      
      // Filter in memory by querying project objectives separately
      if (allWorkstreams.length > 0) {
        const poIds = [...new Set(allWorkstreams.map(ws => ws.Project_Objective__c).filter(Boolean))];
        if (poIds.length > 0) {
          const BATCH_SIZE = 200;
          const filteredPOIds = new Set();
          
          for (let i = 0; i < poIds.length; i += BATCH_SIZE) {
            const batch = poIds.slice(i, i + BATCH_SIZE);
            const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
            const poQuery = `SELECT Id, Status__c, Project__r.Status__c FROM Project_Objective__c WHERE Id IN (${idsString})`;
            const poResult = await conn.query(poQuery);
            
            (poResult.records || []).forEach(po => {
              // Check status filter
              if (statusFilter.includes(po.Status__c || '')) {
                // Check project status filter if provided
                if (!projectStatusFilter || projectStatusFilter.length === 0 || projectStatusFilter.includes(po.Project__r?.Status__c || '')) {
                  filteredPOIds.add(po.Id);
                }
              }
            });
          }
          
          // Filter workstreams to only include those with matching project objectives
          allWorkstreams = allWorkstreams.filter(ws => filteredPOIds.has(ws.Project_Objective__c));
        }
      }
    }
    
    // Handle pagination
    let pageCount = 0;
    const MAX_PAGES = 50;
    while (result.nextRecordsUrl && pageCount < MAX_PAGES) {
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records && result.records.length > 0) {
        let newRecords = result.records;
        
        // If not using relationship query, filter new records
        if (!useRelationshipQuery && newRecords.length > 0) {
          const poIds = [...new Set(newRecords.map(ws => ws.Project_Objective__c).filter(Boolean))];
          if (poIds.length > 0) {
            const BATCH_SIZE = 200;
            const filteredPOIds = new Set();
            
            for (let i = 0; i < poIds.length; i += BATCH_SIZE) {
              const batch = poIds.slice(i, i + BATCH_SIZE);
              const idsString = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
              const poQuery = `SELECT Id, Status__c, Project__r.Status__c FROM Project_Objective__c WHERE Id IN (${idsString})`;
              const poResult = await conn.query(poQuery);
              
              (poResult.records || []).forEach(po => {
                if (statusFilter.includes(po.Status__c || '')) {
                  if (!projectStatusFilter || projectStatusFilter.length === 0 || projectStatusFilter.includes(po.Project__r?.Status__c || '')) {
                    filteredPOIds.add(po.Id);
                  }
                }
              });
            }
            
            newRecords = newRecords.filter(ws => filteredPOIds.has(ws.Project_Objective__c));
          }
        }
        
        allWorkstreams = allWorkstreams.concat(newRecords);
        pageCount++;
      } else {
        break;
      }
    }

    console.log(`Downloaded ${allWorkstreams.length} workstream records (after filtering)`);

    // Convert to plain objects with proper field mapping and ordering
    const workstreamsData = allWorkstreams.map(ws => {
      const plainObj = {};
      
      // Priority fields first (in order)
      if (ws.Delivery_Tool_Name__c !== undefined) plainObj['Delivery Tool Name'] = ws.Delivery_Tool_Name__c || null;
      if (ws.Name !== undefined) plainObj['Name'] = ws.Name || null;
      if (ws.Functionality__c !== undefined) plainObj['Functionality'] = ws.Functionality__c || null;
      
      // Owner Name (from relationship)
      if (ownerRelationshipName && ws[ownerRelationshipName]) {
        plainObj['Owner Name'] = ws[ownerRelationshipName].Name || null;
      } else if (ws.OwnerId) {
        plainObj['Owner Name'] = null; // Will be populated if relationship exists
      }
      
      // Project Objective Name (from relationship)
      if (projectObjectiveRelationshipName && ws[projectObjectiveRelationshipName]) {
        const poRel = ws[projectObjectiveRelationshipName];
        plainObj['Project Objective Name'] = poRel.Project_Objective_Name__c || poRel.Name || null;
      } else if (ws[projectObjectiveField]) {
        plainObj['Project Objective Name'] = null;
      }
      
      // LastModifiedBy Name (from relationship)
      if (lastModifiedByRelationshipName && ws[lastModifiedByRelationshipName]) {
        plainObj['LastModifiedBy'] = ws[lastModifiedByRelationshipName].Name || null;
      }
      
      // Add all other fields (excluding excluded fields and ID fields that we've replaced)
      const excludedFromOther = ['Delivery_Tool_Name__c', 'Name', 'Functionality__c', 'OwnerId', 'LastModifiedById', 
                                  projectObjectiveField, ...excludedFields];
      
      allFields.forEach(field => {
        if (!excludedFromOther.includes(field)) {
          // Use friendly field names
          const friendlyName = field.replace(/__c$/, '').replace(/_/g, ' ');
          plainObj[friendlyName] = ws[field] !== undefined ? ws[field] : null;
        }
      });
      
      return plainObj;
    });

    res.json({
      success: true,
      workstreams: workstreamsData,
      count: workstreamsData.length,
      deliveryToolName: deliveryToolName || 'all'
    });
  } catch (error) {
    console.error('Error downloading workstreams:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download workstreams from Salesforce'
    });
  }
}));

module.exports = router;

