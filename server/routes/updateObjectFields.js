// Main updateObjectFields routes file
// This file now delegates to the decomposed route structure in ./updateObjectFields/

// Import the decomposed routes from index
const updateObjectFieldsRoutes = require('./updateObjectFields/index');

// Export the router for backward compatibility
module.exports = updateObjectFieldsRoutes;
