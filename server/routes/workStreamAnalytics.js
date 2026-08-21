const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

// Workstream Health Dashboard
router.get('/health-dashboard', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);

    // Get all workstreams with Project Objective status - use Project Objective status to determine if workstream is active
    const workstreamsQuery = `SELECT Id, Name, Project_Objective__c, Project_Objective__r.Name, 
                                     Project_Objective__r.Status__c, Delivery_Tool_Name__c, 
                                     CreatedDate, LastModifiedDate
                              FROM Project_Workstream__c
                              WHERE Project_Objective__c != null
                              LIMIT 10000`;
    const workstreamsResult = await conn.query(workstreamsQuery);
    const workstreams = workstreamsResult.records || [];

    // Calculate health metrics based on Project Objective status
    // Active statuses: 'Open'
    // Inactive statuses: 'Paused', 'Draft', 'Hidden'
    // Completed statuses: 'Closed'
    const totalWorkstreams = workstreams.length;
    const activeWorkstreams = workstreams.filter(ws => {
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      return objectiveStatus === 'Open';
    }).length;
    
    const inactiveWorkstreams = workstreams.filter(ws => {
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      return objectiveStatus === 'Paused' || objectiveStatus === 'Draft' || objectiveStatus === 'Hidden';
    }).length;
    
    const completedWorkstreams = workstreams.filter(ws => {
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      return objectiveStatus === 'Closed';
    }).length;

    // Health by delivery tool
    const healthByTool = {};
    workstreams.forEach(ws => {
      const tool = ws.Delivery_Tool_Name__c || 'Unknown';
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      
      if (!healthByTool[tool]) {
        healthByTool[tool] = {
          total: 0,
          active: 0,
          inactive: 0,
          completed: 0
        };
      }
      healthByTool[tool].total++;
      
      // Categorize based on Project Objective status
      if (objectiveStatus === 'Open') {
        healthByTool[tool].active++;
      } else if (objectiveStatus === 'Paused' || objectiveStatus === 'Draft' || objectiveStatus === 'Hidden') {
        healthByTool[tool].inactive++;
      } else if (objectiveStatus === 'Closed') {
        healthByTool[tool].completed++;
      } else {
        // If status is null or unknown, count as inactive for safety
        healthByTool[tool].inactive++;
      }
    });

    // Health score calculation (simplified)
    const healthScore = totalWorkstreams > 0 
      ? ((activeWorkstreams / totalWorkstreams) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalWorkstreams,
        activeWorkstreams,
        inactiveWorkstreams,
        completedWorkstreams,
        healthByTool,
        healthScore: parseFloat(healthScore),
        statusDistribution: {
          active: activeWorkstreams,
          inactive: inactiveWorkstreams,
          completed: completedWorkstreams
        }
      }
    });
  } catch (error) {
    console.error('[WorkStream Analytics] Error fetching health dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workstream health dashboard'
    });
  }
}));

// Project Objective Completion Rates
router.get('/completion-rates', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);

    // Get project objectives with their workstreams - use Project Objective Status__c field
    const query = `SELECT Id, Name, Status__c,
                          (SELECT Id, Name FROM Project_Workstreams__r)
                   FROM Project_Objective__c
                   LIMIT 10000`;
    const result = await conn.query(query);
    const objectives = result.records || [];

    const completionData = objectives.map(obj => {
      const workstreams = obj.Project_Workstreams__r?.records || [];
      const totalWorkstreams = workstreams.length;
      const objectiveStatus = obj.Status__c;
      
      // Categorize workstreams based on objective status
      const activeWorkstreams = objectiveStatus === 'Open' ? totalWorkstreams : 0;
      const completedWorkstreams = objectiveStatus === 'Closed' ? totalWorkstreams : 0;
      const completionRate = objectiveStatus === 'Closed' && totalWorkstreams > 0 ? 100 : 0;

      return {
        objectiveId: obj.Id,
        objectiveName: obj.Name,
        objectiveStatus: objectiveStatus || 'Unknown',
        totalWorkstreams,
        completedWorkstreams,
        activeWorkstreams,
        completionRate: parseFloat(completionRate)
      };
    });

    // Overall statistics
    const totalObjectives = objectives.length;
    const objectivesWithWorkstreams = objectives.filter(obj => 
      (obj.Project_Workstreams__r?.records || []).length > 0
    ).length;
    const averageCompletionRate = completionData.length > 0
      ? (completionData.reduce((sum, d) => sum + d.completionRate, 0) / completionData.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        completionData,
        overallStats: {
          totalObjectives,
          objectivesWithWorkstreams,
          averageCompletionRate: parseFloat(averageCompletionRate)
        }
      }
    });
  } catch (error) {
    console.error('[WorkStream Analytics] Error fetching completion rates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch completion rates'
    });
  }
}));

