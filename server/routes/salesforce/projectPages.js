// Salesforce project page routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createProjectPageInSalesforce } = require('../../services/salesforce/projectPageService');
const { logCreate } = require('../../utils/historyLogger');

/**
 * Create project page in Salesforce
 * POST /api/salesforce/create-project-page
 */
router.post('/create-project-page', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const pageData = req.body;
    const result = await createProjectPageInSalesforce(pageData, req.user);
    
    // Log to history for dashboard stats
    try {
      logCreate(
        'Project Page',
        result.objectName || pageData.projectPageType || 'Untitled Project Page',
        result.salesforceId,
        req.user?.email || 'Unknown',
        pageData,
        { 
          objectType: result.objectType,
          projectPageType: pageData.projectPageType,
          projectId: result.projectId,
          projectObjectiveId: result.projectObjectiveId
        }
      );
    } catch (historyError) {
      console.error('Error logging project page history:', historyError);
      // Don't fail the request if history logging fails
    }
    
    // Log to audit logs
    try {
      const auditLogger = require('../../utils/auditLogger');
      auditLogger.logAuditEvent({
        user: req.user.email,
        action: 'Added',
        objectType: 'Project Page',
        objectId: result.salesforceId,
        objectName: result.objectName,
        salesforceId: result.salesforceId,
        status: 'success',
        details: {
          objectType: result.objectType,
          projectPageType: pageData.projectPageType,
          projectId: result.projectId,
          projectObjectiveId: result.projectObjectiveId
        }
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }
    
    res.json({
      success: true,
      salesforceId: result.salesforceId,
      objectType: result.objectType,
      objectName: result.objectName,
      message: 'Project page created successfully in Salesforce',
      projectId: result.projectId,
      projectObjectiveId: result.projectObjectiveId
    });
  } catch (error) {
    console.error('Error creating project page in Salesforce:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.errorCode,
      data: error.data
    });
    
    // Handle MULTIPLE_API_ERRORS
    if (error.errorCode === 'MULTIPLE_API_ERRORS' && error.data && Array.isArray(error.data)) {
      const errorMessages = error.data.map(err => {
        const field = err.fields ? ` (${err.fields.join(', ')})` : '';
        return `${err.message || err.errorCode || 'Unknown error'}${field}`;
      }).join('; ');
      
      return res.status(400).json({
        success: false,
        error: `Salesforce validation errors: ${errorMessages}`,
        details: error.data
      });
    }
    
    // Handle FIELD_FILTER_VALIDATION_EXCEPTION
    if (error.errorCode === 'FIELD_FILTER_VALIDATION_EXCEPTION' && error.data) {
      const errorMessage = error.data.message || error.message || 'Validation error';
      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: error.data
      });
    }
    
    // Handle FIELD_CUSTOM_VALIDATION_EXCEPTION
    if (error.errorCode === 'FIELD_CUSTOM_VALIDATION_EXCEPTION' && error.data) {
      const errorMessage = error.data.message || error.message || 'Validation error';
      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: error.data
      });
    }
    
    let errorMessage = 'Failed to create project page in Salesforce. Please check your Salesforce configuration and try again.';
    if (error.message) {
      if (error.message.includes('INVALID_LOGIN') || error.message.includes('authentication failure')) {
        errorMessage = 'Salesforce authentication failed. Please check your Salesforce credentials in Settings.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.data || (process.env.NODE_ENV === 'development' ? error.stack : undefined)
    });
  }
}));

module.exports = router;

