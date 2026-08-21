/**
 * Input Sanitization Middleware
 * Sanitizes all user inputs to prevent SQL injection, XSS, and other attacks
 */

const { sanitizeObject, validateForSqlInjection, validateForXss } = require('../utils/security');

/**
 * Middleware to sanitize request body, query parameters, and route parameters
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Check if this is a preview endpoint - use less strict validation
    const isPreviewEndpoint = req.path.includes('/preview') || req.path.includes('/preview-object');
    
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      // For preview endpoints, use less strict validation (formData may contain legitimate SQL keywords)
      if (!isPreviewEndpoint) {
        // Validate for SQL injection first (only for non-preview endpoints)
        const sqlValidation = validateForSqlInjection(req.body);
        if (!sqlValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid input detected',
            message: sqlValidation.error
          });
        }
      }
      
      // Validate for XSS patterns (always check XSS)
      const xssValidation = validateForXss(req.body);
      if (!xssValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input detected',
          message: xssValidation.error
        });
      }
      
      // Sanitize the body (less strict for preview endpoints)
      req.body = sanitizeObject(req.body, { 
        strict: !isPreviewEndpoint, // Don't use strict mode for preview
        allowHtml: false 
      });
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      // Handle filters parameter specially - it's a JSON string that needs parsing
      let filtersParam = null;
      if (req.query.filters && typeof req.query.filters === 'string') {
        filtersParam = req.query.filters;
        // Temporarily remove filters from query for validation
        delete req.query.filters;
      }
      
      if (!isPreviewEndpoint) {
        const sqlValidation = validateForSqlInjection(req.query);
        if (!sqlValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid input detected',
            message: sqlValidation.error
          });
        }
      }
      
      const xssValidation = validateForXss(req.query);
      if (!xssValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input detected',
          message: xssValidation.error
        });
      }
      
      req.query = sanitizeObject(req.query, { strict: !isPreviewEndpoint });
      
      // Restore filters parameter (will be validated in route handler)
      if (filtersParam !== null) {
        req.query.filters = filtersParam;
      }
    }
    
    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      if (!isPreviewEndpoint) {
        const sqlValidation = validateForSqlInjection(req.params);
        if (!sqlValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid input detected',
            message: sqlValidation.error
          });
        }
      }
      
      const xssValidation = validateForXss(req.params);
      if (!xssValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input detected',
          message: xssValidation.error
        });
      }
      
      req.params = sanitizeObject(req.params, { strict: !isPreviewEndpoint });
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Input sanitization failed',
      message: error.message || 'Invalid input detected'
    });
  }
};

/**
 * Middleware specifically for search/filter inputs
 * More lenient for search terms but still secure
 */
const sanitizeSearchInput = (req, res, next) => {
  try {
    // Sanitize search-related fields
    if (req.query?.search || req.query?.q || req.query?.term) {
      const searchFields = ['search', 'q', 'term', 'filter', 'filters'];
      searchFields.forEach(field => {
        if (req.query[field]) {
          if (typeof req.query[field] === 'string') {
            // Use less strict validation for search (allow some special chars)
            const sanitized = sanitizeObject(req.query[field], { 
              strict: false,
              maxLength: 500 
            });
            req.query[field] = sanitized;
          } else if (typeof req.query[field] === 'object') {
            req.query[field] = sanitizeObject(req.query[field], { 
              strict: false,
              maxLength: 500 
            });
          }
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Search input sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Search input sanitization failed',
      message: error.message || 'Invalid search input'
    });
  }
};

module.exports = {
  sanitizeInput,
  sanitizeSearchInput
};

