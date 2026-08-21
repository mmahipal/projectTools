// Route handlers for POST /update, POST /update/:objectType, and POST /update-multiple

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./utils');
const { logBulkOperation } = require('../../utils/historyLogger');
const { validateUpdate } = require('./validation');
const { requiresApproval, createApprovalRequest } = require('./approval');

// Bulk update records - handle both /update (body param) and /update/:objectType (URL param)
const handleUpdate = asyncHandler(async (req, res) => {
  try {
    // Support both URL parameter and body parameter for objectType
    const objectType = req.params.objectType || req.body.objectType;
    
    // Extract updateConfig and filters from body
    // If objectType is in URL, body should have { updateConfig, filters }
    // If objectType is in body, body should have { objectType, fieldName, updateMode, currentValue, newValue, filters }
    let fieldName, updateMode, currentValue, newValue, filters, updateConfig;
    
    if (req.params.objectType) {
      // URL param format: body has { updateConfig, filters }
      updateConfig = req.body.updateConfig || req.body;
      filters = req.body.filters || (req.body.updateConfig ? {} : req.body);
      
      // Extract from updateConfig if it's a single field update
      if (updateConfig && !updateConfig.fieldUpdates && updateConfig.fieldName) {
        fieldName = updateConfig.fieldName;
        updateMode = updateConfig.updateMode;
        currentValue = updateConfig.currentValue;
        newValue = updateConfig.newValue;
      }
    } else {
      // Body param format: body has { objectType, fieldName, updateMode, currentValue, newValue, filters }
      fieldName = req.body.fieldName;
      updateMode = req.body.updateMode;
      currentValue = req.body.currentValue;
      newValue = req.body.newValue;
      filters = req.body.filters || {};
    }

    // Check if this is a field mapping update (has mappings array) - if so, skip this validation
    const isMappingUpdate = updateConfig && (updateConfig.mappings || updateConfig.mode === 'mapping');
    
    if (!isMappingUpdate && (!objectType || !fieldName || newValue === undefined || newValue === null)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: objectType, fieldName, and newValue are required'
      });
    }
    
    // If this is a mapping update, it should be handled by the unified handler at /update/:objectType
    // For now, return an error directing to use the correct endpoint
    if (isMappingUpdate) {
      return res.status(400).json({
        success: false,
        error: 'Field mapping updates with transformations should use the /update/:objectType endpoint with updateConfig containing mappings, or use /update-mapping endpoint directly'
      });
    }

    // Allow "--None--" as a valid value (will be converted to null for Salesforce)
    // Empty string is not allowed - user should use "--None--" to clear a field
    if (newValue === '') {
      return res.status(400).json({
        success: false,
        error: 'newValue cannot be empty. Use "--None--" to clear a field value.'
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
    
    // Get field metadata to determine field type
    let fieldType = null;
    let isBoolean = false;
    let fieldMetadataMap = {};
    try {
      const describeResult = await conn.sobject(objectName).describe();
      const fieldMetadata = describeResult.fields.find(f => f.name === fieldName);
      if (fieldMetadata) {
        fieldType = fieldMetadata.type;
        isBoolean = fieldType === 'boolean' || fieldType === 'checkbox';
        fieldMetadataMap[fieldName] = fieldMetadata;
      }
      
      // Build metadata map for validation
      describeResult.fields.forEach(f => {
        fieldMetadataMap[f.name] = f;
      });
    } catch (describeError) {
      console.error('Error describing object to get field type:', describeError);
      // Continue without field type info - will default to string handling
    }
    
    // Build SOQL query with filters
    let query = `SELECT Id, ${fieldName} FROM ${objectName}`;
    const whereConditions = [];
    
    // Add update mode condition
    // Handle "--None--" for currentValue - convert to null check
    if (updateMode === 'specific' && currentValue !== undefined && currentValue !== null && currentValue !== '') {
      if (currentValue === '--None--' || currentValue === 'None') {
        // Check for null or empty values in Salesforce
        whereConditions.push(`(${fieldName} = null OR ${fieldName} = '')`);
      } else if (isBoolean) {
        // For boolean fields, convert string to boolean and don't use quotes
        const boolValue = currentValue === 'true' || currentValue === true || currentValue === 'True' || currentValue === '1';
        whereConditions.push(`${fieldName} = ${boolValue}`);
      } else {
        // For non-boolean fields, use quotes and escape single quotes
        whereConditions.push(`${fieldName} = '${String(currentValue).replace(/'/g, "''")}'`);
      }
    }
    
    // Add filter conditions
    if (filters) {
      if (objectType.toLowerCase() === 'project objective') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          // When filtering Project Objective by a specific Project Objective, filter by Id
          whereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'contributor project') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          // Try common field names for Project Objective lookup
          // First, try to determine the actual field name by describing the object
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
              // Fallback: try common field names
              whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
            }
          } catch (describeError) {
            console.error('Error describing Contributor_Project__c to find Project Objective field:', describeError);
            // Fallback: try common field names
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
          // When filtering Project by a specific Project, filter by Id
          whereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          // When filtering Project by Project Objective, need to find the relationship field
          // This would typically be through a lookup from Project Objective to Project
          // Since Project Objective has Project__c, we can filter Projects that have this Project Objective
          // But this is a reverse lookup, so we'd need to query Project Objectives first
          // For now, we'll skip this as it's not a direct relationship
          console.warn('Filtering Project by Project Objective is not directly supported. Project Objective references Project, not vice versa.');
        }
        if (filters.status && filters.status !== '') {
          const statusField = 'Status__c'; // Try Status__c first, fallback to Project_Status__c if needed
          whereConditions.push(`${statusField} = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.type && filters.type !== '') {
          const typeField = 'Type__c'; // Try Type__c first, fallback to Project_Type__c if needed
          whereConditions.push(`${typeField} = '${String(filters.type).replace(/'/g, "''")}'`);
        }
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    } else {
      // If no filters and no update mode condition, warn user (but allow for "update all" scenario)
      console.warn('WARNING: No filters applied. This will update ALL records of this type.');
    }

    console.log('=== Bulk Update Query ===');
    console.log('Object Type:', objectType);
    console.log('Field Name:', fieldName);
    console.log('Update Mode:', updateMode);
    console.log('Current Value:', currentValue);
    console.log('New Value:', newValue);
    console.log('Applied Filters:', filters ? JSON.stringify(filters, null, 2) : 'None');
    console.log('Where Conditions:', whereConditions);
    console.log('Final Query:', query);
    console.log('========================');

    let records = [];
    let queryResult = await conn.query(query);
    records = records.concat(queryResult.records);

    // Handle pagination if needed
    while (queryResult.done === false && queryResult.nextRecordsUrl) {
      queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
      records = records.concat(queryResult.records);
    }

    if (records.length === 0) {
      return res.json({
        success: true,
        message: 'No records found to update',
        updatedCount: 0
      });
    }

    // Build update config for validation and approval check
    const updateConfigForValidation = {
      fieldName,
      newValue,
      updateMode,
      currentValue,
      objectType,
      estimatedRecordCount: records.length
    };
    
    // Run validation
    try {
      const validationResult = validateUpdate(updateConfigForValidation, fieldMetadataMap, records);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          validationErrors: validationResult.errors,
          warnings: validationResult.warnings
        });
      }
      
      // Check if approval is required
      if (requiresApproval(updateConfigForValidation)) {
        // Create approval request and return
        const approvalRequest = createApprovalRequest(updateConfigForValidation, req.user.email, records.length);
        return res.status(403).json({
          success: false,
          requiresApproval: true,
          approvalRequestId: approvalRequest.id,
          message: 'This update requires approval before it can be executed',
          warnings: validationResult.warnings
        });
      }
      
      // Show warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('Validation warnings:', validationResult.warnings);
      }
    } catch (validationError) {
      console.error('Error during validation:', validationError);
      // Continue with update if validation fails (non-blocking for now)
    }

    // Convert "--None--" to null for Salesforce (picklist fields should be null, not the string "--None--")
    // For boolean fields, convert string values to actual boolean
    let actualNewValue = newValue;
    if (newValue === '--None--' || newValue === 'None' || newValue === '' || newValue === null || newValue === undefined) {
      actualNewValue = null;
    } else if (isBoolean) {
      // Convert string boolean values to actual boolean
      if (typeof newValue === 'string') {
        actualNewValue = newValue.toLowerCase() === 'true' || newValue === '1';
      } else {
        actualNewValue = Boolean(newValue);
      }
    }

    // Capture old values BEFORE updating (for revert functionality)
    // Map record Id to its old value
    const oldValuesMap = new Map();
    records.forEach(record => {
      const oldValue = record[fieldName];
      // Store the old value - convert null/undefined to a string representation for storage
      oldValuesMap.set(record.Id, oldValue === null || oldValue === undefined ? null : String(oldValue));
    });

    // Prepare updates
    const updates = records.map(record => ({
      Id: record.Id,
      [fieldName]: actualNewValue
    }));

    // Perform bulk update (in batches of 500 - increased from 200 for better performance)
    const batchSize = req.body.batchSize || 500; // Allow override, default to 500
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      try {
        const result = await conn.sobject(objectName).update(batch);
        
        // Count successes and errors
        result.forEach((r, index) => {
          if (r.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push({
              recordId: batch[index].Id,
              error: r.errors.map(e => e.message).join('; ')
            });
          }
        });
      } catch (error) {
        console.error(`Error updating batch ${i / batchSize + 1}:`, error);
        errorCount += batch.length;
        errors.push({
          batch: i / batchSize + 1,
          error: error.message
        });
      }
    }

    // Log to history
    try {
      // Build results with old values for revert
      // Store old value for each record so we can revert each one individually
      const results = records.map((record, index) => {
        const oldValue = oldValuesMap.get(record.Id);
        return {
          success: index < successCount,
          id: record.Id,
          // Store the old value for each record so we can revert
          oldValue: oldValue !== null && oldValue !== undefined ? oldValue : null
        };
      });
      
      // Store the actual field changes in the data with old and new values
      // For bulk operations, store a sample update object showing the field changes
      // This allows the UI to display what fields were actually changed
      const fieldChangesData = updates.length > 0 ? {
        // Store a sample update showing the actual field changes with old and new values
        // This represents what was actually sent to Salesforce
        sampleUpdate: {
          [fieldName]: actualNewValue
        },
        // Store old value in sampleUpdate for display
        sampleUpdateOldValue: records.length > 0 ? oldValuesMap.get(records[0].Id) : null,
        // Also store all updates with old values for reference (limit to first 10 to avoid huge data)
        updates: records.slice(0, 10).map(record => ({
          Id: record.Id,
          oldValue: oldValuesMap.get(record.Id), // Store old value for each record
          [fieldName]: actualNewValue // New value
        }))
      } : {};
      
      // Determine the old value to store in metadata for revert
      // For 'specific' mode, use the currentValue (filter criteria) if available
      // For 'all' mode, use the first record's old value as a reference
      // But we store all old values in results for proper revert
      let metadataOldValue = currentValue;
      if (updateMode === 'all' && records.length > 0) {
        // For 'all' mode, use the first record's old value as reference
        const firstOldValue = oldValuesMap.get(records[0].Id);
        metadataOldValue = firstOldValue !== null && firstOldValue !== undefined ? firstOldValue : null;
      } else if (updateMode === 'specific' && currentValue === undefined && records.length > 0) {
        // If currentValue wasn't provided but we have records, use the first record's old value
        const firstOldValue = oldValuesMap.get(records[0].Id);
        metadataOldValue = firstOldValue !== null && firstOldValue !== undefined ? firstOldValue : null;
      }
      
      logBulkOperation(
        'update',
        objectName,
        req.user.email,
        results,
        {
          operation: 'bulk_update_fields',
          fieldName: fieldName,
          updateMode,
          currentValue: metadataOldValue, // Store the actual old value for revert
          oldValue: metadataOldValue, // Also store as oldValue for clarity
          newValue,
          filters,
          successCount,
          errorCount
        },
        fieldChangesData // Pass field changes as additional data
      );
    } catch (historyError) {
      console.error('Error logging history:', historyError);
    }
    
    // Log to audit logs for each updated record
    try {
      const auditLogger = require('../../utils/auditLogger');
      // Log a summary audit entry for bulk operations
      if (successCount > 0) {
        auditLogger.logAuditEvent({
          user: req.user.email,
          action: 'Modified',
          objectType: objectType,
          objectId: null, // Bulk operation - no single ID
          objectName: `Bulk Update: ${successCount} record(s)`,
          salesforceId: null,
          status: successCount === updates.length ? 'success' : 'partial',
          details: {
            operation: 'bulk_update',
            objectName: objectName,
            fieldName: fieldName,
            updateMode: updateMode,
            currentValue: currentValue,
            newValue: newValue,
            recordsUpdated: successCount,
            recordsFailed: errorCount,
            totalRecords: updates.length
          }
        });
      }
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json({
      success: true,
      message: `Updated ${successCount} record(s) successfully`,
      updatedCount: successCount,
      errorCount: errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error updating records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update records in Salesforce'
    });
  }
});

