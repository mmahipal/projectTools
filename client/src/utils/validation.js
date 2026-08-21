/**
 * Field validation utilities
 * Provides validation functions for different field types
 */

/**
 * Validates if input contains only numbers
 * @param {string} value - Input value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isNumeric = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  return /^\d+(\.\d+)?$/.test(value.trim());
};

/**
 * Validates if input contains only alphanumeric characters (no special characters)
 * @param {string} value - Input value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isAlphanumeric = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  return /^[a-zA-Z0-9\s]+$/.test(value.trim());
};

/**
 * Validates if input contains only letters and spaces (no numbers or special characters)
 * @param {string} value - Input value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isAlphaOnly = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  return /^[a-zA-Z\s]+$/.test(value.trim());
};

/**
 * Validates email format
 * @param {string} value - Email to validate
 * @returns {boolean} - True if valid email, false otherwise
 */
export const isValidEmail = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
};

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} value - Date to validate
 * @returns {boolean} - True if valid date, false otherwise
 */
export const isValidDate = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value.trim())) return false;
  const date = new Date(value.trim());
  return date instanceof Date && !isNaN(date);
};

/**
 * Validates URL format
 * @param {string} value - URL to validate
 * @returns {boolean} - True if valid URL, false otherwise
 */
export const isValidUrl = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates percentage (0-100)
 * @param {string} value - Percentage to validate
 * @returns {boolean} - True if valid percentage, false otherwise
 */
export const isValidPercentage = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  const num = parseFloat(value.trim());
  return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * Validates positive number
 * @param {string} value - Number to validate
 * @returns {boolean} - True if valid positive number, false otherwise
 */
export const isPositiveNumber = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  const num = parseFloat(value.trim());
  return !isNaN(num) && num > 0;
};

/**
 * Validates non-negative number (including zero)
 * @param {string} value - Number to validate
 * @returns {boolean} - True if valid non-negative number, false otherwise
 */
export const isNonNegativeNumber = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  const num = parseFloat(value.trim());
  return !isNaN(num) && num >= 0;
};

/**
 * Validates integer
 * @param {string} value - Value to validate
 * @returns {boolean} - True if valid integer, false otherwise
 */
export const isInteger = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  return /^-?\d+$/.test(value.trim());
};

/**
 * Validates positive integer
 * @param {string} value - Value to validate
 * @returns {boolean} - True if valid positive integer, false otherwise
 */
export const isPositiveInteger = (value) => {
  if (!value || value.trim() === '') return true; // Allow empty
  const num = parseInt(value.trim(), 10);
  return !isNaN(num) && num > 0;
};

/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} value - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (value) => {
  if (!value || typeof value !== 'string') return value;
  
  // Remove potentially dangerous characters
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim();
};

/**
 * Validates and sanitizes input based on field type
 * @param {string} value - Input value
 * @param {string} fieldType - Type of field (numeric, alphanumeric, email, etc.)
 * @returns {object} - { isValid: boolean, sanitized: string, error: string }
 */
export const validateAndSanitize = (value, fieldType) => {
  const sanitized = sanitizeInput(value);
  let isValid = true;
  let error = '';

  if (!value || value.trim() === '') {
    return { isValid: true, sanitized: '', error: '' };
  }

  switch (fieldType) {
    case 'numeric':
      isValid = isNumeric(sanitized);
      error = isValid ? '' : 'This field accepts only numbers';
      break;
    case 'integer':
      isValid = isInteger(sanitized);
      error = isValid ? '' : 'This field accepts only whole numbers';
      break;
    case 'positiveInteger':
      isValid = isPositiveInteger(sanitized);
      error = isValid ? '' : 'This field accepts only positive whole numbers';
      break;
    case 'alphanumeric':
      isValid = isAlphanumeric(sanitized);
      error = isValid ? '' : 'This field does not accept special characters';
      break;
    case 'alphaOnly':
      isValid = isAlphaOnly(sanitized);
      error = isValid ? '' : 'This field accepts only letters';
      break;
    case 'email':
      isValid = isValidEmail(sanitized);
      error = isValid ? '' : 'Please enter a valid email address';
      break;
    case 'date':
      isValid = isValidDate(sanitized);
      error = isValid ? '' : 'Please enter a valid date (YYYY-MM-DD)';
      break;
    case 'url':
      isValid = isValidUrl(sanitized);
      error = isValid ? '' : 'Please enter a valid URL';
      break;
    case 'percentage':
      isValid = isValidPercentage(sanitized);
      error = isValid ? '' : 'Please enter a percentage between 0 and 100';
      break;
    case 'positiveNumber':
      isValid = isPositiveNumber(sanitized);
      error = isValid ? '' : 'Please enter a positive number';
      break;
    case 'nonNegativeNumber':
      isValid = isNonNegativeNumber(sanitized);
      error = isValid ? '' : 'Please enter a number greater than or equal to 0';
      break;
    default:
      // Default: just sanitize, no specific validation
      isValid = true;
      error = '';
  }

  return { isValid, sanitized, error };
};

/**
 * Validates field on change event
 * @param {Event} e - Change event
 * @param {string} fieldType - Type of field
 * @param {Function} setValue - React Hook Form setValue function
 * @param {Function} setError - Function to set error state
 * @param {string} fieldName - Name of the field
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateOnChange = (e, fieldType, setValue, setError, fieldName) => {
  const value = e.target.value;
  const { isValid, sanitized, error } = validateAndSanitize(value, fieldType);

  if (isValid) {
    setValue(fieldName, sanitized);
    setError(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  } else {
    setError(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }

  return isValid;
};





















