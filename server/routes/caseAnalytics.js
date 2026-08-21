const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper function to get settings path
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

// Helper to set no-cache headers
const setNoCacheHeaders = (res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper to build WHERE clause from filters
const buildWhereClause = (filters, excludeDate = false) => {
  const conditions = [];
  
  if (filters.caseStatus && filters.caseStatus !== 'all') {
    // Handle case-insensitive status matching
    const statusValue = filters.caseStatus.replace(/'/g, "\\'");
    conditions.push(`Status = '${statusValue}'`);
  }
  
  if (filters.group && filters.group !== 'all') {
    const groupValue = filters.group.replace(/'/g, "\\'");
    // Map frontend values to Salesforce values
    const groupMap = {
      'crowd-support': 'Crowd Support',
      'trust-safety': 'Trust and Safety',
      'project-teams': 'Project Teams',
      'finance': 'Finance',
      'hr': 'HR'
    };
    const salesforceGroup = groupMap[groupValue] || groupValue;
    conditions.push(`Group__c = '${salesforceGroup.replace(/'/g, "\\'")}'`);
  }
  
  if (filters.caseType && filters.caseType !== 'all') {
    const typeValue = filters.caseType.replace(/'/g, "\\'");
    conditions.push(`Type = '${typeValue}'`);
  }
  
  if (filters.caseReason && filters.caseReason !== 'all') {
    const reasonValue = filters.caseReason.replace(/'/g, "\\'");
    conditions.push(`Case_Reason__c = '${reasonValue}'`);
  }
  
  if (filters.projectName && filters.projectName !== 'all') {
    const projectValue = filters.projectName.replace(/'/g, "\\'");
    conditions.push(`Project__r.Name = '${projectValue}'`);
  }
  
  if (filters.accountName && filters.accountName !== 'all') {
    const accountValue = filters.accountName.replace(/'/g, "\\'");
    conditions.push(`Account.Name = '${accountValue}'`);
  }
  
  if (filters.caseOwner && filters.caseOwner !== 'all') {
    const ownerValue = filters.caseOwner.replace(/'/g, "\\'");
    conditions.push(`Owner.Name = '${ownerValue}'`);
  }
  
  if (filters.caseTag && filters.caseTag !== 'all') {
    const tagValue = filters.caseTag.replace(/'/g, "\\'");
    // Assuming there's a Tags field or similar - adjust field name as needed
    conditions.push(`Tags LIKE '%${tagValue}%'`);
  }
  
  if (filters.slaStatus && filters.slaStatus !== 'all') {
    const slaValue = filters.slaStatus.replace(/'/g, "\\'");
    // Map frontend values to Salesforce SLA status values
    if (slaValue === 'within-target') {
      conditions.push(`(SLA_Status__c = 'Within Target SLA' OR SLA_Status__c = 'Within SLA' OR SLA_Status__c = 'In SLA')`);
    } else if (slaValue === 'over-target') {
      conditions.push(`(SLA_Status__c = 'Over Target SLA' OR SLA_Status__c LIKE '%Over Target%')`);
    } else if (slaValue === 'over-external') {
      conditions.push(`(SLA_Status__c = 'Over External SLA' OR SLA_Status__c = 'Over SLA' OR SLA_Status__c LIKE '%Over External%')`);
    }
  }
  
  if (!excludeDate && filters.date && filters.date !== 'all') {
    const now = new Date();
    let startDate;
    if (filters.date === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filters.date === 'past-7-days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filters.date === 'past-30-days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filters.date === 'past-90-days') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    if (startDate) {
      const isoDate = startDate.toISOString().split('.')[0] + 'Z';
      conditions.push(`CreatedDate >= ${isoDate}`);
    }
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : null;
};

// Get KPIs
router.get('/kpis', authenticate, asyncHandler(async (req, res) => {
  // Set a timeout for this endpoint - return partial results if it takes too long
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 90000; // 90 seconds max
  
  try {
    const conn = await getSalesforceConnection(req.user.id);
    
    // Skip describe call for now - it adds overhead and we can add it later if needed
    // Run describe in background (non-blocking) if needed for debugging
    const describePromise = conn.sobject('Case').describe().catch(() => null);
    describePromise.then(describeResult => {
      if (describeResult) {
        const recordTypes = describeResult.recordTypeInfos ? Object.keys(describeResult.recordTypeInfos).filter(rt => describeResult.recordTypeInfos[rt].available) : [];
        console.log('=== CASE OBJECT INFO (background) ===');
        console.log('Available RecordTypes:', recordTypes);
      }
    }).catch(() => {});
    
    const whereConditions = buildWhereClause(req.query, true); // Exclude date filter for KPIs
    const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
    
    // Helper to check if we're running out of time
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        throw new Error('Query timeout - taking too long');
      }
    };
    
    // Get total unresolved tickets - use IsClosed = false (standard Salesforce field)
    // NOTE: Salesforce dashboards may filter by Status values instead of just IsClosed
    // Common unresolved statuses: 'New', 'Open', 'On Hold', 'Pending'
    // Common resolved statuses: 'Closed', 'Solved', 'Cancelled'
    // Optimize: Use totalSize for initial count, only paginate if needed (totalSize >= 10000)
    let totalUnresolved = 0;
    try {
      // Build query - exclude date filter for KPIs but include other filters
      // Try Status-based filtering first (matches Salesforce dashboard behavior)
      // Use Status NOT IN ('Closed', 'Solved', 'Cancelled') instead of just IsClosed = false
      const statusBasedWhere = whereClause 
        ? `${whereClause} AND Status NOT IN ('Closed', 'Solved', 'Cancelled')` 
        : `WHERE Status NOT IN ('Closed', 'Solved', 'Cancelled')`;
      const statusBasedQuery = `SELECT Id FROM Case ${statusBasedWhere} LIMIT 100000`;
      console.log('=== UNRESOLVED CASES QUERY (Status-based) ===');
      console.log('Status-based Query:', statusBasedQuery);
      console.log('Where clause from filters:', whereClause);
      console.log('Request query params:', JSON.stringify(req.query));
      
      let unresolvedResult;
      try {
        unresolvedResult = await conn.query(statusBasedQuery);
        console.log('Status-based query executed. totalSize:', unresolvedResult.totalSize, 'records returned:', unresolvedResult.records?.length || 0);
      } catch (statusErr) {
        console.warn('Status-based query failed, trying IsClosed approach:', statusErr.message);
        // Fallback to IsClosed = false
        const unresolvedWhere = whereClause 
          ? `${whereClause} AND IsClosed = false` 
          : `WHERE IsClosed = false`;
        const unresolvedQuery = `SELECT Id FROM Case ${unresolvedWhere} LIMIT 100000`;
        console.log('=== UNRESOLVED CASES QUERY (IsClosed-based) ===');
        console.log('IsClosed-based Query:', unresolvedQuery);
        unresolvedResult = await conn.query(unresolvedQuery);
        console.log('IsClosed-based query executed. totalSize:', unresolvedResult.totalSize, 'records returned:', unresolvedResult.records?.length || 0);
      }
      
      // For speed, use totalSize directly - it's usually accurate for counts
      // Only paginate if totalSize is exactly 100000 (meaning we definitely hit the limit)
      if (unresolvedResult.totalSize < 100000) {
        totalUnresolved = unresolvedResult.totalSize;
        console.log(`Using totalSize (${totalUnresolved}) - no pagination needed`);
      } else {
        // Only paginate if we hit the exact limit - use totalSize as estimate otherwise
        console.warn(`WARNING: totalSize is ${unresolvedResult.totalSize} - may be incomplete. Using totalSize as estimate.`);
        totalUnresolved = unresolvedResult.totalSize; // Use as estimate to avoid timeout
        console.log(`Using totalSize as estimate: ${totalUnresolved}`);
      }
      checkTimeout();
    } catch (err) {
      console.error('Error counting unresolved tickets:', err);
      console.error('Error stack:', err.stack);
      setNoCacheHeaders(res);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch unresolved tickets',
        message: err.message 
      });
      return;
    }
    
    // Get unresolved within target SLA - optimize: use totalSize if < 10000
    // Use Status filter to match unresolved cases query (Status NOT IN ('Closed', 'Solved', 'Cancelled'))
    const slaBaseWhere = whereClause 
      ? `${whereClause} AND Status NOT IN ('Closed', 'Solved', 'Cancelled')` 
      : `WHERE Status NOT IN ('Closed', 'Solved', 'Cancelled')`;
    
    let withinTarget = 0;
    try {
      const withinTargetQuery = `SELECT Id FROM Case ${slaBaseWhere} AND (SLA_Status__c = 'Within Target SLA' OR SLA_Status__c = 'Within SLA' OR SLA_Status__c = 'In SLA') LIMIT 100000`;
      let withinTargetResult = await conn.query(withinTargetQuery);
      withinTarget = withinTargetResult.totalSize; // Use totalSize directly for speed
      checkTimeout();
    } catch (err) {
      console.error('Error counting within target SLA:', err);
      // Fallback to IsClosed = false
      const withinTargetQuery = `SELECT Id FROM Case ${whereClause ? whereClause + ' AND ' : 'WHERE '}IsClosed = false AND (SLA_Status__c = 'Within Target SLA' OR SLA_Status__c = 'Within SLA' OR SLA_Status__c = 'In SLA')`;
      const withinTargetResult = await conn.query(withinTargetQuery);
      withinTarget = withinTargetResult.totalSize || 0;
    }
    
    // Get backlog over target SLA - optimize: use totalSize if < 10000
    let overTarget = 0;
    try {
      const overTargetQuery = `SELECT Id FROM Case ${slaBaseWhere} AND (SLA_Status__c = 'Over Target SLA' OR SLA_Status__c LIKE '%Over Target%') LIMIT 100000`;
      let overTargetResult = await conn.query(overTargetQuery);
      overTarget = overTargetResult.totalSize; // Use totalSize directly for speed
      checkTimeout();
    } catch (err) {
      console.error('Error counting over target SLA:', err);
      // Fallback to IsClosed = false
      const overTargetQuery = `SELECT Id FROM Case ${whereClause ? whereClause + ' AND ' : 'WHERE '}IsClosed = false AND (SLA_Status__c = 'Over Target SLA' OR SLA_Status__c LIKE '%Over Target%')`;
      const overTargetResult = await conn.query(overTargetQuery);
      overTarget = overTargetResult.totalSize || 0;
    }
    
    // Get backlog over external SLA - optimize: use totalSize if < 10000
    let overExternal = 0;
    try {
      const overExternalQuery = `SELECT Id FROM Case ${slaBaseWhere} AND (SLA_Status__c = 'Over External SLA' OR SLA_Status__c = 'Over SLA' OR SLA_Status__c LIKE '%Over External%') LIMIT 100000`;
      let overExternalResult = await conn.query(overExternalQuery);
      overExternal = overExternalResult.totalSize; // Use totalSize directly for speed
      checkTimeout();
    } catch (err) {
      console.error('Error counting over external SLA:', err);
      // Fallback to IsClosed = false
      const overExternalQuery = `SELECT Id FROM Case ${whereClause ? whereClause + ' AND ' : 'WHERE '}IsClosed = false AND (SLA_Status__c = 'Over External SLA' OR SLA_Status__c = 'Over SLA' OR SLA_Status__c LIKE '%Over External%')`;
      const overExternalResult = await conn.query(overExternalQuery);
      overExternal = overExternalResult.totalSize || 0;
    }
    
    // Get average resolution time (for resolved cases only)
    // Optimize: Sample only 5,000 records for speed
    let avgResolutionTime = 0;
    try {
      const resolvedQuery = `SELECT CreatedDate, ClosedDate FROM Case ${whereClause ? whereClause + ' AND ' : 'WHERE '}IsClosed = true AND ClosedDate != null LIMIT 5000`;
      let resolvedResult = await conn.query(resolvedQuery);
      let totalDays = 0;
      let count = 0;
      
      if (resolvedResult.records && resolvedResult.records.length > 0) {
        resolvedResult.records.forEach(record => {
          if (record.CreatedDate && record.ClosedDate) {
            const created = new Date(record.CreatedDate);
            const closed = new Date(record.ClosedDate);
            const days = (closed - created) / (1000 * 60 * 60 * 24);
            totalDays += days;
            count++;
          }
        });
      }
      
      // No pagination - just use first 5K records for speed
      if (count > 0) {
        avgResolutionTime = totalDays / count;
      }
      checkTimeout();
    } catch (err) {
      console.error('Error calculating average resolution time:', err);
    }
    
    // Get total resolved cases - use totalSize directly for speed
    let resolvedCases = 0;
    try {
      const resolvedCountQuery = `SELECT Id FROM Case ${whereClause ? whereClause + ' AND ' : 'WHERE '}IsClosed = true LIMIT 100000`;
      let resolvedCountResult = await conn.query(resolvedCountQuery);
      resolvedCases = resolvedCountResult.totalSize; // Use totalSize directly
      checkTimeout();
    } catch (err) {
      console.error('Error counting resolved cases:', err);
      resolvedCases = 0;
    }
    
    // Calculate DCPT (Daily Cases per 1,000 Contributors) - simplified for speed
    // Skip for now to prevent timeout - can be calculated separately if needed
    let dcpt = 0;
    // TODO: Calculate DCPT in a separate endpoint if needed
    checkTimeout();
    
    // Calculate average age of unresolved cases
    // Use Status filter to match unresolved cases query
    const ageWhere = whereClause 
      ? `${whereClause} AND Status NOT IN ('Closed', 'Solved', 'Cancelled')` 
      : `WHERE Status NOT IN ('Closed', 'Solved', 'Cancelled')`;
    const ageQuery = `SELECT CreatedDate FROM Case ${ageWhere} LIMIT 10000`;
    let avgAge = 0;
    try {
      const ageResult = await conn.query(ageQuery);
      if (ageResult.records && ageResult.records.length > 0) {
        const now = new Date();
        let totalAge = 0;
        ageResult.records.forEach(record => {
          if (record.CreatedDate) {
            const created = new Date(record.CreatedDate);
            const age = (now - created) / (1000 * 60 * 60 * 24);
            totalAge += age;
          }
        });
        avgAge = totalAge / ageResult.records.length;
      }
    } catch (err) {
      console.error('Error calculating average age:', err);
    }
    
    setNoCacheHeaders(res);
    res.json({
      totalUnresolvedTickets: totalUnresolved,
      dcpt: dcpt,
      avgResolutionTime: avgResolutionTime,
      unresolvedWithinTargetSLA: withinTarget,
      backlogOverTargetSLA: overTarget,
      backlogOverExternalSLA: overExternal,
      totalBacklog: totalUnresolved,
      avgAgeUnresolved: avgAge,
      resolvedCases: resolvedCases,
      aht: avgResolutionTime,
      lastRefreshed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch KPIs',
      message: error.message 
    });
  }
}));

// Get daily new cases
router.get('/daily-new-cases', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    
    // Calculate date range (go back N days from today, including today)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to midnight for consistent date comparison
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1)); // Include today, so go back (days-1)
    startDate.setHours(0, 0, 0, 0);
    
    // Build WHERE clause - exclude date filter from buildWhereClause, then add our own date condition
    const whereConditions = buildWhereClause(req.query, true); // Exclude date filter
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    // Add end date to exclude future dates (today + 1 day at midnight)
    const queryEndDate = new Date(now);
    queryEndDate.setDate(queryEndDate.getDate() + 1);
    queryEndDate.setHours(0, 0, 0, 0);
    const isoEndDate = queryEndDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `CreatedDate >= ${isoDate} AND CreatedDate < ${isoEndDate}`;
    
    // Combine all conditions
    const conditions = [];
    if (whereConditions) {
      conditions.push(whereConditions);
    }
    conditions.push(dateCondition);
    const fullWhere = conditions.join(' AND ');
    
    // Query all cases and group by date in JavaScript (SOQL doesn't support DAY_ONLY)
    const query = `SELECT CreatedDate FROM Case WHERE ${fullWhere} LIMIT 100000`;
    console.log('=== DAILY NEW CASES QUERY ===');
    console.log('Query:', query);
    console.log('Date range:', startDate.toISOString().split('T')[0], 'to', now.toISOString().split('T')[0]);
    console.log('Request params:', JSON.stringify(req.query));
    
    let result = await conn.query(query);
    console.log(`Daily new cases - initial records: ${result.records ? result.records.length : 0}, totalSize: ${result.totalSize}, done: ${result.done}`);
    
    // Group by date (using local timezone for date extraction)
    const dateMap = {};
    if (result.records) {
      result.records.forEach(record => {
        if (record.CreatedDate) {
          // Parse the Salesforce date and convert to YYYY-MM-DD format
          // Salesforce dates are in UTC, so we need to handle timezone correctly
          const createdDate = new Date(record.CreatedDate);
          // Use UTC date to avoid timezone issues
          const year = createdDate.getUTCFullYear();
          const month = String(createdDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(createdDate.getUTCDate()).padStart(2, '0');
          const date = `${year}-${month}-${day}`;
          dateMap[date] = (dateMap[date] || 0) + 1;
        }
      });
    }
    
    // Handle pagination if there are more records
    let pageCount = 1;
    const MAX_PAGES = 10; // Limit pagination to prevent timeout
    while (result.done === false && result.nextRecordsUrl && pageCount < MAX_PAGES) {
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records) {
        result.records.forEach(record => {
          if (record.CreatedDate) {
            const createdDate = new Date(record.CreatedDate);
            const year = createdDate.getUTCFullYear();
            const month = String(createdDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(createdDate.getUTCDate()).padStart(2, '0');
            const date = `${year}-${month}-${day}`;
            dateMap[date] = (dateMap[date] || 0) + 1;
          }
        });
        pageCount++;
        console.log(`Daily new cases - page ${pageCount}, additional records: ${result.records.length}`);
      }
    }
    
    console.log('Daily new cases dateMap:', Object.keys(dateMap).length, 'dates');
    console.log('Sample dates and counts:', Object.entries(dateMap).slice(0, 10).map(([d, c]) => `${d}:${c}`).join(', '));
    
    // Fill in missing dates with 0 counts (from startDate to today, inclusive)
    const data = [];
    const dataEndDate = new Date(now);
    for (let d = new Date(startDate); d <= dataEndDate; d.setDate(d.getDate() + 1)) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      data.push({
        date: dateStr,
        count: dateMap[dateStr] || 0
      });
    }
    
    // Sort (oldest first, newest last)
    data.sort((a, b) => a.date.localeCompare(b.date));
    
    console.log('Daily new cases final data:', data.length, 'days, total cases:', data.reduce((sum, d) => sum + d.count, 0));
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching daily new cases:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch daily new cases',
      message: error.message 
    });
  }
}));

