// Main caseAnalytics routes index

const express = require('express');
const router = express.Router();

// Import route handlers
const kpisRoutes = require('./kpis');

// Mount route handlers
router.use('/', kpisRoutes);

// Note: Additional routes will be added as they are extracted:
// - dailyRoutes (daily-new-cases, daily-resolved-cases, daily-solved-by-project, etc.)
// - breakdownRoutes (case-status-breakdown, unresolved-sla-breakdown, etc.)
// - groupRoutes (created-resolved-by-group, avg-created-resolved-by-group, etc.)
// - reasonRoutes (created-resolved-by-reason, avg-created-resolved-by-reason, etc.)
// - typeRoutes (created-resolved-by-type, avg-created-resolved-by-type, etc.)
// - unresolvedRoutes (unresolved-by-group, unresolved-by-type, etc.)
// - backlogRoutes (backlog-by-client, historical-backlog, etc.)
// - agentRoutes (agent-performance, cases-touched-by-agent, etc.)
// - automatedRoutes (automated-case-actions, avg-automated-actions-by-reason, etc.)
// - filterRoutes (filter-options)

module.exports = router;

