// Salesforce settings routes

const express = require('express');
const fs = require('fs');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSettingsPath, loadUserSettings, saveUserSettings } = require('../../utils/salesforce/dataStorage');
const { encrypt, decrypt } = require('../../utils/salesforce/encryption');

/**
 * Save Salesforce settings (user-specific)
 * POST /api/salesforce/settings
 * 
 * IMPORTANT: This route is accessible to ALL authenticated users (no authorize middleware).
 * Each user can save their own Salesforce settings. This is intentional - Salesforce settings
 * are user-specific and any authenticated user should be able to configure their own credentials.
 * 
 * Middleware order:
 * 1. CSRF validation (applied at route level in server/index.js)
 * 2. authenticate (validates JWT token and sets req.user)
 * 
 * Note: authenticate middleware must run before CSRF validation to ensure req.user is set
 * for CSRF token generation/validation.
 */
router.post('/settings', authenticate, async (req, res) => {
  try {
    // Log request details for debugging
    const userEmail = req.user?.email || 'unknown';
    const userId = req.user?.id;
    console.log(`[Salesforce Settings] ===== POST /settings request =====`);
    console.log(`[Salesforce Settings] User ID: ${userId || 'unknown'}`);
    console.log(`[Salesforce Settings] User Email: ${userEmail}`);
    console.log(`[Salesforce Settings] User permissions:`, req.user?.permissions || 'none');
    console.log(`[Salesforce Settings] User role:`, req.user?.role || 'none');
    console.log(`[Salesforce Settings] Request body keys:`, Object.keys(req.body || {}));
    
    if (!req.user || !userId) {
      console.error('[Salesforce Settings] No user ID found in request');
      console.error('[Salesforce Settings] req.user:', req.user);
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User ID not found. Please log in again.'
      });
    }
    
    const { salesforceUrl, username, password, securityToken, domain, loginUrl } = req.body;

    // Support both new field name (salesforceUrl) and old field name (loginUrl) for backward compatibility
    const url = salesforceUrl || loginUrl;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Salesforce URL is required' });
    }

    if (!username || !password || !securityToken) {
      return res.status(400).json({ error: 'Username, password, and security token are required' });
    }

    // Auto-detect domain from URL if not provided
    let detectedDomain = domain;
    if (!detectedDomain) {
      const urlLower = url.toLowerCase();
      if (urlLower.includes('test.salesforce.com')) {
        detectedDomain = 'test';
      } else if (urlLower.includes('login.salesforce.com')) {
        detectedDomain = 'login';
      } else {
        detectedDomain = 'custom';
      }
    }

    // Encrypt sensitive data
    const encryptedSettings = {
      salesforceUrl: url,
      username: encrypt(username),
      password: encrypt(password),
      securityToken: encrypt(securityToken),
      domain: detectedDomain,
      loginUrl: url, // Keep for backward compatibility
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
      userId: userId // Store user ID for reference
    };

    // Save to user-specific file (with immediate persistence for critical settings)
    try {
      console.log(`[Salesforce Settings] Starting save for user ${userId}`);
      
      // First, save to store
      await saveUserSettings(userId, encryptedSettings, true); // true = persist immediately
      console.log(`[Salesforce Settings] Settings saved to store for user ${userId}`);
      
      // Verify settings were saved by checking the store
      const { salesforceSettingsActions } = require('../../store/actions');
      const savedSettings = salesforceSettingsActions.getSettings(userId);
      
      if (!savedSettings) {
        console.error(`[Salesforce Settings] Failed to verify settings save for user ${userId} - settings not found in store`);
        return res.status(500).json({ 
          error: 'Failed to save settings. Please try again.',
          message: 'Settings were not saved successfully to the store'
        });
      }
      
      // Verify the settings match what we tried to save
      if (savedSettings.username !== encryptedSettings.username) {
        console.error(`[Salesforce Settings] Settings mismatch for user ${userId}. Expected username: ${encryptedSettings.username}, Got: ${savedSettings.username}`);
        return res.status(500).json({ 
          error: 'Failed to verify settings. Please try again.',
          message: 'Settings verification failed'
        });
      }
      
      // Verify file was written to disk
      const { getSettingsPath } = require('../../utils/salesforce/dataStorage');
      const fs = require('fs');
      const settingsPath = getSettingsPath(userId);
      
      if (!fs.existsSync(settingsPath)) {
        console.error(`[Salesforce Settings] Settings file not found at ${settingsPath} for user ${userId}`);
        return res.status(500).json({ 
          error: 'Failed to persist settings to disk. Please try again.',
          message: 'Settings were saved to memory but not persisted to disk'
        });
      }
      
      // Verify file contents
      const fileContents = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (fileContents.username !== encryptedSettings.username) {
        console.error(`[Salesforce Settings] File contents mismatch for user ${userId}`);
        return res.status(500).json({ 
          error: 'Settings file verification failed. Please try again.',
          message: 'Settings file contents do not match'
        });
      }
      
      console.log(`[Salesforce Settings] Successfully saved and verified Salesforce settings for user ${userId} (store + disk)`);
    } catch (saveError) {
      console.error('[Salesforce Settings] Error saving Salesforce settings:', saveError);
      console.error('[Salesforce Settings] Error stack:', saveError.stack);
      return res.status(500).json({ 
        error: 'Error saving settings',
        message: saveError.message || 'Failed to save settings',
        details: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
      });
    }
    
    // Clear any cached sessions for this user since credentials changed
    try {
      const { clearSession } = require('../../services/salesforce/sessionManager');
      clearSession(userId);
      console.log(`Cleared Salesforce session cache for user ${userId} after credential update`);
    } catch (sessionError) {
      console.warn('Error clearing session cache:', sessionError);
      // Don't fail the request if session clearing fails
    }

    res.json({ 
      success: true,
      message: 'Settings saved successfully',
      settings: {
        salesforceUrl: url,
        domain: detectedDomain
      }
    });
  } catch (error) {
    console.error('Error saving Salesforce settings:', error);
    res.status(500).json({ error: 'Error saving settings' });
  }
});

