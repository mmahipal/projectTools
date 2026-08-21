import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/api';
import { useGPCFilter } from '../../context/GPCFilterContext';
import SearchableMultiSelect from './SearchableMultiSelect';
import './UserPreferencesPanel.css';

const ENABLE_GPC_FILTER = process.env.REACT_APP_ENABLE_GPC_FILTER === 'true' || false;

const UserPreferencesPanel = () => {
  const { preferences, loading: contextLoading, initialized, refreshPreferences } = useGPCFilter();
  const [saving, setSaving] = useState(false);
  const [gpcFilterEnabled, setGpcFilterEnabled] = useState(preferences?.gpcFilterEnabled !== undefined ? preferences.gpcFilterEnabled : true);
  const [interestedAccounts, setInterestedAccounts] = useState(preferences?.interestedAccounts || []);
  const [interestedProjects, setInterestedProjects] = useState(preferences?.interestedProjects || []);

  // Sync with context preferences when they change
  useEffect(() => {
    if (initialized && preferences) {
      setGpcFilterEnabled(preferences.gpcFilterEnabled !== undefined ? preferences.gpcFilterEnabled : true);
      setInterestedAccounts(preferences.interestedAccounts || []);
      setInterestedProjects(preferences.interestedProjects || []);
    }
  }, [preferences, initialized]);

  const searchAccounts = async (searchTerm) => {
    try {
      const response = await apiClient.get(`/user/preferences/accounts/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data || [];
    } catch (error) {
      console.error('Error searching accounts:', error);
      toast.error('Failed to search accounts');
      return [];
    }
  };

  const searchProjects = async (searchTerm) => {
    try {
      const response = await apiClient.get(`/user/preferences/projects/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data || [];
    } catch (error) {
      console.error('Error searching projects:', error);
      toast.error('Failed to search projects');
      return [];
    }
  };

  const handleSave = async () => {
    if (!ENABLE_GPC_FILTER) {
      toast.error('GPC-Filter feature is disabled');
      return;
    }

    setSaving(true);
    try {
      // Send full objects with id and name to backend
      const accountsToSave = interestedAccounts.map(item => {
        if (typeof item === 'object' && item !== null && item.id && item.name) {
          return { id: item.id, name: item.name };
        }
        // Fallback: if it's a string, treat as ID and use it as name too
        return typeof item === 'string' ? { id: item, name: item } : item;
      });
      
      const projectsToSave = interestedProjects.map(item => {
        if (typeof item === 'object' && item !== null && item.id && item.name) {
          return { id: item.id, name: item.name };
        }
        // Fallback: if it's a string, treat as ID and use it as name too
        return typeof item === 'string' ? { id: item, name: item } : item;
      });
      
      await apiClient.post('/user/preferences', {
        gpcFilterEnabled: gpcFilterEnabled,
        interestedAccounts: accountsToSave,
        interestedProjects: projectsToSave
      });
      toast.success('Preferences saved successfully');
      // Refresh the global context
      refreshPreferences();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!ENABLE_GPC_FILTER) {
    return (
      <div className="user-preferences-panel">
        <div className="preferences-disabled-message">
          GPC-Filter feature is currently disabled.
        </div>
      </div>
    );
  }

  if (contextLoading || !initialized) {
    return (
      <div className="user-preferences-panel">
        <div className="preferences-loading">
          <Loader size={20} className="spinning" />
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-preferences-panel">
      <div className="preferences-header">
        <h3>My Interested Items</h3>
        <p className="preferences-description">
          Select the Accounts and Projects you're interested in. By default, dashboards and reports will show only data related to these items.
        </p>
      </div>

      <div className="preferences-content">
        {/* GPC Filter Enable/Disable Toggle */}
        <div className="preferences-toggle-group">
          <label className="preferences-toggle-label">
            <span className="toggle-label-text">
              <strong>Enable GPC Filtering</strong>
              <span className="toggle-description">
                When enabled, dashboards and reports will automatically filter to show only data related to your interested accounts and projects.
              </span>
            </span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={gpcFilterEnabled}
                onChange={(e) => setGpcFilterEnabled(e.target.checked)}
                className="toggle-input"
                id="gpc-filter-toggle"
              />
              <label htmlFor="gpc-filter-toggle" className="toggle-slider"></label>
            </div>
          </label>
        </div>

        {gpcFilterEnabled && (
          <>
        <SearchableMultiSelect
          label="Interested Accounts"
          placeholder="Search and select accounts..."
          selectedItems={interestedAccounts}
          onSelectionChange={setInterestedAccounts}
          onSearch={searchAccounts}
          itemLabelKey="name"
          itemValueKey="id"
        />

        <SearchableMultiSelect
          label="Interested Projects"
          placeholder="Search and select projects..."
          selectedItems={interestedProjects}
          onSelectionChange={setInterestedProjects}
          onSearch={searchProjects}
          itemLabelKey="name"
          itemValueKey="id"
        />
          </>
        )}
      </div>

      <div className="preferences-actions">
        <button
          className="btn-save-preferences"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader size={16} className="spinning" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserPreferencesPanel;

