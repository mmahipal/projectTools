const fs = require('fs');
const path = require('path');

// Cache storage directory
const getCacheDir = () => {
  const cacheDir = path.join(__dirname, '../data/cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
};

// In-memory cache for fast access
const memoryCache = new Map();

// Cache entry structure: { data, timestamp, ttl }
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  // Generate cache key
  generateKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }

  // Get from cache
  get(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      isStale: age > entry.ttl * 0.8, // Consider stale if > 80% of TTL
      age: age,
      ttl: entry.ttl
    };
  }

  // Set cache entry
  set(key, data, ttl = null) {
    const cacheTTL = ttl || this.defaultTTL;
    this.memoryCache.set(key, {
      data: data,
      timestamp: Date.now(),
      ttl: cacheTTL
    });
  }

  // Delete cache entry
  delete(key) {
    this.memoryCache.delete(key);
  }

  // Clear all cache entries matching a pattern
  clearPattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.memoryCache.clear();
  }

  // Get cache stats
  getStats() {
    const entries = Array.from(this.memoryCache.entries());
    const now = Date.now();
    let expired = 0;
    let stale = 0;
    let fresh = 0;

    entries.forEach(([key, entry]) => {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        expired++;
      } else if (age > entry.ttl * 0.8) {
        stale++;
      } else {
        fresh++;
      }
    });

    return {
      total: entries.length,
      fresh,
      stale,
      expired
    };
  }
}

// Singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;















