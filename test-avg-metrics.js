const jsforce = require('jsforce');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Get settings path (same as server)
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, 'server/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

// Decrypt function (same as server)
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted, return as is
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY.slice(0, 64), 'hex')
      : crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
    const ALGORITHM = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original if decryption fails
  }
};

// Get Salesforce connection (same as server)
const getSalesforceConnection = async () => {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    throw new Error('Salesforce settings not configured. Please configure Salesforce settings first.');
  }

  let encryptedSettings;
  try {
    encryptedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (parseError) {
    console.error('Error parsing settings file:', parseError);
    throw new Error('Error reading Salesforce settings. Please reconfigure your Salesforce settings.');
  }

  const salesforceUrl = encryptedSettings.salesforceUrl || encryptedSettings.loginUrl || '';
  const username = decrypt(encryptedSettings.username || '');
  const password = decrypt(encryptedSettings.password || '');
  const securityToken = decrypt(encryptedSettings.securityToken || '');

  if (!salesforceUrl || !username || !password || !securityToken) {
    throw new Error('Salesforce credentials are incomplete. Please configure all required fields.');
  }

  // Normalize Salesforce URL
  let normalizedUrl = String(salesforceUrl).trim();
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  normalizedUrl = normalizedUrl.replace(/\/services\/.*$/i, '');
  
  const urlLower = normalizedUrl.toLowerCase();
  let loginUrlForConnection = normalizedUrl;
  
  if (urlLower.includes('lightning.force.com')) {
    if (urlLower.includes('.sandbox.') || urlLower.includes('--staging') || urlLower.includes('--dev')) {
      loginUrlForConnection = 'https://test.salesforce.com';
    } else {
      loginUrlForConnection = 'https://login.salesforce.com';
    }
  } else if (urlLower.includes('.my.salesforce.com')) {
    loginUrlForConnection = 'https://login.salesforce.com';
  }

  const conn = new jsforce.Connection({
    loginUrl: loginUrlForConnection
  });

  const fullPassword = password + securityToken;
  const userInfo = await conn.login(username, fullPassword);
  console.log('Salesforce login successful, user ID:', userInfo.id);

  return conn;
};

async function testAvgMetrics() {
  try {
    console.log('=== TESTING AVG APP RECEIVED METRICS ===\n');
    
    const conn = await getSalesforceConnection();
    console.log('✓ Connected to Salesforce\n');
    
    // Step 1: Check if Contributor__c is a lookup to Contact
    console.log('STEP 1: Checking Contributor_Project__c field relationships...');
    const cpDescribe = await conn.sobject('Contributor_Project__c').describe();
    const contributorField = cpDescribe.fields.find(f => f.name === 'Contributor__c');
    
    if (contributorField) {
      console.log('Contributor__c field info:');
      console.log(`  Type: ${contributorField.type}`);
      console.log(`  Reference To: ${contributorField.referenceTo ? contributorField.referenceTo.join(', ') : 'N/A'}`);
      
      if (contributorField.referenceTo && contributorField.referenceTo.includes('Contact')) {
        console.log('✓ Contributor__c is a lookup to Contact\n');
        
        // Step 2: Find date fields in Contact
        console.log('STEP 2: Finding date fields in Contact object...');
        const contactDescribe = await conn.sobject('Contact').describe();
        const contactFieldNames = contactDescribe.fields.map(f => f.name);
        
        // Find app received fields
        const appReceivedFields = contactFieldNames.filter(f => 
          (f.toLowerCase().includes('app') && f.toLowerCase().includes('received')) ||
          (f.toLowerCase().includes('application') && f.toLowerCase().includes('date')) ||
          (f.toLowerCase().includes('received') && f.toLowerCase().includes('date'))
        );
        console.log('App Received fields found:', appReceivedFields.length > 0 ? appReceivedFields : 'NONE');
        
        // Find applied date fields
        const appliedFields = contactFieldNames.filter(f => 
          (f.toLowerCase().includes('applied') && f.toLowerCase().includes('date')) ||
          f.toLowerCase() === 'applied_date__c'
        );
        console.log('Applied date fields found:', appliedFields.length > 0 ? appliedFields : 'NONE');
        
        // Find active date fields
        const activeFields = contactFieldNames.filter(f => 
          (f.toLowerCase().includes('active') && f.toLowerCase().includes('date')) ||
          (f.toLowerCase().includes('became') && f.toLowerCase().includes('active'))
        );
        console.log('Active date fields found:', activeFields.length > 0 ? activeFields : 'NONE');
        
        // Show all date fields that might be relevant
        console.log('\nAll Contact date fields containing "app", "applied", "received", or "active":');
        const relevantDateFields = contactFieldNames.filter(f => {
          const field = contactDescribe.fields.find(ff => ff.name === f);
          if (!field || field.type !== 'date' && field.type !== 'datetime') return false;
          const lower = f.toLowerCase();
          return lower.includes('app') || lower.includes('applied') || lower.includes('received') || lower.includes('active');
        });
        console.log(relevantDateFields.length > 0 ? relevantDateFields : 'NONE FOUND');
        
        // Step 3: Test query with found fields
        if (appReceivedFields.length > 0 && appliedFields.length > 0) {
          console.log('\nSTEP 3: Testing query for Avg App Received to Applied...');
          const appReceivedField = appReceivedFields[0];
          const appliedField = appliedFields[0];
          
          const testQuery = `SELECT ${appReceivedField}, ${appliedField}
                            FROM Contact
                            WHERE ${appReceivedField} != null AND ${appliedField} != null
                            LIMIT 10`;
          
          console.log('Query:', testQuery);
          try {
            let testResult = await conn.query(testQuery);
            console.log(`✓ Found ${testResult.totalSize} Contact records with both dates`);
            
            if (testResult.records.length > 0) {
              console.log('Sample records:');
              testResult.records.slice(0, 5).forEach((record, idx) => {
                const appReceived = new Date(record[appReceivedField]);
                const applied = new Date(record[appliedField]);
                const daysDiff = Math.round((applied - appReceived) / (1000 * 60 * 60 * 24));
                console.log(`  ${idx + 1}. ${appReceivedField}: ${record[appReceivedField]}`);
                console.log(`     ${appliedField}: ${record[appliedField]}`);
                console.log(`     Days difference: ${daysDiff}`);
              });
            }
          } catch (err) {
            console.log('Error:', err.message);
          }
        }
        
        // Step 4: Check Contributor_Project__c for date fields
        console.log('\nSTEP 4: Checking Contributor_Project__c for date fields...');
        const cpDateFields = cpDescribe.fields.filter(f => 
          (f.type === 'date' || f.type === 'datetime') &&
          (f.name.toLowerCase().includes('date') || f.name.toLowerCase().includes('active') || f.name.toLowerCase().includes('applied'))
        );
        console.log('Date fields in Contributor_Project__c:', cpDateFields.length > 0 ? cpDateFields.map(f => f.name) : 'NONE');
      } else {
        console.log('⚠ Contributor__c is NOT a lookup to Contact');
        console.log(`  It references: ${contributorField.referenceTo ? contributorField.referenceTo.join(', ') : 'Unknown'}`);
      }
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAvgMetrics();

