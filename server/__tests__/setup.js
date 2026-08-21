/**
 * Jest Test Setup File
 * Runs before all tests to configure the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
// Use a 64-character hex string for AES-256 (32 bytes)
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Suppress console logs during tests (optional - comment out for debugging)
// const originalConsoleLog = console.log;
// const originalConsoleError = console.error;
// console.log = jest.fn();
// console.error = jest.fn();

// Global test timeout (30 seconds)
jest.setTimeout(30000);

// Clean up after all tests
afterAll(() => {
  // Restore console if suppressed
  // console.log = originalConsoleLog;
  // console.error = originalConsoleError;
});