// Delivery Tool Performance Metrics
router.get('/tool-performance', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);

    // Get workstreams grouped by delivery tool - use Project Objective status to determine active/inactive
    const query = `SELECT Id, Name, Delivery_Tool_Name__c, 
                          Project_Objective__c, Project_Objective__r.Name,
                          Project_Objective__r.Status__c, CreatedDate, LastModifiedDate
                   FROM Project_Workstream__c
                   WHERE Delivery_Tool_Name__c != null AND Project_Objective__c != null
                   LIMIT 10000`;
    const result = await conn.query(query);
    const workstreams = result.records || [];

    // Group by delivery tool
    const toolPerformance = {};
    workstreams.forEach(ws => {
      const tool = ws.Delivery_Tool_Name__c;
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      
      if (!toolPerformance[tool]) {
        toolPerformance[tool] = {
          toolName: tool,
          totalWorkstreams: 0,
          activeWorkstreams: 0,
          completedWorkstreams: 0,
          inactiveWorkstreams: 0,
          averageAge: 0,
          completionRate: 0
        };
      }
      toolPerformance[tool].totalWorkstreams++;
      
      // Categorize based on Project Objective status
      if (objectiveStatus === 'Open') {
        toolPerformance[tool].activeWorkstreams++;
      } else if (objectiveStatus === 'Paused' || objectiveStatus === 'Draft' || objectiveStatus === 'Hidden') {
        toolPerformance[tool].inactiveWorkstreams++;
      } else if (objectiveStatus === 'Closed') {
        toolPerformance[tool].completedWorkstreams++;
      } else {
        // If status is null or unknown, count as inactive for safety
        toolPerformance[tool].inactiveWorkstreams++;
      }
    });

    // Calculate metrics for each tool
    Object.keys(toolPerformance).forEach(tool => {
      const perf = toolPerformance[tool];
      // Completion rate not available without completion status field
      perf.completionRate = 0;
      
      // Calculate average age (days since creation)
      const toolWorkstreams = workstreams.filter(ws => ws.Delivery_Tool_Name__c === tool);
      if (toolWorkstreams.length > 0) {
        const now = new Date();
        const totalAge = toolWorkstreams.reduce((sum, ws) => {
          const created = new Date(ws.CreatedDate);
          const age = Math.floor((now - created) / (1000 * 60 * 60 * 24));
          return sum + age;
        }, 0);
        perf.averageAge = (totalAge / toolWorkstreams.length).toFixed(1);
      }
    });

    // Convert to array and sort by total workstreams
    const toolPerformanceArray = Object.values(toolPerformance)
      .map(perf => ({
        ...perf,
        completionRate: parseFloat(perf.completionRate),
        averageAge: parseFloat(perf.averageAge)
      }))
      .sort((a, b) => b.totalWorkstreams - a.totalWorkstreams);

    res.json({
      success: true,
      data: {
        toolPerformance: toolPerformanceArray,
        totalTools: toolPerformanceArray.length
      }
    });
  } catch (error) {
    console.error('[WorkStream Analytics] Error fetching tool performance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tool performance metrics'
    });
  }
}));

// Trend Analysis Over Time
router.get('/trends', authenticate, asyncHandler(async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const conn = await getSalesforceConnection(req.user.id);

    // Get workstreams created/modified in the period - use Project Objective status
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    daysAgo.setHours(0, 0, 0, 0); // Set to midnight for consistent date comparison
    // Format date for SOQL: YYYY-MM-DDTHH:MM:SSZ (dateTime fields should NOT be in quotes)
    const dateStr = daysAgo.toISOString().split('.')[0] + 'Z';

    const query = `SELECT Id, Name, Delivery_Tool_Name__c, Project_Objective__r.Status__c, 
                          CreatedDate, LastModifiedDate
                   FROM Project_Workstream__c
                   WHERE (CreatedDate >= ${dateStr} OR LastModifiedDate >= ${dateStr})
                   AND Project_Objective__c != null
                   LIMIT 10000`;
    const result = await conn.query(query);
    const workstreams = result.records || [];

    // Group by date
    const trendsByDate = {};
    workstreams.forEach(ws => {
      const createdDate = new Date(ws.CreatedDate).toISOString().split('T')[0];
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      
      if (!trendsByDate[createdDate]) {
        trendsByDate[createdDate] = {
          date: createdDate,
          created: 0,
          modified: 0,
          completed: 0,
          active: 0
        };
      }
      trendsByDate[createdDate].created++;
      
      // Count as active only if Project Objective status is 'Open'
      if (objectiveStatus === 'Open') {
        trendsByDate[createdDate].active++;
      }
      
      // Count as completed if Project Objective status is 'Closed'
      if (objectiveStatus === 'Closed') {
        trendsByDate[createdDate].completed++;
      }
    });

    // Also track modifications
    workstreams.forEach(ws => {
      const modifiedDate = new Date(ws.LastModifiedDate).toISOString().split('T')[0];
      if (modifiedDate !== new Date(ws.CreatedDate).toISOString().split('T')[0]) {
        if (!trendsByDate[modifiedDate]) {
          trendsByDate[modifiedDate] = {
            date: modifiedDate,
            created: 0,
            modified: 0,
            completed: 0,
            active: 0
          };
        }
        trendsByDate[modifiedDate].modified++;
      }
    });

    // Convert to array and sort by date (descending - latest first)
    const trendsArray = Object.values(trendsByDate)
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      success: true,
      data: {
        trends: trendsArray,
        period: parseInt(period),
        totalDataPoints: trendsArray.length
      }
    });
  } catch (error) {
    console.error('[WorkStream Analytics] Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trend analysis'
    });
  }
}));

