/**
 * Designations Service
 * API calls for designations management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const designationsService = {
  /**
   * Get all designations with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term
   * @returns {Promise<{success: boolean, data: {data: Array<{id: string, name: string, level: number, is_active: boolean}>, pagination: {...}}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.DESIGNATIONS.LIST, {
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
   * Get designation by ID
   * @param {string} id - Designation ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, level: number, is_active: boolean}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.DESIGNATIONS.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create a new designation
   * @param {Object} designationData - Designation data
   * @param {string} designationData.name - Designation name (must be unique)
   * @param {number} designationData.level - Designation level (1-4)
   * @param {boolean} designationData.is_active - Is designation active
   * @returns {Promise<{success: boolean, data: {id: string, name: string, level: number, is_active: boolean}}>}
   */
  create: async (designationData) => {
    const response = await apiClient.post(ENDPOINTS.DESIGNATIONS.CREATE, designationData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update designation
   * @param {string} id - Designation ID
   * @param {Object} designationData - Updated designation data
   * @param {string} designationData.name - Designation name (must be unique)
   * @param {number} designationData.level - Designation level (1-4)
   * @param {boolean} designationData.is_active - Is designation active
   * @returns {Promise<{success: boolean, data: {id: string, name: string, level: number, is_active: boolean}}>}
   */
  update: async (id, designationData) => {
    const response = await apiClient.put(ENDPOINTS.DESIGNATIONS.UPDATE(id), designationData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Delete designation
   * @param {string} id - Designation ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.DESIGNATIONS.DELETE(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get designation history
   * @param {string} id - Designation ID
   * @returns {Promise<{success: boolean, data: Array<{resource_name: string, effective_date: string, end_date: string}>}>}
   */
  getHistory: async (id) => {
    const response = await apiClient.get(ENDPOINTS.DESIGNATIONS.HISTORY(id));
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default designationsService;
