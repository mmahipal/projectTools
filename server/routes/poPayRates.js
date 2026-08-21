const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm } = require('../utils/security');

/**
 * Get available fields for PO Pay Rates (Rates section fields only)
 * GET /api/po-pay-rates/fields
 */
router.get('/fields', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Get all fields from Project_Objective__c
    const describeResult = await conn.sobject('Project_Objective__c').describe();
    const allFields = describeResult.fields || [];
    
    // Filter for Rates section fields - look for fields with "Rate" in name or label
    // Common rate fields: Project_Rate__c, Client_Pay_Rate__c, Minimum_Rate__c, Maximum_Rate__c
    const ratesFields = allFields
      .filter(field => {
        const fieldName = (field.name || '').toLowerCase();
        const fieldLabel = (field.label || '').toLowerCase();
        return fieldName.includes('rate') || fieldLabel.includes('rate') || 
               fieldName.includes('pay') || fieldLabel.includes('pay');
      })
      .map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        deprecated: field.deprecated || false
      }))
      .filter(field => !field.deprecated);
    
    res.json({
      success: true,
      fields: ratesFields
    });
  } catch (error) {
    console.error('Error fetching PO Pay Rates fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch PO Pay Rates fields'
    });
  }
}));

/**
 * Get PO Pay Rates data
 * GET /api/po-pay-rates
 * Query params: offset, limit, search, filters
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 1000;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    // Build WHERE clause - default to Draft, Open, Paused statuses
    let whereConditions = ["Status__c IN ('Draft', 'Open', 'Paused')"];
    
    // Add search filter - search in Project Objective Name and related fields
    const sanitizedSearch = validateAndSanitizeSearchTerm(req.query.search);
    if (sanitizedSearch) {
      whereConditions.push(`(Name LIKE '%${sanitizedSearch}%' OR Project__r.Name LIKE '%${sanitizedSearch}%')`);
    }
    
    // Add boolean filters
    if (filters && typeof filters === 'object') {
      Object.keys(filters).forEach(fieldName => {
        const value = filters[fieldName];
        if (value === true || value === false) {
          whereConditions.push(`${fieldName} = ${value}`);
        }
      });
    }
    
    // Apply GPC-Filter
    const { applyGPCFilterToWhereClause } = require('../utils/gpcFilterQueryBuilder');
    let whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '';
    whereClause = applyGPCFilterToWhereClause(whereClause, req, { accountField: 'Project__r.Account__c', projectField: 'Project__c' });
    const finalWhereClause = whereClause ? `WHERE ${whereClause}` : '';
    
    // Default columns + rates fields
    const defaultFields = [
      'Id',
      'Name',
      'Status__c',
      'Project_Rate__c',
      'Client_Pay_Rate__c',
      'Minimum_Rate__c',
      'Maximum_Rate__c',
      'Project__c',
      'Project__r.Name'
    ];
    
    // Get all rates fields for potential column selection
    const describeResult = await conn.sobject('Project_Objective__c').describe();
    const allFields = describeResult.fields || [];
    const ratesFields = allFields
      .filter(field => {
        const fieldName = (field.name || '').toLowerCase();
        const fieldLabel = (field.label || '').toLowerCase();
        return (fieldName.includes('rate') || fieldLabel.includes('rate') || 
                fieldName.includes('pay') || fieldLabel.includes('pay')) &&
               !field.deprecated;
      })
      .map(field => field.name);
    
    // Combine default fields with rates fields, removing duplicates
    const allSelectFields = [...new Set([...defaultFields, ...ratesFields])];
    
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
        Project_Rate__c: record.Project_Rate__c || null,
        Client_Pay_Rate__c: record.Client_Pay_Rate__c || null,
        Minimum_Rate__c: record.Minimum_Rate__c || null,
        Maximum_Rate__c: record.Maximum_Rate__c || null,
        Project__c: record.Project__c || '',
        Project__r: record.Project__r ? {
          Name: record.Project__r.Name || ''
        } : null
      };
      
      // Add all rates fields
      ratesFields.forEach(fieldName => {
        if (record[fieldName] !== undefined) {
          formatted[fieldName] = record[fieldName];
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
      limit: limit
    });
  } catch (error) {
    console.error('Error fetching PO Pay Rates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch PO Pay Rates'
    });
  }
}));

module.exports = router;

