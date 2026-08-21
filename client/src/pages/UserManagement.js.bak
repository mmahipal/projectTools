import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit, Trash2, LogOut, Menu, Shield, Key } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import UsersTab from '../components/UserManagement/UsersTab';
import RolesTab from '../components/UserManagement/RolesTab';
import PermissionsTab from '../components/UserManagement/PermissionsTab';
import '../styles/ProjectSetup.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const UserManagement = ({ asTab = false }) => {
  const { user, hasPermission, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reports_viewer',
    permissions: [],
    isActive: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);

  const roles = [
    { value: 'admin', label: 'Admin', permissions: ['all'] },
    { value: 'reports_viewer', label: 'Reports Viewer', permissions: ['view_dashboards', 'view_reports'] },
    { value: 'reports_manager', label: 'Reports Manager', permissions: ['view_dashboards', 'manage_dashboards', 'view_reports', 'create_reports', 'edit_reports', 'delete_reports', 'schedule_reports'] },
    { value: 'salesforce_manager', label: 'Salesforce Manager', permissions: ['all'] }
  ];

  useEffect(() => {
    if (hasPermission('all')) {
      fetchUsers();
    } else {
      toast.error('You do not have permission to access this page');
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/users');
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

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

  const handleRoleChange = (roleValue) => {
    const selectedRole = roles.find(r => r.value === roleValue);
    setFormData({
      ...formData,
      role: roleValue,
      permissions: selectedRole ? selectedRole.permissions : []
    });
  };

  if (!hasPermission('all')) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'reports_viewer',
      permissions: user.permissions || [],
      isActive: user.isActive !== false
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.delete(`/auth/users/${userId}`);
      if (response.data.success) {
        toast.success('User deactivated successfully');
        fetchUsers();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to deactivate user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.put(`/auth/users/${editingUser.id}`, formData);
      if (response.data.success) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (asTab) {
    // Render as tab component (no sidebar/header) with sub-tabs
    return (
      <div>
        {/* Sub-tabs */}
        <div style={{ 
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          padding: '0 24px',
          display: 'flex',
          gap: '0'
        }}>
          <button
            onClick={() => setActiveSubTab('users')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSubTab === 'users' ? 600 : 400,
              color: activeSubTab === 'users' ? '#08979C' : '#666',
              borderBottom: activeSubTab === 'users' ? '2px solid #08979C' : '2px solid transparent',
              marginRight: '24px',
              fontFamily: 'Poppins',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={16} />
            Users
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSubTab === 'roles' ? 600 : 400,
              color: activeSubTab === 'roles' ? '#08979C' : '#666',
              borderBottom: activeSubTab === 'roles' ? '2px solid #08979C' : '2px solid transparent',
              marginRight: '24px',
              fontFamily: 'Poppins',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} />
            Roles
          </button>
          <button
            onClick={() => setActiveSubTab('permissions')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSubTab === 'permissions' ? 600 : 400,
              color: activeSubTab === 'permissions' ? '#08979C' : '#666',
              borderBottom: activeSubTab === 'permissions' ? '2px solid #08979C' : '2px solid transparent',
              fontFamily: 'Poppins',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Key size={16} />
            Permissions
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeSubTab === 'users' && (
            <UsersTab
              users={users}
              loading={loading}
              onRefresh={fetchUsers}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          )}
          {activeSubTab === 'roles' && <RolesTab />}
          {activeSubTab === 'permissions' && <PermissionsTab />}
        </div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
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
              padding: '32px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Edit User</h2>
              <form onSubmit={handleUpdateUser}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'Poppins'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'Poppins'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'Poppins'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
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
                      padding: '10px 20px',
                      backgroundColor: '#f5f5f5',
                      color: '#002329',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Poppins',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#08979C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Poppins',
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showEditModal && editingUser && (
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
              padding: '32px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Edit User</h2>
              <form onSubmit={handleUpdateUser}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'Poppins'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'Poppins'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'Poppins'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e0e0e0',
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
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f5f5f5',
                      color: '#002329',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Poppins',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#08979C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Poppins',
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original standalone layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        marginLeft: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.3s ease, width 0.3s ease',
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <div className="page-header" style={{
          backgroundColor: '#fff',
          padding: '8px 24px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="header-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              style={{
                marginRight: '12px',
                padding: '4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                width: '32px',
                height: '32px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <Menu size={20} style={{ color: '#002329' }} />
            </button>
            <div>
              <h1 className="page-title" style={{ fontSize: '20px', marginBottom: '2px', lineHeight: '1.2' }}>User Management</h1>
              <p className="page-subtitle" style={{ fontSize: '13px', lineHeight: '1.3' }}>Manage users and their permissions</p>
            </div>
          </div>
          <div className="header-user-profile">
            <div className="user-profile">
              <div className="user-avatar">
                {(user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user?.email || 'User'}</span>
              <button className="logout-btn" onClick={logout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="page-content" style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
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
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
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
                          backgroundColor: u.role === 'admin' ? '#08979C' : u.role === 'project_manager' ? '#52c41a' : '#1890ff',
                          color: '#fff'
                        }}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'project_manager' ? 'Project Manager' : 'User'}
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
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(u)}
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
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user?.id}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: u.id === user?.id ? '#ccc' : '#ff4d4f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
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
        </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
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
            padding: '32px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Poppins'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
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
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f5f5f5',
                    color: '#002329',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#08979C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Poppins',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserManagement;

