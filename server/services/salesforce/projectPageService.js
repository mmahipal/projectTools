// Service for creating project pages in Salesforce

const { createSalesforceConnection } = require('./connectionService');
const { sanitizeSearchTerm } = require('../../utils/security');

/**
 * Create project page in Salesforce
 * @param {Object} pageData - Project page data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Result with salesforceId, objectType, objectName
 */
async function createProjectPageInSalesforce(pageData, user) {
  // Use session-managed connection (reuses cached tokens when possible)
  // This will load settings automatically and use cached connections when available
  const conn = await createSalesforceConnection(null, user?.id);
  
  // Verify connection is working
  const userInfo = await conn.identity();
  console.log('Salesforce connection ready for creating project page, user ID:', userInfo.id);

  // Check page type early - skip project/projectObjective conversion for "Default Qualification Page"
  const isDefaultQualificationPage = pageData.projectPageType === 'Default Qualification Page';
  console.log(`Project Page Type: "${pageData.projectPageType}", isDefaultQualificationPage: ${isDefaultQualificationPage}`);

  // Convert project name to ID if needed (skip for Default Qualification Page)
  let projectId = pageData.project;
  if (!isDefaultQualificationPage && pageData.project && pageData.project.trim() !== '') {
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(pageData.project)) {
      // It's not an ID, try to find by name
      try {
        const sanitizedProject = sanitizeSearchTerm(pageData.project);
        const projectQuery = `SELECT Id FROM Project__c WHERE Name = '${sanitizedProject}' LIMIT 1`;
        const projectResult = await conn.query(projectQuery);
        if (projectResult.records && projectResult.records.length > 0) {
          projectId = projectResult.records[0].Id;
          console.log(`Found Project ID: ${projectId} for project name: ${pageData.project}`);
        } else {
          throw new Error(`Project not found: ${pageData.project}`);
        }
      } catch (projectError) {
        console.error(`Error looking up Project: ${projectError.message}`);
        throw new Error(`Error looking up Project: ${projectError.message}`);
      }
    }
  }

  // Convert project objective name to ID if needed (skip for Default Qualification Page)
  let projectObjectiveId = pageData.projectObjective;
  if (!isDefaultQualificationPage && pageData.projectObjective && pageData.projectObjective.trim() !== '' && projectId) {
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(pageData.projectObjective)) {
      try {
        const projectObjectiveQuery = `SELECT Id, Project__c FROM Project_Objective__c WHERE (Contributor_Facing_Project_Name__c = '${pageData.projectObjective.replace(/'/g, "\\'")}' OR Name = '${pageData.projectObjective.replace(/'/g, "\\'")}') AND Project__c = '${projectId}' LIMIT 1`;
        const projectObjectiveResult = await conn.query(projectObjectiveQuery);
        if (projectObjectiveResult.records && projectObjectiveResult.records.length > 0) {
          const foundObjective = projectObjectiveResult.records[0];
          if (foundObjective.Project__c === projectId) {
            projectObjectiveId = foundObjective.Id;
            console.log(`Found Project Objective ID: ${projectObjectiveId} for ${pageData.projectObjective} (belongs to Project ID: ${projectId})`);
          } else {
            console.warn(`Project Objective ${pageData.projectObjective} does not belong to Project ID: ${projectId}. Found Project__c: ${foundObjective.Project__c}`);
            projectObjectiveId = null;
          }
        } else {
          console.warn(`Project Objective not found: ${pageData.projectObjective} for Project ID: ${projectId}`);
          projectObjectiveId = null;
        }
      } catch (projectObjectiveError) {
        console.error(`Error looking up Project Objective: ${projectObjectiveError.message}`);
        projectObjectiveId = null;
      }
    }
  }

  // Try to find Project_Page__c object
  let projectPageObjectName = null;
  let projectPageObjectDescribe = null;
  const possibleObjectNames = ['Project_Page__c', 'ProjectPage__c', 'Project_Page__c'];
  
  for (const objName of possibleObjectNames) {
    try {
      const describe = await conn.sobject(objName).describe();
      projectPageObjectName = objName;
      projectPageObjectDescribe = describe;
      console.log(`Found Project Page object: ${objName}`);
      break;
    } catch (objError) {
      console.log(`Project Page object ${objName} does not exist, trying next...`);
    }
  }
  
  if (!projectPageObjectName) {
    throw new Error('Project Page object not found in Salesforce. Please ensure Project_Page__c or similar object exists.');
  }
  
  // Find the correct field name for Qualification Step lookup
  let qualificationStepFieldName = null;
  let defaultQualificationStepFieldName = null;
  
  const possibleFieldNames = ['Project_Qualification_Step__c', 'QualificationStep__c'];
  
  if (projectPageObjectDescribe && projectPageObjectDescribe.fields) {
    for (const fieldName of possibleFieldNames) {
      const field = projectPageObjectDescribe.fields.find(f => f.name === fieldName);
      if (field) {
        qualificationStepFieldName = fieldName;
        console.log(`Found Qualification Step field (for Project Qualifying Page): ${fieldName}`);
        break;
      }
    }
  }
  
  const defaultQualificationFieldNames = ['Qualification_Step__c', 'QualificationStep__c'];
  if (projectPageObjectDescribe && projectPageObjectDescribe.fields) {
    for (const fieldName of defaultQualificationFieldNames) {
      const field = projectPageObjectDescribe.fields.find(f => f.name === fieldName);
      if (field && field.name !== qualificationStepFieldName) {
        defaultQualificationStepFieldName = fieldName;
        console.log(`Found Qualification Step field (for Default Qualification Page): ${fieldName}`);
        break;
      }
    }
  }
  
  if (!defaultQualificationStepFieldName) {
    defaultQualificationStepFieldName = 'Qualification_Step__c';
    console.log(`Using default Qualification Step field name for Default Qualification Page: ${defaultQualificationStepFieldName}`);
  }

  // Validate that Project Qualification Step is provided when Project Page Type is "Project Qualifying Page"
  if (pageData.projectPageType === 'Project Qualifying Page') {
    if (!pageData.projectQualificationStep || pageData.projectQualificationStep.trim() === '') {
      throw new Error('Project Qualification Step must be entered if the Project Page Type is \'Project Qualifying Page\'.');
    }
  }
  
  // Validate that Qualification is provided when Project Page Type is "Default Qualification Page"
  if (pageData.projectPageType === 'Default Qualification Page') {
    if (!pageData.projectQualification || pageData.projectQualification.trim() === '') {
      throw new Error('Qualification must be entered if the Project Page Type is \'Default Qualification Page\'.');
    }
  }

  // Handle qualification step conversion
  let qualificationStepValue = pageData.projectQualificationStep;
  let shouldConvertToId = true;
  
  if (qualificationStepFieldName && projectPageObjectDescribe && projectPageObjectDescribe.fields) {
    const field = projectPageObjectDescribe.fields.find(f => f.name === qualificationStepFieldName);
    if (field && field.type !== 'reference' && field.type !== 'lookup') {
      shouldConvertToId = false;
      console.log(`Field ${qualificationStepFieldName} is a ${field.type} field, keeping name instead of converting to ID`);
    }
  }
  
  let qualificationStepObjectName = 'Qualification_Step__c';
  if (qualificationStepFieldName && projectPageObjectDescribe && projectPageObjectDescribe.fields) {
    const field = projectPageObjectDescribe.fields.find(f => f.name === qualificationStepFieldName);
    if (field && field.referenceTo && field.referenceTo.length > 0) {
      qualificationStepObjectName = field.referenceTo[0];
      console.log(`Qualification Step field expects reference to: ${qualificationStepObjectName}`);
    }
  }
  
  if (qualificationStepValue && qualificationStepValue.trim() !== '' && shouldConvertToId) {
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(qualificationStepValue)) {
      try {
        const nameToSearch = qualificationStepValue.trim();
        const escapedName = nameToSearch.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        
        let qualificationStepQuery = `SELECT Id FROM ${qualificationStepObjectName} WHERE Name = '${escapedName}' LIMIT 1`;
        let qualificationStepResult = await conn.query(qualificationStepQuery);
        
        if (!qualificationStepResult.records || qualificationStepResult.records.length === 0) {
          qualificationStepQuery = `SELECT Id FROM ${qualificationStepObjectName} WHERE Name LIKE '%${escapedName}%' LIMIT 1`;
          qualificationStepResult = await conn.query(qualificationStepQuery);
        }
        
        if (qualificationStepResult.records && qualificationStepResult.records.length > 0) {
          qualificationStepValue = qualificationStepResult.records[0].Id;
          console.log(`Found ${qualificationStepObjectName} ID: ${qualificationStepValue} for ${pageData.projectQualificationStep}`);
        } else {
          throw new Error(`Qualification Step not found: "${nameToSearch}". Please ensure the qualification step exists in Salesforce (object: ${qualificationStepObjectName}) and the name matches exactly.`);
        }
      } catch (qualificationStepError) {
        console.error(`Error looking up Qualification Step in ${qualificationStepObjectName}: ${qualificationStepError.message}`);
        throw new Error(`Error looking up Qualification Step: ${qualificationStepError.message || 'Unknown error'}`);
      }
    }
  }

  // Map page data to Salesforce object fields
  const salesforcePageData = {
    Project_Page_Type__c: pageData.projectPageType
  };

  let projectQualificationFieldName = null;
  
  if (isDefaultQualificationPage) {
    console.log('Project Page Type is "Default Qualification Page" - omitting project, project objective, and qualification step fields');
    
    projectQualificationFieldName = defaultQualificationStepFieldName || 'Qualification_Step__c';
    
    if (pageData.projectQualification && pageData.projectQualification.trim() !== '') {
      let projectQualificationValue = pageData.projectQualification;
      let shouldConvertProjectQualificationToId = true;
      
      const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
      if (salesforceIdPattern.test(projectQualificationValue)) {
        shouldConvertProjectQualificationToId = false;
      }
      
      if (!projectQualificationFieldName && projectPageObjectDescribe && projectPageObjectDescribe.fields) {
        const possibleFieldNames = ['Project_Qualification_Step__c', 'Project_Qualification__c', 'Qualification__c', 'Qualification_Step__c'];
        for (const fieldName of possibleFieldNames) {
          const field = projectPageObjectDescribe.fields.find(f => f.name === fieldName);
          if (field) {
            projectQualificationFieldName = fieldName;
            console.log(`Found Project Qualification field: ${fieldName}`);
            break;
          }
        }
      }
      
      if (!projectQualificationFieldName) {
        projectQualificationFieldName = 'Qualification_Step__c';
        console.log(`Using default Qualification Step field for Default Qualification Page: ${projectQualificationFieldName}`);
      }
      
      if (shouldConvertProjectQualificationToId && projectQualificationFieldName) {
        try {
          let qualificationObjectName = 'Qualification_Step__c';
          let expectedObjectTypes = [];
          
          if (projectPageObjectDescribe && projectPageObjectDescribe.fields) {
            const field = projectPageObjectDescribe.fields.find(f => f.name === projectQualificationFieldName);
            if (field && field.referenceTo && field.referenceTo.length > 0) {
              expectedObjectTypes = field.referenceTo;
              qualificationObjectName = field.referenceTo[0];
              console.log(`Qualification Step field expects reference to: ${expectedObjectTypes.join(', ')}`);
            }
          }
          
          const nameToSearch = projectQualificationValue.trim();
          const escapedName = nameToSearch.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          
          let qualificationResult = null;
          let qualificationObjectNameUsed = qualificationObjectName;
          
          for (const objectType of expectedObjectTypes.length > 0 ? expectedObjectTypes : [qualificationObjectName]) {
            console.log(`Searching for qualification step in ${objectType}...`);
            
            let qualificationQuery = `SELECT Id FROM ${objectType} WHERE Name = '${escapedName}' LIMIT 1`;
            try {
              qualificationResult = await conn.query(qualificationQuery);
              if (qualificationResult && qualificationResult.records && qualificationResult.records.length > 0) {
                qualificationObjectNameUsed = objectType;
                break;
              }
            } catch (queryError) {
              console.warn(`Exact match query failed for ${objectType}:`, queryError.message);
            }
            
            if (!qualificationResult || !qualificationResult.records || qualificationResult.records.length === 0) {
              qualificationQuery = `SELECT Id FROM ${objectType} WHERE Name LIKE '%${escapedName}%' LIMIT 1`;
              try {
                qualificationResult = await conn.query(qualificationQuery);
                if (qualificationResult && qualificationResult.records && qualificationResult.records.length > 0) {
                  qualificationObjectNameUsed = objectType;
                  break;
                }
              } catch (queryError) {
                console.warn(`LIKE query failed for ${objectType}:`, queryError.message);
              }
            }
          }
          
          if (qualificationResult && qualificationResult.records && qualificationResult.records.length > 0) {
            projectQualificationValue = qualificationResult.records[0].Id;
            console.log(`Found ${qualificationObjectNameUsed} ID: ${projectQualificationValue} for ${pageData.projectQualification}`);
          } else {
            throw new Error(`Project Qualification not found: "${pageData.projectQualification}". Please ensure the qualification step exists in Salesforce (object: ${expectedObjectTypes.join(' or ') || qualificationObjectName}) and the name matches exactly.`);
          }
        } catch (qualificationError) {
          console.error('Error looking up Project Qualification:', qualificationError);
          throw new Error(`Error looking up Project Qualification: ${qualificationError.message}`);
        }
      }
      
      if (projectQualificationFieldName) {
        salesforcePageData[projectQualificationFieldName] = projectQualificationValue;
        console.log(`Using Project Qualification field: ${projectQualificationFieldName} with value: ${projectQualificationValue}`);
      }
    }
  } else {
    salesforcePageData.Project__c = projectId;
    salesforcePageData.Project_Objective__c = projectObjectiveId || null;

    if (qualificationStepValue && qualificationStepValue.trim() !== '') {
      if (qualificationStepFieldName) {
        salesforcePageData[qualificationStepFieldName] = qualificationStepValue;
        console.log(`Using Qualification Step field: ${qualificationStepFieldName} with value: ${qualificationStepValue}`);
      } else {
        console.warn(`Qualification Step field not found in object description, using default: Project_Qualification_Step__c`);
        salesforcePageData.Project_Qualification_Step__c = qualificationStepValue;
      }
    }
  }

  // Add description if provided
  if (pageData.projectPageDescription && pageData.projectPageDescription.trim() !== '') {
    salesforcePageData.Description__c = pageData.projectPageDescription.trim();
  }

  // Add active status if provided
  if (pageData.active !== undefined) {
    salesforcePageData.Active__c = pageData.active || false;
  }

  // Remove undefined/null values
  if (isDefaultQualificationPage) {
    delete salesforcePageData.Project__c;
    delete salesforcePageData.Project_Objective__c;
    if (qualificationStepFieldName) {
      delete salesforcePageData[qualificationStepFieldName];
    }
    delete salesforcePageData.Project_Qualification_Step__c;
    console.log('Verified: Removed project/projectObjective/Project_Qualification_Step__c fields for Default Qualification Page');
  }
  
  Object.keys(salesforcePageData).forEach(key => {
    if (salesforcePageData[key] === undefined || 
        salesforcePageData[key] === null ||
        (typeof salesforcePageData[key] === 'string' && salesforcePageData[key].trim() === '')) {
      delete salesforcePageData[key];
    }
  });

  console.log(`Creating project page in ${projectPageObjectName} with data:`, JSON.stringify(salesforcePageData, null, 2));

  // Create project page in Salesforce
  let result;
  try {
    result = await conn.sobject(projectPageObjectName).create(salesforcePageData);
  } catch (createError) {
    if (createError.errorCode === 'MULTIPLE_API_ERRORS' && createError.data && Array.isArray(createError.data)) {
      const errorMessages = createError.data.map(err => {
        const field = err.fields ? ` (${err.fields.join(', ')})` : '';
        return `${err.message || err.errorCode || 'Unknown error'}${field}`;
      }).join('; ');
      throw new Error(`Salesforce validation errors: ${errorMessages}`);
    }
    
    if (createError.errorCode === 'FIELD_FILTER_VALIDATION_EXCEPTION' && createError.data) {
      const errorMessage = createError.data.message || createError.message || 'Validation error';
      throw new Error(errorMessage);
    }
    
    if (createError.errorCode === 'FIELD_CUSTOM_VALIDATION_EXCEPTION' && createError.data) {
      const errorMessage = createError.data.message || createError.message || 'Validation error';
      throw new Error(errorMessage);
    }
    
    throw createError;
  }

  if (result.success) {
    console.log(`Project page created successfully in ${projectPageObjectName}: ${result.id}`);
    const pageName = pageData.pageName || pageData.pageDescription || `${pageData.projectPageType} Page`;
    
    return {
      success: true,
      salesforceId: result.id,
      objectType: projectPageObjectName,
      objectName: pageName,
      projectId: projectId,
      projectObjectiveId: projectObjectiveId
    };
  } else {
    const errors = result.errors || [];
    let errorMsg = '';
    if (errors.length === 1) {
      errorMsg = errors[0]?.message || errors[0]?.statusCode || errors[0]?.fields?.join(', ') || 'Unknown error';
    } else if (errors.length > 1) {
      const errorMessages = errors.map(err => {
        const field = err.fields ? ` (${err.fields.join(', ')})` : '';
        return `${err.message || err.statusCode || 'Unknown error'}${field}`;
      }).join('; ');
      errorMsg = `Multiple errors: ${errorMessages}`;
    } else {
      errorMsg = 'Unknown error';
    }
    
    throw new Error(`Failed to create project page in ${projectPageObjectName}: ${errorMsg}`);
  }
}

module.exports = {
  createProjectPageInSalesforce
};

