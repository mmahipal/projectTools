# Unit Testing Implementation Proposal
## Project Tools - Salesforce Project Management Application

**Version:** 3.8.0  
**Date:** January 2025  
**Status:** Proposal

---

## Executive Summary

This proposal outlines a comprehensive unit testing strategy for the Project Tools application. The codebase currently has **zero unit tests** despite having testing libraries installed in the client. This proposal establishes a testing framework, identifies priority areas, and provides a phased implementation plan to achieve meaningful test coverage.

---

## 1. Current State Analysis

### 1.1 Codebase Overview

**Backend (Node.js/Express):**
- **Routes:** ~50+ route files
- **Middleware:** 4 middleware files (auth, csrf, inputSanitization, rbac)
- **Services:** 6 Salesforce service files + scheduler service
- **Utils:** 13 utility modules
- **No testing framework installed**

**Frontend (React):**
- **Components:** 100+ components
- **Pages:** 50+ page components
- **Utils:** 20 utility modules
- **Context:** 3 context providers
- **Hooks:** 3 custom hooks
- **Testing libraries installed:** @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- **No test files exist**

### 1.2 Critical Areas Identified

**High Priority (Business Logic & Security):**
1. Authentication & Authorization (JWT, RBAC)
2. Salesforce Connection Service
3. Data Encryption/Decryption
4. Input Validation & Sanitization
5. CSRF Protection
6. Cache Management
7. Utility Functions (pure functions)

**Medium Priority (Core Functionality):**
1. API Route Handlers
2. Data Transformation Utilities
3. Form Validation
4. State Management (Context, Hooks)
5. API Client Configuration

**Lower Priority (UI Components):**
1. Presentational Components
2. Styling Components
3. Layout Components

---

## 2. Testing Framework Recommendations

### 2.1 Backend Testing Stack

**Primary Framework:**
- **Jest** (v29.x) - Test runner, assertion library, mocking
- **Supertest** (v6.x) - HTTP assertion library for Express routes
- **@jest/globals** - Modern Jest API

**Mocking Libraries:**
- **jest-mock** - Built-in Jest mocking
- **nock** (v13.x) - HTTP server mocking (for Salesforce API calls)
- **sinon** (v15.x) - Advanced mocking and spying (optional)

**Test Utilities:**
- **@types/jest** - TypeScript definitions (if migrating to TS)
- **jest-environment-node** - Node.js test environment

### 2.2 Frontend Testing Stack

**Primary Framework:**
- **Jest** (via react-scripts) - Already configured
- **@testing-library/react** (v13.x) - Already installed
- **@testing-library/jest-dom** (v5.x) - Already installed
- **@testing-library/user-event** (v13.x) - Already installed

**Additional Libraries:**
- **@testing-library/react-hooks** (v8.x) - For testing custom hooks
- **msw** (Mock Service Worker) (v2.x) - API mocking for integration tests
- **jest-environment-jsdom** - DOM environment for React tests

### 2.3 Code Coverage Tools

- **Jest Coverage** - Built-in coverage reporter
- **Coverage Thresholds:** 
  - Critical modules: 80%+
  - Core modules: 70%+
  - UI components: 60%+
  - Overall: 65%+

---

## 3. Testing Strategy by Layer

### 3.1 Backend Testing Strategy

#### 3.1.1 Utility Functions (Priority 1)

**Files to Test:**
- `server/utils/salesforce/encryption.js` - Encryption/decryption
- `server/utils/security.js` - Input sanitization, XSS protection
- `server/utils/cache.js` - Cache management
- `server/utils/gpcFilterQueryBuilder.js` - Query building
- `server/utils/validation.js` - Data validation
- `server/utils/roles.js` - Role/permission utilities

**Test Approach:**
- Pure function testing (input/output)
- Edge case handling
- Error scenarios
- Performance testing for cache operations

**Example Test Structure:**
```javascript
// server/utils/__tests__/encryption.test.js
describe('Encryption Utilities', () => {
  describe('encrypt()', () => {
    it('should encrypt plain text', () => {});
    it('should produce different output for same input (salt)', () => {});
    it('should handle empty strings', () => {});
    it('should handle special characters', () => {});
  });
  
  describe('decrypt()', () => {
    it('should decrypt encrypted text', () => {});
    it('should throw error for invalid encrypted data', () => {});
    it('should handle corrupted data gracefully', () => {});
  });
});
```

#### 3.1.2 Middleware Testing (Priority 1)

**Files to Test:**
- `server/middleware/auth.js` - JWT authentication
- `server/middleware/csrf.js` - CSRF protection
- `server/middleware/inputSanitization.js` - Input cleaning
- `server/middleware/rbac.js` - Role-based access control

