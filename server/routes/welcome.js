const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');

// Get users file path
const getUsersPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'users.json');
};

// Get history file path
const getHistoryPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'history.json');
};

// Get projects file path
const getProjectsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'projects.json');
};

// Load data from file
const loadData = (filePath, defaultValue = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
  }
  return defaultValue;
};

// Get welcome page statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const historyPath = getHistoryPath();
    const history = loadData(historyPath, []);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Calculate metrics
    const totalPublishes = history.length;
    const todayPublishes = history.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= today;
    }).length;
    
    const recentPublishes = history.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= sevenDaysAgo;
    }).length;
    
    // Calculate success rate
    const successfulPublishes = history.filter(item => 
      item.status === 'success' || item.status === 'completed' || !item.error
    ).length;
    const successRate = totalPublishes > 0 
      ? Math.round((successfulPublishes / totalPublishes) * 100 * 10) / 10 
      : 100;
    
    // Calculate trends (compare last 7 days with previous 7 days)
    const fourteenDaysAgo = new Date(sevenDaysAgo);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);
    
    const previousWeekPublishes = history.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= fourteenDaysAgo && itemDate < sevenDaysAgo;
    }).length;
    
    const recentTrend = previousWeekPublishes > 0
      ? Math.round(((recentPublishes - previousWeekPublishes) / previousWeekPublishes) * 100)
      : recentPublishes > 0 ? 100 : 0;
    
    // Today trend (compare with yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayPublishes = history.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= yesterday && itemDate < today;
    }).length;
    
    const todayTrend = yesterdayPublishes > 0
      ? todayPublishes - yesterdayPublishes
      : todayPublishes;
    
    // Get user info
    const usersPath = getUsersPath();
    const users = loadData(usersPath, []);
    const currentUser = users.find(u => u.id === req.user.id || u.email === req.user.email);
    
    res.json({
      metrics: {
        totalPublishes,
        todayPublishes,
        recentPublishes,
        successRate
      },
      trends: {
        totalPublishes: { value: Math.abs(recentTrend), direction: recentTrend >= 0 ? 'up' : 'down' },
        todayPublishes: { value: Math.abs(todayTrend), direction: todayTrend >= 0 ? 'up' : 'down' },
        recentPublishes: { value: Math.abs(recentTrend), direction: recentTrend >= 0 ? 'up' : 'down' },
        successRate: { value: 0, direction: 'up' } // Can be enhanced with historical comparison
      },
      user: {
        name: currentUser?.name || currentUser?.email || 'User',
        email: currentUser?.email || req.user.email,
        lastLogin: currentUser?.lastLogin || new Date().toISOString(),
        role: currentUser?.role || req.user.role
      }
    });
  } catch (error) {
    console.error('Error fetching welcome stats:', error);
    res.status(500).json({ error: 'Failed to fetch welcome statistics' });
  }
});

