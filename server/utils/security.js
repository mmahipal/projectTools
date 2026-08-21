/**
 * Server-side security utilities
 * Provides comprehensive functions for input sanitization, SQL injection protection, and security checks
 */

/**
 * Detects SQL injection patterns in input
 * Uses context-aware detection to reduce false positives
 * @param {string} input - Input string to check
 * @returns {boolean} - True if potentially dangerous SQL pattern detected
 */
const containsSqlInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  // Context-aware SQL injection patterns - only flag actual injection attempts
  // Not just the presence of SQL keywords (which can be legitimate business terms)
  const sqlPatterns = [
    // SQL injection with quotes and operators (actual injection attempts)
    /('|(\\'))\s*(OR|AND|UNION)\s*(\d+|'[^']*'|true|false)/gi,
    /('|(\\'))\s*;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)/gi,
    // Comment-based injection attempts
    /(--|\#|\/\*).*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)/gi,
    // Stacked queries (semicolon followed by SQL command)
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)/gi,
    // Encoded SQL injection attempts
    /((\%27)|(\'))\s*((\%6F)|o|(\%4F))\s*((\%72)|r|(\%52))\s*(\d+|'|")/gi, // 'or' with value
    /((\%27)|(\'))\s*((\%55)|u|(\%75))\s*((\%4E)|n|(\%6E))\s*((\%49)|i|(\%69))\s*((\%4F)|o|(\%6F))\s*((\%4E)|n|(\%6E))\s*(SELECT|INSERT)/gi, // 'union' with command
    // Time-based SQL injection
    /(WAITFOR|DELAY|SLEEP|BENCHMARK)\s*\(/gi,
    // Boolean-based blind SQL injection with operators
    /(\d+\s*=\s*\d+\s*OR|\d+\s*OR\s*\d+\s*=|'\s*OR\s*'|'\s*AND\s*')/gi,
    // SQL functions in injection context
    /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\s+.*\s+(FROM|INTO|WHERE|SET|VALUES)/gi,
  ];
  
  // Check for patterns that indicate actual SQL injection attempts
  // Not just isolated SQL keywords (which can be legitimate)
  const hasInjectionPattern = sqlPatterns.some(pattern => pattern.test(input));
  
  // Additional check: if input contains SQL keywords but in a suspicious context
  // (e.g., with quotes, semicolons, or operators that suggest injection)
  const suspiciousContext = /['";].*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)/gi.test(input) ||
                            /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION).*['";]/gi.test(input);
  
  return hasInjectionPattern || suspiciousContext;
};

/**
 * Escapes special characters for use in SOQL queries
 * Note: jsforce should handle this, but this provides an extra layer of protection
 * @param {string} input - Input string to escape
 * @returns {string} - Escaped string
 */
const escapeSoql = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Escape single quotes for SOQL (double them: ' becomes '')
  // This is the correct SOQL escaping method
  return input.replace(/'/g, "''");
};

/**
 * Detects XSS (Cross-Site Scripting) patterns in input
 * @param {string} input - Input string to check
 * @returns {boolean} - True if potentially dangerous XSS pattern detected
 */
const containsXss = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const xssPatterns = [
    // Script tags and variations
    /<script[^>]*>.*?<\/script>/gi,
    /<script/gi,
    /<\/script>/gi,
    // Event handlers
    /on\w+\s*=/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    // Dangerous tags
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<iframe/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<object/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<embed/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<style[^>]*>.*?<\/style>/gi,
    /<style/gi,
    // Dangerous protocols
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:image\/svg\+xml/gi,
    // Encoded XSS attempts
    /&#x3C;script/gi,
    /&#60;script/gi,
    /%3Cscript/gi,
    /%3C%2Fscript/gi,
    // Expression injection
    /expression\s*\(/gi,
    // CSS injection
    /@import/gi,
    // SVG XSS
    /<svg[^>]*>.*?<\/svg>/gi,
    /<svg/gi,
    // Image with malicious src
    /<img[^>]+src[^>]*=.*javascript:/gi,
    /<img[^>]+onerror/gi,
    // Link with malicious href
    /<a[^>]+href[^>]*=.*javascript:/gi,
    // Form injection
    /<form[^>]*>.*?<\/form>/gi,
    /<form/gi,
    // Input injection
    /<input[^>]*>.*?<\/input>/gi,
    /<input/gi,
    // Meta refresh
    /<meta[^>]*http-equiv[^>]*refresh/gi,
    // Base tag
    /<base[^>]*>/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Escapes HTML entities to prevent XSS when rendering user input
 * @param {string} input - Input string to escape
 * @returns {string} - HTML-escaped string
 */
const escapeHtml = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return input.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
};

/**
 * Escapes HTML attributes to prevent XSS in attribute values
 * @param {string} input - Input string to escape
 * @returns {string} - Attribute-escaped string
 */
const escapeHtmlAttribute = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Escape quotes and other dangerous characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Sanitizes string input to prevent XSS, SQL injection, and other attacks
 * @param {string} input - Input string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, options = {}) => {
  if (!input || typeof input !== 'string') return input;
  
  const { 
    allowHtml = false, 
    maxLength = 10000,
    strict = false 
  } = options;
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Check for SQL injection patterns (strict mode)
  if (strict && containsSqlInjection(sanitized)) {
    throw new Error('Potentially dangerous SQL injection pattern detected');
  }
  
  // Check for XSS patterns (strict mode)
  if (strict && containsXss(sanitized)) {
    throw new Error('Potentially dangerous XSS pattern detected');
  }
  
  // Remove potentially dangerous XSS patterns
  sanitized = sanitized
    // Remove script tags and content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    // Remove object and embed tags
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
    // Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/data:image\/svg\+xml/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .replace(/onmouseover\s*=/gi, '')
    // Remove expression injection
    .replace(/expression\s*\(/gi, '')
    // Remove CSS import
    .replace(/@import/gi, '')
    // Remove SVG tags
    .replace(/<svg[^>]*>.*?<\/svg>/gi, '')
    .replace(/<svg[^>]*>/gi, '')
    // Remove form tags
    .replace(/<form[^>]*>.*?<\/form>/gi, '')
    .replace(/<form[^>]*>/gi, '')
    // Remove input tags
    .replace(/<input[^>]*>/gi, '')
    // Remove meta refresh
    .replace(/<meta[^>]*http-equiv[^>]*refresh[^>]*>/gi, '')
    // Remove base tag
    .replace(/<base[^>]*>/gi, '')
    // Remove encoded XSS attempts
    .replace(/&#x3C;script/gi, '')
    .replace(/&#60;script/gi, '')
    .replace(/%3Cscript/gi, '')
    .replace(/%3C%2Fscript/gi, '');
  
  // If HTML is not allowed, remove all HTML tags
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]+>/g, '');
  }
  
  // Limit length to prevent DoS
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
};

/**
 * Validates input length
 * @param {string} input - Input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidLength = (input, maxLength) => {
  if (!input) return true;
  return input.length <= maxLength;
};

/**
 * Validates that input is a valid Salesforce ID (15 or 18 characters, alphanumeric)
 * @param {string} input - Input to validate
 * @returns {boolean} - True if valid Salesforce ID, false otherwise
 */
const isValidSalesforceId = (input) => {
  if (!input || typeof input !== 'string') return false;
  const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
  return salesforceIdPattern.test(input.trim());
};

/**
 * Sanitizes search term for SOQL LIKE queries
 * @param {string} searchTerm - Search term to sanitize
 * @returns {string} - Sanitized search term
 */
const sanitizeSearchTerm = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') return '';
  
  // Remove potentially dangerous characters
  let sanitized = searchTerm
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\0/g, '') // Remove null bytes
    .trim();
  
  // Limit length to prevent DoS
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  // Escape single quotes for SOQL
  return escapeSoql(sanitized);
};

/**
 * Validates and sanitizes search term for SOQL LIKE queries
 * Returns null if search term is invalid (empty or just quotes)
 * @param {string} searchTerm - Search term to validate and sanitize
 * @returns {string|null} - Sanitized search term or null if invalid
 */
const validateAndSanitizeSearchTerm = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') return null;
  
  const trimmed = searchTerm.trim();
  
  // Skip search if term is empty or just quotes (to avoid SOQL parsing issues)
  if (!trimmed || trimmed === "'" || trimmed === "''") {
    return null;
  }
  
  // Sanitize and escape the search term
  return sanitizeSearchTerm(trimmed);
};

/**
 * Validates and sanitizes input
 * @param {string} input - Input to validate and sanitize
 * @param {object} options - Validation options
 * @returns {object} - { isValid: boolean, sanitized: string, error: string }
 */
const validateAndSanitize = (input, options = {}) => {
  const {
    maxLength = 1000,
    required = false,
    allowEmpty = true,
    type = 'string'
  } = options;
  
  // Handle empty input
  if (!input || (typeof input === 'string' && input.trim() === '')) {
    if (required) {
      return { isValid: false, sanitized: '', error: 'This field is required' };
    }
    if (allowEmpty) {
      return { isValid: true, sanitized: '', error: '' };
    }
  }
  
  // Type validation
  if (type === 'salesforceId' && !isValidSalesforceId(input)) {
    return { isValid: false, sanitized: '', error: 'Invalid Salesforce ID format' };
  }
  
  // Length validation
  if (!isValidLength(input, maxLength)) {
    return { isValid: false, sanitized: '', error: `Input exceeds maximum length of ${maxLength} characters` };
  }
  
  // Sanitize
  const sanitized = sanitizeString(input);
  
  return { isValid: true, sanitized, error: '' };
};

/**
 * Recursively sanitizes an object or array, applying sanitization to all string values
 * @param {any} data - Data to sanitize (object, array, or primitive)
 * @param {object} options - Sanitization options
 * @returns {any} - Sanitized data
 */
const sanitizeObject = (data, options = {}) => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return sanitizeString(data, options);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeObject(item, options));
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeString(key, options);
        sanitized[sanitizedKey] = sanitizeObject(data[key], options);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Validates input for SQL injection patterns
 * @param {any} input - Input to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
const validateForSqlInjection = (input) => {
  if (input === null || input === undefined) {
    return { isValid: true, error: '' };
  }
  
  if (typeof input === 'string') {
    if (containsSqlInjection(input)) {
      return { 
        isValid: false, 
        error: 'Input contains potentially dangerous SQL injection patterns' 
      };
    }
  } else if (Array.isArray(input)) {
    for (const item of input) {
      const result = validateForSqlInjection(item);
      if (!result.isValid) {
        return result;
      }
    }
  } else if (typeof input === 'object') {
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Check key
        const keyResult = validateForSqlInjection(key);
        if (!keyResult.isValid) {
          return keyResult;
        }
        // Check value
        const valueResult = validateForSqlInjection(input[key]);
        if (!valueResult.isValid) {
          return valueResult;
        }
      }
    }
  }
  
  return { isValid: true, error: '' };
};

