// Project Performance Dashboard routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');

/**
 * Get Project Performance Overview
 * GET /api/project-performance/overview
 * Returns: Overall project metrics (status distribution, counts, duration)
 */
router.get('/overview', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000; // 4 minutes
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    checkTimeout();
    
    // Get account filter from query
    const accountFilter = req.query.account;
    let accountWhereClause = '';
    if (accountFilter && accountFilter !== 'all' && accountFilter.trim() !== '') {
      // Try to find account by name
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${accountFilter.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          accountWhereClause = `AND Account__c = '${accountResult.records[0].Id}'`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Apply GPC filter helper
    const { applyGPCFilterToQuery } = require('../utils/gpcFilterQueryBuilder');
    
    // Get project status distribution
    let statusQuery = `
      SELECT 
        Project_Status__c status,
        COUNT(Id) RecordCount
      FROM Project__c
      WHERE Project_Status__c != null ${accountWhereClause}
      GROUP BY Project_Status__c
    `;
    
    const statusResult = await conn.query(statusQuery);
    const statusDistribution = (statusResult.records || []).map(r => ({
      status: r.status || 'Unknown',
      count: r.RecordCount || 0
    }));
    
    checkTimeout();
    
    // Get total projects count
    let totalProjectsQuery = `SELECT COUNT() FROM Project__c WHERE Id != null ${accountWhereClause}`;
    totalProjectsQuery = applyGPCFilterToQuery(totalProjectsQuery, req, { projectField: 'Id' });
    const totalProjectsResult = await conn.query(totalProjectsQuery);
    const totalProjects = totalProjectsResult.totalSize || 0;
    
    checkTimeout();
    
    // Get projects with dates for duration calculation
    let durationQuery = `
      SELECT 
        Id,
        Hire_Start_Date__c,
        Predicted_Close_Date__c,
        CreatedDate,
        Project_Status__c
      FROM Project__c
      WHERE Hire_Start_Date__c != null
        AND Predicted_Close_Date__c != null ${accountWhereClause}
      LIMIT 1000
    `;
    
    // Apply GPC filter
    durationQuery = applyGPCFilterToQuery(durationQuery, req, { projectField: 'Id' });
    
    let durationResult = await conn.query(durationQuery);
    let allDurationProjects = durationResult.records || [];
    
    // Handle pagination
    let pageCount = 0;
    const MAX_PAGES = 10;
    while (durationResult.nextRecordsUrl && pageCount < MAX_PAGES) {
      checkTimeout();
      durationResult = await conn.queryMore(durationResult.nextRecordsUrl);
      if (durationResult.records && durationResult.records.length > 0) {
        allDurationProjects.push(...durationResult.records);
        pageCount++;
      } else {
        break;
      }
    }
    
    // Calculate duration metrics
    const durations = [];
    const timeToMarket = [];
    
    allDurationProjects.forEach(project => {
      if (project.Hire_Start_Date__c && project.Predicted_Close_Date__c) {
        const start = new Date(project.Hire_Start_Date__c);
        const end = new Date(project.Predicted_Close_Date__c);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          durations.push(days);
        }
      }
      
      if (project.CreatedDate && project.Hire_Start_Date__c) {
        const created = new Date(project.CreatedDate);
        const launch = new Date(project.Hire_Start_Date__c);
        const days = Math.ceil((launch - created) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          timeToMarket.push(days);
        }
      }
    });
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    const avgTimeToMarket = timeToMarket.length > 0
      ? timeToMarket.reduce((a, b) => a + b, 0) / timeToMarket.length
      : 0;
    
    checkTimeout();
    
    // Get projects created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Set to midnight for consistent date comparison
    const isoDate = thirtyDaysAgo.toISOString().split('.')[0] + 'Z'; // Format: YYYY-MM-DDTHH:mm:ssZ
    const recentProjectsQuery = `
      SELECT COUNT() 
      FROM Project__c 
      WHERE CreatedDate >= ${isoDate} ${accountWhereClause}
    `;
    
    // Apply GPC filter
    let recentProjectsQueryFiltered = applyGPCFilterToQuery(recentProjectsQuery, req, { projectField: 'Id' });
    
    let recentProjectsCount = 0;
    try {
      const recentResult = await conn.query(recentProjectsQueryFiltered);
      recentProjectsCount = recentResult.totalSize || 0;
    } catch (error) {
      console.error('Error getting recent projects:', error);
    }
    
    checkTimeout();
    
    // Get projects by type
    const typeQuery = `
      SELECT 
        Project_Type__c type,
        COUNT(Id) RecordCount
      FROM Project__c
      WHERE Project_Type__c != null ${accountWhereClause}
      GROUP BY Project_Type__c
      LIMIT 50
    `;
    
    // Apply GPC filter
    let typeQueryFiltered = applyGPCFilterToQuery(typeQuery, req, { projectField: 'Id' });
    
    const typeResult = await conn.query(typeQueryFiltered);
    const projectsByType = (typeResult.records || []).map(r => ({
      type: r.type || 'Unknown',
      count: r.RecordCount || 0
    }));
    
    res.json({
      success: true,
      data: {
        totalProjects,
        statusDistribution,
        avgDuration: Math.round(avgDuration),
        avgTimeToMarket: Math.round(avgTimeToMarket),
        recentProjectsCount,
        projectsByType,
        lastRefreshed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Project Performance Overview] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project performance overview'
    });
  }
}));

