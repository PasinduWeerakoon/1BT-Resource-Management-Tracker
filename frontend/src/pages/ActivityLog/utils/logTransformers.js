/**
 * Log Transformers
 * Utility functions for transforming audit log data
 */

/**
 * Transform raw log data to table format
 * @param {Array} logsData - Raw log data from API
 * @returns {Array} Transformed log data
 */
export const transformLogsData = (logsData) => {
  if (!Array.isArray(logsData)) {
    return [];
  }

  return logsData.map((log, index) => ({
    key: log.id || `log-${index}`,
    id: log.id,
    timestamp: log.timestamp,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userName: log.userName || log.userEmail || 'Unknown',
    userEmail: log.userEmail,
    entityName: log.entityName || log.entityId,
    changedFields: log.changedFields || [],
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
  }));
};

/**
 * Normalize API response to extract logs data
 * @param {Object} response - API response
 * @returns {Object} Normalized data with logs and pagination
 */
export const normalizeLogsResponse = (response) => {
  let logsData = [];
  let paginationData = {};

  if (response) {
    if (Array.isArray(response.data)) {
      logsData = response.data;
      paginationData = response.pagination || {};
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      logsData = response.data.data;
      paginationData = response.data.pagination || {};
    } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      logsData = response.data.items || [];
      paginationData = response.data.pagination || {};
    }
  }

  return { logsData, paginationData };
};

/**
 * Normalize stats response
 * @param {Object} response - API response
 * @returns {Object|null} Normalized stats data
 */
export const normalizeStatsResponse = (response) => {
  if (!response) return null;

  if (response.data) {
    return response.data;
  } else if (typeof response === 'object' && !Array.isArray(response)) {
    return response;
  }

  return null;
};

/**
 * Normalize DLQ response
 * @param {Object} response - API response
 * @returns {Array} Normalized DLQ data
 */
export const normalizeDLQResponse = (response) => {
  if (!response) return [];

  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
};
