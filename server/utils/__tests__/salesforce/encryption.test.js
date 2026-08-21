/**
 * Unit Tests for Encryption Utilities
 * Tests encryption and decryption functions
 */

const { encrypt, decrypt, getEncryptionKey } = require('../../../utils/salesforce/encryption');

describe('Encryption Utilities', () => {
  describe('getEncryptionKey()', () => {
    it('should return a Buffer', () => {
      const key = getEncryptionKey();
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32); // AES-256 requires 32-byte key
    });

    it('should use environment variable if set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'test-key-64-characters-long-for-aes-256-encryption-testing-only';
      
      const key = getEncryptionKey();
      expect(Buffer.isBuffer(key)).toBe(true);
      
      // Restore original
      if (originalKey) {
        process.env.ENCRYPTION_KEY = originalKey;
      } else {
        delete process.env.ENCRYPTION_KEY;
      }
    });

    it('should hash short keys to 32 bytes', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'short-key';
      
      const key = getEncryptionKey();
      expect(key.length).toBe(32);
      
      // Restore
      if (originalKey) {
        process.env.ENCRYPTION_KEY = originalKey;
      } else {
        delete process.env.ENCRYPTION_KEY;
      }
    });
  });

  describe('encrypt()', () => {
    it('should encrypt plain text', () => {
      const plaintext = 'test-password-123';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':'); // Format: iv:encrypted
    });

    it('should produce different output for same input (due to random IV)', () => {
      const plaintext = 'same-password';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(encrypt(null)).toBe('');
      expect(encrypt(undefined)).toBe('');
    });

    it('should handle special characters', () => {
      const plaintext = 'password!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'password with émojis 🚀 and 中文';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('decrypt()', () => {
    it('should decrypt encrypted text correctly', () => {
      const plaintext = 'test-password-123';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      expect(decrypt('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(decrypt(null)).toBe('');
      expect(decrypt(undefined)).toBe('');
    });

    it('should handle invalid format (missing colon)', () => {
      const result = decrypt('invalid-format');
      expect(result).toBe('');
    });

    it('should handle invalid format (wrong number of parts)', () => {
      const result = decrypt('part1:part2:part3');
      expect(result).toBe('');
    });

    it('should handle corrupted encrypted data', () => {
      // Create valid format but with corrupted data
      const corrupted = 'a'.repeat(32) + ':corrupted-encrypted-data';
      const result = decrypt(corrupted);
      
      // Should return empty string on decryption error
      expect(result).toBe('');
    });

    it('should handle invalid hex in IV', () => {
      const invalid = 'invalid-hex:encrypted-data';
      const result = decrypt(invalid);
      expect(result).toBe('');
    });

    it('should round-trip encrypt and decrypt', () => {
      const testCases = [
        'simple-password',
        'Complex!@#Password123',
        'password with spaces',
        '1234567890',
        '',
        'a',
        'very-long-password-that-exceeds-normal-length-requirements-for-testing-purposes'
      ];

      testCases.forEach(plaintext => {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      });
    });
  });

  describe('Integration: encrypt/decrypt cycle', () => {
    it('should maintain data integrity through encrypt/decrypt cycle', () => {
      const originalData = {
        username: 'test@example.com',
        password: 'SecurePassword123!',
        securityToken: 'token123456'
      };

      const encryptedUsername = encrypt(originalData.username);
      const encryptedPassword = encrypt(originalData.password);
      const encryptedToken = encrypt(originalData.securityToken);

      const decryptedUsername = decrypt(encryptedUsername);
      const decryptedPassword = decrypt(encryptedPassword);
      const decryptedToken = decrypt(encryptedToken);

      expect(decryptedUsername).toBe(originalData.username);
      expect(decryptedPassword).toBe(originalData.password);
      expect(decryptedToken).toBe(originalData.securityToken);
    });
  });
});
