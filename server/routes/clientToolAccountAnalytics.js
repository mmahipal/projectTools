const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

// Helper functions for analytics data
const getAccountStatusData = async (conn) => {
  const query = `SELECT Id, Name, Client_Tool_Name__c, Deactivated__c, OTP_Limit_Exceeded__c, Verified__c
                 FROM Client_Tool_Account__c
                 LIMIT 10000`;
  const result = await conn.query(query);
  const accounts = result.records || [];

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(a => !a.Deactivated__c).length;
  const deactivatedAccounts = accounts.filter(a => a.Deactivated__c).length;
  const otpExceededAccounts = accounts.filter(a => a.OTP_Limit_Exceeded__c).length;
  const unverifiedAccounts = accounts.filter(a => !a.Verified__c).length;
  const verifiedAccounts = accounts.filter(a => a.Verified__c).length;

  const statusDistribution = {
    active: activeAccounts,
    deactivated: deactivatedAccounts,
    otpExceeded: otpExceededAccounts,
    unverified: unverifiedAccounts,
    verified: verifiedAccounts
  };

  const accountsByTool = {};
  accounts.forEach(account => {
    const toolName = account.Client_Tool_Name__c || 'Unknown';
    if (!accountsByTool[toolName]) {
      accountsByTool[toolName] = {
        total: 0,
        active: 0,
        deactivated: 0,
        otpExceeded: 0,
        unverified: 0
      };
    }
    accountsByTool[toolName].total++;
    if (!account.Deactivated__c) accountsByTool[toolName].active++;
    if (account.Deactivated__c) accountsByTool[toolName].deactivated++;
    if (account.OTP_Limit_Exceeded__c) accountsByTool[toolName].otpExceeded++;
    if (!account.Verified__c) accountsByTool[toolName].unverified++;
  });

  return {
    totalAccounts,
    statusDistribution,
    accountsByTool,
    percentages: {
      active: totalAccounts > 0 ? ((activeAccounts / totalAccounts) * 100).toFixed(2) : 0,
      deactivated: totalAccounts > 0 ? ((deactivatedAccounts / totalAccounts) * 100).toFixed(2) : 0,
      otpExceeded: totalAccounts > 0 ? ((otpExceededAccounts / totalAccounts) * 100).toFixed(2) : 0,
      unverified: totalAccounts > 0 ? ((unverifiedAccounts / totalAccounts) * 100).toFixed(2) : 0,
      verified: totalAccounts > 0 ? ((verifiedAccounts / totalAccounts) * 100).toFixed(2) : 0
    }
  };
};

const getProjectCoverageData = async (conn) => {
  const query = `SELECT Id, Name, Client_Tool_Account_Required__c, Client_Tool_Account_Used__c
                 FROM Contributor_Project__c
                 WHERE Client_Tool_Account_Required__c = true
                 LIMIT 10000`;
  const result = await conn.query(query);
  const projects = result.records || [];

  const totalRequired = projects.length;
  const withAccounts = projects.filter(p => p.Client_Tool_Account_Used__c).length;
  const withoutAccounts = totalRequired - withAccounts;
  const coveragePercentage = totalRequired > 0 ? ((withAccounts / totalRequired) * 100).toFixed(2) : 0;

  const projectsWithoutAccounts = projects
    .filter(p => !p.Client_Tool_Account_Used__c)
    .map(p => ({
      id: p.Id,
      name: p.Name
    }))
    .slice(0, 100);

  return {
    totalRequired,
    withAccounts,
    withoutAccounts,
    coveragePercentage: parseFloat(coveragePercentage),
    projectsWithoutAccounts
  };
};

