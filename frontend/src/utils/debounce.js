/**
 * Debounce utility function
 * Delays function execution until after wait time has passed
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - If true, trigger on leading edge instead of trailing
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300, immediate = false) => {
  let timeout;

  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

/**
 * Throttle utility function
 * Limits function execution to once per wait time
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;

  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
