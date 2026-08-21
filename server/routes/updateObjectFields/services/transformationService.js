// Service for applying transformations to field values

const { applyTransformation } = require('../utils');

/**
 * Apply transformation to a value based on mapping configuration
 */
const applyMappingTransformation = (sourceRecord, mapping) => {
  let transformedValue = null;

  if (mapping.transformation === 'concatenate') {
    const concatenateFields = Array.isArray(mapping.concatenateFields) ? mapping.concatenateFields : [];
    if (concatenateFields.length === 0) {
      transformedValue = null;
    } else {
      // Determine field order
      let orderedFields = concatenateFields;
      if (mapping.fieldOrder && typeof mapping.fieldOrder === 'string' && mapping.fieldOrder.trim()) {
        // Parse field order from text (supports newlines, commas, or braces)
        const orderText = mapping.fieldOrder.trim();
        const orderFields = orderText
          .split(/[,\n\r]+/)
          .map(f => f.trim())
          .map(f => f.replace(/^\{|\}$/g, '')) // Remove braces if present
          .filter(f => f && concatenateFields.includes(f)); // Only include fields that are selected
        
        // If we have valid ordered fields, use them; otherwise fall back to original order
        if (orderFields.length > 0) {
          // Add any missing fields at the end
          const missingFields = concatenateFields.filter(f => !orderFields.includes(f));
          orderedFields = [...orderFields, ...missingFields];
        }
      }
      
      const values = orderedFields
        .map(field => {
          if (!field || typeof field !== 'string') return null;
          return sourceRecord && sourceRecord[field] !== undefined ? sourceRecord[field] : null;
        })
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => String(v));
      transformedValue = values.length > 0 ? values.join(mapping.separator || ' ') : null;
    }
  } else if (mapping.transformation === 'valueMap') {
    const sourceValue = sourceRecord[mapping.sourceField];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      const sourceValueStr = String(sourceValue);
      const valueMappings = Array.isArray(mapping.valueMappings) ? mapping.valueMappings : [];
      const matchedMapping = valueMappings.find(vm => {
        const fromValue = String(vm.from || '').trim();
        return fromValue === sourceValueStr || fromValue === String(sourceValue).trim();
      });
      if (matchedMapping) {
        const toValue = matchedMapping.to;
        if (toValue === 'true' || toValue === 'True' || toValue === 'TRUE') {
          transformedValue = true;
        } else if (toValue === 'false' || toValue === 'False' || toValue === 'FALSE') {
          transformedValue = false;
        } else if (!isNaN(toValue) && toValue !== '') {
          transformedValue = parseFloat(toValue);
        } else {
          transformedValue = toValue;
        }
      } else {
        transformedValue = sourceValue;
      }
    } else {
      transformedValue = null;
    }
  } else if (mapping.transformation === 'conditional') {
    // Enhanced conditional logic with multiple conditions
    let allConditionsMet = false;
    
    const evaluateCondition = (condition) => {
      let conditionFieldValue = sourceRecord[condition.field];
      if (conditionFieldValue === undefined) {
        const fieldKey = Object.keys(sourceRecord).find(key => 
          key.toLowerCase() === condition.field.toLowerCase()
        );
        if (fieldKey) {
          conditionFieldValue = sourceRecord[fieldKey];
        } else {
          return false;
        }
      }
      
      const operator = condition.operator || 'equals';
      const conditionValue = condition.value || '';
      
      if (operator === 'isEmpty') {
        return conditionFieldValue === '' || conditionFieldValue === null || conditionFieldValue === undefined;
      }
      if (operator === 'isNotEmpty') {
        return conditionFieldValue !== '' && conditionFieldValue !== null && conditionFieldValue !== undefined;
      }
      if (operator === 'isNull') {
        return conditionFieldValue === null || conditionFieldValue === undefined;
      }
      if (operator === 'isNotNull') {
        return conditionFieldValue !== null && conditionFieldValue !== undefined;
      }
      
      if (conditionFieldValue === null || conditionFieldValue === undefined) {
        return false;
      }
      
      const conditionFieldStr = String(conditionFieldValue);
      const conditionValueStr = String(conditionValue);
      
      switch (operator) {
        case 'equals':
          return conditionFieldStr === conditionValueStr || conditionFieldStr.trim() === conditionValueStr.trim();
        case 'notEquals':
          return conditionFieldStr !== conditionValueStr && conditionFieldStr.trim() !== conditionValueStr.trim();
        case 'contains':
          return conditionFieldStr.toLowerCase().includes(conditionValueStr.toLowerCase());
        case 'startsWith':
          return conditionFieldStr.toLowerCase().startsWith(conditionValueStr.toLowerCase());
        case 'endsWith':
          return conditionFieldStr.toLowerCase().endsWith(conditionValueStr.toLowerCase());
        case 'greaterThan':
          const num1 = parseFloat(conditionFieldStr);
          const num2 = parseFloat(conditionValueStr);
          return !isNaN(num1) && !isNaN(num2) && num1 > num2;
        case 'lessThan':
          const num3 = parseFloat(conditionFieldStr);
          const num4 = parseFloat(conditionValueStr);
          return !isNaN(num3) && !isNaN(num4) && num3 < num4;
        case 'greaterThanOrEqual':
          const num5 = parseFloat(conditionFieldStr);
          const num6 = parseFloat(conditionValueStr);
          return !isNaN(num5) && !isNaN(num6) && num5 >= num6;
        case 'lessThanOrEqual':
          const num7 = parseFloat(conditionFieldStr);
          const num8 = parseFloat(conditionValueStr);
          return !isNaN(num7) && !isNaN(num8) && num7 <= num8;
        default:
          return conditionFieldStr === conditionValueStr;
      }
    };
    
    if (mapping.conditions && Array.isArray(mapping.conditions) && mapping.conditions.length > 0) {
      let result = evaluateCondition(mapping.conditions[0]);
      for (let i = 1; i < mapping.conditions.length; i++) {
        const condition = mapping.conditions[i];
        const conditionResult = evaluateCondition(condition);
        const logicalOp = condition.logicalOperator || 'AND';
        if (logicalOp === 'AND') {
          result = result && conditionResult;
        } else if (logicalOp === 'OR') {
          result = result || conditionResult;
        }
      }
      allConditionsMet = result;
    } else {
      // Legacy single condition
      let conditionFieldValue = sourceRecord[mapping.conditionField];
      if (conditionFieldValue === undefined) {
        const fieldKey = Object.keys(sourceRecord).find(key => 
          key.toLowerCase() === mapping.conditionField.toLowerCase()
        );
        if (fieldKey) {
          conditionFieldValue = sourceRecord[fieldKey];
        }
      }
      
      if (conditionFieldValue !== null && conditionFieldValue !== undefined) {
        const conditionValue = mapping.conditionValue;
        const operator = mapping.conditionOperator || 'equals';
        const conditionFieldStr = String(conditionFieldValue);
        const conditionValueStr = String(conditionValue);
        
        switch (operator) {
          case 'equals':
            allConditionsMet = conditionFieldStr === conditionValueStr || conditionFieldStr.trim() === conditionValueStr.trim();
            break;
          case 'notEquals':
            allConditionsMet = conditionFieldStr !== conditionValueStr && conditionFieldStr.trim() !== conditionValueStr.trim();
            break;
          case 'contains':
            allConditionsMet = conditionFieldStr.toLowerCase().includes(conditionValueStr.toLowerCase());
            break;
          case 'greaterThan':
            const num1 = parseFloat(conditionFieldStr);
            const num2 = parseFloat(conditionValueStr);
            allConditionsMet = !isNaN(num1) && !isNaN(num2) && num1 > num2;
            break;
          case 'lessThan':
            const num3 = parseFloat(conditionFieldStr);
            const num4 = parseFloat(conditionValueStr);
            allConditionsMet = !isNaN(num3) && !isNaN(num4) && num3 < num4;
            break;
          default:
            allConditionsMet = conditionFieldStr === conditionValueStr;
        }
      } else {
        allConditionsMet = false;
      }
    }
    
    if (allConditionsMet) {
      const thenValue = mapping.thenValue;
      if (thenValue === 'true' || thenValue === 'True' || thenValue === 'TRUE') {
        transformedValue = true;
      } else if (thenValue === 'false' || thenValue === 'False' || thenValue === 'FALSE') {
        transformedValue = false;
      } else if (!isNaN(thenValue) && thenValue !== '') {
        transformedValue = parseFloat(thenValue);
      } else {
        transformedValue = thenValue;
      }
    } else {
      if (mapping.elseValue !== undefined && mapping.elseValue !== null && mapping.elseValue !== '') {
        const elseValue = mapping.elseValue;
        if (elseValue === 'true' || elseValue === 'True' || elseValue === 'TRUE') {
          transformedValue = true;
        } else if (elseValue === 'false' || elseValue === 'False' || elseValue === 'FALSE') {
          transformedValue = false;
        } else if (!isNaN(elseValue) && elseValue !== '') {
          transformedValue = parseFloat(elseValue);
        } else {
          transformedValue = elseValue;
        }
      } else {
        transformedValue = null;
      }
    }
  } else if (mapping.transformation === 'textReplace') {
    const sourceValue = sourceRecord[mapping.sourceField];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      transformedValue = applyTransformation(sourceValue, 'textReplace', {
        findText: mapping.findText,
        replaceText: mapping.replaceText || '',
        replaceMode: mapping.replaceMode || 'all',
        caseSensitive: mapping.caseSensitive || false,
        useRegex: mapping.useRegex || false
      });
    } else {
      transformedValue = null;
    }
  } else if (mapping.transformation === 'defaultValue') {
    const sourceValue = sourceRecord[mapping.sourceField];
    const applyWhen = mapping.applyWhen || 'empty';
    let shouldApplyDefault = false;
    
    if (applyWhen === 'empty') {
      shouldApplyDefault = sourceValue === '' || sourceValue === null || sourceValue === undefined;
    } else if (applyWhen === 'null') {
      shouldApplyDefault = sourceValue === null || sourceValue === undefined;
    } else if (applyWhen === 'emptyOrNull') {
      shouldApplyDefault = sourceValue === '' || sourceValue === null || sourceValue === undefined;
    } else if (applyWhen === 'invalid') {
      shouldApplyDefault = sourceValue === null || sourceValue === undefined || sourceValue === '' || 
                           (typeof sourceValue === 'number' && isNaN(sourceValue));
    }
    
    if (shouldApplyDefault) {
      transformedValue = mapping.defaultValue !== undefined ? mapping.defaultValue : null;
    } else {
      transformedValue = sourceValue;
    }
  } else if (mapping.transformation === 'typeConversion') {
    const sourceValue = sourceRecord[mapping.sourceField];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      transformedValue = applyTransformation(sourceValue, 'typeConversion', {
        targetType: mapping.targetType || 'string',
        conversionFormat: mapping.conversionFormat
      });
    } else {
      transformedValue = null;
    }
  } else if (mapping.transformation === 'validateFormat') {
    const sourceValue = sourceRecord[mapping.sourceField];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      const validationType = mapping.validationType || 'email';
      const customPattern = mapping.customPattern || '';
      let isValid = false;
      
      try {
        if (validationType === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(String(sourceValue));
        } else if (validationType === 'phone') {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          isValid = phoneRegex.test(String(sourceValue)) && String(sourceValue).replace(/\D/g, '').length >= 10;
        } else if (validationType === 'url') {
          try {
            new URL(String(sourceValue));
            isValid = true;
          } catch {
            isValid = false;
          }
        } else if (validationType === 'postalCode') {
          const postalCodeRegex = /^[A-Z0-9\s\-]{3,10}$/i;
          isValid = postalCodeRegex.test(String(sourceValue));
        } else if (validationType === 'custom' && customPattern) {
          const regex = new RegExp(customPattern);
          isValid = regex.test(String(sourceValue));
        }
        
        if (isValid) {
          transformedValue = sourceValue;
        } else {
          const onInvalid = mapping.onInvalid || 'default';
          if (onInvalid === 'default') {
            transformedValue = mapping.defaultValue !== undefined ? mapping.defaultValue : null;
          } else if (onInvalid === 'skip') {
            transformedValue = null;
          } else {
            transformedValue = 'Error: Validation failed';
          }
        }
      } catch (error) {
        console.error('Error in validateFormat transformation:', error);
        transformedValue = mapping.onInvalid === 'error' ? 'Error: Validation error' : (mapping.defaultValue || null);
      }
    } else {
      transformedValue = null;
    }
  } else if (mapping.transformation === 'removeSpecialChars') {
    const sourceValue = sourceRecord[mapping.sourceField];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      transformedValue = applyTransformation(sourceValue, 'removeSpecialChars', {
        removeMode: mapping.removeMode || 'removeAll'
      });
    } else {
      transformedValue = null;
    }
  } else if (mapping.transformation === 'switch') {
    const sourceValue = sourceRecord[mapping.sourceField];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      const sourceValueStr = String(sourceValue);
      const cases = Array.isArray(mapping.cases) ? mapping.cases : [];
      const matchedCase = cases.find(c => String(c.value || '').trim() === sourceValueStr.trim());
      
      if (matchedCase) {
        const targetValue = matchedCase.targetValue;
        if (targetValue === 'true' || targetValue === 'True' || targetValue === 'TRUE') {
          transformedValue = true;
        } else if (targetValue === 'false' || targetValue === 'False' || targetValue === 'FALSE') {
          transformedValue = false;
        } else if (!isNaN(targetValue) && targetValue !== '') {
          transformedValue = parseFloat(targetValue);
        } else {
          transformedValue = targetValue;
        }
      } else {
        if (mapping.switchDefaultValue !== undefined && mapping.switchDefaultValue !== null && mapping.switchDefaultValue !== '') {
          transformedValue = mapping.switchDefaultValue;
        } else {
          transformedValue = null;
        }
      }
    } else {
      transformedValue = null;
    }
  } else if (mapping.transformation === 'formula') {
    try {
      let formula = mapping.formula;
      const fieldMatches = formula.match(/\{([^}]+)\}/g);
      if (fieldMatches) {
        fieldMatches.forEach(match => {
          const fieldName = match.replace(/[{}]/g, '');
          const fieldValue = sourceRecord[fieldName];
          formula = formula.replace(match, fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '0');
        });
      }
      transformedValue = Function('"use strict"; return (' + formula + ')')();
    } catch (error) {
      console.error(`Error evaluating formula for ${mapping.targetField}:`, error);
      transformedValue = null;
    }
  } else {
    if (!mapping.sourceField) {
      console.warn(`Mapping for ${mapping.targetField} has no sourceField specified`);
      transformedValue = null;
    } else {
      const sourceValue = sourceRecord[mapping.sourceField];
      if (sourceValue === undefined) {
        const fieldKey = Object.keys(sourceRecord).find(key => 
          key.toLowerCase() === mapping.sourceField.toLowerCase()
        );
        if (fieldKey) {
          const caseInsensitiveValue = sourceRecord[fieldKey];
          transformedValue = applyTransformation(caseInsensitiveValue, mapping.transformation, {
            dateFormat: mapping.dateFormat,
            numberFormat: mapping.numberFormat
          });
        } else {
          console.warn(`Source field ${mapping.sourceField} not found in source record`);
          transformedValue = null;
        }
      } else {
        transformedValue = applyTransformation(sourceValue, mapping.transformation, {
          dateFormat: mapping.dateFormat,
          numberFormat: mapping.numberFormat
        });
      }
    }
  }
  
  return transformedValue;
};