// Comparative Analysis Across Workstreams
router.get('/comparative', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);

    // Get all workstreams with related data - use Project Objective status
    const query = `SELECT Id, Name, Delivery_Tool_Name__c,
                          Project_Objective__c, Project_Objective__r.Name,
                          Project_Objective__r.Status__c, CreatedDate, LastModifiedDate
                   FROM Project_Workstream__c
                   WHERE Project_Objective__c != null
                   LIMIT 10000`;
    const result = await conn.query(query);
    const workstreams = result.records || [];

    // Compare by delivery tool
    const toolComparison = {};
    workstreams.forEach(ws => {
      const tool = ws.Delivery_Tool_Name__c || 'Unknown';
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      
      if (!toolComparison[tool]) {
        toolComparison[tool] = {
          toolName: tool,
          count: 0,
          activeCount: 0,
          completedCount: 0,
          averageAge: 0
        };
      }
      toolComparison[tool].count++;
      
      // Count as active only if Project Objective status is 'Open'
      if (objectiveStatus === 'Open') {
        toolComparison[tool].activeCount++;
      }
      
      // Count as completed if Project Objective status is 'Closed'
      if (objectiveStatus === 'Closed') {
        toolComparison[tool].completedCount++;
      }
    });

    // Calculate average age for each tool
    Object.keys(toolComparison).forEach(tool => {
      const toolWorkstreams = workstreams.filter(ws => 
        (ws.Delivery_Tool_Name__c || 'Unknown') === tool
      );
      if (toolWorkstreams.length > 0) {
        const now = new Date();
        const totalAge = toolWorkstreams.reduce((sum, ws) => {
          const created = new Date(ws.CreatedDate);
          const age = Math.floor((now - created) / (1000 * 60 * 60 * 24));
          return sum + age;
        }, 0);
        toolComparison[tool].averageAge = (totalAge / toolWorkstreams.length).toFixed(1);
      }
    });

    // Compare by project objective
    const objectiveComparison = {};
    workstreams.forEach(ws => {
      const objName = ws.Project_Objective__r?.Name || 'Unknown';
      if (!objectiveComparison[objName]) {
        objectiveComparison[objName] = {
          objectiveName: objName,
          workstreamCount: 0,
          activeCount: 0,
          completedCount: 0
        };
      }
      objectiveComparison[objName].workstreamCount++;
      
      // Count as active only if Project Objective status is 'Open'
      const objectiveStatus = ws.Project_Objective__r?.Status__c;
      if (objectiveStatus === 'Open') {
        objectiveComparison[objName].activeCount++;
      }
      
      // Count as completed if Project Objective status is 'Closed'
      if (objectiveStatus === 'Closed') {
        objectiveComparison[objName].completedCount++;
      }
    });

    res.json({
      success: true,
      data: {
        toolComparison: Object.values(toolComparison).map(t => ({
          ...t,
          averageAge: parseFloat(t.averageAge)
        })),
        objectiveComparison: Object.values(objectiveComparison),
        summary: {
          totalWorkstreams: workstreams.length,
          totalTools: Object.keys(toolComparison).length,
          totalObjectives: Object.keys(objectiveComparison).length
        }
      }
    });
  } catch (error) {
    console.error('[WorkStream Analytics] Error fetching comparative analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch comparative analysis'
    });
  }
}));

// Combined Dashboard Endpoint
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  try {
    // Fetch all analytics in parallel (simplified - in production, you'd want to optimize this)
    const [health, completion, toolPerformance, trends, comparative] = await Promise.all([
      Promise.resolve({ success: true, data: null }).catch(() => ({ success: false, data: null })),
      Promise.resolve({ success: true, data: null }).catch(() => ({ success: false, data: null })),
      Promise.resolve({ success: true, data: null }).catch(() => ({ success: false, data: null })),
      Promise.resolve({ success: true, data: null }).catch(() => ({ success: false, data: null })),
      Promise.resolve({ success: true, data: null }).catch(() => ({ success: false, data: null }))
    ]);

    // For now, return structure - actual implementation would fetch real data
    res.json({
      success: true,
      data: {
        health: health.success ? health.data : null,
        completion: completion.success ? completion.data : null,
        toolPerformance: toolPerformance.success ? toolPerformance.data : null,
        trends: trends.success ? trends.data : null,
        comparative: comparative.success ? comparative.data : null
      },
      message: 'Dashboard data structure ready. Individual endpoints should be called for actual data.'
    });
  } catch (error) {
    console.error('[WorkStream Analytics] Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics dashboard'
    });
  }
}));

module.exports = router;

