const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/roles');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./updateObjectFields/utils');
const { buildSOQLWhereClause } = require('./reports/filterUtils');
const { groupRecords } = require('./reports/groupUtils');
const fs = require('fs');
const path = require('path');

// Helper to get reports file path
const getReportsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'reports-history.json');
};

// Load reports history
const loadReportsHistory = () => {
  const filePath = getReportsPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Reports] Error loading history:', error);
    return [];
  }
};

// Save reports history
const saveReportsHistory = (reports) => {
  const filePath = getReportsPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Reports] Error saving history:', error);
    return false;
  }
};

// Preview report data (does not save to history)
router.post('/preview', authenticate, requirePermission(PERMISSIONS.VIEW_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { objectType, fields, filters, sortBy, sortOrder, groupBy, limit, fieldLabels } = req.body;
    
    if (!objectType || !fields || fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Object type and fields are required'
      });
    }

    const objectName = objectNameMap[objectType.toLowerCase()];
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);

    // Check if we need aggregate queries for count fields
    const countFields = [
      'Active_Contributors__c', 
      'Applied_Contributors__c', 
      'Qualified_Contributors__c',
      'Removed__c',
      'Active_Contributors_c__c', 
      'Applied_Contributors_c__c',
      'Qualified_Contributors_c__c',
      'Removed_c__c'
    ];
    const hasCountFields = fields.some(f => countFields.includes(f));
    
    let finalRecords = [];
    let fieldLabelMap = fieldLabels || {};
    let queryResult = null; // Track query result for hasMore calculation
    let allRecords = []; // Track all records for hasMore calculation
    let recordLimit = 0; // Track record limit for hasMore calculation

    if (hasCountFields && objectName === 'Project__c') {
      // For count fields on Project, we need to aggregate from Contributor_Project__c
      // Get projects first - include ALL selected fields, not just Id and Name
      // Filter out count fields that will be calculated separately
      const countFieldNames = ['Active_Contributors__c', 'Applied_Contributors__c', 'Qualified_Contributors__c', 'Removed__c',
                               'Active_Contributors_c__c', 'Applied_Contributors_c__c', 'Qualified_Contributors_c__c', 'Removed_c__c'];
      const nonCountFields = fields.filter(f => !countFieldNames.includes(f));
      
      // Always include Id and Name, plus any other selected non-count fields
      const projectFields = ['Id', 'Name', ...nonCountFields];
      
      // If Account__c is selected, also include Account__r.Name for Project objects
      if (nonCountFields.includes('Account__c') && !projectFields.includes('Account__r.Name')) {
        projectFields.push('Account__r.Name');
      }
      
      const uniqueProjectFields = [...new Set(projectFields)]; // Remove duplicates
      const projectFieldList = uniqueProjectFields.join(', ');
      
      let projectQuery = `SELECT ${projectFieldList} FROM ${objectName}`;
      const whereConditions = [];
      
      // Use advanced filter structure if available
      const whereClause = buildSOQLWhereClause(filters);
      if (whereClause) {
        projectQuery += ` WHERE ${whereClause}`;
      } else if (filters && typeof filters === 'object' && !filters.groups) {
        // Old simple filter format
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== '' && value !== '--None--') {
            if (Array.isArray(value) && value.length > 0) {
              const values = value.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
              whereConditions.push(`${key} IN (${values})`);
            } else {
              whereConditions.push(`${key} = '${String(value).replace(/'/g, "''")}'`);
            }
          }
        });
        if (whereConditions.length > 0) {
          projectQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }
      }
      
      const recordLimit = Math.min(limit || 1000, 10000);
      projectQuery += ` LIMIT ${recordLimit}`;
      
      const projectsResult = await conn.query(projectQuery);
      const projects = projectsResult.records || [];
      
      // Build fieldLabelMap from field metadata for all selected fields
      try {
        const describeResult = await conn.sobject(objectName).describe();
        describeResult.fields.forEach(f => {
          if (fields.includes(f.name) && !fieldLabelMap[f.name]) {
            fieldLabelMap[f.name] = f.label || f.name;
          }
        });
        // Always add Id and Name labels (they're always in the query)
        if (!fieldLabelMap['Id']) {
          const idField = describeResult.fields.find(f => f.name === 'Id');
          fieldLabelMap['Id'] = idField?.label || 'Record ID';
        }
        if (!fieldLabelMap['Name']) {
          const nameField = describeResult.fields.find(f => f.name === 'Name');
          fieldLabelMap['Name'] = nameField?.label || 'Name';
        }
        console.log('[Reports Preview] Built fieldLabelMap from metadata:', Object.keys(fieldLabelMap).length, 'fields');
        // Explicitly add count field labels if not present
        if (!fieldLabelMap['Active_Contributors__c']) fieldLabelMap['Active_Contributors__c'] = 'Active Contributors';
        if (!fieldLabelMap['Active_Contributors_c__c']) fieldLabelMap['Active_Contributors_c__c'] = 'Active Contributors';
        if (!fieldLabelMap['Applied_Contributors__c']) fieldLabelMap['Applied_Contributors__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Applied_Contributors_c__c']) fieldLabelMap['Applied_Contributors_c__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Qualified_Contributors__c']) fieldLabelMap['Qualified_Contributors__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Qualified_Contributors_c__c']) fieldLabelMap['Qualified_Contributors_c__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Removed__c']) fieldLabelMap['Removed__c'] = 'Removed';
        if (!fieldLabelMap['Removed_c__c']) fieldLabelMap['Removed_c__c'] = 'Removed';
        console.log('[Reports Generate] Field labels after adding count fields:', Object.keys(fieldLabelMap).filter(k => k.includes('Contributor') || k.includes('Removed')));
      } catch (describeError) {
        console.warn('[Reports Generate] Could not describe object to build fieldLabelMap:', describeError.message);
        // Add count field labels even if describe fails
        if (!fieldLabelMap['Active_Contributors__c']) fieldLabelMap['Active_Contributors__c'] = 'Active Contributors';
        if (!fieldLabelMap['Active_Contributors_c__c']) fieldLabelMap['Active_Contributors_c__c'] = 'Active Contributors';
        if (!fieldLabelMap['Applied_Contributors__c']) fieldLabelMap['Applied_Contributors__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Applied_Contributors_c__c']) fieldLabelMap['Applied_Contributors_c__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Qualified_Contributors__c']) fieldLabelMap['Qualified_Contributors__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Qualified_Contributors_c__c']) fieldLabelMap['Qualified_Contributors_c__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Removed__c']) fieldLabelMap['Removed__c'] = 'Removed';
        if (!fieldLabelMap['Removed_c__c']) fieldLabelMap['Removed_c__c'] = 'Removed';
      }
      
      // Add common field labels
      if (!fieldLabelMap['Id']) fieldLabelMap['Id'] = 'Record ID';
      if (!fieldLabelMap['Name']) fieldLabelMap['Name'] = 'Name';
      
      // Check if the specific project is in the results
      const falconProject = projects.find(p => p.Name && p.Name.includes('Falcon Background Gen Guardrail'));
      if (falconProject) {
        console.log(`[Reports] Found Falcon project:`, falconProject.Id, falconProject.Name);
      } else {
        console.warn(`[Reports] Falcon project NOT found in project query results`);
        console.log(`[Reports] Project names in results:`, projects.map(p => p.Name).slice(0, 10));
      }
      
      // Optimize: Batch all project IDs and get counts in fewer queries
      if (projects.length === 0) {
        finalRecords = [];
      } else {
        const projectIds = projects.map(p => p.Id);
        
        console.log(`[Reports Preview] ========== COUNT QUERIES DEBUG ==========`);
        console.log(`[Reports Preview] Total projects found: ${projects.length}`);
        console.log(`[Reports Preview] Project IDs (first 5):`, projectIds.slice(0, 5));
        if (falconProject) {
          console.log(`[Reports Preview] Falcon project ID: ${falconProject.Id}`);
          console.log(`[Reports Preview] Falcon project ID in projectIds:`, projectIds.includes(falconProject.Id));
        }
        
        // Check which count fields are selected
        const hasActive = fields.some(f => f === 'Active_Contributors__c' || f === 'Active_Contributors_c__c');
        const hasApplied = fields.some(f => f === 'Applied_Contributors__c' || f === 'Applied_Contributors_c__c');
        const hasQualified = fields.some(f => f === 'Qualified_Contributors__c' || f === 'Qualified_Contributors_c__c');
        const hasRemoved = fields.some(f => f === 'Removed__c' || f === 'Removed_c__c');
        
        console.log(`[Reports Preview] Count fields selected:`, {
          hasActive,
          hasApplied,
          hasQualified,
          hasRemoved,
          selectedFields: fields.filter(f => f.includes('Contributor') || f.includes('Removed'))
        });
        
        // Build maps: projectId -> count
        const countsMap = {
          active: {},
          applied: {},
          qualified: {},
          removed: {}
        };
        
        // Batch project IDs to avoid URI too long errors (max ~200 IDs per query)
        const BATCH_SIZE = 200;
        const batches = [];
        for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
          batches.push(projectIds.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`[Reports Preview] Processing ${batches.length} batches of project IDs (${BATCH_SIZE} per batch)`);
        
        try {
          // Process each batch
          for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            const batchIdsStr = batch.map(id => `'${id}'`).join(', ');
            
            const batchQueries = [];
            const batchQueryKeys = [];
            
            if (hasActive) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) AND Status__c = 'Active' GROUP BY Project__c`);
              batchQueryKeys.push('active');
            }
            
            if (hasApplied) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) GROUP BY Project__c`);
              batchQueryKeys.push('applied');
            }
            
            if (hasQualified) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) AND Status__c = 'Qualified' GROUP BY Project__c`);
              batchQueryKeys.push('qualified');
            }
            
            if (hasRemoved) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) AND Status__c = 'Removed' GROUP BY Project__c`);
              batchQueryKeys.push('removed');
            }
            
            // Execute batch queries in parallel
            if (batchQueries.length > 0) {
              console.log(`[Reports Preview] Executing batch ${batchIdx + 1}/${batches.length} with ${batchQueries.length} queries`);
              const batchResults = await Promise.all(batchQueries.map(q => conn.query(q)));
              
              // Process batch results
              batchResults.forEach((result, idx) => {
                const key = batchQueryKeys[idx];
                (result.records || []).forEach(rec => {
                  const projectId = rec.Project__c;
                  if (!projectId) return;
                  
                  // Extract count value
                  let count = 0;
                  if (rec.cnt !== undefined && rec.cnt !== null) {
                    count = typeof rec.cnt === 'number' ? rec.cnt : parseInt(rec.cnt, 10) || 0;
                  } else if (rec.expr0 !== undefined && rec.expr0 !== null) {
                    count = typeof rec.expr0 === 'number' ? rec.expr0 : parseInt(rec.expr0, 10) || 0;
                  } else if (rec.expr1 !== undefined && rec.expr1 !== null) {
                    count = typeof rec.expr1 === 'number' ? rec.expr1 : parseInt(rec.expr1, 10) || 0;
                  } else {
                    const numericFields = Object.keys(rec).filter(k => {
                      const val = rec[k];
                      return (typeof val === 'number' || (typeof val === 'string' && !isNaN(val))) && k !== 'attributes' && k !== 'Project__c';
                    });
                    if (numericFields.length > 0) {
                      const val = rec[numericFields[0]];
                      count = typeof val === 'number' ? val : parseInt(val, 10) || 0;
                    }
                  }
                  
                  // Merge counts (in case a project appears in multiple batches, sum them)
                  countsMap[key][projectId] = (countsMap[key][projectId] || 0) + count;
                });
              });
            }
          }
          
          console.log(`[Reports Preview] ========== COUNT QUERY RESULTS ==========`);
          console.log(`[Reports Preview] Final countsMap summary:`, {
            activeProjects: Object.keys(countsMap.active).length,
            appliedProjects: Object.keys(countsMap.applied).length,
            qualifiedProjects: Object.keys(countsMap.qualified).length,
            removedProjects: Object.keys(countsMap.removed).length
          });
          
          if (falconProject) {
            console.log(`[Reports Preview] Falcon project counts:`, {
              active: countsMap.active[falconProject.Id] || 0,
              applied: countsMap.applied[falconProject.Id] || 0,
              qualified: countsMap.qualified[falconProject.Id] || 0,
              removed: countsMap.removed[falconProject.Id] || 0
            });
          }
          
          console.log(`[Reports Preview] Project IDs in query:`, projects.map(p => p.Id));
          
          // Process each project
          console.log(`[Reports Preview] Processing ${projects.length} projects`);
          for (const project of projects) {
            const projectId = project.Id;
            const activeCount = countsMap.active[projectId] || 0;
            const appliedCount = countsMap.applied[projectId] || 0;
            const qualifiedCount = countsMap.qualified[projectId] || 0;
            const removedCount = countsMap.removed[projectId] || 0;
            
            // Log counts for debugging specific project
            if (project.Name && project.Name.includes('Falcon Background Gen Guardrail')) {
              console.log(`[Reports Preview] Project "${project.Name}" (${projectId}):`, {
                active: activeCount,
                applied: appliedCount,
                qualified: qualifiedCount,
                removed: removedCount,
                availableInCountsMap: {
                  active: projectId in countsMap.active,
                  applied: projectId in countsMap.applied,
                  qualified: projectId in countsMap.qualified,
                  removed: projectId in countsMap.removed
                },
                countsMapKeys: {
                  active: Object.keys(countsMap.active),
                  applied: Object.keys(countsMap.applied),
                  qualified: Object.keys(countsMap.qualified),
                  removed: Object.keys(countsMap.removed)
                }
              });
            }
            
            // Helper to check if field is in fields array (handles both naming conventions)
            const hasField = (fieldName) => {
              return fields.includes(fieldName) || fields.includes(fieldName.replace('__c', '_c__c'));
            };
            
            // Helper to get the actual field name as selected by user (handles both naming conventions)
            const getFieldName = (fieldName) => {
              if (fields.includes(fieldName)) {
                return fieldName;
              } else if (fields.includes(fieldName.replace('__c', '_c__c'))) {
                return fieldName.replace('__c', '_c__c');
              }
              return null;
            };
            
            // Create one record per project with total counts
            const record = { ...project };
            
            // Replace Account__c ID with Account__r.Name if available (for Project objects)
            if (fields.includes('Account__c')) {
              // Check if we have the Account name from the relationship
              if (record['Account__r.Name']) {
                // Replace Account__c ID with Account__r.Name
                record.Account__c = record['Account__r.Name'];
              } else if (record.Account__r && record.Account__r.Name) {
                // Fallback: get from nested Account__r object
                record.Account__c = record.Account__r.Name;
              }
            }
            
            // Log before setting values for Falcon project
            if (project.Name && project.Name.includes('Falcon Background Gen Guardrail')) {
              console.log(`[Reports Preview] Before setting counts for Falcon project:`, {
                projectId,
                activeCount,
                appliedCount,
                qualifiedCount,
                removedCount,
                hasActiveField: hasField('Active_Contributors__c'),
                hasQualifiedField: hasField('Qualified_Contributors__c'),
                hasRemovedField: hasField('Removed__c'),
                selectedFields: fields.filter(f => f.includes('Contributor') || f.includes('Removed'))
              });
            }
            
            // Always set the field if it's selected, using the exact field name as selected
            // Ensure values are numbers
            const activeFieldName = getFieldName('Active_Contributors__c');
            if (activeFieldName) {
              const value = typeof activeCount === 'number' ? activeCount : (parseInt(activeCount, 10) || 0);
              record[activeFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Preview] Set ${activeFieldName} = ${value} (from activeCount: ${activeCount})`);
              }
            }
            
            const appliedFieldName = getFieldName('Applied_Contributors__c');
            if (appliedFieldName) {
              const value = typeof appliedCount === 'number' ? appliedCount : (parseInt(appliedCount, 10) || 0);
              record[appliedFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Preview] Set ${appliedFieldName} = ${value} (from appliedCount: ${appliedCount})`);
              }
            }
            
            const qualifiedFieldName = getFieldName('Qualified_Contributors__c');
            if (qualifiedFieldName) {
              const value = typeof qualifiedCount === 'number' ? qualifiedCount : (parseInt(qualifiedCount, 10) || 0);
              record[qualifiedFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Preview] Set ${qualifiedFieldName} = ${value} (from qualifiedCount: ${qualifiedCount})`);
              }
            }
            
            const removedFieldName = getFieldName('Removed__c');
            if (removedFieldName) {
              const value = typeof removedCount === 'number' ? removedCount : (parseInt(removedCount, 10) || 0);
              record[removedFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Preview] Set ${removedFieldName} = ${value} (from removedCount: ${removedCount})`);
              }
            }
            
            // Log after setting values for Falcon project
            if (project.Name && project.Name.includes('Falcon Background Gen Guardrail')) {
              console.log(`[Reports Preview] ========== FALCON PROJECT DEBUG ==========`);
              console.log(`[Reports Preview] Project: ${project.Name} (${projectId})`);
              console.log(`[Reports Preview] Field names:`, {
                activeFieldName,
                appliedFieldName,
                qualifiedFieldName,
                removedFieldName
              });
              console.log(`[Reports Preview] Counts from map:`, {
                activeCount,
                appliedCount,
                qualifiedCount,
                removedCount
              });
              console.log(`[Reports Preview] Values in record:`, {
                active: record[activeFieldName],
                applied: record[appliedFieldName],
                qualified: record[qualifiedFieldName],
                removed: record[removedFieldName]
              });
              console.log(`[Reports Preview] All record keys:`, Object.keys(record));
              console.log(`[Reports Preview] Count fields in record:`, Object.keys(record).filter(k => k.includes('Contributor') || k.includes('Removed')));
            }
            
            finalRecords.push(record);
          }
          
          // Sort records in memory if sortBy is a count field (can't sort in SOQL)
          if (sortBy && countFields.includes(sortBy)) {
            console.log(`[Reports Preview] ========== SORTING BY COUNT FIELD ==========`);
            console.log(`[Reports Preview] Sort field: ${sortBy}, Order: ${sortOrder || 'ASC'}`);
            
            // Find the actual field name in the data (handle both __c and _c__c variants)
            let actualSortField = sortBy;
            if (finalRecords.length > 0) {
              const firstRecord = finalRecords[0];
              // Check if the exact field exists
              if (!(sortBy in firstRecord) || firstRecord[sortBy] === undefined) {
                // Try the alternative naming convention
                const altField = sortBy.includes('__c') 
                  ? sortBy.replace('__c', '_c__c')
                  : sortBy.replace('_c__c', '__c');
                if (altField in firstRecord && firstRecord[altField] !== undefined) {
                  actualSortField = altField;
                  console.log(`[Reports Preview] Using alternative field name for sorting: ${actualSortField} (original: ${sortBy})`);
                }
              }
            }
            
            console.log(`[Reports Preview] Records before sort: ${finalRecords.length}`);
            if (finalRecords.length > 0) {
              console.log(`[Reports Preview] First 3 records before sort:`, finalRecords.slice(0, 3).map(r => ({
                name: r.Name,
                sortValue: r[actualSortField],
                type: typeof r[actualSortField],
                allCountFields: Object.keys(r).filter(k => k.includes('Contributor') || k.includes('Removed'))
              })));
            }
            
            finalRecords.sort((a, b) => {
              const aValue = Number(a[actualSortField]) || 0;
              const bValue = Number(b[actualSortField]) || 0;
              const comparison = aValue - bValue;
              return sortOrder === 'DESC' ? -comparison : comparison;
            });
            
            console.log(`[Reports Preview] Records after sort: ${finalRecords.length}`);
            if (finalRecords.length > 0) {
              console.log(`[Reports Preview] First 3 records after sort:`, finalRecords.slice(0, 3).map(r => ({
                name: r.Name,
                sortValue: r[actualSortField],
                type: typeof r[actualSortField]
              })));
            }
          } else if (sortBy) {
            console.log(`[Reports Preview] Sort by ${sortBy} is not a count field, sorting handled in SOQL or will be done after`);
          }
        } catch (countError) {
          console.error('[Reports Preview] Error getting counts:', countError);
          // Fallback: add all projects with 0 counts
          projects.forEach(project => {
            const record = { ...project };
            
            // Replace Account__c ID with Account__r.Name if available (for Project objects)
            if (fields.includes('Account__c')) {
              // Check if we have the Account name from the relationship
              if (record['Account__r.Name']) {
                // Replace Account__c ID with Account__r.Name
                record.Account__c = record['Account__r.Name'];
              } else if (record.Account__r && record.Account__r.Name) {
                // Fallback: get from nested Account__r object
                record.Account__c = record.Account__r.Name;
              }
            }
            
            // Helper to get the actual field name as selected by user (handles both naming conventions)
            // Handles: Removed__c -> Removed_c__c, Active_Contributors__c -> Active_Contributors_c__c, etc.
            const getFieldName = (baseFieldName) => {
              // First check if the base field name (with __c) is selected
              if (fields.includes(baseFieldName)) {
                return baseFieldName;
              }
              // Then check if the _c__c variant is selected
              // For Removed__c -> Removed_c__c
              // For Active_Contributors__c -> Active_Contributors_c__c
              const variantFieldName = baseFieldName.replace('__c', '_c__c');
              if (fields.includes(variantFieldName)) {
                return variantFieldName;
              }
              return null;
            };
            
            const activeFieldName = getFieldName('Active_Contributors__c');
            if (activeFieldName) {
              record[activeFieldName] = 0;
            }
            
            const appliedFieldName = getFieldName('Applied_Contributors__c');
            if (appliedFieldName) {
              record[appliedFieldName] = 0;
            }
            
            const qualifiedFieldName = getFieldName('Qualified_Contributors__c');
            if (qualifiedFieldName) {
              record[qualifiedFieldName] = 0;
            }
            
            const removedFieldName = getFieldName('Removed__c');
            if (removedFieldName) {
              record[removedFieldName] = 0;
            }
            
            finalRecords.push(record);
          });
        }
      }
    } else {
      // Regular query for non-count fields or other objects
      // Handle relationship fields - if Account__c is selected, also include Account__r.Name
      const processedFields = [];
      const relationshipFields = [];
      const subqueryFields = {}; // Initialize subqueryFields object for subquery field tracking
      const standardRelationshipFields = ['Contact', 'Owner', 'CreatedBy', 'LastModifiedBy', 'Account', 'Parent'];
      
      // Separate standard fields from relationship fields
      fields.forEach(field => {
        // Check if it's a standard relationship field (e.g., Contact.Name, Owner.Name)
        const isStandardRelationship = standardRelationshipFields.some(rel => field.startsWith(`${rel}.`));
        if (isStandardRelationship) {
          // Add the relationship field as-is (e.g., Contact.Name, Owner.Name)
          if (!relationshipFields.includes(field)) {
            relationshipFields.push(field);
          }
          // Also ensure the base ID field is included for the relationship to work
          const baseField = field.split('.')[0];
          const idField = `${baseField}Id`;
          if (!processedFields.includes(idField) && !fields.includes(idField)) {
            processedFields.push(idField);
          }
        } else if (field.includes('__r.') || (field.includes('.') && !field.startsWith('Contact.') && !field.startsWith('Owner.'))) {
          // Custom relationship field (e.g., Account__r.Name) or multi-level (e.g., Account__r.Contact__r.Email)
          if (!relationshipFields.includes(field)) {
            relationshipFields.push(field);
          }
          // Ensure the base lookup field is included
          // Extract the first part before the first dot or __r
          let baseField;
          if (field.includes('__r.')) {
            baseField = field.split('__r.')[0] + '__c';
          } else if (field.includes('.')) {
            // For multi-level custom relationships like Account__r.Contact__r.Name
            const firstPart = field.split('.')[0];
            if (firstPart.endsWith('__r')) {
              baseField = firstPart.replace('__r', '__c');
            } else {
              // Standard relationship, already handled above
              return;
            }
          }
          
          if (baseField && !processedFields.includes(baseField) && !fields.includes(baseField)) {
            processedFields.push(baseField);
          }
        } else {
          // Regular field
          processedFields.push(field);
        }
      });
      
      // Check for lookup fields and add their relationship Name fields
      // First, get field metadata to determine which fields are actually lookup fields
      try {
        const describeResult = await conn.sobject(objectName).describe();
        const fieldMetadataMap = {};
        describeResult.fields.forEach(f => {
          fieldMetadataMap[f.name] = f;
        });
        
        // Check for lookup fields and add their relationship Name fields
        // Only do this if user hasn't explicitly selected relationship fields via RelationshipBrowser
        const hasExplicitRelationshipFields = fields.some(f => f.includes('__r.') || f.includes('.'));
        if (!hasExplicitRelationshipFields) {
          processedFields.forEach(field => {
            // If field is a lookup (ends with __c and not already a relationship)
            if (field.endsWith('__c') && !field.includes('__r') && !field.includes('Contributors')) {
              const fieldMetadata = fieldMetadataMap[field];
              // Only add relationship if field is actually a lookup/reference field
              if (fieldMetadata && (fieldMetadata.type === 'reference' || fieldMetadata.type === 'lookup')) {
                // Get the relationship name from metadata
                const relationshipName = fieldMetadata.relationshipName;
                console.log(`[Reports Preview] Field ${field} - relationshipName: ${relationshipName}, type: ${fieldMetadata.type}`);
                if (relationshipName) {
                  // If relationshipName already ends with __r, use it directly; otherwise add __r
                  const relationshipField = relationshipName.endsWith('__r') 
                    ? `${relationshipName}.Name` 
                    : `${relationshipName}__r.Name`;
                  // Only add if not already in fields or relationshipFields
                  if (!fields.includes(relationshipField) && !relationshipFields.includes(relationshipField)) {
                    relationshipFields.push(relationshipField);
                    console.log(`[Reports Preview] Added relationship field: ${relationshipField}`);
                  }
                } else {
                  // Fallback: try common pattern (e.g., Account__c -> Account__r.Name)
                  const baseField = field.replace('__c', '');
                  const relationshipField = `${baseField}__r.Name`;
                  // Only add if not already in fields or relationshipFields
                  if (!fields.includes(relationshipField) && !relationshipFields.includes(relationshipField)) {
                    relationshipFields.push(relationshipField);
                    console.log(`[Reports Preview] Added fallback relationship field: ${relationshipField}`);
                  }
                }
              }
            }
          });
        }
      } catch (describeError) {
        console.warn('[Reports Preview] Could not describe object to get field metadata, skipping relationship fields:', describeError.message);
        // Continue without relationship fields if describe fails
      }
      
      // Build subqueries for child relationships
      const subqueries = [];
      Object.keys(subqueryFields).forEach(relationshipName => {
        const childFields = subqueryFields[relationshipName];
        if (childFields.length > 0) {
          // Build subquery: (SELECT field1, field2 FROM relationshipName)
          const subquery = `(SELECT ${childFields.join(', ')} FROM ${relationshipName})`;
          subqueries.push(subquery);
        }
      });
      
      // Combine original fields with relationship fields and subqueries
      const allFields = [...processedFields, ...relationshipFields, ...subqueries];
      const fieldList = allFields.join(', ');
      let query = `SELECT ${fieldList} FROM ${objectName}`;
      
      // Build fieldLabelMap from field metadata if not provided or incomplete
      // Also handle relationship fields and subquery fields in fieldLabelMap
      if (!fieldLabelMap || Object.keys(fieldLabelMap).length === 0 || fields.some(f => !fieldLabelMap[f])) {
        try {
          const describeResult = await conn.sobject(objectName).describe();
          describeResult.fields.forEach(f => {
            if (fields.includes(f.name) && !fieldLabelMap[f.name]) {
              fieldLabelMap[f.name] = f.label || f.name;
            }
          });
          
          // For relationship fields, try to get labels from related objects
          relationshipFields.forEach(relField => {
            if (!fieldLabelMap[relField]) {
              // Try to extract object and field name from relationship path
              // e.g., Account__r.Name -> Account.Name, Contact__r.Email -> Contact.Email
              const parts = relField.split('.');
              if (parts.length >= 2) {
                const relObjectName = parts[0].replace('__r', '');
                const fieldName = parts[parts.length - 1];
                // Try to describe the related object to get field label
                // For now, use a readable format
                fieldLabelMap[relField] = `${relObjectName} ${fieldName}`;
              } else {
                fieldLabelMap[relField] = relField;
              }
            }
          });
          
          // For subquery fields, create labels
          Object.keys(subqueryFields).forEach(relationshipName => {
            const childFields = subqueryFields[relationshipName];
            childFields.forEach(childField => {
              const subqueryFieldKey = `SUBQUERY:${relationshipName}.${childField}`;
              fieldLabelMap[subqueryFieldKey] = `${relationshipName} ${childField}`;
              // Also add labels for flattened fields
              fieldLabelMap[`${relationshipName}.${childField}`] = `${relationshipName} ${childField}`;
              fieldLabelMap[`${relationshipName}.${childField}.Count`] = `${relationshipName} ${childField} Count`;
            });
            fieldLabelMap[`${relationshipName}.Count`] = `${relationshipName} Count`;
          });
          
          console.log('[Reports Preview] Built fieldLabelMap from metadata:', Object.keys(fieldLabelMap).length, 'fields');
        } catch (describeError) {
          console.warn('[Reports Preview] Could not describe object to build fieldLabelMap:', describeError.message);
        }
      }
      
      // Debug: Log relationship fields for Account
      if (fields.includes('Account__c') || fields.some(f => f.includes('Account'))) {
        console.log('[Reports Preview] Account relationship fields:', {
          originalFields: fields,
          relationshipFields: relationshipFields,
          allFields: allFields,
          query: query
        });
      }

      // Add WHERE clause for filters (supports both old and new filter formats)
      const whereClause = buildSOQLWhereClause(filters);
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      // Add GROUP BY (Note: Salesforce SOQL doesn't support GROUP BY, so we'll group in memory)
      // For now, we'll order by groupBy field if specified, then group in memory
      if (groupBy) {
        // Ensure groupBy field is in the SELECT clause (check both original and relationship fields)
        const groupByInFields = fields.includes(groupBy) || allFields.includes(groupBy);
        if (!groupByInFields) {
          query = query.replace(`SELECT ${fieldList}`, `SELECT ${fieldList}, ${groupBy}`);
        }
        // Order by groupBy field first for easier grouping
        if (sortBy && sortBy !== groupBy) {
          query += ` ORDER BY ${groupBy} ASC, ${sortBy} ${sortOrder || 'ASC'}`;
        } else {
          query += ` ORDER BY ${groupBy} ASC`;
        }
      } else if (sortBy) {
        // Add ORDER BY - handle relationship fields
        // For relationship fields in ORDER BY, use the full path
        query += ` ORDER BY ${sortBy} ${sortOrder || 'ASC'}`;
      }

      // Add LIMIT - use provided limit or default to 10000
      recordLimit = Math.min(limit || 10000, 10000); // Max 10000 for preview
      query += ` LIMIT ${recordLimit}`;

      console.log('[Reports Preview] Executing preview query:', query);

      // Execute query
      const result = await conn.query(query);
      const records = result.records || [];
      
      // Debug: Log first record structure for Account field
      if (fields.includes('Account__c') && records.length > 0) {
        console.log('[Reports Preview] First record structure:', {
          recordKeys: Object.keys(records[0]),
          accountFields: Object.keys(records[0]).filter(k => k.toLowerCase().includes('account')),
          accountValue: records[0].Account__c,
          accountRelFields: Object.keys(records[0]).filter(k => k.includes('Account') && (k.includes('Name') || k.includes('name')))
        });
      }

      // Fetch all pages to get complete dataset - no page limit
      allRecords = [...records];
      queryResult = result;
      let pageCount = 0;
      // Fetch all pages until done or limit reached
      while (queryResult.done === false && queryResult.nextRecordsUrl && allRecords.length < recordLimit) {
        queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
        allRecords = allRecords.concat(queryResult.records || []);
        pageCount++;
        // Safety limit to prevent infinite loops (1000 pages = ~2M records)
        if (pageCount > 1000) {
          console.warn('[Reports Preview] Reached safety limit of 1000 pages');
          break;
        }
      }

      // Limit to requested limit
      finalRecords = allRecords.slice(0, recordLimit);
    }

    // Ensure fieldLabelMap is always an object
    if (!fieldLabelMap || typeof fieldLabelMap !== 'object') {
      fieldLabelMap = {};
    }
    
    // Add field labels for count fields if not already present
    // Add field labels for count fields (handle both naming conventions)
    if (!fieldLabelMap['Active_Contributors__c']) {
      fieldLabelMap['Active_Contributors__c'] = 'Active Contributors';
    }
    if (!fieldLabelMap['Active_Contributors_c__c']) {
      fieldLabelMap['Active_Contributors_c__c'] = 'Active Contributors';
    }
    if (!fieldLabelMap['Applied_Contributors__c']) {
      fieldLabelMap['Applied_Contributors__c'] = 'Applied Contributors';
    }
    if (!fieldLabelMap['Applied_Contributors_c__c']) {
      fieldLabelMap['Applied_Contributors_c__c'] = 'Applied Contributors';
    }
    if (!fieldLabelMap['Qualified_Contributors__c']) {
      fieldLabelMap['Qualified_Contributors__c'] = 'Qualified Contributors';
    }
    if (!fieldLabelMap['Qualified_Contributors_c__c']) {
      fieldLabelMap['Qualified_Contributors_c__c'] = 'Qualified Contributors';
    }
    if (!fieldLabelMap['Removed__c']) {
      fieldLabelMap['Removed__c'] = 'Removed';
    }
    if (!fieldLabelMap['Removed_c__c']) {
      fieldLabelMap['Removed_c__c'] = 'Removed';
    }
    
    // Add common field labels
    if (!fieldLabelMap['Id']) {
      fieldLabelMap['Id'] = 'Record ID';
    }
    if (!fieldLabelMap['Name']) {
      fieldLabelMap['Name'] = 'Name';
    }

    // Remove Salesforce attributes and clean up records
    let cleanedRecords = finalRecords.map(record => {
      const cleaned = { ...record };
      // Remove attributes field (Salesforce metadata)
      delete cleaned.attributes;
      
      // Handle relationship fields - flatten nested relationship objects
      // Salesforce returns relationship fields as nested objects (e.g., Account__r: { Name: "Meta" }, Contact: { Name: "John" })
      // We need to flatten them to Account__r.Name, Contact.Name, Owner.Name, etc. for easier access
      
      // Handle subquery results - these come as arrays of records (PREVIEW ENDPOINT)
      Object.keys(subqueryFields).forEach(relationshipName => {
        const childFields = subqueryFields[relationshipName];
        if (cleaned[relationshipName] && Array.isArray(cleaned[relationshipName])) {
          const childRecords = cleaned[relationshipName];
          if (childRecords.length > 0) {
            cleaned[`${relationshipName}.Count`] = childRecords.length;
            childFields.forEach(childField => {
              const values = childRecords
                .map(record => record[childField])
                .filter(val => val !== null && val !== undefined);
              if (values.length > 0) {
                cleaned[`${relationshipName}.${childField}`] = values.join(', ');
                cleaned[`${relationshipName}.${childField}.Count`] = values.length;
              }
            });
          } else {
            cleaned[`${relationshipName}.Count`] = 0;
            childFields.forEach(childField => {
              cleaned[`${relationshipName}.${childField}`] = '';
              cleaned[`${relationshipName}.${childField}.Count`] = 0;
            });
          }
        }
      });
      
      // First, flatten all relationship fields that were explicitly selected
      relationshipFields.forEach(relField => {
        // Extract the relationship object name and field name
        // e.g., Account__r.Name -> Account__r, Name
        // e.g., Contact.Name -> Contact, Name
        // e.g., Account__r.Contact__r.Email -> Account__r.Contact__r, Email
        const parts = relField.split('.');
        if (parts.length >= 2) {
          const relObjectPath = parts.slice(0, -1).join('.'); // Everything except last part
          const fieldName = parts[parts.length - 1]; // Last part is the field name
          
          // Navigate through nested relationship objects
          let currentValue = cleaned;
          const pathParts = relObjectPath.split('.');
          let found = true;
          
          for (const part of pathParts) {
            if (currentValue[part] && typeof currentValue[part] === 'object' && !Array.isArray(currentValue[part])) {
              currentValue = currentValue[part];
            } else {
              found = false;
              break;
            }
          }
          
          // If we found the nested object, extract the field value
          if (found && currentValue && currentValue[fieldName] !== undefined) {
            cleaned[relField] = currentValue[fieldName];
          }
        }
      });
      
      // Also handle any relationship objects that weren't explicitly selected but exist in the data
      Object.keys(cleaned).forEach(key => {
        const value = cleaned[key];
        // If value is an object and has Name property, it's likely a relationship
        // This handles both custom (__r) and standard (Contact, Owner, etc.) relationship fields
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && value !== null) {
          // Flatten all properties of the relationship object
          Object.keys(value).forEach(prop => {
            const flattenedKey = `${key}.${prop}`;
            // Only add if not already flattened and if it's a simple value
            if (cleaned[flattenedKey] === undefined && 
                (typeof value[prop] !== 'object' || value[prop] instanceof Date)) {
              cleaned[flattenedKey] = value[prop];
            }
          });
        }
      });
      
      // Handle multi-level relationships (e.g., Account__r.Contact__r.Email)
      // Check for nested relationship objects and flatten them
      Object.keys(cleaned).forEach(key => {
        if (key.endsWith('__r') && cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
          const relObj = cleaned[key];
          Object.keys(relObj).forEach(prop => {
            // If the property is itself a relationship object, flatten it further
            if (relObj[prop] && typeof relObj[prop] === 'object' && !Array.isArray(relObj[prop]) && !(relObj[prop] instanceof Date)) {
              Object.keys(relObj[prop]).forEach(nestedProp => {
                const flattenedKey = `${key}.${prop}.${nestedProp}`;
                if (cleaned[flattenedKey] === undefined && 
                    (typeof relObj[prop][nestedProp] !== 'object' || relObj[prop][nestedProp] instanceof Date)) {
                  cleaned[flattenedKey] = relObj[prop][nestedProp];
                }
              });
            }
          });
        }
      });
      
      // Replace Account__c ID with Account__r.Name if available (for Project objects)
      if (objectName === 'Project__c' && fields.includes('Account__c')) {
        // Check if we have the Account name from the relationship
        if (cleaned['Account__r.Name']) {
          // Replace Account__c ID with Account__r.Name
          cleaned.Account__c = cleaned['Account__r.Name'];
        } else if (cleaned.Account__r && cleaned.Account__r.Name) {
          // Fallback: get from nested Account__r object
          cleaned.Account__c = cleaned.Account__r.Name;
        }
      }
      
      // Debug: Log Account field flattening for first record
      if (fields.some(f => f.includes('Account')) && cleaned.Account__c) {
        console.log('[Reports Preview] Account field after replacement:', {
          Account__c: cleaned.Account__c,
          Account__r: cleaned.Account__r,
          'Account__r.Name': cleaned['Account__r.Name'],
          'Account.Name': cleaned['Account.Name'],
          allAccountFields: Object.keys(cleaned).filter(k => k.toLowerCase().includes('account'))
        });
      }
      
      // Ensure count fields are numbers - check all possible field names dynamically
      // Don't set to 0 if undefined, only convert to number if value exists
      const countFieldNames = [
        'Active_Contributors__c', 'Active_Contributors_c__c',
        'Applied_Contributors__c', 'Applied_Contributors_c__c',
        'Qualified_Contributors__c', 'Qualified_Contributors_c__c',
        'Removed__c', 'Removed_c__c'
      ];
      
      countFieldNames.forEach(fieldName => {
        if (cleaned[fieldName] !== undefined && cleaned[fieldName] !== null) {
          // Convert to number if not already a number, preserve the value
          if (typeof cleaned[fieldName] !== 'number') {
            const numValue = typeof cleaned[fieldName] === 'string' 
              ? parseInt(cleaned[fieldName], 10) 
              : Number(cleaned[fieldName]);
            // Only update if conversion is successful, otherwise keep original
            cleaned[fieldName] = isNaN(numValue) ? cleaned[fieldName] : numValue;
          }
        }
      });
      
      return cleaned;
    });

    // Apply sorting for flattened subquery fields (in memory, after data is fetched)
    if (sortBy && cleanedRecords.length > 0) {
      const isFlattenedSubqueryField = sortBy.includes('.') && 
        Object.keys(subqueryFields).some(relName => sortBy.startsWith(`${relName}.`));
      
      if (isFlattenedSubqueryField) {
        // Sort in memory for flattened subquery fields
        cleanedRecords.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          
          // Handle numeric fields (like Count)
          if (sortBy.endsWith('.Count')) {
            const aNum = typeof aValue === 'number' ? aValue : (parseInt(aValue, 10) || 0);
            const bNum = typeof bValue === 'number' ? bValue : (parseInt(bValue, 10) || 0);
            return sortOrder === 'DESC' ? bNum - aNum : aNum - bNum;
          }
          
          // Handle string fields
          const aStr = aValue !== null && aValue !== undefined ? String(aValue) : '';
          const bStr = bValue !== null && bValue !== undefined ? String(bValue) : '';
          const comparison = aStr.localeCompare(bStr);
          return sortOrder === 'DESC' ? -comparison : comparison;
        });
      }
    }
    
    // Apply grouping if specified (after cleaning records)
    if (groupBy && cleanedRecords.length > 0) {
      cleanedRecords = groupRecords(cleanedRecords, groupBy);
      // Keep group header markers for frontend display, but clean up other metadata
      cleanedRecords = cleanedRecords.map(record => {
        const cleaned = { ...record };
        // Keep _isGroupHeader, _groupKey, _groupByField for frontend grouping display
        // Only remove _isSubtotal if not needed
        if (cleaned._isSubtotal && !cleaned._isGroupHeader) {
          delete cleaned._isSubtotal;
        }
        return cleaned;
      });
    }

    // Preview does NOT save to history
    console.log('[Reports Preview] ========== RETURNING PREVIEW DATA ==========');
    console.log('[Reports Preview] Record count:', cleanedRecords.length);
    console.log('[Reports Preview] Field labels count:', Object.keys(fieldLabelMap).length);
    console.log('[Reports Preview] Sample field labels:', Object.entries(fieldLabelMap).slice(0, 10));
    if (cleanedRecords.length > 0) {
      const sampleRecord = cleanedRecords[0];
      console.log('[Reports Preview] Sample record keys:', Object.keys(sampleRecord));
      const countFieldsInRecord = Object.keys(sampleRecord).filter(k => k.includes('Contributor') || k.includes('Removed'));
      console.log('[Reports Preview] Count fields in sample record:', countFieldsInRecord);
      countFieldsInRecord.forEach(field => {
        console.log(`[Reports Preview] Sample record ${field}:`, sampleRecord[field], 'type:', typeof sampleRecord[field]);
      });
    }

    res.json({
      success: true,
      records: cleanedRecords,
      count: cleanedRecords.length,
      fieldLabels: fieldLabelMap,
      hasMore: allRecords.length > recordLimit || (queryResult && !queryResult.done)
    });
  } catch (error) {
    console.error('[Reports Preview] Error previewing report:', error);
    console.error('[Reports Preview] Error stack:', error.stack);
    console.error('[Reports Preview] Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview report',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Preview multi-object report data
router.post('/preview-multi', authenticate, requirePermission(PERMISSIONS.VIEW_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { objects, sortBy, sortOrder, groupBy, limit } = req.body;
    
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Objects array is required'
      });
    }

    // Validate each object has required fields
    for (const obj of objects) {
      if (!obj.objectType || !obj.fields || obj.fields.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Object ${obj.objectType || 'unknown'} must have objectType and fields`
        });
      }
    }

    const conn = await getSalesforceConnection(req.user.id);
    const objectNameMap = {
      'project': 'Project__c',
      'project objective': 'Project_Objective__c',
      'contributor project': 'Contributor_Project__c',
      'contributor': 'Contact',
      'cases': 'Case'
    };

    // Query each object separately
    const objectResults = [];
    const fieldLabelMaps = {};

    for (const objConfig of objects) {
      const objectType = objConfig.objectType.toLowerCase();
      const objectName = objectNameMap[objectType];
      
      if (!objectName) {
        return res.status(400).json({
          success: false,
          error: `Invalid object type: ${objConfig.objectType}`
        });
      }

      // Build query for this object
      const fields = objConfig.fields || [];
      
      // Validate fields exist on this object before querying
      let validFields = [];
      try {
        const describeResult = await conn.sobject(objectName).describe();
        const availableFieldNames = new Set(describeResult.fields.map(f => f.name));
        
        // Filter to only include fields that exist on this object
        validFields = fields.filter(field => {
          // Check if field exists as-is first
          if (availableFieldNames.has(field)) {
            return true;
          }
          // Remove any object prefixes that might have been added (case-insensitive)
          // Handle patterns like "project_", "project objective_", "contributor project_", etc.
          const cleanField = field.replace(/^(project|project objective|contributor project|contributor|cases)[_\s]+/i, '');
          if (cleanField !== field && availableFieldNames.has(cleanField)) {
            return true;
          }
          // Field doesn't exist on this object
          return false;
        });
        
        if (validFields.length === 0) {
          console.warn(`[Reports Preview Multi] No valid fields found for ${objectName}, skipping...`);
          continue; // Skip this object if no valid fields
        }
        
        // Log any invalid fields
        const invalidFields = fields.filter(f => {
          if (availableFieldNames.has(f)) {
            return false;
          }
          const cleanField = f.replace(/^(project|project objective|contributor project|contributor|cases)[_\s]+/i, '');
          return !availableFieldNames.has(cleanField);
        });
        if (invalidFields.length > 0) {
          console.warn(`[Reports Preview Multi] Invalid fields for ${objectName}:`, invalidFields);
        }
      } catch (describeError) {
        console.error(`[Reports Preview Multi] Could not describe ${objectName} to validate fields:`, describeError.message);
        // If describe fails, we cannot validate fields, so skip this object
        console.warn(`[Reports Preview Multi] Skipping ${objectName} due to describe failure`);
        continue;
      }
      
      // Ensure we have valid fields before proceeding
      if (!validFields || validFields.length === 0) {
        console.warn(`[Reports Preview Multi] No valid fields for ${objectName} after validation, skipping...`);
        continue;
      }
      
      // For Project objects, if Account__c is selected, also include Account__r.Name
      let queryFields = [...validFields];
      if (objectName === 'Project__c' && validFields.includes('Account__c') && !validFields.includes('Account__r.Name')) {
        queryFields.push('Account__r.Name');
        console.log(`[Reports Preview Multi] Added Account__r.Name for Project__c`);
      }
      
      const fieldList = queryFields.join(', ');
      let query = `SELECT ${fieldList} FROM ${objectName}`;

      // Add filters
      const whereClause = buildSOQLWhereClause(objConfig.filters || {});
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      // Add limit
      const recordLimit = Math.min(limit || 10000, 10000);
      query += ` LIMIT ${recordLimit}`;

      console.log(`[Reports Preview Multi] Querying ${objectName}:`, query);
      console.log(`[Reports Preview Multi] Valid fields for ${objectName}:`, validFields);
      console.log(`[Reports Preview Multi] Original fields for ${objectName}:`, fields);

      // Execute query
      let queryResult;
      let records = [];
      try {
        queryResult = await conn.query(query);
        records = queryResult.records || [];
      } catch (queryError) {
        console.error(`[Reports Preview Multi] Query error for ${objectName}:`, queryError.message);
        console.error(`[Reports Preview Multi] Query was:`, query);
        console.error(`[Reports Preview Multi] Fields were:`, validFields);
        throw new Error(`Failed to query ${objectName}: ${queryError.message}. Fields: ${validFields.join(', ')}`);
      }

      // Get field labels
      try {
        const describeResult = await conn.sobject(objectName).describe();
        const fieldLabelMap = {};
        describeResult.fields.forEach(f => {
          if (validFields.includes(f.name)) {
            fieldLabelMap[f.name] = f.label || f.name;
          }
        });
        fieldLabelMaps[objectName] = fieldLabelMap;
      } catch (describeError) {
        console.warn(`[Reports Preview Multi] Could not describe ${objectName}:`, describeError.message);
      }

      // Prefix field names with object type to avoid conflicts
      const prefixedRecords = records.map(record => {
        const prefixed = {};
        
        // Handle relationship fields first - flatten nested objects
        Object.keys(record).forEach(key => {
          const value = record[key];
          // If value is an object and has Name property, it's likely a relationship
          if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && value !== null) {
            // Flatten relationship objects (e.g., Account__r: { Name: "Meta" } -> Account__r.Name)
            Object.keys(value).forEach(prop => {
              const flattenedKey = `${key}.${prop}`;
              if (typeof value[prop] !== 'object' || value[prop] instanceof Date) {
                record[flattenedKey] = value[prop];
              }
            });
          }
        });
        
        validFields.forEach(field => {
          let fieldValue = record[field];
          
          // For Account__c field in Project objects, replace ID with Name if available
          if (objectName === 'Project__c' && field === 'Account__c') {
            // Check if we have Account__r.Name from the relationship
            if (record['Account__r.Name']) {
              fieldValue = record['Account__r.Name'];
            } else if (record.Account__r && record.Account__r.Name) {
              fieldValue = record.Account__r.Name;
            }
          }
          
          if (fieldValue !== undefined) {
            const prefixedFieldName = `${objConfig.objectType}_${field}`;
            prefixed[prefixedFieldName] = fieldValue;
          }
        });
        
        // Also add Id for joining
        if (record.Id) {
          prefixed[`${objConfig.objectType}_Id`] = record.Id;
        }
        return prefixed;
      });

      objectResults.push({
        objectType: objConfig.objectType,
        objectName,
        records: prefixedRecords,
        fieldLabels: fieldLabelMaps[objectName] || {}
      });
    }

    // Join records based on relationships
    // For now, we'll do a simple cartesian join if there are relationships
    // In a real implementation, you'd want to join on specific relationship fields
    let joinedRecords = [];

    if (objectResults.length === 1) {
      // Single object - no joining needed
      joinedRecords = objectResults[0].records;
    } else {
      // Multi-object: Try to join based on common relationship fields
      // Start with the first object as the base
      let baseRecords = objectResults[0].records;
      
      for (let i = 1; i < objectResults.length; i++) {
        const currentObject = objectResults[i];
        const joined = [];
        
        // For each base record, try to find matching records in current object
        // This is a simplified join - in production, you'd want to use actual relationship fields
        baseRecords.forEach(baseRecord => {
          currentObject.records.forEach(currentRecord => {
            // Create a combined record
            const combined = { ...baseRecord, ...currentRecord };
            joined.push(combined);
          });
        });
        
        baseRecords = joined;
      }
      
      joinedRecords = baseRecords;
    }

    // Apply sorting if specified
    if (sortBy) {
      const sortField = sortBy.includes('_') ? sortBy : `${objects[0].objectType}_${sortBy}`;
      joinedRecords.sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (sortOrder === 'DESC') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }

    // Apply grouping if specified
    let finalRecords = joinedRecords;
    if (groupBy) {
      finalRecords = groupRecords(joinedRecords, groupBy);
    }

    // Limit results
    const recordLimit = Math.min(limit || 10000, 10000);
    finalRecords = finalRecords.slice(0, recordLimit);

    // Build combined field label map
    const combinedFieldLabelMap = {};
    objectResults.forEach(objResult => {
      Object.entries(objResult.fieldLabels).forEach(([field, label]) => {
        const prefixedField = `${objResult.objectType}_${field}`;
        combinedFieldLabelMap[prefixedField] = `${objResult.objectType} ${label}`;
      });
    });

    res.json({
      success: true,
      records: finalRecords,
      count: finalRecords.length,
      fieldLabels: combinedFieldLabelMap,
      hasMore: joinedRecords.length > recordLimit
    });
  } catch (error) {
    console.error('[Reports Preview Multi] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview multi-object report',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Generate report data (saves to history)
router.post('/generate', authenticate, requirePermission(PERMISSIONS.CREATE_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { objectType, fields, filters, sortBy, sortOrder, groupBy, limit, fieldLabels } = req.body;
    
    console.log('[Reports Generate] Generate request received');
    console.log('[Reports Generate] Filters received:', JSON.stringify(filters, null, 2));

    if (!objectType || !fields || fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Object type and fields are required'
      });
    }

    const objectName = objectNameMap[objectType.toLowerCase()];
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);

    // Check if we need aggregate queries for count fields
    const countFields = [
      'Active_Contributors__c', 
      'Applied_Contributors__c', 
      'Qualified_Contributors__c',
      'Removed__c',
      'Active_Contributors_c__c', 
      'Applied_Contributors_c__c',
      'Qualified_Contributors_c__c',
      'Removed_c__c'
    ];
    const hasCountFields = fields.some(f => countFields.includes(f));
    
    let finalRecords = [];
    let fieldLabelMap = fieldLabels || {};
    let queryResult = null; // Track query result for hasMore calculation
    let allRecords = []; // Track all records for hasMore calculation
    let recordLimit = 0; // Track record limit for hasMore calculation

    if (hasCountFields && objectName === 'Project__c') {
      // For count fields on Project, we need to aggregate from Contributor_Project__c
      // Get projects first - include ALL selected fields, not just Id and Name
      // Filter out count fields that will be calculated separately
      const countFieldNames = ['Active_Contributors__c', 'Applied_Contributors__c', 'Qualified_Contributors__c', 'Removed__c',
                               'Active_Contributors_c__c', 'Applied_Contributors_c__c', 'Qualified_Contributors_c__c', 'Removed_c__c'];
      const nonCountFields = fields.filter(f => !countFieldNames.includes(f));
      
      // Always include Id and Name, plus any other selected non-count fields
      const projectFields = ['Id', 'Name', ...nonCountFields];
      
      // If Account__c is selected, also include Account__r.Name for Project objects
      if (nonCountFields.includes('Account__c') && !projectFields.includes('Account__r.Name')) {
        projectFields.push('Account__r.Name');
      }
      
      const uniqueProjectFields = [...new Set(projectFields)]; // Remove duplicates
      const projectFieldList = uniqueProjectFields.join(', ');
      
      let projectQuery = `SELECT ${projectFieldList} FROM ${objectName}`;
      const whereConditions = [];
      
      // Use advanced filter structure if available
      const whereClause = buildSOQLWhereClause(filters);
      if (whereClause) {
        projectQuery += ` WHERE ${whereClause}`;
      } else if (filters && typeof filters === 'object' && !filters.groups) {
        // Old simple filter format
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== '' && value !== '--None--') {
            if (Array.isArray(value) && value.length > 0) {
              const values = value.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
              whereConditions.push(`${key} IN (${values})`);
            } else {
              whereConditions.push(`${key} = '${String(value).replace(/'/g, "''")}'`);
            }
          }
        });
        if (whereConditions.length > 0) {
          projectQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }
      }
      
      const recordLimit = Math.min(limit || 1000, 10000);
      projectQuery += ` LIMIT ${recordLimit}`;
      
      const projectsResult = await conn.query(projectQuery);
      const projects = projectsResult.records || [];
      
      // Build fieldLabelMap from field metadata for all selected fields
      try {
        const describeResult = await conn.sobject(objectName).describe();
        describeResult.fields.forEach(f => {
          if (fields.includes(f.name) && !fieldLabelMap[f.name]) {
            fieldLabelMap[f.name] = f.label || f.name;
          }
        });
        // Always add Id and Name labels (they're always in the query)
        if (!fieldLabelMap['Id']) {
          const idField = describeResult.fields.find(f => f.name === 'Id');
          fieldLabelMap['Id'] = idField?.label || 'Record ID';
        }
        if (!fieldLabelMap['Name']) {
          const nameField = describeResult.fields.find(f => f.name === 'Name');
          fieldLabelMap['Name'] = nameField?.label || 'Name';
        }
        console.log('[Reports Preview] Built fieldLabelMap from metadata:', Object.keys(fieldLabelMap).length, 'fields');
        // Explicitly add count field labels if not present
        if (!fieldLabelMap['Active_Contributors__c']) fieldLabelMap['Active_Contributors__c'] = 'Active Contributors';
        if (!fieldLabelMap['Active_Contributors_c__c']) fieldLabelMap['Active_Contributors_c__c'] = 'Active Contributors';
        if (!fieldLabelMap['Applied_Contributors__c']) fieldLabelMap['Applied_Contributors__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Applied_Contributors_c__c']) fieldLabelMap['Applied_Contributors_c__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Qualified_Contributors__c']) fieldLabelMap['Qualified_Contributors__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Qualified_Contributors_c__c']) fieldLabelMap['Qualified_Contributors_c__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Removed__c']) fieldLabelMap['Removed__c'] = 'Removed';
        if (!fieldLabelMap['Removed_c__c']) fieldLabelMap['Removed_c__c'] = 'Removed';
        console.log('[Reports Generate] Field labels after adding count fields:', Object.keys(fieldLabelMap).filter(k => k.includes('Contributor') || k.includes('Removed')));
      } catch (describeError) {
        console.warn('[Reports Generate] Could not describe object to build fieldLabelMap:', describeError.message);
        // Add count field labels even if describe fails
        if (!fieldLabelMap['Active_Contributors__c']) fieldLabelMap['Active_Contributors__c'] = 'Active Contributors';
        if (!fieldLabelMap['Active_Contributors_c__c']) fieldLabelMap['Active_Contributors_c__c'] = 'Active Contributors';
        if (!fieldLabelMap['Applied_Contributors__c']) fieldLabelMap['Applied_Contributors__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Applied_Contributors_c__c']) fieldLabelMap['Applied_Contributors_c__c'] = 'Applied Contributors';
        if (!fieldLabelMap['Qualified_Contributors__c']) fieldLabelMap['Qualified_Contributors__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Qualified_Contributors_c__c']) fieldLabelMap['Qualified_Contributors_c__c'] = 'Qualified Contributors';
        if (!fieldLabelMap['Removed__c']) fieldLabelMap['Removed__c'] = 'Removed';
        if (!fieldLabelMap['Removed_c__c']) fieldLabelMap['Removed_c__c'] = 'Removed';
      }
      
      // Add common field labels
      if (!fieldLabelMap['Id']) fieldLabelMap['Id'] = 'Record ID';
      if (!fieldLabelMap['Name']) fieldLabelMap['Name'] = 'Name';
      
      // Check if the specific project is in the results
      const falconProject = projects.find(p => p.Name && p.Name.includes('Falcon Background Gen Guardrail'));
      if (falconProject) {
        console.log(`[Reports] Found Falcon project:`, falconProject.Id, falconProject.Name);
      } else {
        console.warn(`[Reports] Falcon project NOT found in project query results`);
        console.log(`[Reports] Project names in results:`, projects.map(p => p.Name).slice(0, 10));
      }
      
      // Optimize: Batch all project IDs and get counts in fewer queries
      if (projects.length === 0) {
        finalRecords = [];
      } else {
        const projectIds = projects.map(p => p.Id);
        
        console.log(`[Reports Generate] ========== COUNT QUERIES DEBUG ==========`);
        console.log(`[Reports Generate] Total projects found: ${projects.length}`);
        console.log(`[Reports Generate] Project IDs (first 5):`, projectIds.slice(0, 5));
        if (falconProject) {
          console.log(`[Reports Generate] Falcon project ID: ${falconProject.Id}`);
          console.log(`[Reports Generate] Falcon project ID in projectIds:`, projectIds.includes(falconProject.Id));
        }
        
        // Check which count fields are selected
        const hasActive = fields.some(f => f === 'Active_Contributors__c' || f === 'Active_Contributors_c__c');
        const hasApplied = fields.some(f => f === 'Applied_Contributors__c' || f === 'Applied_Contributors_c__c');
        const hasQualified = fields.some(f => f === 'Qualified_Contributors__c' || f === 'Qualified_Contributors_c__c');
        const hasRemoved = fields.some(f => f === 'Removed__c' || f === 'Removed_c__c');
        
        console.log(`[Reports Generate] Count fields selected:`, {
          hasActive,
          hasApplied,
          hasQualified,
          hasRemoved,
          selectedFields: fields.filter(f => f.includes('Contributor') || f.includes('Removed'))
        });
        
        // Build maps: projectId -> count
        const countsMap = {
          active: {},
          applied: {},
          qualified: {},
          removed: {}
        };
        
        // Batch project IDs to avoid URI too long errors (max ~200 IDs per query)
        const BATCH_SIZE = 200;
        const batches = [];
        for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
          batches.push(projectIds.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`[Reports Generate] Processing ${batches.length} batches of project IDs (${BATCH_SIZE} per batch)`);
        
        try {
          // Process each batch
          for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            const batchIdsStr = batch.map(id => `'${id}'`).join(', ');
            
            const batchQueries = [];
            const batchQueryKeys = [];
            
            if (hasActive) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) AND Status__c = 'Active' GROUP BY Project__c`);
              batchQueryKeys.push('active');
            }
            
            if (hasApplied) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) GROUP BY Project__c`);
              batchQueryKeys.push('applied');
            }
            
            if (hasQualified) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) AND Status__c = 'Qualified' GROUP BY Project__c`);
              batchQueryKeys.push('qualified');
            }
            
            if (hasRemoved) {
              batchQueries.push(`SELECT Project__c, COUNT(Id) cnt FROM Contributor_Project__c WHERE Project__c IN (${batchIdsStr}) AND Status__c = 'Removed' GROUP BY Project__c`);
              batchQueryKeys.push('removed');
            }
            
            // Execute batch queries in parallel
            if (batchQueries.length > 0) {
              console.log(`[Reports Generate] Executing batch ${batchIdx + 1}/${batches.length} with ${batchQueries.length} queries`);
              const batchResults = await Promise.all(batchQueries.map(q => conn.query(q)));
              
              // Process batch results
              batchResults.forEach((result, idx) => {
                const key = batchQueryKeys[idx];
                (result.records || []).forEach(rec => {
                  const projectId = rec.Project__c;
                  if (!projectId) return;
                  
                  // Extract count value
                  let count = 0;
                  if (rec.cnt !== undefined && rec.cnt !== null) {
                    count = typeof rec.cnt === 'number' ? rec.cnt : parseInt(rec.cnt, 10) || 0;
                  } else if (rec.expr0 !== undefined && rec.expr0 !== null) {
                    count = typeof rec.expr0 === 'number' ? rec.expr0 : parseInt(rec.expr0, 10) || 0;
                  } else if (rec.expr1 !== undefined && rec.expr1 !== null) {
                    count = typeof rec.expr1 === 'number' ? rec.expr1 : parseInt(rec.expr1, 10) || 0;
                  } else {
                    const numericFields = Object.keys(rec).filter(k => {
                      const val = rec[k];
                      return (typeof val === 'number' || (typeof val === 'string' && !isNaN(val))) && k !== 'attributes' && k !== 'Project__c';
                    });
                    if (numericFields.length > 0) {
                      const val = rec[numericFields[0]];
                      count = typeof val === 'number' ? val : parseInt(val, 10) || 0;
                    }
                  }
                  
                  // Merge counts (in case a project appears in multiple batches, sum them)
                  countsMap[key][projectId] = (countsMap[key][projectId] || 0) + count;
                });
              });
            }
          }
          
          console.log(`[Reports Generate] ========== COUNT QUERY RESULTS ==========`);
          console.log(`[Reports Generate] Final countsMap summary:`, {
            activeProjects: Object.keys(countsMap.active).length,
            appliedProjects: Object.keys(countsMap.applied).length,
            qualifiedProjects: Object.keys(countsMap.qualified).length,
            removedProjects: Object.keys(countsMap.removed).length
          });
          
          if (falconProject) {
            console.log(`[Reports Generate] Falcon project counts:`, {
              active: countsMap.active[falconProject.Id] || 0,
              applied: countsMap.applied[falconProject.Id] || 0,
              qualified: countsMap.qualified[falconProject.Id] || 0,
              removed: countsMap.removed[falconProject.Id] || 0
            });
          }
          
          console.log(`[Reports Generate] Final countsMap summary:`, {
            activeProjects: Object.keys(countsMap.active).length,
            appliedProjects: Object.keys(countsMap.applied).length,
            qualifiedProjects: Object.keys(countsMap.qualified).length,
            removedProjects: Object.keys(countsMap.removed).length,
            sampleActiveCounts: Object.entries(countsMap.active).slice(0, 3),
            sampleQualifiedCounts: Object.entries(countsMap.qualified).slice(0, 3),
            sampleRemovedCounts: Object.entries(countsMap.removed).slice(0, 3)
          });
          console.log(`[Reports Generate] Project IDs in query:`, projects.map(p => p.Id));
          
          // Process each project
          console.log(`[Reports Generate] Processing ${projects.length} projects`);
          for (const project of projects) {
            const projectId = project.Id;
            const activeCount = countsMap.active[projectId] || 0;
            const appliedCount = countsMap.applied[projectId] || 0;
            const qualifiedCount = countsMap.qualified[projectId] || 0;
            const removedCount = countsMap.removed[projectId] || 0;
            
            // Log for first few projects to debug
            if (projects.indexOf(project) < 3) {
              console.log(`[Reports Generate] Project ${project.Name} (${projectId}):`, {
                activeCount,
                appliedCount,
                qualifiedCount,
                removedCount,
                activeInMap: projectId in countsMap.active,
                qualifiedInMap: projectId in countsMap.qualified,
                removedInMap: projectId in countsMap.removed
              });
            }
            
            // Log counts for debugging specific project
            if (project.Name && project.Name.includes('Falcon Background Gen Guardrail')) {
              console.log(`[Reports Generate] Project "${project.Name}" (${projectId}):`, {
                active: activeCount,
                applied: appliedCount,
                qualified: qualifiedCount,
                removed: removedCount,
                availableInCountsMap: {
                  active: projectId in countsMap.active,
                  applied: projectId in countsMap.applied,
                  qualified: projectId in countsMap.qualified,
                  removed: projectId in countsMap.removed
                },
                countsMapKeys: {
                  active: Object.keys(countsMap.active),
                  applied: Object.keys(countsMap.applied),
                  qualified: Object.keys(countsMap.qualified),
                  removed: Object.keys(countsMap.removed)
                }
              });
            }
            
            // Helper to check if field is in fields array (handles both naming conventions)
            const hasField = (baseFieldName) => {
              // Check both __c and _c__c variants
              return fields.includes(baseFieldName) || fields.includes(baseFieldName.replace('__c', '_c__c'));
            };
            
            // Helper to get the actual field name as selected by user (handles both naming conventions)
            // Handles: Removed__c -> Removed_c__c, Active_Contributors__c -> Active_Contributors_c__c, etc.
            const getFieldName = (baseFieldName) => {
              // First check if the base field name (with __c) is selected
              if (fields.includes(baseFieldName)) {
                return baseFieldName;
              }
              // Then check if the _c__c variant is selected
              // For Removed__c -> Removed_c__c
              // For Active_Contributors__c -> Active_Contributors_c__c
              const variantFieldName = baseFieldName.replace('__c', '_c__c');
              if (fields.includes(variantFieldName)) {
                return variantFieldName;
              }
              return null;
            };
            
            // Create one record per project with total counts
            const record = { ...project };
            
            // Replace Account__c ID with Account__r.Name if available (for Project objects)
            if (fields.includes('Account__c')) {
              // Check if we have the Account name from the relationship
              if (record['Account__r.Name']) {
                // Replace Account__c ID with Account__r.Name
                record.Account__c = record['Account__r.Name'];
              } else if (record.Account__r && record.Account__r.Name) {
                // Fallback: get from nested Account__r object
                record.Account__c = record.Account__r.Name;
              }
            }
            
            // Log before setting values for Falcon project
            if (project.Name && project.Name.includes('Falcon Background Gen Guardrail')) {
              console.log(`[Reports Generate] Before setting counts for Falcon project:`, {
                projectId,
                activeCount,
                appliedCount,
                qualifiedCount,
                removedCount,
                hasActiveField: hasField('Active_Contributors__c'),
                hasQualifiedField: hasField('Qualified_Contributors__c'),
                hasRemovedField: hasField('Removed__c'),
                selectedFields: fields.filter(f => f.includes('Contributor') || f.includes('Removed'))
              });
            }
            
            // Always set the field if it's selected, using the exact field name as selected
            // Ensure values are numbers
            const activeFieldName = getFieldName('Active_Contributors__c');
            if (activeFieldName) {
              const value = typeof activeCount === 'number' ? activeCount : (parseInt(activeCount, 10) || 0);
              record[activeFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Generate] Set ${activeFieldName} = ${value} (from activeCount: ${activeCount})`);
              }
            }
            
            const appliedFieldName = getFieldName('Applied_Contributors__c');
            if (appliedFieldName) {
              const value = typeof appliedCount === 'number' ? appliedCount : (parseInt(appliedCount, 10) || 0);
              record[appliedFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Generate] Set ${appliedFieldName} = ${value} (from appliedCount: ${appliedCount})`);
              }
            }
            
            const qualifiedFieldName = getFieldName('Qualified_Contributors__c');
            if (qualifiedFieldName) {
              const value = typeof qualifiedCount === 'number' ? qualifiedCount : (parseInt(qualifiedCount, 10) || 0);
              record[qualifiedFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Generate] Set ${qualifiedFieldName} = ${value} (from qualifiedCount: ${qualifiedCount})`);
              }
            }
            
            const removedFieldName = getFieldName('Removed__c');
            if (removedFieldName) {
              const value = typeof removedCount === 'number' ? removedCount : (parseInt(removedCount, 10) || 0);
              record[removedFieldName] = value;
              if (projects.indexOf(project) < 3) {
                console.log(`[Reports Generate] Set ${removedFieldName} = ${value} (from removedCount: ${removedCount})`);
              }
            }
            
            // Log after setting values for Falcon project
            if (project.Name && project.Name.includes('Falcon Background Gen Guardrail')) {
              console.log(`[Reports Generate] ========== FALCON PROJECT DEBUG ==========`);
              console.log(`[Reports Generate] Project: ${project.Name} (${projectId})`);
              console.log(`[Reports Generate] Field names:`, {
                activeFieldName,
                appliedFieldName,
                qualifiedFieldName,
                removedFieldName
              });
              console.log(`[Reports Generate] Counts from map:`, {
                activeCount,
                appliedCount,
                qualifiedCount,
                removedCount
              });
              console.log(`[Reports Generate] Values in record:`, {
                active: record[activeFieldName],
                applied: record[appliedFieldName],
                qualified: record[qualifiedFieldName],
                removed: record[removedFieldName]
              });
              console.log(`[Reports Generate] All record keys:`, Object.keys(record));
              console.log(`[Reports Generate] Count fields in record:`, Object.keys(record).filter(k => k.includes('Contributor') || k.includes('Removed')));
            }
            
            finalRecords.push(record);
          }
          
          // Sort records in memory if sortBy is a count field (can't sort in SOQL)
          if (sortBy && countFields.includes(sortBy)) {
            console.log(`[Reports Generate] ========== SORTING BY COUNT FIELD ==========`);
            console.log(`[Reports Generate] Sort field: ${sortBy}, Order: ${sortOrder || 'ASC'}`);
            
            // Find the actual field name in the data (handle both __c and _c__c variants)
            let actualSortField = sortBy;
            if (finalRecords.length > 0) {
              const firstRecord = finalRecords[0];
              // Check if the exact field exists
              if (!(sortBy in firstRecord) || firstRecord[sortBy] === undefined) {
                // Try the alternative naming convention
                const altField = sortBy.includes('__c') 
                  ? sortBy.replace('__c', '_c__c')
                  : sortBy.replace('_c__c', '__c');
                if (altField in firstRecord && firstRecord[altField] !== undefined) {
                  actualSortField = altField;
                  console.log(`[Reports Generate] Using alternative field name for sorting: ${actualSortField} (original: ${sortBy})`);
                }
              }
            }
            
            console.log(`[Reports Generate] Records before sort: ${finalRecords.length}`);
            if (finalRecords.length > 0) {
              console.log(`[Reports Generate] First 3 records before sort:`, finalRecords.slice(0, 3).map(r => ({
                name: r.Name,
                sortValue: r[actualSortField],
                type: typeof r[actualSortField],
                allCountFields: Object.keys(r).filter(k => k.includes('Contributor') || k.includes('Removed'))
              })));
            }
            
            finalRecords.sort((a, b) => {
              const aValue = Number(a[actualSortField]) || 0;
              const bValue = Number(b[actualSortField]) || 0;
              const comparison = aValue - bValue;
              return sortOrder === 'DESC' ? -comparison : comparison;
            });
            
            console.log(`[Reports Generate] Records after sort: ${finalRecords.length}`);
            if (finalRecords.length > 0) {
              console.log(`[Reports Generate] First 3 records after sort:`, finalRecords.slice(0, 3).map(r => ({
                name: r.Name,
                sortValue: r[actualSortField],
                type: typeof r[actualSortField]
              })));
            }
          } else if (sortBy) {
            console.log(`[Reports Generate] Sort by ${sortBy} is not a count field, sorting handled in SOQL or will be done after`);
          }
        } catch (countError) {
          console.error('[Reports Generate] Error getting counts:', countError);
          // Fallback: add all projects with 0 counts
          projects.forEach(project => {
            const record = { ...project };
            const hasField = (fieldName) => {
              return fields.includes(fieldName) || fields.includes(fieldName.replace('__c', '_c__c'));
            };
            const setFieldValue = (record, fieldName, value) => {
              if (fields.includes(fieldName)) {
                record[fieldName] = value;
              } else if (fields.includes(fieldName.replace('__c', '_c__c'))) {
                record[fieldName.replace('__c', '_c__c')] = value;
              }
            };
            if (hasField('Active_Contributors__c')) {
              setFieldValue(record, 'Active_Contributors__c', 0);
            }
            if (hasField('Applied_Contributors__c')) {
              setFieldValue(record, 'Applied_Contributors__c', 0);
            }
            if (hasField('Qualified_Contributors__c')) {
              setFieldValue(record, 'Qualified_Contributors__c', 0);
            }
            if (hasField('Removed__c')) {
              setFieldValue(record, 'Removed__c', 0);
            }
            finalRecords.push(record);
          });
        }
      }
    } else {
      // Regular query for non-count fields or other objects
      // Handle relationship fields - if Account__c is selected, also include Account__r.Name
      const processedFields = [];
      const relationshipFields = [];
      const subqueryFields = {}; // Initialize subqueryFields object for subquery field tracking
      const standardRelationshipFields = ['Contact', 'Owner', 'CreatedBy', 'LastModifiedBy', 'Account', 'Parent'];
      
      // Separate standard fields from relationship fields
      fields.forEach(field => {
        // Check if it's a standard relationship field (e.g., Contact.Name, Owner.Name)
        const isStandardRelationship = standardRelationshipFields.some(rel => field.startsWith(`${rel}.`));
        if (isStandardRelationship) {
          // Add the relationship field as-is (e.g., Contact.Name, Owner.Name)
          if (!relationshipFields.includes(field)) {
            relationshipFields.push(field);
          }
          // Also ensure the base ID field is included for the relationship to work
          const baseField = field.split('.')[0];
          const idField = `${baseField}Id`;
          if (!processedFields.includes(idField) && !fields.includes(idField)) {
            processedFields.push(idField);
          }
        } else if (field.includes('__r.') || (field.includes('.') && !field.startsWith('Contact.') && !field.startsWith('Owner.'))) {
          // Custom relationship field (e.g., Account__r.Name) or multi-level (e.g., Account__r.Contact__r.Email)
          if (!relationshipFields.includes(field)) {
            relationshipFields.push(field);
          }
          // Ensure the base lookup field is included
          // Extract the first part before the first dot or __r
          let baseField;
          if (field.includes('__r.')) {
            baseField = field.split('__r.')[0] + '__c';
          } else if (field.includes('.')) {
            // For multi-level custom relationships like Account__r.Contact__r.Name
            const firstPart = field.split('.')[0];
            if (firstPart.endsWith('__r')) {
              baseField = firstPart.replace('__r', '__c');
            } else {
              // Standard relationship, already handled above
              return;
            }
          }
          
          if (baseField && !processedFields.includes(baseField) && !fields.includes(baseField)) {
            processedFields.push(baseField);
          }
        } else {
          // Regular field
          processedFields.push(field);
        }
      });
      
      // Check for lookup fields and add their relationship Name fields
      // First, get field metadata to determine which fields are actually lookup fields
      try {
        const describeResult = await conn.sobject(objectName).describe();
        const fieldMetadataMap = {};
        describeResult.fields.forEach(f => {
          fieldMetadataMap[f.name] = f;
        });
        
        // Check for lookup fields and add their relationship Name fields
        // Only do this if user hasn't explicitly selected relationship fields via RelationshipBrowser
        const hasExplicitRelationshipFields = fields.some(f => f.includes('__r.') || f.includes('.'));
        if (!hasExplicitRelationshipFields) {
          processedFields.forEach(field => {
            // If field is a lookup (ends with __c and not already a relationship)
            if (field.endsWith('__c') && !field.includes('__r') && !field.includes('Contributors')) {
              const fieldMetadata = fieldMetadataMap[field];
              // Only add relationship if field is actually a lookup/reference field
              if (fieldMetadata && (fieldMetadata.type === 'reference' || fieldMetadata.type === 'lookup')) {
                // Get the relationship name from metadata
                const relationshipName = fieldMetadata.relationshipName;
                console.log(`[Reports Generate] Field ${field} - relationshipName: ${relationshipName}, type: ${fieldMetadata.type}`);
                if (relationshipName) {
                  // If relationshipName already ends with __r, use it directly; otherwise add __r
                  const relationshipField = relationshipName.endsWith('__r') 
                    ? `${relationshipName}.Name` 
                    : `${relationshipName}__r.Name`;
                  // Only add if not already in fields or relationshipFields
                  if (!fields.includes(relationshipField) && !relationshipFields.includes(relationshipField)) {
                    relationshipFields.push(relationshipField);
                    console.log(`[Reports Generate] Added relationship field: ${relationshipField}`);
                  }
                } else {
                  // Fallback: try common pattern (e.g., Account__c -> Account__r.Name)
                  const baseField = field.replace('__c', '');
                  const relationshipField = `${baseField}__r.Name`;
                  // Only add if not already in fields or relationshipFields
                  if (!fields.includes(relationshipField) && !relationshipFields.includes(relationshipField)) {
                    relationshipFields.push(relationshipField);
                    console.log(`[Reports Generate] Added fallback relationship field: ${relationshipField}`);
                  }
                }
              }
            }
          });
        }
      } catch (describeError) {
        console.warn('[Reports Generate] Could not describe object to get field metadata, skipping relationship fields:', describeError.message);
        // Continue without relationship fields if describe fails
      }
      
      // Build subqueries for child relationships
      const subqueries = [];
      Object.keys(subqueryFields).forEach(relationshipName => {
        const childFields = subqueryFields[relationshipName];
        if (childFields.length > 0) {
          // Build subquery: (SELECT field1, field2 FROM relationshipName)
          const subquery = `(SELECT ${childFields.join(', ')} FROM ${relationshipName})`;
          subqueries.push(subquery);
        }
      });
      
      // Combine original fields with relationship fields and subqueries
      const allFields = [...processedFields, ...relationshipFields, ...subqueries];
      const fieldList = allFields.join(', ');
      let query = `SELECT ${fieldList} FROM ${objectName}`;
      
      // Build fieldLabelMap from field metadata if not provided or incomplete
      // Also handle relationship fields and subquery fields in fieldLabelMap
      if (!fieldLabelMap || Object.keys(fieldLabelMap).length === 0 || fields.some(f => !fieldLabelMap[f])) {
        try {
          const describeResult = await conn.sobject(objectName).describe();
          describeResult.fields.forEach(f => {
            if (fields.includes(f.name) && !fieldLabelMap[f.name]) {
              fieldLabelMap[f.name] = f.label || f.name;
            }
          });
          
          // For relationship fields, try to get labels from related objects
          relationshipFields.forEach(relField => {
            if (!fieldLabelMap[relField]) {
              // Try to extract object and field name from relationship path
              // e.g., Account__r.Name -> Account.Name, Contact__r.Email -> Contact.Email
              const parts = relField.split('.');
              if (parts.length >= 2) {
                const relObjectName = parts[0].replace('__r', '');
                const fieldName = parts[parts.length - 1];
                // Try to describe the related object to get field label
                // For now, use a readable format
                fieldLabelMap[relField] = `${relObjectName} ${fieldName}`;
              } else {
                fieldLabelMap[relField] = relField;
              }
            }
          });
          
          // For subquery fields, create labels
          Object.keys(subqueryFields).forEach(relationshipName => {
            const childFields = subqueryFields[relationshipName];
            childFields.forEach(childField => {
              const subqueryFieldKey = `SUBQUERY:${relationshipName}.${childField}`;
              fieldLabelMap[subqueryFieldKey] = `${relationshipName} ${childField}`;
              // Also add labels for flattened fields
              fieldLabelMap[`${relationshipName}.${childField}`] = `${relationshipName} ${childField}`;
              fieldLabelMap[`${relationshipName}.${childField}.Count`] = `${relationshipName} ${childField} Count`;
            });
            fieldLabelMap[`${relationshipName}.Count`] = `${relationshipName} Count`;
          });
          
          console.log('[Reports Generate] Built fieldLabelMap from metadata:', Object.keys(fieldLabelMap).length, 'fields');
        } catch (describeError) {
          console.warn('[Reports Generate] Could not describe object to build fieldLabelMap:', describeError.message);
        }
      }
      
      // Debug: Log relationship fields for Account
      if (fields.includes('Account__c') || fields.some(f => f.includes('Account'))) {
        console.log('[Reports Generate] Account relationship fields:', {
          originalFields: fields,
          relationshipFields: relationshipFields,
          allFields: allFields,
          query: query
        });
      }

      // Add WHERE clause for filters (supports both old and new filter formats)
      const whereClause = buildSOQLWhereClause(filters);
      console.log('[Reports Generate] Generated WHERE clause:', whereClause);
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
        console.log('[Reports Generate] Final query with WHERE:', query);
      } else {
        console.log('[Reports Generate] No WHERE clause generated');
      }

      // Add GROUP BY (Note: Salesforce SOQL doesn't support GROUP BY, so we'll group in memory)
      // For now, we'll order by groupBy field if specified, then group in memory
      // Note: Flattened subquery fields (e.g., Cases.Count) can't be used in SOQL ORDER BY
      // They will be sorted/grouped in memory after data is fetched
      const isFlattenedSubqueryFieldGenerate = (fieldName) => {
        // Check if it's a flattened subquery field (e.g., Cases.Count, Cases.Subject)
        return fieldName && fieldName.includes('.') && 
               Object.keys(subqueryFields).some(relName => fieldName.startsWith(`${relName}.`));
      };
      
      if (groupBy) {
        // If groupBy is a flattened subquery field, we'll group in memory (don't add to ORDER BY)
        if (!isFlattenedSubqueryFieldGenerate(groupBy)) {
          // Ensure groupBy field is in the SELECT clause (check both original and relationship fields)
          const groupByInFields = fields.includes(groupBy) || allFields.includes(groupBy);
          if (!groupByInFields) {
            query = query.replace(`SELECT ${fieldList}`, `SELECT ${fieldList}, ${groupBy}`);
          }
          // Order by groupBy field first for easier grouping
          if (sortBy && sortBy !== groupBy && !isFlattenedSubqueryFieldGenerate(sortBy)) {
            query += ` ORDER BY ${groupBy} ASC, ${sortBy} ${sortOrder || 'ASC'}`;
          } else if (!sortBy || !isFlattenedSubqueryFieldGenerate(sortBy)) {
            query += ` ORDER BY ${groupBy} ASC`;
          }
        }
      } else if (sortBy && !isFlattenedSubqueryFieldGenerate(sortBy)) {
        // Add ORDER BY - handle relationship fields
        // For relationship fields in ORDER BY, use the full path
        // Skip if it's a flattened subquery field (will sort in memory)
        query += ` ORDER BY ${sortBy} ${sortOrder || 'ASC'}`;
      }

      // Add LIMIT - use provided limit or default to 10000
      recordLimit = Math.min(limit || 10000, 10000); // Max 10000 records
      query += ` LIMIT ${recordLimit}`;
      console.log('[Reports Generate] Final query:', query);

      console.log('[Reports Generate] Executing report query:', query);

      // Execute query
      const result = await conn.query(query);
      const records = result.records || [];

      // Fetch all pages to get complete dataset - no page limit
      allRecords = [...records];
      queryResult = result;
      let pageCount = 0;
      // Fetch all pages until done or limit reached
      while (queryResult.done === false && queryResult.nextRecordsUrl && allRecords.length < recordLimit) {
        queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
        allRecords = allRecords.concat(queryResult.records || []);
        pageCount++;
        // Safety limit to prevent infinite loops (1000 pages = ~2M records)
        if (pageCount > 1000) {
          console.warn('[Reports Generate] Reached safety limit of 1000 pages');
          break;
        }
      }

      // Limit to requested limit
      finalRecords = allRecords.slice(0, recordLimit);
    }

    // Ensure fieldLabelMap is always an object
    if (!fieldLabelMap || typeof fieldLabelMap !== 'object') {
      fieldLabelMap = {};
    }
    
    // Add field labels for count fields if not already present
    // Add field labels for count fields (handle both naming conventions)
    if (!fieldLabelMap['Active_Contributors__c']) {
      fieldLabelMap['Active_Contributors__c'] = 'Active Contributors';
    }
    if (!fieldLabelMap['Active_Contributors_c__c']) {
      fieldLabelMap['Active_Contributors_c__c'] = 'Active Contributors';
    }
    if (!fieldLabelMap['Applied_Contributors__c']) {
      fieldLabelMap['Applied_Contributors__c'] = 'Applied Contributors';
    }
    if (!fieldLabelMap['Applied_Contributors_c__c']) {
      fieldLabelMap['Applied_Contributors_c__c'] = 'Applied Contributors';
    }
    if (!fieldLabelMap['Qualified_Contributors__c']) {
      fieldLabelMap['Qualified_Contributors__c'] = 'Qualified Contributors';
    }
    if (!fieldLabelMap['Qualified_Contributors_c__c']) {
      fieldLabelMap['Qualified_Contributors_c__c'] = 'Qualified Contributors';
    }
    if (!fieldLabelMap['Removed__c']) {
      fieldLabelMap['Removed__c'] = 'Removed';
    }
    if (!fieldLabelMap['Removed_c__c']) {
      fieldLabelMap['Removed_c__c'] = 'Removed';
    }
    
    // Add common field labels
    if (!fieldLabelMap['Id']) {
      fieldLabelMap['Id'] = 'Record ID';
    }
    if (!fieldLabelMap['Name']) {
      fieldLabelMap['Name'] = 'Name';
    }

    // Remove Salesforce attributes and clean up records
    let cleanedRecords = finalRecords.map(record => {
      const cleaned = { ...record };
      // Remove attributes field (Salesforce metadata)
      delete cleaned.attributes;
      
      // Handle relationship fields - flatten nested relationship objects
      // Salesforce returns relationship fields as nested objects (e.g., Account__r: { Name: "Meta" }, Contact: { Name: "John" })
      // We need to flatten them to Account__r.Name, Contact.Name, Owner.Name, etc. for easier access
      
      // First, flatten all relationship fields that were explicitly selected
      relationshipFields.forEach(relField => {
        // Extract the relationship object name and field name
        // e.g., Account__r.Name -> Account__r, Name
        // e.g., Contact.Name -> Contact, Name
        // e.g., Account__r.Contact__r.Email -> Account__r.Contact__r, Email
        const parts = relField.split('.');
        if (parts.length >= 2) {
          const relObjectPath = parts.slice(0, -1).join('.'); // Everything except last part
          const fieldName = parts[parts.length - 1]; // Last part is the field name
          
          // Navigate through nested relationship objects
          let currentValue = cleaned;
          const pathParts = relObjectPath.split('.');
          let found = true;
          
          for (const part of pathParts) {
            if (currentValue[part] && typeof currentValue[part] === 'object' && !Array.isArray(currentValue[part])) {
              currentValue = currentValue[part];
            } else {
              found = false;
              break;
            }
          }
          
          // If we found the nested object, extract the field value
          if (found && currentValue && currentValue[fieldName] !== undefined) {
            cleaned[relField] = currentValue[fieldName];
          }
        }
      });
      
      // Also handle any relationship objects that weren't explicitly selected but exist in the data
      Object.keys(cleaned).forEach(key => {
        const value = cleaned[key];
        // If value is an object and has Name property, it's likely a relationship
        // This handles both custom (__r) and standard (Contact, Owner, etc.) relationship fields
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && value !== null) {
          // Flatten all properties of the relationship object
          Object.keys(value).forEach(prop => {
            const flattenedKey = `${key}.${prop}`;
            // Only add if not already flattened and if it's a simple value
            if (cleaned[flattenedKey] === undefined && 
                (typeof value[prop] !== 'object' || value[prop] instanceof Date)) {
              cleaned[flattenedKey] = value[prop];
            }
          });
        }
      });
      
      // Handle multi-level relationships (e.g., Account__r.Contact__r.Email)
      // Check for nested relationship objects and flatten them
      Object.keys(cleaned).forEach(key => {
        if (key.endsWith('__r') && cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
          const relObj = cleaned[key];
          Object.keys(relObj).forEach(prop => {
            // If the property is itself a relationship object, flatten it further
            if (relObj[prop] && typeof relObj[prop] === 'object' && !Array.isArray(relObj[prop]) && !(relObj[prop] instanceof Date)) {
              Object.keys(relObj[prop]).forEach(nestedProp => {
                const flattenedKey = `${key}.${prop}.${nestedProp}`;
                if (cleaned[flattenedKey] === undefined && 
                    (typeof relObj[prop][nestedProp] !== 'object' || relObj[prop][nestedProp] instanceof Date)) {
                  cleaned[flattenedKey] = relObj[prop][nestedProp];
                }
              });
            }
          });
        }
      });
      
      // Replace Account__c ID with Account__r.Name if available (for Project objects)
      if (objectName === 'Project__c' && fields.includes('Account__c')) {
        // Check if we have the Account name from the relationship
        if (cleaned['Account__r.Name']) {
          // Replace Account__c ID with Account__r.Name
          cleaned.Account__c = cleaned['Account__r.Name'];
        } else if (cleaned.Account__r && cleaned.Account__r.Name) {
          // Fallback: get from nested Account__r object
          cleaned.Account__c = cleaned.Account__r.Name;
        }
      }
      
      // Debug: Log Account field flattening for first record
      if (fields.includes('Account__c') && cleaned.Account__c) {
        console.log('[Reports Generate] Account field after replacement:', {
          Account__c: cleaned.Account__c,
          Account__r: cleaned.Account__r,
          'Account__r.Name': cleaned['Account__r.Name'],
          'Account.Name': cleaned['Account.Name'],
          allAccountFields: Object.keys(cleaned).filter(k => k.toLowerCase().includes('account'))
        });
      }
      
      // Ensure count fields are numbers - check all possible field names dynamically
      // Don't set to 0 if undefined, only convert to number if value exists
      const countFieldNames = [
        'Active_Contributors__c', 'Active_Contributors_c__c',
        'Applied_Contributors__c', 'Applied_Contributors_c__c',
        'Qualified_Contributors__c', 'Qualified_Contributors_c__c',
        'Removed__c', 'Removed_c__c'
      ];
      
      countFieldNames.forEach(fieldName => {
        if (cleaned[fieldName] !== undefined && cleaned[fieldName] !== null) {
          // Convert to number if not already a number, preserve the value
          if (typeof cleaned[fieldName] !== 'number') {
            const numValue = typeof cleaned[fieldName] === 'string' 
              ? parseInt(cleaned[fieldName], 10) 
              : Number(cleaned[fieldName]);
            // Only update if conversion is successful, otherwise keep original
            cleaned[fieldName] = isNaN(numValue) ? cleaned[fieldName] : numValue;
          }
        }
      });
      
      return cleaned;
    });

    // Apply grouping if specified (after cleaning records)
    if (groupBy && cleanedRecords.length > 0) {
      cleanedRecords = groupRecords(cleanedRecords, groupBy);
      // Keep group header markers for frontend display, but clean up other metadata
      cleanedRecords = cleanedRecords.map(record => {
        const cleaned = { ...record };
        // Keep _isGroupHeader, _groupKey, _groupByField for frontend grouping display
        // Only remove _isSubtotal if not needed
        if (cleaned._isSubtotal && !cleaned._isGroupHeader) {
          delete cleaned._isSubtotal;
        }
        return cleaned;
      });
    }

    // Generate always saves to history
    const reportHistory = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: req.body.reportName || `Report ${new Date().toLocaleString()}`,
      objectType,
      fields,
      filters,
      sortBy,
      sortOrder,
      limit: limit || 1000,
        recordCount: cleanedRecords.length,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.email,
        type: 'manual',
        category: req.body.category || 'Uncategorized',
        data: cleanedRecords, // Store the actual data
        fieldLabels: fieldLabelMap // Store field labels for display
    };

    const history = loadReportsHistory();
    history.unshift(reportHistory);
    // Keep only last 100 reports
    if (history.length > 100) {
      history.splice(100);
    }
    saveReportsHistory(history);

    console.log('[Reports Generate] Report saved to history, ID:', reportHistory.id);

    res.json({
      success: true,
      records: cleanedRecords,
      count: cleanedRecords.length,
      reportId: reportHistory.id,
      fieldLabels: fieldLabelMap,
      hasMore: allRecords.length > recordLimit || (queryResult && !queryResult.done)
    });
  } catch (error) {
    console.error('[Reports] Error generating report:', error);
    console.error('[Reports] Error stack:', error.stack);
    console.error('[Reports] Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Get reports history
router.get('/history', authenticate, requirePermission(PERMISSIONS.VIEW_REPORTS), asyncHandler(async (req, res) => {
  try {
    const history = loadReportsHistory();
    res.json({
      success: true,
      reports: history
    });
  } catch (error) {
    console.error('[Reports] Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports history'
    });
  }
}));

// Get a specific report
router.get('/history/:id', authenticate, requirePermission(PERMISSIONS.VIEW_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const history = loadReportsHistory();
    const report = history.find(r => r.id === id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('[Reports] Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report'
    });
  }
}));

// Delete a report from history
router.delete('/history/:id', authenticate, requirePermission(PERMISSIONS.DELETE_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const history = loadReportsHistory();
    const filtered = history.filter(r => r.id !== id);
    
    if (filtered.length === history.length) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    saveReportsHistory(filtered);

    res.json({
      success: true,
      message: 'Report deleted'
    });
  } catch (error) {
    console.error('[Reports] Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete report'
    });
  }
}));

// Search records for lookup fields
router.post('/lookup-search', authenticate, requirePermission(PERMISSIONS.VIEW_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { objectType, searchTerm, exactMatch = false } = req.body;

    if (!objectType || !searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'objectType and searchTerm are required'
      });
    }

    const conn = await getSalesforceConnection(req.user);
    
    // Build SOQL query
    let query;
    if (exactMatch) {
      // For exact match, search by ID
      query = `SELECT Id, Name FROM ${objectType} WHERE Id = '${searchTerm.replace(/'/g, "''")}' LIMIT 1`;
    } else {
      // For search, use LIKE on Name field
      const { validateAndSanitizeSearchTerm } = require('../utils/security');
      const escapedTerm = validateAndSanitizeSearchTerm(searchTerm);
      if (!escapedTerm) {
        return res.json({
          success: true,
          records: []
        });
      }
      query = `SELECT Id, Name FROM ${objectType} WHERE Name LIKE '%${escapedTerm}%' ORDER BY Name ASC LIMIT 20`;
    }

    const result = await conn.query(query);
    
    res.json({
      success: true,
      records: result.records.map(record => ({
        Id: record.Id,
        Name: record.Name || record.Id
      }))
    });
  } catch (error) {
    console.error('[Reports] Error searching lookup records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search records'
    });
  }
}));

module.exports = router;
