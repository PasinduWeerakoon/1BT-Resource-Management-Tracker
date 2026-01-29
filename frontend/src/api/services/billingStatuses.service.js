/**
 * Billing Statuses Service
 * API calls for billing statuses management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const billingStatusesService = {
  /**
   * Get all billing statuses
   * @returns {Promise<{success: boolean, data: {data: Array<{id: string, name: string, description: string, is_active: boolean}>, total: number}}>}
   */
  getAll: async () => {
    const response = await apiClient.get(ENDPOINTS.BILLING_STATUSES.LIST);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get billing status by ID
   * @param {string} id - Billing status ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.BILLING_STATUSES.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create a new billing status
   * @param {Object} billingStatusData - Billing status data
   * @param {string} billingStatusData.name - Billing status name (must be unique, required)
   * @param {string} billingStatusData.description - Billing status description (optional)
   * @param {boolean} billingStatusData.is_active - Is billing status active (optional, default: true)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  create: async (billingStatusData) => {
    const response = await apiClient.post(ENDPOINTS.BILLING_STATUSES.CREATE, billingStatusData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update billing status
   * @param {string} id - Billing status ID
   * @param {Object} billingStatusData - Updated billing status data
   * @param {string} billingStatusData.name - Billing status name (must be unique, optional)
   * @param {string} billingStatusData.description - Billing status description (optional)
   * @param {boolean} billingStatusData.is_active - Is billing status active (optional)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  update: async (id, billingStatusData) => {
    const response = await apiClient.put(ENDPOINTS.BILLING_STATUSES.UPDATE(id), billingStatusData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Delete billing status
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
