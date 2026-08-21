/**
 * Real-time validation hook for Client Tool Account
 * Provides real-time validation feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { validateClientToolAccount } from '../utils/clientToolAccountValidation';
import { checkAccountStatus } from '../utils/clientToolAccountStatusCheck';
import { checkAccountAvailability } from '../utils/clientToolAccountAvailability';

/**
 * Hook for real-time Client Tool Account validation
 * @param {Object} formData - The form data to validate
 * @param {Array} projects - Array of all projects (for availability check)
 * @param {string} currentProjectId - Current project ID (if updating)
 * @returns {Object} - Validation state and functions
 */
export const useClientToolAccountValidation = (formData, projects = [], currentProjectId = null) => {
  const [validationErrors, setValidationErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [isValid, setIsValid] = useState(false);

  // Validate form data
  const validate = useCallback(() => {
    const result = validateClientToolAccount(formData);
    setValidationErrors(result.errors);
    setIsValid(result.isValid);

    // Set field-specific errors
    const fieldErrorsMap = {};
    result.errors.forEach(error => {
      if (error.includes('Client Tool Name')) {
        fieldErrorsMap.clientToolName = error;
      } else if (error.includes('Client Tool Email')) {
        fieldErrorsMap.clientToolEmail = error;
      } else if (error.includes('Contributor')) {
        fieldErrorsMap.contributor = error;
      } else if (error.includes('Account')) {
        fieldErrorsMap.account = error;
      }
    });
    setFieldErrors(fieldErrorsMap);

    return result.isValid;
  }, [formData]);

  // Check account status
  const checkStatus = useCallback((account) => {
    if (!account) return null;
    return checkAccountStatus(account);
  }, []);

  // Check account availability
  const checkAvailability = useCallback((account, projectId) => {
    if (!account) return null;
    return checkAccountAvailability(account, projectId || currentProjectId, projects);
  }, [projects, currentProjectId]);

  // Real-time validation on form data change
  useEffect(() => {
    if (formData) {
      validate();
    }
  }, [formData, validate]);

  // Clear validation errors
  const clearErrors = useCallback(() => {
    setValidationErrors([]);
    setFieldErrors({});
    setWarnings([]);
  }, []);

  // Add warning
  const addWarning = useCallback((warning) => {
    setWarnings(prev => [...prev, warning]);
  }, []);

  // Clear warnings
  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  return {
    isValid,
    validationErrors,
    fieldErrors,
    warnings,
    validate,
    checkStatus,
    checkAvailability,
    clearErrors,
    addWarning,
    clearWarnings
  };
};

