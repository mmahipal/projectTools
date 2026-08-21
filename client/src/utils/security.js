/**
 * Security utilities
 * Provides functions for input sanitization and security checks
 */

/**
 * Sanitizes string input to prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript
 * @param {string} input - Input string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input, options = {}) => {
  if (!input || typeof input !== 'string') return input;
  
  const { 
    allowHtml = false, 
    maxLength = 10000,
    strict = false 
  } = options;
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
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
 * Sanitizes object recursively
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Escapes special characters for use in SQL queries
 * Note: This is a basic escape. Always use parameterized queries when possible.
 * @param {string} input - Input string to escape
 * @returns {string} - Escaped string
 */
export const escapeSql = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
};

/**
 * Validates input length
 * @param {string} input - Input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidLength = (input, maxLength) => {
  if (!input) return true;
  return input.length <= maxLength;
};

/**
 * Checks for SQL injection patterns
 * @param {string} input - Input to check
 * @returns {boolean} - True if potentially dangerous, false otherwise
 */
export const containsSqlInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(\+)|(\%))/gi,
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, // 'or'
    /((\%27)|(\'))((\%55)|u|(\%75))((\%4E)|n|(\%6E))((\%49)|i|(\%69))((\%4F)|o|(\%6F))((\%4E)|n|(\%6E))/gi, // 'union'
    /((\%27)|(\'))((\%4F)|o|(\%6F))((\%52)|r|(\%72))/gi, // 'or'
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Checks for XSS patterns
 * @param {string} input - Input to check
 * @returns {boolean} - True if potentially dangerous, false otherwise
 */
export const containsXss = (input) => {
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
export const escapeHtml = (input) => {
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
export const escapeHtmlAttribute = (input) => {
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
 * Validates input for security threats
 * @param {string} input - Input to validate
 * @returns {object} - { isSafe: boolean, threats: string[] }
 */
export const validateSecurity = (input) => {
  if (!input || typeof input !== 'string') {
    return { isSafe: true, threats: [] };
  }
  
  const threats = [];
  
  if (containsSqlInjection(input)) {
    threats.push('SQL_INJECTION');
  }
  
  if (containsXss(input)) {
    threats.push('XSS');
  }
  
  return {
    isSafe: threats.length === 0,
    threats
  };
};

/**
 * Validates input for XSS patterns before submission
 * @param {any} input - Input to validate (string, object, or array)
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateForXss = (input) => {
  if (input === null || input === undefined) {
    return { isValid: true, error: '' };
  }
  
  if (typeof input === 'string') {
    if (containsXss(input)) {
      return { 
        isValid: false, 
        error: 'Input contains potentially dangerous XSS patterns. Please remove any HTML tags or JavaScript code.' 
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

/**
 * Sanitizes and validates input for security
 * @param {string} input - Input to sanitize and validate
 * @returns {object} - { sanitized: string, isSafe: boolean, threats: string[] }
 */
export const sanitizeAndValidate = (input) => {
  const sanitized = sanitizeString(input);
  const security = validateSecurity(sanitized);
  
  return {
    sanitized,
    ...security
  };
};


