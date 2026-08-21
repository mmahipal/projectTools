/**
 * Unit Tests for RBAC Middleware
 * Tests role-based access control
 */

const { requireRole, requirePermission, requireRouteAccess, checkFeatureAccess } = require('../../middleware/rbac');
const { ROLES, PERMISSIONS } = require('../../utils/roles');
const { createMockRequest, createMockResponse, createMockNext } = require('../../__tests__/helpers/mockExpress');

describe('RBAC Middleware', () => {
  describe('requireRole()', () => {
    it('should allow admin access to any role', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.ADMIN }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(ROLES.REPORTS_VIEWER);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user with required role', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_VIEWER }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(ROLES.REPORTS_VIEWER);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user with any of multiple required roles', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_MANAGER }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(ROLES.REPORTS_VIEWER, ROLES.REPORTS_MANAGER);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_VIEWER }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(ROLES.SALESFORCE_MANAGER);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.data.error).toBe('Forbidden');
    });

    it('should reject request without user', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(ROLES.REPORTS_VIEWER);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.data.error).toBe('Unauthorized');
    });
  });

  describe('requirePermission()', () => {
    it('should allow admin access to any permission', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.ADMIN }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requirePermission(PERMISSIONS.DELETE_PROJECTS);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user with required permission', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_VIEWER }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requirePermission(PERMISSIONS.VIEW_REPORTS);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user with any of multiple required permissions', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_MANAGER }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requirePermission(PERMISSIONS.VIEW_REPORTS, PERMISSIONS.CREATE_REPORTS);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user without required permission', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_VIEWER }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requirePermission(PERMISSIONS.DELETE_PROJECTS);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.data.error).toBe('Forbidden');
    });

    it('should reject request without user', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requirePermission(PERMISSIONS.VIEW_REPORTS);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe('requireRouteAccess()', () => {
    it('should allow admin access to any route', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.ADMIN },
        path: '/any-route'
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireRouteAccess(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user with permission for route', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_VIEWER },
        path: '/report-builder'
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireRouteAccess(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user without permission for route', () => {
      const req = createMockRequest({
        user: { id: '1', role: ROLES.REPORTS_VIEWER },
        path: '/user-management'
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireRouteAccess(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.data.error).toBe('Forbidden');
    });

    it('should reject request without user', () => {
      const req = createMockRequest({
        path: '/report-builder'
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireRouteAccess(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe('checkFeatureAccess()', () => {
    it('should return true for admin', () => {
      const result = checkFeatureAccess(ROLES.ADMIN, 'report_builder.create');
      expect(result).toBe(true);
    });

    it('should return true for user with permission', () => {
      const result = checkFeatureAccess(ROLES.REPORTS_MANAGER, 'report_builder.create');
      expect(result).toBe(true);
    });

    it('should return false for user without permission', () => {
      const result = checkFeatureAccess(ROLES.REPORTS_VIEWER, 'report_builder.create');
      expect(result).toBe(false);
    });
  });
});
