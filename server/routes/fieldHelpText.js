const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const { getSalesforceConnection } = require('../services/salesforce/connection');

const router = express.Router();

// Store field help text in config directory so it can be version controlled
const FIELD_HELP_TEXT_PATH = path.join(__dirname, '../config/fieldHelpText.json');

// Object type mapping
const OBJECT_TYPE_MAP = {
  'Project': 'Project__c',
  'Project_Objective__c': 'Project_Objective__c',
  'ProjectObjective': 'Project_Objective__c',
  'Qualification_Step__c': 'Qualification_Step__c',
  'QualificationStep': 'Qualification_Step__c',
  'Project_Page__c': 'Project_Page__c',
  'ProjectPage': 'Project_Page__c',
  'Project_Workstream__c': 'Project_Workstream__c',
  'Workstream': 'Project_Workstream__c'
};

/**
 * Load field help text from file
 */
const loadFieldHelpText = async () => {
  try {
    const data = await fs.readFile(FIELD_HELP_TEXT_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty object
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

/**
 * Save field help text to file
 */
const saveFieldHelpText = async (data) => {
  // Ensure directory exists
  const dir = path.dirname(FIELD_HELP_TEXT_PATH);
  await fs.mkdir(dir, { recursive: true });
  
  // Write formatted JSON
  await fs.writeFile(FIELD_HELP_TEXT_PATH, JSON.stringify(data, null, 2), 'utf8');
};

/**
 * GET /api/field-help-text/:objectType/:fieldName
 * Get help text for a specific field
 */
router.get('/:objectType/:fieldName', authenticate, asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldName } = req.params;
    const salesforceObjectName = OBJECT_TYPE_MAP[objectType] || objectType;
    
    const helpTextData = await loadFieldHelpText();
    const helpText = helpTextData[salesforceObjectName]?.[fieldName] || null;
    
    res.json({
      success: true,
      helpText,
      objectType: salesforceObjectName,
      fieldName
    });
  } catch (error) {
    console.error('Error fetching field help text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch field help text'
    });
  }
}));

/**
 * GET /api/field-help-text/:objectType
 * Get all help text for an object type
 */
router.get('/:objectType', authenticate, asyncHandler(async (req, res) => {
  try {
    const { objectType } = req.params;
    const salesforceObjectName = OBJECT_TYPE_MAP[objectType] || objectType;
    
    const helpTextData = await loadFieldHelpText();
    const objectHelpText = helpTextData[salesforceObjectName] || {};
    
    res.json({
      success: true,
      helpText: objectHelpText,
      objectType: salesforceObjectName
    });
  } catch (error) {
    console.error('Error fetching field help text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch field help text'
    });
  }
}));

/**
 * POST /api/field-help-text/sync/:objectType
 * Sync field help text from Salesforce (one-time fetch)
 * Requires admin permission
 */
router.post('/sync/:objectType', authenticate, authorize('admin', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType } = req.params;
    const salesforceObjectName = OBJECT_TYPE_MAP[objectType] || objectType;
    
    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject(salesforceObjectName).describe();
    
    // Load existing help text
    const helpTextData = await loadFieldHelpText();
    if (!helpTextData[salesforceObjectName]) {
      helpTextData[salesforceObjectName] = {};
    }
    
    // Fetch inlineHelpText from Salesforce for each field
    let syncedCount = 0;
    describeResult.fields.forEach(field => {
      if (field.inlineHelpText) {
        // Only update if not already set (preserve manual edits)
        if (!helpTextData[salesforceObjectName][field.name]) {
          helpTextData[salesforceObjectName][field.name] = field.inlineHelpText;
          syncedCount++;
        }
      }
    });
    
    // Save updated help text
    await saveFieldHelpText(helpTextData);
    
    res.json({
      success: true,
      message: `Synced ${syncedCount} field help texts from Salesforce`,
      objectType: salesforceObjectName,
      syncedCount,
      totalFields: describeResult.fields.length
    });
  } catch (error) {
    console.error('Error syncing field help text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync field help text'
    });
  }
}));

/**
 * PUT /api/field-help-text/:objectType/:fieldName
 * Update help text for a specific field (allows manual editing)
 * Requires admin permission
 */
router.put('/:objectType/:fieldName', authenticate, authorize('admin', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldName } = req.params;
    const { helpText } = req.body;
    const salesforceObjectName = OBJECT_TYPE_MAP[objectType] || objectType;
    
    if (typeof helpText !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'helpText must be a string'
      });
    }
    
    // Load existing help text
    const helpTextData = await loadFieldHelpText();
    if (!helpTextData[salesforceObjectName]) {
      helpTextData[salesforceObjectName] = {};
    }
    
    // Update help text
    helpTextData[salesforceObjectName][fieldName] = helpText;
    
    // Save updated help text
    await saveFieldHelpText(helpTextData);
    
    res.json({
      success: true,
      message: 'Field help text updated successfully',
      objectType: salesforceObjectName,
      fieldName,
      helpText
    });
  } catch (error) {
    console.error('Error updating field help text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update field help text'
    });
  }
}));

/**
 * DELETE /api/field-help-text/:objectType/:fieldName
 * Delete help text for a specific field
 * Requires admin permission
 */
router.delete('/:objectType/:fieldName', authenticate, authorize('admin', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldName } = req.params;
    const salesforceObjectName = OBJECT_TYPE_MAP[objectType] || objectType;
    
    // Load existing help text
    const helpTextData = await loadFieldHelpText();
    if (helpTextData[salesforceObjectName] && helpTextData[salesforceObjectName][fieldName]) {
      delete helpTextData[salesforceObjectName][fieldName];
      
      // Save updated help text
      await saveFieldHelpText(helpTextData);
    }
    
    res.json({
      success: true,
      message: 'Field help text deleted successfully',
      objectType: salesforceObjectName,
      fieldName
    });
  } catch (error) {
    console.error('Error deleting field help text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete field help text'
    });
  }
}));

module.exports = router;
