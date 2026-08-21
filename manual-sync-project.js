#!/usr/bin/env node

/**
 * Manually Sync a Project to Salesforce
 * 
 * This script manually triggers Salesforce sync for a project
 * to test if the sync is working and see any errors.
 * 
 * Usage:
 *   node manual-sync-project.js [project-id]
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

async function manualSyncProject(projectId) {
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

    // Get project data
    if (projectId) {
      log(`Fetching project ${projectId}...`, 'blue');
      const projectResponse = await axios.get(`${API_BASE}/projects/${projectId}`, { headers });
      const project = projectResponse.data;

      log(`Project found: ${project.projectName || project.name || 'Unnamed'}`, 'green');
      console.log('');

      // Try to sync to Salesforce
      log('Attempting to sync project to Salesforce...', 'blue');
      try {
        const syncResponse = await axios.post(
          `${API_BASE}/salesforce/create-project`,
          project,
          { headers }
        );

        if (syncResponse.data.success) {
          log('✅ Project synced to Salesforce successfully!', 'green');
          console.log(`   Salesforce ID: ${syncResponse.data.salesforceId}`);
          console.log(`   Object Type: ${syncResponse.data.objectType}`);
          console.log(`   Message: ${syncResponse.data.message}`);
        } else {
          log('❌ Sync failed', 'red');
          console.log('Response:', JSON.stringify(syncResponse.data, null, 2));
        }
      } catch (syncError) {
        log('❌ Sync error:', 'red');
        console.error('Error:', syncError.message);
        if (syncError.response?.data) {
          console.error('Response:', JSON.stringify(syncError.response.data, null, 2));
        }
        if (syncError.response?.status) {
          console.error('Status:', syncError.response.status);
        }
      }
    } else {
      // Get all projects and try to sync the most recent one
      log('Fetching all projects...', 'blue');
      const projectsResponse = await axios.get(`${API_BASE}/projects`, { headers });
      const projects = projectsResponse.data;

      if (!Array.isArray(projects) || projects.length === 0) {
        log('No projects found', 'yellow');
        return;
      }

      // Find a pending project
      const pendingProject = projects.find(p => !p.salesforceId || p.salesforceSyncStatus === 'pending');
      
      if (!pendingProject) {
        log('No pending projects found', 'yellow');
        return;
      }

      log(`Found pending project: ${pendingProject.projectName || pendingProject.name || 'Unnamed'}`, 'green');
      log(`Project ID: ${pendingProject.id}`, 'blue');
      console.log('');

      // Try to sync to Salesforce
      log('Attempting to sync project to Salesforce...', 'blue');
      try {
        const syncResponse = await axios.post(
          `${API_BASE}/salesforce/create-project`,
          pendingProject,
          { headers }
        );

        if (syncResponse.data.success) {
          log('✅ Project synced to Salesforce successfully!', 'green');
          console.log(`   Salesforce ID: ${syncResponse.data.salesforceId}`);
          console.log(`   Object Type: ${syncResponse.data.objectType}`);
          console.log(`   Message: ${syncResponse.data.message}`);
        } else {
          log('❌ Sync failed', 'red');
          console.log('Response:', JSON.stringify(syncResponse.data, null, 2));
        }
      } catch (syncError) {
        log('❌ Sync error:', 'red');
        console.error('Error:', syncError.message);
        if (syncError.response?.data) {
          console.error('Response:', JSON.stringify(syncError.response.data, null, 2));
        }
        if (syncError.response?.status) {
          console.error('Status:', syncError.response.status);
        }
        if (syncError.stack) {
          console.error('Stack:', syncError.stack);
        }
      }
    }

  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Get project ID from command line
const projectId = process.argv[2];

// Run
manualSyncProject(projectId);


