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

// Get MFA Verification Logs
router.get('/logs', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const { orderBy = 'CreatedDate', orderDirection = 'DESC', filters, search } = req.query;
    
    // First, describe the object to get available fields
    const describeResult = await conn.sobject('MFA_Verification_Log__c').describe();
    const validFieldNames = new Set(describeResult.fields.map(f => f.name));
    
    // Helper to check if field exists
    const isValidField = (fieldName) => {
      // Direct field check
      if (validFieldNames.has(fieldName)) {
        return true;
      }
      
      // Check for relationship fields (e.g., Contact__r.Name)
      if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        const baseField = parts[0];
        // Check if base field exists (with or without __c suffix)
        if (validFieldNames.has(baseField) || 
            validFieldNames.has(baseField + '__c') ||
            validFieldNames.has(baseField.replace('__r', '__c'))) {
          return true;
        }
      }
      
      // Check if it's a standard field name without __c
      if (fieldName === 'Name' || fieldName === 'Id' || fieldName === 'CreatedDate' || fieldName === 'LastModifiedDate') {
        return true;
      }
      
      return false;
    };
    
    // Build list of fields to query - check if they exist first
    const fieldNames = [
      'Id',
      'Name',
      'Contact__c',
      'Flow__c',
      'Status__c',
      'IP_Address__c',
      'IPAddress__c',
      'CreatedDate',
      'LastModifiedDate'
    ];
    
    // Filter to only include fields that exist
    const availableFields = fieldNames.filter(fieldName => {
      return describeResult.fields.some(f => f.name === fieldName);
    });
    
    // Always add Contact relationship if Contact__c exists
    if (availableFields.includes('Contact__c')) {
      availableFields.push('Contact__r.Name');
      availableFields.push('Contact__r.Id');
    }
    
    // Also check for Contributor__c field (alternative name)
    if (describeResult.fields.some(f => f.name === 'Contributor__c')) {
      if (!availableFields.includes('Contributor__c')) {
        availableFields.push('Contributor__c');
      }
      availableFields.push('Contributor__r.Name');
      availableFields.push('Contributor__r.Id');
    }
    
    // Build SOQL query
    let query = `SELECT ${availableFields.join(', ')} FROM MFA_Verification_Log__c`;
    
    // Build WHERE clause
    const whereConditions = [];
    
    // Apply filters
    if (filters) {
      try {
        console.log('MFA Verification Logs: Received filters string:', filters);
        const filterArray = JSON.parse(filters);
        console.log('MFA Verification Logs: Parsed filters array:', filterArray);
        filterArray.forEach(filter => {
          if (filter.field && filter.operator) {
            let condition = '';
            const fieldName = filter.field;
            
            // Validate field exists
            if (!isValidField(fieldName)) {
              console.warn(`Filter field ${fieldName} does not exist on MFA_Verification_Log__c object, skipping`);
              console.warn(`Available fields:`, Array.from(validFieldNames).slice(0, 20));
              return;
            }
            
            console.log(`Processing filter: field=${fieldName}, operator=${filter.operator}, value=${filter.value}`);
            
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
                dateValue = dateValue.replace(' ', 'T');
                if (!dateValue.includes('Z') && !dateValue.match(/\+\d{2}:\d{2}$/)) {
                  if (dateValue.includes('T')) {
                    if (!dateValue.match(/:\d{2}(Z|[\+\-]\d{2}:\d{2})$/)) {
                      dateValue = dateValue.replace(/:(\d{2})(Z|[\+\-]|$)/, ':$1:00$2');
                      if (!dateValue.includes('Z') && !dateValue.match(/[\+\-]\d{2}:\d{2}$/)) {
                        dateValue = dateValue + 'Z';
                      }
                    }
                  } else {
                    dateValue = dateValue + 'T00:00:00Z';
                  }
                }
                escapedValue = `'${dateValue}'`;
              } else if (isDateField) {
                escapedValue = `'${String(filter.value)}'`;
              } else if (isNumberField) {
                escapedValue = String(filter.value);
              } else {
                escapedValue = `'${String(filter.value).replace(/'/g, "''")}'`;
              }
            }
            
            switch (filter.operator) {
              case 'equals':
                condition = `${fieldName} = ${escapedValue}`;
                break;
              case 'notEquals':
                condition = `${fieldName} != ${escapedValue}`;
                break;
              case 'contains':
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
                condition = `${fieldName} > ${escapedValue}`;
                break;
              case 'lessThan':
                condition = `${fieldName} < ${escapedValue}`;
                break;
              case 'greaterThanOrEqual':
                condition = `${fieldName} >= ${escapedValue}`;
                break;
              case 'lessThanOrEqual':
                condition = `${fieldName} <= ${escapedValue}`;
                break;
              case 'isEmpty':
                condition = `(${fieldName} = '' OR ${fieldName} = null)`;
                break;
              case 'isNotEmpty':
                condition = `(${fieldName} != '' AND ${fieldName} != null)`;
                break;
              default:
                condition = `${fieldName} = ${escapedValue}`;
            }
            
            if (condition) {
              whereConditions.push(condition);
              console.log('MFA Verification Logs: Added filter condition:', condition);
            }
          }
        });
        console.log('MFA Verification Logs: Total where conditions:', whereConditions.length);
      } catch (parseError) {
        console.error('Error parsing filters:', parseError);
        console.error('Filter string:', filters);
      }
    }
    
    // Add search across all text fields
    const sanitizedSearch = validateAndSanitizeSearchTerm(search);
    if (sanitizedSearch) {
      const searchConditions = [];
      
      // Search in common text fields
      if (availableFields.includes('Name')) {
        searchConditions.push(`Name LIKE '%${sanitizedSearch}%'`);
      }
      if (availableFields.includes('Contact__r.Name')) {
        searchConditions.push(`Contact__r.Name LIKE '%${sanitizedSearch}%'`);
      }
      if (availableFields.includes('Flow__c')) {
        searchConditions.push(`Flow__c LIKE '%${sanitizedSearch}%'`);
      }
      if (availableFields.includes('Status__c')) {
        searchConditions.push(`Status__c LIKE '%${sanitizedSearch}%'`);
      }
      if (availableFields.includes('IP_Address__c')) {
        searchConditions.push(`IP_Address__c LIKE '%${sanitizedSearch}%'`);
      }
      if (availableFields.includes('IPAddress__c')) {
        searchConditions.push(`IPAddress__c LIKE '%${sanitizedSearch}%'`);
      }
      
      if (searchConditions.length > 0) {
        whereConditions.push(`(${searchConditions.join(' OR ')})`);
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      console.log('MFA Verification Logs: Final query with WHERE clause:', query);
    }
    
    // Add ordering - check if field exists
    const validOrderBy = ['CreatedDate', 'LastModifiedDate', 'Name', 'Status__c'];
    let orderField = 'CreatedDate';
    if (validOrderBy.includes(orderBy)) {
      const orderFieldExists = describeResult.fields.some(f => f.name === orderBy);
      if (orderFieldExists) {
        orderField = orderBy;
      }
    }
    const orderDir = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${orderField} ${orderDir}`;
    
    // Add limit
    query += ' LIMIT 10000';
    
    console.log('MFA Verification Logs query:', query);
    
    const result = await conn.query(query);
    
    // Flatten relationship fields
    const logs = result.records.map((record, index) => {
      const flattened = { ...record };
      
      // Debug: log the record structure for first record
      if (index === 0) {
        console.log('Sample MFA Log record structure:', JSON.stringify(record, null, 2));
        console.log('Contact__r:', record.Contact__r);
        console.log('Contributor__r:', record.Contributor__r);
        console.log('Contact__c value:', record.Contact__c);
        console.log('Contributor__c value:', record.Contributor__c);
      }
      
      // Flatten Contact relationship - check multiple possible field names
      if (record.Contact__r) {
        flattened['Contact__r.Name'] = record.Contact__r.Name || '';
        flattened['Contact__r.Id'] = record.Contact__r.Id || '';
      }
      
      // Also check for Contributor__r (in case the field is named Contributor__c)
      if (record.Contributor__r) {
        flattened['Contact__r.Name'] = record.Contributor__r.Name || flattened['Contact__r.Name'] || '';
        flattened['Contact__r.Id'] = record.Contributor__r.Id || flattened['Contact__r.Id'] || '';
      }
      
      // Handle IP_Address__c or IPAddress__c
      if (!flattened.IP_Address__c && flattened.IPAddress__c) {
        flattened.IP_Address__c = flattened.IPAddress__c;
      }
      
      return flattened;
    });
    
    res.json({
      success: true,
      logs: logs,
      totalSize: result.totalSize
    });
  } catch (error) {
    console.error('Error fetching MFA Verification Logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch MFA Verification Logs'
    });
  }
}));

// Get available fields for MFA_Verification_Log__c
router.get('/fields', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject('MFA_Verification_Log__c').describe();
    
    const fields = describeResult.fields
      .filter(field => field.type !== 'base64')
      .map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        updateable: field.updateable,
        createable: field.createable,
        picklistValues: field.picklistValues ? field.picklistValues.map(pv => pv.value) : null,
        referenceTo: field.referenceTo && field.referenceTo.length > 0 ? field.referenceTo[0] : null,
        relationshipName: field.relationshipName || null
      }));
    
    res.json({
      success: true,
      fields: fields
    });
  } catch (error) {
    console.error('Error fetching MFA Verification Log fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch MFA Verification Log fields'
    });
  }
}));

module.exports = router;

