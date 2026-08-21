// Salesforce project objective service

const { createSalesforceConnection } = require('./connectionService');
const { sanitizeSearchTerm } = require('../../utils/security');

/**
 * Create project objective in Salesforce
 * @param {Object} projectObjectiveData - Project objective data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Creation result
 */
const createProjectObjectiveInSalesforce = async (projectObjectiveData, user) => {
  // Create Salesforce connection
  const conn = await createSalesforceConnection();

  // Map project objective data to Salesforce object fields
  // Convert camelCase to Salesforce field names (e.g., contributorFacingProjectName -> Contributor_Facing_Project_Name__c)
  const salesforceProjectObjectiveData = {};
  
  // Helper function to convert camelCase to Salesforce field name
  const toSalesforceFieldName = (camelCase) => {
    return camelCase
      .replace(/([A-Z])/g, '_$1')
      .replace(/^_/, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_') + '__c';
  };

  // Map common fields
  Object.keys(projectObjectiveData).forEach(key => {
    const value = projectObjectiveData[key];
    if (value !== undefined && value !== null && value !== '') {
      // Special handling for certain fields
      if (key === 'contributorFacingProjectName') {
        salesforceProjectObjectiveData.Name = value;
        salesforceProjectObjectiveData.Contributor_Facing_Project_Name__c = value;
      } else if (key === 'project') {
        // This is a lookup field - should be a Salesforce ID
        // If value is not a valid Salesforce ID format (18 characters), try to find project by name
        if (value && value.trim() !== '') {
          // Check if it's a valid Salesforce ID format (15 or 18 characters, alphanumeric)
          const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
          if (salesforceIdPattern.test(value)) {
            // It's already a Salesforce ID
            salesforceProjectObjectiveData.Project__c = value;
          } else {
            // It's a project name - we'll search for it later
            // Store it temporarily to search after connection is established
            projectObjectiveData._projectNameToSearch = value;
          }
        }
      } else if (key === 'workType') {
        salesforceProjectObjectiveData.Work_Type__c = value;
      } else if (key === 'country') {
        // Map country field - Salesforce field name might be Country__c
        salesforceProjectObjectiveData.Country__c = value;
      } else if (key === 'language') {
        // Map language field - Salesforce field name might be Language__c
        salesforceProjectObjectiveData.Language__c = value;
      } else {
        // Convert camelCase to Salesforce field name
        const salesforceFieldName = toSalesforceFieldName(key);
        salesforceProjectObjectiveData[salesforceFieldName] = value;
      }
    }
  });

  // Ensure Name field is set
  if (!salesforceProjectObjectiveData.Name) {
    salesforceProjectObjectiveData.Name = projectObjectiveData.contributorFacingProjectName || 
                                          projectObjectiveData.projectObjectiveName || 
                                          'New Project Objective';
  }

  // Ensure required fields have defaults
  if (!salesforceProjectObjectiveData.Contributor_Facing_Project_Name__c) {
    salesforceProjectObjectiveData.Contributor_Facing_Project_Name__c = salesforceProjectObjectiveData.Name;
  }

  // If project name was provided instead of ID, search for the project
  if (projectObjectiveData._projectNameToSearch) {
    try {
      console.log(`Searching for project by name: ${projectObjectiveData._projectNameToSearch}`);
      // Search for Project__c by Name field and include Project_Status__c to check status
      // Sanitize project name to prevent SQL injection
      const sanitizedProjectName = sanitizeSearchTerm(projectObjectiveData._projectNameToSearch);
      const projectQuery = `SELECT Id, Name, Project_Status__c FROM Project__c WHERE Name = '${sanitizedProjectName}' LIMIT 1`;
      const projectResults = await conn.query(projectQuery);
      
      if (projectResults.records && projectResults.records.length > 0) {
        const project = projectResults.records[0];
        const projectId = project.Id;
        const projectStatus = project.Project_Status__c;
        
        console.log(`Found project with ID: ${projectId}, Status: ${projectStatus}`);
        
        // Check if project status is 'Open' - required for creating project objective
        if (projectStatus !== 'Open') {
          throw new Error(
            `The project must have 'Open' status in order to create a project objective. ` +
            `Current project status is '${projectStatus}'. Please update the project status to 'Open' before creating a project objective.`
          );
        }
        
        salesforceProjectObjectiveData.Project__c = projectId;
      } else {
        console.warn(`Project not found by name: ${projectObjectiveData._projectNameToSearch}`);
        throw new Error(
          `Project not found: ${projectObjectiveData._projectNameToSearch}. ` +
          `Please ensure the project exists in Salesforce and try again.`
        );
      }
    } catch (searchError) {
      console.error(`Error searching for project: ${searchError.message}`);
      // Re-throw the error with proper message
      throw searchError;
    }
    // Clean up temporary field
    delete projectObjectiveData._projectNameToSearch;
  } else if (salesforceProjectObjectiveData.Project__c) {
    // If Project__c is already set (as an ID), verify the project status
    try {
      console.log(`Verifying project status for ID: ${salesforceProjectObjectiveData.Project__c}`);
      const projectQuery = `SELECT Id, Name, Project_Status__c FROM Project__c WHERE Id = '${salesforceProjectObjectiveData.Project__c}' LIMIT 1`;
      const projectResults = await conn.query(projectQuery);
      
      if (projectResults.records && projectResults.records.length > 0) {
        const project = projectResults.records[0];
        const projectStatus = project.Project_Status__c;
        
        console.log(`Project status: ${projectStatus}`);
        
        // Check if project status is 'Open' - required for creating project objective
        if (projectStatus !== 'Open') {
          throw new Error(
            `The project must have 'Open' status in order to create a project objective. ` +
            `Current project status is '${projectStatus}'. Please update the project status to 'Open' before creating a project objective.`
          );
        }
      } else {
        throw new Error(
          `Project not found with ID: ${salesforceProjectObjectiveData.Project__c}. ` +
          `Please verify the project ID and try again.`
        );
      }
    } catch (verifyError) {
      console.error(`Error verifying project status: ${verifyError.message}`);
      // Re-throw the error with proper message
      throw verifyError;
    }
  }

  console.log('Creating project objective in Salesforce with', Object.keys(salesforceProjectObjectiveData).length, 'fields');
  console.log('Salesforce object type: Project_Objective__c');
  console.log('Project Objective Name (mapped to Name field):', salesforceProjectObjectiveData.Name);

  // Check if Project_Objective__c object exists before attempting to create
  let objectType = 'Project_Objective__c';
  let projectObjectiveObjectExists = false;
  
  try {
    // Try to describe the object to check if it exists
    const objectDescribe = await conn.sobject(objectType).describe();
    projectObjectiveObjectExists = true;
    console.log(`Project_Objective__c object exists. Label: ${objectDescribe.label}, Fields: ${objectDescribe.fields.length}`);
  } catch (describeError) {
    // Object doesn't exist or user doesn't have access
    const errorMessage = describeError.message || 'Unknown error';
    if (errorMessage.includes('INVALID_TYPE') || errorMessage.includes('NOT_FOUND') || errorMessage.includes('No such column')) {
      console.error('Project_Objective__c object does not exist in Salesforce');
      throw new Error(
        'Project_Objective__c custom object does not exist in your Salesforce instance. ' +
        'Please create the Project_Objective__c custom object in Salesforce with the required fields. ' +
        'See documentation for field mapping details.'
      );
    } else {
      // Other error (permissions, etc.)
      console.error('Error checking Project_Objective__c object:', errorMessage);
      throw new Error(
        `Cannot access Project_Objective__c object in Salesforce: ${errorMessage}. ` +
        'Please verify that the Project_Objective__c object exists and you have permissions to create records.'
      );
    }
  }

  // Create project objective in Project_Objective__c (object exists and is accessible)
  let createdRecord;
  try {
    // Get object metadata to validate field values
    const objectDescribe = await conn.sobject(objectType).describe();
    const fieldMap = {};
    objectDescribe.fields.forEach(field => {
      fieldMap[field.name] = field;
    });

    // Validate and clean fields
    const validatedData = {};
    for (const [fieldName, fieldValue] of Object.entries(salesforceProjectObjectiveData)) {
      const fieldMetadata = fieldMap[fieldName];
      
      if (!fieldMetadata) {
        console.warn(`Field ${fieldName} does not exist in ${objectType}, skipping...`);
        continue;
      }

      if (fieldMetadata.createable && !fieldMetadata.calculated && !fieldMetadata.autoNumber) {
        // Special handling for Country__c and Language__c - always include them (even if empty) for validation
        if (fieldName === 'Country__c' || fieldName === 'Language__c') {
          // Include the field even if empty - Salesforce validation will check if at least one is set
          validatedData[fieldName] = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';
          continue;
        }
        
        // Handle different field types
        if (fieldMetadata.type === 'boolean' || fieldMetadata.type === 'checkbox') {
          validatedData[fieldName] = Boolean(fieldValue);
        } else if (fieldMetadata.type === 'number' || fieldMetadata.type === 'currency' || fieldMetadata.type === 'percent' || fieldMetadata.type === 'double') {
          validatedData[fieldName] = fieldValue !== null && fieldValue !== '' ? parseFloat(fieldValue) : null;
        } else if (fieldMetadata.type === 'int') {
          validatedData[fieldName] = fieldValue !== null && fieldValue !== '' ? parseInt(fieldValue) : null;
        } else if (fieldMetadata.type === 'date') {
          validatedData[fieldName] = fieldValue;
        } else if (fieldMetadata.type === 'datetime') {
          validatedData[fieldName] = fieldValue;
        } else if (fieldMetadata.type === 'string' || fieldMetadata.type === 'textarea' || fieldMetadata.type === 'richtextarea' || fieldMetadata.type === 'url' || fieldMetadata.type === 'email' || fieldMetadata.type === 'phone') {
          // Truncate string fields if they exceed max length
          const maxLength = fieldMetadata.length || 255;
          validatedData[fieldName] = String(fieldValue).substring(0, maxLength);
        } else if (fieldMetadata.type === 'picklist' || fieldMetadata.type === 'multipicklist') {
          // Validate picklist values
          if (fieldMetadata.picklistValues && fieldMetadata.picklistValues.length > 0) {
            const validValues = fieldMetadata.picklistValues.map(pv => pv.value);
            if (validValues.includes(fieldValue)) {
              validatedData[fieldName] = fieldValue;
            } else {
              console.warn(`Invalid picklist value ${fieldValue} for field ${fieldName}, using first valid value`);
              // For required fields, use the first valid value; for optional fields, skip
              if (fieldMetadata.nillable === false && fieldMetadata.required === true) {
                validatedData[fieldName] = validValues[0];
              }
            }
          } else {
            validatedData[fieldName] = fieldValue;
          }
        } else {
          validatedData[fieldName] = fieldValue;
        }
      }
    }

    console.log(`Attempting to create project objective in ${objectType}...`);
    let createdRecord;
    try {
      createdRecord = await conn.sobject(objectType).create(validatedData);
    } catch (createApiError) {
      // Handle jsforce API errors
      console.error('jsforce create API error:', createApiError);
      console.error('Error details:', JSON.stringify(createApiError, null, 2));
      
      let apiErrorMessage = createApiError.message || 'Unknown Salesforce API error';
      let apiErrorDetails = [];
      
      // Check if error has data property
      if (createApiError.data) {
        if (Array.isArray(createApiError.data)) {
          apiErrorDetails = createApiError.data;
        } else if (createApiError.data.errors && Array.isArray(createApiError.data.errors)) {
          apiErrorDetails = createApiError.data.errors;
        } else if (typeof createApiError.data === 'object') {
          apiErrorDetails = [createApiError.data];
        }
      }
      
      // Extract error messages
      if (apiErrorDetails.length > 0) {
        const errorMessages = apiErrorDetails.map(err => {
          if (typeof err === 'object') {
            return err.message || err.error || err.statusCode || JSON.stringify(err);
          }
          return String(err);
        }).filter(Boolean);
        if (errorMessages.length > 0) {
          apiErrorMessage = errorMessages.join('; ');
        }
      }
      
      const detailedError = new Error(`Failed to create project objective in Project_Objective__c: ${apiErrorMessage}`);
      detailedError.data = apiErrorDetails;
      throw detailedError;
    }
    
    if (!createdRecord.success) {
      const errorMsg = createdRecord.errors && createdRecord.errors.length > 0 
        ? createdRecord.errors.map(e => e.message).join('; ') 
        : 'Unknown error';
      const errorFields = createdRecord.errors && createdRecord.errors.length > 0
        ? createdRecord.errors.map(e => e.fields || []).flat()
        : [];
      
      console.error('Project_Objective__c create error:', errorMsg, 'Fields:', errorFields);
      const validationError = new Error(
        `Failed to create project objective in Project_Objective__c: ${errorMsg}. ` +
        (errorFields.length > 0 ? `Fields with errors: ${errorFields.join(', ')}. ` : '') +
        'Please verify that all required fields exist in Project_Objective__c and have correct data types.'
      );
      validationError.data = createdRecord.errors || [];
      throw validationError;
    }

    console.log('Project objective created successfully in Project_Objective__c:', createdRecord.id);
    
    return {
      success: true,
      salesforceId: createdRecord.id,
      objectType: objectType,
      objectName: salesforceProjectObjectiveData.Name || projectObjectiveData.contributorFacingProjectName || projectObjectiveData.projectObjectiveName || 'New Project Objective'
    };
  } catch (createError) {
    console.error('Error creating project objective in Project_Objective__c:', createError.message);
    console.error('Error object:', JSON.stringify(createError, null, 2));
    
    // Check if error has data property with detailed errors
    let errorDetails = [];
    if (createError.data) {
      // If error.data is an array of errors
      if (Array.isArray(createError.data)) {
        errorDetails = createError.data.map(err => ({
          message: err.message || err.error || err,
          fields: err.fields || [],
          statusCode: err.statusCode
        }));
      } else if (typeof createError.data === 'object') {
        // If error.data is an object with errors array
        if (createError.data.errors && Array.isArray(createError.data.errors)) {
          errorDetails = createError.data.errors.map(err => ({
            message: err.message || err.error || err,
            fields: err.fields || [],
            statusCode: err.statusCode
          }));
        } else {
          // Single error object
          errorDetails = [{
            message: createError.data.message || createError.data.error || createError.data,
            fields: createError.data.fields || [],
            statusCode: createError.data.statusCode
          }];
        }
      }
    }
    
    // Build detailed error message
    let errorMessage = createError.message;
    
    if (errorDetails.length > 0) {
      const errorMessages = errorDetails.map(err => err.message).filter(Boolean);
      const errorFields = errorDetails.map(err => err.fields || []).flat().filter(Boolean);
      
      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join('; ');
      }
      
      if (errorFields.length > 0) {
        errorMessage += ` (Fields: ${errorFields.join(', ')})`;
      }
    }
    
    // Provide more specific error messages
    if (errorMessage.includes('INVALID_FIELD') || errorMessage.includes('No such column')) {
      errorMessage = 'Invalid field mapping. Some project objective fields may not exist in your Salesforce object. Please check your Salesforce object structure. ' + errorMessage;
    } else if (errorMessage.includes('REQUIRED_FIELD_MISSING')) {
      errorMessage = 'Required fields are missing. Please verify that all required fields exist and have correct values. ' + errorMessage;
    } else if (errorMessage.includes('Project_Objective__c') || errorMessage.includes('INVALID_TYPE')) {
      // Keep the original error message
    }
    
    // Create error object with details
    const detailedError = new Error(errorMessage);
    detailedError.data = errorDetails;
    throw detailedError;
  }
};

module.exports = {
  createProjectObjectiveInSalesforce
};