// Get daily resolved cases
router.get('/daily-resolved-cases', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereClause = buildWhereClause(req.query);
    
    // Calculate date range (go back N days from today, including today)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to midnight for consistent date comparison
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1)); // Include today, so go back (days-1)
    startDate.setHours(0, 0, 0, 0);
    
    // Query resolved cases and group by date
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const whereConditions = buildWhereClause(req.query, true);
    const dateCondition = `ClosedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${dateCondition}` : `IsClosed = true AND ${dateCondition}`;
    
    // Use higher limit and handle pagination
    const query = `SELECT ClosedDate FROM Case WHERE ${fullWhere} LIMIT 100000`;
    let result = await conn.query(query);
    
    // Group by date
    const dateMap = {};
    if (result.records) {
      result.records.forEach(record => {
        if (record.ClosedDate) {
          const date = new Date(record.ClosedDate).toISOString().split('T')[0];
          dateMap[date] = (dateMap[date] || 0) + 1;
        }
      });
    }
    
    // Handle pagination if there are more records
    while (result.done === false && result.nextRecordsUrl) {
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records) {
        result.records.forEach(record => {
          if (record.ClosedDate) {
            const date = new Date(record.ClosedDate).toISOString().split('T')[0];
            dateMap[date] = (dateMap[date] || 0) + 1;
          }
        });
      }
    }
    
    // Fill in missing dates with 0 counts (from startDate to today, inclusive)
    const data = [];
    const dataEndDate = new Date(now);
    for (let d = new Date(startDate); d <= dataEndDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        count: dateMap[dateStr] || 0
      });
    }
    
    // Sort (oldest first, newest last)
    data.sort((a, b) => a.date.localeCompare(b.date));
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching daily resolved cases:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch daily resolved cases',
      message: error.message 
    });
  }
}));

