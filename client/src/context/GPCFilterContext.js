import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../config/api';
import { ENABLE_GPC_FILTER } from '../config/featureFlags';
import { useAuth } from './AuthContext';

const GPCFilterContext = createContext();

export const useGPCFilter = () => {
  const context = useContext(GPCFilterContext);
  if (!context) {
    throw new Error('useGPCFilter must be used within a GPCFilterProvider');
  }
  return context;
};

export const GPCFilterProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    gpcFilterEnabled: true, // Default to enabled
    interestedAccounts: [],
    interestedProjects: []
  });
  const [override, setOverride] = useState(() => {
    // Session-based override (sessionStorage, not localStorage)
    try {
      return sessionStorage.getItem('gpcFilterOverride') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load preferences on mount, but only if user is authenticated
  const loadPreferences = useCallback(async () => {
    if (!ENABLE_GPC_FILTER) {
      setInitialized(true);
      return;
    }

    // Don't load preferences if user is not authenticated
    if (!user) {
      setInitialized(true);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get('/user/preferences');
      // Backend should return objects with { id, name }, but handle legacy data
      const accounts = (response.data.interestedAccounts || []).map(item => {
        if (typeof item === 'object' && item !== null && item.id && item.name) {
          return item; // Already in correct format
        }
        // Legacy: if it's just an ID string, create object with ID as name
        return typeof item === 'string' ? { id: item, name: item } : item;
      });
      
      const projects = (response.data.interestedProjects || []).map(item => {
        if (typeof item === 'object' && item !== null && item.id && item.name) {
          return item; // Already in correct format
        }
        // Legacy: if it's just an ID string, create object with ID as name
        return typeof item === 'string' ? { id: item, name: item } : item;
      });
      
      setPreferences({
        gpcFilterEnabled: response.data.gpcFilterEnabled !== undefined ? response.data.gpcFilterEnabled : true, // Default to enabled
        interestedAccounts: accounts,
        interestedProjects: projects
      });
    } catch (error) {
      // Silently handle all errors - user might not have preferences yet or might not be authenticated
      // Don't log or show errors - just use defaults
      setPreferences({
        gpcFilterEnabled: true, // Default to enabled
        interestedAccounts: [],
        interestedProjects: []
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update override state and sessionStorage
  const updateOverride = useCallback((value) => {
    setOverride(value);
    try {
      if (value) {
        sessionStorage.setItem('gpcFilterOverride', 'true');
      } else {
        sessionStorage.removeItem('gpcFilterOverride');
      }
    } catch (e) {
      console.error('Error updating sessionStorage:', e);
    }
  }, []);

  // Clear override
  const clearOverride = useCallback(() => {
    updateOverride(false);
  }, [updateOverride]);

  // Refresh preferences (called after saving in UserPreferencesPanel)
  const refreshPreferences = useCallback(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Check if filter should be applied
  const shouldApplyFilter = useCallback(() => {
    if (!ENABLE_GPC_FILTER) return false;
    if (preferences.gpcFilterEnabled === false) return false; // User has disabled GPC filter
    if (override) return false; // Override is active
    if (!preferences.interestedAccounts.length && !preferences.interestedProjects.length) {
      return false; // No preferences set
    }
    return true;
  }, [override, preferences]);

  // Get filter values for API calls
  const getFilterParams = useCallback(() => {
    if (!shouldApplyFilter()) {
      return {};
    }

    const params = {};
    if (preferences.interestedAccounts.length > 0) {
      // Extract IDs from objects { id, name }
      const accountIds = preferences.interestedAccounts.map(acc => {
        if (typeof acc === 'object' && acc !== null && acc.id) {
          return acc.id;
        }
        return typeof acc === 'string' ? acc : '';
      }).filter(Boolean);
      if (accountIds.length > 0) {
        params.gpc_accounts = accountIds.join(',');
      }
    }
    if (preferences.interestedProjects.length > 0) {
      // Extract IDs from objects { id, name }
      const projectIds = preferences.interestedProjects.map(proj => {
        if (typeof proj === 'object' && proj !== null && proj.id) {
          return proj.id;
        }
        return typeof proj === 'string' ? proj : '';
      }).filter(Boolean);
      if (projectIds.length > 0) {
        params.gpc_projects = projectIds.join(',');
      }
    }
    return params;
  }, [shouldApplyFilter, preferences]);

  const value = {
    preferences,
    override,
    loading,
    initialized,
    setOverride: updateOverride,
    clearOverride,
    refreshPreferences,
    shouldApplyFilter,
    getFilterParams,
    // Expose preferences.gpcFilterEnabled directly for easier watching
    gpcFilterEnabled: preferences.gpcFilterEnabled
  };

  return (
    <GPCFilterContext.Provider value={value}>
      {children}
    </GPCFilterContext.Provider>
  );
};

