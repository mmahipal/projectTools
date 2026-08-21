// Active Project Objectives by Qualification Step routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm } = require('../utils/security');

/**
 * Get Active Project Objectives by Qualification Step
 * GET /api/active-project-objectives-by-qual-step
 * Returns: Qualification Steps with their Project Objectives (non-closed) counts, Status, and Passing Percentage Score
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
    
    console.log('[Active Contributors by Qual Step] Starting data fetch...');
    
    // Support pagination with offset and limit
    const LIMIT = parseInt(req.query.limit) || 1000; // Default to 1000 per page
    const OFFSET = parseInt(req.query.offset) || 0;
    const searchTerm = req.query.search || ''; // Search term for qualification step or project objective
    
    // Find Qualification Step object name - prioritize Qualification_Step__c (not Project_Qualification_Step__c)
    let qualStepObjectName = null;
    
    // First try Qualification_Step__c
    try {
      await conn.sobject('Qualification_Step__c').describe();
      qualStepObjectName = 'Qualification_Step__c';
      console.log('[Active Contributors by Qual Step] Using Qualification_Step__c object');
    } catch (error) {
      // Fallback to Project_Qualification_Step__c if Qualification_Step__c doesn't exist
      try {
        await conn.sobject('Project_Qualification_Step__c').describe();
        qualStepObjectName = 'Project_Qualification_Step__c';
        console.log('[Active Contributors by Qual Step] Using Project_Qualification_Step__c object (fallback)');
      } catch (fallbackError) {
        console.error('[Active Contributors by Qual Step] Neither Qualification_Step__c nor Project_Qualification_Step__c found');
      }
    }
    
    if (!qualStepObjectName) {
      return res.status(500).json({
        success: false,
        error: 'Could not determine Qualification Step object name'
      });
    }
    
    // Get total count first (for pagination info) - only on first page for efficiency
    let totalCount = 0;
    if (OFFSET === 0) {
      try {
        let countQuery = `SELECT COUNT() FROM ${qualStepObjectName}`;
        if (searchTerm && searchTerm.trim()) {
          let searchTermValue = searchTerm.trim();
          // Check if search term is wrapped in double quotes for exact match
          const isExactMatch = searchTermValue.startsWith('"') && searchTermValue.endsWith('"');
          if (isExactMatch) {
            searchTermValue = searchTermValue.slice(1, -1).trim(); // Remove quotes
          }
          const sanitizedSearch = validateAndSanitizeSearchTerm(searchTermValue);
          if (sanitizedSearch) {
            const matchPattern = isExactMatch ? `= '${sanitizedSearch}'` : `LIKE '%${sanitizedSearch}%'`;
            countQuery += ` WHERE Name ${matchPattern}`;
          }
        }
        const countResult = await conn.query(countQuery);
        totalCount = countResult.totalSize || 0;
      } catch (error) {
        console.error('[Active Contributors by Qual Step] Error getting total count:', error);
      }
    }
    
    // Query Qualification Steps with pagination and search
    // Include Status and Passing_Percentage_Score__c fields
    const fetchLimit = OFFSET + LIMIT;
    let qualStepQuery = `SELECT Id, Name, Status__c, Passing_Percentage_Score__c FROM ${qualStepObjectName}`;
    
        if (searchTerm && searchTerm.trim()) {
          let sanitizedSearch = searchTerm.trim();
          // Check if search term is wrapped in double quotes for exact match
          const isExactMatch = sanitizedSearch.startsWith('"') && sanitizedSearch.endsWith('"');
          if (isExactMatch) {
            sanitizedSearch = sanitizedSearch.slice(1, -1).trim(); // Remove quotes
          }
          sanitizedSearch = sanitizedSearch.replace(/'/g, "''");
          const matchPattern = isExactMatch ? `= '${sanitizedSearch}'` : `LIKE '%${sanitizedSearch}%'`;
          qualStepQuery += ` WHERE Name ${matchPattern}`;
        }
    
    qualStepQuery += ` ORDER BY Name LIMIT ${fetchLimit}`;
    
    // Apply GPC-Filter (Note: Qualification Steps may not have direct account/project fields, 
    // but we'll apply it to filter based on related Project Objectives)
    // This is a complex relationship, so we'll skip GPC filtering for now on this endpoint
    // as it requires joining through Project Objectives which may not be straightforward
    // TODO: Implement GPC filtering for Qualification Steps if needed
    
    let qualStepResult = await conn.query(qualStepQuery);
    let allQualSteps = qualStepResult.records || [];
    
    // Handle pagination by slicing the results
    const qualSteps = allQualSteps.slice(OFFSET);
    
    // Check if there are more records
    let hasMore = false;
    if (allQualSteps.length === fetchLimit) {
      hasMore = true;
    } else if (totalCount > 0) {
      hasMore = (OFFSET + qualSteps.length) < totalCount;
    } else {
      hasMore = false;
    }
    
    console.log(`[Active Contributors by Qual Step] Found ${qualSteps.length} Qualification Steps (offset: ${OFFSET}, limit: ${LIMIT}, total: ${totalCount}, hasMore: ${hasMore})`);
    
    // Debug: Log sample qualification step
    if (qualSteps.length > 0) {
      console.log(`[Active Contributors by Qual Step] Sample Qualification Step:`, {
        Id: qualSteps[0].Id,
        Name: qualSteps[0].Name,
        allFields: Object.keys(qualSteps[0])
      });
    }
    
    if (qualSteps.length === 0) {
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
    
    const qualStepIds = qualSteps.map(qs => qs.Id);
    
    // Find Project Objective field name on Qualification Step
    // Qualification Steps might have Project_Objective__c or be linked through Project_Objective__c
    const possibleProjectObjectiveFields = [
      'Project_Objective__c',
      'ProjectObjective__c',
      'Objective__c'
    ];
    
    let projectObjectiveField = null;
    try {
      const describeResult = await conn.sobject(qualStepObjectName).describe();
      console.log(`[Active Contributors by Qual Step] Qualification Step object fields (first 20):`, 
        describeResult.fields.slice(0, 20).map(f => f.name)
      );
      
      for (const fieldName of possibleProjectObjectiveFields) {
        const field = describeResult.fields.find(f => f.name === fieldName);
        if (field) {
          projectObjectiveField = fieldName;
          console.log(`[Active Contributors by Qual Step] Found Project Objective field on Qualification Step: ${fieldName}`);
          break;
        }
      }
      
      if (!projectObjectiveField) {
        // Try to find any reference field that might point to Project Objective
        const referenceFields = describeResult.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Objective') || f.name.includes('Project'))
        );
        if (referenceFields.length > 0) {
          console.log(`[Active Contributors by Qual Step] Found potential Project Objective reference fields:`, 
            referenceFields.map(f => f.name)
          );
        }
      }
    } catch (error) {
      console.error('Error describing Qualification Step object:', error);
    }
    
    // If no direct field, we'll query Project Objectives that reference this Qualification Step
    // First, try to find the relationship from Project_Objective__c to Qualification_Step__c
    let qualStepFieldOnProjectObjective = null;
    const possibleQualStepFields = [
      'Qualification_Step__c',
      'Project_Qualification_Step__c',
      'QualificationStep__c'
    ];
    
    try {
      const poDescribeResult = await conn.sobject('Project_Objective__c').describe();
      console.log(`[Active Contributors by Qual Step] Project_Objective__c object fields (first 30):`, 
        poDescribeResult.fields.slice(0, 30).map(f => `${f.name} (${f.type})`)
      );
      
      for (const fieldName of possibleQualStepFields) {
        const field = poDescribeResult.fields.find(f => f.name === fieldName);
        if (field) {
          qualStepFieldOnProjectObjective = fieldName;
          console.log(`[Active Contributors by Qual Step] Found relationship field on Project_Objective__c: ${fieldName}`);
          break;
        }
      }
      
      if (!qualStepFieldOnProjectObjective) {
        // Try to find any reference field that might point to Qualification Step
        const referenceFields = poDescribeResult.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Qualification') || f.name.includes('Qual') || f.name.includes('Step'))
        );
        if (referenceFields.length > 0) {
          console.log(`[Active Contributors by Qual Step] Found potential Qualification Step reference fields on Project_Objective__c:`, 
            referenceFields.map(f => f.name)
          );
          // Try the first one
          qualStepFieldOnProjectObjective = referenceFields[0].name;
          console.log(`[Active Contributors by Qual Step] Trying field: ${qualStepFieldOnProjectObjective}`);
        } else {
          console.warn('[Active Contributors by Qual Step] No Qualification Step field found on Project_Objective__c');
        }
      }
    } catch (error) {
      console.error('Error describing Project_Objective__c object:', error);
    }
    
    // Check if relationship exists through Project_Qualification_Step__c (junction object)
    // This is the primary relationship: Project_Qualification_Step__c links Qualification Steps to Project Objectives
    let projectQualStepObjectExists = false;
    let projectQualStepQualStepField = null;
    let projectQualStepProjectObjectiveField = null;
    
    try {
      const projectQualStepDescribe = await conn.sobject('Project_Qualification_Step__c').describe();
      projectQualStepObjectExists = true;
      console.log(`[Active Contributors by Qual Step] Found Project_Qualification_Step__c object with ${projectQualStepDescribe.fields.length} fields`);
      
      // Find Qualification Step field on Project_Qualification_Step__c
      // Based on the screenshot, this should be a lookup to Qualification_Step__c
      const possibleQualStepFields = [
        'Qualification_Step__c',
        'Project_Qualification_Step__c',
        'QualificationStep__c'
      ];
      
      for (const fieldName of possibleQualStepFields) {
        const field = projectQualStepDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectQualStepQualStepField = fieldName;
          console.log(`[Active Contributors by Qual Step] Found Qualification Step field on Project_Qualification_Step__c: ${fieldName} (type: ${field.type}, referenceTo: ${field.referenceTo ? field.referenceTo.join(',') : 'N/A'})`);
          break;
        }
      }
      
      // If not found, try to find any reference field that might point to Qualification Step
      if (!projectQualStepQualStepField) {
        const referenceFields = projectQualStepDescribe.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Qualification') || f.name.includes('Qual') || f.name.includes('Step'))
        );
        if (referenceFields.length > 0) {
          projectQualStepQualStepField = referenceFields[0].name;
          console.log(`[Active Contributors by Qual Step] Found potential Qualification Step reference field on Project_Qualification_Step__c: ${projectQualStepQualStepField}`);
        }
      }
      
      // Find Project Objective field on Project_Qualification_Step__c
      // Based on the screenshot, this should be a lookup to Project_Objective__c
      const possibleProjectObjectiveFields = [
        'Project_Objective__c',
        'ProjectObjective__c',
        'Objective__c'
      ];
      
      for (const fieldName of possibleProjectObjectiveFields) {
        const field = projectQualStepDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectQualStepProjectObjectiveField = fieldName;
          console.log(`[Active Contributors by Qual Step] Found Project Objective field on Project_Qualification_Step__c: ${fieldName} (type: ${field.type}, referenceTo: ${field.referenceTo ? field.referenceTo.join(',') : 'N/A'})`);
          break;
        }
      }
      
      // If not found, try to find any reference field that might point to Project Objective
      if (!projectQualStepProjectObjectiveField) {
        const referenceFields = projectQualStepDescribe.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Objective') || f.name.includes('Project'))
        );
        if (referenceFields.length > 0) {
          projectQualStepProjectObjectiveField = referenceFields[0].name;
          console.log(`[Active Contributors by Qual Step] Found potential Project Objective reference field on Project_Qualification_Step__c: ${projectQualStepProjectObjectiveField}`);
        }
      }
      
      if (projectQualStepQualStepField && projectQualStepProjectObjectiveField) {
        console.log(`[Active Contributors by Qual Step] Using Project_Qualification_Step__c junction: ${projectQualStepQualStepField} -> ${projectQualStepProjectObjectiveField}`);
      }
    } catch (error) {
      console.log(`[Active Contributors by Qual Step] Project_Qualification_Step__c object not found or error: ${error.message}`);
    }
    
    // Also check if relationship exists through Project_Page__c (Project Pages link Qualification Steps to Project Objectives)
    let projectPageQualStepField = null;
    let projectPageProjectObjectiveField = null;
    try {
      const projectPageDescribe = await conn.sobject('Project_Page__c').describe();
      console.log(`[Active Contributors by Qual Step] Project_Page__c has ${projectPageDescribe.fields.length} fields`);
      
      const possibleQualStepFieldsOnPage = [
        'Project_Qualification_Step__c', 
        'Qualification_Step__c', 
        'QualificationStep__c',
        'Qualification_Step__r',
        'Project_Qualification_Step__r'
      ];
      const possibleProjectObjectiveFieldsOnPage = [
        'Project_Objective__c', 
        'ProjectObjective__c',
        'Project_Objective__r',
        'ProjectObjective__r'
      ];
      
      // First try exact matches
      for (const fieldName of possibleQualStepFieldsOnPage) {
        const field = projectPageDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectPageQualStepField = fieldName;
          console.log(`[Active Contributors by Qual Step] Found Qualification Step field on Project_Page__c: ${fieldName} (type: ${field.type})`);
          break;
        }
      }
      
      // If not found, try to find any reference field that might point to Qualification Step
      if (!projectPageQualStepField) {
        const referenceFields = projectPageDescribe.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Qualification') || f.name.includes('Qual') || f.name.includes('Step'))
        );
        if (referenceFields.length > 0) {
          projectPageQualStepField = referenceFields[0].name;
          console.log(`[Active Contributors by Qual Step] Found potential Qualification Step reference field: ${projectPageQualStepField}`);
        }
      }
      
      // Find Project Objective field
      for (const fieldName of possibleProjectObjectiveFieldsOnPage) {
        const field = projectPageDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectPageProjectObjectiveField = fieldName;
          console.log(`[Active Contributors by Qual Step] Found Project Objective field on Project_Page__c: ${fieldName} (type: ${field.type})`);
          break;
        }
      }
      
      // If not found, try to find any reference field that might point to Project Objective
      if (!projectPageProjectObjectiveField) {
        const referenceFields = projectPageDescribe.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Objective') || f.name.includes('Project'))
        );
        if (referenceFields.length > 0) {
          projectPageProjectObjectiveField = referenceFields[0].name;
          console.log(`[Active Contributors by Qual Step] Found potential Project Objective reference field: ${projectPageProjectObjectiveField}`);
        }
      }
      
      if (projectPageQualStepField && projectPageProjectObjectiveField) {
        console.log(`[Active Contributors by Qual Step] Found relationship through Project_Page__c: ${projectPageQualStepField} -> ${projectPageProjectObjectiveField}`);
        
        // Test query to see if Project_Page__c records exist
        try {
          const testQuery = `SELECT COUNT() FROM Project_Page__c WHERE ${projectPageQualStepField} != null AND ${projectPageProjectObjectiveField} != null`;
          const testResult = await conn.query(testQuery);
          console.log(`[Active Contributors by Qual Step] Project_Page__c records with both fields: ${testResult.totalSize || 0}`);
        } catch (testError) {
          console.error(`[Active Contributors by Qual Step] Error testing Project_Page__c query:`, testError.message);
        }
      } else {
        console.warn(`[Active Contributors by Qual Step] Project_Page__c relationship not found. QualStepField: ${projectPageQualStepField}, ProjectObjectiveField: ${projectPageProjectObjectiveField}`);
      }
    } catch (error) {
      console.error('Error describing Project_Page__c object:', error);
    }
    
    // Initialize Project Objectives by Qualification Step map early
    const projectObjectivesByQualStep = new Map();
    qualSteps.forEach(qs => {
      projectObjectivesByQualStep.set(qs.Id, []);
    });
    
    // Query Project Objectives for these Qualification Steps
    // Priority: 1) Project_Qualification_Step__c (junction), 2) Direct/Reverse, 3) Project_Page__c
    let projectObjectives = [];
    let useProjectQualStepMapping = false; // Flag to indicate we're using Project_Qualification_Step__c mapping
    let useProjectPageMapping = false; // Flag to indicate we're using Project_Page__c mapping
    
    // PRIORITY 1: Use Project_Qualification_Step__c junction object (this is the primary relationship)
    if (projectQualStepObjectExists && projectQualStepQualStepField && projectQualStepProjectObjectiveField) {
      // Relationship through Project_Qualification_Step__c: This is the primary junction object
      console.log(`[Active Contributors by Qual Step] Using Project_Qualification_Step__c junction: ${projectQualStepQualStepField} -> ${projectQualStepProjectObjectiveField}`);
      useProjectQualStepMapping = true;
      
      // Query Project_Qualification_Step__c records for these Qualification Steps in batches
      const QUAL_STEP_BATCH_SIZE = 200;
      const allProjectQualStepRecords = [];
      
      for (let i = 0; i < qualStepIds.length; i += QUAL_STEP_BATCH_SIZE) {
        checkTimeout();
        const batch = qualStepIds.slice(i, i + QUAL_STEP_BATCH_SIZE);
        const batchNumber = Math.floor(i / QUAL_STEP_BATCH_SIZE) + 1;
        const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
        
        const projectQualStepQuery = `SELECT ${projectQualStepQualStepField}, ${projectQualStepProjectObjectiveField} FROM Project_Qualification_Step__c WHERE ${projectQualStepQualStepField} IN (${idsString}) AND ${projectQualStepProjectObjectiveField} != null`;
        
        try {
          console.log(`[Active Contributors by Qual Step] Querying Project_Qualification_Step__c for batch ${batchNumber} (${batch.length} qualification steps)`);
          let projectQualStepResult = await conn.query(projectQualStepQuery);
          let batchProjectQualStepRecords = projectQualStepResult.records || [];
          
          // Handle pagination for Project_Qualification_Step__c
          let pageCount = 0;
          const MAX_PAGES_PER_BATCH = 10;
          while (projectQualStepResult.nextRecordsUrl && pageCount < MAX_PAGES_PER_BATCH) {
            checkTimeout();
            projectQualStepResult = await conn.queryMore(projectQualStepResult.nextRecordsUrl);
            if (projectQualStepResult.records && projectQualStepResult.records.length > 0) {
              batchProjectQualStepRecords.push(...projectQualStepResult.records);
              pageCount++;
            } else {
              break;
            }
          }
          
          allProjectQualStepRecords.push(...batchProjectQualStepRecords);
          console.log(`[Active Contributors by Qual Step] Batch ${batchNumber}: Found ${batchProjectQualStepRecords.length} Project_Qualification_Step__c records`);
        } catch (error) {
          console.error(`[Active Contributors by Qual Step] Error querying Project_Qualification_Step__c batch ${batchNumber}:`, error.message);
          continue;
        }
      }
      
      console.log(`[Active Contributors by Qual Step] Total Project_Qualification_Step__c records found: ${allProjectQualStepRecords.length}`);
      
      // Extract unique Project Objective IDs from all Project_Qualification_Step__c records
      const projectObjectiveIdsFromQualSteps = [...new Set(allProjectQualStepRecords
        .map(pqs => pqs[projectQualStepProjectObjectiveField])
        .filter(id => id !== null && id !== undefined)
      )];
      
      console.log(`[Active Contributors by Qual Step] Unique Project Objective IDs from Project_Qualification_Step__c: ${projectObjectiveIdsFromQualSteps.length}`);
      
      if (projectObjectiveIdsFromQualSteps.length > 0) {
        // Query Project Objectives in batches (include Project__c for project count)
        const PO_BATCH_SIZE = 200;
        for (let i = 0; i < projectObjectiveIdsFromQualSteps.length; i += PO_BATCH_SIZE) {
          checkTimeout();
          const batch = projectObjectiveIdsFromQualSteps.slice(i, i + PO_BATCH_SIZE);
          const poIdsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
          let poQuery = `SELECT Id, Name, Project__c FROM Project_Objective__c WHERE Id IN (${poIdsString})`;
          
          if (searchTerm && searchTerm.trim()) {
            let sanitizedSearch = searchTerm.trim();
            // Check if search term is wrapped in double quotes for exact match
            const isExactMatch = sanitizedSearch.startsWith('"') && sanitizedSearch.endsWith('"');
            if (isExactMatch) {
              sanitizedSearch = sanitizedSearch.slice(1, -1).trim(); // Remove quotes
            }
            sanitizedSearch = sanitizedSearch.replace(/'/g, "''");
            const matchPattern = isExactMatch ? `= '${sanitizedSearch}'` : `LIKE '%${sanitizedSearch}%'`;
            poQuery += ` AND Name ${matchPattern}`;
          }
          
          poQuery += ` ORDER BY Name`;
          
          try {
            let poResult = await conn.query(poQuery);
            let batchProjectObjectives = poResult.records || [];
            
            // Handle pagination for Project Objectives
            let poPageCount = 0;
            const MAX_PO_PAGES = 5;
            while (poResult.nextRecordsUrl && poPageCount < MAX_PO_PAGES) {
              checkTimeout();
              poResult = await conn.queryMore(poResult.nextRecordsUrl);
              if (poResult.records && poResult.records.length > 0) {
                batchProjectObjectives.push(...poResult.records);
                poPageCount++;
              } else {
                break;
              }
            }
            
            projectObjectives.push(...batchProjectObjectives);
          } catch (error) {
            console.error(`[Active Contributors by Qual Step] Error querying Project Objectives batch:`, error.message);
            continue;
          }
        }
      }
      
      // Build mapping from Project_Qualification_Step__c: qualStepId -> projectObjectiveIds
      allProjectQualStepRecords.forEach(pqs => {
        const qualStepId = pqs[projectQualStepQualStepField];
        const projectObjectiveId = pqs[projectQualStepProjectObjectiveField];
        if (qualStepId && projectObjectiveId && projectObjectivesByQualStep.has(qualStepId)) {
          const existingPOs = projectObjectivesByQualStep.get(qualStepId);
          // Only add if not already in the list
          if (!existingPOs.find(po => po.id === projectObjectiveId)) {
            // Find the Project Objective name and Project ID
            const po = projectObjectives.find(p => p.Id === projectObjectiveId);
            if (po) {
              existingPOs.push({
                id: po.Id,
                name: po.Name,
                projectId: po.Project__c || null
              });
            }
          }
        }
      });
      
      console.log(`[Active Contributors by Qual Step] Built mapping through Project_Qualification_Step__c: ${allProjectQualStepRecords.length} records mapped`);
      console.log(`[Active Contributors by Qual Step] Qualification Steps with Project Objectives:`, 
        Array.from(projectObjectivesByQualStep.entries())
          .filter(([id, pos]) => pos.length > 0)
          .length
      );
    } else if (projectObjectiveField) {
      // Direct relationship: Qualification Step has Project Objective field
      const QUAL_STEP_BATCH_SIZE = 200;
      for (let i = 0; i < qualStepIds.length; i += QUAL_STEP_BATCH_SIZE) {
        checkTimeout();
        const batch = qualStepIds.slice(i, i + QUAL_STEP_BATCH_SIZE);
        const batchNumber = Math.floor(i / QUAL_STEP_BATCH_SIZE) + 1;
        const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
        
        let poQuery = `SELECT Id, Name, Project__c, ${projectObjectiveField} FROM Project_Objective__c WHERE ${projectObjectiveField} IN (${idsString})`;
        
        if (searchTerm && searchTerm.trim()) {
          let sanitizedSearch = searchTerm.trim();
          // Check if search term is wrapped in double quotes for exact match
          const isExactMatch = sanitizedSearch.startsWith('"') && sanitizedSearch.endsWith('"');
          if (isExactMatch) {
            sanitizedSearch = sanitizedSearch.slice(1, -1).trim(); // Remove quotes
          }
          sanitizedSearch = sanitizedSearch.replace(/'/g, "''");
          const matchPattern = isExactMatch ? `= '${sanitizedSearch}'` : `LIKE '%${sanitizedSearch}%'`;
          poQuery += ` AND Name ${matchPattern}`;
        }
        
        poQuery += ` ORDER BY ${projectObjectiveField}, Name`;
        
        try {
          console.log(`[Active Contributors by Qual Step] Querying Project Objectives for batch ${batchNumber}`);
          let poResult = await conn.query(poQuery);
          let batchProjectObjectives = poResult.records || [];
          
          // Handle pagination
          let pageCount = 0;
          const MAX_PAGES_PER_BATCH = 5;
          while (poResult.nextRecordsUrl && pageCount < MAX_PAGES_PER_BATCH) {
            checkTimeout();
            poResult = await conn.queryMore(poResult.nextRecordsUrl);
            if (poResult.records && poResult.records.length > 0) {
              batchProjectObjectives.push(...poResult.records);
              pageCount++;
            } else {
              break;
            }
          }
          
          projectObjectives.push(...batchProjectObjectives);
        } catch (error) {
          console.error(`[Active Contributors by Qual Step] Error querying batch ${batchNumber}:`, error.message);
          continue;
        }
      }
    } else if (qualStepFieldOnProjectObjective) {
      // PRIORITY 2: Reverse relationship - Project Objective has Qualification Step field
      const QUAL_STEP_BATCH_SIZE = 200;
      for (let i = 0; i < qualStepIds.length; i += QUAL_STEP_BATCH_SIZE) {
        checkTimeout();
        const batch = qualStepIds.slice(i, i + QUAL_STEP_BATCH_SIZE);
        const batchNumber = Math.floor(i / QUAL_STEP_BATCH_SIZE) + 1;
        const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
        
        let poQuery = `SELECT Id, Name, Project__c, ${qualStepFieldOnProjectObjective} FROM Project_Objective__c WHERE ${qualStepFieldOnProjectObjective} IN (${idsString})`;
        
        if (searchTerm && searchTerm.trim()) {
          let sanitizedSearch = searchTerm.trim();
          // Check if search term is wrapped in double quotes for exact match
          const isExactMatch = sanitizedSearch.startsWith('"') && sanitizedSearch.endsWith('"');
          if (isExactMatch) {
            sanitizedSearch = sanitizedSearch.slice(1, -1).trim(); // Remove quotes
          }
          sanitizedSearch = sanitizedSearch.replace(/'/g, "''");
          const matchPattern = isExactMatch ? `= '${sanitizedSearch}'` : `LIKE '%${sanitizedSearch}%'`;
          poQuery += ` AND Name ${matchPattern}`;
        }
        
        poQuery += ` ORDER BY ${qualStepFieldOnProjectObjective}, Name`;
        
        try {
          console.log(`[Active Contributors by Qual Step] Querying Project Objectives for batch ${batchNumber} (reverse relationship)`);
          let poResult = await conn.query(poQuery);
          let batchProjectObjectives = poResult.records || [];
          
          // Handle pagination
          let pageCount = 0;
          const MAX_PAGES_PER_BATCH = 5;
          while (poResult.nextRecordsUrl && pageCount < MAX_PAGES_PER_BATCH) {
            checkTimeout();
            poResult = await conn.queryMore(poResult.nextRecordsUrl);
            if (poResult.records && poResult.records.length > 0) {
              batchProjectObjectives.push(...poResult.records);
              pageCount++;
            } else {
              break;
            }
          }
          
          projectObjectives.push(...batchProjectObjectives);
        } catch (error) {
          console.error(`[Active Contributors by Qual Step] Error querying batch ${batchNumber}:`, error.message);
          continue;
        }
      }
    } else if (projectPageQualStepField && projectPageProjectObjectiveField) {
      // PRIORITY 3: Relationship through Project_Page__c (fallback) - Project_Page__c links Qualification Steps to Project Objectives
      console.log(`[Active Contributors by Qual Step] Using Project_Page__c junction: ${projectPageQualStepField} -> ${projectPageProjectObjectiveField}`);
      
      // Query ALL Project Pages for these Qualification Steps in batches
      const QUAL_STEP_BATCH_SIZE = 200;
      const allProjectPageRecords = [];
      
      for (let i = 0; i < qualStepIds.length; i += QUAL_STEP_BATCH_SIZE) {
        checkTimeout();
        const batch = qualStepIds.slice(i, i + QUAL_STEP_BATCH_SIZE);
        const batchNumber = Math.floor(i / QUAL_STEP_BATCH_SIZE) + 1;
        const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
        
        const projectPageQuery = `SELECT ${projectPageQualStepField}, ${projectPageProjectObjectiveField} FROM Project_Page__c WHERE ${projectPageQualStepField} IN (${idsString}) AND ${projectPageProjectObjectiveField} != null`;
        
        try {
          console.log(`[Active Contributors by Qual Step] Querying Project Pages for batch ${batchNumber} (${batch.length} qualification steps)`);
          let projectPageResult = await conn.query(projectPageQuery);
          let batchProjectPageRecords = projectPageResult.records || [];
          
          // Handle pagination for Project Pages
          let pagePageCount = 0;
          const MAX_PAGES_PER_BATCH = 10;
          while (projectPageResult.nextRecordsUrl && pagePageCount < MAX_PAGES_PER_BATCH) {
            checkTimeout();
            projectPageResult = await conn.queryMore(projectPageResult.nextRecordsUrl);
            if (projectPageResult.records && projectPageResult.records.length > 0) {
              batchProjectPageRecords.push(...projectPageResult.records);
              pagePageCount++;
            } else {
              break;
            }
          }
          
          allProjectPageRecords.push(...batchProjectPageRecords);
          console.log(`[Active Contributors by Qual Step] Batch ${batchNumber}: Found ${batchProjectPageRecords.length} Project Pages`);
        } catch (error) {
          console.error(`[Active Contributors by Qual Step] Error querying Project Pages batch ${batchNumber}:`, error.message);
          continue;
        }
      }
      
      console.log(`[Active Contributors by Qual Step] Total Project Pages found: ${allProjectPageRecords.length}`);
      
      // Extract unique Project Objective IDs from all Project Pages
      const projectObjectiveIdsFromPages = [...new Set(allProjectPageRecords
        .map(pp => pp[projectPageProjectObjectiveField])
        .filter(id => id !== null && id !== undefined)
      )];
      
      console.log(`[Active Contributors by Qual Step] Unique Project Objective IDs from Project Pages: ${projectObjectiveIdsFromPages.length}`);
      
      if (projectObjectiveIdsFromPages.length > 0) {
        // Query Project Objectives in batches
        const PO_BATCH_SIZE = 200;
        for (let i = 0; i < projectObjectiveIdsFromPages.length; i += PO_BATCH_SIZE) {
          checkTimeout();
          const batch = projectObjectiveIdsFromPages.slice(i, i + PO_BATCH_SIZE);
          const poIdsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
          let poQuery = `SELECT Id, Name, Project__c FROM Project_Objective__c WHERE Id IN (${poIdsString})`;
          
          if (searchTerm && searchTerm.trim()) {
            let sanitizedSearch = searchTerm.trim();
            // Check if search term is wrapped in double quotes for exact match
            const isExactMatch = sanitizedSearch.startsWith('"') && sanitizedSearch.endsWith('"');
            if (isExactMatch) {
              sanitizedSearch = sanitizedSearch.slice(1, -1).trim(); // Remove quotes
            }
            sanitizedSearch = sanitizedSearch.replace(/'/g, "''");
            const matchPattern = isExactMatch ? `= '${sanitizedSearch}'` : `LIKE '%${sanitizedSearch}%'`;
            poQuery += ` AND Name ${matchPattern}`;
          }
          
          poQuery += ` ORDER BY Name`;
          
          try {
            let poResult = await conn.query(poQuery);
            let batchProjectObjectives = poResult.records || [];
            
            // Handle pagination for Project Objectives
            let poPageCount = 0;
            const MAX_PO_PAGES = 5;
            while (poResult.nextRecordsUrl && poPageCount < MAX_PO_PAGES) {
              checkTimeout();
              poResult = await conn.queryMore(poResult.nextRecordsUrl);
              if (poResult.records && poResult.records.length > 0) {
                batchProjectObjectives.push(...poResult.records);
                poPageCount++;
              } else {
                break;
              }
            }
            
            projectObjectives.push(...batchProjectObjectives);
          } catch (error) {
            console.error(`[Active Contributors by Qual Step] Error querying Project Objectives batch:`, error.message);
            continue;
          }
        }
      }
      
      // Build mapping from Project Pages: qualStepId -> projectObjectiveIds
      allProjectPageRecords.forEach(pp => {
        const qualStepId = pp[projectPageQualStepField];
        const projectObjectiveId = pp[projectPageProjectObjectiveField];
        if (qualStepId && projectObjectiveId && projectObjectivesByQualStep.has(qualStepId)) {
          const existingPOs = projectObjectivesByQualStep.get(qualStepId);
          // Only add if not already in the list
          if (!existingPOs.find(po => po.id === projectObjectiveId)) {
            // Find the Project Objective name
            const po = projectObjectives.find(p => p.Id === projectObjectiveId);
            if (po) {
              existingPOs.push({
                id: po.Id,
                name: po.Name
              });
            }
          }
        }
      });
      
      console.log(`[Active Contributors by Qual Step] Built mapping through Project_Page__c: ${allProjectPageRecords.length} Project Pages mapped`);
      console.log(`[Active Contributors by Qual Step] Qualification Steps with Project Objectives:`, 
        Array.from(projectObjectivesByQualStep.entries())
          .filter(([id, pos]) => pos.length > 0)
          .length
      );
    } else {
      // Try to find relationship through a junction object or other means
      console.warn('[Active Contributors by Qual Step] No relationship found between Qualification Steps and Project Objectives');
      console.warn('[Active Contributors by Qual Step] Tried: direct field on Qualification Step, reverse field on Project Objective, and Project_Page__c junction');
      console.warn(`[Active Contributors by Qual Step] Relationship discovery summary:`, {
        projectObjectiveField: projectObjectiveField || 'NOT FOUND',
        qualStepFieldOnProjectObjective: qualStepFieldOnProjectObjective || 'NOT FOUND',
        projectPageQualStepField: projectPageQualStepField || 'NOT FOUND',
        projectPageProjectObjectiveField: projectPageProjectObjectiveField || 'NOT FOUND'
      });
    }
    
    console.log(`[Active Contributors by Qual Step] Found ${projectObjectives.length} Project Objectives`);
    
    // Build mapping from Project Objectives to Qualification Steps
    // Only if we haven't already built it through Project_Qualification_Step__c or Project_Page__c
    if (!useProjectQualStepMapping && !(projectPageQualStepField && projectPageProjectObjectiveField)) {
      // Build mapping from Project Objectives to Qualification Steps (direct or reverse relationship)
      projectObjectives.forEach(po => {
        let qualStepId = null;
        if (projectObjectiveField && po[projectObjectiveField]) {
          qualStepId = po[projectObjectiveField];
        } else if (qualStepFieldOnProjectObjective && po[qualStepFieldOnProjectObjective]) {
          qualStepId = po[qualStepFieldOnProjectObjective];
        }
        
        if (qualStepId && projectObjectivesByQualStep.has(qualStepId)) {
          projectObjectivesByQualStep.get(qualStepId).push({
            id: po.Id,
            name: po.Name
          });
        }
      });
    }
    // If we built mapping through Project_Page__c, it's already set in projectObjectivesByQualStep
    
    console.log(`[Active Contributors by Qual Step] Project Objectives by Qual Step mapping:`, 
      Array.from(projectObjectivesByQualStep.entries())
        .filter(([id, pos]) => pos.length > 0)
        .slice(0, 5)
        .map(([id, pos]) => ({ qualStepId: id, count: pos.length }))
    );
    console.log(`[Active Contributors by Qual Step] Total Qualification Steps with Project Objectives:`, 
      Array.from(projectObjectivesByQualStep.entries()).filter(([id, pos]) => pos.length > 0).length
    );
    
    // Query active Contributor Projects for these Project Objectives
    const projectObjectiveIds = projectObjectives.map(po => po.Id);
    
    if (projectObjectiveIds.length === 0) {
      // No Project Objectives, return empty structure
      const result = qualSteps.map(qualStep => ({
        qualStepId: qualStep.Id,
        qualStepName: qualStep.Name,
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
    const BATCH_SIZE = 100;
    const contributorCounts = new Map(); // Map: projectObjectiveId -> count
    const totalBatches = Math.ceil(projectObjectiveIds.length / BATCH_SIZE);
    const MAX_BATCHES = 20;
    
    console.log(`[Active Contributors by Qual Step] Processing ${projectObjectiveIds.length} Project Objectives in ${Math.min(totalBatches, MAX_BATCHES)} batches`);
    
    // Find Project Objective field on Contributor_Project__c
    const possibleProjectObjectiveFieldsOnCP = [
      'Project_Objective__c',
      'ProjectObjective__c',
      'Objective__c'
    ];
    
    let projectObjectiveFieldOnCP = null;
    for (const fieldName of possibleProjectObjectiveFieldsOnCP) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        projectObjectiveFieldOnCP = fieldName;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!projectObjectiveFieldOnCP) {
      try {
        const describeResult = await conn.sobject('Contributor_Project__c').describe();
        const field = describeResult.fields.find(f => 
          f.name === 'Project_Objective__c' || 
          f.name === 'ProjectObjective__c' || 
          f.name === 'Objective__c'
        );
        if (field) {
          projectObjectiveFieldOnCP = field.name;
        }
      } catch (error) {
        console.error('Error describing Contributor_Project__c:', error);
      }
    }
    
    if (!projectObjectiveFieldOnCP) {
      return res.status(500).json({
        success: false,
        error: 'Could not determine Project Objective field name on Contributor_Project__c'
      });
    }
    
    // Discover qualification step field on Contributor_Project__c that stores current qualification step
    let qualStepFieldOnCP = null;
    const possibleQualStepFieldsOnCP = [
      'Qualification_Step__c',
      'Project_Qualification_Step__c',
      'QualificationStep__c',
      'Current_Qualification_Step__c',
      'Current_Qual_Step__c',
      'Qual_Step__c',
      'Qualification_Step_Id__c',
      'CurrentQualificationStep__c',
      'QualStep__c',
      'Step__c'
    ];
    
    // Store reference fields info for debug response
    let referenceFieldsInfo = [];
    
    try {
      const cpDescribeResult = await conn.sobject('Contributor_Project__c').describe();
      console.log(`[Active Contributors by Qual Step] Searching for qualification step field on Contributor_Project__c...`);
      console.log(`[Active Contributors by Qual Step] Total fields on Contributor_Project__c: ${cpDescribeResult.fields.length}`);
      
      // List all reference fields for debugging
      const allReferenceFields = cpDescribeResult.fields.filter(f => f.type === 'reference');
      console.log(`[Active Contributors by Qual Step] Found ${allReferenceFields.length} reference fields on Contributor_Project__c`);
      
      // Store reference fields info for debug response (limit to first 20 to avoid huge responses)
      referenceFieldsInfo = allReferenceFields.slice(0, 20).map(f => ({
        name: f.name,
        references: (f.referenceTo || []).join(', ') || 'N/A'
      }));
      
      // Log ALL reference fields with their referenceTo values for debugging
      console.log(`[Active Contributors by Qual Step] All reference fields on Contributor_Project__c:`);
      allReferenceFields.forEach(f => {
        const refs = (f.referenceTo || []).join(', ') || 'N/A';
        console.log(`  - ${f.name} (type: ${f.type}, references: ${refs})`);
      });
      
      // First try exact matches (both reference and picklist/text fields)
      for (const fieldName of possibleQualStepFieldsOnCP) {
        const field = cpDescribeResult.fields.find(f => f.name === fieldName);
        if (field) {
          console.log(`[Active Contributors by Qual Step] Found field ${fieldName}, type: ${field.type}, referenceTo: ${(field.referenceTo || []).join(', ')}`);
          if (field.type === 'reference') {
            // Check if it references Qualification_Step__c or Project_Qualification_Step__c
            const referenceTo = field.referenceTo || [];
            if (referenceTo.includes('Qualification_Step__c') || 
                referenceTo.includes('Project_Qualification_Step__c') ||
                referenceTo.some(ref => ref.includes('Qualification') && ref.includes('Step'))) {
              qualStepFieldOnCP = fieldName;
              console.log(`[Active Contributors by Qual Step] ✓ Found qualification step field on Contributor_Project__c: ${fieldName} (references: ${referenceTo.join(', ')})`);
              break;
            }
          } else if (field.type === 'picklist' || field.type === 'string' || field.type === 'textarea') {
            // Also check picklist/string fields - might store qualification step name or ID
            console.log(`[Active Contributors by Qual Step] Found ${field.type} field ${fieldName} - might store qualification step info`);
          }
        }
      }
      
      // If not found, try to find any reference field that might point to Qualification Step
      if (!qualStepFieldOnCP) {
        const referenceFields = cpDescribeResult.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Qualification') || f.name.includes('Qual') || f.name.includes('Step'))
        );
        console.log(`[Active Contributors by Qual Step] Found ${referenceFields.length} reference fields with 'Qualification', 'Qual', or 'Step' in name`);
        if (referenceFields.length > 0) {
          // Check if any of these reference Qualification Step objects
          for (const field of referenceFields) {
            const referenceTo = field.referenceTo || [];
            console.log(`[Active Contributors by Qual Step] Checking field ${field.name}, referenceTo: ${referenceTo.join(', ')}`);
            if (referenceTo.some(ref => ref.includes('Qualification') && ref.includes('Step'))) {
              qualStepFieldOnCP = field.name;
              console.log(`[Active Contributors by Qual Step] ✓ Found potential qualification step field: ${field.name} (references: ${referenceTo.join(', ')})`);
              break;
            }
          }
        }
      }
      
      // If still not found, check ALL reference fields for any that reference Qualification Step objects
      if (!qualStepFieldOnCP) {
        console.log(`[Active Contributors by Qual Step] Checking ALL reference fields for Qualification Step references...`);
        for (const field of allReferenceFields) {
          const referenceTo = field.referenceTo || [];
          if (referenceTo.some(ref => 
            (ref.includes('Qualification') && ref.includes('Step')) ||
            ref === 'Qualification_Step__c' ||
            ref === 'Project_Qualification_Step__c'
          )) {
            qualStepFieldOnCP = field.name;
            console.log(`[Active Contributors by Qual Step] ✓ Found qualification step field by checking all references: ${field.name} (references: ${referenceTo.join(', ')})`);
            break;
          }
        }
      }
      
      if (!qualStepFieldOnCP) {
        console.warn(`[Active Contributors by Qual Step] ⚠ No qualification step field found on Contributor_Project__c. Will count all active contributors for project objectives.`);
        console.warn(`[Active Contributors by Qual Step] Available reference fields with 'Qual' or 'Step' in name:`, 
          allReferenceFields
            .filter(f => f.name.includes('Qual') || f.name.includes('Step'))
            .map(f => `${f.name} (references: ${(f.referenceTo || []).join(', ')})`)
            .join(', '));
        
        // Try to find if there's a relationship to Project_Qualification_Step__c
        console.log(`[Active Contributors by Qual Step] Checking for relationship to Project_Qualification_Step__c...`);
        const projectQualStepRefFields = allReferenceFields.filter(f => 
          (f.referenceTo || []).includes('Project_Qualification_Step__c')
        );
        if (projectQualStepRefFields.length > 0) {
          console.log(`[Active Contributors by Qual Step] Found ${projectQualStepRefFields.length} field(s) referencing Project_Qualification_Step__c:`, 
            projectQualStepRefFields.map(f => f.name).join(', '));
          // Use the first one found
          qualStepFieldOnCP = projectQualStepRefFields[0].name;
          console.log(`[Active Contributors by Qual Step] ✓ Will use ${qualStepFieldOnCP} to filter by Project_Qualification_Step__c`);
        } else {
          // Check if there's a junction object like Contributor_Qualification_Step__c
          console.log(`[Active Contributors by Qual Step] Checking for junction objects that might link Contributor_Project__c to Qualification Steps...`);
          try {
            // Check for Contributor_Qualification_Step__c or similar junction object
            const possibleJunctionObjects = [
              'Contributor_Qualification_Step__c',
              'Contributor_Project_Qualification_Step__c',
              'CP_Qualification_Step__c'
            ];
            
            for (const junctionObjectName of possibleJunctionObjects) {
              try {
                const junctionDescribe = await conn.sobject(junctionObjectName).describe();
                console.log(`[Active Contributors by Qual Step] Found junction object: ${junctionObjectName}`);
                
                // Find fields that reference Contributor_Project__c and Qualification Step objects
                const cpRefFields = junctionDescribe.fields.filter(f => 
                  f.type === 'reference' && 
                  (f.referenceTo || []).some(ref => ref.includes('Contributor') && ref.includes('Project'))
                );
                const qualStepRefFields = junctionDescribe.fields.filter(f => 
                  f.type === 'reference' && 
                  (f.referenceTo || []).some(ref => ref.includes('Qualification') && ref.includes('Step'))
                );
                
                if (cpRefFields.length > 0 && qualStepRefFields.length > 0) {
                  console.log(`[Active Contributors by Qual Step] Found junction object ${junctionObjectName} with fields:`, {
                    contributorProjectField: cpRefFields[0].name,
                    qualificationStepField: qualStepRefFields[0].name
                  });
                  // Store this info for later use in queries
                  global.contributorQualStepJunction = {
                    objectName: junctionObjectName,
                    cpField: cpRefFields[0].name,
                    qualStepField: qualStepRefFields[0].name
                  };
                  console.log(`[Active Contributors by Qual Step] Will use junction object ${junctionObjectName} to filter contributors by qualification step`);
                  break;
                }
              } catch (error) {
                // Object doesn't exist, continue
                continue;
              }
            }
          } catch (error) {
            console.error(`[Active Contributors by Qual Step] Error checking for junction objects:`, error.message);
          }
        }
      } else {
        console.log(`[Active Contributors by Qual Step] ✓ Using qualification step field: ${qualStepFieldOnCP}`);
      }
    } catch (error) {
      console.error('[Active Contributors by Qual Step] Error describing Contributor_Project__c for qualification step field:', error);
    }
    
    // Build result structure - aggregate by qualification step
    // For each qualification step, count project objectives that are NOT closed
    const result = [];
    
    // Find Status field on Project_Objective__c to filter out closed objectives
    let statusFieldOnPO = null;
    const possibleStatusFields = ['Status__c', 'Status'];
    try {
      const poDescribeResult = await conn.sobject('Project_Objective__c').describe();
      for (const fieldName of possibleStatusFields) {
        const field = poDescribeResult.fields.find(f => f.name === fieldName);
        if (field) {
          statusFieldOnPO = fieldName;
          console.log(`[Active Project Objectives by Qual Step] Found Status field on Project_Objective__c: ${fieldName}`);
          break;
        }
      }
    } catch (error) {
      console.error('[Active Project Objectives by Qual Step] Error describing Project_Objective__c:', error);
    }
    
    for (const qualStep of qualSteps) {
      checkTimeout();
      const qualStepId = qualStep.Id;
      const projectObjectivesForQualStep = projectObjectivesByQualStep.get(qualStepId) || [];
      
      if (projectObjectivesForQualStep.length === 0) {
        continue; // Skip qualification steps with no project objectives
      }
      
      const projectObjectiveIdsForQualStep = projectObjectivesForQualStep.map(po => po.id);
      
      // Query Project Objectives to filter out closed ones
      let nonClosedProjectObjectives = [];
      if (projectObjectiveIdsForQualStep.length > 0) {
        const BATCH_SIZE = 200;
        for (let i = 0; i < projectObjectiveIdsForQualStep.length; i += BATCH_SIZE) {
          checkTimeout();
          const batch = projectObjectiveIdsForQualStep.slice(i, i + BATCH_SIZE);
          const idsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
          
          let poQuery = `SELECT Id, Name, Project__c FROM Project_Objective__c WHERE Id IN (${idsString})`;
          
          // Filter out closed project objectives if Status field exists
          if (statusFieldOnPO) {
            poQuery += ` AND (${statusFieldOnPO} != 'Closed' AND ${statusFieldOnPO} != 'closed')`;
          }
          
          try {
            const poResult = await conn.query(poQuery);
            if (poResult.records && poResult.records.length > 0) {
              nonClosedProjectObjectives.push(...poResult.records.map(po => ({
                id: po.Id,
                name: po.Name,
                projectId: po.Project__c || projectObjectiveToProjectMap.get(po.Id) || null
              })));
            }
          } catch (error) {
            console.error(`[Active Project Objectives by Qual Step] Error querying Project Objectives for qual step ${qualStepId}:`, error.message);
            // If query fails, include all project objectives
            nonClosedProjectObjectives.push(...projectObjectivesForQualStep.filter(po => batch.includes(po.id)));
          }
        }
      }
      
      // Calculate unique project count for this qualification step
      const uniqueProjects = new Set();
      nonClosedProjectObjectives.forEach(po => {
        const projectId = po.projectId;
        if (projectId) {
          uniqueProjects.add(projectId);
        }
      });
      const projectCount = uniqueProjects.size;
      
      // Get Status and Passing_Percentage_Score__c from Qualification_Step__c
      const status = qualStep.Status__c || '';
      const passingPercentageScore = qualStep.Passing_Percentage_Score__c || null;
      
      // Only include qualification step if it has at least one non-closed project objective
      if (nonClosedProjectObjectives.length > 0) {
        result.push({
          qualStepId: qualStepId,
          qualStepName: qualStep.Name,
          status: status,
          passingPercentageScore: passingPercentageScore,
          projectCount: projectCount,
          projectObjectiveCount: nonClosedProjectObjectives.length,
          projectObjectives: nonClosedProjectObjectives
        });
      }
    }
    
    // Sort by project objective count descending
    result.sort((a, b) => (b.projectObjectiveCount || 0) - (a.projectObjectiveCount || 0));
    
    const executionTime = Date.now() - startTime;
    console.log(`[Active Contributors by Qual Step] Completed in ${executionTime}ms`);
    console.log(`[Active Contributors by Qual Step] Returning ${result.length} qualification steps with contributors`);
    if (result.length > 0) {
      console.log(`[Active Contributors by Qual Step] Sample result:`, {
        qualStepName: result[0].qualStepName,
        projectObjectiveCount: result[0].projectObjectiveCount,
        activeContributorCount: result[0].activeContributorCount
      });
    }
    
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
    console.error(`[Active Contributors by Qual Step] Error after ${executionTime}ms:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Active Project Objectives by Qualification Step data',
      executionTime: executionTime
    });
  }
}));

/**
 * Get Contributor Names for a Qualification Step
 * GET /api/active-project-objectives-by-qual-step/contributors/:qualStepId
 */
