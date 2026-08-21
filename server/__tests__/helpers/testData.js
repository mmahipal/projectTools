/**
 * Test Data Fixtures
 * Reusable test data for unit tests
 */

// Mock JWT token
const createMockJWT = (payload = {}) => {
  // In real tests, use jsonwebtoken to create actual tokens
  // For now, return a mock token structure
  return {
    id: payload.id || '1',
    email: payload.email || 'test@example.com',
    role: payload.role || 'user',
    permissions: payload.permissions || ['view_project'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    ...payload
  };
};

// Mock user object
const createMockUser = (overrides = {}) => {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    permissions: ['view_project'],
    ...overrides
  };
};

// Mock Salesforce settings
const createMockSalesforceSettings = (overrides = {}) => {
  return {
    salesforceUrl: 'https://test.salesforce.com',
    username: 'test@example.com',
    password: 'testpassword',
    securityToken: 'testtoken',
    domain: 'test',
    ...overrides
  };
};

// Mock project data
const createMockProject = (overrides = {}) => {
  return {
    id: `PROJ-${Date.now()}`,
    projectName: 'Test Project',
    shortProjectName: 'Test',
    projectType: 'Test Type',
    status: 'Draft',
    createdAt: new Date().toISOString(),
    createdBy: 'test@example.com',
    ...overrides
  };
};

module.exports = {
  createMockJWT,
  createMockUser,
  createMockSalesforceSettings,
  createMockProject
};
