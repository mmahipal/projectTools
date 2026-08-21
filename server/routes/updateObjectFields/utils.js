// Shared utilities for updateObjectFields routes

const fs = require('fs');
const path = require('path');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');

/**
 * Get Salesforce settings path (user-specific)
 * Uses persistent location outside codebase to survive code merges
 * @param {string} userId - User ID for user-specific settings
 * @returns {string} Path to settings file
 */
const getSettingsPath = (userId = null) => {
  // Use the centralized dataStorage utility for consistency
  const { getSettingsPath: getSalesforceSettingsPath } = require('../../utils/salesforce/dataStorage');
  return getSalesforceSettingsPath(userId);
};

/**
 * Decrypt credentials
 */
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted, return as is
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const crypto = require('crypto');
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

/**
 * Get Salesforce connection (user-specific)
 * @param {string} userId - User ID for user-specific settings
 * @returns {Promise<jsforce.Connection>} Authenticated Salesforce connection
 */
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Object name mapping
 */
const objectNameMap = {
  'project': 'Project__c',
  'project objective': 'Project_Objective__c',
  'contributor project': 'Contributor_Project__c',
  'contributor': 'Contact',
  'cases': 'Case'
};

/**
 * Apply transformation to a value
 */
const applyTransformation = (value, transformation, options = {}) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (transformation) {
    case 'copy':
      return value;
    case 'uppercase':
      return String(value).toUpperCase();
    case 'lowercase':
      return String(value).toLowerCase();
    case 'textReplace':
      // Text replacement transformation
      if (!options.findText) return value;
      let text = String(value);
      const findText = options.findText;
      const replaceText = options.replaceText || '';
      const caseSensitive = options.caseSensitive || false;
      const useRegex = options.useRegex || false;
      const replaceMode = options.replaceMode || 'all';
      
      try {
        if (useRegex) {
          const flags = caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(findText, flags);
          if (replaceMode === 'first') {
            text = text.replace(regex, replaceText);
          } else if (replaceMode === 'last') {
            const lastIndex = text.lastIndexOf(caseSensitive ? findText : new RegExp(findText, 'i').exec(text)?.index);
            if (lastIndex !== -1) {
              text = text.substring(0, lastIndex) + replaceText + text.substring(lastIndex + findText.length);
            }
          } else {
            text = text.replace(regex, replaceText);
          }
        } else {
          if (caseSensitive) {
            if (replaceMode === 'first') {
              text = text.replace(findText, replaceText);
            } else if (replaceMode === 'last') {
              const lastIndex = text.lastIndexOf(findText);
              if (lastIndex !== -1) {
                text = text.substring(0, lastIndex) + replaceText + text.substring(lastIndex + findText.length);
              }
            } else {
              text = text.split(findText).join(replaceText);
            }
          } else {
            const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            if (replaceMode === 'first') {
              text = text.replace(regex, replaceText);
            } else if (replaceMode === 'last') {
              const matches = [...text.matchAll(regex)];
              if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                text = text.substring(0, lastMatch.index) + replaceText + text.substring(lastMatch.index + lastMatch[0].length);
              }
            } else {
              text = text.replace(regex, replaceText);
            }
          }
        }
        return text;
      } catch (error) {
        console.error('Error in textReplace transformation:', error);
        return value;
      }
    case 'defaultValue':
      // Default value transformation - handled separately as it needs to check for empty/null
      return value;
    case 'typeConversion':
      // Type conversion transformation
      const targetType = options.targetType || 'string';
      try {
        if (targetType === 'number') {
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        } else if (targetType === 'boolean') {
          const str = String(value).toLowerCase().trim();
          return str === 'true' || str === '1' || str === 'yes' || str === 'on';
        } else if (targetType === 'date') {
          if (value instanceof Date) {
            return value;
          }
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        } else {
          return String(value);
        }
      } catch (error) {
        console.error('Error in typeConversion transformation:', error);
        return null;
      }
    case 'validateFormat':
      // Format validation - handled separately as it needs validation logic
      return value;
    case 'removeSpecialChars':
      // Remove special characters transformation
      const removeMode = options.removeMode || 'removeAll';
      let cleaned = String(value);
      try {
        if (removeMode === 'keepOnlyNumbers') {
          cleaned = cleaned.replace(/[^0-9]/g, '');
        } else if (removeMode === 'keepOnlyLetters') {
          cleaned = cleaned.replace(/[^a-zA-Z]/g, '');
        } else if (removeMode === 'keepOnlyAlphanumeric') {
          cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, '');
        } else {
          // removeAll - remove all special characters except spaces, letters, and numbers
          cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, '');
        }
        return cleaned;
      } catch (error) {
        console.error('Error in removeSpecialChars transformation:', error);
        return value;
      }
    case 'concatenate':
      // This will be handled separately as it needs multiple fields
      return value;
    case 'formula':
      // This will be handled separately as it needs field context
      return value;
    case 'dateFormat':
      // Simple date formatting - in production, use a proper date library
      if (value instanceof Date) {
        const date = value;
        const format = options.dateFormat || 'YYYY-MM-DD';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return format
          .replace('YYYY', year)
          .replace('MM', month)
          .replace('DD', day);
      }
      return value;
    case 'numberFormat':
      // Simple number formatting
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      const format = options.numberFormat || '0.00';
      if (format.includes('.')) {
        const decimals = format.split('.')[1].length;
        return num.toFixed(decimals);
      }
      return Math.round(num).toString();
    default:
      return value;
  }
};

module.exports = {
  getSettingsPath,
  decrypt,
  getSalesforceConnection,
  asyncHandler,
  objectNameMap,
  applyTransformation
};

