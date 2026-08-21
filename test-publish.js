const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testPublish() {
  try {
    console.log('=== Testing Publish Functionality ===\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Check Salesforce settings
    console.log('2. Checking Salesforce settings...');
    try {
      const settingsResponse = await axios.get(`${API_BASE_URL}/api/salesforce/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const settings = settingsResponse.data;
      console.log('✅ Salesforce settings found');
      console.log('   URL:', settings.salesforceUrl || settings.loginUrl || 'Not set');
      console.log('   Username:', settings.username ? (settings.username.substring(0, 20) + '...') : 'Not set');
      console.log('   Domain:', settings.domain || 'Not set');
      
      // Check if settings are properly configured
      if (!settings.salesforceUrl && !settings.loginUrl) {
        console.log('⚠️  Salesforce URL is not configured');
        console.log('   Please configure Salesforce settings in the UI first\n');
        return;
      }
      if (!settings.username) {
        console.log('⚠️  Salesforce username is not configured');
        console.log('   Please configure Salesforce settings in the UI first\n');
        return;
      }
      console.log('');
    } catch (error) {
      console.log('⚠️  Salesforce settings not configured');
      console.log('   Error:', error.response?.data?.error || error.message);
      console.log('   Please configure Salesforce settings in the UI first\n');
      return;
    }

    // Step 3: Test Salesforce connection
    console.log('3. Testing Salesforce connection...');
    try {
      // Get settings again to use in test
      const settingsResponse = await axios.get(`${API_BASE_URL}/api/salesforce/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const settings = settingsResponse.data;
      
      // Test connection with saved settings
      const testResponse = await axios.post(`${API_BASE_URL}/api/salesforce/test`, {
        salesforceUrl: settings.salesforceUrl || settings.loginUrl,
        username: settings.username,
        password: settings.password,
        securityToken: settings.securityToken,
        domain: settings.domain
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (testResponse.data.success) {
        console.log('✅ Salesforce connection successful\n');
      } else {
        console.log('❌ Salesforce connection failed:', testResponse.data.message || testResponse.data.error);
        console.log('   Please check your Salesforce credentials\n');
        return;
      }
    } catch (error) {
      console.log('❌ Salesforce connection test failed:', error.response?.data?.error || error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('   Please check your Salesforce credentials\n');
      return;
    }

    // Step 4: Test publish with sample data
    console.log('4. Testing publish with sample project data...');
    const sampleProjectData = {
      projectName: 'Test Project - Publish Test',
      contributorProjectName: 'Test Project - Publish Test',
      shortProjectName: 'Test Publish',
      projectType: 'Crowd',
      projectPriority: 50.0,
      projectStatus: 'Draft',
      projectPaymentMethod: 'Self-Reported only',
      account: 'Test Account',
      appenPartner: 'Test Partner'
    };

    console.log('   Sample data:', JSON.stringify(sampleProjectData, null, 2));
    console.log('   Publishing to Salesforce...\n');

    try {
      const publishResponse = await axios.post(
        `${API_BASE_URL}/api/salesforce/create-project`,
        sampleProjectData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes
        }
      );

      if (publishResponse.data.success) {
        console.log('✅ Project published successfully to Salesforce!');
        console.log('   Salesforce ID:', publishResponse.data.salesforceId);
        console.log('   Object Type:', publishResponse.data.objectType);
        console.log('   Message:', publishResponse.data.message);
        console.log('\n✅ Publish functionality is working correctly!\n');
      } else {
        console.log('❌ Publish failed:', publishResponse.data.error || publishResponse.data.message);
        console.log('\n❌ Publish functionality test failed\n');
      }
    } catch (error) {
      console.log('❌ Publish request failed:', error.response?.data?.error || error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('\n❌ Publish functionality test failed\n');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testPublish();

