// Transformation templates for common use cases
export const transformationTemplates = [
  {
    id: 'full-name',
    name: 'Full Name from First + Last',
    description: 'Concatenate first and last name with space',
    transformation: 'concatenate',
    config: {
      concatenateFields: ['FirstName', 'LastName'],
      separator: ' '
    }
  },
  {
    id: 'email-validation',
    name: 'Email Validation',
    description: 'Validate email format, use default if invalid',
    transformation: 'validateFormat',
    config: {
      validationType: 'email',
      onInvalid: 'default',
      defaultValue: ''
    }
  },
  {
    id: 'phone-clean',
    name: 'Clean Phone Number',
    description: 'Remove all special characters, keep only numbers',
    transformation: 'removeSpecialChars',
    config: {
      removeMode: 'keepOnlyNumbers'
    }
  },
  {
    id: 'uppercase-name',
    name: 'Uppercase Name',
    description: 'Convert name to uppercase',
    transformation: 'uppercase',
    config: {}
  },
  {
    id: 'lowercase-email',
    name: 'Lowercase Email',
    description: 'Convert email to lowercase',
    transformation: 'lowercase',
    config: {}
  },
  {
    id: 'default-if-empty',
    name: 'Default Value if Empty',
    description: 'Use default value when source is empty',
    transformation: 'defaultValue',
    config: {
      applyWhen: 'empty',
      defaultValue: ''
    }
  },
  {
    id: 'remove-spaces',
    name: 'Remove All Spaces',
    description: 'Remove all spaces from text',
    transformation: 'textReplace',
    config: {
      findText: ' ',
      replaceText: '',
      replaceMode: 'all',
      caseSensitive: false,
      useRegex: false
    }
  },
  {
    id: 'date-format-standard',
    name: 'Standard Date Format',
    description: 'Format date as YYYY-MM-DD',
    transformation: 'dateFormat',
    config: {
      dateFormat: 'YYYY-MM-DD'
    }
  },
  {
    id: 'number-format-2decimals',
    name: 'Number with 2 Decimals',
    description: 'Format number with 2 decimal places',
    transformation: 'numberFormat',
    config: {
      numberFormat: '0.00'
    }
  }
];

export const saveTransformationSet = (name, mappings, additionalData = {}) => {
  try {
    const saved = JSON.parse(localStorage.getItem('transformationSets') || '[]');
    const newSet = {
      id: Date.now().toString(),
      name,
      mappings,
      ...additionalData, // Include sourceObject, targetObject, createdBy, etc.
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saved.push(newSet);
    localStorage.setItem('transformationSets', JSON.stringify(saved));
    return { success: true, id: newSet.id, set: newSet };
  } catch (error) {
    console.error('Error saving transformation set:', error);
    return { success: false, error: error.message };
  }
};

export const loadTransformationSet = (id) => {
  try {
    const saved = JSON.parse(localStorage.getItem('transformationSets') || '[]');
    const set = saved.find(s => s.id === id);
    return set ? { success: true, set } : { success: false, error: 'Set not found' };
  } catch (error) {
    console.error('Error loading transformation set:', error);
    return { success: false, error: error.message };
  }
};

export const getAllTransformationSets = () => {
  try {
    return JSON.parse(localStorage.getItem('transformationSets') || '[]');
  } catch (error) {
    console.error('Error getting transformation sets:', error);
    return [];
  }
};

export const deleteTransformationSet = (id) => {
  try {
    const saved = JSON.parse(localStorage.getItem('transformationSets') || '[]');
    const filtered = saved.filter(s => s.id !== id);
    localStorage.setItem('transformationSets', JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting transformation set:', error);
    return { success: false, error: error.message };
  }
};

