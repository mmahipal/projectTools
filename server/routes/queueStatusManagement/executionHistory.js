/**
 * Execution History Storage for Queue Status Rules
 * Tracks all rule executions (automatic and manual)
 */

const fs = require('fs');
const path = require('path');

const getHistoryPath = () => {
  const dataDir = path.join(__dirname, '../../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'queue-status-execution-history.json');
};

/**
 * Load execution history
 * @returns {Array} Array of execution history entries
 */
const loadExecutionHistory = () => {
  const historyPath = getHistoryPath();
  
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(historyPath, 'utf8');
    const history = JSON.parse(data);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('[Execution History] Error loading history:', error);
    return [];
  }
};

/**
 * Save execution history
 * @param {Object} historyEntry - Execution history entry
 */
const saveExecutionHistory = (historyEntry) => {
  try {
    const history = loadExecutionHistory();
    
    // Add new entry at the beginning
    history.unshift(historyEntry);
    
    // Keep only last 1000 entries to prevent file from growing too large
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    const historyPath = getHistoryPath();
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    
    console.log(`[Execution History] Saved execution history entry: ${historyEntry.id}`);
  } catch (error) {
    console.error('[Execution History] Error saving history:', error);
  }
};

/**
 * Get execution history
 * @param {Object} options - Query options (limit, offset, ruleId, etc.)
 * @returns {Array} Array of execution history entries
 */
const getExecutionHistory = (options = {}) => {
  let history = loadExecutionHistory();
  
  const { limit = 100, offset = 0, ruleId = null, startDate = null, endDate = null } = options;
  
  // Filter by rule ID if provided
  if (ruleId) {
    history = history.filter(entry => 
      entry.executedRules && entry.executedRules.some(r => r.ruleId === ruleId)
    );
  }
  
  // Filter by date range if provided
  if (startDate) {
    const start = new Date(startDate);
    history = history.filter(entry => new Date(entry.executionTime) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    history = history.filter(entry => new Date(entry.executionTime) <= end);
  }
  
  // Sort by execution time (newest first)
  history.sort((a, b) => new Date(b.executionTime) - new Date(a.executionTime));
  
  // Apply pagination
  const paginatedHistory = history.slice(offset, offset + limit);
  
  return {
    history: paginatedHistory,
    total: history.length,
    limit,
    offset
  };
};

/**
 * Clear old execution history (older than specified days)
 * @param {number} daysToKeep - Number of days to keep (default: 90)
 */
const clearOldHistory = (daysToKeep = 90) => {
  try {
    const history = loadExecutionHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredHistory = history.filter(entry => 
      new Date(entry.executionTime) >= cutoffDate
    );
    
    const historyPath = getHistoryPath();
    fs.writeFileSync(historyPath, JSON.stringify(filteredHistory, null, 2));
    
    console.log(`[Execution History] Cleared ${history.length - filteredHistory.length} old entries`);
    return filteredHistory.length;
  } catch (error) {
    console.error('[Execution History] Error clearing old history:', error);
    return 0;
  }
};

module.exports = {
  saveExecutionHistory,
  getExecutionHistory,
  loadExecutionHistory,
  clearOldHistory
};

