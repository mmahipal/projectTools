const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateAndSanitizeSearchTerm } = require('../utils/security');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jsforce = require('jsforce');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to get settings path
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

// Helper function to decrypt credentials
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted, return as is
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY.slice(0, 64), 'hex')
      : crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
    const ALGORITHM = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original if decryption fails
  }
};

// Helper function to get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

/**
 * Discover Self Reported Time object and fields dynamically
 */
const discoverSelfReportedTimeFields = async (conn) => {
  try {
    // Try common object names for self-reported time
    const possibleObjectNames = [
      'Payment_Transactions_Needing_Approval__c', // Primary object
      'Self_Reported_Time__c',
      'SelfReportedTime__c',
      'Contributor_Time_Entry__c',
      'Time_Entry__c',
      'TimeEntry__c',
      'Productivity_Entry__c'
    ];

    let objectName = null;
    let objectDescribe = null;

    // Try to find the object
    for (const objName of possibleObjectNames) {
      try {
        objectDescribe = await conn.sobject(objName).describe();
        objectName = objName;
        console.log(`Found Self Reported Time object: ${objName}`);
        break;
      } catch (error) {
        // Object doesn't exist, try next
        continue;
      }
    }

    if (!objectName || !objectDescribe) {
      console.warn('Self Reported Time object not found. Tried: ' + possibleObjectNames.join(', '));
      console.warn('Returning empty data structure. Please configure the Salesforce object.');
      // Return a default structure with null object name to indicate object not found
      return {
        objectName: null,
        transactionId: 'Id',
        contributor: null,
        projectObjective: null,
        transactionDate: 'CreatedDate',
        selfReportedHours: null,
        selfReportedUnits: null,
        systemTrackedHours: null,
        systemTrackedUnits: null,
        weekendingDate: null,
        payrate: null,
        totalPayment: null,
        status: 'Status__c'
      };
    }

    const fieldNames = objectDescribe.fields.map(f => f.name);
    const fieldMetadataMap = {};
    objectDescribe.fields.forEach(field => {
      fieldMetadataMap[field.name] = field;
    });

    const findField = (exactNames, patterns, description) => {
      // Try exact matches first
      for (const exactName of exactNames) {
        if (fieldNames.includes(exactName)) {
          console.log(`Found ${description}: ${exactName}`);
          return exactName;
        }
      }

      // Try pattern matching
      for (const pattern of patterns) {
        const found = fieldNames.find(f => {
          if (typeof pattern === 'string') {
            return f.toLowerCase().includes(pattern.toLowerCase());
          } else if (pattern instanceof RegExp) {
            return pattern.test(f);
          } else if (typeof pattern === 'function') {
            return pattern(f);
          }
          return false;
        });
        if (found) {
          console.log(`Found ${description}: ${found} (pattern match)`);
          return found;
        }
      }

      console.warn(`Field not found for ${description}. Tried: ${exactNames.join(', ')}`);
      return null;
    };

    const findFieldWithRelationship = (exactNames, patterns, description) => {
      const fieldName = findField(exactNames, patterns, description);
      if (!fieldName) return { field: null, relationship: null };
      
      const fieldMeta = fieldMetadataMap[fieldName];
      let relationshipName = null;
      
      if (fieldMeta && fieldMeta.type === 'reference') {
        // Get relationship name from metadata
        relationshipName = fieldMeta.relationshipName;
        if (relationshipName) {
          // Relationship name might already have __r or might need it
          if (!relationshipName.endsWith('__r')) {
            relationshipName = relationshipName + '__r';
          }
        } else {
          // Fallback: try to construct relationship name from field name
          // e.g., Contact__c -> Contact__r, Contributor__c -> Contributor__r
          if (fieldName.endsWith('__c')) {
            relationshipName = fieldName.replace('__c', '__r');
          } else if (fieldName === 'ContactId') {
            relationshipName = 'Contact';
          }
        }
        console.log(`Found relationship for ${description}: ${relationshipName}`);
      }
      
      return { field: fieldName, relationship: relationshipName };
    };

    const contributorField = findFieldWithRelationship(
      ['Contact__c', 'Contributor__c', 'Contributor_Id__c', 'Contributor_Project__c'],
      [
        f => f.includes('Contact') && f.endsWith('__c'),
        f => f.includes('Contributor') && f.endsWith('__c')
      ],
      'Contributor'
    );
    
    // If contributor field points to Contributor_Project__c, discover Contact relationship within it
    let contributorContactRelationship = null;
    if (contributorField.field && fieldMetadataMap[contributorField.field]) {
      const fieldMeta = fieldMetadataMap[contributorField.field];
      if (fieldMeta.referenceTo && fieldMeta.referenceTo.includes('Contributor_Project__c')) {
        try {
          const cpDescribe = await conn.sobject('Contributor_Project__c').describe();
          const contactField = cpDescribe.fields.find(f => 
            (f.type === 'reference' && f.referenceTo && f.referenceTo.includes('Contact')) ||
            f.name === 'Contact__c' || f.name === 'Contributor__c'
          );
          if (contactField && contactField.relationshipName) {
            contributorContactRelationship = contactField.relationshipName.endsWith('__r') 
              ? contactField.relationshipName 
              : contactField.relationshipName + '__r';
            console.log(`Found Contact relationship within Contributor_Project: ${contributorContactRelationship}`);
          }
        } catch (err) {
          console.warn(`Could not discover Contact relationship in Contributor_Project__c: ${err.message}`);
        }
      }
    }

    // First, check for reference fields that point to Project_Objective__c (highest priority)
    const referenceFields = objectDescribe.fields.filter(f => 
      f.type === 'reference' && 
      f.referenceTo && 
      f.referenceTo.includes('Project_Objective__c') &&
      f.name !== contributorField.field // Exclude contributor field
    );
    console.log('Reference fields pointing to Project_Objective__c:', referenceFields.map(f => f.name).join(', '));
    
    // If no direct Project_Objective__c field, check if it's accessible through Contributor_Project__c
    let projectObjectiveField = { field: null, relationship: null };
    if (referenceFields.length > 0) {
      // Direct field exists
      projectObjectiveField = findFieldWithRelationship(
        [
          'Project_Objective__c', 
          'ProjectObjective__c', 
          'Objective__c',
          ...referenceFields.map(f => f.name)
        ],
        [
          f => {
            const fieldMeta = fieldMetadataMap[f];
            return fieldMeta && fieldMeta.type === 'reference' && 
                   fieldMeta.referenceTo && fieldMeta.referenceTo.includes('Project_Objective__c') &&
                   f !== contributorField.field;
          }
        ],
        'Project Objective'
      );
    } else if (contributorField.field === 'Contributor_Project__c') {
      // Project Objective is accessed through Contributor_Project__c -> Project_Objective__c
      // Check if Contributor_Project__c has a Project_Objective__c field
      try {
        const cpDescribe = await conn.sobject('Contributor_Project__c').describe();
        const poFieldInCP = cpDescribe.fields.find(f => 
          f.type === 'reference' && 
          f.referenceTo && 
          f.referenceTo.includes('Project_Objective__c')
        );
        if (poFieldInCP) {
          // Use Contributor_Project__c as the field, but access Project Objective through nested relationship
          projectObjectiveField = {
            field: contributorField.field, // Use Contributor_Project__c
            relationship: `${contributorField.relationship}.${poFieldInCP.relationshipName || poFieldInCP.name.replace('__c', '__r')}` // Nested: Contributor_Project__r.Project_Objective__r
          };
          console.log(`✅ Found Project Objective through Contributor_Project: ${projectObjectiveField.relationship}`);
          console.log(`  - Field in Contributor_Project__c: ${poFieldInCP.name}`);
          console.log(`  - Relationship: ${poFieldInCP.relationshipName || poFieldInCP.name.replace('__c', '__r')}`);
        }
      } catch (err) {
        console.warn(`Could not discover Project Objective in Contributor_Project__c: ${err.message}`);
      }
    }
    
    // If still not found, try pattern matching (but exclude Contributor_Project__c)
    if (!projectObjectiveField.field) {
      const possibleProjectObjectiveFields = fieldNames.filter(f => 
        f !== contributorField.field &&
        f !== 'Contributor_Project__c' &&
        (f.includes('Objective') || (f.includes('Project') && f.includes('Objective'))) && 
        f.endsWith('__c')
      );
      console.log('Available fields that might be Project Objective:', possibleProjectObjectiveFields.join(', '));
      
      projectObjectiveField = findFieldWithRelationship(
        [
          'Project_Objective__c', 
          'ProjectObjective__c', 
          'Objective__c',
          ...possibleProjectObjectiveFields
        ],
        [
          f => f !== contributorField.field && f !== 'Contributor_Project__c' && f.includes('Project') && f.includes('Objective') && f.endsWith('__c'),
          f => f !== contributorField.field && f !== 'Contributor_Project__c' && f.includes('Objective') && f.endsWith('__c'),
          f => f === 'Objective__c' && f.endsWith('__c')
        ],
        'Project Objective'
      );
    }
    
    // Log discovered project objective field with detailed info
    if (projectObjectiveField.field) {
      const fieldMeta = fieldMetadataMap[projectObjectiveField.field];
      console.log(`✅ Found Project Objective field: ${projectObjectiveField.field}`);
      console.log(`  - Field type: ${fieldMeta?.type || 'unknown'}`);
      console.log(`  - Relationship name from metadata: ${fieldMeta?.relationshipName || 'not found'}`);
      console.log(`  - Discovered relationship: ${projectObjectiveField.relationship || 'not found'}`);
      console.log(`  - Reference to: ${fieldMeta?.referenceTo?.join(', ') || 'unknown'}`);
    } else {
      console.warn('❌ Project Objective field not found!');
      console.warn('Available fields with "Objective" or "Project":', 
        fieldNames.filter(f => f.includes('Objective') || f.includes('Project')).join(', '));
      console.warn('All reference fields:', 
        objectDescribe.fields.filter(f => f.type === 'reference').map(f => `${f.name} -> ${f.referenceTo?.join(', ')}`).join(', '));
    }

    const fields = {
      objectName: objectName,
      transactionId: findField(
        ['Transaction_ID__c', 'TransactionId__c', 'Id'],
        [f => f.includes('Transaction') && f.includes('ID') && f.endsWith('__c')],
        'Transaction ID'
      ) || 'Id',
      contributor: contributorField.field,
      contributorRelationship: contributorField.relationship,
      contributorContactRelationship: contributorContactRelationship, // Contact relationship within Contributor_Project__c
      projectObjective: projectObjectiveField.field,
      projectObjectiveRelationship: projectObjectiveField.relationship,
      transactionDate: findField(
        ['Transaction_Date__c', 'TransactionDate__c', 'Date__c', 'CreatedDate'],
        [
          f => f.includes('Transaction') && f.includes('Date') && f.endsWith('__c'),
          f => f === 'CreatedDate'
        ],
        'Transaction Date'
      ) || 'CreatedDate',
      selfReportedHours: findField(
        ['Self_Reported_Hours__c', 'SelfReportedHours__c', 'Self_Reported_Hour__c', 'SelfReportedHour__c', 'Hours_Self_Reported__c', 'Hours__c'],
        [
          f => f.includes('Self') && f.includes('Reported') && (f.includes('Hour') || f.includes('Hours')) && f.endsWith('__c'),
          f => f.includes('Self') && (f.includes('Hour') || f.includes('Hours')) && f.endsWith('__c'),
          f => (f.includes('Hour') || f.includes('Hours')) && f.endsWith('__c')
        ],
        'Self Reported Hours'
      ),
      selfReportedUnits: findField(
        ['Self_Reported_Units__c', 'SelfReportedUnits__c', 'Self_Reported_Unit__c', 'SelfReportedUnit__c', 'Units_Self_Reported__c', 'Units__c'],
        [
          f => f.includes('Self') && f.includes('Reported') && (f.includes('Unit') || f.includes('Units')) && f.endsWith('__c'),
          f => f.includes('Self') && (f.includes('Unit') || f.includes('Units')) && f.endsWith('__c'),
          f => (f.includes('Unit') || f.includes('Units')) && f.endsWith('__c')
        ],
        'Self Reported Units'
      ),
      systemTrackedHours: findField(
        ['System_Tracked_Hours__c', 'SystemTrackedHours__c', 'System_Tracked_Hour__c', 'SystemTrackedHour__c', 'Productivity_Hours__c', 'Productivity_Hour__c', 'Hours_System_Tracked__c', 'Hours_System__c'],
        [
          f => f.includes('System') && f.includes('Tracked') && (f.includes('Hour') || f.includes('Hours')) && f.endsWith('__c'),
          f => f.includes('Productivity') && (f.includes('Hour') || f.includes('Hours')) && f.endsWith('__c'),
          f => f.includes('System') && (f.includes('Hour') || f.includes('Hours')) && f.endsWith('__c')
        ],
        'System Tracked Hours'
      ),
      systemTrackedUnits: findField(
        ['System_Tracked_Units__c', 'SystemTrackedUnits__c', 'System_Tracked_Unit__c', 'SystemTrackedUnit__c', 'Productivity_Units__c', 'Productivity_Unit__c', 'Units_System_Tracked__c', 'Units_System__c'],
        [
          f => f.includes('System') && f.includes('Tracked') && (f.includes('Unit') || f.includes('Units')) && f.endsWith('__c'),
          f => f.includes('Productivity') && (f.includes('Unit') || f.includes('Units')) && f.endsWith('__c'),
          f => f.includes('System') && (f.includes('Unit') || f.includes('Units')) && f.endsWith('__c')
        ],
        'System Tracked Units'
      ),
      weekendingDate: findField(
        ['Weekending_Date__c', 'WeekEndingDate__c', 'Week_Ending__c'],
        [
          f => f.includes('Week') && f.includes('Ending') && f.endsWith('__c'),
          f => f.includes('WeekEnding') && f.endsWith('__c')
        ],
        'Weekending Date'
      ),
      payrate: findField(
        ['Payrate__c', 'Pay_Rate__c', 'PayRate__c', 'Rate__c'],
        [
          f => f.includes('Pay') && f.includes('Rate') && f.endsWith('__c'),
          f => f.includes('Rate') && f.endsWith('__c')
        ],
        'Payrate'
      ),
      totalPayment: findField(
        ['Payment_Amount__c', 'Total_Payment__c', 'TotalPayment__c', 'Payment__c'],
        [
          f => f.includes('Payment') && f.includes('Amount') && f.endsWith('__c'),
          f => f.includes('Total') && f.includes('Payment') && f.endsWith('__c'),
          f => f.includes('Payment') && f.endsWith('__c')
        ],
        'Total Payment'
      ),
      status: findField(
        ['Status__c', 'Approval_Status__c', 'Status'],
        [
          f => f.includes('Status') && f.endsWith('__c'),
          f => f === 'Status'
        ],
        'Status'
      ) || 'Status__c'
    };


    return fields;
  } catch (error) {
    console.error('Error discovering self reported time fields:', error);
    throw error;
  }
};

