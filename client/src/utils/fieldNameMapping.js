/**
 * Field Name Mapping
 * Maps form field names to Salesforce API field names for help text lookup
 */

// Object type mappings
export const OBJECT_TYPE_MAP = {
  'Project': 'Project__c',
  'Project_Objective__c': 'Project_Objective__c',
  'ProjectObjective': 'Project_Objective__c',
  'Qualification_Step__c': 'Qualification_Step__c',
  'QualificationStep': 'Qualification_Step__c',
  'Project_Page__c': 'Project_Page__c',
  'ProjectPage': 'Project_Page__c',
  'Project_Workstream__c': 'Project_Workstream__c',
  'Workstream': 'Project_Workstream__c'
};

// Field name mappings for each object type
// Maps form field names (camelCase) to Salesforce API names (PascalCase with __c)
export const FIELD_NAME_MAP = {
  'Project__c': {
    'auditorProject': 'Auditor_Project__c',
    'projectName': 'Name',
    'shortProjectName': 'Short_Project_Name__c',
    'contributorProjectName': 'Contributor_Project_Name__c',
    'appenPartner': 'Appen_Partner__c',
    'jobCategory': 'Job_Category__c',
    'projectShortDescription': 'Project_Short_Description__c',
    'projectLongDescription': 'Project_Long_Description__c',
    'projectType': 'Project_Type__c',
    'projectPriority': 'Project_Priority__c',
    'workdayProjectId': 'Workday_Project_ID__c',
    'projectPage': 'Project_Page__c',
    'projectStatus': 'Project_Status__c'
  },
  'Project_Objective__c': {
    'contributorFacingProjectName': 'Contributor_Facing_Project_Name__c',
    'projectObjectiveName': 'Project_Objective_Name__c',
    'appendToObjectiveName': 'Append_to_Objective_Name__c'
  },
  'Project_Workstream__c': {
    'deliveryToolName': 'Delivery_Tool_Name__c',
    'clientWorkstreamIdentifier': 'Client_Workstream_Identifier__c',
    'functionality': 'Functionality__c'
  }
};

/**
 * Get Salesforce field name from form field name
 * @param {string} objectType - Object type (e.g., 'Project', 'Project_Objective__c')
 * @param {string} formFieldName - Form field name (e.g., 'projectName', 'shortProjectName')
 * @returns {string} Salesforce API field name
 */
export const getSalesforceFieldName = (objectType, formFieldName) => {
  const salesforceObjectType = OBJECT_TYPE_MAP[objectType] || objectType;
  const fieldMap = FIELD_NAME_MAP[salesforceObjectType] || {};
  
  // Check if there's a mapping
  if (fieldMap[formFieldName]) {
    return fieldMap[formFieldName];
  }
  
  // If no mapping, try to convert camelCase to PascalCase with __c
  // This is a fallback for fields that follow the standard naming convention
  const pascalCase = formFieldName
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_');
  
  // Check if it should have __c suffix (custom fields)
  // For now, assume custom fields have __c suffix
  return `${pascalCase}__c`;
};

/**
 * Get object type for help text lookup
 * @param {string} objectType - Object type (e.g., 'Project', 'ProjectObjective')
 * @returns {string} Salesforce object type
 */
export const getObjectTypeForHelp = (objectType) => {
  return OBJECT_TYPE_MAP[objectType] || objectType;
};
