// Clone routes for cloning Salesforce objects

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const { validateAndSanitizeSearchTerm } = require('../utils/security');
const { logCreate } = require('../utils/historyLogger');

// Object type mapping
const objectTypeMap = {
  'project': 'Project__c',
  'project-objective': 'Project_Objective__c',
  'project-qualification-step': 'Project_Qualification_Step__c',
  'project-page': 'Project_Page__c',
  'project-team': 'Project_Team__c'
};

// Get supported object types
router.get('/object-types', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    objectTypes: [
      { value: 'project', label: 'Project' },
      { value: 'project-objective', label: 'Project Objective' },
      { value: 'project-qualification-step', label: 'Project Qualification Step' },
      { value: 'project-page', label: 'Project Page' },
      { value: 'project-team', label: 'Project Team' }
    ]
  });
}));

// Search objects by name
router.post('/search', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, searchTerm } = req.body;

    if (!objectType || !searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Object type and search term are required'
      });
    }

    const salesforceObjectName = objectTypeMap[objectType.toLowerCase()];
    if (!salesforceObjectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Get object describe to find Name field
    const describeResult = await conn.sobject(salesforceObjectName).describe();
    let nameField = 'Name';
    
    // Check if Name field exists
    const nameFieldExists = describeResult.fields.some(f => f.name === 'Name');
    if (!nameFieldExists) {
      // Try to find a common name field
      const commonNameFields = ['Name', 'Title', 'Subject', 'Label'];
      for (const fieldName of commonNameFields) {
        if (describeResult.fields.some(f => f.name === fieldName)) {
          nameField = fieldName;
          break;
        }
      }
    }

    // Build query - search by Name field
    const sanitizedSearch = validateAndSanitizeSearchTerm(searchTerm);
    if (!sanitizedSearch) {
      return res.json({
        success: true,
        records: []
      });
    }
    const query = `SELECT Id, ${nameField} FROM ${salesforceObjectName} WHERE ${nameField} LIKE '%${sanitizedSearch}%' ORDER BY ${nameField} LIMIT 50`;
    
    const result = await conn.query(query);
    
    const records = result.records.map(record => ({
      id: record.Id,
      name: record[nameField] || record.Name || 'Unknown'
    }));

    res.json({
      success: true,
      records: records
    });
  } catch (error) {
    console.error('Error searching objects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search objects'
    });
  }
}));