/**
 * Extract source fields needed from mappings
 */
const extractSourceFields = (mappings) => {
  return [...new Set((mappings.map(m => {
    if (!m) return [];
    if (m.transformation === 'concatenate') {
      return Array.isArray(m.concatenateFields) ? m.concatenateFields : [];
    } else if (m.transformation === 'formula') {
      const fieldMatches = (m.formula || '').match(/\{([^}]+)\}/g);
      if (fieldMatches) {
        return fieldMatches.map(match => match.replace(/[{}]/g, ''));
      }
      return [];
    } else if (m.transformation === 'valueMap') {
      return m.sourceField ? [m.sourceField] : [];
    } else if (m.transformation === 'conditional') {
      if (m.conditions && Array.isArray(m.conditions) && m.conditions.length > 0) {
        return m.conditions.map(c => c.field).filter(f => f);
      } else {
        return m.conditionField ? [m.conditionField] : [];
      }
    } else if (['textReplace', 'defaultValue', 'typeConversion', 'validateFormat', 'removeSpecialChars', 'switch'].includes(m.transformation)) {
      return m.sourceField ? [m.sourceField] : [];
    } else {
      return m.sourceField ? [m.sourceField] : [];
    }
  }).flat() || []).filter(field => field && typeof field === 'string' && field.trim() !== ''))];
};

