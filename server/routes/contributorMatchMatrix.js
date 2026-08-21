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

/**
 * Discover Contact/Contributor field dynamically
 */
async function discoverContactProjectFields(conn) {
  try {
    const cpDescribe = await conn.sobject('Contributor_Project__c').describe();
    const cpFieldNames = cpDescribe.fields.map(f => f.name);

    // Try to find Contact__c or Contributor__c field
    const contactFieldName = cpFieldNames.find(f => f === 'Contact__c') || 
                             cpFieldNames.find(f => f === 'Contributor__c') || null;
    
    const contributorRelationshipName = contactFieldName === 'Contact__c' ? 'Contact__r.Name' : 
                                       contactFieldName === 'Contributor__c' ? 'Contributor__r.Name' : null;

    return { contactFieldName, contributorRelationshipName };
  } catch (error) {
    console.error('Error discovering Contact/Contributor fields:', error);
    return { contactFieldName: 'Contact__c', contributorRelationshipName: 'Contact__r.Name' };
  }
}

/**
 * Get Contributor Match Matrix data
 * GET /api/contributor-match-matrix
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(600000); // 10 minutes
  try {
    const { 
      offset = 0, 
      limit = 1000,
      search = '',
      filters = '{}'
    } = req.query;

    const conn = await getSalesforceConnection(req.user.id);
    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 540000; // 9 minutes

    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        throw new Error(`Query timeout: Processing took ${(elapsed / 1000).toFixed(1)}s`);
      }
    };

    // Discover Contact/Contributor fields
    const { contactFieldName, contributorRelationshipName } = await discoverContactProjectFields(conn);
    if (!contactFieldName) {
      return res.status(400).json({
        success: false,
        error: 'Contact or Contributor field not found on Contributor_Project__c'
      });
    }

    // Discover matching section fields dynamically
    const cpDescribe = await conn.sobject('Contributor_Project__c').describe();
    const cpFieldNames = cpDescribe.fields.map(f => f.name);
    
    // Find matching-related fields (fields that might be in matching section)
    const matchingFields = cpFieldNames.filter(f => {
      const lower = f.toLowerCase();
      return lower.includes('match') || 
             lower.includes('matching') ||
             f === 'Full_Match__c' ||
             f === 'Five_Core_Match__c' ||
             f === 'Country_Match__c' ||
             f === 'Language_Match__c' ||
             f === 'Work_Type_Match__c';
    });

    // Build base query - filter by status
    const statusFilter = "Status__c IN ('Active', 'Production', 'Matching', 'Qualified')";
    
    let whereConditions = [statusFilter];

    // Add search filter
    if (search && search.trim()) {
      let searchTerm = search.trim();
      const isExactMatch = searchTerm.startsWith('"') && searchTerm.endsWith('"');
      
      if (isExactMatch) {
        searchTerm = searchTerm.substring(1, searchTerm.length - 1).trim();
      }
      
      // Validate and sanitize search term (skip if empty or just quotes)
      const sanitizedTerm = validateAndSanitizeSearchTerm(searchTerm);
      if (sanitizedTerm) {
        const matchPattern = isExactMatch ? `= '${sanitizedTerm}'` : `LIKE '%${sanitizedTerm}%'`;
        whereConditions.push(`(${contributorRelationshipName} ${matchPattern} OR Project__r.Name ${matchPattern} OR Project_Objective__r.Name ${matchPattern})`);
      }
    }

    // Parse and apply filters
    let parsedFilters = {};
    try {
      parsedFilters = JSON.parse(filters);
    } catch (e) {
      // Invalid JSON, ignore filters
    }

    // Apply boolean filters (all fields are boolean in this page)
    Object.keys(parsedFilters).forEach(fieldName => {
      const value = parsedFilters[fieldName];
      if (value === true || value === 'true') {
        whereConditions.push(`${fieldName} = true`);
      } else if (value === false || value === 'false') {
        whereConditions.push(`${fieldName} = false`);
      }
    });

    // Build SELECT clause
    const selectFields = [
      'Id',
      'Name',
      'Status__c',
      'Project__c',
      'Project__r.Name',
      'Project_Objective__c',
      'Project_Objective__r.Name',
      contactFieldName,
      contributorRelationshipName,
      'Full_Match__c',
      'Five_Core_Match__c',
      'Country_Match__c',
      'Language_Match__c',
      'Work_Type_Match__c',
      ...matchingFields.filter(f => !['Full_Match__c', 'Five_Core_Match__c', 'Country_Match__c', 'Language_Match__c', 'Work_Type_Match__c'].includes(f))
    ];

    // Build query
    let query = `SELECT ${selectFields.join(', ')} FROM Contributor_Project__c WHERE ${whereConditions.join(' AND ')} ORDER BY CreatedDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    checkTimeout();
    const result = await conn.query(query);

    // Process records
    const records = (result.records || []).map(record => {
      const processed = {
        Id: record.Id,
        Name: record.Name || '',
        Status: record.Status__c || '',
        Contributor_Project: record.Name || record.Id,
        Contributor: record[contributorRelationshipName] || 'Unknown',
        Contributor_Id: record[contactFieldName] || '',
        Project: record.Project__r?.Name || 'Unknown',
        Project_Id: record.Project__c || '',
        Objective: record.Project_Objective__r?.Name || 'N/A',
        Objective_Id: record.Project_Objective__c || '',
        Full_Match: record.Full_Match__c === true || record.Full_Match__c === 'true',
        Five_Core_Match: record.Five_Core_Match__c === true || record.Five_Core_Match__c === 'true',
        Country_Match: record.Country_Match__c === true || record.Country_Match__c === 'true',
        Language_Match: record.Language_Match__c === true || record.Language_Match__c === 'true',
        Work_Type_Match: record.Work_Type_Match__c === true || record.Work_Type_Match__c === 'true'
      };

      // Add other matching fields (without __c suffix for frontend)
      matchingFields.forEach(fieldName => {
        if (!['Full_Match__c', 'Five_Core_Match__c', 'Country_Match__c', 'Language_Match__c', 'Work_Type_Match__c'].includes(fieldName)) {
          const fieldValue = record[fieldName];
          const cleanFieldName = fieldName.replace(/__c$/, '');
          processed[cleanFieldName] = fieldValue === true || fieldValue === 'true';
        }
      });

      return processed;
    });

    // Get total count (for pagination)
    const countQuery = `SELECT COUNT(Id) total FROM Contributor_Project__c WHERE ${whereConditions.join(' AND ')}`;
    checkTimeout();
    const countResult = await conn.query(countQuery);
    const totalCount = countResult.records?.[0]?.total || 0;

    // Format matching fields for frontend (remove __c suffix)
    const formattedMatchingFields = matchingFields.map(fieldName => {
      const field = cpDescribe.fields.find(f => f.name === fieldName);
      return {
        name: fieldName.replace(/__c$/, ''),
        label: field?.label || fieldName.replace(/__c$/, '').replace(/_/g, ' '),
        type: field?.type || 'boolean'
      };
    });

    res.json({
      success: true,
      records,
      totalCount,
      hasMore: (parseInt(offset) + records.length) < totalCount,
      matchingFields: formattedMatchingFields
    });
  } catch (error) {
    console.error('Error fetching Contributor Match Matrix:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Contributor Match Matrix data'
    });
  }
}));

/**
 * Get available fields for filtering
 * GET /api/contributor-match-matrix/fields
 */
