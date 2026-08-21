const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { PERMISSIONS, ROLES } = require('../utils/roles');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get permissions file path
const getPermissionsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'permissions.json');
};

// Load permissions from file
const loadPermissions = () => {
  try {
    const permissionsPath = getPermissionsPath();
    if (fs.existsSync(permissionsPath)) {
      const fileContent = fs.readFileSync(permissionsPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading permissions from file:', error);
  }
  // Return default permissions if file doesn't exist
  const defaultPermissions = Object.values(PERMISSIONS).map((perm, index) => ({
    id: index + 1,
    name: perm,
    description: getPermissionDescription(perm),
    category: getPermissionCategory(perm),
    createdAt: new Date().toISOString(),
    isSystem: true
  }));
  return defaultPermissions;
};

// Get permission description
const getPermissionDescription = (permission) => {
  const descriptions = {
    'view_dashboards': 'View dashboards',
    'manage_dashboards': 'Manage dashboards',
    'view_reports': 'View reports',
    'create_reports': 'Create reports',
    'edit_reports': 'Edit reports',
    'delete_reports': 'Delete reports',
    'schedule_reports': 'Schedule reports',
    'view_projects': 'View projects',
    'create_projects': 'Create projects',
    'edit_projects': 'Edit projects',
    'delete_projects': 'Delete projects',
    'view_client_tool_account': 'View client tool account',
    'manage_client_tool_account': 'Manage client tool account',
    'view_queue_status': 'View queue status',
    'manage_queue_status': 'Manage queue status',
    'view_workstreams': 'View workstreams',
    'manage_workstreams': 'Manage workstreams',
    'view_update_fields': 'View update fields',
    'manage_update_fields': 'Manage update fields',
    'view_administration': 'View administration',
    'manage_salesforce_connection': 'Manage Salesforce connection',
    'manage_users': 'Manage users',
    'manage_settings': 'Manage settings',
    'all': 'All permissions'
  };
  return descriptions[permission] || permission;
};

// Get permission category
const getPermissionCategory = (permission) => {
  if (permission.includes('dashboard')) return 'Dashboard';
  if (permission.includes('report')) return 'Reports';
  if (permission.includes('project')) return 'Projects';
  if (permission.includes('administration') || permission.includes('user') || permission.includes('settings') || permission.includes('salesforce')) return 'Administration';
  return 'Other';
};

// Save permissions to file
const savePermissions = (permissions) => {
  try {
    const permissionsPath = getPermissionsPath();
    fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving permissions to file:', error);
    return false;
  }
};

// Get all permissions (admin only)
router.get('/', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const permissions = loadPermissions();
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
}));

// Create permission (admin only)
router.post('/', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Permission name is required' });
    }

    const permissions = loadPermissions();

    // Check if permission already exists
    const existingPermission = permissions.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
    if (existingPermission) {
      return res.status(400).json({ error: 'Permission with this name already exists' });
    }

    // Create new permission
    const newPermission = {
      id: permissions.length > 0 ? Math.max(...permissions.map(p => p.id)) + 1 : 1,
      name: name.toLowerCase().trim(),
      description: description || '',
      category: category || 'Other',
      createdAt: new Date().toISOString(),
      isSystem: false
    };

    permissions.push(newPermission);
    savePermissions(permissions);

    console.log('Permission created by admin:', newPermission.name);
    res.status(201).json({
      success: true,
      permission: newPermission
    });
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create permission'
    });
  }
}));

// Update permission (admin only)
router.put('/:id', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const permissionId = parseInt(req.params.id);
    const { name, description, category } = req.body;

    const permissions = loadPermissions();

    const permissionIndex = permissions.findIndex(p => p.id === permissionId);
    if (permissionIndex === -1) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    const permission = permissions[permissionIndex];

    // Prevent modifying system permissions
    if (permission.isSystem) {
      return res.status(400).json({ error: 'Cannot modify system permission' });
    }

    // Update permission fields
    if (name && name !== permission.name) {
      // Check if new name already exists
      const existingPermission = permissions.find(p => p.name.toLowerCase() === name.toLowerCase().trim() && p.id !== permissionId);
      if (existingPermission) {
        return res.status(400).json({ error: 'Permission with this name already exists' });
      }
      permission.name = name.toLowerCase().trim();
    }

    if (description !== undefined) permission.description = description;
    if (category !== undefined) permission.category = category;

    permission.updatedAt = new Date().toISOString();

    savePermissions(permissions);

    console.log('Permission updated by admin:', permission.name);
    res.json({
      success: true,
      permission
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permission'
    });
  }
}));

// Delete permission (admin only)
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    const permissionId = parseInt(req.params.id);

    const permissions = loadPermissions();

    const permissionIndex = permissions.findIndex(p => p.id === permissionId);
    if (permissionIndex === -1) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    const permission = permissions[permissionIndex];

    // Prevent deleting system permissions
    if (permission.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system permission' });
    }

    permissions.splice(permissionIndex, 1);
    savePermissions(permissions);

    console.log('Permission deleted by admin:', permission.name);
    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete permission'
    });
  }
}));

module.exports = router;

