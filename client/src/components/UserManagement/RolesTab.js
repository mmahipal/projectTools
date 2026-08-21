import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../ConfirmModal';
import { ROLES, PERMISSIONS } from '../../utils/rbac';

const RolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const allPermissions = Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.ALL);

  // Helper function to check if a role has all permissions (admin role)
  const hasAllPermissions = (role) => {
    if (!role.permissions || role.permissions.length === 0) return false;
    // Check if role has 'all' permission or all individual permissions
    if (role.permissions.includes(PERMISSIONS.ALL)) return true;
    // Check if role has all individual permissions
    return allPermissions.every(perm => role.permissions.includes(perm));
  };

  // Helper function to get enabled permissions for display
  const getEnabledPermissions = (role) => {
    if (!role.permissions || role.permissions.length === 0) return [];
    // If role has 'all', return all individual permissions for display
    if (role.permissions.includes(PERMISSIONS.ALL)) {
      return allPermissions;
    }
    // Otherwise return the actual permissions (excluding 'all' if present)
    return role.permissions.filter(p => p !== PERMISSIONS.ALL);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/roles');
      if (response.data.success) {
        setRoles(response.data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }

    try {
      const response = await apiClient.post('/auth/roles', formData);
      if (response.data.success) {
        toast.success('Role created successfully');
        setShowAddModal(false);
        resetForm();
        fetchRoles();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create role';
      toast.error(errorMessage);
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }

    // For admin role, ensure all permissions are included
    const isAdminRole = editingRole && editingRole.name === ROLES.ADMIN;
    const dataToSend = {
      ...formData,
      permissions: isAdminRole ? allPermissions : formData.permissions
    };

    try {
      const response = await apiClient.put(`/auth/roles/${editingRole.id}`, dataToSend);
      if (response.data.success) {
        toast.success('Role updated successfully');
        setShowEditModal(false);
        setEditingRole(null);
        resetForm();
        fetchRoles();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update role';
      toast.error(errorMessage);
    }
  };

  const handleDeleteRole = async (roleId) => {
    setDeleteConfirmData({ roleId });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = async () => {
    if (!deleteConfirmData) return;
    const { roleId } = deleteConfirmData;
    setShowDeleteConfirm(false);

    try {
      const response = await apiClient.delete(`/auth/roles/${roleId}`);
      if (response.data.success) {
        toast.success('Role deleted successfully');
        fetchRoles();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete role';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    // For admin role or roles with 'all', show all individual permissions as enabled
    let permissionsToShow = role.permissions || [];
    if (permissionsToShow.includes(PERMISSIONS.ALL) || hasAllPermissions(role)) {
      // If role has 'all', show all individual permissions in the UI
      permissionsToShow = allPermissions;
    } else {
      // Filter out 'all' if present, show only individual permissions
      permissionsToShow = permissionsToShow.filter(p => p !== PERMISSIONS.ALL);
    }
    setFormData({
      name: role.name || '',
      description: role.description || '',
      permissions: permissionsToShow
    });
    setShowEditModal(true);
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Roles</h2>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#08979C',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Poppins',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>

      {loading && roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading roles...</div>
      ) : roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No roles found</div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Permissions</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329', fontWeight: 600 }}>{role.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#666' }}>{role.description || '-'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '400px' }}>
                      {(() => {
                        const enabledPerms = getEnabledPermissions(role);
                        if (enabledPerms.length === 0) {
                          return <span style={{ color: '#999', fontStyle: 'italic' }}>No permissions</span>;
                        }
                        // Show first 5 permissions, then "+ X more" if there are more
                        const displayPerms = enabledPerms.slice(0, 5);
                        const remainingCount = enabledPerms.length - 5;
                        return (
                          <>
                            {displayPerms.map(perm => (
                              <span
                                key={perm}
                                style={{
                                  padding: '2px 8px',
                                  backgroundColor: '#e6f7ff',
                                  color: '#08979C',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {perm}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span style={{ color: '#666', fontSize: '11px', fontFamily: 'Poppins' }}>
                                + {remainingCount} more
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(role)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#08979C',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'Poppins',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.name === ROLES.ADMIN}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: role.name === ROLES.ADMIN ? '#ccc' : '#ff4d4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: role.name === ROLES.ADMIN ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontFamily: 'Poppins',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', fontFamily: 'Poppins' }}>Add Role</h3>
            <form onSubmit={handleAddRole}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Role Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., custom_role"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role's purpose"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Permissions</label>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px', 
                  padding: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  {allPermissions.map(permission => (
                    <label key={permission} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '13px', fontFamily: 'Poppins' }}>{permission}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', fontFamily: 'Poppins' }}>
                  {formData.permissions.length} of {allPermissions.length} permissions enabled
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f5f5f5',
                    color: '#002329',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#08979C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    fontWeight: 600
                  }}
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', fontFamily: 'Poppins' }}>Edit Role</h3>
            <form onSubmit={handleEditRole}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Role Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={editingRole && editingRole.name === ROLES.ADMIN}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    backgroundColor: editingRole && editingRole.name === ROLES.ADMIN ? '#f5f5f5' : '#fff',
                    cursor: editingRole && editingRole.name === ROLES.ADMIN ? 'not-allowed' : 'text'
                  }}
                />
                {editingRole && editingRole.name === ROLES.ADMIN && (
                  <span style={{ fontSize: '12px', color: '#666', fontFamily: 'Poppins', fontStyle: 'italic', marginTop: '4px', display: 'block' }}>
                    Admin role name cannot be changed
                  </span>
                )}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Permissions</label>
                  {editingRole && editingRole.name === ROLES.ADMIN && (
                    <span style={{ fontSize: '12px', color: '#08979C', fontFamily: 'Poppins', fontStyle: 'italic' }}>
                      Admin role: All permissions enabled
                    </span>
                  )}
                </div>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px', 
                  padding: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  {allPermissions.map(permission => {
                    const isChecked = formData.permissions.includes(permission);
                    const isAdminRole = editingRole && editingRole.name === ROLES.ADMIN;
                    return (
                      <label key={permission} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '8px',
                        cursor: isAdminRole && isChecked ? 'not-allowed' : 'pointer',
                        opacity: 1
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            // Prevent unchecking permissions for admin role
                            if (isAdminRole && isChecked) {
                              toast.error('Cannot disable permissions for admin role');
                              return;
                            }
                            togglePermission(permission);
                          }}
                          disabled={isAdminRole && isChecked}
                          style={{ marginRight: '8px', cursor: isAdminRole && isChecked ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', fontFamily: 'Poppins', color: isAdminRole && isChecked ? '#08979C' : '#002329', fontWeight: isAdminRole && isChecked ? 600 : 400 }}>
                          {permission}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', fontFamily: 'Poppins' }}>
                  {formData.permissions.length} of {allPermissions.length} permissions enabled
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRole(null);
                    resetForm();
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f5f5f5',
                    color: '#002329',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#08979C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    fontWeight: 600
                  }}
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showDeleteConfirm}
        message="Are you sure you want to delete this role? Users with this role will need to be reassigned."
        onConfirm={confirmDeleteRole}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmData(null);
        }}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default RolesTab;

