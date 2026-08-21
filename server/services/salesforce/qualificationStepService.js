// Salesforce qualification step service

const { createSalesforceConnection } = require('./connectionService');
const { sanitizeSearchTerm } = require('../../utils/security');

/**
 * Create qualification step in Salesforce
 * @param {Object} qualificationStepData - Qualification step data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Creation result
 */
const createQualificationStepInSalesforce = async (qualificationStepData, user) => {
  // Create Salesforce connection
  const conn = await createSalesforceConnection();

  // Convert Project name to Project__c ID if needed
  let projectId = qualificationStepData.project;
  if (qualificationStepData.project && qualificationStepData.project.trim() !== '') {
    // Check if it's already a Salesforce ID (15 or 18 characters)
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(qualificationStepData.project)) {
      // It's not an ID, try to find by name
      try {
        // Sanitize project name to prevent SQL injection
        const sanitizedProject = sanitizeSearchTerm(qualificationStepData.project);
        const projectQuery = `SELECT Id FROM Project__c WHERE Name = '${sanitizedProject}' LIMIT 1`;
        const projectResult = await conn.query(projectQuery);
        if (projectResult.records && projectResult.records.length > 0) {
          projectId = projectResult.records[0].Id;
          console.log(`Found Project ID: ${projectId} for ${qualificationStepData.project}`);
        } else {
          console.warn(`Project not found: ${qualificationStepData.project}`);
        }
      } catch (projectError) {
        console.error(`Error looking up Project: ${projectError.message}`);
      }
    }
  }

  // Convert Project Objective name to Project_Objective__c ID if needed
  // IMPORTANT: Must verify that the Project Objective belongs to the selected Project
  let projectObjectiveId = qualificationStepData.projectObjective;
  if (qualificationStepData.projectObjective && qualificationStepData.projectObjective.trim() !== '' && projectId) {
    // Check if it's already a Salesforce ID (15 or 18 characters)
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(qualificationStepData.projectObjective)) {
      // It's not an ID, try to find by name AND verify it belongs to the selected project
      try {
        // Try to find by Contributor_Facing_Project_Name__c or Name field, AND ensure it belongs to the selected project
        const projectObjectiveQuery = `SELECT Id, Project__c FROM Project_Objective__c WHERE (Contributor_Facing_Project_Name__c = '${qualificationStepData.projectObjective.replace(/'/g, "\\'")}' OR Name = '${qualificationStepData.projectObjective.replace(/'/g, "\\'")}') AND Project__c = '${projectId}' LIMIT 1`;
        const projectObjectiveResult = await conn.query(projectObjectiveQuery);
        if (projectObjectiveResult.records && projectObjectiveResult.records.length > 0) {
          const foundObjective = projectObjectiveResult.records[0];
          // Verify that the Project Objective belongs to the selected project
          if (foundObjective.Project__c === projectId) {
            projectObjectiveId = foundObjective.Id;
            console.log(`Found Project Objective ID: ${projectObjectiveId} for ${qualificationStepData.projectObjective} (belongs to Project ID: ${projectId})`);
          } else {
            console.warn(`Project Objective ${qualificationStepData.projectObjective} does not belong to Project ID: ${projectId}. Found Project__c: ${foundObjective.Project__c}`);
            projectObjectiveId = null;
          }
        } else {
          console.warn(`Project Objective not found: ${qualificationStepData.projectObjective} for Project ID: ${projectId}`);
          // If not found, remove the field to avoid validation error
          projectObjectiveId = null;
        }
      } catch (projectObjectiveError) {
        console.error(`Error looking up Project Objective: ${projectObjectiveError.message}`);
        projectObjectiveId = null; // If lookup fails, remove the field to avoid validation error
      }
    } else {
      // It's already an ID, but we should verify it belongs to the selected project
      try {
        const verifyQuery = `SELECT Id, Project__c FROM Project_Objective__c WHERE Id = '${qualificationStepData.projectObjective}' LIMIT 1`;
        const verifyResult = await conn.query(verifyQuery);
        if (verifyResult.records && verifyResult.records.length > 0) {
          const foundObjective = verifyResult.records[0];
          if (foundObjective.Project__c === projectId) {
            projectObjectiveId = foundObjective.Id;
            console.log(`Verified Project Objective ID: ${projectObjectiveId} belongs to Project ID: ${projectId}`);
          } else {
            console.warn(`Project Objective ID ${qualificationStepData.projectObjective} does not belong to Project ID: ${projectId}. Found Project__c: ${foundObjective.Project__c}`);
            projectObjectiveId = null;
          }
        } else {
          console.warn(`Project Objective ID not found: ${qualificationStepData.projectObjective}`);
          projectObjectiveId = null;
        }
      } catch (verifyError) {
        console.error(`Error verifying Project Objective ID: ${verifyError.message}`);
        projectObjectiveId = null;
      }
    }
  } else if (qualificationStepData.projectObjective && qualificationStepData.projectObjective.trim() !== '' && !projectId) {
    // Project Objective provided but no project ID - cannot verify, so remove it
    console.warn('Project Objective provided but no Project ID found. Removing Project Objective to avoid validation error.');
    projectObjectiveId = null;
  }

  // Convert Qualification Step name to Qualification_Step__c ID if needed
  let qualificationStepId = qualificationStepData.qualificationStep;
  if (qualificationStepData.qualificationStep && qualificationStepData.qualificationStep.trim() !== '') {
    // Check if it's already a Salesforce ID (15 or 18 characters)
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(qualificationStepData.qualificationStep)) {
      // It's not an ID, try to find by name
      try {
        // Sanitize qualification step name to prevent SQL injection
        const sanitizedQualificationStep = sanitizeSearchTerm(qualificationStepData.qualificationStep);
        const qualificationStepQuery = `SELECT Id FROM Qualification_Step__c WHERE Name = '${sanitizedQualificationStep}' LIMIT 1`;
        const qualificationStepResult = await conn.query(qualificationStepQuery);
        if (qualificationStepResult.records && qualificationStepResult.records.length > 0) {
          qualificationStepId = qualificationStepResult.records[0].Id;
          console.log(`Found Qualification Step ID: ${qualificationStepId} for ${qualificationStepData.qualificationStep}`);
        } else {
          console.warn(`Qualification Step not found: ${qualificationStepData.qualificationStep}`);
          // If not found, remove the field to avoid validation error
          qualificationStepId = null;
        }
      } catch (qualificationStepError) {
        console.error(`Error looking up Qualification Step: ${qualificationStepError.message}`);
        qualificationStepId = null; // If lookup fails, remove the field to avoid validation error
      }
    }
  }

  // Map qualification step data to Salesforce object fields
  const salesforceQualificationStepData = {
    Name: qualificationStepData.projectQualificationStepName || qualificationStepData.name || 'New Qualification Step',
    Project__c: projectId,
    Project_Qualification_Step_Status__c: qualificationStepData.projectQualificationStepStatus || 'Draft',
    Funnel__c: qualificationStepData.funnel,
    Step_Number__c: qualificationStepData.stepNumber,
    Number_of_Attempts__c: qualificationStepData.numberOfAttempts || 1,
    Estimated_Time_to_Complete__c: qualificationStepData.estimatedTimeToComplete
  };

  // Only include Project_Objective__c if we have a valid ID
  if (projectObjectiveId) {
    salesforceQualificationStepData.Project_Objective__c = projectObjectiveId;
  }

  // Only include Qualification_Step__c if we have a valid ID
  if (qualificationStepId) {
    salesforceQualificationStepData.Qualification_Step__c = qualificationStepId;
  }

  // Remove undefined/null/empty string values
  Object.keys(salesforceQualificationStepData).forEach(key => {
    const value = salesforceQualificationStepData[key];
    if (value === undefined || value === null || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
      delete salesforceQualificationStepData[key];
    }
  });

  // Ensure Name field is always present
  if (!salesforceQualificationStepData.Name || salesforceQualificationStepData.Name.trim() === '') {
    salesforceQualificationStepData.Name = 'New Qualification Step';
  }

  console.log('Creating qualification step in Salesforce with', Object.keys(salesforceQualificationStepData).length, 'fields');
  console.log('Salesforce object type: Project_Qualification_Step__c');
  console.log('Qualification Step Name:', salesforceQualificationStepData.Name);

  // Try to create the qualification step in Salesforce
  let objectType = 'Project_Qualification_Step__c';
  
  try {
    // Try to describe the object to check if it exists
    const objectDescribe = await conn.sobject(objectType).describe();
    console.log(`Project_Qualification_Step__c object exists. Label: ${objectDescribe.label}, Fields: ${objectDescribe.fields.length}`);
    
    // Create the qualification step
    const result = await conn.sobject(objectType).create(salesforceQualificationStepData);
    
    if (result.success) {
      console.log('Qualification step created successfully in Salesforce');
      console.log('Salesforce ID:', result.id);
      
      return {
        success: true,
        salesforceId: result.id,
        objectType: objectType,
        objectName: salesforceQualificationStepData.Name || qualificationStepData.projectQualificationStepName || qualificationStepData.name || 'New Qualification Step'
      };
    } else {
      console.error('Failed to create qualification step in Salesforce');
      console.error('Errors:', result.errors);
      
      return {
        success: false,
        error: result.errors ? result.errors.map(e => e.message).join('; ') : 'Failed to create qualification step in Salesforce',
        details: result.errors
      };
    }
  } catch (createError) {
    console.error('Error creating qualification step in Salesforce:', createError.message);
    console.error('Error object:', JSON.stringify(createError, null, 2));
    
    // Check if error has data property with detailed errors
    let errorDetails = [];
    if (createError.data) {
      if (Array.isArray(createError.data)) {
        errorDetails = createError.data.map(err => ({
          message: err.message || err.error || err,
          fields: err.fields || [],
          statusCode: err.statusCode
        }));
      } else if (typeof createError.data === 'object') {
        if (createError.data.errors && Array.isArray(createError.data.errors)) {
          errorDetails = createError.data.errors.map(err => ({
            message: err.message || err.error || err,
            fields: err.fields || [],
            statusCode: err.statusCode
          }));
        } else {
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
      errorMessage = 'Invalid field mapping. Some qualification step fields may not exist in your Salesforce object. Please check your Salesforce object structure. ' + errorMessage;
    } else if (errorMessage.includes('REQUIRED_FIELD_MISSING')) {
      errorMessage = 'Required fields are missing. Please verify that all required fields exist and have correct values. ' + errorMessage;
    }
    
    // Create error object with details
    const detailedError = new Error(errorMessage);
    detailedError.data = errorDetails;
    throw detailedError;
  }
};

module.exports = {
  createQualificationStepInSalesforce
};

