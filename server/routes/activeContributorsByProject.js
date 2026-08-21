// Active Contributors by Project routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');

/**
 * Get Active Contributors by Project
 * GET /api/active-contributors-by-project
 * Returns: Projects with their Project Objectives and active contributor counts
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
    
    console.log('[Active Contributors by Project] Starting data fetch...');
    
    // Support pagination with offset and limit
    const LIMIT = parseInt(req.query.limit) || 1000; // Default to 1000 per page
    const OFFSET = parseInt(req.query.offset) || 0;
    
    // Get total count first (for pagination info) - only on first page for efficiency
    let totalCount = 0;
    if (OFFSET === 0) {
      try {
        const countQuery = `SELECT COUNT() FROM Project__c`;
        const countResult = await conn.query(countQuery);
        totalCount = countResult.totalSize || 0;
      } catch (error) {
        console.error('[Active Contributors by Project] Error getting total count:', error);
      }
    }
    
    // Query Projects with pagination
    // SOQL doesn't support OFFSET, so we fetch from the beginning and slice
    const fetchLimit = OFFSET + LIMIT;
    let projectQuery = `SELECT Id, Name FROM Project__c ORDER BY Name LIMIT ${fetchLimit}`;
    
    // Apply GPC-Filter
    const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
    projectQuery = applyGPCFilterToQuery(projectQuery, req, { accountField: 'Account__c', projectField: 'Id' });
    
    let projectResult = await conn.query(projectQuery);
    let allProjects = projectResult.records || [];
    
    // Handle pagination by slicing the results
    const projects = allProjects.slice(OFFSET);
    
    // Check if there are more records
    let hasMore = false;
    if (allProjects.length === fetchLimit) {
      hasMore = true;
    } else if (totalCount > 0) {
      hasMore = (OFFSET + projects.length) < totalCount;
    } else {
      hasMore = false;
    }
    
    console.log(`[Active Contributors by Project] Found ${projects.length} Projects (offset: ${OFFSET}, limit: ${LIMIT}, total: ${totalCount}, hasMore: ${hasMore})`);
    
    if (projects.length === 0) {
      return res.json({
        success: true,
        data: [],
        lastRefreshed: new Date().toISOString(),
        hasMore: false,
        total: totalCount || null,
        offset: OFFSET,
        limit: LIMIT
      });
    }
    
    const projectIds = projects.map(p => p.Id);
    
    // Find Project Objective field name on Contributor_Project__c
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
    
    // Find Project field name on Project_Objective__c
    const possibleProjectFields = [
      'Project__c',
      'Project__r'
    ];
    
    let projectField = null;
    for (const fieldName of possibleProjectFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Project_Objective__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        projectField = fieldName;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!projectField) {
      projectField = 'Project__c'; // Default
    }
    
    // Query Project Objectives for these projects - batch to avoid URI too long
    const PROJECT_BATCH_SIZE = 200; // Batch size for project IDs to avoid URI too long
    let projectObjectives = [];
    
    // Process projects in batches
    for (let i = 0; i < projectIds.length; i += PROJECT_BATCH_SIZE) {
      checkTimeout();
      
      const batch = projectIds.slice(i, i + PROJECT_BATCH_SIZE);
      const batchNumber = Math.floor(i / PROJECT_BATCH_SIZE) + 1;
      const projectIdsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      
      const projectObjectiveQuery = `SELECT Id, Name, ${projectField} FROM Project_Objective__c WHERE ${projectField} IN (${projectIdsString}) ORDER BY ${projectField}, Name`;
      
      try {
        console.log(`[Active Contributors by Project] Querying Project Objectives for batch ${batchNumber} (${batch.length} projects)`);
        let projectObjectiveResult = await conn.query(projectObjectiveQuery);
        let batchProjectObjectives = projectObjectiveResult.records || [];
        
        // Handle pagination for this batch
        let pageCount = 0;
        const MAX_PAGES_PER_BATCH = 5;
        while (projectObjectiveResult.nextRecordsUrl && pageCount < MAX_PAGES_PER_BATCH) {
          checkTimeout();
          projectObjectiveResult = await conn.queryMore(projectObjectiveResult.nextRecordsUrl);
          if (projectObjectiveResult.records && projectObjectiveResult.records.length > 0) {
            batchProjectObjectives.push(...projectObjectiveResult.records);
            pageCount++;
          } else {
            break;
          }
        }
        
        projectObjectives.push(...batchProjectObjectives);
        console.log(`[Active Contributors by Project] Batch ${batchNumber} completed: ${batchProjectObjectives.length} Project Objectives`);
      } catch (error) {
        console.error(`[Active Contributors by Project] Error querying batch ${batchNumber}:`, error.message);
        // Continue with next batch even if this one fails
        continue;
      }
    }
    
    console.log(`[Active Contributors by Project] Found ${projectObjectives.length} Project Objectives total`);
    
    // Group Project Objectives by Project
    const projectObjectivesByProject = new Map();
    projectObjectives.forEach(po => {
      const projectId = po[projectField];
      if (projectId) {
        if (!projectObjectivesByProject.has(projectId)) {
          projectObjectivesByProject.set(projectId, []);
        }
        projectObjectivesByProject.get(projectId).push({
          id: po.Id,
          name: po.Name
        });
      }
    });
    
    // Query active Contributor Projects for these Project Objectives
    const projectObjectiveIds = projectObjectives.map(po => po.Id);
    
    if (projectObjectiveIds.length === 0) {
      // No Project Objectives, return empty structure
      const result = projects.map(project => ({
        projectId: project.Id,
        projectName: project.Name,
        projectObjectives: []
      }));
      
      return res.json({
        success: true,
        data: result,
        lastRefreshed: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        totalProcessed: result.length,
        limit: LIMIT,
        offset: OFFSET,
        hasMore: hasMore,
        total: totalCount || null
      });
    }
    
    // Process in batches to avoid URI too long errors
    const BATCH_SIZE = 100; // Reduced batch size to prevent URI too long
    const contributorCounts = new Map(); // Map: projectObjectiveId -> count
    const totalBatches = Math.ceil(projectObjectiveIds.length / BATCH_SIZE);
    const MAX_BATCHES = 20;
    
    console.log(`[Active Contributors by Project] Processing ${projectObjectiveIds.length} Project Objectives in ${Math.min(totalBatches, MAX_BATCHES)} batches`);
    
    for (let i = 0; i < projectObjectiveIds.length && i < (BATCH_SIZE * MAX_BATCHES); i += BATCH_SIZE) {
      checkTimeout();
      
      const batch = projectObjectiveIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      
      const countQuery = `
        SELECT 
          ${projectObjectiveField} ProjectObjectiveId,
          COUNT(Id) RecordCount
        FROM Contributor_Project__c
        WHERE ${projectObjectiveField} IN (${idsString})
          AND Status__c = 'Active'
        GROUP BY ${projectObjectiveField}
        LIMIT 10000
      `;
      
      try {
        console.log(`[Active Contributors by Project] Processing batch ${batchNumber}/${Math.min(totalBatches, MAX_BATCHES)}`);
        const countResult = await conn.query(countQuery);
        if (countResult.records && countResult.records.length > 0) {
          countResult.records.forEach(record => {
            const objectiveId = record.ProjectObjectiveId;
            const count = record.RecordCount || 0;
            contributorCounts.set(objectiveId, count);
          });
        }
      } catch (error) {
        console.error(`[Active Contributors by Project] Error querying batch ${batchNumber}:`, error.message);
        continue;
      }
    }
    
    // Build result structure
    const result = projects.map(project => {
      const projectId = project.Id;
      const projectObjectivesForProject = projectObjectivesByProject.get(projectId) || [];
      
      return {
        projectId: projectId,
        projectName: project.Name,
        projectObjectives: projectObjectivesForProject.map(po => ({
          id: po.id,
          name: po.name,
          activeContributorCount: contributorCounts.get(po.id) || 0
        }))
      };
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Active Contributors by Project] Completed in ${executionTime}ms`);
    
    res.json({
      success: true,
      data: result,
      lastRefreshed: new Date().toISOString(),
      executionTime: executionTime,
      totalProcessed: result.length,
      limit: LIMIT,
      offset: OFFSET,
      hasMore: hasMore,
      total: totalCount || null
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Active Contributors by Project] Error after ${executionTime}ms:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Active Contributors by Project data',
      executionTime: executionTime
    });
  }
}));

/**
 * Get Contributor Names for a Project Objective
 * GET /api/active-contributors-by-project/contributors/:projectObjectiveId
 */
