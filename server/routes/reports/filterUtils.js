/**
 * Backend utility for processing advanced filter structures
 */

const { validateAndSanitizeSearchTerm } = require('../../utils/security');

/**
 * Build SOQL WHERE clause from filter structure
 * Supports both old simple format and new advanced format
 */
const buildSOQLWhereClause = (filters) => {
  if (!filters) {
    console.log('[FilterUtils] No filters provided');
    return '';
  }

  // Check if it's an advanced filter structure first
  // Advanced structure has 'groups' as an array OR has 'groupLogic' key (even if groups is invalid)
  // If it has 'groups' or 'groupLogic' keys, it's definitely an advanced structure, not field names
  const hasAdvancedKeys = filters.groups !== undefined || filters.groupLogic !== undefined;
  const isAdvancedStructure = hasAdvancedKeys && filters.groups && Array.isArray(filters.groups) && filters.groups.length > 0;
  
  console.log('[FilterUtils] Filter structure type:', isAdvancedStructure ? 'Advanced' : (hasAdvancedKeys ? 'Advanced (empty/invalid)' : 'Simple'));
  console.log('[FilterUtils] Filters object:', JSON.stringify(filters, null, 2));
  
  // If it has advanced structure keys but groups is not valid, return empty (don't treat keys as field names)
  if (hasAdvancedKeys && !isAdvancedStructure) {
    console.log('[FilterUtils] Advanced structure keys detected but groups is invalid/empty, returning empty WHERE clause');
    return '';
  }

  // Handle new advanced filter structure
  if (isAdvancedStructure) {
    console.log('[FilterUtils] Processing advanced filter structure with', filters.groups.length, 'groups');
    
    const conditions = filters.groups
      .map((group, groupIdx) => {
        if (!group.conditions || group.conditions.length === 0) {
          console.log(`[FilterUtils] Group ${groupIdx} has no conditions`);
          return null;
        }

        console.log(`[FilterUtils] Group ${groupIdx} has ${group.conditions.length} conditions`);
        
        const groupConditions = group.conditions
          .filter(c => {
            const isValid = c.field && c.operator && c.value !== '' && c.value !== null && c.value !== undefined;
            if (!isValid) {
              console.log(`[FilterUtils] Filtering out invalid condition:`, c);
            }
            return isValid;
          })
          .map((condition, condIdx) => {
            const clause = buildConditionClause(condition);
            console.log(`[FilterUtils] Group ${groupIdx}, Condition ${condIdx}:`, condition, '->', clause);
            return clause;
          })
          .filter(c => c !== null);

        if (groupConditions.length === 0) {
          console.log(`[FilterUtils] Group ${groupIdx} has no valid conditions after processing`);
          return null;
        }

        const logic = group.logic || 'AND';
        const result = `(${groupConditions.join(` ${logic} `)})`;
        console.log(`[FilterUtils] Group ${groupIdx} result:`, result);
        return result;
      })
      .filter(c => c !== null);

    if (conditions.length === 0) {
      console.log('[FilterUtils] No valid conditions found in any group');
      return '';
    }

    const groupLogic = filters.groupLogic || 'AND';
    const finalClause = conditions.join(` ${groupLogic} `);
    console.log('[FilterUtils] Final WHERE clause:', finalClause);
    return finalClause;
  }

  // Handle old simple filter format (backward compatibility)
  // Only process if it's NOT the advanced filter structure
  // Advanced filter structure has 'groups' and 'groupLogic' keys, which are NOT field names
  // If filters has 'groups' or 'groupLogic' keys, it's definitely an advanced structure (even if groups is empty)
  const hasAdvancedStructureKeys = filters.groups !== undefined || filters.groupLogic !== undefined;
  
  if (hasAdvancedStructureKeys) {
    // This is an advanced structure but groups might be empty or invalid
    // Return empty string if no valid groups were processed above
    console.log('[FilterUtils] Advanced structure detected but no valid conditions found');
    return '';
  }
  
  // Process old simple format only if it doesn't have advanced structure keys
  if (typeof filters === 'object' && !hasAdvancedStructureKeys) {
    const whereConditions = [];
    Object.entries(filters).forEach(([key, value]) => {
      // Skip internal filter structure keys (safety check)
      if (key === 'groups' || key === 'groupLogic') {
        return;
      }
      
      if (value && value !== '' && value !== '--None--') {
        if (Array.isArray(value) && value.length > 0) {
          const values = value.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
          whereConditions.push(`${key} IN (${values})`);
        } else {
          whereConditions.push(`${key} = '${String(value).replace(/'/g, "''")}'`);
        }
      }
    });

    if (whereConditions.length > 0) {
      return whereConditions.join(' AND ');
    }
  }

  return '';
};

/**
 * Build a single condition clause from a condition object
 */
