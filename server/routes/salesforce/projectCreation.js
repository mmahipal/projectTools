// Salesforce project creation routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { loadProjects, saveProjects } = require('../../utils/salesforce/dataStorage');
const { logCreate } = require('../../utils/historyLogger');
const { validateRequestBody, validateBodySize } = require('../../middleware/requestValidation');

// Import from service
const { createProjectInSalesforce } = require('../../services/salesforce/projectService');

/**
 * Create project in Salesforce
 * POST /api/salesforce/create-project
 */
router.post('/create-project', 
  authenticate, 
  authorize('create_project', 'all'),
  validateBodySize(5 * 1024 * 1024), // 5MB max
  validateRequestBody({
    projectName: { required: true, type: 'string', maxLength: 255 },
    shortProjectName: { required: false, type: 'string', maxLength: 100 },
    contributorProjectName: { required: false, type: 'string', maxLength: 255 },
    projectType: { required: false, type: 'string', maxLength: 100 },
    projectStatus: { required: false, type: 'string', maxLength: 100 },
    projectPriority: { required: false, type: 'string', maxLength: 50 },
    teamMembers: { required: false, type: 'array', maxItems: 100 }
  }),
  asyncHandler(async (req, res) => {
  try {
    console.log('=== CREATE PROJECT API REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Team Members in request:', req.body.teamMembers ? JSON.stringify(req.body.teamMembers, null, 2) : 'NOT PROVIDED');
    
    const result = await createProjectInSalesforce(req.body, req.user);
    
    // Save project to local database for Dashboard stats
    try {
      console.log('=== SAVING PROJECT TO LOCAL DATABASE ===');
      const projects = loadProjects();
      
      const projectData = req.body;
      const existingIndex = projects.findIndex(p => p.salesforceId === result.salesforceId);
      
      const projectRecord = {
        id: `PROJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...projectData,
        salesforceId: result.salesforceId,
        salesforceSyncStatus: 'synced',
        salesforceObjectType: result.objectType,
        salesforceSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: req.user.email,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.email,
        status: projectData.projectStatus || projectData.status || 'Open',
        projectStatus: projectData.projectStatus || projectData.status || 'Open'
      };
      
      if (existingIndex >= 0) {
        projects[existingIndex] = { ...projects[existingIndex], ...projectRecord };
        console.log('Updated existing project in local database:', result.salesforceId);
      } else {
        projects.push(projectRecord);
        console.log('Saved new project to local database:', result.salesforceId);
      }
      
      saveProjects(projects);
    } catch (saveError) {
      console.error('Error saving project to local database:', saveError);
    }
    
    // Log to history
    try {
      logCreate(
        'Project',
        req.body.projectName || 'Untitled Project',
        result.salesforceId,
        req.user.email,
        req.body,
        { objectType: result.objectType }
      );
    } catch (historyError) {
      console.error('Error logging history:', historyError);
    }
    
    // Log to audit logs
    try {
      const auditLogger = require('../../utils/auditLogger');
      auditLogger.logAuditEvent({
        user: req.user.email,
        action: 'Added',
        objectType: 'Project',
        objectId: result.salesforceId,
        objectName: req.body.projectName || 'Untitled Project',
        salesforceId: result.salesforceId,
        status: 'success',
        details: { objectType: result.objectType }
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Project created successfully in Salesforce',
      salesforceId: result.salesforceId,
      objectType: result.objectType,
      objectName: result.objectName,
      projectData: {
        id: result.salesforceId
      }
    });
  } catch (error) {
    console.error('Error creating project in Salesforce:', error);
    
    let errorMessage = 'Failed to create project in Salesforce. Please check your Salesforce configuration and try again.';
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
        errorMessage = 'Invalid field mapping. Some project fields may not exist in your Salesforce object.';
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
 * Test project creation in Salesforce
 * POST /api/salesforce/test-project-creation
 * This endpoint tests the project creation functionality with minimal test data
 */
router.post('/test-project-creation', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    console.log('=== TEST PROJECT CREATION REQUEST ===');
    
    // Create minimal test project data
    const testProjectData = {
      projectName: `Test Project ${Date.now()}`,
      shortProjectName: 'Test',
      projectType: 'Test',
      projectStatus: 'Draft',
      projectPriority: 50
    };
    
    console.log('Test project data:', testProjectData);
    
    // Attempt to create the test project
    const result = await createProjectInSalesforce(testProjectData, req.user);
    
    // Return test results
    res.json({
      success: true,
      message: 'Project creation API test successful!',
      testResults: {
        salesforceId: result.salesforceId,
        objectType: result.objectType,
        objectName: result.objectName,
        testProjectName: testProjectData.projectName
      }
    });
  } catch (error) {
    console.error('Test project creation error:', error);
    
    let errorMessage = 'Project creation API test failed';
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
        errorMessage = 'Invalid field mapping. Some project fields may not exist in your Salesforce object.';
      } else if (error.message.includes('not configured') || error.message.includes('settings')) {
        errorMessage = 'Salesforce settings not configured. Please configure Salesforce settings first.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage,
      message: errorMessage,
      details: error.message,
      errorData: errorDetails.length > 0 ? errorDetails : undefined
    });
  }
}));

module.exports = router;

