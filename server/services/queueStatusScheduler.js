/**
 * Automatic Scheduler Service for Queue Status Rules
 * Runs periodically to check and execute enabled rules
 */

const { executeScheduledUpdates } = require('../routes/queueStatusManagement/scheduler');
const { getEnabledRules } = require('../routes/queueStatusManagement/scheduleRules');
const { saveExecutionHistory, getExecutionHistory } = require('../routes/queueStatusManagement/executionHistory');

let schedulerInterval = null;
let isRunning = false;

/**
 * Start the automatic scheduler
 * @param {number} intervalMinutes - Interval in minutes (default: 15)
 */
const startScheduler = (intervalMinutes = 15) => {
  if (schedulerInterval) {
    console.log('[Scheduler Service] Scheduler already running');
    return;
  }

  console.log(`[Scheduler Service] Starting automatic scheduler (runs every ${intervalMinutes} minutes)`);
  
  // Run immediately on start
  runScheduledChecks();
  
  // Then run at specified interval
  schedulerInterval = setInterval(() => {
    runScheduledChecks();
  }, intervalMinutes * 60 * 1000);
};

/**
 * Stop the automatic scheduler
 */
const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler Service] Scheduler stopped');
  }
};

/**
 * Run scheduled checks for enabled rules
 * This function runs in a background context (no HTTP request/response objects)
 * All operations must be independent of req/res objects
 */
const runScheduledChecks = async () => {
  if (isRunning) {
    console.log('[Scheduler Service] Previous execution still running, skipping this cycle');
    return;
  }

  isRunning = true;
  const executionStartTime = new Date();
  
  try {
    console.log(`[Scheduler Service] Starting scheduled check at ${executionStartTime.toISOString()}`);
    
    // Get all enabled rules (no req/res needed)
    const enabledRules = getEnabledRules();
    
    if (enabledRules.length === 0) {
      console.log('[Scheduler Service] No enabled rules found, skipping execution');
      isRunning = false;
      return;
    }

    console.log(`[Scheduler Service] Found ${enabledRules.length} enabled rule(s) to check`);
    
    // Check which rules should be executed based on their schedule
    const rulesToExecute = [];
    
    for (const rule of enabledRules) {
      let shouldExecute = false;
      
      if (rule.type === 'time_based') {
        if (rule.timeType === 'days') {
          // For days-based rules, check if enough time has passed since last execution
          // or if it's the first execution
          const lastExecuted = rule.lastExecutedAt ? new Date(rule.lastExecutedAt) : null;
          const now = new Date();
          
          // Execute if never executed, or if enough time has passed
          // For days-based rules, we check every interval, so we'll let the rule evaluation handle it
          shouldExecute = true; // Always check, let evaluateTimeBasedRule decide
        } else if (rule.timeType === 'date') {
          // For date-based rules, check if the target date/time has been reached
          if (rule.specificDate) {
            const [year, month, day] = rule.specificDate.split('-').map(Number);
            const [hours, minutes] = (rule.specificTime || '09:00').split(':').map(Number);
            const targetDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
            const now = new Date();
            
            // Execute if target date/time has been reached and not already executed for this date
            if (now >= targetDateTime) {
              const lastExecuted = rule.lastExecutedAt ? new Date(rule.lastExecutedAt) : null;
              // Only execute if we haven't executed for this specific date/time yet
              if (!lastExecuted || lastExecuted < targetDateTime) {
                shouldExecute = true;
              }
            }
          }
        }
      } else if (rule.type === 'condition_based') {
        // For condition-based rules, always check (conditions are evaluated in executeScheduledUpdates)
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        rulesToExecute.push(rule.id);
      }
    }
    
    if (rulesToExecute.length === 0) {
      console.log('[Scheduler Service] No rules need to be executed at this time');
      isRunning = false;
      return;
    }
    
    console.log(`[Scheduler Service] Executing ${rulesToExecute.length} rule(s): ${rulesToExecute.join(', ')}`);
    
    // Execute the rules - this function is completely independent of req/res
    // It uses global Salesforce settings (no user context needed for background scheduler)
    const results = await executeScheduledUpdates(rulesToExecute, 'automatic_scheduler');
    const executionEndTime = new Date();
    const executionDuration = executionEndTime - executionStartTime;
    
    // Save execution history (no req/res needed)
    const historyEntry = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionTime: executionStartTime.toISOString(),
      duration: executionDuration,
      rulesExecuted: rulesToExecute.length,
      rulesProcessed: results.processed || 0,
      rulesUpdated: results.updated || 0,
      errors: results.errors || [],
      executedRules: results.executedRules || [],
      triggeredBy: 'automatic_scheduler'
    };
    
    saveExecutionHistory(historyEntry);
    
    console.log(`[Scheduler Service] Execution completed in ${(executionDuration / 1000).toFixed(1)}s. Processed: ${results.processed}, Updated: ${results.updated}`);
    
  } catch (error) {
    // Enhanced error logging to catch any req-related errors
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack || 'No stack trace';
    
    // Check if error is related to req object
    if (errorMessage.includes('req is not defined') || errorStack.includes('req')) {
      console.error('[Scheduler Service] CRITICAL: req object referenced in background scheduler!');
      console.error('[Scheduler Service] Error details:', {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      });
    }
    
    console.error('[Scheduler Service] Error during scheduled execution:', errorMessage);
    console.error('[Scheduler Service] Stack trace:', errorStack);
    
    // Save error to history (no req/res needed)
    const historyEntry = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionTime: executionStartTime.toISOString(),
      duration: Date.now() - executionStartTime.getTime(),
      rulesExecuted: 0,
      rulesProcessed: 0,
      rulesUpdated: 0,
      errors: [{ 
        error: errorMessage,
        stack: errorStack,
        type: error.name || 'Error'
      }],
      executedRules: [],
      triggeredBy: 'automatic_scheduler'
    };
    
    try {
      saveExecutionHistory(historyEntry);
    } catch (historyError) {
      console.error('[Scheduler Service] Failed to save execution history:', historyError.message);
    }
  } finally {
    isRunning = false;
  }
};

/**
 * Get scheduler status
 */
const getSchedulerStatus = () => {
  return {
    running: schedulerInterval !== null,
    isExecuting: isRunning,
    intervalMinutes: schedulerInterval ? 15 : null
  };
};

module.exports = {
  startScheduler,
  stopScheduler,
  runScheduledChecks,
  getSchedulerStatus
};

