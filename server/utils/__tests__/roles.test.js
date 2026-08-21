/**
 * Sanity Tests for Roles Utility
 * Tests role-based access control functions
 */

const {
  ROLES,
  PERMISSIONS,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  getRoutePermission,
  canAccessRoute,
  canAccessFeature
} = require('../roles');

describe('Roles Utility - Sanity Tests', () => {
  describe('ROLES and PERMISSIONS constants', () => {
    it('should have defined ROLES', () => {
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.REPORTS_VIEWER).toBe('reports_viewer');
      expect(ROLES.REPORTS_MANAGER).toBe('reports_manager');
      expect(ROLES.SALESFORCE_MANAGER).toBe('salesforce_manager');
    });

    it('should have defined PERMISSIONS', () => {
      expect(PERMISSIONS.VIEW_REPORTS).toBe('view_reports');
      expect(PERMISSIONS.CREATE_REPORTS).toBe('create_reports');
      expect(PERMISSIONS.ALL).toBe('all');
    });
  });

  describe('getRolePermissions()', () => {
    it('should return permissions for admin role', () => {
      const permissions = getRolePermissions(ROLES.ADMIN);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions).toContain(PERMISSIONS.ALL);
    });

    it('should return permissions for reports_viewer role', () => {
      const permissions = getRolePermissions(ROLES.REPORTS_VIEWER);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions).toContain(PERMISSIONS.VIEW_REPORTS);
    });

    it('should return empty array for unknown role', () => {
      const permissions = getRolePermissions('unknown_role');
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBe(0);
    });
  });

  describe('hasPermission()', () => {
    it('should return true for admin with any permission', () => {
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.VIEW_REPORTS)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.DELETE_PROJECTS)).toBe(true);
    });

    it('should return true for role with specific permission', () => {
      expect(hasPermission(ROLES.REPORTS_VIEWER, PERMISSIONS.VIEW_REPORTS)).toBe(true);
    });

    it('should return false for role without permission', () => {
      expect(hasPermission(ROLES.REPORTS_VIEWER, PERMISSIONS.DELETE_PROJECTS)).toBe(false);
    });
  });

  describe('hasAnyPermission()', () => {
    it('should return true if role has any of the permissions', () => {
      expect(hasAnyPermission(ROLES.REPORTS_MANAGER, [
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.CREATE_REPORTS
      ])).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      expect(hasAnyPermission(ROLES.REPORTS_VIEWER, [
        PERMISSIONS.DELETE_PROJECTS,
        PERMISSIONS.MANAGE_USERS
      ])).toBe(false);
    });
  });

  describe('canAccessRoute()', () => {
    it('should allow admin to access any route', () => {
      expect(canAccessRoute(ROLES.ADMIN, '/any-route')).toBe(true);
      expect(canAccessRoute(ROLES.ADMIN, '/user-management')).toBe(true);
    });

    it('should allow role with permission to access route', () => {
      expect(canAccessRoute(ROLES.REPORTS_VIEWER, '/report-builder')).toBe(true);
    });

    it('should deny role without permission to access route', () => {
      expect(canAccessRoute(ROLES.REPORTS_VIEWER, '/user-management')).toBe(false);
    });
  });

  describe('canAccessFeature()', () => {
    it('should allow admin to access any feature', () => {
      expect(canAccessFeature(ROLES.ADMIN, 'report_builder.create')).toBe(true);
      expect(canAccessFeature(ROLES.ADMIN, 'administration.users')).toBe(true);
    });

    it('should allow role with permission to access feature', () => {
      expect(canAccessFeature(ROLES.REPORTS_MANAGER, 'report_builder.create')).toBe(true);
    });

    it('should deny role without permission to access feature', () => {
      expect(canAccessFeature(ROLES.REPORTS_VIEWER, 'report_builder.create')).toBe(false);
    });
  });
});
