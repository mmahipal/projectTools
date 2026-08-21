/**
 * Test Salesforce Connection Script
 * Tests the Salesforce connection using stored settings and the updated connection code
 */

const { testSalesforceConnection } = require('./server/services/salesforce/connectionService');
const { loadSalesforceSettings } = require('./server/services/salesforce/connectionService');

async function testConnection() {
  console.log('🔍 Testing Salesforce Connection...\n');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Load settings from storage
    console.log('📂 Loading Salesforce settings from storage...');
    const settings = loadSalesforceSettings();
    
    console.log('✅ Settings loaded successfully');
    console.log('   Salesforce URL:', settings.salesforceUrl.substring(0, 50) + '...');
    console.log('   Username:', settings.username);
    console.log('   Has Password:', !!settings.password);
    console.log('   Has Security Token:', !!settings.securityToken);
    console.log('');
    
    // Test connection with timeout (30 seconds)
    console.log('🔌 Testing connection to Salesforce...');
    console.log('   Timeout: 30 seconds');
    console.log('   Using updated connection service with timeout handling...\n');
    
    const result = await Promise.race([
      testSalesforceConnection({
        salesforceUrl: settings.salesforceUrl,
        username: settings.username,
        password: settings.password,
        securityToken: settings.securityToken
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Connection test timed out after 30 seconds.`));
        }, 30000);
      })
    ]);
    
    const elapsed = Date.now() - startTime;
    
    console.log('='.repeat(60));
    console.log('✅ CONNECTION TEST SUCCESSFUL!\n');
    console.log('📊 Connection Details:');
    console.log('   User ID:', result.userId);
    console.log('   Organization ID:', result.organizationId);
    console.log('   Instance URL:', result.url);
    console.log('   Connection Time:', elapsed + 'ms');
    console.log('');
    console.log('✅ All tests passed! The connection is working correctly.');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log('='.repeat(60));
    console.log('❌ CONNECTION TEST FAILED\n');
    console.log('⏱️  Elapsed Time:', elapsed + 'ms');
    console.log('❌ Error:', error.message);
    console.log('');
    
    if (error.message.includes('timed out')) {
      console.log('💡 Timeout Error Details:');
      console.log('   - The connection took longer than 30 seconds');
      console.log('   - This may indicate network issues or incorrect URL');
      console.log('   - Check your network connection and Salesforce URL');
    } else if (error.message.includes('INVALID_LOGIN') || error.message.includes('authentication')) {
      console.log('💡 Authentication Error Details:');
      console.log('   - Invalid username, password, or security token');
      console.log('   - Please verify your credentials in Settings');
      console.log('   - Security tokens may expire and need to be regenerated');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('💡 Network Error Details:');
      console.log('   - Unable to resolve the Salesforce URL');
      console.log('   - Check that the URL is correct and accessible');
    } else {
      console.log('💡 Error Details:');
      console.log('   -', error.message);
    }
    
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testConnection();
