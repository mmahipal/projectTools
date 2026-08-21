/**
 * Sanity Tests for Salesforce Project Service
 * Tests basic project service functionality
 */

const { normalizeSalesforceUrl, getLoginUrlForConnection } = require('../../../services/salesforce/connectionService');

describe('Salesforce Project Service - Sanity Tests', () => {
  describe('URL normalization', () => {
    it('should normalize Salesforce URLs correctly', () => {
      expect(normalizeSalesforceUrl('https://test.salesforce.com/')).toBe('https://test.salesforce.com');
      expect(normalizeSalesforceUrl('https://test.salesforce.com/services/Soap/u/58.0')).toBe('https://test.salesforce.com');
    });

    it('should handle login URL detection', () => {
      expect(getLoginUrlForConnection('https://test--staging.sandbox.lightning.force.com')).toBe('https://test.salesforce.com');
      expect(getLoginUrlForConnection('https://test.lightning.force.com')).toBe('https://login.salesforce.com');
    });
  });
});
