import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, Shield } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
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
  
  // Settings tab is now available to all users
  const canViewSettings = true; // All users can access Settings
  
  // Set default active tab based on available permissions
  const getDefaultTab = () => {
    // Check URL params for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      // Validate tab and permissions
      if (tabParam === 'settings' && canViewSettings) {
        return 'settings';
      }
      if (tabParam === 'history' && userRole === ROLES.ADMIN) {
        return 'history';
      }
      if (tabParam === 'salesforce-settings' && canManageSalesforce) {
        return 'salesforce-settings';
      }
      if (tabParam === 'user-management' && canManageUsers) {
        return 'user-management';
      }
      if (tabParam === 'audit-logs' && userRole === ROLES.ADMIN) {
        return 'audit-logs';
      }
    }
    // Default tab based on permissions
    if (canManageSalesforce) return 'salesforce-settings';
    if (canManageUsers) return 'user-management';
    if (canViewSettings) return 'settings';
    return 'salesforce-settings';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Handle tab changes from URL (only on mount or when URL changes externally)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        // Validate tab and permissions
        if (tabParam === 'settings' && canViewSettings) {
          setActiveTab('settings');
        } else if (tabParam === 'history' && userRole === ROLES.ADMIN) {
          setActiveTab('history');
        } else if (tabParam === 'salesforce-settings' && canManageSalesforce) {
          setActiveTab('salesforce-settings');
        } else if (tabParam === 'user-management' && canManageUsers) {
          setActiveTab('user-management');
        } else if (tabParam === 'audit-logs' && userRole === ROLES.ADMIN) {
          setActiveTab('audit-logs');
        }
      }
    };
    
    // Check URL on mount
    handleUrlChange();
    
    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [canViewSettings, userRole, canManageSalesforce, canManageUsers]);

  // Update active tab if current tab becomes unavailable
  useEffect(() => {
    if (activeTab === 'user-management' && !canManageUsers) {
      setActiveTab(getDefaultTab());
    }
    // Settings is always available, so no need to check
    if (activeTab === 'salesforce-settings' && !canManageSalesforce) {
      setActiveTab(getDefaultTab());
    }
  }, [activeTab, canManageUsers, canManageSalesforce]);

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
        padding: '24px',
        backgroundColor: '#fff',
        minHeight: '100vh'
      }}>
        <div className="administration-header">
          <div className="header-content">
            <div className="header-left">
              <button 
                className="header-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="page-title">Administration</h1>
                <p className="page-subtitle">Manage users, settings, and audit logs</p>
              </div>
            </div>
            <div className="header-user-profile">
              <UserProfileDropdown />
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
              onClick={() => {
                setActiveTab('salesforce-settings');
                // Update URL without page reload
                const url = new URL(window.location);
                url.searchParams.set('tab', 'salesforce-settings');
                window.history.pushState({}, '', url);
              }}
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
              onClick={() => {
                setActiveTab('user-management');
                // Update URL without page reload
                const url = new URL(window.location);
                url.searchParams.set('tab', 'user-management');
                window.history.pushState({}, '', url);
              }}
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
          {canViewSettings && (
            <button
              onClick={() => {
                setActiveTab('settings');
                // Update URL without page reload
                const url = new URL(window.location);
                url.searchParams.set('tab', 'settings');
                window.history.pushState({}, '', url);
              }}
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
                onClick={() => {
                  setActiveTab('audit-logs');
                  // Update URL without page reload
                  const url = new URL(window.location);
                  url.searchParams.set('tab', 'audit-logs');
                  window.history.pushState({}, '', url);
                }}
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
                onClick={() => {
                  setActiveTab('history');
                  // Update URL without page reload
                  const url = new URL(window.location);
                  url.searchParams.set('tab', 'history');
                  window.history.pushState({}, '', url);
                }}
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
          {activeTab === 'settings' && canViewSettings && <Settings asTab={true} />}
          {activeTab === 'audit-logs' && userRole === ROLES.ADMIN && <AuditLogs />}
          {activeTab === 'history' && userRole === ROLES.ADMIN && <History />}
        </div>
      </div>
    </div>
  );
};

export default Administration;

