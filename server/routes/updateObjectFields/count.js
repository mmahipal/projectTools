// Route handler for POST /count/:objectType and POST /count

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./utils');

// Handle both /count/:objectType (URL param) and /count (body param)
const handleCount = asyncHandler(async (req, res) => {
  try {
    // Support both URL parameter and body parameter for objectType
    const objectType = req.params.objectType || req.body.objectType;
    
    // Extract filters - if objectType is in URL, filters are in req.body.filters or req.body
    // If objectType is in body, filters might be in req.body.filters or the rest of req.body
    let filters = req.body.filters;
    if (!filters && req.body) {
      // If no filters property, use req.body but exclude objectType if it's there
      filters = { ...req.body };
      if (filters.objectType) {
        delete filters.objectType;
      }
      // Only use as filters if there are actual filter properties
      if (Object.keys(filters).length === 0) {
        filters = null;
      }
    }

    if (!objectType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: objectType'
      });
    }

    const objectName = objectNameMap[objectType.toLowerCase()];
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    
    // Build SOQL query with filters (same logic as update endpoint)
    let query = `SELECT COUNT() FROM ${objectName}`;
    const whereConditions = [];
    
    // Add filter conditions (same as update endpoint)
    if (filters) {
      if (objectType.toLowerCase() === 'project objective') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          whereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'contributor project') {
        if (filters.projectId) {
          whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.projectObjectiveId) {
          // Try common field names for Project Objective lookup
          try {
            const describeResult = await conn.sobject('Contributor_Project__c').describe();
            const projectObjectiveField = describeResult.fields.find(f => 
              f.type === 'reference' && 
              (f.name === 'Project_Objective__c' || 
               f.name === 'ProjectObjective__c' || 
               f.name === 'Objective__c' ||
               f.relationshipName === 'Project_Objective__r')
            );
            
            if (projectObjectiveField) {
              whereConditions.push(`${projectObjectiveField.name} = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
            } else {
              whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
            }
          } catch (describeError) {
            console.error('Error describing Contributor_Project__c to find Project Objective field:', describeError);
            whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
          }
        }
        if (filters.status && filters.status !== '') {
          whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.queueStatus && filters.queueStatus !== '') {
          whereConditions.push(`Queue_Status__c = '${String(filters.queueStatus).replace(/'/g, "''")}'`);
        }
      }
      
      if (objectType.toLowerCase() === 'project') {
        if (filters.projectId) {
          whereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
        }
        if (filters.status && filters.status !== '') {
          const statusField = 'Status__c';
          whereConditions.push(`${statusField} = '${String(filters.status).replace(/'/g, "''")}'`);
        }
        if (filters.type && filters.type !== '') {
          const typeField = 'Type__c';
          whereConditions.push(`${typeField} = '${String(filters.type).replace(/'/g, "''")}'`);
        }
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    console.log('Count query:', query);

    const queryResult = await conn.query(query);
    const count = queryResult.totalSize || 0;

    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error counting records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to count records'
    });
  }
});

// Register both route patterns
router.post('/count/:objectType', authenticate, authorize('view_project', 'all'), handleCount);
router.post('/count', authenticate, authorize('view_project', 'all'), handleCount);

module.exports = router;