**Test Approach:**
- Mock Express req/res/next
- Test authentication flows
- Test authorization checks
- Test error handling
- Test edge cases (missing tokens, expired tokens, etc.)

**Example Test Structure:**
```javascript
// server/middleware/__tests__/auth.test.js
describe('Authentication Middleware', () => {
  describe('authenticate()', () => {
    it('should allow valid JWT token', () => {});
    it('should reject missing token', () => {});
    it('should reject expired token', () => {});
    it('should reject invalid token', () => {});
    it('should set req.user with decoded token', () => {});
  });
  
  describe('authorize()', () => {
    it('should allow user with required permission', () => {});
    it('should reject user without permission', () => {});
    it('should allow user with "all" permission', () => {});
  });
});
```

#### 3.1.3 Service Layer Testing (Priority 2)

**Files to Test:**
- `server/services/salesforce/connectionService.js` - Connection management
- `server/services/salesforce/projectService.js` - Project operations
- `server/services/salesforce/projectObjectiveService.js` - Objective operations
- `server/services/queueStatusScheduler.js` - Scheduled tasks

**Test Approach:**
- Mock jsforce/Salesforce API calls
- Test connection establishment
- Test error handling
- Test retry logic
- Test timeout scenarios

**Example Test Structure:**
```javascript
// server/services/salesforce/__tests__/connectionService.test.js
describe('Salesforce Connection Service', () => {
  describe('normalizeSalesforceUrl()', () => {
    it('should normalize lightning URLs', () => {});
    it('should handle sandbox URLs', () => {});
    it('should remove trailing slashes', () => {});
  });
  
  describe('testSalesforceConnection()', () => {
    it('should successfully connect with valid credentials', () => {});
    it('should timeout after configured duration', () => {});
    it('should handle invalid credentials', () => {});
    it('should handle network errors', () => {});
  });
});
```

#### 3.1.4 Route Handler Testing (Priority 2)

**Priority Routes:**
- `server/routes/auth.js` - Authentication endpoints
- `server/routes/salesforce/test.js` - Connection testing
- `server/routes/projects.js` - Project CRUD
- `server/routes/workStreamReporting.js` - Reporting endpoints

**Test Approach:**
- Use Supertest for HTTP testing
- Mock dependencies (Salesforce, database, file system)
- Test request/response flows
- Test error scenarios
- Test validation

**Example Test Structure:**
```javascript
// server/routes/__tests__/auth.test.js
describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {});
    it('should reject invalid credentials', async () => {});
    it('should return JWT token on success', async () => {});
    it('should set appropriate CORS headers', async () => {});
  });
});
```

### 3.2 Frontend Testing Strategy

#### 3.2.1 Utility Functions (Priority 1)

**Files to Test:**
- `client/src/utils/validation.js` - Form validation
- `client/src/utils/security.js` - XSS protection
- `client/src/utils/debounce.js` - Debounce utility
- `client/src/utils/rbac.js` - Permission checks
- `client/src/utils/gpcFilter.js` - Filter utilities

**Test Approach:**
- Pure function testing
- Edge cases
- Type checking
- Performance testing

**Example Test Structure:**
```javascript
// client/src/utils/__tests__/validation.test.js
describe('Validation Utilities', () => {
  describe('isValidEmail()', () => {
    it('should validate correct email formats', () => {});
    it('should reject invalid email formats', () => {});
    it('should handle edge cases', () => {});
  });
  
  describe('validateAndSanitize()', () => {
    it('should sanitize XSS attempts', () => {});
    it('should validate based on field type', () => {});
  });
});
```

#### 3.2.2 Context Providers (Priority 2)

**Files to Test:**
- `client/src/context/AuthContext.js` - Authentication state
- `client/src/context/GPCFilterContext.js` - Filter state
- `client/src/context/SidebarContext.js` - UI state

**Test Approach:**
- Test context value provision
- Test state updates
- Test side effects
- Mock API calls

**Example Test Structure:**
```javascript
// client/src/context/__tests__/AuthContext.test.js
describe('AuthContext', () => {
  describe('login()', () => {
    it('should set user and token on successful login', () => {});
    it('should handle login errors', () => {});
    it('should store token in localStorage', () => {});
  });
  
  describe('logout()', () => {
    it('should clear user and token', () => {});
    it('should clear localStorage', () => {});
  });
});
```

#### 3.2.3 Custom Hooks (Priority 2)

**Files to Test:**
- All files in `client/src/hooks/`

