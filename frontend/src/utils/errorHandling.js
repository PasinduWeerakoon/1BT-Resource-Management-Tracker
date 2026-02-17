/**
 * Error Handling Utilities
 * Consistent error handling patterns across the application
 */

import logger from './logger';
import { formatErrorMessage } from './codeQuality';

/**
 * Error types for better error categorization
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Classify error type
 * @param {Error|Object} error - Error object
 * @returns {string} Error type
 */
export const classifyError = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;

  // Network errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ErrorTypes.NETWORK;
  }

  // HTTP status code based classification
  if (error.response) {
    const status = error.response.status;
    if (status === 401) return ErrorTypes.AUTH;
    if (status === 403) return ErrorTypes.PERMISSION;
    if (status === 404) return ErrorTypes.NOT_FOUND;
    if (status >= 500) return ErrorTypes.SERVER;
    if (status >= 400) return ErrorTypes.VALIDATION;
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return ErrorTypes.VALIDATION;
  }

  return ErrorTypes.UNKNOWN;
};

/**
 * Handle error with logging and user-friendly message
 * @param {Error|Object} error - Error object
 * @param {Object} options - Error handling options
 * @param {string} options.context - Context where error occurred
 * @param {Function} options.onError - Custom error handler
 * @param {boolean} options.logError - Whether to log error (default: true)
 * @returns {string} User-friendly error message
 */
export const handleError = (error, options = {}) => {
  const {
    context = 'Application',
    onError,
    logError = true,
  } = options;

  const errorType = classifyError(error);
  const errorMessage = formatErrorMessage(error);

  // Log error
  if (logError) {
    logger.error(`${context} Error [${errorType}]:`, {
      message: errorMessage,
      error,
      context,
      type: errorType,
    });
  }

  // Custom error handler
  if (onError) {
    onError(error, errorType, errorMessage);
  }

  return errorMessage;
};

/**
 * Create error handler function for async operations
 * @param {Object} options - Error handler options
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (options = {}) => {
  return (error) => handleError(error, options);
};

/**
 * Safe async wrapper that catches and handles errors
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw to allow caller to handle if needed
    }
  };
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.delay - Initial delay in ms (default: 1000)
 * @param {Function} options.shouldRetry - Function to determine if should retry (default: always retry)
 * @returns {Promise} Result of function or throws error
 */
export const retry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = () => true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};
