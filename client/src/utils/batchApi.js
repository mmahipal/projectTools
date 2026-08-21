/**
 * Batch API Utility
 * Allows multiple API calls to be batched into a single HTTP request
 * Reduces network overhead and improves performance
 */

import apiClient from '../config/api';

/**
 * Execute multiple API requests in a single batch
 * @param {Array} requests - Array of request configurations
 * @param {string} requests[].method - HTTP method (GET, POST, etc.)
 * @param {string} requests[].path - API endpoint path (e.g., '/welcome/stats')
 * @param {object} requests[].params - Query parameters (for GET requests)
 * @param {object} requests[].body - Request body (for POST/PUT requests)
 * @returns {Promise<Array>} Array of results corresponding to each request
 * 
 * @example
 * const results = await batchApiCalls([
 *   { method: 'GET', path: '/welcome/stats', params: {} },
 *   { method: 'GET', path: '/welcome/activity', params: {} }
 * ]);
 * 
 * // results[0] = { success: true, status: 200, data: {...} }
 * // results[1] = { success: true, status: 200, data: {...} }
 */
export const batchApiCalls = async (requests) => {
  try {
    const response = await apiClient.post('/batch', { requests });
    
    if (response.data && response.data.success) {
      return response.data.results || [];
    } else {
      throw new Error(response.data?.error || 'Batch request failed');
    }
  } catch (error) {
    console.error('[Batch API] Error:', error);
    throw error;
  }
};

/**
 * Helper to create batch requests for welcome page endpoints
 * @returns {Array} Array of request configurations for welcome page
 */
export const createWelcomeBatchRequests = () => {
  return [
    { method: 'GET', path: '/welcome/stats', params: {} },
    { method: 'GET', path: '/welcome/activity', params: {} },
    { method: 'GET', path: '/welcome/system-status', params: {} },
    { method: 'GET', path: '/welcome/recommendations', params: {} }
  ];
};

export default batchApiCalls;
