/**
 * Frontend Role-Based Access Control Utilities
 * Mirrors the backend role system for frontend checks
 */

// Role definitions (must match backend)
export const ROLES = {
  ADMIN: 'admin',
  REPORTS_VIEWER: 'reports_viewer',
  REPORTS_MANAGER: 'reports_manager',
  SALESFORCE_MANAGER: 'salesforce_manager'
};

// Permission definitions (must match backend)
export const PERMISSIONS = {
  VIEW_DASHBOARDS: 'view_dashboards',
  MANAGE_DASHBOARDS: 'manage_dashboards',
  VIEW_REPORTS: 'view_reports',
  CREATE_REPORTS: 'create_reports',
  EDIT_REPORTS: 'edit_reports',
  DELETE_REPORTS: 'delete_reports',
  SCHEDULE_REPORTS: 'schedule_reports',
  VIEW_PROJECTS: 'view_projects',
  CREATE_PROJECTS: 'create_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  VIEW_CLIENT_TOOL_ACCOUNT: 'view_client_tool_account',
  MANAGE_CLIENT_TOOL_ACCOUNT: 'manage_client_tool_account',
  VIEW_QUEUE_STATUS: 'view_queue_status',
  MANAGE_QUEUE_STATUS: 'manage_queue_status',
  VIEW_WORKSTREAMS: 'view_workstreams',
  MANAGE_WORKSTREAMS: 'manage_workstreams',
  VIEW_UPDATE_FIELDS: 'view_update_fields',
  MANAGE_UPDATE_FIELDS: 'manage_update_fields',
  VIEW_ADMINISTRATION: 'view_administration',
  MANAGE_SALESFORCE_CONNECTION: 'manage_salesforce_connection',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  ALL: 'all'
};

// Role to permissions mapping (must match backend)
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [PERMISSIONS.ALL],
  [ROLES.REPORTS_VIEWER]: [
    PERMISSIONS.VIEW_DASHBOARDS,
    PERMISSIONS.VIEW_REPORTS
  ],
  [ROLES.REPORTS_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARDS,
    PERMISSIONS.MANAGE_DASHBOARDS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EDIT_REPORTS,
    PERMISSIONS.DELETE_REPORTS,
    PERMISSIONS.SCHEDULE_REPORTS
  ],
  [ROLES.SALESFORCE_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARDS,
    PERMISSIONS.MANAGE_DASHBOARDS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EDIT_REPORTS,
    PERMISSIONS.DELETE_REPORTS,
    PERMISSIONS.SCHEDULE_REPORTS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.VIEW_CLIENT_TOOL_ACCOUNT,
    PERMISSIONS.MANAGE_CLIENT_TOOL_ACCOUNT,
    PERMISSIONS.VIEW_QUEUE_STATUS,
    PERMISSIONS.MANAGE_QUEUE_STATUS,
    PERMISSIONS.VIEW_WORKSTREAMS,
    PERMISSIONS.MANAGE_WORKSTREAMS,
    PERMISSIONS.VIEW_UPDATE_FIELDS,
    PERMISSIONS.MANAGE_UPDATE_FIELDS,
    PERMISSIONS.VIEW_ADMINISTRATION,
    PERMISSIONS.MANAGE_SALESFORCE_CONNECTION
  ]
};

// Route to permission mapping
const ROUTE_PERMISSIONS = {
  '/dashboard': PERMISSIONS.VIEW_DASHBOARDS,
  '/case-analytics': PERMISSIONS.VIEW_DASHBOARDS,
  '/contributor-payments': PERMISSIONS.VIEW_DASHBOARDS,
  '/report-builder': PERMISSIONS.VIEW_REPORTS,
  '/scheduled-reports': PERMISSIONS.VIEW_REPORTS,
  '/setup': PERMISSIONS.CREATE_PROJECTS,
  '/quick-setup': PERMISSIONS.CREATE_PROJECTS,
  '/projects': PERMISSIONS.VIEW_PROJECTS,
  '/project': PERMISSIONS.VIEW_PROJECTS,
  '/client-tool-account': PERMISSIONS.VIEW_CLIENT_TOOL_ACCOUNT,
  '/queue-status-management': PERMISSIONS.VIEW_QUEUE_STATUS,
  '/workstream-management': PERMISSIONS.VIEW_WORKSTREAMS,
  '/create-workstream': PERMISSIONS.MANAGE_WORKSTREAMS,
  '/update-object-fields': PERMISSIONS.VIEW_UPDATE_FIELDS,
  '/administration': PERMISSIONS.VIEW_ADMINISTRATION,
  '/settings': PERMISSIONS.MANAGE_SETTINGS,
  '/user-management': PERMISSIONS.MANAGE_USERS
};