/**
 * Get Funnel Metrics
 * GET /api/project-performance/funnel
 * Returns: Contributor funnel conversion metrics
 */
router.get('/funnel', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000;
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    checkTimeout();
    
    // Get account filter - need to filter by projects
    const accountFilter = req.query.account;
    let accountWhereClause = '';
    if (accountFilter && accountFilter !== 'all' && accountFilter.trim() !== '') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${accountFilter.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          const accountId = accountResult.records[0].Id;
          const projectsQuery = `SELECT Id FROM Project__c WHERE Account__c = '${accountId}' LIMIT 1000`;
          const projectsResult = await conn.query(projectsQuery);
          const projectIds = (projectsResult.records || []).map(p => p.Id);
          if (projectIds.length > 0) {
            accountWhereClause = `AND Project__c IN (${projectIds.map(id => `'${id}'`).join(',')})`;
          } else {
            // No projects for this account, return empty
            return res.json({
              success: true,
              data: {
                funnelStages: [],
                conversions: [],
                totalActive: 0,
                statusCounts: {},
                lastRefreshed: new Date().toISOString()
              }
            });
          }
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Discover Project Objective field on Contributor_Project__c
    const possibleProjectObjectiveFields = [
      'Project_Objective__c',
      'ProjectObjective__c',
      'Objective__c'
    ];
    
    let projectObjectiveField = null;
    for (const fieldName of possibleProjectObjectiveFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        projectObjectiveField = fieldName;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!projectObjectiveField) {
      try {
        const describeResult = await conn.sobject('Contributor_Project__c').describe();
        const field = describeResult.fields.find(f => 
          f.name === 'Project_Objective__c' || 
          f.name === 'ProjectObjective__c' || 
          f.name === 'Objective__c'
        );
        if (field) {
          projectObjectiveField = field.name;
        }
      } catch (error) {
        console.error('Error describing Contributor_Project__c:', error);
      }
    }
    
    if (!projectObjectiveField) {
      return res.status(500).json({
        success: false,
        error: 'Could not determine Project Objective field name on Contributor_Project__c'
      });
    }
    
    // Get status distribution
    const statusQuery = `
      SELECT 
        Status__c status,
        COUNT(Id) RecordCount
      FROM Contributor_Project__c
      WHERE Status__c != null ${accountWhereClause}
      GROUP BY Status__c
      LIMIT 100
    `;
    
    const statusResult = await conn.query(statusQuery);
    const statusCounts = {};
    (statusResult.records || []).forEach(r => {
      statusCounts[r.status] = r.RecordCount || 0;
    });
    
    checkTimeout();
    
    // Calculate funnel stages
    const funnelStages = [
      { name: 'Draft', count: statusCounts['Draft'] || 0 },
      { name: 'Invite', count: statusCounts['Invite'] || 0 },
      { name: 'App Received', count: statusCounts['App Received'] || 0 },
      { name: 'Matched', count: statusCounts['Matched'] || 0 },
      { name: 'Qualified', count: statusCounts['Qualified'] || 0 },
      { name: 'Active', count: statusCounts['Active'] || 0 },
      { name: 'Production', count: statusCounts['Production'] || 0 }
    ];
    
    // Calculate conversion rates
    // Note: Conversion rate is capped at 100% since you cannot convert more than 100% of records.
    // If next > current, it may indicate records moving backwards in the funnel or data quality issues.
    const conversions = [];
    for (let i = 0; i < funnelStages.length - 1; i++) {
      const current = funnelStages[i].count;
      const next = funnelStages[i + 1].count;
      // Cap conversion rate at 100% to prevent impossible values
      const calculatedRate = current > 0 ? (next / current) * 100 : 0;
      const rate = Math.min(calculatedRate, 100).toFixed(2);
      conversions.push({
        from: funnelStages[i].name,
        to: funnelStages[i + 1].name,
        rate: parseFloat(rate),
        fromCount: current,
        toCount: next
      });
    }
    
    // Get active contributors count
    const activeCount = statusCounts['Active'] || 0;
    const productionCount = statusCounts['Production'] || 0;
    const totalActive = activeCount + productionCount;
    
    res.json({
      success: true,
      data: {
        funnelStages,
        conversions,
        totalActive,
        statusCounts,
        lastRefreshed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Project Performance Funnel] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch funnel metrics'
    });
  }
}));

