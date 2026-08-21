/**
 * Utility functions for filter operations
 */

export const getOperatorsForFieldType = (fieldType) => {
  const type = (fieldType || '').toLowerCase();
  
  if (type === 'date' || type === 'datetime') {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not equals', label: 'Not Equals' },
      { value: 'greater than', label: 'Greater Than' },
      { value: 'less than', label: 'Less Than' },
      { value: 'greater or equal', label: 'Greater or Equal' },
      { value: 'less or equal', label: 'Less or Equal' },
      { value: 'between', label: 'Between' }
    ];
  }

  if (type === 'int' || type === 'double' || type === 'currency' || type === 'percent') {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not equals', label: 'Not Equals' },
      { value: 'greater than', label: 'Greater Than' },
      { value: 'less than', label: 'Less Than' },
      { value: 'greater or equal', label: 'Greater or Equal' },
      { value: 'less or equal', label: 'Less or Equal' },
      { value: 'between', label: 'Between' }
    ];
  }

  if (type === 'picklist') {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not equals', label: 'Not Equals' },
      { value: 'in', label: 'In (Multiple)' },
      { value: 'not in', label: 'Not In (Multiple)' }
    ];
  }

  if (type === 'boolean') {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not equals', label: 'Not Equals' }
    ];
  }

  // Default for text/string fields
  return [
    { value: 'equals', label: 'Equals' },
    { value: 'not equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not contains', label: 'Not Contains' },
    { value: 'starts with', label: 'Starts With' },
    { value: 'ends with', label: 'Ends With' }
  ];
};

export const getValueInputType = (fieldType) => {
  const type = (fieldType || '').toLowerCase();
  
  if (type === 'date' || type === 'datetime') return 'date';
  if (type === 'int' || type === 'double' || type === 'currency' || type === 'percent') return 'number';
  if (type === 'picklist') return 'picklist';
  if (type === 'boolean') return 'boolean';
  return 'text';
};

export const buildSOQLWhereClause = (filterStructure) => {
  if (!filterStructure || !filterStructure.groups || filterStructure.groups.length === 0) {
    return '';
  }

  const conditions = filterStructure.groups.map(group => {
    if (!group.conditions || group.conditions.length === 0) {
      return null;
    }

    const groupConditions = group.conditions
      .filter(c => c.field && c.operator && c.value !== '' && c.value !== null)
      .map(condition => buildConditionClause(condition))
      .filter(c => c !== null);

    if (groupConditions.length === 0) {
      return null;
    }

    const logic = group.logic || 'AND';
    return `(${groupConditions.join(` ${logic} `)})`;
  }).filter(c => c !== null);

  if (conditions.length === 0) {
    return '';
  }

  const groupLogic = filterStructure.groupLogic || 'AND';
  return conditions.join(` ${groupLogic} `);
};

const buildConditionClause = (condition) => {
  const { field, operator, value } = condition;
  
  if (!field || !operator || value === '' || value === null) {
    return null;
  }

  const escapedValue = (val) => {
    if (typeof val === 'string') {
      return `'${val.replace(/'/g, "''")}'`;
    }
    return val;
  };

  switch (operator) {
    case 'equals':
      return `${field} = ${escapedValue(value)}`;
    
    case 'not equals':
      return `${field} != ${escapedValue(value)}`;
    
    case 'contains':
      return `${field} LIKE '%${String(value).replace(/'/g, "''")}%'`;
    
    case 'not contains':
      return `NOT (${field} LIKE '%${String(value).replace(/'/g, "''")}%')`;
    
    case 'starts with':
      return `${field} LIKE '${String(value).replace(/'/g, "''")}%'`;
    
    case 'ends with':
      return `${field} LIKE '%${String(value).replace(/'/g, "''")}'`;
    
    case 'greater than':
      return `${field} > ${escapedValue(value)}`;
    
    case 'less than':
      return `${field} < ${escapedValue(value)}`;
    
    case 'greater or equal':
      return `${field} >= ${escapedValue(value)}`;
    
    case 'less or equal':
      return `${field} <= ${escapedValue(value)}`;
    
    case 'between':
      if (value && typeof value === 'object' && value.from && value.to) {
        return `${field} >= ${escapedValue(value.from)} AND ${field} <= ${escapedValue(value.to)}`;
      }
      return null;
    
    case 'in':
      if (Array.isArray(value) && value.length > 0) {
        const values = value.map(v => escapedValue(v)).join(', ');
        return `${field} IN (${values})`;
      }
      return null;
    
    case 'not in':
      if (Array.isArray(value) && value.length > 0) {
        const values = value.map(v => escapedValue(v)).join(', ');
        return `${field} NOT IN (${values})`;
      }
      return null;
    
    default:
      return null;
  }
};

