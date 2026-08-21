/**
 * Unit Tests for Authentication Middleware
 * Tests JWT authentication and authorization
 */

const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../middleware/auth');
const { createMockRequest, createMockResponse, createMockNext } = require('../../__tests__/helpers/mockExpress');

describe('Authentication Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  describe('authenticate()', () => {
    it('should allow request with valid JWT token', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', permissions: ['view_project'] },
        JWT_SECRET
      );
      
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeTruthy();
      expect(req.user.id).toBe('1');
      expect(req.user.email).toBe('test@example.com');
    });

    it('should reject request without token', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.data).toEqual({
        success: false,
        error: 'No token provided',
        message: 'Authentication required. Please log in again.'
      });
    });

    it('should reject request with invalid token', () => {
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.data.success).toBe(false);
      expect(res.data.error).toBe('Invalid token');
    });

    it('should reject request with expired token', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toContain('expired');
    });

    it('should handle token with wrong secret', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com' },
        'wrong-secret'
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it('should handle missing Authorization header', () => {
      const req = createMockRequest({
        headers: {}
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it('should handle malformed Authorization header', () => {
      const req = createMockRequest({
        headers: {
          authorization: 'NotBearer token'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe('authorize()', () => {
    it('should allow request with required permission', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', permissions: ['view_project', 'edit_project'] },
        JWT_SECRET
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      req.user = jwt.verify(token, JWT_SECRET);

      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize('view_project');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow request with "all" permission', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', permissions: ['all'] },
        JWT_SECRET
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      req.user = jwt.verify(token, JWT_SECRET);

      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize('delete_project');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject request without user', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize('view_project');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.data.error).toBe('Unauthorized');
    });

    it('should reject request without required permission', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', permissions: ['view_project'] },
        JWT_SECRET
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      req.user = jwt.verify(token, JWT_SECRET);

      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize('delete_project');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.data.error).toBe('Insufficient permissions');
    });

    it('should allow request with any of multiple required permissions', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', permissions: ['view_project'] },
        JWT_SECRET
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      req.user = jwt.verify(token, JWT_SECRET);

      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize('view_project', 'edit_project');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject request without any of multiple required permissions', () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', permissions: ['view_project'] },
        JWT_SECRET
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      req.user = jwt.verify(token, JWT_SECRET);

      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize('delete_project', 'admin_access');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
    });
  });
});
