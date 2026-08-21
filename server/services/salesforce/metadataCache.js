// Salesforce metadata cache - caches object descriptions and field metadata

/**
 * Metadata cache entry structure:
 * {
 *   describeResult: Object,
 *   cachedAt: number (timestamp),
 *   expiresAt: number (timestamp)
 * }
 */

// In-memory cache for object metadata (keyed by objectName:userId)
const metadataCache = new Map();

// Cache expiration time (1 hour in milliseconds)
const METADATA_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cache key for metadata
 * @param {string} objectName - Salesforce object name
 * @param {string|null} userId - User ID or null for global
 * @returns {string} Cache key
 */
const getCacheKey = (objectName, userId = null) => {
  const userKey = userId ? `:${userId}` : ':global';
  return `${objectName}${userKey}`;
};

/**
 * Check if cached metadata is still valid
 * @param {Object} cached - Cached metadata entry
 * @returns {boolean} True if cache is valid
 */
const isCacheValid = (cached) => {
  if (!cached || !cached.describeResult || !cached.expiresAt) {
    return false;
  }
  return Date.now() < cached.expiresAt;
};

/**
 * Get cached object description or fetch and cache it
 * @param {jsforce.Connection} conn - Salesforce connection
 * @param {string} objectName - Salesforce object name
 * @param {string|null} userId - User ID for cache key
 * @returns {Promise<Object>} Object description
 */
const getObjectDescribe = async (conn, objectName, userId = null) => {
  const cacheKey = getCacheKey(objectName, userId);
  const cached = metadataCache.get(cacheKey);
  
  if (cached && isCacheValid(cached)) {
    console.log(`[Metadata Cache] Using cached describe for ${objectName} (cached ${Math.round((Date.now() - cached.cachedAt) / 1000)}s ago)`);
    return cached.describeResult;
  }
  
  // Fetch fresh metadata
  console.log(`[Metadata Cache] Fetching fresh describe for ${objectName}`);
  const describeResult = await conn.sobject(objectName).describe();
  
  // Cache the result
  metadataCache.set(cacheKey, {
    describeResult,
    cachedAt: Date.now(),
    expiresAt: Date.now() + METADATA_CACHE_TTL_MS
  });
  
  return describeResult;
};

/**
 * Clear metadata cache for a specific object
 * @param {string} objectName - Salesforce object name
 * @param {string|null} userId - User ID or null for all users
 */
const clearObjectCache = (objectName, userId = null) => {
  if (userId) {
    const cacheKey = getCacheKey(objectName, userId);
    metadataCache.delete(cacheKey);
    console.log(`[Metadata Cache] Cleared cache for ${objectName} (user: ${userId})`);
  } else {
    // Clear for all users
    const keysToDelete = [];
    for (const key of metadataCache.keys()) {
      if (key.startsWith(`${objectName}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => metadataCache.delete(key));
    console.log(`[Metadata Cache] Cleared cache for ${objectName} (all users)`);
  }
};

/**
 * Clear all metadata cache
 */
const clearAllCache = () => {
  const count = metadataCache.size;
  metadataCache.clear();
  console.log(`[Metadata Cache] Cleared all ${count} cached metadata entries`);
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  const entries = Array.from(metadataCache.entries()).map(([key, cached]) => ({
    key,
    objectName: key.split(':')[0],
    userId: key.split(':')[1] || 'global',
    cachedAt: new Date(cached.cachedAt).toISOString(),
    expiresAt: new Date(cached.expiresAt).toISOString(),
    ageSeconds: Math.round((Date.now() - cached.cachedAt) / 1000),
    expiresInSeconds: Math.round((cached.expiresAt - Date.now()) / 1000),
    isValid: isCacheValid(cached)
  }));
  
  return {
    totalEntries: metadataCache.size,
    entries: entries
  };
};

// Cleanup expired cache entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, cached] of metadataCache.entries()) {
    if (!isCacheValid(cached)) {
      metadataCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[Metadata Cache] Cleaned up ${cleanedCount} expired cache entries`);
  }
}, 10 * 60 * 1000); // Every 10 minutes

module.exports = {
  getObjectDescribe,
  clearObjectCache,
  clearAllCache,
  getCacheStats
};
