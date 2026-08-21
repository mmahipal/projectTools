// Status transition rules for Queue Status Management (Server-side)
// Defines valid transitions between queue statuses

const TRANSITION_RULES = {
  // From --None-- (null)
  '--None--': {
    allowed: ['Calibration Queue', 'Production Queue', 'Test Queue', '--None--'],
    description: 'Can transition to any queue status'
  },
  // From Calibration Queue
  'Calibration Queue': {
    allowed: ['Production Queue', 'Test Queue', '--None--'],
    description: 'Can transition to Production Queue, Test Queue, or remove (--None--)'
  },
  // From Production Queue
  'Production Queue': {
    allowed: ['Test Queue', 'Calibration Queue', '--None--'],
    description: 'Can transition to Test Queue, Calibration Queue, or remove (--None--)'
  },
  // From Test Queue
  'Test Queue': {
    allowed: ['Production Queue', 'Calibration Queue', '--None--'],
    description: 'Can transition to Production Queue, Calibration Queue, or remove (--None--)'
  }
};

/**
 * Get allowed transitions for a given current status
 * @param {string|null} currentStatus - Current queue status
 * @returns {string[]} Array of allowed next statuses
 */
const getAllowedTransitions = (currentStatus) => {
  const status = currentStatus || '--None--';
  const rule = TRANSITION_RULES[status];
  return rule ? rule.allowed : ['--None--', 'Calibration Queue', 'Production Queue', 'Test Queue'];
};

/**
 * Check if a transition is valid
 * @param {string|null} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} True if transition is valid
 */
const isValidTransition = (fromStatus, toStatus) => {
  const allowed = getAllowedTransitions(fromStatus);
  return allowed.includes(toStatus);
};

/**
 * Validate multiple transitions
 * @param {Array} updates - Array of { projectId, queueStatus, currentStatus }
 * @returns {Object} { valid: boolean, errors: Array }
 */
const validateTransitions = (updates) => {
  const errors = [];
  
  for (const update of updates) {
    const { projectId, queueStatus, currentStatus } = update;
    const toStatus = queueStatus || '--None--';
    
    if (!isValidTransition(currentStatus, toStatus)) {
      errors.push({
        projectId,
        error: `Invalid transition from "${currentStatus || '--None--'}" to "${toStatus}"`
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  getAllowedTransitions,
  isValidTransition,
  validateTransitions,
  TRANSITION_RULES
};







