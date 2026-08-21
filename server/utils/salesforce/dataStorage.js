// Data storage utilities for Salesforce routes

const fs = require('fs');
const path = require('path');

/**
 * Migrate data from old location (server/data) to new location (.runtime-data)
 * This ensures data persists across code merges
 */
const migrateDataIfNeeded = (oldPath, newPath) => {
  try {
    // If new path doesn't exist but old path does, migrate
    if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
      const oldDir = path.dirname(oldPath);
      const newDir = path.dirname(newPath);
      
      // Create new directory structure
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      
      // Copy file
      if (fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, newPath);
        console.log(`Migrated data from ${oldPath} to ${newPath}`);
      }
    }
  } catch (error) {
    console.error(`Error migrating data from ${oldPath} to ${newPath}:`, error);
  }
};

/**
 * Get the path to the projects data file
 * Uses a persistent location outside the codebase to survive code merges
 * @returns {string} Path to projects.json
 */
const getProjectsPath = () => {
  // Use process.env.DATA_DIR if set (for Docker/containerized deployments)
  // Otherwise use a persistent location relative to the project root
  const baseDir = process.env.DATA_DIR || path.join(__dirname, '../../../.runtime-data');
  const dataDir = path.join(baseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const newPath = path.join(dataDir, 'projects.json');
  const oldPath = path.join(__dirname, '../../data/projects.json');
  
  // Migrate from old location if needed
  migrateDataIfNeeded(oldPath, newPath);
  
  return newPath;
};

/**
 * Load projects from local storage
 * @returns {Array} Array of projects
 */
const loadProjects = () => {
  try {
    const projectsPath = getProjectsPath();
    if (fs.existsSync(projectsPath)) {
      const fileContent = fs.readFileSync(projectsPath, 'utf8');
      const projects = JSON.parse(fileContent);
      return projects;
    }
  } catch (error) {
    console.error('Error loading projects from file:', error);
  }
  return [];
};

/**
 * Save projects to local storage
 * @param {Array} projectsArray - Array of projects to save
 */
const saveProjects = (projectsArray) => {
  try {
    const projectsPath = getProjectsPath();
    const jsonData = JSON.stringify(projectsArray, null, 2);
    const tempPath = projectsPath + '.tmp';
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, projectsPath);
    console.log(`Saved ${projectsArray.length} projects to persistent storage`);
  } catch (error) {
    console.error('Error saving projects to file:', error);
    throw error;
  }
};

/**
 * Get the path to the project objectives data file
 * Uses a persistent location outside the codebase to survive code merges
 * @returns {string} Path to projectObjectives.json
 */
const getProjectObjectivesPath = () => {
  // Use process.env.DATA_DIR if set (for Docker/containerized deployments)
  // Otherwise use a persistent location relative to the project root
  const baseDir = process.env.DATA_DIR || path.join(__dirname, '../../../.runtime-data');
  const dataDir = path.join(baseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const newPath = path.join(dataDir, 'projectObjectives.json');
  const oldPath = path.join(__dirname, '../../data/projectObjectives.json');
  
  // Migrate from old location if needed
  migrateDataIfNeeded(oldPath, newPath);
  
  return newPath;
};

/**
 * Load project objectives from local storage
 * @returns {Array} Array of project objectives
 */
const loadProjectObjectives = () => {
  try {
    const objectivesPath = getProjectObjectivesPath();
    if (fs.existsSync(objectivesPath)) {
      const fileContent = fs.readFileSync(objectivesPath, 'utf8');
      const objectives = JSON.parse(fileContent);
      return Array.isArray(objectives) ? objectives : [];
    }
  } catch (error) {
    console.error('Error loading project objectives from file:', error);
  }
  return [];
};

/**
 * Save project objectives to local storage
 * @param {Array} objectivesArray - Array of project objectives to save
 */
const saveProjectObjectives = (objectivesArray) => {
  try {
    const objectivesPath = getProjectObjectivesPath();
    const cleanedObjectives = objectivesArray.map(obj => {
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'function') {
          return;
        }
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            try {
              JSON.stringify(value);
              cleaned[key] = value;
            } catch (e) {
              console.warn(`Skipping circular reference in field: ${key}`);
            }
          } else {
            cleaned[key] = value;
          }
        }
      });
      return cleaned;
    });
    
    const jsonData = JSON.stringify(cleanedObjectives, null, 2);
    JSON.parse(jsonData);
    
    const tempPath = objectivesPath + '.tmp';
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, objectivesPath);
    console.log(`Saved ${objectivesArray.length} project objectives to persistent storage`);
  } catch (error) {
    console.error('Error saving project objectives to file:', error);
    throw error;
  }
};

/**
 * Get the path to the settings file (user-specific)
 * Uses a persistent location outside the codebase to survive code merges
 * @param {string} userId - User ID for user-specific settings
 * @returns {string} Path to salesforce-settings.json for the user
 */
const getSettingsPath = (userId = null) => {
  // Use process.env.DATA_DIR if set (for Docker/containerized deployments)
  // Otherwise use a persistent location relative to the project root
  const baseDir = process.env.DATA_DIR || path.join(__dirname, '../../../.runtime-data');
  const settingsDir = path.join(baseDir, 'salesforce-settings');
  
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  
  // If userId is provided, use user-specific file, otherwise use global (for backward compatibility)
  const fileName = userId ? `salesforce-settings-${userId}.json` : 'salesforce-settings.json';
  const newPath = path.join(settingsDir, fileName);
  const oldPath = userId 
    ? path.join(__dirname, '../../data', fileName)
    : path.join(__dirname, '../../data/salesforce-settings.json');
  
  // Migrate from old location if needed
  migrateDataIfNeeded(oldPath, newPath);
  
  return newPath;
};

