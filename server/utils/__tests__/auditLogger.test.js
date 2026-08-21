/**
 * Sanity Tests for Audit Logger Utility
 * Tests audit logging functionality
 */

const auditLogger = require('../../auditLogger');

describe('Audit Logger - Sanity Tests', () => {
  describe('logAction()', () => {
    it('should log an action without throwing', () => {
      expect(() => {
        auditLogger.logAction({
          userId: 'test-user',
          action: 'test_action',
          resource: 'test_resource',
          details: { test: 'data' }
        });
      }).not.toThrow();
    });

    it('should handle missing optional fields', () => {
      expect(() => {
        auditLogger.logAction({
          userId: 'test-user',
          action: 'test_action'
        });
      }).not.toThrow();
    });
  });

  describe('getAuditLogs()', () => {
    it('should return audit logs array', () => {
      const logs = auditLogger.getAuditLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should accept filter parameters', () => {
      const logs = auditLogger.getAuditLogs({
        userId: 'test-user',
        action: 'test_action'
      });
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
