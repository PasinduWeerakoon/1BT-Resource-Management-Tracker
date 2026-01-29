/**
 * Billing Statuses Service
 * API calls for billing statuses management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const billingStatusesService = {
  /**
   * Get all billing statuses
   * @param {Object} params - Query parameters
   * @param {boolean} params.include_inactive - Include inactive statuses
   * @returns {Promise<{success: boolean, data: {data: Array, total: number}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.BILLING_STATUSES.LIST, {
      params: {
        ...params,
      },
    });
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get billing status by ID
   * @param {string} id - Billing status ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, color: string, ...}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.BILLING_STATUSES.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create a new billing status
   * @param {Object} statusData - Billing status data
   * @param {string} statusData.name - Status name (required, unique)
   * @param {string} statusData.description - Description (optional)
   * @param {string} statusData.color - Color code (optional, default: '#1890ff')
   * @param {number} statusData.display_order - Display order (optional)
   * @param {boolean} statusData.is_active - Is active (optional, default: true)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, ...}}>}
   */
  create: async (statusData) => {
    const response = await apiClient.post(ENDPOINTS.BILLING_STATUSES.CREATE, statusData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update billing status
   * @param {string} id - Billing status ID
   * @param {Object} statusData - Updated billing status data
   * @param {string} statusData.name - Status name (cannot change for system statuses)
   * @param {string} statusData.description - Description
   * @param {string} statusData.color - Color code
   * @param {number} statusData.display_order - Display order
   * @param {boolean} statusData.is_active - Is active (cannot change for system statuses)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, ...}}>}
   */
  update: async (id, statusData) => {
    const response = await apiClient.put(ENDPOINTS.BILLING_STATUSES.UPDATE(id), statusData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Delete billing status (soft delete - sets is_active to false)
   * System statuses cannot be deleted
   * @param {string} id - Billing status ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.BILLING_STATUSES.DELETE(id));
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default billingStatusesService;

