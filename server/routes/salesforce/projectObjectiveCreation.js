// Salesforce project objective creation routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { loadProjectObjectives, saveProjectObjectives } = require('../../utils/salesforce/dataStorage');
const { logCreate } = require('../../utils/historyLogger');

// Import from service
const { createProjectObjectiveInSalesforce } = require('../../services/salesforce/projectObjectiveService');

/**
 * Create project objective in Salesforce
 * POST /api/salesforce/create-project-objective
 */
router.post('/create-project-objective', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const result = await createProjectObjectiveInSalesforce(req.body, req.user);
    
    // Save project objective to local database
    try {
      const objectives = loadProjectObjectives();
      const objectiveData = req.body;
      
      const existingIndex = objectives.findIndex(o => o.salesforceId === result.salesforceId);
      
      const objectiveRecord = {
        id: `OBJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...objectiveData,
        salesforceId: result.salesforceId,
        salesforceSyncStatus: 'synced',
        salesforceObjectType: result.objectType,
        salesforceSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: req.user.email,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.email,
        status: objectiveData.projectObjectiveStatus || objectiveData.status || 'Open',
        projectObjectiveStatus: objectiveData.projectObjectiveStatus || objectiveData.status || 'Open'
      };
      
      if (existingIndex >= 0) {
        objectives[existingIndex] = { ...objectives[existingIndex], ...objectiveRecord };
        console.log('Updated existing project objective in local database:', result.salesforceId);
      } else {
        objectives.push(objectiveRecord);
        console.log('Saved new project objective to local database:', result.salesforceId);
      }
      
      saveProjectObjectives(objectives);
    } catch (saveError) {
      console.error('Error saving project objective to local database:', saveError);
    }
    
    // Log to history
    try {
      logCreate(
        'Project Objective',
        req.body.projectObjectiveName || 'Untitled Objective',
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
      const objectives = loadProjectObjectives();
      const existingIndex = objectives.findIndex(o => o.salesforceId === result.salesforceId);
      auditLogger.logAuditEvent({
        user: req.user.email,
        action: existingIndex >= 0 ? 'Modified' : 'Added',
        objectType: 'Project Objective',
        objectId: result.salesforceId,
        objectName: req.body.projectObjectiveName || req.body.contributorFacingProjectName || 'Untitled Objective',
        salesforceId: result.salesforceId,
        status: 'success',
        details: { objectType: result.objectType }
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Project Objective created successfully in Salesforce',
      salesforceId: result.salesforceId,
      objectType: result.objectType,
      objectName: result.objectName,
      projectObjectiveData: {
        id: result.salesforceId
      }
    });
  } catch (error) {
    console.error('Error creating project objective in Salesforce:', error);
    
    let errorMessage = 'Failed to create project objective in Salesforce. Please check your Salesforce configuration and try again.';
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
        errorMessage = 'Invalid field mapping. Some project objective fields may not exist in your Salesforce object.';
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

module.exports = router;