// Get case status breakdown
router.get('/case-status-breakdown', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
    
    // Query all cases and group by status in JavaScript
    const query = `SELECT Status FROM Case ${whereClause || 'WHERE Id != null'} LIMIT 10000`;
    const result = await conn.query(query);
    
    const statusMap = {};
    result.records.forEach(record => {
      const status = record.Status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    const data = Object.entries(statusMap).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching case status breakdown:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch case status breakdown',
      message: error.message 
    });
  }
}));

// Get unresolved SLA breakdown
router.get('/unresolved-sla-breakdown', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const baseWhere = whereConditions ? `WHERE ${whereConditions} AND IsClosed = false` : 'WHERE IsClosed = false';
    
    // Query all unresolved cases and group by SLA status
    const query = `SELECT SLA_Status__c FROM Case ${baseWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const statusMap = {};
    result.records.forEach(record => {
      const status = record.SLA_Status__c || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    const data = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0
    }));
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching unresolved SLA breakdown:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch unresolved SLA breakdown',
      message: error.message 
    });
  }
}));

// Get created and resolved by group
router.get('/created-resolved-by-group', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereClause = buildWhereClause(req.query);
    
    // Calculate date range
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const whereConditions = buildWhereClause(req.query, true);
    const createdDateCondition = `CreatedDate >= ${isoDate}`;
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    // Query created cases by group
    const createdWhere = whereConditions ? `${whereConditions} AND ${createdDateCondition}` : createdDateCondition;
    const createdQuery = `SELECT Group__c FROM Case WHERE ${createdWhere} LIMIT 10000`;
    const createdResult = await conn.query(createdQuery);
    const createdMap = {};
    createdResult.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      createdMap[group] = (createdMap[group] || 0) + 1;
    });
    
    // Query resolved cases by group
    const resolvedWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${closedDateCondition}` : `IsClosed = true AND ${closedDateCondition}`;
    const resolvedQuery = `SELECT Group__c FROM Case WHERE ${resolvedWhere} LIMIT 10000`;
    const resolvedResult = await conn.query(resolvedQuery);
    const resolvedMap = {};
    resolvedResult.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      resolvedMap[group] = (resolvedMap[group] || 0) + 1;
    });
    
    // Combine data
    const allGroups = new Set([...Object.keys(createdMap), ...Object.keys(resolvedMap)]);
    const data = Array.from(allGroups).map(group => ({
      group: group || 'Unknown',
      created: createdMap[group] || 0,
      resolved: resolvedMap[group] || 0,
      variance: (resolvedMap[group] || 0) - (createdMap[group] || 0)
    })).sort((a, b) => b.created - a.created);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching created/resolved by group:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch created/resolved by group',
      message: error.message 
    });
  }
}));