**Test Approach:**
- Use @testing-library/react-hooks
- Test hook return values
- Test state updates
- Test side effects

#### 3.2.4 API Client (Priority 1)

**Files to Test:**
- `client/src/config/api.js` - Axios configuration, interceptors

**Test Approach:**
- Mock axios
- Test request interceptors
- Test response interceptors
- Test error handling
- Test CSRF token management
- Test health check logic

#### 3.2.5 Components (Priority 3)

**Priority Components:**
- Form components (with validation)
- ProtectedRoute components
- ErrorBoundary
- Complex business logic components

**Test Approach:**
- Render testing
- User interaction testing
- Props testing
- State management testing
- Integration with hooks/context

**Example Test Structure:**
```javascript
// client/src/components/__tests__/ProtectedRoute.test.js
describe('ProtectedRoute', () => {
  it('should render children for authenticated users', () => {});
  it('should redirect unauthenticated users', () => {});
  it('should check permissions for role-protected routes', () => {});
});
```

---

## 4. Test Organization Structure

### 4.1 Backend Test Structure

```
server/
├── __tests__/                    # Global backend tests
│   ├── setup.js                  # Test setup/teardown
│   └── helpers/                  # Test utilities
│       ├── mockSalesforce.js     # Salesforce mocks
│       ├── mockExpress.js        # Express mocks
│       └── testData.js           # Test fixtures
├── middleware/
│   └── __tests__/
│       ├── auth.test.js
│       ├── csrf.test.js
│       ├── inputSanitization.test.js
│       └── rbac.test.js
├── routes/
│   └── __tests__/
│       ├── auth.test.js
│       ├── projects.test.js
│       └── salesforce.test.js
├── services/
│   └── __tests__/
│       └── salesforce/
│           └── connectionService.test.js
└── utils/
    └── __tests__/
        ├── encryption.test.js
        ├── cache.test.js
        ├── security.test.js
        └── gpcFilterQueryBuilder.test.js
```

### 4.2 Frontend Test Structure

