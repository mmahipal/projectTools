// Route handler for GET /filter-options/:objectType

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { PERMISSIONS, ROLES } = require('../../utils/roles');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./utils');

// Custom middleware to allow Reports Manager/Viewer and legacy permissions
const allowFilterOptionsAccess = (req, res, next) => {
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

  // Reports Manager and Reports Viewer can access filter options for reporting
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
    message: 'Insufficient permissions to access filter options'
  });
};

router.get('/filter-options/:objectType', authenticate, allowFilterOptionsAccess, asyncHandler(async (req, res) => {
  try {
    const { objectType } = req.params;
    const objectName = objectNameMap[objectType.toLowerCase()];
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    const filterOptions = {};

    // For Project Objective and Contributor Project, get list of Projects
    if (objectType.toLowerCase() === 'project objective' || objectType.toLowerCase() === 'contributor project') {
      try {
        const projectQuery = `SELECT Id, Name FROM Project__c ORDER BY Name LIMIT 1000`;
        const projectResult = await conn.query(projectQuery);
        filterOptions.projects = (projectResult.records || []).map(p => ({
          id: p.Id,
          name: p.Name
        }));
      } catch (error) {
        console.error('Error fetching projects:', error);
        filterOptions.projects = [];
      }
    }

    // For Contributor Project, get Status, Queue Status, and Project Objectives
    if (objectType.toLowerCase() === 'contributor project') {
      try {
        const describeResult = await conn.sobject('Contributor_Project__c').describe();
        
        // Get Status picklist values
        const statusField = describeResult.fields.find(f => f.name === 'Status__c');
        if (statusField && statusField.picklistValues) {
          let statuses = statusField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          
          // Check if "--None--" exists, if not and field is nullable, add it
          const hasNoneValue = statuses.some(v => 
            v === '' || 
            v === '--None--' || 
            v === 'None' || 
            v === null || 
            v === undefined
          );
          
          if (!hasNoneValue && statusField.nullable) {
            statuses.unshift('--None--');
          }
          
          filterOptions.statuses = statuses;
        }

        // Get Queue Status picklist values
        const queueStatusField = describeResult.fields.find(f => f.name === 'Queue_Status__c');
        if (queueStatusField) {
          let queueStatuses = [];
          
          if (queueStatusField.picklistValues && queueStatusField.picklistValues.length > 0) {
            queueStatuses = queueStatusField.picklistValues
              .filter(pv => pv.active !== false)
              .map(pv => pv.value);
          }
          
          // Always check if "--None--" exists, if not, add it (Queue Status should always have None option)
          const hasNoneValue = queueStatuses.some(v => 
            v === '' || 
            v === '--None--' || 
            v === 'None' || 
            v === null || 
            v === undefined ||
            String(v).toLowerCase() === 'none' ||
            String(v).trim() === '--None--'
          );
          
          if (!hasNoneValue) {
            queueStatuses.unshift('--None--');
          }
          
          filterOptions.queueStatuses = queueStatuses;
        }

        // Get Project Objectives for filter
        // Always fetch Project Objectives for Contributor Project filter
        try {
          const projectObjectiveQuery = `SELECT Id, Name FROM Project_Objective__c ORDER BY Name LIMIT 1000`;
          const projectObjectiveResult = await conn.query(projectObjectiveQuery);
          filterOptions.projectObjectives = (projectObjectiveResult.records || []).map(po => ({
            id: po.Id,
            name: po.Name
          }));
        } catch (error) {
          console.error('Error fetching Project Objectives:', error);
          filterOptions.projectObjectives = [];
        }
      } catch (error) {
        console.error('Error fetching Contributor Project field options:', error);
      }
    }

    // For Project, get Status and Type options
    if (objectType.toLowerCase() === 'project') {
      try {
        const describeResult = await conn.sobject('Project__c').describe();
        
        // Get Status picklist values
        const statusField = describeResult.fields.find(f => f.name === 'Status__c' || f.name === 'Project_Status__c');
        if (statusField && statusField.picklistValues) {
          let statuses = statusField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          
          // Check if "--None--" exists, if not and field is nullable, add it
          const hasNoneValue = statuses.some(v => 
            v === '' || 
            v === '--None--' || 
            v === 'None' || 
            v === null || 
            v === undefined
          );
          
          if (!hasNoneValue && statusField.nullable) {
            statuses.unshift('--None--');
          }
          
          filterOptions.statuses = statuses;
        }

        // Get Type picklist values
        const typeField = describeResult.fields.find(f => f.name === 'Type__c' || f.name === 'Project_Type__c');
        if (typeField && typeField.picklistValues) {
          let types = typeField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          
          // Check if "--None--" exists, if not and field is nullable, add it
          const hasNoneValue = types.some(v => 
            v === '' || 
            v === '--None--' || 
            v === 'None' || 
            v === null || 
            v === undefined
          );
          
          if (!hasNoneValue && typeField.nullable) {
            types.unshift('--None--');
          }
          
          filterOptions.types = types;
        }
      } catch (error) {
        console.error('Error fetching Project field options:', error);
      }
    }

    // For Contributor (Contact), get Account options and Status if available
    if (objectType.toLowerCase() === 'contributor') {
      try {
        // Get Accounts for Account lookup filter
        try {
          const accountQuery = `SELECT Id, Name FROM Account ORDER BY Name LIMIT 1000`;
          const accountResult = await conn.query(accountQuery);
          filterOptions.accounts = (accountResult.records || []).map(a => ({
            id: a.Id,
            name: a.Name
          }));
        } catch (error) {
          console.error('Error fetching Accounts:', error);
          filterOptions.accounts = [];
        }

        // Get Status picklist values if available
        const describeResult = await conn.sobject('Contact').describe();
        const statusField = describeResult.fields.find(f => 
          f.name === 'Status__c' || 
          f.name === 'Contributor_Status__c' || 
          f.name === 'Contact_Status__c'
        );
        if (statusField && statusField.picklistValues) {
          let statuses = statusField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          
          const hasNoneValue = statuses.some(v => 
            v === '' || 
            v === '--None--' || 
            v === 'None' || 
            v === null || 
            v === undefined
          );
          
          if (!hasNoneValue && statusField.nullable) {
            statuses.unshift('--None--');
          }
          
          filterOptions.statuses = statuses;
        }
      } catch (error) {
        console.error('Error fetching Contributor field options:', error);
      }
    }

    // For Cases, get Status, Type, Priority, Contact, and Account options
    if (objectType.toLowerCase() === 'cases') {
      try {
        const describeResult = await conn.sobject('Case').describe();
        
        // Get Status picklist values
        const statusField = describeResult.fields.find(f => f.name === 'Status');
        if (statusField && statusField.picklistValues) {
          let statuses = statusField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          filterOptions.statuses = statuses;
        }

        // Get Type picklist values
        const typeField = describeResult.fields.find(f => f.name === 'Type');
        if (typeField && typeField.picklistValues) {
          let types = typeField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          filterOptions.types = types;
        }

        // Get Priority picklist values
        const priorityField = describeResult.fields.find(f => f.name === 'Priority');
        if (priorityField && priorityField.picklistValues) {
          let priorities = priorityField.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => pv.value);
          filterOptions.priorities = priorities;
        }

        // Get Contacts for Contact lookup filter
        try {
          const contactQuery = `SELECT Id, Name FROM Contact ORDER BY Name LIMIT 1000`;
          const contactResult = await conn.query(contactQuery);
          filterOptions.contacts = (contactResult.records || []).map(c => ({
            id: c.Id,
            name: c.Name
          }));
        } catch (error) {
          console.error('Error fetching Contacts:', error);
          filterOptions.contacts = [];
        }

        // Get Accounts for Account lookup filter
        try {
          const accountQuery = `SELECT Id, Name FROM Account ORDER BY Name LIMIT 1000`;
          const accountResult = await conn.query(accountQuery);
          filterOptions.accounts = (accountResult.records || []).map(a => ({
            id: a.Id,
            name: a.Name
          }));
        } catch (error) {
          console.error('Error fetching Accounts:', error);
          filterOptions.accounts = [];
        }
      } catch (error) {
        console.error('Error fetching Cases field options:', error);
      }
    }

    res.json({
      success: true,
      filterOptions: filterOptions
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch filter options'
    });
  }
}));

module.exports = router;

