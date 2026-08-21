/**
 * Unit Tests for Salesforce Connection Service
 * Tests connection creation, authentication, and error handling
 */

const { normalizeSalesforceUrl, getLoginUrlForConnection } = require('../../../services/salesforce/connectionService');

describe('Salesforce Connection Service', () => {
  describe('normalizeSalesforceUrl()', () => {
    it('should remove trailing slashes', () => {
      expect(normalizeSalesforceUrl('https://test.salesforce.com/')).toBe('https://test.salesforce.com');
      expect(normalizeSalesforceUrl('https://test.salesforce.com///')).toBe('https://test.salesforce.com');
    });

    it('should remove service paths', () => {
      expect(normalizeSalesforceUrl('https://test.salesforce.com/services/Soap/u/58.0')).toBe('https://test.salesforce.com');
      expect(normalizeSalesforceUrl('https://test.salesforce.com/services/data/v58.0')).toBe('https://test.salesforce.com');
    });

    it('should handle URLs without paths', () => {
      expect(normalizeSalesforceUrl('https://test.salesforce.com')).toBe('https://test.salesforce.com');
    });

    it('should handle custom domain URLs', () => {
      expect(normalizeSalesforceUrl('https://mycompany.my.salesforce.com')).toBe('https://mycompany.my.salesforce.com');
    });

    it('should handle lightning URLs', () => {
      expect(normalizeSalesforceUrl('https://test.lightning.force.com')).toBe('https://test.lightning.force.com');
    });
  });

  describe('getLoginUrlForConnection()', () => {
    it('should return test.salesforce.com for sandbox URLs', () => {
      expect(getLoginUrlForConnection('https://test--staging.sandbox.lightning.force.com')).toBe('https://test.salesforce.com');
      expect(getLoginUrlForConnection('https://test--dev.sandbox.lightning.force.com')).toBe('https://test.salesforce.com');
      expect(getLoginUrlForConnection('https://test.sandbox.lightning.force.com')).toBe('https://test.salesforce.com');
    });

    it('should return login.salesforce.com for production URLs', () => {
      expect(getLoginUrlForConnection('https://test.lightning.force.com')).toBe('https://login.salesforce.com');
      expect(getLoginUrlForConnection('https://mycompany.my.salesforce.com')).toBe('https://login.salesforce.com');
    });

    it('should return test.salesforce.com for test URLs', () => {
      expect(getLoginUrlForConnection('https://test.salesforce.com')).toBe('https://test.salesforce.com');
    });

    it('should default to login.salesforce.com for unknown URLs', () => {
      expect(getLoginUrlForConnection('https://unknown.url.com')).toBe('https://login.salesforce.com');
    });

    it('should handle case-insensitive URLs', () => {
      expect(getLoginUrlForConnection('https://TEST.LIGHTNING.FORCE.COM')).toBe('https://login.salesforce.com');
      expect(getLoginUrlForConnection('https://Test--Staging.Sandbox.Lightning.Force.Com')).toBe('https://test.salesforce.com');
    });
  });
});
