// Salesforce query result cache - caches read-only query results

/**
 * Query cache entry structure:
 * {
 *   result: Object,
 *   cachedAt: number (timestamp),
 *   expiresAt: number (timestamp),
 *   query: string
 * }
 */

// In-memory cache for query results (keyed by query:userId)
const queryCache = new Map();

// Default cache TTL (15 seconds for query results - increased from 5 seconds)
const DEFAULT_QUERY_CACHE_TTL_MS = 15 * 1000; // 15 seconds

/**
 * Determine appropriate TTL for a query based on its type
 * @param {string} query - SOQL query string
 * @param {string|null} userId - User ID (for potential user-specific TTL logic)
 * @returns {number} TTL in milliseconds
 */
const getQueryTTL = (query, userId = null) => {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim().toUpperCase();
  
  // Metadata queries - cache longer (5 minutes)
  // These rarely change and are expensive to fetch
  if (normalizedQuery.includes('FROM METADATA') || 
      normalizedQuery.includes('DESCRIBE') ||
      normalizedQuery.includes('DESCRIBE GLOBAL')) {
    return 5 * 60 * 1000; // 5 minutes
  }
  
  // Aggregation queries (COUNT, SUM, AVG, MAX, MIN) - 30 seconds
  // These are read-only and can be cached longer
  if (normalizedQuery.match(/(COUNT|SUM|AVG|MAX|MIN)\s*\(/)) {
    return 30 * 1000; // 30 seconds
  }
  
  // Read-only SELECT queries with WHERE clause - 60 seconds
  // These are common list queries that don't change frequently
  if (normalizedQuery.match(/SELECT\s+.*\s+FROM\s+\w+\s+WHERE/i) && 
      !normalizedQuery.includes('UPDATE') && 
      !normalizedQuery.includes('DELETE') &&
      !normalizedQuery.includes('INSERT')) {
    return 60 * 1000; // 60 seconds
  }
  
  // Simple SELECT queries without WHERE - 30 seconds
  // These are often used for dropdowns and reference data
  if (normalizedQuery.match(/SELECT\s+.*\s+FROM\s+\w+\s*$/i) &&
      !normalizedQuery.includes('WHERE')) {
    return 30 * 1000; // 30 seconds
  }
  
  // Default: 15 seconds (increased from 5 seconds)
  // For queries that don't match any pattern above
  return DEFAULT_QUERY_CACHE_TTL_MS;
};

/**
 * Generate a cache key for a query
 * @param {string} query - SOQL query
 * @param {string|null} userId - User ID or null for global
 * @returns {string} Cache key
 */
const getCacheKey = (query, userId = null) => {
  const userKey = userId ? `:${userId}` : ':global';
  // Normalize query (remove extra whitespace) for consistent keys
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  return `${normalizedQuery}${userKey}`;
};

/**
 * Check if cached query result is still valid
 * @param {Object} cached - Cached query entry
 * @returns {boolean} True if cache is valid
 */
const isCacheValid = (cached) => {
  if (!cached || !cached.result || !cached.expiresAt) {
    return false;
  }
  return Date.now() < cached.expiresAt;
};

/**
 * Get cached query result or execute and cache it
 * @param {jsforce.Connection} conn - Salesforce connection
 * @param {string} query - SOQL query
 * @param {string|null} userId - User ID for cache key
 * @param {number|null} ttlMs - Cache TTL in milliseconds (null = auto-detect based on query type)
 * @returns {Promise<Object>} Query result
 */
const getCachedQuery = async (conn, query, userId = null, ttlMs = null) => {
  const cacheKey = getCacheKey(query, userId);
  const cached = queryCache.get(cacheKey);
  
  // Determine effective TTL (use provided, or auto-detect based on query type)
  const effectiveTTL = ttlMs !== null ? ttlMs : getQueryTTL(query, userId);
  
  if (cached && isCacheValid(cached)) {
    const ageSeconds = Math.round((Date.now() - cached.cachedAt) / 1000);
    const ttlSeconds = Math.round(effectiveTTL / 1000);
    console.log(`[Query Cache] Using cached result for query (cached ${ageSeconds}s ago, TTL: ${ttlSeconds}s)`);
    // Return a copy to prevent mutation
    return JSON.parse(JSON.stringify(cached.result));
  }
  
  // Execute query
  const result = await conn.query(query);
  
  // Cache the result with effective TTL
  queryCache.set(cacheKey, {
    result,
    query,
    cachedAt: Date.now(),
    expiresAt: Date.now() + effectiveTTL
  });
  
  const ttlSeconds = Math.round(effectiveTTL / 1000);
  console.log(`[Query Cache] Cached query result (TTL: ${ttlSeconds}s)`);
  
  return result;
};

/**
 * Clear query cache for a specific query pattern
 * @param {string} queryPattern - Query pattern to match (optional)
 * @param {string|null} userId - User ID or null for all users
 */
const clearQueryCache = (queryPattern = null, userId = null) => {
  if (queryPattern) {
    const keysToDelete = [];
    for (const key of queryCache.keys()) {
      const [query] = key.split(':');
      const userKey = userId ? `:${userId}` : '';
      if (query.includes(queryPattern) && (!userId || key.endsWith(userKey))) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => queryCache.delete(key));
    console.log(`[Query Cache] Cleared ${keysToDelete.length} cache entries matching pattern: ${queryPattern}`);
  } else {
    // Clear all
    const count = queryCache.size;
    queryCache.clear();
    console.log(`[Query Cache] Cleared all ${count} cached queries`);
  }
};

/**
 * Clear all query cache
 */
const clearAllCache = () => {
  const count = queryCache.size;
  queryCache.clear();
  console.log(`[Query Cache] Cleared all ${count} cached queries`);
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  const entries = Array.from(queryCache.entries()).map(([key, cached]) => ({
    key,
    query: cached.query,
    userId: key.split(':').slice(1).join(':') || 'global',
    cachedAt: new Date(cached.cachedAt).toISOString(),
    expiresAt: new Date(cached.expiresAt).toISOString(),
    ageSeconds: Math.round((Date.now() - cached.cachedAt) / 1000),
    expiresInSeconds: Math.round((cached.expiresAt - Date.now()) / 1000),
    isValid: isCacheValid(cached)
  }));
  
  return {
    totalEntries: queryCache.size,
    entries: entries
  };
};

// Cleanup expired cache entries periodically (every 1 minute)
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, cached] of queryCache.entries()) {
    if (!isCacheValid(cached)) {
      queryCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[Query Cache] Cleaned up ${cleanedCount} expired cache entries`);
  }
}, 60 * 1000); // Every 1 minute

module.exports = {
  getCachedQuery,
  clearQueryCache,
  clearAllCache,
  getCacheStats
};
