/**
 * Debounce utility for preventing rapid function calls
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge of the timeout
 * @param {boolean} options.trailing - Invoke on the trailing edge of the timeout
 * @param {number} options.maxWait - Maximum time func is allowed to be delayed before it's invoked
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait, options = {}) => {
  let timeoutId;
  let maxTimeoutId;
  let lastCallTime;
  let lastArgs;
  let lastInvokeTime = 0;
  let leading = false;
  let trailing = true;
  let maxWait = false;

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  wait = Number(wait) || 0;
  if (typeof options === 'object') {
    leading = !!options.leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
    maxWait = 'maxWait' in options ? Number(options.maxWait) : maxWait;
  }

  function invokeFunc(time) {
    const args = lastArgs || [];
    lastInvokeTime = time;
    timeoutId = undefined;
    maxTimeoutId = undefined;
    return func.apply(this, args);
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : undefined;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== false
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== false && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeoutId = undefined;

    if (trailing && lastCallTime) {
      return invokeFunc(time);
    }
    lastCallTime = undefined;
    lastArgs = undefined;
    return undefined;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastCallTime = undefined;
    lastArgs = undefined;
    timeoutId = undefined;
    maxTimeoutId = undefined;
  }

  function flush() {
    return timeoutId === undefined ? undefined : trailingEdge(Date.now());
  }

  function pending() {
    return timeoutId !== undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastCallTime = time;
    lastArgs = args;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(time);
      }
      if (maxWait !== false) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(time);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return undefined;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
};

/**
 * Simple debounce for common use cases
 */
export const simpleDebounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};





