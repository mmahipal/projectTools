const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { ROLES, PERMISSIONS, getAllIndividualPermissions } = require('../utils/roles');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get roles file path - uses persistent location outside codebase to survive code merges
const getRolesPath = () => {
  // Use process.env.DATA_DIR if set (for Docker/containerized deployments)
  // Otherwise use a persistent location relative to the project root
  const baseDir = process.env.DATA_DIR || path.join(__dirname, '../../../.runtime-data');
  const dataDir = path.join(baseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const newPath = path.join(dataDir, 'roles.json');
  const oldPath = path.join(__dirname, '../data/roles.json');
  
  // Migrate from old location if needed
  if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
    try {
      fs.copyFileSync(oldPath, newPath);
      console.log(`Migrated roles.json from ${oldPath} to ${newPath}`);
    } catch (error) {
      console.error(`Error migrating roles.json:`, error);
    }
  }
  
  return newPath;
};

// Load roles from store
const loadRoles = () => {
  const { roleActions } = require('../store/actions');
  let roles = roleActions.getRoles();
  let rolesChanged = false;
  
  // CRITICAL: Ensure admin role always has all individual permissions
  const allAdminPermissions = getAllIndividualPermissions();
  roles = roles.map(role => {
    const isAdminRole = role.name === ROLES.ADMIN || 
                        role.name?.toLowerCase() === 'admin' ||
                        role.name === 'Admin' ||
                        role.name === 'ADMIN';
    if (isAdminRole) {
      // Check if admin role has all individual permissions
      const hasAllPermissions = allAdminPermissions.every(perm => role.permissions?.includes(perm));
      if (!hasAllPermissions || !role.permissions || role.permissions.length < allAdminPermissions.length) {
        console.log(`[LoadRoles] Fixing admin role permissions - ensuring all individual permissions`);
        // Include 'all' for backward compatibility
        role.permissions = [...allAdminPermissions, PERMISSIONS.ALL];
        rolesChanged = true;
      }
    }
    return role;
  });
  
  // Update in store if changed
  if (rolesChanged) {
    roleActions.updateRoles(roles);
  }
  
  // Return default roles if none exist
  if (roles.length === 0) {
    // Get all individual permissions for admin role
    const allAdminPermissions = getAllIndividualPermissions();
    const defaultRoles = [
      {
        id: 1,
        name: ROLES.ADMIN,
        description: 'Super user with full access to all features',
        permissions: [...allAdminPermissions, PERMISSIONS.ALL], // All individual permissions explicitly listed + 'all' for backward compatibility
        createdAt: new Date().toISOString(),
        isSystem: true
      },
      {
        id: 2,
        name: ROLES.REPORTS_VIEWER,
      description: 'Read-only access to dashboards and reports',
      permissions: ['view_dashboards', 'view_reports'],
      createdAt: new Date().toISOString(),
      isSystem: true
    },
    {
      id: 3,
      name: ROLES.REPORTS_MANAGER,
      description: 'Full access to dashboards and reports, but no user management',
      permissions: ['view_dashboards', 'manage_dashboards', 'view_reports', 'create_reports', 'edit_reports', 'delete_reports', 'schedule_reports'],
      createdAt: new Date().toISOString(),
      isSystem: true
    },
    {
      id: 4,
      name: ROLES.SALESFORCE_MANAGER,
      description: 'Access to all features except full administration',
      permissions: ['view_dashboards', 'manage_dashboards', 'view_reports', 'create_reports', 'edit_reports', 'delete_reports', 'schedule_reports', 'view_projects', 'create_projects', 'edit_projects', 'delete_projects', 'view_client_tool_account', 'manage_client_tool_account', 'view_queue_status', 'manage_queue_status', 'view_workstreams', 'manage_workstreams', 'view_update_fields', 'manage_update_fields', 'view_administration', 'manage_salesforce_connection'],
      createdAt: new Date().toISOString(),
      isSystem: true
    }
  ];
    roleActions.loadRoles(defaultRoles);
    return defaultRoles;
  }
  return roles;
};

// Save roles to store
const saveRoles = (roles) => {
  const { roleActions } = require('../store/actions');
  roleActions.updateRoles(roles);
  return true;
};

// Get all roles (admin only)
router.get('/', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const roles = loadRoles();
    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles'
    });
  }
}));

// Create role (admin only)
router.post('/', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const roles = loadRoles();

    // Check if role already exists
    const existingRole = roles.find(r => r.name.toLowerCase() === name.toLowerCase().trim());
    if (existingRole) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }

    // Create new role
    const newRole = {
      id: roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1,
      name: name.toLowerCase().trim(),
      description: description || '',
      permissions: permissions || [],
      createdAt: new Date().toISOString(),
      isSystem: false
    };

    roles.push(newRole);
    saveRoles(roles);

    console.log('Role created by admin:', newRole.name);
    res.status(201).json({
      success: true,
      role: newRole
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create role'
    });
  }
}));

// Update role (admin only)
router.put('/:id', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, description, permissions } = req.body;

    const roles = loadRoles();

    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const role = roles[roleIndex];

    // CRITICAL: Admin role always has 'all' permissions - enforce this
    const isAdminRole = role.name === ROLES.ADMIN || 
                        role.name?.toLowerCase() === 'admin' ||
                        role.name === 'Admin' ||
                        role.name === 'ADMIN';
    
    if (isAdminRole) {
      // Admin role must always have all individual permissions - override any provided permissions
      const allAdminPermissions = getAllIndividualPermissions();
      // Include 'all' for backward compatibility
      role.permissions = [...allAdminPermissions, PERMISSIONS.ALL];
      console.log(`[Role Update] Admin role detected - enforcing all individual permissions for role ID ${roleId}`);
    }

    // Prevent modifying system roles (but allow updating description)
    if (role.isSystem && isAdminRole) {
      // Only allow updating description for admin role, not name or permissions
      if (name && name.toLowerCase().trim() !== role.name.toLowerCase()) {
        return res.status(400).json({ error: 'Cannot modify admin role name' });
      }
      // Permissions are already enforced above, so we can continue
    }

    // Update role fields
    if (name && name !== role.name && !isAdminRole) {
      // Check if new name already exists
      const existingRole = roles.find(r => r.name.toLowerCase() === name.toLowerCase().trim() && r.id !== roleId);
      if (existingRole) {
        return res.status(400).json({ error: 'Role with this name already exists' });
      }
      role.name = name.toLowerCase().trim();
    }

    if (description !== undefined) role.description = description;
    // Permissions are handled above for admin role, or here for other roles
    if (permissions !== undefined && !isAdminRole) {
      role.permissions = permissions;
    }

    role.updatedAt = new Date().toISOString();

    saveRoles(roles);

    console.log('Role updated by admin:', role.name);
    res.json({
      success: true,
      role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role'
    });
  }
}));

// Delete role (admin only)
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);

    const roles = loadRoles();

    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const role = roles[roleIndex];

    // Prevent deleting system roles
    if (role.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system role' });
    }

    roles.splice(roleIndex, 1);
    saveRoles(roles);

    console.log('Role deleted by admin:', role.name);
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role'
    });
  }
}));

module.exports = router;