// Get average created and resolved by group
router.get('/avg-created-resolved-by-group', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereClause = buildWhereClause(req.query);
    
    // Calculate date range and days
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const whereConditions = buildWhereClause(req.query, true);
    const createdDateCondition = `CreatedDate >= ${isoDate}`;
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    // Query created cases by group
    const createdWhere = whereConditions ? `${whereConditions} AND ${createdDateCondition}` : createdDateCondition;
    const createdQuery = `SELECT Group__c FROM Case WHERE ${createdWhere} LIMIT 10000`;
    const createdResult = await conn.query(createdQuery);
    const createdMap = {};
    createdResult.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      createdMap[group] = (createdMap[group] || 0) + 1;
    });
    
    // Query resolved cases by group
    const resolvedWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${closedDateCondition}` : `IsClosed = true AND ${closedDateCondition}`;
    const resolvedQuery = `SELECT Group__c FROM Case WHERE ${resolvedWhere} LIMIT 10000`;
    const resolvedResult = await conn.query(resolvedQuery);
    const resolvedMap = {};
    resolvedResult.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      resolvedMap[group] = (resolvedMap[group] || 0) + 1;
    });
    
    // Calculate averages
    const allGroups = new Set([...Object.keys(createdMap), ...Object.keys(resolvedMap)]);
    const data = Array.from(allGroups).map(group => ({
      group: group || 'Unknown',
      avgCreated: Math.round((createdMap[group] || 0) / days * 10) / 10,
      avgResolved: Math.round((resolvedMap[group] || 0) / days * 10) / 10,
      variance: Math.round(((resolvedMap[group] || 0) - (createdMap[group] || 0)) / days * 10) / 10
    })).sort((a, b) => b.avgCreated - a.avgCreated);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching avg created/resolved by group:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch avg created/resolved by group',
      message: error.message 
    });
  }
}));

// Get median time by group
router.get('/median-time-by-group', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereClause = buildWhereClause(req.query);
    
    // Calculate date range
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const whereConditions = buildWhereClause(req.query, true);
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${closedDateCondition}` : `IsClosed = true AND ${closedDateCondition}`;
    
    // Query resolved cases with resolution time by group
    const query = `SELECT Group__c, CreatedDate, ClosedDate FROM Case WHERE ${fullWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    // Group by group and calculate median
    const groupMap = {};
    result.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      if (!groupMap[group]) groupMap[group] = [];
      if (record.CreatedDate && record.ClosedDate) {
        const created = new Date(record.CreatedDate);
        const closed = new Date(record.ClosedDate);
        const hours = (closed - created) / (1000 * 60 * 60);
        groupMap[group].push(hours);
      }
    });
    
    const data = Object.entries(groupMap).map(([group, times]) => {
      times.sort((a, b) => a - b);
      const median = times.length > 0 
        ? times.length % 2 === 0 
          ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
          : times[Math.floor(times.length / 2)]
        : 0;
      return {
        group,
        past7Days: timeRange === 'past-7-days' ? Math.round(median) : null,
        past30: timeRange === 'past-30-days' ? Math.round(median) : null,
        past90: timeRange === 'past-90-days' ? Math.round(median) : null,
        past180: timeRange === 'past-180-days' ? Math.round(median) : null
      };
    });
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching median time by group:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch median time by group',
      message: error.message 
    });
  }
}));

// Get created and resolved by reason
router.get('/created-resolved-by-reason', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const createdDateCondition = `CreatedDate >= ${isoDate}`;
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    // Build WHERE clause properly
    const createdWhereParts = [createdDateCondition];
    if (whereConditions) {
      createdWhereParts.unshift(whereConditions);
    }
    const createdWhere = createdWhereParts.join(' AND ');
    const createdQuery = `SELECT Case_Reason__c FROM Case WHERE ${createdWhere} LIMIT 10000`;
    
    let createdResult;
    try {
      createdResult = await conn.query(createdQuery);
    } catch (queryError) {
      console.error('Error in created query:', queryError);
      console.error('Query was:', createdQuery);
      throw queryError;
    }
    
    const createdMap = {};
    if (createdResult.records) {
      createdResult.records.forEach(record => {
        const reason = record.Case_Reason__c || 'Unknown';
        createdMap[reason] = (createdMap[reason] || 0) + 1;
      });
    }
    
    // Build resolved WHERE clause
    const resolvedWhereParts = ['IsClosed = true', closedDateCondition];
    if (whereConditions) {
      resolvedWhereParts.unshift(whereConditions);
    }
    const resolvedWhere = resolvedWhereParts.join(' AND ');
    const resolvedQuery = `SELECT Case_Reason__c FROM Case WHERE ${resolvedWhere} LIMIT 10000`;
    
    let resolvedResult;
    try {
      resolvedResult = await conn.query(resolvedQuery);
    } catch (queryError) {
      console.error('Error in resolved query:', queryError);
      console.error('Query was:', resolvedQuery);
      throw queryError;
    }
    
    const resolvedMap = {};
    if (resolvedResult.records) {
      resolvedResult.records.forEach(record => {
        const reason = record.Case_Reason__c || 'Unknown';
        resolvedMap[reason] = (resolvedMap[reason] || 0) + 1;
      });
    }
    
    const allReasons = new Set([...Object.keys(createdMap), ...Object.keys(resolvedMap)]);
    const data = Array.from(allReasons).map(reason => ({
      reason: reason || 'Unknown',
      created: createdMap[reason] || 0,
      resolved: resolvedMap[reason] || 0,
      variance: (resolvedMap[reason] || 0) - (createdMap[reason] || 0)
    })).sort((a, b) => b.created - a.created);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching created/resolved by reason:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch created/resolved by reason', message: error.message, details: error.stack });
  }
}));

// Get average created and resolved by reason
router.get('/avg-created-resolved-by-reason', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const createdDateCondition = `CreatedDate >= ${isoDate}`;
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    // Build WHERE clause properly
    const createdWhereParts = [createdDateCondition];
    if (whereConditions) {
      createdWhereParts.unshift(whereConditions);
    }
    const createdWhere = createdWhereParts.join(' AND ');
    const createdQuery = `SELECT Case_Reason__c FROM Case WHERE ${createdWhere} LIMIT 10000`;
    
    let createdResult;
    try {
      createdResult = await conn.query(createdQuery);
    } catch (queryError) {
      console.error('Error in created query:', queryError);
      console.error('Query was:', createdQuery);
      throw queryError;
    }
    
    const createdMap = {};
    if (createdResult.records) {
      createdResult.records.forEach(record => {
        const reason = record.Case_Reason__c || 'Unknown';
        createdMap[reason] = (createdMap[reason] || 0) + 1;
      });
    }
    
    // Build resolved WHERE clause
    const resolvedWhereParts = ['IsClosed = true', closedDateCondition];
    if (whereConditions) {
      resolvedWhereParts.unshift(whereConditions);
    }
    const resolvedWhere = resolvedWhereParts.join(' AND ');
    const resolvedQuery = `SELECT Case_Reason__c FROM Case WHERE ${resolvedWhere} LIMIT 10000`;
    
    let resolvedResult;
    try {
      resolvedResult = await conn.query(resolvedQuery);
    } catch (queryError) {
      console.error('Error in resolved query:', queryError);
      console.error('Query was:', resolvedQuery);
      throw queryError;
    }
    
    const resolvedMap = {};
    if (resolvedResult.records) {
      resolvedResult.records.forEach(record => {
        const reason = record.Case_Reason__c || 'Unknown';
        resolvedMap[reason] = (resolvedMap[reason] || 0) + 1;
      });
    }
    
    const allReasons = new Set([...Object.keys(createdMap), ...Object.keys(resolvedMap)]);
    const data = Array.from(allReasons).map(reason => ({
      reason: reason || 'Unknown',
      avgCreated: Math.round((createdMap[reason] || 0) / days * 10) / 10,
      avgResolved: Math.round((resolvedMap[reason] || 0) / days * 10) / 10,
      variance: Math.round(((resolvedMap[reason] || 0) - (createdMap[reason] || 0)) / days * 10) / 10
    })).sort((a, b) => b.avgCreated - a.avgCreated);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching avg created/resolved by reason:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch avg created/resolved by reason', message: error.message, details: error.stack });
  }
}));

// Get median time by reason
router.get('/median-time-by-reason', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    // Build WHERE clause properly
    const whereParts = ['IsClosed = true', closedDateCondition];
    if (whereConditions) {
      whereParts.unshift(whereConditions);
    }
    const fullWhere = whereParts.join(' AND ');
    
    const query = `SELECT Case_Reason__c, CreatedDate, ClosedDate FROM Case WHERE ${fullWhere} LIMIT 10000`;
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      console.error('Error in median time query:', queryError);
      console.error('Query was:', query);
      throw queryError;
    }
    
    const reasonMap = {};
    if (result.records) {
      result.records.forEach(record => {
        const reason = record.Case_Reason__c || 'Unknown';
        if (!reasonMap[reason]) reasonMap[reason] = [];
        if (record.CreatedDate && record.ClosedDate) {
          const created = new Date(record.CreatedDate);
          const closed = new Date(record.ClosedDate);
          const hours = (closed - created) / (1000 * 60 * 60);
          reasonMap[reason].push(hours);
        }
      });
    }
    
    const data = Object.entries(reasonMap).map(([reason, times]) => {
      times.sort((a, b) => a - b);
      const median = times.length > 0 
        ? times.length % 2 === 0 
          ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
          : times[Math.floor(times.length / 2)]
        : 0;
      return {
        reason,
        targetSLA: 48,
        past7Days: timeRange === 'past-7-days' ? Math.round(median) : null,
        past30: timeRange === 'past-30-days' ? Math.round(median) : null,
        past90: timeRange === 'past-90-days' ? Math.round(median) : null,
        past180: timeRange === 'past-180-days' ? Math.round(median) : null
      };
    });
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching median time by reason:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch median time by reason', message: error.message, details: error.stack });
  }
}));

// Get created and resolved by type
router.get('/created-resolved-by-type', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const createdDateCondition = `CreatedDate >= ${isoDate}`;
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    const createdWhere = whereConditions ? `${whereConditions} AND ${createdDateCondition}` : createdDateCondition;
    const createdQuery = `SELECT Type FROM Case WHERE ${createdWhere} LIMIT 10000`;
    const createdResult = await conn.query(createdQuery);
    const createdMap = {};
    createdResult.records.forEach(record => {
      const type = record.Type || 'Unknown';
      createdMap[type] = (createdMap[type] || 0) + 1;
    });
    
    const resolvedWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${closedDateCondition}` : `IsClosed = true AND ${closedDateCondition}`;
    const resolvedQuery = `SELECT Type FROM Case WHERE ${resolvedWhere} LIMIT 10000`;
    const resolvedResult = await conn.query(resolvedQuery);
    const resolvedMap = {};
    resolvedResult.records.forEach(record => {
      const type = record.Type || 'Unknown';
      resolvedMap[type] = (resolvedMap[type] || 0) + 1;
    });
    
    const allTypes = new Set([...Object.keys(createdMap), ...Object.keys(resolvedMap)]);
    const data = Array.from(allTypes).map(type => ({
      type: type || 'Unknown',
      created: createdMap[type] || 0,
      resolved: resolvedMap[type] || 0,
      variance: (resolvedMap[type] || 0) - (createdMap[type] || 0)
    })).sort((a, b) => b.created - a.created);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching created/resolved by type:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch created/resolved by type', message: error.message });
  }
}));

