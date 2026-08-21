/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const csrf = require('csrf');
const tokens = new csrf();

/**
 * CSRF token generation endpoint
 * GET /api/csrf-token
 * This endpoint should be accessible without authentication, but can use user info if available
 */
// Get client URL from environment or use default
const getClientUrl = () => {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.split(',')[0]; // Use first URL if multiple
  }
  // Default to ptools.appen.com for production, localhost for development
  return process.env.NODE_ENV === 'production' 
    ? 'https://ptools.appen.com' 
    : 'http://localhost:3000';
};

const CLIENT_URL = getClientUrl();

const getCsrfToken = (req, res) => {
  try {
    // Set CORS headers
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', CLIENT_URL);
    } else {
      // Production: use configured origins
      const allowedOrigins = process.env.CLIENT_URL 
        ? process.env.CLIENT_URL.split(',')
        : [CLIENT_URL];
      if (allowedOrigins.length > 0) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
    }
    
    // Use user ID from JWT token, session ID, or IP address as secret
    // This ensures tokens are user-specific
    let secret = 'default-secret';
    
    // Try to get user from JWT token if available (from Authorization header)
    // Note: req.user might be set by authenticate middleware if called before this
    // PRIORITY: Always try to use user-based secret if user is authenticated
    let userIdFromToken = null;
    
    // First, try req.user (if authenticate middleware ran before this)
    if (req.user?.id) {
      secret = `user-${req.user.id}`;
    } else {
      // Try to extract user ID from JWT token if available (before authentication middleware runs)
      // This ensures CSRF tokens are generated with the same secret used for validation
      try {
        const jwt = require('jsonwebtoken');
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const jwtToken = authHeader.split(' ')[1];
          if (jwtToken) {
            const decoded = jwt.decode(jwtToken); // Use decode instead of verify to avoid requiring secret here
            if (decoded && decoded.id) {
              userIdFromToken = decoded.id;
              secret = `user-${userIdFromToken}`;
              console.log(`[CSRF Token Generation] Extracted user ID ${userIdFromToken} from JWT token`);
            }
          }
        }
      } catch (error) {
        // Ignore JWT decode errors - will fall back to other secret methods
        console.warn('[CSRF Token Generation] Error extracting user ID from JWT:', error.message);
      }
      
      // Fallback to session or IP if no user ID found
      if (!userIdFromToken) {
        if (req.session?.id) {
          secret = `session-${req.session.id}`;
        } else {
          // Fallback to IP address (less secure but works for anonymous requests)
          const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
          secret = `ip-${ip}`;
        }
      }
    }
    
    const token = tokens.create(secret);
    
    // Store token in session if available
    if (req.session) {
      req.session.csrfToken = token;
      req.session.csrfSecret = secret;
    }
    
    res.json({
      success: true,
      csrfToken: token
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      message: error.message
    });
  }
};

/**
 * CSRF validation middleware
 * Validates CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 */
