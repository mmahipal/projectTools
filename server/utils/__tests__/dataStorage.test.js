/**
 * Sanity Tests for Salesforce Data Storage Utility
 * Tests data storage and retrieval functionality
 */

const { getSettingsPath, saveUserSettings, loadUserSettings } = require('../../utils/salesforce/dataStorage');
const path = require('path');
const fs = require('fs');

describe('Salesforce Data Storage - Sanity Tests', () => {
  describe('getSettingsPath()', () => {
    it('should return a valid file path', () => {
      const settingsPath = getSettingsPath();
      expect(typeof settingsPath).toBe('string');
      expect(settingsPath.length).toBeGreaterThan(0);
      expect(path.isAbsolute(settingsPath) || settingsPath.startsWith('./')).toBe(true);
    });

    it('should return user-specific path when userId provided', () => {
      const userId = 'test-user-123';
      const settingsPath = getSettingsPath(userId);
      expect(typeof settingsPath).toBe('string');
      expect(settingsPath).toContain(userId);
    });
  });

  describe('saveUserSettings() and loadUserSettings()', () => {
    it('should save and load user settings', () => {
      const userId = `test-user-${Date.now()}`;
      const testSettings = {
        salesforceUrl: 'https://test.salesforce.com',
        username: 'test@example.com',
        password: 'encrypted',
        securityToken: 'encrypted'
      };

      // Save settings
      expect(() => {
        saveUserSettings(userId, testSettings);
      }).not.toThrow();

      // Load settings
      const loadedSettings = loadUserSettings(userId);
      expect(loadedSettings).toBeTruthy();
      expect(loadedSettings.salesforceUrl).toBe(testSettings.salesforceUrl);

      // Clean up
      const settingsPath = getSettingsPath(userId);
      if (fs.existsSync(settingsPath)) {
        fs.unlinkSync(settingsPath);
      }
    });

    it('should return null for non-existent user settings', () => {
      const loadedSettings = loadUserSettings('non-existent-user-12345');
      expect(loadedSettings).toBeNull();
    });
  });
});
