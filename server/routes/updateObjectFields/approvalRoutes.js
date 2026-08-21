// Approval workflow routes for Update Object Fields

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const {
  requiresApproval,
  createApprovalRequest,
  getApprovalRequest,
  approveRequest,
  rejectRequest,
  getAllApprovalRequests
} = require('./approval');
const { validateUpdate } = require('./validation');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create approval request
router.post('/request', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { updateConfig, estimatedRecordCount } = req.body;
    const requestedBy = req.user.email;

    if (!updateConfig) {
      return res.status(400).json({
        success: false,
        error: 'Update configuration is required'
      });
    }

    // Check if approval is required
    const needsApproval = requiresApproval({
      ...updateConfig,
      estimatedRecordCount
    });

    if (!needsApproval) {
      return res.status(400).json({
        success: false,
        error: 'This update does not require approval'
      });
    }

    // Create approval request
    const approvalRequest = createApprovalRequest(updateConfig, requestedBy, estimatedRecordCount || 0);

    res.json({
      success: true,
      approvalRequest
    });
  } catch (error) {
    console.error('[Approval] Error creating approval request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create approval request'
    });
  }
}));

// Get approval request
router.get('/request/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const approvalRequest = getApprovalRequest(id);

    if (!approvalRequest) {
      return res.status(404).json({
        success: false,
        error: 'Approval request not found'
      });
    }

    res.json({
      success: true,
      approvalRequest
    });
  } catch (error) {
    console.error('[Approval] Error fetching approval request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approval request'
    });
  }
}));

// Get all approval requests
router.get('/requests', authenticate, asyncHandler(async (req, res) => {
  try {
    const { status } = req.query;
    const requests = getAllApprovalRequests(status || null);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('[Approval] Error fetching approval requests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approval requests'
    });
  }
}));

// Approve request
router.post('/request/:id/approve', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user.email;

    const result = approveRequest(id, approvedBy);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Approval request not found'
      });
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      approvalRequest: result
    });
  } catch (error) {
    console.error('[Approval] Error approving request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve request'
    });
  }
}));

// Reject request
router.post('/request/:id/reject', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectedBy = req.user.email;

    const result = rejectRequest(id, rejectedBy, reason || '');

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Approval request not found'
      });
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      approvalRequest: result
    });
  } catch (error) {
    console.error('[Approval] Error rejecting request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject request'
    });
  }
}));

// Check if update requires approval
router.post('/check-approval', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { updateConfig, estimatedRecordCount } = req.body;

    if (!updateConfig) {
      return res.status(400).json({
        success: false,
        error: 'Update configuration is required'
      });
    }

    const needsApproval = requiresApproval({
      ...updateConfig,
      estimatedRecordCount: estimatedRecordCount || 0
    });

    res.json({
      success: true,
      requiresApproval: needsApproval
    });
  } catch (error) {
    console.error('[Approval] Error checking approval requirement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check approval requirement'
    });
  }
}));

module.exports = router;

