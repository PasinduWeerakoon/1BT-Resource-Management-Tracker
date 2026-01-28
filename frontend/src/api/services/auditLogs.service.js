/**
 * Audit Logs Service
 * API calls for audit logs and activity tracking
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const auditLogsService = {
  /**
   * List audit logs with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.action - Filter by action (CREATE|UPDATE|DELETE)
   * @param {string} params.entityType - Filter by entity type
   * @param {string} params.entityId - Filter by entity ID
   * @param {string} params.userId - Filter by user ID
   * @param {string} params.startDate - Start date (ISO format)
   * @param {string} params.endDate - End date (ISO format)
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.BASE, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get single audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.GET_BY_ID(id));
    return response.data || response;
  },

  /**
   * Get audit history for specific entity
   * @param {string} entityType - Entity type (e.g., 'resource', 'project', 'allocation')
   * @param {string} entityId - Entity ID
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getByEntity: async (entityType, entityId) => {
    const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.GET_BY_ENTITY(entityType, entityId));
    return response.data || response;
  },

  /**
   * Get user activity log
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days (default: 30)
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getByUser: async (userId, params = {}) => {
    const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.GET_BY_USER(userId), {
      params,
    });
    return response.data || response;
  },

  /**
   * Get audit dashboard statistics
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days (default: 7)
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getStats: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.STATS, {
      params,
    });
    return response.data || response;
  },

  /**
   * View failed audit messages (Admin only)
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getDLQ: async () => {
    const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.DLQ);
    return response.data || response;
  },

  /**
   * Reprocess failed audit message (Admin only)
   * @param {string} messageId - Message ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  reprocessDLQ: async (messageId) => {
    const response = await apiClient.post(ENDPOINTS.AUDIT_LOGS.REPROCESS_DLQ(messageId));
    return response.data || response;
  },
};

export default auditLogsService;