// Get object data by ID
router.get('/object/:objectType/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { objectType, id } = req.params;

    if (!objectType || !id) {
      return res.status(400).json({
        success: false,
        error: 'Object type and ID are required'
      });
    }

    const salesforceObjectName = objectTypeMap[objectType.toLowerCase()];
    if (!salesforceObjectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Get object describe to get all fields
    const describeResult = await conn.sobject(salesforceObjectName).describe();
    
    // Build field list (exclude system fields that shouldn't be cloned)
    // Include ALL fields (even read-only) to get complete data for cloning
    const excludeFields = ['Id', 'CreatedDate', 'CreatedById', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp'];
    let fields = describeResult.fields
      .filter(field => !excludeFields.includes(field.name))
      .map(field => field.name);
    
    // Ensure Name field is included and add relationship fields for all object types
    if (!fields.includes('Name')) {
      fields.unshift('Name');
    }
    
    // Add relationship Name fields for lookup fields (e.g., Account__r.Name, Project__r.Name)
    const lookupFields = describeResult.fields.filter(f => 
      f.type === 'reference' && f.relationshipName && !excludeFields.includes(f.name)
    );
    
    lookupFields.forEach(lookupField => {
      const relNameField = `${lookupField.relationshipName}.Name`;
      if (!fields.includes(relNameField)) {
        fields.push(relNameField);
      }
    });
    
    // For Project__c, add People section relationship fields to get names
    if (salesforceObjectName === 'Project__c') {
      const peopleFields = [
        'Program_Manager__c', 'Project_Manager__c', 'Quality_Lead__c', 
        'Productivity_Lead__c', 'Reporting_Lead__c', 'Invoicing_Lead__c',
        'Project_Support_Lead__c', 'Recruitment_Lead__c', 'Qualification_Lead__c',
        'Onboarding_Lead__c'
      ];
      
      peopleFields.forEach(peopleField => {
        const fieldMeta = describeResult.fields.find(f => f.name === peopleField);
        if (fieldMeta && fieldMeta.relationshipName) {
          const relNameField = `${fieldMeta.relationshipName}.Name`;
          if (!fields.includes(relNameField)) {
            fields.push(relNameField);
          }
        }
      });
    }
    
    // For Project_Objective__c, add Project relationship field
    if (salesforceObjectName === 'Project_Objective__c') {
      const projectField = describeResult.fields.find(f => f.name === 'Project__c');
      if (projectField && projectField.relationshipName) {
        const relNameField = `${projectField.relationshipName}.Name`;
        if (!fields.includes(relNameField)) {
          fields.push(relNameField);
        }
      }
    }
    
    // For Contributor_Project__c, add Project and Project Objective relationship fields
    if (salesforceObjectName === 'Contributor_Project__c') {
      const projectField = describeResult.fields.find(f => f.name === 'Project__c');
      if (projectField && projectField.relationshipName) {
        const relNameField = `${projectField.relationshipName}.Name`;
        if (!fields.includes(relNameField)) {
          fields.push(relNameField);
        }
      }
      
      const projectObjectiveField = describeResult.fields.find(f => 
        f.name === 'Project_Objective__c' || f.name === 'ProjectObjective__c'
      );
      if (projectObjectiveField && projectObjectiveField.relationshipName) {
        const relNameField = `${projectObjectiveField.relationshipName}.Name`;
        if (!fields.includes(relNameField)) {
          fields.push(relNameField);
        }
      }
      
      const contributorField = describeResult.fields.find(f => 
        f.name === 'Contributor__c' || f.name === 'Contact__c'
      );
      if (contributorField && contributorField.relationshipName) {
        const relNameField = `${contributorField.relationshipName}.Name`;
        if (!fields.includes(relNameField)) {
          fields.push(relNameField);
        }
      }
    }
    
    // For Project_Qualification_Step__c, Project_Page__c, and Project_Team__c, add all relationship Name fields
    if (salesforceObjectName === 'Project_Qualification_Step__c' || 
        salesforceObjectName === 'Project_Page__c' || 
        salesforceObjectName === 'Project_Team__c') {
      // Get all reference fields and add their relationship Name fields
      const referenceFields = describeResult.fields.filter(f => 
        f.type === 'reference' && f.relationshipName && !excludeFields.includes(f.name)
      );
      
      referenceFields.forEach(refField => {
        const relNameField = `${refField.relationshipName}.Name`;
        if (!fields.includes(relNameField)) {
          fields.push(relNameField);
        }
      });
    }
    
    // Build query
    const query = `SELECT ${fields.join(', ')} FROM ${salesforceObjectName} WHERE Id = '${id.replace(/'/g, "''")}' LIMIT 1`;
    
    console.log('Clone - Query field count:', fields.length);
    console.log('Clone - Query (first 500 chars):', query.substring(0, 500));
    
    const result = await conn.query(query);
    
    if (!result.records || result.records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Object not found'
      });
    }

    const record = result.records[0];
    
    // Convert to form data format (camelCase)
    // Include ALL fields, even if null or empty, so form can be properly populated
    const formData = {};
    
    // Field mapping: Salesforce field name -> Form field name
    // This is the reverse of the mapping in projectService.js
    let fieldMapping = {};
    
    if (salesforceObjectName === 'Project__c') {
      fieldMapping = {
        // Standard fields
        'Name': 'projectName',
        'name': 'projectName',
        
        // Custom fields - map to form field names
        'Short_Project_Name__c': 'shortProjectName',
        'Contributor_Project_Name__c': 'contributorProjectName',
        'Auditor_Project__c': 'auditorProject',
        'Appen_Partner__c': 'appenPartner',
        'Job_Category__c': 'jobCategory',
        'Project_Short_Description__c': 'projectShortDescription',
        'Project_Long_Description__c': 'projectLongDescription',
        'Project_Type__c': 'projectType',
        'Project_Priority__c': 'projectPriority',
        'Project_ID_for_Reports__c': 'projectIdForReports',
        'Workday_Project_ID__c': 'workdayProjectId',
        'Account__c': 'account',
        'Program_Name__c': 'programName',
        'Hire_Start_Date__c': 'hireStartDate',
        'Predicted_Close_Date__c': 'predictedCloseDate',
        'Delivery_Tool_Org__c': 'deliveryToolOrg',
        'Delivery_Tool_Name__c': 'deliveryToolName',
        'Project_Page__c': 'projectPage',
        'Project_Status__c': 'projectStatus',
        'Payment_Setup_Required__c': 'paymentSetupRequired',
        'Manual_Activation_Required__c': 'manualActivationRequired',
        'Client_Tool_Account_Required__c': 'clientToolAccountRequired',
        'Project_Manager__c': 'projectManager',
        'Project_Payment_Method__c': 'projectPaymentMethod',
        'Require_PM_Approval_for_Productivity__c': 'requirePMApprovalForProductivity',
        'Lever_Requisition_ID__c': 'leverRequisitionID',
        'Lever_Requisition_Create_Date__c': 'leverRequisitionCreateDate',
        'Activation_Email_Template__c': 'activationEmailTemplate'
      };
    } else if (salesforceObjectName === 'Project_Objective__c') {
      fieldMapping = {
        'Name': 'contributorFacingProjectName',
        'Contributor_Facing_Project_Name__c': 'contributorFacingProjectName',
        'Project_Objective_Name__c': 'projectObjectiveName',
        'Project__c': 'project',
        'Work_Type__c': 'workType',
        'Days_Between_Reminder_Emails__c': 'daysBetweenReminderEmails',
        'Country__c': 'country',
        'Language__c': 'language',
        'Date_Start__c': 'dateStart',
        'Date_End__c': 'dateEnd',
        'Selection_Criteria__c': 'selectionCriteria',
        'Status__c': 'status'
      };
    } else if (salesforceObjectName === 'Contributor_Project__c') {
      fieldMapping = {
        'Name': 'contributorProjectName',
        'Project__c': 'project',
        'Project_Objective__c': 'projectObjective',
        'Contributor__c': 'contributor',
        'Status__c': 'status',
        'Applied_Date__c': 'appliedDate',
        'Qualified_Date__c': 'qualifiedDate',
        'Onboarded_Date__c': 'onboardedDate',
        'Removed_Date__c': 'removedDate'
      };
    }
    
    // Helper function to convert Salesforce field name to camelCase
    const toCamelCase = (fieldName) => {
      // Check if we have a direct mapping
      if (fieldMapping[fieldName]) {
        return fieldMapping[fieldName];
      }
      
      // If field ends with __c, remove it first
      if (fieldName.endsWith('__c')) {
        const baseName = fieldName.slice(0, -3); // Remove __c
        return baseName
          .split('_')
          .map((part, index) => {
            if (index === 0) {
              return part.charAt(0).toLowerCase() + part.slice(1);
            }
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('');
      } else {
        // Standard field name conversion
        return fieldName
          .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
          .replace(/^([A-Z])/, (g) => g[0].toLowerCase());
      }
    };
    
    console.log('Clone - Total fields to process:', fields.length);
    console.log('Clone - Record keys count:', Object.keys(record).length);
    console.log('Clone - Record sample keys:', Object.keys(record).slice(0, 15));
    console.log('Clone - Record sample values (non-empty):', Object.entries(record).filter(([k, v]) => v && v !== null && v !== '').slice(0, 15).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).substring(0, 50) : v}`));
    
    // Process all keys in the record (not just the fields array)
    // This ensures we get all values including relationship fields
    Object.keys(record).forEach(fieldName => {
      // Get value from record
      let value = record[fieldName];
      
      // Handle relationship fields (e.g., Account__r.Name or Account__r: { Name: "Meta" })
      if (fieldName.includes('__r')) {
        if (typeof value === 'object' && value !== null) {
          // Handle relationship object (e.g., Account__r: { Name: "Meta" })
          if (value.Name) {
            const nameValue = value.Name;
            // Map Account__r.Name to account field
            const baseField = fieldName.replace('__r', '');
            if (baseField === 'Account') {
              formData['account'] = nameValue;
              formData['accountName'] = nameValue;
            }
            // Handle relationship fields for Project_Qualification_Step__c, Project_Page__c, and Project_Team__c
            else if (salesforceObjectName === 'Project_Qualification_Step__c' || 
                     salesforceObjectName === 'Project_Page__c' || 
                     salesforceObjectName === 'Project_Team__c') {
              // Find the corresponding reference field (e.g., Project__c, Project_Objective__c, etc.)
              const refFieldName = `${baseField}__c`;
              if (record[refFieldName]) {
                // Store the ID in the reference field
                formData[toCamelCase(refFieldName)] = record[refFieldName];
                // Store the name in a Name field
                const nameFieldName = `${toCamelCase(baseField)}Name`;
                formData[nameFieldName] = nameValue;
                // Also store in the base field name for display
                formData[toCamelCase(baseField)] = nameValue;
              }
            }
            // Map People section fields
            else if (baseField === 'Program_Manager') {
              formData['programManager'] = record['Program_Manager__c'] || ''; // Keep ID
              formData['programManagerName'] = nameValue;
            }
            else if (baseField === 'Project_Manager') {
              formData['projectManager'] = record['Project_Manager__c'] || ''; // Keep ID
              formData['projectManagerName'] = nameValue;
            }
            else if (baseField === 'Quality_Lead') {
              formData['qualityLead'] = record['Quality_Lead__c'] || '';
              formData['qualityLeadName'] = nameValue;
            }
            else if (baseField === 'Productivity_Lead') {
              formData['productivityLead'] = record['Productivity_Lead__c'] || '';
              formData['productivityLeadName'] = nameValue;
            }
            else if (baseField === 'Reporting_Lead') {
              formData['reportingLead'] = record['Reporting_Lead__c'] || '';
              formData['reportingLeadName'] = nameValue;
            }
            else if (baseField === 'Invoicing_Lead') {
              formData['invoicingLead'] = record['Invoicing_Lead__c'] || '';
              formData['invoicingLeadName'] = nameValue;
            }
            else if (baseField === 'Project_Support_Lead') {
              formData['projectSupportLead'] = record['Project_Support_Lead__c'] || '';
              formData['projectSupportLeadName'] = nameValue;
            }
            else if (baseField === 'Recruitment_Lead') {
              formData['recruitmentLead'] = record['Recruitment_Lead__c'] || '';
              formData['recruitmentLeadName'] = nameValue;
            }
            else if (baseField === 'Qualification_Lead') {
              formData['qualificationLead'] = record['Qualification_Lead__c'] || '';
              formData['qualificationLeadName'] = nameValue;
            }
            else if (baseField === 'Onboarding_Lead') {
              formData['onboardingLead'] = record['Onboarding_Lead__c'] || '';
              formData['onboardingLeadName'] = nameValue;
            }
            value = nameValue; // Use name for display
          } else if (value.Id) {
            // If it's a relationship object with just an ID, use the ID
            value = value.Id;
          }
        } else if (fieldName.includes('__r.Name')) {
          // Direct relationship Name field (e.g., Account__r.Name, Program_Manager__r.Name)
          const baseField = fieldName.replace('__r.Name', '');
          if (baseField === 'Account' && value) {
            formData['account'] = value;
            formData['accountName'] = value;
          }
          // Map People section relationship Name fields (Project__c only)
          else if (salesforceObjectName === 'Project__c') {
            if (baseField === 'Program_Manager' && value) {
              formData['programManager'] = record['Program_Manager__c'] || '';
              formData['programManagerName'] = value;
            }
            else if (baseField === 'Project_Manager' && value) {
              formData['projectManager'] = record['Project_Manager__c'] || '';
              formData['projectManagerName'] = value;
            }
            else if (baseField === 'Quality_Lead' && value) {
              formData['qualityLead'] = record['Quality_Lead__c'] || '';
              formData['qualityLeadName'] = value;
            }
            else if (baseField === 'Productivity_Lead' && value) {
              formData['productivityLead'] = record['Productivity_Lead__c'] || '';
              formData['productivityLeadName'] = value;
            }
            else if (baseField === 'Reporting_Lead' && value) {
              formData['reportingLead'] = record['Reporting_Lead__c'] || '';
              formData['reportingLeadName'] = value;
            }
            else if (baseField === 'Invoicing_Lead' && value) {
              formData['invoicingLead'] = record['Invoicing_Lead__c'] || '';
              formData['invoicingLeadName'] = value;
            }
            else if (baseField === 'Project_Support_Lead' && value) {
              formData['projectSupportLead'] = record['Project_Support_Lead__c'] || '';
              formData['projectSupportLeadName'] = value;
            }
            else if (baseField === 'Recruitment_Lead' && value) {
              formData['recruitmentLead'] = record['Recruitment_Lead__c'] || '';
              formData['recruitmentLeadName'] = value;
            }
            else if (baseField === 'Qualification_Lead' && value) {
              formData['qualificationLead'] = record['Qualification_Lead__c'] || '';
              formData['qualificationLeadName'] = value;
            }
            else if (baseField === 'Onboarding_Lead' && value) {
              formData['onboardingLead'] = record['Onboarding_Lead__c'] || '';
              formData['onboardingLeadName'] = value;
            }
          }
          // Map Project relationship for Project_Objective__c
          else if (salesforceObjectName === 'Project_Objective__c' && baseField === 'Project' && value) {
            formData['project'] = record['Project__c'] || '';
            formData['projectName'] = value;
          }
          // Map Project and Project Objective relationships for Contributor_Project__c
          else if (salesforceObjectName === 'Contributor_Project__c') {
            if (baseField === 'Project' && value) {
              formData['project'] = record['Project__c'] || '';
              formData['projectName'] = value;
            }
            else if ((baseField === 'Project_Objective' || baseField === 'ProjectObjective') && value) {
              const projectObjectiveFieldName = record['Project_Objective__c'] ? 'Project_Objective__c' : 
                                                 record['ProjectObjective__c'] ? 'ProjectObjective__c' : null;
              if (projectObjectiveFieldName) {
                formData['projectObjective'] = record[projectObjectiveFieldName] || '';
                formData['projectObjectiveName'] = value;
              }
            }
            else if ((baseField === 'Contributor' || baseField === 'Contact') && value) {
              const contributorFieldName = record['Contributor__c'] ? 'Contributor__c' : 
                                           record['Contact__c'] ? 'Contact__c' : null;
              if (contributorFieldName) {
                formData['contributor'] = record[contributorFieldName] || '';
                formData['contributorName'] = value;
              }
            }
          }
          // Handle relationship fields for Project_Qualification_Step__c, Project_Page__c, and Project_Team__c
          else if (salesforceObjectName === 'Project_Qualification_Step__c' || 
                   salesforceObjectName === 'Project_Page__c' || 
                   salesforceObjectName === 'Project_Team__c') {
            // Find the corresponding reference field (e.g., Project__c, Project_Objective__c, etc.)
            const refFieldName = `${baseField}__c`;
            if (record[refFieldName]) {
              // Store the ID in the reference field (needed for saving)
              formData[toCamelCase(refFieldName)] = record[refFieldName];
              // Store the name in a Name field (e.g., projectName, projectObjectiveName)
              const nameFieldName = `${toCamelCase(baseField)}Name`;
              formData[nameFieldName] = nameValue;
              // Also store in the base field name for display
              formData[toCamelCase(baseField)] = nameValue;
            }
          }
        }
      }
      
      // Skip if value is truly undefined
      if (value === undefined) {
        return;
      }
      
      // Convert Salesforce field name to form field name
      const formFieldName = toCamelCase(fieldName);
      
      // For reference fields (ending with __c and type is reference), prefer Name over ID for display
      // Skip storing the ID directly if we have a Name field for it
      if (fieldName.endsWith('__c') && !fieldName.includes('__r') && !fieldName.includes('.')) {
        // Check if this is a reference field and if we have a Name field for it
        const fieldMeta = describeResult.fields.find(f => f.name === fieldName);
        if (fieldMeta && fieldMeta.type === 'reference' && fieldMeta.relationshipName) {
          const relNameField = `${fieldMeta.relationshipName}.Name`;
          const relNameValue = record[relNameField];
          
          // If we have a name value, use it for display instead of ID
          if (relNameValue) {
            // Store the ID in the reference field (needed for saving)
            formData[formFieldName] = value;
            // Store the name in a Name field for display
            const nameFieldName = `${formFieldName.replace(/__c$/, '')}Name`;
            formData[nameFieldName] = relNameValue;
            // Also store in the base field name (without __c) for display
            const baseFieldName = formFieldName.replace(/__c$/, '');
            if (baseFieldName !== formFieldName) {
              formData[baseFieldName] = relNameValue;
            }
            // Use name instead of ID for the primary form field value
            value = relNameValue;
          }
        }
      }
      
      // Store value (keep actual value, only convert null/undefined to empty string for form)
      const formValue = value === null || value === undefined ? '' : value;
      
      // Store in form field name (primary) - this is what the form expects
      // For reference fields with names, this will be the name, not the ID
      formData[formFieldName] = formValue;
      
      // Also store in original Salesforce field name for reference
      formData[fieldName] = formValue;
      
      // Store in lowercase version too
      formData[fieldName.toLowerCase()] = formValue;
    });
    
    console.log('Clone - FormData keys count:', Object.keys(formData).length);
    console.log('Clone - Sample formData keys:', Object.keys(formData).slice(0, 30));
    console.log('Clone - Sample values (non-empty):', Object.entries(formData).filter(([k, v]) => v && v !== '').slice(0, 20).map(([k, v]) => `${k}: ${v}`));

    // Fetch related data for Project objects
    let relatedData = {};
    if (salesforceObjectName === 'Project__c') {
      try {
        // Fetch Project Team members
        const teamMemberObjectNames = ['Project_Team_Member__c', 'Team_Member__c', 'Team_Members__c', 'Project_Team__c'];
        let teamMemberObjectName = null;
        let teamMemberDescribe = null;
        
        for (const objName of teamMemberObjectNames) {
          try {
            teamMemberDescribe = await conn.sobject(objName).describe();
            teamMemberObjectName = objName;
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (teamMemberObjectName) {
          // Find the project field name
          const projectField = teamMemberDescribe.fields.find(f => 
            (f.name === 'Project__c' || f.name === 'Project_Id__c' || f.name === 'Related_Project__c') && f.type === 'reference'
          ) || teamMemberDescribe.fields.find(f => 
            f.name.includes('Project') && f.name.includes('__c') && f.type === 'reference'
          );
          
          if (projectField) {
            const teamQuery = `SELECT Id, ${projectField.name}, Team_Member__c, Member__c, User__c, Contact__c, Person__c, Team_Member_Role__c, Role__c FROM ${teamMemberObjectName} WHERE ${projectField.name} = '${id.replace(/'/g, "''")}'`;
            const teamResult = await conn.query(teamQuery);
            
            if (teamResult.records && teamResult.records.length > 0) {
              // Get member field name
              const memberField = teamMemberDescribe.fields.find(f => 
                (f.name === 'Team_Member__c' || f.name === 'Member__c' || f.name === 'User__c' || f.name === 'Contact__c') && f.type === 'reference'
              ) || teamMemberDescribe.fields.find(f => 
                (f.name.includes('Member') || f.name.includes('User')) && f.name.includes('__c') && f.type === 'reference'
              );
              
              // Get role field name
              const roleField = teamMemberDescribe.fields.find(f => 
                (f.name === 'Team_Member_Role__c' || f.name === 'Role__c') && (f.type === 'picklist' || f.type === 'string')
              );
              
              relatedData.teamMembers = await Promise.all(teamResult.records.map(async (tm) => {
                const memberId = memberField ? tm[memberField.name] : null;
                let memberName = '';
                
                if (memberId) {
                  // Try to get name from User or Contact
                  try {
                    const userQuery = `SELECT Id, Name, Email FROM User WHERE Id = '${memberId.replace(/'/g, "''")}' LIMIT 1`;
                    const userResult = await conn.query(userQuery);
                    if (userResult.records && userResult.records.length > 0) {
                      memberName = userResult.records[0].Name || userResult.records[0].Email || '';
                    } else {
                      const contactQuery = `SELECT Id, Name, Email FROM Contact WHERE Id = '${memberId.replace(/'/g, "''")}' LIMIT 1`;
                      const contactResult = await conn.query(contactQuery);
                      if (contactResult.records && contactResult.records.length > 0) {
                        memberName = contactResult.records[0].Name || contactResult.records[0].Email || '';
                      }
                    }
                  } catch (e) {
                    console.error('Error fetching member name:', e);
                  }
                }
                
                return {
                  member: memberName,
                  memberId: memberId || '',
                  role: roleField ? (tm[roleField.name] || '--None--') : '--None--'
                };
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching related data:', error);
        // Continue without related data
      }
    }

    res.json({
      success: true,
      objectType: objectType,
      salesforceObjectName: salesforceObjectName,
      formData: formData,
      originalId: id,
      relatedData: relatedData,
      fields: describeResult.fields
        .filter(field => {
          // Exclude system fields and non-createable/updateable fields
          const excludeFields = ['Id', 'CreatedDate', 'CreatedById', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp'];
          return !excludeFields.includes(field.name) && (field.createable || field.updateable);
        })
        .map(field => {
          // Determine if field is truly required (not calculated, not formula, not auto-number, not defaulted)
          const isCalculated = field.calculated || field.type === 'calculated' || field.type === 'formula';
          const isAutoNumber = field.type === 'autonumber' || field.autoNumber;
          const isDefaulted = field.defaultedOnCreate;
          const isReadOnly = !field.createable && !field.updateable;
          
          // Field is required only if:
          // - Not nullable AND
          // - Not calculated/formula AND
          // - Not auto-number AND
          // - Not defaulted on create AND
          // - Is createable/updateable (not read-only)
          const isRequired = !field.nullable && 
                            !isCalculated && 
                            !isAutoNumber && 
                            !isDefaulted && 
                            (field.createable || field.updateable);

          return {
            name: field.name,
            label: field.label,
            type: field.type,
            required: isRequired,
            createable: field.createable,
            updateable: field.updateable,
            calculated: isCalculated,
            autoNumber: isAutoNumber,
            nullable: field.nullable,
            defaultedOnCreate: field.defaultedOnCreate
          };
        })
    });
  } catch (error) {
    console.error('Error fetching object data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch object data'
    });
  }
}));

