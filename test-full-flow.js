const axios = require('axios');

async function testFullFlow() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Login successful');

    // 2. Get project
    const projectRes = await axios.get('http://localhost:5000/api/projects/PROJ-1762439564782', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const project = projectRes.data;
    console.log('✅ Project retrieved:', project.id);
    console.log('   Sync status:', project.salesforceSyncStatus);

    // 3. Prepare data for sync (same as retry sync endpoint)
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

    if (!projectDataForSync.contributorProjectName || projectDataForSync.contributorProjectName.trim() === '') {
      projectDataForSync.contributorProjectName = projectDataForSync.projectName || projectDataForSync.name || 'New Project';
    }

    console.log('\n📤 Data prepared for sync:');
    console.log('   Keys:', Object.keys(projectDataForSync).length);
    console.log('   Project Type:', projectDataForSync.projectType);
    console.log('   Contributor Project Name:', projectDataForSync.contributorProjectName);

    // 4. Call retry sync endpoint
    console.log('\n🔄 Calling retry sync endpoint...');
    const retryRes = await axios.post(
      `http://localhost:5000/api/projects/${project.id}/retry-sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000
      }
    );
    console.log('✅ Retry sync response:', retryRes.data);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

testFullFlow();
