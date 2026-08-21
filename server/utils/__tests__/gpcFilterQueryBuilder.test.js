/**
 * Sanity Tests for GPC Filter Query Builder
 * Tests query building functionality
 */

const gpcFilterQueryBuilder = require('../../gpcFilterQueryBuilder');

describe('GPC Filter Query Builder - Sanity Tests', () => {
  describe('buildGpcAccountFilter()', () => {
    it('should return empty string for null/undefined', () => {
      expect(gpcFilterQueryBuilder.buildGpcAccountFilter(null)).toBe('');
      expect(gpcFilterQueryBuilder.buildGpcAccountFilter(undefined)).toBe('');
    });

    it('should build filter for valid account', () => {
      const filter = gpcFilterQueryBuilder.buildGpcAccountFilter('TestAccount');
      expect(typeof filter).toBe('string');
      expect(filter.length).toBeGreaterThan(0);
    });
  });

  describe('buildGpcProjectFilter()', () => {
    it('should return empty string for null/undefined', () => {
      expect(gpcFilterQueryBuilder.buildGpcProjectFilter(null)).toBe('');
      expect(gpcFilterQueryBuilder.buildGpcProjectFilter(undefined)).toBe('');
    });

    it('should build filter for valid project', () => {
      const filter = gpcFilterQueryBuilder.buildGpcProjectFilter('TestProject');
      expect(typeof filter).toBe('string');
    });
  });

  describe('buildCombinedGpcFilter()', () => {
    it('should build combined filter with both account and project', () => {
      const filter = gpcFilterQueryBuilder.buildCombinedGpcFilter('TestAccount', 'TestProject');
      expect(typeof filter).toBe('string');
    });

    it('should handle null values', () => {
      const filter = gpcFilterQueryBuilder.buildCombinedGpcFilter(null, null);
      expect(typeof filter).toBe('string');
    });
  });
});
