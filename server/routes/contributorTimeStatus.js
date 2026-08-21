const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
const { discoverContributorField } = require('../utils/salesforce/fieldDiscovery');

/**
 * Calculate time in status using hybrid approach
 * Priority 1: Explicit date fields
 * Priority 2: Infer from date progression
 * Priority 3: Fallback to LastModifiedDate
 */
function calculateTimeInStatus(contributorProject) {
  try {
    const timeline = [];
    const now = new Date();
    
    // Helper function to safely parse dates
    const parseDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        return null;
      }
    };
    
    // Parse dates safely
    const appliedDate = parseDate(contributorProject.Applied_Date__c);
    const qualifiedDate = parseDate(contributorProject.Qualified_Date__c);
    const onboardedDate = parseDate(contributorProject.Onboarded_Date__c);
    const removedDate = parseDate(contributorProject.Removed_Date__c);
    const createdDate = parseDate(contributorProject.CreatedDate) || now;
    const lastModifiedDate = parseDate(contributorProject.LastModifiedDate) || now;
    const currentStatus = contributorProject.Status__c || 'Draft';
  
    // Priority 1: Build sequential timeline from explicit dates
    // Collect all date-status pairs
    const dateStatusPairs = [];
    
    if (appliedDate) {
      dateStatusPairs.push({ date: appliedDate, status: 'App Received' });
    }
    if (qualifiedDate) {
      dateStatusPairs.push({ date: qualifiedDate, status: 'Qualified' });
    }
    if (onboardedDate) {
      const activeStatus = currentStatus === 'Production' ? 'Production' : 'Active';
      dateStatusPairs.push({ date: onboardedDate, status: activeStatus });
    }
    if (removedDate && currentStatus === 'Removed') {
      dateStatusPairs.push({ date: removedDate, status: 'Removed' });
    }
    
    // Sort by date to create sequential timeline
    dateStatusPairs.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Build timeline with proper transitions
    if (dateStatusPairs.length > 0) {
      // Add a "Start" entry at the beginning if we have explicit dates
      const firstPair = dateStatusPairs[0];
      if (firstPair && firstPair.date > createdDate) {
        const startDays = Math.floor((firstPair.date - createdDate) / (1000 * 60 * 60 * 24));
        if (!isNaN(startDays) && startDays >= 0) {
          timeline.push({
            status: 'Start',
            startDate: createdDate,
            endDate: firstPair.date,
            days: startDays
          });
        }
      }
      
      // Build timeline from date-status pairs
      for (let i = 0; i < dateStatusPairs.length; i++) {
        const currentPair = dateStatusPairs[i];
        const nextPair = dateStatusPairs[i + 1];
        const endDate = nextPair ? nextPair.date : (removedDate && currentStatus === 'Removed' ? removedDate : now);
        
        const days = Math.floor((endDate - currentPair.date) / (1000 * 60 * 60 * 24));
        if (!isNaN(days) && days >= 0) {
          timeline.push({
            status: currentPair.status,
            startDate: currentPair.date,
            endDate: endDate,
            days: days
          });
        }
      }
      
      // If current status is not in timeline, add it
      if (!timeline.some(t => t.status === currentStatus)) {
        const lastEntry = timeline[timeline.length - 1];
        if (lastEntry && lastEntry.endDate < now) {
          const days = Math.floor((now - lastEntry.endDate) / (1000 * 60 * 60 * 24));
          if (!isNaN(days) && days >= 0) {
            timeline.push({
              status: currentStatus,
              startDate: lastEntry.endDate,
              endDate: now,
              days: days
            });
          }
        }
      }
    } else {
      // Priority 3: Fallback - no explicit dates, use CreatedDate to LastModifiedDate
      const days = Math.floor((lastModifiedDate - createdDate) / (1000 * 60 * 60 * 24));
      if (!isNaN(days) && days >= 0) {
        timeline.push({
          status: currentStatus,
          startDate: createdDate,
          endDate: lastModifiedDate,
          days: days
        });
      }
      
      // If LastModifiedDate is in the past, add current status period
      if (lastModifiedDate < now) {
        const currentDays = Math.floor((now - lastModifiedDate) / (1000 * 60 * 60 * 24));
        if (!isNaN(currentDays) && currentDays >= 0 && currentDays > 0) {
          timeline.push({
            status: currentStatus,
            startDate: lastModifiedDate,
            endDate: now,
            days: currentDays
          });
        }
      }
    }
    
    // Sort timeline by startDate to ensure chronological order
    timeline.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    // Deduplicate consecutive statuses in timeline (merge periods with same status)
    const deduplicatedTimeline = [];
    for (let i = 0; i < timeline.length; i++) {
      const current = timeline[i];
      
      // If this is the first entry, add it
      if (deduplicatedTimeline.length === 0) {
        deduplicatedTimeline.push({ ...current });
      } else {
        const lastEntry = deduplicatedTimeline[deduplicatedTimeline.length - 1];
        
        // If the status is the same as the previous entry, merge the periods
        if (lastEntry.status === current.status) {
          // Merge: extend the end date and add the days
          lastEntry.endDate = current.endDate;
          lastEntry.days += current.days;
        } else {
          // Different status, add as new entry
          deduplicatedTimeline.push({ ...current });
        }
      }
    }
    
    // Calculate aggregated time by status
    const timeByStatus = {};
    deduplicatedTimeline.forEach(period => {
      if (!timeByStatus[period.status]) {
        timeByStatus[period.status] = {
          totalDays: 0,
          periods: []
        };
      }
      timeByStatus[period.status].totalDays += period.days;
      timeByStatus[period.status].periods.push({
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        days: period.days
      });
    });
    
    return {
      timeline: deduplicatedTimeline,
      timeByStatus,
      totalTimeToActive: deduplicatedTimeline.find(t => t.status === 'Active' || t.status === 'Production') 
        ? deduplicatedTimeline.filter(t => ['Active', 'Production'].includes(t.status)).reduce((sum, t) => sum + t.days, 0)
        : null,
      totalTimeInProject: deduplicatedTimeline.reduce((sum, t) => sum + t.days, 0)
    };
  } catch (error) {
    console.error('Error calculating time in status:', error, contributorProject);
    // Return minimal safe structure
    return {
      timeline: [],
      timeByStatus: {},
      totalTimeToActive: null,
      totalTimeInProject: 0
    };
  }
}

