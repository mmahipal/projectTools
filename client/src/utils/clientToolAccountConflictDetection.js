/**
 * Client Tool Account Conflict Detection
 * Detects duplicate mappings and conflicts
 */

/**
 * Detects duplicate account mappings across projects
 * @param {Array} projects - Array of projects with account assignments
 * @param {Object} selectedAccounts - Object mapping projectId to accountId
 * @returns {Array} - Array of conflict objects { accountId, projectIds: Array<string>, type: 'duplicate' }
 */
export const detectDuplicateMappings = (projects, selectedAccounts) => {
  const conflicts = [];
  const accountToProjectsMap = new Map();

  // Build map of accountId -> array of projectIds
  Object.entries(selectedAccounts).forEach(([projectId, accountId]) => {
    if (accountId) {
      if (!accountToProjectsMap.has(accountId)) {
        accountToProjectsMap.set(accountId, []);
      }
      accountToProjectsMap.get(accountId).push(projectId);
    }
  });

  // Find accounts mapped to multiple projects
  accountToProjectsMap.forEach((projectIds, accountId) => {
    if (projectIds.length > 1) {
      const projectNames = projectIds
        .map(pid => {
          const project = projects.find(p => p.id === pid);
          return project ? project.name : pid;
        })
        .filter(Boolean);

      conflicts.push({
        accountId,
        projectIds,
        projectNames,
        type: 'duplicate',
        message: `Account is mapped to ${projectIds.length} projects: ${projectNames.join(', ')}`
      });
    }
  });

  return conflicts;
};

/**
 * Detects if an account is already mapped to a different project
 * @param {string} accountId - The account ID to check
 * @param {string} currentProjectId - The current project ID
 * @param {Array} projects - Array of all projects
 * @returns {Object|null} - Conflict object or null
 */
export const detectExistingMapping = (accountId, currentProjectId, projects) => {
  if (!accountId) return null;

  const existingProject = projects.find(
    p => p.id !== currentProjectId && p.clientToolAccountUsed === accountId
  );

  if (existingProject) {
    return {
      accountId,
      existingProjectId: existingProject.id,
      existingProjectName: existingProject.name,
      currentProjectId,
      type: 'existing_mapping',
      message: `This account is already mapped to project: ${existingProject.name}`
    };
  }

  return null;
};

/**
 * Gets all conflicts for a set of assignments
 * @param {Array} projects - Array of projects
 * @param {Object} selectedAccounts - Object mapping projectId to accountId
 * @returns {Array} - Array of all conflict objects
 */
export const getAllConflicts = (projects, selectedAccounts) => {
  const conflicts = [];

  // Check for duplicate mappings
  const duplicateConflicts = detectDuplicateMappings(projects, selectedAccounts);
  conflicts.push(...duplicateConflicts);

  // Check for existing mappings
  Object.entries(selectedAccounts).forEach(([projectId, accountId]) => {
    if (accountId) {
      const existingMapping = detectExistingMapping(accountId, projectId, projects);
      if (existingMapping) {
        conflicts.push(existingMapping);
      }
    }
  });

  return conflicts;
};

