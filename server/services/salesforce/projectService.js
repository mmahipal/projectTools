// Salesforce project service

const jsforce = require('jsforce');
const { createSalesforceConnection } = require('./connectionService');
const { sanitizeSearchTerm, isValidSalesforceId } = require('../../utils/security');
const { getSettingsPath } = require('../../utils/salesforce/dataStorage');
const { decrypt } = require('../../utils/salesforce/encryption');
const { getObjectDescribe } = require('./metadataCache');

/**
 * Get Project Manager RecordTypeId
 * @param {jsforce.Connection} conn - Salesforce connection
 * @returns {Promise<string|null>} RecordTypeId or null
 */
const getProjectManagerRecordTypeId = async (conn) => {
  try {
    const recordTypeQuery = `SELECT Id, DeveloperName, Name FROM RecordType WHERE SObjectType = 'User' AND (DeveloperName = 'Project_Manager' OR Name = 'Project Manager') LIMIT 1`;
    const recordTypeResult = await conn.query(recordTypeQuery);
    if (recordTypeResult.records && recordTypeResult.records.length > 0) {
      const recordTypeId = recordTypeResult.records[0].Id;
      console.log(`Found Project Manager RecordTypeId: ${recordTypeId}`);
      return recordTypeId;
    }
    console.warn('Project Manager RecordType not found. Record type validation will be skipped.');
    return null;
  } catch (error) {
    console.warn(`Error finding Project Manager RecordType: ${error.message}. Record type validation will be skipped.`);
    return null;
  }
};

/**
 * Convert person field (email/name/ID) to User ID
 * @param {jsforce.Connection} conn - Salesforce connection
 * @param {string} fieldValue - Field value (email, name, or ID)
 * @param {string} fieldName - Field name for logging
 * @param {boolean} requireUserOnly - Require User only (not Contact)
 * @param {boolean} requireProjectManagerRecordType - Require Project Manager record type
 * @param {string|null} projectManagerRecordTypeId - Project Manager RecordTypeId
 * @returns {Promise<string|null>} User/Contact ID or null
 */
const convertPersonFieldToId = async (conn, fieldValue, fieldName, requireUserOnly = false, requireProjectManagerRecordType = false, projectManagerRecordTypeId = null) => {
  if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
    return null;
  }
  
  const value = typeof fieldValue === 'string' ? fieldValue.trim() : String(fieldValue);
  
  // Check if it's already a Salesforce ID
  const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
  if (salesforceIdPattern.test(value)) {
    if (requireUserOnly) {
      if (value.startsWith('005')) {
        try {
          if (!isValidSalesforceId(value)) {
            throw new Error('Invalid Salesforce ID format');
          }
          const verifyQuery = `SELECT Id, Name, RecordTypeId FROM User WHERE Id = '${value}' AND IsActive = true LIMIT 1`;
          const verifyResult = await conn.query(verifyQuery);
          if (verifyResult.records && verifyResult.records.length > 0) {
            const user = verifyResult.records[0];
            if (requireProjectManagerRecordType && projectManagerRecordTypeId) {
              if (user.RecordTypeId === projectManagerRecordTypeId) {
                console.log(`Verified ${fieldName} User ID: ${value} with correct Project Manager record type`);
                return value;
              } else {
                console.error(`${fieldName} User ID ${value} exists but does NOT have Project Manager record type.`);
                throw new Error(`The selected ${fieldName}'s record type must be Project Manager.`);
              }
            } else {
              console.log(`Verified ${fieldName} User ID: ${value}`);
              return value;
            }
          } else {
            console.warn(`${fieldName} ID ${value} is not a valid active User`);
            return null;
          }
        } catch (verifyError) {
          if (verifyError.message && verifyError.message.includes('record type must be')) {
            throw verifyError;
          }
          if (requireProjectManagerRecordType && projectManagerRecordTypeId) {
            throw new Error(`Unable to verify ${fieldName} record type: ${verifyError.message}`);
          }
          console.warn(`Returning ${fieldName} ID anyway - Salesforce will validate: ${value}`);
          return value;
        }
      } else {
        console.warn(`${fieldName} ID ${value} is not a User ID (doesn't start with 005)`);
        return null;
      }
    }
    return value;
  }
  
  // It's not an ID, try to find by email or name
  try {
    const sanitizedValue = sanitizeSearchTerm(value);
    let userQuery = `SELECT Id FROM User WHERE (Email = '${sanitizedValue}' OR Name = '${sanitizedValue}') AND IsActive = true`;
    if (requireProjectManagerRecordType && projectManagerRecordTypeId) {
      if (!isValidSalesforceId(projectManagerRecordTypeId)) {
        throw new Error('Invalid RecordType ID format');
      }
      userQuery += ` AND RecordTypeId = '${projectManagerRecordTypeId}'`;
    }
    userQuery += ' LIMIT 1';
    let userResult = await conn.query(userQuery);
    if (userResult.records && userResult.records.length > 0) {
      console.log(`Found ${fieldName} User ID: ${userResult.records[0].Id} for ${value}`);
      return userResult.records[0].Id;
    }
    
    if (!requireUserOnly) {
      const contactQuery = `SELECT Id FROM Contact WHERE (Email = '${sanitizedValue}' OR Name = '${sanitizedValue}') LIMIT 1`;
      let contactResult = await conn.query(contactQuery);
      if (contactResult.records && contactResult.records.length > 0) {
        console.log(`Found ${fieldName} Contact ID: ${contactResult.records[0].Id} for ${value}`);
        return contactResult.records[0].Id;
      }
    }
    
    console.warn(`${fieldName} not found: ${value}`);
    return null;
  } catch (error) {
    console.error(`Error looking up ${fieldName}: ${error.message}`);
    return null;
  }
};

/**
 * Create project in Salesforce
 * @param {Object} projectData - Project data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Creation result
 */
