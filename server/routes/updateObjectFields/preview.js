// Route handlers for POST /preview and POST /preview-multiple

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./utils');

// Preview update (dry-run) - single field
router.post('/preview', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldName, updateMode, currentValue, newValue, filters } = req.body;

    if (!objectType || !fieldName || newValue === undefined || newValue === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: objectType, fieldName, and newValue are required'
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
    
    // Get field metadata and check for Name field
    let fieldType = null;
    let isBoolean = false;
    let fieldLabel = fieldName;
    let hasNameField = false;
    try {
      const describeResult = await conn.sobject(objectName).describe();
      const fieldMetadata = describeResult.fields.find(f => f.name === fieldName);
      if (fieldMetadata) {
        fieldType = fieldMetadata.type;
        isBoolean = fieldType === 'boolean' || fieldType === 'checkbox';
        fieldLabel = fieldMetadata.label;
      }
      const nameField = describeResult.fields.find(f => f.name === 'Name');
      hasNameField = !!nameField;
    } catch (describeError) {
      console.error('Error describing object:', describeError);
    }
    
    // Build SOQL query (same logic as update endpoint)
    const selectFields = hasNameField ? `Id, Name, ${fieldName}` : `Id, ${fieldName}`;
    let query = `SELECT ${selectFields} FROM ${objectName}`;
    const whereConditions = [];
    
    // Add update mode condition (same logic as update endpoint)
    if (updateMode === 'specific' && currentValue !== undefined && currentValue !== null && currentValue !== '') {
      if (currentValue === '--None--' || currentValue === 'None') {
        whereConditions.push(`(${fieldName} = null OR ${fieldName} = '')`);
      } else if (isBoolean) {
        const boolValue = currentValue === 'true' || currentValue === true || currentValue === 'True' || currentValue === '1';
        whereConditions.push(`${fieldName} = ${boolValue}`);
      } else {
        whereConditions.push(`${fieldName} = '${String(currentValue).replace(/'/g, "''")}'`);
      }
    }
    
    // Add filter conditions (same logic as update endpoint)
    if (filters) {
      if (objectType.toLowerCase() === 'project objective') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          whereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'contributor project') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          // Try to find the Project Objective field
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
              whereConditions.push(`${projectObjectiveField.name} = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
            } else {
              whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
            }
          } catch (describeError) {
            whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
          }
        }
        if (filters.status && filters.status !== '') {
          whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.queueStatus && filters.queueStatus !== '') {
          whereConditions.push(`Queue_Status__c = '${String(filters.queueStatus).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'project') {
        if (filters.projectId) {
          whereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.status && filters.status !== '') {
          whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.type && filters.type !== '') {
          whereConditions.push(`Type__c = '${String(filters.type).replace(/'/g, "''")}'`);
        }
      }
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Query a larger sample to get diverse current values (up to 2000 records)
    query += ' LIMIT 2000';
    
    let allRecords = [];
    try {
      let queryResult = await conn.query(query);
      allRecords = allRecords.concat(queryResult.records);
      
      // Handle pagination if needed (up to 2000 total)
      while (queryResult.done === false && queryResult.nextRecordsUrl && allRecords.length < 2000) {
        queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
        allRecords = allRecords.concat(queryResult.records);
        if (allRecords.length >= 2000) break;
      }
    } catch (queryError) {
      console.error('Error querying records:', queryError);
      return res.status(400).json({
        success: false,
        error: `Query error: ${queryError.message}`
      });
    }
    
    // Get total count - use the same whereConditions as the sample query
    let countQuery = `SELECT COUNT() FROM ${objectName}`;
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    console.log('Preview Single - Count Query:', countQuery);
    console.log('Preview Single - Where Conditions:', whereConditions);
    
    let totalCount = 0;
    try {
      const countResult = await conn.query(countQuery);
      totalCount = countResult.totalSize || 0;
      console.log('Preview Single - Count Result totalSize:', countResult.totalSize);
      console.log('Preview Single - Total Count:', totalCount);
    } catch (countError) {
      console.error('Error counting records:', countError);
      totalCount = 0;
    }
    
    // Group records by current value
    const groupedByCurrentValue = new Map();
    
    for (const record of allRecords) {
      const currentVal = record[fieldName] !== null && record[fieldName] !== undefined ? String(record[fieldName]) : '--None--';
      const currentValueKey = currentVal;
      
      if (!groupedByCurrentValue.has(currentValueKey)) {
        // Get record name
        let recordName = record.Name;
        if (!recordName) {
          const labelFields = ['Label__c', 'Title__c', 'Subject__c'];
          for (const labelField of labelFields) {
            if (record[labelField]) {
              recordName = record[labelField];
              break;
            }
          }
          if (!recordName) {
            recordName = record.Id.substring(0, 15) + '...';
          }
        }
        
        groupedByCurrentValue.set(currentValueKey, {
          sampleRecord: {
            id: record.Id,
            name: recordName,
            currentValue: currentVal,
            newValue: newValue === '--None--' || newValue === 'None' || newValue === '' ? '--None--' : String(newValue)
          },
          count: 0
        });
      }
      
      groupedByCurrentValue.get(currentValueKey).count++;
    }
    
    // Convert to array and sort by count (descending)
    const previewRecords = Array.from(groupedByCurrentValue.values())
      .map(group => ({
        ...group.sampleRecord,
        recordCount: group.count
      }))
      .sort((a, b) => b.recordCount - a.recordCount);
    
    // Calculate if counts are approximate (if we didn't query all records)
    const isApproximate = allRecords.length < totalCount;
    
    res.json({
      success: true,
      totalCount: totalCount,
      sampleCount: allRecords.length,
      isApproximate: isApproximate,
      fieldName: fieldName,
      fieldLabel: fieldLabel,
      records: previewRecords
    });
  } catch (error) {
    console.error('Error previewing update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview update'
    });
  }
}));