/**
 * Get permissions for a role
 */
export const getRolePermissions = (role) => {
  if (!role) return [];
  // Normalize role to lowercase for lookup
  const normalizedRole = role.toLowerCase().trim();
  return ROLE_PERMISSIONS[normalizedRole] || [];
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role, permission) => {
  if (!role) return false;
  const rolePerms = getRolePermissions(role);
  return rolePerms.includes(PERMISSIONS.ALL) || rolePerms.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role, permissions) => {
  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }
  return permissions.some(perm => hasPermission(role, perm));
};

/**
 * Get required permission for a route
 */
export const getRoutePermission = (route) => {
  // Check exact match first
  if (ROUTE_PERMISSIONS[route]) {
    return ROUTE_PERMISSIONS[route];
  }
  
  // Check prefix matches
  for (const [routePattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.startsWith(routePattern)) {
      return permission;
    }
  }
  
  // Default: require view permission
  return PERMISSIONS.VIEW_PROJECTS;
};

/**
 * Check if user can access a route
 */
export const canAccessRoute = (userRole, route) => {
  if (!userRole) return false;
  const requiredPermission = getRoutePermission(route);
  return hasPermission(userRole, requiredPermission);
};

/**
 * Check if user has a specific role
 */
export const hasRole = (userRole, role) => {
  return userRole === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (userRole, roles) => {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  return roles.includes(userRole);
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

/**
 * Feature to permission mapping
 */
const FEATURE_PERMISSIONS = {
  'reports': PERMISSIONS.VIEW_REPORTS,
  'create_reports': PERMISSIONS.CREATE_REPORTS,
  'edit_reports': PERMISSIONS.EDIT_REPORTS,
  'delete_reports': PERMISSIONS.DELETE_REPORTS,
  'schedule_reports': PERMISSIONS.SCHEDULE_REPORTS,
  'dashboards': PERMISSIONS.VIEW_DASHBOARDS,
  'manage_dashboards': PERMISSIONS.MANAGE_DASHBOARDS,
  'projects': PERMISSIONS.VIEW_PROJECTS,
  'create_projects': PERMISSIONS.CREATE_PROJECTS,
  'edit_projects': PERMISSIONS.EDIT_PROJECTS,
  'delete_projects': PERMISSIONS.DELETE_PROJECTS,
  'client_tool_account': PERMISSIONS.VIEW_CLIENT_TOOL_ACCOUNT,
  'queue_status': PERMISSIONS.VIEW_QUEUE_STATUS,
  'workstreams': PERMISSIONS.VIEW_WORKSTREAMS,
  'update_fields': PERMISSIONS.VIEW_UPDATE_FIELDS,
  'administration': PERMISSIONS.VIEW_ADMINISTRATION,
  'settings': PERMISSIONS.MANAGE_SETTINGS,
  'users': PERMISSIONS.MANAGE_USERS
};

/**
 * Get required permission for a feature
 */
const getFeaturePermission = (feature) => {
  return FEATURE_PERMISSIONS[feature] || PERMISSIONS.VIEW_PROJECTS;
};

/**
 * Check if user can access a feature
 */
export const canAccessFeature = (userRole, feature) => {
  if (!userRole) return false;
  const requiredPermission = getFeaturePermission(feature);
  return hasPermission(userRole, requiredPermission);
};

