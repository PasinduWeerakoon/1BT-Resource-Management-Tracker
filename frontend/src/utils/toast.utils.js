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

  // Check if error has response data with message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check if error has response data with error field
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Check if error has message
  if (error.message) {
    return error.message;
  }

  // Check if error has response status text
  if (error.response?.statusText) {
    return error.response.statusText;
  }

  // Default error message
  return 'An unexpected error occurred';
};

export default {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  getErrorMessage,
};
