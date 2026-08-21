/**
 * Unit Tests for CSRF Protection Middleware
 * Tests CSRF token generation and validation
 */

const csrf = require('csrf');
const { getCsrfToken, validateCsrf } = require('../../middleware/csrf');
const { createMockRequest, createMockResponse, createMockNext } = require('../../__tests__/helpers/mockExpress');

describe('CSRF Protection Middleware', () => {
  const tokens = new csrf();

  describe('getCsrfToken()', () => {
    it('should generate CSRF token for user', () => {
      const req = createMockRequest({
        user: { id: '1' },
        headers: {
          origin: 'http://localhost:3000'
        }
      });
      const res = createMockResponse();

      getCsrfToken(req, res);

      expect(res.data).toBeTruthy();
      expect(res.data.success).toBe(true);
      expect(res.data.csrfToken).toBeTruthy();
      expect(typeof res.data.csrfToken).toBe('string');
    });

    it('should generate CSRF token for session', () => {
      const req = createMockRequest({
        session: { id: 'session-123' },
        headers: {
          origin: 'http://localhost:3000'
        }
      });
      const res = createMockResponse();

      getCsrfToken(req, res);

      expect(res.data.success).toBe(true);
      expect(res.data.csrfToken).toBeTruthy();
    });

    it('should generate CSRF token using IP as fallback', () => {
      const req = createMockRequest({
        ip: '127.0.0.1',
        headers: {
          origin: 'http://localhost:3000'
        }
      });
      const res = createMockResponse();

      getCsrfToken(req, res);

      expect(res.data.success).toBe(true);
      expect(res.data.csrfToken).toBeTruthy();
    });

    it('should set CORS headers', () => {
      const req = createMockRequest({
        headers: {
          origin: 'http://localhost:3000'
        }
      });
      const res = createMockResponse();

      getCsrfToken(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:3000'
      );
    });

    it('should handle errors gracefully', () => {
      // Mock tokens.create to throw an error
      const originalCreate = tokens.create;
      tokens.create = jest.fn(() => {
        throw new Error('Token creation failed');
      });

      const req = createMockRequest();
      const res = createMockResponse();

      getCsrfToken(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.data.success).toBe(false);

      // Restore original
      tokens.create = originalCreate;
    });
  });

  describe('validateCsrf()', () => {
    it('should allow GET requests without token', () => {
      const req = createMockRequest({
        method: 'GET',
        user: { id: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow HEAD requests without token', () => {
      const req = createMockRequest({
        method: 'HEAD',
        user: { id: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow OPTIONS requests without token', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        user: { id: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow auth endpoints without token', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/auth/login'
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should validate CSRF token from header', () => {
      const secret = 'user-1';
      const token = tokens.create(secret);

      const req = createMockRequest({
        method: 'POST',
        path: '/api/projects',
        user: { id: '1' },
        headers: {
          'x-csrf-token': token
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should validate CSRF token from body', () => {
      const secret = 'user-1';
      const token = tokens.create(secret);

      const req = createMockRequest({
        method: 'POST',
        path: '/api/projects',
        user: { id: '1' },
        body: {
          csrfToken: token
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject POST request without token', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/projects',
        user: { id: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.data.success).toBe(false);
      expect(res.data.error).toBe('CSRF token missing');
    });

    it('should reject request with invalid token', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/projects',
        user: { id: '1' },
        headers: {
          'x-csrf-token': 'invalid-token'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.data.error).toBe('Invalid CSRF token');
    });

    it('should validate token with session secret', () => {
      const secret = 'session-123';
      const token = tokens.create(secret);

      const req = createMockRequest({
        method: 'POST',
        path: '/api/projects',
        session: {
          id: '123',
          csrfSecret: secret
        },
        headers: {
          'x-csrf-token': token
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should validate token with IP-based secret as fallback', () => {
      const secret = 'ip-127.0.0.1';
      const token = tokens.create(secret);

      const req = createMockRequest({
        method: 'POST',
        path: '/api/projects',
        ip: '127.0.0.1',
        headers: {
          'x-csrf-token': token
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateCsrf(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
