/**
 * API Constants
 * API-related constants including timeouts, retry logic, and request limits
 */

/**
 * API Timeout Settings
 */
export const API_TIMEOUT = {
  // Default timeout in milliseconds
  DEFAULT: 30000, // 30 seconds
  
  // Short timeout for quick requests
  SHORT: 10000, // 10 seconds
  
  // Long timeout for heavy operations
  LONG: 60000, // 60 seconds
  
  // Very long timeout for file uploads/downloads
  VERY_LONG: 300000, // 5 minutes
};

/**
 * API Retry Configuration
 */
export const API_RETRY = {
  // Maximum number of retry attempts
  MAX_RETRIES: 3,
  
  // Retry delay in milliseconds
  RETRY_DELAY: 1000, // 1 second
  
  // Exponential backoff multiplier
  BACKOFF_MULTIPLIER: 2,
  
  // HTTP status codes that should trigger a retry
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
};

/**
 * Request Limits
 */
export const REQUEST_LIMITS = {
  // Maximum request body size (in bytes)
  MAX_BODY_SIZE: 10 * 1024 * 1024, // 10 MB
  
  // Maximum number of items in a batch request
  MAX_BATCH_SIZE: 100,
  
  // Maximum number of concurrent requests
  MAX_CONCURRENT_REQUESTS: 10,
};

/**
 * API Response Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * API Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error: No response received from server',
  TIMEOUT_ERROR: 'Request timeout: The server took too long to respond',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'Resource conflict occurred',
  SERVER_ERROR: 'An internal server error occurred',
};

export default {
  API_TIMEOUT,
  API_RETRY,
  REQUEST_LIMITS,
  HTTP_STATUS,
  ERROR_MESSAGES,
};