/**
 * GET /api/contributor-time-status/overview
 * High-level metrics dashboard
 */
router.get('/overview', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    const { account } = req.query;
    
    // Build account filter
    let accountWhereClause = '';
    if (account && account !== 'all') {
      // Try to find account by name
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${account.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          accountWhereClause = ` AND Project__r.Account__c = '${accountResult.records[0].Id}'`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Query Contributor Projects with all date fields
    // Note: Some date fields may not exist on all orgs, so we'll handle errors gracefully
    let query = `
      SELECT 
        Id,
        Name,
        Contact__c,
        Project__c,
        Project_Objective__c,
        Status__c,
        CreatedDate,
        LastModifiedDate
      FROM Contributor_Project__c
      WHERE Status__c != null ${accountWhereClause}
      ORDER BY CreatedDate DESC
      LIMIT 10000
    `;
    
    // Apply GPC filter
    query = applyGPCFilterToQuery(query, req);
    
    // Try to add relationship fields and date fields if they exist
    // Use field discovery utility for robust field detection
    let contributorFieldName = null;
    let contributorRelationshipName = null;
    
    try {
      const contributorFieldResult = await discoverContributorField(conn, {
        requireField: false, // Don't fail if field not found, just skip it
        preferredFields: ['Contributor__c', 'Contact__c', 'Contributor_Id__c']
      });
      
      if (contributorFieldResult.found) {
        contributorFieldName = contributorFieldResult.fieldName;
        contributorRelationshipName = contributorFieldResult.relationshipName;
        
        if (!contributorFieldResult.isAccessible) {
          console.warn(`[Contributor Time Status] Contributor field ${contributorFieldName} found but may not be accessible (FLS issue)`);
        }
      } else {
        console.warn(`[Contributor Time Status] No contributor field found. Available fields may be restricted by FLS.`);
      }
      
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const fieldNames = describeResult.fields.map(f => f.name);
      const dateFields = [];
      const relationshipFields = [];
      
      // Check for date fields
      if (fieldNames.includes('Applied_Date__c')) dateFields.push('Applied_Date__c');
      if (fieldNames.includes('Qualified_Date__c')) dateFields.push('Qualified_Date__c');
      if (fieldNames.includes('Onboarded_Date__c')) dateFields.push('Onboarded_Date__c');
      if (fieldNames.includes('Removed_Date__c')) dateFields.push('Removed_Date__c');
      
      // Check for relationship fields (try to query them, but don't fail if they don't exist)
      if (contributorFieldName && contributorRelationshipName) {
        try {
          // Build relationship name (e.g., Contact__r.Name or Contributor__r.Name)
          const relName = `${contributorRelationshipName}__r.Name`;
          const testQuery = `SELECT ${relName} FROM Contributor_Project__c WHERE ${contributorFieldName} != null LIMIT 1`;
          await conn.query(testQuery);
          relationshipFields.push(relName);
          console.log(`[Contributor Time Status] ✓ Relationship field accessible: ${relName}`);
        } catch (e) {
          // Relationship field doesn't exist or isn't accessible
          const errorCode = e.errorCode || e.code;
          if (errorCode === 'INVALID_FIELD') {
            console.warn(`[Contributor Time Status] ✗ Relationship field for ${contributorFieldName} not accessible (FLS issue): ${e.message}`);
          } else {
            console.warn(`[Contributor Time Status] Could not access relationship field for ${contributorFieldName}: ${e.message}`);
          }
        }
      }
      
      if (fieldNames.includes('Project__c')) {
        try {
          const testQuery = `SELECT Project__r.Name FROM Contributor_Project__c WHERE Project__c != null LIMIT 1`;
          await conn.query(testQuery);
          relationshipFields.push('Project__r.Name');
        } catch (e) {
          // Relationship field doesn't exist or isn't accessible
        }
      }
      
      if (fieldNames.includes('Project_Objective__c')) {
        try {
          const testQuery = `SELECT Project_Objective__r.Name FROM Contributor_Project__c WHERE Project_Objective__c != null LIMIT 1`;
          await conn.query(testQuery);
          relationshipFields.push('Project_Objective__r.Name');
        } catch (e) {
          // Relationship field doesn't exist or isn't accessible
        }
      }
      
      // Build query with available fields
      const additionalFields = [...relationshipFields, ...dateFields];
      if (additionalFields.length > 0 || contributorFieldName) {
        const contributorFieldSelect = contributorFieldName ? `${contributorFieldName},` : '';
        const contributorRelSelect = relationshipFields.find(f => f.includes('Contact') || f.includes('Contributor')) 
          ? `${relationshipFields.find(f => f.includes('Contact') || f.includes('Contributor'))},` 
          : '';
        
        query = `
          SELECT 
            Id,
            Name,
            ${contributorFieldSelect}
            ${contributorRelSelect}
            Project__c,
            ${relationshipFields.includes('Project__r.Name') ? 'Project__r.Name,' : ''}
            Project_Objective__c,
            ${relationshipFields.includes('Project_Objective__r.Name') ? 'Project_Objective__r.Name,' : ''}
            Status__c,
            ${dateFields.length > 0 ? dateFields.join(', ') + ',' : ''}
            CreatedDate,
            LastModifiedDate
          FROM Contributor_Project__c
          WHERE Status__c != null ${accountWhereClause}
          ORDER BY CreatedDate DESC
          LIMIT 10000
        `.replace(/,\s*,/g, ',').replace(/,\s*FROM/g, ' FROM').replace(/,\s*WHERE/g, ' WHERE'); // Clean up extra commas
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
      // Continue with basic query
    }
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      console.error('Query error:', queryError);
      // Fallback to minimal query
      query = `
        SELECT 
          Id,
          Name,
          Status__c,
          CreatedDate,
          LastModifiedDate
        FROM Contributor_Project__c
        WHERE Status__c != null ${accountWhereClause}
        ORDER BY CreatedDate DESC
        LIMIT 10000
      `;
      result = await conn.query(query);
    }
    const records = result.records || [];
    
    // Calculate time in status for each record
    const statusMetrics = {};
    const statusCounts = {};
    const totalTimeDistribution = {};
    let totalTime = 0;
    
    records.forEach(record => {
      try {
        const calculation = calculateTimeInStatus(record);
        const currentStatus = record.Status__c;
        
        // Aggregate by status
        Object.keys(calculation.timeByStatus).forEach(status => {
          if (!statusMetrics[status]) {
            statusMetrics[status] = {
              totalDays: 0,
              count: 0,
              minDays: Infinity,
              maxDays: 0
            };
          }
          
          const days = calculation.timeByStatus[status].totalDays;
          statusMetrics[status].totalDays += days;
          statusMetrics[status].count += 1;
          statusMetrics[status].minDays = Math.min(statusMetrics[status].minDays, days);
          statusMetrics[status].maxDays = Math.max(statusMetrics[status].maxDays, days);
          
          totalTimeDistribution[status] = (totalTimeDistribution[status] || 0) + days;
          totalTime += days;
        });
        
        // Count current status
        statusCounts[currentStatus] = (statusCounts[currentStatus] || 0) + 1;
      } catch (error) {
        console.error('Error processing record:', error, record?.Id);
        // Continue with next record
      }
    });
    
    // Calculate averages
    const averageTimeByStatus = {};
    Object.keys(statusMetrics).forEach(status => {
      const metrics = statusMetrics[status];
      averageTimeByStatus[status] = {
        days: metrics.count > 0 ? Math.round((metrics.totalDays / metrics.count) * 10) / 10 : 0,
        count: metrics.count,
        minDays: metrics.minDays === Infinity ? 0 : metrics.minDays,
        maxDays: metrics.maxDays,
        medianDays: 0 // Would need to calculate from all values
      };
    });
    
    // Calculate percentage distribution
    const timeDistributionPercent = {};
    Object.keys(totalTimeDistribution).forEach(status => {
      timeDistributionPercent[status] = totalTime > 0 
        ? Math.round((totalTimeDistribution[status] / totalTime) * 100 * 10) / 10 
        : 0;
    });
    
    // Calculate status transitions (simplified - using date progression)
    const transitions = {};
    records.forEach(record => {
      try {
        const calculation = calculateTimeInStatus(record);
        if (calculation.timeline.length > 1) {
          for (let i = 0; i < calculation.timeline.length - 1; i++) {
            const fromStatus = calculation.timeline[i].status;
            const toStatus = calculation.timeline[i + 1].status;
            
            // Skip self-transitions (same status to same status)
            if (fromStatus === toStatus) {
              continue;
            }
            
            const transitionKey = `${fromStatus} → ${toStatus}`;
            
            if (!transitions[transitionKey]) {
              transitions[transitionKey] = {
                totalDays: 0,
                count: 0
              };
            }
            
            transitions[transitionKey].totalDays += calculation.timeline[i].days;
            transitions[transitionKey].count += 1;
          }
        }
      } catch (error) {
        console.error('Error processing transition for record:', error, record?.Id);
      }
    });
    
    const statusTransitions = {};
    Object.keys(transitions).forEach(key => {
      const t = transitions[key];
      statusTransitions[key] = {
        avgDays: t.count > 0 ? Math.round((t.totalDays / t.count) * 10) / 10 : 0,
        count: t.count
      };
    });
    
    // Get accurate counts for Active and Production statuses
    // Query separately to get total count without LIMIT restriction
    let activeContributorsCount = 0;
    try {
      let activeCountQuery = `SELECT COUNT() FROM Contributor_Project__c WHERE (Status__c = 'Active' OR Status__c = 'Production')`;
      if (accountWhereClause) {
        activeCountQuery += accountWhereClause.replace('AND ', ' AND ');
      }
      const activeCountResult = await conn.query(activeCountQuery);
      activeContributorsCount = activeCountResult.totalSize || 0;
    } catch (error) {
      console.error('Error getting active contributors count:', error);
      // Fallback to counted records
      activeContributorsCount = (statusCounts['Active'] || 0) + (statusCounts['Production'] || 0);
    }
    
    // Update statusCounts with accurate Active count
    const updatedStatusCounts = { ...statusCounts };
    updatedStatusCounts['Active'] = activeContributorsCount;
    
    res.json({
      success: true,
      data: {
        averageTimeByStatus,
        totalTimeDistribution: timeDistributionPercent,
        statusTransitions,
        currentStatusCounts: updatedStatusCounts,
        activeContributorsCount: activeContributorsCount
      }
    });
  } catch (error) {
    console.error('Error fetching contributor time status overview:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch overview data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

/**
 * GET /api/contributor-time-status/timeline
 * Individual contributor timelines
 */
router.get('/timeline', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    const { 
      contributorId, 
      projectId, 
      projectObjectiveId, 
      status, 
      account,
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Build where clause
    let whereClause = 'Status__c != null';
    
    // Handle account filter
    if (account && account !== 'all') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${account.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          whereClause += ` AND Project__r.Account__c = '${accountResult.records[0].Id}'`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    if (contributorId && contributorId !== 'all') {
      whereClause += ` AND Contact__c = '${contributorId}'`;
    }
    if (projectId && projectId !== 'all') {
      whereClause += ` AND Project__c = '${projectId}'`;
    }
    if (projectObjectiveId && projectObjectiveId !== 'all') {
      whereClause += ` AND Project_Objective__c = '${projectObjectiveId}'`;
    }
    if (status && status !== 'all') {
      whereClause += ` AND Status__c = '${status}'`;
    }
    
    // Discover field names dynamically
    let contactFieldName = null;
    const possibleContactFields = ['Contact__c', 'Contributor__c'];
    
    for (const fieldName of possibleContactFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        contactFieldName = fieldName;
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Build query dynamically - start minimal
    let selectFields = ['Id', 'Status__c', 'CreatedDate', 'LastModifiedDate'];
    if (contactFieldName) selectFields.push(contactFieldName);
    selectFields.push('Project__c', 'Project_Objective__c');
    
    let query = `
      SELECT 
        ${selectFields.join(', ')}
      FROM Contributor_Project__c
      WHERE ${whereClause}
      ORDER BY CreatedDate DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;
    
    // Try to add relationship and date fields if they exist
    let dateFields = [];
    let relationshipFields = [];
    
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const fieldNames = describeResult.fields.map(f => f.name);
      
      // Check for date fields
      if (fieldNames.includes('Applied_Date__c')) dateFields.push('Applied_Date__c');
      if (fieldNames.includes('Qualified_Date__c')) dateFields.push('Qualified_Date__c');
      if (fieldNames.includes('Onboarded_Date__c')) dateFields.push('Onboarded_Date__c');
      if (fieldNames.includes('Removed_Date__c')) dateFields.push('Removed_Date__c');
      
      // Test relationships using discovered field name
      if (contactFieldName) {
        try {
          const relName = contactFieldName === 'Contact__c' ? 'Contact__r.Name' : 'Contributor__r.Name';
          const testQuery = `SELECT ${relName} FROM Contributor_Project__c WHERE ${contactFieldName} != null LIMIT 1`;
          await conn.query(testQuery);
          relationshipFields.push(relName);
        } catch (e) {
          // Relationship not accessible
        }
      }
      
      try {
        const testQuery = `SELECT Project__r.Name FROM Contributor_Project__c WHERE Project__c != null LIMIT 1`;
        await conn.query(testQuery);
        relationshipFields.push('Project__r.Name');
      } catch (e) {
        // Relationship not accessible
      }
      
      try {
        const testQuery = `SELECT Project_Objective__r.Name FROM Contributor_Project__c WHERE Project_Objective__c != null LIMIT 1`;
        await conn.query(testQuery);
        relationshipFields.push('Project_Objective__r.Name');
      } catch (e) {
        // Relationship not accessible
      }
      
      if (dateFields.length > 0 || relationshipFields.length > 0) {
        const baseFields = ['Id', 'Status__c'];
        if (contactFieldName) baseFields.push(contactFieldName);
        baseFields.push('Project__c', 'Project_Objective__c');
        
        query = `
          SELECT 
            ${baseFields.join(', ')},
            ${relationshipFields.length > 0 ? relationshipFields.join(', ') + ',' : ''}
            ${dateFields.length > 0 ? dateFields.join(', ') + ',' : ''}
            CreatedDate,
            LastModifiedDate
          FROM Contributor_Project__c
          WHERE ${whereClause}
          ORDER BY CreatedDate DESC
          LIMIT ${parseInt(limit)}
          OFFSET ${parseInt(offset)}
        `.replace(/,\s*,/g, ',').replace(/,\s*FROM/g, ' FROM').replace(/,\s*WHERE/g, ' WHERE');
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
    }
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      console.error('Query error, trying with minimal fields:', queryError.message);
      // Try with absolute minimal fields that definitely exist
      query = `
        SELECT 
          Id,
          Status__c,
          CreatedDate,
          LastModifiedDate
        FROM Contributor_Project__c
        WHERE ${whereClause}
        ORDER BY CreatedDate DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;
      try {
        result = await conn.query(query);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    const records = result.records || [];
    
    // Calculate timelines
    const timelines = records.map(record => {
      try {
        const calculation = calculateTimeInStatus(record);
        const now = new Date();
        const currentStatus = record.Status__c || 'Draft';
        
        // Find current status period
        let daysInCurrentStatus = 0;
        const currentPeriod = calculation.timeline.find(t => t.status === currentStatus);
        if (currentPeriod) {
          daysInCurrentStatus = currentPeriod.days;
        } else {
          // Estimate from LastModifiedDate
          try {
            const lastModified = record.LastModifiedDate ? new Date(record.LastModifiedDate) : now;
            daysInCurrentStatus = Math.floor((now - lastModified) / (1000 * 60 * 60 * 24));
            if (isNaN(daysInCurrentStatus) || daysInCurrentStatus < 0) {
              daysInCurrentStatus = 0;
            }
          } catch (e) {
            daysInCurrentStatus = 0;
          }
        }
        
        // Try to fetch names - handle both Contact__c and Contributor__c
        let contributorName = 'Unknown';
        let projectName = 'Unknown';
        let projectObjectiveName = 'N/A';
        
        // Check for relationship fields (handle both Contact__r and Contributor__r)
        if (record.Contact__r && record.Contact__r.Name) {
          contributorName = record.Contact__r.Name;
        } else if (record.Contributor__r && record.Contributor__r.Name) {
          contributorName = record.Contributor__r.Name;
        } else if (record.Contact__c) {
          contributorName = record.Contact__c.substring(0, 18) + '...';
        } else if (record.Contributor__c) {
          contributorName = record.Contributor__c.substring(0, 18) + '...';
        }
        
        if (record.Project__r && record.Project__r.Name) {
          projectName = record.Project__r.Name;
        } else if (record.Project__c) {
          projectName = record.Project__c.substring(0, 18) + '...';
        }
        
        if (record.Project_Objective__r && record.Project_Objective__r.Name) {
          projectObjectiveName = record.Project_Objective__r.Name;
        } else if (record.Project_Objective__c) {
          projectObjectiveName = record.Project_Objective__c.substring(0, 18) + '...';
        } else {
          projectObjectiveName = 'N/A';
        }
        
        return {
          contributorProjectId: record.Id,
          contributorName: contributorName,
          projectName: projectName,
          projectObjectiveName: projectObjectiveName,
          currentStatus: currentStatus,
          daysInCurrentStatus: daysInCurrentStatus,
          statusTimeline: calculation.timeline.map(t => ({
            status: t.status,
            startDate: t.startDate.toISOString().split('T')[0],
            endDate: t.endDate.toISOString().split('T')[0],
            days: t.days
          })),
          totalTimeToActive: calculation.totalTimeToActive,
          totalTimeInProject: calculation.totalTimeInProject
        };
      } catch (error) {
        console.error('Error processing timeline for record:', error, record?.Id);
        return null;
      }
    }).filter(Boolean);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(Id) RecordCount
      FROM Contributor_Project__c
      WHERE ${whereClause}
    `;
    const countResult = await conn.query(countQuery);
    const total = countResult.records?.[0]?.RecordCount || 0;
    
    res.json({
      success: true,
      data: timelines,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Error fetching contributor timelines:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch timeline data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

/**
 * GET /api/contributor-time-status/bottlenecks
 * Identify bottlenecks
 */
router.get('/bottlenecks', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    // Default to 'objective' for heatmap to show more meaningful data
    const { groupBy = 'objective', minDays = 0, account } = req.query;
    
    // Build account filter
    let accountWhereClause = '';
    if (account && account !== 'all') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${account.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          accountWhereClause = ` AND Project__r.Account__c = '${accountResult.records[0].Id}'`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Build query dynamically - start minimal
    let query = `
      SELECT 
        Id,
        Name,
        Contact__c,
        Project__c,
        Project_Objective__c,
        Status__c,
        CreatedDate,
        LastModifiedDate
      FROM Contributor_Project__c
      WHERE Status__c != null ${accountWhereClause}
      ORDER BY CreatedDate DESC
      LIMIT 10000
    `;
    
    // Try to add relationship and date fields if they exist
    let dateFields = [];
    let hasRelationships = false;
    
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const fieldNames = describeResult.fields.map(f => f.name);
      
      if (fieldNames.includes('Applied_Date__c')) dateFields.push('Applied_Date__c');
      if (fieldNames.includes('Qualified_Date__c')) dateFields.push('Qualified_Date__c');
      if (fieldNames.includes('Onboarded_Date__c')) dateFields.push('Onboarded_Date__c');
      if (fieldNames.includes('Removed_Date__c')) dateFields.push('Removed_Date__c');
      
      try {
        const testQuery = `SELECT Contact__r.Name, Project__r.Name, Project_Objective__r.Name, Project__r.Account__r.Name FROM Contributor_Project__c LIMIT 1`;
        await conn.query(testQuery);
        hasRelationships = true;
      } catch (e) {
        hasRelationships = false;
      }
      
      if (dateFields.length > 0 || hasRelationships) {
        query = `
          SELECT 
            Id,
            Name,
            Contact__c,
            ${hasRelationships ? 'Contact__r.Name,' : ''}
            Project__c,
            ${hasRelationships ? 'Project__r.Name, Project__r.Account__c, Project__r.Account__r.Name,' : ''}
            Project_Objective__c,
            ${hasRelationships ? 'Project_Objective__r.Name,' : ''}
            Status__c,
            ${dateFields.length > 0 ? dateFields.join(', ') + ',' : ''}
            CreatedDate,
            LastModifiedDate
          FROM Contributor_Project__c
          WHERE Status__c != null ${accountWhereClause}
          ORDER BY CreatedDate DESC
          LIMIT 10000
        `.replace(/,\s*,/g, ',').replace(/,\s*FROM/g, ' FROM').replace(/,\s*WHERE/g, ' WHERE');
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
    }
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      console.error('Query error, falling back:', queryError.message);
      query = `
        SELECT 
          Id,
          Status__c,
          CreatedDate,
          LastModifiedDate
        FROM Contributor_Project__c
        WHERE Status__c != null ${accountWhereClause}
        ORDER BY CreatedDate DESC
        LIMIT 10000
      `;
      result = await conn.query(query);
    }
    const records = result.records || [];
    
    // Group by specified field and calculate metrics
    const groupedData = {};
    const statusTotals = {};
    let totalTime = 0;
    
    records.forEach(record => {
      try {
        const calculation = calculateTimeInStatus(record);
        let groupKey = 'All';
        
        if (groupBy === 'project') {
          if (record.Project__r && record.Project__r.Name) {
            groupKey = record.Project__r.Name;
          } else if (record.Project__c) {
            // Use ID as fallback but try to make it shorter
            groupKey = `Project-${record.Project__c.substring(0, 8)}`;
          } else {
            groupKey = 'Unknown';
          }
        } else if (groupBy === 'objective') {
          if (record.Project_Objective__r && record.Project_Objective__r.Name) {
            groupKey = record.Project_Objective__r.Name;
          } else if (record.Project_Objective__c) {
            groupKey = `Objective-${record.Project_Objective__c.substring(0, 8)}`;
          } else {
            groupKey = 'Unknown';
          }
        } else if (groupBy === 'account') {
          if (record.Project__r && record.Project__r.Account__r && record.Project__r.Account__r.Name) {
            groupKey = record.Project__r.Account__r.Name;
          } else {
            groupKey = 'Unknown';
          }
        }
        
        // Always process data for bottleneck calculation, but skip Unknown/All for heatmap only
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = {};
        }
        
        Object.keys(calculation.timeByStatus).forEach(status => {
          const days = calculation.timeByStatus[status].totalDays;
          
          if (!groupedData[groupKey][status]) {
            groupedData[groupKey][status] = {
              totalDays: 0,
              count: 0
            };
          }
          
          groupedData[groupKey][status].totalDays += days;
          groupedData[groupKey][status].count += 1;
          
          // Always accumulate status totals for bottleneck calculation
          statusTotals[status] = (statusTotals[status] || 0) + days;
          totalTime += days;
        });
      } catch (error) {
        console.error('Error processing bottleneck record:', error, record?.Id);
      }
    });
    
    // Calculate averages and identify bottlenecks
    const bottlenecks = [];
    const recordsWithStatus = records.length > 0 ? records.length : 1; // Prevent division by zero
    
    Object.keys(statusTotals).forEach(status => {
      if (statusTotals[status] >= minDays) {
        const avgDays = statusTotals[status] / recordsWithStatus;
        const contributorsAffected = records.filter(r => {
          try {
            const calc = calculateTimeInStatus(r);
            return calc.timeByStatus && calc.timeByStatus[status];
          } catch (e) {
            return false;
          }
        }).length;
        
        bottlenecks.push({
          status: status,
          averageDays: Math.round(avgDays * 10) / 10,
          contributorsAffected: contributorsAffected,
          percentOfTotalTime: totalTime > 0 
            ? Math.round((statusTotals[status] / totalTime) * 100 * 10) / 10 
            : 0,
          projects: Object.keys(groupedData).filter(key => 
            key !== 'Unknown' && key !== 'All' && groupedData[key] && groupedData[key][status]
          )
        });
      }
    });
    
    // Sort by average days descending
    bottlenecks.sort((a, b) => b.averageDays - a.averageDays);
    
    // Build heatmap data - include all valid keys, format ID-based keys for readability
    const heatmapData = {};
    const validKeys = Object.keys(groupedData).filter(key => {
      // Only filter out Unknown, All, and empty strings
      // Include ID-based keys (Project-xxx, Objective-xxx) as they represent valid data
      return key !== 'Unknown' && 
             key !== 'All' && 
             key.trim() !== '';
    });
    
    console.log(`[Bottlenecks] Building heatmap from ${validKeys.length} valid keys out of ${Object.keys(groupedData).length} total keys`);
    
    validKeys.forEach(key => {
      // Format display key for better readability
      let displayKey = key;
      if (key.startsWith('Project-')) {
        // Show as "Project (ID: ...)" for better readability
        displayKey = `Project (${key.substring(8)})`;
      } else if (key.startsWith('Objective-')) {
        // Show as "Objective (ID: ...)" for better readability
        displayKey = `Objective (${key.substring(10)})`;
      }
      
      heatmapData[displayKey] = {};
      Object.keys(groupedData[key]).forEach(status => {
        const avg = groupedData[key][status].count > 0
          ? groupedData[key][status].totalDays / groupedData[key][status].count
          : 0;
        if (avg > 0) {
          heatmapData[displayKey][status] = Math.round(avg * 10) / 10;
        }
      });
      // Only include keys that have at least one status with data
      if (Object.keys(heatmapData[displayKey]).length === 0) {
        delete heatmapData[displayKey];
      }
    });
    
    console.log(`[Bottlenecks] Heatmap data contains ${Object.keys(heatmapData).length} entries`);
    
    res.json({
      success: true,
      data: {
        topBottlenecks: bottlenecks.slice(0, 10),
        heatmapData
      }
    });
  } catch (error) {
    console.error('Error fetching bottlenecks:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bottleneck data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

/**
 * GET /api/contributor-time-status/transitions
 * Status transition analysis
 */
router.get('/transitions', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    const { account } = req.query;
    
    // Build account filter
    let accountWhereClause = '';
    if (account && account !== 'all') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${account.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          accountWhereClause = ` AND Project__r.Account__c = '${accountResult.records[0].Id}'`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Discover field names dynamically
    let contactFieldName = null;
    const possibleContactFields = ['Contact__c', 'Contributor__c'];
    
    for (const fieldName of possibleContactFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        contactFieldName = fieldName;
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Build query dynamically - start minimal
    let selectFields = ['Id', 'Status__c', 'CreatedDate', 'LastModifiedDate'];
    if (contactFieldName) selectFields.push(contactFieldName);
    selectFields.push('Project__c', 'Project_Objective__c');
    
    let query = `
      SELECT 
        ${selectFields.join(', ')}
      FROM Contributor_Project__c
      WHERE Status__c != null ${accountWhereClause}
      ORDER BY CreatedDate DESC
      LIMIT 10000
    `;
    
    // Try to add relationship and date fields if they exist
    let dateFields = [];
    let relationshipFields = [];
    
    try {
      const describeResult = await conn.sobject('Contributor_Project__c').describe();
      const fieldNames = describeResult.fields.map(f => f.name);
      
      // Check for date fields
      if (fieldNames.includes('Applied_Date__c')) dateFields.push('Applied_Date__c');
      if (fieldNames.includes('Qualified_Date__c')) dateFields.push('Qualified_Date__c');
      if (fieldNames.includes('Onboarded_Date__c')) dateFields.push('Onboarded_Date__c');
      if (fieldNames.includes('Removed_Date__c')) dateFields.push('Removed_Date__c');
      
      // Test relationships using discovered field name
      if (contactFieldName) {
        try {
          const relName = contactFieldName === 'Contact__c' ? 'Contact__r.Name' : 'Contributor__r.Name';
          const testQuery = `SELECT ${relName} FROM Contributor_Project__c WHERE ${contactFieldName} != null LIMIT 1`;
          await conn.query(testQuery);
          relationshipFields.push(relName);
        } catch (e) {
          // Relationship not accessible
        }
      }
      
      try {
        const testQuery = `SELECT Project__r.Name FROM Contributor_Project__c WHERE Project__c != null LIMIT 1`;
        await conn.query(testQuery);
        relationshipFields.push('Project__r.Name');
      } catch (e) {
        // Relationship not accessible
      }
      
      try {
        const testQuery = `SELECT Project_Objective__r.Name FROM Contributor_Project__c WHERE Project_Objective__c != null LIMIT 1`;
        await conn.query(testQuery);
        relationshipFields.push('Project_Objective__r.Name');
      } catch (e) {
        // Relationship not accessible
      }
      
      if (dateFields.length > 0 || relationshipFields.length > 0) {
        const baseFields = ['Id', 'Status__c'];
        if (contactFieldName) baseFields.push(contactFieldName);
        baseFields.push('Project__c', 'Project_Objective__c');
        
        query = `
          SELECT 
            ${baseFields.join(', ')},
            ${relationshipFields.length > 0 ? relationshipFields.join(', ') + ',' : ''}
            ${dateFields.length > 0 ? dateFields.join(', ') + ',' : ''}
            CreatedDate,
            LastModifiedDate
          FROM Contributor_Project__c
          WHERE Status__c != null ${accountWhereClause}
          ORDER BY CreatedDate DESC
          LIMIT 10000
        `.replace(/,\s*,/g, ',').replace(/,\s*FROM/g, ' FROM').replace(/,\s*WHERE/g, ' WHERE');
      }
    } catch (describeError) {
      console.error('Error describing Contributor_Project__c:', describeError);
    }
    
    let result;
    try {
      result = await conn.query(query);
    } catch (queryError) {
      console.error('Query error, trying with minimal fields:', queryError.message);
      // Absolute minimal fallback
      query = `
        SELECT 
          Id,
          Status__c,
          CreatedDate,
          LastModifiedDate
        FROM Contributor_Project__c
        WHERE Status__c != null ${accountWhereClause}
        ORDER BY CreatedDate DESC
        LIMIT 10000
      `;
      try {
        result = await conn.query(query);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    const records = result.records || [];
    
    // Calculate transitions
    const transitions = {};
    const transitionDays = {};
    
    records.forEach(record => {
      try {
        const calculation = calculateTimeInStatus(record);
        
        // Calculate transitions from timeline
        if (calculation.timeline && calculation.timeline.length > 1) {
          for (let i = 0; i < calculation.timeline.length - 1; i++) {
            const fromStatus = calculation.timeline[i].status;
            const toStatus = calculation.timeline[i + 1].status;
            
            // Skip self-transitions (same status to same status)
            if (fromStatus === toStatus) {
              continue;
            }
            
            const transitionKey = `${fromStatus} → ${toStatus}`;
            
            if (!transitions[transitionKey]) {
              transitions[transitionKey] = {
                count: 0,
                totalDays: 0,
                days: []
              };
            }
            
            const days = calculation.timeline[i].days || 0;
            transitions[transitionKey].count += 1;
            transitions[transitionKey].totalDays += days;
            transitions[transitionKey].days.push(days);
          }
        } else if (calculation.timeline && calculation.timeline.length === 1) {
          // Single status - create a transition from "Start" to current status
          const currentStatus = calculation.timeline[0].status;
          const transitionKey = `Start → ${currentStatus}`;
          
          if (!transitions[transitionKey]) {
            transitions[transitionKey] = {
              count: 0,
              totalDays: 0,
              days: []
            };
          }
          
          const days = calculation.timeline[0].days || 0;
          transitions[transitionKey].count += 1;
          transitions[transitionKey].totalDays += days;
          transitions[transitionKey].days.push(days);
        }
      } catch (error) {
        console.error('Error processing transition for record:', error, record?.Id);
      }
    });
    
    // Calculate statistics
    const transitionStats = {};
    Object.keys(transitions).forEach(key => {
      const t = transitions[key];
      const sortedDays = t.days.sort((a, b) => a - b);
      const median = sortedDays.length > 0
        ? sortedDays[Math.floor(sortedDays.length / 2)]
        : 0;
      
      transitionStats[key] = {
        averageDays: t.count > 0 ? Math.round((t.totalDays / t.count) * 10) / 10 : 0,
        medianDays: Math.round(median * 10) / 10,
        minDays: sortedDays.length > 0 ? sortedDays[0] : 0,
        maxDays: sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : 0,
        count: t.count
      };
    });
    
    // Build Sankey data
    const statusOrder = ['Draft', 'Invite', 'App Received', 'Matched', 'Qualified', 'Active', 'Production', 'Removed'];
    const nodes = statusOrder.map(status => ({ name: status }));
    const links = Object.keys(transitionStats).map(key => {
      const [from, to] = key.split(' → ');
      const fromIndex = statusOrder.indexOf(from);
      const toIndex = statusOrder.indexOf(to);
      
      if (fromIndex >= 0 && toIndex >= 0) {
        return {
          source: fromIndex,
          target: toIndex,
          value: transitionStats[key].averageDays,
          count: transitionStats[key].count,
          label: key
        };
      }
      return null;
    }).filter(Boolean);
    
    res.json({
      success: true,
      data: {
        transitions: transitionStats,
        sankeyData: {
          nodes,
          links
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transitions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transition data'
    });
  }
}));

module.exports = router;

