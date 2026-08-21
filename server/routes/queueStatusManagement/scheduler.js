/**
 * Scheduler Service for Queue Status Automation
 * Handles scheduled status updates
 */

const { getScheduleRules, getEnabledRules, getProjectsMatchingRule, evaluateTimeBasedRule, evaluateConditionBasedRule } = require('./scheduleRules');
const { validateTransitions } = require('./transitionRules');
const { updateRule } = require('./scheduleRulesStorage');
const { saveExecutionHistory } = require('./executionHistory');
const fs = require('fs');
const path = require('path');
const jsforce = require('jsforce');

// Helper to get Salesforce connection (user-specific)
// Note: scheduler runs in background, so it uses system user from environment variable
// Set SALESFORCE_SYSTEM_USER_ID environment variable to the user ID for background jobs
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  // Scheduler runs in background - use system user if available
  // allowSystemUser=true allows fallback to SALESFORCE_SYSTEM_USER_ID env var
  return await createSalesforceConnection(null, userId, true);
};

/**
 * Apply filter criteria to projects based on rule filters
 * NOTE: This function is kept for backward compatibility but is no longer used.
 * Filters are now applied directly in SOQL queries via buildFilterWhereClause() for better performance.
 * @param {Object} rule - The rule with filter criteria
 * @param {Array} projects - Array of all projects
 * @returns {Array} Filtered array of projects
 */
const applyRuleFilters = (rule, projects) => {
  if (!rule.filters) {
    return projects; // No filters, return all projects
  }

  let filtered = projects;
  const initialCount = filtered.length;

  // Filter by Projects
  if (rule.filters.projects && rule.filters.projects.mode !== 'none') {
    const selectedProjectIds = rule.filters.projects.selected || [];
    if (rule.filters.projects.mode === 'include') {
      if (selectedProjectIds.length > 0) {
        filtered = filtered.filter(p => p.projectId && selectedProjectIds.includes(p.projectId));
      } else {
        // If include mode but no selections, no projects match
        filtered = [];
      }
    } else if (rule.filters.projects.mode === 'exclude') {
      if (selectedProjectIds.length > 0) {
        filtered = filtered.filter(p => !p.projectId || !selectedProjectIds.includes(p.projectId));
      }
      // If exclude mode but no selections, all projects pass (no exclusions)
    }
  }

  // Filter by Project Objectives
  if (rule.filters.projectObjectives && rule.filters.projectObjectives.mode !== 'none') {
    const selectedProjectObjectiveIds = rule.filters.projectObjectives.selected || [];
    if (rule.filters.projectObjectives.mode === 'include') {
      if (selectedProjectObjectiveIds.length > 0) {
        filtered = filtered.filter(p => p.projectObjectiveId && selectedProjectObjectiveIds.includes(p.projectObjectiveId));
      } else {
        // If include mode but no selections, no projects match
        filtered = [];
      }
    } else if (rule.filters.projectObjectives.mode === 'exclude') {
      if (selectedProjectObjectiveIds.length > 0) {
        filtered = filtered.filter(p => !p.projectObjectiveId || !selectedProjectObjectiveIds.includes(p.projectObjectiveId));
      }
      // If exclude mode but no selections, all projects pass (no exclusions)
    }
  }

  // Filter by Contributor Projects (by ID)
  if (rule.filters.contributorProjects && rule.filters.contributorProjects.mode !== 'none') {
    const selectedContributorProjectIds = rule.filters.contributorProjects.selected || [];
    if (rule.filters.contributorProjects.mode === 'include') {
      if (selectedContributorProjectIds.length > 0) {
        filtered = filtered.filter(p => selectedContributorProjectIds.includes(p.id));
      } else {
        // If include mode but no selections, no projects match
        filtered = [];
      }
    } else if (rule.filters.contributorProjects.mode === 'exclude') {
      if (selectedContributorProjectIds.length > 0) {
        filtered = filtered.filter(p => !selectedContributorProjectIds.includes(p.id));
      }
      // If exclude mode but no selections, all projects pass (no exclusions)
    }
  }

  const finalCount = filtered.length;
  if (initialCount !== finalCount) {
    console.log(`[Scheduler] Rule "${rule.name}" (${rule.id}): Filtered ${initialCount} projects to ${finalCount} projects`);
  }

  return filtered;
};

/**
 * Get status change date for projects
 * NOTE: This function is kept for backward compatibility but is no longer used.
 * LastModifiedDate is now included in the initial query to avoid redundant queries.
 * @param {Object} conn - Salesforce connection
 * @param {Array} projectIds - Array of project IDs
 * @returns {Object} Map of projectId to status change date
 */
