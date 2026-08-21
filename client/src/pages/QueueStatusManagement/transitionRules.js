// Status transition rules for Queue Status Management
// Defines valid transitions between queue statuses

export const TRANSITION_RULES = {
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
export const getAllowedTransitions = (currentStatus) => {
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
export const isValidTransition = (fromStatus, toStatus) => {
  const allowed = getAllowedTransitions(fromStatus);
  return allowed.includes(toStatus);
};

/**
 * Get transition description
 * @param {string|null} currentStatus - Current queue status
 * @returns {string} Description of allowed transitions
 */
export const getTransitionDescription = (currentStatus) => {
  const status = currentStatus || '--None--';
  const rule = TRANSITION_RULES[status];
  return rule ? rule.description : 'No restrictions';
};







