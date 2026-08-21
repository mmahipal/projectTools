const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/roles');
const fs = require('fs');
const path = require('path');
// Note: For production, consider using node-cron for proper cron expression support

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper to get scheduled reports file path
const getScheduledReportsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'scheduled-reports.json');
};

// Load scheduled reports
const loadScheduledReports = () => {
  const filePath = getScheduledReportsPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Scheduled Reports] Error loading:', error);
    return [];
  }
};

// Save scheduled reports
const saveScheduledReports = (reports) => {
  const filePath = getScheduledReportsPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Scheduled Reports] Error saving:', error);
    return false;
  }
};

// Create scheduled report
router.post('/', authenticate, requirePermission(PERMISSIONS.SCHEDULE_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { name, objectType, fields, filters, schedule, format, recipients } = req.body;

    if (!name || !objectType || !schedule) {
      return res.status(400).json({
        success: false,
        error: 'Name, object type, and schedule are required'
      });
    }

    const reports = loadScheduledReports();
    const newReport = {
      id: `scheduled_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      objectType,
      fields: fields || [],
      filters: filters || {},
      schedule,
      format: format || 'excel',
      recipients: recipients || [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: null,
      nextRunAt: calculateNextRun(schedule)
    };

    reports.push(newReport);
    saveScheduledReports(reports);

    res.json({
      success: true,
      report: newReport
    });
  } catch (error) {
    console.error('[Scheduled Reports] Error creating:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create scheduled report'
    });
  }
}));

// Get all scheduled reports
router.get('/', authenticate, requirePermission(PERMISSIONS.VIEW_REPORTS), asyncHandler(async (req, res) => {
  try {
    const reports = loadScheduledReports();
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('[Scheduled Reports] Error fetching:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch scheduled reports'
    });
  }
}));

// Update scheduled report
router.put('/:id', authenticate, requirePermission(PERMISSIONS.SCHEDULE_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const reports = loadScheduledReports();
    const index = reports.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      nextRunAt: updates.schedule ? calculateNextRun(updates.schedule) : reports[index].nextRunAt
    };

    saveScheduledReports(reports);

    res.json({
      success: true,
      report: reports[index]
    });
  } catch (error) {
    console.error('[Scheduled Reports] Error updating:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update scheduled report'
    });
  }
}));

// Delete scheduled report
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.SCHEDULE_REPORTS), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const reports = loadScheduledReports();
    const filtered = reports.filter(r => r.id !== id);

    if (filtered.length === reports.length) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    saveScheduledReports(filtered);

    res.json({
      success: true,
      message: 'Scheduled report deleted'
    });
  } catch (error) {
    console.error('[Scheduled Reports] Error deleting:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete scheduled report'
    });
  }
}));

// Calculate next run time from schedule
const calculateNextRun = (schedule) => {
  // schedule format: "daily", "weekly", "monthly", or cron expression
  // Simplified - in production, use proper cron parsing
  const now = new Date();
  if (schedule === 'daily') {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
    return next.toISOString();
  } else if (schedule === 'weekly') {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(9, 0, 0, 0);
    return next.toISOString();
  } else if (schedule === 'monthly') {
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    next.setHours(9, 0, 0, 0);
    return next.toISOString();
  }
  return null;
};

module.exports = router;

