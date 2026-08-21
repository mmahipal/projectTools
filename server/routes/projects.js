const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Async error wrapper - catches errors from async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to safely serialize objects to JSON
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    if (typeof value === 'function') {
      return undefined;
    }
    if (value === undefined) {
      return undefined;
    }
    return value;
  });
};

// Get projects file path
const getProjectsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'projects.json');
};

// Helper function to load users (for counting application users in stats)
const loadUsers = () => {
  try {
    const usersPath = path.join(__dirname, '../data/users.json');
    if (fs.existsSync(usersPath)) {
      const fileContent = fs.readFileSync(usersPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading users from file:', error);
  }
  return [];
};

// Load projects from file
const loadProjects = () => {
  try {
    const projectsPath = getProjectsPath();
    if (fs.existsSync(projectsPath)) {
      const fileContent = fs.readFileSync(projectsPath, 'utf8');
      const projects = JSON.parse(fileContent);
      console.log(`Loaded ${projects.length} projects from persistent storage`);
      return projects;
    }
  } catch (error) {
    console.error('Error loading projects from file:', error);
  }
  return [];
};

// Save projects to file
const saveProjects = (projectsArray) => {
  try {
    const projectsPath = getProjectsPath();
    
    // Clean the data to avoid circular references and ensure valid JSON
    const cleanedProjects = projectsArray.map(project => {
      const cleaned = {};
      // Only copy serializable properties
      Object.keys(project).forEach(key => {
        const value = project[key];
        // Skip functions
        if (typeof value === 'function') {
          return;
        }
        // Skip undefined
        if (value === undefined) {
          return;
        }
        // Skip circular references (check if it's an object that might be circular)
        if (typeof value === 'object' && value !== null) {
          try {
            // Try to serialize to check for circular references
            JSON.stringify(value);
            cleaned[key] = value;
          } catch (e) {
            // If circular reference, skip it
            console.warn(`Skipping circular reference in field: ${key}`);
          }
        } else {
          // Primitive values are safe
          cleaned[key] = value;
        }
      });
      return cleaned;
    });
    
    // Validate JSON before writing
    const jsonData = JSON.stringify(cleanedProjects, null, 2);
    JSON.parse(jsonData); // Validate it's valid JSON
    
    // Write to file atomically
    const tempPath = projectsPath + '.tmp';
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, projectsPath);
    
    console.log(`Saved ${projectsArray.length} projects to persistent storage`);
  } catch (error) {
    console.error('Error saving projects to file:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

// Initialize projects array from persistent storage
let projects = loadProjects();

// Get dashboard statistics
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  try {
    // Reload projects from disk to get latest data
    console.log('=== FETCHING DASHBOARD STATS ===');
    const currentProjects = loadProjects();
    console.log('Total projects loaded from disk:', currentProjects.length);
    
    // Load history to get all publishes
    const { loadHistory } = require('../utils/historyLogger');
    const history = loadHistory();
    
    // Also migrate existing published items from old data files
    // Load project objectives and qualification steps directly
    const loadProjectObjectives = () => {
      try {
        const objectivesPath = path.join(__dirname, '../data/projectObjectives.json');
        if (fs.existsSync(objectivesPath)) {
          const fileContent = fs.readFileSync(objectivesPath, 'utf8');
          const objectives = JSON.parse(fileContent);
          return Array.isArray(objectives) ? objectives : [];
        }
      } catch (error) {
        console.error('Error loading project objectives:', error);
      }
      return [];
    };
    
    const loadQualificationSteps = () => {
      try {
        const stepsPath = path.join(__dirname, '../data/qualificationSteps.json');
        if (fs.existsSync(stepsPath)) {
          const fileContent = fs.readFileSync(stepsPath, 'utf8');
          return JSON.parse(fileContent);
        }
      } catch (error) {
        console.error('Error loading qualification steps:', error);
      }
      return [];
    };
    
    const projectObjectives = loadProjectObjectives();
    const qualificationSteps = loadQualificationSteps();
    
    // Get existing history IDs to avoid duplicates
    const existingHistoryIds = new Set(history.map(h => h.salesforceId).filter(Boolean));
    
    // Migrate published items to history format for stats calculation
    const migratedProjects = currentProjects
      .filter(p => p.salesforceSyncStatus === 'synced' && p.salesforceId && !existingHistoryIds.has(p.salesforceId))
      .map(p => ({
        operation: 'create',
        objectType: 'Project',
        salesforceId: p.salesforceId,
        publisher: p.createdBy || p.updatedBy || 'Unknown',
        publishedAt: p.salesforceSyncedAt || p.updatedAt || p.createdAt,
        status: 'success',
        recordCount: 1
      }));
    
    const migratedObjectives = projectObjectives
      .filter(po => po.salesforceSyncStatus === 'synced' && po.salesforceId && !existingHistoryIds.has(po.salesforceId))
      .map(po => ({
        operation: 'create',
        objectType: 'Project Objective',
        salesforceId: po.salesforceId,
        publisher: po.createdBy || po.updatedBy || 'Unknown',
        publishedAt: po.salesforceSyncedAt || po.updatedAt || po.createdAt,
        status: 'success',
        recordCount: 1
      }));
    
    // Combine all history for stats
    const allHistory = [...history, ...migratedProjects, ...migratedObjectives];
    
    // Ensure projects is an array
    if (!Array.isArray(currentProjects)) {
      console.error('Projects is not an array:', typeof currentProjects);
        return res.json({
        totalProjects: 0,
        openProjects: 0,
        pendingTasks: 0,
        publishedProjects: 0,
        notPublishedProjects: 0
      });
    }

    const totalProjects = currentProjects.length;
    console.log('Total projects:', totalProjects);
    
    // Count open projects - projects with status 'Open'
    const openProjects = currentProjects.filter(p => {
      try {
        const status = (p?.projectStatus || p?.status || 'draft').toLowerCase().trim();
        return status === 'open';
      } catch (error) {
        console.warn('Error filtering open projects:', error);
        return false;
      }
    }).length;
    
    // Count draft projects (projects with status 'draft' or 'pending')
    // Check both status and projectStatus fields
    const pendingTasks = currentProjects.filter(p => {
      try {
        const status = (p?.projectStatus || p?.status || 'draft').toLowerCase().trim();
        return status === 'draft' || status === 'pending';
      } catch (error) {
        console.warn('Error filtering pending tasks:', error);
        return false;
      }
    }).length;

    // Calculate published items from ALL history (all publishes to Salesforce)
    // Count all successful publishes from history - this includes ALL object types (Projects, Project Objectives, Client Tool Accounts, Queue Status updates, WorkStreams, etc.)
    const totalPublishes = allHistory
      .filter(h => h.status === 'success')
      .reduce((sum, h) => sum + (h.recordCount || 1), 0);
    
    // For "Synced to Salesforce" metric, show ALL publishes (all object types)
    const publishedProjects = totalPublishes;
    
    // For "Not Synced", calculate based on local projects only
    const syncedLocalProjects = currentProjects.filter(p => p?.salesforceSyncStatus === 'synced').length;
    const notPublishedProjects = Math.max(0, totalProjects - syncedLocalProjects);
    
    // All publishes per user (from history - includes all object types)
    const projectsByUser = {};
    allHistory.forEach(historyItem => {
      if (historyItem.status === 'success') {
        const user = historyItem.publisher || 'Unknown';
        if (!projectsByUser[user]) {
          projectsByUser[user] = { total: 0, published: 0 };
        }
        // Count all publishes (creates, updates, etc.)
        const count = historyItem.recordCount || 1;
        projectsByUser[user].total += count;
        projectsByUser[user].published += count;
      }
    });
    
    // Also include local projects for total count
    currentProjects.forEach(project => {
      const user = project.createdBy || project.updatedBy || 'Unknown';
      if (!projectsByUser[user]) {
        projectsByUser[user] = { total: 0, published: 0 };
      }
      projectsByUser[user].total++;
      if (project?.salesforceSyncStatus === 'synced') {
        projectsByUser[user].published++;
      }
    });
    
    // All publishes by date (last 30 days) - from history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const projectsByDate = {};
    allHistory.forEach(historyItem => {
      if (historyItem.status === 'success' && historyItem.publishedAt) {
        const dateObj = new Date(historyItem.publishedAt);
        if (dateObj >= thirtyDaysAgo) {
          const dateKey = dateObj.toISOString().split('T')[0];
          if (!projectsByDate[dateKey]) {
            projectsByDate[dateKey] = { total: 0, published: 0 };
          }
          const count = historyItem.recordCount || 1;
          projectsByDate[dateKey].total += count;
          projectsByDate[dateKey].published += count;
        }
      }
    });
    
    // Also include local projects for date analytics
    currentProjects.forEach(project => {
      const date = project.salesforceSyncedAt || project.createdAt || project.updatedAt;
      if (date) {
        const dateObj = new Date(date);
        if (dateObj >= thirtyDaysAgo) {
          const dateKey = dateObj.toISOString().split('T')[0];
          if (!projectsByDate[dateKey]) {
            projectsByDate[dateKey] = { total: 0, published: 0 };
          }
          projectsByDate[dateKey].total++;
          if (project?.salesforceSyncStatus === 'synced') {
            projectsByDate[dateKey].published++;
          }
        }
      }
    });
    
    // Calculate additional analytics from history
    // Publishes by object type
    const publishesByObjectType = {};
    allHistory.forEach(h => {
      if (h.status === 'success') {
        const objType = h.objectType || 'Unknown';
        publishesByObjectType[objType] = (publishesByObjectType[objType] || 0) + (h.recordCount || 1);
      }
    });
    
    // Publishes by operation type
    const publishesByOperation = {};
    allHistory.forEach(h => {
      if (h.status === 'success') {
        const op = h.operation || 'unknown';
        publishesByOperation[op] = (publishesByOperation[op] || 0) + (h.recordCount || 1);
      }
    });
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPublishes = allHistory.filter(h => {
      if (h.status === 'success' && h.publishedAt) {
        const dateObj = new Date(h.publishedAt);
        return dateObj >= sevenDaysAgo;
      }
      return false;
    }).reduce((sum, h) => sum + (h.recordCount || 1), 0);
    
    // Today's publishes - use local date for user-friendly "today"
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayPublishes = allHistory.filter(h => {
      if (h.status === 'success' && h.publishedAt) {
        const dateObj = new Date(h.publishedAt);
        // Check if the date is within today's range (local time)
        return dateObj >= today && dateObj <= todayEnd;
      }
      return false;
    }).reduce((sum, h) => sum + (h.recordCount || 1), 0);
    
    // Debug logging for today's publishes
    console.log('Today\'s publishes debug:', {
      todayLocal: today.toISOString(),
      todayEndLocal: todayEnd.toISOString(),
      now: now.toISOString(),
      count: todayPublishes,
      totalHistoryItems: allHistory.length,
      successfulItems: allHistory.filter(h => h.status === 'success').length,
      itemsWithPublishedAt: allHistory.filter(h => h.publishedAt).length,
      sampleItems: allHistory
        .filter(h => h.status === 'success' && h.publishedAt)
        .slice(0, 5)
        .map(h => ({
          objectType: h.objectType,
          name: h.name,
          publishedAt: h.publishedAt,
          publishedAtDate: new Date(h.publishedAt).toISOString(),
          recordCount: h.recordCount || 1,
          isToday: (() => {
            const dateObj = new Date(h.publishedAt);
            return dateObj >= today && dateObj <= todayEnd;
          })()
        }))
    });
    
    // Success rate
    const totalOperations = allHistory.length;
    const successfulOperations = allHistory.filter(h => h.status === 'success').length;
    const successRate = totalOperations > 0 ? Math.round((successfulOperations / totalOperations) * 100) : 100;
    
    // Activity by day (last 30 days) - for better chart
    // Use local time for thirtyDaysAgo to match user's timezone
    const thirtyDaysAgoLocal = new Date();
    thirtyDaysAgoLocal.setDate(thirtyDaysAgoLocal.getDate() - 30);
    thirtyDaysAgoLocal.setHours(0, 0, 0, 0);
    
    const activityByDay = {};
    allHistory.forEach(historyItem => {
      if (historyItem.status === 'success' && historyItem.publishedAt) {
        const dateObj = new Date(historyItem.publishedAt);
        if (dateObj >= thirtyDaysAgoLocal) {
          // Use local date for dateKey to match user's timezone
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          if (!activityByDay[dateKey]) {
            activityByDay[dateKey] = {
              date: dateKey,
              creates: 0,
              updates: 0,
              total: 0
            };
          }
          const count = historyItem.recordCount || 1;
          
          // Count by operation type
          if (historyItem.operation === 'create') {
            activityByDay[dateKey].creates += count;
          } else if (historyItem.operation === 'update') {
            activityByDay[dateKey].updates += count;
          }
          // Note: total will be calculated after the loop
        }
      }
    });
    
    // Calculate total as sum of creates + updates for each day
    Object.keys(activityByDay).forEach(dateKey => {
      activityByDay[dateKey].total = activityByDay[dateKey].creates + activityByDay[dateKey].updates;
    });
    
    const statsResult = {
      // Summary metrics
      totalProjects,
      openProjects,
      totalPublishes, // All successful publishes
      todayPublishes, // Today's publishes
      recentPublishes, // Last 7 days
      successRate, // Success rate percentage
      
      // Analytics data
      projectsByUser,
      projectsByDate,
      publishesByObjectType,
      publishesByOperation,
      activityByDay: Object.values(activityByDay).sort((a, b) => new Date(a.date) - new Date(b.date))
    };
    
    console.log('Dashboard stats calculated:', {
      totalProjects,
      openProjects,
      totalPublishes,
      todayPublishes,
      recentPublishes,
      successRate,
      usersCount: Object.keys(projectsByUser).length,
      datesCount: Object.keys(projectsByDate).length,
      historyItems: allHistory.length
    });
    console.log('=== END FETCHING DASHBOARD STATS ===');
    
    res.json(statsResult);
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Return default stats on error instead of throwing
    res.json({
      totalProjects: 0,
      openProjects: 0,
      pendingTasks: 0,
      publishedProjects: 0,
      notPublishedProjects: 0
    });
  }
}));

// Get all projects
router.get('/', authenticate, (req, res) => {
  res.json(projects);
});

// Get field definitions endpoint - MUST be before /:id route
const fieldDefinitions = require('../config/fieldDefinitions');

router.get('/field-definitions', authenticate, (req, res) => {
  try {
    // Flatten field definitions into a single array with section info
    const allFields = [];
    
    Object.keys(fieldDefinitions).forEach(sectionKey => {
      const sectionFields = fieldDefinitions[sectionKey];
      Object.keys(sectionFields).forEach(fieldKey => {
        const field = sectionFields[fieldKey];
        allFields.push({
          key: fieldKey,
          label: field.label,
          description: field.description,
          type: field.type,
          required: field.required || false,
          section: field.section || sectionKey,
          sectionKey: sectionKey,
          options: field.options || null,
          example: field.example || null,
          default: field.default || null
        });
      });
    });
    
    res.json({
      success: true,
      fields: allFields,
      sections: Object.keys(fieldDefinitions)
    });
  } catch (error) {
    console.error('Error fetching field definitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch field definitions'
    });
  }
});

// Get project by ID
router.get('/:id', authenticate, (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Check sync status for a project
router.get('/:id/sync-status', authenticate, (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json({
    id: project.id,
    projectName: project.projectName || project.name,
    salesforceSyncStatus: project.salesforceSyncStatus || 'pending',
    salesforceId: project.salesforceId || null,
    salesforceObjectType: project.salesforceObjectType || null,
    salesforceSyncedAt: project.salesforceSyncedAt || null,
    salesforceSyncError: project.salesforceSyncError || null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  });
});

// Retry sync for a pending or failed project
router.post('/:id/retry-sync', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Check if Salesforce settings are configured
  const fs = require('fs');
  const path = require('path');
  const settingsPath = path.join(__dirname, '../data/salesforce-settings.json');
  
  if (!fs.existsSync(settingsPath)) {
    return res.status(400).json({ 
      error: 'Salesforce settings not configured. Please configure Salesforce settings first.' 
    });
  }

  // Mark as pending and trigger sync
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex !== -1) {
    projects[projectIndex].salesforceSyncStatus = 'pending';
    projects[projectIndex].salesforceSyncError = null;
    saveProjects(projects);
  }

  // Prepare project data for sync (exclude internal fields)
  const projectDataForSync = { ...project };
  delete projectDataForSync.id;
  delete projectDataForSync.createdAt;
  delete projectDataForSync.createdBy;
  delete projectDataForSync.updatedAt;
  delete projectDataForSync.updatedBy;
  delete projectDataForSync.salesforceId;
  delete projectDataForSync.salesforceSyncStatus;
  delete projectDataForSync.salesforceObjectType;
  delete projectDataForSync.salesforceSyncedAt;
  delete projectDataForSync.salesforceSyncError;
  
  const projectIdForRetry = req.params.id;
  
  // Set keep-alive headers to prevent connection timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=300, max=1000');
  
  // Run sync directly (synchronous) - wait for completion before responding
  try {
    // Ensure required fields are present before syncing
    if (!projectDataForSync.contributorProjectName || projectDataForSync.contributorProjectName.trim() === '') {
      projectDataForSync.contributorProjectName = projectDataForSync.projectName || projectDataForSync.name || 'New Project';
    }
    // Note: projectType will be validated and corrected by the Salesforce endpoint
    // if it's an invalid picklist value, it will be set to a valid default
    
    console.log(`[Retry Sync] Attempting to sync project ${projectIdForRetry} to Salesforce`);
    console.log(`[Retry Sync] Project data keys: ${Object.keys(projectDataForSync).length}`);
    console.log(`[Retry Sync] Project Type: ${projectDataForSync.projectType}`);
    console.log(`[Retry Sync] Contributor Project Name: ${projectDataForSync.contributorProjectName}`);
    
    // Call Salesforce function directly (no HTTP call - avoids server restart issues)
    const salesforceModule = require('./salesforce');
    const createProjectInSalesforce = salesforceModule.createProjectInSalesforce;
    
    if (!createProjectInSalesforce || typeof createProjectInSalesforce !== 'function') {
      throw new Error('createProjectInSalesforce function not found or not a function');
    }
    
    console.log(`[Retry Sync] Calling createProjectInSalesforce function directly for project: ${projectIdForRetry}`);
    console.log(`[Retry Sync] Project data keys: ${Object.keys(projectDataForSync).length}`);
    
    let salesforceResult;
    
    try {
      salesforceResult = await createProjectInSalesforce(projectDataForSync, req.user);
      
      console.log(`[Retry Sync] Salesforce response received for project: ${projectIdForRetry}`);
      console.log(`[Retry Sync] Response success: ${salesforceResult?.success}`);
      console.log(`[Retry Sync] Salesforce ID: ${salesforceResult?.salesforceId}`);
    } catch (sfError) {
      console.error(`[Retry Sync] ❌ Salesforce function error:`, sfError.message);
      console.error(`[Retry Sync] Error stack:`, sfError.stack);
      
      // Re-throw to be caught by outer catch block
      throw sfError;
    }

    if (salesforceResult && salesforceResult.success) {
      console.log(`[Retry Sync] ✅ Sync successful for project: ${projectIdForRetry}`);
      console.log(`[Retry Sync] Salesforce ID: ${salesforceResult.salesforceId}`);
      const projectIndex = projects.findIndex(p => p.id === projectIdForRetry);
      if (projectIndex !== -1) {
        projects[projectIndex].salesforceId = salesforceResult.salesforceId;
        projects[projectIndex].salesforceSyncStatus = 'synced';
        projects[projectIndex].salesforceObjectType = salesforceResult.objectType;
        projects[projectIndex].salesforceSyncedAt = new Date().toISOString();
        projects[projectIndex].salesforceSyncError = null;
        saveProjects(projects);
        console.log(`[Retry Sync] ✅ Project ${projectIdForRetry} status updated to 'synced'`);
      } else {
        console.error(`[Retry Sync] ❌ Project ${projectIdForRetry} not found in projects array`);
      }
      
      // Ensure response is sent immediately
      if (!res.headersSent) {
        res.json({ 
          message: 'Sync completed successfully.',
          projectId: req.params.id,
          salesforceId: salesforceResult.salesforceId,
          salesforceSyncStatus: 'synced'
        });
      } else {
        console.warn(`[Retry Sync] ⚠️ Response already sent for project: ${projectIdForRetry}`);
      }
    } else {
      console.error(`[Retry Sync] ❌ Sync failed for project: ${projectIdForRetry}`);
      const projectIndex = projects.findIndex(p => p.id === projectIdForRetry);
      if (projectIndex !== -1) {
        projects[projectIndex].salesforceSyncStatus = 'failed';
        projects[projectIndex].salesforceSyncError = 'Salesforce sync returned success=false';
        saveProjects(projects);
        console.log(`[Retry Sync] ✅ Project ${projectIdForRetry} status updated to 'failed'`);
      }
      
      // Ensure response is sent immediately
      if (!res.headersSent) {
        res.status(400).json({ 
          message: 'Sync failed.',
          projectId: req.params.id,
          error: 'Salesforce sync returned success=false',
          salesforceSyncStatus: 'failed'
        });
      } else {
        console.warn(`[Retry Sync] ⚠️ Response already sent for project: ${projectIdForRetry}`);
      }
    }
  } catch (error) {
    console.error(`[Retry Sync] ❌ Error syncing project ${projectIdForRetry}:`, error.message);
    console.error(`[Retry Sync] Error stack:`, error.stack);
    console.error(`[Retry Sync] Error details:`, error.response?.data || error.message);
    
    const projectIndex = projects.findIndex(p => p.id === projectIdForRetry);
    if (projectIndex !== -1) {
      projects[projectIndex].salesforceSyncStatus = 'failed';
      projects[projectIndex].salesforceSyncError = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown Salesforce error';
      try {
        saveProjects(projects);
        console.log(`[Retry Sync] ✅ Project ${projectIdForRetry} status updated to 'failed'`);
      } catch (saveError) {
        console.error(`[Retry Sync] ❌ Error saving project status:`, saveError.message);
      }
    }
    
    // Ensure response is sent immediately - CRITICAL: Always send response
    if (!res.headersSent) {
      try {
        res.status(500).json({ 
          message: 'Sync error occurred.',
          projectId: req.params.id,
          error: error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown Salesforce error',
          salesforceSyncStatus: 'failed'
        });
        console.log(`[Retry Sync] ✅ Error response sent for project: ${projectIdForRetry}`);
      } catch (responseError) {
        console.error(`[Retry Sync] ❌ Error sending error response:`, responseError.message);
      }
    } else {
      console.warn(`[Retry Sync] ⚠️ Response already sent for project: ${projectIdForRetry}`);
    }
  }
}));

// Create project (Phase 2 - with Salesforce integration)
router.post('/', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  let newProject = null;
  
  try {
    console.log('=== CREATE PROJECT REQUEST START ===');
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Request body size:', JSON.stringify(req.body || {}).length);
    
    const projectData = req.body;
    
    // Validate project data
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('Invalid project data');
    }
    
    // Clean the project data to avoid issues
    const cleanedProjectData = { ...projectData };
    // Remove any functions or circular references
    Object.keys(cleanedProjectData).forEach(key => {
      if (typeof cleanedProjectData[key] === 'function') {
        delete cleanedProjectData[key];
      }
    });
    
    // First, store locally
    newProject = {
      id: `PROJ-${Date.now()}`,
      ...cleanedProjectData,
      createdAt: new Date().toISOString(),
      createdBy: req.user.email,
      status: 'draft',
      salesforceId: null,
      salesforceSyncStatus: 'pending'
    };

    projects.push(newProject);
    
    try {
      console.log('Attempting to save project to file...');
      saveProjects(projects); // Save to persistent storage
      console.log('Project saved successfully to file');
    } catch (saveError) {
      console.error('Error saving project to file:', saveError);
      console.error('Save error stack:', saveError.stack);
      // If save fails, remove from array and throw error
      projects.pop();
      throw new Error(`Failed to save project: ${saveError.message}`);
    }

    if (!newProject) {
      throw new Error('Failed to create project');
    }

    // Try to create in Salesforce if configured
    // Run sync directly (synchronous) - wait for completion before sending response
    const projectIdToSync = newProject.id; // Capture project ID
    
    // Check if Salesforce settings are configured before attempting sync
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/salesforce-settings.json');
    
    // Capture request context before background task
    const authToken = req.headers.authorization;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const salesforceUrl = `${baseUrl}/api/salesforce/create-project`;
    
    // Try to sync to Salesforce directly (synchronous)
    // This will wait for the sync to complete before sending the response
    try {
      console.log(`[Direct Sync] Starting Salesforce sync for project: ${projectIdToSync}`);
      console.log(`[Direct Sync] Project data keys: ${Object.keys(projectData).length}`);
      console.log(`[Direct Sync] Project Type: ${projectData.projectType}`);
      console.log(`[Direct Sync] Contributor Project Name: ${projectData.contributorProjectName}`);
    
      // Check if Salesforce settings are configured
      if (!fs.existsSync(settingsPath)) {
        console.log(`[Direct Sync] ⚠️ Salesforce settings not configured. Skipping sync for project: ${projectIdToSync}`);
        const projectIndex = projects.findIndex(p => p.id === projectIdToSync);
        if (projectIndex !== -1) {
          projects[projectIndex].salesforceSyncStatus = 'failed';
          projects[projectIndex].salesforceSyncError = 'Salesforce settings not configured';
          saveProjects(projects);
        }
        // Continue to response - don't block
      } else {
        console.log(`[Direct Sync] Calling Salesforce API endpoint with JSON data`);
        
        // Call Salesforce function directly (no HTTP call - avoids server restart issues)
        const salesforceModule = require('./salesforce');
        const createProjectInSalesforce = salesforceModule.createProjectInSalesforce;
        
        if (!createProjectInSalesforce || typeof createProjectInSalesforce !== 'function') {
          throw new Error('createProjectInSalesforce function not found or not a function');
        }
        
        console.log(`[Direct Sync] Calling createProjectInSalesforce function directly for project: ${projectIdToSync}`);
        
        let salesforceResult;
        
        try {
          salesforceResult = await createProjectInSalesforce(projectData, req.user);
          
          console.log(`[Direct Sync] Salesforce response received for project: ${projectIdToSync}`);
          console.log(`[Direct Sync] Response success: ${salesforceResult.success}`);
          console.log(`[Direct Sync] Salesforce ID: ${salesforceResult.salesforceId}`);
        } catch (sfError) {
          console.error(`[Direct Sync] ❌ Salesforce function error:`, sfError.message);
          console.error(`[Direct Sync] Error stack:`, sfError.stack);
          
          // Re-throw to be caught by outer catch block
          throw sfError;
        }

        if (salesforceResult && salesforceResult.success) {
          console.log(`[Direct Sync] ✅ Salesforce sync successful for project: ${projectIdToSync}`);
          console.log(`[Direct Sync] Salesforce ID: ${salesforceResult.salesforceId}`);
          console.log(`[Direct Sync] Object Type: ${salesforceResult.objectType}`);
          
          // Find and update the project in the array
          const projectIndex = projects.findIndex(p => p.id === projectIdToSync);
          if (projectIndex !== -1) {
            const projectToUpdate = projects[projectIndex];
            projectToUpdate.salesforceId = salesforceResult.salesforceId;
            projectToUpdate.salesforceSyncStatus = `synced`;
            projectToUpdate.salesforceObjectType = salesforceResult.objectType;
            projectToUpdate.salesforceSyncedAt = new Date().toISOString();
            
            // Update in array
            projects[projectIndex] = projectToUpdate;
            
            saveProjects(projects); // Save updated project to persistent storage
            console.log(`[Direct Sync] ✅ Project ${projectIdToSync} updated with Salesforce ID: ${salesforceResult.salesforceId}`);
          } else {
            console.error(`[Direct Sync] ❌ Project ${projectIdToSync} not found in projects array`);
          }
        } else {
          console.error(`[Direct Sync] ❌ Salesforce sync returned success=false for project: ${projectIdToSync}`);
          
          // Mark as failed
          const projectIndex = projects.findIndex(p => p.id === projectIdToSync);
          if (projectIndex !== -1) {
            const projectToUpdate = projects[projectIndex];
            projectToUpdate.salesforceSyncStatus = `failed`;
            projectToUpdate.salesforceSyncError = `Salesforce sync returned success=false`;
            projects[projectIndex] = projectToUpdate;
            saveProjects(projects);
          }
        }
      }
    } catch (salesforceError) {
      // Log error but don't fail the request - project is already saved locally
      console.error(`[Direct Sync] ❌ Salesforce sync error for project: ${projectIdToSync}`);
      console.error(`[Direct Sync] Error response:`, salesforceError.response?.data);
      console.error(`[Direct Sync] Error message:`, salesforceError.message);
      console.error(`[Direct Sync] Error status:`, salesforceError.response?.status);
      
      // Extract error message
      const errorMessage = salesforceError.response?.data?.error || 
                          salesforceError.response?.data?.message || 
                          salesforceError.response?.data?.details ||
                          salesforceError.message || 
                          'Unknown Salesforce error';
      
      console.log(`[Direct Sync] Extracted error message: ${errorMessage}`);
      
      // Find and update the project in the array
      const projectIndex = projects.findIndex(p => p.id === projectIdToSync);
      
      if (projectIndex !== -1) {
        const projectToUpdate = projects[projectIndex];
        projectToUpdate.salesforceSyncStatus = 'failed';
        projectToUpdate.salesforceSyncError = errorMessage;
        projects[projectIndex] = projectToUpdate;
        saveProjects(projects);
        console.log(`[Direct Sync] ✅ Project ${projectIdToSync} marked as failed and saved: ${errorMessage}`);
      } else {
        console.error(`[Direct Sync] ❌ Project ${projectIdToSync} not found in projects array for error update`);
      }
    }

    // Clean the response data to ensure it's JSON serializable
    // Create a simple, safe response object
    console.log('Creating response data...');
    try {
      // Reload project from array to get latest sync status
      const projectIndex = projects.findIndex(p => p.id === projectIdToSync);
      if (projectIndex !== -1) {
        newProject = projects[projectIndex];
      }
      
      const responseData = {
        id: newProject.id,
        projectName: newProject.projectName || newProject.name || 'New Project',
        status: newProject.status || 'draft',
        createdAt: newProject.createdAt,
        createdBy: newProject.createdBy,
        salesforceId: newProject.salesforceId || null,
        salesforceSyncStatus: newProject.salesforceSyncStatus || 'pending'
      };

      console.log('Response data created:', responseData);
      
      // Send response after Salesforce sync completes
      if (!res.headersSent) {
        console.log('Sending response...');
        res.status(201).json(responseData);
        console.log('Response sent successfully');
      } else {
        console.log('Response already sent, skipping');
      }
    } catch (responseError) {
      console.error('Error creating/sending response data:', responseError);
      console.error('Response error stack:', responseError.stack);
      // If we can't create response data, send a simple success response
      if (!res.headersSent) {
        console.log('Sending fallback response...');
        try {
          res.status(201).json({
            id: newProject.id,
            message: 'Project created successfully',
            salesforceSyncStatus: newProject.salesforceSyncStatus || 'pending'
          });
        } catch (fallbackError) {
          console.error('Error sending fallback response:', fallbackError);
        }
      }
    }
    
    console.log('=== CREATE PROJECT REQUEST END ===');
  } catch (error) {
    console.error('=== ERROR IN CREATE PROJECT ===');
    console.error('Error creating project:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor?.name);
    
    // If save failed, try to rollback if possible
    if (newProject && error.message && error.message.includes('saving projects')) {
      const projectIndex = projects.findIndex(p => p.id === newProject.id);
      if (projectIndex !== -1) {
        projects.splice(projectIndex, 1);
        try {
          saveProjects(projects);
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
    }
    
    // If response was already sent, log the error but don't try to send another
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return;
    }
    
    // Re-throw error to be caught by asyncHandler and passed to global error handler
    // This ensures consistent JSON error responses
    throw error;
  }
}));

// Update project
router.put('/:id', authenticate, authorize('edit_project', 'all'), (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects[projectIndex] = {
    ...projects[projectIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.email
  };

  saveProjects(projects); // Save to persistent storage

  res.json(projects[projectIndex]);
});

// Delete project
router.delete('/:id', authenticate, authorize('all'), (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects.splice(projectIndex, 1);
  saveProjects(projects); // Save to persistent storage

  res.json({ message: 'Project deleted' });
});

// Template export endpoint
router.get('/template/:pageType', authenticate, asyncHandler(async (req, res) => {
  try {
    const { pageType } = req.params;
    
    // Use CSV format instead of Excel (simpler, no dependencies)
    let csvContent = 'Field Key,Field Label,Description,Type,Required,Section,Example,Value\n';
    
    // Get all fields for the page type
    let fields = [];
    if (pageType === 'quick-setup' || pageType === 'project-setup') {
      // Get all project fields
      Object.keys(fieldDefinitions).forEach(sectionKey => {
        const sectionFields = fieldDefinitions[sectionKey];
        Object.keys(sectionFields).forEach(fieldKey => {
          const field = sectionFields[fieldKey];
          fields.push({
            key: fieldKey,
            label: field.label,
            description: field.description,
            type: field.type,
            required: field.required || false,
            section: field.section || sectionKey,
            options: field.options || null,
            example: field.example || null
          });
        });
      });
    } else if (pageType === 'project-objective') {
      // Get project objective fields from fieldDefinitions
      const projectObjectiveFields = fieldDefinitions.projectObjective || {};
      Object.keys(projectObjectiveFields).forEach(fieldKey => {
        const field = projectObjectiveFields[fieldKey];
        fields.push({
          key: fieldKey,
          label: field.label,
          description: field.description,
          type: field.type,
          required: field.required || false,
          section: field.section || 'Project Objective',
          options: field.options || null,
          example: field.example || null
        });
      });
    } else if (pageType === 'qualification-step') {
      // Get qualification step fields from fieldDefinitions
      const qualificationStepFields = fieldDefinitions.qualificationStep || {};
      Object.keys(qualificationStepFields).forEach(fieldKey => {
        const field = qualificationStepFields[fieldKey];
        fields.push({
          key: fieldKey,
          label: field.label,
          description: field.description,
          type: field.type,
          required: field.required || false,
          section: field.section || 'Qualification Step',
          options: field.options || null,
          example: field.example || null
        });
      });
    } else if (pageType === 'project-page') {
      // Get project page fields from fieldDefinitions
      const projectPageFields = fieldDefinitions.projectPage || {};
      Object.keys(projectPageFields).forEach(fieldKey => {
        const field = projectPageFields[fieldKey];
        fields.push({
          key: fieldKey,
          label: field.label,
          description: field.description,
          type: field.type,
          required: field.required || false,
          section: field.section || 'Project Page',
          options: field.options || null,
          example: field.example || null
        });
      });
    }
    
    // Add fields to CSV
    fields.forEach((field) => {
      // Escape commas and quotes in CSV
      const escapeCSV = (str) => {
        if (!str) return '';
        const strValue = String(str);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      };
      
      csvContent += `${escapeCSV(field.key)},${escapeCSV(field.label)},${escapeCSV(field.description || '')},${escapeCSV(field.type)},${escapeCSV(field.required ? 'Yes' : 'No')},${escapeCSV(field.section || '')},${escapeCSV(field.example || '')},\n`;
    });
    
    // Set response headers for CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${pageType}-template.csv`);
    
    // Send CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template'
    });
  }
}));

module.exports = router;

