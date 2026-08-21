const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../data/history.json');

// Ensure data directory exists
const dataDir = path.dirname(HISTORY_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Load history from file
 */
const loadHistory = () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const fileContent = fs.readFileSync(HISTORY_FILE, 'utf8');
      const history = JSON.parse(fileContent);
      return Array.isArray(history) ? history : [];
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
  return [];
};

/**
 * Save history to file
 */
const saveHistory = (history) => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving history:', error);
    throw error;
  }
};

/**
 * Log a history entry for Salesforce operations
 * @param {Object} entry - History entry object
 * @param {string} entry.operation - Operation type (create, update, delete)
 * @param {string} entry.objectType - Salesforce object type (e.g., 'Project', 'Contributor_Project__c')
 * @param {string} entry.name - Display name of the record
 * @param {string} entry.salesforceId - Salesforce record ID
 * @param {string} entry.publisher - User email who performed the operation
 * @param {Object} entry.data - Full data that was sent to Salesforce
 * @param {string} entry.status - Operation status (success, failed)
 * @param {string} entry.error - Error message if status is failed
 * @param {number} entry.recordCount - Number of records affected (for bulk operations)
 */
const logHistory = (entry) => {
  try {
    const history = loadHistory();
    
    const historyEntry = {
      id: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation: entry.operation || 'unknown',
      objectType: entry.objectType || 'Unknown',
      name: entry.name || 'Untitled',
      salesforceId: entry.salesforceId || null,
      publisher: entry.publisher || 'Unknown',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      data: entry.data || {},
      status: entry.status || 'success',
      error: entry.error || null,
      recordCount: entry.recordCount || 1,
      // Additional metadata
      metadata: entry.metadata || {}
    };

    history.push(historyEntry);

    // Keep only last 10,000 entries to prevent file from growing too large
    if (history.length > 10000) {
      history.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      history.splice(10000);
    }

    saveHistory(history);
    console.log(`History logged: ${historyEntry.operation} ${historyEntry.objectType} - ${historyEntry.name}`);
    
    return historyEntry;
  } catch (error) {
    console.error('Error logging history:', error);
    // Don't throw - history logging should not break the main operation
    return null;
  }
};

/**
 * Log a successful create operation
 */
const logCreate = (objectType, name, salesforceId, publisher, data, metadata = {}) => {
  return logHistory({
    operation: 'create',
    objectType,
    name,
    salesforceId,
    publisher,
    data,
    status: 'success',
    metadata
  });
};

/**
 * Log a successful update operation
 */
const logUpdate = (objectType, name, salesforceId, publisher, data, recordCount = 1, metadata = {}) => {
  return logHistory({
    operation: 'update',
    objectType,
    name,
    salesforceId,
    publisher,
    data,
    status: 'success',
    recordCount,
    metadata
  });
};

/**
 * Log a failed operation
 */
const logError = (operation, objectType, name, publisher, error, data = {}, metadata = {}) => {
  return logHistory({
    operation,
    objectType,
    name,
    salesforceId: null,
    publisher,
    data,
    status: 'failed',
    error: error.message || String(error),
    metadata
  });
};

/**
 * Log a bulk operation
 * @param {string} operation - Operation type
 * @param {string} objectType - Object type
 * @param {string} publisher - User email
 * @param {Array} results - Array of { success, id } objects
 * @param {Object} metadata - Additional metadata
 * @param {Object} fieldChanges - Optional field changes data to store in history
 */
const logBulkOperation = (operation, objectType, publisher, results, metadata = {}, fieldChanges = null) => {
  const successCount = results.filter(r => r.success !== false).length;
  const failCount = results.length - successCount;
  
  // Merge field changes into data if provided
  const data = { results };
  if (fieldChanges) {
    Object.assign(data, fieldChanges);
  }
  
  return logHistory({
    operation,
    objectType,
    name: `Bulk ${operation}: ${successCount} succeeded, ${failCount} failed`,
    salesforceId: null,
    publisher,
    data: data,
    status: failCount === 0 ? 'success' : 'partial',
    error: failCount > 0 ? `${failCount} records failed` : null,
    recordCount: results.length,
    metadata: {
      ...metadata,
      successCount,
      failCount
    }
  });
};

module.exports = {
  loadHistory,
  saveHistory,
  logHistory,
  logCreate,
  logUpdate,
  logError,
  logBulkOperation
};










