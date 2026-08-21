// Salesforce qualification step routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm, isValidSalesforceId } = require('../../utils/security');
const { logCreate } = require('../../utils/historyLogger');
const { getObjectDescribe } = require('../../services/salesforce/metadataCache');
const { getCachedQuery } = require('../../services/salesforce/queryCache');

// Import from service
const { createQualificationStepInSalesforce } = require('../../services/salesforce/qualificationStepService');

/**
 * Create qualification step in Salesforce
 * POST /api/salesforce/create-qualification-step
 */
router.post('/create-qualification-step', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const qualificationStepData = req.body;
    const result = await createQualificationStepInSalesforce(qualificationStepData, req.user);
    
    if (result.success) {
      // Log to history for dashboard stats
      try {
        logCreate(
          'Project Qualification Step',
          result.objectName || qualificationStepData.projectQualificationStepName || qualificationStepData.qualificationStep || 'Untitled Qualification Step',
          result.salesforceId,
          req.user?.email || 'Unknown',
          qualificationStepData,
          { objectType: result.objectType }
        );
      } catch (historyError) {
        console.error('Error logging qualification step history:', historyError);
        // Don't fail the request if history logging fails
      }
      
      // Log to audit logs
      try {
        const auditLogger = require('../../utils/auditLogger');
        auditLogger.logAuditEvent({
          user: req.user.email,
          action: 'Added',
          objectType: 'Qualification Step',
          objectId: result.salesforceId,
          objectName: result.objectName || qualificationStepData.projectQualificationStepName || 'Untitled Qualification Step',
          salesforceId: result.salesforceId,
          status: 'success',
          details: { objectType: result.objectType }
        });
      } catch (auditError) {
        console.error('Error logging audit:', auditError);
      }
      
      res.json({
        success: true,
        salesforceId: result.salesforceId,
        objectType: result.objectType,
        objectName: result.objectName,
        message: 'Qualification step created successfully in Salesforce'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to create qualification step in Salesforce',
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error creating qualification step in Salesforce:', error);
    
    let errorMessage = 'Failed to create qualification step in Salesforce. Please check your Salesforce configuration and try again.';
    let errorDetails = [];
    
    if (error.data && Array.isArray(error.data)) {
      errorDetails = error.data;
      const errorMessages = error.data.map(err => {
        if (typeof err === 'object') {
          return err.message || err.error || err.statusCode || err.status || err.code || JSON.stringify(err);
        }
        return String(err);
      }).filter(Boolean);
      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join('; ');
      }
    } else if (error.message) {
      if (error.message.includes('INVALID_LOGIN') || error.message.includes('authentication failure')) {
        errorMessage = 'Salesforce authentication failed. Please check your Salesforce credentials in Settings.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Unauthorized access to Salesforce. Please verify your Salesforce credentials.';
      } else if (error.message.includes('INVALID_FIELD') || error.message.includes('No such column')) {
        errorMessage = 'Invalid field mapping. Some qualification step fields may not exist in your Salesforce object.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage,
      details: error.message,
      errorData: errorDetails.length > 0 ? errorDetails : undefined
    });
  }
}));

/**
 * Get qualification steps
 * GET /api/salesforce/qualification-steps
 */
router.get('/qualification-steps', authenticate, asyncHandler(async (req, res) => {
  try {
    const { search, project } = req.query;
    const conn = await createSalesforceConnection(null, req.user.id);

    // First, get the Project ID if project name is provided
    let projectId = null;
    if (project && project.trim() !== '') {
      try {
        // Validate and sanitize project name
        if (project.length > 255) {
          return res.status(400).json({
            success: false,
            error: 'Project name is too long. Maximum length is 255 characters.'
          });
        }
        
        const projectSearchTerm = sanitizeSearchTerm(project);
        if (!projectSearchTerm || projectSearchTerm.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'Invalid project name provided.'
          });
        }
        
        // Additional escaping for defense in depth
        const escapedProjectName = projectSearchTerm.replace(/'/g, "''");
        const projectQuery = `SELECT Id, Name FROM Project__c WHERE Name = '${escapedProjectName}' LIMIT 1`;
        const projectResult = await conn.query(projectQuery);
        if (projectResult.records && projectResult.records.length > 0) {
          projectId = projectResult.records[0].Id;
        }
      } catch (projectError) {
        console.warn('Error finding project for qualification step filter:', projectError.message);
        return res.status(400).json({
          success: false,
          error: 'Error finding project. Please check the project name.'
        });
      }
    }

    // Search in both qualification step objects - PARALLELIZED for performance
    const possibleObjectNames = ['Project_Qualification_Step__c', 'Qualification_Step__c'];
    
    // Parallelize object description and query operations
    const objectQueries = await Promise.allSettled(
      possibleObjectNames.map(async (objectName) => {
        try {
          // Use cached object description
          const stepDescribe = await getObjectDescribe(conn, objectName, req.user.id);
          
          // Check for common project field names
          let projectFieldName = null;
          const possibleProjectFields = ['Project__c', 'Qualification_Step_Project__c', 'Project_Objective__c'];
          for (const fieldName of possibleProjectFields) {
            if (stepDescribe.fields.find(f => f.name === fieldName)) {
              projectFieldName = fieldName;
              break;
            }
          }
          
          let query = `SELECT Id, Name FROM ${objectName}`;
          const conditions = [];
          
          if (projectId && projectFieldName) {
            // Validate projectId is a valid Salesforce ID
            if (!isValidSalesforceId(projectId)) {
              return null; // Skip this object if projectId is invalid
            }
            // Escape projectId for extra safety
            const escapedProjectId = projectId.replace(/'/g, "''");
            conditions.push(`${projectFieldName} = '${escapedProjectId}'`);
          }
          
          if (search && search.trim() !== '') {
            const sanitizedSearch = validateAndSanitizeSearchTerm(search);
            if (sanitizedSearch) {
              // Additional validation
              if (sanitizedSearch.length > 255) {
                return null; // Skip if search term too long
              }
              // Additional escaping for defense in depth
              const escapedSearch = sanitizedSearch.replace(/'/g, "''");
              conditions.push(`Name LIKE '%${escapedSearch}%'`);
            }
          }
          
          if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
          }
          
          query += ' ORDER BY Name LIMIT 100';
          
          // Use cached query result (5 second TTL)
          const result = await getCachedQuery(conn, query, req.user.id);
          
          if (result.records) {
            return result.records.map(step => ({
              id: step.Id,
              name: step.Name,
              objectType: objectName
            }));
          }
          return [];
        } catch (error) {
          console.warn(`Error querying ${objectName}:`, error.message);
          return null;
        }
      })
    );
    
    // Collect results from all settled promises
    let allQualificationSteps = [];
    objectQueries.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allQualificationSteps.push(...result.value);
      } else if (result.status === 'rejected') {
        console.warn(`Error querying ${possibleObjectNames[index]}:`, result.reason);
      }
    });

    // Remove duplicates and sort
    const uniqueSteps = Array.from(
      new Map(allQualificationSteps.map(s => [s.id, s])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      qualificationSteps: uniqueSteps
    });
  } catch (error) {
    console.error('Error fetching qualification steps:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch qualification steps'
    });
  }
}));

module.exports = router;

