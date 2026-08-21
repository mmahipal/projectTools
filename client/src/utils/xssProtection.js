/**
 * XSS Protection Utilities
 * Provides functions for client-side XSS protection and output encoding
 * 
 * IMPORTANT: Always use these utilities when rendering user-generated content
 */

import { escapeHtml, escapeHtmlAttribute, containsXss } from './security';

/**
 * Safely renders text content, escaping HTML entities
 * Use this when rendering user input as text content
 * 
 * @param {string} text - Text to render safely
 * @returns {string} - HTML-escaped text
 * 
 * @example
 * // ✅ DO: Use escapeHtml for text content
 * <div>{escapeHtml(userInput)}</div>
 * 
 * // ❌ DON'T: Directly render user input
 * <div>{userInput}</div>
 */
export const safeText = escapeHtml;

/**
 * Safely renders HTML attribute values
 * Use this when setting HTML attributes from user input
 * 
 * @param {string} value - Attribute value to escape
 * @returns {string} - HTML-attribute-escaped value
 * 
 * @example
 * // ✅ DO: Use escapeHtmlAttribute for attributes
 * <input value={escapeHtmlAttribute(userInput)} />
 * <div title={escapeHtmlAttribute(userInput)}>Content</div>
 * 
 * // ❌ DON'T: Directly use user input in attributes
 * <input value={userInput} />
 */
export const safeAttribute = escapeHtmlAttribute;

/**
 * React component wrapper for safely rendering text
 * Automatically escapes HTML entities
 * 
 * @param {object} props - Component props
 * @param {string} props.children - Text content to render safely
 * @returns {JSX.Element} - Safely rendered text
 * 
 * @example
 * <SafeText>{userInput}</SafeText>
 */
export const SafeText = ({ children, ...props }) => {
  if (children === null || children === undefined) {
    return null;
  }
  
  const text = typeof children === 'string' ? children : String(children);
  // Use textContent to safely render - React will automatically escape
  // But we also escape manually for extra safety
  const escaped = escapeHtml(text);
  return <span {...props}>{escaped}</span>;
};

/**
 * Validates input before form submission
 * Shows user-friendly error messages
 * 
 * @param {string} input - Input to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateInputForXss = (input, fieldName = 'This field') => {
  if (!input || typeof input !== 'string') {
    return { isValid: true, error: '' };
  }
  
  if (containsXss(input)) {
    return {
      isValid: false,
      error: `${fieldName} contains potentially dangerous content. Please remove any HTML tags, scripts, or JavaScript code.`
    };
  }
  
  return { isValid: true, error: '' };
};

/**
 * Sanitizes input in real-time as user types
 * Useful for input fields that should not allow HTML
 * 
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInputRealTime = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Remove HTML tags immediately
  let sanitized = input.replace(/<[^>]+>/g, '');
  
  // Remove dangerous protocols
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized;
};

/**
 * Hook for React components to safely handle user input
 * Provides validation and sanitization
 * Note: Requires React to be imported in the component using this hook
 * 
 * @param {string} initialValue - Initial input value
 * @returns {object} - { value, setValue, isValid, error, sanitized }
 */
export const useSafeInput = (initialValue = '') => {
  // Note: This hook requires React.useState
  // Components should import React and use this hook directly
  // This is a utility function, not a standalone hook
  throw new Error('useSafeInput requires React. Import React in your component and implement the hook there, or use validateInputForXss and sanitizeInputRealTime directly.');
};

export default {
  safeText,
  safeAttribute,
  SafeText,
  validateInputForXss,
  sanitizeInputRealTime,
  useSafeInput
};