/**
 * Build WHERE clause for filters
 * Note: For deeply nested relationships, we use a multi-step approach:
 * 1. Find Account ID by name
 * 2. Find Project IDs for that Account
 * 3. Find Project Objective IDs for those Projects
 * 4. Filter main query by Project Objective IDs
 */
const buildWhereClause = async (filters, fields, conn) => {
  const conditions = [];

  // Get relationship names for filters
  const projectObjectiveRel = fields.projectObjectiveRelationship || (fields.projectObjective ? fields.projectObjective.replace('__c', '__r') : 'Project_Objective__r');
  const contributorRel = fields.contributorRelationship || (fields.contributor ? fields.contributor.replace('__c', '__r') : 'Contact__r');

  // Field-based filtering - map client field names to Salesforce field paths
  if (filters.field && filters.value) {
    const field = filters.field;
    const value = String(filters.value).replace(/'/g, "''");
    
    switch (field) {
      case 'transactionId':
        conditions.push(`(${fields.transactionId} = '${value}' OR Transaction_ID__c = '${value}')`);
        break;
        
      case 'contributorName':
        if (fields.contributorContactRelationship) {
          conditions.push(`${contributorRel}.${fields.contributorContactRelationship}.Name = '${value}'`);
        } else {
          conditions.push(`${contributorRel}.Name = '${value}'`);
        }
        break;
        
      case 'email':
        if (fields.contributorContactRelationship) {
          conditions.push(`${contributorRel}.${fields.contributorContactRelationship}.Email = '${value}'`);
        } else {
          conditions.push(`${contributorRel}.Email = '${value}'`);
        }
        break;
        
      case 'projectObjectiveName':
        if (projectObjectiveRel && projectObjectiveRel.includes('.')) {
          // Nested relationship
          conditions.push(`${projectObjectiveRel}.Name = '${value}'`);
        } else if (projectObjectiveRel) {
          conditions.push(`${projectObjectiveRel}.Name = '${value}'`);
        } else {
          // Fallback
          const fallbackRel = fields.projectObjective ? fields.projectObjective.replace('__c', '__r') : 'Project_Objective__r';
          conditions.push(`${fallbackRel}.Name = '${value}'`);
        }
        break;
        
      case 'accountName':
        // Account filter - filter on the account name in the relationship path
        // The account name comes from: Contributor_Project__r.Project_Objective__r.Project__r.Account__r.Name
        try {
          // Try to use the relationship path directly if it's a nested relationship
          if (projectObjectiveRel && projectObjectiveRel.includes('.')) {
            // Nested relationship like Contributor_Project__r.Project_Objective__r
            // Build the full path to Account: Contributor_Project__r.Project_Objective__r.Project__r.Account__r.Name
            const accountPath = `${projectObjectiveRel}.Project__r.Account__r.Name`;
            // Note: Salesforce may not support this deep nesting in WHERE clauses, so we'll fall back to multi-step
            // But let's try it first
            try {
              conditions.push(`${accountPath} = '${value}'`);
              break; // If this works, we're done
            } catch (pathErr) {
              // Fall through to multi-step approach
            }
          }
          
          // Multi-step approach: Find Account -> Projects -> Project Objectives -> Contributor Projects
          const accountQuery = `SELECT Id FROM Account WHERE Name = '${value}' LIMIT 1`;
          const accountResult = await conn.query(accountQuery);
          
          if (accountResult.records && accountResult.records.length > 0) {
            const accountId = accountResult.records[0].Id;
            const projectsQuery = `SELECT Id FROM Project__c WHERE Account__c = '${accountId}' LIMIT 10000`;
            const projectsResult = await conn.query(projectsQuery);
            const projectIds = (projectsResult.records || []).map(p => p.Id);
            
            if (projectIds.length > 0) {
              const PO_BATCH_SIZE = 5000;
              let allPoIds = [];
              
              for (let i = 0; i < projectIds.length; i += PO_BATCH_SIZE) {
                const batch = projectIds.slice(i, i + PO_BATCH_SIZE);
                const projectIdsList = batch.map(id => `'${id}'`).join(',');
                const poQuery = `SELECT Id FROM Project_Objective__c WHERE Project__c IN (${projectIdsList}) LIMIT 10000`;
                const poResult = await conn.query(poQuery);
                const batchPoIds = (poResult.records || []).map(po => po.Id);
                allPoIds = allPoIds.concat(batchPoIds);
              }
              
              if (allPoIds.length > 0) {
                const CP_BATCH_SIZE = 5000;
                let allCpIds = [];
                
                for (let i = 0; i < allPoIds.length; i += CP_BATCH_SIZE) {
                  try {
                    const batch = allPoIds.slice(i, i + CP_BATCH_SIZE);
                    const batchList = batch.map(id => `'${id}'`).join(',');
                    const cpQuery = `SELECT Id FROM Contributor_Project__c WHERE Project_Objective__c IN (${batchList}) LIMIT 10000`;
                    const cpResult = await conn.query(cpQuery);
                    const batchCpIds = (cpResult.records || []).map(cp => cp.Id);
                    allCpIds = allCpIds.concat(batchCpIds);
                  } catch (batchErr) {
                    console.error(`Error querying Contributor_Projects batch:`, batchErr.message);
                  }
                }
                
                if (allCpIds.length > 0) {
                  const BATCH_SIZE = 500;
                  if (allCpIds.length <= BATCH_SIZE) {
                    const cpIdsList = allCpIds.map(id => `'${id}'`).join(',');
                    const condition = `${fields.projectObjective} IN (${cpIdsList})`;
                    conditions.push(condition);
                  } else {
                    const batches = [];
                    for (let i = 0; i < allCpIds.length; i += BATCH_SIZE) {
                      const batch = allCpIds.slice(i, i + BATCH_SIZE);
                      const batchList = batch.map(id => `'${id}'`).join(',');
                      batches.push(`${fields.projectObjective} IN (${batchList})`);
                    }
                    if (batches.length > 100) {
                      const condition = `(${batches.slice(0, 100).join(' OR ')})`;
                      conditions.push(condition);
                    } else {
                      const condition = `(${batches.join(' OR ')})`;
                      conditions.push(condition);
                    }
                  }
                } else {
                  conditions.push(`${fields.projectObjective} = null`);
                }
              } else {
                conditions.push(`${fields.projectObjective} = null`);
              }
            } else {
              conditions.push(`${fields.projectObjective} = null`);
            }
          } else {
            conditions.push(`${fields.projectObjective} = null`);
          }
        } catch (err) {
          console.error('[Account Filter] Error applying account filter:', err.message);
          console.error('[Account Filter] Error stack:', err.stack?.substring(0, 500));
          conditions.push(`Id = null`);
        }
        break;
        
      case 'status':
        conditions.push(`${fields.status} = '${value}'`);
        break;
        
      default:
        console.warn(`[Field Filter] Unknown field: ${field}`);
        break;
    }
  }
  
  // Default status filter if no field filter is applied
  if (conditions.length === 0) {
    conditions.push(`(${fields.status} = 'PM Review' OR ${fields.status} = 'Contributor Approved')`);
  }

  return conditions.length > 0 ? conditions.join(' AND ') : null;
};

/**
 * GET /api/pm-approvals/list
 * Fetch paginated list of approval records
 */
router.get('/list', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverSelfReportedTimeFields(conn);
    
    // If object not found, return empty result
    if (!fields.objectName) {
      return res.json({
        success: true,
        records: [],
        total: 0,
        hasMore: false,
        offset: 0,
        warning: 'Self Reported Time object not found in Salesforce. Please configure the Salesforce object.'
      });
    }


    const {
      filterField = '',
      filterValue = '',
      offset = 0,
      limit = 10000, // Increased default limit to fetch more records
      sortBy = 'Transaction_Date__c',
      sortOrder = 'DESC'
    } = req.query;

    // Sanitize filter inputs
    // Field name should be a simple identifier (no special sanitization needed)
    const sanitizeFilterField = (value) => {
      if (!value || value === '') return '';
      // Field names are simple identifiers, just trim and validate
      const trimmed = String(value).trim();
      // Only allow alphanumeric and underscore for field names
      if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return trimmed;
      }
      return '';
    };
    
    // Filter value needs proper sanitization for SOQL
    const sanitizeFilterValue = (value) => {
      if (!value || value === '') return '';
      const sanitized = validateAndSanitizeSearchTerm(value);
      return sanitized || '';
    };
    
    const filters = {
      field: sanitizeFilterField(filterField),
      value: sanitizeFilterValue(filterValue)
    };

    let whereClause;
    try {
      whereClause = await buildWhereClause(filters, fields, conn);
    } catch (err) {
      console.error('CRITICAL: Error building WHERE clause:', err.message);
      console.error('Error stack:', err.stack?.substring(0, 500));
      // If WHERE clause building fails completely, use default status filter only
      whereClause = `(${fields.status} = 'PM Review' OR ${fields.status} = 'Contributor Approved')`;
    }
    

    // Get relationship names for building query
    const contributorRel = fields.contributorRelationship || (fields.contributor ? fields.contributor.replace('__c', '__r') : 'Contact__r');
    const projectObjectiveRel = fields.projectObjectiveRelationship || (fields.projectObjective ? fields.projectObjective.replace('__c', '__r') : 'Project_Objective__r');

    // Build field list for query with proper relationship names
    const queryFields = [
      'Id',
      fields.transactionId !== 'Id' ? fields.transactionId : ''
    ];

    // Add contributor relationship fields if available
    if (fields.contributor) {
      // Always add the lookup field itself (e.g., Contributor_Project__c)
      // This gives us the ID of the related record
      queryFields.push(fields.contributor);
      
      // If contributor points to Contributor_Project__c, get Contact name and email from within it
      if (fields.contributorContactRelationship) {
        // Add nested relationship fields: Contributor_Project__r.Contributor__r.Name
        // Note: We don't add Contributor_Project__r by itself - that's invalid SOQL
        queryFields.push(`${contributorRel}.${fields.contributorContactRelationship}.Name`);
        queryFields.push(`${contributorRel}.${fields.contributorContactRelationship}.Email`);
      } else {
        // Direct Contact relationship
        // Add relationship fields: Contact__r.Name, Contact__r.Email
        // Note: We don't add Contact__r by itself - that's invalid SOQL
        queryFields.push(`${contributorRel}.Name`);
        queryFields.push(`${contributorRel}.Email`);
      }
    }

    // Add project objective relationship fields if available
    if (fields.projectObjective) {
      queryFields.push(fields.projectObjective);
      // Check if Project Objective is accessed through nested relationship (e.g., Contributor_Project__r.Project_Objective__r)
      if (projectObjectiveRel && projectObjectiveRel.includes('.')) {
        // Nested relationship (e.g., Contributor_Project__r.Project_Objective__r.Name)
        queryFields.push(`${projectObjectiveRel}.Name`);
        
        // Add Project name through the nested relationship: Contributor_Project__r.Project_Objective__r.Project__r.Name
        queryFields.push(`${projectObjectiveRel}.Project__r.Name`);
        
        // Add Account field through the nested relationship: Contributor_Project__r.Project_Objective__r.Project__r.Account__r.Name
        queryFields.push(`${projectObjectiveRel}.Project__r.Account__r.Name`);
      } else if (projectObjectiveRel) {
        // Direct relationship (e.g., Project_Objective__r.Name)
        queryFields.push(`${projectObjectiveRel}.Name`);
        
        // Add Project name through direct relationship: Project_Objective__r.Project__r.Name
        queryFields.push(`${projectObjectiveRel}.Project__r.Name`);
        
        // Add Account field through direct relationship: Project_Objective__r.Project__r.Account__r.Name
        queryFields.push(`${projectObjectiveRel}.Project__r.Account__r.Name`);
      }
      // Also add fallback relationship names to ensure we get the data (only if not nested)
      if (!projectObjectiveRel || !projectObjectiveRel.includes('.')) {
        const fallbackRel = fields.projectObjective.replace('__c', '__r');
        if (fallbackRel !== projectObjectiveRel) {
          queryFields.push(`${fallbackRel}.Name`);
          console.log(`Also adding fallback relationship: ${fallbackRel}.Name`);
          // Add Project through fallback relationship
          queryFields.push(`${fallbackRel}.Project__r.Name`);
          // Add Account through fallback relationship
          queryFields.push(`${fallbackRel}.Project__r.Account__r.Name`);
        }
      }
    } else {
      console.warn('Project Objective field not found, skipping relationship query');
    }

    // Add other fields
    queryFields.push(
      fields.transactionDate,
      fields.selfReportedHours || '',
      fields.selfReportedUnits || '',
      fields.systemTrackedHours || '',
      fields.systemTrackedUnits || '',
      fields.weekendingDate || '',
      fields.payrate || '',
      fields.totalPayment || '',
      fields.status,
      'CreatedDate',
      'LastModifiedDate'
    );

    // Remove duplicates from queryFields
    const uniqueQueryFields = [...new Set(queryFields.filter(f => f !== ''))];
    const selectFields = uniqueQueryFields.join(', ');

    // Build SOQL query
    let soql = `SELECT ${selectFields} FROM ${fields.objectName}`;
    if (whereClause) {
      soql += ` WHERE ${whereClause}`;
    }

    // Note: GPC filter is applied client-side for PM Approvals
    // because Payment_Transactions_Needing_Approval__c doesn't have direct Account__c field

    // Add sorting
    const validSortBy = sortBy || fields.transactionDate;
    const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    soql += ` ORDER BY ${validSortBy} ${validSortOrder}`;

    // Add pagination - fetch records in batches of 5,000
    // IMPORTANT: Salesforce has a maximum OFFSET of 2000, so we need to use cursor-based pagination
    // for offsets beyond 2000 (using WHERE Id > lastId instead of OFFSET)
    const batchSize = 5000; // Fetch 5,000 records per batch
    const limitNum = parseInt(limit) || batchSize;
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
    
    // Build initial query with LIMIT (max 2000 per Salesforce query, but we'll use queryMore)
    const queryLimit = Math.min(batchSize, 2000); // Salesforce max per query
    
    // For offsets > 2000, we cannot use OFFSET, so we'll fetch from offset 0 and skip in application layer
    // This is necessary due to Salesforce's 2000 OFFSET limit
    if (offsetNum > 0 && offsetNum <= 2000) {
      // Use OFFSET for first 2000 records (this is allowed)
      soql += ` LIMIT ${queryLimit} OFFSET ${offsetNum}`;
    } else {
      // For offset 0 or offset > 2000, start from beginning
      // We'll handle skipping for offset > 2000 in the application layer
      soql += ` LIMIT ${queryLimit}`;
      if (offsetNum > 2000) {
      }
    }


    // Execute initial query
    let result = await conn.query(soql);
    let allRecords = [...(result.records || [])];
    
    
    // Fetch more records in this batch using queryMore (up to batchSize)
    // This allows us to get 5,000 records per API call
    let pageCount = 0;
    const MAX_PAGES_PER_BATCH = 3; // 3 pages * 2000 = 6,000 records max per batch (we use 5,000)
    
    // Continue fetching until we reach batchSize or no more records
    let hasMoreInSalesforce = !!result.nextRecordsUrl;
    while (result.nextRecordsUrl && allRecords.length < batchSize && pageCount < MAX_PAGES_PER_BATCH) {
      try {
        result = await conn.queryMore(result.nextRecordsUrl);
        if (result.records && result.records.length > 0) {
          allRecords = allRecords.concat(result.records);
          pageCount++;
          hasMoreInSalesforce = !!result.nextRecordsUrl;
        } else {
          console.log('No more records in this batch');
          hasMoreInSalesforce = false;
          break;
        }
        // If we've reached the batch size, stop even if there are more records
        if (allRecords.length >= batchSize) {
          console.log(`Reached batch size limit: ${batchSize}`);
          // Keep hasMoreInSalesforce as true if there's still a nextRecordsUrl
          hasMoreInSalesforce = !!result.nextRecordsUrl;
          break;
        }
      } catch (err) {
        console.error('Error fetching more records:', err.message);
        hasMoreInSalesforce = false;
        break;
      }
    }
    
    console.log(`Batch fetched: ${allRecords.length} records (offset: ${offsetNum}), hasMoreInSalesforce: ${hasMoreInSalesforce}`);

    // Handle offset > 2000 by skipping records in application layer
    // This is necessary because Salesforce doesn't allow OFFSET > 2000
    // When offset > 2000, we need to fetch enough records to cover the skip + batchSize
    let recordsToReturn = allRecords;
    if (offsetNum > 2000) {
      // We fetched from offset 0 (no OFFSET in query), so we need to skip offsetNum records
      const skipCount = offsetNum;
      const recordsNeeded = skipCount + batchSize; // We need skipCount + batchSize records total
      
      // Get total count to determine if we need more records
      let totalCount = 0;
      try {
        const totalCountQuery = `SELECT COUNT() FROM ${fields.objectName}${whereClause ? ` WHERE ${whereClause}` : ''}`;
        const totalCountResult = await conn.query(totalCountQuery);
        totalCount = totalCountResult.totalSize || 0;
      } catch (err) {
        console.warn('Could not get total count:', err.message);
      }
      
      // If we don't have enough records, we need to fetch more
      // Continue fetching until we have enough or no more records available
      // Calculate max pages needed: we need at least (skipCount + batchSize) / 2000 pages
      const maxPagesNeeded = Math.ceil(recordsNeeded / 2000) + 2; // Add buffer
      let maxPagesToFetch = Math.max(maxPagesNeeded, MAX_PAGES_PER_BATCH * 10);
      
      while (allRecords.length < recordsNeeded && pageCount < maxPagesToFetch) {
        let fetchedMore = false;
        
        // First try queryMore if available
        if (result.nextRecordsUrl) {
          try {
            result = await conn.queryMore(result.nextRecordsUrl);
            if (result.records && result.records.length > 0) {
              allRecords = allRecords.concat(result.records);
              pageCount++;
              hasMoreInSalesforce = !!result.nextRecordsUrl;
              fetchedMore = true;
            }
          } catch (err) {
            console.error('Error fetching more records for skip:', err.message);
          }
        }
        
        // If queryMore didn't work or isn't available, try continuation query
        if (!fetchedMore && allRecords.length < recordsNeeded && allRecords.length > 0) {
          const lastId = allRecords[allRecords.length - 1].Id;
          const continueQuery = `SELECT ${selectFields} FROM ${fields.objectName}${whereClause ? ` WHERE ${whereClause} AND` : ' WHERE'} Id > '${lastId}' ORDER BY ${validSortBy} ${validSortOrder} LIMIT ${queryLimit}`;
          try {
            result = await conn.query(continueQuery);
            if (result.records && result.records.length > 0) {
              allRecords = allRecords.concat(result.records);
              pageCount++;
              hasMoreInSalesforce = !!result.nextRecordsUrl;
              fetchedMore = true;
            } else {
              // No more records available
              hasMoreInSalesforce = false;
              break;
            }
          } catch (err) {
            console.error('Error in continuation query:', err.message);
            hasMoreInSalesforce = false;
            break;
          }
        }
        
        // If we didn't fetch more and we still need more, break
        if (!fetchedMore) {
          hasMoreInSalesforce = false;
          break;
        }
      }
      
      // Now skip the records
      if (skipCount > 0 && allRecords.length > skipCount) {
        // We have enough records - skip the first offsetNum records and take the next batchSize
        recordsToReturn = allRecords.slice(skipCount, skipCount + batchSize);
        console.log(`Skipped ${skipCount} records in application layer (offset was ${offsetNum}, fetched ${allRecords.length}, returning ${recordsToReturn.length})`);
      } else if (skipCount > 0 && allRecords.length <= skipCount) {
        // We don't have enough records yet - all were skipped
        // Check if we can fetch more records
        if (totalCount > 0 && allRecords.length < totalCount) {
          // We haven't reached the total yet, so there are more records to fetch
          // Continue fetching until we have enough
          console.log(`Need more records: skipCount=${skipCount}, fetched=${allRecords.length}, total=${totalCount}. Continuing to fetch...`);
          
          // Continue fetching using continuation queries
          while (allRecords.length <= skipCount && allRecords.length < totalCount && pageCount < maxPagesToFetch) {
            if (allRecords.length > 0) {
              const lastId = allRecords[allRecords.length - 1].Id;
              const continueQuery = `SELECT ${selectFields} FROM ${fields.objectName}${whereClause ? ` WHERE ${whereClause} AND` : ' WHERE'} Id > '${lastId}' ORDER BY ${validSortBy} ${validSortOrder} LIMIT ${queryLimit}`;
              try {
                result = await conn.query(continueQuery);
                if (result.records && result.records.length > 0) {
                  allRecords = allRecords.concat(result.records);
                  pageCount++;
                  hasMoreInSalesforce = !!result.nextRecordsUrl;
                } else {
                  // No more records available
                  break;
                }
              } catch (err) {
                console.error('Error in continuation query for skip:', err.message);
                break;
              }
            } else {
              break;
            }
          }
          
          // Now try to skip again
          if (allRecords.length > skipCount) {
            recordsToReturn = allRecords.slice(skipCount, skipCount + batchSize);
          } else {
            // Still don't have enough - return empty but indicate we're still fetching
            recordsToReturn = [];
          }
        } else {
          // No more records available
          recordsToReturn = [];
        }
      } else {
        // Normal case - no skipping needed
        recordsToReturn = allRecords;
      }
    } else if (offsetNum > 0 && offsetNum <= 2000) {
      // Normal case - OFFSET was used in query, so allRecords is already at the right position
      recordsToReturn = allRecords;
    }
    
    // Transform records (projectObjectiveRel and contributorRel are already defined above)
    // Use recordsToReturn instead of allRecords to handle offset > 2000
    const records = recordsToReturn.map(record => {
      const transactionId = record[fields.transactionId] || record.Id;
      
      const selfReportedHours = record[fields.selfReportedHours] || 0;
      const systemTrackedHours = record[fields.systemTrackedHours] || 0;
      const selfReportedUnits = record[fields.selfReportedUnits] || 0;
      const systemTrackedUnits = record[fields.systemTrackedUnits] || 0;

      // Calculate variance
      let variancePercent = 0;
      if (systemTrackedHours > 0) {
        variancePercent = ((selfReportedHours - systemTrackedHours) / systemTrackedHours) * 100;
      } else if (selfReportedHours > 0) {
        variancePercent = 100;
      }

      // Get contributor name and email from relationship
      let contributorName = '';
      let email = '';
      
      // Try multiple contributor relationship paths
      const contributorPaths = [
        contributorRel,
        fields.contributor ? fields.contributor.replace('__c', '__r') : null,
        'Contact__r',
        'Contributor__r',
        'Contributor_Project__r'
      ].filter(Boolean);
      
      for (const path of contributorPaths) {
        if (record[path]) {
          // If contributor points to Contributor_Project__c, get Contact name and email from within it
          if (fields.contributorContactRelationship && record[path][fields.contributorContactRelationship]) {
            contributorName = record[path][fields.contributorContactRelationship].Name || '';
            email = record[path][fields.contributorContactRelationship].Email || '';
            break;
          } else if (record[path].Name) {
            // Direct Contact relationship
            contributorName = record[path].Name || '';
            email = record[path].Email || '';
            break;
          }
        }
      }
      

      // Get project objective name from relationship
      let projectObjectiveName = '';
      let projectName = '';
      let accountName = '';
      const projectObjectiveId = record[fields.projectObjective] || null;
      
      // Try to get Project name from flattened field first (Salesforce sometimes returns nested fields as flattened)
      const flattenedFieldNames = [
        'Contributor_Project__r.Project_Objective__r.Project__r.Name',
        'Project_Objective__r.Project__r.Name',
        projectObjectiveRel && projectObjectiveRel.includes('.') 
          ? `${projectObjectiveRel}.Project__r.Name`
          : `${projectObjectiveRel || 'Project_Objective__r'}.Project__r.Name`
      ];
      
      for (const fieldName of flattenedFieldNames) {
        if (record[fieldName]) {
          projectName = record[fieldName];
          break;
        }
      }
      
      // Check if Project Objective is accessed through nested relationship
      if (projectObjectiveRel && projectObjectiveRel.includes('.')) {
        // Nested relationship (e.g., Contributor_Project__r.Project_Objective__r)
        const parts = projectObjectiveRel.split('.');
        let nestedObj = record;
        for (const part of parts) {
          if (nestedObj && nestedObj[part]) {
            nestedObj = nestedObj[part];
          } else {
            nestedObj = null;
            break;
          }
        }
        if (nestedObj && nestedObj.Name) {
          projectObjectiveName = nestedObj.Name;
        }
        
        // Extract Project name from nested relationship: Contributor_Project__r.Project_Objective__r.Project__r.Name
        // Only set if not already set from flattened field
        if (!projectName && nestedObj && nestedObj.Project__r && nestedObj.Project__r.Name) {
          projectName = nestedObj.Project__r.Name;
        } else if (!projectName && nestedObj && nestedObj.Project__r) {
          console.warn(`⚠️ Project relationship found but Name is missing. Project__r keys: ${Object.keys(nestedObj.Project__r || {}).join(', ')}`);
        }
        
        // Extract Account name from nested relationship: Contributor_Project__r.Project_Objective__r.Project__r.Account__r.Name
        if (nestedObj && nestedObj.Project__r && nestedObj.Project__r.Account__r && nestedObj.Project__r.Account__r.Name) {
          accountName = nestedObj.Project__r.Account__r.Name;
        }
      } else {
        // Direct relationship - try all possible relationship names systematically
        const relationshipNamesToTry = [
          projectObjectiveRel, // Primary discovered relationship
          fields.projectObjective ? fields.projectObjective.replace('__c', '__r') : null, // Standard pattern
          'Project_Objective__r', // Common name
          'Contributor_Project__r.Project_Objective__r', // Nested path
          fields.projectObjective === 'Project_Objective__c' ? 'Project_Objective__r' : null
        ].filter(Boolean);
        
        for (const relName of relationshipNamesToTry) {
          let relObj = record[relName];
          
          // Handle nested relationship paths
          if (relName.includes('.')) {
            const parts = relName.split('.');
            relObj = record;
            for (const part of parts) {
              if (relObj && relObj[part]) {
                relObj = relObj[part];
              } else {
                relObj = null;
                break;
              }
            }
          }
          
          if (relObj && relObj.Name) {
            projectObjectiveName = relObj.Name;
            
            // Extract Project name from direct relationship: Project_Objective__r.Project__r.Name
            // Only set if not already set from flattened field
            if (!projectName && relObj.Project__r && relObj.Project__r.Name) {
              projectName = relObj.Project__r.Name;
            }
            
            // Extract Account name from direct relationship: Project_Objective__r.Project__r.Account__r.Name
            if (relObj.Project__r && relObj.Project__r.Account__r && relObj.Project__r.Account__r.Name) {
              accountName = relObj.Project__r.Account__r.Name;
            }
            break; // Found it, stop trying
          }
        }
      }
      
      // Additional fallback: Try to extract from Contributor_Project if it exists
      if ((!projectObjectiveName || !projectName || !accountName) && record['Contributor_Project__r']) {
        const cpRel = record['Contributor_Project__r'];
        
        // Try to get Project Objective from Contributor_Project
        if (!projectObjectiveName && cpRel.Project_Objective__r && cpRel.Project_Objective__r.Name) {
          projectObjectiveName = cpRel.Project_Objective__r.Name;
        }
        
        // Try to get Project from Contributor_Project -> Project_Objective -> Project
        if (!projectName && cpRel.Project_Objective__r && cpRel.Project_Objective__r.Project__r && cpRel.Project_Objective__r.Project__r.Name) {
          projectName = cpRel.Project_Objective__r.Project__r.Name;
        }
        
        // Try to get Account from Contributor_Project -> Project_Objective -> Project -> Account
        if (!accountName && cpRel.Project_Objective__r && cpRel.Project_Objective__r.Project__r && 
            cpRel.Project_Objective__r.Project__r.Account__r && cpRel.Project_Objective__r.Project__r.Account__r.Name) {
          accountName = cpRel.Project_Objective__r.Project__r.Account__r.Name;
        }
      }
      
      // If we still don't have a name but have an ID, log for debugging
      if (projectObjectiveId && !projectObjectiveName) {
        console.warn(`⚠️ Project Objective ID found (${projectObjectiveId}) but name is empty.`);
        console.warn(`   Field: ${fields.projectObjective}`);
        console.warn(`   Primary relationship tried: ${projectObjectiveRel}`);
        console.warn(`   All relationship keys in record: ${Object.keys(record).filter(k => k.includes('Objective') || k.includes('Project') || k.endsWith('__r')).join(', ')}`);
        if (record[projectObjectiveRel]) {
          console.warn(`   Relationship object (${projectObjectiveRel}) keys: ${Object.keys(record[projectObjectiveRel] || {}).join(', ')}`);
        }
      }
      
      // Log if project name is missing
      if (projectObjectiveId && !projectName) {
        console.warn(`⚠️ Project Objective ID found (${projectObjectiveId}) but project name is empty.`);
        if (projectObjectiveRel && projectObjectiveRel.includes('.')) {
          const parts = projectObjectiveRel.split('.');
          let nestedObj = record;
          for (const part of parts) {
            if (nestedObj && nestedObj[part]) {
              nestedObj = nestedObj[part];
            } else {
              nestedObj = null;
              break;
            }
          }
          if (nestedObj) {
            console.warn(`   Nested object keys: ${Object.keys(nestedObj || {}).join(', ')}`);
            if (nestedObj.Project__r) {
              console.warn(`   Project__r keys: ${Object.keys(nestedObj.Project__r || {}).join(', ')}`);
            }
          }
        }
      }
      
      // Final fallback: If we still don't have values, try to extract from ANY relationship field
      // This handles cases where the relationship structure might be different than expected
      if (!contributorName || !projectObjectiveName || !projectName || !accountName) {
        const allRelFields = Object.keys(record).filter(k => k.endsWith('__r') || k.includes('__r.'));
        
        // Try to find Contact/Contributor info in any relationship
        if (!contributorName || !email) {
          for (const relField of allRelFields) {
            const relObj = record[relField];
            if (relObj && typeof relObj === 'object') {
              // Check if this relationship has Name and Email (likely a Contact)
              if (relObj.Name && !contributorName) {
                contributorName = relObj.Name;
              }
              if (relObj.Email && !email) {
                email = relObj.Email;
              }
              // Check nested relationships
              for (const nestedKey of Object.keys(relObj)) {
                if (nestedKey.endsWith('__r') && relObj[nestedKey]) {
                  const nestedObj = relObj[nestedKey];
                  if (nestedObj && typeof nestedObj === 'object') {
                    if (nestedObj.Name && !contributorName) {
                      contributorName = nestedObj.Name;
                    }
                    if (nestedObj.Email && !email) {
                      email = nestedObj.Email;
                    }
                  }
                }
              }
            }
          }
        }
        
        // Try to find Project Objective/Project/Account info in any relationship
        if (!projectObjectiveName || !projectName || !accountName) {
          for (const relField of allRelFields) {
            const relObj = record[relField];
            if (relObj && typeof relObj === 'object') {
              // Check if this relationship has Name (could be Project Objective or Project)
              if (relObj.Name && !projectObjectiveName) {
                // Check if it might be a Project Objective (has Project__r)
                if (relObj.Project__r) {
                  projectObjectiveName = relObj.Name;
                  if (relObj.Project__r.Name && !projectName) {
                    projectName = relObj.Project__r.Name;
                  }
                  if (relObj.Project__r.Account__r && relObj.Project__r.Account__r.Name && !accountName) {
                    accountName = relObj.Project__r.Account__r.Name;
                  }
                }
              }
              // Check nested relationships for Project/Account
              for (const nestedKey of Object.keys(relObj)) {
                if (nestedKey.endsWith('__r') && relObj[nestedKey]) {
                  const nestedObj = relObj[nestedKey];
                  if (nestedObj && typeof nestedObj === 'object') {
                    if (nestedObj.Name && !projectObjectiveName && nestedObj.Project__r) {
                      projectObjectiveName = nestedObj.Name;
                    }
                    if (nestedObj.Project__r && nestedObj.Project__r.Name && !projectName) {
                      projectName = nestedObj.Project__r.Name;
                    }
                    if (nestedObj.Project__r && nestedObj.Project__r.Account__r && nestedObj.Project__r.Account__r.Name && !accountName) {
                      accountName = nestedObj.Project__r.Account__r.Name;
                    }
                  }
                }
              }
            }
          }
        }
      }

      return {
        id: record.Id,
        transactionId: record[fields.transactionId] || record.Id,
        contributorId: record[fields.contributor] || null,
        contributorName: contributorName,
        email: email,
        projectObjectiveId: record[fields.projectObjective] || null,
        projectObjectiveName: projectObjectiveName,
        projectName: projectName || '',
        accountName: accountName || '',
        transactionDate: record[fields.transactionDate] || record.CreatedDate || null,
        weekendingDate: record[fields.weekendingDate] || null,
        selfReportedHours: selfReportedHours,
        selfReportedUnits: selfReportedUnits,
        systemTrackedHours: systemTrackedHours,
        systemTrackedUnits: systemTrackedUnits,
        variancePercent: Math.round(variancePercent * 10) / 10,
        payrate: record[fields.payrate] || 0,
        totalPayment: record[fields.totalPayment] || (selfReportedHours * (record[fields.payrate] || 0)),
        status: record[fields.status] || ''
      };
    });

    // Get total count (separate query for performance)
    // Count all records (including potential duplicates) for pagination purposes
    let countQuery = `SELECT COUNT() FROM ${fields.objectName}`;
    if (whereClause) {
      countQuery += ` WHERE ${whereClause}`;
    }
    const countResult = await conn.query(countQuery);
    const total = countResult.totalSize || 0;
    
    // Count unique records in the current batch (by Id)
    // Ensure records is an array before processing
    const recordsArray = Array.isArray(records) ? records : [];
    const uniqueRecordIds = new Set(recordsArray.map(r => r && r.id ? r.id : null).filter(id => id !== null && id !== undefined));
    const uniqueCountInBatch = uniqueRecordIds.size;
    
    // Determine if there are more records
    // hasMore is true if:
    // 1. We got a full batch (10,000 records) AND there are more records in Salesforce (hasMoreInSalesforce)
    // 2. OR we got less than a full batch but there's still a nextRecordsUrl
    // 3. OR the total count indicates there are more records beyond what we fetched
    // Note: For offset > 2000, we need to account for the records we skipped
    const recordsReturned = records.length;
    const effectiveOffset = offsetNum + recordsReturned;
    
    // Always check if we've reached the total - this is the most reliable indicator
    // hasMore should be true if effectiveOffset < total, regardless of other conditions
    let hasMore = effectiveOffset < total;
    
    // Additional checks for edge cases:
    // - If we got 0 records but effectiveOffset < total, we should continue (might be fetching more to cover skip)
    // - If we got records and effectiveOffset < total, we should continue
    // - Only stop if effectiveOffset >= total (we've reached the end)
    
    

    res.json({
      success: true,
      records: records,
      total: total,
      hasMore: hasMore,
      offset: offsetNum,
      batchSize: recordsReturned,
      effectiveOffset: effectiveOffset,
      uniqueCountInBatch: uniqueCountInBatch // Number of unique records in this batch
    });
  } catch (error) {
    console.error('Error fetching PM approvals list:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch PM approvals'
    });
  }
}));

