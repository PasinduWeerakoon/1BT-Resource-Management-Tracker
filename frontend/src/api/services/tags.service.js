/**
 * Tags Service
 * API calls for tags management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const tagsService = {
  /**
   * Get all tags with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (optional)
   * @param {number} params.limit - Items per page (optional)
   * @param {string} params.search - Search term (optional)
   * @returns {Promise<{success: boolean, data: {data: Array<{id: string, name: string, description: string, is_active: boolean}>, pagination: {total: number, page: number, limit: number, totalPages: number}}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.TAGS.LIST, {
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
   * Get tag by ID
   * @param {string} id - Tag ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.TAGS.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create a new tag
   * @param {Object} tagData - Tag data
   * @param {string} tagData.name - Tag name (must be unique, required)
   * @param {string} tagData.description - Tag description (optional)
   * @param {boolean} tagData.is_active - Is tag active (optional, default: true)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  create: async (tagData) => {
    const response = await apiClient.post(ENDPOINTS.TAGS.CREATE, tagData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update tag
   * @param {string} id - Tag ID
   * @param {Object} tagData - Updated tag data
   * @param {string} tagData.name - Tag name (must be unique, optional)
   * @param {string} tagData.description - Tag description (optional)
   * @param {boolean} tagData.is_active - Is tag active (optional)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  update: async (id, tagData) => {
    const response = await apiClient.put(ENDPOINTS.TAGS.UPDATE(id), tagData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Delete tag (soft delete)
   * @param {string} id - Tag ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.TAGS.DELETE(id));
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default tagsService;
