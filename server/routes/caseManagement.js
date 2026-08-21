const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSalesforceConnection } = require('./updateObjectFields/utils');
const { validateAndSanitizeSearchTerm } = require('../utils/security');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get available Case fields
router.get('/fields', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject('Case').describe();
    
    const fields = describeResult.fields
      .filter(field => field.updateable || field.createable || field.type === 'reference')
      .map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        updateable: field.updateable,
        createable: field.createable,
        picklistValues: field.picklistValues ? field.picklistValues.map(pv => pv.value) : null,
        referenceTo: field.referenceTo && field.referenceTo.length > 0 ? field.referenceTo[0] : null
      }));
    
    res.json({
      success: true,
      fields: fields
    });
  } catch (error) {
    console.error('Error fetching Case fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Case fields'
    });
  }
}));

// Get cases with filters
router.get('/cases', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const { status, orderBy, orderDirection, fields, filters } = req.query;
    
    // Get Case object metadata to validate fields
    const describeResult = await conn.sobject('Case').describe();
    const validFieldNames = new Set(describeResult.fields.map(f => f.name));
    
    // Build field list - always include Id and CaseNumber
    const fieldSet = new Set(['Id', 'CaseNumber']);
    let needsContact = false;
    let needsOwner = false;
    
    // Helper to check if field exists
    const isValidField = (fieldName) => {
      if (fieldName.includes('.')) {
        // Relationship fields are valid if the base field exists
        const baseField = fieldName.split('.')[0];
        return validFieldNames.has(baseField + 'Id') || validFieldNames.has(baseField);
      }
      return validFieldNames.has(fieldName);
    };
    
    // Add requested fields
    if (fields) {
      const requestedFields = fields.split(',').map(f => f.trim());
      requestedFields.forEach(field => {
        if (field === 'ContactId') {
          needsContact = true;
          fieldSet.add('ContactId');
        } else if (field === 'OwnerId') {
          needsOwner = true;
          fieldSet.add('OwnerId');
        } else if (field === 'Contact.Name') {
          needsContact = true;
        } else if (field === 'Owner.Name') {
          needsOwner = true;
        } else if (field !== 'ContactId' && field !== 'OwnerId' && field !== 'Contact.Name' && field !== 'Owner.Name') {
          // Only add if field exists
          if (isValidField(field)) {
            fieldSet.add(field);
          } else {
            console.warn(`Field ${field} does not exist on Case object, skipping`);
          }
        }
      });
    } else {
      // Default fields - check if they exist first
      const defaultFields = ['Case_Reason__c', 'Type', 'Status', 'CreatedDate', 'ContactId', 'OwnerId'];
      defaultFields.forEach(field => {
        if (isValidField(field)) {
          fieldSet.add(field);
        }
      });
      needsContact = true;
      needsOwner = true;
    }
    
    // Build SOQL query - handle relationship fields properly
    const fieldArray = Array.from(fieldSet);
    
    // Add relationship queries if ContactId or OwnerId are requested (to get names)
    if (needsContact) {
      if (!fieldArray.includes('ContactId')) {
        fieldArray.push('ContactId');
      }
      fieldArray.push('Contact.Name');
      fieldArray.push('Contact.Id');
    }
    
    if (needsOwner) {
      if (!fieldArray.includes('OwnerId')) {
        fieldArray.push('OwnerId');
      }
      fieldArray.push('Owner.Name');
      fieldArray.push('Owner.Id');
    }
    
    const selectFields = fieldArray.join(', ');
    let query = `SELECT ${selectFields} FROM Case`;
    
    // Build WHERE clause
    const whereConditions = [];
    
    // Default: Open cases (any case that is NOT Closed AND NOT Solved)
    // This means excluding cases with Status = 'Closed' or Status = 'Solved'
    const hasCustomFilters = filters && filters.trim() !== '';
    if (status && status.trim() !== '' && !hasCustomFilters) {
      if (status.toLowerCase() === 'open') {
        // Open cases = all cases except Closed and Solved
        whereConditions.push(`Status != 'Closed' AND Status != 'Solved'`);
      } else {
        // For other status values, use exact match
        whereConditions.push(`Status = '${status.replace(/'/g, "''")}'`);
      }
    } else if (!hasCustomFilters) {
      // If no status is provided and no custom filters, default to open cases
      whereConditions.push(`Status != 'Closed' AND Status != 'Solved'`);
    }
    
    // Apply filters
    if (filters) {
      try {
        const filterArray = JSON.parse(filters);
        filterArray.forEach(filter => {
          if (filter.field && filter.operator) {
            let condition = '';
            const fieldName = filter.field;
            
            // Validate field exists
            if (!isValidField(fieldName)) {
              console.warn(`Filter field ${fieldName} does not exist on Case object, skipping`);
              return;
            }
            
            // Handle date/datetime fields
            const fieldMeta = describeResult.fields.find(f => f.name === fieldName);
            const isDateField = fieldMeta && fieldMeta.type === 'date';
            const isDateTimeField = fieldMeta && fieldMeta.type === 'datetime';
            const isNumberField = fieldMeta && (fieldMeta.type === 'int' || fieldMeta.type === 'double' || fieldMeta.type === 'currency' || fieldMeta.type === 'percent');
            
            // Format value based on field type
            let escapedValue = '';
            if (filter.value) {
              if (isDateTimeField) {
                // For datetime fields, convert to SOQL format: YYYY-MM-DDTHH:mm:ssZ
                let dateValue = String(filter.value);
                // Replace space with T if present
                dateValue = dateValue.replace(' ', 'T');
                // Add seconds and timezone if not present
                if (!dateValue.includes('Z') && !dateValue.match(/\+\d{2}:\d{2}$/)) {
                  if (dateValue.includes('T')) {
                    // Has time component, add seconds and Z
                    if (!dateValue.match(/:\d{2}(Z|[\+\-]\d{2}:\d{2})$/)) {
                      dateValue = dateValue.replace(/:(\d{2})(Z|[\+\-]|$)/, ':$1:00$2');
                      if (!dateValue.includes('Z') && !dateValue.match(/[\+\-]\d{2}:\d{2}$/)) {
                        dateValue = dateValue + 'Z';
                      }
                    }
                  } else {
                    // Date only, add time
                    dateValue = dateValue + 'T00:00:00Z';
                  }
                }
                escapedValue = `'${dateValue}'`;
              } else if (isDateField) {
                // For date fields, use YYYY-MM-DD format
                escapedValue = `'${String(filter.value)}'`;
              } else if (isNumberField) {
                // For numbers, don't quote
                escapedValue = String(filter.value);
              } else {
                // For text fields, escape single quotes and wrap in quotes
                escapedValue = `'${String(filter.value).replace(/'/g, "''")}'`;
              }
            }
            
            switch (filter.operator) {
              case 'equals':
                if (isNumberField) {
                  condition = `${fieldName} = ${escapedValue}`;
                } else {
                  condition = `${fieldName} = ${escapedValue}`;
                }
                break;
              case 'notEquals':
                if (isNumberField) {
                  condition = `${fieldName} != ${escapedValue}`;
                } else {
                  condition = `${fieldName} != ${escapedValue}`;
                }
                break;
              case 'contains':
                // Contains only works with text fields
                const textValue = filter.value ? String(filter.value).replace(/'/g, "''") : '';
                condition = `${fieldName} LIKE '%${textValue}%'`;
                break;
              case 'notContains':
                const textValue2 = filter.value ? String(filter.value).replace(/'/g, "''") : '';
                condition = `NOT (${fieldName} LIKE '%${textValue2}%')`;
                break;
              case 'startsWith':
                const textValue3 = filter.value ? String(filter.value).replace(/'/g, "''") : '';
                condition = `${fieldName} LIKE '${textValue3}%'`;
                break;
              case 'endsWith':
                const textValue4 = filter.value ? String(filter.value).replace(/'/g, "''") : '';
                condition = `${fieldName} LIKE '%${textValue4}'`;
                break;
              case 'greaterThan':
                if (isNumberField) {
                  condition = `${fieldName} > ${escapedValue}`;
                } else {
                  condition = `${fieldName} > ${escapedValue}`;
                }
                break;
              case 'lessThan':
                if (isNumberField) {
                  condition = `${fieldName} < ${escapedValue}`;
                } else {
                  condition = `${fieldName} < ${escapedValue}`;
                }
                break;
              case 'greaterThanOrEqual':
                if (isNumberField) {
                  condition = `${fieldName} >= ${escapedValue}`;
                } else {
                  condition = `${fieldName} >= ${escapedValue}`;
                }
                break;
              case 'lessThanOrEqual':
                if (isNumberField) {
                  condition = `${fieldName} <= ${escapedValue}`;
                } else {
                  condition = `${fieldName} <= ${escapedValue}`;
                }
                break;
              case 'isEmpty':
                condition = `(${fieldName} = '' OR ${fieldName} = null)`;
                break;
              case 'isNotEmpty':
                condition = `(${fieldName} != '' AND ${fieldName} != null)`;
                break;
              default:
                if (isNumberField) {
                  condition = `${fieldName} = ${escapedValue}`;
                } else {
                  condition = `${fieldName} = ${escapedValue}`;
                }
            }
            
            if (condition) {
              whereConditions.push(condition);
            }
          }
        });
      } catch (parseError) {
        console.error('Error parsing filters:', parseError);
        console.error('Filter string:', filters);
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Apply GPC filter
    const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
    query = applyGPCFilterToQuery(query, req, { accountField: 'AccountId', projectField: 'Project__c' });
    
    // Add ORDER BY
    const orderByField = orderBy || 'CreatedDate';
    const orderDir = (orderDirection || 'DESC').toUpperCase();
    query += ` ORDER BY ${orderByField} ${orderDir}`;
    
    console.log('Case query:', query);
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      console.error('SOQL Query Error:', queryError);
      console.error('Failed query:', query);
      throw new Error(`SOQL Query Error: ${queryError.message}`);
    }
    
    // Process results to flatten relationship fields
    const processedCases = result.records.map(record => {
      const processed = { ...record };
      
      // Flatten Contact relationship if it exists
      if (record.Contact) {
        processed['Contact.Name'] = record.Contact.Name || '';
        processed['Contact.Id'] = record.Contact.Id || '';
        // Remove nested object to avoid confusion
        delete processed.Contact;
      }
      
      // Flatten Owner relationship if it exists
      if (record.Owner) {
        processed['Owner.Name'] = record.Owner.Name || '';
        processed['Owner.Id'] = record.Owner.Id || '';
        // Remove nested object to avoid confusion
        delete processed.Owner;
      }
      
      return processed;
    });
    
    res.json({
      success: true,
      cases: processedCases,
      totalSize: result.totalSize
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cases',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Get single case by ID
router.get('/cases/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const { id } = req.params;
    
    // Get all fields for the case
    const describeResult = await conn.sobject('Case').describe();
    const fieldNames = [];
    const relationshipFields = [];
    
    // Process fields and identify relationship fields
    // Map: fieldName -> { relName: string, nameField: string }
    const relationshipMap = new Map();
    
    // Fields that should not have relationship queries (special Salesforce fields)
    const skipRelationshipFields = ['MasterRecordId', 'ParentId'];
    
    describeResult.fields.forEach(field => {
      fieldNames.push(field.name);
      
      // Skip special fields that don't have valid relationships
      if (skipRelationshipFields.includes(field.name)) {
        return;
      }
      
      // For reference fields, add relationship query only if relationshipName exists and is valid
      if (field.type === 'reference' && field.relationshipName && field.relationshipName.trim() !== '') {
        const relationshipName = field.relationshipName.trim();
        
        // Standard relationships (Contact, Owner, CreatedBy, LastModifiedBy) use different syntax
        if (field.name === 'ContactId') {
          relationshipFields.push('Contact.Name');
          relationshipFields.push('Contact.Id');
          relationshipFields.push('Contact.Email');
          relationshipMap.set('ContactId', { relName: 'Contact', nameField: 'Name' });
        } else if (field.name === 'OwnerId') {
          relationshipFields.push('Owner.Name');
          relationshipFields.push('Owner.Id');
          relationshipFields.push('Owner.Email');
          relationshipMap.set('OwnerId', { relName: 'Owner', nameField: 'Name' });
        } else if (field.name === 'CreatedById') {
          relationshipFields.push('CreatedBy.Name');
          relationshipFields.push('CreatedBy.Id');
          relationshipMap.set('CreatedById', { relName: 'CreatedBy', nameField: 'Name' });
        } else if (field.name === 'LastModifiedById') {
          relationshipFields.push('LastModifiedBy.Name');
          relationshipFields.push('LastModifiedBy.Id');
          relationshipMap.set('LastModifiedById', { relName: 'LastModifiedBy', nameField: 'Name' });
        } else {
          // Custom relationship fields
          // Use relationshipName exactly as provided by Salesforce metadata
          // Salesforce provides the correct relationship name, so use it directly
          if (relationshipName && 
              relationshipName !== 'null' && 
              relationshipName !== 'undefined' &&
              relationshipName.length > 0 &&
              !relationshipName.includes('undefined') &&
              !relationshipName.includes('null')) {
            try {
              // Use relationshipName exactly as provided by Salesforce metadata
              // Salesforce metadata provides the correct relationship name
              // For standard relationships: "Contact", "Owner", etc.
              // For custom relationships: usually already in format like "Account__r" or just the base name
              let relName = relationshipName;
              
              // For custom fields (ending with __c), the relationship name from metadata
              // is usually the correct relationship name (often already ends with __r)
              // Only modify if it's clearly not a relationship name format
              // Standard pattern: if field is Account__c, relationshipName might be "Account" or "Account__r"
              // If it's just "Account", we need to add __r for custom relationships
              // But if metadata says "Account__r", use it as-is
              
              // Check if this is a custom field (ends with __c)
              const isCustomField = field.name.endsWith('__c');
              
              if (isCustomField) {
                // For custom fields, relationship name from metadata should be correct
                // If it doesn't end with __r, it might need it (but metadata usually provides it correctly)
                // Try using as-is first, error handling will catch if it's wrong
                if (!relName.endsWith('__r') && !relName.endsWith('__c')) {
                  // Only append __r if it's clearly not already a relationship name
                  relName = `${relName}__r`;
                }
              }
              // For standard fields, use relationshipName as-is (Contact, Owner, etc.)
              
              // Additional validation: relationship name should be a valid identifier
              if (relName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(relName)) {
                // Determine the correct name field based on the referenced object
                // Case objects use CaseNumber instead of Name
                let nameField = 'Name';
                if (field.referenceTo && field.referenceTo.length > 0) {
                  const referencedObject = field.referenceTo[0];
                  if (referencedObject === 'Case') {
                    nameField = 'CaseNumber';
                  }
                  // Add other special cases here if needed
                }
                
                relationshipFields.push(`${relName}.${nameField}`);
                relationshipFields.push(`${relName}.Id`);
                relationshipMap.set(field.name, { relName, nameField });
                console.log(`Added relationship field for ${field.name}: ${relName}.${nameField} (from metadata: ${relationshipName}, references: ${field.referenceTo ? field.referenceTo.join(', ') : 'unknown'})`);
              } else {
                console.warn(`Skipping invalid relationship name for field ${field.name}: ${relName}`);
              }
            } catch (err) {
              console.warn(`Skipping relationship field ${field.name} with relationshipName ${relationshipName}:`, err.message);
            }
          } else {
            console.warn(`Skipping field ${field.name} - invalid relationshipName: ${relationshipName}`);
          }
        }
      }
    });
    
    // Build query with all fields and relationships
    // Try to build query, but if it fails due to invalid relationship, retry without problematic relationships
    let allFields = [...fieldNames, ...relationshipFields];
    let query = `SELECT ${allFields.join(', ')} FROM Case WHERE Id = '${id}' LIMIT 1`;
    
    console.log('Case detail query:', query);
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      // If query fails due to invalid relationship, try without relationship fields
      if (queryError.message && queryError.message.includes("Didn't understand relationship")) {
        console.warn('Query failed due to invalid relationship, retrying without relationship fields:', queryError.message);
        // Extract the problematic relationship from the error
        const match = queryError.message.match(/relationship '([^']+)'/);
        if (match) {
          const badRel = match[1];
          console.warn(`Removing problematic relationship: ${badRel}`);
          // Remove the problematic relationship fields
          allFields = allFields.filter(f => !f.startsWith(`${badRel}.`));
          // Also remove from relationshipMap
          for (const [fieldName, relInfo] of relationshipMap.entries()) {
            if (relInfo.relName === badRel) {
              relationshipMap.delete(fieldName);
            }
          }
          // Retry query without problematic relationship
          query = `SELECT ${allFields.join(', ')} FROM Case WHERE Id = '${id}' LIMIT 1`;
          console.log('Retrying case detail query without problematic relationship:', query);
          result = await conn.query(query);
        } else {
          // If we can't identify the problematic relationship, retry with only base fields
          console.warn('Cannot identify problematic relationship, retrying with only base fields');
          query = `SELECT ${fieldNames.join(', ')} FROM Case WHERE Id = '${id}' LIMIT 1`;
          result = await conn.query(query);
          relationshipMap.clear(); // Clear relationship map since we're not using relationships
        }
      } else {
        throw queryError;
      }
    }
    
    if (result.records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }
    
    const caseRecord = result.records[0];
    
    // Flatten all relationship fields
    relationshipMap.forEach((relInfo, fieldName) => {
      const { relName, nameField } = relInfo;
      if (caseRecord[relName]) {
        const relObj = caseRecord[relName];
        if (relName === 'Contact') {
          caseRecord['Contact.Name'] = relObj.Name || '';
          caseRecord['Contact.Id'] = relObj.Id || '';
          caseRecord['Contact.Email'] = relObj.Email || '';
        } else if (relName === 'Owner') {
          caseRecord['Owner.Name'] = relObj.Name || '';
          caseRecord['Owner.Id'] = relObj.Id || '';
          caseRecord['Owner.Email'] = relObj.Email || '';
        } else if (relName === 'CreatedBy') {
          caseRecord['CreatedBy.Name'] = relObj.Name || '';
          caseRecord['CreatedBy.Id'] = relObj.Id || '';
        } else if (relName === 'LastModifiedBy') {
          caseRecord['LastModifiedBy.Name'] = relObj.Name || '';
          caseRecord['LastModifiedBy.Id'] = relObj.Id || '';
        } else {
          // Custom relationship fields - use the correct name field (Name or CaseNumber)
          caseRecord[`${relName}.${nameField}`] = relObj[nameField] || '';
          caseRecord[`${relName}.Id`] = relObj.Id || '';
        }
        delete caseRecord[relName];
      }
    });
    
    res.json({
      success: true,
      case: caseRecord
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch case'
    });
  }
}));

// Update case
// Search reference records for case fields
router.get('/search-reference/:objectName', authenticate, asyncHandler(async (req, res) => {
  try {
    const { objectName } = req.params;
    const { search } = req.query;

    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: 'Object name is required'
      });
    }

    if (!search || search.trim() === '') {
      return res.json({
        success: true,
        records: []
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    
    // Validate and sanitize search term
    const sanitizedSearch = validateAndSanitizeSearchTerm(search);
    if (!sanitizedSearch) {
      return res.json({
        success: true,
        records: []
      });
    }
    
    // Try to describe the object to find the Name field
    let nameField = 'Name';
    try {
      const describeResult = await conn.sobject(objectName).describe();
      // Check if Name field exists
      const nameFieldExists = describeResult.fields.some(f => f.name === 'Name');
      if (!nameFieldExists) {
        // Try to find a common name field
        const commonNameFields = ['Name', 'Title', 'Subject', 'Label', 'CaseNumber'];
        for (const fieldName of commonNameFields) {
          if (describeResult.fields.some(f => f.name === fieldName)) {
            nameField = fieldName;
            break;
          }
        }
      }
    } catch (describeError) {
      console.error('Error describing object:', describeError);
      // Continue with default 'Name' field
    }

    // Build query - search by Name field
    const query = `SELECT Id, ${nameField} FROM ${objectName} WHERE ${nameField} LIKE '%${sanitizedSearch}%' ORDER BY ${nameField} LIMIT 50`;
    
    console.log('Case reference search query:', query);
    
    const result = await conn.query(query);
    
    const records = result.records.map(record => ({
      id: record.Id,
      name: record[nameField] || record.Name || 'Unknown'
    }));

    res.json({
      success: true,
      records: records
    });
  } catch (error) {
    console.error('Error searching reference records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search reference records'
    });
  }
}));

router.put('/cases/:id', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const { id } = req.params;
    const { updates } = req.body;
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    // Get field metadata to validate
    const describeResult = await conn.sobject('Case').describe();
    const fieldMap = new Map(describeResult.fields.map(f => [f.name, f]));
    
    // Filter updates to only include updateable fields
    const validUpdates = {};
    Object.keys(updates).forEach(key => {
      const field = fieldMap.get(key);
      if (field && field.updateable) {
        validUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updateable fields provided'
      });
    }
    
    // Update the case
    const updateResult = await conn.sobject('Case').update({
      Id: id,
      ...validUpdates
    });
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'Case updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: updateResult.errors?.[0]?.message || 'Failed to update case'
      });
    }
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update case'
    });
  }
}));

module.exports = router;

