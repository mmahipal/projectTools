// Salesforce project objectives routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm, isValidSalesforceId } = require('../../utils/security');
const { getCachedQuery } = require('../../services/salesforce/queryCache');

/**
 * Get available Project Objectives from Salesforce
 * GET /api/salesforce/project-objectives
 */
router.get('/project-objectives', authenticate, asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.query;
    const conn = await createSalesforceConnection(null, req.user.id);

    // Support pagination (backward compatible)
    const limit = parseInt(req.query.limit) || 500;
    const offset = parseInt(req.query.offset) || 0;
    
    // Validate pagination parameters
    if (limit < 1 || limit > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 2000'
      });
    }
    if (offset < 0) {
      return res.status(400).json({
        success: false,
        error: 'Offset must be non-negative'
      });
    }

    let query;
    if (projectId) {
      // Validate projectId is a valid Salesforce ID before using in query
      if (!isValidSalesforceId(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid project ID format. Project ID must be a valid Salesforce ID (15 or 18 characters).'
        });
      }
      // Escape the ID for extra safety (though isValidSalesforceId ensures it's safe)
      const escapedProjectId = projectId.replace(/'/g, "''");
      query = `SELECT Id, Name, Project__c, Project__r.Name FROM Project_Objective__c WHERE Project__c = '${escapedProjectId}' ORDER BY Name LIMIT ${limit} OFFSET ${offset}`;
    } else {
      query = `SELECT Id, Name, Project__c, Project__r.Name FROM Project_Objective__c ORDER BY Name LIMIT ${limit} OFFSET ${offset}`;
    }

    // Use cached query result (5 second TTL)
    const result = await getCachedQuery(conn, query, req.user.id);

    const objectives = result.records.map(obj => ({
      id: obj.Id,
      name: obj.Name,
      projectId: obj.Project__c,
      projectName: obj.Project__r ? obj.Project__r.Name : null
    }));

    res.json({
      success: true,
      projectObjectives: objectives
    });
  } catch (error) {
    console.error('Error fetching project objectives from Salesforce:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project objectives from Salesforce'
    });
  }
}));

/**
 * Search project objectives
 * GET /api/salesforce/search-project-objectives
 */
router.get('/search-project-objectives', authenticate, asyncHandler(async (req, res) => {
  try {
    const { searchTerm, projectId } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.json({
        success: true,
        projectObjectives: []
      });
    }

    const conn = await createSalesforceConnection(null, req.user.id);
    const sanitizedTerm = validateAndSanitizeSearchTerm(searchTerm);
    
    if (!sanitizedTerm) {
      return res.json({
        success: true,
        projectObjectives: []
      });
    }

    // Additional validation for search term length
    if (sanitizedTerm.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Search term is too long. Maximum length is 255 characters.'
      });
    }
    
    // Additional escaping for defense in depth
    const escapedTerm = sanitizedTerm.replace(/'/g, "''");
    
    let query;
    if (projectId) {
      // Validate projectId is a valid Salesforce ID
      if (!isValidSalesforceId(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid project ID format. Project ID must be a valid Salesforce ID (15 or 18 characters).'
        });
      }
      // Escape projectId for extra safety
      const escapedProjectId = projectId.replace(/'/g, "''");
      query = `SELECT Id, Name, Project__c, Project__r.Name FROM Project_Objective__c WHERE Name LIKE '%${escapedTerm}%' AND Project__c = '${escapedProjectId}' ORDER BY Name LIMIT 50`;
    } else {
      query = `SELECT Id, Name, Project__c, Project__r.Name FROM Project_Objective__c WHERE Name LIKE '%${escapedTerm}%' ORDER BY Name LIMIT 50`;
    }

    // Use cached query result (5 second TTL for search operations)
    const result = await getCachedQuery(conn, query, req.user.id);

    const objectives = result.records.map(obj => ({
      id: obj.Id,
      name: obj.Name,
      projectId: obj.Project__c,
      projectName: obj.Project__r ? obj.Project__r.Name : null
    }));

    res.json({
      success: true,
      projectObjectives: objectives
    });
  } catch (error) {
    console.error('Error searching project objectives:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search project objectives'
    });
  }
}));

// Note: create-project-objective route will be added once createProjectObjectiveInSalesforce is extracted to service

module.exports = router;