// Get average created and resolved by type
router.get('/avg-created-resolved-by-type', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const createdDateCondition = `CreatedDate >= ${isoDate}`;
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    
    const createdWhere = whereConditions ? `${whereConditions} AND ${createdDateCondition}` : createdDateCondition;
    const createdQuery = `SELECT Type FROM Case WHERE ${createdWhere} LIMIT 10000`;
    const createdResult = await conn.query(createdQuery);
    const createdMap = {};
    createdResult.records.forEach(record => {
      const type = record.Type || 'Unknown';
      createdMap[type] = (createdMap[type] || 0) + 1;
    });
    
    const resolvedWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${closedDateCondition}` : `IsClosed = true AND ${closedDateCondition}`;
    const resolvedQuery = `SELECT Type FROM Case WHERE ${resolvedWhere} LIMIT 10000`;
    const resolvedResult = await conn.query(resolvedQuery);
    const resolvedMap = {};
    resolvedResult.records.forEach(record => {
      const type = record.Type || 'Unknown';
      resolvedMap[type] = (resolvedMap[type] || 0) + 1;
    });
    
    const allTypes = new Set([...Object.keys(createdMap), ...Object.keys(resolvedMap)]);
    const data = Array.from(allTypes).map(type => ({
      type: type || 'Unknown',
      avgCreated: Math.round((createdMap[type] || 0) / days * 10) / 10,
      avgResolved: Math.round((resolvedMap[type] || 0) / days * 10) / 10,
      variance: Math.round(((resolvedMap[type] || 0) - (createdMap[type] || 0)) / days * 10) / 10
    })).sort((a, b) => b.avgCreated - a.avgCreated);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching avg created/resolved by type:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch avg created/resolved by type', message: error.message });
  }
}));

// Get median time by type
router.get('/median-time-by-type', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-180-days') days = 180;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const closedDateCondition = `ClosedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND IsClosed = true AND ${closedDateCondition}` : `IsClosed = true AND ${closedDateCondition}`;
    
    const query = `SELECT Type, CreatedDate, ClosedDate FROM Case WHERE ${fullWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const typeMap = {};
    result.records.forEach(record => {
      const type = record.Type || 'Unknown';
      if (!typeMap[type]) typeMap[type] = [];
      if (record.CreatedDate && record.ClosedDate) {
        const created = new Date(record.CreatedDate);
        const closed = new Date(record.ClosedDate);
        const hours = (closed - created) / (1000 * 60 * 60);
        typeMap[type].push(hours);
      }
    });
    
    const data = Object.entries(typeMap).map(([type, times]) => {
      times.sort((a, b) => a - b);
      const median = times.length > 0 
        ? times.length % 2 === 0 
          ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
          : times[Math.floor(times.length / 2)]
        : 0;
      return {
        type,
        past7Days: timeRange === 'past-7-days' ? Math.round(median) : null,
        past30: timeRange === 'past-30-days' ? Math.round(median) : null,
        past90: timeRange === 'past-90-days' ? Math.round(median) : null,
        past180: timeRange === 'past-180-days' ? Math.round(median) : null
      };
    });
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching median time by type:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch median time by type', message: error.message });
  }
}));

// Placeholder endpoints for other views - will implement based on actual Salesforce Case object structure
router.get('/unresolved-by-group', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const baseWhere = whereConditions ? `WHERE ${whereConditions} AND IsClosed = false` : 'WHERE IsClosed = false';
    
    const query = `SELECT Group__c, SLA_Status__c FROM Case ${baseWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const groupMap = {};
    result.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      if (!groupMap[group]) {
        groupMap[group] = { within: 0, overTarget: 0, overExternal: 0 };
      }
      const slaStatus = record.SLA_Status__c || '';
      if (slaStatus.includes('Within') || slaStatus === 'Within SLA') {
        groupMap[group].within++;
      } else if (slaStatus.includes('Over Target')) {
        groupMap[group].overTarget++;
      } else if (slaStatus.includes('Over External') || slaStatus === 'Over SLA') {
        groupMap[group].overExternal++;
      }
    });
    
    const data = Object.entries(groupMap).map(([group, counts]) => ({
      group,
      within: counts.within,
      overTarget: counts.overTarget,
      overExternal: counts.overExternal
    }));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching unresolved by group:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch unresolved by group', message: error.message });
  }
}));

router.get('/unresolved-by-type', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const baseWhere = whereConditions ? `WHERE ${whereConditions} AND IsClosed = false` : 'WHERE IsClosed = false';
    
    const query = `SELECT Type, SLA_Status__c FROM Case ${baseWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const typeMap = {};
    result.records.forEach(record => {
      const type = record.Type || 'Unknown';
      if (!typeMap[type]) {
        typeMap[type] = { within: 0, overTarget: 0, overExternal: 0 };
      }
      const slaStatus = record.SLA_Status__c || '';
      if (slaStatus.includes('Within') || slaStatus === 'Within SLA') {
        typeMap[type].within++;
      } else if (slaStatus.includes('Over Target')) {
        typeMap[type].overTarget++;
      } else if (slaStatus.includes('Over External') || slaStatus === 'Over SLA') {
        typeMap[type].overExternal++;
      }
    });
    
    const data = Object.entries(typeMap).map(([type, counts]) => ({
      type,
      within: counts.within,
      overTarget: counts.overTarget,
      overExternal: counts.overExternal
    }));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching unresolved by type:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch unresolved by type', message: error.message });
  }
}));

router.get('/backlog-by-client', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const baseWhere = whereConditions ? `WHERE ${whereConditions} AND IsClosed = false` : 'WHERE IsClosed = false';
    
    const query = `SELECT Account.Name, SLA_Status__c FROM Case ${baseWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const clientMap = {};
    result.records.forEach(record => {
      const client = record.Account?.Name || 'Unknown';
      if (!clientMap[client]) {
        clientMap[client] = { within: 0, overTarget: 0, overExternal: 0 };
      }
      const slaStatus = record.SLA_Status__c || '';
      if (slaStatus.includes('Within') || slaStatus === 'Within SLA') {
        clientMap[client].within++;
      } else if (slaStatus.includes('Over Target')) {
        clientMap[client].overTarget++;
      } else if (slaStatus.includes('Over External') || slaStatus === 'Over SLA') {
        clientMap[client].overExternal++;
      }
    });
    
    const data = Object.entries(clientMap).map(([client, counts]) => ({
      client,
      within: counts.within,
      overTarget: counts.overTarget,
      overExternal: counts.overExternal
    })).sort((a, b) => (b.within + b.overTarget + b.overExternal) - (a.within + a.overTarget + a.overExternal));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching backlog by client:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch backlog by client', message: error.message });
  }
}));

router.get('/historical-backlog', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-365-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 365;
    if (timeRange === 'past-3-days') days = 3;
    if (timeRange === 'past-7-days') days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `CreatedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND ${dateCondition}` : dateCondition;
    
    const query = `SELECT CreatedDate, IsClosed, SLA_Status__c FROM Case WHERE ${fullWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const dateMap = {};
    result.records.forEach(record => {
      const date = new Date(record.CreatedDate).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { unresolved: 0, backlog: 0, historical: 0 };
      }
      if (!record.IsClosed) {
        dateMap[date].unresolved++;
        const slaStatus = record.SLA_Status__c || '';
        if (slaStatus.includes('Over') || slaStatus === 'Over SLA') {
          dateMap[date].backlog++;
        }
      }
      dateMap[date].historical++;
    });
    
    const data = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      unresolved: counts.unresolved,
      backlog: counts.backlog,
      historical: counts.historical
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical backlog:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch historical backlog', message: error.message });
  }
}));

