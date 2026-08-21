// Approval workflow system for critical updates in Update Object Fields

const fs = require('fs');
const path = require('path');

// Helper to get approval requests file path
const getApprovalFilePath = () => {
  const dataDir = path.join(__dirname, '../../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'update-approvals.json');
};

// Critical fields that require approval
const CRITICAL_FIELDS = [
  'Status__c',
  'OwnerId',
  'AccountId',
  'ContactId',
  'Amount',
  'StageName'
];

// Load approval requests
const loadApprovalRequests = () => {
  const filePath = getApprovalFilePath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Approval] Error loading approval requests:', error);
    return [];
  }
};

// Save approval requests
const saveApprovalRequests = (requests) => {
  const filePath = getApprovalFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Approval] Error saving approval requests:', error);
    return false;
  }
};

/**
 * Check if an update requires approval
 * @param {Object} updateConfig - Update configuration
 * @returns {boolean}
 */
const requiresApproval = (updateConfig) => {
  // Check if updating a critical field
  if (updateConfig.fieldName && CRITICAL_FIELDS.includes(updateConfig.fieldName)) {
    return true;
  }
  
  // Check if updating multiple critical fields
  if (updateConfig.fieldUpdates && Array.isArray(updateConfig.fieldUpdates)) {
    const hasCriticalField = updateConfig.fieldUpdates.some(fu => 
      CRITICAL_FIELDS.includes(fu.fieldName)
    );
    if (hasCriticalField) return true;
  }
  
  // Check if affecting many records (threshold: 1000)
  if (updateConfig.estimatedRecordCount && updateConfig.estimatedRecordCount > 1000) {
    return true;
  }
  
  return false;
};

/**
 * Create an approval request
 * @param {Object} updateConfig - Update configuration
 * @param {string} requestedBy - User email
 * @param {number} estimatedCount - Estimated number of records
 * @returns {Object} Approval request object
 */
const createApprovalRequest = (updateConfig, requestedBy, estimatedCount = 0) => {
  const requests = loadApprovalRequests();
  
  const approvalRequest = {
    id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    updateConfig,
    requestedBy,
    requestedAt: new Date().toISOString(),
    estimatedRecordCount: estimatedCount,
    status: 'pending', // pending, approved, rejected
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null
  };
  
  requests.push(approvalRequest);
  saveApprovalRequests(requests);
  
  return approvalRequest;
};

/**
 * Get approval request by ID
 * @param {string} approvalId
 * @returns {Object|null}
 */
const getApprovalRequest = (approvalId) => {
  const requests = loadApprovalRequests();
  return requests.find(r => r.id === approvalId) || null;
};

/**
 * Approve an update request
 * @param {string} approvalId
 * @param {string} approvedBy - User email
 * @returns {Object|null}
 */
const approveRequest = (approvalId, approvedBy) => {
  const requests = loadApprovalRequests();
  const request = requests.find(r => r.id === approvalId);
  
  if (!request) {
    return null;
  }
  
  if (request.status !== 'pending') {
    return { error: 'Request is not pending approval' };
  }
  
  request.status = 'approved';
  request.approvedBy = approvedBy;
  request.approvedAt = new Date().toISOString();
  
  saveApprovalRequests(requests);
  return request;
};

/**
 * Reject an update request
 * @param {string} approvalId
 * @param {string} rejectedBy - User email
 * @param {string} reason - Rejection reason
 * @returns {Object|null}
 */
const rejectRequest = (approvalId, rejectedBy, reason = '') => {
  const requests = loadApprovalRequests();
  const request = requests.find(r => r.id === approvalId);
  
  if (!request) {
    return null;
  }
  
  if (request.status !== 'pending') {
    return { error: 'Request is not pending approval' };
  }
  
  request.status = 'rejected';
  request.rejectedBy = rejectedBy;
  request.rejectedAt = new Date().toISOString();
  request.rejectionReason = reason;
  
  saveApprovalRequests(requests);
  return request;
};

/**
 * Get all approval requests
 * @param {string} status - Filter by status (optional)
 * @returns {Array}
 */
const getAllApprovalRequests = (status = null) => {
  const requests = loadApprovalRequests();
  if (status) {
    return requests.filter(r => r.status === status);
  }
  return requests;
};

module.exports = {
  requiresApproval,
  createApprovalRequest,
  getApprovalRequest,
  approveRequest,
  rejectRequest,
  getAllApprovalRequests,
  CRITICAL_FIELDS
};