/**
 * GET /api/pm-approvals/summary
 * Fetch summary metrics
 */
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverSelfReportedTimeFields(conn);
    
    // If object not found, return empty summary
    if (!fields.objectName) {
      return res.json({
        success: true,
        data: {
          totalPendingHours: 0,
          totalHours: 0,
          selfReportedTime: 0,
          systemTracked: 0,
          totalPayment: 0,
          totalPendingUnits: 0
        },
        warning: 'Self Reported Time object not found in Salesforce. Please configure the Salesforce object.'
      });
    }

    // Use the new field-based filter structure for summary
    const sanitizeFilterValue = (value) => {
      if (!value || value === '') return '';
      const sanitized = validateAndSanitizeSearchTerm(value);
      return sanitized || '';
    };
    
    const filters = {
      field: sanitizeFilterValue(req.query.filterField),
      value: sanitizeFilterValue(req.query.filterValue)
    };

    // Build WHERE clause with the new filter structure
    // For summary, we want to include all statuses, so we'll build a base WHERE clause
    // and then add status conditions separately
    let baseWhereClause = null;
    try {
      // Only build filter conditions if a filter is actually applied
      if (filters.field && filters.value) {
        // Build WHERE clause with filter, but we'll remove the default status condition
        const tempWhereClause = await buildWhereClause(filters, fields, conn);
        
        // Remove the default status condition if it exists
        if (tempWhereClause) {
          // Escape special regex characters in the status field name
          const escapedStatus = fields.status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const statusPattern = new RegExp(`\\(${escapedStatus}\\s*=\\s*'[^']*'\\s*OR\\s*${escapedStatus}\\s*=\\s*'[^']*'\\)`, 'gi');
          baseWhereClause = tempWhereClause.replace(statusPattern, '').replace(/\s*AND\s*AND/gi, ' AND').replace(/^\s*AND\s*/gi, '').replace(/AND\s*$/gi, '').trim();
          if (baseWhereClause === '' || baseWhereClause === '()') baseWhereClause = null;
        }
      }
    } catch (err) {
      console.error('Error building WHERE clause for summary:', err.message);
      baseWhereClause = null;
    }

    // Get pending records (PM Review status or Contributor Approved status)
    // Build pending WHERE clause - records that need PM approval
    let pendingWhere = `(${fields.status} = 'PM Review' OR ${fields.status} = 'Contributor Approved')`;
    if (baseWhereClause && baseWhereClause !== '()' && baseWhereClause !== '') {
      pendingWhere = `${baseWhereClause} AND ${pendingWhere}`;
    }

    // Build base WHERE clause without status filter for all records
    const allWhereClause = (baseWhereClause && baseWhereClause !== '()' && baseWhereClause !== '') ? baseWhereClause : null;

    // Aggregate queries - get all metrics from filtered records
    // Use proper field names - only use if field exists, otherwise skip that metric
    if (!fields.selfReportedHours || !fields.totalPayment) {
      console.warn('Required fields not found for summary:', {
        selfReportedHours: fields.selfReportedHours,
        totalPayment: fields.totalPayment
      });
    }
    
    const selfReportedHoursField = fields.selfReportedHours;
    const selfReportedUnitsField = fields.selfReportedUnits;
    const systemTrackedHoursField = fields.systemTrackedHours;
    const totalPaymentField = fields.totalPayment;
    
    // Build queries only with fields that exist
    const pendingFields = [];
    if (selfReportedHoursField) pendingFields.push(`SUM(${selfReportedHoursField}) totalPendingHours`);
    if (selfReportedUnitsField) pendingFields.push(`SUM(${selfReportedUnitsField}) totalPendingUnits`);
    if (totalPaymentField) pendingFields.push(`SUM(${totalPaymentField}) totalPayment`);
    
    const allFields = [];
    if (selfReportedHoursField) allFields.push(`SUM(${selfReportedHoursField}) totalHours`);
    if (systemTrackedHoursField) allFields.push(`SUM(${systemTrackedHoursField}) totalSystemTracked`);
    
    const pendingSystemFields = [];
    if (systemTrackedHoursField) pendingSystemFields.push(`SUM(${systemTrackedHoursField}) totalPendingSystemTracked`);
    
    const pendingQuery = pendingFields.length > 0 
      ? `SELECT ${pendingFields.join(', ')} FROM ${fields.objectName} WHERE ${pendingWhere}`
      : null;
    
    const allQuery = allFields.length > 0
      ? `SELECT ${allFields.join(', ')} FROM ${fields.objectName}${allWhereClause ? ` WHERE ${allWhereClause}` : ''}`
      : null;
    
    const pendingSystemQuery = pendingSystemFields.length > 0
      ? `SELECT ${pendingSystemFields.join(', ')} FROM ${fields.objectName} WHERE ${pendingWhere}`
      : null;


    const [pendingResult, allResult, pendingSystemResult] = await Promise.all([
      pendingQuery ? (async () => {
        try {
          const result = await conn.query(pendingQuery);
          return result;
        } catch (err) {
          console.error('Error in pending query:', err.message);
          return { records: [{}] };
        }
      })() : Promise.resolve({ records: [{}] }),
      allQuery ? (async () => {
        try {
          const result = await conn.query(allQuery);
          return result;
        } catch (err) {
          console.error('Error in all query:', err.message);
          return { records: [{}] };
        }
      })() : Promise.resolve({ records: [{}] }),
      pendingSystemQuery ? (async () => {
        try {
          const result = await conn.query(pendingSystemQuery);
          return result;
        } catch (err) {
          console.error('Error in pending system query:', err.message);
          return { records: [{}] };
        }
      })() : Promise.resolve({ records: [{}] })
    ]);

    const pendingData = pendingResult.records?.[0] || {};
    const allData = allResult.records?.[0] || {};
    const pendingSystemData = pendingSystemResult.records?.[0] || {};

    // Handle null values from Salesforce (SUM returns null if no records)
    const totalPendingHours = pendingData.totalPendingHours != null ? pendingData.totalPendingHours : 0;
    const totalPendingUnits = pendingData.totalPendingUnits != null ? pendingData.totalPendingUnits : 0;
    const totalPayment = pendingData.totalPayment != null ? pendingData.totalPayment : 0;
    const totalHours = allData.totalHours != null ? allData.totalHours : 0;
    const totalSystemTracked = allData.totalSystemTracked != null ? allData.totalSystemTracked : 0;
    const totalPendingSystemTracked = pendingSystemData.totalPendingSystemTracked != null ? pendingSystemData.totalPendingSystemTracked : 0;

    res.json({
      success: true,
      data: {
        totalPendingHours: totalPendingHours,
        totalHours: totalHours,
        selfReportedTime: totalPendingHours,
        systemTracked: totalPendingSystemTracked, // System tracked hours for pending records
        totalPayment: totalPayment,
        totalPendingUnits: totalPendingUnits
      }
    });
  } catch (error) {
    console.error('Error fetching PM approvals summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch summary'
    });
  }
}));

