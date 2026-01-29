/**
 * Tracks Service
 * API calls for tracks management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const tracksService = {
  /**
   * Get all tracks with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (optional)
   * @param {number} params.limit - Items per page (optional)
   * @param {string} params.search - Search term (optional)
   * @returns {Promise<{success: boolean, data: {data: Array<{id: string, name: string, description: string, is_active: boolean}>, pagination: {total: number, page: number, limit: number, totalPages: number}}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.TRACKS.LIST, {
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
   * Get track by ID
   * @param {string} id - Track ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.TRACKS.GET_BY_ID(id));
    // The interceptor transforms the response
    // API returns: {success: true, data: {id: string, name: string, description: string, is_active: boolean}}
    return response.data || response;
  },

  /**
   * Create a new track
   * @param {Object} trackData - Track data
   * @param {string} trackData.name - Track name (must be unique, required)
   * @param {string} trackData.description - Track description (optional)
   * @param {boolean} trackData.is_active - Is track active (optional, default: true)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  create: async (trackData) => {
    const response = await apiClient.post(ENDPOINTS.TRACKS.CREATE, trackData);
    // The interceptor transforms the response
    // API returns: {success: true, data: {id: string, name: string, description: string, is_active: boolean}}
    // Status: 201 Created, 409 Conflict (if name already exists)
    return response.data || response;
  },

  /**
   * Update track
   * @param {string} id - Track ID
   * @param {Object} trackData - Updated track data
   * @param {string} trackData.name - Track name (must be unique, optional)
   * @param {string} trackData.description - Track description (optional)
   * @param {boolean} trackData.is_active - Is track active (optional)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, description: string, is_active: boolean}}>}
   */
  update: async (id, trackData) => {
    const response = await apiClient.put(ENDPOINTS.TRACKS.UPDATE(id), trackData);
    // The interceptor transforms the response
    // API returns: {success: true, data: {id: string, name: string, description: string, is_active: boolean}}
    // Status: 200 OK, 404 Not Found, 409 Conflict (if name already exists)
    return response.data || response;
  },
};

export default tracksService;