// Clone object (create new object with data)
router.post('/clone', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, formData, hasChanges } = req.body;

    if (!objectType || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Object type and form data are required'
      });
    }

    const salesforceObjectName = objectTypeMap[objectType.toLowerCase()];
    if (!salesforceObjectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Get object describe
    const describeResult = await conn.sobject(salesforceObjectName).describe();
    
    // Build data object for creation
    const createData = {};
    
    // Special handling for Project__c to map form fields correctly
    if (salesforceObjectName === 'Project__c') {
      // Map projectName to Name field (use current form value, not prefixed value)
      if (formData.projectName !== undefined && formData.projectName !== null && formData.projectName !== '') {
        createData.Name = formData.projectName; // Use current form value (user may have edited it)
      } else if (formData.name !== undefined && formData.name !== null && formData.name !== '') {
        createData.Name = formData.name;
      } else if (formData.Name !== undefined && formData.Name !== null && formData.Name !== '') {
        createData.Name = formData.Name;
      }
    } else if (salesforceObjectName === 'Project_Objective__c') {
      // Map contributorFacingProjectName to Name field
      if (formData.contributorFacingProjectName !== undefined && formData.contributorFacingProjectName !== null && formData.contributorFacingProjectName !== '') {
        createData.Name = formData.contributorFacingProjectName;
      } else if (formData.name !== undefined && formData.name !== null && formData.name !== '') {
        createData.Name = formData.name;
      } else if (formData.Name !== undefined && formData.Name !== null && formData.Name !== '') {
        createData.Name = formData.Name;
      }
    } else if (salesforceObjectName === 'Contributor_Project__c') {
      // Map contributorProjectName to Name field
      if (formData.contributorProjectName !== undefined && formData.contributorProjectName !== null && formData.contributorProjectName !== '') {
        createData.Name = formData.contributorProjectName;
      } else if (formData.name !== undefined && formData.name !== null && formData.name !== '') {
        createData.Name = formData.name;
      } else if (formData.Name !== undefined && formData.Name !== null && formData.Name !== '') {
        createData.Name = formData.Name;
      }
    }
    
    // Map form data to Salesforce field names
    describeResult.fields.forEach(field => {
      if (!field.createable) return;
      
      // Skip system fields
      if (['Id', 'CreatedDate', 'CreatedById', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp'].includes(field.name)) {
        return;
      }
      
      // Skip calculated and auto-number fields
      if (field.calculated || field.type === 'calculated' || field.type === 'formula' || field.type === 'autonumber' || field.autoNumber) {
        return;
      }
      
      // Skip Name field if already set above
      if (field.name === 'Name' && createData.Name) {
        return;
      }
      
      // Try to find value in formData
      let value = null;
      
      // Try exact field name match
      if (formData[field.name] !== undefined && formData[field.name] !== null && formData[field.name] !== '') {
        value = formData[field.name];
      } else {
        // Try camelCase version
        const camelCaseName = field.name
          .replace(/__c$/, '')
          .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
          .replace(/^([A-Z])/, (g) => g[0].toLowerCase());
        
        if (formData[camelCaseName] !== undefined && formData[camelCaseName] !== null && formData[camelCaseName] !== '') {
          value = formData[camelCaseName];
        }
      }
      
      // Only include if value is provided
      if (value !== null && value !== undefined && value !== '') {
        createData[field.name] = value;
      }
    });
    
    // Ensure Name field is set (fallback)
    if (!createData.Name) {
      createData.Name = formData.name || formData.Name || formData.projectName || formData.contributorFacingProjectName || formData.contributorProjectName || 'Cloned ' + new Date().toISOString();
    }
    
    // Create the object
    const result = await conn.sobject(salesforceObjectName).create(createData);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.errors ? result.errors.map(e => e.message).join('; ') : 'Failed to create cloned object'
      });
    }

    // Log to history for dashboard stats
    try {
      const objectName = createData.Name || formData.projectName || formData.contributorFacingProjectName || formData.contributorProjectName || 'Cloned Object';
      const objectTypeDisplayName = {
        'Project__c': 'Project',
        'Project_Objective__c': 'Project Objective',
        'Project_Qualification_Step__c': 'Project Qualification Step',
        'Project_Page__c': 'Project Page',
        'Project_Team__c': 'Project Team',
        'Contributor_Project__c': 'Contributor Project'
      }[salesforceObjectName] || salesforceObjectName;
      
      logCreate(
        objectTypeDisplayName,
        objectName,
        result.id,
        req.user?.email || 'Unknown',
        createData,
        { objectType: salesforceObjectName, cloned: true }
      );
    } catch (historyError) {
      console.error('Error logging clone history:', historyError);
      // Don't fail the request if history logging fails
    }

    res.json({
      success: true,
      id: result.id,
      message: 'Object cloned successfully'
    });
  } catch (error) {
    console.error('Error cloning object:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clone object'
    });
  }
}));

module.exports = router;

