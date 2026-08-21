const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSalesforceConnection } = require('./updateObjectFields/utils');
const { escapeSoql } = require('../utils/security');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get Onboarding Contributors
router.get('/contributors', authenticate, asyncHandler(async (req, res) => {
  // Set extended timeout for this endpoint (5 minutes)
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  // Send keep-alive headers to prevent proxy timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=300');
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000; // 4 minutes max execution time
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    checkTimeout();
    const conn = await getSalesforceConnection(req.user.id);
    const { 
      limit = 500, // Reduced default limit to improve performance
      offset = 0, 
      search = '',
      orderBy = 'CreatedDate', 
      orderDirection = 'DESC' 
    } = req.query;
    
    // Cap limit at 1000 to prevent extremely long queries
    const queryLimit = Math.min(parseInt(limit), 1000);
    
    // First, describe the Contact object to get available fields
    checkTimeout();
    const describeResult = await conn.sobject('Contact').describe();
    const validFieldNames = new Set(describeResult.fields.map(f => f.name));
    
    // Discover onboarding status field
    let statusFieldName = null;
    const possibleStatusFields = [
      'Contributor_Status__c',
      'ContributorStatus__c',
      'Status__c',
      'Contact_Status__c',
      'ContactStatus__c',
      'Onboarding_Status__c',
      'OnboardingStatus__c'
    ];
    
    for (const fieldName of possibleStatusFields) {
      if (validFieldNames.has(fieldName)) {
        statusFieldName = fieldName;
        break;
      }
    }
    
    // Build list of fields to query - optimized for performance
    // Start with essential fields only
    const fieldNames = [
      'Id',
      'Name',
      'Email',
      'CreatedDate',
      'LastModifiedDate'
    ];
    
    // Add only commonly used contributor fields to reduce query size
    const commonFields = [
      'Contributor_Type__c',
      'ContributorType__c',
      'MailingCountry',
      'Phone',
      'AccountId',
      'Account.Name'
    ];
    
    // Only add fields that exist (to avoid query errors)
    commonFields.forEach(field => {
      if (field.includes('.')) {
        // Relationship field - check base field
        const baseField = field.split('.')[0];
        if (validFieldNames.has(baseField)) {
          fieldNames.push(field);
        }
      } else if (validFieldNames.has(field)) {
        fieldNames.push(field);
      }
    });
    
    // Build SOQL query
    let query = `SELECT ${fieldNames.join(', ')} FROM Contact`;
    
    // Build WHERE clause
    const whereConditions = [];
    
    // Filter by onboarding status
    // Optimize: Use exact matches first (faster), avoid LIKE if possible
    if (statusFieldName) {
      // Try to get picklist values to use exact matches only
      try {
        const fieldInfo = describeResult.fields.find(f => f.name === statusFieldName);
        if (fieldInfo && fieldInfo.picklistValues && fieldInfo.picklistValues.length > 0) {
          // Find onboarding-related picklist values
          const onboardingValues = fieldInfo.picklistValues
            .map(pv => pv.value)
            .filter(val => val && (val.toLowerCase().includes('onboarding') || val.toLowerCase().includes('on-boarding')));
          
          if (onboardingValues.length > 0) {
            // Use exact matches only (much faster than LIKE)
            const escapedValues = onboardingValues.map(val => `'${escapeSoql(val)}'`).join(', ');
            whereConditions.push(`${statusFieldName} IN (${escapedValues})`);
          } else {
            // Fallback to common exact values
            whereConditions.push(`${statusFieldName} IN ('Onboarding', 'On Boarding', 'In Onboarding', 'On-Boarding')`);
          }
        } else {
          // No picklist values available, use common exact values
          whereConditions.push(`${statusFieldName} IN ('Onboarding', 'On Boarding', 'In Onboarding', 'On-Boarding')`);
        }
      } catch (err) {
        console.warn('Error getting picklist values, using fallback:', err.message);
        // Fallback to common exact values
        whereConditions.push(`${statusFieldName} IN ('Onboarding', 'On Boarding', 'In Onboarding', 'On-Boarding')`);
      }
    } else {
      // If no status field found, we'll return all contacts (with a warning)
      console.warn('No contributor status field found on Contact object');
    }
    
    // Add search filter
    if (search && search.trim()) {
      let searchTerm = search.trim();
      // Check if search term is wrapped in double quotes for exact match
      const isExactMatch = searchTerm.startsWith('"') && searchTerm.endsWith('"');
      if (isExactMatch) {
        searchTerm = searchTerm.slice(1, -1).trim(); // Remove quotes
      }
      
      // Skip search if term is empty or just quotes (to avoid SOQL parsing issues)
      if (!searchTerm || searchTerm === "'" || searchTerm === "''") {
        // Skip search - empty or just quotes
      } else {
        // Escape single quotes for SOQL (using correct SOQL escaping: ' becomes '')
        const escapedTerm = escapeSoql(searchTerm);
        const matchPattern = isExactMatch ? `= '${escapedTerm}'` : `LIKE '%${escapedTerm}%'`;
        const searchConditions = [
          `Name ${matchPattern}`,
          `Email ${matchPattern}`
        ];
        
        // Add search for other common fields if they exist
        if (validFieldNames.has('Contributor_Type__c') || validFieldNames.has('ContributorType__c')) {
          const typeField = validFieldNames.has('Contributor_Type__c') ? 'Contributor_Type__c' : 'ContributorType__c';
          searchConditions.push(`${typeField} ${matchPattern}`);
        }
        
        if (validFieldNames.has('MailingCountry')) {
          searchConditions.push(`MailingCountry ${matchPattern}`);
        }
        
        whereConditions.push(`(${searchConditions.join(' OR ')})`);
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add ORDER BY
    let orderByField = orderBy;
    if (!validFieldNames.has(orderByField)) {
      orderByField = 'CreatedDate';
    }
    query += ` ORDER BY ${orderByField} ${orderDirection || 'DESC'}`;
    
    // Add LIMIT and OFFSET
    query += ` LIMIT ${queryLimit} OFFSET ${parseInt(offset)}`;
    
    console.log('Onboarding Contributors Query:', query);
    
    checkTimeout();
    
    // Execute query with timeout handling
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      // If query times out or fails, return partial results if available
      if (queryError.message && queryError.message.includes('timeout')) {
        throw new Error('Query execution timeout. Please try with a smaller limit or add more filters.');
      }
      throw queryError;
    }
    
    checkTimeout();
    
    // Flatten relationship fields
    const contributors = result.records.map((record) => {
      const flattened = { ...record };
      
      // Flatten Account relationship
      if (record.Account) {
        flattened['Account.Name'] = record.Account.Name || '';
        flattened['AccountId'] = record.AccountId || '';
      }
      
      return flattened;
    });
    
    // Send response
    res.json({
      success: true,
      contributors: contributors,
      totalSize: result.totalSize,
      hasMore: contributors.length === queryLimit
    });
  } catch (error) {
    console.error('Error fetching Onboarding Contributors:', error);
    
    // Handle timeout errors specifically
    if (error.message && (error.message.includes('timeout') || error.message.includes('Timeout'))) {
      return res.status(504).json({
        success: false,
        error: 'Request timeout. The query is taking too long. Please try with a smaller limit, add search filters, or contact support.',
        timeout: true
      });
    }
    
    // Handle other errors
    const statusCode = error.message && error.message.includes('timeout') ? 504 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch Onboarding Contributors'
    });
  }
}));

// Get available fields for Contact object
router.get('/fields', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject('Contact').describe();
    
    const fields = describeResult.fields
      .filter(field => 
        field.type !== 'base64' && 
        !field.name.startsWith('Jigsaw') &&
        field.name !== 'IsDeleted' &&
        field.name !== 'MasterRecordId' &&
        field.name !== 'HasOptedOutOfEmail' &&
        field.name !== 'HasOptedOutOfFax'
      )
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
    console.error('Error fetching Contact fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Contact fields'
    });
  }
}));

module.exports = router;