/**
 * Get Salesforce settings (user-specific)
 * GET /api/salesforce/settings
 */
router.get('/settings', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[Salesforce Settings] Loading settings for user ${userId}`);
    
    // Load user-specific settings only from store
    // SECURITY: No fallback to global settings - each user must have their own credentials
    const encryptedSettings = loadUserSettings(userId);
    
    if (!encryptedSettings) {
      console.log(`[Salesforce Settings] No settings found for user ${userId}`);
      return res.status(200).json({
        salesforceUrl: '',
        username: '',
        password: '',
        securityToken: '',
        domain: '',
        loginUrl: ''
      });
    }

    console.log(`[Salesforce Settings] Found settings for user ${userId}, salesforceUrl: ${encryptedSettings.salesforceUrl || encryptedSettings.loginUrl || 'N/A'}`);

    // Return settings without sensitive data (passwords/tokens should never be returned)
    // Only return non-sensitive configuration data
    const safeSettings = {
      salesforceUrl: encryptedSettings.salesforceUrl || encryptedSettings.loginUrl || '',
      username: decrypt(encryptedSettings.username || ''), // Username is less sensitive but still consider masking
      password: '****', // Never return actual password
      securityToken: '****', // Never return actual security token
      domain: encryptedSettings.domain || '',
      loginUrl: encryptedSettings.salesforceUrl || encryptedSettings.loginUrl || ''
    };

    res.status(200).json(safeSettings);
  } catch (error) {
    console.error('[Salesforce Settings] Error reading Salesforce settings:', error);
    console.error('[Salesforce Settings] Error stack:', error.stack);
    res.status(200).json({
      salesforceUrl: '',
      username: '',
      password: '',
      securityToken: '',
      domain: '',
      loginUrl: ''
    });
  }
});

module.exports = router;

