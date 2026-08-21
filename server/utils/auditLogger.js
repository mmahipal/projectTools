const fs = require('fs');
const path = require('path');

// Get audit logs file path
const getAuditLogsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'audit-logs.json');
};

// Load audit logs from file
const loadAuditLogs = () => {
  try {
    const logsPath = getAuditLogsPath();
    if (fs.existsSync(logsPath)) {
      const fileContent = fs.readFileSync(logsPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading audit logs:', error);
  }
  return [];
};

// Save audit logs to file
const saveAuditLogs = (logs) => {
  try {
    const logsPath = getAuditLogsPath();
    // Keep only last 10,000 logs to prevent file from growing too large
    const logsToSave = logs.slice(-10000);
    fs.writeFileSync(logsPath, JSON.stringify(logsToSave, null, 2));
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
};

// Log an audit event
const logAuditEvent = (event) => {
  const logs = loadAuditLogs();
  const auditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: event.user || 'Unknown',
    action: event.action || 'Unknown', // Added, Modified, Deleted, etc.
    objectType: event.objectType || 'Unknown', // Project, ProjectObjective, etc.
    objectId: event.objectId || null,
    objectName: event.objectName || null,
    details: event.details || {},
    salesforceId: event.salesforceId || null,
    status: event.status || 'success', // success, failed
    error: event.error || null
  };
  
  logs.push(auditLog);
  saveAuditLogs(logs);
  
  return auditLog;
};

// Get audit logs with optional filters
const getAuditLogs = (filters = {}) => {
  let logs = loadAuditLogs();
  
  // Filter by user
  if (filters.user) {
    logs = logs.filter(log => 
      log.user && log.user.toLowerCase().includes(filters.user.toLowerCase())
    );
  }
  
  // Filter by action
  if (filters.action && filters.action !== 'All') {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  // Filter by date range
  if (filters.startDate || filters.endDate) {
    logs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (logDate < startDate) return false;
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) return false;
      }
      return true;
    });
  }
  
  // Filter by object type
  if (filters.objectType) {
    logs = logs.filter(log => log.objectType === filters.objectType);
  }
  
  // Sort by timestamp (latest first by default)
  const sortOrder = filters.sortOrder || 'desc';
  logs.sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  return logs;
};

module.exports = {
  logAuditEvent,
  getAuditLogs,
  loadAuditLogs
};

