// Salesforce project team routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createProjectTeamInSalesforce } = require('../../services/salesforce/projectTeamService');
const { logBulkOperation } = require('../../utils/historyLogger');

/**
 * Create project team in Salesforce
 * POST /api/salesforce/create-project-team
 */
router.post('/create-project-team', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { project, teamMembers } = req.body;
    const result = await createProjectTeamInSalesforce({ project, teamMembers }, req.user);
    
    // Log to history for dashboard stats
    try {
      const historyResults = result.teamMembers.map(tm => ({
        success: tm.status === 'created',
        id: tm.salesforceId
      }));
      
      logBulkOperation(
        'create',
        'Project Team',
        req.user?.email || 'Unknown',
        historyResults,
        {
          projectId: result.projectId,
          project: result.project
        }
      );
    } catch (historyError) {
      console.error('Error logging project team history:', historyError);
      // Don't fail the request if history logging fails
    }
    
    // Log to audit logs for each team member
    try {
      const auditLogger = require('../../utils/auditLogger');
      for (const teamMember of result.teamMembers) {
        if (teamMember.status === 'created') {
          auditLogger.logAuditEvent({
            user: req.user.email,
            action: 'Added',
            objectType: 'Team Member',
            objectId: teamMember.salesforceId,
            objectName: teamMember.member || `${teamMember.role} - ${teamMember.memberId}`,
            salesforceId: teamMember.salesforceId,
            status: 'success',
            details: {
              objectName: teamMember.objectName,
              projectId: result.projectId,
              role: teamMember.role,
              memberId: teamMember.memberId
            }
          });
        }
      }
    } catch (auditError) {
      console.error('Error logging audit for team members:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Project team members created successfully',
      project: result.project,
      projectId: result.projectId,
      teamMembers: result.teamMembers,
      teamMemberSummary: result.teamMemberSummary
    });
  } catch (error) {
    console.error('Error creating project team in Salesforce:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create project team in Salesforce'
    });
  }
}));

module.exports = router;