const getAccountUtilizationData = async (conn) => {
  const accountsQuery = `SELECT Id, Name, Client_Tool_Name__c, Contributor__c, Contributor__r.Name, Account__c, Account__r.Name
                         FROM Client_Tool_Account__c
                         LIMIT 10000`;
  const accountsResult = await conn.query(accountsQuery);
  const accounts = accountsResult.records || [];

  const projectsQuery = `SELECT Id, Name, Client_Tool_Account_Used__c
                         FROM Contributor_Project__c
                         WHERE Client_Tool_Account_Used__c != null
                         LIMIT 10000`;
  const projectsResult = await conn.query(projectsQuery);
  const projects = projectsResult.records || [];

  const accountToProjectsMap = new Map();
  projects.forEach(project => {
    const accountId = project.Client_Tool_Account_Used__c;
    if (!accountToProjectsMap.has(accountId)) {
      accountToProjectsMap.set(accountId, []);
    }
    accountToProjectsMap.get(accountId).push({
      id: project.Id,
      name: project.Name
    });
  });

  const totalAccounts = accounts.length;
  const assignedAccounts = Array.from(accountToProjectsMap.keys()).length;
  const unassignedAccounts = totalAccounts - assignedAccounts;
  const accountsWithMultipleProjects = Array.from(accountToProjectsMap.values())
    .filter(projects => projects.length > 1).length;

  const accountsByTool = {};
  accounts.forEach(account => {
    const toolName = account.Client_Tool_Name__c || 'Unknown';
    if (!accountsByTool[toolName]) {
      accountsByTool[toolName] = {
        total: 0,
        assigned: 0,
        unassigned: 0
      };
    }
    accountsByTool[toolName].total++;
    if (accountToProjectsMap.has(account.Id)) {
      accountsByTool[toolName].assigned++;
    } else {
      accountsByTool[toolName].unassigned++;
    }
  });

  const accountsByContributor = {};
  accounts.forEach(account => {
    const contributorName = account.Contributor__r?.Name || 'Unknown';
    if (!accountsByContributor[contributorName]) {
      accountsByContributor[contributorName] = 0;
    }
    accountsByContributor[contributorName]++;
  });

  const topContributors = Object.entries(accountsByContributor)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const accountsByOrganization = {};
  accounts.forEach(account => {
    const orgName = account.Account__r?.Name || 'Unknown';
    if (!accountsByOrganization[orgName]) {
      accountsByOrganization[orgName] = 0;
    }
    accountsByOrganization[orgName]++;
  });

  const topOrganizations = Object.entries(accountsByOrganization)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const assignmentDistribution = {
    unassigned: unassignedAccounts,
    singleProject: Array.from(accountToProjectsMap.values()).filter(p => p.length === 1).length,
    multipleProjects: accountsWithMultipleProjects
  };

  return {
    totalAccounts,
    assignedAccounts,
    unassignedAccounts,
    accountsWithMultipleProjects,
    accountsByTool,
    topContributors,
    topOrganizations,
    assignmentDistribution,
    utilizationRate: totalAccounts > 0 ? ((assignedAccounts / totalAccounts) * 100).toFixed(2) : 0
  };
};

// Update individual endpoints to use helper functions
router.get('/account-status', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const data = await getAccountStatusData(conn);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics] Error fetching account status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account status analytics'
    });
  }
}));

router.get('/project-coverage', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const data = await getProjectCoverageData(conn);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics] Error fetching project coverage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project coverage analytics'
    });
  }
}));

router.get('/account-utilization', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const data = await getAccountUtilizationData(conn);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics] Error fetching account utilization:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account utilization analytics'
    });
  }
}));

// Combined Phase 1 dashboard endpoint
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const [accountStatus, projectCoverage, accountUtilization] = await Promise.all([
      getAccountStatusData(conn).catch(err => {
        console.error('[Analytics] Error in account status:', err);
        return null;
      }),
      getProjectCoverageData(conn).catch(err => {
        console.error('[Analytics] Error in project coverage:', err);
        return null;
      }),
      getAccountUtilizationData(conn).catch(err => {
        console.error('[Analytics] Error in account utilization:', err);
        return null;
      })
    ]);

    res.json({
      success: true,
      data: {
        accountStatus,
        projectCoverage,
        accountUtilization
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics dashboard'
    });
  }
}));

module.exports = router;

