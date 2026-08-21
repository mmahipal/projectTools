// Validation rules system for Update Object Fields
// Provides pre-update validation, field-level validation, and cross-field validation

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation rule types
const VALIDATION_TYPES = {
  FIELD_LEVEL: 'field_level',
  CROSS_FIELD: 'cross_field',
  PRE_UPDATE: 'pre_update'
};

// Field-level validation rules
const fieldLevelValidations = {
  // Example: Email field validation
  email: (value) => {
    if (!value) return { valid: true }; // Optional fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: emailRegex.test(value),
      error: emailRegex.test(value) ? null : 'Invalid email format'
    };
  },
  
  // Example: Phone field validation
  phone: (value) => {
    if (!value) return { valid: true };
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    return {
      valid: phoneRegex.test(value),
      error: phoneRegex.test(value) ? null : 'Invalid phone format'
    };
  },
  
  // Example: Required field validation
  required: (value) => {
    return {
      valid: value !== null && value !== undefined && value !== '',
      error: (value !== null && value !== undefined && value !== '') ? null : 'This field is required'
    };
  },
  
  // Example: Number range validation
  numberRange: (value, min, max) => {
    if (!value) return { valid: true };
    const num = parseFloat(value);
    return {
      valid: !isNaN(num) && num >= min && num <= max,
      error: (!isNaN(num) && num >= min && num <= max) ? null : `Value must be between ${min} and ${max}`
    };
  }
};

// Cross-field validation rules
const crossFieldValidations = {
  // Example: End date must be after start date
  dateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return { valid: true };
    const start = new Date(startDate);
    const end = new Date(endDate);
    return {
      valid: end >= start,
      error: end >= start ? null : 'End date must be after start date'
    };
  },
  
  // Example: Field A must be greater than Field B
  greaterThan: (fieldA, fieldB) => {
    if (!fieldA || !fieldB) return { valid: true };
    const a = parseFloat(fieldA);
    const b = parseFloat(fieldB);
    return {
      valid: !isNaN(a) && !isNaN(b) && a > b,
      error: (!isNaN(a) && !isNaN(b) && a > b) ? null : 'Field A must be greater than Field B'
    };
  }
};

/**
 * Validate a single field update
 * @param {Object} fieldUpdate - { fieldName, newValue, fieldType }
 * @param {Object} allFields - All fields being updated
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
const validateFieldUpdate = (fieldUpdate, allFields = {}) => {
  const errors = [];
  const { fieldName, newValue, fieldType } = fieldUpdate;
  
  // Field-level validations based on field type
  if (fieldType === 'email') {
    const result = fieldLevelValidations.email(newValue);
    if (!result.valid) errors.push(result.error);
  }
  
  if (fieldType === 'phone') {
    const result = fieldLevelValidations.phone(newValue);
    if (!result.valid) errors.push(result.error);
  }
  
  // Add more field-level validations as needed
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate cross-field relationships
 * @param {Object} fieldUpdates - Object with fieldName: newValue pairs
 * @param {Object} fieldMetadata - Field metadata from Salesforce
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
const validateCrossField = (fieldUpdates, fieldMetadata = {}) => {
  const errors = [];
  
  // Example: If Start_Date__c and End_Date__c are both being updated
  if (fieldUpdates.Start_Date__c && fieldUpdates.End_Date__c) {
    const result = crossFieldValidations.dateRange(
      fieldUpdates.Start_Date__c,
      fieldUpdates.End_Date__c
    );
    if (!result.valid) errors.push(result.error);
  }
  
  // Add more cross-field validations as needed
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Pre-update validation - checks before applying updates
 * @param {Object} updateConfig - Update configuration
 * @param {Object} currentRecords - Current record values from Salesforce
 * @returns {Object} { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
const validatePreUpdate = (updateConfig, currentRecords = []) => {
  const errors = [];
  const warnings = [];
  
  // Check if update would affect too many records
  if (currentRecords.length > 10000) {
    warnings.push(`This update will affect ${currentRecords.length} records. Consider using filters to reduce the scope.`);
  }
  
  // Check for critical fields
  const criticalFields = ['Status__c', 'OwnerId', 'AccountId'];
  if (updateConfig.fieldName && criticalFields.includes(updateConfig.fieldName)) {
    warnings.push(`Updating ${updateConfig.fieldName} is a critical operation. Approval may be required.`);
  }
  
  // Add more pre-update validations as needed
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Main validation function - combines all validation types
 * @param {Object} updateConfig - Update configuration
 * @param {Object} fieldMetadata - Field metadata
 * @param {Array} currentRecords - Current records
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
const validateUpdate = (updateConfig, fieldMetadata = {}, currentRecords = []) => {
  const allErrors = [];
  const allWarnings = [];
  
  // Pre-update validation
  const preUpdateResult = validatePreUpdate(updateConfig, currentRecords);
  allErrors.push(...preUpdateResult.errors);
  allWarnings.push(...preUpdateResult.warnings);
  
  // Field-level validation
  if (updateConfig.fieldName) {
    const fieldResult = validateFieldUpdate({
      fieldName: updateConfig.fieldName,
      newValue: updateConfig.newValue,
      fieldType: fieldMetadata[updateConfig.fieldName]?.type
    });
    allErrors.push(...fieldResult.errors);
  }
  
  // Cross-field validation (if multiple fields)
  if (updateConfig.fieldUpdates && Array.isArray(updateConfig.fieldUpdates)) {
    const fieldUpdatesObj = {};
    updateConfig.fieldUpdates.forEach(fu => {
      fieldUpdatesObj[fu.fieldName] = fu.newValue;
    });
    const crossFieldResult = validateCrossField(fieldUpdatesObj, fieldMetadata);
    allErrors.push(...crossFieldResult.errors);
  }
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

module.exports = {
  validateFieldUpdate,
  validateCrossField,
  validatePreUpdate,
  validateUpdate,
  VALIDATION_TYPES,
  fieldLevelValidations,
  crossFieldValidations
};

