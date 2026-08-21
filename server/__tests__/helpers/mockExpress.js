/**
 * Express Request/Response Mocking Utilities
 * Provides mocks for Express middleware testing
 */

/**
 * Create a mock Express request object
 */
const createMockRequest = (overrides = {}) => {
  return {
    headers: {
      'content-type': 'application/json',
      ...overrides.headers
    },
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    connection: {
      remoteAddress: '127.0.0.1'
    },
    socket: {
      remoteAddress: '127.0.0.1'
    },
    user: null,
    session: {},
    ...overrides
  };
};

/**
 * Create a mock Express response object
 */
const createMockResponse = () => {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status: jest.fn(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    send: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    setHeader: jest.fn(function(name, value) {
      this.headers[name] = value;
      return this;
    }),
    getHeader: jest.fn(function(name) {
      return this.headers[name];
    }),
    end: jest.fn(function() {
      return this;
    })
  };
  return res;
};

/**
 * Create a mock Express next function
 */
const createMockNext = () => {
  return jest.fn();
};

module.exports = {
  createMockRequest,
  createMockResponse,
  createMockNext
};
