// Salesforce session manager - caches connections and tokens to avoid re-authentication

const jsforce = require('jsforce');
const { loadSalesforceSettings } = require('./settingsLoader');
// Lazy load getLoginUrlForConnection to avoid circular dependency
let getLoginUrlForConnection;

const getLoginUrl = () => {
  if (!getLoginUrlForConnection) {
    const connectionService = require('./connectionService');
    getLoginUrlForConnection = connectionService.getLoginUrlForConnection;
  }
  return getLoginUrlForConnection;
};

/**
 * Session cache entry structure:
 * {
 *   connection: jsforce.Connection,
 *   accessToken: string,
 *   instanceUrl: string,
 *   expiresAt: number (timestamp),
 *   createdAt: number (timestamp),
 *   userId: string
 * }
 */

// In-memory cache for sessions (keyed by userId or 'global' for global settings)
const sessionCache = new Map();

// Default token expiration time (2 hours in milliseconds)
// Salesforce tokens typically last 2 hours, but we'll refresh 5 minutes early
const DEFAULT_TOKEN_EXPIRY_MS = (2 * 60 * 60 * 1000) - (5 * 60 * 1000); // 1 hour 55 minutes
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer before expiration

// Rate limiting: Track login attempts to prevent excessive logins
const loginAttempts = new Map(); // key -> { count, lastLogin, windowStart }
const MAX_LOGINS_PER_WINDOW = 5; // Maximum logins per window (increased for normal usage patterns)
const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// Lock mechanism to prevent concurrent session creation (race condition prevention)
// When multiple requests come in simultaneously, they'll wait for the first one to complete
const sessionCreationLocks = new Map(); // key -> Promise<Connection>

/**
 * Generate a cache key for the session
 * @param {string|null} userId - User ID or null for global settings
 * @returns {string} Cache key
 */
const getCacheKey = (userId) => {
  return userId ? `user:${userId}` : 'global';
};

/**
 * Check if a session is still valid (not expired)
 * @param {Object} session - Session cache entry
 * @returns {boolean} True if session is valid
 */
const isSessionValid = (session) => {
  if (!session || !session.connection || !session.expiresAt) {
    return false;
  }
  
  // Check if token is expired (with buffer)
  const now = Date.now();
  const expiresAt = session.expiresAt;
  
  // Consider expired if we're within the refresh buffer time
  return now < (expiresAt - TOKEN_REFRESH_BUFFER_MS);
};

/**
 * Create a new Salesforce connection and authenticate
 * Implements retry logic for transient login failures
 * @param {Object} creds - Credentials object
 * @param {string|null} userId - User ID
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<Object>} Session object with connection and metadata
 */