```
client/src/
├── __tests__/                    # Global frontend tests
│   ├── setupTests.js            # Jest setup (already exists)
│   └── helpers/                 # Test utilities
│       ├── renderWithProviders.js
│       ├── mockApi.js
│       └── testData.js
├── utils/
│   └── __tests__/
│       ├── validation.test.js
│       ├── security.test.js
│       ├── debounce.test.js
│       └── rbac.test.js
├── context/
│   └── __tests__/
│       ├── AuthContext.test.js
│       └── GPCFilterContext.test.js
├── hooks/
│   └── __tests__/
│       └── [hook-name].test.js
├── components/
│   └── __tests__/
│       ├── ProtectedRoute.test.js
│       └── ErrorBoundary.test.js
└── config/
    └── __tests__/
        └── api.test.js
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Set up testing infrastructure and test critical utilities

**Tasks:**
1. Install backend testing dependencies (Jest, Supertest)
2. Configure Jest for both backend and frontend
3. Create test setup files and helpers
4. Write tests for encryption/decryption utilities
5. Write tests for security utilities (XSS, sanitization)
6. Write tests for validation utilities
7. Set up CI/CD test execution

**Deliverables:**
- Jest configuration files
- Test setup infrastructure
- 5-10 utility test files
- CI/CD integration

**Success Metrics:**
- All tests pass
- Coverage: 30%+ for utilities

### Phase 2: Security & Authentication (Weeks 3-4)
**Goal:** Comprehensive testing of security-critical code

**Tasks:**
1. Test authentication middleware
2. Test authorization middleware
3. Test CSRF protection
4. Test input sanitization
5. Test auth routes (login, register, verify)
6. Test JWT token handling
7. Test RBAC utilities

**Deliverables:**
- All middleware tests
- Auth route tests
- Security utility tests

**Success Metrics:**
- 80%+ coverage for security code
- All security edge cases covered

### Phase 3: Core Services (Weeks 5-6)
**Goal:** Test Salesforce integration and core services

**Tasks:**
1. Test Salesforce connection service
2. Test Salesforce project services
3. Test cache management
4. Test queue scheduler
5. Mock Salesforce API responses
6. Test error handling and retries

**Deliverables:**
- Service layer tests
- Salesforce integration mocks
- Error scenario tests

**Success Metrics:**
- 70%+ coverage for services
- All error paths tested

### Phase 4: API Routes (Weeks 7-9)
**Goal:** Test critical API endpoints

**Tasks:**
1. Test project CRUD routes
2. Test workstream reporting routes
3. Test Salesforce test routes
4. Test upload/parse routes
5. Test filter and query building
6. Test error responses

**Deliverables:**
- Route handler tests for priority endpoints
- Integration test examples

**Success Metrics:**
- 60%+ coverage for routes
- Critical endpoints fully tested

### Phase 5: Frontend Core (Weeks 10-12)
**Goal:** Test frontend utilities, context, and hooks

**Tasks:**
1. Test all utility functions
2. Test context providers
3. Test custom hooks
4. Test API client configuration
5. Test error handling

**Deliverables:**
- Frontend utility tests
- Context provider tests
- Hook tests
- API client tests

**Success Metrics:**
- 70%+ coverage for frontend utilities
- All hooks and context tested

### Phase 6: Components (Weeks 13-16)
**Goal:** Test critical UI components

**Tasks:**
1. Test form components
2. Test protected routes
3. Test error boundaries
4. Test complex business logic components
5. Test user interactions

**Deliverables:**
- Component test suite
- Integration test examples

**Success Metrics:**
- 60%+ coverage for components
- Critical user flows tested

---

## 6. Test Coverage Goals

### 6.1 Coverage Targets by Category

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| Security (encryption, auth, CSRF) | 90%+ | Critical |
| Utility Functions | 85%+ | High |
| Service Layer | 75%+ | High |
| Middleware | 80%+ | High |
| API Routes | 70%+ | Medium |
| Frontend Utils | 80%+ | High |
| Context/Hooks | 75%+ | Medium |
| Components | 60%+ | Medium |
| **Overall** | **70%+** | - |

### 6.2 Coverage Metrics to Track

- **Line Coverage:** Percentage of code lines executed
- **Branch Coverage:** Percentage of conditional branches tested
- **Function Coverage:** Percentage of functions called
- **Statement Coverage:** Percentage of statements executed

---

## 7. Testing Best Practices

### 7.1 Test Naming Conventions

- Use descriptive test names: `describe('functionName()', () => { it('should do X when Y', () => {}) })`
- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for setup/teardown
- Use `beforeAll`/`afterAll` for expensive setup

### 7.2 Test Structure (AAA Pattern)

```javascript
it('should do something', () => {
  // Arrange - Set up test data and mocks
  const input = 'test';
  const expected = 'result';
  
  // Act - Execute the function
  const result = functionUnderTest(input);
  
  // Assert - Verify the result
  expect(result).toBe(expected);
});
```

### 7.3 Mocking Strategy

- **Mock external dependencies:** Salesforce API, file system, database
- **Mock HTTP requests:** Use nock or msw
- **Mock time-dependent functions:** Use Jest fake timers
- **Mock environment variables:** Set in test setup
- **Avoid over-mocking:** Test real logic when possible

### 7.4 Test Data Management

- Create reusable test fixtures
- Use factories for complex objects
- Keep test data minimal and focused
- Clean up test data after tests

### 7.5 Error Testing

- Test all error paths
- Test edge cases (null, undefined, empty strings)
- Test boundary conditions
- Test invalid input handling

---

## 8. Tools and Configuration

### 8.1 Package.json Scripts

**Backend:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

**Frontend:**
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:watch": "react-scripts test --watch",
    "test:coverage": "react-scripts test --coverage",
    "test:ci": "react-scripts test --ci --coverage --watchAll=false"
  }
}
```

### 8.2 Jest Configuration

