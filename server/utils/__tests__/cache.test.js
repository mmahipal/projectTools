/**
 * Unit Tests for Cache Manager
 * Tests cache operations, TTL, expiration, and statistics
 */

const cacheManager = require('../../cache');

describe('Cache Manager', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheManager.clear();
  });

  afterEach(() => {
    // Clean up after each test
    cacheManager.clear();
  });

  describe('generateKey()', () => {
    it('should generate a cache key from prefix and arguments', () => {
      const key = cacheManager.generateKey('test', 'arg1', 'arg2', 'arg3');
      expect(key).toBe('test:arg1:arg2:arg3');
    });

    it('should handle empty arguments', () => {
      const key = cacheManager.generateKey('test');
      expect(key).toBe('test:');
    });

    it('should handle special characters in arguments', () => {
      const key = cacheManager.generateKey('test', 'arg with spaces', 'arg:with:colons');
      expect(key).toBe('test:arg with spaces:arg:with:colons');
    });
  });

  describe('set() and get()', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      cacheManager.set(key, data);
      const result = cacheManager.get(key);
      
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(result.isStale).toBe(false);
    });

    it('should return null for non-existent key', () => {
      const result = cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      cacheManager.set(key, data);
      const result = cacheManager.get(key);
      
      expect(result).toBeTruthy();
      expect(result.ttl).toBe(cacheManager.defaultTTL);
    });

    it('should use custom TTL when specified', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      const customTTL = 1000; // 1 second
      
      cacheManager.set(key, data, customTTL);
      const result = cacheManager.get(key);
      
      expect(result).toBeTruthy();
      expect(result.ttl).toBe(customTTL);
    });

    it('should mark data as stale when > 80% of TTL has passed', (done) => {
      const key = 'test-key';
      const data = { test: 'data' };
      const shortTTL = 100; // 100ms
      
      cacheManager.set(key, data, shortTTL);
      
      // Wait for 85% of TTL
      setTimeout(() => {
        const result = cacheManager.get(key);
        expect(result).toBeTruthy();
        expect(result.isStale).toBe(true);
        done();
      }, 85);
    });

    it('should expire entries after TTL', (done) => {
      const key = 'test-key';
      const data = { test: 'data' };
      const shortTTL = 50; // 50ms
      
      cacheManager.set(key, data, shortTTL);
      
      // Wait for TTL to expire
      setTimeout(() => {
        const result = cacheManager.get(key);
        expect(result).toBeNull();
        done();
      }, 60);
    }, 1000); // Increase timeout for this test

    it('should handle complex data structures', () => {
      const key = 'test-key';
      const data = {
        nested: {
          object: {
            with: ['array', 'of', 'values'],
            number: 123,
            boolean: true
          }
        }
      };
      
      cacheManager.set(key, data);
      const result = cacheManager.get(key);
      
      expect(result.data).toEqual(data);
    });

    it('should handle null and undefined values', () => {
      const key1 = 'test-null';
      const key2 = 'test-undefined';
      
      cacheManager.set(key1, null);
      cacheManager.set(key2, undefined);
      
      const result1 = cacheManager.get(key1);
      const result2 = cacheManager.get(key2);
      
      expect(result1.data).toBeNull();
      expect(result2.data).toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('should delete a cache entry', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      cacheManager.set(key, data);
      expect(cacheManager.get(key)).toBeTruthy();
      
      cacheManager.delete(key);
      expect(cacheManager.get(key)).toBeNull();
    });

    it('should handle deleting non-existent key gracefully', () => {
      expect(() => {
        cacheManager.delete('non-existent-key');
      }).not.toThrow();
    });
  });

  describe('clearPattern()', () => {
    it('should clear entries matching a pattern', () => {
      cacheManager.set('user:1:data', { user: 1 });
      cacheManager.set('user:2:data', { user: 2 });
      cacheManager.set('project:1:data', { project: 1 });
      
      cacheManager.clearPattern('^user:');
      
      expect(cacheManager.get('user:1:data')).toBeNull();
      expect(cacheManager.get('user:2:data')).toBeNull();
      expect(cacheManager.get('project:1:data')).toBeTruthy();
    });

    it('should handle regex special characters in pattern', () => {
      cacheManager.set('test.key', { data: 1 });
      cacheManager.set('test-key', { data: 2 });
      
      cacheManager.clearPattern('test\\.key');
      
      expect(cacheManager.get('test.key')).toBeNull();
      expect(cacheManager.get('test-key')).toBeTruthy();
    });
  });

  describe('clear()', () => {
    it('should clear all cache entries', () => {
      cacheManager.set('key1', { data: 1 });
      cacheManager.set('key2', { data: 2 });
      cacheManager.set('key3', { data: 3 });
      
      expect(cacheManager.get('key1')).toBeTruthy();
      expect(cacheManager.get('key2')).toBeTruthy();
      expect(cacheManager.get('key3')).toBeTruthy();
      
      cacheManager.clear();
      
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
      expect(cacheManager.get('key3')).toBeNull();
    });
  });

  describe('getStats()', () => {
    it('should return cache statistics', () => {
      const key1 = 'fresh-key';
      const key2 = 'stale-key';
      const key3 = 'expired-key';
      
      // Set entries with different ages
      cacheManager.set(key1, { data: 1 }, 1000);
      cacheManager.set(key2, { data: 2 }, 100);
      cacheManager.set(key3, { data: 3 }, 50);
      
      // Wait for some entries to become stale/expired
      setTimeout(() => {
        const stats = cacheManager.getStats();
        
        expect(stats.total).toBeGreaterThanOrEqual(0);
        expect(stats.fresh).toBeGreaterThanOrEqual(0);
        expect(stats.stale).toBeGreaterThanOrEqual(0);
        expect(stats.expired).toBeGreaterThanOrEqual(0);
        expect(stats.total).toBe(stats.fresh + stats.stale + stats.expired);
      }, 60);
    });

    it('should return zero stats for empty cache', () => {
      cacheManager.clear();
      const stats = cacheManager.getStats();
      
      expect(stats.total).toBe(0);
      expect(stats.fresh).toBe(0);
      expect(stats.stale).toBe(0);
      expect(stats.expired).toBe(0);
    });
  });
});
