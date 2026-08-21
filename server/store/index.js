/**
 * Redux-like Store for Settings and User Preferences
 * Provides centralized state management with persistence layer
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Store state structure
const initialState = {
  users: [],
  userPreferences: {}, // { userId: preferences }
  salesforceSettings: {}, // { userId: settings }
  userSettings: {}, // { userId: { category: settings } } - General user settings per category
  appConfigurations: {}, // { userId: { key: value } } - App-level configurations per user
  resetTokens: {},
  roles: []
};

class SettingsStore extends EventEmitter {
  constructor() {
    super();
    this.state = JSON.parse(JSON.stringify(initialState)); // Deep clone
    this.persistDebounceTimer = null;
    this.persistDelay = 1000; // Debounce persistence by 1 second
    this.isInitialized = false;
  }

  /**
   * Initialize store by loading data from file system
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadFromFileSystem();
      this.isInitialized = true;
      console.log('[Store] Initialized successfully');
    } catch (error) {
      console.error('[Store] Error initializing:', error);
      // Don't throw - allow server to start with empty state
      // This prevents server from crashing if data files are corrupted or missing
      console.warn('[Store] Continuing with empty state - data will be created on first use');
      this.isInitialized = true;
    }
  }

  /**
   * Get current state (returns a copy to prevent direct mutations)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Dispatch an action to update state
   */
  dispatch(action) {
    const previousState = this.getState();
    this.state = this.reducer(this.state, action);
    const newState = this.getState();

    // Emit change event
    this.emit('stateChanged', {
      action,
      previousState,
      newState
    });

    // Persist to file system (debounced)
    this.schedulePersistence();

    return newState;
  }

  /**
   * Reducer function that handles all actions
   */
  reducer(state, action) {
    switch (action.type) {
      // User actions
      case 'USERS_LOADED':
        return {
          ...state,
          users: action.payload
        };

      case 'USER_ADDED':
        return {
          ...state,
          users: [...state.users, action.payload]
        };

      case 'USER_UPDATED':
        return {
          ...state,
          users: state.users.map(user =>
            user.id === action.payload.id ? { ...user, ...action.payload } : user
          )
        };

      case 'USER_DELETED':
        return {
          ...state,
          users: state.users.filter(user => user.id !== action.payload.userId)
        };

      // User Preferences actions
      case 'USER_PREFERENCES_LOADED':
        return {
          ...state,
          userPreferences: action.payload
        };

      case 'USER_PREFERENCE_SET':
        return {
          ...state,
          userPreferences: {
            ...state.userPreferences,
            [action.payload.userId]: action.payload.preferences
          }
        };

      case 'USER_PREFERENCE_DELETED':
        const { [action.payload.userId]: deleted, ...restPreferences } = state.userPreferences;
        return {
          ...state,
          userPreferences: restPreferences
        };

      // Salesforce Settings actions
      case 'SALESFORCE_SETTINGS_LOADED':
        return {
          ...state,
          salesforceSettings: action.payload
        };

      case 'SALESFORCE_SETTINGS_SET':
        return {
          ...state,
          salesforceSettings: {
            ...state.salesforceSettings,
            [action.payload.userId]: action.payload.settings
          }
        };

      case 'SALESFORCE_SETTINGS_DELETED':
        const { [action.payload.userId]: deletedSettings, ...restSettings } = state.salesforceSettings;
        return {
          ...state,
          salesforceSettings: restSettings
        };

      // User Settings actions (general settings per category)
      case 'USER_SETTINGS_LOADED':
        return {
          ...state,
          userSettings: action.payload
        };

      case 'USER_SETTING_SET':
        const { userId: settingUserId, category, settings: settingData } = action.payload;
        return {
          ...state,
          userSettings: {
            ...state.userSettings,
            [settingUserId]: {
              ...(state.userSettings[settingUserId] || {}),
              [category]: settingData
            }
          }
        };

      case 'USER_SETTING_DELETED':
        const { userId: deleteUserId, category: deleteCategory } = action.payload;
        const userSettingsCopy = { ...state.userSettings };
        if (userSettingsCopy[deleteUserId]) {
          const { [deleteCategory]: deleted, ...restCategories } = userSettingsCopy[deleteUserId];
          if (Object.keys(restCategories).length === 0) {
            delete userSettingsCopy[deleteUserId];
          } else {
            userSettingsCopy[deleteUserId] = restCategories;
          }
        }
        return {
          ...state,
          userSettings: userSettingsCopy
        };

      case 'USER_SETTINGS_CLEARED':
        const { userId: clearUserId } = action.payload;
        const clearedSettings = { ...state.userSettings };
        delete clearedSettings[clearUserId];
        return {
          ...state,
          userSettings: clearedSettings
        };

      // App Configurations actions
      case 'APP_CONFIGURATIONS_LOADED':
        return {
          ...state,
          appConfigurations: action.payload
        };

      case 'APP_CONFIGURATION_SET':
        const { userId: configUserId, key, value } = action.payload;
        return {
          ...state,
          appConfigurations: {
            ...state.appConfigurations,
            [configUserId]: {
              ...(state.appConfigurations[configUserId] || {}),
              [key]: value
            }
          }
        };

      case 'APP_CONFIGURATION_DELETED':
        const { userId: deleteConfigUserId, key: deleteKey } = action.payload;
        const configCopy = { ...state.appConfigurations };
        if (configCopy[deleteConfigUserId]) {
          const { [deleteKey]: deletedConfig, ...restConfig } = configCopy[deleteConfigUserId];
          if (Object.keys(restConfig).length === 0) {
            delete configCopy[deleteConfigUserId];
          } else {
            configCopy[deleteConfigUserId] = restConfig;
          }
        }
        return {
          ...state,
          appConfigurations: configCopy
        };

      // Reset Tokens actions
      case 'RESET_TOKENS_LOADED':
        return {
          ...state,
          resetTokens: action.payload
        };

      case 'RESET_TOKEN_SET':
        return {
          ...state,
          resetTokens: {
            ...state.resetTokens,
            [action.payload.token]: action.payload.data
          }
        };

      case 'RESET_TOKEN_DELETED':
        const { [action.payload.token]: deletedToken, ...restTokens } = state.resetTokens;
        return {
          ...state,
          resetTokens: restTokens
        };

      // Roles actions
      case 'ROLES_LOADED':
        return {
          ...state,
          roles: action.payload
        };

      case 'ROLES_UPDATED':
        return {
          ...state,
          roles: action.payload
        };

      default:
        return state;
    }
  }

  /**
   * Schedule persistence to file system (debounced)
   */
  schedulePersistence() {
    if (this.persistDebounceTimer) {
      clearTimeout(this.persistDebounceTimer);
    }

    this.persistDebounceTimer = setTimeout(() => {
      this.persistToFileSystem().catch(error => {
        console.error('[Store] Error persisting to file system:', error);
        // Re-throw error so it can be caught by callers if needed
        this.emit('persistError', error);
      });
    }, this.persistDelay);
  }

  /**
   * Force immediate persistence (for critical operations)
   */
  async persistImmediately() {
    // Clear any pending debounced persistence
    if (this.persistDebounceTimer) {
      clearTimeout(this.persistDebounceTimer);
      this.persistDebounceTimer = null;
    }
    
    // Persist immediately
    await this.persistToFileSystem();
  }

  /**
   * Load data from file system
   */
  async loadFromFileSystem() {
    const baseDir = process.env.DATA_DIR || path.join(__dirname, '../../.runtime-data');
    const dataDir = path.join(baseDir, 'data');
    const settingsDir = path.join(baseDir, 'salesforce-settings');

    // Ensure directories exist before loading
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }
    } catch (error) {
      console.error('[Store] Error creating directories:', error);
      // Continue anyway - files might not exist yet
    }

    // Load users
    try {
      const usersPath = path.join(dataDir, 'users.json');
      if (fs.existsSync(usersPath)) {
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        this.dispatch({ type: 'USERS_LOADED', payload: usersData });
      }
    } catch (error) {
      console.error('[Store] Error loading users:', error);
    }

    // Load user preferences
    try {
      const preferencesPath = path.join(dataDir, 'user-preferences.json');
      if (fs.existsSync(preferencesPath)) {
        const preferencesArray = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
        const preferencesMap = {};
        preferencesArray.forEach(pref => {
          preferencesMap[pref.userId] = pref;
        });
        this.dispatch({ type: 'USER_PREFERENCES_LOADED', payload: preferencesMap });
      }
    } catch (error) {
      console.error('[Store] Error loading user preferences:', error);
    }

    // Load Salesforce settings
    try {
      if (fs.existsSync(settingsDir)) {
        const files = fs.readdirSync(settingsDir);
        const settingsMap = {};
        files.forEach(file => {
          if (file.startsWith('salesforce-settings-') && file.endsWith('.json')) {
            const userId = file.replace('salesforce-settings-', '').replace('.json', '');
            const settingsPath = path.join(settingsDir, file);
            const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            settingsMap[userId] = settingsData;
          }
        });
        this.dispatch({ type: 'SALESFORCE_SETTINGS_LOADED', payload: settingsMap });
      }
    } catch (error) {
      console.error('[Store] Error loading Salesforce settings:', error);
    }

    // Load reset tokens
    try {
      const tokensPath = path.join(dataDir, 'resetTokens.json');
      if (fs.existsSync(tokensPath)) {
        const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
        this.dispatch({ type: 'RESET_TOKENS_LOADED', payload: tokensData });
      }
    } catch (error) {
      console.error('[Store] Error loading reset tokens:', error);
    }

    // Load roles
    try {
      const rolesPath = path.join(dataDir, 'roles.json');
      if (fs.existsSync(rolesPath)) {
        const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
        this.dispatch({ type: 'ROLES_LOADED', payload: rolesData });
      }
    } catch (error) {
      console.error('[Store] Error loading roles:', error);
    }

    // Load user settings (general settings per category)
    try {
      const userSettingsPath = path.join(dataDir, 'user-settings.json');
      if (fs.existsSync(userSettingsPath)) {
        const userSettingsData = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'));
        this.dispatch({ type: 'USER_SETTINGS_LOADED', payload: userSettingsData });
      }
    } catch (error) {
      console.error('[Store] Error loading user settings:', error);
    }

    // Load app configurations
    try {
      const appConfigPath = path.join(dataDir, 'app-configurations.json');
      if (fs.existsSync(appConfigPath)) {
        const appConfigData = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
        this.dispatch({ type: 'APP_CONFIGURATIONS_LOADED', payload: appConfigData });
      }
    } catch (error) {
      console.error('[Store] Error loading app configurations:', error);
    }
  }

  /**
   * Persist data to file system
   */
  async persistToFileSystem() {
    const baseDir = process.env.DATA_DIR || path.join(__dirname, '../../.runtime-data');
    const dataDir = path.join(baseDir, 'data');
    const settingsDir = path.join(baseDir, 'salesforce-settings');

    // Ensure directories exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    // Persist users
    try {
      const usersPath = path.join(dataDir, 'users.json');
      fs.writeFileSync(usersPath, JSON.stringify(this.state.users, null, 2), 'utf8');
    } catch (error) {
      console.error('[Store] Error persisting users:', error);
    }

    // Persist user preferences
    try {
      const preferencesPath = path.join(dataDir, 'user-preferences.json');
      const preferencesArray = Object.values(this.state.userPreferences);
      fs.writeFileSync(preferencesPath, JSON.stringify(preferencesArray, null, 2), 'utf8');
    } catch (error) {
      console.error('[Store] Error persisting user preferences:', error);
    }

    // Persist Salesforce settings
    try {
      // Ensure directory exists
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
        console.log(`[Store] Created Salesforce settings directory: ${settingsDir}`);
      }

      // Get list of current files to track what should exist
      const currentFiles = fs.existsSync(settingsDir) 
        ? fs.readdirSync(settingsDir).filter(file => 
            file.startsWith('salesforce-settings-') && file.endsWith('.json')
          )
        : [];
      
      const userIdsToKeep = new Set(Object.keys(this.state.salesforceSettings));
      
      // Write new/updated files
      let writeCount = 0;
      Object.entries(this.state.salesforceSettings).forEach(([userId, settings]) => {
        try {
          const settingsPath = path.join(settingsDir, `salesforce-settings-${userId}.json`);
          const settingsJson = JSON.stringify(settings, null, 2);
          fs.writeFileSync(settingsPath, settingsJson, 'utf8');
          writeCount++;
          console.log(`[Store] Persisted Salesforce settings for user ${userId} to ${settingsPath}`);
        } catch (writeError) {
          console.error(`[Store] Error writing settings file for user ${userId}:`, writeError);
          throw writeError; // Re-throw to be caught by outer try-catch
        }
      });
      
      // Remove files for users that no longer have settings
      currentFiles.forEach(file => {
        const userId = file.replace('salesforce-settings-', '').replace('.json', '');
        if (!userIdsToKeep.has(userId)) {
          try {
            const filePath = path.join(settingsDir, file);
            fs.unlinkSync(filePath);
            console.log(`[Store] Removed obsolete Salesforce settings file: ${file}`);
          } catch (deleteError) {
            console.warn(`[Store] Error removing obsolete settings file ${file}:`, deleteError);
            // Don't throw - this is cleanup, not critical
          }
        }
      });
      
      console.log(`[Store] Successfully persisted ${writeCount} Salesforce settings file(s)`);
    } catch (error) {
      console.error('[Store] Error persisting Salesforce settings:', error);
      console.error('[Store] Error stack:', error.stack);
      throw error; // Re-throw so callers know persistence failed
    }

    // Persist reset tokens
    try {
      const tokensPath = path.join(dataDir, 'resetTokens.json');
      fs.writeFileSync(tokensPath, JSON.stringify(this.state.resetTokens, null, 2), 'utf8');
    } catch (error) {
      console.error('[Store] Error persisting reset tokens:', error);
    }

    // Persist roles
    try {
      const rolesPath = path.join(dataDir, 'roles.json');
      fs.writeFileSync(rolesPath, JSON.stringify(this.state.roles, null, 2), 'utf8');
    } catch (error) {
      console.error('[Store] Error persisting roles:', error);
    }

    // Persist user settings (general settings per category)
    try {
      const userSettingsPath = path.join(dataDir, 'user-settings.json');
      fs.writeFileSync(userSettingsPath, JSON.stringify(this.state.userSettings, null, 2), 'utf8');
    } catch (error) {
      console.error('[Store] Error persisting user settings:', error);
    }

    // Persist app configurations
    try {
      const appConfigPath = path.join(dataDir, 'app-configurations.json');
      fs.writeFileSync(appConfigPath, JSON.stringify(this.state.appConfigurations, null, 2), 'utf8');
    } catch (error) {
      console.error('[Store] Error persisting app configurations:', error);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.on('stateChanged', listener);
    return () => {
      this.removeListener('stateChanged', listener);
    };
  }
}

// Create singleton instance
const store = new SettingsStore();

module.exports = store;
