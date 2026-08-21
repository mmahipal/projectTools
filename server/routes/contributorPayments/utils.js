// Shared utilities for contributorPayments routes

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jsforce = require('jsforce');

/**
 * Get Salesforce settings path
 */
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

/**
 * Decrypt credentials
 */
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text;
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
    return text;
  }
};

/**
 * Get Salesforce connection (user-specific)
 */
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  return parseFloat(amount).toFixed(2);
};

module.exports = {
  getSettingsPath,
  decrypt,
  getSalesforceConnection,
  formatCurrency
};