/**
 * GET /api/pm-approvals/filters
 * Fetch available filter options - REBUILT FROM SCRATCH
 */
router.get('/filters', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverSelfReportedTimeFields(conn);
    
    if (!fields.objectName) {
      return res.json({
        success: true,
        filters: {
          accounts: [],
          projects: [],
          projectObjectives: [],
          emails: []
        },
        warning: 'Self Reported Time object not found in Salesforce.'
      });
    }

    const contributorRel = fields.contributorRelationship || (fields.contributor ? fields.contributor.replace('__c', '__r') : 'Contact__r');
    const projectObjectiveRel = fields.projectObjectiveRelationship || (fields.projectObjective ? fields.projectObjective.replace('__c', '__r') : 'Project_Objective__r');
    const isNestedRelationship = projectObjectiveRel && projectObjectiveRel.includes('.');

    // Helper function to safely extract and deduplicate string values
    const extractUniqueStrings = (records, extractor) => {
      const values = new Set();
      if (Array.isArray(records)) {
        records.forEach(record => {
          try {
            const value = extractor(record);
            if (value && typeof value === 'string' && value.trim()) {
              values.add(value.trim());
            }
          } catch (e) {
            // Skip invalid records
          }
        });
      }
      return Array.from(values).sort();
    };

    // 1. Fetch Accounts - Query Project__c object directly for Account__c field
    let accounts = [];
    try {
      // Query Project__c directly to get all distinct Account names
      const accountQuery = `SELECT DISTINCT Account__r.Name FROM Project__c WHERE Account__c != null AND Account__r.Name != null LIMIT 2000`;
      const result = await conn.query(accountQuery);
      accounts = extractUniqueStrings(result.records, (r) => r.Account__r?.Name);
      
      // Handle pagination if needed
      let pageCount = 0;
      const MAX_PAGES = 5;
      let currentResult = result;
      while (currentResult.nextRecordsUrl && pageCount < MAX_PAGES) {
        currentResult = await conn.queryMore(currentResult.nextRecordsUrl);
        const moreAccounts = extractUniqueStrings(currentResult.records, (r) => r.Account__r?.Name);
        accounts = [...new Set([...accounts, ...moreAccounts])].sort();
        pageCount++;
      }
    } catch (err) {
      console.error('Error fetching accounts from Project__c:', err.message, err.stack);
      // Fallback: try querying Account object directly
      try {
        const fallbackQuery = `SELECT Name FROM Account WHERE Name != null ORDER BY Name LIMIT 2000`;
        const fallbackResult = await conn.query(fallbackQuery);
        accounts = extractUniqueStrings(fallbackResult.records, (r) => r.Name);
      } catch (fallbackErr) {
        console.error('Error in fallback account query:', fallbackErr.message);
        accounts = [];
      }
    }

    // 2. Fetch Projects - Query Project__c object directly for Name field
    let projects = [];
    try {
      // Query Project__c directly to get all distinct Project names
      const projectQuery = `SELECT DISTINCT Name FROM Project__c WHERE Name != null LIMIT 2000`;
      const result = await conn.query(projectQuery);
      projects = extractUniqueStrings(result.records, (r) => r.Name);
      
      // Handle pagination if needed
      let pageCount = 0;
      const MAX_PAGES = 5;
      let currentResult = result;
      while (currentResult.nextRecordsUrl && pageCount < MAX_PAGES) {
        currentResult = await conn.queryMore(currentResult.nextRecordsUrl);
        const moreProjects = extractUniqueStrings(currentResult.records, (r) => r.Name);
        projects = [...new Set([...projects, ...moreProjects])].sort();
        pageCount++;
      }
    } catch (err) {
      console.error('Error fetching projects from Project__c:', err.message, err.stack);
      projects = [];
    }

    // 3. Fetch Project Objectives
    let projectObjectives = [];
    if (fields.projectObjective && fields.objectName) {
      try {
        let poQuery;
        if (projectObjectiveRel && !isNestedRelationship) {
          poQuery = `SELECT DISTINCT ${fields.projectObjective}, ${projectObjectiveRel}.Name FROM ${fields.objectName} WHERE ${fields.projectObjective} != null LIMIT 1000`;
        } else {
          poQuery = `SELECT DISTINCT ${fields.projectObjective} FROM ${fields.objectName} WHERE ${fields.projectObjective} != null LIMIT 1000`;
        }
        const result = await conn.query(poQuery);
        const poMap = new Map();
        if (Array.isArray(result.records)) {
          result.records.forEach(r => {
            try {
              const poId = r[fields.projectObjective];
              if (!poId) return;
              
              let poName = null;
              if (projectObjectiveRel && r[projectObjectiveRel]?.Name) {
                poName = r[projectObjectiveRel].Name;
              } else if (r[fields.projectObjective + '__r']?.Name) {
                poName = r[fields.projectObjective + '__r'].Name;
              } else if (r.Name) {
                poName = r.Name;
              }
              
              if (!poMap.has(poId)) {
                poMap.set(poId, { id: String(poId), name: poName || String(poId) });
              }
            } catch (e) {
              // Skip invalid records
            }
          });
        }
        projectObjectives = Array.from(poMap.values());
      } catch (err) {
        console.error('Error fetching project objectives:', err.message, err.stack);
        projectObjectives = [];
      }
    } else {
      console.warn('Filters API - Skipping project objectives: projectObjective=', fields.projectObjective, 'objectName=', fields.objectName);
    }

    // 4. Fetch Emails
    let emails = [];
    if (contributorRel && fields.objectName) {
      try {
        let emailQuery;
        if (fields.contributorContactRelationship) {
          emailQuery = `SELECT DISTINCT ${contributorRel}.${fields.contributorContactRelationship}.Email FROM ${fields.objectName} WHERE ${contributorRel}.${fields.contributorContactRelationship}.Email != null LIMIT 1000`;
        } else {
          emailQuery = `SELECT DISTINCT ${contributorRel}.Email FROM ${fields.objectName} WHERE ${contributorRel}.Email != null LIMIT 1000`;
        }
        const result = await conn.query(emailQuery);
        emails = extractUniqueStrings(result.records, (r) => {
          if (fields.contributorContactRelationship && r[contributorRel]?.[fields.contributorContactRelationship]) {
            return r[contributorRel][fields.contributorContactRelationship].Email;
          }
          return r[contributorRel]?.Email;
        });
      } catch (err) {
        console.error('Error fetching emails:', err.message, err.stack);
        emails = [];
      }
    } else {
      console.warn('Filters API - Skipping emails: contributorRel=', contributorRel, 'objectName=', fields.objectName);
    }

    // Return clean, simple response
    const response = {
      success: true,
      filters: {
        accounts: Array.isArray(accounts) ? accounts : [],
        projects: Array.isArray(projects) ? projects : [],
        projectObjectives: Array.isArray(projectObjectives) ? projectObjectives : [],
        emails: Array.isArray(emails) ? emails : []
      }
    };


    res.json(response);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch filter options'
    });
  }
}));

