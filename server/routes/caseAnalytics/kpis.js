// Case analytics KPI routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, setNoCacheHeaders, asyncHandler } = require('./utils');

/**
 * Get case analytics KPIs
 * GET /api/case-analytics/kpis
 */
router.get('/kpis', authenticate, asyncHandler(async (req, res) => {
  setNoCacheHeaders(res);
  
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const { startDate, endDate, projectFilter } = req.query;
    
    // Build query with filters
    let query = `SELECT COUNT(Id) totalCases,
                        SUM(CASE WHEN Status = 'Closed' THEN 1 ELSE 0 END) resolvedCases,
                        SUM(CASE WHEN Status != 'Closed' THEN 1 ELSE 0 END) unresolvedCases
                 FROM Case`;
    
    const conditions = [];
    if (startDate) {
      conditions.push(`CreatedDate >= ${startDate}T00:00:00Z`);
    }
    if (endDate) {
      conditions.push(`CreatedDate <= ${endDate}T23:59:59Z`);
    }
    if (projectFilter) {
      conditions.push(`Project__c = '${projectFilter}'`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await conn.query(query);
    
    const kpis = {
      totalCases: result.records[0]?.totalCases || 0,
      resolvedCases: result.records[0]?.resolvedCases || 0,
      unresolvedCases: result.records[0]?.unresolvedCases || 0
    };
    
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching case analytics KPIs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case analytics KPIs',
      message: error.message 
    });
  }
}));

module.exports = router;

