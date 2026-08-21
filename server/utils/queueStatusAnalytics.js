/**
 * Queue Status Analytics Utilities
 * Provides analytics functions for queue status metrics
 */

/**
 * Calculate time-in-queue metrics
 * @param {Array} projects - Array of projects with queue status
 * @param {Object} statusDates - Map of projectId to status change date
 * @returns {Object} Metrics by status
 */
const calculateTimeInQueue = (projects, statusDates) => {
  const metrics = {
    'Calibration Queue': { count: 0, totalDays: 0, averageDays: 0, minDays: Infinity, maxDays: 0 },
    'Production Queue': { count: 0, totalDays: 0, averageDays: 0, minDays: Infinity, maxDays: 0 },
    'Test Queue': { count: 0, totalDays: 0, averageDays: 0, minDays: Infinity, maxDays: 0 },
    '--None--': { count: 0, totalDays: 0, averageDays: 0, minDays: Infinity, maxDays: 0 }
  };

  const now = new Date();

  projects.forEach(project => {
    const status = project.queueStatus || '--None--';
    const statusDate = statusDates[project.id] ? new Date(statusDates[project.id]) : null;

    if (!statusDate) {
      metrics[status].count++;
      return;
    }

    const daysInQueue = Math.floor((now - statusDate) / (1000 * 60 * 60 * 24));
    
    metrics[status].count++;
    metrics[status].totalDays += daysInQueue;
    metrics[status].minDays = Math.min(metrics[status].minDays, daysInQueue);
    metrics[status].maxDays = Math.max(metrics[status].maxDays, daysInQueue);
  });

  // Calculate averages
  Object.keys(metrics).forEach(status => {
    if (metrics[status].count > 0) {
      metrics[status].averageDays = Math.round((metrics[status].totalDays / metrics[status].count) * 10) / 10;
    } else {
      metrics[status].averageDays = 0;
      metrics[status].minDays = 0;
      metrics[status].maxDays = 0;
    }
  });

  return metrics;
};

/**
 * Get projects by queue status
 * @param {Array} projects - Array of projects
 * @returns {Object} Projects grouped by status
 */
const getProjectsByStatus = (projects) => {
  const grouped = {
    'Calibration Queue': [],
    'Production Queue': [],
    'Test Queue': [],
    '--None--': []
  };

  projects.forEach(project => {
    const status = project.queueStatus || '--None--';
    if (grouped[status]) {
      grouped[status].push(project);
    } else {
      grouped['--None--'].push(project);
    }
  });

  return grouped;
};

/**
 * Calculate status change frequency
 * @param {Array} statusHistory - Array of status change records
 * @param {Date} startDate - Start date for analysis
 * @param {Date} endDate - End date for analysis
 * @returns {Object} Frequency metrics
 */
const calculateStatusChangeFrequency = (statusHistory, startDate, endDate) => {
  const frequency = {
    totalChanges: 0,
    byStatus: {},
    byDay: {},
    transitions: {}
  };

  if (!statusHistory || statusHistory.length === 0) {
    return frequency;
  }

  const filtered = statusHistory.filter(record => {
    const recordDate = new Date(record.date || record.createdDate);
    return (!startDate || recordDate >= startDate) && (!endDate || recordDate <= endDate);
  });

  filtered.forEach(record => {
    frequency.totalChanges++;

    // Count by status
    const toStatus = record.toStatus || record.newStatus || '--None--';
    frequency.byStatus[toStatus] = (frequency.byStatus[toStatus] || 0) + 1;

    // Count by day
    const dateKey = new Date(record.date || record.createdDate).toISOString().split('T')[0];
    frequency.byDay[dateKey] = (frequency.byDay[dateKey] || 0) + 1;

    // Count transitions
    const fromStatus = record.fromStatus || record.oldStatus || '--None--';
    const transitionKey = `${fromStatus} -> ${toStatus}`;
    frequency.transitions[transitionKey] = (frequency.transitions[transitionKey] || 0) + 1;
  });

  return frequency;
};

/**
 * Generate dashboard data
 * @param {Array} projects - Array of projects
 * @param {Object} statusDates - Map of projectId to status change date
 * @param {Array} statusHistory - Array of status change history
 * @param {Number} totalCount - Total count of all projects (if available)
 * @returns {Object} Dashboard data
 */
const generateDashboardData = (projects, statusDates, statusHistory = [], totalCount = null) => {
  const projectsByStatus = getProjectsByStatus(projects);
  const timeInQueue = calculateTimeInQueue(projects, statusDates);
  
  // Calculate status change frequency for last 30 days (simplified - no history for now)
  const changeFrequency = {
    totalChanges: 0,
    byStatus: {},
    topTransitions: []
  };

  // Use totalCount if provided, otherwise use projects.length
  const total = totalCount !== null && totalCount !== undefined ? totalCount : projects.length;

  return {
    projectsByStatus: {
      'Calibration Queue': projectsByStatus['Calibration Queue'].length,
      'Production Queue': projectsByStatus['Production Queue'].length,
      'Test Queue': projectsByStatus['Test Queue'].length,
      '--None--': projectsByStatus['--None--'].length,
      total: total
    },
    timeInQueue,
    changeFrequency
  };
};

module.exports = {
  calculateTimeInQueue,
  getProjectsByStatus,
  calculateStatusChangeFrequency,
  generateDashboardData
};

