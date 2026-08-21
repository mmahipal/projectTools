/**
 * Selectors for Settings Store
 * Provides memoized selectors for accessing store state
 */

const store = require('./index');

const selectors = {
  // User selectors
  selectUsers: () => store.getState().users,
  selectUserById: (userId) => store.getState().users.find(user => user.id === userId),
  selectUsersByRole: (role) => store.getState().users.filter(user => user.role === role),
  selectActiveUsers: () => store.getState().users.filter(user => user.isActive !== false),

  // User Preferences selectors
  selectUserPreferences: () => store.getState().userPreferences,
  selectUserPreference: (userId) => store.getState().userPreferences[userId] || null,

  // Salesforce Settings selectors
  selectSalesforceSettings: () => store.getState().salesforceSettings,
  selectSalesforceSettingsByUserId: (userId) => store.getState().salesforceSettings[userId] || null,

  // Reset Tokens selectors
  selectResetTokens: () => store.getState().resetTokens,
  selectResetToken: (token) => store.getState().resetTokens[token] || null,

  // Roles selectors
  selectRoles: () => store.getState().roles,

  // Combined selectors
  selectUserWithSettings: (userId) => {
    const state = store.getState();
    const user = state.users.find(u => u.id === userId);
    if (!user) return null;

    return {
      ...user,
      preferences: state.userPreferences[userId] || null,
      salesforceSettings: state.salesforceSettings[userId] || null
    };
  },

  selectAllUsersWithSettings: () => {
    const state = store.getState();
    return state.users.map(user => ({
      ...user,
      preferences: state.userPreferences[user.id] || null,
      salesforceSettings: state.salesforceSettings[user.id] || null
    }));
  }
};

module.exports = selectors;