/**
 * Get Financial Metrics
 * GET /api/project-performance/financial
 * Returns: Payment and financial metrics
 */
router.get('/financial', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000;
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    checkTimeout();
    
    // Discover payment fields on Contact
    const discoverPaymentFields = async () => {
      try {
        const describe = await conn.sobject('Contact').describe();
        const fields = describe.fields;
        
        const findField = (exactNames, patterns, fieldName) => {
          // Try exact names first
          for (const name of exactNames) {
            const field = fields.find(f => f.name === name);
            if (field) return name;
          }
          
          // Try patterns
          for (const pattern of patterns) {
            const field = fields.find(f => pattern(f.name));
            if (field) return field.name;
          }
          
          return null;
        };
        
        return {
          totalPaymentAmount: findField(
            ['Total_Payment_Amount__c', 'TotalPaymentAmount__c', 'Payment_Amount__c'],
            [
              f => f.includes('Payment') && (f.includes('Amount') || f.includes('Total')) && f.endsWith('__c'),
              f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('amount')
            ],
            'Total Payment Amount'
          ),
          outstandingBalance: findField(
            ['Outstanding_Balance__c', 'OutstandingBalance__c', 'Balance__c'],
            [
              f => (f.includes('Outstanding') || f.includes('Balance')) && f.endsWith('__c'),
              f => f.toLowerCase().includes('outstanding') || f.toLowerCase().includes('balance')
            ],
            'Outstanding Balance'
          ),
          paymentStatus: findField(
            ['Payment_Status__c', 'PaymentStatus__c', 'Status__c'],
            [
              f => f.includes('Payment') && f.includes('Status') && f.endsWith('__c'),
              f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('status')
            ],
            'Payment Status'
          ),
          paymentMethod: findField(
            ['Payment_Method__c', 'PaymentMethod__c'],
            [
              f => f.includes('Payment') && f.includes('Method') && f.endsWith('__c'),
              f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('method')
            ],
            'Payment Method'
          )
        };
      } catch (error) {
        console.error('Error discovering payment fields:', error);
        return {};
      }
    };
    
    const paymentFields = await discoverPaymentFields();
    checkTimeout();
    
    // Get account filter - need to filter contacts by projects
    const accountFilter = req.query.account;
    let contactWhereClause = '';
    if (accountFilter && accountFilter !== 'all' && accountFilter.trim() !== '') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${accountFilter.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          const accountId = accountResult.records[0].Id;
          // Get projects for this account
          const projectsQuery = `SELECT Id FROM Project__c WHERE Account__c = '${accountId}' LIMIT 1000`;
          const projectsResult = await conn.query(projectsQuery);
          const projectIds = (projectsResult.records || []).map(p => p.Id);
          
          if (projectIds.length > 0) {
            // Get contributor project IDs for these projects
            // Discover contributor field on Contributor_Project__c
            const possibleContributorFields = ['Contact__c', 'Contributor__c'];
            let contributorField = null;
            for (const fieldName of possibleContributorFields) {
              try {
                const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
                await conn.query(testQuery);
                contributorField = fieldName;
                break;
              } catch (error) {
                continue;
              }
            }
            
            if (contributorField) {
              // Get contributor IDs from Contributor_Project__c for these projects
              const cpQuery = `SELECT ${contributorField} FROM Contributor_Project__c WHERE Project__c IN (${projectIds.map(id => `'${id}'`).join(',')}) AND ${contributorField} != null LIMIT 10000`;
              const cpResult = await conn.query(cpQuery);
              const contributorIds = new Set();
              (cpResult.records || []).forEach(r => {
                if (r[contributorField]) {
                  contributorIds.add(r[contributorField]);
                }
              });
              
              if (contributorIds.size > 0) {
                const idsArray = Array.from(contributorIds);
                // Split into batches of 200 for WHERE IN clause
                const batches = [];
                for (let i = 0; i < idsArray.length; i += 200) {
                  batches.push(idsArray.slice(i, i + 200));
                }
                // For now, use first batch - in production might need to aggregate across batches
                contactWhereClause = `WHERE Id IN (${batches[0].map(id => `'${id}'`).join(',')})`;
              } else {
                // No contributors for this account
                return res.json({
                  success: true,
                  data: {
                    totalPaid: 0,
                    totalOutstanding: 0,
                    paymentStatusDistribution: [],
                    paymentMethodDistribution: [],
                    lastRefreshed: new Date().toISOString()
                  }
                });
              }
            }
          } else {
            // No projects for this account
            return res.json({
              success: true,
              data: {
                totalPaid: 0,
                totalOutstanding: 0,
                paymentStatusDistribution: [],
                paymentMethodDistribution: [],
                lastRefreshed: new Date().toISOString()
              }
            });
          }
        }
      } catch (err) {
        console.error('Error finding account for financial:', err);
      }
    }
    
    if (!paymentFields.totalPaymentAmount && !paymentFields.outstandingBalance) {
      return res.json({
        success: true,
        data: {
          totalPaid: 0,
          totalOutstanding: 0,
          paymentStatusDistribution: [],
          paymentMethodDistribution: [],
          message: 'Payment fields not found in Salesforce',
          lastRefreshed: new Date().toISOString()
        }
      });
    }
    
    // Build query dynamically based on available fields
    const selectFields = [];
    if (paymentFields.totalPaymentAmount) selectFields.push(`SUM(${paymentFields.totalPaymentAmount}) totalPaid`);
    if (paymentFields.outstandingBalance) selectFields.push(`SUM(${paymentFields.outstandingBalance}) totalOutstanding`);
    
    if (selectFields.length === 0) {
      return res.json({
        success: true,
        data: {
          totalPaid: 0,
          totalOutstanding: 0,
          paymentStatusDistribution: [],
          paymentMethodDistribution: [],
          lastRefreshed: new Date().toISOString()
        }
      });
    }
    
    const financialQuery = `SELECT ${selectFields.join(', ')} FROM Contact ${contactWhereClause}`;
    const financialResult = await conn.query(financialQuery);
    const financialData = financialResult.records[0] || {};
    
    checkTimeout();
    
    // Get payment status distribution
    let paymentStatusDistribution = [];
    if (paymentFields.paymentStatus) {
      try {
        const whereClause = contactWhereClause 
          ? `${contactWhereClause} AND ${paymentFields.paymentStatus} != null`
          : `WHERE ${paymentFields.paymentStatus} != null`;
        const statusQuery = `
          SELECT 
            ${paymentFields.paymentStatus} status,
            COUNT(Id) RecordCount
          FROM Contact
          ${whereClause}
          GROUP BY ${paymentFields.paymentStatus}
          LIMIT 50
        `;
        const statusResult = await conn.query(statusQuery);
        paymentStatusDistribution = (statusResult.records || []).map(r => ({
          status: r.status || 'Unknown',
          count: r.RecordCount || 0
        }));
      } catch (error) {
        console.error('Error getting payment status distribution:', error);
      }
    }
    
    checkTimeout();
    
    // Get payment method distribution
    let paymentMethodDistribution = [];
    if (paymentFields.paymentMethod) {
      try {
        const whereClause = contactWhereClause 
          ? `${contactWhereClause} AND ${paymentFields.paymentMethod} != null`
          : `WHERE ${paymentFields.paymentMethod} != null`;
        const methodQuery = `
          SELECT 
            ${paymentFields.paymentMethod} method,
            COUNT(Id) RecordCount
          FROM Contact
          ${whereClause}
          GROUP BY ${paymentFields.paymentMethod}
          LIMIT 50
        `;
        const methodResult = await conn.query(methodQuery);
        paymentMethodDistribution = (methodResult.records || []).map(r => ({
          method: r.method || 'Unknown',
          count: r.RecordCount || 0
        }));
      } catch (error) {
        console.error('Error getting payment method distribution:', error);
      }
    }
    
    res.json({
      success: true,
      data: {
        totalPaid: parseFloat(financialData.totalPaid || 0),
        totalOutstanding: parseFloat(financialData.totalOutstanding || 0),
        paymentStatusDistribution,
        paymentMethodDistribution,
        lastRefreshed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Project Performance Financial] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch financial metrics'
    });
  }
}));

