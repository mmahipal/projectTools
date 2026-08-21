/**
 * Feature Flags Configuration
 * Centralized feature flag management for easy enable/disable of features
 */

module.exports = {
  // Global User Persona-Based Content Filtering (GPC-Filter)
  ENABLE_GPC_FILTER: process.env.ENABLE_GPC_FILTER === 'true' || false,
};

