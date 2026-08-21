/**
 * Client Tool Account Validation Utilities
 * Provides validation functions for Client Tool Account operations
 */

/**
 * Validates Client Tool Account form data
 * @param {Object} formData - The form data to validate
 * @returns {Object} - { isValid: boolean, errors: Array<string> }
 */
export const validateClientToolAccount = (formData) => {
  const errors = [];

  if (!formData.clientToolName || formData.clientToolName.trim() === '') {
    errors.push('Client Tool Name is required');
  }

  if (!formData.clientToolEmail || formData.clientToolEmail.trim() === '') {
    errors.push('Client Tool Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientToolEmail)) {
    errors.push('Client Tool Email must be a valid email address');
  }

  if (!formData.contributor || formData.contributor.trim() === '') {
    errors.push('Contributor is required');
  }

  if (!formData.account || formData.account.trim() === '') {
    errors.push('Account is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates account assignment data
 * @param {string} projectId - The project ID
 * @param {string} accountId - The account ID
 * @returns {Object} - { isValid: boolean, errors: Array<string> }
 */
export const validateAccountAssignment = (projectId, accountId) => {
  const errors = [];

  if (!projectId || projectId.trim() === '') {
    errors.push('Project ID is required');
  }

  if (!accountId || accountId.trim() === '') {
    errors.push('Account ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates bulk assignment data
 * @param {Array} assignments - Array of { projectId, accountId }
 * @returns {Object} - { isValid: boolean, errors: Array<string> }
 */
export const validateBulkAssignment = (assignments) => {
  const errors = [];

  if (!Array.isArray(assignments) || assignments.length === 0) {
    errors.push('At least one assignment is required');
    return { isValid: false, errors };
  }

  assignments.forEach((assignment, index) => {
    if (!assignment.projectId) {
      errors.push(`Assignment ${index + 1}: Project ID is required`);
    }
    if (!assignment.accountId) {
      errors.push(`Assignment ${index + 1}: Account ID is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

