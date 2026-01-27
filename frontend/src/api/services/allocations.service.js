/**
 * Allocations Service
 * API calls for allocation management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const allocationsService = {
  /**
   * Get all allocations with filters and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.resource_id - Filter by resource ID
   * @param {string} params.project_id - Filter by project ID
   * @param {boolean} params.is_active - Filter by active status
   * @returns {Promise<{success: boolean, data: {items: Array, total: number, page: number, limit: number}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.ALLOCATIONS.LIST, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params,
      },
    });
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get allocation by ID
   * @param {string} id - Allocation ID
   * @returns {Promise<{success: boolean, data: {id: string, resource_name: string, project_name: string, allocation_percentage: number, ...}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.ALLOCATIONS.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create new allocation
   * @param {Object} allocationData - Allocation data
   * @param {string} allocationData.resource_id - Resource ID (UUID)
   * @param {string} allocationData.project_id - Project ID (UUID)
   * @param {number} allocationData.allocation_percentage - Allocation percentage (0-100)
   * @param {number} allocationData.billing_percentage - Billing percentage (0-100)
   * @param {string} allocationData.start_date - Start date (YYYY-MM-DD)
   * @param {string} allocationData.end_date - End date (YYYY-MM-DD, optional)
   * @param {string} allocationData.notes - Allocation notes (optional)
   * @returns {Promise<{success: boolean, data: {id: string, allocation_percentage: number, resource_name: string, ...}}>}
   */
  create: async (allocationData) => {
    const response = await apiClient.post(ENDPOINTS.ALLOCATIONS.CREATE, allocationData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update allocation
   * @param {string} id - Allocation ID
   * @param {Object} allocationData - Updated allocation data
   * @param {number} allocationData.allocation_percentage - Allocation percentage (0-100)
   * @param {number} allocationData.billing_percentage - Billing percentage (0-100)
   * @param {string} allocationData.start_date - Start date (YYYY-MM-DD)
   * @param {string} allocationData.end_date - End date (YYYY-MM-DD, optional)
   * @param {boolean} allocationData.is_active - Is active status
   * @param {string} allocationData.notes - Allocation notes (optional)
   * @returns {Promise<{success: boolean, data: {id: string, ...}}>}
   */
  update: async (id, allocationData) => {
    const response = await apiClient.put(ENDPOINTS.ALLOCATIONS.UPDATE(id), allocationData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Soft delete allocation
   * @param {string} id - Allocation ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.ALLOCATIONS.DELETE(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get monthly allocations
   * @param {Object} params - Query parameters
   * @param {number} params.year - Year
   * @param {number} params.month - Month (1-12)
   * @param {string} params.track_id - Filter by track ID (optional)
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getMonthly: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.ALLOCATIONS.MONTHLY, {
      params,
    });
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get allocation history for a resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getHistory: async (resourceId) => {
    const response = await apiClient.get(ENDPOINTS.ALLOCATIONS.HISTORY(resourceId));
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default allocationsService;
