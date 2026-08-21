// Route handlers for GET /projects and GET /project-objectives

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, asyncHandler } = require('./utils');

// Get all projects for filter dropdown
router.get('/projects', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    
    // Query all projects - increase limit to get more results
    const query = `SELECT Id, Name FROM Project__c ORDER BY Name LIMIT 10000`;
    const result = await conn.query(query);
    
    const projects = (result.records || []).map(p => ({
      id: p.Id,
      name: p.Name
    }));
    
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch projects from Salesforce'
    });
  }
}));

// Get all project objectives for filter dropdown
router.get('/project-objectives', authenticate, asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.query;
    const conn = await getSalesforceConnection(req.user.id);
    
    let query = `SELECT Id, Name FROM Project_Objective__c`;
    
    // If projectId is provided, filter by project
    if (projectId) {
      query += ` WHERE Project__c = '${String(projectId).replace(/'/g, "''")}'`;
    }
    
    query += ` ORDER BY Name LIMIT 10000`;
    
    const result = await conn.query(query);
    
    const projectObjectives = (result.records || []).map(po => ({
      id: po.Id,
      name: po.Name
    }));
    
    res.json({
      success: true,
      projectObjectives: projectObjectives
    });
  } catch (error) {
    console.error('Error fetching project objectives:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project objectives from Salesforce'
    });
  }
}));

module.exports = router;






