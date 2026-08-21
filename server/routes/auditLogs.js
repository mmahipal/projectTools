const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAuditLogs } = require('../utils/auditLogger');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// GET audit logs with optional filters
router.get('/', authenticate, authorize('all'), asyncHandler(async (req, res) => {
  try {
    const filters = {
      user: req.query.user || null,
      action: req.query.action || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      objectType: req.query.objectType || null,
      sortOrder: req.query.sortOrder || 'desc' // 'asc' or 'desc'
    };
    
    const logs = getAuditLogs(filters);
    
    res.json({
      success: true,
      logs: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
}));

module.exports = router;