/**
 * Validates input for XSS patterns
 * @param {any} input - Input to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
const validateForXss = (input) => {
  if (input === null || input === undefined) {
    return { isValid: true, error: '' };
  }
  
  if (typeof input === 'string') {
    if (containsXss(input)) {
      return { 
        isValid: false, 
        error: 'Input contains potentially dangerous XSS patterns' 
      };
    }
  } else if (Array.isArray(input)) {
    for (const item of input) {
      const result = validateForXss(item);
      if (!result.isValid) {
        return result;
      }
    }
  } else if (typeof input === 'object') {
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Check key
        const keyResult = validateForXss(key);
        if (!keyResult.isValid) {
          return keyResult;
        }
        // Check value
        const valueResult = validateForXss(input[key]);
        if (!valueResult.isValid) {
          return valueResult;
        }
      }
    }
  }
  
  return { isValid: true, error: '' };
};

module.exports = {
  escapeSoql,
  sanitizeString,
  isValidLength,
  isValidSalesforceId,
  sanitizeSearchTerm,
  validateAndSanitizeSearchTerm,
  validateAndSanitize,
  containsSqlInjection,
  containsXss,
  sanitizeObject,
  validateForSqlInjection,
  validateForXss,
  escapeHtml,
  escapeHtmlAttribute
};





















