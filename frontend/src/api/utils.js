/**
 * API Utility Functions
 * Reusable helper functions for API operations
 */

/**
 * Build query string from object
 * @param {Object} params - Query parameters object
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, item));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  return queryParams.toString();
};

/**
 * Handle pagination response
 * @param {Object} response - API response
 * @returns {Object} Normalized pagination data
 */
export const handlePaginationResponse = (response) => {
  if (response && response.data) {
    return {
      items: response.data.items || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 20,
      totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / (response.data.limit || 20)),
    };
  }
  return {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };
};

/**
 * Handle API error
 * @param {Error} error - Error object
 * @param {Function} onError - Optional error callback
 * @returns {Object} Error information
 */
export const handleApiError = (error, onError) => {
  const errorInfo = {
    message: error.message || 'An error occurred',
    errors: error.errors || [],
    status: error.response?.status,
    data: error.response?.data,
  };

  if (onError && typeof onError === 'function') {
    onError(errorInfo);
  }

  return errorInfo;
};

/**
 * Transform date to API format (YYYY-MM-DD)
 * @param {Date|string|dayjs} date - Date to transform
 * @returns {string|null} Formatted date or null
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Try to parse and format
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return null;
  }
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  // If dayjs object
  if (date.format && typeof date.format === 'function') {
    return date.format('YYYY-MM-DD');
  }
  
  return null;
};

/**
 * Transform API date to dayjs or Date object
 * @param {string} dateString - Date string from API (YYYY-MM-DD)
 * @param {Function} dayjs - dayjs function (optional)
 * @returns {Date|dayjs|null} Date object or null
 */
export const parseApiDate = (dateString, dayjs = null) => {
  if (!dateString) return null;
  
  if (dayjs && typeof dayjs === 'function') {
    return dayjs(dateString);
  }
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} Is valid UUID
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Create pagination params
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {Object} options.filters - Additional filters
 * @returns {Object} Pagination params
 */
export const createPaginationParams = ({ page = 1, limit = 20, filters = {} }) => {
  return {
    page,
    limit,
    ...filters,
  };
};

/**
 * Debounce function for API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  buildQueryString,
  handlePaginationResponse,
  handleApiError,
  formatDateForAPI,
  parseApiDate,
  isValidEmail,
  isValidUUID,
  createPaginationParams,
  debounce,
};
