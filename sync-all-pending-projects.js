#!/usr/bin/env node

/**
 * Sync All Pending Projects to Salesforce
 * 
 * This script syncs all pending projects to Salesforce
 * and updates their sync status.
 * 
 * Usage:
 *   node sync-all-pending-projects.js
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

async function syncAllPendingProjects() {
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

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get all projects
    log('Fetching all projects...', 'blue');
    const projectsResponse = await axios.get(`${API_BASE}/projects`, { headers });
    const projects = projectsResponse.data;

    if (!Array.isArray(projects) || projects.length === 0) {
      log('No projects found', 'yellow');
      return;
    }

    // Find pending projects
    const pendingProjects = projects.filter(p => !p.salesforceId || p.salesforceSyncStatus === 'pending');
    
    if (pendingProjects.length === 0) {
      log('No pending projects found', 'green');
      return;
    }

    log(`Found ${pendingProjects.length} pending project(s)`, 'blue');
    console.log('');

    let syncedCount = 0;
    let failedCount = 0;

    // Sync each pending project
    for (let i = 0; i < pendingProjects.length; i++) {
      const project = pendingProjects[i];
      log(`[${i + 1}/${pendingProjects.length}] Syncing project: ${project.projectName || project.name || 'Unnamed'}`, 'cyan');
      log(`   Project ID: ${project.id}`, 'blue');
      
      try {
        const syncResponse = await axios.post(
          `${API_BASE}/salesforce/create-project`,
          project,
          { headers }
        );

        if (syncResponse.data.success) {
          log(`   ✅ Synced successfully!`, 'green');
          log(`   Salesforce ID: ${syncResponse.data.salesforceId}`, 'green');
          log(`   Object Type: ${syncResponse.data.objectType}`, 'green');
          syncedCount++;
        } else {
          log(`   ❌ Sync failed: ${syncResponse.data.error || 'Unknown error'}`, 'red');
          failedCount++;
        }
      } catch (syncError) {
        log(`   ❌ Sync error: ${syncError.message}`, 'red');
        if (syncError.response?.data) {
          log(`   Error details: ${JSON.stringify(syncError.response.data)}`, 'red');
        }
        failedCount++;
      }
      
      console.log('');
      
      // Small delay between syncs to avoid rate limiting
      if (i < pendingProjects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('='.repeat(80));
    log('Sync Summary', 'cyan');
    console.log('='.repeat(80));
    log(`Total pending projects: ${pendingProjects.length}`, 'blue');
    log(`✅ Successfully synced: ${syncedCount}`, 'green');
    log(`❌ Failed: ${failedCount}`, 'red');
    console.log('');

    // Check sync status again
    log('Checking updated sync status...', 'blue');
    const updatedProjectsResponse = await axios.get(`${API_BASE}/projects`, { headers });
    const updatedProjects = updatedProjectsResponse.data;
    
    const syncedProjects = updatedProjects.filter(p => p.salesforceId && p.salesforceSyncStatus === 'synced');
    const stillPending = updatedProjects.filter(p => !p.salesforceId || p.salesforceSyncStatus === 'pending');
    const failedProjects = updatedProjects.filter(p => p.salesforceSyncStatus === 'failed');
    
    log(`Total projects: ${updatedProjects.length}`, 'blue');
    log(`✅ Synced: ${syncedProjects.length}`, 'green');
    log(`⏳ Pending: ${stillPending.length}`, 'yellow');
    log(`❌ Failed: ${failedProjects.length}`, 'red');
    console.log('');

  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run if executed directly
if (require.main === module) {
  syncAllPendingProjects();
}

module.exports = { syncAllPendingProjects };