/**
 * Get Project Objectives Metrics
 * GET /api/project-performance/objectives
 * Returns: Project objective performance metrics
 */
router.get('/objectives', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000;
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    checkTimeout();
    
    // Find Project field on Project_Objective__c
    const possibleProjectFields = ['Project__c', 'Project__r'];
    let projectField = 'Project__c';
    
    for (const fieldName of possibleProjectFields) {
      try {
        const testQuery = `SELECT ${fieldName} FROM Project_Objective__c WHERE ${fieldName} != null LIMIT 1`;
        await conn.query(testQuery);
        projectField = fieldName;
        break;
      } catch (error) {
        continue;
      }
    }
    
    // Get account filter
    const accountFilter = req.query.account;
    let accountWhereClause = '';
    let projectIds = null;
    if (accountFilter && accountFilter !== 'all' && accountFilter.trim() !== '') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${accountFilter.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          const accountId = accountResult.records[0].Id;
          const projectsQuery = `SELECT Id FROM Project__c WHERE Account__c = '${accountId}' LIMIT 1000`;
          const projectsResult = await conn.query(projectsQuery);
          projectIds = (projectsResult.records || []).map(p => p.Id);
          if (projectIds.length === 0) {
            return res.json({
              success: true,
              data: {
                totalObjectives: 0,
                avgObjectivesPerProject: 0,
                objectivesByProject: [],
                objectivesByCountry: [],
                objectivesByWorkType: [],
                lastRefreshed: new Date().toISOString()
              }
            });
          }
          accountWhereClause = `AND ${projectField} IN (${projectIds.map(id => `'${id}'`).join(',')})`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Get objectives per project with project names
    const objectivesQuery = `
      SELECT 
        ${projectField} projectId,
        Project__r.Name projectName,
        COUNT(Id) RecordCount
      FROM Project_Objective__c
      WHERE ${projectField} != null ${accountWhereClause}
      GROUP BY ${projectField}, Project__r.Name
      LIMIT 1000
    `;
    
    const objectivesResult = await conn.query(objectivesQuery);
    const objectivesByProject = (objectivesResult.records || []).map(r => ({
      projectId: r.projectId,
      projectName: r.projectName || r.projectId,
      objectiveCount: r.RecordCount || 0
    }));
    
    checkTimeout();
    
    // Calculate average objectives per project
    const totalObjectives = objectivesByProject.reduce((sum, p) => sum + p.objectiveCount, 0);
    const avgObjectivesPerProject = objectivesByProject.length > 0 
      ? totalObjectives / objectivesByProject.length 
      : 0;
    
    // Get objectives by country
    let objectivesByCountry = [];
    try {
      const countryQuery = `
        SELECT 
          Country__c country,
          COUNT(Id) RecordCount
        FROM Project_Objective__c
        WHERE Country__c != null ${accountWhereClause}
        GROUP BY Country__c
        LIMIT 50
      `;
      const countryResult = await conn.query(countryQuery);
      objectivesByCountry = (countryResult.records || []).map(r => ({
        country: r.country || 'Unknown',
        count: r.RecordCount || 0
      }));
    } catch (error) {
      console.error('Error getting objectives by country:', error);
    }
    
    checkTimeout();
    
    // Get objectives by work type
    let objectivesByWorkType = [];
    try {
      const workTypeQuery = `
        SELECT 
          Work_Type__c workType,
          COUNT(Id) RecordCount
        FROM Project_Objective__c
        WHERE Work_Type__c != null ${accountWhereClause}
        GROUP BY Work_Type__c
        LIMIT 50
      `;
      const workTypeResult = await conn.query(workTypeQuery);
      objectivesByWorkType = (workTypeResult.records || []).map(r => ({
        workType: r.workType || 'Unknown',
        count: r.RecordCount || 0
      }));
    } catch (error) {
      console.error('Error getting objectives by work type:', error);
    }
    
    res.json({
      success: true,
      data: {
        totalObjectives: totalObjectives,
        avgObjectivesPerProject: Math.round(avgObjectivesPerProject * 100) / 100,
        objectivesByProject: objectivesByProject.slice(0, 20), // Limit to top 20
        objectivesByCountry,
        objectivesByWorkType,
        lastRefreshed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Project Performance Objectives] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch objectives metrics'
    });
  }
}));

