module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/server'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/__tests__/**',
    '!server/**/*.test.js',
    '!server/**/*.spec.js',
    '!server/index.js', // Main entry point, minimal logic
    '!server/**/*.bak',
    '!server/**/*.bak2'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65
    },
    // Higher thresholds for critical modules
    './server/utils/salesforce/encryption.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './server/middleware/auth.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './server/middleware/csrf.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Transform (if needed for ES modules)
  transform: {},
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/'
  ],
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage'
};
