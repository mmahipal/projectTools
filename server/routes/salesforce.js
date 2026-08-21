// Main Salesforce routes file
// This file now delegates to the decomposed route structure in ./salesforce/

// Import the decomposed routes from index
const salesforceRoutes = require('./salesforce/index');

// Export the router and service functions for backward compatibility
module.exports = salesforceRoutes;

// Re-export service functions (already exported by index.js, but keeping for clarity)
module.exports.createProjectInSalesforce = salesforceRoutes.createProjectInSalesforce;
module.exports.createProjectObjectiveInSalesforce = salesforceRoutes.createProjectObjectiveInSalesforce;
module.exports.createQualificationStepInSalesforce = salesforceRoutes.createQualificationStepInSalesforce;