/**
 * Get Team Performance Metrics
 * GET /api/project-performance/team
 * Returns: Team member performance metrics
 */
router.get('/team', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000;
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    checkTimeout();
    
    // Get account filter
    const accountFilter = req.query.account;
    let accountWhereClause = '';
    if (accountFilter && accountFilter !== 'all' && accountFilter.trim() !== '') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${accountFilter.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          accountWhereClause = `AND Account__c = '${accountResult.records[0].Id}'`;
        }
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    
    // Get projects by Project Manager with names
    const pmQuery = `
      SELECT 
        Project_Manager__c managerId,
        Project_Manager__r.Name managerName,
        Project_Status__c status,
        COUNT(Id) RecordCount
      FROM Project__c
      WHERE Project_Manager__c != null ${accountWhereClause}
      GROUP BY Project_Manager__c, Project_Manager__r.Name, Project_Status__c
      LIMIT 1000
    `;
    
    const pmResult = await conn.query(pmQuery);
    
    // Aggregate by manager
    const managerMap = new Map();
    (pmResult.records || []).forEach(r => {
      const managerId = r.managerId || 'Unknown';
      const managerName = r.managerName || r.managerId || 'Unknown';
      if (!managerMap.has(managerId)) {
        managerMap.set(managerId, {
          manager: managerName,
          managerId: managerId,
          projectCount: 0,
          openCount: 0,
          closedCount: 0
        });
      }
      const data = managerMap.get(managerId);
      const count = r.RecordCount || 0;
      data.projectCount += count;
      if (r.status === 'Open') {
        data.openCount += count;
      } else if (r.status === 'Closed') {
        data.closedCount += count;
      }
    });
    
    const projectsByManager = Array.from(managerMap.values());
    
    checkTimeout();
    
    // Get projects by Quality Lead with names
    let projectsByQualityLead = [];
    try {
      const qlQuery = `
        SELECT 
          Quality_Lead__c leadId,
          Quality_Lead__r.Name leadName,
          COUNT(Id) RecordCount
        FROM Project__c
        WHERE Quality_Lead__c != null ${accountWhereClause}
        GROUP BY Quality_Lead__c, Quality_Lead__r.Name
        LIMIT 100
      `;
      const qlResult = await conn.query(qlQuery);
      projectsByQualityLead = (qlResult.records || []).map(r => ({
        lead: r.leadName || r.leadId || 'Unknown',
        leadId: r.leadId,
        projectCount: r.RecordCount || 0
      }));
    } catch (error) {
      console.error('Error getting projects by quality lead:', error);
    }
    
    res.json({
      success: true,
      data: {
        projectsByManager,
        projectsByQualityLead,
        lastRefreshed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Project Performance Team] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch team metrics'
    });
  }
}));

