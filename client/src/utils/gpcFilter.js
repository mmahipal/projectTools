/**
 * GPC-Filter Utility Functions
 * Helper functions to apply GPC-Filter to API calls
 */

import { ENABLE_GPC_FILTER } from '../config/featureFlags';

/**
 * Apply GPC-Filter parameters to URLSearchParams or query object
 * @param {URLSearchParams|Object} params - URLSearchParams instance or query object
 * @param {Object} filterParams - Filter parameters from useGPCFilter hook
 * @returns {URLSearchParams|Object} - Updated params
 */
export const applyGPCFilterToParams = (params, filterParams) => {
  if (!ENABLE_GPC_FILTER || !filterParams) {
    return params;
  }

  // If URLSearchParams
  if (params instanceof URLSearchParams) {
    if (filterParams.gpc_accounts) {
      params.append('gpc_accounts', filterParams.gpc_accounts);
    }
    if (filterParams.gpc_projects) {
      params.append('gpc_projects', filterParams.gpc_projects);
    }
    return params;
  }

  // If object
  if (typeof params === 'object' && params !== null) {
    return {
      ...params,
      ...(filterParams.gpc_accounts && { gpc_accounts: filterParams.gpc_accounts }),
      ...(filterParams.gpc_projects && { gpc_projects: filterParams.gpc_projects })
    };
  }

  return params;
};

/**
 * Apply GPC-Filter to axios request config
 * @param {Object} config - Axios request config
 * @param {Object} filterParams - Filter parameters from useGPCFilter hook
 * @returns {Object} - Updated config
 */
export const applyGPCFilterToConfig = (config, filterParams) => {
  if (!ENABLE_GPC_FILTER || !filterParams) {
    return config;
  }

  const updatedConfig = { ...config };
  
  if (!updatedConfig.params) {
    updatedConfig.params = {};
  }

  if (filterParams.gpc_accounts) {
    updatedConfig.params.gpc_accounts = filterParams.gpc_accounts;
  }
  if (filterParams.gpc_projects) {
    updatedConfig.params.gpc_projects = filterParams.gpc_projects;
  }

  return updatedConfig;
};

