// Route handler for GET /fields/:objectType

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS, ROLES } = require('../../utils/roles');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./utils');

// Custom middleware to allow Reports Manager/Viewer and legacy permissions
const allowFieldsAccess = (req, res, next) => {
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

  // Reports Manager and Reports Viewer can access fields for reporting
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
    message: 'Insufficient permissions to access fields'
  });
};

router.get('/fields/:objectType', authenticate, allowFieldsAccess, asyncHandler(async (req, res) => {
  try {
    const { objectType } = req.params;
    const { forReporting } = req.query; // Check if this is for Report Builder (include read-only fields)
    const objectName = objectNameMap[objectType.toLowerCase()];
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}. Valid types are: project, project objective, contributor project, contributor, cases`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject(objectName).describe();

    // Filter fields based on use case:
    // - For Update Object Fields: only include user-updatable fields
    // - For Report Builder: include all readable fields (including read-only/calculated fields)
    const fields = describeResult.fields
      .filter(field => {
        // Always exclude system fields (these are never user-updatable and often not useful in reports)
        if (field.name.startsWith('System') ||
            field.name === 'CreatedById' ||
            field.name === 'LastModifiedById' ||
            field.name === 'OwnerId') {
          return false;
        }
        
        // For Report Builder, include more fields (read-only fields are OK)
        if (forReporting === 'true' || forReporting === true) {
          // Include Id, CreatedDate, LastModifiedDate for reports (useful metadata)
          // Exclude only truly system/internal fields
          if (field.name === 'Id' || field.name === 'CreatedDate' || field.name === 'LastModifiedDate') {
            return true; // Include these for reports
          }
          
          // For reports, include all readable fields (even if not updateable)
          // Only exclude fields that are not accessible at all
          if (field.type === 'base64') {
            return false; // Base64 fields are not useful in reports
          }
          
          // Include all other fields (including calculated, formula, rollup summary, etc.)
          // These are useful for reporting even if not updateable
          return true;
        }
        
        // For Update Object Fields: only include user-updatable fields
        // Exclude system fields
        if (field.name === 'Id' ||
            field.name === 'CreatedDate' ||
            field.name === 'LastModifiedDate') {
          return false;
        }
        
        // Exclude fields that start with "#" (these are rollup summary fields or calculated on save)
        // These fields are typically calculated by Salesforce and cannot be updated
        // The "#" may appear in the label (display name) - check both name and label
        if (field.name.startsWith('#') || 
            (field.label && String(field.label).trim().startsWith('#'))) {
          return false;
        }
        
        // Exclude rollup summary fields (these are calculated from related records on save)
        // Rollup summary fields are read-only and calculated on save
        // Note: aggregatable can be true for other field types too, so only check type
        if (field.type === 'rollupSummary') {
          return false;
        }
        
        // Exclude calculated/formula fields (these are auto-calculated and cannot be updated)
        // These show "This field is calculated" in Salesforce UI
        // Formula fields are calculated on read, not on save, but they're still not updateable
        if (field.calculated === true || field.type === 'calculated') {
          return false;
        }
        
        // Exclude auto-number fields (these are auto-generated)
        // These show "Auto Number" in Salesforce UI
        if (field.autoNumber === true) {
          return false;
        }
        
        // CRITICAL: Only exclude fields that are NOT updateable
        // If a field is updateable, it should be included even if it's not createable
        // Many fields like Status, Description, etc. are updateable but not createable (they have defaults)
        if (!field.updateable) {
          return false;
        }
        
        // Exclude fields that are truly read-only (not createable AND not updateable)
        // This is a redundant check since we already check !field.updateable above, but keeping for clarity
        if (!field.createable && !field.updateable) {
          return false;
        }
        
        // NOTE: We do NOT exclude fields just because they're not createable
        // Fields like Status__c, Description fields, etc. may not be createable (have defaults)
        // but they ARE updateable, so they should be included
        
        // NOTE: We do NOT exclude fields with defaultedOnCreate if they're still updateable
        // A field can have a default value but still be user-updatable
        
        // NOTE: We do NOT exclude fields with writeRequiresMasterRead
        // This property is often set for master-detail relationships, but the field may still be updateable
        // Only exclude if the field is also not updateable (already handled above)
        
        // Include all fields that are updateable (regardless of createable status)
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

        // Add relationship information for lookup/master-detail fields
        if (field.type === 'reference' && field.referenceTo && field.referenceTo.length > 0) {
          const targetObject = field.referenceTo[0];
          const relationshipName = field.relationshipName;
          
          if (relationshipName && targetObject !== '*') {
            fieldData.isRelationship = true;
            fieldData.relationshipType = field.type === 'reference' ? 'lookup' : 'master-detail';
            fieldData.targetObject = targetObject;
            // Build relationship path for querying related fields
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
          
          // Check if field has a defaultValue that represents "None"
          const hasNoneValue = values.some(v => {
            const strValue = String(v || '').trim();
            return strValue === '' || 
                   strValue === '--None--' || 
                   strValue === 'None' || 
                   v === null || 
                   v === undefined ||
                   strValue.toLowerCase() === 'none';
          });

          // For Queue_Status__c field, always include "--None--" if not present
          // For other fields, include "--None--" if nullable and not present
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
      fields: fields
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch fields from Salesforce'
    });
  }
}));

module.exports = router;