const getStatusChangeDates = async (conn, projectIds) => {
  const statusDates = {};
  
  if (!projectIds || projectIds.length === 0) {
    return statusDates;
  }

  try {
    // Query for projects with their status change dates
    // Assuming there's a LastModifiedDate or custom field for status change
    const BATCH_SIZE = 200;
    for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
      const batch = projectIds.slice(i, i + BATCH_SIZE);
      const query = `SELECT Id, Queue_Status__c, LastModifiedDate FROM Contributor_Project__c WHERE Id IN ('${batch.join("','")}')`;
      const result = await conn.query(query);
      
      if (result.records) {
        result.records.forEach(record => {
          // Use LastModifiedDate as proxy for status change date
          // In production, you might want a custom field like Queue_Status_Changed_Date__c
          statusDates[record.Id] = record.LastModifiedDate;
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error fetching status change dates:', error);
  }

  return statusDates;
};

/**
 * Build SOQL WHERE clause from rule filters
 * @param {Object} rule - The rule with filter criteria
 * @param {string} projectObjectiveFieldName - Project Objective field name
 * @returns {Array} Array of WHERE conditions
 */
const buildFilterWhereClause = (rule, projectObjectiveFieldName) => {
  const conditions = [];
  
  if (!rule.filters) {
    return conditions;
  }

  // Filter by Projects
  if (rule.filters.projects && rule.filters.projects.mode !== 'none') {
    const selectedProjectIds = rule.filters.projects.selected || [];
    if (selectedProjectIds.length > 0) {
      const escapedIds = selectedProjectIds.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      if (rule.filters.projects.mode === 'include') {
        conditions.push(`Project__c IN (${escapedIds})`);
      } else if (rule.filters.projects.mode === 'exclude') {
        conditions.push(`(Project__c = null OR Project__c NOT IN (${escapedIds}))`);
      }
    } else if (rule.filters.projects.mode === 'include') {
      // Include mode with no selections = no matches
      conditions.push('Id = null'); // This will return no results
    }
  }

  // Filter by Project Objectives
  if (rule.filters.projectObjectives && rule.filters.projectObjectives.mode !== 'none') {
    const selectedProjectObjectiveIds = rule.filters.projectObjectives.selected || [];
    if (selectedProjectObjectiveIds.length > 0) {
      const escapedIds = selectedProjectObjectiveIds.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      if (rule.filters.projectObjectives.mode === 'include') {
        conditions.push(`${projectObjectiveFieldName} IN (${escapedIds})`);
      } else if (rule.filters.projectObjectives.mode === 'exclude') {
        conditions.push(`(${projectObjectiveFieldName} = null OR ${projectObjectiveFieldName} NOT IN (${escapedIds}))`);
      }
    } else if (rule.filters.projectObjectives.mode === 'include') {
      // Include mode with no selections = no matches
      conditions.push('Id = null'); // This will return no results
    }
  }

  // Filter by Contributor Projects (by ID)
  if (rule.filters.contributorProjects && rule.filters.contributorProjects.mode !== 'none') {
    const selectedContributorProjectIds = rule.filters.contributorProjects.selected || [];
    if (selectedContributorProjectIds.length > 0) {
      const escapedIds = selectedContributorProjectIds.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',');
      if (rule.filters.contributorProjects.mode === 'include') {
        conditions.push(`Id IN (${escapedIds})`);
      } else if (rule.filters.contributorProjects.mode === 'exclude') {
        conditions.push(`Id NOT IN (${escapedIds})`);
      }
    } else if (rule.filters.contributorProjects.mode === 'include') {
      // Include mode with no selections = no matches
      conditions.push('Id = null'); // This will return no results
    }
  }

  return conditions;
};

/**
 * Execute scheduled status updates
 * @returns {Object} Execution result
 */
const executeScheduledUpdates = async (ruleIds = null, triggeredBy = 'manual') => {
  const executionStartTime = new Date();
  const results = {
    processed: 0,
    updated: 0,
    errors: [],
    updates: []
  };

  try {
    // Scheduler runs in background - no req object available
    // Use null userId to get connection from global/default settings
    const conn = await getSalesforceConnection(null);
    let rules;
    
    if (ruleIds && Array.isArray(ruleIds) && ruleIds.length > 0) {
      // Execute only specified rules (they should already be enabled, but we'll filter)
      const allRules = getScheduleRules();
      rules = allRules.filter(r => ruleIds.includes(r.id) && r.enabled);
      console.log(`[Scheduler] Executing ${rules.length} selected rule(s) out of ${ruleIds.length} requested`);
    } else {
      // Execute all enabled rules (default behavior)
      rules = getEnabledRules();
      console.log(`[Scheduler] Executing all ${rules.length} enabled rule(s)`);
    }

    if (rules.length === 0) {
      console.log('[Scheduler] No enabled rules found to execute');
      return results;
    }

    // Discover Project Objective field name dynamically (cache this in production)
    let projectObjectiveFieldName = 'Project_Objective__c';
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
        projectObjectiveFieldName = projectObjectiveField.name;
        console.log(`[Scheduler] Using Project Objective field: ${projectObjectiveFieldName}`);
      }
    } catch (describeError) {
      console.warn('[Scheduler] Could not discover Project Objective field, using default:', describeError.message);
    }

    // Process each rule separately to optimize queries
    const updatesToApply = [];
    
    for (const rule of rules) {
      console.log(`[Scheduler] Processing rule: "${rule.name}" (${rule.id})`);
      const ruleStartTime = Date.now();
      
      // Build WHERE clause from filter criteria
      const filterConditions = buildFilterWhereClause(rule, projectObjectiveFieldName);
      
      // Base WHERE clause: must have Queue Status and match fromStatus
      const baseConditions = [];
      
      // Handle '--None--' status (means null in Salesforce)
      if (rule.fromStatus === '--None--' || rule.fromStatus === null || rule.fromStatus === '') {
        baseConditions.push('Queue_Status__c = null');
      } else {
        baseConditions.push('Queue_Status__c != null');
        baseConditions.push(`Queue_Status__c = '${String(rule.fromStatus).replace(/'/g, "''")}'`);
      }
      
      // Combine all conditions
      const allConditions = [...baseConditions, ...filterConditions];
      
      // Ensure we have at least one condition
      if (allConditions.length === 0) {
        console.warn(`[Scheduler] Rule "${rule.name}": No WHERE conditions generated, skipping rule`);
        continue;
      }
      
      const whereClause = allConditions.join(' AND ');
      
      // Fetch only projects that match this rule's criteria
      // Include LastModifiedDate to avoid redundant query
      const projects = [];
      let queryResult;
      
      const query = `SELECT Id, Name, Queue_Status__c, Status__c, Project__c, ${projectObjectiveFieldName}, LastModifiedDate FROM Contributor_Project__c WHERE ${whereClause} ORDER BY LastModifiedDate DESC LIMIT 2000`;
      console.log(`[Scheduler] Rule "${rule.name}": Executing optimized query`);
      console.log(`[Scheduler] Rule "${rule.name}": Query: ${query}`);
      console.log(`[Scheduler] Rule "${rule.name}": Base conditions:`, baseConditions);
      console.log(`[Scheduler] Rule "${rule.name}": Filter conditions:`, filterConditions);
      console.log(`[Scheduler] Rule "${rule.name}": fromStatus: "${rule.fromStatus}", toStatus: "${rule.toStatus}", type: "${rule.type}", days: ${rule.days || 'N/A'}`);
      
      // Execute initial query
      try {
        queryResult = await conn.query(query);
        console.log(`[Scheduler] Rule "${rule.name}": Query executed successfully. Total records: ${queryResult.totalSize || 0}, Records in batch: ${queryResult.records?.length || 0}`);
      } catch (error) {
        console.error(`[Scheduler] Rule "${rule.name}": Query error:`, error.message);
        console.error(`[Scheduler] Rule "${rule.name}": Query that failed: ${query}`);
        console.error(`[Scheduler] Rule "${rule.name}": Error details:`, JSON.stringify(error, null, 2));
        results.errors.push({
          ruleId: rule.id,
          ruleName: rule.name,
          error: `Query failed: ${error.message}`,
          query: query
        });
        continue; // Skip this rule and continue with next
      }
      
      // Process first batch
      if (queryResult.records && queryResult.records.length > 0) {
        projects.push(...queryResult.records.map(r => ({
          id: r.Id,
          name: r.Name,
          queueStatus: r.Queue_Status__c,
          status: r.Status__c,
          projectId: r.Project__c,
          projectObjectiveId: r[projectObjectiveFieldName],
          lastModifiedDate: r.LastModifiedDate
        })));
        console.log(`[Scheduler] Rule "${rule.name}": Processed first batch: ${queryResult.records.length} records`);
      }
      
      // Process additional batches if needed
      while (!queryResult.done && queryResult.nextRecordsUrl) {
        try {
          queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
          
          if (queryResult.records && queryResult.records.length > 0) {
            projects.push(...queryResult.records.map(r => ({
              id: r.Id,
              name: r.Name,
              queueStatus: r.Queue_Status__c,
              status: r.Status__c,
              projectId: r.Project__c,
              projectObjectiveId: r[projectObjectiveFieldName],
              lastModifiedDate: r.LastModifiedDate
            })));
            console.log(`[Scheduler] Rule "${rule.name}": Processed additional batch: ${queryResult.records.length} records`);
          }
        } catch (queryMoreError) {
          console.error(`[Scheduler] Rule "${rule.name}": Error in queryMore:`, queryMoreError.message);
          break; // Stop pagination on error
        }
      }

      console.log(`[Scheduler] Rule "${rule.name}": Fetched ${projects.length} projects matching filter criteria`);
      
      if (projects.length > 0) {
        console.log(`[Scheduler] Rule "${rule.name}": Sample project data:`, JSON.stringify(projects[0], null, 2));
      }

      if (projects.length === 0) {
        console.log(`[Scheduler] Rule "${rule.name}": No projects match filter criteria, skipping`);
        console.log(`[Scheduler] Rule "${rule.name}": This could mean:`);
        console.log(`  - No Contributor Projects match the filter criteria`);
        console.log(`  - No Contributor Projects have Queue_Status__c = '${rule.fromStatus}'`);
        console.log(`  - Query returned 0 results`);
        continue;
      }

      // Build status dates map from fetched data (no additional query needed)
      const statusDates = {};
      projects.forEach(project => {
        statusDates[project.id] = project.lastModifiedDate;
        console.log(`[Scheduler] Rule "${rule.name}": Project ${project.id} (${project.name}) - QueueStatus: "${project.queueStatus}", LastModified: ${project.lastModifiedDate}`);
      });

      // Match against rule conditions (time/conditions)
      // Note: Status check is redundant since query already filters by fromStatus, but keep for safety
      const matchingProjects = getProjectsMatchingRule(rule, projects, statusDates);
      console.log(`[Scheduler] Rule "${rule.name}": ${matchingProjects.length} projects match rule conditions (from ${projects.length} filtered)`);
      
      if (matchingProjects.length === 0 && projects.length > 0) {
        console.log(`[Scheduler] Rule "${rule.name}": Projects fetched but none matched rule conditions. Checking why...`);
        projects.forEach(project => {
          const statusDate = statusDates[project.id];
          const expectedStatus = rule.fromStatus === '--None--' ? null : rule.fromStatus;
          const actualStatus = project.queueStatus;
          const matchesStatus = actualStatus === expectedStatus || (expectedStatus === null && actualStatus === null);
          let matchesTime = false;
          let matchesCondition = false;
          
          if (rule.type === 'time_based') {
            matchesTime = evaluateTimeBasedRule(rule, statusDate);
            const daysSince = statusDate ? Math.floor((Date.now() - new Date(statusDate)) / (1000 * 60 * 60 * 24)) : 'N/A';
            console.log(`[Scheduler] Rule "${rule.name}": Project ${project.id} (${project.name})`);
            console.log(`  - Status: Expected "${expectedStatus}", Actual "${actualStatus}", Match: ${matchesStatus}`);
            console.log(`  - Time-based: Needs ${rule.days} days, Has ${daysSince} days, Match: ${matchesTime}`);
            console.log(`  - LastModifiedDate: ${statusDate}`);
          } else if (rule.type === 'condition_based') {
            matchesCondition = evaluateConditionBasedRule(rule, project);
            console.log(`[Scheduler] Rule "${rule.name}": Project ${project.id} (${project.name})`);
            console.log(`  - Status: Expected "${expectedStatus}", Actual "${actualStatus}", Match: ${matchesStatus}`);
            console.log(`  - Condition match: ${matchesCondition}`);
            if (rule.conditions && rule.conditions.length > 0) {
              console.log(`  - Conditions:`, JSON.stringify(rule.conditions, null, 2));
            }
          } else {
            console.log(`[Scheduler] Rule "${rule.name}": Project ${project.id} (${project.name}) - Unknown rule type: ${rule.type}`);
          }
        });
      }
      
      matchingProjects.forEach(project => {
        updatesToApply.push({
          projectId: project.id,
          projectName: project.name,
          currentStatus: project.queueStatus,
          newStatus: rule.toStatus,
          ruleId: rule.id,
          ruleName: rule.name
        });
      });
      
      const ruleElapsed = Date.now() - ruleStartTime;
      console.log(`[Scheduler] Rule "${rule.name}": Processed in ${(ruleElapsed / 1000).toFixed(2)}s`);
    }

    if (updatesToApply.length === 0) {
      return results;
    }

    // Validate transitions
    const validation = validateTransitions(updatesToApply.map(u => ({
      projectId: u.projectId,
      queueStatus: u.newStatus,
      currentStatus: u.currentStatus
    })));

    if (!validation.valid) {
      results.errors.push(...validation.errors);
      return results;
    }

    // Apply updates in batches
    const BATCH_SIZE = 200;
    const ruleExecutionMap = {}; // Track which rules were executed
    
    for (let i = 0; i < updatesToApply.length; i += BATCH_SIZE) {
      const batch = updatesToApply.slice(i, i + BATCH_SIZE);
      const updateRecords = batch.map(update => ({
        Id: update.projectId,
        Queue_Status__c: update.newStatus
      }));

      try {
        const updateResults = await conn.sobject('Contributor_Project__c').update(updateRecords);
        const successCount = updateResults.filter(r => r.success).length;
        results.updated += successCount;
        results.processed += batch.length;
        
        // Track successful updates and which rules were executed
        batch.forEach((update, idx) => {
          if (updateResults[idx] && updateResults[idx].success) {
            results.updates.push({
              projectId: update.projectId,
              projectName: update.projectName,
              fromStatus: update.currentStatus,
              toStatus: update.newStatus,
              ruleId: update.ruleId,
              ruleName: update.ruleName
            });
            
            // Track rule execution
            if (!ruleExecutionMap[update.ruleId]) {
              ruleExecutionMap[update.ruleId] = {
                ruleId: update.ruleId,
                ruleName: update.ruleName,
                processedCount: 0,
                updatedCount: 0,
                errors: []
              };
            }
            ruleExecutionMap[update.ruleId].processedCount++;
            ruleExecutionMap[update.ruleId].updatedCount++;
          } else if (updateResults[idx] && !updateResults[idx].success) {
            results.errors.push({
              projectId: update.projectId,
              error: updateResults[idx].errors?.[0]?.message || 'Update failed'
            });
          }
        });
      } catch (error) {
        console.error('[Scheduler] Error updating batch:', error);
        results.errors.push({
          batch: i,
          error: error.message
        });
      }
    }

    // Mark executed rules as done and build execution details
    const executedRulesDetails = [];
    for (const ruleId in ruleExecutionMap) {
      try {
        const executionData = ruleExecutionMap[ruleId];
        updateRule(ruleId, {
          status: 'done',
          lastExecutedAt: new Date().toISOString(),
          lastExecutionCount: executionData.updatedCount
        });
        
        executedRulesDetails.push({
          ruleId: ruleId,
          ruleName: executionData.ruleName || 'Unknown',
          processed: executionData.processedCount || 0,
          updated: executionData.updatedCount || 0,
          errors: executionData.errors || []
        });
      } catch (error) {
        console.error(`[Scheduler] Error updating rule ${ruleId} status:`, error);
      }
    }
    
    results.executedRules = executedRulesDetails;
    
    // Save execution history
    const executionEndTime = new Date();
    const executionDuration = executionEndTime - executionStartTime;
    
    const historyEntry = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionTime: executionStartTime.toISOString(),
      duration: executionDuration,
      rulesExecuted: results.executedRules.length,
      rulesProcessed: results.processed || 0,
      rulesUpdated: results.updated || 0,
      errors: results.errors || [],
      executedRules: results.executedRules || [],
      triggeredBy: triggeredBy
    };
    
    try {
      saveExecutionHistory(historyEntry);
      console.log(`[Scheduler] Saved execution history: ${historyEntry.id}`);
    } catch (historyError) {
      console.error('[Scheduler] Error saving execution history:', historyError);
    }

  } catch (error) {
    console.error('[Scheduler] Error executing scheduled updates:', error);
    results.errors.push({
      error: error.message
    });
    
    // Save error to history
    const executionEndTime = new Date();
    const executionDuration = executionEndTime - executionStartTime;
    
    const historyEntry = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionTime: executionStartTime.toISOString(),
      duration: executionDuration,
      rulesExecuted: 0,
      rulesProcessed: 0,
      rulesUpdated: 0,
      errors: [{ error: error.message || 'Unknown error' }],
      executedRules: [],
      triggeredBy: triggeredBy
    };
    
    try {
      saveExecutionHistory(historyEntry);
    } catch (historyError) {
      console.error('[Scheduler] Error saving execution history:', historyError);
    }
  }

  return results;
};

module.exports = {
  executeScheduledUpdates,
  getStatusChangeDates
};

