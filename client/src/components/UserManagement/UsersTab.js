import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const UsersTab = ({ users, userSettings = {}, loading, onRefresh, onEdit, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reports_viewer',
    permissions: [],
    isActive: true
  });

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'reports_viewer', label: 'Reports Viewer' },
    { value: 'reports_manager', label: 'Reports Manager' },
    { value: 'salesforce_manager', label: 'Salesforce Manager' }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'reports_viewer',
      permissions: [],
      isActive: true
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      const response = await apiClient.post('/auth/users', formData);
      if (response.data.success) {
        toast.success('User created successfully');
        setShowAddModal(false);
        resetForm();
        onRefresh();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Users</h2>
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
          Add User
        </button>
      </div>

      {loading && users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No users found</div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Settings</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>{u.name || u.email}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>{u.email}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: u.role === 'admin' ? '#08979C' : u.role === 'reports_manager' ? '#52c41a' : u.role === 'salesforce_manager' ? '#1890ff' : '#ff9800',
                      color: '#fff'
                    }}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'reports_manager' ? 'Reports Manager' : u.role === 'salesforce_manager' ? 'Salesforce Manager' : 'Reports Viewer'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: u.isActive ? '#52c41a' : '#ff4d4f',
                      color: '#fff'
                    }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                    {(() => {
                      const settings = userSettings[u.id];
                      if (!settings) return <span style={{ color: '#999' }}>No settings</span>;
                      const hasSalesforce = settings.salesforceSettings?.salesforceUrl;
                      const hasPreferences = settings.preferences;
                      const settingsList = [];
                      if (hasSalesforce) settingsList.push('Salesforce');
                      if (hasPreferences) settingsList.push('Preferences');
                      return settingsList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {settingsList.map((s, idx) => (
                            <span key={idx} style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              backgroundColor: '#e6f7ff',
                              color: '#08979C',
                              display: 'inline-block',
                              marginRight: '4px'
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : <span style={{ color: '#999' }}>No settings</span>;
                    })()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onEdit(u)}
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
                        onClick={() => onDelete(u.id)}
                        disabled={u.id === currentUser?.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: u.id === currentUser?.id ? '#ccc' : '#ff4d4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
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

      {/* Add User Modal */}
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', fontFamily: 'Poppins' }}>Add User</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Name</label>
                <input
                  type="text"
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, fontFamily: 'Poppins' }}>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;