const validateCsrf = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF validation for auth endpoints (they use JWT)
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  
  // Get token from header (preferred) or body
  // Check both lowercase and original case header names
  const token = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.body?.csrfToken;
  
  if (!token) {
    console.warn('[CSRF] Token missing for request:', {
      method: req.method,
      path: req.path,
      fullUrl: req.originalUrl || req.url,
      headers: Object.keys(req.headers).filter(h => h.toLowerCase().includes('csrf')),
      bodyHasToken: !!req.body?.csrfToken,
      hasAuthHeader: !!req.headers.authorization
    });
      return res.status(403).json({
        success: false,
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request. Please refresh the page and try again.',
        code: 'CSRF_TOKEN_MISSING'
      });
  }
  
  // Try to extract user ID from JWT token if available (before authentication middleware runs)
  // This ensures CSRF tokens generated with user-based secrets can be validated
  // IMPORTANT: This must happen BEFORE authenticate middleware runs, so we decode the JWT directly
  let userIdFromToken = null;
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.split(' ')[1];
      if (jwtToken) {
        // Decode without verification (we just need the user ID for CSRF secret matching)
        // The authenticate middleware will verify the token later
        const decoded = jwt.decode(jwtToken);
        if (decoded && decoded.id) {
          userIdFromToken = decoded.id;
          console.log(`[CSRF] Extracted user ID ${userIdFromToken} from JWT token for CSRF validation`);
        }
      }
    }
  } catch (error) {
    // Ignore JWT decode errors - will fall back to other secret methods
    console.warn('[CSRF] Error extracting user ID from JWT:', error.message);
  }
  
  // Also check if req.user is set (in case authenticate middleware already ran)
  // This can happen if middleware order is different
  if (req.user?.id && !userIdFromToken) {
    userIdFromToken = req.user.id;
    console.log(`[CSRF] Using user ID ${userIdFromToken} from req.user`);
  }
  
  // Determine secret based on user, session, or IP
  // PRIORITY: user-based secret (most secure for authenticated users)
  let secret = 'default-secret';
  const userId = req.user?.id || userIdFromToken;
  
  if (userId) {
    // For authenticated users, always use user-based secret
    secret = `user-${userId}`;
    console.log(`[CSRF] Using user-based secret for user ${userId}`);
  } else if (req.session?.csrfSecret) {
    secret = req.session.csrfSecret;
    console.log('[CSRF] Using session-based secret from session');
  } else if (req.session?.id) {
    secret = `session-${req.session.id}`;
    console.log(`[CSRF] Using session-based secret for session ${req.session.id}`);
  } else {
    secret = `ip-${req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown'}`;
    console.log(`[CSRF] Using IP-based secret for IP ${req.ip || 'unknown'}`);
  }
  
  // Verify token with primary secret
  if (!tokens.verify(secret, token)) {
    console.warn(`[CSRF] Token verification failed with primary secret. Token length: ${token?.length}, Secret type: ${secret.substring(0, 20)}...`);
    
    // Try alternative secrets for authenticated users
    if (userId) {
      // Try all possible user-based secret variations (should already be tried, but double-check)
      const userSecret = `user-${userId}`;
      if (secret !== userSecret && tokens.verify(userSecret, token)) {
        console.log('[CSRF] Token verified with user-based secret (fallback)');
        return next(); // Success with user-based secret
      }
      // Try with session-based secret as fallback
      const sessionSecret = req.session?.csrfSecret || `session-${req.session?.id || 'none'}`;
      if (tokens.verify(sessionSecret, token)) {
        console.log('[CSRF] Token verified with session-based secret (fallback)');
        return next(); // Success with session-based secret
      }
      // Try IP-based secret as last resort for authenticated users
      const ipSecret = `ip-${req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown'}`;
      if (tokens.verify(ipSecret, token)) {
        console.log('[CSRF] Token verified with IP-based secret (fallback)');
        return next(); // Success with IP-based secret
      }
      console.warn('[CSRF] Token verification failed for authenticated user:', {
        userId: userId,
        method: req.method,
        path: req.path,
        fullUrl: req.originalUrl || req.url,
        tokenLength: token?.length,
        secretUsed: secret,
        sessionSecret: req.session?.csrfSecret ? 'present' : 'missing',
        sessionId: req.session?.id || 'none',
        triedSecrets: ['user-based', 'session-based', 'ip-based']
      });
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
        code: 'CSRF_TOKEN_INVALID'
      });
    } else {
      // For unauthenticated requests, try IP-based secret if session-based failed
      const ipSecret = `ip-${req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown'}`;
      if (tokens.verify(ipSecret, token)) {
        console.log('[CSRF] Token verified with IP-based secret (fallback)');
        return next(); // Success with IP-based secret
      }
      console.warn('[CSRF] Token verification failed:', {
        method: req.method,
        path: req.path,
        fullUrl: req.originalUrl || req.url,
        tokenLength: token?.length,
        secretUsed: secret,
        sessionSecret: req.session?.csrfSecret ? 'present' : 'missing',
        sessionId: req.session?.id || 'none',
        triedSecrets: ['session-based', 'ip-based']
      });
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
        code: 'CSRF_TOKEN_INVALID'
      });
    }
  }
  
  // Log successful verification for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[CSRF] Token verified successfully:', {
      method: req.method,
      path: req.path,
      secretType: secret.startsWith('user-') ? 'user-based' : secret.startsWith('session-') ? 'session-based' : 'ip-based'
    });
  }
  
  next();
};

module.exports = {
  getCsrfToken,
  validateCsrf
};