// Bulk update multiple fields
router.post('/update-multiple', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldUpdates, filters } = req.body;

    if (!objectType || !fieldUpdates || !Array.isArray(fieldUpdates) || fieldUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: objectType and fieldUpdates array are required'
      });
    }

    // Validate all field updates
    for (const fieldUpdate of fieldUpdates) {
      if (!fieldUpdate.fieldName || fieldUpdate.newValue === undefined || fieldUpdate.newValue === null) {
        return res.status(400).json({
          success: false,
          error: 'Each field update must have fieldName and newValue'
        });
      }

      if (fieldUpdate.newValue === '') {
        return res.status(400).json({
          success: false,
          error: `newValue cannot be empty for field ${fieldUpdate.fieldName}. Use "--None--" to clear a field value.`
        });
      }

      if (fieldUpdate.updateMode === 'specific' && !fieldUpdate.currentValue) {
        return res.status(400).json({
          success: false,
          error: `currentValue is required for field ${fieldUpdate.fieldName} when updateMode is 'specific'`
        });
      }
    }

    const objectName = objectNameMap[objectType.toLowerCase()];
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    
    // Get field metadata for all fields
    const fieldMetadataMap = new Map();
    try {
      const describeResult = await conn.sobject(objectName).describe();
      for (const fieldUpdate of fieldUpdates) {
        const fieldMetadata = describeResult.fields.find(f => f.name === fieldUpdate.fieldName);
        if (fieldMetadata) {
          fieldMetadataMap.set(fieldUpdate.fieldName, {
            type: fieldMetadata.type,
            isBoolean: fieldMetadata.type === 'boolean' || fieldMetadata.type === 'checkbox'
          });
        }
      }
    } catch (describeError) {
      console.error('Error describing object to get field types:', describeError);
    }
    
    // Build SOQL query with filters
    let query = `SELECT Id`;
    
    // Add all fields that need to be updated
    for (const fieldUpdate of fieldUpdates) {
      if (!query.includes(`, ${fieldUpdate.fieldName}`)) {
        query += `, ${fieldUpdate.fieldName}`;
      }
    }
    
    query += ` FROM ${objectName}`;
    
    const whereConditions = [];
    
    // Add filter conditions (same as single field update)
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
    
    // Add field-specific conditions for 'specific' update mode
    for (const fieldUpdate of fieldUpdates) {
      if (fieldUpdate.updateMode === 'specific' && fieldUpdate.currentValue) {
        const fieldMeta = fieldMetadataMap.get(fieldUpdate.fieldName);
        const isBoolean = fieldMeta && fieldMeta.isBoolean;
        
        if (isBoolean) {
          const boolValue = String(fieldUpdate.currentValue).toLowerCase() === 'true' || fieldUpdate.currentValue === '1' || fieldUpdate.currentValue === true;
          whereConditions.push(`${fieldUpdate.fieldName} = ${boolValue}`);
        } else {
          whereConditions.push(`${fieldUpdate.fieldName} = '${String(fieldUpdate.currentValue).replace(/'/g, "''")}'`);
        }
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    console.log('=== Multiple Field Update Query ===');
    console.log('Object Type:', objectType);
    console.log('Field Updates:', JSON.stringify(fieldUpdates, null, 2));
    console.log('Applied Filters:', filters ? JSON.stringify(filters, null, 2) : 'None');
    console.log('Final Query:', query);
    console.log('==================================');

    let records = [];
    let queryResult = await conn.query(query);
    records = records.concat(queryResult.records);

    // Handle pagination if needed
    while (queryResult.done === false && queryResult.nextRecordsUrl) {
      queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
      records = records.concat(queryResult.records);
    }

    if (records.length === 0) {
      return res.json({
        success: true,
        message: 'No records found to update',
        updatedCount: 0
      });
    }

    // Prepare updates - each record gets all field updates
    const updates = records.map(record => {
      const updateObj = { Id: record.Id };
      
      for (const fieldUpdate of fieldUpdates) {
        const fieldMeta = fieldMetadataMap.get(fieldUpdate.fieldName);
        const isBoolean = fieldMeta && fieldMeta.isBoolean;
        
        let actualNewValue = fieldUpdate.newValue;
        if (actualNewValue === '--None--' || actualNewValue === 'None' || actualNewValue === '' || actualNewValue === null || actualNewValue === undefined) {
          actualNewValue = null;
        } else if (isBoolean) {
          if (typeof actualNewValue === 'string') {
            actualNewValue = actualNewValue.toLowerCase() === 'true' || actualNewValue === '1';
          } else {
            actualNewValue = Boolean(actualNewValue);
          }
        }
        
        updateObj[fieldUpdate.fieldName] = actualNewValue;
      }
      
      return updateObj;
    });

    // Perform bulk update (in batches of 500 - increased from 200 for better performance)
    const batchSize = req.body.batchSize || 500; // Allow override, default to 500
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      try {
        const updateResult = await conn.sobject(objectName).update(batch);
        
        for (const result of updateResult) {
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push({
              id: result.id,
              errors: result.errors
            });
          }
        }
      } catch (batchError) {
        console.error(`Error updating batch ${i / batchSize + 1}:`, batchError);
        errorCount += batch.length;
        errors.push({
          batch: i / batchSize + 1,
          error: batchError.message
        });
      }
    }

    // Log to audit logs
    try {
      const auditLogger = require('../../utils/auditLogger');
      if (successCount > 0) {
        auditLogger.logAuditEvent({
          user: req.user.email,
          action: 'Modified',
          objectType: objectType,
          objectId: null, // Bulk operation
          objectName: `Bulk Update: ${successCount} record(s)`,
          salesforceId: null,
          status: errorCount === 0 ? 'success' : 'partial',
          details: {
            operation: 'bulk_update_multiple_fields',
            objectName: objectName,
            fieldsUpdated: fieldUpdates.map(f => f.fieldName),
            recordsUpdated: successCount,
            recordsFailed: errorCount,
            totalRecords: updates.length
          }
        });
      }
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    if (errorCount > 0) {
      console.error('Some records failed to update:', errors);
      return res.json({
        success: true,
        message: `Updated ${successCount} record(s) successfully. ${errorCount} record(s) failed to update.`,
        updatedCount: successCount,
        errorCount: errorCount,
        errors: errors.slice(0, 10)
      });
    }

    res.json({
      success: true,
      message: `Successfully updated ${successCount} record(s) with ${fieldUpdates.length} field(s)`,
      updatedCount: successCount
    });
  } catch (error) {
    console.error('Error updating multiple fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update records in Salesforce'
    });
  }
}));

