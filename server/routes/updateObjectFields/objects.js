// Route handler for GET /objects - returns list of supported objects

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS, ROLES } = require('../../utils/roles');
const { objectNameMap } = require('./utils');

// Custom middleware to allow Reports Manager and legacy permissions
const allowObjectsAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role;

  // Admin has all permissions
  if (userRole === ROLES.ADMIN) {
    return next();
  }

  // Reports Manager and Reports Viewer can access objects for reporting
  if (userRole === ROLES.REPORTS_MANAGER || userRole === ROLES.REPORTS_VIEWER) {
    return next();
  }

  // Check for legacy permissions (for backward compatibility)
  const legacyPermissions = req.user.permissions || [];
  if (legacyPermissions.includes('view_project') || legacyPermissions.includes('all')) {
    return next();
  }

  // Check for new permissions
  const { hasPermission } = require('../../utils/roles');
  if (hasPermission(userRole, PERMISSIONS.VIEW_REPORTS) || 
      hasPermission(userRole, PERMISSIONS.CREATE_REPORTS) ||
      hasPermission(userRole, PERMISSIONS.VIEW_UPDATE_FIELDS)) {
    return next();
  }

  return res.status(403).json({ 
    success: false,
    error: 'Forbidden',
    message: 'Insufficient permissions to access objects list'
  });
};

router.get('/', authenticate, allowObjectsAccess, async (req, res) => {
  try {
    const objects = [
      { value: 'project', label: 'Project' },
      { value: 'project objective', label: 'Project Objective' },
      { value: 'contributor project', label: 'Contributor Project' },
      { value: 'contributor', label: 'Contributor' },
      { value: 'cases', label: 'Cases' }
    ];

    res.json({
      success: true,
      objects: objects
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch objects'
    });
  }
});

module.exports = router;

