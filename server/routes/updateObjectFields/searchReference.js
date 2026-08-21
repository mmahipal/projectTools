// Route handler for GET /search-reference/:objectName

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { PERMISSIONS, ROLES } = require('../../utils/roles');
const { getSalesforceConnection, asyncHandler } = require('./utils');

// Custom middleware to allow Reports Manager/Viewer and legacy permissions
const allowSearchReferenceAccess = (req, res, next) => {
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

  // Reports Manager and Reports Viewer can access search reference for reporting
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
    message: 'Insufficient permissions to access search reference'
  });
};

router.get('/search-reference/:objectName', authenticate, allowSearchReferenceAccess, asyncHandler(async (req, res) => {
  try {
    const { objectName } = req.params;
    const { search } = req.query;

    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: 'Object name is required'
      });
    }

    if (!search || search.trim() === '') {
      return res.json({
        success: true,
        records: []
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    
    // Validate and sanitize search term
    const { validateAndSanitizeSearchTerm } = require('../../utils/security');
    const sanitizedSearch = validateAndSanitizeSearchTerm(search);
    if (!sanitizedSearch) {
      return res.json({
        success: true,
        records: []
      });
    }
    
    // Try to describe the object to find the Name field
    let nameField = 'Name';
    try {
      const describeResult = await conn.sobject(objectName).describe();
      // Check if Name field exists
      const nameFieldExists = describeResult.fields.some(f => f.name === 'Name');
      if (!nameFieldExists) {
        // Try to find a common name field
        const commonNameFields = ['Name', 'Title', 'Subject', 'Label'];
        for (const fieldName of commonNameFields) {
          if (describeResult.fields.some(f => f.name === fieldName)) {
            nameField = fieldName;
            break;
          }
        }
      }
    } catch (describeError) {
      console.error('Error describing object:', describeError);
      // Continue with default 'Name' field
    }

    // Build query - search by Name field
    const query = `SELECT Id, ${nameField} FROM ${objectName} WHERE ${nameField} LIKE '%${sanitizedSearch}%' ORDER BY ${nameField} LIMIT 50`;
    
    console.log('Reference search query:', query);
    
    const result = await conn.query(query);
    
    const records = result.records.map(record => ({
      id: record.Id,
      name: record[nameField] || record.Name || 'Unknown'
    }));

    res.json({
      success: true,
      records: records
    });
  } catch (error) {
    console.error('Error searching reference records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search reference records'
    });
  }
}));

module.exports = router;