const createNewSession = async (creds, userId = null, maxRetries = 3) => {
  const loginUrl = getLoginUrl()(creds.salesforceUrl);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create Salesforce connection
      const conn = new jsforce.Connection({
        loginUrl: loginUrl
      });

      // Login to Salesforce
      const fullPassword = creds.password + creds.securityToken;
      const loginStartTime = Date.now();
      const userInfo = await conn.login(creds.username, fullPassword);
      const loginElapsed = Date.now() - loginStartTime;
      
      console.log(`[Salesforce Session] New login successful in ${loginElapsed}ms, user ID: ${userInfo.id}`);
      
      // Extract access token and instance URL from connection
      const accessToken = conn.accessToken;
      const instanceUrl = conn.instanceUrl;
      
      // Calculate expiration time
      // Salesforce tokens typically last 2 hours, but we'll use a conservative approach
      // If the connection has sessionId, we can trust it's valid
      const expiresAt = Date.now() + DEFAULT_TOKEN_EXPIRY_MS;
      
      const session = {
        connection: conn,
        accessToken: accessToken,
        instanceUrl: instanceUrl,
        expiresAt: expiresAt,
        createdAt: Date.now(),
        userId: userId,
        username: creds.username
      };
      
      return session;
    } catch (error) {
      const isTransientError = 
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ENOTFOUND') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        (error.errorCode && ['SERVER_UNAVAILABLE'].includes(error.errorCode)) ||
        error.statusCode === 503; // Service Unavailable
      
      // Check for Salesforce rate limiting errors FIRST (before other error checks)
      const isRateLimitError = 
        error.message?.includes('Too many requests') ||
        error.message?.includes('REQUEST_LIMIT_EXCEEDED') ||
        error.message?.includes('rate limit') ||
        error.errorCode === 'REQUEST_LIMIT_EXCEEDED' ||
        error.statusCode === 429 ||
        (error.errorCode && ['REQUEST_LIMIT_EXCEEDED', 'TOO_MANY_REQUESTS'].includes(error.errorCode));
      
      if (isRateLimitError) {
        // Rate limit error - wait longer before retrying (30s, 60s, 90s, max 120s)
        const waitTime = Math.min(30000 * attempt, 120000);
        console.error(`[Salesforce Session] Rate limit exceeded. Waiting ${waitTime / 1000}s before retry (attempt ${attempt}/${maxRetries}): ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          throw new Error(`Salesforce rate limit exceeded. Please try again later. Original error: ${error.message}`);
        }
      }
      
      // Don't retry on authentication errors (invalid credentials)
      const isAuthError = 
        error.message?.includes('INVALID_LOGIN') ||
        error.message?.includes('authentication failure') ||
        error.errorCode === 'INVALID_LOGIN' ||
        error.errorCode === 'INVALID_PASSWORD';
      
      if (isAuthError || (!isTransientError && attempt === maxRetries)) {
        // Permanent error or last attempt - throw the error
        throw error;
      }
      
      if (isTransientError && attempt < maxRetries) {
        // Transient error - retry with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.log(`[Salesforce Session] Login failed (transient), retrying in ${backoffDelay}ms (attempt ${attempt}/${maxRetries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      // Last attempt or non-transient error
      throw error;
    }
  }
};

/**
 * Verify that a connection is still valid by making a lightweight API call
 * Implements retry logic for transient failures
 * NOTE: This is only called when session is close to expiration to minimize API calls
 * @param {jsforce.Connection} conn - Salesforce connection
 * @param {number} maxRetries - Maximum number of retry attempts (default: 1 - reduced to minimize API calls)
 * @returns {Promise<boolean>} True if connection is valid
 */
const verifyConnection = async (conn, maxRetries = 1) => {
  // Use shorter timeout to fail fast and avoid blocking
  const timeout = parseInt(process.env.SALESFORCE_CONNECTION_TIMEOUT || '3000', 10);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Make a lightweight call to verify the connection
      // Using identity() is a lightweight way to check if token is valid
      await Promise.race([
        conn.identity(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection verification timeout')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      // Check if it's a 401 (unauthorized) - means token is definitely expired
      const isUnauthorized = 
        error.errorCode === 'INVALID_SESSION_ID' ||
        error.statusCode === 401 ||
        error.message?.includes('INVALID_SESSION_ID') ||
        error.message?.includes('Session expired');
      
      if (isUnauthorized) {
        // Token is definitely expired, no need to retry
        console.log(`[Salesforce Session] Connection verification failed: Session expired/invalid`);
        return false;
      }
      
      const isTransientError = 
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ENOTFOUND') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET';
      
      if (!isTransientError || attempt === maxRetries) {
        // Permanent error or last attempt
        // For transient errors, we'll assume connection is still valid to avoid unnecessary logins
        if (isTransientError) {
          console.log(`[Salesforce Session] Connection verification timeout (transient network issue), assuming connection is still valid`);
          return true; // Assume valid to avoid unnecessary login
        } else {
          console.log(`[Salesforce Session] Connection verification failed: ${error.message} (attempt ${attempt}/${maxRetries})`);
          return false;
        }
      }
      
      // Transient error - retry with exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // Max 3 seconds
      console.log(`[Salesforce Session] Connection verification failed (transient), retrying in ${backoffDelay}ms (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  return false;
};

/**
 * Check rate limit for login attempts
 * @param {string} cacheKey - Cache key
 * @returns {boolean} True if login is allowed
 */
const checkRateLimit = (cacheKey) => {
  const now = Date.now();
  const attemptData = loginAttempts.get(cacheKey);
  
  if (!attemptData) {
    // First login attempt
    loginAttempts.set(cacheKey, {
      count: 1,
      lastLogin: now,
      windowStart: now
    });
    return true;
  }
  
  // Reset window if it's been more than the window duration
  if (now - attemptData.windowStart > LOGIN_RATE_LIMIT_WINDOW_MS) {
    attemptData.count = 1;
    attemptData.windowStart = now;
    attemptData.lastLogin = now;
    return true;
  }
  
  // Check if we've exceeded the limit
  if (attemptData.count >= MAX_LOGINS_PER_WINDOW) {
    const timeUntilReset = LOGIN_RATE_LIMIT_WINDOW_MS - (now - attemptData.windowStart);
    console.warn(`[Salesforce Session] Rate limit exceeded for ${cacheKey}. ${attemptData.count} logins in ${Math.round((now - attemptData.windowStart) / 1000)}s. Wait ${Math.round(timeUntilReset / 1000)}s before next login.`);
    return false;
  }
  
  // Increment count
  attemptData.count++;
  attemptData.lastLogin = now;
  return true;
};

/**
 * Get or create a Salesforce connection with session management
 * Optimized to minimize login frequency by:
 * - Only verifying connection when session is close to expiration
 * - Using rate limiting to prevent excessive logins
 * - Trusting cached sessions unless they're expired
 * SECURITY: userId is required when settings are not provided to ensure user-specific credentials
 * @param {Object} settings - Optional settings (if not provided, userId is required)
 * @param {string} userId - User ID for user-specific settings (REQUIRED if settings not provided)
 * @param {boolean} allowSystemUser - Allow system user fallback for background jobs (default: false)
 * @returns {Promise<jsforce.Connection>} Authenticated Salesforce connection
 */
const getSalesforceConnection = async (settings = null, userId = null, allowSystemUser = false) => {
  // SECURITY: Require userId when settings are not provided to prevent credential leakage
  if (!settings && !userId) {
    // For background jobs, allow system user from environment variable
    if (allowSystemUser && process.env.SALESFORCE_SYSTEM_USER_ID) {
      userId = process.env.SALESFORCE_SYSTEM_USER_ID;
      console.log(`[Salesforce Session] Using system user ID from environment: ${userId}`);
    } else {
      throw new Error('User ID is required when settings are not provided. Each user must use their own Salesforce credentials.');
    }
  }
  
  const cacheKey = getCacheKey(userId);
  
  // Check if we have a cached session
  const cachedSession = sessionCache.get(cacheKey);
  
  if (cachedSession && isSessionValid(cachedSession)) {
    // Only verify connection if session is close to expiration (within 10 minutes)
    // This reduces unnecessary API calls while still catching expired tokens
    const timeUntilExpiration = cachedSession.expiresAt - Date.now();
    const VERIFY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
    
    if (timeUntilExpiration < VERIFY_THRESHOLD_MS) {
      // Session is close to expiration, verify it's still working
      const isValid = await verifyConnection(cachedSession.connection);
      
      if (isValid) {
        console.log(`[Salesforce Session] Using cached connection for ${cacheKey} (expires in ${Math.round(timeUntilExpiration / 1000)}s)`);
        return cachedSession.connection;
      } else {
        // Connection is invalid, remove from cache
        console.log(`[Salesforce Session] Cached connection for ${cacheKey} is invalid, creating new session`);
        sessionCache.delete(cacheKey);
      }
    } else {
      // Session is still fresh, trust it without verification
      console.log(`[Salesforce Session] Using cached connection for ${cacheKey} (created ${Math.round((Date.now() - cachedSession.createdAt) / 1000)}s ago, expires in ${Math.round(timeUntilExpiration / 1000)}s)`);
      return cachedSession.connection;
    }
  } else if (cachedSession) {
    // Session expired
    console.log(`[Salesforce Session] Cached session for ${cacheKey} expired, creating new session`);
    sessionCache.delete(cacheKey);
  }
  
  // Check if there's already a session creation in progress (prevent race condition)
  // This prevents multiple concurrent requests from all creating sessions simultaneously
  const existingLock = sessionCreationLocks.get(cacheKey);
  if (existingLock) {
    console.log(`[Salesforce Session] Session creation already in progress for ${cacheKey}, waiting for it to complete...`);
    try {
      return await existingLock;
    } catch (error) {
      // If the existing lock fails, we'll try to create our own
      console.log(`[Salesforce Session] Existing session creation failed, attempting new creation for ${cacheKey}`);
      sessionCreationLocks.delete(cacheKey);
    }
  }
  
  // Check rate limit before creating new session
  if (!checkRateLimit(cacheKey)) {
    // Rate limit exceeded - throw error to prevent excessive logins
    const attemptData = loginAttempts.get(cacheKey);
    const timeUntilReset = attemptData ? LOGIN_RATE_LIMIT_WINDOW_MS - (Date.now() - attemptData.windowStart) : LOGIN_RATE_LIMIT_WINDOW_MS;
    throw new Error(`Too many Salesforce login attempts. Please wait ${Math.ceil(timeUntilReset / 1000)}s before retrying. This helps prevent account lockout.`);
  }
  
  // Create a lock promise for this session creation
  const sessionCreationPromise = (async () => {
    try {
      // Double-check cache after acquiring lock (another request might have created it)
      const recheckSession = sessionCache.get(cacheKey);
      if (recheckSession && isSessionValid(recheckSession)) {
        console.log(`[Salesforce Session] Session was created by another request while waiting, using cached connection for ${cacheKey}`);
        return recheckSession.connection;
      }
      
      // Create new session
      // SECURITY: userId is required when loading from file to ensure user-specific credentials
      if (!settings && !userId) {
        // For background jobs, allow system user from environment variable
        if (allowSystemUser && process.env.SALESFORCE_SYSTEM_USER_ID) {
          userId = process.env.SALESFORCE_SYSTEM_USER_ID;
          console.log(`[Salesforce Session] Using system user ID from environment: ${userId}`);
        } else {
          throw new Error('User ID is required to load Salesforce settings. Each user must configure their own credentials.');
        }
      }
      const creds = settings || loadSalesforceSettings(userId, allowSystemUser);
      const newSession = await createNewSession(creds, userId);
      
      // Store in cache
      sessionCache.set(cacheKey, newSession);
      console.log(`[Salesforce Session] Created and cached new session for ${cacheKey} (login attempt ${loginAttempts.get(cacheKey)?.count || 1} in current window)`);
      
      return newSession.connection;
    } finally {
      // Remove lock when done (success or failure)
      sessionCreationLocks.delete(cacheKey);
    }
  })();
  
  // Store the lock promise
  sessionCreationLocks.set(cacheKey, sessionCreationPromise);
  
  return await sessionCreationPromise;
};

/**
 * Clear a specific session from cache
 * @param {string} userId - User ID or null for global
 */
const clearSession = (userId = null) => {
  const cacheKey = getCacheKey(userId);
  if (sessionCache.has(cacheKey)) {
    sessionCache.delete(cacheKey);
    console.log(`[Salesforce Session] Cleared session for ${cacheKey}`);
  }
};

/**
 * Clear all sessions from cache
 */
const clearAllSessions = () => {
  const count = sessionCache.size;
  sessionCache.clear();
  console.log(`[Salesforce Session] Cleared all ${count} sessions from cache`);
};

/**
 * Get session statistics for monitoring
 * @returns {Object} Session statistics
 */
const getSessionStats = () => {
  const sessions = Array.from(sessionCache.entries()).map(([key, session]) => ({
    key,
    userId: session.userId,
    username: session.username,
    createdAt: new Date(session.createdAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
    ageSeconds: Math.round((Date.now() - session.createdAt) / 1000),
    expiresInSeconds: Math.round((session.expiresAt - Date.now()) / 1000),
    isValid: isSessionValid(session)
  }));
  
  return {
    totalSessions: sessionCache.size,
    sessions: sessions
  };
};

// Cleanup expired sessions periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, session] of sessionCache.entries()) {
    if (!isSessionValid(session)) {
      sessionCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[Salesforce Session] Cleaned up ${cleanedCount} expired session(s)`);
  }
}, 10 * 60 * 1000); // Every 10 minutes

module.exports = {
  getSalesforceConnection,
  clearSession,
  clearAllSessions,
  getSessionStats
};