router.get('/fields', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const cpDescribe = await conn.sobject('Contributor_Project__c').describe();
    const cpFieldNames = cpDescribe.fields.map(f => f.name);
    
    // Find matching-related fields (exclude info and deprecated fields)
    const matchingFields = cpFieldNames
      .filter(f => {
        const lower = f.toLowerCase();
        const field = cpDescribe.fields.find(fld => fld.name === f);
        const label = (field?.label || '').toLowerCase();
        // Exclude info fields and deprecated fields
        return (lower.includes('match') || 
                lower.includes('matching') ||
                f === 'Full_Match__c' ||
                f === 'Five_Core_Match__c' ||
                f === 'Country_Match__c' ||
                f === 'Language_Match__c' ||
                f === 'Work_Type_Match__c') &&
               !label.includes('info') &&
               !field?.deprecated &&
               field?.type !== 'base64';
      })
      .map(fieldName => {
        const field = cpDescribe.fields.find(f => f.name === fieldName);
        return {
          name: fieldName,
          label: field?.label || fieldName.replace(/__c$/, '').replace(/_/g, ' '),
          type: field?.type || 'boolean',
          deprecated: field?.deprecated || false
        };
      });

    res.json({
      success: true,
      fields: matchingFields
    });
  } catch (error) {
    console.error('Error fetching Contributor Match Matrix fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch fields'
    });
  }
}));

module.exports = router;

