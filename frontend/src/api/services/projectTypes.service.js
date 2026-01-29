/**
 * Project Types Service
 * API calls for project types management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const projectTypesService = {
  /**
   * Get all project types
   * @returns {Promise<{success: boolean, data: {data: Array<{id: string, name: string, description: string, is_active: boolean}>, total: number}}>}
   */
  getAll: async () => {
    const response = await apiClient.get(ENDPOINTS.PROJECT_TYPES.LIST);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get project type by ID
   * @param {string} id - Project type ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.PROJECT_TYPES.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create a new project type
   * @param {Object} projectTypeData - Project type data
   * @param {string} projectTypeData.name - Project type name (must be unique, required)
   * @param {string} projectTypeData.description - Project type description (optional)
   * @param {boolean} projectTypeData.is_active - Is project type active (optional, default: true)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  create: async (projectTypeData) => {
    const response = await apiClient.post(ENDPOINTS.PROJECT_TYPES.CREATE, projectTypeData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update project type
   * @param {string} id - Project type ID
   * @param {Object} projectTypeData - Updated project type data
   * @param {string} projectTypeData.name - Project type name (must be unique, optional)
   * @param {string} projectTypeData.description - Project type description (optional)
   * @param {boolean} projectTypeData.is_active - Is project type active (optional)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  update: async (id, projectTypeData) => {
    const response = await apiClient.put(ENDPOINTS.PROJECT_TYPES.UPDATE(id), projectTypeData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Delete project type
   * @param {string} id - Project type ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.PROJECT_TYPES.DELETE(id));
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default projectTypesService;
