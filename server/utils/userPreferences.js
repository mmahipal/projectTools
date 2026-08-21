/**
 * User Preferences Utility Functions
 * Uses Redux-like store for state management
 */

const { userPreferenceActions } = require('../store/actions');

/**
 * Get preferences for a specific user
 */
const getUserPreferences = (userId) => {
  return userPreferenceActions.getPreference(userId);
};

/**
 * Save or update preferences for a user
 */
const saveUserPreference = (userId, preferences) => {
  const existingPreference = userPreferenceActions.getPreference(userId);
  
  let preferenceData = {
    userId,
    gpcFilterEnabled: preferences.gpcFilterEnabled !== undefined ? preferences.gpcFilterEnabled : true, // Default to enabled
    interestedAccounts: preferences.interestedAccounts || [],
    interestedProjects: preferences.interestedProjects || [],
    updatedAt: new Date().toISOString()
  };
  
  if (existingPreference) {
    // Merge with existing
    preferenceData = {
      ...existingPreference,
      ...preferenceData
    };
  } else {
    // Add creation timestamp for new preferences
    preferenceData.createdAt = new Date().toISOString();
  }
  
  userPreferenceActions.setPreference(userId, preferenceData);
  return true;
};

/**
 * Delete preferences for a user
 */
const deleteUserPreference = (userId) => {
  userPreferenceActions.deletePreference(userId);
  return true;
};

/**
 * Load all user preferences (for migration/backup purposes)
 */
const loadUserPreferences = () => {
  const allPreferences = userPreferenceActions.getAllPreferences();
  return Object.values(allPreferences);
};

/**
 * Save user preferences (for migration/backup purposes)
 */
const saveUserPreferences = (preferencesArray) => {
  // Convert array to map and update store
  const preferencesMap = {};
  preferencesArray.forEach(pref => {
    preferencesMap[pref.userId] = pref;
  });
  userPreferenceActions.loadPreferences(preferencesMap);
  return true;
};

module.exports = {
  loadUserPreferences,
  saveUserPreferences,
  getUserPreferences,
  saveUserPreference,
  deleteUserPreference
};

