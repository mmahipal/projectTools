/**
 * Action Creators for Settings Store
 * Provides convenient functions to dispatch actions
 */

const store = require('./index');

/**
 * User Actions
 */
const userActions = {
  loadUsers: async (users) => {
    const result = store.dispatch({ type: 'USERS_LOADED', payload: users });
    // Persist immediately when loading users (critical for initial setup)
    await store.persistImmediately();
    return result;
  },

  addUser: async (user) => {
    const result = store.dispatch({ type: 'USER_ADDED', payload: user });
    // Persist immediately for critical user operations
    await store.persistImmediately();
    return result;
  },

  updateUser: async (user) => {
    const result = store.dispatch({ type: 'USER_UPDATED', payload: user });
    // Persist immediately for critical user operations
    await store.persistImmediately();
    return result;
  },

  deleteUser: async (userId) => {
    const result = store.dispatch({ type: 'USER_DELETED', payload: { userId } });
    // Persist immediately for critical user operations
    await store.persistImmediately();
    return result;
  },

  getUsers: () => {
    return store.getState().users;
  },

  getUserById: (userId) => {
    return store.getState().users.find(user => user.id === userId);
  }
};

/**
 * User Preferences Actions
 */
const userPreferenceActions = {
  loadPreferences: (preferencesMap) => {
    return store.dispatch({ type: 'USER_PREFERENCES_LOADED', payload: preferencesMap });
  },

  setPreference: (userId, preferences) => {
    return store.dispatch({
      type: 'USER_PREFERENCE_SET',
      payload: { userId, preferences }
    });
  },

  deletePreference: (userId) => {
    return store.dispatch({ type: 'USER_PREFERENCE_DELETED', payload: { userId } });
  },

  getPreference: (userId) => {
    return store.getState().userPreferences[userId] || null;
  },

  getAllPreferences: () => {
    return store.getState().userPreferences;
  }
};

/**
 * Salesforce Settings Actions
 */
const salesforceSettingsActions = {
  loadSettings: (settingsMap) => {
    return store.dispatch({ type: 'SALESFORCE_SETTINGS_LOADED', payload: settingsMap });
  },

  setSettings: (userId, settings) => {
    return store.dispatch({
      type: 'SALESFORCE_SETTINGS_SET',
      payload: { userId, settings }
    });
  },

  deleteSettings: (userId) => {
    return store.dispatch({ type: 'SALESFORCE_SETTINGS_DELETED', payload: { userId } });
  },

  getSettings: (userId) => {
    return store.getState().salesforceSettings[userId] || null;
  },

  getAllSettings: () => {
    return store.getState().salesforceSettings;
  }
};

/**
 * Reset Tokens Actions
 */
const resetTokenActions = {
  loadTokens: (tokensMap) => {
    return store.dispatch({ type: 'RESET_TOKENS_LOADED', payload: tokensMap });
  },

  setToken: (token, data) => {
    return store.dispatch({
      type: 'RESET_TOKEN_SET',
      payload: { token, data }
    });
  },

  deleteToken: (token) => {
    return store.dispatch({ type: 'RESET_TOKEN_DELETED', payload: { token } });
  },

  getToken: (token) => {
    return store.getState().resetTokens[token] || null;
  },

  getAllTokens: () => {
    return store.getState().resetTokens;
  }
};

/**
 * Roles Actions
 */
const roleActions = {
  loadRoles: (roles) => {
    return store.dispatch({ type: 'ROLES_LOADED', payload: roles });
  },

  updateRoles: (roles) => {
    return store.dispatch({ type: 'ROLES_UPDATED', payload: roles });
  },

  getRoles: () => {
    return store.getState().roles;
  }
};

/**
 * User Settings Actions (general settings per category)
 */
const userSettingsActions = {
  loadSettings: (settingsMap) => {
    return store.dispatch({ type: 'USER_SETTINGS_LOADED', payload: settingsMap });
  },

  setSetting: (userId, category, settings) => {
    return store.dispatch({
      type: 'USER_SETTING_SET',
      payload: { userId, category, settings }
    });
  },

  deleteSetting: (userId, category) => {
    return store.dispatch({
      type: 'USER_SETTING_DELETED',
      payload: { userId, category }
    });
  },

  clearAllSettings: (userId) => {
    return store.dispatch({
      type: 'USER_SETTINGS_CLEARED',
      payload: { userId }
    });
  },

  getSetting: (userId, category) => {
    const userSettings = store.getState().userSettings[userId] || {};
    return userSettings[category] || null;
  },

  getAllSettings: (userId) => {
    return store.getState().userSettings[userId] || {};
  },

  getAllUserSettings: () => {
    return store.getState().userSettings;
  }
};

/**
 * App Configurations Actions
 */
const appConfigurationActions = {
  loadConfigurations: (configMap) => {
    return store.dispatch({ type: 'APP_CONFIGURATIONS_LOADED', payload: configMap });
  },

  setConfiguration: (userId, key, value) => {
    return store.dispatch({
      type: 'APP_CONFIGURATION_SET',
      payload: { userId, key, value }
    });
  },

  deleteConfiguration: (userId, key) => {
    return store.dispatch({
      type: 'APP_CONFIGURATION_DELETED',
      payload: { userId, key }
    });
  },

  getConfiguration: (userId, key) => {
    const userConfig = store.getState().appConfigurations[userId] || {};
    return userConfig[key] !== undefined ? userConfig[key] : null;
  },

  getAllConfigurations: (userId) => {
    return store.getState().appConfigurations[userId] || {};
  },

  getAllUserConfigurations: () => {
    return store.getState().appConfigurations;
  }
};

module.exports = {
  userActions,
  userPreferenceActions,
  salesforceSettingsActions,
  resetTokenActions,
  roleActions,
  userSettingsActions,
  appConfigurationActions
};
