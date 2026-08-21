#!/usr/bin/env node

/**
 * Check Salesforce Instance Configuration
 * 
 * This script shows which Salesforce instance is configured
 * and will be used when creating projects.
 * 
 * Usage:
 *   node check-salesforce-instance.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Encryption key (must match server)
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    const key = process.env.ENCRYPTION_KEY;
    if (key.length >= 64) {
      return Buffer.from(key.slice(0, 64), 'hex');
    }
    return crypto.createHash('sha256').update(key).digest();
  }
  return crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Decrypt function (must match server)
function decrypt(text) {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      return '';
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return '';
  }
}

// Get settings file path
const getSettingsPath = () => {
  const settingsDir = path.join(__dirname, 'server/data');
  return path.join(settingsDir, 'salesforce-settings.json');
};

// Determine instance type from URL
function getInstanceInfo(salesforceUrl) {
  if (!salesforceUrl) {
    return {
      type: 'Not Configured',
      loginUrl: null,
      instanceUrl: null,
      isSandbox: false,
      isProduction: false
    };
  }

  const urlLower = salesforceUrl.toLowerCase();
  let instanceType = 'Unknown';
  let loginUrl = null;
  let isSandbox = false;
  let isProduction = false;

  // Normalize URL
  let normalizedUrl = String(salesforceUrl).trim();
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  normalizedUrl = normalizedUrl.replace(/\/services\/.*$/i, '');

  // Determine instance type
  if (urlLower.includes('lightning.force.com')) {
    if (urlLower.includes('.sandbox.') || urlLower.includes('--staging') || urlLower.includes('--dev')) {
      instanceType = 'Sandbox';
      loginUrl = 'https://test.salesforce.com';
      isSandbox = true;
    } else {
      instanceType = 'Production';
      loginUrl = 'https://login.salesforce.com';
      isProduction = true;
    }
  } else if (urlLower.includes('test.salesforce.com') || urlLower.includes('test--')) {
    instanceType = 'Sandbox';
    loginUrl = 'https://test.salesforce.com';
    isSandbox = true;
  } else if (urlLower.includes('login.salesforce.com') || urlLower.includes('.my.salesforce.com')) {
    instanceType = 'Production';
    loginUrl = 'https://login.salesforce.com';
    isProduction = true;
  } else {
    instanceType = 'Custom Domain';
    loginUrl = normalizedUrl;
  }

  return {
    type: instanceType,
    configuredUrl: normalizedUrl,
    loginUrl: loginUrl,
    instanceUrl: normalizedUrl,
    isSandbox: isSandbox,
    isProduction: isProduction
  };
}

// Main function
function checkSalesforceInstance() {
  console.log('='.repeat(60));
  console.log('Salesforce Instance Configuration Check');
  console.log('='.repeat(60));
  console.log('');

  const settingsPath = getSettingsPath();

  if (!fs.existsSync(settingsPath)) {
    console.log('❌ Salesforce settings file not found');
    console.log(`   Path: ${settingsPath}`);
    console.log('');
    console.log('To configure Salesforce:');
    console.log('  1. Go to Settings > Salesforce Configuration in the UI');
    console.log('  2. Enter your Salesforce URL, username, password, and security token');
    console.log('  3. Click "Test Connection" to verify');
    console.log('  4. Click "Save Settings" to save');
    return;
  }

  try {
    const encryptedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Decrypt credentials
    const salesforceUrl = encryptedSettings.salesforceUrl || encryptedSettings.loginUrl || '';
    const username = decrypt(encryptedSettings.username || '');
    const password = decrypt(encryptedSettings.password || '');
    const securityToken = decrypt(encryptedSettings.securityToken || '');

    // Get instance info
    const instanceInfo = getInstanceInfo(salesforceUrl);

    console.log('✅ Salesforce settings found');
    console.log('');

    console.log('📋 Configuration:');
    console.log(`   Salesforce URL: ${salesforceUrl || 'Not set'}`);
    console.log(`   Username: ${username ? username.substring(0, 3) + '***' : 'Not set'}`);
    console.log(`   Password: ${password ? '***' : 'Not set'}`);
    console.log(`   Security Token: ${securityToken ? '***' : 'Not set'}`);
    console.log(`   Domain: ${encryptedSettings.domain || 'Not set'}`);
    console.log('');

    console.log('🔗 Instance Information:');
    console.log(`   Instance Type: ${instanceInfo.type}`);
    console.log(`   Configured URL: ${instanceInfo.configuredUrl || 'N/A'}`);
    console.log(`   Login URL: ${instanceInfo.loginUrl || 'N/A'}`);
    console.log(`   Is Sandbox: ${instanceInfo.isSandbox ? 'Yes' : 'No'}`);
    console.log(`   Is Production: ${instanceInfo.isProduction ? 'Yes' : 'No'}`);
    console.log('');

    if (!salesforceUrl || !username || !password || !securityToken) {
      console.log('⚠️  Warning: Incomplete configuration');
      console.log('   Some credentials are missing. Please reconfigure Salesforce settings.');
      console.log('');
    } else {
      console.log('✅ Configuration is complete');
      console.log('');
      console.log('📝 When creating projects:');
      console.log(`   Projects will be created in: ${instanceInfo.type}`);
      console.log(`   Using login URL: ${instanceInfo.loginUrl}`);
      console.log(`   Instance URL: ${instanceInfo.configuredUrl}`);
      console.log('');
      
      if (instanceInfo.isSandbox) {
        console.log('⚠️  Note: This is a SANDBOX instance');
        console.log('   Projects created here are for testing only');
      } else if (instanceInfo.isProduction) {
        console.log('⚠️  Note: This is a PRODUCTION instance');
        console.log('   Projects created here will be live');
      }
    }

  } catch (error) {
    console.error('❌ Error reading Salesforce settings:', error.message);
    console.error(`   Path: ${settingsPath}`);
  }

  console.log('');
  console.log('='.repeat(60));
}

// Run if executed directly
if (require.main === module) {
  checkSalesforceInstance();
}

module.exports = { checkSalesforceInstance, getInstanceInfo };


