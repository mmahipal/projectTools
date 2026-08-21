const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm, escapeSoql } = require('../utils/security');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Get PO Productivity Targets data
 * GET /api/po-productivity-targets
 * Query params: offset, limit, search, filters
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 1000;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
    
    // Get field metadata first (needed for filter processing)
    const describeResult = await conn.sobject('Project_Objective__c').describe();
    const allFields = describeResult.fields || [];
    
    // Build WHERE clause - default to Draft, Open, Paused statuses
    let whereConditions = ["Status__c IN ('Draft', 'Open', 'Paused')"];
    
    // Add search filter - search in Project Objective Name and related fields
    const sanitizedSearch = validateAndSanitizeSearchTerm(req.query.search);
    if (sanitizedSearch) {
      whereConditions.push(`(Name LIKE '%${sanitizedSearch}%' OR Project__r.Name LIKE '%${sanitizedSearch}%')`);
    }
    
    // Apply GPC-Filter
    const { applyGPCFilterToWhereClause } = require('../utils/gpcFilterQueryBuilder');
    let whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '';
    whereClause = applyGPCFilterToWhereClause(whereClause, req, { accountField: 'Project__r.Account__c', projectField: 'Project__c' });
    whereConditions = whereClause ? [whereClause] : [];
    
    // Apply filters with operators (like Case Management)
    if (filters && Array.isArray(filters) && filters.length > 0) {
      try {
        const filterArray = filters;
        filterArray.forEach(filter => {
          if (filter.field && filter.operator) {
            let condition = '';
            const fieldName = filter.field;
            
            // Get field metadata
            const fieldMeta = allFields.find(f => f.name === fieldName);
            const isDateField = fieldMeta && fieldMeta.type === 'date';
            const isDateTimeField = fieldMeta && fieldMeta.type === 'datetime';
            const isNumberField = fieldMeta && (fieldMeta.type === 'int' || fieldMeta.type === 'double' || fieldMeta.type === 'currency' || fieldMeta.type === 'percent');
            
            // Format value based on field type
            let escapedValue = '';
            if (filter.value) {
              if (isDateTimeField) {
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
                // For text fields, validate and escape properly
                const sanitized = validateAndSanitizeSearchTerm(String(filter.value || ''));
                if (!sanitized) {
                  return; // Skip invalid filter values
                }
                escapedValue = `'${sanitized}'`;
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
                // Validate and sanitize filter value - skip if invalid or looks like SOQL fragment
                const textValue = validateAndSanitizeSearchTerm(String(filter.value || ''));
                if (!textValue) {
                  return; // Skip invalid filter values
                }
                condition = `${fieldName} LIKE '%${textValue}%'`;
                break;
              case 'notContains':
                const textValue2 = validateAndSanitizeSearchTerm(String(filter.value || ''));
                if (!textValue2) {
                  return; // Skip invalid filter values
                }
                condition = `NOT (${fieldName} LIKE '%${textValue2}%')`;
                break;
              case 'startsWith':
                const textValue3 = validateAndSanitizeSearchTerm(String(filter.value || ''));
                if (!textValue3) {
                  return; // Skip invalid filter values
                }
                condition = `${fieldName} LIKE '${textValue3}%'`;
                break;
              case 'endsWith':
                const textValue4 = validateAndSanitizeSearchTerm(String(filter.value || ''));
                if (!textValue4) {
                  return; // Skip invalid filter values
                }
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
                // For numeric fields, only check null (can't check empty string)
                if (isNumberField) {
                  condition = `${fieldName} = null`;
                } else {
                  condition = `(${fieldName} = null OR ${fieldName} = '')`;
                }
                break;
              case 'isNotEmpty':
                // For numeric fields, only check not null (can't check empty string)
                if (isNumberField) {
                  condition = `${fieldName} != null`;
                } else {
                  condition = `(${fieldName} != null AND ${fieldName} != '')`;
                }
                break;
              default:
                return; // Skip unknown operators
            }
            
            if (condition) {
              whereConditions.push(condition);
            }
          }
        });
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }
    
    // whereClause already includes GPC filter from above
    const finalWhereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Default columns for productivity targets
    const defaultFields = [
      'Id',
      'Name',
      'Status__c',
      'Target_Contributors__c',
      'Weekly_Contributor_Production_Hours__c',
      'Weekly_Target_Production_Hours_Calc__c',
      'Total_Target_Productivity_Hours__c',
      'Productivity_Target_Type__c',
      'Project__c',
      'Project__r.Name'
    ];
    
    // Get all productivity-related fields for potential column selection (already have describeResult and allFields)
    const productivityFields = allFields
      .filter(field => {
        const fieldName = (field.name || '').toLowerCase();
        const fieldLabel = (field.label || '').toLowerCase();
        return (fieldName.includes('productivity') || fieldLabel.includes('productivity') ||
                fieldName.includes('target') || fieldLabel.includes('target') ||
                fieldName.includes('production') || fieldLabel.includes('production') ||
                fieldName.includes('contributor') || fieldLabel.includes('contributor')) &&
               !field.deprecated;
      })
      .map(field => ({ name: field.name, label: field.label, type: field.type, deprecated: field.deprecated }));
    
    // Combine default fields with productivity fields, removing duplicates
    const allSelectFields = [...new Set([...defaultFields, ...productivityFields.map(f => f.name)])];
    
    // Fetch limit + 1 to check if there are more records
    const queryLimit = limit + 1;
    const query = `SELECT ${allSelectFields.join(', ')} 
                   FROM Project_Objective__c 
                   ${finalWhereClause}
                   ORDER BY Name
                   LIMIT ${queryLimit}
                   OFFSET ${offset}`;
    
    const result = await conn.query(query);
    const allRecords = result.records || [];
    
    // Check if we got more than the requested limit
    const hasMore = allRecords.length > limit;
    
    // Return only the requested number of records
    const records = hasMore ? allRecords.slice(0, limit) : allRecords;
    
    // Format records
    const formattedRecords = (records || []).map(record => {
      const formatted = {
        Id: record.Id,
        Name: record.Name || '',
        Status__c: record.Status__c || '',
        Target_Contributors__c: record.Target_Contributors__c || null,
        Weekly_Contributor_Production_Hours__c: record.Weekly_Contributor_Production_Hours__c || null,
        Weekly_Target_Production_Hours_Calc__c: record.Weekly_Target_Production_Hours_Calc__c || null,
        Total_Target_Productivity_Hours__c: record.Total_Target_Productivity_Hours__c || null,
        Productivity_Target_Type__c: record.Productivity_Target_Type__c || '',
        Project__c: record.Project__c || '',
        Project__r: record.Project__r ? {
          Name: record.Project__r.Name || ''
        } : null
      };
      
      // Add all productivity fields
      productivityFields.forEach(field => {
        if (record[field.name] !== undefined) {
          formatted[field.name] = record[field.name];
        }
      });
      
      return formatted;
    });
    
    // Calculate total - use result.totalSize if available, otherwise estimate
    const totalRecords = result.totalSize || (offset + allRecords.length);
    
    res.json({
      success: true,
      records: formattedRecords,
      hasMore: hasMore,
      total: totalRecords,
      offset: offset,
      limit: limit,
      availableFields: productivityFields // Only send productivity fields for column selection
    });

  } catch (error) {
    console.error('Error fetching PO Productivity Targets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch PO Productivity Targets'
    });
  }
}));

module.exports = router;

