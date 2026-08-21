// Salesforce settings loader - separated to avoid circular dependencies

const fs = require('fs');
const { getSettingsPath, loadUserSettings } = require('../../utils/salesforce/dataStorage');
const { decrypt } = require('../../utils/salesforce/encryption');

/**
 * Load and decrypt Salesforce settings (user-specific)
 * SECURITY: userId is required - no fallback to global settings to prevent credential leakage
 * @param {string} userId - User ID for user-specific settings (REQUIRED)
 * @param {boolean} allowSystemUser - Allow system user fallback for background jobs (default: false)
 * @returns {Object} Decrypted Salesforce settings
 * @throws {Error} If userId is not provided or settings are not configured
 */
const loadSalesforceSettings = (userId, allowSystemUser = false) => {
  // SECURITY: Require userId to prevent accessing other users' credentials
  if (!userId) {
    // For background jobs, allow system user from environment variable
    if (allowSystemUser && process.env.SALESFORCE_SYSTEM_USER_ID) {
      userId = process.env.SALESFORCE_SYSTEM_USER_ID;
      console.log(`[Salesforce Settings] Using system user ID from environment: ${userId}`);
    } else {
      throw new Error('User ID is required to load Salesforce settings. Each user must configure their own credentials.');
    }
  }
  
  // Load user-specific settings only
  const encryptedSettings = loadUserSettings(userId);
  
  if (!encryptedSettings) {
    throw new Error(`Salesforce settings not configured for user ${userId}. Please configure Salesforce settings first.`);
  }

  // Decrypt credentials
  const salesforceUrl = encryptedSettings.salesforceUrl || encryptedSettings.loginUrl || '';
  const username = decrypt(encryptedSettings.username || '');
  const password = decrypt(encryptedSettings.password || '');
  const securityToken = decrypt(encryptedSettings.securityToken || '');

  if (!salesforceUrl || !username || !password || !securityToken) {
    throw new Error('Salesforce credentials are incomplete. Please reconfigure your Salesforce settings.');
  }

  return {
    salesforceUrl,
    username,
    password,
    securityToken,
    domain: encryptedSettings.domain || ''
  };
};

module.exports = {
  loadSalesforceSettings
};
