// Salesforce search routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm, isValidSalesforceId } = require('../../utils/security');
const { getCachedQuery } = require('../../services/salesforce/queryCache');

/**
 * Get project managers
 * GET /api/salesforce/project-managers
 */
router.get('/project-managers', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);

    // Query for Users (Project Managers)
    const query = `SELECT Id, Name, Email, Username FROM User WHERE IsActive = true ORDER BY Name LIMIT 200`;
    
    // Use cached query result (5 second TTL for read operations)
    const result = await getCachedQuery(conn, query, req.user.id);

    const projectManagers = result.records.map(user => ({
      id: user.Id,
      name: user.Name,
      email: user.Email,
      username: user.Username
    }));

    res.json({
      success: true,
      projectManagers: projectManagers
    });
  } catch (error) {
    console.error('Error fetching project managers from Salesforce:', error);
    
    // Handle missing Salesforce settings with a more appropriate status code
    if (error.message?.includes('Salesforce settings not configured') || 
        error.message?.includes('User ID is required')) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Salesforce settings not configured. Please configure your Salesforce settings first.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project managers from Salesforce'
    });
  }
}));

/**
 * Search people (Users/Contacts)
 * GET /api/salesforce/search-people
 */
router.get('/search-people', authenticate, asyncHandler(async (req, res) => {
  try {
    const { search, recordType } = req.query;

    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        people: []
      });
    }

    const conn = await createSalesforceConnection(null, req.user.id);
    const sanitizedTerm = validateAndSanitizeSearchTerm(search);
    
    if (!sanitizedTerm) {
      return res.json({
        success: true,
        people: []
      });
    }

    // Additional validation for search term length
    if (sanitizedTerm.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Search term is too long. Maximum length is 255 characters.'
      });
    }
    
    // Escape the sanitized term again for extra safety (defense in depth)
    const escapedTerm = sanitizedTerm.replace(/'/g, "''");
    
    // Parallelize User and Contact searches for better performance
    let userQuery = `SELECT Id, Name, Email, Username FROM User WHERE (Name LIKE '%${escapedTerm}%' OR Email LIKE '%${escapedTerm}%') AND IsActive = true`;
    
    if (recordType) {
      const sanitizedRecordType = isValidSalesforceId(recordType) ? recordType : null;
      if (sanitizedRecordType) {
        // Additional validation - ensure recordType is properly escaped
        const escapedRecordType = sanitizedRecordType.replace(/'/g, "''");
        userQuery += ` AND RecordTypeId = '${escapedRecordType}'`;
      }
    }
    
    userQuery += ' LIMIT 50';
    
    // Search Contacts - use escaped term
    let contactQuery = `SELECT Id, Name, Email FROM Contact WHERE (Name LIKE '%${escapedTerm}%' OR Email LIKE '%${escapedTerm}%') LIMIT 50`;
    
    // Execute User and Contact searches in parallel
    const [userResult, contactResult] = await Promise.allSettled([
      getCachedQuery(conn, userQuery, req.user.id).catch(err => {
        console.warn('Error searching users:', err.message);
        return { records: [] };
      }),
      getCachedQuery(conn, contactQuery, req.user.id).catch(err => {
        console.warn('Error searching contacts:', err.message);
        return { records: [] };
      })
    ]);
    
    let people = [];
    
    // Process User results
    if (userResult.status === 'fulfilled' && userResult.value.records) {
      people.push(...userResult.value.records.map(user => ({
        id: user.Id,
        name: user.Name,
        email: user.Email,
        username: user.Username,
        type: 'User'
      })));
    }
    
    // Process Contact results
    if (contactResult.status === 'fulfilled' && contactResult.value.records) {
      people.push(...contactResult.value.records.map(contact => ({
        id: contact.Id,
        name: contact.Name,
        email: contact.Email,
        type: 'Contact'
      })));
    }

    // Remove duplicates and limit results
    const uniquePeople = Array.from(
      new Map(people.map(p => [p.id, p])).values()
    ).slice(0, 50);

    res.json({
      success: true,
      people: uniquePeople
    });
  } catch (error) {
    console.error('Error searching people:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search people'
    });
  }
}));

module.exports = router;

