/**
 * Error handling utilities
 * Provides consistent error handling and user-friendly error messages
 */

/**
 * Gets user-friendly error message from error object
 * @param {Error|object} error - Error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Check for axios error response
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle different HTTP status codes
    switch (status) {
      case 400:
        return data?.error || data?.message || 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        // Check for specific error codes to provide more accurate messages
        if (data?.code === 'CSRF_TOKEN_MISSING' || data?.code === 'CSRF_TOKEN_INVALID') {
          return data?.message || 'CSRF token validation failed. Please refresh the page and try again.';
        }
        if (data?.code === 'INSUFFICIENT_PERMISSIONS') {
          return data?.message || 'You do not have permission to perform this action.';
        }
        // Check error message for CSRF-related errors
        if (data?.error?.includes('CSRF') || data?.message?.includes('CSRF')) {
          return data?.message || 'CSRF token validation failed. Please refresh the page and try again.';
        }
        // Default 403 message
        return data?.message || data?.error || 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return data?.error || data?.message || 'A conflict occurred. This record may already exist.';
      case 422:
        return data?.error || data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return data?.error || data?.message || 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data?.error || data?.message || `Request failed with status ${status}. Please try again.`;
    }
  }

  // Check for network error
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Check for aborted requests (user cancelled or new request started)
  if (error.name === 'AbortError' || error.name === 'CanceledError' || 
      (error.code === 'ECONNABORTED' && error.message?.includes('aborted'))) {
    return null; // Don't show error for aborted requests
  }

  // Check for timeout error (only if not aborted)
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Check for CORS error
  if (error.message?.includes('CORS') || error.message?.includes('Cross-Origin')) {
    return 'Connection error. Please ensure the server is running and CORS is configured correctly.';
  }

  // Check for Salesforce-specific errors
  if (error.errorCode) {
    switch (error.errorCode) {
      case 'INVALID_LOGIN':
        return 'Invalid Salesforce credentials. Please check your Salesforce settings.';
      case 'INVALID_FIELD':
        return 'Invalid field value. Please check your input.';
      case 'REQUIRED_FIELD_MISSING':
        return 'Required field is missing. Please fill in all required fields.';
      case 'FIELD_FILTER_VALIDATION_EXCEPTION':
        return error.message || 'Field validation failed. Please check your input.';
      case 'FIELD_CUSTOM_VALIDATION_EXCEPTION':
        return error.message || 'Validation failed. Please check your input.';
      default:
        return error.message || 'Salesforce error. Please check your input and try again.';
    }
  }

  // Return error message if available
  if (error.message) {
    return error.message;
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Gets detailed error information for logging
 * @param {Error|object} error - Error object
 * @returns {object} - Detailed error information
 */
export const getErrorDetails = (error) => {
  if (!error) return {};

  const details = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    stack: error.stack
  };

  if (error.response) {
    details.status = error.response.status;
    details.statusText = error.response.statusText;
    details.data = error.response.data;
    details.url = error.config?.url;
    details.method = error.config?.method;
  }

  if (error.code) {
    details.code = error.code;
  }

  if (error.errorCode) {
    details.errorCode = error.errorCode;
  }

  return details;
};

/**
 * Logs error with details
 * @param {Error|object} error - Error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
  const errorDetails = getErrorDetails(error);
  const userMessage = getErrorMessage(error);
  
  console.error(`[${context}] Error:`, {
    ...errorDetails,
    userMessage,
    timestamp: new Date().toISOString()
  });
};

/**
 * Handles error and returns user-friendly message
 * @param {Error|object} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} - User-friendly error message (null if aborted)
 */
export const handleError = (error, context = '') => {
  // Don't log or show errors for aborted requests
  if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
    return null;
  }
  
  const errorMessage = getErrorMessage(error);
  
  // Don't log if error message is null (aborted request)
  if (errorMessage !== null) {
    logError(error, context);
  }
  
  return errorMessage;
};



