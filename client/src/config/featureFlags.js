/**
 * Feature Flags Configuration (Frontend)
 * Centralized feature flag management for easy enable/disable of features
 */

export const ENABLE_GPC_FILTER = process.env.REACT_APP_ENABLE_GPC_FILTER === 'true' || false;