const buildConditionClause = (condition) => {
  const { field, operator, value } = condition;
  
  if (!field || !operator || value === '' || value === null || value === undefined) {
    return null;
  }

  // Handle relationship fields - Salesforce supports filtering on relationship fields
  // e.g., Account__r.Name, Contact.Name, etc.
  // Relationship fields are already in the correct format for SOQL

  const escapedValue = (val, fieldName = null) => {
    // If field is a lookup/reference field (ends with __c) and value looks like a Salesforce ID, don't quote it
    if (fieldName && fieldName.endsWith('__c') && typeof val === 'string') {
      // Salesforce IDs are 15 or 18 characters (case-sensitive alphanumeric)
      if (/^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(val)) {
        return val; // Return ID without quotes
      }
    }
    
    // For relationship fields (contains . or __r.), always quote string values
    // Relationship fields like Account__r.Name should have quoted values
    const isRelationshipField = fieldName && (fieldName.includes('.') || fieldName.includes('__r.'));
    
    // For arrays (used in IN clauses), check each value
    if (Array.isArray(val)) {
      return val.map(v => escapedValue(v, fieldName));
    }
    
    if (typeof val === 'string') {
      // For relationship fields, always quote (unless it's an ID)
      if (isRelationshipField && /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(val)) {
        return val; // ID for relationship lookup
      }
      const sanitized = validateAndSanitizeSearchTerm(val);
      if (!sanitized) return "''"; // Return empty string if invalid
      return `'${sanitized}'`;
    }
    return val;
  };

  switch (operator) {
    case 'equals':
      const eqVal = escapedValue(value, field);
      return `${field} = ${Array.isArray(eqVal) ? eqVal[0] : eqVal}`;
    
    case 'not equals':
      const neVal = escapedValue(value, field);
      return `${field} != ${Array.isArray(neVal) ? neVal[0] : neVal}`;
    
    case 'contains':
      // For lookup fields, 'contains' doesn't make sense - use equals instead
      if (field.endsWith('__c') && /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(String(value))) {
        return `${field} = ${value}`;
      }
      const sanitizedContains = validateAndSanitizeSearchTerm(String(value));
      if (!sanitizedContains) return null; // Skip if invalid search term
      return `${field} LIKE '%${sanitizedContains}%'`;
    
    case 'not contains':
      // For lookup fields, 'not contains' doesn't make sense - use not equals instead
      if (field.endsWith('__c') && /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(String(value))) {
        return `${field} != ${value}`;
      }
      const sanitizedNotContains = validateAndSanitizeSearchTerm(String(value));
      if (!sanitizedNotContains) return null; // Skip if invalid search term
      return `NOT (${field} LIKE '%${sanitizedNotContains}%')`;
    
    case 'starts with':
      // For lookup fields, 'starts with' doesn't make sense - use equals instead
      if (field.endsWith('__c') && /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(String(value))) {
        return `${field} = ${value}`;
      }
      const sanitizedStarts = validateAndSanitizeSearchTerm(String(value));
      if (!sanitizedStarts) return null; // Skip if invalid search term
      return `${field} LIKE '${sanitizedStarts}%'`;
    
    case 'ends with':
      // For lookup fields, 'ends with' doesn't make sense - use equals instead
      if (field.endsWith('__c') && /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(String(value))) {
        return `${field} = ${value}`;
      }
      const sanitizedEnds = validateAndSanitizeSearchTerm(String(value));
      if (!sanitizedEnds) return null; // Skip if invalid search term
      return `${field} LIKE '%${sanitizedEnds}%'`;
    
    case 'greater than':
      const gtVal = escapedValue(value, field);
      return `${field} > ${Array.isArray(gtVal) ? gtVal[0] : gtVal}`;
    
    case 'less than':
      const ltVal = escapedValue(value, field);
      return `${field} < ${Array.isArray(ltVal) ? ltVal[0] : ltVal}`;
    
    case 'greater or equal':
      const gteVal = escapedValue(value, field);
      return `${field} >= ${Array.isArray(gteVal) ? gteVal[0] : gteVal}`;
    
    case 'less or equal':
      const lteVal = escapedValue(value, field);
      return `${field} <= ${Array.isArray(lteVal) ? lteVal[0] : lteVal}`;
    
    case 'between':
      if (value && typeof value === 'object' && value.from && value.to) {
        const fromVal = escapedValue(value.from, field);
        const toVal = escapedValue(value.to, field);
        return `${field} >= ${Array.isArray(fromVal) ? fromVal[0] : fromVal} AND ${field} <= ${Array.isArray(toVal) ? toVal[0] : toVal}`;
      }
      return null;
    
    case 'in':
      if (Array.isArray(value) && value.length > 0) {
        const values = value.map(v => {
          const escaped = escapedValue(v, field);
          return Array.isArray(escaped) ? escaped[0] : escaped;
        }).join(', ');
        return `${field} IN (${values})`;
      }
      return null;
    
    case 'not in':
      if (Array.isArray(value) && value.length > 0) {
        const values = value.map(v => {
          const escaped = escapedValue(v, field);
          return Array.isArray(escaped) ? escaped[0] : escaped;
        }).join(', ');
        return `${field} NOT IN (${values})`;
      }
      return null;
    
    default:
      return null;
  }
};

module.exports = {
  buildSOQLWhereClause,
  buildConditionClause
};