/**
 * Load user-specific Salesforce settings
 * @param {string} userId - User ID
 * @returns {Object|null} Settings object or null if not found
 */
const loadUserSettings = (userId) => {
  const { salesforceSettingsActions } = require('../../store/actions');
  const store = require('../../store/index');
  
  // Ensure store is initialized
  if (!store.isInitialized) {
    console.warn('[DataStorage] Store not initialized yet, attempting to initialize...');
    // Don't await - just log warning and try to get settings anyway
    // The store should be initialized before routes are used
  }
  
  const settings = salesforceSettingsActions.getSettings(userId);
  if (settings) {
    console.log(`[DataStorage] Loaded Salesforce settings for user ${userId} from store`);
  } else {
    console.log(`[DataStorage] No Salesforce settings found for user ${userId} in store`);
  }
  return settings;
};

/**
 * Save user-specific Salesforce settings
 * @param {string} userId - User ID
 * @param {Object} settings - Settings object to save
 * @param {boolean} persistImmediately - If true, persist immediately instead of debouncing
 */
const saveUserSettings = async (userId, settings, persistImmediately = false) => {
  if (!userId) {
    throw new Error('User ID is required to save Salesforce settings');
  }
  
  const { salesforceSettingsActions } = require('../../store/actions');
  const store = require('../../store/index');
  
  console.log(`[DataStorage] ===== Saving Salesforce settings =====`);
  console.log(`[DataStorage] User ID: ${userId}`);
  console.log(`[DataStorage] Settings keys:`, Object.keys(settings || {}));
  console.log(`[DataStorage] Persist immediately: ${persistImmediately}`);
  
  // Dispatch the action to update the store
  try {
    salesforceSettingsActions.setSettings(userId, settings);
    console.log(`[DataStorage] Settings dispatched to store for user ${userId}`);
  } catch (dispatchError) {
    console.error(`[DataStorage] Error dispatching settings to store for user ${userId}:`, dispatchError);
    throw new Error(`Failed to dispatch settings to store: ${dispatchError.message}`);
  }
  
  // Verify it was saved to store
  const savedInStore = salesforceSettingsActions.getSettings(userId);
  if (!savedInStore) {
    console.error(`[DataStorage] Settings not found in store after dispatch for user ${userId}`);
    console.error(`[DataStorage] All user IDs in store:`, Object.keys(store.getState().salesforceSettings || {}));
    throw new Error(`Failed to save settings to store for user ${userId}. Settings not found after dispatch.`);
  }
  if (savedInStore.username !== settings.username) {
    console.error(`[DataStorage] Settings mismatch in store for user ${userId}`);
    console.error(`[DataStorage] Expected username: ${settings.username}`);
    console.error(`[DataStorage] Got username: ${savedInStore.username}`);
    throw new Error(`Settings mismatch in store for user ${userId}`);
  }
  
  console.log(`[DataStorage] Verified Salesforce settings saved to store for user ${userId}`);
  
  // If immediate persistence is requested, persist now
  if (persistImmediately) {
    try {
      console.log(`[DataStorage] Persisting Salesforce settings immediately for user ${userId}`);
      await store.persistImmediately();
      console.log(`[DataStorage] Successfully persisted Salesforce settings to disk for user ${userId}`);
      
      // Verify file was written
      const fs = require('fs');
      const settingsPath = getSettingsPath(userId);
      console.log(`[DataStorage] Checking for settings file at: ${settingsPath}`);
      
      if (!fs.existsSync(settingsPath)) {
        console.error(`[DataStorage] Settings file not found at ${settingsPath}`);
        console.error(`[DataStorage] Directory exists: ${fs.existsSync(require('path').dirname(settingsPath))}`);
        console.error(`[DataStorage] Directory contents:`, fs.existsSync(require('path').dirname(settingsPath)) ? fs.readdirSync(require('path').dirname(settingsPath)) : 'N/A');
        throw new Error(`Settings file not found after persistence at ${settingsPath}`);
      }
      
      const fileContents = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (fileContents.username !== settings.username) {
        console.error(`[DataStorage] File contents mismatch for user ${userId}`);
        console.error(`[DataStorage] Expected username: ${settings.username}`);
        console.error(`[DataStorage] Got username: ${fileContents.username}`);
        throw new Error(`Settings file contents mismatch for user ${userId}`);
      }
      
      console.log(`[DataStorage] Verified Salesforce settings file exists and matches for user ${userId}`);
    } catch (error) {
      console.error(`[DataStorage] Error immediately persisting settings for user ${userId}:`, error);
      console.error(`[DataStorage] Error stack:`, error.stack);
      throw error;
    }
  }
};

module.exports = {
  getProjectsPath,
  loadProjects,
  saveProjects,
  getProjectObjectivesPath,
  loadProjectObjectives,
  saveProjectObjectives,
  getSettingsPath,
  loadUserSettings,
  saveUserSettings
};

