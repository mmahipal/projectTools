/**
 * Stale-While-Revalidate Pattern
 * Returns cached data immediately if available, then refreshes in background
 * Significantly improves perceived performance
 */

import requestCache from './requestCache';

/**
 * Fetch data with stale-while-revalidate pattern
 * @param {string} url - API endpoint URL
 * @param {object} params - Request parameters
 * @param {Function} fetchFn - Function that makes the actual API call
 * @param {object} options - Configuration options
 * @param {number} options.ttl - Cache TTL in milliseconds (default: 5 minutes)
 * @param {number} options.staleThreshold - Threshold for considering data stale (0-1, default: 0.8)
 * @returns {Promise} The cached data (if available) or fresh data
 * 
 * @example
 * const data = await staleWhileRevalidate(
 *   '/api/stats',
 *   {},
 *   async () => apiClient.get('/api/stats'),
 *   { ttl: 2 * 60 * 1000, staleThreshold: 0.8 }
 * );
 */
export const staleWhileRevalidate = async (url, params = {}, fetchFn, options = {}) => {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleThreshold = 0.8 // Consider stale at 80% of TTL
  } = options;
  
  // Check cache - requestCache.get() returns the cached data directly or null
  const cached = requestCache.get(url, params);
  const now = Date.now();
  
  if (cached !== null) {
    // Get cache entry to check age (need to access internal cache)
    const cacheKey = requestCache.generateKey(url, params);
    const cacheEntry = requestCache.cache.get(cacheKey);
    
    if (cacheEntry) {
      const cachedAt = cacheEntry.cachedAt || (cacheEntry.expiresAt ? cacheEntry.expiresAt - ttl : now);
      const age = now - cachedAt;
      const isStale = age > (ttl * staleThreshold);
      
      // Return cached data immediately if not stale
      if (!isStale) {
        // Refresh in background (don't await)
        fetchFn()
          .then(response => {
            // Cache the fresh response
            const responseData = response?.data || response;
            if (responseData) {
              requestCache.set(url, params, responseData, ttl);
            }
          })
          .catch(error => {
            // Silently fail background refresh - cached data is still valid
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[SWR] Background refresh failed for ${url}:`, error);
            }
          });
        
        // Return cached data immediately
        return cached;
      }
    }
  }
  
  // If stale or no cache, fetch fresh data (blocking)
  const response = await fetchFn();
  const responseData = response?.data || response;
  
  // Cache the fresh response
  if (responseData) {
    requestCache.set(url, params, responseData, ttl);
  }
  
  return responseData;
};

export default staleWhileRevalidate;
