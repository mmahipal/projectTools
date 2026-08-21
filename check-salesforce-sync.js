#!/usr/bin/env node

/**
 * Check Salesforce Sync Status
 * 
 * This script checks which projects have been synced to Salesforce
 * and shows their Salesforce IDs and object types.
 * 
 * Usage:
 *   node check-salesforce-sync.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test credentials
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkSalesforceSync() {
  try {
    // Login to get token
    log('Logging in...', 'blue');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;

    if (!token) {
      log('Failed to get authentication token', 'red');
      return;
    }

    log('Login successful!', 'green');
    console.log('');

    // Get all projects
    log('Fetching all projects...', 'blue');
    const projectsResponse = await axios.get(`${API_BASE}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const projects = projectsResponse.data;

    if (!Array.isArray(projects) || projects.length === 0) {
      log('No projects found', 'yellow');
      return;
    }

    log(`Found ${projects.length} project(s)`, 'green');
    console.log('');

    // Analyze sync status
    const syncedProjects = projects.filter(p => p.salesforceId && p.salesforceSyncStatus === 'synced');
    const failedProjects = projects.filter(p => p.salesforceSyncStatus === 'failed');
    const pendingProjects = projects.filter(p => !p.salesforceId || p.salesforceSyncStatus === 'pending');
    const notSyncedProjects = projects.filter(p => !p.salesforceSyncStatus);

    console.log('='.repeat(80));
    log('Salesforce Sync Status Summary', 'cyan');
    console.log('='.repeat(80));
    console.log('');
    log(`Total Projects: ${projects.length}`, 'blue');
    log(`✅ Synced to Salesforce: ${syncedProjects.length}`, 'green');
    log(`❌ Failed to Sync: ${failedProjects.length}`, 'red');
    log(`⏳ Pending Sync: ${pendingProjects.length}`, 'yellow');
    log(`❓ Not Attempted: ${notSyncedProjects.length}`, 'yellow');
    console.log('');

    // Show synced projects
    if (syncedProjects.length > 0) {
      console.log('='.repeat(80));
      log('✅ Projects Synced to Salesforce', 'green');
      console.log('='.repeat(80));
      syncedProjects.forEach((project, index) => {
        console.log(`\n${index + 1}. ${project.projectName || project.name || 'Unnamed Project'}`);
        console.log(`   Project ID: ${project.id}`);
        console.log(`   Salesforce ID: ${project.salesforceId}`);
        console.log(`   Object Type: ${project.salesforceObjectType || 'Unknown'}`);
        console.log(`   Sync Status: ${project.salesforceSyncStatus}`);
        if (project.salesforceSyncedAt) {
          console.log(`   Synced At: ${project.salesforceSyncedAt}`);
        }
      });
      console.log('');
    }

    // Show failed projects
    if (failedProjects.length > 0) {
      console.log('='.repeat(80));
      log('❌ Projects Failed to Sync', 'red');
      console.log('='.repeat(80));
      failedProjects.forEach((project, index) => {
        console.log(`\n${index + 1}. ${project.projectName || project.name || 'Unnamed Project'}`);
        console.log(`   Project ID: ${project.id}`);
        console.log(`   Sync Status: ${project.salesforceSyncStatus}`);
        if (project.salesforceSyncError) {
          console.log(`   Error: ${project.salesforceSyncError}`);
        }
        if (project.createdAt) {
          console.log(`   Created At: ${project.createdAt}`);
        }
      });
      console.log('');
    }

    // Show pending projects
    if (pendingProjects.length > 0) {
      console.log('='.repeat(80));
      log('⏳ Projects Pending Sync', 'yellow');
      console.log('='.repeat(80));
      pendingProjects.slice(0, 10).forEach((project, index) => {
        console.log(`\n${index + 1}. ${project.projectName || project.name || 'Unnamed Project'}`);
        console.log(`   Project ID: ${project.id}`);
        console.log(`   Sync Status: ${project.salesforceSyncStatus || 'Not attempted'}`);
        if (project.createdAt) {
          console.log(`   Created At: ${project.createdAt}`);
        }
      });
      if (pendingProjects.length > 10) {
        console.log(`\n... and ${pendingProjects.length - 10} more pending projects`);
      }
      console.log('');
    }

    // Show object type distribution
    if (syncedProjects.length > 0) {
      const objectTypes = {};
      syncedProjects.forEach(project => {
        const objType = project.salesforceObjectType || 'Unknown';
        objectTypes[objType] = (objectTypes[objType] || 0) + 1;
      });

      console.log('='.repeat(80));
      log('📊 Object Type Distribution', 'cyan');
      console.log('='.repeat(80));
      Object.keys(objectTypes).forEach(objType => {
        console.log(`   ${objType}: ${objectTypes[objType]} project(s)`);
      });
      console.log('');
    }

    // Recommendations
    console.log('='.repeat(80));
    log('💡 Recommendations', 'cyan');
    console.log('='.repeat(80));
    
    if (failedProjects.length > 0) {
      log('⚠️  Some projects failed to sync. Check:', 'yellow');
      console.log('   1. Salesforce credentials are correct');
      console.log('   2. Salesforce object (Project__c) exists');
      console.log('   3. Field mappings are correct');
      console.log('   4. User has permissions to create records');
      console.log('');
    }

    if (pendingProjects.length > 0) {
      log('⚠️  Some projects are pending sync. This may be because:', 'yellow');
      console.log('   1. Salesforce sync happens in the background');
      console.log('   2. Sync may still be in progress');
      console.log('   3. Check server logs for sync errors');
      console.log('');
    }

    if (syncedProjects.length > 0) {
      log('✅ To view projects in Salesforce:', 'green');
      console.log('   1. Log in to your Salesforce instance');
      console.log('   2. Search for the Salesforce ID shown above');
      console.log('   3. Or check the object type (Project__c or Opportunity)');
      console.log('');
    }

  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run if executed directly
if (require.main === module) {
  checkSalesforceSync();
}

module.exports = { checkSalesforceSync };