/**
 * GET /api/pm-approvals/deadlines
 * Fetch deadline dates
 */
router.get('/deadlines', authenticate, asyncHandler(async (req, res) => {
  try {
    // For now, return default dates - can be made configurable later
    const now = new Date();
    const contributorDeadline = new Date(now);
    contributorDeadline.setDate(contributorDeadline.getDate() + 7);
    contributorDeadline.setHours(18, 0, 0, 0);

    const pmDeadline = new Date(contributorDeadline);
    pmDeadline.setDate(pmDeadline.getDate() + 2);
    pmDeadline.setHours(23, 30, 0, 0);

    const paymentDate = new Date(pmDeadline);
    paymentDate.setDate(paymentDate.getDate() + 10);
    paymentDate.setHours(12, 0, 0, 0);

    res.json({
      success: true,
      deadlines: {
        contributorDeadline: contributorDeadline.toISOString(),
        pmApprovalDeadline: pmDeadline.toISOString(),
        paymentGenerationDate: paymentDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch deadlines'
    });
  }
}));

/**
 * GET /api/pm-approvals/:transactionId
 * Fetch a single Payment Transaction record by Transaction ID
 * NOTE: This route must come AFTER all specific routes (like /summary, /filters, /deadlines, etc.)
 */
router.get('/:transactionId', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverSelfReportedTimeFields(conn);
    const { transactionId } = req.params;
    
    // If object not found, return error
    if (!fields.objectName) {
      return res.status(404).json({
        success: false,
        error: 'Payment Transactions object not found in Salesforce'
      });
    }

    // Sanitize transaction ID
    const sanitizedId = validateAndSanitizeSearchTerm(transactionId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Transaction ID'
      });
    }

    // Build field list for query - get all available fields from Payment_Transactions_Needing_Approval__c
    const queryFields = new Set([
      'Id',
      'Name', // Payment Transactions Needing Approval Name
      fields.transactionId !== 'Id' ? fields.transactionId : '',
      fields.contributor || '',
      fields.projectObjective || '',
      'Contributor_Project__c', // For Contributor Project relationship
      'Prod_Week_Status__c',
      'Transaction_Status__c',
      'Submitted_for_Approval_Timestamp__c',
      'Productivity_Variance__c',
      fields.transactionDate || 'CreatedDate',
      fields.selfReportedHours || '',
      fields.selfReportedUnits || '',
      fields.systemTrackedHours || '',
      fields.systemTrackedUnits || '',
      'Adjusted_Hours__c',
      'Adjusted_Units__c',
      'Payment_Hours__c',
      'Payment_Units__c',
      fields.weekendingDate || '',
      fields.payrate || '',
      fields.totalPayment || '',
      'PM_Approver__c',
      'PM_Approver__r.Name', // For PM Approver name
      'Payment_Status__c',
      'Dispute_Resolution_Text__c',
      'Dispute_Resolution_Picklist__c',
      'Dispute_Case__c',
      'Contributor_Comment__c',
      'Contributor_Issue__c',
      'Contributor_Approved_Timestamp__c',
      fields.status || '',
      'CreatedDate',
      'LastModifiedDate',
      'CreatedBy.Name',
      'CreatedBy.Id',
      'LastModifiedBy.Name',
      'LastModifiedBy.Id',
      'OwnerId',
      'Owner.Name',
      'Owner.Id'
    ]);

    // Add relationship fields
    const contributorRel = fields.contributorRelationship || (fields.contributor ? fields.contributor.replace('__c', '__r') : 'Contact__r');
    const projectObjectiveRel = fields.projectObjectiveRelationship || (fields.projectObjective ? fields.projectObjective.replace('__c', '__r') : 'Project_Objective__r');

    if (fields.contributor) {
      queryFields.add(fields.contributor);
      if (fields.contributorContactRelationship) {
        queryFields.add(`${contributorRel}.${fields.contributorContactRelationship}.Name`);
        queryFields.add(`${contributorRel}.${fields.contributorContactRelationship}.Email`);
      } else {
        queryFields.add(`${contributorRel}.Name`);
        queryFields.add(`${contributorRel}.Email`);
      }
    }

    if (fields.projectObjective) {
      queryFields.add(fields.projectObjective);
      if (projectObjectiveRel && projectObjectiveRel.includes('.')) {
        queryFields.add(`${projectObjectiveRel}.Name`);
        queryFields.add(`${projectObjectiveRel}.Project__r.Name`);
        queryFields.add(`${projectObjectiveRel}.Project__r.Account__r.Name`);
      } else if (projectObjectiveRel) {
        queryFields.add(`${projectObjectiveRel}.Name`);
        queryFields.add(`${projectObjectiveRel}.Project__r.Name`);
        queryFields.add(`${projectObjectiveRel}.Project__r.Account__r.Name`);
      }
    }

    // Add Contributor Project relationship fields
    queryFields.add('Contributor_Project__c');
    queryFields.add('Contributor_Project__r.Name');
    queryFields.add('Contributor_Project__r.Id');

    // Remove empty fields
    const uniqueQueryFields = Array.from(queryFields).filter(f => f !== '');
    const selectFields = uniqueQueryFields.join(', ');

    // Build WHERE clause - try Transaction_ID__c first, then Id
    let whereClause = '';
    if (fields.transactionId !== 'Id') {
      // Try Transaction_ID__c field first
      whereClause = `${fields.transactionId} = '${sanitizedId.replace(/'/g, "''")}'`;
    } else {
      // Fallback to Id
      whereClause = `Id = '${sanitizedId.replace(/'/g, "''")}'`;
    }

    const query = `SELECT ${selectFields} FROM ${fields.objectName} WHERE ${whereClause} LIMIT 1`;
    
    const result = await conn.query(query);
    
    if (!result.records || result.records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment Transaction not found'
      });
    }

    const record = result.records[0];
    
    // Format the record with all fields from Payment_Transactions_Needing_Approval__c
    const formatted = {
      Id: record.Id,
      Name: record.Name || '',
      Transaction_ID__c: record[fields.transactionId] || record.Id,
      Contributor__c: record[fields.contributor] || null,
      Contributor__r: record[contributorRel] ? {
        Name: record[contributorRel].Name || '',
        Email: record[contributorRel].Email || ''
      } : null,
      Contact__r: record['Contact__r'] ? {
        Name: record['Contact__r'].Name || '',
        Email: record['Contact__r'].Email || ''
      } : null,
      Project_Objective__c: record[fields.projectObjective] || null,
      Project_Objective__r: record[projectObjectiveRel] ? {
        Name: record[projectObjectiveRel].Name || '',
        Project__r: record[projectObjectiveRel].Project__r ? {
          Name: record[projectObjectiveRel].Project__r.Name || '',
          Account__r: record[projectObjectiveRel].Project__r.Account__r ? {
            Name: record[projectObjectiveRel].Project__r.Account__r.Name || ''
          } : null
        } : null
      } : null,
      Contributor_Project__c: record.Contributor_Project__c || null,
      Contributor_Project__r: record['Contributor_Project__r'] ? {
        Id: record['Contributor_Project__r'].Id || record.Contributor_Project__c || null,
        Name: record['Contributor_Project__r'].Name || '',
        Project_Objective__r: record['Contributor_Project__r'].Project_Objective__r ? {
          Name: record['Contributor_Project__r'].Project_Objective__r.Name || '',
          Project__r: record['Contributor_Project__r'].Project_Objective__r.Project__r ? {
            Name: record['Contributor_Project__r'].Project_Objective__r.Project__r.Name || '',
            Account__r: record['Contributor_Project__r'].Project_Objective__r.Project__r.Account__r ? {
              Name: record['Contributor_Project__r'].Project_Objective__r.Project__r.Account__r.Name || ''
            } : null
          } : null
        } : null
      } : null,
      Prod_Week_Status__c: record.Prod_Week_Status__c || null,
      Transaction_Date__c: record[fields.transactionDate] || record.CreatedDate || null,
      Transaction_Status__c: record.Transaction_Status__c || record[fields.status] || null,
      Submitted_for_Approval_Timestamp__c: record.Submitted_for_Approval_Timestamp__c || null,
      Productivity_Variance__c: record.Productivity_Variance__c || null,
      Weekending_Date__c: record[fields.weekendingDate] || null,
      Self_Reported_Hours__c: record[fields.selfReportedHours] || null,
      SelfReportedHours__c: record[fields.selfReportedHours] || null,
      Self_Reported_Units__c: record[fields.selfReportedUnits] || null,
      SelfReportedUnits__c: record[fields.selfReportedUnits] || null,
      System_Tracked_Hours__c: record[fields.systemTrackedHours] || null,
      SystemTrackedHours__c: record[fields.systemTrackedHours] || null,
      System_Tracked_Units__c: record[fields.systemTrackedUnits] || null,
      SystemTrackedUnits__c: record[fields.systemTrackedUnits] || null,
      Adjusted_Hours__c: record.Adjusted_Hours__c || null,
      Adjusted_Units__c: record.Adjusted_Units__c || null,
      Payment_Hours__c: record.Payment_Hours__c || null,
      Payment_Units__c: record.Payment_Units__c || null,
      Payrate__c: record[fields.payrate] || null,
      Pay_Rate__c: record[fields.payrate] || null,
      Total_Payment__c: record[fields.totalPayment] || null,
      Payment_Amount__c: record[fields.totalPayment] || null,
      PM_Approver__c: record.PM_Approver__c || null,
      PM_Approver__r: record.PM_Approver__r ? {
        Name: record.PM_Approver__r.Name || '',
        Id: record.PM_Approver__r.Id || record.PM_Approver__c || null
      } : null,
      Payment_Status__c: record.Payment_Status__c || null,
      Dispute_Resolution_Text__c: record.Dispute_Resolution_Text__c || null,
      Dispute_Resolution_Picklist__c: record.Dispute_Resolution_Picklist__c || null,
      Dispute_Case__c: record.Dispute_Case__c || null,
      Contributor_Comment__c: record.Contributor_Comment__c || null,
      Contributor_Issue__c: record.Contributor_Issue__c || null,
      Contributor_Approved_Timestamp__c: record.Contributor_Approved_Timestamp__c || null,
      Status__c: record[fields.status] || null,
      Variance_Percent__c: null, // Calculate if needed
      CreatedBy: record.CreatedBy ? {
        Name: record.CreatedBy.Name || '',
        Id: record.CreatedBy.Id || ''
      } : null,
      CreatedDate: record.CreatedDate || null,
      LastModifiedBy: record.LastModifiedBy ? {
        Name: record.LastModifiedBy.Name || '',
        Id: record.LastModifiedBy.Id || ''
      } : null,
      LastModifiedDate: record.LastModifiedDate || null,
      Owner: record.Owner ? {
        Name: record.Owner.Name || '',
        Id: record.Owner.Id || record.OwnerId || null
      } : null,
      OwnerId: record.OwnerId || null
    };

    // Calculate variance if we have both hours (use Productivity_Variance__c if available, otherwise calculate)
    if (formatted.Productivity_Variance__c !== null && formatted.Productivity_Variance__c !== undefined) {
      formatted.Variance_Percent__c = formatted.Productivity_Variance__c;
    } else if (formatted.System_Tracked_Hours__c && formatted.System_Tracked_Hours__c > 0) {
      const selfReported = formatted.Self_Reported_Hours__c || 0;
      const systemTracked = formatted.System_Tracked_Hours__c;
      formatted.Variance_Percent__c = ((selfReported - systemTracked) / systemTracked) * 100;
    } else if (formatted.Self_Reported_Hours__c && formatted.Self_Reported_Hours__c > 0) {
      formatted.Variance_Percent__c = 100;
    }

    res.json({
      success: true,
      record: formatted
    });
  } catch (error) {
    console.error('Error fetching Payment Transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Payment Transaction'
    });
  }
}));