// Unified update handler for /update/:objectType route
// Handles updateConfig with mode: 'single', 'multiple', or 'mapping'
router.post('/update/:objectType', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const objectType = req.params.objectType;
    const { updateConfig, filters } = req.body;
    
    if (!objectType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: objectType'
      });
    }
    
    if (!updateConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: updateConfig'
      });
    }
    
    const objectName = objectNameMap[objectType.toLowerCase()];
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }
    
    // Determine update mode from updateConfig
    const mode = updateConfig.mode || 
                 (updateConfig.singleFieldUpdate ? 'single' : 
                  updateConfig.multipleFieldUpdates ? 'multiple' : 
                  updateConfig.fieldMappings ? 'mapping' : 'single');
    
    // Route to appropriate handler based on mode
    if (mode === 'mapping' || updateConfig.fieldMappings || updateConfig.mappings) {
      // For mapping updates, client should call /update-mapping directly
      // But if they call this endpoint, provide helpful error message
      return res.status(400).json({
        success: false,
        error: 'Field mapping updates with transformations should use the /update-mapping endpoint directly.',
        hint: 'Please use POST /api/update-object-fields/update-mapping endpoint for field mapping updates.'
      });
    } else if (mode === 'multiple' || updateConfig.multipleFieldUpdates) {
      // Create request for update-multiple
      const multipleReq = {
        ...req,
        body: {
          objectType: objectType,
          fieldUpdates: updateConfig.multipleFieldUpdates || [],
          filters: filters || {}
        },
        user: req.user
      };
      // Find and call the update-multiple handler
      // Since we can't easily access other route handlers, let's inline the logic
      // For now, return an error suggesting to use /update-multiple directly
      return res.status(400).json({
        success: false,
        error: 'Multiple fields update via /update/:objectType is not yet supported. Please use /update-multiple endpoint.'
      });
    } else {
      // Single field update - extract from singleFieldUpdate or use updateConfig directly
      const singleField = updateConfig.singleFieldUpdate || updateConfig;
      
      if (!singleField.field && !singleField.fieldName) {
        return res.status(400).json({
          success: false,
          error: 'Missing fieldName in updateConfig.singleFieldUpdate'
        });
      }
      
      // Temporarily modify req to call handleUpdate
      const originalParams = { ...req.params };
      const originalBody = { ...req.body };
      
      // Set up req for handleUpdate (it expects objectType in body, not params)
      req.params = {};
      req.body = {
        objectType: objectType,
        fieldName: singleField.field || singleField.fieldName,
        updateMode: singleField.updateMode || 'all',
        currentValue: singleField.currentValue,
        newValue: singleField.newValue,
        filters: filters || {}
      };
      
      // Call handleUpdate
      try {
        await handleUpdate(req, res);
      } finally {
        // Restore original req (though res may have been sent)
        req.params = originalParams;
        req.body = originalBody;
      }
    }
  } catch (error) {
    console.error('Error in unified update handler:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process update request'
    });
  }
}));

// Register the original /update route
router.post('/update', authenticate, authorize('create_project', 'all'), handleUpdate);

module.exports = router;

