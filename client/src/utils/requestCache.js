/**
 * Request Cache Utility
 * Provides intelligent caching for API requests with TTL support
 */

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

class RequestCache {
  constructor() {
    this.cache = new Map();
    this.accessOrder = []; // For LRU eviction
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${url}${sortedParams ? `?${sortedParams}` : ''}`;
  }

  /**
   * Get cached response if valid
   */
  get(url, params = {}) {
    const key = this.generateKey(url, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return null;
    }

    // Update access order (LRU)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return cached.data;
  }

  /**
   * Set cache entry
   */
  set(url, params = {}, data, ttl = DEFAULT_TTL) {
    const key = this.generateKey(url, params);

    // Evict oldest if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt, cachedAt: Date.now() });

    // Update access order
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  /**
   * Clear specific cache entry
   */
  clear(url, params = {}) {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  /**
   * Clear all cache entries matching URL pattern
   */
  clearPattern(urlPattern) {
    const keysToDelete = [];
    this.cache.forEach((value, key) => {
      if (key.includes(urlPattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    });
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    this.cache.forEach((value) => {
      totalSize += JSON.stringify(value.data).length;
      if (now > value.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      maxSize: MAX_CACHE_SIZE
    };
  }
}

// Singleton instance
const requestCache = new RequestCache();

/**
 * Cache-aware fetch wrapper
 */
export const cachedFetch = async (url, params = {}, fetchFn, options = {}) => {
  const {
    ttl = DEFAULT_TTL,
    useCache = true,
    cacheKey = null
  } = options;

  // Check cache first
  if (useCache) {
    const cached = requestCache.get(url, params);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the response
  if (useCache && data) {
    requestCache.set(url, params, data, ttl);
  }

  return data;
};

/**
 * Clear cache for specific endpoint
 */
export const clearCache = (url, params = {}) => {
  requestCache.clear(url, params);
};

/**
 * Clear all cache for URL pattern
 */
export const clearCachePattern = (urlPattern) => {
  requestCache.clearPattern(urlPattern);
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  requestCache.clearAll();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return requestCache.getStats();
};

export default requestCache;





