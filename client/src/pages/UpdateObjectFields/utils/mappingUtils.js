// Utility functions for field mapping operations

import { TRANSFORMATION_TYPES } from '../constants';

/**
 * Get the validation status of a mapping
 * @param {Object} mapping - The mapping object to validate
 * @returns {string} 'valid' or 'incomplete'
 */
export const getMappingStatus = (mapping) => {
  if (!mapping.targetField) return 'incomplete';
  
  if (mapping.transformation === TRANSFORMATION_TYPES.FORMULA) {
    return mapping.formula ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.CONCATENATE) {
    return (mapping.concatenateFields && mapping.concatenateFields.length > 0) ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.VALUE_MAP) {
    return (mapping.valueMappings && mapping.valueMappings.length > 0 && mapping.valueMappings.some(vm => vm.from && vm.to)) ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.CONDITIONAL) {
    if (mapping.conditions && Array.isArray(mapping.conditions) && mapping.conditions.length > 0) {
      const hasInvalidCondition = mapping.conditions.some(cond => {
        if (!cond.field) return true;
        const noValueOperators = ['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'];
        if (!noValueOperators.includes(cond.operator) && (!cond.value || cond.value === '')) return true;
        return false;
      });
      if (hasInvalidCondition || !mapping.thenValue || !mapping.elseValue) return 'incomplete';
      return 'valid';
    }
    return (!mapping.conditionField || !mapping.conditionValue || !mapping.thenValue) ? 'incomplete' : 'valid';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.SWITCH) {
    return (mapping.cases && mapping.cases.length > 0 && mapping.cases.some(c => c.value && c.targetValue)) ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.TEXT_REPLACE) {
    return mapping.findText ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.DEFAULT_VALUE) {
    return mapping.defaultValue ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.TYPE_CONVERSION) {
    return mapping.targetType ? 'valid' : 'incomplete';
  }
  if (mapping.transformation === TRANSFORMATION_TYPES.VALIDATE_FORMAT) {
    return mapping.validationType ? 'valid' : 'incomplete';
  }
  if ([TRANSFORMATION_TYPES.FORMULA, TRANSFORMATION_TYPES.DEFAULT_VALUE, TRANSFORMATION_TYPES.REMOVE_SPECIAL_CHARS].includes(mapping.transformation)) {
    return 'valid';
  }
  return mapping.sourceField ? 'valid' : 'incomplete';
};

/**
 * Get a summary text for a mapping (for display in hybrid view)
 * @param {Object} mapping - The mapping object
 * @param {Array} fields - Available target fields
 * @param {Array} sourceFields - Available source fields
 * @returns {string} Summary text
 */
export const getMappingSummary = (mapping, fields, sourceFields) => {
  const targetField = fields.find(f => f.name === mapping.targetField);
  const targetLabel = targetField ? targetField.label : mapping.targetField || 'Not selected';
  const transformName = mapping.transformation || 'Not selected';
  
  let sourceInfo = '';
  if (mapping.transformation === TRANSFORMATION_TYPES.FORMULA) {
    sourceInfo = mapping.formula ? `Formula: ${mapping.formula.substring(0, 30)}${mapping.formula.length > 30 ? '...' : ''}` : 'No formula';
  } else if (mapping.transformation === TRANSFORMATION_TYPES.CONCATENATE) {
    sourceInfo = mapping.concatenateFields && mapping.concatenateFields.length > 0 
      ? `${mapping.concatenateFields.length} field(s)` 
      : 'No fields';
  } else if (mapping.transformation === TRANSFORMATION_TYPES.CONDITIONAL) {
    if (mapping.conditions && Array.isArray(mapping.conditions) && mapping.conditions.length > 0) {
      sourceInfo = `${mapping.conditions.length} condition(s)`;
    } else {
      sourceInfo = mapping.conditionField ? `IF ${mapping.conditionField}` : 'No condition';
    }
  } else if (mapping.transformation === TRANSFORMATION_TYPES.VALUE_MAP) {
    sourceInfo = mapping.valueMappings && mapping.valueMappings.length > 0 
      ? `${mapping.valueMappings.length} mapping(s)` 
      : 'No mappings';
  } else if (mapping.transformation === TRANSFORMATION_TYPES.SWITCH) {
    sourceInfo = mapping.cases && mapping.cases.length > 0 
      ? `${mapping.cases.length} case(s)` 
      : 'No cases';
  } else {
    const sourceField = sourceFields.find(f => f.name === mapping.sourceField);
    sourceInfo = sourceField ? sourceField.label : (mapping.sourceField || 'Not selected');
  }
  
  return `${targetLabel} → ${transformName} → ${sourceInfo}`;
};

/**
 * Check if a transformation requires a source field
 * @param {string} transformation - The transformation type
 * @returns {boolean} True if source field is required
 */
export const requiresSourceField = (transformation) => {
  return ![
    TRANSFORMATION_TYPES.FORMULA,
    TRANSFORMATION_TYPES.CONCATENATE,
    TRANSFORMATION_TYPES.VALUE_MAP,
    TRANSFORMATION_TYPES.CONDITIONAL,
    TRANSFORMATION_TYPES.SWITCH,
    TRANSFORMATION_TYPES.DEFAULT_VALUE
  ].includes(transformation);
};

/**
 * Create a duplicate of a mapping
 * @param {Object} mapping - The mapping to duplicate
 * @returns {Object} New mapping with a new ID
 */
export const duplicateMapping = (mapping) => {
  return {
    ...JSON.parse(JSON.stringify(mapping)),
    id: Date.now()
  };
};

/**
 * Initialize a new mapping with default values
 * @param {Object} overrides - Values to override defaults
 * @returns {Object} New mapping object
 */
export const createNewMapping = (overrides = {}) => {
  return {
    id: Date.now(),
    targetField: '',
    sourceField: '',
    transformation: TRANSFORMATION_TYPES.COPY,
    formula: '',
    concatenateFields: [],
    separator: ' ',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: '0.00',
    valueMappings: [{ from: '', to: '' }],
    conditionField: '',
    conditionValue: '',
    conditionOperator: 'equals',
    thenValue: '',
    elseValue: '',
    conditions: [{ id: Date.now(), field: '', operator: 'equals', value: '', logicalOperator: 'AND' }],
    findText: '',
    replaceText: '',
    replaceMode: 'all',
    caseSensitive: false,
    useRegex: false,
    defaultValue: '',
    applyWhen: 'empty',
    targetType: 'string',
    conversionFormat: '',
    validationType: 'email',
    customPattern: '',
    onInvalid: 'default',
    removeMode: 'removeAll',
    cases: [{ value: '', targetValue: '' }],
    switchDefaultValue: '',
    errorHandling: 'default',
    ...overrides
  };
};

