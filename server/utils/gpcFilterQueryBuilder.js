/**
 * GPC-Filter Query Builder Utility
 * 
 * Applies Global Persona-Based Content Filtering to SOQL queries
 * by adding WHERE conditions for interested Accounts and Projects.
 */

const { ENABLE_GPC_FILTER } = require('../config/featureFlags');

/**
 * Applies GPC filter conditions to a SOQL query
 * 
 * @param {string} query - The original SOQL query
 * @param {object} req - Express request object containing query parameters
 * @param {object} options - Optional configuration
 * @param {string} options.accountField - Field name for Account (default: 'Account__c')
 * @param {string} options.projectField - Field name for Project (default: 'Project__c')
 * @returns {string} - Modified SOQL query with GPC filter conditions
 */
function applyGPCFilterToQuery(query, req, options = {}) {
  // If feature is disabled, return query unchanged
  if (!ENABLE_GPC_FILTER) {
    return query;
  }

  // Get filter parameters from query string
  const gpcAccounts = req.query.gpcInterestedAccounts || req.query.gpc_accounts;
  const gpcProjects = req.query.gpcInterestedProjects || req.query.gpc_projects;

  // If no filters provided, return query unchanged
  if (!gpcAccounts && !gpcProjects) {
    return query;
  }

  // Parse account and project IDs
  const accountIds = gpcAccounts ? gpcAccounts.split(',').filter(id => id.trim()) : [];
  const projectIds = gpcProjects ? gpcProjects.split(',').filter(id => id.trim()) : [];

  // If no valid IDs, return query unchanged
  if (accountIds.length === 0 && projectIds.length === 0) {
    return query;
  }

  // Get field names from options or use defaults
  const accountField = options.accountField || 'Account__c';
  const projectField = options.projectField || 'Project__c';

  // Build filter conditions
  const conditions = [];

  if (accountIds.length > 0) {
    // Escape single quotes in IDs (Salesforce ID format should be safe, but be defensive)
    const escapedAccountIds = accountIds.map(id => {
      const trimmed = id.trim();
      // Validate Salesforce ID format (15 or 18 characters, alphanumeric)
      if (/^[a-zA-Z0-9]{15,18}$/.test(trimmed)) {
        return `'${trimmed}'`;
      }
      return null;
    }).filter(id => id !== null);

    if (escapedAccountIds.length > 0) {
      conditions.push(`${accountField} IN (${escapedAccountIds.join(', ')})`);
    }
  }

  if (projectIds.length > 0) {
    // Escape single quotes in IDs
    const escapedProjectIds = projectIds.map(id => {
      const trimmed = id.trim();
      // Validate Salesforce ID format
      if (/^[a-zA-Z0-9]{15,18}$/.test(trimmed)) {
        return `'${trimmed}'`;
      }
      return null;
    }).filter(id => id !== null);

    if (escapedProjectIds.length > 0) {
      conditions.push(`${projectField} IN (${escapedProjectIds.join(', ')})`);
    }
  }

  // If no valid conditions, return query unchanged
  if (conditions.length === 0) {
    return query;
  }

  // Combine conditions with OR (user is interested in accounts OR projects)
  const gpcCondition = `(${conditions.join(' OR ')})`;

  // Check if query already has a WHERE clause
  const whereIndex = query.toUpperCase().indexOf(' WHERE ');
  const orderByIndex = query.toUpperCase().indexOf(' ORDER BY ');
  const limitIndex = query.toUpperCase().indexOf(' LIMIT ');
  const groupByIndex = query.toUpperCase().indexOf(' GROUP BY ');

  // Find the position where we should insert the condition
  // Priority: before ORDER BY, LIMIT, or GROUP BY, or at the end
  let insertPosition = query.length;
  if (orderByIndex !== -1) insertPosition = Math.min(insertPosition, orderByIndex);
  if (limitIndex !== -1) insertPosition = Math.min(insertPosition, limitIndex);
  if (groupByIndex !== -1) insertPosition = Math.min(insertPosition, groupByIndex);

  if (whereIndex !== -1) {
    // Query already has WHERE clause
    // Find the end of existing WHERE conditions (before ORDER BY, LIMIT, etc.)
    const whereEnd = insertPosition;
    const whereClause = query.substring(whereIndex + 7, whereEnd).trim();
    
    // Add GPC condition with AND
    const newWhereClause = `${whereClause} AND ${gpcCondition}`;
    return query.substring(0, whereIndex + 7) + newWhereClause + query.substring(whereEnd);
  } else {
    // Query doesn't have WHERE clause, add it
    const beforeWhere = query.substring(0, insertPosition).trim();
    const afterWhere = query.substring(insertPosition);
    return `${beforeWhere} WHERE ${gpcCondition}${afterWhere ? ' ' + afterWhere : ''}`;
  }
}

/**
 * Applies GPC filter to a WHERE clause string (for building queries incrementally)
 * 
 * @param {string} whereClause - Existing WHERE clause conditions
 * @param {object} req - Express request object
 * @param {object} options - Optional configuration
 * @returns {string} - Modified WHERE clause with GPC conditions
 */
function applyGPCFilterToWhereClause(whereClause, req, options = {}) {
  if (!ENABLE_GPC_FILTER) {
    return whereClause;
  }

  const gpcAccounts = req.query.gpcInterestedAccounts || req.query.gpc_accounts;
  const gpcProjects = req.query.gpcInterestedProjects || req.query.gpc_projects;

  if (!gpcAccounts && !gpcProjects) {
    return whereClause;
  }

  const accountIds = gpcAccounts ? gpcAccounts.split(',').filter(id => id.trim()) : [];
  const projectIds = gpcProjects ? gpcProjects.split(',').filter(id => id.trim()) : [];

  if (accountIds.length === 0 && projectIds.length === 0) {
    return whereClause;
  }

  const accountField = options.accountField || 'Account__c';
  const projectField = options.projectField || 'Project__c';

  const conditions = [];

  if (accountIds.length > 0) {
    const escapedAccountIds = accountIds
      .map(id => id.trim())
      .filter(id => /^[a-zA-Z0-9]{15,18}$/.test(id))
      .map(id => `'${id}'`);
    
    if (escapedAccountIds.length > 0) {
      conditions.push(`${accountField} IN (${escapedAccountIds.join(', ')})`);
    }
  }

  if (projectIds.length > 0) {
    const escapedProjectIds = projectIds
      .map(id => id.trim())
      .filter(id => /^[a-zA-Z0-9]{15,18}$/.test(id))
      .map(id => `'${id}'`);
    
    if (escapedProjectIds.length > 0) {
      conditions.push(`${projectField} IN (${escapedProjectIds.join(', ')})`);
    }
  }

  if (conditions.length === 0) {
    return whereClause;
  }

  const gpcCondition = `(${conditions.join(' OR ')})`;

  if (whereClause && whereClause.trim().length > 0) {
    return `${whereClause} AND ${gpcCondition}`;
  } else {
    return gpcCondition;
  }
}

module.exports = {
  applyGPCFilterToQuery,
  applyGPCFilterToWhereClause
};