router.get('/contributors/:qualStepId', authenticate, asyncHandler(async (req, res) => {
  // Set extended timeout for this endpoint
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 540000; // 9 minutes max execution time
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const { qualStepId } = req.params;
    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Find Qualification Step object name - prioritize Qualification_Step__c (not Project_Qualification_Step__c)
    let qualStepObjectName = null;
    
    // First try Qualification_Step__c
    try {
      await conn.sobject('Qualification_Step__c').describe();
      qualStepObjectName = 'Qualification_Step__c';
    } catch (error) {
      // Fallback to Project_Qualification_Step__c if Qualification_Step__c doesn't exist
      try {
        await conn.sobject('Project_Qualification_Step__c').describe();
        qualStepObjectName = 'Project_Qualification_Step__c';
      } catch (fallbackError) {
        console.error('[Active Contributors by Qual Step] Neither Qualification_Step__c nor Project_Qualification_Step__c found');
      }
    }
    
    if (!qualStepObjectName) {
      return res.status(500).json({
        success: false,
        error: 'Could not determine Qualification Step object name'
      });
    }
    
    // Find relationship between Qualification Step and Project Objective
    let projectObjectiveField = null;
    let qualStepFieldOnProjectObjective = null;
    
    try {
      const qualStepDescribe = await conn.sobject(qualStepObjectName).describe();
      const possibleFields = ['Project_Objective__c', 'ProjectObjective__c', 'Objective__c'];
      for (const fieldName of possibleFields) {
        const field = qualStepDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectObjectiveField = fieldName;
          break;
        }
      }
    } catch (error) {
      console.error('Error describing Qualification Step:', error);
    }
    
    if (!projectObjectiveField) {
      try {
        const poDescribe = await conn.sobject('Project_Objective__c').describe();
        const possibleFields = ['Qualification_Step__c', 'Project_Qualification_Step__c', 'QualificationStep__c'];
        for (const fieldName of possibleFields) {
          const field = poDescribe.fields.find(f => f.name === fieldName);
          if (field) {
            qualStepFieldOnProjectObjective = fieldName;
            break;
          }
        }
      } catch (error) {
        console.error('Error describing Project_Objective__c:', error);
      }
    }
    
    // Get Project Objectives for this Qualification Step
    // Priority: 1) Project_Qualification_Step__c (junction), 2) Direct/Reverse, 3) Project_Page__c
    let projectObjectiveIds = [];
    let qualStepName = null;
    let projectQualStepNamesMap = new Map(); // Map: Project Objective ID -> Project Qualification Step Name
    
    // PRIORITY 1: Try Project_Qualification_Step__c junction object first
    let projectQualStepQualStepField = null;
    let projectQualStepProjectObjectiveField = null;
    
    try {
      const projectQualStepDescribe = await conn.sobject('Project_Qualification_Step__c').describe();
      
      // Find Qualification Step field
      const possibleQualStepFields = ['Qualification_Step__c', 'Project_Qualification_Step__c', 'QualificationStep__c'];
      for (const fieldName of possibleQualStepFields) {
        const field = projectQualStepDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectQualStepQualStepField = fieldName;
          break;
        }
      }
      
      // Find Project Objective field
      const possibleProjectObjectiveFields = ['Project_Objective__c', 'ProjectObjective__c', 'Objective__c'];
      for (const fieldName of possibleProjectObjectiveFields) {
        const field = projectQualStepDescribe.fields.find(f => f.name === fieldName);
        if (field) {
          projectQualStepProjectObjectiveField = fieldName;
          break;
        }
      }
      
      if (projectQualStepQualStepField && projectQualStepProjectObjectiveField) {
        // Get Qualification Step name first
        try {
          const qualStepQuery = `SELECT Name FROM ${qualStepObjectName} WHERE Id = '${qualStepId.replace(/'/g, "''")}' LIMIT 1`;
          const qualStepResult = await conn.query(qualStepQuery);
          if (qualStepResult.records && qualStepResult.records.length > 0) {
            qualStepName = qualStepResult.records[0].Name;
          }
        } catch (error) {
          console.error('[Active Contributors by Qual Step] Error getting Qualification Step name:', error);
        }
        
        // Query Project_Qualification_Step__c to get Project Objectives
        const sanitizedId = qualStepId.replace(/'/g, "''");
        const projectQualStepQuery = `SELECT Id, Name, ${projectQualStepProjectObjectiveField} FROM Project_Qualification_Step__c WHERE ${projectQualStepQualStepField} = '${sanitizedId}' AND ${projectQualStepProjectObjectiveField} != null`;
        
        let projectQualStepResult = await conn.query(projectQualStepQuery);
        let projectQualStepRecords = projectQualStepResult.records || [];
        
        // Create a map of Project Objective ID -> Project Qualification Step Name
        projectQualStepRecords.forEach(pqs => {
          const poId = pqs[projectQualStepProjectObjectiveField];
          if (poId && pqs.Name) {
            projectQualStepNamesMap.set(poId, pqs.Name);
          }
        });
        
        // Handle pagination
        let pageCount = 0;
        const MAX_PAGES = 10;
        while (projectQualStepResult.nextRecordsUrl && pageCount < MAX_PAGES) {
          projectQualStepResult = await conn.queryMore(projectQualStepResult.nextRecordsUrl);
          if (projectQualStepResult.records && projectQualStepResult.records.length > 0) {
            projectQualStepResult.records.forEach(pqs => {
              const poId = pqs[projectQualStepProjectObjectiveField];
              if (poId && pqs.Name) {
                projectQualStepNamesMap.set(poId, pqs.Name);
              }
            });
            projectQualStepRecords.push(...projectQualStepResult.records);
            pageCount++;
          } else {
            break;
          }
        }
        
        // Extract unique Project Objective IDs
        projectObjectiveIds = [...new Set(projectQualStepRecords
          .map(pqs => pqs[projectQualStepProjectObjectiveField])
          .filter(id => id !== null && id !== undefined)
        )];
        
        console.log(`[Active Contributors by Qual Step] Found ${projectObjectiveIds.length} Project Objectives via Project_Qualification_Step__c for Qualification Step ${qualStepId}`);
      }
    } catch (error) {
      console.log(`[Active Contributors by Qual Step] Project_Qualification_Step__c not available, trying other methods: ${error.message}`);
    }
    
    // PRIORITY 2: Try direct/reverse relationship if Project_Qualification_Step__c didn't work
    if (projectObjectiveIds.length === 0) {
      if (projectObjectiveField) {
        // Direct: Qualification Step has Project Objective
        const poQuery = `SELECT Id FROM Project_Objective__c WHERE ${projectObjectiveField} = '${qualStepId.replace(/'/g, "''")}'`;
        const poResult = await conn.query(poQuery);
        projectObjectiveIds = (poResult.records || []).map(po => po.Id);
      } else if (qualStepFieldOnProjectObjective) {
        // Reverse: Project Objective has Qualification Step
        const sanitizedId = qualStepId.replace(/'/g, "''");
        const poQuery = `SELECT Id FROM Project_Objective__c WHERE ${qualStepFieldOnProjectObjective} = '${sanitizedId}'`;
        const poResult = await conn.query(poQuery);
        projectObjectiveIds = (poResult.records || []).map(po => po.Id);
      }
    }
    
    // Get Qualification Step name if not already retrieved
    if (!qualStepName) {
      try {
        const qualStepQuery = `SELECT Name FROM ${qualStepObjectName} WHERE Id = '${qualStepId.replace(/'/g, "''")}' LIMIT 1`;
        const qualStepResult = await conn.query(qualStepQuery);
        if (qualStepResult.records && qualStepResult.records.length > 0) {
          qualStepName = qualStepResult.records[0].Name;
        }
      } catch (error) {
        console.error('[Active Contributors by Qual Step] Error getting Qualification Step name:', error);
      }
    }
    
    if (projectObjectiveIds.length === 0) {
      return res.json({
        success: true,
        contributors: [],
        count: 0,
        qualStepName: qualStepName || 'Unknown',
        message: 'No Project Objectives found for this Qualification Step'
      });
    }
    
    // Find Project Objective field on Contributor_Project__c
    const possibleProjectObjectiveFieldsOnCP = [
      'Project_Objective__c',
      'ProjectObjective__c',
      'Objective__c'
    ];
    
    let projectObjectiveFieldOnCP = null;
    for (const fieldName of possibleProjectObjectiveFieldsOnCP) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        projectObjectiveFieldOnCP = fieldName;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!projectObjectiveFieldOnCP) {
      projectObjectiveFieldOnCP = 'Project_Objective__c'; // Default
    }
    
    // Find Contributor field name (Contact__c or Contributor__c)
    const possibleContributorFields = ['Contact__c', 'Contributor__c'];
    let contributorField = null;
    
    for (const fieldName of possibleContributorFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        contributorField = fieldName;
        console.log(`[Active Contributors by Qual Step] Found contributor field: ${contributorField}`);
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
          console.log(`[Active Contributors by Qual Step] Discovered contributor field: ${contributorField}`);
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
    
    // Discover qualification step field on Contributor_Project__c (discover once before the loop)
    let qualStepFieldOnCP = null;
    const possibleQualStepFieldsOnCP = [
      'Qualification_Step__c',
      'Project_Qualification_Step__c',
      'QualificationStep__c',
      'Current_Qualification_Step__c',
      'Current_Qual_Step__c',
      'Qual_Step__c',
      'Qualification_Step_Id__c',
      'CurrentQualificationStep__c',
      'QualStep__c',
      'Step__c'
    ];
    
    try {
      const cpDescribeResult = await conn.sobject('Contributor_Project__c').describe();
      const allReferenceFields = cpDescribeResult.fields.filter(f => f.type === 'reference');
      
      // First try exact matches
      for (const fieldName of possibleQualStepFieldsOnCP) {
        const field = cpDescribeResult.fields.find(f => f.name === fieldName);
        if (field && field.type === 'reference') {
          const referenceTo = field.referenceTo || [];
          if (referenceTo.includes('Qualification_Step__c') || 
              referenceTo.includes('Project_Qualification_Step__c') ||
              referenceTo.some(ref => ref.includes('Qualification') && ref.includes('Step'))) {
            qualStepFieldOnCP = fieldName;
            console.log(`[Active Contributors by Qual Step] Found qualification step field on Contributor_Project__c: ${fieldName}`);
            break;
          }
        }
      }
      
      // If not found, try to find any reference field that might point to Qualification Step
      if (!qualStepFieldOnCP) {
        const referenceFields = cpDescribeResult.fields.filter(f => 
          f.type === 'reference' && 
          (f.name.includes('Qualification') || f.name.includes('Qual') || f.name.includes('Step'))
        );
        if (referenceFields.length > 0) {
          for (const field of referenceFields) {
            const referenceTo = field.referenceTo || [];
            if (referenceTo.some(ref => ref.includes('Qualification') && ref.includes('Step'))) {
              qualStepFieldOnCP = field.name;
              console.log(`[Active Contributors by Qual Step] Found potential qualification step field: ${field.name}`);
              break;
            }
          }
        }
      }
      
      // If still not found, check ALL reference fields for any that reference Qualification Step objects
      if (!qualStepFieldOnCP) {
        console.log(`[Active Contributors by Qual Step] Checking ALL reference fields for Qualification Step references...`);
        for (const field of allReferenceFields) {
          const referenceTo = field.referenceTo || [];
          if (referenceTo.some(ref => 
            (ref.includes('Qualification') && ref.includes('Step')) ||
            ref === 'Qualification_Step__c' ||
            ref === 'Project_Qualification_Step__c'
          )) {
            qualStepFieldOnCP = field.name;
            console.log(`[Active Contributors by Qual Step] ✓ Found qualification step field by checking all references: ${field.name} (references: ${referenceTo.join(', ')})`);
            break;
          }
        }
      }
      
      // Try to find if there's a relationship to Project_Qualification_Step__c
      if (!qualStepFieldOnCP) {
        const projectQualStepRefFields = allReferenceFields.filter(f => 
          (f.referenceTo || []).includes('Project_Qualification_Step__c')
        );
        if (projectQualStepRefFields.length > 0) {
          qualStepFieldOnCP = projectQualStepRefFields[0].name;
          console.log(`[Active Contributors by Qual Step] ✓ Will use ${qualStepFieldOnCP} to filter by Project_Qualification_Step__c`);
        }
      }
      
      if (!qualStepFieldOnCP) {
        console.warn(`[Active Contributors by Qual Step] No qualification step field found on Contributor_Project__c. Will return all active contributors for project objectives.`);
        console.warn(`[Active Contributors by Qual Step] All reference fields on Contributor_Project__c:`, 
          allReferenceFields.map(f => `${f.name} (references: ${(f.referenceTo || []).join(', ')})`).join(', '));
      }
    } catch (error) {
      console.error('[Active Contributors by Qual Step] Error describing Contributor_Project__c for qualification step field:', error);
    }
    
    // Get Contributor Project IDs for these Project Objectives - BATCH to avoid 431 error
    const BATCH_SIZE = 100; // Process Project Objectives in batches
    let contributorProjectRecords = [];
    
    for (let i = 0; i < projectObjectiveIds.length; i += BATCH_SIZE) {
      checkTimeout(); // Check timeout before each batch
      const batch = projectObjectiveIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const poIdsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      
      // Build query to get contributors currently in this qualification step
      let cpQuery = `SELECT ${projectObjectiveFieldOnCP}, Id, ${contributorField} FROM Contributor_Project__c 
                       WHERE ${projectObjectiveFieldOnCP} IN (${poIdsString})
                         AND Status__c = 'Active'
                         AND ${projectObjectiveFieldOnCP} != null
                         AND ${contributorField} != null`;
      
      // If we found a qualification step field, filter by it to get only contributors currently in this step
      if (qualStepFieldOnCP) {
        const sanitizedQualStepId = qualStepId.replace(/'/g, "''");
        cpQuery += ` AND ${qualStepFieldOnCP} = '${sanitizedQualStepId}'`;
      }
      
      try {
        let cpResult = await conn.query(cpQuery);
        let batchRecords = cpResult.records || [];
        
        // Handle pagination for this batch
        let pageCount = 0;
        const MAX_PAGES_PER_BATCH = 100;
        while (cpResult.nextRecordsUrl && pageCount < MAX_PAGES_PER_BATCH) {
          checkTimeout(); // Check timeout during pagination
          cpResult = await conn.queryMore(cpResult.nextRecordsUrl);
          if (cpResult.records && cpResult.records.length > 0) {
            batchRecords.push(...cpResult.records);
            pageCount++;
          } else {
            break;
          }
        }
        
        contributorProjectRecords.push(...batchRecords);
        console.log(`[Active Contributors by Qual Step] Batch ${batchNumber}/${Math.ceil(projectObjectiveIds.length / BATCH_SIZE)}: Fetched ${batchRecords.length} Contributor Project records (Total so far: ${contributorProjectRecords.length})`);
      } catch (error) {
        console.error(`[Active Contributors by Qual Step] Error querying Contributor Projects batch ${batchNumber}:`, error.message);
        continue;
      }
    }
    
    console.log(`[Active Contributors by Qual Step] Total Contributor Project records: ${contributorProjectRecords.length}`);
    
    // Create a map of Project Objective ID to Name - BATCH to avoid 431 error
    const poNamesMap = new Map();
    
    for (let i = 0; i < projectObjectiveIds.length; i += BATCH_SIZE) {
      const batch = projectObjectiveIds.slice(i, i + BATCH_SIZE);
      const poIdsString = batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      const poQueryForNames = `SELECT Id, Name FROM Project_Objective__c WHERE Id IN (${poIdsString})`;
      
      try {
        let poNamesResult = await conn.query(poQueryForNames);
        (poNamesResult.records || []).forEach(po => {
          poNamesMap.set(po.Id, po.Name);
        });
        
        // Handle pagination for Project Objective names
        let poNamesPage = poNamesResult;
        let poNamesPageCount = 0;
        while (poNamesPage.nextRecordsUrl && poNamesPageCount < 10) {
          poNamesPage = await conn.queryMore(poNamesPage.nextRecordsUrl);
          if (poNamesPage.records && poNamesPage.records.length > 0) {
            poNamesPage.records.forEach(po => {
              poNamesMap.set(po.Id, po.Name);
            });
            poNamesPageCount++;
          } else {
            break;
          }
        }
      } catch (error) {
        console.error(`[Active Contributors by Qual Step] Error querying Project Objective names batch:`, error.message);
        continue;
      }
    }
    
    // Extract unique contributor IDs using the discovered field
    const contributorIds = [...new Set(contributorProjectRecords
      .map(record => record[contributorField])
      .filter(id => id !== null && id !== undefined)
    )];
    
    console.log(`[Active Contributors by Qual Step] Found ${contributorIds.length} unique contributor IDs from ${contributorProjectRecords.length} Contributor Project records`);
    
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
      checkTimeout(); // Check timeout before each batch
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
        console.error('[Active Contributors by Qual Step] Error describing Contact object:', describeError);
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
        
        // Handle pagination for Contact query
        let contactPageCount = 0;
        const MAX_CONTACT_PAGES = 100;
        while (contactResult.nextRecordsUrl && contactPageCount < MAX_CONTACT_PAGES) {
          checkTimeout(); // Check timeout during pagination
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
        console.error(`[Active Contributors by Qual Step] Error querying contacts batch:`, error.message);
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
          console.error(`[Active Contributors by Qual Step] Error querying basic contact fields:`, basicError.message);
        }
      }
    }
    
    // Create contributor data with Project Objective information
    const contributorData = [];
    const contributorMap = new Map();
    contributors.forEach(contributor => {
      contributorMap.set(contributor.id, contributor);
    });
    
    // Match contributors to Project Objectives
    contributorProjectRecords.forEach(cpRecord => {
      const projectObjectiveId = cpRecord[projectObjectiveFieldOnCP];
      const projectObjectiveName = poNamesMap.get(projectObjectiveId) || '';
      const projectQualStepName = projectQualStepNamesMap.get(projectObjectiveId) || '';
      
      // Get contributor ID using the discovered field
      const contributorId = cpRecord[contributorField];
      
      if (contributorId && contributorMap.has(contributorId)) {
        const contributor = contributorMap.get(contributorId);
        contributorData.push({
          qualStepName: qualStepName || '', // Use the Qualification Step name we already fetched
          projectQualStepName: projectQualStepName, // Project Qualification Step name
          projectObjectiveName: projectObjectiveName,
          projectObjectiveId: projectObjectiveId,
          contributorName: contributor.name,
          contributorEmail: contributor.email
        });
      }
    });
    
    // Clean up global map
    delete global.projectQualStepNamesMap;
    
    // Ensure all items have qualStepName (should already be set, but double-check)
    if (qualStepName) {
      contributorData.forEach(item => {
        if (!item.qualStepName) {
          item.qualStepName = qualStepName;
        }
      });
    }
    
    // Sort by Project Objective, then Contributor Name
    contributorData.sort((a, b) => {
      const poCompare = (a.projectObjectiveName || '').localeCompare(b.projectObjectiveName || '');
      if (poCompare !== 0) return poCompare;
      return (a.contributorName || '').localeCompare(b.contributorName || '');
    });
    
    res.json({
      success: true,
      contributors: contributorData,
      count: contributorData.length
    });
  } catch (error) {
    console.error('[Active Contributors by Qual Step] Error fetching contributor names:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contributor names'
    });
  }
}));

module.exports = router;

