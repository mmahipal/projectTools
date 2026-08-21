// Encryption utilities for Salesforce credentials

const crypto = require('crypto');

/**
 * Get encryption key from environment or use default
 * @returns {Buffer} Encryption key
 */
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    const key = process.env.ENCRYPTION_KEY;
    if (key.length >= 64) {
      return Buffer.from(key.slice(0, 64), 'hex');
    }
    return crypto.createHash('sha256').update(key).digest();
  }
  // Default key (in production, always use ENV variable)
  return crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text (iv:encrypted)
 */
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt text using AES-256-CBC
 * @param {string} text - Encrypted text (iv:encrypted)
 * @returns {string} Decrypted text
 */
function decrypt(text) {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      console.warn('Invalid encrypted text format, returning empty string');
      return '';
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.warn('Decryption error:', error.message);
    return '';
  }
}

module.exports = {
  encrypt,
  decrypt,
  getEncryptionKey
};