/**
 * Get Queue Status Metrics
 * GET /api/project-performance/queue
 * Returns: Queue status distribution and metrics
 */
router.get('/queue', authenticate, asyncHandler(async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 240000;
  
  const checkTimeout = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      throw new Error('Request timeout: Processing took too long');
    }
  };
  
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    checkTimeout();
    
    // Get account filter - need to filter by projects
    const accountFilter = req.query.account;
    let queueWhereClause = '';
    if (accountFilter && accountFilter !== 'all' && accountFilter.trim() !== '') {
      try {
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${accountFilter.replace(/'/g, "''")}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          const accountId = accountResult.records[0].Id;
          // Get projects for this account
          const projectsQuery = `SELECT Id FROM Project__c WHERE Account__c = '${accountId}' LIMIT 1000`;
          const projectsResult = await conn.query(projectsQuery);
          const projectIds = (projectsResult.records || []).map(p => p.Id);
          
          if (projectIds.length > 0) {
            queueWhereClause = `AND Project__c IN (${projectIds.map(id => `'${id}'`).join(',')})`;
          } else {
            // No projects for this account, return empty
            return res.json({
              success: true,
              data: {
                queueDistribution: [],
                totalInQueues: 0,
                lastRefreshed: new Date().toISOString()
              }
            });
          }
        }
      } catch (err) {
        console.error('Error finding account for queue:', err);
      }
    }
    
    // Get queue status distribution
    const queueQuery = `
      SELECT 
        Queue_Status__c queueStatus,
        COUNT(Id) RecordCount
      FROM Contributor_Project__c
      WHERE Queue_Status__c != null ${queueWhereClause}
      GROUP BY Queue_Status__c
      LIMIT 50
    `;
    
    const queueResult = await conn.query(queueQuery);
    const queueDistribution = (queueResult.records || []).map(r => ({
      queueStatus: r.queueStatus || 'Unknown',
      count: r.RecordCount || 0
    }));
    
    checkTimeout();
    
    // Get total contributors in queues
    const totalInQueues = queueDistribution.reduce((sum, q) => sum + q.count, 0);
    
    res.json({
      success: true,
      data: {
        queueDistribution,
        totalInQueues,
        lastRefreshed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Project Performance Queue] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch queue metrics'
    });
  }
}));

/**
 * Get Account List for Filtering
 * GET /api/project-performance/accounts
 * Returns: List of accounts from Salesforce Account object
 */
router.get('/accounts', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Get all accounts directly from Account object
    const accountSet = new Set();
    let accountResult = await conn.query(`
      SELECT Name
      FROM Account
      WHERE Name != null
      ORDER BY Name
      LIMIT 2000
    `);
    
    (accountResult.records || []).forEach(r => {
      if (r.Name) {
        accountSet.add(r.Name);
      }
    });
    
    // Handle pagination
    let pageCount = 0;
    const MAX_PAGES = 10;
    while (accountResult.nextRecordsUrl && pageCount < MAX_PAGES) {
      accountResult = await conn.queryMore(accountResult.nextRecordsUrl);
      (accountResult.records || []).forEach(r => {
        if (r.Name) {
          accountSet.add(r.Name);
        }
      });
      pageCount++;
    }
    
    const accounts = Array.from(accountSet).sort();
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('[Project Performance Accounts] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts'
    });
  }
}));

module.exports = router;