const createProjectInSalesforce = async (projectData, user) => {
  // Create Salesforce connection
  const conn = await createSalesforceConnection();

  // Get Project Manager RecordTypeId for validation
  const projectManagerRecordTypeId = await getProjectManagerRecordTypeId(conn);

  // Log incoming project data for debugging
  console.log('=== CREATE PROJECT IN SALESFORCE ===');
  console.log('Project Manager from request:', projectData.projectManager);
  console.log('Project Manager type:', typeof projectData.projectManager);
  console.log('Team Members from request:', JSON.stringify(projectData.teamMembers, null, 2));
  console.log('Team Members count:', projectData.teamMembers ? projectData.teamMembers.length : 0);
  console.log('Team Members sample:', projectData.teamMembers && projectData.teamMembers.length > 0 ? {
    member: projectData.teamMembers[0].member,
    memberId: projectData.teamMembers[0].memberId,
    role: projectData.teamMembers[0].role
  } : 'No team members');
  
  // Convert Project Manager email/name to User ID if needed (Project Manager must be a User with Project Manager record type)
  let projectManagerId = await convertPersonFieldToId(conn, projectData.projectManager, 'Project Manager', true, true, projectManagerRecordTypeId);
  
  console.log('Converted Project Manager ID:', projectManagerId);
  console.log('Project Manager ID type:', typeof projectManagerId);
  
  // Convert all People section fields to IDs in parallel to avoid N+1 query problem
  const peopleFields = [
    'programManager', 'qualityLead', 'productivityLead', 'reportingLead',
    'invoicingLead', 'projectSupportLead', 'recruitmentLead', 'qualificationLead', 'onboardingLead'
  ];
  
  // Parallelize person field conversions to improve performance
  const peopleFieldPromises = peopleFields.map(field => 
    convertPersonFieldToId(conn, projectData[field], field)
      .then(fieldId => ({ field, fieldId }))
      .catch(error => {
        console.warn(`Error converting ${field} to ID:`, error.message);
        return { field, fieldId: null };
      })
  );
  
  const peopleFieldResults = await Promise.all(peopleFieldPromises);
  const peopleFieldIds = {};
  peopleFieldResults.forEach(({ field, fieldId }) => {
    if (fieldId) {
      peopleFieldIds[field] = fieldId;
    }
  });

  // Convert Account name to Account ID if needed
  let accountId = projectData.account;
  if (projectData.account && projectData.account.trim() !== '') {
    // Check if it's already a Salesforce ID (15 or 18 characters)
    const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
    if (!salesforceIdPattern.test(projectData.account)) {
      // It's not an ID, try to find by name
      try {
        // Sanitize account name to prevent SQL injection
        const sanitizedAccount = sanitizeSearchTerm(projectData.account);
        const accountQuery = `SELECT Id FROM Account WHERE Name = '${sanitizedAccount}' LIMIT 1`;
        const accountResult = await conn.query(accountQuery);
        if (accountResult.records && accountResult.records.length > 0) {
          accountId = accountResult.records[0].Id;
          console.log(`Found Account ID: ${accountId} for ${projectData.account}`);
        } else {
          console.warn(`Account not found: ${projectData.account}`);
        }
      } catch (accountError) {
        console.error(`Error looking up Account: ${accountError.message}`);
      }
    }
  }

  // Before mapping, check the Project_Manager__c field definition to see what it references
  let projectManagerFieldInfo = null;
  let validatedProjectManagerId = null;
  
  try {
    // Use cached object description (1 hour TTL) - significant performance improvement
    const objectDescribe = await getObjectDescribe(conn, 'Project__c', user?.id);
    const projectManagerField = objectDescribe.fields.find(f => f.name === 'Project_Manager__c');
    
    if (projectManagerField) {
      projectManagerFieldInfo = {
        name: projectManagerField.name,
        type: projectManagerField.type,
        referenceTo: projectManagerField.referenceTo || [],
        relationshipName: projectManagerField.relationshipName
      };
      
      console.log('Project_Manager__c field info:', JSON.stringify(projectManagerFieldInfo, null, 2));
      
      // Validate the Project Manager ID matches the expected reference type
      if (projectManagerId) {
        // Check what object types this field accepts
        const acceptsUser = projectManagerFieldInfo.referenceTo.includes('User');
        const acceptsContact = projectManagerFieldInfo.referenceTo.includes('Contact');
        
        console.log(`Project_Manager__c accepts User: ${acceptsUser}, Contact: ${acceptsContact}`);
        console.log(`Project Manager ID: ${projectManagerId}, starts with 005: ${projectManagerId.startsWith('005')}`);
        
        // If it only accepts User and we have a User ID, use it (record type check is done in convertPersonFieldToId)
        if (acceptsUser && projectManagerId.startsWith('005')) {
          // Use the ID - record type validation was already done in convertPersonFieldToId
          // If it passed there, use it. If it didn't, we still use it and let Salesforce validate
          validatedProjectManagerId = projectManagerId;
          console.log('Using Project Manager ID (record type validation done earlier):', validatedProjectManagerId);
        } 
        // If it only accepts Contact, we need to convert User to Contact or find Contact
        else if (acceptsContact && !acceptsUser && projectManagerId.startsWith('005')) {
          console.warn('Project_Manager__c field only accepts Contact, but we have a User ID. Attempting to find related Contact...');
          // Try to find a Contact with the same email as the User
          try {
            const userQuery = `SELECT Email FROM User WHERE Id = '${projectManagerId.replace(/'/g, "''")}' LIMIT 1`;
            const userResult = await conn.query(userQuery);
            if (userResult.records && userResult.records.length > 0 && userResult.records[0].Email) {
              const contactQuery = `SELECT Id FROM Contact WHERE Email = '${userResult.records[0].Email.replace(/'/g, "''")}' LIMIT 1`;
              const contactResult = await conn.query(contactQuery);
              if (contactResult.records && contactResult.records.length > 0) {
                validatedProjectManagerId = contactResult.records[0].Id;
                console.log('Found Contact ID for Project Manager:', validatedProjectManagerId);
              } else {
                console.warn('No Contact found with User email, Project Manager will be omitted');
                validatedProjectManagerId = null;
              }
            }
          } catch (contactLookupError) {
            console.error('Error looking up Contact for Project Manager:', contactLookupError.message);
            validatedProjectManagerId = null;
          }
        }
        // If it accepts both, use the User ID (record type validation was done in convertPersonFieldToId)
        else if (acceptsUser && projectManagerId.startsWith('005')) {
          // Use the ID - record type validation was already done in convertPersonFieldToId
          validatedProjectManagerId = projectManagerId;
          console.log('Using Project Manager ID (field accepts both User and Contact):', validatedProjectManagerId);
        }
        // If it's a Contact ID and field accepts Contact, use it
        else if (acceptsContact && projectManagerId.startsWith('003')) {
          validatedProjectManagerId = projectManagerId;
        }
        else {
          console.warn(`Project Manager ID ${projectManagerId} doesn't match expected type. Field accepts: ${projectManagerFieldInfo.referenceTo.join(', ')}`);
          validatedProjectManagerId = null;
        }
      }
    } else {
      console.warn('Project_Manager__c field not found in Project__c object');
    }
  } catch (describeError) {
    console.error('Error describing Project__c object:', describeError.message);
    // Fall back to using the ID as-is if we can't check the field definition
    validatedProjectManagerId = projectManagerId;
  }

  // Map project data to Salesforce object fields
  const salesforceProjectData = {
    // Basic Information Fields
    Name: projectData.projectName || projectData.name || 'New Project',
    Short_Project_Name__c: projectData.shortProjectName,
    Contributor_Project_Name__c: projectData.contributorProjectName,
    Auditor_Project__c: projectData.auditorProject || false,
    Appen_Partner__c: projectData.appenPartner,
    Job_Category__c: projectData.jobCategory,
    Project_Short_Description__c: projectData.projectShortDescription,
    Project_Long_Description__c: projectData.projectLongDescription,
    Project_Type__c: projectData.projectType,
    Project_Priority__c: projectData.projectPriority,
    Project_ID_for_Reports__c: projectData.projectIdForReports,
    Workday_Project_ID__c: projectData.workdayProjectId,
    Account__c: accountId,
    Program_Name__c: projectData.programName,
    Hire_Start_Date__c: projectData.hireStartDate,
    Predicted_Close_Date__c: projectData.predictedCloseDate,
    Delivery_Tool_Org__c: projectData.deliveryToolOrg,
    Delivery_Tool_Name__c: projectData.deliveryToolName,
    Project_Page__c: projectData.projectPage,
    // Project Status - use the value from projectData, don't default to anything
    // If projectData.projectStatus is undefined/null/empty, use null (not 'Draft')
    Project_Status__c: (projectData.projectStatus && String(projectData.projectStatus).trim() !== '') ? String(projectData.projectStatus).trim() : null,
    
    // Contributor Active Status Fields
    Payment_Setup_Required__c: projectData.paymentSetupRequired || false,
    Manual_Activation_Required__c: projectData.manualActivationRequired || false,
    Client_Tool_Account_Required__c: projectData.clientToolAccountRequired || false
  };
  
  // Add Created By field with user's name/email
  // Try to find Created_By__c or Created_By field in Salesforce object
  try {
    const projectDescribe = await conn.sobject('Project__c').describe();
    const createdByField = projectDescribe.fields.find(f => 
      (f.name === 'Created_By__c' || f.name === 'Created_By') && 
      (f.type === 'string' || f.type === 'text' || f.type === 'email')
    );
    if (createdByField && createdByField.createable) {
      // Use user's name if available, otherwise use email
      const createdByName = user.name || user.email || 'Unknown User';
      salesforceProjectData[createdByField.name] = createdByName;
      console.log(`Setting ${createdByField.name} to: ${createdByName}`);
    }
  } catch (describeError) {
    // If field doesn't exist or can't be described, try common field names
    const commonCreatedByFields = ['Created_By__c', 'Created_By', 'Created_By_Name__c'];
    for (const fieldName of commonCreatedByFields) {
      try {
        const field = await getObjectDescribe(conn, 'Project__c', user?.id).then(desc => 
          desc.fields.find(f => f.name === fieldName && (f.type === 'string' || f.type === 'text' || f.type === 'email') && f.createable)
        );
        if (field) {
          const createdByName = user.name || user.email || 'Unknown User';
          salesforceProjectData[fieldName] = createdByName;
          console.log(`Setting ${fieldName} to: ${createdByName}`);
          break;
        }
      } catch (e) {
        // Continue to next field
      }
    }
  }

  // Determine final Project Manager ID before adding to object
  // Always set Project_Manager__c if we have a projectManagerId (validation was done earlier)
  // Use validatedProjectManagerId if available, otherwise fall back to projectManagerId
  // Also check if projectData.projectManager is already a valid ID (in case conversion failed but it's still valid)
  const finalProjectManagerId = validatedProjectManagerId || projectManagerId || 
    (projectData.projectManager && /^[a-zA-Z0-9]{15,18}$/.test(String(projectData.projectManager).trim()) ? projectData.projectManager.trim() : null);
  
  console.log('Final Project Manager ID determination:', {
    validatedProjectManagerId,
    projectManagerId,
    projectDataProjectManager: projectData.projectManager,
    finalProjectManagerId
  });
  
  // Add Project Manager to the salesforceProjectData object if we have a valid ID
  // Only set if the field actually accepts the type we're providing
  if (finalProjectManagerId && projectManagerFieldInfo) {
    const acceptsUser = projectManagerFieldInfo.referenceTo.includes('User');
    const acceptsContact = projectManagerFieldInfo.referenceTo.includes('Contact');
    const isUserId = finalProjectManagerId.startsWith('005');
    const isContactId = finalProjectManagerId.startsWith('003');
    
    // Only set if the field type matches what we have
    if (projectManagerFieldInfo.type === 'reference') {
      // It's a lookup field - check if it accepts our ID type
      if ((isUserId && acceptsUser) || (isContactId && acceptsContact)) {
        salesforceProjectData.Project_Manager__c = finalProjectManagerId;
        console.log(`Setting Project_Manager__c to ${finalProjectManagerId} (${isUserId ? 'User' : 'Contact'} ID)`);
      } else {
        console.warn(`Project_Manager__c field does not accept ${isUserId ? 'User' : 'Contact'} IDs. Field accepts: ${projectManagerFieldInfo.referenceTo.join(', ')}. Skipping Project Manager.`);
        // Don't set the field - let Salesforce use its default or validation will catch it
      }
    } else if (projectManagerFieldInfo.type === 'email' || projectManagerFieldInfo.type === 'string' || projectManagerFieldInfo.type === 'text') {
      // It's a text/email field - we can't set an ID, need to get the email/name
      console.warn(`Project_Manager__c is a ${projectManagerFieldInfo.type} field, not a lookup. Cannot set User ID. Attempting to get email/name...`);
      try {
        if (isUserId) {
          const userQuery = `SELECT Email, Name FROM User WHERE Id = '${finalProjectManagerId.replace(/'/g, "''")}' LIMIT 1`;
          const userResult = await conn.query(userQuery);
          if (userResult.records && userResult.records.length > 0) {
            const userEmail = userResult.records[0].Email || userResult.records[0].Name;
            if (userEmail) {
              salesforceProjectData.Project_Manager__c = userEmail;
              console.log(`Setting Project_Manager__c to email/name: ${userEmail}`);
            }
          }
        } else if (isContactId) {
          const contactQuery = `SELECT Email, Name FROM Contact WHERE Id = '${finalProjectManagerId.replace(/'/g, "''")}' LIMIT 1`;
          const contactResult = await conn.query(contactQuery);
          if (contactResult.records && contactResult.records.length > 0) {
            const contactEmail = contactResult.records[0].Email || contactResult.records[0].Name;
            if (contactEmail) {
              salesforceProjectData.Project_Manager__c = contactEmail;
              console.log(`Setting Project_Manager__c to email/name: ${contactEmail}`);
            }
          }
        }
      } catch (lookupError) {
        console.error('Error looking up email/name for Project Manager:', lookupError.message);
        // Don't set the field if we can't get the email/name
      }
    } else {
      console.warn(`Project_Manager__c field type is ${projectManagerFieldInfo.type}, cannot set User/Contact ID. Skipping.`);
    }
  } else if (finalProjectManagerId && !projectManagerFieldInfo) {
    // Field info not available, but we have an ID - try to set it and let Salesforce validate
    console.warn('Project_Manager__c field info not available, attempting to set ID anyway. Salesforce will validate.');
    salesforceProjectData.Project_Manager__c = finalProjectManagerId;
  }
  
  // Add People Fields - use converted IDs
  salesforceProjectData.Program_Manager__c = peopleFieldIds.programManager || null;
  salesforceProjectData.Quality_Lead__c = peopleFieldIds.qualityLead || null;
  salesforceProjectData.Productivity_Lead__c = peopleFieldIds.productivityLead || null;
  salesforceProjectData.Reporting_Lead__c = peopleFieldIds.reportingLead || null;
  salesforceProjectData.Invoicing_Lead__c = peopleFieldIds.invoicingLead || null;
  salesforceProjectData.Project_Support_Lead__c = peopleFieldIds.projectSupportLead || null;
  salesforceProjectData.Cases_DC_Support_Team__c = projectData.casesDCSupportTeam || false;
  salesforceProjectData.Recruitment_Lead__c = peopleFieldIds.recruitmentLead || null;
  salesforceProjectData.Qualification_Lead__c = peopleFieldIds.qualificationLead || null;
  salesforceProjectData.Onboarding_Lead__c = peopleFieldIds.onboardingLead || null;
  
  // Add Rates Fields
  salesforceProjectData.Project_Incentive__c = projectData.projectIncentive;
  
  // Add Funnel Totals Fields
  salesforceProjectData.Total_Applied__c = projectData.totalApplied;
  salesforceProjectData.Total_Qualified__c = projectData.totalQualified;
  
  // Add Funnel Stages Fields
  salesforceProjectData.Invited_Available_Contributors__c = projectData.invitedAvailableContributors;
  salesforceProjectData.Registered_Contributors__c = projectData.registeredContributors;
  salesforceProjectData.App_Received__c = projectData.appReceived;
  salesforceProjectData.Qualified_Contributors__c = projectData.qualifiedContributors;
  salesforceProjectData.Matched_Contributors__c = projectData.matchedContributors;
  salesforceProjectData.Active_Contributors__c = projectData.activeContributors;
  salesforceProjectData.AC_Account__c = projectData.acAccount;
  salesforceProjectData.Production_Contributors__c = projectData.productionContributors;
  salesforceProjectData.Applied_Contributors__c = projectData.appliedContributors;
  salesforceProjectData.Removed__c = projectData.removed;
  
  // Add Lever Requisition Actions Fields
  salesforceProjectData.Requisition_Action__c = projectData.requisitionAction;
  
  // Add Lever Requisition Fields
  salesforceProjectData.Lever_Req_Name__c = projectData.leverReqName;
  salesforceProjectData.Requisition_Status__c = projectData.requisitionStatus;
  salesforceProjectData.Lever_Req_Code__c = projectData.leverReqCode;
  salesforceProjectData.Lever_Time_to_Fill_Start__c = projectData.leverTimeToFillStart;
  salesforceProjectData.Lever_Crowd_Hiring_Manager_Email__c = projectData.leverCrowdHiringManagerEmail;
  salesforceProjectData.Lever_Time_to_Fill_End__c = projectData.leverTimeToFillEnd;
  salesforceProjectData.Lever_Crowd_Owner_Email__c = projectData.leverCrowdOwnerEmail;
  salesforceProjectData.Lever_Req_Description__c = projectData.leverReqDescription;
  salesforceProjectData.Lever_Compensation_Band__c = projectData.leverCompensationBand;
  salesforceProjectData.Lever_Location__c = projectData.leverLocation;
  salesforceProjectData.Lever_Department__c = projectData.leverDepartment;
  salesforceProjectData.Lever_Work_Type__c = projectData.leverWorkType;
  salesforceProjectData.Lever_SVP__c = projectData.leverSVP;
  salesforceProjectData.Lever_SVP2__c = projectData.leverSVP2;
  
  // Add Lever Admin Fields
  salesforceProjectData.Lever_Requisition_ID__c = projectData.leverRequisitionID;
  salesforceProjectData.Lever_Requisition_Create_Date__c = projectData.leverRequisitionCreateDate;
  
  // Add Payment Configurations Fields
  salesforceProjectData.Project_Payment_Method__c = projectData.projectPaymentMethod;
  salesforceProjectData.Require_PM_Approval_for_Productivity__c = projectData.requirePMApprovalForProductivity || false;
  salesforceProjectData.Release_System_Tracked_Data__c = projectData.releaseSystemTrackedData;
  
  // Add Activation Fields
  salesforceProjectData.Activate_Comms_Invited__c = projectData.activateCommsInvited || false;
  salesforceProjectData.Activate_Comms_Applied__c = projectData.activateCommsApplied || false;
  salesforceProjectData.Activate_Comms_Onboarding__c = projectData.activateCommsOnboarding || false;
  salesforceProjectData.Activate_Comms_Failed__c = projectData.activateCommsFailed || false;
  
  // Remove undefined/null/empty string values to avoid Salesforce errors
  // BUT always keep required fields (Name, Contributor_Project_Name__c, Project_Type__c)
  Object.keys(salesforceProjectData).forEach(key => {
    const value = salesforceProjectData[key];
    // Always keep Name field - it's required in Salesforce
    if (key === 'Name') {
      // Ensure Name always has a value
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        salesforceProjectData[key] = 'New Project';
      }
      return; // Don't delete Name field
    }
    
    // Keep required fields even if empty (will set defaults below)
    const requiredFields = ['Contributor_Project_Name__c', 'Project_Type__c'];
    if (requiredFields.includes(key)) {
      // If empty, we'll set a default below, but don't delete it yet
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        // Keep it but mark for default value
        return;
      }
      return; // Don't delete required fields
    }
    
    // Keep Project_Status__c even if empty (it's a valid field that can be empty)
    // But ensure it's set to the value from projectData if it was provided
    if (key === 'Project_Status__c') {
      // Always use the value from projectData if it exists and is not empty
      const projectStatusValue = projectData.projectStatus ? String(projectData.projectStatus).trim() : '';
      if (projectStatusValue !== '') {
        salesforceProjectData[key] = projectStatusValue;
        console.log(`Project Status from projectData: "${projectStatusValue}" - using this value`);
      } else if (value && value.trim() !== '') {
        // If projectData doesn't have it but the mapped value exists, keep it
        console.log(`Project Status from mapped value: "${value}" - keeping this value`);
      } else {
        // If both are empty, set to null (not 'Draft')
        salesforceProjectData[key] = null;
        console.log(`Project Status is empty - setting to null (not 'Draft')`);
      }
      return; // Don't delete Project Status field
    }
    
    // For other fields, remove empty values
    if (value === undefined || value === null || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
      delete salesforceProjectData[key];
    }
  });
  
  // Ensure Name field is always present and has a value
  if (!salesforceProjectData.Name || salesforceProjectData.Name.trim() === '') {
    salesforceProjectData.Name = projectData.projectName || projectData.name || 'New Project';
  }
  
  // Ensure required fields have default values if empty
  if (!salesforceProjectData.Contributor_Project_Name__c || salesforceProjectData.Contributor_Project_Name__c.trim() === '') {
    salesforceProjectData.Contributor_Project_Name__c = salesforceProjectData.Name || 'New Project';
  }
  
  if (!salesforceProjectData.Project_Type__c || salesforceProjectData.Project_Type__c.trim() === '') {
    salesforceProjectData.Project_Type__c = 'General'; // Default project type
  }

  // Log the data being sent to Salesforce (without sensitive info)
  console.log('Creating project in Salesforce with', Object.keys(salesforceProjectData).length, 'fields');
  console.log('Salesforce object type: Project__c');
  console.log('Project Name (mapped to Name field):', salesforceProjectData.Name);

  // Check if Project__c object exists before attempting to create
  let objectType = 'Project__c';
  let projectObjectExists = false;
  
  try {
    // Try to describe the object to check if it exists
    // Use cached object description for better performance
    const objectDescribe = await getObjectDescribe(conn, objectType, user?.id);
    projectObjectExists = true;
    console.log(`Project__c object exists. Label: ${objectDescribe.label}, Fields: ${objectDescribe.fields.length}`);
  } catch (describeError) {
    // Object doesn't exist or user doesn't have access
    const errorMessage = describeError.message || 'Unknown error';
    if (errorMessage.includes('INVALID_TYPE') || errorMessage.includes('NOT_FOUND') || errorMessage.includes('No such column')) {
      console.error('Project__c object does not exist in Salesforce');
      throw new Error(
        'Project__c custom object does not exist in your Salesforce instance. ' +
        'Please create the Project__c custom object in Salesforce with the required fields. ' +
        'See documentation for field mapping details.'
      );
    } else {
      // Other error (permissions, etc.)
      console.error('Error checking Project__c object:', errorMessage);
      throw new Error(
        `Cannot access Project__c object in Salesforce: ${errorMessage}. ` +
        'Please verify that the Project__c object exists and you have permissions to create records.'
      );
    }
  }

  // Create project in Project__c (object exists and is accessible)
  let createdRecord;
  try {
    // Get object metadata to validate field values
    // Use cached object description for better performance
    const objectDescribe = await getObjectDescribe(conn, objectType, user?.id);
    const fieldMap = {};
    objectDescribe.fields.forEach(field => {
      fieldMap[field.name] = field;
    });
    
    // Remove fields with invalid picklist values and lookup fields with invalid IDs
    // BUT always preserve required fields (Name, Contributor_Project_Name__c, Project_Type__c)
    const cleanedData = { ...salesforceProjectData };
    const requiredFields = ['Name', 'Contributor_Project_Name__c', 'Project_Type__c'];
    
    Object.keys(cleanedData).forEach(fieldName => {
      // Always keep required fields - they're required in Salesforce
      if (requiredFields.includes(fieldName)) {
        // Ensure required fields have values
        if (!cleanedData[fieldName] || (typeof cleanedData[fieldName] === 'string' && cleanedData[fieldName].trim() === '')) {
          if (fieldName === 'Name') {
            cleanedData[fieldName] = projectData.projectName || projectData.name || 'New Project';
          } else if (fieldName === 'Contributor_Project_Name__c') {
            cleanedData[fieldName] = projectData.contributorProjectName || projectData.projectName || projectData.name || 'New Project';
          } else if (fieldName === 'Project_Type__c') {
            cleanedData[fieldName] = projectData.projectType || 'General';
          }
        }
        // Don't return here - we need to validate picklist values for required fields too
      }
      
      const field = fieldMap[fieldName];
      if (!field) {
        // Field doesn't exist in Salesforce, but don't remove required fields
        if (!requiredFields.includes(fieldName)) {
          console.warn(`Removing non-existent field: ${fieldName}`);
          delete cleanedData[fieldName];
        }
        return;
      }
      
      // Only include fields that are createable and updateable (but keep required fields)
      if (!field.createable || !field.updateable) {
        if (!requiredFields.includes(fieldName)) {
          console.warn(`Removing read-only field: ${fieldName} (createable: ${field.createable}, updateable: ${field.updateable})`);
          delete cleanedData[fieldName];
        }
        return;
      }
      
      // Handle picklist fields
      if (field.type === 'picklist' && field.restrictedPicklist) {
        const value = cleanedData[fieldName];
        if (value && !field.picklistValues.some(pv => pv.value === value)) {
          // Special handling for Project_Status__c - always preserve the value from projectData
          if (fieldName === 'Project_Status__c') {
            // Always use the value from projectData if it exists and is not empty
            const projectStatusValue = projectData.projectStatus ? String(projectData.projectStatus).trim() : '';
            if (projectStatusValue !== '') {
              cleanedData[fieldName] = projectStatusValue;
              console.log(`Project Status picklist validation: preserving value from projectData: "${projectStatusValue}"`);
            } else if (value && String(value).trim() !== '') {
              // If projectData doesn't have it, keep the current value (let Salesforce validate)
              cleanedData[fieldName] = String(value).trim();
              console.log(`Project Status picklist validation: keeping current value "${value}" (not in picklist, but preserving)`);
            } else {
              // If both are empty, set to null
              cleanedData[fieldName] = null;
              console.log(`Project Status picklist validation: both projectData and current value are empty, setting to null`);
            }
            return; // Don't remove Project Status field
          }
          
          // If this is a required field, set a default valid value instead of removing
          if (requiredFields.includes(fieldName)) {
            // Find the first active picklist value as default
            const defaultValue = field.picklistValues.find(pv => pv.active !== false)?.value || field.picklistValues[0]?.value;
            if (defaultValue) {
              console.warn(`Invalid picklist value for required field ${fieldName}: "${value}". Setting to default: "${defaultValue}"`);
              cleanedData[fieldName] = defaultValue;
            } else {
              console.warn(`No valid picklist values found for required field ${fieldName}, keeping original value: ${value}`);
            }
          } else {
            // For non-required fields, remove invalid values
            console.warn(`Removing invalid picklist value for ${fieldName}: ${value}`);
            delete cleanedData[fieldName];
          }
        }
      }
      
      // Handle lookup/reference fields - they need Salesforce IDs, not emails
      if (field.type === 'reference' || field.type === 'lookup') {
        const value = cleanedData[fieldName];
        // If it's not a valid Salesforce ID (15 or 18 characters, alphanumeric), remove it
        // BUT preserve Project_Manager__c even if validation fails (let Salesforce handle it)
        if (value && !/^[a-zA-Z0-9]{15,18}$/.test(value)) {
          if (fieldName === 'Project_Manager__c') {
            console.warn(`Project_Manager__c has invalid ID format: ${value}, but keeping it - Salesforce will validate`);
            // Keep it - don't delete
          } else {
            console.warn(`Removing invalid lookup value for ${fieldName}: ${value} (expected Salesforce ID)`);
            delete cleanedData[fieldName];
          }
        }
      }
      
      // Handle field length restrictions
      if (field.length && field.type === 'string') {
        const value = cleanedData[fieldName];
        if (value && typeof value === 'string' && value.length > field.length) {
          console.warn(`Truncating ${fieldName} from ${value.length} to ${field.length} characters`);
          cleanedData[fieldName] = value.substring(0, field.length);
        }
      }
    });
    
    // Ensure required fields are always present and have values (final check)
    if (!cleanedData.Name || cleanedData.Name.trim() === '') {
      cleanedData.Name = projectData.projectName || projectData.name || 'New Project';
      console.warn('Name field was empty, setting to default value:', cleanedData.Name);
    }
    
    if (!cleanedData.Contributor_Project_Name__c || cleanedData.Contributor_Project_Name__c.trim() === '') {
      cleanedData.Contributor_Project_Name__c = projectData.contributorProjectName || projectData.projectName || projectData.name || 'New Project';
      console.warn('Contributor_Project_Name__c field was empty, setting to default value:', cleanedData.Contributor_Project_Name__c);
    }
    
    if (!cleanedData.Project_Type__c || cleanedData.Project_Type__c.trim() === '') {
      // Try to get a valid picklist value for Project_Type__c
      const projectTypeField = fieldMap['Project_Type__c'];
      if (projectTypeField && projectTypeField.picklistValues && projectTypeField.picklistValues.length > 0) {
        const defaultValue = projectTypeField.picklistValues.find(pv => pv.active !== false)?.value || projectTypeField.picklistValues[0]?.value;
        cleanedData.Project_Type__c = defaultValue || 'General';
        console.warn('Project_Type__c field was empty, setting to default picklist value:', cleanedData.Project_Type__c);
      } else {
        cleanedData.Project_Type__c = 'General';
        console.warn('Project_Type__c field was empty, setting to default value:', cleanedData.Project_Type__c);
      }
    }
    
    // Log final cleaned data summary
    console.log(`Final cleaned data: ${Object.keys(cleanedData).length} fields (removed ${Object.keys(salesforceProjectData).length - Object.keys(cleanedData).length} invalid fields)`);
    console.log('Required fields check:', {
      Name: cleanedData.Name,
      Contributor_Project_Name__c: cleanedData.Contributor_Project_Name__c,
      Project_Type__c: cleanedData.Project_Type__c
    });
    
    createdRecord = await conn.sobject(objectType).create(cleanedData);
    
    if (!createdRecord.success) {
      const errorMsg = createdRecord.errors?.[0]?.message || 'Failed to create project in Salesforce';
      const errorFields = createdRecord.errors?.map(e => e.fields || []).flat() || [];
      console.error('Salesforce create error:', errorMsg, 'Fields:', errorFields);
      
      // Provide helpful error message
      if (errorFields.length > 0) {
        throw new Error(
          `${errorMsg} (Fields: ${errorFields.join(', ')}). ` +
          'Please verify that all required fields exist in Project__c and have correct values.'
        );
      } else {
        throw new Error(errorMsg);
      }
    }
    
    console.log('Project created successfully in Project__c:', createdRecord.id);
    console.log('Project Name:', cleanedData.Name);
    console.log('=== PROJECT STATUS DEBUG ===');
    console.log('Project Status in cleanedData:', cleanedData.Project_Status__c);
    console.log('Project Status from projectData:', projectData.projectStatus);
    console.log('Project Status type:', typeof cleanedData.Project_Status__c);
    console.log('Project Status in salesforceProjectData:', salesforceProjectData.Project_Status__c);
    
    // Verify and update Project Status if needed - ALWAYS update to ensure it matches what was sent
    if (cleanedData.Project_Status__c && cleanedData.Project_Status__c.trim() !== '') {
      try {
        // Wait a brief moment for Salesforce to process the creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Query the created record to check current status
        const verifyQuery = `SELECT Id, Name, Project_Status__c FROM Project__c WHERE Id = '${createdRecord.id}' LIMIT 1`;
        const verifyResult = await conn.query(verifyQuery);
        
        if (verifyResult.records && verifyResult.records.length > 0) {
          const actualStatus = verifyResult.records[0].Project_Status__c;
          const expectedStatus = cleanedData.Project_Status__c.trim();
          
          console.log('=== PROJECT STATUS VERIFICATION ===');
          console.log('Expected Project Status:', expectedStatus);
          console.log('Actual Project Status in Salesforce:', actualStatus);
          
          // ALWAYS update the status to match what was sent, even if it already matches
          // This ensures any workflows/triggers that might have changed it are overridden
          if (actualStatus !== expectedStatus || true) { // Always update to be safe
            console.log(`Updating Project Status from "${actualStatus}" to "${expectedStatus}"...`);
            try {
              const updateResult = await conn.sobject('Project__c').update({
                Id: createdRecord.id,
                Project_Status__c: expectedStatus
              });
              
              if (updateResult.success) {
                console.log(`✓ Project Status successfully updated to: "${expectedStatus}"`);
                
                // Verify the update was successful
                await new Promise(resolve => setTimeout(resolve, 500));
                const verifyUpdateQuery = `SELECT Id, Project_Status__c FROM Project__c WHERE Id = '${createdRecord.id}' LIMIT 1`;
                const verifyUpdateResult = await conn.query(verifyUpdateQuery);
                if (verifyUpdateResult.records && verifyUpdateResult.records.length > 0) {
                  const finalStatus = verifyUpdateResult.records[0].Project_Status__c;
                  console.log(`✓ Verified Project Status is now: "${finalStatus}"`);
                  if (finalStatus !== expectedStatus) {
                    console.warn(`⚠ WARNING: Project Status update may have been overridden by Salesforce workflow/trigger. Expected: "${expectedStatus}", Actual: "${finalStatus}"`);
                  }
                }
              } else {
                console.error('✗ Project Status update failed:', updateResult.errors);
                throw new Error(`Failed to update Project Status: ${updateResult.errors?.map(e => e.message).join(', ')}`);
              }
            } catch (updateError) {
              console.error('✗ Error updating Project Status:', updateError.message);
              console.error('Update error details:', updateError);
              // Don't throw - continue with project creation, but log the error
            }
          } else {
            console.log(`✓ Project Status already matches expected value: "${expectedStatus}"`);
          }
        }
      } catch (verifyError) {
        console.error('✗ Error verifying/updating Project Status:', verifyError.message);
        console.error('Verify error details:', verifyError);
        // Don't throw - continue with project creation, but log the error
      }
    } else {
      console.log('Project Status not provided or empty - skipping status update');
    }
    
    console.log('=== END PROJECT STATUS DEBUG ===');
    console.log('Project Manager ID in created record:', cleanedData.Project_Manager__c);
    console.log('Project Manager ID type:', typeof cleanedData.Project_Manager__c);
    
    // After creating the project, create team members if provided
    let teamMemberResults = [];
    console.log('=== TEAM MEMBERS PROCESSING ===');
    console.log('Project created with ID:', createdRecord.id);
    console.log('Raw teamMembers from projectData:', JSON.stringify(projectData.teamMembers, null, 2));
    console.log('teamMembers is array?', Array.isArray(projectData.teamMembers));
    console.log('teamMembers length:', projectData.teamMembers ? projectData.teamMembers.length : 0);
    console.log('teamMembers type:', typeof projectData.teamMembers);
    console.log('teamMembers value:', projectData.teamMembers);
    
    // CRITICAL: Check if teamMembers exists and is not empty
    if (!projectData.teamMembers) {
      console.log('⚠ WARNING: projectData.teamMembers is undefined or null');
    } else if (!Array.isArray(projectData.teamMembers)) {
      console.error('✗ ERROR: projectData.teamMembers is not an array. Type:', typeof projectData.teamMembers);
      console.error('✗ Value:', projectData.teamMembers);
    } else if (projectData.teamMembers.length === 0) {
      console.log('⚠ INFO: projectData.teamMembers is an empty array - no team members to process');
    }
    
    if (projectData.teamMembers && Array.isArray(projectData.teamMembers) && projectData.teamMembers.length > 0) {
      console.log(`Processing ${projectData.teamMembers.length} team members for project ${createdRecord.id}`);
      
      // Filter out empty team members
      const validTeamMembers = projectData.teamMembers.filter(tm => {
        const hasMember = tm && tm.member && tm.member.trim() !== '';
        const hasMemberId = tm && tm.memberId && tm.memberId.trim() !== '';
        const hasValidRole = tm && tm.role && tm.role !== '--None--';
        const isValid = hasMember && hasMemberId && hasValidRole;
        
        if (!isValid) {
          console.warn('⚠ Filtered out invalid team member:', {
            member: tm?.member || 'MISSING',
            memberId: tm?.memberId || 'MISSING',
            role: tm?.role || 'MISSING',
            reason: !hasMember ? 'missing member name' :
                    !hasMemberId ? 'missing memberId' :
                    !hasValidRole ? 'missing or invalid role' : 'unknown',
            fullObject: JSON.stringify(tm, null, 2)
          });
        }
        return isValid;
      });
      
      console.log(`Found ${validTeamMembers.length} valid team members to create (filtered from ${projectData.teamMembers.length})`);
      if (validTeamMembers.length === 0) {
        console.error('✗ CRITICAL: No valid team members found after filtering!');
        console.error('✗ This means team members will NOT be created in Salesforce.');
        console.error('✗ Check the filtered out team members above to see why they were invalid.');
      } else {
        console.log('✓ Valid team members:', JSON.stringify(validTeamMembers, null, 2));
      }
      
      // Try to create Team Member records in Salesforce Team Members object
      // Try multiple possible object names - try Project_Team_Member__c first as it's most common
      const possibleObjectNames = ['Project_Team_Member__c', 'Team_Member__c', 'Team_Members__c', 'Project_Team__c'];
      let teamMemberObjectName = null;
      let teamMemberObjectDescribe = null;
      
      // Find which Team Member object exists
      for (const objName of possibleObjectNames) {
        try {
          // Use cached object description
          const describe = await getObjectDescribe(conn, objName, user?.id);
          teamMemberObjectName = objName;
          teamMemberObjectDescribe = describe;
          console.log(`Found Team Member object: ${objName}`);
          break;
        } catch (objError) {
          // Object doesn't exist, try next one
          console.log(`Team Member object ${objName} does not exist, trying next...`);
        }
      }
      
      if (!teamMemberObjectName) {
        console.error('=== CRITICAL: No Team Member object found in Salesforce ===');
        console.error('Tried object names:', possibleObjectNames.join(', '));
        console.error('Team members will NOT be created as separate records.');
        console.error('This means team members will NOT appear in Salesforce Project Teams section.');
        console.error('Please ensure one of these objects exists in Salesforce:', possibleObjectNames.join(', '));
        
        // Mark all team members as skipped with detailed error
        validTeamMembers.forEach(tm => {
          teamMemberResults.push({
            member: tm.member,
            memberId: tm.memberId,
            role: tm.role,
            status: 'skipped',
            reason: `Team Member object not found in Salesforce. Tried: ${possibleObjectNames.join(', ')}`,
            error: 'No Team Member object exists in Salesforce. Please create Project_Team_Member__c or similar object.'
          });
        });
      } else {
        // Object exists, create team member records
        console.log(`Creating ${validTeamMembers.length} team member records in ${teamMemberObjectName}...`);
        
        for (const teamMember of validTeamMembers) {
          try {
            console.log(`Processing team member: ${teamMember.member} (${teamMember.memberId}) with role: ${teamMember.role}`);
            
            // Get all fields with their metadata
            const allFields = teamMemberObjectDescribe.fields;
            const fieldMap = new Map(allFields.map(f => [f.name, f]));
            
            // Find Project field (lookup to Project__c)
            let projectField = null;
            const projectFieldCandidates = ['Project__c', 'Project_Id__c', 'Related_Project__c'];
            for (const candidate of projectFieldCandidates) {
              const field = fieldMap.get(candidate);
              if (field && field.type === 'reference') {
                projectField = candidate;
                break;
              }
            }
            // If not found, try to find any field with "Project" in name that's a reference
            if (!projectField) {
              const projectRefField = allFields.find(f => 
                f.name.includes('Project') && f.name.includes('__c') && f.type === 'reference'
              );
              if (projectRefField) {
                projectField = projectRefField.name;
              }
            }
            if (!projectField) {
              projectField = 'Project__c'; // Default fallback
            }
            
            // Find Member field (lookup to User or Contact)
            // Priority: Team_Member__c (as specified by user)
            let memberField = null;
            const memberFieldCandidates = ['Team_Member__c', 'Member__c', 'User__c', 'Contact__c', 'Person__c'];
            for (const candidate of memberFieldCandidates) {
              const field = fieldMap.get(candidate);
              if (field && field.type === 'reference') {
                memberField = candidate;
                break;
              }
            }
            // If not found, try to find any field with "Member" or "User" in name that's a reference
            if (!memberField) {
              const memberRefField = allFields.find(f => 
                (f.name.includes('Member') || f.name.includes('User')) && f.name.includes('__c') && f.type === 'reference'
              );
              if (memberRefField) {
                memberField = memberRefField.name;
              }
            }
            if (!memberField) {
              memberField = 'Team_Member__c'; // Default fallback
            }
            console.log(`Member field mapped to: ${memberField}`);
            
            // Find Role field (picklist or text)
            // Priority: Team_Member_Role__c (as specified by user)
            let roleField = null;
            const roleFieldCandidates = ['Team_Member_Role__c', 'Role__c', 'Member_Role__c', 'Role'];
            for (const candidate of roleFieldCandidates) {
              const field = fieldMap.get(candidate);
              if (field && (field.type === 'picklist' || field.type === 'string' || field.type === 'text')) {
                roleField = candidate;
                break;
              }
            }
            // If not found, try to find any field with "Role" in name
            if (!roleField) {
              const roleFieldFound = allFields.find(f => 
                f.name.includes('Role') && f.name.includes('__c')
              );
              if (roleFieldFound) {
                roleField = roleFieldFound.name;
              }
            }
            if (!roleField) {
              roleField = 'Team_Member_Role__c'; // Default fallback
            }
            console.log(`Role field mapped to: ${roleField}`);
            
            // Verify fields exist
            const projectFieldExists = fieldMap.has(projectField);
            const memberFieldExists = fieldMap.has(memberField);
            const roleFieldExists = fieldMap.has(roleField);
            
            console.log(`Using fields - Project: ${projectField} (exists: ${projectFieldExists}), Member: ${memberField} (exists: ${memberFieldExists}), Role: ${roleField} (exists: ${roleFieldExists})`);
            console.log(`Available fields in ${teamMemberObjectName}:`, allFields.slice(0, 20).map(f => `${f.name}(${f.type})`).join(', '), '...');
            
            if (!projectFieldExists) {
              console.error(`✗ ERROR: Project field "${projectField}" does not exist in ${teamMemberObjectName}`);
            }
            if (!memberFieldExists) {
              console.error(`✗ ERROR: Member field "${memberField}" does not exist in ${teamMemberObjectName}`);
            }
            if (!roleFieldExists) {
              console.error(`✗ ERROR: Role field "${roleField}" does not exist in ${teamMemberObjectName}`);
            }
            
            // Create team member record
            const teamMemberData = {};
            
            // Only add fields that exist
            if (projectFieldExists) {
              teamMemberData[projectField] = createdRecord.id;
            }
            if (memberFieldExists) {
              teamMemberData[memberField] = teamMember.memberId; // User/Contact ID
            }
            if (roleFieldExists) {
              teamMemberData[roleField] = teamMember.role;
            }
            
            // Add Name field if it exists AND is writable (createable/updateable)
            // Some objects have Name as auto-generated or read-only
            const nameField = fieldMap.get('Name');
            if (nameField && (nameField.createable || nameField.updateable)) {
              teamMemberData.Name = teamMember.member || `${teamMember.role} - ${teamMember.memberId}`;
              console.log(`Adding Name field (createable: ${nameField.createable}, updateable: ${nameField.updateable})`);
            } else if (nameField) {
              console.log(`Skipping Name field - not writable (createable: ${nameField.createable}, updateable: ${nameField.updateable})`);
            }
            
            // Check if we have at least the required fields
            if (Object.keys(teamMemberData).length === 0) {
              throw new Error(`No valid fields found in ${teamMemberObjectName}. Cannot create team member record.`);
            }
            
            console.log(`Creating team member record with data:`, JSON.stringify(teamMemberData, null, 2));
            
            console.log(`Attempting to create team member record in ${teamMemberObjectName}...`);
            const teamMemberRecord = await conn.sobject(teamMemberObjectName).create(teamMemberData);
            
            if (teamMemberRecord.success) {
              console.log(`✓ Team member created successfully in ${teamMemberObjectName}: ${teamMemberRecord.id}`);
              console.log(`  - Member: ${teamMember.member}`);
              console.log(`  - Member ID: ${teamMember.memberId}`);
              console.log(`  - Role: ${teamMember.role}`);
              teamMemberResults.push({
                member: teamMember.member,
                memberId: teamMember.memberId,
                role: teamMember.role,
                salesforceId: teamMemberRecord.id,
                objectName: teamMemberObjectName,
                status: 'created'
              });
            } else {
              const errors = teamMemberRecord.errors || [];
              const errorMsg = errors[0]?.message || errors[0]?.statusCode || 'Unknown error';
              const errorFields = errors[0]?.fields || [];
              console.error(`✗ Failed to create team member in ${teamMemberObjectName}:`, errorMsg);
              console.error(`  - Member: ${teamMember.member}`);
              console.error(`  - Member ID: ${teamMember.memberId}`);
              console.error(`  - Role: ${teamMember.role}`);
              console.error(`  - Error fields:`, errorFields);
              console.error(`  - Full error:`, JSON.stringify(errors, null, 2));
              teamMemberResults.push({
                member: teamMember.member,
                memberId: teamMember.memberId,
                role: teamMember.role,
                status: 'error',
                error: errorMsg,
                errorFields: errorFields,
                objectName: teamMemberObjectName
              });
            }
          } catch (teamMemberError) {
            console.error(`✗ Exception while processing team member ${teamMember.member}:`, teamMemberError);
            console.error(`  - Error message: ${teamMemberError.message}`);
            console.error(`  - Error stack:`, teamMemberError.stack);
            console.error(`  - Member ID: ${teamMember.memberId}`);
            console.error(`  - Role: ${teamMember.role}`);
            teamMemberResults.push({
              member: teamMember.member,
              memberId: teamMember.memberId,
              role: teamMember.role,
              status: 'error',
              error: teamMemberError.message || 'Unknown error',
              errorDetails: teamMemberError.stack,
              objectName: teamMemberObjectName
            });
          }
        }
      }
    }
    
    // Log team member results summary
    const validTeamMembersCount = projectData.teamMembers && Array.isArray(projectData.teamMembers) 
      ? projectData.teamMembers.filter(tm => tm && tm.member && tm.member.trim() !== '' && tm.memberId && tm.memberId.trim() !== '' && tm.role && tm.role !== '--None--').length
      : 0;
    const teamMemberSummary = {
      total: projectData.teamMembers ? projectData.teamMembers.length : 0,
      valid: validTeamMembersCount,
      created: teamMemberResults.filter(tm => tm.status === 'created').length,
      errors: teamMemberResults.filter(tm => tm.status === 'error').length,
      skipped: teamMemberResults.filter(tm => tm.status === 'skipped').length
    };
    console.log('=== TEAM MEMBER PUBLISHING SUMMARY ===');
    console.log('Team Member Summary:', JSON.stringify(teamMemberSummary, null, 2));
    console.log('Team Member Results:', JSON.stringify(teamMemberResults, null, 2));
    
    return {
      success: true,
      salesforceId: createdRecord.id,
      objectType: objectType,
      objectName: salesforceProjectData.Name || projectData.projectName || projectData.name || 'New Project',
      projectStatus: salesforceProjectData.Project_Status__c,
      // Always return teamMembers array (even if empty) so client knows what happened
      teamMembers: teamMemberResults,
      teamMemberSummary: teamMemberSummary
    };
  } catch (createError) {
    // Re-throw with more context if it's not already a helpful error
    if (createError.message && (
      createError.message.includes('Project__c') || 
      createError.message.includes('does not exist') ||
      createError.message.includes('INVALID_TYPE')
    )) {
      throw createError; // Already has helpful message
    } else {
      console.error('Error creating project in Project__c:', createError.message);
      throw new Error(
        `Failed to create project in Project__c: ${createError.message}. ` +
        'Please verify that all required fields exist and have correct values.'
      );
    }
  }
};

module.exports = {
  getProjectManagerRecordTypeId,
  convertPersonFieldToId,
  createProjectInSalesforce
};

