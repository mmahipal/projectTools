// Request validation middleware for Salesforce API endpoints

const { validateAndSanitize, isValidSalesforceId, validateForSqlInjection, validateForXss } = require('../utils/security');

/**
 * Validate request body with schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
const validateRequestBody = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];
      const sanitizedBody = {};

      // Validate each field in schema
      for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        const value = req.body[fieldName];
        const {
          required = false,
          type = 'string',
          maxLength = 10000,
          allowEmpty = true,
          customValidator = null
        } = fieldSchema;

        // Check required fields
        if (required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
          errors.push({
            field: fieldName,
            message: `${fieldName} is required`
          });
          continue;
        }

        // Skip validation if field is optional and not provided
        if (!required && (value === undefined || value === null)) {
          continue;
        }

        // Type validation
        if (type === 'string' && typeof value !== 'string') {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be a string`
          });
          continue;
        }

        if (type === 'array' && !Array.isArray(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be an array`
          });
          continue;
        }

        if (type === 'object' && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be an object`
          });
          continue;
        }

        if (type === 'salesforceId' && !isValidSalesforceId(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be a valid Salesforce ID (15 or 18 characters)`
          });
          continue;
        }

        // Length validation for strings
        if (type === 'string' && typeof value === 'string') {
          if (!allowEmpty && value.trim() === '') {
            errors.push({
              field: fieldName,
              message: `${fieldName} cannot be empty`
            });
            continue;
          }

          if (value.length > maxLength) {
            errors.push({
              field: fieldName,
              message: `${fieldName} exceeds maximum length of ${maxLength} characters`
            });
            continue;
          }
        }

        // Array length validation
        if (type === 'array' && Array.isArray(value)) {
          const { maxItems = 1000 } = fieldSchema;
          if (value.length > maxItems) {
            errors.push({
              field: fieldName,
              message: `${fieldName} array exceeds maximum length of ${maxItems} items`
            });
            continue;
          }
        }

        // Security validation
        if (type === 'string' && typeof value === 'string') {
          const sqlValidation = validateForSqlInjection(value);
          if (!sqlValidation.isValid) {
            errors.push({
              field: fieldName,
              message: `Security: ${sqlValidation.error}`
            });
            continue;
          }

          const xssValidation = validateForXss(value);
          if (!xssValidation.isValid) {
            errors.push({
              field: fieldName,
              message: `Security: ${xssValidation.error}`
            });
            continue;
          }
        }

        // Custom validator
        if (customValidator && typeof customValidator === 'function') {
          const customResult = customValidator(value);
          if (customResult !== true) {
            errors.push({
              field: fieldName,
              message: customResult || `${fieldName} validation failed`
            });
            continue;
          }
        }

        // Sanitize and store
        if (type === 'string' && typeof value === 'string') {
          const validation = validateAndSanitize(value, {
            maxLength,
            allowEmpty,
            type: type === 'salesforceId' ? 'salesforceId' : 'string'
          });
          if (!validation.isValid) {
            errors.push({
              field: fieldName,
              message: validation.error || `Invalid ${fieldName}`
            });
            continue;
          }
          sanitizedBody[fieldName] = validation.sanitized;
        } else {
          sanitizedBody[fieldName] = value;
        }
      }

      // Check for extra fields (optional - can be disabled)
      if (schema._strict !== false) {
        const allowedFields = Object.keys(schema).filter(key => !key.startsWith('_'));
        const extraFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
        if (extraFields.length > 0 && schema._allowExtraFields !== true) {
          // Log warning but don't fail - just ignore extra fields
          console.warn(`Request contains extra fields: ${extraFields.join(', ')}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors
        });
      }

      // Replace request body with sanitized version
      req.body = { ...req.body, ...sanitizedBody };
      next();
    } catch (error) {
      console.error('Request validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Request validation failed'
      });
    }
  };
};

/**
 * Validate request body size
 * @param {number} maxSize - Maximum size in bytes (default: 1MB)
 * @returns {Function} Express middleware
 */
const validateBodySize = (maxSize = 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: `Request body too large. Maximum size is ${Math.round(maxSize / 1024)}KB`
      });
    }

    next();
  };
};

/**
 * Validate query parameters
 * @param {Object} schema - Validation schema for query params
 * @returns {Function} Express middleware
 */
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const [paramName, paramSchema] of Object.entries(schema)) {
        const value = req.query[paramName];
        const { required = false, type = 'string', maxLength = 255 } = paramSchema;

        if (required && (value === undefined || value === null || value === '')) {
          errors.push({
            param: paramName,
            message: `Query parameter ${paramName} is required`
          });
          continue;
        }

        if (value !== undefined && value !== null && value !== '') {
          if (type === 'string' && typeof value !== 'string') {
            errors.push({
              param: paramName,
              message: `${paramName} must be a string`
            });
            continue;
          }

          if (type === 'salesforceId' && !isValidSalesforceId(value)) {
            errors.push({
              param: paramName,
              message: `${paramName} must be a valid Salesforce ID`
            });
            continue;
          }

          if (type === 'string' && value.length > maxLength) {
            errors.push({
              param: paramName,
              message: `${paramName} exceeds maximum length of ${maxLength} characters`
            });
            continue;
          }

          // Security validation
          if (type === 'string') {
            const sqlValidation = validateForSqlInjection(value);
            if (!sqlValidation.isValid) {
              errors.push({
                param: paramName,
                message: `Security: ${sqlValidation.error}`
              });
              continue;
            }
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter validation failed',
          errors: errors
        });
      }

      next();
    } catch (error) {
      console.error('Query parameter validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Query parameter validation failed'
      });
    }
  };
};

/**
 * Validate URL parameters
 * @param {Object} schema - Validation schema for URL params
 * @returns {Function} Express middleware
 */
const validateUrlParams = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const [paramName, paramSchema] of Object.entries(schema)) {
        const value = req.params[paramName];
        const { required = true, type = 'string' } = paramSchema;

        if (required && (value === undefined || value === null || value === '')) {
          errors.push({
            param: paramName,
            message: `URL parameter ${paramName} is required`
          });
          continue;
        }

        if (value !== undefined && value !== null && value !== '') {
          if (type === 'salesforceId' && !isValidSalesforceId(value)) {
            errors.push({
              param: paramName,
              message: `${paramName} must be a valid Salesforce ID (15 or 18 characters)`
            });
            continue;
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'URL parameter validation failed',
          errors: errors
        });
      }

      next();
    } catch (error) {
      console.error('URL parameter validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'URL parameter validation failed'
      });
    }
  };
};

module.exports = {
  validateRequestBody,
  validateBodySize,
  validateQueryParams,
  validateUrlParams
};
