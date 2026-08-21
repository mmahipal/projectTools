# Testing Guidelines

This document provides comprehensive guidelines for writing and maintaining unit tests for the Project Tools backend.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Writing Tests](#writing-tests)
4. [Test Patterns](#test-patterns)
5. [Best Practices](#best-practices)
6. [Running Tests](#running-tests)
7. [Coverage Requirements](#coverage-requirements)

## Overview

### Testing Philosophy

- **Test First**: Write tests before or alongside code (TDD/BDD)
- **Isolation**: Each test should be independent and not rely on other tests
- **Clarity**: Tests should be readable and self-documenting
- **Speed**: Tests should run quickly (< 5 seconds for unit tests)
- **Reliability**: Tests should be deterministic and not flaky

### Test Types

- **Unit Tests**: Test individual functions/modules in isolation
- **Integration Tests**: Test interactions between modules
- **E2E Tests**: Test complete user workflows (future)

## Test Structure

### Directory Structure

```
server/
├── __tests__/
│   ├── setup.js                    # Global test setup
│   ├── helpers/                     # Test utilities
│   │   ├── mockExpress.js          # Express mocks
│   │   ├── mockSalesforce.js       # Salesforce API mocks
│   │   └── testData.js             # Test data fixtures
│   └── ...
├── utils/
│   ├── __tests__/
│   │   ├── cache.test.js
│   │   ├── security.test.js
│   │   └── salesforce/
│   │       └── encryption.test.js
│   └── ...
├── middleware/
│   ├── __tests__/
│   │   ├── auth.test.js
│   │   ├── csrf.test.js
│   │   └── rbac.test.js
│   └── ...
└── services/
    └── __tests__/
        └── salesforce/
            └── connectionService.test.js
```

### Test File Naming

- Test files should be named `*.test.js` or `*.spec.js`
- Place test files in `__tests__` directories adjacent to source files
- Example: `server/utils/cache.js` → `server/utils/__tests__/cache.test.js`

## Writing Tests

### Basic Test Structure

```javascript
describe('Module Name', () => {
  describe('functionName()', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Test Organization

1. **Describe Blocks**: Group related tests
   - Outer `describe`: Module/class name
   - Inner `describe`: Function/method name
   - `it`: Individual test case

2. **Test Names**: Use descriptive, behavior-focused names
   - ✅ Good: `'should encrypt plain text correctly'`
   - ❌ Bad: `'test encrypt'`

3. **AAA Pattern**: Arrange, Act, Assert
   ```javascript
   it('should calculate total correctly', () => {
     // Arrange
     const items = [10, 20, 30];
     
     // Act
     const total = calculateTotal(items);
     
     // Assert
     expect(total).toBe(60);
   });
   ```

### Setup and Teardown

```javascript
describe('Cache Manager', () => {
  beforeEach(() => {
    // Run before each test
    cacheManager.clear();
  });

  afterEach(() => {
    // Run after each test
    cacheManager.clear();
  });

  beforeAll(() => {
    // Run once before all tests
  });

  afterAll(() => {
    // Run once after all tests
  });
});
```

## Test Patterns

### Testing Utilities

```javascript
// Pure functions
describe('encrypt()', () => {
  it('should encrypt plain text', () => {
    const plaintext = 'password123';
    const encrypted = encrypt(plaintext);
    
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });
});
```

### Testing Middleware

```javascript
describe('authenticate()', () => {
  it('should allow request with valid token', () => {
    const token = jwt.sign({ id: '1' }, JWT_SECRET);
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` }
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeTruthy();
  });
});
```

### Testing Services

```javascript
describe('createConnection()', () => {
  it('should create authenticated connection', async () => {
    mockSalesforceLogin();
    
    const connection = await createConnection(settings);
    
    expect(connection).toBeTruthy();
    expect(connection.accessToken).toBeTruthy();
  });
});
```

### Testing Error Cases

```javascript
it('should handle invalid input gracefully', () => {
  expect(() => {
    encrypt(null);
  }).not.toThrow();
  
  expect(encrypt(null)).toBe('');
});
```

### Testing Edge Cases

```javascript
it('should handle empty string', () => {
  expect(encrypt('')).toBe('');
  expect(decrypt('')).toBe('');
});

it('should handle special characters', () => {
  const input = 'password!@#$%^&*()';
  const encrypted = encrypt(input);
  expect(decrypt(encrypted)).toBe(input);
});
```

## Best Practices

### 1. Test Independence

- Each test should be able to run in isolation
- Don't rely on test execution order
- Clean up after each test (use `beforeEach`/`afterEach`)

### 2. Use Mocks and Stubs

- Mock external dependencies (APIs, databases, file system)
- Use test doubles for complex dependencies
- Don't make real network calls in unit tests

### 3. Test Behavior, Not Implementation

- ✅ Test what the function does, not how it does it
- ❌ Don't test internal implementation details

### 4. Keep Tests Simple

- One assertion per test (when possible)
- Test one thing at a time
- Avoid complex test logic

### 5. Use Descriptive Names

```javascript
// ✅ Good
it('should reject request without authentication token', () => { ... });

// ❌ Bad
it('test auth', () => { ... });
```

### 6. Test Both Success and Failure Cases

```javascript
describe('validateInput()', () => {
  it('should accept valid input', () => { ... });
  it('should reject invalid input', () => { ... });
  it('should handle null input', () => { ... });
});
```

### 7. Avoid Test Interdependence

```javascript
// ❌ Bad: Tests depend on each other
let sharedState = {};

it('test 1', () => {
  sharedState.value = 1;
});

it('test 2', () => {
  expect(sharedState.value).toBe(1); // Depends on test 1
});

// ✅ Good: Each test is independent
it('test 1', () => {
  const state = { value: 1 };
  expect(state.value).toBe(1);
});

it('test 2', () => {
  const state = { value: 2 };
  expect(state.value).toBe(2);
});
```

### 8. Use Test Helpers

```javascript
// Create reusable test utilities
const { createMockRequest, createMockResponse } = require('../helpers/mockExpress');
const { createMockUser } = require('../helpers/testData');
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- encryption.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="encrypt"
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Global**: 65% for branches, functions, lines, statements
- **Critical Modules**: 80-90% for security and encryption utilities
  - `server/utils/salesforce/encryption.js`: 90%
  - `server/middleware/auth.js`: 80%
  - `server/middleware/csrf.js`: 80%

### Coverage Reports

After running `npm run test:coverage`, view reports:

- **Text Summary**: Displayed in terminal
- **HTML Report**: `coverage/index.html`
- **LCOV Report**: `coverage/lcov.info`

### Improving Coverage

1. Identify uncovered lines using coverage reports
2. Add tests for edge cases and error paths
3. Test both success and failure scenarios
4. Ensure all branches are tested

## Common Patterns

### Mocking Express Request/Response

```javascript
const { createMockRequest, createMockResponse } = require('../helpers/mockExpress');

const req = createMockRequest({
  headers: { authorization: 'Bearer token' },
  body: { data: 'test' }
});

const res = createMockResponse();
```

### Mocking Salesforce API

```javascript
const { mockSalesforceLogin, cleanupMocks } = require('../helpers/mockSalesforce');

beforeEach(() => {
  cleanupMocks();
});

it('should login to Salesforce', async () => {
  mockSalesforceLogin('https://test.salesforce.com');
  // Test code
});
```

### Testing Async Functions

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeTruthy();
});

it('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

### Testing Time-Dependent Code

```javascript
it('should expire cache entries after TTL', (done) => {
  cacheManager.set('key', 'value', 100); // 100ms TTL
  
  setTimeout(() => {
    expect(cacheManager.get('key')).toBeNull();
    done();
  }, 150);
}, 1000); // Increase test timeout
```

## Troubleshooting

### Tests Failing Intermittently

- Check for shared state between tests
- Ensure proper cleanup in `afterEach`
- Verify async operations are properly awaited

### Tests Timing Out

- Increase timeout: `jest.setTimeout(10000)`
- Check for hanging promises
- Verify mocks are properly set up

### Coverage Not Increasing

- Check if code is actually executed
- Verify test assertions are correct
- Look for unreachable code (dead code)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Questions?

For questions or issues with testing, please:
1. Check this guide first
2. Review existing test files for examples
3. Ask the team for help
