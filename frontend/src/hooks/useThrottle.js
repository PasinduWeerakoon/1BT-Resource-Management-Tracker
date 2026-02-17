/**
 * useThrottle Hook
 * Throttles a value, useful for scroll events and frequent updates
 */

import { useState, useEffect, useRef } from 'react';

/**
 * useThrottle Hook
 * @param {*} value - Value to throttle
 * @param {number} limit - Time limit in milliseconds (default: 300)
 * @returns {*} Throttled value
 */
export const useThrottle = (value, limit = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

export default useThrottle;
