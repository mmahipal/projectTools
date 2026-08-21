/**
 * Client Tool Account Availability Validation
 * Checks if accounts are available for assignment
 */

/**
 * Checks if an account is available for assignment
 * @param {Object} account - The account object
 * @param {string} projectId - The project ID to assign to
 * @param {Array} projects - Array of all projects
 * @returns {Object} - { isAvailable: boolean, reason: string|null }
 */
export const checkAccountAvailability = (account, projectId, projects) => {
  if (!account) {
    return {
      isAvailable: false,
      reason: 'Account not found'
    };
  }

  // Check if account is deactivated
  if (account.deactivated) {
    return {
      isAvailable: false,
      reason: 'Account is deactivated'
    };
  }

  // Check if account is already mapped to a different project
  const existingProject = projects.find(
    p => p.id !== projectId && p.clientToolAccountUsed === account.id
  );

  if (existingProject) {
    return {
      isAvailable: false,
      reason: `Account is already mapped to project: ${existingProject.name}`,
      existingProjectId: existingProject.id,
      existingProjectName: existingProject.name
    };
  }

  return {
    isAvailable: true,
    reason: null
  };
};

/**
 * Checks availability for multiple accounts
 * @param {Array} accounts - Array of account objects
 * @param {string} projectId - The project ID
 * @param {Array} projects - Array of all projects
 * @returns {Object} - Map of accountId to availability status
 */
export const checkMultipleAccountAvailability = (accounts, projectId, projects) => {
  const availabilityMap = {};

  accounts.forEach(account => {
    if (account && account.id) {
      availabilityMap[account.id] = checkAccountAvailability(account, projectId, projects);
    }
  });

  return availabilityMap;
};

/**
 * Filters available accounts from a list
 * @param {Array} accounts - Array of account objects
 * @param {string} projectId - The project ID
 * @param {Array} projects - Array of all projects
 * @returns {Array} - Array of available accounts
 */
export const filterAvailableAccounts = (accounts, projectId, projects) => {
  return accounts.filter(account => {
    const availability = checkAccountAvailability(account, projectId, projects);
    return availability.isAvailable;
  });
};

