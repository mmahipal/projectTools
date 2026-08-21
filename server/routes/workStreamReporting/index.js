// Main workStreamReporting routes index

const express = require('express');
const router = express.Router();

// Note: Routes will be extracted to separate files as needed
// For now, import from original file
const originalRoutes = require('../workStreamReporting');
router.use('/', originalRoutes);

module.exports = router;

