/**
 * User Settings Routes
 * Manages all user settings and configurations per user
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { userSettingsActions, appConfigurationActions } = require('../store/actions');
const store = require('../store');

/**
 * Get all settings for the authenticated user
 * GET /api/user-settings
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const allSettings = userSettingsActions.getAllSettings(userId);
    const allConfigurations = appConfigurationActions.getAllConfigurations(userId);
    
    res.json({
      success: true,
      settings: allSettings,
      configurations: allConfigurations
    });
  } catch (error) {
    console.error('[User Settings] Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user settings'
    });
  }
}));

/**
 * Get settings for a specific category
 * GET /api/user-settings/:category
 */
router.get('/:category', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const settings = userSettingsActions.getSetting(userId, category);
    
    if (settings === null) {
      return res.status(404).json({
        success: false,
        error: `Settings category '${category}' not found`
      });
    }
    
    res.json({
      success: true,
      category,
      settings
    });
  } catch (error) {
    console.error('[User Settings] Error getting category settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category settings'
    });
  }
}));

/**
 * Save settings for a specific category
 * POST /api/user-settings/:category
 */
router.post('/:category', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const settings = req.body;
    
    // Validate category name
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category name'
      });
    }
    
    // Save settings to store
    userSettingsActions.setSetting(userId, category, {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email || req.user.id
    });
    
    // Force immediate persistence for critical settings
    await store.persistImmediately();
    
    res.json({
      success: true,
      message: `Settings for category '${category}' saved successfully`,
      category,
      settings
    });
  } catch (error) {
    console.error('[User Settings] Error saving category settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save category settings'
    });
  }
}));

/**
 * Delete settings for a specific category
 * DELETE /api/user-settings/:category
 */
router.delete('/:category', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    
    userSettingsActions.deleteSetting(userId, category);
    
    // Force immediate persistence
    await store.persistImmediately();
    
    res.json({
      success: true,
      message: `Settings for category '${category}' deleted successfully`
    });
  } catch (error) {
    console.error('[User Settings] Error deleting category settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category settings'
    });
  }
}));

/**
 * Get a specific app configuration
 * GET /api/user-settings/config/:key
 */
router.get('/config/:key', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;
    const value = appConfigurationActions.getConfiguration(userId, key);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        error: `Configuration '${key}' not found`
      });
    }
    
    res.json({
      success: true,
      key,
      value
    });
  } catch (error) {
    console.error('[User Settings] Error getting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration'
    });
  }
}));

/**
 * Set an app configuration
 * POST /api/user-settings/config/:key
 */
router.post('/config/:key', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Configuration value is required'
      });
    }
    
    appConfigurationActions.setConfiguration(userId, key, {
      value,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email || req.user.id
    });
    
    // Force immediate persistence
    await store.persistImmediately();
    
    res.json({
      success: true,
      message: `Configuration '${key}' saved successfully`,
      key,
      value
    });
  } catch (error) {
    console.error('[User Settings] Error saving configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save configuration'
    });
  }
}));

/**
 * Delete an app configuration
 * DELETE /api/user-settings/config/:key
 */
router.delete('/config/:key', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;
    
    appConfigurationActions.deleteConfiguration(userId, key);
    
    // Force immediate persistence
    await store.persistImmediately();
    
    res.json({
      success: true,
      message: `Configuration '${key}' deleted successfully`
    });
  } catch (error) {
    console.error('[User Settings] Error deleting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete configuration'
    });
  }
}));

module.exports = router;
