/**
 * Role-Based Access Control (RBAC) System
 * Defines roles and their permissions
 */

// Role definitions
const ROLES = {
  ADMIN: 'admin',
  REPORTS_VIEWER: 'reports_viewer',
  REPORTS_MANAGER: 'reports_manager',
  SALESFORCE_MANAGER: 'salesforce_manager'
};

// Permission definitions
const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARDS: 'view_dashboards',
  MANAGE_DASHBOARDS: 'manage_dashboards',
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  CREATE_REPORTS: 'create_reports',
  EDIT_REPORTS: 'edit_reports',
  DELETE_REPORTS: 'delete_reports',
  SCHEDULE_REPORTS: 'schedule_reports',
  
  // Project Management permissions
  VIEW_PROJECTS: 'view_projects',
  CREATE_PROJECTS: 'create_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  
  // Client Tool Account permissions
  VIEW_CLIENT_TOOL_ACCOUNT: 'view_client_tool_account',
  MANAGE_CLIENT_TOOL_ACCOUNT: 'manage_client_tool_account',
  
  // Queue Status Management permissions
  VIEW_QUEUE_STATUS: 'view_queue_status',
  MANAGE_QUEUE_STATUS: 'manage_queue_status',
  
  // Workstream Management permissions
  VIEW_WORKSTREAMS: 'view_workstreams',
  MANAGE_WORKSTREAMS: 'manage_workstreams',
  
  // Update Object Fields permissions
  VIEW_UPDATE_FIELDS: 'view_update_fields',
  MANAGE_UPDATE_FIELDS: 'manage_update_fields',
  
  // Administration permissions
  VIEW_ADMINISTRATION: 'view_administration',
  MANAGE_SALESFORCE_CONNECTION: 'manage_salesforce_connection',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  
  // All permissions (super user)
  ALL: 'all'
};

/**
 * Get all individual permissions (excluding 'all')
 * @returns {Array<string>} Array of all permission values
 */
const getAllIndividualPermissions = () => {
  return Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.ALL);
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all individual permissions explicitly listed
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
    PERMISSIONS.MANAGE_SALESFORCE_CONNECTION,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    // Also include 'all' for backward compatibility
    PERMISSIONS.ALL
  ],
  
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
    // Note: Salesforce Manager does NOT have MANAGE_USERS or MANAGE_SETTINGS
  ]
};

// Route to permission mapping
const ROUTE_PERMISSIONS = {
  // Dashboards
  '/dashboard': PERMISSIONS.VIEW_DASHBOARDS,
  '/case-analytics': PERMISSIONS.VIEW_DASHBOARDS,
  '/contributor-payments': PERMISSIONS.VIEW_DASHBOARDS,
  
  // Reports
  '/report-builder': PERMISSIONS.VIEW_REPORTS,
  '/scheduled-reports': PERMISSIONS.VIEW_REPORTS,
  
  // Project Management
  '/setup': PERMISSIONS.CREATE_PROJECTS,
  '/quick-setup': PERMISSIONS.CREATE_PROJECTS,
  '/projects': PERMISSIONS.VIEW_PROJECTS,
  '/project': PERMISSIONS.VIEW_PROJECTS,
  
  // Client Tool Account
  '/client-tool-account': PERMISSIONS.VIEW_CLIENT_TOOL_ACCOUNT,
  
  // Queue Status Management
  '/queue-status-management': PERMISSIONS.VIEW_QUEUE_STATUS,
  
  // Workstream Management
  '/workstream-management': PERMISSIONS.VIEW_WORKSTREAMS,
  '/create-workstream': PERMISSIONS.MANAGE_WORKSTREAMS,
  
  // Update Object Fields
  '/update-object-fields': PERMISSIONS.VIEW_UPDATE_FIELDS,
  
  // Administration
  '/administration': PERMISSIONS.VIEW_ADMINISTRATION,
  '/settings': PERMISSIONS.MANAGE_SETTINGS,
  '/user-management': PERMISSIONS.MANAGE_USERS
};

// Feature to permission mapping (for UI components)
const FEATURE_PERMISSIONS = {
  // Report Builder features
  'report_builder.create': PERMISSIONS.CREATE_REPORTS,
  'report_builder.edit': PERMISSIONS.EDIT_REPORTS,
  'report_builder.delete': PERMISSIONS.DELETE_REPORTS,
  'report_builder.schedule': PERMISSIONS.SCHEDULE_REPORTS,
  'report_builder.view': PERMISSIONS.VIEW_REPORTS,
  
  // Scheduled Reports features
  'scheduled_reports.create': PERMISSIONS.SCHEDULE_REPORTS,
  'scheduled_reports.edit': PERMISSIONS.SCHEDULE_REPORTS,
  'scheduled_reports.delete': PERMISSIONS.SCHEDULE_REPORTS,
  'scheduled_reports.view': PERMISSIONS.VIEW_REPORTS,
  
  // Administration tabs
  'administration.salesforce': PERMISSIONS.MANAGE_SALESFORCE_CONNECTION,
  'administration.users': PERMISSIONS.MANAGE_USERS,
  'administration.settings': PERMISSIONS.MANAGE_SETTINGS
};

/**
 * Get permissions for a role
 */
const getRolePermissions = (role) => {
  if (!role) return [];
  // Normalize role to lowercase for lookup
  const normalizedRole = role.toLowerCase().trim();
  return ROLE_PERMISSIONS[normalizedRole] || [];
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  if (!role) return false;
  // Normalize role to lowercase for lookup
  const normalizedRole = role.toLowerCase().trim();
  const rolePerms = getRolePermissions(normalizedRole);
  return rolePerms.includes(PERMISSIONS.ALL) || rolePerms.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
const hasAnyPermission = (role, permissions) => {
  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }
  return permissions.some(perm => hasPermission(role, perm));
};

/**
 * Get required permission for a route
 */
const getRoutePermission = (route) => {
  // Check exact match first
  if (ROUTE_PERMISSIONS[route]) {
    return ROUTE_PERMISSIONS[route];
  }
  
  // Check prefix matches (e.g., /project/:id)
  for (const [routePattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.startsWith(routePattern)) {
      return permission;
    }
  }
  
  // Default: require view permission
  return PERMISSIONS.VIEW_PROJECTS;
};

/**
 * Get required permission for a feature
 */
const getFeaturePermission = (feature) => {
  return FEATURE_PERMISSIONS[feature] || PERMISSIONS.VIEW_PROJECTS;
};

/**
 * Check if user can access a route
 */
const canAccessRoute = (userRole, route) => {
  const requiredPermission = getRoutePermission(route);
  return hasPermission(userRole, requiredPermission);
};

/**
 * Check if user can access a feature
 */
const canAccessFeature = (userRole, feature) => {
  const requiredPermission = getFeaturePermission(feature);
  return hasPermission(userRole, requiredPermission);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  FEATURE_PERMISSIONS,
  getAllIndividualPermissions,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  getRoutePermission,
  getFeaturePermission,
  canAccessRoute,
  canAccessFeature
};

