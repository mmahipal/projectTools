import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, LogOut, Shield } from 'lucide-react';
import { ROLES, PERMISSIONS, hasPermission } from '../utils/rbac';
import UserManagement from './UserManagement';
import Settings from './Settings';
import AuditLogs from './AuditLogs';
import History from './History/History';
import SalesforceSettings from './SalesforceSettings';
import '../styles/Administration.css';
import '../styles/AuditLogs.css';

const Administration = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  
  // Determine available tabs based on user role
  const userRole = user?.role;
  const canManageUsers = hasPermission(userRole, PERMISSIONS.MANAGE_USERS);
  const canManageSettings = hasPermission(userRole, PERMISSIONS.MANAGE_SETTINGS);
  const canManageSalesforce = hasPermission(userRole, PERMISSIONS.MANAGE_SALESFORCE_CONNECTION);
  const canViewAdministration = hasPermission(userRole, PERMISSIONS.VIEW_ADMINISTRATION);
  
  // Set default active tab based on available permissions
  const getDefaultTab = () => {
    if (canManageSalesforce) return 'salesforce-settings';
    if (canManageUsers) return 'user-management';
    if (canManageSettings) return 'settings';
    return 'salesforce-settings';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  // Update active tab if current tab becomes unavailable
  useEffect(() => {
    if (activeTab === 'user-management' && !canManageUsers) {
      setActiveTab(getDefaultTab());
    }
    if (activeTab === 'settings' && !canManageSettings) {
      setActiveTab(getDefaultTab());
    }
    if (activeTab === 'salesforce-settings' && !canManageSalesforce) {
      setActiveTab(getDefaultTab());
    }
  }, [activeTab, canManageUsers, canManageSettings, canManageSalesforce]);

  // Check if user has access to Administration page
  if (!canViewAdministration) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        marginLeft: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.3s ease, width 0.3s ease',
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
              <h1 className="page-title" style={{ fontSize: '20px', marginBottom: '2px', lineHeight: '1.2' }}>Administration</h1>
              <p className="page-subtitle" style={{ fontSize: '13px', lineHeight: '1.3' }}>Manage users, settings, and audit logs</p>
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

        {/* Tabs */}
        <div style={{ 
          marginBottom: '24px', 
          borderBottom: '2px solid var(--border-color)',
          display: 'flex',
          gap: '0'
        }}>
          {canManageSalesforce && (
            <button
              onClick={() => setActiveTab('salesforce-settings')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'salesforce-settings' ? '2px solid #0176d3' : '2px solid transparent',
                color: activeTab === 'salesforce-settings' ? '#0176d3' : '#666',
                fontWeight: activeTab === 'salesforce-settings' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '-2px'
              }}
            >
              Salesforce Settings
            </button>
          )}
          {canManageUsers && (
            <button
              onClick={() => setActiveTab('user-management')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'user-management' ? '2px solid #0176d3' : '2px solid transparent',
                color: activeTab === 'user-management' ? '#0176d3' : '#666',
                fontWeight: activeTab === 'user-management' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '-2px'
              }}
            >
              User Management
            </button>
          )}
          {canManageSettings && (
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'settings' ? '2px solid #0176d3' : '2px solid transparent',
                color: activeTab === 'settings' ? '#0176d3' : '#666',
                fontWeight: activeTab === 'settings' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '-2px'
              }}
            >
              Settings
            </button>
          )}
          {userRole === ROLES.ADMIN && (
            <>
              <button
                onClick={() => setActiveTab('audit-logs')}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'audit-logs' ? '2px solid #0176d3' : '2px solid transparent',
                  color: activeTab === 'audit-logs' ? '#0176d3' : '#666',
                  fontWeight: activeTab === 'audit-logs' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '-2px'
                }}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'history' ? '2px solid #0176d3' : '2px solid transparent',
                  color: activeTab === 'history' ? '#0176d3' : '#666',
                  fontWeight: activeTab === 'history' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '-2px'
                }}
              >
                History
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="administration-content" style={{
          backgroundColor: '#fff',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          minHeight: 'calc(100vh - 200px)'
        }}>
          {activeTab === 'salesforce-settings' && canManageSalesforce && <SalesforceSettings asTab={true} />}
          {activeTab === 'user-management' && canManageUsers && <UserManagement asTab={true} />}
          {activeTab === 'settings' && canManageSettings && <Settings asTab={true} />}
          {activeTab === 'audit-logs' && userRole === ROLES.ADMIN && <AuditLogs />}
          {activeTab === 'history' && userRole === ROLES.ADMIN && <History />}
        </div>
      </div>
    </div>
  );
};

export default Administration;

