/**
 * Redux-like Store for Client-Side Settings
 * Provides centralized state management with localStorage persistence
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import apiClient from '../config/api';

// Initial state
const initialState = {
  userSettings: {}, // { category: settings }
  appConfigurations: {}, // { key: value }
  salesforceSettings: null,
  loading: false,
  error: null
};

// Action types
const ActionTypes = {
  LOAD_SETTINGS_START: 'LOAD_SETTINGS_START',
  LOAD_SETTINGS_SUCCESS: 'LOAD_SETTINGS_SUCCESS',
  LOAD_SETTINGS_ERROR: 'LOAD_SETTINGS_ERROR',
  SET_SETTING: 'SET_SETTING',
  SET_CONFIGURATION: 'SET_CONFIGURATION',
  DELETE_SETTING: 'DELETE_SETTING',
  DELETE_CONFIGURATION: 'DELETE_CONFIGURATION',
  CLEAR_SETTINGS: 'CLEAR_SETTINGS'
};

// Reducer
const settingsReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOAD_SETTINGS_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ActionTypes.LOAD_SETTINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        userSettings: action.payload.settings || {},
        appConfigurations: action.payload.configurations || {},
        error: null
      };

    case ActionTypes.LOAD_SETTINGS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case ActionTypes.SET_SETTING:
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          [action.payload.category]: action.payload.settings
        }
      };

    case ActionTypes.SET_CONFIGURATION:
      return {
        ...state,
        appConfigurations: {
          ...state.appConfigurations,
          [action.payload.key]: action.payload.value
        }
      };

    case ActionTypes.DELETE_SETTING:
      const { [action.payload.category]: deleted, ...restSettings } = state.userSettings;
      return {
        ...state,
        userSettings: restSettings
      };

    case ActionTypes.DELETE_CONFIGURATION:
      const { [action.payload.key]: deletedConfig, ...restConfig } = state.appConfigurations;
      return {
        ...state,
        appConfigurations: restConfig
      };

    case ActionTypes.CLEAR_SETTINGS:
      return {
        ...initialState
      };

    default:
      return state;
  }
};

// Create context
const SettingsContext = createContext(null);

// Provider component
export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Load settings from server
  const loadSettings = useCallback(async () => {
    dispatch({ type: ActionTypes.LOAD_SETTINGS_START });
    try {
      const response = await apiClient.get('/user-settings');
      if (response.data.success) {
        dispatch({
          type: ActionTypes.LOAD_SETTINGS_SUCCESS,
          payload: {
            settings: response.data.settings || {},
            configurations: response.data.configurations || {}
          }
        });
      } else {
        throw new Error(response.data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('[Settings Store] Error loading settings:', error);
      dispatch({
        type: ActionTypes.LOAD_SETTINGS_ERROR,
        payload: error.message || 'Failed to load settings'
      });
    }
  }, []);

  // Save setting for a category
  const saveSetting = useCallback(async (category, settings) => {
    try {
      const response = await apiClient.post(`/user-settings/${category}`, settings);
      if (response.data.success) {
        dispatch({
          type: ActionTypes.SET_SETTING,
          payload: { category, settings: response.data.settings }
        });
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Failed to save setting');
      }
    } catch (error) {
      console.error('[Settings Store] Error saving setting:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to save setting'
      };
    }
  }, []);

  // Get setting for a category
  const getSetting = useCallback((category) => {
    return state.userSettings[category] || null;
  }, [state.userSettings]);

  // Delete setting for a category
  const deleteSetting = useCallback(async (category) => {
    try {
      const response = await apiClient.delete(`/user-settings/${category}`);
      if (response.data.success) {
        dispatch({
          type: ActionTypes.DELETE_SETTING,
          payload: { category }
        });
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Failed to delete setting');
      }
    } catch (error) {
      console.error('[Settings Store] Error deleting setting:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete setting'
      };
    }
  }, []);

  // Save configuration
  const saveConfiguration = useCallback(async (key, value) => {
    try {
      const response = await apiClient.post(`/user-settings/config/${key}`, { value });
      if (response.data.success) {
        dispatch({
          type: ActionTypes.SET_CONFIGURATION,
          payload: { key, value: response.data.value }
        });
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('[Settings Store] Error saving configuration:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to save configuration'
      };
    }
  }, []);

  // Get configuration
  const getConfiguration = useCallback((key) => {
    return state.appConfigurations[key]?.value !== undefined 
      ? state.appConfigurations[key].value 
      : null;
  }, [state.appConfigurations]);

  // Delete configuration
  const deleteConfiguration = useCallback(async (key) => {
    try {
      const response = await apiClient.delete(`/user-settings/config/${key}`);
      if (response.data.success) {
        dispatch({
          type: ActionTypes.DELETE_CONFIGURATION,
          payload: { key }
        });
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('[Settings Store] Error deleting configuration:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete configuration'
      };
    }
  }, []);

  // Clear all settings
  const clearSettings = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_SETTINGS });
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value = {
    ...state,
    loadSettings,
    saveSetting,
    getSetting,
    deleteSetting,
    saveConfiguration,
    getConfiguration,
    deleteConfiguration,
    clearSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Export action types for external use
export { ActionTypes };
