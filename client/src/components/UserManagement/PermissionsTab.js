import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../ConfirmModal';
import { PERMISSIONS } from '../../utils/rbac';

const PermissionsTab = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });

  const categories = ['Dashboard', 'Reports', 'Projects', 'Administration', 'Other'];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/permissions');
      if (response.data.success) {
        setPermissions(response.data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Permission name is required');
      return;
    }

    try {
      const response = await apiClient.post('/auth/permissions', formData);
      if (response.data.success) {
        toast.success('Permission created successfully');
        setShowAddModal(false);
        resetForm();
        fetchPermissions();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create permission';
      toast.error(errorMessage);
    }
  };

  const handleEditPermission = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Permission name is required');
      return;
    }

    try {
      const response = await apiClient.put(`/auth/permissions/${editingPermission.id}`, formData);
      if (response.data.success) {
        toast.success('Permission updated successfully');
        setShowEditModal(false);
        setEditingPermission(null);
        resetForm();
        fetchPermissions();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update permission';
      toast.error(errorMessage);
    }
  };

  const handleDeletePermission = async (permissionId) => {
    setDeleteConfirmData({ permissionId });
    setShowDeleteConfirm(true);
  };

  const confirmDeletePermission = async () => {
    if (!deleteConfirmData) return;
    const { permissionId } = deleteConfirmData;
    setShowDeleteConfirm(false);

    try {
      const response = await apiClient.delete(`/auth/permissions/${permissionId}`);
      if (response.data.success) {
        toast.success('Permission deleted successfully');
        fetchPermissions();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete permission';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: ''
    });
  };

  const openEditModal = (permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name || '',
      description: permission.description || '',
      category: permission.category || ''
    });
    setShowEditModal(true);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Permissions</h2>
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
          Add Permission
        </button>
      </div>

      {loading && permissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading permissions...</div>
      ) : permissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No permissions found</div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329', fontWeight: 600 }}>{permission.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#666' }}>{permission.description || '-'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3'
                    }}>
                      {permission.category || 'Other'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(permission)}
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
                        onClick={() => handleDeletePermission(permission.id)}
                        disabled={Object.values(PERMISSIONS).includes(permission.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: Object.values(PERMISSIONS).includes(permission.name) ? '#ccc' : '#ff4d4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: Object.values(PERMISSIONS).includes(permission.name) ? 'not-allowed' : 'pointer',
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

      {/* Add Permission Modal */}
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
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', fontFamily: 'Poppins' }}>Add Permission</h3>
            <form onSubmit={handleAddPermission}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Permission Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., view_custom_feature"
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
                  placeholder="Describe what this permission allows"
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                  Create Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permission Modal */}
      {showEditModal && editingPermission && (
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
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', fontFamily: 'Poppins' }}>Edit Permission</h3>
            <form onSubmit={handleEditPermission}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Permission Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPermission(null);
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
                  Update Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showDeleteConfirm}
        message="Are you sure you want to delete this permission? It will be removed from all roles."
        onConfirm={confirmDeletePermission}
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

export default PermissionsTab;

