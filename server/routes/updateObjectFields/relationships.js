// Route handler for GET /relationships/:objectType - returns available relationships

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS, ROLES } = require('../../utils/roles');
const { objectNameMap, getSalesforceConnection, asyncHandler } = require('./utils');

// Custom middleware to allow Reports Manager and legacy permissions
const allowRelationshipsAccess = (req, res, next) => {
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

  // Reports Manager and Reports Viewer can access relationships for reporting
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
    message: 'Insufficient permissions to access relationships'
  });
};

/**
 * Discover relationships for an object (non-recursive for performance)
 * Only discovers direct relationships to avoid timeout issues
 * @param {Object} conn - Salesforce connection
 * @param {String} objectName - Salesforce object API name
 * @returns {Array} Array of relationship objects
 */
const discoverRelationships = async (conn, objectName) => {
  const relationships = [];

  try {
    const describeResult = await conn.sobject(objectName).describe();
    
    // Discover child relationships (for subquery support)
    // Child relationships are stored in describeResult.childRelationships
    const childRelationships = [];
    if (describeResult.childRelationships && describeResult.childRelationships.length > 0) {
      for (const childRel of describeResult.childRelationships) {
        // childRel.relationshipName is the name to use in subqueries (e.g., "Cases", "Contacts", "Project_Objectives__r")
        // childRel.childSObject is the child object API name
        if (childRel.relationshipName && childRel.childSObject) {
          childRelationships.push({
            fieldName: childRel.field || null,
            fieldLabel: childRel.label || childRel.relationshipName,
            relationshipName: childRel.relationshipName, // This is what we use in subqueries
            targetObject: childRel.childSObject,
            relationshipType: 'child',
            isMasterDetail: childRel.deprecatedAndHidden === false && childRel.cascadeDelete === true,
            depth: 0,
            isSubquery: true, // Mark as subquery relationship
            nestedRelationships: [] // Will be populated on demand if needed
          });
        }
      }
    }
    
    // Process all fields to find parent relationships (lookup/master-detail)
    // Only get direct relationships to avoid timeout
    for (const field of describeResult.fields) {
      // Check if field is a lookup or master-detail relationship
      if (field.type === 'reference' && field.referenceTo && field.referenceTo.length > 0) {
        const targetObject = field.referenceTo[0];
        const relationshipName = field.relationshipName;
        
        // Skip polymorphic relationships (e.g., WhatId, WhoId)
        if (!relationshipName || targetObject === '*') {
          continue;
        }

        // Build relationship path
        const relationshipPath = relationshipName.endsWith('__r') 
          ? relationshipName 
          : `${relationshipName}__r`;

        const relationship = {
          fieldName: field.name,
          fieldLabel: field.label,
          relationshipName: relationshipPath,
          targetObject: targetObject,
          relationshipType: field.type === 'reference' ? (field.relationshipName ? 'lookup' : 'reference') : 'master-detail',
          isMasterDetail: field.type === 'reference' && field.relationshipName && field.relationshipName.includes('__r'),
          depth: 0,
          nullable: field.nullable,
          nestedRelationships: [] // Will be populated on demand if needed (lazy loading)
        };

        relationships.push(relationship);
      }
    }

    // Add standard relationships for standard objects
    if (objectName === 'Case') {
      relationships.push({
        fieldName: 'ContactId',
        fieldLabel: 'Contact',
        relationshipName: 'Contact',
        targetObject: 'Contact',
        relationshipType: 'standard',
        isMasterDetail: false,
        depth: 0,
        nullable: true,
        nestedRelationships: []
      });
      relationships.push({
        fieldName: 'AccountId',
        fieldLabel: 'Account',
        relationshipName: 'Account',
        targetObject: 'Account',
        relationshipType: 'standard',
        isMasterDetail: false,
        depth: 0,
        nullable: true,
        nestedRelationships: []
      });
    }

    if (objectName === 'Contact') {
      relationships.push({
        fieldName: 'AccountId',
        fieldLabel: 'Account',
        relationshipName: 'Account',
        targetObject: 'Account',
        relationshipType: 'standard',
        isMasterDetail: false,
        depth: 0,
        nullable: true,
        nestedRelationships: []
      });
    }

    // Add child relationships to the relationships array
    // These are for subqueries (e.g., SELECT Id, (SELECT Name FROM Cases) FROM Account)
    relationships.push(...childRelationships);

  } catch (error) {
    console.error(`Error discovering relationships for ${objectName}:`, error);
    // Return empty array on error rather than throwing
  }

  return relationships;
};

router.get('/relationships/:objectType', authenticate, allowRelationshipsAccess, asyncHandler(async (req, res) => {
  try {
    const { objectType } = req.params;
    const objectName = objectNameMap[objectType.toLowerCase()];
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    console.log(`[Relationships] Starting relationship discovery for ${objectName}...`);
    const startTime = Date.now();
    
    const conn = await getSalesforceConnection(req.user.id);
    const relationships = await discoverRelationships(conn, objectName);
    
    const duration = Date.now() - startTime;
    console.log(`[Relationships] Discovered ${relationships.length} relationships in ${duration}ms`);

    res.json({
      success: true,
      objectType: objectType,
      objectName: objectName,
      relationships: relationships
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch relationships'
    });
  }
}));

module.exports = router;