// Get recent activity
router.get('/activity', authenticate, async (req, res) => {
  try {
    const historyPath = getHistoryPath();
    const history = loadData(historyPath, []);
    
    // Get last 10 activities, sorted by timestamp
    const activities = history
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(item => {
        const operation = item.operation || 'published';
        const objectType = item.objectType || item.type || 'item';
        const objectName = item.objectName || item.name || item.id || 'Unknown';
        
        let description = '';
        if (operation === 'create') {
          description = `Created ${objectType} "${objectName}"`;
        } else if (operation === 'update') {
          description = `Updated ${objectType} "${objectName}"`;
        } else {
          description = `Published ${objectType} "${objectName}" to Salesforce`;
        }
        
        return {
          id: item.id || `${item.timestamp}-${Math.random()}`,
          type: operation,
          description,
          user: item.user || item.createdBy || item.email || 'Unknown',
          timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
          link: item.salesforceId ? `/project-detail/${item.id}` : null,
          status: item.status || (item.error ? 'error' : 'success')
        };
      });
    
    res.json({
      activities,
      total: activities.length
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get system status
router.get('/system-status', authenticate, async (req, res) => {
  try {
    const salesforceRoutes = require('./salesforce');
    
    // Check Salesforce connection (simplified check)
    let salesforceStatus = 'unknown';
    let salesforceResponseTime = null;
    
    try {
      const startTime = Date.now();
      // Try to get Salesforce settings to check connection
      const settingsPath = path.join(__dirname, '../data/salesforce-settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = loadData(settingsPath, {});
        // Check for salesforceUrl or loginUrl, and username (can be encrypted)
        const hasUrl = !!(settings.salesforceUrl || settings.loginUrl);
        const hasUsername = !!settings.username;
        const hasPassword = !!settings.password;
        const hasSecurityToken = !!settings.securityToken;
        
        if (hasUrl && hasUsername && hasPassword && hasSecurityToken) {
          salesforceStatus = 'connected';
        } else {
          salesforceStatus = 'not_configured';
        }
      } else {
        salesforceStatus = 'not_configured';
      }
      salesforceResponseTime = Date.now() - startTime;
    } catch (error) {
      console.error('Error checking Salesforce status:', error);
      salesforceStatus = 'error';
    }
    
    // Check queue scheduler status
    // Check if schedule rules exist (indicates scheduler is configured)
    const scheduleRulesPath = path.join(__dirname, '../data/queue-status-schedule-rules.json');
    const queueStatusPath = path.join(__dirname, '../data/queue-status-execution-history.json');
    let queueSchedulerStatus = 'unknown';
    let lastQueueRun = null;
    
    // Debug logging
    const rulesPathResolved = path.resolve(scheduleRulesPath);
    const rulesExists = fs.existsSync(scheduleRulesPath) || fs.existsSync(rulesPathResolved);
    console.log('[Queue Scheduler Status] Checking paths:', {
      rulesPath: scheduleRulesPath,
      rulesPathResolved: rulesPathResolved,
      rulesExists: rulesExists,
      historyPath: queueStatusPath,
      historyExists: fs.existsSync(queueStatusPath),
      __dirname: __dirname
    });
    
    // Check if scheduler is configured (has rules file OR execution history)
    // Scheduler is considered configured if rules file exists (even if empty, since scheduler service is running)
    // OR if execution history exists (meaning it has run before)
    // Try both relative and absolute paths
    const rulesFileExists = fs.existsSync(scheduleRulesPath) || fs.existsSync(rulesPathResolved);
    if (rulesFileExists) {
      const scheduleRules = loadData(scheduleRulesPath, []);
      // Check if there are any enabled rules
      const hasEnabledRules = scheduleRules.length > 0 && scheduleRules.some(rule => rule.enabled === true);
      
      if (hasEnabledRules) {
        // Check execution history to see if it's running
        if (fs.existsSync(queueStatusPath)) {
          const queueHistory = loadData(queueStatusPath, []);
          if (queueHistory.length > 0) {
            const lastRun = queueHistory[queueHistory.length - 1];
            lastQueueRun = lastRun.timestamp || lastRun.executedAt || lastRun.executionTime;
            queueSchedulerStatus = 'running';
          } else {
            queueSchedulerStatus = 'configured'; // Configured but not run yet
          }
        } else {
          queueSchedulerStatus = 'configured'; // Configured but not run yet
        }
      } else {
        // Rules file exists (even if empty) - scheduler service is running, so it's configured
        // Check execution history for last run
        if (fs.existsSync(queueStatusPath)) {
          const queueHistory = loadData(queueStatusPath, []);
          if (queueHistory.length > 0) {
            const lastRun = queueHistory[queueHistory.length - 1];
            lastQueueRun = lastRun.timestamp || lastRun.executedAt || lastRun.executionTime;
            queueSchedulerStatus = 'running';
          } else {
            queueSchedulerStatus = 'configured'; // Scheduler service is running, just no rules enabled yet
          }
        } else {
          queueSchedulerStatus = 'configured'; // Scheduler service is running, just no rules enabled yet
        }
      }
    } else if (fs.existsSync(queueStatusPath)) {
      // Execution history exists but no rules file - scheduler was configured before
      const queueHistory = loadData(queueStatusPath, []);
      if (queueHistory.length > 0) {
        const lastRun = queueHistory[queueHistory.length - 1];
        lastQueueRun = lastRun.timestamp || lastRun.executedAt || lastRun.executionTime;
        queueSchedulerStatus = 'running';
      } else {
        queueSchedulerStatus = 'configured';
      }
    } else {
      // Create the rules file to mark scheduler as configured (scheduler service is running)
      try {
        fs.writeFileSync(scheduleRulesPath, JSON.stringify([], null, 2), 'utf8');
        queueSchedulerStatus = 'configured';
      } catch (error) {
        console.error('Error creating queue scheduler rules file:', error);
        queueSchedulerStatus = 'not_configured';
      }
    }
    
    res.json({
      status: {
        salesforce: {
          status: salesforceStatus,
          lastCheck: new Date().toISOString(),
          responseTime: salesforceResponseTime
        },
        backend: {
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        },
        queueScheduler: {
          status: queueSchedulerStatus,
          lastRun: lastQueueRun,
          nextRun: null // Can be calculated if scheduler provides this
        },
        database: {
          status: 'operational',
          lastBackup: null // Can be enhanced with actual backup tracking
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// Get recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const recommendations = [];
    
    // Role-based recommendations
    if (user.role === 'admin' || user.permissions?.includes('all')) {
      recommendations.push({
        id: '1',
        type: 'feature',
        title: 'Manage Users and Permissions',
        description: 'Configure user access and role-based permissions',
        link: '/user-management',
        priority: 'high'
      });
      recommendations.push({
        id: '2',
        type: 'feature',
        title: 'Review System Settings',
        description: 'Check application and Salesforce configuration',
        link: '/settings',
        priority: 'medium'
      });
    }
    
    if (user.role === 'salesforce_manager' || user.permissions?.includes('all')) {
      recommendations.push({
        id: '3',
        type: 'feature',
        title: 'View Project Performance',
        description: 'Track your project metrics and KPIs',
        link: '/project-performance',
        priority: 'high'
      });
      recommendations.push({
        id: '4',
        type: 'feature',
        title: 'Check Contributor Payments',
        description: 'Review recent contributor payment updates',
        link: '/contributor-payments',
        priority: 'medium'
      });
    }
    
    // Activity-based recommendations
    const historyPath = getHistoryPath();
    const history = loadData(historyPath, []);
    const userHistory = history.filter(item => 
      item.user === user.email || item.createdBy === user.email
    );
    
    if (userHistory.length === 0) {
      recommendations.push({
        id: '5',
        type: 'action',
        title: 'Create Your First Project',
        description: 'Get started by creating a new project',
        link: '/setup',
        priority: 'high'
      });
    } else {
      recommendations.push({
        id: '6',
        type: 'feature',
        title: 'View Your Project History',
        description: 'Review all your published projects',
        link: '/history',
        priority: 'medium'
      });
    }
    
    res.json({
      recommendations: recommendations.slice(0, 5) // Limit to 5 recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;

