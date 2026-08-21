// Main contributorPayments routes index

const express = require('express');
const router = express.Router();

// Note: Routes will be extracted to separate files:
// - diagnostics.js (GET /diagnostics)
// - totals.js (GET /total-contributors, /total-payments, /average-payment)
// - counts.js (GET /pending-count, /overdue-count)
// - status.js (GET /payments-by-status, /payment-status-trends)
// - methods.js (GET /payments-by-method, /payment-method-distribution)
// - trends.js (GET /payments-over-time)
// - contributors.js (GET /top-contributors)
// - geography.js (GET /payments-by-country, /average-payment-by-country)
// - analytics.js (GET /outstanding-vs-paid, /payment-distribution)
// - approval.js (GET /pm-approval-status)
// - system.js (GET /release-system-tracked-data, /payment-setup-required)
// - test.js (GET /test-fields)

// For now, import from original file
const originalRoutes = require('../contributorPayments');
router.use('/', originalRoutes);

module.exports = router;

