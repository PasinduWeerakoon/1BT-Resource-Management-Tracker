/**
 * Resources Service (Employees)
 * API calls for resource/employee management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const resourcesService = {
  /**
   * Get all resources with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term
   * @param {string} params.track_id - Filter by track ID
   * @param {string} params.designation_id - Filter by designation ID
   * @param {string} params.status - Filter by status (Active|Inactive|Bench|Resigned|Terminated)
   * @returns {Promise<{success: boolean, data: {data: Array, pagination: {total: number, page: number, limit: number, totalPages: number}}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.RESOURCES.LIST, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params,
      },
    });
    // The interceptor transforms the response
    // Response structure: {success: true, data: {data: [], pagination: {...}}}
    return response.data || response;
  },

  /**
   * Get resource by ID
   * @param {string} id - Resource ID
   * @returns {Promise<{success: boolean, data: {id: string, name: string, email: string, track_name: string, designation_name: string, ...}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.RESOURCES.GET_BY_ID(id));
    return response.data;
  },

  /**
   * Create a new resource
   * @param {Object} resourceData - Resource data
   * @param {string} resourceData.name - Resource name
   * @param {string} resourceData.email - Resource email
   * @param {string} resourceData.mobile - Resource mobile
   * @param {string} resourceData.nic - Resource NIC
   * @param {string} resourceData.designation_id - Designation ID
   * @param {string} resourceData.track_id - Track ID
   * @param {string} resourceData.date_of_joining - Join date (YYYY-MM-DD)
   * @param {string} resourceData.status - Status (Active|Inactive|Bench|Resigned|Terminated)
   * @param {boolean} resourceData.is_intern - Is intern
   * @returns {Promise<{success: boolean, data: {id: string, name: string, ...}}>}
   */
  create: async (resourceData) => {
    const response = await apiClient.post(ENDPOINTS.RESOURCES.CREATE, resourceData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update resource
   * @param {string} id - Resource ID
   * @param {Object} resourceData - Updated resource data
   * @param {string} resourceData.name - Resource name
   * @param {string} resourceData.email - Resource email
   * @param {string} resourceData.mobile - Resource mobile
   * @param {string} resourceData.designation_id - Designation ID (UUID)
   * @param {string} resourceData.status - Status (Active|Inactive|Bench|Resigned|Terminated)
   * @returns {Promise<{success: boolean, data: {id: string, ...}}>}
   */
  update: async (id, resourceData) => {
    const response = await apiClient.put(ENDPOINTS.RESOURCES.UPDATE(id), resourceData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Soft delete resource
   * @param {string} id - Resource ID
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.RESOURCES.DELETE(id));
    return response.data;
  },

  /**
   * Get resource allocations
   * @param {string} id - Resource ID
   * @returns {Promise<{success: boolean, data: Array<{id: string, project_name: string, allocation_percentage: number, ...}>}>}
   */
  getAllocations: async (id) => {
    const response = await apiClient.get(ENDPOINTS.RESOURCES.ALLOCATIONS(id));
    return response.data;
  },

  /**
   * Get resource designation history
   * @param {string} id - Resource ID
   * @returns {Promise<{success: boolean, data: Array<{designation_name: string, effective_date: string, end_date: string}>}>}
   */
  getDesignationHistory: async (id) => {
    const response = await apiClient.get(ENDPOINTS.RESOURCES.DESIGNATION_HISTORY(id));
    return response.data;
  },
};

export default resourcesService;