/**
 * Match source and target records based on object types
 */
const matchSourceTargetRecords = (sourceRecords, targetRecord, sourceObject, targetObject) => {
  if (sourceObject !== targetObject) {
    if (sourceObject.toLowerCase() === 'project' && targetObject.toLowerCase() === 'project objective') {
      if (targetRecord.Project__c) {
        return sourceRecords.find(s => s.Id === targetRecord.Project__c);
      }
    } else if (sourceObject.toLowerCase() === 'project objective' && targetObject.toLowerCase() === 'project') {
      return sourceRecords.find(s => s.Project__c === targetRecord.Id);
    } else if (sourceObject.toLowerCase() === 'project' && targetObject.toLowerCase() === 'contributor project') {
      if (targetRecord.Project__c) {
        return sourceRecords.find(s => s.Id === targetRecord.Project__c);
      }
    } else if (sourceObject.toLowerCase() === 'contributor project' && targetObject.toLowerCase() === 'project') {
      return sourceRecords.find(s => s.Project__c === targetRecord.Id);
    } else if (sourceObject.toLowerCase() === 'project objective' && targetObject.toLowerCase() === 'contributor project') {
      if (targetRecord.Project_Objective__c) {
        return sourceRecords.find(s => s.Id === targetRecord.Project_Objective__c);
      }
    } else if (sourceObject.toLowerCase() === 'contributor project' && targetObject.toLowerCase() === 'project objective') {
      if (targetRecord.Project__c) {
        const projectId = targetRecord.Project__c;
        return sourceRecords.find(s => s.Project__c === projectId && s.Id === targetRecord.Id) ||
               sourceRecords.find(s => s.Project__c === projectId);
      }
    } else if (targetRecord.Project__c) {
      return sourceRecords.find(s => s.Project__c === targetRecord.Project__c || s.Id === targetRecord.Project__c);
    }
    
    if (sourceRecords.length > 0) {
      return sourceRecords[0];
    }
  } else {
    return sourceRecords.find(s => s.Id === targetRecord.Id);
  }
  
  return null;
};

module.exports = {
  applyMappingTransformation,
  extractSourceFields,
  matchSourceTargetRecords
};

