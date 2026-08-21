/**
 * Role-Based Access Control Middleware
 * Extends the existing authorize middleware with role-based checks
 */

const { ROLES, PERMISSIONS, hasPermission, canAccessRoute } = require('../utils/roles');
const { setCorsHeaders } = require('./auth');

/**
 * Middleware to check if user has a specific role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      setCorsHeaders(req, res);
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Normalize role to lowercase for comparison (handle case sensitivity issues)
    const userRole = req.user.role ? req.user.role.toLowerCase().trim() : null;
    
    // Check if user has 'all' permission (admin or equivalent)
    const hasAllPermission = req.user.permissions && (
      req.user.permissions.includes('all') || 
      req.user.permissions.includes(PERMISSIONS.ALL)
    );

    // Admin or users with 'all' permission have access to everything
    if (userRole === ROLES.ADMIN || hasAllPermission) {
      return next();
    }

    // Check if user has one of the allowed roles (case-insensitive)
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase().trim());
    if (!normalizedAllowedRoles.includes(userRole)) {
      setCorsHeaders(req, res);
      return res.status(403).json({ 
        success: false,
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific permission
 * This is role-aware and checks permissions based on role
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      setCorsHeaders(req, res);
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Normalize role to lowercase for comparison (handle case sensitivity issues)
    const userRole = req.user.role ? req.user.role.toLowerCase().trim() : null;
    
    // Check if user has 'all' permission (admin or equivalent)
    const hasAllPermission = req.user.permissions && (
      req.user.permissions.includes('all') || 
      req.user.permissions.includes(PERMISSIONS.ALL)
    );

    // Admin or users with 'all' permission have all permissions
    if (userRole === ROLES.ADMIN || hasAllPermission) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasRequiredPermission = requiredPermissions.some(permission => 
      hasPermission(userRole, permission)
    );

    if (!hasRequiredPermission) {
      setCorsHeaders(req, res);
      return res.status(403).json({ 
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check route access based on role
 */
const requireRouteAccess = (req, res, next) => {
  if (!req.user) {
    setCorsHeaders(req, res);
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Normalize role to lowercase for comparison (handle case sensitivity issues)
  const userRole = req.user.role ? req.user.role.toLowerCase().trim() : null;
  const route = req.path;
  
  // Check if user has 'all' permission (admin or equivalent)
  const hasAllPermission = req.user.permissions && (
    req.user.permissions.includes('all') || 
    req.user.permissions.includes(PERMISSIONS.ALL)
  );

  // Admin or users with 'all' permission can access everything
  if (userRole === ROLES.ADMIN || hasAllPermission) {
    return next();
  }

  // Check if user can access this route
  if (!canAccessRoute(userRole, route)) {
    setCorsHeaders(req, res);
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  }

  next();
};

/**
 * Helper to check if user can access a feature (for use in route handlers)
 */
const checkFeatureAccess = (userRole, feature) => {
  const { canAccessFeature } = require('../utils/roles');
  return canAccessFeature(userRole, feature);
};

module.exports = {
  requireRole,
  requirePermission,
  requireRouteAccess,
  checkFeatureAccess
};