// Preview update (dry-run) - multiple fields
router.post('/preview-multiple', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldUpdates, filters } = req.body;

    if (!objectType || !fieldUpdates || !Array.isArray(fieldUpdates) || fieldUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: objectType and fieldUpdates array are required'
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
    
    // Get field metadata for all fields and check for Name field
    const fieldMetadataMap = new Map();
    let hasNameField = false;
    try {
      const describeResult = await conn.sobject(objectName).describe();
      for (const fieldUpdate of fieldUpdates) {
        const fieldMeta = describeResult.fields.find(f => f.name === fieldUpdate.fieldName);
        if (fieldMeta) {
          fieldMetadataMap.set(fieldUpdate.fieldName, {
            label: fieldMeta.label,
            type: fieldMeta.type,
            isBoolean: fieldMeta.type === 'boolean' || fieldMeta.type === 'checkbox'
          });
        }
      }
      const nameField = describeResult.fields.find(f => f.name === 'Name');
      hasNameField = !!nameField;
    } catch (describeError) {
      console.error('Error describing object:', describeError);
    }
    
    // Build field list for SELECT
    let fieldNames = ['Id', ...fieldUpdates.map(f => f.fieldName)];
    if (hasNameField) {
      fieldNames = ['Id', 'Name', ...fieldUpdates.map(f => f.fieldName)];
    }
    const uniqueFieldNames = [...new Set(fieldNames)];
    
    // Build SOQL query - always include Id and Name for preview
    const fieldsToSelect = ['Id', 'Name', ...uniqueFieldNames.filter(f => f !== 'Id' && f !== 'Name')];
    let query = `SELECT ${fieldsToSelect.join(', ')} FROM ${objectName}`;
    const whereConditions = [];
    
    // Add conditions for each field update (same logic as update endpoint)
    for (const fieldUpdate of fieldUpdates) {
      if (fieldUpdate.updateMode === 'specific' && fieldUpdate.currentValue !== undefined && fieldUpdate.currentValue !== null && fieldUpdate.currentValue !== '') {
        const fieldMeta = fieldMetadataMap.get(fieldUpdate.fieldName);
        const isBoolean = fieldMeta && fieldMeta.isBoolean;
        
        if (fieldUpdate.currentValue === '--None--' || fieldUpdate.currentValue === 'None') {
          whereConditions.push(`(${fieldUpdate.fieldName} = null OR ${fieldUpdate.fieldName} = '')`);
        } else if (isBoolean) {
          const boolValue = fieldUpdate.currentValue === 'true' || fieldUpdate.currentValue === true || fieldUpdate.currentValue === 'True' || fieldUpdate.currentValue === '1';
          whereConditions.push(`${fieldUpdate.fieldName} = ${boolValue}`);
        } else {
          whereConditions.push(`${fieldUpdate.fieldName} = '${String(fieldUpdate.currentValue).replace(/'/g, "''")}'`);
        }
      }
    }
    
    // Add filter conditions (same logic as update endpoint)
    if (filters) {
      if (objectType.toLowerCase() === 'project objective') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          whereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'contributor project') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
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
              whereConditions.push(`${projectObjectiveField.name} = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
            } else {
              whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
            }
          } catch (describeError) {
            whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
          }
        }
        if (filters.status && filters.status !== '') {
          whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.queueStatus && filters.queueStatus !== '') {
          whereConditions.push(`Queue_Status__c = '${String(filters.queueStatus).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'project') {
        if (filters.projectId) {
          whereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.status && filters.status !== '') {
          whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.type && filters.type !== '') {
          whereConditions.push(`Type__c = '${String(filters.type).replace(/'/g, "''")}'`);
        }
      }
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Query a larger sample to get diverse current values (up to 2000 records)
    query += ' LIMIT 2000';
    
    let allRecords = [];
    try {
      let queryResult = await conn.query(query);
      allRecords = allRecords.concat(queryResult.records);
      
      // Handle pagination if needed (up to 2000 total)
      while (queryResult.done === false && queryResult.nextRecordsUrl && allRecords.length < 2000) {
        queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
        allRecords = allRecords.concat(queryResult.records);
        if (allRecords.length >= 2000) break;
      }
    } catch (queryError) {
      console.error('Error querying records:', queryError);
      return res.status(400).json({
        success: false,
        error: `Query error: ${queryError.message}`
      });
    }
    
    // Get total count - use the same whereConditions as the sample query
    let countQuery = `SELECT COUNT() FROM ${objectName}`;
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    console.log('Preview Multiple - Count Query:', countQuery);
    console.log('Preview Multiple - Where Conditions:', whereConditions);
    
    let totalCount = 0;
    try {
      const countResult = await conn.query(countQuery);
      totalCount = countResult.totalSize || 0;
      console.log('Preview Multiple - Count Result totalSize:', countResult.totalSize);
      console.log('Preview Multiple - Total Count:', totalCount);
    } catch (countError) {
      console.error('Error counting records:', countError);
      totalCount = 0;
    }
    
    // Group records by combination of current values for all fields being updated
    const groupedByCurrentValues = new Map();
    
    for (const record of allRecords) {
      // Get record name
      let recordName = record.Name;
      if (!recordName) {
        const labelFields = ['Label__c', 'Title__c', 'Subject__c'];
        for (const labelField of labelFields) {
          if (record[labelField]) {
            recordName = record[labelField];
            break;
          }
        }
        if (!recordName) {
          recordName = record.Id.substring(0, 15) + '...';
        }
      }
      
      // Create a key from all current values
      const currentValuesKey = fieldUpdates.map(fu => {
        const currentVal = record[fu.fieldName];
        return currentVal !== null && currentVal !== undefined ? String(currentVal) : '--None--';
      }).join('|||');
      
      if (!groupedByCurrentValues.has(currentValuesKey)) {
        const recordData = {
          id: record.Id,
          name: recordName,
          fields: {}
        };
        
        for (const fieldUpdate of fieldUpdates) {
          const currentVal = record[fieldUpdate.fieldName];
          recordData.fields[fieldUpdate.fieldName] = {
            currentValue: currentVal !== null && currentVal !== undefined ? String(currentVal) : '--None--',
            newValue: fieldUpdate.newValue === '--None--' || fieldUpdate.newValue === 'None' || fieldUpdate.newValue === '' ? '--None--' : String(fieldUpdate.newValue),
            label: fieldMetadataMap.get(fieldUpdate.fieldName)?.label || fieldUpdate.fieldName
          };
        }
        
        groupedByCurrentValues.set(currentValuesKey, {
          sampleRecord: recordData,
          count: 0
        });
      }
      
      groupedByCurrentValues.get(currentValuesKey).count++;
    }
    
    // Convert to array and sort by count (descending)
    const previewRecords = Array.from(groupedByCurrentValues.values())
      .map(group => ({
        ...group.sampleRecord,
        recordCount: group.count
      }))
      .sort((a, b) => b.recordCount - a.recordCount);
    
    // Calculate if counts are approximate (if we didn't query all records)
    const isApproximate = allRecords.length < totalCount;
    
    const fieldInfo = fieldUpdates.map(fu => ({
      fieldName: fu.fieldName,
      fieldLabel: fieldMetadataMap.get(fu.fieldName)?.label || fu.fieldName
    }));
    
    res.json({
      success: true,
      totalCount: totalCount,
      sampleCount: allRecords.length,
      isApproximate: isApproximate,
      fields: fieldInfo,
      records: previewRecords
    });
  } catch (error) {
    console.error('Error previewing multiple field update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview update'
    });
  }
}));

module.exports = router;

