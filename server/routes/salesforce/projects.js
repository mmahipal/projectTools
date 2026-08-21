// Salesforce project routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { loadProjects, saveProjects } = require('../../utils/salesforce/dataStorage');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const { logCreate } = require('../../utils/historyLogger');
const { isValidSalesforceId, validateAndSanitizeSearchTerm } = require('../../utils/security');
const { getCachedQuery } = require('../../services/salesforce/queryCache');
const { validateUrlParams, validateRequestBody } = require('../../middleware/requestValidation');

// Import the large createProjectInSalesforce function (will be extracted to service)
// For now, we'll keep it in the original file and import it
// This will be refactored once we extract it to projectService.js

/**
 * Get projects from Salesforce
 * GET /api/salesforce/projects
 */
router.get('/projects', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);

    // Support pagination (backward compatible - defaults to current behavior)
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

    // Query for Projects with pagination
    const query = `SELECT Id, Name, Project_Status__c FROM Project__c ORDER BY Name LIMIT ${limit} OFFSET ${offset}`;
    
    // Use cached query result (5 second TTL for read operations)
    const result = await getCachedQuery(conn, query, req.user.id);

    const projects = result.records.map(project => ({
      id: project.Id,
      name: project.Name,
      status: project.Project_Status__c
    }));

    res.json({
      success: true,
      projects: projects,
      pagination: {
        limit,
        offset,
        total: result.totalSize || projects.length,
        hasMore: result.records.length === limit && (offset + limit) < (result.totalSize || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching projects from Salesforce:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch projects from Salesforce'
    });
  }
}));

/**
 * Search projects
 * GET /api/salesforce/search-projects
 */
router.get('/search-projects', authenticate, asyncHandler(async (req, res) => {
  try {
    const { searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.json({
        success: true,
        projects: []
      });
    }

    const conn = await createSalesforceConnection(null, req.user.id);
    const sanitizedTerm = validateAndSanitizeSearchTerm(searchTerm);
    
    if (!sanitizedTerm) {
      return res.json({
        success: true,
        projects: []
      });
    }

    // Use parameterized query approach - escape the search term and validate it's safe
    // Additional validation: ensure sanitized term doesn't contain dangerous patterns
    if (sanitizedTerm.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Search term is too long. Maximum length is 255 characters.'
      });
    }

    // Search for projects by name - sanitizedTerm is already escaped by validateAndSanitizeSearchTerm
    const query = `SELECT Id, Name, Project_Status__c FROM Project__c WHERE Name LIKE '%${sanitizedTerm}%' ORDER BY Name LIMIT 50`;
    
    // Use cached query result (5 second TTL for search operations)
    const result = await getCachedQuery(conn, query, req.user.id);

    const projects = result.records.map(project => ({
      id: project.Id,
      name: project.Name,
      status: project.Project_Status__c
    }));

    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search projects'
    });
  }
}));

/**
 * Update project status
 * PATCH /api/salesforce/update-project-status/:projectId
 */
router.patch('/update-project-status/:projectId', 
  authenticate, 
  authorize('create_project', 'all'),
  validateUrlParams({
    projectId: { required: true, type: 'salesforceId' }
  }),
  validateRequestBody({
    status: { required: true, type: 'string', maxLength: 100, allowEmpty: false }
  }),
  asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    // Validate project ID format
    if (!projectId || !isValidSalesforceId(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format. Project ID must be a valid Salesforce ID (15 or 18 characters).'
      });
    }

    if (!status || typeof status !== 'string' || status.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Status is required and must be a non-empty string'
      });
    }

    // Sanitize status value
    const sanitizedStatus = status.trim();

    const conn = await createSalesforceConnection(null, req.user.id);

    // Verify project exists and user has access before updating
    try {
      const projectQuery = `SELECT Id, Name FROM Project__c WHERE Id = '${projectId.replace(/'/g, "''")}' LIMIT 1`;
      const projectResult = await conn.query(projectQuery);
      
      if (!projectResult.records || projectResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or you do not have access to this project'
        });
      }
    } catch (verifyError) {
      console.error('Error verifying project access:', verifyError);
      return res.status(403).json({
        success: false,
        error: 'Unable to verify project access. Please check your permissions.'
      });
    }

    // Update project status
    const updateResult = await conn.sobject('Project__c').update({
      Id: projectId,
      Project_Status__c: sanitizedStatus
    });

    if (updateResult.success) {
      // Log to audit logs
      try {
        const auditLogger = require('../../utils/auditLogger');
        auditLogger.log({
          action: 'update',
          objectType: 'Project__c',
          objectId: projectId,
          userId: req.user.id,
          userEmail: req.user.email,
          changes: { Project_Status__c: status },
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        console.error('Error logging to audit:', auditError);
      }

      res.json({
        success: true,
        message: 'Project status updated successfully',
        projectId: projectId
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update project status'
      });
    }
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update project status'
    });
  }
}));

// Note: create-project route will be added once createProjectInSalesforce is extracted to service

module.exports = router;

