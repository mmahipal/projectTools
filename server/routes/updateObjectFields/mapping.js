// Route handlers for POST /preview-mapping and POST /update-mapping

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, asyncHandler, objectNameMap, applyTransformation } = require('./utils');
const { extractSourceFields, applyMappingTransformation, matchSourceTargetRecords } = require('./services/transformationService');
const { logBulkOperation } = require('../../utils/historyLogger');

// Preview field mapping
router.post('/preview-mapping', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { sourceObject, targetObject, mappings, filters, batchSize: requestBatchSize, errorHandlingMode } = req.body;

    // Pre-execution validation
    if (!sourceObject || !targetObject || !mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceObject, targetObject, and mappings array are required'
      });
    }

    const sourceObjectName = objectNameMap[sourceObject.toLowerCase()];
    const targetObjectName = objectNameMap[targetObject.toLowerCase()];

    if (!sourceObjectName || !targetObjectName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid object type. Valid types are: project, project objective, contributor project'
      });
    }

    const conn = await getSalesforceConnection(req.user.id);

    // Build query to get source records
    const sourceFields = extractSourceFields(mappings);

    if (sourceFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No source fields specified in mappings. Please ensure at least one mapping has a valid source field.'
      });
    }

    // Build relationship query if source and target are related
    // For now, we'll query both separately and match by common fields (like Project__c)
    // Ensure we have at least Id and Name, and only add other fields if they exist
    // Filter out Id and Name from sourceFields to avoid duplicates
    const uniqueFields = sourceFields.filter(f => f !== 'Id' && f !== 'Name');
    const fieldsToSelect = uniqueFields.length > 0 
      ? ['Id', 'Name', ...uniqueFields].join(', ')
      : 'Id, Name';
    let sourceQuery = `SELECT ${fieldsToSelect} FROM ${sourceObjectName}`;
    
    console.log('Source query:', sourceQuery);
    
    // Add filters for source if needed (e.g., if filtering by project)
    const sourceWhereConditions = [];
    if (filters && filters.projectId) {
      // If source is Project, filter by Id
      if (sourceObject.toLowerCase() === 'project') {
        sourceWhereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
      } else {
        // For other objects, filter by Project__c
        sourceWhereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
      }
    }
    if (sourceWhereConditions.length > 0) {
      sourceQuery += ' WHERE ' + sourceWhereConditions.join(' AND ');
    }
    sourceQuery += ' LIMIT 2000';
    
    console.log('Final source query:', sourceQuery);

    // Build query to get target records
    const targetFields = mappings.map(m => m.targetField);
    let targetQuery = `SELECT Id, Name, ${targetFields.join(', ')}`;
    
    // Add relationship fields if needed for matching
    if (sourceObject !== targetObject) {
      // Always include Project__c for relationship matching
      if (!targetFields.includes('Project__c')) {
        targetQuery += ', Project__c';
      }
      // For project objective, also include Project_Objective__c if needed
      if (targetObject.toLowerCase() === 'contributor project' && !targetFields.includes('Project_Objective__c')) {
        targetQuery += ', Project_Objective__c';
      }
    }
    targetQuery += ` FROM ${targetObjectName}`;
    
    console.log('Target query:', targetQuery);

    const targetWhereConditions = [];
    if (filters) {
      if (targetObject.toLowerCase() === 'project objective') {
        if (filters.projectId) {
          targetWhereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          targetWhereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      if (targetObject.toLowerCase() === 'contributor project') {
        if (filters.projectId) {
          targetWhereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          targetWhereConditions.push(`Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      if (targetObject.toLowerCase() === 'project') {
        if (filters.projectId) {
          targetWhereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
      }
    }

    if (targetWhereConditions.length > 0) {
      targetQuery += ' WHERE ' + targetWhereConditions.join(' AND ');
    }
    targetQuery += ' LIMIT 2000';

    // Execute queries
    let sourceRecords = [];
    let targetRecords = [];
    
    try {
      console.log('Executing source query...');
      let sourceResult = await conn.query(sourceQuery);
      sourceRecords = sourceRecords.concat(sourceResult.records || []);
      while (sourceResult.done === false && sourceResult.nextRecordsUrl && sourceRecords.length < 2000) {
        sourceResult = await conn.queryMore(sourceResult.nextRecordsUrl);
        sourceRecords = sourceRecords.concat(sourceResult.records || []);
        if (sourceRecords.length >= 2000) break;
      }
      console.log(`Source query returned ${sourceRecords.length} records`);

      console.log('Executing target query...');
      let targetResult = await conn.query(targetQuery);
      targetRecords = targetRecords.concat(targetResult.records || []);
      while (targetResult.done === false && targetResult.nextRecordsUrl && targetRecords.length < 2000) {
        targetResult = await conn.queryMore(targetResult.nextRecordsUrl);
        targetRecords = targetRecords.concat(targetResult.records || []);
        if (targetRecords.length >= 2000) break;
      }
      console.log(`Target query returned ${targetRecords.length} records`);
    } catch (queryError) {
      console.error('Error querying records:', queryError);
      console.error('Query error details:', {
        message: queryError.message,
        errorCode: queryError.errorCode,
        statusCode: queryError.statusCode,
        stack: queryError.stack
      });
      return res.status(400).json({
        success: false,
        error: `Query error: ${queryError.message || queryError.errorCode || 'Unknown query error'}`,
        query: process.env.NODE_ENV === 'development' ? { sourceQuery, targetQuery } : undefined
      });
    }

    // Get total count
    let countQuery = `SELECT COUNT() FROM ${targetObjectName}`;
    if (targetWhereConditions.length > 0) {
      countQuery += ' WHERE ' + targetWhereConditions.join(' AND ');
    }

    let totalCount = 0;
    try {
      const countResult = await conn.query(countQuery);
      totalCount = countResult.totalSize || 0;
    } catch (countError) {
      console.error('Error counting records:', countError);
      totalCount = 0;
    }

    // Match source and target records and apply transformations
    // For now, we'll match by Project__c if available, or use first source record for each target
    const previewRecords = [];
    const processedTargetIds = new Set();

    console.log('Preview mapping - Source records:', sourceRecords.length, 'Target records:', targetRecords.length);
    console.log('Source fields queried:', sourceFields);
    console.log('Mappings received:', JSON.stringify(mappings, null, 2));
    console.log('Sample source record fields:', sourceRecords.length > 0 ? Object.keys(sourceRecords[0]) : 'No source records');
    if (sourceRecords.length > 0) {
      console.log('Sample source record (first 10 fields):', Object.fromEntries(
        Object.entries(sourceRecords[0]).slice(0, 10)
      ));
    }

    for (const targetRecord of targetRecords.slice(0, 10)) { // Limit to 10 for preview
      if (processedTargetIds.has(targetRecord.Id)) continue;
      processedTargetIds.add(targetRecord.Id);

      // Find matching source record using service function
      let sourceRecord = matchSourceTargetRecords(sourceRecords, targetRecord, sourceObject, targetObject);

      if (!sourceRecord && sourceRecords.length > 0) {
        console.log(`No specific match found, using first source record for target ${targetRecord.Id}`);
        sourceRecord = sourceRecords[0];
      }

      if (!sourceRecord) {
        console.warn(`No source record found for target record ${targetRecord.Id} (${targetRecord.Name || 'unnamed'})`);
        console.warn(`Available source records:`, sourceRecords.map(r => ({ Id: r.Id, Name: r.Name, Project__c: r.Project__c })));
        continue;
      }
      
      console.log(`Processing target record ${targetRecord.Id} with source record ${sourceRecord.Id}`);

      // Get record name
      let recordName = targetRecord.Name;
      if (!recordName) {
        recordName = targetRecord.Id.substring(0, 15) + '...';
      }

      const recordData = {
        id: targetRecord.Id,
        name: recordName,
        fields: {}
      };

      // Apply each mapping using transformation service
      for (const mapping of mappings) {
        let transformedValue = null;
        
        console.log(`Processing mapping: targetField=${mapping.targetField}, sourceField=${mapping.sourceField}, transformation=${mapping.transformation}`);
        console.log(`Source record available fields:`, Object.keys(sourceRecord));
        console.log(`Source record values sample:`, {
          Id: sourceRecord.Id,
          Name: sourceRecord.Name,
          ...Object.fromEntries(Object.entries(sourceRecord).slice(0, 5))
        });

        // Use transformation service
        transformedValue = applyMappingTransformation(sourceRecord, mapping);
        
        console.log(`Transformed value for ${mapping.targetField}:`, transformedValue);

        recordData.fields[mapping.targetField] = {
          currentValue: targetRecord[mapping.targetField] !== null && targetRecord[mapping.targetField] !== undefined 
            ? String(targetRecord[mapping.targetField]) : '--None--',
          newValue: transformedValue !== null && transformedValue !== undefined 
            ? String(transformedValue) : '--None--'
        };
      }

      previewRecords.push(recordData);
    }

    const mappingInfo = mappings.map(m => ({
      targetField: m.targetField,
      sourceField: m.sourceField,
      transformation: m.transformation
    }));

    const isApproximate = targetRecords.length < totalCount;

    res.json({
      success: true,
      totalCount: totalCount,
      sampleCount: targetRecords.length,
      isApproximate: isApproximate,
      mappings: mappingInfo,
      records: previewRecords
    });
  } catch (error) {
    console.error('Error previewing field mapping:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errorCode: error.errorCode,
      statusCode: error.statusCode
    });
    res.status(500).json({
      success: false,
      error: error.message || error.errorCode || 'Failed to preview field mapping',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Execute field mapping
router.post('/update-mapping', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { sourceObject, targetObject, mappings, filters, batchSize: requestBatchSize, errorHandlingMode } = req.body;

    if (!sourceObject || !targetObject || !mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceObject, targetObject, and mappings array are required'
      });
    }

    const sourceObjectName = objectNameMap[sourceObject.toLowerCase()];
    const targetObjectName = objectNameMap[targetObject.toLowerCase()];

    if (!sourceObjectName || !targetObjectName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid object type. Valid types are: project, project objective, contributor project'
      });
    }

    const conn = await getSalesforceConnection(req.user.id);

    // Build queries (similar to preview)
    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mappings array is required and must not be empty'
      });
    }
    
    const sourceFields = extractSourceFields(mappings);
    
    console.log('Update mapping - Source fields collected:', sourceFields);

    // Ensure we have at least Id and Name, and only add other fields if they exist
    // Filter out Id and Name from sourceFields to avoid duplicates
    const uniqueFields = sourceFields.filter(f => f !== 'Id' && f !== 'Name');
    const fieldsToSelect = uniqueFields.length > 0 
      ? ['Id', 'Name', ...uniqueFields].join(', ')
      : 'Id, Name';
    let sourceQuery = `SELECT ${fieldsToSelect} FROM ${sourceObjectName}`;
    const sourceWhereConditions = [];
    if (filters && filters.projectId) {
      // If source is Project, filter by Id
      if (sourceObject.toLowerCase() === 'project') {
        sourceWhereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
      } else {
        // For other objects, filter by Project__c
        sourceWhereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
      }
    }
    if (sourceWhereConditions.length > 0) {
      sourceQuery += ' WHERE ' + sourceWhereConditions.join(' AND ');
    }
    
    console.log('Update mapping - Source query:', sourceQuery);

    let targetQuery = `SELECT Id, Name, ${mappings.map(m => m.targetField).join(', ')}`;
    if (sourceObject !== targetObject) {
      targetQuery += ', Project__c';
    }
    targetQuery += ` FROM ${targetObjectName}`;

    const targetWhereConditions = [];
    if (filters) {
      if (targetObject.toLowerCase() === 'project objective') {
        if (filters.projectId) {
          targetWhereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          targetWhereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      if (targetObject.toLowerCase() === 'contributor project') {
        if (filters.projectId) {
          targetWhereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          targetWhereConditions.push(`Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      if (targetObject.toLowerCase() === 'project') {
        if (filters.projectId) {
          targetWhereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
      }
    }

    if (targetWhereConditions.length > 0) {
      targetQuery += ' WHERE ' + targetWhereConditions.join(' AND ');
    }

    // Execute queries
    let sourceRecords = [];
    let targetRecords = [];
    
    try {
      console.log('Update mapping - Executing source query...');
      let sourceResult = await conn.query(sourceQuery);
      sourceRecords = sourceRecords.concat(sourceResult.records || []);
      while (sourceResult.done === false && sourceResult.nextRecordsUrl) {
        sourceResult = await conn.queryMore(sourceResult.nextRecordsUrl);
        sourceRecords = sourceRecords.concat(sourceResult.records || []);
      }
      console.log(`Update mapping - Source query returned ${sourceRecords.length} records`);

      console.log('Update mapping - Executing target query...');
      let targetResult = await conn.query(targetQuery);
      targetRecords = targetRecords.concat(targetResult.records || []);
      while (targetResult.done === false && targetResult.nextRecordsUrl) {
        targetResult = await conn.queryMore(targetResult.nextRecordsUrl);
        targetRecords = targetRecords.concat(targetResult.records || []);
      }
      console.log(`Update mapping - Target query returned ${targetRecords.length} records`);
    } catch (queryError) {
      console.error('Update mapping - Error querying records:', queryError);
      console.error('Query error details:', {
        message: queryError.message,
        errorCode: queryError.errorCode,
        statusCode: queryError.statusCode,
        stack: queryError.stack
      });
      return res.status(400).json({
        success: false,
        error: `Query error: ${queryError.message || queryError.errorCode || 'Unknown query error'}`,
        query: process.env.NODE_ENV === 'development' ? { sourceQuery, targetQuery } : undefined
      });
    }

    if (targetRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No records found to update',
        updatedCount: 0
      });
    }

    // Match and transform
    const updates = [];
    const sourceMap = new Map();

    // Create a map of source records for quick lookup
    if (sourceObject !== targetObject) {
      if (sourceObject.toLowerCase() === 'project' && targetObject.toLowerCase() === 'project objective') {
        // Source is Project, target is Project Objective
        // Map by Project Id (source.Id)
        sourceRecords.forEach(s => {
          sourceMap.set(s.Id, s);
        });
      } else if (sourceObject.toLowerCase() === 'project objective' && targetObject.toLowerCase() === 'project') {
        // Source is Project Objective, target is Project
        // Map by Project__c (source.Project__c)
        sourceRecords.forEach(s => {
          if (s.Project__c) {
            sourceMap.set(s.Project__c, s);
          }
        });
      } else {
        // Generic: map by Project__c
        sourceRecords.forEach(s => {
          if (s.Project__c) {
            sourceMap.set(s.Project__c, s);
          }
        });
      }
    }

    console.log('Update mapping - Source records:', sourceRecords.length, 'Target records:', targetRecords.length);
    console.log('Source map size:', sourceMap.size);

    for (const targetRecord of targetRecords) {
      let sourceRecord = null;
      
      if (sourceObject !== targetObject) {
        // For project -> project objective: match source.Id === target.Project__c
        if (sourceObject.toLowerCase() === 'project' && targetObject.toLowerCase() === 'project objective') {
          if (targetRecord.Project__c) {
            sourceRecord = sourceMap.get(targetRecord.Project__c);
            console.log(`Matching Project Objective ${targetRecord.Id} (Project__c=${targetRecord.Project__c}) with Project ${sourceRecord ? sourceRecord.Id : 'NOT FOUND'}`);
          }
        }
        // For project objective -> project: match source.Project__c === target.Id
        else if (sourceObject.toLowerCase() === 'project objective' && targetObject.toLowerCase() === 'project') {
          sourceRecord = sourceMap.get(targetRecord.Id);
          console.log(`Matching Project ${targetRecord.Id} with Project Objective ${sourceRecord ? sourceRecord.Id : 'NOT FOUND'}`);
        }
        // Generic fallback
        else if (targetRecord.Project__c) {
          sourceRecord = sourceMap.get(targetRecord.Project__c);
        }
        
        if (!sourceRecord && sourceRecords.length > 0) {
          console.log(`No specific match found, using first source record for target ${targetRecord.Id}`);
          sourceRecord = sourceRecords[0]; // Fallback to first source record
        }
      } else {
        sourceRecord = sourceRecords.find(s => s.Id === targetRecord.Id);
        console.log(`Same object matching: target ${targetRecord.Id} with source ${sourceRecord ? sourceRecord.Id : 'NOT FOUND'}`);
      }

      if (!sourceRecord) {
        console.warn(`No source record found for target record ${targetRecord.Id}`);
        continue;
      }

      const updateObj = { Id: targetRecord.Id };

      for (const mapping of mappings) {
        let transformedValue = null;

        // Use transformation service
        transformedValue = applyMappingTransformation(sourceRecord, mapping);
        
        console.log(`Update mapping - Transformed value for ${mapping.targetField}:`, transformedValue, `(type: ${typeof transformedValue})`);

        // Include the value if it's not null or undefined
        // Note: Empty strings are valid values and should be included
        if (transformedValue !== null && transformedValue !== undefined) {
          updateObj[mapping.targetField] = transformedValue;
          console.log(`Added ${mapping.targetField} = ${transformedValue} to update object`);
        } else {
          console.log(`Skipping ${mapping.targetField} - transformedValue is null or undefined`);
        }
      }

      if (Object.keys(updateObj).length > 1) { // More than just Id
        console.log(`Adding update object for record ${updateObj.Id}:`, updateObj);
        updates.push(updateObj);
      } else {
        console.log(`Skipping record ${updateObj.Id} - no fields to update (only Id present)`);
      }
    }

    if (updates.length === 0) {
      return res.json({
        success: true,
        message: 'No records to update after applying transformations',
        updatedCount: 0
      });
    }

    // Perform bulk update with configurable batch size and error handling
    console.log(`Preparing to update ${updates.length} records in ${targetObjectName}`);
    console.log('Sample update object:', updates.length > 0 ? updates[0] : 'No updates');
    
    const batchSize = Math.max(1, Math.min(1000, requestBatchSize || 500)); // Default 500 (increased from 200), min 1, max 1000
    const errorMode = errorHandlingMode || 'default'; // 'default', 'skip', 'continue', 'stop'
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    let shouldStop = false;

    for (let i = 0; i < updates.length && !shouldStop; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      console.log(`Updating batch ${Math.floor(i / batchSize) + 1} (${batch.length} records) with batch size ${batchSize}, error mode: ${errorMode}`);
      try {
        console.log(`Update mapping - Sending batch ${Math.floor(i / batchSize) + 1} to Salesforce:`, JSON.stringify(batch.slice(0, 2), null, 2));
        const updateResult = await conn.sobject(targetObjectName).update(batch);
        const batchErrors = Array.isArray(updateResult) ? updateResult.filter(r => !r.success) : [];
        const batchSuccess = batch.length - batchErrors.length;
        successCount += batchSuccess;
        errorCount += batchErrors.length;
        
        console.log(`Update mapping - Batch ${Math.floor(i / batchSize) + 1} result: ${batchSuccess} succeeded, ${batchErrors.length} failed`);
        
        if (batchErrors.length > 0) {
          console.error('Update mapping - Batch errors:', JSON.stringify(batchErrors, null, 2));
          
          // Enhanced error handling
          if (errorMode === 'stop') {
            shouldStop = true;
            console.log('Error mode is "stop" - stopping batch processing');
          }
        } else {
          console.log(`Update mapping - Batch ${Math.floor(i / batchSize) + 1} successfully updated all ${batchSuccess} records`);
        }
        
        batchErrors.forEach(err => {
          errors.push({
            id: err.id,
            error: err.errors && err.errors.length > 0 ? err.errors[0].message : 'Unknown error'
          });
        });
      } catch (batchError) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, batchError);
        console.error('Batch error details:', {
          message: batchError.message,
          errorCode: batchError.errorCode,
          statusCode: batchError.statusCode,
          stack: batchError.stack,
          batchSize: batch.length,
          sampleRecord: batch.length > 0 ? batch[0] : null
        });
        
        // Enhanced error handling for batch errors
        if (errorMode === 'skip') {
          // Skip this batch and continue
          errorCount += batch.length;
          errors.push({
            batch: i,
            error: batchError.message || batchError.errorCode || 'Unknown batch error',
            errorCode: batchError.errorCode,
            statusCode: batchError.statusCode,
            skipped: true
          });
        } else if (errorMode === 'stop') {
          // Stop processing
          shouldStop = true;
          errorCount += batch.length;
          errors.push({
            batch: i,
            error: batchError.message || batchError.errorCode || 'Unknown batch error',
            errorCode: batchError.errorCode,
            statusCode: batchError.statusCode,
            stopped: true
          });
          break;
        } else {
          // Default or continue: count errors but continue
          errorCount += batch.length;
          errors.push({
            batch: i,
            error: batchError.message || batchError.errorCode || 'Unknown batch error',
            errorCode: batchError.errorCode,
            statusCode: batchError.statusCode
          });
        }
      }
    }

    // Return appropriate response based on results
    if (errorCount > 0 && successCount === 0) {
      // All failed
      const errorMessages = errors.map(e => e.error).join('; ');
      return res.status(400).json({
        success: false,
        error: `Failed to update records: ${errorMessages}`,
        updatedCount: 0,
        errorCount: errorCount,
        errors: errors.slice(0, 10) // Limit errors returned
      });
    } else if (errorCount > 0) {
      // Partial success
      const errorMessages = errors.slice(0, 5).map(e => e.error).join('; ');
      return res.status(200).json({
        success: true,
        message: `Updated ${successCount} record(s) successfully. ${errorCount} record(s) failed to update.`,
        updatedCount: successCount,
        errorCount: errorCount,
        errors: errors.slice(0, 10) // Limit errors returned
      });
    }

    // Log the operation
    try {
      // Build results array for logging
      const results = updates.map((update, index) => ({
        success: index < successCount,
        id: update.Id
      }));
      
      logBulkOperation(
        'update',
        targetObjectName,
        req.user.email,
        results,
        {
          operation: 'field_mapping',
          sourceObject: sourceObject,
          targetObject: targetObject,
          mappingsCount: mappings.length,
          successCount,
          errorCount
        }
      );
    } catch (logError) {
      console.error('Error logging bulk operation:', logError);
      // Don't fail the request if logging fails
    }
    
    // Log to audit logs
    try {
      const auditLogger = require('../../utils/auditLogger');
      if (successCount > 0) {
        auditLogger.logAuditEvent({
          user: req.user.email,
          action: 'Modified',
          objectType: targetObject,
          objectId: null, // Bulk operation
          objectName: `Field Mapping: ${successCount} record(s)`,
          salesforceId: null,
          status: errorCount === 0 ? 'success' : 'partial',
          details: {
            operation: 'field_mapping',
            sourceObject: sourceObject,
            targetObject: targetObject,
            mappingsCount: mappings.length,
            recordsUpdated: successCount,
            recordsFailed: errorCount
          }
        });
      }
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json({
      success: true,
      message: `Successfully updated ${successCount} record(s) with field mapping`,
      updatedCount: successCount,
      errorCount: errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error executing field mapping:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errorCode: error.errorCode,
      statusCode: error.statusCode
    });
    res.status(500).json({
      success: false,
      error: error.message || error.errorCode || 'Failed to execute field mapping',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

module.exports = router;

