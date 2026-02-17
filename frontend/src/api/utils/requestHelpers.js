/**
 * Request Helpers
 * Standardized utilities for API requests including error handling,
 * response transformation, retry logic, and request cancellation
 */

import { API_RETRY, HTTP_STATUS, ERROR_MESSAGES } from '@constants/api';
import logger from '@utils/logger';

/**
 * Transform API response to consistent format
 * Handles different response structures from the API
 * 
 * @param {Object} response - Axios response object
 * @returns {Object} Transformed response data
 */
export const transformResponse = (response) => {
  if (!response) {
    return null;
  }

  // If response has data field
  if (response.data !== undefined) {
    // Check if it's already in the expected format
    if (response.data.success !== undefined) {
      return response.data;
    }
    
    // If data is an array or object, wrap it
    return {
      success: true,
      data: response.data,
    };
  }

  // If response is directly the data
  return {
    success: true,
    data: response,
  };
};

/**
 * Extract data from response
 * Handles nested response structures
 * 
 * @param {Object} response - API response
 * @returns {*} Extracted data
 */
export const extractData = (response) => {
  if (!response) {
    return null;
  }

  // Handle different response structures
  if (response.data) {
    if (response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }

  return response;
};

/**
 * Extract pagination info from response
 * 
 * @param {Object} response - API response
 * @returns {Object} Pagination information
 */
export const extractPagination = (response) => {
  if (!response) {
    return null;
  }

  // Check various possible locations for pagination
  if (response.pagination) {
    return response.pagination;
  }
  
  if (response.data?.pagination) {
    return response.data.pagination;
  }

  if (response.data?.data?.pagination) {
    return response.data.data.pagination;
  }

  return null;
};

/**
 * Standardized error handler
 * Extracts error message from various error formats
 * 
 * @param {Error} error - Error object
 * @param {Object} options - Error handling options
 * @param {Function} options.onError - Custom error handler
 * @param {boolean} options.logError - Whether to log error (default: true)
 * @returns {Object} Formatted error object
 */
export const handleError = (error, options = {}) => {
  const { onError, logError = true } = options;

  let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
  let statusCode = null;
  let errorDetails = null;

  if (error.response) {
    // Server responded with error status
    statusCode = error.response.status;
    const responseData = error.response.data;

    // Extract error message from response
    if (responseData?.message) {
      errorMessage = responseData.message;
    } else if (responseData?.error) {
      if (typeof responseData.error === 'string') {
        errorMessage = responseData.error;
      } else if (responseData.error?.message) {
        errorMessage = responseData.error.message;
      }
    } else if (responseData?.errors && Array.isArray(responseData.errors)) {
      errorMessage = responseData.errors.map(e => e.message || e).join(', ');
      errorDetails = responseData.errors;
    } else {
      // Use status-based default messages
      errorMessage = ERROR_MESSAGES[`HTTP_STATUS_${statusCode}`] || ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    // Log error if enabled
    if (logError) {
      logger.error(`API Error [${statusCode}]: ${errorMessage}`, error);
    }
  } else if (error.request) {
    // Request made but no response received
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    statusCode = 0;

    if (logError) {
      logger.error('Network Error: No response received', error);
    }
  } else {
    // Something else happened
    errorMessage = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;

    if (logError) {
      logger.error('Request Error', error);
    }
  }

  const formattedError = {
    message: errorMessage,
    statusCode,
    details: errorDetails,
    originalError: error,
  };

  // Call custom error handler if provided
  if (onError) {
    onError(formattedError);
  }

  return formattedError;
};

/**
 * Retry request with exponential backoff
 * 
 * @param {Function} requestFn - Function that returns a promise
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Initial retry delay in ms (default: 1000)
 * @param {Array} options.retryableStatusCodes - Status codes to retry (default: [408, 429, 500, 502, 503, 504])
 * @returns {Promise} Request promise with retry logic
 */
export const retryRequest = async (requestFn, options = {}) => {
  const {
    maxRetries = API_RETRY.MAX_RETRIES,
    retryDelay = API_RETRY.RETRY_DELAY,
    retryableStatusCodes = API_RETRY.RETRYABLE_STATUS_CODES,
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response;
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Don't retry if status code is not retryable
      const statusCode = error.response?.status;
      if (statusCode && !retryableStatusCodes.includes(statusCode)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(API_RETRY.BACKOFF_MULTIPLIER, attempt);
      
      logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Create an AbortController for request cancellation
 * 
 * @returns {Object} AbortController and abort function
 */
export const createRequestController = () => {
  const controller = new AbortController();

  return {
    controller,
    signal: controller.signal,
    abort: () => controller.abort(),
    isAborted: () => controller.signal.aborted,
  };
};

/**
 * Build query parameters with pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {Object} defaultParams - Default parameters
 * @returns {Object} Built query parameters
 */
export const buildQueryParams = (params = {}, defaultParams = {}) => {
  const {
    page = 1,
    limit = 20,
    ...otherParams
  } = params;

  // Remove undefined, null, and empty string values
  const cleanParams = Object.entries({
    page,
    limit,
    ...otherParams,
    ...defaultParams,
  }).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  return cleanParams;
};

/**
 * Validate response structure
 * 
 * @param {Object} response - API response
 * @param {Object} options - Validation options
 * @param {boolean} options.requireSuccess - Whether success field is required
 * @param {boolean} options.requireData - Whether data field is required
 * @returns {boolean} Whether response is valid
 */
export const validateResponse = (response, options = {}) => {
  const {
    requireSuccess = false,
    requireData = false,
  } = options;

  if (!response) {
    return false;
  }

  if (requireSuccess && response.success === undefined) {
    return false;
  }

  if (requireData && !response.data) {
    return false;
  }

  return true;
};

/**
 * Create a cancellable request wrapper
 * 
 * @param {Function} requestFn - Request function
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise} Cancellable request promise
 */
export const createCancellableRequest = (requestFn, signal) => {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      reject(new Error('Request was aborted'));
      return;
    }

    // Handle abort
    const abortHandler = () => {
      reject(new Error('Request was aborted'));
    };

    signal?.addEventListener('abort', abortHandler);

    // Execute request
    requestFn()
      .then((response) => {
        signal?.removeEventListener('abort', abortHandler);
        resolve(response);
      })
      .catch((error) => {
        signal?.removeEventListener('abort', abortHandler);
        if (error.message === 'Request was aborted') {
          reject(error);
        } else {
          reject(error);
        }
      });
  });
};

export default {
  transformResponse,
  extractData,
  extractPagination,
  handleError,
  retryRequest,
  createRequestController,
  buildQueryParams,
  validateResponse,
  createCancellableRequest,
};
