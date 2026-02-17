/**
 * Performance Utilities
 * Collection of performance optimization utilities
 */

/**
 * Memoize a function result
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key from arguments
 * @returns {Function} Memoized function
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();

  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Batch function calls
 * @param {Function} fn - Function to batch
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Batched function
 */
export const batch = (fn, delay = 0) => {
  let timeout;
  let args = [];

  return (...newArgs) => {
    args = [...args, ...newArgs];
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(args);
      args = [];
    }, delay);
  };
};

/**
 * Request animation frame throttle
 * @param {Function} fn - Function to throttle
 * @returns {Function} Throttled function
 */
export const rafThrottle = (fn) => {
  let rafId = null;
  let lastArgs = null;

  return (...args) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs);
        rafId = null;
        lastArgs = null;
      });
    }
  };
};

/**
 * Check if component should update (for React.memo)
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @param {Array<string>} compareKeys - Keys to compare (if not provided, compares all)
 * @returns {boolean} True if props are equal
 */
export const arePropsEqual = (prevProps, nextProps, compareKeys = null) => {
  const keys = compareKeys || Object.keys(nextProps);
  
  return keys.every((key) => {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    
    // Handle functions
    if (typeof prevValue === 'function' && typeof nextValue === 'function') {
      return prevValue === nextValue;
    }
    
    // Handle arrays
    if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
      if (prevValue.length !== nextValue.length) return false;
      return prevValue.every((item, index) => item === nextValue[index]);
    }
    
    // Handle objects
    if (typeof prevValue === 'object' && typeof nextValue === 'object' && prevValue !== null && nextValue !== null) {
      return JSON.stringify(prevValue) === JSON.stringify(nextValue);
    }
    
    return prevValue === nextValue;
  });
};
