const jwt = require('jsonwebtoken');

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

// Helper function to set CORS headers
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  
  // In development, allow all localhost origins
  if (process.env.NODE_ENV !== 'production') {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      // Use exact origin if provided, otherwise use default for development
      res.setHeader('Access-Control-Allow-Origin', origin || CLIENT_URL);
      return;
    }
  }
  
  // Production: use configured origins
  const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',')
    : [CLIENT_URL];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, still allow even if not in list
    res.setHeader('Access-Control-Allow-Origin', origin || CLIENT_URL);
  }
};

const authenticate = (req, res, next) => {
  // Log incoming requests for bulk-import to debug timeout issues
  if (req.url && req.url.includes('bulk-import')) {
    console.log('[Auth] Bulk import request received at', new Date().toISOString(), 'Method:', req.method, 'URL:', req.url);
  }
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.error('Authentication failed: No token provided');
    console.error('Request headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });
    // Set CORS headers before sending error response
    setCorsHeaders(req, res);
    return res.status(401).json({ 
      success: false,
      error: 'No token provided',
      message: 'Authentication required. Please log in again.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    
    // CRITICAL: Ensure permissions is always an array
    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
      console.warn(`[Auth] WARNING: JWT token has invalid permissions format!`, {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions,
        permissionsType: typeof req.user.permissions
      });
      req.user.permissions = [];
    }
    
    // Ensure admin users always have 'all' permission in req.user
    // This ensures authorize middleware works correctly for admin users
    const { ROLES } = require('../utils/roles');
    // Check multiple variations of admin role (case-insensitive)
    const isAdminRole = req.user.role === ROLES.ADMIN || 
                        req.user.role?.toLowerCase() === 'admin' ||
                        req.user.role === 'Admin' ||
                        req.user.role === 'ADMIN';
    
    if (isAdminRole) {
      if (!req.user.permissions.includes('all')) {
        req.user.permissions = ['all'];
        console.log(`[Auth] ✅ Admin user ${req.user.email} (role: ${req.user.role}) - ensuring 'all' permission in req.user`);
        console.log(`[Auth] Updated permissions:`, req.user.permissions);
      } else {
        console.log(`[Auth] ✅ Admin user ${req.user.email} (role: ${req.user.role}) already has 'all' permission`);
      }
    } else {
      console.log(`[Auth] User ${req.user.email} (role: ${req.user.role}) - permissions:`, req.user.permissions);
    }
    
    if (req.url && req.url.includes('bulk-import')) {
      console.log('[Auth] Authentication successful for bulk import at', new Date().toISOString());
    }
    
    next();
  } catch (error) {
    console.error('Authentication failed: Invalid token', {
      error: error.message,
      name: error.name,
      expiredAt: error.expiredAt
    });
    // Set CORS headers before sending error response
    setCorsHeaders(req, res);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token',
      message: error.name === 'TokenExpiredError' 
        ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token. Please log in again.'
    });
  }
};

const authorize = (...permissions) => {
  return (req, res, next) => {
    // Comprehensive logging for debugging
    console.log(`[Auth] ===== AUTHORIZATION CHECK =====`);
    console.log(`[Auth] Path: ${req.path}`);
    console.log(`[Auth] Method: ${req.method}`);
    console.log(`[Auth] User ID: ${req.user?.id || 'NONE'}`);
    console.log(`[Auth] User Email: ${req.user?.email || 'NONE'}`);
    console.log(`[Auth] User Role: ${req.user?.role || 'NONE'}`);
    console.log(`[Auth] User Permissions:`, req.user?.permissions || 'NONE');
    console.log(`[Auth] Permissions Type:`, typeof req.user?.permissions);
    console.log(`[Auth] Is Array:`, Array.isArray(req.user?.permissions));
    console.log(`[Auth] Required Permissions:`, permissions);
    
    if (req.url && req.url.includes('bulk-import')) {
      console.log('[Auth] Authorization check for bulk import at', new Date().toISOString());
    }
    
    if (!req.user) {
      console.error('[Auth] ERROR: req.user is not set!');
      // Set CORS headers before sending error response
      setCorsHeaders(req, res);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // CRITICAL: Ensure permissions is always an array before checking
    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
      console.warn(`[Auth] WARNING: req.user.permissions is not an array! Fixing...`, {
        permissions: req.user.permissions,
        type: typeof req.user.permissions
      });
      req.user.permissions = [];
    }

    // Check if user is admin (by role or permissions)
    // Admin users should always have access, regardless of permissions array
    // Check multiple variations of admin role (case-insensitive)
    const { ROLES } = require('../utils/roles');
    const roleMatch = req.user.role === ROLES.ADMIN || 
                      req.user.role?.toLowerCase() === 'admin' ||
                      req.user.role === 'Admin' ||
                      req.user.role === 'ADMIN';
    const hasAllPermission = req.user.permissions && req.user.permissions.includes('all');
    const isAdmin = roleMatch || hasAllPermission;
    
    console.log(`[Auth] Admin Check - Role Match: ${roleMatch}, Has All Permission: ${hasAllPermission}, Is Admin: ${isAdmin}`);
    
    if (isAdmin) {
      if (req.url && req.url.includes('bulk-import')) {
        console.log('[Auth] Authorization successful (admin user) for bulk import at', new Date().toISOString());
      }
      console.log(`[Auth] ✅ Admin user ${req.user.email} (role: ${req.user.role}) granted access`);
      console.log(`[Auth] ===== AUTHORIZATION GRANTED =====`);
      return next();
    }
    
    // Map legacy permission names to current permission names for backward compatibility
    const permissionMap = {
      'view_project': 'view_projects', // Legacy singular form -> plural form
      'create_project': 'create_projects',
      'edit_project': 'edit_projects',
      'delete_project': 'delete_projects'
    };
    
    const hasPermission = permissions.some(permission => {
      // Check direct permission
      if (req.user.permissions && req.user.permissions.includes(permission)) {
        return true;
      }
      // Check mapped permission (for backward compatibility)
      const mappedPermission = permissionMap[permission];
      if (mappedPermission && req.user.permissions && req.user.permissions.includes(mappedPermission)) {
        return true;
      }
      return false;
    });

    if (!hasPermission) {
      console.error(`[Auth] ❌ AUTHORIZATION DENIED`);
      console.error(`[Auth] User: ${req.user.email} (${req.user.role})`);
      console.error(`[Auth] User Permissions:`, req.user.permissions);
      console.error(`[Auth] Required Permissions:`, permissions);
      console.error(`[Auth] ===== AUTHORIZATION DENIED =====`);
      // Set CORS headers before sending error response
      setCorsHeaders(req, res);
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to perform this action.',
        code: 'INSUFFICIENT_PERMISSIONS',
        debug: {
          userRole: req.user.role,
          userPermissions: req.user.permissions,
          requiredPermissions: permissions
        }
      });
    }
    
    console.log(`[Auth] ✅ Permission check passed for ${req.user.email}`);
    console.log(`[Auth] ===== AUTHORIZATION GRANTED =====`);

    if (req.url && req.url.includes('bulk-import')) {
      console.log('[Auth] Authorization successful for bulk import at', new Date().toISOString());
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };




