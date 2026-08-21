const express = require('express');
const jsforce = require('jsforce');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { logBulkOperation } = require('../utils/historyLogger');
const { validateTransitions } = require('./queueStatusManagement/transitionRules');
const { getScheduleRules, getEnabledRules } = require('./queueStatusManagement/scheduleRules');
const { executeScheduledUpdates } = require('./queueStatusManagement/scheduler');
const { getExecutionHistory } = require('./queueStatusManagement/executionHistory');
const { getSchedulerStatus } = require('../services/queueStatusScheduler');
const { calculateTimeInQueue } = require('../utils/queueStatusAnalytics');
const { 
  loadRules, 
  createRule, 
  updateRule, 
  deleteRule, 
  getRuleById 
} = require('./queueStatusManagement/scheduleRulesStorage');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to get Salesforce settings path
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

// Helper function to decrypt credentials
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted, return as is
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY.slice(0, 64), 'hex')
      : crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
    const ALGORITHM = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original if decryption fails
  }
};

// Helper function to get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

// Helper function to get parameter from either req.body (POST) or req.query (GET)
const getParam = (req, paramName, defaultValue = '') => {
  return req.body?.[paramName] !== undefined ? req.body[paramName] : (req.query[paramName] || defaultValue);
};

// Handler function for contributor-projects endpoint (supports both GET and POST)
const handleContributorProjects = asyncHandler(async (req, res) => {
  // Set timeout for this endpoint
  req.setTimeout(120000); // 2 minutes
  res.setTimeout(120000);
  res.setHeader('Connection', 'keep-alive');
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 110000; // 110 seconds max (leave 10s buffer)
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error(`Query timeout: Processing took ${(elapsed / 1000).toFixed(1)}s (max: ${MAX_EXECUTION_TIME / 1000}s)`);
    }
  };
  
  try {
    console.log('=== Queue Status Management - Fetching Contributor Projects ===');
    console.log('Request method:', req.method);
    console.log('Request query params:', req.query);
    console.log('Request body params:', req.body);
    
    checkTimeout();
    const conn = await getSalesforceConnection(req.user.id);
    
    console.log('Connection established. Instance URL:', conn.instanceUrl);
    console.log('Access Token available:', !!conn.accessToken);

    // Get pagination parameters from either body (POST) or query (GET)
    const limit = parseInt(getParam(req, 'limit', '1000')) || 1000; // Default to 1000 records
    const offset = parseInt(getParam(req, 'offset', '0')) || 0; // Default to 0 (start from beginning)
    
    // Cap limit to prevent excessive queries
    const cappedLimit = Math.min(limit, 1000);
    
    // Get filter parameters from either body (POST) or query (GET)
    const searchTerm = getParam(req, 'searchTerm', '');
    const statusFilter = getParam(req, 'statusFilter', '');
    const queueStatusFilter = getParam(req, 'queueStatusFilter', '');
    
    console.log(`Pagination: limit=${limit}, offset=${offset}`);
    console.log(`Filters: searchTerm="${searchTerm}", statusFilter="${statusFilter}", queueStatusFilter="${queueStatusFilter}"`);
    
    // Build WHERE clause conditions
    let whereConditions = [
      "(Status__c = null OR (Status__c != 'Removed' AND Status__c != 'Closed'))"
    ];
    
    // Add search term filter (searches in Name and Project__r.Name)
    const { validateAndSanitizeSearchTerm } = require('../utils/security');
    const sanitizedSearch = validateAndSanitizeSearchTerm(searchTerm);
    if (sanitizedSearch) {
      whereConditions.push(`(Name LIKE '%${sanitizedSearch}%' OR Project__r.Name LIKE '%${sanitizedSearch}%')`);
    }
    
    // Add status filter
    if (statusFilter && statusFilter !== '') {
      const sanitizedStatus = statusFilter.replace(/'/g, "\\'");
      whereConditions.push(`Status__c = '${sanitizedStatus}'`);
    }
    
    // Add queue status filter
    if (queueStatusFilter && queueStatusFilter !== '') {
      if (queueStatusFilter === '--None--') {
        whereConditions.push("(Queue_Status__c = null OR Queue_Status__c = '')");
      } else {
        const sanitizedQueueStatus = queueStatusFilter.replace(/'/g, "\\'");
        whereConditions.push(`Queue_Status__c = '${sanitizedQueueStatus}'`);
      }
    }
    
    // Build WHERE clause
    let whereClause = whereConditions.join(' AND ');
    
    // Apply GPC-Filter
    const { applyGPCFilterToWhereClause } = require('../utils/gpcFilterQueryBuilder');
    whereClause = applyGPCFilterToWhereClause(whereClause, req, { accountField: 'Project__r.Account__c', projectField: 'Project__c' });
    
    // Query ALL Contributor_Project__c records with filters applied
    // Exclude Contributor Projects with status "Removed" or "Closed"
    // Columns: Name (Contributor Project Name), Project__r.Name (Project name), Status__c (Status), Queue_Status__c (Current Queue Status)
    console.log(`Querying Contributor_Project__c records with filters (limit: ${limit}, offset: ${offset})`);
    
    // Try to include Project Objective field - check common field names
    let projectObjectiveField = 'Project_Objective__c';
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const poField = describeResult.fields.find(f => 
        f.type === 'reference' && 
        (f.name === 'Project_Objective__c' || 
         f.name === 'ProjectObjective__c' || 
         f.name === 'Objective__c' ||
         f.relationshipName === 'Project_Objective__r')
      );
      if (poField) {
        projectObjectiveField = poField.name;
      }
    } catch (describeError) {
      console.warn('Could not determine Project Objective field name, using default:', describeError.message);
    }
    
    // Build base query - optimize to fetch only what we need
    // Calculate how many records we actually need
    const totalNeeded = offset + cappedLimit;
    const queryLimit = Math.min(totalNeeded, 2000); // Salesforce max is 2000 per query

    const query = `SELECT Id, Name, Queue_Status__c, Project__c, Project__r.Name, Status__c, ${projectObjectiveField}
                   FROM Contributor_Project__c 
                   WHERE ${whereClause}
                   ORDER BY Name ASC
                   LIMIT ${queryLimit}`;
    
    console.log('=== SOQL Query ===');
    console.log(query);
    console.log('==================');
    
    console.log('Executing query...');
    checkTimeout();
    
    // Execute initial query
    let result = await conn.query(query);
    console.log('Query executed successfully');
    console.log('Total records in result:', result.totalSize);
    console.log('Records returned:', result.records ? result.records.length : 0);
    console.log('Done:', result.done);
    console.log('Has nextRecordsUrl:', !!result.nextRecordsUrl);
    
    let allRecords = [...(result.records || [])];
    console.log('Initial allRecords length:', allRecords.length);
    
    // If we need more records (offset + limit > 2000), use queryMore()
    // But limit pagination to prevent timeout
    const MAX_PAGES = 3; // Limit to 3 pages to prevent timeout
    let pageCount = 0;
    
    while (allRecords.length < totalNeeded && result.nextRecordsUrl && pageCount < MAX_PAGES) {
      checkTimeout();
      console.log('Fetching more records using queryMore()...');
      result = await conn.queryMore(result.nextRecordsUrl);
      console.log('QueryMore returned', result.records ? result.records.length : 0, 'records');
      if (result.records && result.records.length > 0) {
        allRecords = allRecords.concat(result.records);
        console.log('Updated allRecords length:', allRecords.length);
        pageCount++;
      } else {
        console.log('No more records to fetch');
        break;
      }
    }
    
    checkTimeout();
    
    // Apply offset and limit to get the requested batch
    const records = allRecords.slice(offset, offset + cappedLimit);
    console.log('After slicing (offset, limit):', records.length, 'records');
    
    // Check if there are more records available beyond what we've fetched
    const hasMore = allRecords.length >= totalNeeded || (result.nextRecordsUrl && pageCount < MAX_PAGES ? true : false);
    
    console.log(`Fetched ${records.length} Contributor Projects (offset: ${offset}, limit: ${limit}, total available: ${allRecords.length}). Has more: ${hasMore}`);
    console.log('==============================================================');

    // Map Contributor Project records
    // Columns mapping:
    // - Contributor Project Name: Name field (from Contributor_Project__c)
    // - Project: Project__r.Name (project name from related Project object)
    // - Status: Status__c field (from Contributor_Project__c)
    // - Current Queue Status: Queue_Status__c field (from Contributor_Project__c)
    // - Project Objective: Project Objective ID (from Contributor_Project__c)
    const projects = records.map(contributorProject => {
      // Get project objective ID from the field (use the field name we determined)
      const projectObjectiveId = contributorProject[projectObjectiveField] || null;
      
      return {
        id: contributorProject.Id,
        name: contributorProject.Name,
        contributorProjectId: contributorProject.Id,
        contributorProjectName: contributorProject.Name, // Name field from Contributor_Project__c
        project: contributorProject.Project__r ? contributorProject.Project__r.Name : (contributorProject.Project__c || null), // Project name from related Project object
        projectId: contributorProject.Project__c,
        projectObjectiveId: projectObjectiveId, // Project Objective ID
        status: contributorProject.Status__c || null, // Status__c field from Contributor_Project__c
        currentQueueStatus: contributorProject.Queue_Status__c || null // Queue_Status__c field from Contributor_Project__c
      };
    });

    console.log(`Returning ${projects.length} Contributor Projects`);

    // Set no-cache headers to prevent stale data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      success: true,
      projects: projects,
      hasMore: hasMore,
      offset: offset,
      limit: cappedLimit
    });
  } catch (error) {
    console.error('=== ERROR IN QUEUE STATUS MANAGEMENT - FETCHING CONTRIBUTOR PROJECTS ===');
    console.error('Error fetching contributor projects:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      errorCode: error.errorCode,
      fields: error.fields,
      code: error.code,
      statusCode: error.statusCode
    });
    console.error('==============================================================');
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to fetch contributor projects';
    let statusCode = 500;
    
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorMessage = 'Request timed out. The query is taking too long. Please try with more specific filters or reduce the number of records requested.';
      statusCode = 504;
    } else if (error.errorCode === 'INVALID_LOGIN' || error.message?.includes('INVALID_LOGIN')) {
      errorMessage = 'Invalid Salesforce credentials. Please check your username, password, and security token in Settings. The security token may have expired and needs to be regenerated.';
    } else if (error.message?.includes('authentication failure') || error.message?.includes('Invalid username')) {
      errorMessage = 'Salesforce authentication failed. Please verify your credentials in Settings and ensure your security token is up to date.';
    }
    
    // Ensure we send JSON, not HTML/XML
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: error.errorCode,
      fields: error.fields,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Register both GET and POST for contributor-projects endpoint
// All authenticated users can access their own contributor projects
router.get('/contributor-projects', authenticate, handleContributorProjects);
router.post('/contributor-projects', authenticate, handleContributorProjects);

// Update Queue Status for Contributor Projects
router.post('/update-queue-status', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { updates } = req.body; // Array of { projectId, queueStatus }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required and must not be empty'
      });
    }

    const conn = await getSalesforceConnection(req.user.id);

    // Fetch current statuses if not provided and validate transitions
    // Optimize: Use bulk query instead of individual retrieves
    const updatesNeedingStatus = updates.filter(u => u.currentStatus === undefined);
    const statusMap = {};
    
    if (updatesNeedingStatus.length > 0) {
      try {
        const ids = updatesNeedingStatus.map(u => u.projectId);
        // Salesforce IN clause has a limit, so we may need to batch
        const BATCH_SIZE = 200; // Salesforce limit for IN clause
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batch = ids.slice(i, i + BATCH_SIZE);
          const statusQuery = `SELECT Id, Queue_Status__c FROM Contributor_Project__c WHERE Id IN ('${batch.join("','")}')`;
          const statusResult = await conn.query(statusQuery);
          statusResult.records.forEach(record => {
            statusMap[record.Id] = record.Queue_Status__c || null;
          });
        }
      } catch (error) {
        console.error('Error fetching current statuses:', error);
        // Fallback: set all to null
      }
    }
    
    // Build updatesWithStatus array with current statuses
    const updatesWithStatus = updates.map(update => {
      if (update.currentStatus !== undefined) {
        return update;
      }
      return {
        ...update,
        currentStatus: statusMap[update.projectId] !== undefined ? statusMap[update.projectId] : null
      };
    });

    // Validate transitions
    const validation = validateTransitions(updatesWithStatus);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status transitions detected',
        validationErrors: validation.errors
      });
    }

    // Prepare bulk update records
    const records = updatesWithStatus.map(update => ({
      Id: update.projectId,
      Queue_Status__c: update.queueStatus || null
    }));

    console.log(`Updating Queue Status for ${records.length} Contributor Projects`);
    const results = await conn.sobject('Contributor_Project__c').update(records);

    // Check for errors
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      const errorMsg = errors[0].errors?.[0]?.message || 'Some updates failed';
      console.error('Queue Status update errors:', errors);
      throw new Error(errorMsg);
    }

    console.log(`Successfully updated Queue Status for ${results.length} Contributor Projects`);

    // Log to history
    try {
      logBulkOperation(
        'update',
        'Contributor_Project__c',
        req.user.email,
        results,
        { operation: 'update_queue_status', updates: updatesWithStatus }
      );
    } catch (historyError) {
      console.error('Error logging history:', historyError);
    }

    // Log to audit logs
    try {
      const auditLogger = require('../utils/auditLogger');
      auditLogger.logAuditEvent({
        user: req.user.email,
        action: 'Modified',
        objectType: 'Contributor Project',
        objectId: null, // Bulk operation
        objectName: `Queue Status Update: ${results.length} project(s)`,
        salesforceId: null,
        status: 'success',
        details: {
          operation: 'update_queue_status',
          recordsUpdated: results.length,
          updates: updatesWithStatus.map(u => ({
            projectId: u.projectId,
            fromStatus: u.currentStatus || '--None--',
            toStatus: u.queueStatus || '--None--'
          }))
        }
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json({
      success: true,
      message: `Successfully updated ${results.length} project(s)`,
      updatedCount: results.length
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to update queue status';
    if (error.errorCode === 'INVALID_LOGIN') {
      errorMessage = 'Invalid Salesforce credentials. Please check your username, password, and security token in Settings. The security token may have expired and needs to be regenerated.';
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage,
      errorCode: error.errorCode
    });
  }
}));

// Get schedule rules - All authenticated users can view
router.get('/schedule-rules', authenticate, asyncHandler(async (req, res) => {
  try {
    const rules = getScheduleRules();
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch schedule rules'
    });
  }
}));

// Get a single schedule rule by ID - All authenticated users can view
router.get('/schedule-rules/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const rule = getRuleById(id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule rule not found'
      });
    }
    
    res.json({
      success: true,
      rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch schedule rule'
    });
  }
}));

// Create a new schedule rule
router.post('/schedule-rules', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Validate required fields
    if (!ruleData.name || !ruleData.fromStatus || !ruleData.toStatus) {
      return res.status(400).json({
        success: false,
        error: 'Name, fromStatus, and toStatus are required'
      });
    }
    
    if (ruleData.type === 'time_based' && (!ruleData.days || ruleData.days < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Days must be at least 1 for time-based rules'
      });
    }
    
    // Add user information - fetch user name from users file
    ruleData.createdBy = req.user?.id || null;
    let createdByName = 'System';
    try {
      const usersPath = path.join(__dirname, '../../data/users.json');
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const user = users.find(u => u.id === req.user?.id);
        if (user) {
          createdByName = user.name || user.fullName || user.email?.split('@')[0] || 'System';
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
    ruleData.createdByName = createdByName;
    
    const newRule = createRule(ruleData);
    
    res.json({
      success: true,
      rule: newRule,
      message: 'Schedule rule created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create schedule rule'
    });
  }
}));

// Update a schedule rule
router.put('/schedule-rules/:id', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedRule = updateRule(id, updates);
    
    if (!updatedRule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule rule not found'
      });
    }
    
    res.json({
      success: true,
      rule: updatedRule,
      message: 'Schedule rule updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update schedule rule'
    });
  }
}));

// Delete a schedule rule
router.delete('/schedule-rules/:id', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteRule(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Schedule rule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Schedule rule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete schedule rule'
    });
  }
}));

// Execute scheduled updates (manual trigger)
router.post('/execute-scheduled-updates', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log('[Execute Scheduled Updates] Request received at', new Date().toISOString());
  
  // Set extended timeout for scheduled updates (10 minutes)
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000);
  if (req.socket) {
    req.socket.setTimeout(600000);
  }
  if (res.socket) {
    res.socket.setTimeout(600000);
  }
  
  // Send immediate headers to keep connection alive
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    console.log('[Execute Scheduled Updates] Starting execution...');
    const { ruleIds } = req.body || {};
    const results = await executeScheduledUpdates(ruleIds, 'manual');
    const elapsed = Date.now() - startTime;
    console.log(`[Execute Scheduled Updates] Completed in ${(elapsed / 1000).toFixed(1)}s. Processed: ${results.processed}, Updated: ${results.updated}`);
    
    res.json({
      success: true,
      message: `Processed ${results.processed} projects, updated ${results.updated}`,
      results,
      executionTime: `${(elapsed / 1000).toFixed(1)}s`
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Execute Scheduled Updates] Error after ${(elapsed / 1000).toFixed(1)}s:`, error);
    
    // Check if it's a timeout error
    if (error.message && (error.message.includes('timeout') || error.message.includes('ETIMEDOUT'))) {
      res.status(504).json({
        success: false,
        error: 'Request timeout: Scheduled updates took too long to execute. Consider processing in smaller batches.',
        executionTime: `${(elapsed / 1000).toFixed(1)}s`
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute scheduled updates',
        executionTime: `${(elapsed / 1000).toFixed(1)}s`
      });
    }
  }
}));

// Get execution history - All authenticated users can view
router.get('/execution-history', authenticate, asyncHandler(async (req, res) => {
  try {
    const { limit = 100, offset = 0, ruleId = null, startDate = null, endDate = null } = req.query;
    
    const history = getExecutionHistory({
      limit: parseInt(limit),
      offset: parseInt(offset),
      ruleId: ruleId || null,
      startDate: startDate || null,
      endDate: endDate || null
    });
    
    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    console.error('[Execution History] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch execution history'
    });
  }
}));

// Get scheduler status - All authenticated users can view
router.get('/scheduler-status', authenticate, asyncHandler(async (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('[Scheduler Status] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get scheduler status'
    });
  }
}));

// Get analytics dashboard data - All authenticated users can view
router.get('/analytics/dashboard', authenticate, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log('[Analytics] Dashboard request received at', new Date().toISOString());
  
  // Set extended timeout for analytics
  req.setTimeout(120000); // 2 minutes
  res.setTimeout(120000);
  if (req.socket) {
    req.socket.setTimeout(120000);
  }
  if (res.socket) {
    res.socket.setTimeout(120000);
  }
  
  // Send immediate headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    console.log('[Analytics] Getting Salesforce connection...');
    const conn = await getSalesforceConnection(req.user.id);
    console.log('[Analytics] Connection established, time elapsed:', Date.now() - startTime, 'ms');
    
    // FIXED: Use aggregate query to get accurate counts by Queue_Status__c
    // This includes null values and is much more efficient than fetching all records
    
    // Step 1: Get total count of ALL Contributor_Project__c records (regardless of Status__c)
    // NOTE: This counts Contributor_Project__c records, not Project__c records
    // One Project__c can have many Contributor_Project__c records, each with its own Queue_Status__c
    // Exclude only Removed and Closed status projects
    let baseWhereClause = "(Status__c = null OR (Status__c != 'Removed' AND Status__c != 'Closed'))";
    
    // Apply GPC-Filter if enabled (filter by Project through relationship)
    const { applyGPCFilterToWhereClause } = require('../utils/gpcFilterQueryBuilder');
    baseWhereClause = applyGPCFilterToWhereClause(baseWhereClause, req, { 
      accountField: 'Project__r.Account__c', 
      projectField: 'Project__c' 
    });
    
    const totalCountQuery = `SELECT COUNT() FROM Contributor_Project__c WHERE ${baseWhereClause}`;
    console.log('[Analytics] Getting total count of ALL Contributor_Project__c records (excluding Removed/Closed)...');
    console.log('[Analytics] Total count query:', totalCountQuery);
    const totalCountResult = await conn.query(totalCountQuery);
    const totalCount = totalCountResult.totalSize || 0;
    console.log('[Analytics] Total Contributor_Project__c records (all statuses):', totalCount);
    
    // Step 2: Get count by Queue_Status__c using GROUP BY (much more efficient)
    // This query groups by Queue_Status__c and counts records in each group
    // Includes ALL Contributor Projects (excluding only Removed and Closed status)
    // NOTE: If GPC filters use relationship fields (Project__r.Account__c), we need to handle them differently
    // For GROUP BY queries, we may need to use a subquery or filter differently
    let statusCountWhereClause = "(Status__c = null OR (Status__c != 'Removed' AND Status__c != 'Closed'))";
    
    // Check if GPC filters are being applied and if they use relationship fields
    const gpcAccounts = req.query.gpcInterestedAccounts || req.query.gpc_accounts;
    const gpcProjects = req.query.gpcInterestedProjects || req.query.gpc_projects;
    
    // If GPC filters are using projects, we can use Project__c directly (no relationship needed)
    if (gpcProjects) {
      const projectIds = gpcProjects.split(',').filter(id => {
        const trimmed = id.trim();
        return /^[a-zA-Z0-9]{15,18}$/.test(trimmed);
      });
      if (projectIds.length > 0) {
        const escapedProjectIds = projectIds.map(id => `'${id.trim()}'`).join(', ');
        statusCountWhereClause += ` AND Project__c IN (${escapedProjectIds})`;
      }
    }
    
    // If GPC filters are using accounts, we need to handle the relationship
    // For GROUP BY, we'll need to use a subquery or filter by Project__c after getting project IDs
    if (gpcAccounts && !gpcProjects) {
      const accountIds = gpcAccounts.split(',').filter(id => {
        const trimmed = id.trim();
        return /^[a-zA-Z0-9]{15,18}$/.test(trimmed);
      });
      if (accountIds.length > 0) {
        try {
          // Get Project IDs for these accounts first
          const escapedAccountIds = accountIds.map(id => `'${id.trim()}'`).join(', ');
          const projectsQuery = `SELECT Id FROM Project__c WHERE Account__c IN (${escapedAccountIds}) LIMIT 10000`;
          const projectsResult = await conn.query(projectsQuery);
          const projectIds = (projectsResult.records || []).map(p => p.Id);
          if (projectIds.length > 0) {
            const escapedProjectIds = projectIds.map(id => `'${id}'`).join(', ');
            statusCountWhereClause += ` AND Project__c IN (${escapedProjectIds})`;
          } else {
            // No projects for these accounts, return empty
            console.log('[Analytics] No projects found for GPC account filter, returning empty results');
            return res.json({
              success: true,
              data: {
                projectsByStatus: {
                  'Calibration Queue': 0,
                  'Production Queue': 0,
                  'Test Queue': 0,
                  '--None--': 0,
                  total: 0
                },
                timeInQueue: {},
                changeFrequency: { totalChanges: 0, byStatus: {}, topTransitions: [] }
              },
              recordCount: 0,
              totalCount: 0
            });
          }
        } catch (error) {
          console.error('[Analytics] Error fetching projects for GPC account filter:', error);
          // Continue without account filter if there's an error
        }
      }
    }
    
    const statusCountQuery = `
      SELECT 
        Queue_Status__c queueStatus,
        COUNT(Id) RecordCount
      FROM Contributor_Project__c
      WHERE ${statusCountWhereClause}
      GROUP BY Queue_Status__c
      LIMIT 50
    `;
    
    console.log('[Analytics] Executing GROUP BY query for status counts...');
    console.log('[Analytics] Query:', statusCountQuery);
    console.log('[Analytics] GPC Filters - Accounts:', gpcAccounts || 'none', 'Projects:', gpcProjects || 'none');
    const statusCountPromise = conn.query(statusCountQuery);
    const statusCountTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Status count query timeout after 30 seconds')), 30000)
    );
    
    const statusCountResult = await Promise.race([statusCountPromise, statusCountTimeout]);
    console.log('[Analytics] Status count query completed, groups:', statusCountResult.records?.length || 0, 'time elapsed:', Date.now() - startTime, 'ms');
    console.log('[Analytics] Raw GROUP BY results:', JSON.stringify(statusCountResult.records || [], null, 2));
    
    // Build projectsByStatus object from GROUP BY results
    const projectsByStatus = {
      'Calibration Queue': 0,
      'Production Queue': 0,
      'Test Queue': 0,
      '--None--': 0,
      total: 0 // Will be calculated from sum of status counts
    };
    
    if (statusCountResult.records) {
      statusCountResult.records.forEach(record => {
        const status = record.queueStatus || '--None--';
        const count = record.RecordCount || 0;
        
        if (projectsByStatus.hasOwnProperty(status)) {
          projectsByStatus[status] = count;
        } else {
          // Handle unexpected status values
          console.warn(`[Analytics] Unexpected Queue_Status__c value: "${status}"`);
          projectsByStatus['--None--'] += count;
        }
      });
    }
    
    // Calculate total from sum of all status counts (this ensures accuracy)
    const calculatedTotal = projectsByStatus['Calibration Queue'] + 
                            projectsByStatus['Production Queue'] + 
                            projectsByStatus['Test Queue'] + 
                            projectsByStatus['--None--'];
    projectsByStatus.total = calculatedTotal;
    
    console.log('[Analytics] Status counts breakdown:', {
      'Calibration Queue': projectsByStatus['Calibration Queue'],
      'Production Queue': projectsByStatus['Production Queue'],
      'Test Queue': projectsByStatus['Test Queue'],
      '--None--': projectsByStatus['--None--'],
      'Total (sum)': calculatedTotal,
      'Total (from COUNT query)': totalCount
    });
    
    // If there's a discrepancy, log it but use the calculated total (from GROUP BY) as it's more accurate
    if (calculatedTotal !== totalCount) {
      console.warn(`[Analytics] Total count mismatch: GROUP BY sum (${calculatedTotal}) vs COUNT query (${totalCount}). Using GROUP BY sum.`);
    }
    
    // Step 3: Fetch a sample of projects for time-in-queue calculations (only need projects with Queue_Status__c)
    // Limit to 1000 for performance
    // Includes ALL Contributor Projects (excluding only Removed and Closed status)
    // Use the same WHERE clause as the GROUP BY query to ensure consistency
    let sampleWhereClause = `Queue_Status__c != null AND ${statusCountWhereClause}`;
    const sampleQuery = `SELECT Id, Name, Queue_Status__c, Status__c, LastModifiedDate 
                         FROM Contributor_Project__c 
                         WHERE ${sampleWhereClause}
                         LIMIT 1000`;
    
    console.log('[Analytics] Fetching sample projects for time-in-queue metrics...');
    console.log('[Analytics] Sample query:', sampleQuery);
    const samplePromise = conn.query(sampleQuery);
    const sampleTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sample query timeout after 20 seconds')), 20000)
    );
    
    const sampleResult = await Promise.race([samplePromise, sampleTimeout]);
    const projects = (sampleResult.records || []).map(r => ({
      id: r.Id,
      name: r.Name,
      queueStatus: r.Queue_Status__c,
      status: r.Status__c,
      lastModifiedDate: r.LastModifiedDate
    }));
    
    console.log('[Analytics] Sample projects fetched:', projects.length, 'time elapsed:', Date.now() - startTime, 'ms');
    
    // Get status change dates (using LastModifiedDate as proxy for when Queue_Status__c was last modified)
    // For more accurate time-in-queue, we should ideally use Queue_Status__History, but LastModifiedDate is a reasonable proxy
    const statusDates = {};
    projects.forEach(project => {
      statusDates[project.id] = project.lastModifiedDate;
    });

    // Calculate time-in-queue metrics from sample
    const timeInQueueFromSample = calculateTimeInQueue(projects, statusDates);
    
    // Merge sample-based averages with actual counts from projectsByStatus
    // This ensures counts are accurate while averages are calculated from a representative sample
    const timeInQueue = {
      'Calibration Queue': {
        count: projectsByStatus['Calibration Queue'],
        averageDays: timeInQueueFromSample['Calibration Queue'].averageDays,
        minDays: timeInQueueFromSample['Calibration Queue'].minDays === Infinity ? 0 : timeInQueueFromSample['Calibration Queue'].minDays,
        maxDays: timeInQueueFromSample['Calibration Queue'].maxDays
      },
      'Production Queue': {
        count: projectsByStatus['Production Queue'],
        averageDays: timeInQueueFromSample['Production Queue'].averageDays,
        minDays: timeInQueueFromSample['Production Queue'].minDays === Infinity ? 0 : timeInQueueFromSample['Production Queue'].minDays,
        maxDays: timeInQueueFromSample['Production Queue'].maxDays
      },
      'Test Queue': {
        count: projectsByStatus['Test Queue'],
        averageDays: timeInQueueFromSample['Test Queue'].averageDays,
        minDays: timeInQueueFromSample['Test Queue'].minDays === Infinity ? 0 : timeInQueueFromSample['Test Queue'].minDays,
        maxDays: timeInQueueFromSample['Test Queue'].maxDays
      },
      '--None--': {
        count: projectsByStatus['--None--'],
        averageDays: timeInQueueFromSample['--None--'].averageDays,
        minDays: timeInQueueFromSample['--None--'].minDays === Infinity ? 0 : timeInQueueFromSample['--None--'].minDays,
        maxDays: timeInQueueFromSample['--None--'].maxDays
      }
    };

    // Fetch status change history for last 30 days
    // Query for projects that had Queue_Status__c modified in the last 30 days
    console.log('[Analytics] Fetching status change history for last 30 days...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Format date for Salesforce SOQL: YYYY-MM-DDTHH:mm:ssZ
    const year = thirtyDaysAgo.getUTCFullYear();
    const month = String(thirtyDaysAgo.getUTCMonth() + 1).padStart(2, '0');
    const day = String(thirtyDaysAgo.getUTCDate()).padStart(2, '0');
    const hours = String(thirtyDaysAgo.getUTCHours()).padStart(2, '0');
    const minutes = String(thirtyDaysAgo.getUTCMinutes()).padStart(2, '0');
    const seconds = String(thirtyDaysAgo.getUTCSeconds()).padStart(2, '0');
    const thirtyDaysAgoSOQL = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    
    // Try to query field history if available, otherwise use LastModifiedDate as proxy
    let statusHistory = {
      totalChanges: 0,
      byStatus: {},
      byDay: {},
      topTransitions: []
    };
    
    try {
      // Query for projects that had Queue_Status__c modified in the last 30 days
      // Using LastModifiedDate as proxy for when Queue_Status__c was changed
      // Includes ALL Contributor Projects (excluding only Removed and Closed status)
      const historyQuery = `SELECT Id, Queue_Status__c, LastModifiedDate, Status__c 
                            FROM Contributor_Project__c 
                            WHERE LastModifiedDate >= ${thirtyDaysAgoSOQL}
                              AND ${statusCountWhereClause}
                            ORDER BY LastModifiedDate DESC
                            LIMIT 5000`;
      
      console.log('[Analytics] History query:', historyQuery);
      const historyPromise = conn.query(historyQuery);
      const historyTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('History query timeout after 30 seconds')), 30000)
      );
      
      const historyResult = await Promise.race([historyPromise, historyTimeout]);
      const historyProjects = (historyResult.records || []).map(r => ({
        id: r.Id,
        queueStatus: r.Queue_Status__c,
        lastModifiedDate: r.LastModifiedDate,
        status: r.Status__c
      }));
      
      console.log('[Analytics] History projects fetched:', historyProjects.length);
      
      // Group by date and status to count changes
      const changesByDate = {};
      const changesByStatus = {};
      
      historyProjects.forEach(project => {
        const dateKey = new Date(project.lastModifiedDate).toISOString().split('T')[0];
        const status = project.queueStatus || '--None--';
        
        // Count changes by date
        changesByDate[dateKey] = (changesByDate[dateKey] || 0) + 1;
        
        // Count changes by status (current status after change)
        changesByStatus[status] = (changesByStatus[status] || 0) + 1;
      });
      
      // Calculate top transitions (simplified - using current status as "to" status)
      // Note: Without field history, we can't track actual "from -> to" transitions
      // This is an approximation based on current status after modification
      const topTransitions = Object.entries(changesByStatus)
        .map(([status, count]) => ({
          transition: `Changed to ${status}`,
          count: count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      statusHistory = {
        totalChanges: historyProjects.length,
        byStatus: changesByStatus,
        byDay: changesByDate,
        topTransitions: topTransitions
      };
      
      console.log('[Analytics] Status change history calculated:', {
        totalChanges: statusHistory.totalChanges,
        statuses: Object.keys(changesByStatus).length,
        topTransitions: topTransitions.length
      });
    } catch (error) {
      console.error('[Analytics] Error fetching status change history:', error);
      // Fallback to empty history - don't throw, just log
    }

    // Generate dashboard data with accurate counts
    console.log('[Analytics] Generating dashboard data...');
    const dashboardData = {
      projectsByStatus: projectsByStatus,
      timeInQueue: timeInQueue,
      changeFrequency: {
        totalChanges: statusHistory.totalChanges || 0,
        byStatus: statusHistory.byStatus || {},
        topTransitions: statusHistory.topTransitions || []
      }
    };
    console.log('[Analytics] Dashboard data generated, time elapsed:', Date.now() - startTime, 'ms');
    console.log('[Analytics] Projects by Status:', JSON.stringify(projectsByStatus, null, 2));

    res.json({
      success: true,
      data: dashboardData,
      recordCount: projects.length,
      totalCount: totalCount,
      _metadata: {
        gpcFiltersApplied: !!(gpcAccounts || gpcProjects),
        gpcAccounts: gpcAccounts || null,
        gpcProjects: gpcProjects || null,
        statusFilter: "All statuses (excluding Removed/Closed)",
        queryUsed: statusCountQuery
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching dashboard data:', error);
    const elapsed = Date.now() - startTime;
    console.error('[Analytics] Error occurred after', elapsed, 'ms');
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch analytics data',
        elapsed: elapsed
      });
    }
  }
}));

// Get time-in-queue metrics - All authenticated users can view
router.get('/analytics/time-in-queue', authenticate, asyncHandler(async (req, res) => {
  // Set extended timeout
  req.setTimeout(120000);
  res.setTimeout(120000);
  
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const { status } = req.query; // Optional status filter
    
    // Include ALL Contributor Projects (excluding only Removed and Closed status)
    const statusFilter = "(Status__c = null OR (Status__c != 'Removed' AND Status__c != 'Closed'))";
    let query = `SELECT Id, Name, Queue_Status__c, LastModifiedDate FROM Contributor_Project__c WHERE Queue_Status__c != null AND ${statusFilter}`;
    if (status && status !== '--None--') {
      query += ` AND Queue_Status__c = '${status.replace(/'/g, "''")}'`;
    }
    query += ` ORDER BY LastModifiedDate DESC LIMIT 1000`;
    
    const queryPromise = conn.query(query);
    const queryTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 60000)
    );
    
    const result = await Promise.race([queryPromise, queryTimeout]);
    const projects = (result.records || []).map(r => ({
      id: r.Id,
      name: r.Name,
      queueStatus: r.Queue_Status__c,
      lastModifiedDate: r.LastModifiedDate
    }));

    const statusDates = {};
    projects.forEach(project => {
      statusDates[project.id] = project.lastModifiedDate;
    });

    const metrics = calculateTimeInQueue(projects, statusDates);

    res.json({
      success: true,
      metrics,
      recordCount: projects.length
    });
  } catch (error) {
    console.error('[Analytics] Error fetching time-in-queue metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch time-in-queue metrics'
    });
  }
}));

// Export analytics report - All authenticated users can export
router.get('/analytics/export', authenticate, asyncHandler(async (req, res) => {
  // Set extended timeout for export
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000);
  
  try {
    const { format = 'json' } = req.query; // json, csv, xlsx
    const conn = await getSalesforceConnection(req.user.id);
    
    // Fetch projects with limit to avoid timeout
    // Include ALL Contributor Projects (excluding only Removed and Closed status)
    const statusFilter = "(Status__c = null OR (Status__c != 'Removed' AND Status__c != 'Closed'))";
    const query = `SELECT Id, Name, Queue_Status__c, Status__c, LastModifiedDate FROM Contributor_Project__c WHERE Queue_Status__c != null AND ${statusFilter} ORDER BY LastModifiedDate DESC LIMIT 2000`;
    
    const queryPromise = conn.query(query);
    const queryTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 90000)
    );
    
    const queryResult = await Promise.race([queryPromise, queryTimeout]);
    const projects = (queryResult.records || []).map(r => ({
      id: r.Id,
      name: r.Name,
      queueStatus: r.Queue_Status__c || '--None--',
      status: r.Status__c,
      lastModifiedDate: r.LastModifiedDate
    }));

    // Calculate time in queue
    const statusDates = {};
    projects.forEach(project => {
      statusDates[project.id] = project.lastModifiedDate;
    });

    const now = new Date();
    const reportData = projects.map(project => {
      const statusDate = statusDates[project.id] ? new Date(statusDates[project.id]) : null;
      const daysInQueue = statusDate ? Math.floor((now - statusDate) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        'Project ID': project.id,
        'Project Name': project.name,
        'Queue Status': project.queueStatus,
        'Status': project.status,
        'Days in Queue': daysInQueue,
        'Status Changed Date': statusDate ? statusDate.toISOString().split('T')[0] : 'N/A'
      };
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="queue-status-report-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Convert to CSV
      const headers = Object.keys(reportData[0] || {});
      const csvRows = [
        headers.join(','),
        ...reportData.map(row => headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(','))
      ];
      res.send(csvRows.join('\n'));
    } else if (format === 'xlsx') {
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Queue Status Report');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="queue-status-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
    } else {
      // JSON format
      res.json({
        success: true,
        data: reportData,
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export report'
    });
  }
}));

module.exports = router;

