// Main Salesforce routes index - Combines all route handlers

const express = require('express');
const router = express.Router();

// Import route handlers
const settingsRoutes = require('./settings');
const testRoutes = require('./test');
const projectsRoutes = require('./projects');
const projectObjectivesRoutes = require('./projectObjectives');
const accountsRoutes = require('./accounts');
const searchRoutes = require('./search');
const projectCreationRoutes = require('./projectCreation');
const projectObjectiveCreationRoutes = require('./projectObjectiveCreation');
const qualificationStepsRoutes = require('./qualificationSteps');
const projectPagesRoutes = require('./projectPages');
const projectTeamRoutes = require('./projectTeam');
const previewRoutes = require('./preview');
const contributorReviewRoutes = require('./contributorReview');

// Mount route handlers
router.use('/', settingsRoutes);
router.use('/', testRoutes);
router.use('/', projectsRoutes);
router.use('/', projectObjectivesRoutes);
router.use('/', accountsRoutes);
router.use('/', searchRoutes);
router.use('/', projectCreationRoutes);
router.use('/', projectObjectiveCreationRoutes);
router.use('/', qualificationStepsRoutes);
router.use('/', projectPagesRoutes);
router.use('/', projectTeamRoutes);
router.use('/', previewRoutes);
router.use('/', contributorReviewRoutes);

module.exports = router;

// Export service functions for backward compatibility
const { createProjectInSalesforce } = require('../../services/salesforce/projectService');
const { createProjectObjectiveInSalesforce } = require('../../services/salesforce/projectObjectiveService');
const { createQualificationStepInSalesforce } = require('../../services/salesforce/qualificationStepService');

module.exports.createProjectInSalesforce = createProjectInSalesforce;
module.exports.createProjectObjectiveInSalesforce = createProjectObjectiveInSalesforce;
module.exports.createQualificationStepInSalesforce = createQualificationStepInSalesforce;

