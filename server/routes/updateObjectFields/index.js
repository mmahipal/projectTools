// Main updateObjectFields routes index

const express = require('express');
const router = express.Router();

// Import all extracted route handlers
const fieldsRoutes = require('./fields');
const picklistValuesRoutes = require('./picklistValues');
const filterOptionsRoutes = require('./filterOptions');
const countRoutes = require('./count');
const searchReferenceRoutes = require('./searchReference');
const previewRoutes = require('./preview');
const updateRoutes = require('./update');
const mappingRoutes = require('./mapping');
const projectsRoutes = require('./projects');
const approvalRoutes = require('./approvalRoutes');
const objectsRoutes = require('./objects');
const relationshipsRoutes = require('./relationships');
const describeObjectRoutes = require('./describeObject');

// Mount all route handlers
router.use('/', fieldsRoutes);
router.use('/', picklistValuesRoutes);
router.use('/', filterOptionsRoutes);
router.use('/', countRoutes);
router.use('/', searchReferenceRoutes);
router.use('/', previewRoutes);
router.use('/', updateRoutes);
router.use('/', mappingRoutes);
router.use('/', projectsRoutes);
router.use('/approval', approvalRoutes);
router.use('/objects', objectsRoutes);
router.use('/', relationshipsRoutes);
router.use('/', describeObjectRoutes);

module.exports = router;

