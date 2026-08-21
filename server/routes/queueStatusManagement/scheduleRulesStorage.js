/**
 * Schedule Rules Storage
 * Handles persistence of schedule rules
 */

const fs = require('fs');
const path = require('path');

const getRulesFilePath = () => {
  const dataDir = path.join(__dirname, '../../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'queue-status-schedule-rules.json');
};

/**
 * Load schedule rules from storage
 * @returns {Array} Array of schedule rules
 */
const loadRules = () => {
  const filePath = getRulesFilePath();
  
  if (!fs.existsSync(filePath)) {
    // Return default rules if file doesn't exist
    return getDefaultRules();
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const rules = JSON.parse(data);
    return Array.isArray(rules) ? rules : getDefaultRules();
  } catch (error) {
    console.error('[Schedule Rules] Error loading rules:', error);
    return getDefaultRules();
  }
};

/**
 * Save schedule rules to storage
 * @param {Array} rules - Array of schedule rules
 * @returns {boolean} True if saved successfully
 */
const saveRules = (rules) => {
  const filePath = getRulesFilePath();
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(rules, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Schedule Rules] Error saving rules:', error);
    return false;
  }
};

/**
 * Get default schedule rules
 * @returns {Array} Default rules
 */
const getDefaultRules = () => {
  return [
    {
      id: 'auto_production_after_days',
      name: 'Auto-move to Production after X days',
      type: 'time_based',
      enabled: false,
      fromStatus: 'Calibration Queue',
      toStatus: 'Production Queue',
      days: 7,
      conditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'auto_test_after_days',
      name: 'Auto-move to Test Queue after X days',
      type: 'time_based',
      enabled: false,
      fromStatus: 'Calibration Queue',
      toStatus: 'Test Queue',
      days: 14,
      conditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};

/**
 * Get a rule by ID
 * @param {string} ruleId - Rule ID
 * @returns {Object|null} Rule object or null
 */
const getRuleById = (ruleId) => {
  const rules = loadRules();
  return rules.find(r => r.id === ruleId) || null;
};

/**
 * Create a new rule
 * @param {Object} ruleData - Rule data
 * @returns {Object} Created rule
 */
const createRule = (ruleData) => {
  const rules = loadRules();
  const newRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: ruleData.name || 'New Rule',
    type: ruleData.type || 'time_based',
    enabled: ruleData.enabled !== undefined ? ruleData.enabled : false,
    fromStatus: ruleData.fromStatus || '--None--',
    toStatus: ruleData.toStatus || '--None--',
    timeType: ruleData.timeType || 'days',
    days: ruleData.days || 7,
    specificDate: ruleData.specificDate || '',
    specificTime: ruleData.specificTime || '09:00',
    conditions: ruleData.conditions || [],
    filters: ruleData.filters || {
      projects: { mode: 'none', selected: [] },
      projectObjectives: { mode: 'none', selected: [] },
      contributorProjects: { mode: 'none', selected: [] }
    },
    createdBy: ruleData.createdBy || null,
    createdByName: ruleData.createdByName || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  rules.push(newRule);
  saveRules(rules);
  return newRule;
};

/**
 * Update a rule
 * @param {string} ruleId - Rule ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated rule or null
 */
const updateRule = (ruleId, updates) => {
  const rules = loadRules();
  const index = rules.findIndex(r => r.id === ruleId);
  
  if (index === -1) {
    return null;
  }
  
  rules[index] = {
    ...rules[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveRules(rules);
  return rules[index];
};

/**
 * Delete a rule
 * @param {string} ruleId - Rule ID
 * @returns {boolean} True if deleted
 */
const deleteRule = (ruleId) => {
  const rules = loadRules();
  const filtered = rules.filter(r => r.id !== ruleId);
  
  if (filtered.length === rules.length) {
    return false; // Rule not found
  }
  
  saveRules(filtered);
  return true;
};

module.exports = {
  loadRules,
  saveRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  getDefaultRules
};

