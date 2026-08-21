import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Save, User, Shield, Bell, Menu, Download, FileText, Filter } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import toast from 'react-hot-toast';
import { saveUserSettings, loadUserSettings } from '../utils/draftStorage';
import apiClient from '../config/api';
import UserPreferencesPanel from '../components/UserPreferences/UserPreferencesPanel';
import '../styles/Settings.css';

const Settings = ({ asTab = false }) => {
  const { user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    theme: 'light'
  });

  useEffect(() => {
    // Load user settings from server storage
    const loadSettings = async () => {
      try {
        const savedSettings = await loadUserSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await saveUserSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    }
  };
  
  // Export template function
  const exportTemplate = async (pageType) => {
    try {
      const response = await apiClient.get(`/projects/template/${pageType}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${pageType}-template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Template exported successfully: ${pageType}-template.csv`);
    } catch (error) {
      console.error('Error exporting template:', error);
      toast.error('Error exporting template. Please try again.');
    }
  };

  if (asTab) {
    // Render as tab component (no sidebar/header)
    return (
      <div className="settings-content" style={{ padding: '24px' }}>
          <div className="settings-section">
            <div className="section-header">
              <User size={24} />
              <h2>Profile Settings</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={user?.email || ''} disabled />
                <p className="field-description">Your email address cannot be changed</p>
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" value={user?.role || ''} disabled />
                <p className="field-description">Your role is assigned by the administrator</p>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <Bell size={24} />
              <h2>Notification Settings</h2>
            </div>
            <div className="settings-form">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  />
                  Enable notifications
                </label>
                <p className="field-description">Receive notifications for project updates</p>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
                  />
                  Email updates
                </label>
                <p className="field-description">Receive email notifications for important updates</p>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <Shield size={24} />
              <h2>Security Settings</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-list">
                  {user?.permissions?.map((permission, index) => (
                    <span key={index} className="permission-badge">
                      {permission}
                    </span>
                  ))}
                </div>
                <p className="field-description">Your current permissions</p>
              </div>
            </div>
          </div>

          {/* User Preferences Section (GPC-Filter) */}
          <div className="settings-section">
            <div className="section-header">
              <Filter size={24} />
              <h2>Content Filtering Preferences</h2>
            </div>
            <div className="settings-form">
              <UserPreferencesPanel />
            </div>
          </div>
          
          {/* Template Export Section */}
          <div className="settings-section">
            <div className="section-header">
              <FileText size={24} />
              <h2>Template Export</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <p className="field-description">
                  Export template documents with essential fields for bulk data entry.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => exportTemplate('quick-setup')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Quick Setup
                  </button>
                  <button
                    onClick={() => exportTemplate('project-setup')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Project Setup
                  </button>
                  <button
                    onClick={() => exportTemplate('project-objective')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Project Objective
                  </button>
                  <button
                    onClick={() => exportTemplate('qualification-step')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Qualification Step
                  </button>
                  <button
                    onClick={() => exportTemplate('project-page')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Project Page
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button onClick={handleSave} className="btn-primary">
              <Save size={20} />
              Save Settings
            </button>
          </div>
      </div>
    );
  }

  // Original standalone layout
  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="settings" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease' }}>
        <div className="settings-container">
          <div className="settings-header">
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
                  <h1 className="page-title">Settings</h1>
                  <p className="page-subtitle">Manage your application settings and preferences</p>
                </div>
              </div>
              <div className="header-user-profile">
                <UserProfileDropdown />
              </div>
            </div>
          </div>

        <div className="settings-content">
          <div className="settings-section">
            <div className="section-header">
              <User size={24} />
              <h2>Profile Settings</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={user?.email || ''} disabled />
                <p className="field-description">Your email address cannot be changed</p>
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" value={user?.role || ''} disabled />
                <p className="field-description">Your role is assigned by the administrator</p>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <Bell size={24} />
              <h2>Notification Settings</h2>
            </div>
            <div className="settings-form">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  />
                  Enable notifications
                </label>
                <p className="field-description">Receive notifications for project updates</p>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
                  />
                  Email updates
                </label>
                <p className="field-description">Receive email notifications for important updates</p>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <Shield size={24} />
              <h2>Security Settings</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-list">
                  {user?.permissions?.map((permission, index) => (
                    <span key={index} className="permission-badge">
                      {permission}
                    </span>
                  ))}
                </div>
                <p className="field-description">Your current permissions</p>
              </div>
            </div>
          </div>
          
          {/* Template Export Section */}
          <div className="settings-section">
            <div className="section-header">
              <FileText size={24} />
              <h2>Template Export</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <p className="field-description">
                  Export template documents with essential fields for bulk data entry.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => exportTemplate('quick-setup')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Quick Setup
                  </button>
                  <button
                    onClick={() => exportTemplate('project-setup')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Project Setup
                  </button>
                  <button
                    onClick={() => exportTemplate('project-objective')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Project Objective
                  </button>
                  <button
                    onClick={() => exportTemplate('qualification-step')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Qualification Step
                  </button>
                  <button
                    onClick={() => exportTemplate('project-page')}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Download size={16} />
                    Project Page
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button onClick={handleSave} className="btn-primary">
              <Save size={20} />
              Save Settings
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