/**
 * POST /api/pm-approvals/approve
 * Approve selected records
 */
router.post('/approve', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverSelfReportedTimeFields(conn);
    const { transactionIds, comment } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction IDs are required'
      });
    }

    // Sanitize transaction IDs
    const sanitizedIds = transactionIds.map(id => validateAndSanitizeSearchTerm(id));

    // Update records
    const updates = sanitizedIds.map(id => ({
      Id: id,
      [fields.status]: 'PM Approved'
    }));

    const updateResult = await conn.sobject(fields.objectName).update(updates);

    const successful = updateResult.filter(r => r.success).length;
    const failed = updateResult.filter(r => !r.success).length;

    res.json({
      success: true,
      approved: successful,
      failed: failed,
      errors: updateResult.filter(r => !r.success).map(r => r.errors?.[0]?.message || 'Unknown error')
    });
  } catch (error) {
    console.error('Error approving records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve records'
    });
  }
}));

/**
 * POST /api/pm-approvals/reject
 * Reject selected records
 */
router.post('/reject', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverSelfReportedTimeFields(conn);
    const { transactionIds, reason } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction IDs are required'
      });
    }

    // Sanitize transaction IDs and reason
    const sanitizedIds = transactionIds.map(id => validateAndSanitizeSearchTerm(id));
    const sanitizedReason = reason ? validateAndSanitizeSearchTerm(reason) : '';

    // Update records
    const updates = sanitizedIds.map(id => ({
      Id: id,
      [fields.status]: 'Rejected'
    }));

    const updateResult = await conn.sobject(fields.objectName).update(updates);

    const successful = updateResult.filter(r => r.success).length;
    const failed = updateResult.filter(r => !r.success).length;

    res.json({
      success: true,
      rejected: successful,
      failed: failed,
      errors: updateResult.filter(r => !r.success).map(r => r.errors?.[0]?.message || 'Unknown error')
    });
  } catch (error) {
    console.error('Error rejecting records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject records'
    });
  }
}));

module.exports = router;

