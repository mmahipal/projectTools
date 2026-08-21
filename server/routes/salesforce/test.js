// Salesforce connection test route

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { testSalesforceConnection } = require('../../services/salesforce/connectionService');

// Rate limiting for test connections (prevent excessive login attempts)
const testConnectionAttempts = new Map(); // userId -> { count, lastTest, windowStart }
const MAX_TEST_CONNECTIONS_PER_WINDOW = 3; // Maximum test connections per window
const TEST_CONNECTION_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Check rate limit for test connection attempts
 * @param {string} userId - User ID
 * @returns {Object} { allowed: boolean, message?: string }
 */
const checkTestConnectionRateLimit = (userId) => {
  const now = Date.now();
  const attemptData = testConnectionAttempts.get(userId);
  
  if (!attemptData) {
    // First test attempt
    testConnectionAttempts.set(userId, {
      count: 1,
      lastTest: now,
      windowStart: now
    });
    return { allowed: true };
  }
  
  // Reset window if it's been more than the window duration
  if (now - attemptData.windowStart > TEST_CONNECTION_RATE_LIMIT_WINDOW_MS) {
    attemptData.count = 1;
    attemptData.windowStart = now;
    attemptData.lastTest = now;
    return { allowed: true };
  }
  
  // Check if we've exceeded the limit
  if (attemptData.count >= MAX_TEST_CONNECTIONS_PER_WINDOW) {
    const timeUntilReset = TEST_CONNECTION_RATE_LIMIT_WINDOW_MS - (now - attemptData.windowStart);
    return {
      allowed: false,
      message: `Too many test connection attempts. Please wait ${Math.ceil(timeUntilReset / 1000)} second(s) before trying again. This helps prevent Salesforce account lockout.`
    };
  }
  
  // Increment count
  attemptData.count++;
  attemptData.lastTest = now;
  return { allowed: true };
};

/**
 * Test Salesforce connection
 * POST /api/salesforce/test
 */
router.post('/test', authenticate, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check rate limit to prevent excessive test connections
  const rateLimitCheck = checkTestConnectionRateLimit(req.user.id);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: rateLimitCheck.message || 'Too many test connection attempts. Please wait before trying again.'
    });
  }
  
  // Increase timeout to 60 seconds for production network conditions
  // Can be overridden via environment variable
  const CONNECTION_TIMEOUT = parseInt(process.env.SALESFORCE_CONNECTION_TIMEOUT || '60000', 10); // 60 seconds default
  
  // Set response headers early to prevent proxy timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  
  const { salesforceUrl, username, password, securityToken, domain, loginUrl } = req.body;

  console.log('Test connection request received:', {
    salesforceUrl: salesforceUrl,
    loginUrl: loginUrl,
    domain: domain,
    hasUsername: !!username,
    hasPassword: !!password,
    hasSecurityToken: !!securityToken
  });

  // Support both new field name (salesforceUrl) and old field name (loginUrl) for backward compatibility
  const connectionUrl = salesforceUrl || loginUrl;
  
  console.log('Connection URL extracted:', connectionUrl);

  // Validate required fields
  if (!connectionUrl || !connectionUrl.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'Salesforce URL is required. Please provide your Salesforce URL.' 
    });
  }

  if (!username || username.trim() === '') {
    return res.status(400).json({ 
      success: false,
      message: 'Username is required' 
    });
  }

  if (!password || password.trim() === '') {
    return res.status(400).json({ 
      success: false,
      message: 'Password is required' 
    });
  }

  if (!securityToken || securityToken.trim() === '') {
    return res.status(400).json({ 
      success: false,
      message: 'Security token is required' 
    });
  }

  try {
    console.log(`Starting Salesforce connection test with ${CONNECTION_TIMEOUT / 1000}s timeout...`);
    console.log('Login URL will be determined from:', connectionUrl);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`Connection test timeout after ${elapsed}ms (${CONNECTION_TIMEOUT / 1000}s limit)`);
        reject(new Error(`Connection test timed out after ${CONNECTION_TIMEOUT / 1000} seconds. Please check your network connection and Salesforce URL.`));
      }, CONNECTION_TIMEOUT);
    });

    // Race between connection test and timeout
    const connectionPromise = testSalesforceConnection({
      salesforceUrl: connectionUrl,
      username,
      password,
      securityToken
    });
    
    console.log('Connection promise created, starting race with timeout...');
    const result = await Promise.race([
      connectionPromise,
      timeoutPromise
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`Salesforce connection test completed in ${elapsed}ms`);

    res.json({
      success: true,
      message: 'Connection successful',
      userId: result.userId,
      organizationId: result.organizationId,
      url: result.url
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`Salesforce connection test error after ${elapsed}ms:`, error);
    
    let errorMessage = 'Connection failed';
    if (error.message) {
      if (error.message.includes('timed out') || error.message.includes('timeout')) {
        errorMessage = `Connection test timed out after ${CONNECTION_TIMEOUT / 1000} seconds. This may be due to:
- Network latency or firewall restrictions
- Incorrect Salesforce URL
- Salesforce service temporarily unavailable

Please verify:
1. The Salesforce URL is correct and accessible
2. Your network connection is stable
3. There are no firewall rules blocking Salesforce connections
4. Try again in a few moments if Salesforce services are experiencing issues.`;
      } else if (error.message.includes('INVALID_LOGIN') || error.message.includes('authentication failure')) {
        errorMessage = 'Invalid username, password, or security token. Please check your credentials.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please verify your username, password, and security token.';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorMessage = 'Unable to resolve the Salesforce URL. Please check that the URL is correct and accessible.';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Unable to connect to Salesforce. Please check your network connection and that the Salesforce URL is correct.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
}));

module.exports = router;

