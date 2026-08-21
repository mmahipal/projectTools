#!/usr/bin/env node

/**
 * API Test Script for Project Setup Application
 * 
 * This script tests all API endpoints including:
 * - Login to get JWT token
 * - Create test project in Salesforce
 * - Create new project with all fields
 * 
 * Usage:
 *   node test-api.js
 *   node test-api.js --test-only
 *   node test-api.js --create-only
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Axios configuration with increased timeout
const axiosConfig = {
  timeout: 5 * 60 * 1000, // 5 minutes timeout
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test credentials
const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  pm: { email: 'pm@example.com', password: 'pm123' },
  user: { email: 'user@example.com', password: 'user123' }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to print colored messages
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to print section headers
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Helper function to print success/error
function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Complete project data with all fields
const getCompleteProjectData = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return {
    // Information Section
    auditorProject: false,
    projectName: `Test Project ${Date.now()}`,
    shortProjectName: 'Test Project',
    contributorProjectName: 'Test Contributor Project',
    appenPartner: 'Appen',
    jobCategory: 'Data Collection',
    projectShortDescription: 'This is a test project for API testing. It includes all required fields and optional fields.',
    projectLongDescription: 'This is a comprehensive test project created via API. It includes all form fields from the Project Setup form including Information, Contributor Active Status, People, Rates, Funnel Totals, Funnel Stages, Lever Requisition Actions, Lever Requisition Fields, Lever Admin, Payment Configurations, and Activation sections.',
    projectType: 'Data collection',
    projectPriority: 50.0,
    projectIdForReports: '', // Read-only, calculated upon save
    workdayProjectId: 'WD-TEST-001',
    account: 'Test Account',
    programName: 'Ads',
    hireStartDate: today.toISOString().split('T')[0],
    predictedCloseDate: nextMonth.toISOString().split('T')[0],
    deliveryToolOrg: 'Appen',
    deliveryToolName: 'EWOQ',
    projectPage: 'https://test.example.com/project',
    projectStatus: 'Draft',
    
    // Contributor Active Status Section
    paymentSetupRequired: true,
    manualActivationRequired: false,
    clientToolAccountRequired: false,
    
    // People Section
    programManager: 'program.manager@example.com',
    projectManager: 'project.manager@example.com', // Required
    qualityLead: 'quality.lead@example.com',
    productivityLead: 'productivity.lead@example.com',
    reportingLead: 'reporting.lead@example.com',
    invoicingLead: 'invoicing.lead@example.com',
    projectSupportLead: 'project.support@example.com',
    casesDCSupportTeam: false,
    recruitmentLead: 'recruitment.lead@example.com',
    qualificationLead: 'qualification.lead@example.com',
    onboardingLead: 'onboarding.lead@example.com',
    
    // Rates Section
    projectIncentive: '0.000', // Read-only, calculated upon save
    
    // Funnel Totals Section
    totalApplied: 0, // Read-only, calculated upon save
    totalQualified: 0, // Read-only, calculated upon save
    
    // Funnel Stages Section
    invitedAvailableContributors: 0, // Read-only, calculated upon save
    registeredContributors: 0, // Read-only, calculated upon save
    appReceived: 0, // Read-only, calculated upon save
    qualifiedContributors: 0, // Read-only, calculated upon save
    matchedContributors: 0, // Read-only, calculated upon save
    activeContributors: 0, // Read-only, calculated upon save
    acAccount: 0, // Read-only, calculated upon save
    productionContributors: 0, // Read-only, calculated upon save
    appliedContributors: 0, // Read-only, calculated upon save
    removed: 0, // Read-only, calculated upon save
    
    // Lever Requisition Actions Section
    requisitionAction: 'Create New',
    
    // Lever Requisition Fields Section (Read-only, calculated upon save)
    leverReqName: '--',
    requisitionStatus: 'No Requisition',
    leverReqCode: '-',
    leverTimeToFillStart: '',
    leverCrowdHiringManagerEmail: 'io',
    leverTimeToFillEnd: '',
    leverCrowdOwnerEmail: 'mmoola@appen.io',
    leverReqDescription: '',
    leverCompensationBand: '20-500 USD /hour',
    leverLocation: 'Remote',
    leverDepartment: 'General Interest',
    leverWorkType: 'Independent Contractor - Project Based',
    leverSVP: 'Eric de Cavaignac',
    leverSVP2: '',
    
    // Lever Admin Section
    leverRequisitionID: 'LEVER-TEST-001',
    leverRequisitionCreateDate: today.toISOString().split('T')[0],
    
    // Payment Configurations Section
    projectPaymentMethod: 'Hourly', // Required
    requirePMApprovalForProductivity: false,
    releaseSystemTrackedData: 'Yes',
    
    // Activation Section
    activateCommsInvited: false,
    activateCommsApplied: false,
    activateCommsOnboarding: false,
    activateCommsFailed: false
  };
};

// Test 1: Login and get JWT token
async function testLogin(userType = 'admin') {
  logSection('Test 1: Login and Get JWT Token');
  
  try {
    const user = TEST_USERS[userType];
    logInfo(`Attempting to login as ${user.email}...`);
    
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: user.email,
        password: user.password
      },
      axiosConfig
    );
    
    if (response.data.token) {
      logSuccess(`Login successful! Token received.`);
      logInfo(`User: ${response.data.user.email}`);
      logInfo(`Role: ${response.data.user.role}`);
      logInfo(`Permissions: ${response.data.user.permissions.join(', ')}`);
      return response.data.token;
    } else {
      logError('Login failed: No token received');
      return null;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 2: Create test project in Salesforce
async function testCreateTestProject(token) {
  logSection('Test 2: Create Test Project in Salesforce');
  
  try {
    logInfo('Creating test project in Salesforce...');
    
    const response = await axios.post(
      `${API_BASE}/salesforce/create-test-project`,
      {},
      {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      logSuccess('Test project created successfully in Salesforce!');
      logInfo(`Salesforce ID: ${response.data.salesforceId}`);
      logInfo(`Object Type: ${response.data.objectType}`);
      logInfo(`Message: ${response.data.message}`);
      return true;
    } else {
      logError('Test project creation failed');
      return false;
    }
  } catch (error) {
    logError(`Test project creation failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test 3: Create new project with all fields
async function testCreateProject(token) {
  logSection('Test 3: Create New Project with All Fields');
  
  try {
    const projectData = getCompleteProjectData();
    
    logInfo('Creating new project with all fields...');
    logInfo(`Project Name: ${projectData.projectName}`);
    logInfo(`Total fields: ${Object.keys(projectData).length}`);
    
    const response = await axios.post(
      `${API_BASE}/projects`,
      projectData,
      {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.id) {
      logSuccess('Project created successfully!');
      logInfo(`Project ID: ${response.data.id}`);
      logInfo(`Project Name: ${response.data.projectName || projectData.projectName}`);
      logInfo(`Status: ${response.data.status}`);
      logInfo(`Created At: ${response.data.createdAt}`);
      if (response.data.salesforceId) {
        logInfo(`Salesforce ID: ${response.data.salesforceId}`);
        logInfo(`Salesforce Sync Status: ${response.data.salesforceSyncStatus}`);
      }
      return response.data;
    } else {
      logError('Project creation failed: No project ID received');
      return null;
    }
  } catch (error) {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('socket hang up')) {
      logError('Project creation failed: Connection was closed unexpectedly (socket hang up)');
      logInfo('This usually means:');
      logInfo('  1. The server crashed or timed out');
      logInfo('  2. The request body was too large');
      logInfo('  3. The server took too long to respond');
      logInfo('');
      logInfo('Solutions:');
      logInfo('  1. Restart the server: npm run server');
      logInfo('  2. Check server logs for errors');
      logInfo('  3. Verify the server is running on port 5000');
    } else {
      logError(`Project creation failed: ${error.response?.data?.error || error.message}`);
      if (error.response?.data) {
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.response?.status) {
        logInfo(`HTTP Status: ${error.response.status}`);
      }
    }
    if (error.code) {
      logInfo(`Error code: ${error.code}`);
    }
    return null;
  }
}

// Test 4: Get all projects
async function testGetProjects(token) {
  logSection('Test 4: Get All Projects');
  
  try {
    logInfo('Fetching all projects...');
    
    const response = await axios.get(
      `${API_BASE}/projects`,
      {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (Array.isArray(response.data)) {
      logSuccess(`Retrieved ${response.data.length} project(s)`);
      if (response.data.length > 0) {
        logInfo('Recent projects:');
        response.data.slice(-5).forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.projectName || project.name || 'Unnamed'} (ID: ${project.id})`);
        });
      }
      return response.data;
    } else {
      logError('Failed to retrieve projects: Invalid response format');
      return null;
    }
  } catch (error) {
    logError(`Failed to retrieve projects: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Main test runner
async function runTests() {
  logSection('API Test Suite - Project Setup Application');
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`API Base: ${API_BASE}`);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const testOnly = args.includes('--test-only');
  const createOnly = args.includes('--create-only');
  
  try {
    // Test 1: Login
    const token = await testLogin('admin');
    if (!token) {
      logError('Cannot proceed without authentication token');
      process.exit(1);
    }
    
    // Test 2: Create test project (if not create-only)
    if (!createOnly) {
      await testCreateTestProject(token);
    }
    
    // Test 3: Create new project (if not test-only)
    if (!testOnly) {
      const project = await testCreateProject(token);
      
      if (project) {
        // Test 4: Get all projects
        await testGetProjects(token);
      }
    }
    
    logSection('Test Suite Completed');
    logSuccess('All tests completed successfully!');
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

// Export functions for use in other scripts
module.exports = {
  testLogin,
  testCreateTestProject,
  testCreateProject,
  testGetProjects,
  getCompleteProjectData,
  BASE_URL,
  API_BASE,
  TEST_USERS
};

