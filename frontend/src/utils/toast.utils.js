/**
 * Toast Notification Utilities
 * Centralized toast notification functions using react-toastify
 */

import { toast } from 'react-toastify';

/**
 * Show error toast message
 * @param {string} message - Error message to display
 * @param {Object} options - Additional toast options
 */
export const showErrorToast = (message, options = {}) => {
  toast.error(message || 'An error occurred', {
    position: 'bottom-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show success toast message
 * @param {string} message - Success message to display
 * @param {Object} options - Additional toast options
 */
export const showSuccessToast = (message, options = {}) => {
  toast.success(message || 'Operation completed successfully', {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      backgroundColor: '#52c41a', // Green color
      color: '#fff',
    },
    ...options,
  });
};

/**
 * Show warning toast message
 * @param {string} message - Warning message to display
 * @param {Object} options - Additional toast options
 */
export const showWarningToast = (message, options = {}) => {
  toast.warning(message || 'Warning', {
    position: 'bottom-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show info toast message
 * @param {string} message - Info message to display
 * @param {Object} options - Additional toast options
 */
export const showInfoToast = (message, options = {}) => {
  toast.info(message || 'Information', {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Extract error message from API error response
 * @param {Error} error - Error object from API
 * @returns {string} - Error message to display
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Map of HTTP status codes to user-friendly messages
  // Based on MDN HTTP Status Code documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
  const statusCodeMessages = {
    // 4xx Client Error Responses
    400: 'Invalid request. Please check your input and try again.',
    401: 'Unauthorized. Please check your credentials and try again.',
    402: 'Payment required. This feature requires payment.',
    403: 'Forbidden. You do not have permission to access this resource.',
    404: 'Not found. The requested resource was not found.',
    405: 'Method not allowed. The request method is not supported for this resource.',
    406: 'Not acceptable. The server cannot produce a response matching the acceptable values.',
    407: 'Proxy authentication required. Please authenticate with the proxy server.',
    408: 'Request timeout. The server timed out waiting for the request.',
    409: 'Conflict. The request conflicts with the current state of the resource.',
    410: 'Gone. The requested resource is no longer available.',
    411: 'Length required. The request must include a Content-Length header.',
    412: 'Precondition failed. One or more conditions in the request header were not met.',
    413: 'Payload too large. The request entity is larger than limits defined by the server.',
    414: 'URI too long. The URI provided was too long for the server to process.',
    415: 'Unsupported media type. The media format is not supported by the server.',
    416: 'Range not satisfiable. The range specified in the request cannot be fulfilled.',
    417: 'Expectation failed. The expectation given in the request header could not be met.',
    418: 'I\'m a teapot. The server refuses to brew coffee because it is a teapot.',
    421: 'Misdirected request. The request was directed to a server that is not able to produce a response.',
    422: 'Unprocessable content. The request was well-formed but contains semantic errors.',
    423: 'Locked. The resource that is being accessed is locked.',
    424: 'Failed dependency. The request failed because it depended on another request that failed.',
    425: 'Too early. The server is unwilling to risk processing a request that might be replayed.',
    426: 'Upgrade required. The server refuses to perform the request using the current protocol.',
    428: 'Precondition required. The origin server requires the request to be conditional.',
    429: 'Too many requests. You have sent too many requests in a given amount of time.',
    431: 'Request header fields too large. The server is unwilling to process the request because its header fields are too large.',
    451: 'Unavailable for legal reasons. The server is denying access to the resource as a consequence of a legal demand.',
    
    // 5xx Server Error Responses
    500: 'Internal server error. An unexpected error occurred on the server.',
    501: 'Not implemented. The server does not support the functionality required to fulfill the request.',
    502: 'Bad gateway. The server, while acting as a gateway or proxy, received an invalid response.',
    503: 'Service unavailable. The server is currently unable to handle the request.',
    504: 'Gateway timeout. The server, while acting as a gateway or proxy, did not receive a timely response.',
    505: 'HTTP version not supported. The HTTP version used in the request is not supported by the server.',
    506: 'Variant also negotiates. The server has an internal configuration error.',
    507: 'Insufficient storage. The method could not be performed on the resource because the server is unable to store the representation.',
    508: 'Loop detected. The server detected an infinite loop while processing the request.',
    510: 'Not extended. Further extensions to the request are required for the server to fulfill it.',
    511: 'Network authentication required. The client needs to authenticate to gain network access.',
  };

  // Check if error has response with status code
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // First, try to get message from response data
    if (data?.message && typeof data.message === 'string') {
      // Filter out generic axios error messages
      const message = data.message;
      if (!message.match(/^Request failed with status code \d+$/i) && 
          !message.match(/^Network Error$/i) &&
          !message.match(/^timeout of \d+ms exceeded$/i)) {
        return message;
      }
    }

    // Check for nested error.message
    if (data?.error?.message && typeof data.error.message === 'string') {
      const message = data.error.message;
      if (!message.match(/^Request failed with status code \d+$/i)) {
        return message;
      }
    }

    // Check if error field is a string
    if (data?.error && typeof data.error === 'string') {
      const message = data.error;
      if (!message.match(/^Request failed with status code \d+$/i)) {
        return message;
      }
    }

    // Use status code-based message if available
    if (statusCodeMessages[status]) {
      return statusCodeMessages[status];
    }

    // Fallback to status text if available
    if (error.response.statusText) {
      return error.response.statusText;
    }
  }

  // Check if error has message (but filter out generic axios messages)
  if (error.message) {
    const message = error.message;
    // Filter out generic axios/network error messages
    if (message.match(/^Request failed with status code \d+$/i)) {
      // Extract status code from message
      const statusMatch = message.match(/status code (\d+)/i);
      if (statusMatch) {
        const status = parseInt(statusMatch[1], 10);
        if (statusCodeMessages[status]) {
          return statusCodeMessages[status];
        }
      }
      return 'An error occurred while processing your request. Please try again.';
    }
    
    if (message.match(/^Network Error$/i)) {
      return 'Network error: Unable to connect to the server. Please check your internet connection.';
    }
    
    if (message.match(/^timeout of \d+ms exceeded$/i)) {
      return 'Request timeout: The server took too long to respond. Please try again.';
    }

    // Return the message if it's not a generic error
    return message;
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

export default {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  getErrorMessage,
};
