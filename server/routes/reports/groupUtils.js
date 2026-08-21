/**
 * Utility functions for grouping report data
 */

/**
 * Group records by a specified field
 * @param {Array} records - Array of record objects
 * @param {String} groupByField - Field name to group by
 * @returns {Array} Grouped records with group headers
 */
const groupRecords = (records, groupByField) => {
  if (!groupByField || !records || records.length === 0) {
    return records;
  }

  // Helper function to extract display value from groupBy field
  const getGroupValue = (record, field) => {
    // First, check if the field is already flattened (relationship field like Account__r.Name)
    // Relationship fields are already flattened in the record, so use them directly
    if (record[field] !== undefined && record[field] !== null) {
      const value = record[field];
      // If it's already a string or number, use it directly
      if (typeof value !== 'object' || value instanceof Date) {
        return value !== null && value !== undefined ? String(value) : '(No Value)';
      }
    }
    
    const value = record[field];
    
    // Handle relationship fields (e.g., Account__r.Name) - check for nested object
    if (value && typeof value === 'object' && !Array.isArray(value) && value.Name) {
      return value.Name;
    }
    
    // If field is a relationship field (contains . or __r.), try to get the flattened value
    if (field.includes('.') || field.includes('__r.')) {
      // The field should already be flattened, but check if it exists
      if (record[field] !== undefined && record[field] !== null) {
        return String(record[field]);
      }
      // Try to find the nested value
      const parts = field.split('.');
      let currentValue = record;
      for (const part of parts) {
        if (currentValue && typeof currentValue === 'object' && currentValue[part] !== undefined) {
          currentValue = currentValue[part];
        } else {
          return '(No Value)';
        }
      }
      return currentValue !== null && currentValue !== undefined ? String(currentValue) : '(No Value)';
    }
    
    // If field is a lookup field (ends with __c), try to find the relationship Name field
    if (field.endsWith('__c') && !field.includes('__r')) {
      const baseField = field.replace('__c', '');
      // Try different relationship field patterns
      const possibleRelationshipFields = [
        `${baseField}__r.Name`,
        `${baseField}.Name`,
        `${baseField}__r.name`,
        `${baseField}.name`
      ];
      
      // Check for flattened relationship field
      for (const relField of possibleRelationshipFields) {
        if (record[relField] !== undefined && record[relField] !== null && record[relField] !== '') {
          return record[relField];
        }
      }
      
      // Check for nested relationship object
      const relObjKey = `${baseField}__r`;
      if (record[relObjKey] && typeof record[relObjKey] === 'object' && record[relObjKey].Name) {
        return record[relObjKey].Name;
      }
      
      // Also try without __r suffix
      if (record[baseField] && typeof record[baseField] === 'object' && record[baseField].Name) {
        return record[baseField].Name;
      }
      
      // If it's an ID (18 characters), try to find any matching relationship field
      if (typeof value === 'string' && value.length === 18) {
        const matchingRelField = Object.keys(record).find(k => {
          if (k === field || k.startsWith('_')) return false;
          const lowerK = k.toLowerCase();
          const lowerBase = baseField.toLowerCase();
          return (lowerK.includes(lowerBase) || lowerK.includes(lowerBase.replace('_', ''))) && 
                 (k.includes('Name') || k.includes('name'));
        });
        if (matchingRelField && record[matchingRelField]) {
          return record[matchingRelField];
        }
      }
    }
    
    // Handle direct values
    return value !== null && value !== undefined ? String(value) : '(No Value)';
  };

  // Group records by the specified field
  const groups = {};
  records.forEach(record => {
    const groupKey = getGroupValue(record, groupByField);
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(record);
  });

  // Convert groups to array with group headers
  const groupedRecords = [];
  const sortedGroupKeys = Object.keys(groups).sort();

  sortedGroupKeys.forEach(groupKey => {
    // Get the display value for the group header (use the relationship field if available)
    const firstRecord = groups[groupKey][0];
    const displayValue = getGroupValue(firstRecord, groupByField);
    
    // Add group header marker
    groupedRecords.push({
      _isGroupHeader: true,
      _groupKey: displayValue, // Use the display value (name) instead of ID
      _groupByField: groupByField,
      [groupByField]: displayValue // Store the display value for display
    });
    
    // Add records in this group
    groups[groupKey].forEach(record => {
      groupedRecords.push(record);
    });
  });

  return groupedRecords;
};

/**
 * Group records and add subtotals
 * @param {Array} records - Array of record objects
 * @param {String} groupByField - Field name to group by
 * @param {Array} numericFields - Array of field names to sum in subtotals
 * @returns {Array} Grouped records with subtotals
 */
const groupRecordsWithSubtotals = (records, groupByField, numericFields = []) => {
  if (!groupByField || !records || records.length === 0) {
    return records;
  }

  // Group records by the specified field
  const groups = {};
  records.forEach(record => {
    const groupValue = record[groupByField];
    const groupKey = groupValue !== null && groupValue !== undefined 
      ? String(groupValue) 
      : '(No Value)';
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(record);
  });

  // Convert groups to array with subtotals
  const groupedRecords = [];
  const sortedGroupKeys = Object.keys(groups).sort();

  sortedGroupKeys.forEach(groupKey => {
    const groupRecords = groups[groupKey];
    
    // Add all records in the group
    groupRecords.forEach(record => {
      groupedRecords.push(record);
    });

    // Add subtotal row if numeric fields are specified
    if (numericFields.length > 0) {
      const subtotal = {
        _isSubtotal: true,
        _groupKey: groupKey
      };
      
      // Set groupBy field value
      subtotal[groupByField] = groupKey;
      
      // Calculate sums for numeric fields
      numericFields.forEach(field => {
        const sum = groupRecords.reduce((acc, record) => {
          const value = record[field];
          return acc + (typeof value === 'number' ? value : 0);
        }, 0);
        subtotal[field] = sum;
      });
      
      // Set other fields to empty or label
      Object.keys(groupRecords[0] || {}).forEach(key => {
        if (key !== groupByField && !numericFields.includes(key) && !subtotal[key]) {
          subtotal[key] = key === '_groupKey' ? groupKey : '';
        }
      });
      
      groupedRecords.push(subtotal);
    }
  });

  return groupedRecords;
};

module.exports = {
  groupRecords,
  groupRecordsWithSubtotals
};

