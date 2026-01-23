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
   * @param {string} params.status - Filter by status (ACTIVE|COMPLETED|CANCELLED)
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
    return response.data;
  },

  /**
   * Get allocation by ID
   * @param {string} id - Allocation ID
   * @returns {Promise<{success: boolean, data: {id: string, resource_name: string, project_name: string, allocation_percentage: number, ...}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.ALLOCATIONS.GET_BY_ID(id));
    return response.data;
  },

  /**
   * Create new allocation
   * @param {Object} allocationData - Allocation data
   * @param {string} allocationData.resource_id - Resource ID
   * @param {string} allocationData.project_id - Project ID
   * @param {number} allocationData.allocation_percentage - Allocation percentage (validates total doesn't exceed 100%)
   * @param {string} allocationData.start_date - Start date (YYYY-MM-DD)
   * @param {string} allocationData.end_date - End date (YYYY-MM-DD)
   * @param {string} allocationData.status - Status (ACTIVE|COMPLETED|CANCELLED)
   * @param {string} allocationData.notes - Allocation notes
   * @returns {Promise<{success: boolean, data: {id: string, allocation_percentage: number, resource_name: string, ...}}>}
   */
  create: async (allocationData) => {
    const response = await apiClient.post(ENDPOINTS.ALLOCATIONS.CREATE, allocationData);
    return response.data;
  },

  /**
   * Update allocation
   * @param {string} id - Allocation ID
   * @param {Object} allocationData - Updated allocation data
   * @param {number} allocationData.allocation_percentage - Allocation percentage (validates 100% cap)
   * @param {string} allocationData.start_date - Start date (YYYY-MM-DD)
   * @param {string} allocationData.end_date - End date (YYYY-MM-DD)
   * @param {string} allocationData.status - Status (ACTIVE|COMPLETED|CANCELLED)
   * @param {string} allocationData.notes - Allocation notes
   * @param {number} allocationData.version - Version for optimistic locking
   * @returns {Promise<{success: boolean, data: {id: string, version: number, ...}}>}
   */
  update: async (id, allocationData) => {
    const response = await apiClient.put(ENDPOINTS.ALLOCATIONS.UPDATE(id), allocationData);
    return response.data;
  },

  /**
   * Delete allocation (hard delete - logs to allocation_history before delete)
   * @param {string} id - Allocation ID
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.ALLOCATIONS.DELETE(id));
    return response.data;
  },
};

export default allocationsService;
