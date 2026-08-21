// Salesforce connection service

const jsforce = require('jsforce');
const { getSalesforceConnection } = require('./sessionManager');
const { loadSalesforceSettings } = require('./settingsLoader');

/**
 * Normalize Salesforce URL for connection
 * @param {string} salesforceUrl - Raw Salesforce URL
 * @returns {string} Normalized URL
 */
const normalizeSalesforceUrl = (salesforceUrl) => {
  let normalizedUrl = String(salesforceUrl).trim();
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  normalizedUrl = normalizedUrl.replace(/\/services\/.*$/i, '');
  return normalizedUrl;
};

/**
 * Get login URL for jsforce connection based on Salesforce URL
 * @param {string} salesforceUrl - Salesforce URL
 * @returns {string} Login URL for jsforce
 */
const getLoginUrlForConnection = (salesforceUrl) => {
  const normalizedUrl = normalizeSalesforceUrl(salesforceUrl);
  const urlLower = normalizedUrl.toLowerCase();
  
  if (urlLower.includes('lightning.force.com')) {
    if (urlLower.includes('.sandbox.') || urlLower.includes('--staging') || urlLower.includes('--dev')) {
      return 'https://test.salesforce.com';
    } else {
      return 'https://login.salesforce.com';
    }
  } else if (urlLower.includes('.my.salesforce.com')) {
    return 'https://login.salesforce.com';
  } else if (urlLower.includes('test.salesforce.com') || urlLower.includes('--staging') || urlLower.includes('--dev')) {
    return 'https://test.salesforce.com';
  }
  
  return 'https://login.salesforce.com';
};

// loadSalesforceSettings moved to settingsLoader.js to avoid circular dependency

/**
 * Create and authenticate Salesforce connection
 * Uses session management to cache connections and reuse tokens
 * SECURITY: userId is required when settings are not provided to ensure user-specific credentials
 * @param {Object} settings - Optional settings (if not provided, userId is required)
 * @param {string} userId - User ID for user-specific settings (REQUIRED if settings not provided)
 * @param {boolean} allowSystemUser - Allow system user fallback for background jobs (default: false)
 * @returns {Promise<jsforce.Connection>} Authenticated Salesforce connection
 */
const createSalesforceConnection = async (settings = null, userId = null, allowSystemUser = false) => {
  // Use session manager to get or create a cached connection
  // This will reuse existing tokens if they're still valid
  return await getSalesforceConnection(settings, userId, allowSystemUser);
};

/**
 * Test Salesforce connection with provided credentials
 * @param {Object} credentials - Connection credentials
 * @returns {Promise<Object>} Connection test result
 */
const testSalesforceConnection = async (credentials) => {
  const { salesforceUrl, username, password, securityToken } = credentials;

  // Normalize Salesforce URL
  let normalizedUrl = String(salesforceUrl).trim();
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  normalizedUrl = normalizedUrl.replace(/\/services\/.*$/i, '');

  // Validate URL
  if (!normalizedUrl || !normalizedUrl.startsWith('https://')) {
    throw new Error(`Salesforce URL must start with https:// (e.g., https://login.salesforce.com or https://test.salesforce.com). Received: "${normalizedUrl}"`);
  }

  // Validate Salesforce domain
  const urlLower = normalizedUrl.toLowerCase();
  const hasSalesforceDomain = urlLower.includes('salesforce.com') ||
                             urlLower.includes('lightning.force.com') ||
                             urlLower.includes('force.com');

  if (!hasSalesforceDomain) {
    throw new Error(`Invalid Salesforce URL. URL must contain a Salesforce domain (salesforce.com, lightning.force.com, or force.com). Received: "${normalizedUrl}"`);
  }

  // Get login URL
  const loginUrl = getLoginUrlForConnection(normalizedUrl);
  console.log(`[Salesforce Connection] Using login URL: ${loginUrl} (from ${normalizedUrl})`);

  // Create connection with timeout configuration
  // Note: jsforce timeout option may not work as expected, so we rely on Promise.race timeout
  const conn = new jsforce.Connection({
    loginUrl: loginUrl,
    // Set timeout for connection (55 seconds to be under the 60s route timeout)
    // Note: This timeout may not be fully respected by jsforce, so we use Promise.race in the route
    timeout: 55000,
    // Set max retries to 0 for test connections to fail fast
    maxRequest: 1,
    // Disable automatic retries
    version: '58.0'
  });

  // Test login with timeout
  console.log(`[Salesforce Connection] Attempting login for user: ${username}`);
  const loginStartTime = Date.now();
  const fullPassword = password + securityToken;
  
  try {
    const userInfo = await conn.login(username, fullPassword);
    const loginElapsed = Date.now() - loginStartTime;
    console.log(`[Salesforce Connection] Login successful in ${loginElapsed}ms`);
    return {
      success: true,
      userId: userInfo.id,
      organizationId: userInfo.organizationId,
      url: conn.instanceUrl
    };
  } catch (loginError) {
    const loginElapsed = Date.now() - loginStartTime;
    console.error(`[Salesforce Connection] Login failed after ${loginElapsed}ms:`, loginError.message);
    throw loginError;
  }

  return {
    success: true,
    userId: userInfo.id,
    organizationId: userInfo.organizationId,
    url: conn.instanceUrl
  };
};

module.exports = {
  normalizeSalesforceUrl,
  getLoginUrlForConnection,
  loadSalesforceSettings,
  createSalesforceConnection,
  testSalesforceConnection
};