router.get('/contributors/:projectObjectiveId', authenticate, asyncHandler(async (req, res) => {
  try {
    const { projectObjectiveId } = req.params;
    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Find Project Objective field name
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
      projectObjectiveField = 'Project_Objective__c'; // Default
    }
    
    // Find Contributor field name (Contact__c or Contributor__c)
    const possibleContributorFields = [
      'Contact__c',
      'Contributor__c'
    ];
    
    let contributorField = null;
    let contributorRelationshipName = null;
    
    for (const fieldName of possibleContributorFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        contributorField = fieldName;
        // Determine relationship name
        if (fieldName === 'Contact__c') {
          contributorRelationshipName = 'Contact';
        } else if (fieldName === 'Contributor__c') {
          contributorRelationshipName = 'Contributor';
        }
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!contributorField) {
      // Try to discover the field
      try {
        const describeResult = await conn.sobject('Contributor_Project__c').describe();
        const field = describeResult.fields.find(f => 
          (f.type === 'reference' && (f.name.includes('Contributor') || f.name.includes('Contact'))) ||
          f.name === 'Contributor__c' || f.name === 'Contact__c'
        );
        if (field) {
          contributorField = field.name;
          contributorRelationshipName = field.relationshipName || (field.name === 'Contact__c' ? 'Contact' : 'Contributor');
        }
      } catch (error) {
        console.error('Error describing Contributor_Project__c:', error);
      }
    }
    
    if (!contributorField) {
      return res.status(500).json({
        success: false,
        error: 'Could not determine Contributor field name on Contributor_Project__c'
      });
    }
    
    // Build query to get contributor details from Contact object
    const sanitizedId = String(projectObjectiveId).replace(/'/g, "''");
    
    // First, get Contributor Project IDs - fetch all records with pagination
    const cpQuery = `SELECT ${contributorField} FROM Contributor_Project__c 
                     WHERE ${projectObjectiveField} = '${sanitizedId}'
                       AND Status__c = 'Active'
                       AND ${contributorField} != null`;
    
    const cpResult = await conn.query(cpQuery);
    let contributorProjectRecords = cpResult.records || [];
    
    // Handle pagination for Contributor Projects - fetch all pages
    let pageCount = 0;
    const MAX_PAGES = 1000; // Increased limit to fetch all records
    let cpResultPage = cpResult;
    while (cpResultPage.nextRecordsUrl && pageCount < MAX_PAGES) {
      cpResultPage = await conn.queryMore(cpResultPage.nextRecordsUrl);
      if (cpResultPage.records && cpResultPage.records.length > 0) {
        contributorProjectRecords.push(...cpResultPage.records);
        pageCount++;
      } else {
        break;
      }
    }
    
    console.log(`[Active Contributors by Project] Fetched ${contributorProjectRecords.length} Contributor Project records (${pageCount} pages)`);
    
    // Extract unique contributor IDs
    const contributorIds = [...new Set(contributorProjectRecords
      .map(record => record[contributorField])
      .filter(id => id !== null && id !== undefined)
    )];
    
    if (contributorIds.length === 0) {
      return res.json({
        success: true,
        contributors: [],
        count: 0
      });
    }
    
    // Query Contact details in batches
    const CONTACT_BATCH_SIZE = 200;
    const contributors = [];
    
    for (let i = 0; i < contributorIds.length; i += CONTACT_BATCH_SIZE) {
      const batch = contributorIds.slice(i, i + CONTACT_BATCH_SIZE);
      const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      
      // Try to discover country and language fields dynamically
      let countryField = null;
      let languageField = null;
      
      try {
        const describeResult = await conn.sobject('Contact').describe();
        const fields = describeResult.fields;
        
        // Find country field
        const countryFieldOptions = [
          'Currently_Residing_Country__c',
          'MailingCountry',
          'Country__c',
          'Country'
        ];
        for (const fieldName of countryFieldOptions) {
          const field = fields.find(f => f.name === fieldName);
          if (field) {
            countryField = fieldName;
            break;
          }
        }
        
        // Find language field
        const languageFieldOptions = [
          'Primary_Language_Spoken__c',
          'Language__c',
          'Primary_Language__c',
          'Language'
        ];
        for (const fieldName of languageFieldOptions) {
          const field = fields.find(f => f.name === fieldName);
          if (field) {
            languageField = fieldName;
            break;
          }
        }
      } catch (describeError) {
        console.error('[Active Contributors by Project] Error describing Contact object:', describeError);
        // Use defaults
        countryField = 'Currently_Residing_Country__c';
        languageField = 'Primary_Language_Spoken__c';
      }
      
      // Build query with discovered fields
      const selectFields = ['Id', 'Name', 'Email'];
      if (countryField) selectFields.push(countryField);
      if (languageField) selectFields.push(languageField);
      
      const contactQuery = `SELECT ${selectFields.join(', ')} FROM Contact WHERE Id IN (${idsString})`;
      
      try {
        let contactResult = await conn.query(contactQuery);
        let contactRecords = contactResult.records || [];
        
        // Handle pagination for Contact query (in case there are more than 2000 records)
        let contactPageCount = 0;
        const MAX_CONTACT_PAGES = 100; // Allow up to 100 pages per batch
        while (contactResult.nextRecordsUrl && contactPageCount < MAX_CONTACT_PAGES) {
          contactResult = await conn.queryMore(contactResult.nextRecordsUrl);
          if (contactResult.records && contactResult.records.length > 0) {
            contactRecords.push(...contactResult.records);
            contactPageCount++;
          } else {
            break;
          }
        }
        
        if (contactRecords.length > 0) {
          contactRecords.forEach(contact => {
            contributors.push({
              id: contact.Id,
              name: contact.Name || '',
              email: contact.Email || '',
              country: (countryField && contact[countryField]) ? contact[countryField] : '',
              language: (languageField && contact[languageField]) ? contact[languageField] : ''
            });
          });
        }
      } catch (error) {
        console.error(`[Active Contributors by Project] Error querying contacts batch:`, error.message);
        // Try with just basic fields if the query fails
        try {
          const basicQuery = `SELECT Id, Name, Email FROM Contact WHERE Id IN (${idsString})`;
          let basicResult = await conn.query(basicQuery);
          let basicRecords = basicResult.records || [];
          
          // Handle pagination for basic Contact query
          let basicPageCount = 0;
          const MAX_BASIC_PAGES = 100;
          while (basicResult.nextRecordsUrl && basicPageCount < MAX_BASIC_PAGES) {
            basicResult = await conn.queryMore(basicResult.nextRecordsUrl);
            if (basicResult.records && basicResult.records.length > 0) {
              basicRecords.push(...basicResult.records);
              basicPageCount++;
            } else {
              break;
            }
          }
          
          if (basicRecords.length > 0) {
            basicRecords.forEach(contact => {
              contributors.push({
                id: contact.Id,
                name: contact.Name || '',
                email: contact.Email || '',
                country: '',
                language: ''
              });
            });
          }
        } catch (basicError) {
          console.error(`[Active Contributors by Project] Error querying basic contact fields:`, basicError.message);
        }
      }
    }
    
    // Sort by name
    contributors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    res.json({
      success: true,
      contributors: contributors,
      count: contributors.length
    });
  } catch (error) {
    console.error('[Active Contributors by Project] Error fetching contributor names:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contributor names'
    });
  }
}));

module.exports = router;

