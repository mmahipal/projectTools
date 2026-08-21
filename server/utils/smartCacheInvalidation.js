/**
 * Smart Cache Invalidation Utility
 * 
 * Implements version-based cache invalidation to prevent unnecessary refreshes.
 * Only invalidates cache when data actually changes, not on every request.
 */

// Cache version map - tracks version numbers for each endpoint/params combination
const cacheVersionMap = new Map();

/**
 * Generate cache key from endpoint and params
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Request parameters
 * @returns {string} Cache key
 */
const generateCacheKey = (endpoint, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${endpoint}${sortedParams ? `?${sortedParams}` : ''}`;
};

/**
 * Get current cache version for an endpoint
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Request parameters (optional)
 * @returns {number} Current cache version (starts at 1)
 */
const getCacheVersion = (endpoint, params = {}) => {
  const key = generateCacheKey(endpoint, params);
  return cacheVersionMap.get(key) || 1;
};

/**
 * Increment cache version for an endpoint (invalidates cache)
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Request parameters (optional)
 * @returns {number} New cache version
 */
const incrementCacheVersion = (endpoint, params = {}) => {
  const key = generateCacheKey(endpoint, params);
  const current = cacheVersionMap.get(key) || 1;
  const newVersion = current + 1;
  cacheVersionMap.set(key, newVersion);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cache Invalidation] Incremented version for ${endpoint} to ${newVersion}`);
  }
  
  return newVersion;
};

/**
 * Invalidate cache for multiple endpoints at once
 * @param {Array} endpoints - Array of { endpoint, params } objects
 */
const invalidateCache = (endpoints) => {
  if (!Array.isArray(endpoints)) {
    return;
  }
  
  endpoints.forEach(({ endpoint, params = {} }) => {
    incrementCacheVersion(endpoint, params);
  });
};

/**
 * Invalidate cache for all endpoints matching a pattern
 * @param {string} pattern - Pattern to match (e.g., '/case-analytics/')
 */
const invalidateCachePattern = (pattern) => {
  const keysToInvalidate = [];
  
  for (const key of cacheVersionMap.keys()) {
    if (key.includes(pattern)) {
      keysToInvalidate.push(key);
    }
  }
  
  keysToInvalidate.forEach(key => {
    const current = cacheVersionMap.get(key) || 1;
    cacheVersionMap.set(key, current + 1);
  });
  
  if (keysToInvalidate.length > 0 && process.env.NODE_ENV === 'development') {
    console.log(`[Cache Invalidation] Invalidated ${keysToInvalidate.length} cache entries matching pattern: ${pattern}`);
  }
};

/**
 * Get cache statistics
 * @returns {object} Cache version statistics
 */
const getCacheStats = () => {
  const entries = Array.from(cacheVersionMap.entries()).map(([key, version]) => ({
    key,
    version
  }));
  
  return {
    totalEntries: cacheVersionMap.size,
    entries
  };
};

/**
 * Clear all cache versions (for testing/debugging)
 */
const clearAllCacheVersions = () => {
  const count = cacheVersionMap.size;
  cacheVersionMap.clear();
  console.log(`[Cache Invalidation] Cleared all ${count} cache versions`);
};

module.exports = {
  getCacheVersion,
  incrementCacheVersion,
  invalidateCache,
  invalidateCachePattern,
  getCacheStats,
  clearAllCacheVersions
};
