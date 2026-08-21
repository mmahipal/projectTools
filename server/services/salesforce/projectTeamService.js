// Service for creating project teams in Salesforce

const { createSalesforceConnection } = require('./connectionService');
const { sanitizeSearchTerm } = require('../../utils/security');

/**
 * Create project team in Salesforce
 * @param {Object} teamData - Team data with project and teamMembers
 * @param {Object} user - User object
 * @returns {Promise<Object>} Result with team member results
 */
async function createProjectTeamInSalesforce(teamData, user) {
  const { project, teamMembers } = teamData;

  // Validate input
  if (!project || project.trim() === '') {
    throw new Error('Project is required');
  }

  if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    throw new Error('At least one team member is required');
  }

  // Filter valid team members
  const validTeamMembers = teamMembers.filter(tm => 
    tm && 
    tm.member && tm.member.trim() !== '' && 
    tm.memberId && tm.memberId.trim() !== '' &&
    tm.role && tm.role !== '--None--'
  );

  if (validTeamMembers.length === 0) {
    throw new Error('No valid team members found. Each team member must have a name, ID, and role.');
  }

  console.log('=== CREATE PROJECT TEAM API REQUEST ===');
  console.log('Project:', project);
  console.log('Team Members count:', validTeamMembers.length);

  // Use session-managed connection (reuses cached tokens when possible)
  // This will load settings automatically and use cached connections when available
  const conn = await createSalesforceConnection(null, user?.id);
  
  // Verify connection is working
  const userInfo = await conn.identity();
  console.log('Salesforce connection ready for creating project team, user ID:', userInfo.id);

  // Find project by name
  let projectId = project;
  const salesforceIdPattern = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
  if (!salesforceIdPattern.test(project)) {
    // It's not an ID, try to find by name
    try {
      const sanitizedProject = sanitizeSearchTerm(project);
      const projectQuery = `SELECT Id FROM Project__c WHERE Name = '${sanitizedProject}' LIMIT 1`;
      const projectResult = await conn.query(projectQuery);
      if (projectResult.records && projectResult.records.length > 0) {
        projectId = projectResult.records[0].Id;
        console.log(`Found Project ID: ${projectId} for project name: ${project}`);
      } else {
        throw new Error(`Project not found: ${project}`);
      }
    } catch (projectError) {
      console.error(`Error looking up Project: ${projectError.message}`);
      throw new Error(`Error looking up Project: ${projectError.message}`);
    }
  }

  // Create team member records
  let teamMemberResults = [];
  
  // Try to find Team Member object
  const possibleObjectNames = ['Project_Team_Member__c', 'Team_Member__c', 'Team_Members__c', 'Project_Team__c'];
  let teamMemberObjectName = null;
  let teamMemberObjectDescribe = null;

  for (const objName of possibleObjectNames) {
    try {
      const describe = await conn.sobject(objName).describe();
      teamMemberObjectName = objName;
      teamMemberObjectDescribe = describe;
      console.log(`Found Team Member object: ${objName}`);
      break;
    } catch (objError) {
      console.log(`Team Member object ${objName} does not exist, trying next...`);
    }
  }

  if (!teamMemberObjectName) {
    throw new Error(`No Team Member object found in Salesforce. Tried: ${possibleObjectNames.join(', ')}`);
  }

  // Create team member records
  console.log(`Creating ${validTeamMembers.length} team member records in ${teamMemberObjectName} for project ${projectId}...`);

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
      if (!projectField) {
        const projectRefField = allFields.find(f => 
          f.name.includes('Project') && f.name.includes('__c') && f.type === 'reference'
        );
        if (projectRefField) {
          projectField = projectRefField.name;
        }
      }
      if (!projectField) {
        projectField = 'Project__c';
      }

      // Find Member field (lookup to User or Contact)
      let memberField = null;
      const memberFieldCandidates = ['Team_Member__c', 'Member__c', 'User__c', 'Contact__c', 'Person__c'];
      for (const candidate of memberFieldCandidates) {
        const field = fieldMap.get(candidate);
        if (field && field.type === 'reference') {
          memberField = candidate;
          break;
        }
      }
      if (!memberField) {
        const memberRefField = allFields.find(f => 
          (f.name.includes('Member') || f.name.includes('User')) && f.name.includes('__c') && f.type === 'reference'
        );
        if (memberRefField) {
          memberField = memberRefField.name;
        }
      }
      if (!memberField) {
        memberField = 'Team_Member__c';
      }
      console.log(`Member field mapped to: ${memberField}`);

      // Find Role field (picklist or text)
      let roleField = null;
      const roleFieldCandidates = ['Team_Member_Role__c', 'Role__c', 'Member_Role__c', 'Role'];
      for (const candidate of roleFieldCandidates) {
        const field = fieldMap.get(candidate);
        if (field && (field.type === 'picklist' || field.type === 'string' || field.type === 'text')) {
          roleField = candidate;
          break;
        }
      }
      if (!roleField) {
        const roleFieldFound = allFields.find(f => 
          f.name.includes('Role') && f.name.includes('__c')
        );
        if (roleFieldFound) {
          roleField = roleFieldFound.name;
        }
      }
      if (!roleField) {
        roleField = 'Team_Member_Role__c';
      }
      console.log(`Role field mapped to: ${roleField}`);

      // Verify fields exist
      const projectFieldExists = fieldMap.has(projectField);
      const memberFieldExists = fieldMap.has(memberField);
      const roleFieldExists = fieldMap.has(roleField);

      console.log(`Using fields - Project: ${projectField} (exists: ${projectFieldExists}), Member: ${memberField} (exists: ${memberFieldExists}), Role: ${roleField} (exists: ${roleFieldExists})`);

      // Create team member record
      const teamMemberData = {};

      if (projectFieldExists) {
        teamMemberData[projectField] = projectId;
      }
      if (memberFieldExists) {
        teamMemberData[memberField] = teamMember.memberId;
      }
      if (roleFieldExists) {
        teamMemberData[roleField] = teamMember.role;
      }

      // Add Name field if it exists AND is writable
      const nameField = fieldMap.get('Name');
      if (nameField && (nameField.createable || nameField.updateable)) {
        teamMemberData.Name = teamMember.member || `${teamMember.role} - ${teamMember.memberId}`;
        console.log(`Adding Name field (createable: ${nameField.createable}, updateable: ${nameField.updateable})`);
      } else if (nameField) {
        console.log(`Skipping Name field - not writable (createable: ${nameField.createable}, updateable: ${nameField.updateable})`);
      }

      if (Object.keys(teamMemberData).length === 0) {
        throw new Error(`No valid fields found in ${teamMemberObjectName}. Cannot create team member record.`);
      }

      console.log(`Creating team member record with data:`, JSON.stringify(teamMemberData, null, 2));

      const teamMemberRecord = await conn.sobject(teamMemberObjectName).create(teamMemberData);

      if (teamMemberRecord.success) {
        console.log(`✓ Team member created successfully in ${teamMemberObjectName}: ${teamMemberRecord.id}`);
        
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
        console.error(`✗ Failed to create team member in ${teamMemberObjectName}:`, errorMsg);
        teamMemberResults.push({
          member: teamMember.member,
          memberId: teamMember.memberId,
          role: teamMember.role,
          status: 'error',
          error: errorMsg,
          errorFields: errors[0]?.fields || [],
          objectName: teamMemberObjectName
        });
      }
    } catch (teamMemberError) {
      console.error(`✗ Exception while processing team member ${teamMember.member}:`, teamMemberError);
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

  // Log team member results summary
  const teamMemberSummary = {
    total: validTeamMembers.length,
    created: teamMemberResults.filter(tm => tm.status === 'created').length,
    errors: teamMemberResults.filter(tm => tm.status === 'error').length,
    skipped: teamMemberResults.filter(tm => tm.status === 'skipped').length
  };

  console.log('=== TEAM MEMBER PUBLISHING SUMMARY ===');
  console.log('Team Member Summary:', JSON.stringify(teamMemberSummary, null, 2));

  return {
    success: true,
    project: project,
    projectId: projectId,
    teamMembers: teamMemberResults,
    teamMemberSummary: teamMemberSummary
  };
}

module.exports = {
  createProjectTeamInSalesforce
};