**Backend (`server/jest.config.js`):**
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/index.js'
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
```

**Frontend (`client/jest.config.js` or in package.json):**
- Already configured via react-scripts
- May need custom configuration for additional features

### 8.3 Test Helpers and Utilities

**Create reusable test utilities:**
- Mock factories
- Test data generators
- Assertion helpers
- Setup/teardown utilities

---

## 9. Continuous Integration

### 9.1 CI/CD Integration

- Run tests on every pull request
- Block merges if tests fail
- Generate coverage reports
- Publish coverage to service (Codecov, Coveralls)
- Run tests in parallel for speed

### 9.2 Pre-commit Hooks

- Run linting
- Run unit tests for changed files
- Prevent commits if tests fail
- Use husky + lint-staged

---

## 10. Priority Test Cases

### 10.1 Critical Path Tests (Must Have)

1. **Authentication Flow:**
   - Login with valid credentials
   - Login with invalid credentials
   - Token expiration handling
   - Token refresh

2. **Salesforce Connection:**
   - Successful connection
   - Connection timeout
   - Invalid credentials
   - Network errors

3. **Data Security:**
   - Encryption/decryption
   - XSS prevention
   - Input sanitization
   - CSRF protection

4. **Authorization:**
   - Permission checks
   - Role-based access
   - Route protection

### 10.2 High-Value Tests (Should Have)

1. **Data Validation:**
   - Form validation
   - Field type validation
   - Business rule validation

2. **Cache Management:**
   - Cache hit/miss
   - Cache expiration
   - Cache invalidation

3. **Error Handling:**
   - API error responses
   - Network error handling
   - User-friendly error messages

### 10.3 Nice-to-Have Tests

1. **UI Components:**
   - Component rendering
   - User interactions
   - State updates

2. **Performance:**
   - Debounce functionality
   - Large dataset handling
   - Memory leak detection

---

## 11. Estimated Effort

### 11.1 Time Estimates

| Phase | Duration | Developer Time |
|-------|----------|----------------|
| Phase 1: Foundation | 2 weeks | 80 hours |
| Phase 2: Security | 2 weeks | 80 hours |
| Phase 3: Services | 2 weeks | 80 hours |
| Phase 4: Routes | 3 weeks | 120 hours |
| Phase 5: Frontend Core | 3 weeks | 120 hours |
| Phase 6: Components | 4 weeks | 160 hours |
| **Total** | **16 weeks** | **640 hours** |

### 11.2 Resource Requirements

- **1-2 Developers** with testing experience
- **Access to:** Salesforce sandbox for integration testing
- **Tools:** Development environment, CI/CD pipeline

---

## 12. Success Criteria

### 12.1 Quantitative Metrics

- ✅ 70%+ overall test coverage
- ✅ 90%+ coverage for security-critical code
- ✅ 100% of critical paths tested
- ✅ All tests pass in CI/CD
- ✅ Test execution time < 5 minutes

### 12.2 Qualitative Metrics

- ✅ Confidence in code changes
- ✅ Faster bug detection
- ✅ Better code documentation (via tests)
- ✅ Easier refactoring
- ✅ Reduced production bugs

---

## 13. Risks and Mitigation

### 13.1 Identified Risks

1. **Salesforce API Mocking Complexity**
   - **Risk:** Difficult to mock Salesforce API responses
   - **Mitigation:** Use nock or create comprehensive mock service

2. **Large Codebase**
   - **Risk:** Overwhelming amount of code to test
   - **Mitigation:** Prioritize critical paths, phase implementation

3. **Legacy Code Patterns**
   - **Risk:** Some code may be difficult to test
   - **Mitigation:** Refactor untestable code, use integration tests where needed

4. **Time Constraints**
   - **Risk:** Testing takes time away from feature development
   - **Mitigation:** Integrate testing into development workflow, not separate phase

### 13.2 Mitigation Strategies

- Start with highest-value tests
- Use test-driven development for new features
- Refactor legacy code incrementally
- Automate test execution
- Provide training on testing best practices

---

## 14. Next Steps

### Immediate Actions (Week 1)

1. ✅ Review and approve this proposal
2. Install backend testing dependencies
3. Set up Jest configuration
4. Create test directory structure
5. Write first utility test as proof of concept
6. Set up CI/CD test execution

### Short-term (Months 1-2)

1. Complete Phase 1 & 2 (Foundation + Security)
2. Establish testing patterns and conventions
3. Create test utilities and helpers
4. Document testing guidelines

### Long-term (Months 3-4)

1. Complete all phases
2. Achieve coverage targets
3. Integrate testing into development workflow
4. Maintain and update tests with code changes

---

## 15. Appendix

### 15.1 Testing Libraries Comparison

| Library | Use Case | Recommendation |
|---------|----------|---------------|
| Jest | Test runner, assertions | ✅ Use (industry standard) |
| Mocha | Test runner | ❌ Not needed (Jest covers this) |
| Chai | Assertions | ❌ Not needed (Jest has built-in) |
| Supertest | HTTP testing | ✅ Use for route testing |
| nock | HTTP mocking | ✅ Use for Salesforce API mocking |
| msw | API mocking | ✅ Use for frontend API mocking |
| Sinon | Advanced mocking | ⚠️ Optional (Jest mocks may suffice) |

### 15.2 Example Test Files

See separate document: `TEST_EXAMPLES.md` (to be created)

### 15.3 References

- Jest Documentation: https://jestjs.io/
- React Testing Library: https://testing-library.com/react
- Testing Best Practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Conclusion

This proposal provides a comprehensive roadmap for implementing unit tests across the Project Tools application. By following this phased approach, we can systematically build test coverage while maintaining development velocity. The focus on critical security and business logic first ensures maximum value from testing efforts.

**Recommendation:** Approve and begin Phase 1 implementation immediately to establish testing infrastructure and patterns.

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Development Team  
**Status:** Ready for Review
