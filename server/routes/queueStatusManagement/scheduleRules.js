/**
 * Schedule Rules for Queue Status Automation
 * Defines rules for automated status changes
 */

/**
 * Rule types
 */
const RULE_TYPES = {
  TIME_BASED: 'time_based', // Move after X days
  CONDITION_BASED: 'condition_based' // Move based on conditions
};

/**
 * Default schedule rules
 */
const DEFAULT_RULES = [
  {
    id: 'auto_production_after_days',
    name: 'Auto-move to Production after X days',
    type: RULE_TYPES.TIME_BASED,
    enabled: false,
    fromStatus: 'Calibration Queue',
    toStatus: 'Production Queue',
    days: 7, // Default 7 days
    conditions: []
  },
  {
    id: 'auto_test_after_days',
    name: 'Auto-move to Test Queue after X days',
    type: RULE_TYPES.TIME_BASED,
    enabled: false,
    fromStatus: 'Calibration Queue',
    toStatus: 'Test Queue',
    days: 14, // Default 14 days
    conditions: []
  }
];

const { loadRules } = require('./scheduleRulesStorage');

/**
 * Get all schedule rules
 * @returns {Array} Array of schedule rules
 */
const getScheduleRules = () => {
  return loadRules();
};

/**
 * Get enabled schedule rules
 * @returns {Array} Array of enabled schedule rules
 */
const getEnabledRules = () => {
  return getScheduleRules().filter(rule => rule.enabled);
};

/**
 * Get rules for a specific status
 * @param {string} fromStatus - Current status
 * @returns {Array} Array of rules for that status
 */
const getRulesForStatus = (fromStatus) => {
  return getEnabledRules().filter(rule => rule.fromStatus === fromStatus);
};

/**
 * Evaluate a time-based rule
 * @param {Object} rule - The rule to evaluate
 * @param {Date} statusDate - Date when status was set
 * @returns {boolean} True if rule should be applied
 */
const evaluateTimeBasedRule = (rule, statusDate) => {
  if (rule.type !== RULE_TYPES.TIME_BASED) {
    return false;
  }

  if (!statusDate) {
    return false;
  }

  const now = new Date();
  
  // Handle date-based rules (with optional time)
  if (rule.timeType === 'date' && rule.specificDate) {
    // Parse the specific date and time
    const [year, month, day] = rule.specificDate.split('-').map(Number);
    const [hours, minutes] = (rule.specificTime || '09:00').split(':').map(Number);
    
    // Create the target date/time
    const targetDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Check if current time has passed the target date/time
    return now >= targetDateTime;
  }
  
  // Handle days-based rules (original logic)
  const daysDiff = Math.floor((now - new Date(statusDate)) / (1000 * 60 * 60 * 24));
  return daysDiff >= rule.days;
};

/**
 * Evaluate a condition-based rule
 * @param {Object} rule - The rule to evaluate
 * @param {Object} project - Project data
 * @returns {boolean} True if rule should be applied
 */
const evaluateConditionBasedRule = (rule, project) => {
  if (rule.type !== RULE_TYPES.CONDITION_BASED) {
    return false;
  }

  if (!rule.conditions || rule.conditions.length === 0) {
    return false;
  }

  // Evaluate all conditions (AND logic)
  return rule.conditions.every(condition => {
    const fieldValue = project[condition.field];
    const operator = condition.operator;
    const value = condition.value;

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue || '').includes(value);
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  });
};

/**
 * Evaluate a rule against a project
 * @param {Object} rule - The rule to evaluate
 * @param {Object} project - Project data
 * @param {Date} statusDate - Date when status was set
 * @returns {boolean} True if rule should be applied
 */
const evaluateRule = (rule, project, statusDate) => {
  if (rule.type === RULE_TYPES.TIME_BASED) {
    return evaluateTimeBasedRule(rule, statusDate);
  } else if (rule.type === RULE_TYPES.CONDITION_BASED) {
    return evaluateConditionBasedRule(rule, project);
  }
  return false;
};

/**
 * Get projects that match a rule
 * @param {Object} rule - The rule
 * @param {Array} projects - Array of projects
 * @param {Object} statusDates - Map of projectId to status date
 * @returns {Array} Array of projects that match the rule
 */
const getProjectsMatchingRule = (rule, projects, statusDates) => {
  return projects.filter(project => {
    // Check if project is in the correct fromStatus
    // Handle '--None--' which means null in Salesforce
    const expectedStatus = rule.fromStatus === '--None--' ? null : rule.fromStatus;
    const actualStatus = project.queueStatus;
    
    // Status check: allow null === null or exact match
    if (expectedStatus !== actualStatus && !(expectedStatus === null && actualStatus === null)) {
      return false;
    }

    const statusDate = statusDates[project.id];
    return evaluateRule(rule, project, statusDate);
  });
};

module.exports = {
  RULE_TYPES,
  getScheduleRules,
  getEnabledRules,
  getRulesForStatus,
  evaluateRule,
  evaluateTimeBasedRule,
  evaluateConditionBasedRule,
  getProjectsMatchingRule
};