router.get('/on-hold-reasons', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const baseWhere = whereConditions ? `WHERE ${whereConditions} AND Status = 'On Hold'` : "WHERE Status = 'On Hold'";
    
    const query = `SELECT On_Hold_Reason__c, SLA_Status__c FROM Case ${baseWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const reasonMap = {};
    result.records.forEach(record => {
      const reason = record.On_Hold_Reason__c || 'Unknown';
      if (!reasonMap[reason]) {
        reasonMap[reason] = { within: 0, overTarget: 0, overExternal: 0 };
      }
      const slaStatus = record.SLA_Status__c || '';
      if (slaStatus.includes('Within') || slaStatus === 'Within SLA') {
        reasonMap[reason].within++;
      } else if (slaStatus.includes('Over Target')) {
        reasonMap[reason].overTarget++;
      } else if (slaStatus.includes('Over External') || slaStatus === 'Over SLA') {
        reasonMap[reason].overExternal++;
      }
    });
    
    const data = Object.entries(reasonMap).map(([reason, counts]) => ({
      reason,
      within: counts.within,
      overTarget: counts.overTarget,
      overExternal: counts.overExternal
    })).sort((a, b) => (b.within + b.overTarget + b.overExternal) - (a.within + a.overTarget + a.overExternal));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching on-hold reasons:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch on-hold reasons', message: error.message });
  }
}));

router.get('/agent-performance', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
    
    const query = `SELECT Owner.Name, CreatedDate, ClosedDate, Status, SLA_Status__c FROM Case ${whereClause} LIMIT 10000`;
    const result = await conn.query(query);
    
    const agentMap = {};
    result.records.forEach(record => {
      const agent = record.Owner?.Name || 'Unknown';
      if (!agentMap[agent]) {
        agentMap[agent] = {
          total: 0,
          resolved: 0,
          unresolved: 0,
          unresolvedWithin: 0,
          unresolvedOver: 0,
          totalResolutionTime: 0,
          resolutionCount: 0
        };
      }
      agentMap[agent].total++;
      if (record.Status === 'Closed' || record.IsClosed) {
        agentMap[agent].resolved++;
        if (record.CreatedDate && record.ClosedDate) {
          const created = new Date(record.CreatedDate);
          const closed = new Date(record.ClosedDate);
          const days = (closed - created) / (1000 * 60 * 60 * 24);
          agentMap[agent].totalResolutionTime += days;
          agentMap[agent].resolutionCount++;
        }
      } else {
        agentMap[agent].unresolved++;
        const slaStatus = record.SLA_Status__c || '';
        if (slaStatus.includes('Within') || slaStatus === 'Within SLA') {
          agentMap[agent].unresolvedWithin++;
        } else {
          agentMap[agent].unresolvedOver++;
        }
      }
    });
    
    const data = Object.entries(agentMap).map(([agent, stats]) => ({
      agent,
      avgResolutionTime: stats.resolutionCount > 0 ? stats.totalResolutionTime / stats.resolutionCount : 0,
      slaPerformance: stats.total > 0 ? ((stats.resolved - stats.unresolvedOver) / stats.total * 100) : 0,
      historicalTicketCount: stats.total,
      resolvedPast7Days: 0, // Would need date filtering
      historicalResolved: stats.resolved,
      unresolvedWithinSLA: stats.unresolvedWithin,
      unresolvedOverSLA: stats.unresolvedOver
    }));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch agent performance', message: error.message });
  }
}));

router.get('/cases-touched-by-agent', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-30-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 30;
    if (timeRange === 'past-7-days') days = 7;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-365-days') days = 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `LastModifiedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND ${dateCondition}` : dateCondition;
    
    const query = `SELECT Owner.Name, Status FROM Case WHERE ${fullWhere} LIMIT 10000`;
    const result = await conn.query(query);
    
    const agentMap = {};
    result.records.forEach(record => {
      const agent = record.Owner?.Name || 'Unknown';
      if (!agentMap[agent]) {
        agentMap[agent] = { new: 0, open: 0, merged: 0, onHold: 0, pending: 0, solved: 0, closed: 0, blocked: 0 };
      }
      const status = record.Status || '';
      if (status === 'New') agentMap[agent].new++;
      else if (status === 'Open') agentMap[agent].open++;
      else if (status === 'Merged') agentMap[agent].merged++;
      else if (status === 'On Hold') agentMap[agent].onHold++;
      else if (status === 'Pending') agentMap[agent].pending++;
      else if (status === 'Solved' || status === 'Closed') agentMap[agent].solved++;
      else if (status === 'Blocked') agentMap[agent].blocked++;
    });
    
    const data = Object.entries(agentMap).map(([agent, counts]) => ({
      agent,
      ...counts
    }));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching cases touched by agent:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch cases touched by agent', message: error.message });
  }
}));

router.get('/case-analytics-list', authenticate, asyncHandler(async (req, res) => {
  // Set a timeout for this endpoint
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 60000; // 60 seconds max
  
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
    
    // Helper to check if we're running out of time
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        throw new Error('Query timeout - taking too long');
      }
    };
    
    checkTimeout();
    
    // Use a more reasonable limit and handle pagination
    const query = `SELECT CaseNumber, Type, Project__r.Name, Status, Case_Reason__c, Id FROM Case ${whereClause} ORDER BY CaseNumber DESC LIMIT 5000`;
    console.log('=== CASE ANALYTICS LIST QUERY ===');
    console.log('Query:', query);
    
    let result = await conn.query(query);
    checkTimeout();
    
    let allRecords = [...(result.records || [])];
    let pageCount = 0;
    const MAX_PAGES = 5; // Limit pagination to prevent timeout
    
    // Handle pagination if there are more records
    while (result.done === false && result.nextRecordsUrl && pageCount < MAX_PAGES) {
      checkTimeout();
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records) {
        allRecords = allRecords.concat(result.records);
      }
      pageCount++;
    }
    
    const data = allRecords.map((record, idx) => ({
      id: idx + 1,
      caseNumber: record.CaseNumber || '',
      caseType: record.Type || '',
      projectName: record.Project__r?.Name || '-',
      caseStatus: record.Status || '',
      caseReason: record.Case_Reason__c || '',
      caseId: record.Id || ''
    }));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching case analytics list:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch case analytics list', 
      message: error.message 
    });
  }
}));

router.get('/unresolved-solved-by-agent', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
    
    const query = `SELECT Owner.Name, Status, SLA_Status__c, CreatedDate FROM Case ${whereClause} LIMIT 10000`;
    const result = await conn.query(query);
    
    const agentMap = {};
    result.records.forEach(record => {
      const agent = record.Owner?.Name || 'Unknown';
      if (!agentMap[agent]) {
        agentMap[agent] = {
          unresolved: 0,
          unresolvedWithin: 0,
          unresolvedOverTarget: 0,
          unresolvedOverExternal: 0,
          solvedThisWeek: 0,
          solved: 0
        };
      }
      if (record.Status !== 'Closed' && !record.IsClosed) {
        agentMap[agent].unresolved++;
        const slaStatus = record.SLA_Status__c || '';
        if (slaStatus.includes('Within') || slaStatus === 'Within SLA') {
          agentMap[agent].unresolvedWithin++;
        } else if (slaStatus.includes('Over Target')) {
          agentMap[agent].unresolvedOverTarget++;
        } else if (slaStatus.includes('Over External') || slaStatus === 'Over SLA') {
          agentMap[agent].unresolvedOverExternal++;
        }
      } else {
        agentMap[agent].solved++;
        const created = new Date(record.CreatedDate);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (created >= weekAgo) {
          agentMap[agent].solvedThisWeek++;
        }
      }
    });
    
    const data = Object.entries(agentMap).map(([agent, stats]) => ({
      agent,
      unresolved: stats.unresolved,
      unresolvedWithin: stats.unresolvedWithin,
      unresolvedOverTarget: stats.unresolvedOverTarget,
      unresolvedOverExternal: stats.unresolvedOverExternal,
      solvedThisWeek: stats.solvedThisWeek,
      solved: stats.solved
    }));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching unresolved/solved by agent:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch unresolved/solved by agent', message: error.message });
  }
}));

router.get('/automated-case-actions', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    // Calculate date range (go back N days from today, including today)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-365-days') days = 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1)); // Include today
    startDate.setHours(0, 0, 0, 0);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `CreatedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND ${dateCondition}` : dateCondition;
    
    // Try to query with Automation_Type__c, fallback if field doesn't exist
    let query, result;
    try {
      query = `SELECT CreatedDate, Status, Automation_Type__c FROM Case WHERE ${fullWhere} LIMIT 10000`;
      console.log('Automated case actions query:', query);
      result = await conn.query(query);
    } catch (error) {
      // If Automation_Type__c doesn't exist, query without it and treat all as manual
      console.log('Automation_Type__c field not found, querying without it. Error:', error.message);
      console.log('Error details:', JSON.stringify(error, null, 2));
      try {
        query = `SELECT CreatedDate, Status FROM Case WHERE ${fullWhere} LIMIT 10000`;
        console.log('Fallback query:', query);
        result = await conn.query(query);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    
    const dateMap = {};
    result.records.forEach(record => {
      const date = new Date(record.CreatedDate).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { automated: 0, manual: 0, reopened: 0, solved: 0 };
      }
      const isAutomated = record.Automation_Type__c && record.Automation_Type__c !== 'Manual';
      if (isAutomated) {
        dateMap[date].automated++;
        if (record.Status === 'Reopened') dateMap[date].reopened++;
        if (record.Status === 'Closed' || record.Status === 'Solved') dateMap[date].solved++;
      } else {
        dateMap[date].manual++;
      }
    });
    
    // Fill in missing dates with 0 counts (from startDate to today, inclusive)
    const allDates = [];
    const endDate = new Date(now);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      allDates.push(dateStr);
    }
    
    const data = allDates.map(date => ({
      date,
      automated: dateMap[date]?.automated || 0,
      manual: dateMap[date]?.manual || 0,
      reopened: dateMap[date]?.reopened || 0,
      solved: dateMap[date]?.solved || 0
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching automated case actions:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch automated case actions', message: error.message, details: error.toString() });
  }
}));

router.get('/avg-automated-actions-by-reason', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    const now = new Date();
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    if (timeRange === 'past-365-days') days = 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `CreatedDate >= ${isoDate}`;
    const fullWhere = whereConditions ? `${whereConditions} AND ${dateCondition}` : dateCondition;
    
    // Try to query with Automation_Type__c, fallback if field doesn't exist
    let query, result;
    try {
      query = `SELECT Case_Reason__c, Automation_Type__c FROM Case WHERE ${fullWhere} LIMIT 10000`;
      console.log('Avg automated actions by reason query:', query);
      result = await conn.query(query);
    } catch (error) {
      // If Automation_Type__c doesn't exist, query without it and treat all as manual
      console.log('Automation_Type__c field not found, querying without it. Error:', error.message);
      console.log('Error details:', JSON.stringify(error, null, 2));
      try {
        query = `SELECT Case_Reason__c FROM Case WHERE ${fullWhere} LIMIT 10000`;
        console.log('Fallback query:', query);
        result = await conn.query(query);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    
    const reasonMap = {};
    result.records.forEach(record => {
      const reason = record.Case_Reason__c || 'Unknown';
      if (!reasonMap[reason]) {
        reasonMap[reason] = { automated: 0, manual: 0 };
      }
      const isAutomated = record.Automation_Type__c && record.Automation_Type__c !== 'Manual';
      if (isAutomated) {
        reasonMap[reason].automated++;
      } else {
        reasonMap[reason].manual++;
      }
    });
    
    const data = Object.entries(reasonMap).map(([reason, counts]) => ({
      reason,
      automated: Math.round((counts.automated / days) * 10) / 10,
      manual: Math.round((counts.manual / days) * 10) / 10
    })).sort((a, b) => (b.automated + b.manual) - (a.automated + a.manual));
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching avg automated actions by reason:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch avg automated actions by reason', message: error.message, details: error.toString() });
  }
}));

router.get('/on-hold-cases-outside-sla', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const whereConditions = buildWhereClause(req.query, true);
    const baseWhere = whereConditions ? `WHERE ${whereConditions} AND Status = 'On Hold'` : "WHERE Status = 'On Hold'";
    
    // Try to query with On_Hold_Duration_Hours__c, fallback if field doesn't exist
    let query, result;
    try {
      query = `SELECT Group__c, On_Hold_Duration_Hours__c FROM Case ${baseWhere} LIMIT 10000`;
      console.log('On-hold cases outside SLA query:', query);
      result = await conn.query(query);
    } catch (error) {
      // If On_Hold_Duration_Hours__c doesn't exist, calculate from CreatedDate
      console.log('On_Hold_Duration_Hours__c field not found, calculating from CreatedDate. Error:', error.message);
      console.log('Error details:', JSON.stringify(error, null, 2));
      try {
        query = `SELECT Group__c, CreatedDate FROM Case ${baseWhere} LIMIT 10000`;
        console.log('Fallback query:', query);
        result = await conn.query(query);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    
    const groupMap = {};
    const now = new Date();
    result.records.forEach(record => {
      const group = record.Group__c || 'Unknown';
      let hours = 0;
      if (record.On_Hold_Duration_Hours__c !== undefined && record.On_Hold_Duration_Hours__c !== null) {
        hours = record.On_Hold_Duration_Hours__c || 0;
      } else if (record.CreatedDate) {
        // Calculate hours from CreatedDate
        const createdDate = new Date(record.CreatedDate);
        hours = (now - createdDate) / (1000 * 60 * 60); // Convert milliseconds to hours
      }
      if (hours > 48) { // Outside 48hr SLA
        groupMap[group] = (groupMap[group] || 0) + 1;
      }
    });
    
    const data = Object.entries(groupMap).map(([group, count]) => ({
      group,
      count
    })).sort((a, b) => b.count - a.count);
    
    setNoCacheHeaders(res);
    res.json(data);
  } catch (error) {
    console.error('Error fetching on-hold cases outside SLA:', error);
    console.error('Error stack:', error.stack);
    setNoCacheHeaders(res);
    res.status(500).json({ success: false, error: 'Failed to fetch on-hold cases outside SLA', message: error.message, details: error.toString() });
  }
}));

// Get filter options for Case Analytics Dashboard
router.get('/filter-options', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const filterOptions = {
      caseStatus: [],
      caseType: [],
      caseReason: [],
      group: [],
      projectName: [],
      accountName: [],
      caseOwner: [],
      caseTag: []
    };
    
    try {
      // Get Case object describe to get picklist values
      const caseDescribe = await conn.sobject('Case').describe();
      
      // Get Status picklist values
      const statusField = caseDescribe.fields.find(f => f.name === 'Status');
      if (statusField && statusField.picklistValues) {
        filterOptions.caseStatus = statusField.picklistValues
          .map(pv => pv.value)
          .filter(v => v && v !== null && v !== '');
      }
      
      // Get Type picklist values
      const typeField = caseDescribe.fields.find(f => f.name === 'Type');
      if (typeField && typeField.picklistValues) {
        filterOptions.caseType = typeField.picklistValues
          .map(pv => pv.value)
          .filter(v => v && v !== null && v !== '');
      }
      
      // Get Case_Reason__c picklist values
      const reasonField = caseDescribe.fields.find(f => f.name === 'Case_Reason__c');
      if (reasonField && reasonField.picklistValues) {
        filterOptions.caseReason = reasonField.picklistValues
          .map(pv => pv.value)
          .filter(v => v && v !== null && v !== '');
      }
      
      // Get Group__c picklist values
      const groupField = caseDescribe.fields.find(f => f.name === 'Group__c');
      if (groupField && groupField.picklistValues) {
        filterOptions.group = groupField.picklistValues
          .map(pv => pv.value)
          .filter(v => v && v !== null && v !== '');
      }
    } catch (describeErr) {
      console.error('Error describing Case object for filter options:', describeErr);
    }
    
    // Get distinct Project Names from Case records
    try {
      const projectQuery = `SELECT Project__r.Name FROM Case WHERE Project__c != null AND Project__r.Name != null LIMIT 10000`;
      const projectResult = await conn.query(projectQuery);
      const projectNames = new Set();
      if (projectResult.records) {
        projectResult.records.forEach(record => {
          if (record.Project__r?.Name) {
            projectNames.add(record.Project__r.Name);
          }
        });
      }
      filterOptions.projectName = Array.from(projectNames).sort();
    } catch (err) {
      console.error('Error fetching project names:', err);
    }
    
    // Get distinct Account Names from Case records
    try {
      const accountQuery = `SELECT Account.Name FROM Case WHERE AccountId != null AND Account.Name != null LIMIT 10000`;
      const accountResult = await conn.query(accountQuery);
      const accountNames = new Set();
      if (accountResult.records) {
        accountResult.records.forEach(record => {
          if (record.Account?.Name) {
            accountNames.add(record.Account.Name);
          }
        });
      }
      filterOptions.accountName = Array.from(accountNames).sort();
    } catch (err) {
      console.error('Error fetching account names:', err);
    }
    
    // Get distinct Case Owners from Case records
    try {
      const ownerQuery = `SELECT Owner.Name FROM Case WHERE OwnerId != null AND Owner.Name != null LIMIT 10000`;
      const ownerResult = await conn.query(ownerQuery);
      const ownerNames = new Set();
      if (ownerResult.records) {
        ownerResult.records.forEach(record => {
          if (record.Owner?.Name) {
            ownerNames.add(record.Owner.Name);
          }
        });
      }
      filterOptions.caseOwner = Array.from(ownerNames).sort();
    } catch (err) {
      console.error('Error fetching case owners:', err);
    }
    
    // Get distinct Tags from Case records (if Tags field exists)
    try {
      const tagsQuery = `SELECT Tags FROM Case WHERE Tags != null LIMIT 10000`;
      const tagsResult = await conn.query(tagsQuery);
      const tagSet = new Set();
      if (tagsResult.records) {
        tagsResult.records.forEach(record => {
          if (record.Tags) {
            // Tags might be comma-separated
            const tags = record.Tags.split(',').map(t => t.trim()).filter(t => t);
            tags.forEach(tag => tagSet.add(tag));
          }
        });
      }
      filterOptions.caseTag = Array.from(tagSet).sort();
    } catch (err) {
      console.error('Error fetching case tags:', err);
      // Tags field might not exist, that's okay
    }
    
    setNoCacheHeaders(res);
    res.json(filterOptions);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch filter options',
      message: error.message 
    });
  }
}));

// Get daily solved cases by project
router.get('/daily-solved-by-project', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    // Calculate date range
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `ClosedDate >= ${isoDate} AND IsClosed = true AND ClosedDate != null`;
    
    // Combine all conditions
    const conditions = [];
    if (whereConditions) {
      conditions.push(whereConditions);
    }
    conditions.push(dateCondition);
    const fullWhere = conditions.join(' AND ');
    
    const query = `SELECT Project__r.Name, ClosedDate FROM Case WHERE ${fullWhere} LIMIT 100000`;
    console.log('=== DAILY SOLVED BY PROJECT QUERY ===');
    console.log('Query:', query);
    
    let result = await conn.query(query);
    
    // Generate date columns
    const dateColumns = [];
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      dateColumns.push(d.toISOString().split('T')[0]);
    }
    
    // Group by project and date
    const projectMap = {};
    if (result.records) {
      result.records.forEach(record => {
        if (record.ClosedDate) {
          const projectName = record.Project__r?.Name || 'Unknown';
          const date = new Date(record.ClosedDate).toISOString().split('T')[0];
          
          if (!projectMap[projectName]) {
            projectMap[projectName] = {};
            dateColumns.forEach(col => {
              projectMap[projectName][col] = 0;
            });
          }
          if (projectMap[projectName][date] !== undefined) {
            projectMap[projectName][date] = (projectMap[projectName][date] || 0) + 1;
          }
        }
      });
    }
    
    // Handle pagination
    while (result.done === false && result.nextRecordsUrl) {
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records) {
        result.records.forEach(record => {
          if (record.ClosedDate) {
            const projectName = record.Project__r?.Name || 'Unknown';
            const date = new Date(record.ClosedDate).toISOString().split('T')[0];
            
            if (!projectMap[projectName]) {
              projectMap[projectName] = {};
              dateColumns.forEach(col => {
                projectMap[projectName][col] = 0;
              });
            }
            if (projectMap[projectName][date] !== undefined) {
              projectMap[projectName][date] = (projectMap[projectName][date] || 0) + 1;
            }
          }
        });
      }
    }
    
    // Convert to array format
    const data = Object.keys(projectMap).map(projectName => ({
      projectName,
      ...projectMap[projectName]
    })).sort((a, b) => a.projectName.localeCompare(b.projectName));
    
    setNoCacheHeaders(res);
    res.json({ data, dateColumns });
  } catch (error) {
    console.error('Error fetching daily solved by project:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch daily solved by project',
      message: error.message 
    });
  }
}));

// Get daily solved cases by full name (owner)
router.get('/daily-solved-by-name', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const timeRange = req.query.timeRange || 'past-7-days';
    const whereConditions = buildWhereClause(req.query, true);
    
    // Calculate date range
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let days = 7;
    if (timeRange === 'past-30-days') days = 30;
    if (timeRange === 'past-90-days') days = 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    const isoDate = startDate.toISOString().split('.')[0] + 'Z';
    const dateCondition = `ClosedDate >= ${isoDate} AND IsClosed = true AND ClosedDate != null`;
    
    // Combine all conditions
    const conditions = [];
    if (whereConditions) {
      conditions.push(whereConditions);
    }
    conditions.push(dateCondition);
    const fullWhere = conditions.join(' AND ');
    
    const query = `SELECT Owner.Name, ClosedDate FROM Case WHERE ${fullWhere} LIMIT 100000`;
    console.log('=== DAILY SOLVED BY NAME QUERY ===');
    console.log('Query:', query);
    
    let result = await conn.query(query);
    
    // Generate date columns
    const dateColumns = [];
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      dateColumns.push(d.toISOString().split('T')[0]);
    }
    
    // Group by owner name and date
    const nameMap = {};
    if (result.records) {
      result.records.forEach(record => {
        if (record.ClosedDate) {
          const fullName = record.Owner?.Name || 'Unknown';
          const date = new Date(record.ClosedDate).toISOString().split('T')[0];
          
          if (!nameMap[fullName]) {
            nameMap[fullName] = {};
            dateColumns.forEach(col => {
              nameMap[fullName][col] = 0;
            });
          }
          if (nameMap[fullName][date] !== undefined) {
            nameMap[fullName][date] = (nameMap[fullName][date] || 0) + 1;
          }
        }
      });
    }
    
    // Handle pagination
    while (result.done === false && result.nextRecordsUrl) {
      result = await conn.queryMore(result.nextRecordsUrl);
      if (result.records) {
        result.records.forEach(record => {
          if (record.ClosedDate) {
            const fullName = record.Owner?.Name || 'Unknown';
            const date = new Date(record.ClosedDate).toISOString().split('T')[0];
            
            if (!nameMap[fullName]) {
              nameMap[fullName] = {};
              dateColumns.forEach(col => {
                nameMap[fullName][col] = 0;
              });
            }
            if (nameMap[fullName][date] !== undefined) {
              nameMap[fullName][date] = (nameMap[fullName][date] || 0) + 1;
            }
          }
        });
      }
    }
    
    // Convert to array format
    const data = Object.keys(nameMap).map(fullName => ({
      fullName,
      ...nameMap[fullName]
    })).sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    setNoCacheHeaders(res);
    res.json({ data, dateColumns });
  } catch (error) {
    console.error('Error fetching daily solved by name:', error);
    setNoCacheHeaders(res);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch daily solved by name',
      message: error.message 
    });
  }
}));

module.exports = router;

