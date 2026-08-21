// Route handler for GET /describe-object/:objectName - describes any Salesforce object

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS, ROLES } = require('../../utils/roles');
const { getSalesforceConnection, asyncHandler } = require('./utils');

// Custom middleware to allow Reports Manager and legacy permissions
const allowDescribeAccess = (req, res, next) => {
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

  // Reports Manager and Reports Viewer can access object descriptions for reporting
  if (userRole === ROLES.REPORTS_MANAGER || userRole === ROLES.REPORTS_VIEWER) {
    return next();
  }

  // Check for legacy permissions
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
    message: 'Insufficient permissions to describe objects'
  });
};

router.get('/describe-object/:objectName', authenticate, allowDescribeAccess, asyncHandler(async (req, res) => {
  try {
    const { objectName } = req.params;
    const { forReporting } = req.query;
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: 'Object name is required'
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject(objectName).describe();

    // Filter fields similar to fields.js
    const fields = describeResult.fields
      .filter(field => {
        // Always exclude system fields
        if (field.name.startsWith('System') ||
            field.name === 'CreatedById' ||
            field.name === 'LastModifiedById' ||
            field.name === 'OwnerId') {
          return false;
        }
        
        // For Report Builder, include more fields
        if (forReporting === 'true' || forReporting === true) {
          if (field.name === 'Id' || field.name === 'CreatedDate' || field.name === 'LastModifiedDate') {
            return true;
          }
          if (field.type === 'base64') {
            return false;
          }
          return true;
        }
        
        // For Update Object Fields: only include user-updatable fields
        if (field.name === 'Id' ||
            field.name === 'CreatedDate' ||
            field.name === 'LastModifiedDate') {
          return false;
        }
        if (field.name.startsWith('#') || 
            (field.label && String(field.label).trim().startsWith('#'))) {
          return false;
        }
        if (field.type === 'rollupSummary') {
          return false;
        }
        if (field.calculated === true || field.type === 'calculated') {
          return false;
        }
        if (field.autoNumber === true) {
          return false;
        }
        if (!field.updateable) {
          return false;
        }
        if (!field.createable && !field.updateable) {
          return false;
        }
        return true;
      })
      .map(field => {
        const fieldData = {
          name: field.name,
          label: field.label,
          type: field.type,
          required: !field.nullable && !field.defaultedOnCreate,
          referenceTo: field.referenceTo && field.referenceTo.length > 0 ? field.referenceTo[0] : null,
          relationshipName: field.relationshipName || null,
          nullable: field.nullable,
          updateable: field.updateable,
          createable: field.createable
        };

        // Add relationship information
        if (field.type === 'reference' && field.referenceTo && field.referenceTo.length > 0) {
          const targetObject = field.referenceTo[0];
          const relationshipName = field.relationshipName;
          
          if (relationshipName && targetObject !== '*') {
            fieldData.isRelationship = true;
            fieldData.relationshipType = field.type === 'reference' ? 'lookup' : 'master-detail';
            fieldData.targetObject = targetObject;
            fieldData.relationshipPath = relationshipName.endsWith('__r') 
              ? relationshipName 
              : `${relationshipName}__r`;
          }
        }

        // Add picklist values
        fieldData.picklistValues = field.picklistValues ? (() => {
          let values = field.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          
          const hasNoneValue = values.some(v => {
            const strValue = String(v || '').trim();
            return strValue === '' || 
                   strValue === '--None--' || 
                   strValue === 'None' || 
                   v === null || 
                   v === undefined ||
                   strValue.toLowerCase() === 'none';
          });
          
          if (!hasNoneValue) {
            if (field.name === 'Queue_Status__c') {
              values.unshift('--None--');
            } else if (field.nullable) {
              values.unshift('--None--');
            }
          }
          
          return values;
        })() : null;
        
        fieldData.restrictedPicklist = field.restrictedPicklist || false;
        
        return fieldData;
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    res.json({
      success: true,
      objectName: objectName,
      fields: fields
    });
  } catch (error) {
    console.error('Error describing object:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to describe object'
    });
  }
}));

module.exports = router;



