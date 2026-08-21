// Service functions for preview operations

const { getSalesforceConnection, objectNameMap } = require('../utils');

/**
 * Build WHERE conditions for filters
 */
const buildFilterConditions = async (conn, objectType, filters) => {
  const whereConditions = [];
  
  if (!filters) return whereConditions;
  
  if (objectType.toLowerCase() === 'project objective') {
    if (filters.projectId) {
      whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
    }
    if (filters.projectObjectiveId) {
      whereConditions.push(`Id = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
    }
  }
  
  if (objectType.toLowerCase() === 'contributor project') {
    if (filters.projectId) {
      whereConditions.push(`Project__c = '${String(filters.projectId).replace(/'/g, "''")}'`);
    }
    if (filters.projectObjectiveId) {
      try {
        const describeResult = await conn.sobject('Contributor_Project__c').describe();
        const projectObjectiveField = describeResult.fields.find(f => 
          f.type === 'reference' && 
          (f.name === 'Project_Objective__c' || 
           f.name === 'ProjectObjective__c' || 
           f.name === 'Objective__c' ||
           f.relationshipName === 'Project_Objective__r')
        );
        
        if (projectObjectiveField) {
          whereConditions.push(`${projectObjectiveField.name} = '${String(filters.projectObjectiveId).replace(/'/g, "''")}'`);
        } else {
          whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
        }
      } catch (describeError) {
        whereConditions.push(`(Project_Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR ProjectObjective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}' OR Objective__c = '${String(filters.projectObjectiveId).replace(/'/g, "''")}')`);
      }
    }
    if (filters.status && filters.status !== '') {
      whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
    }
    if (filters.queueStatus && filters.queueStatus !== '') {
      whereConditions.push(`Queue_Status__c = '${String(filters.queueStatus).replace(/'/g, "''")}'`);
    }
  }
  
  if (objectType.toLowerCase() === 'project') {
    if (filters.projectId) {
      whereConditions.push(`Id = '${String(filters.projectId).replace(/'/g, "''")}'`);
    }
    if (filters.status && filters.status !== '') {
      whereConditions.push(`Status__c = '${String(filters.status).replace(/'/g, "''")}'`);
    }
    if (filters.type && filters.type !== '') {
      whereConditions.push(`Type__c = '${String(filters.type).replace(/'/g, "''")}'`);
    }
  }
  
  return whereConditions;
};

module.exports = {
  buildFilterConditions
};

