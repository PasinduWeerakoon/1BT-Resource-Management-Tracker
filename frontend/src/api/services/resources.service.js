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
   * @param {string} params.status - Filter by status (Active|Inactive|Serving Notice Period|On Leave)
   * @param {boolean} params.is_intern - Filter by intern status
   * @param {string} params.tier - Filter by tier (Synergy|Tier - 1|Tier - 2|Tier - 3|Tier - 4|Intern)
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
   * @param {string} resourceData.employee_id - Employee ID (required)
   * @param {string} resourceData.employee_number - Employee number (required)
   * @param {string} resourceData.name - Resource name (required)
   * @param {string} resourceData.phone_number - Phone number (required)
   * @param {string} resourceData.email - Resource email (optional)
   * @param {string} resourceData.designation_id - Designation ID (UUID, required)
   * @param {string} resourceData.track_id - Track ID (UUID, required)
   * @param {string} resourceData.date_of_joining - Join date (YYYY-MM-DD, optional)
   * @param {string} resourceData.date_of_birth - Date of birth (YYYY-MM-DD, optional)
   * @param {string} resourceData.nic_passport - NIC or Passport (optional)
   * @param {boolean} resourceData.is_intern - Is intern (optional, default: false)
   * @param {string} resourceData.tier - Tier (Synergy|Tier - 1|Tier - 2|Tier - 3|Tier - 4|Intern, optional)
   * @param {string} resourceData.tech_stack - Tech stack (.NET|Full Stack|QA|BA/PM|Data Science|Java|React, optional)
   * @param {string} resourceData.photo_url - Photo URL (optional)
   * @param {string} resourceData.status - Status (Active|Inactive|Serving Notice Period|On Leave, optional)
   * @returns {Promise<{success: boolean, data: {id: string, name: string, tier: string, date_of_birth: date, nic_passport: string, is_intern: boolean, ...}}>}
   */
  create: async (resourceData) => {
    const response = await apiClient.post(ENDPOINTS.RESOURCES.CREATE, resourceData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update resource
   * @param {string} id - Resource ID
   * @param {Object} resourceData - Updated resource data (all fields optional for partial update)
   * @param {string} resourceData.name - Resource name
   * @param {string} resourceData.email - Resource email
   * @param {string} resourceData.phone_number - Phone number
   * @param {string} resourceData.designation_id - Designation ID (UUID)
   * @param {string} resourceData.date_of_birth - Date of birth (YYYY-MM-DD)
   * @param {string} resourceData.nic_passport - NIC or Passport
   * @param {boolean} resourceData.is_intern - Is intern
   * @param {string} resourceData.tier - Tier (Synergy|Tier - 1|Tier - 2|Tier - 3|Tier - 4|Intern)
   * @param {string} resourceData.tech_stack - Tech stack (.NET|Full Stack|QA|BA/PM|Data Science|Java|React)
   * @param {string} resourceData.photo_url - Photo URL
   * @param {string} resourceData.status - Status (Active|Inactive|Serving Notice Period|On Leave)
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
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.RESOURCES.DELETE(id));
    // The interceptor transforms the response
    // API returns: {success: true, message: "Resource deleted"}
    return response.data || response;
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

  /**
   * Toggle account manager status for a resource
   * @param {string} id - Resource ID
   * @param {Object} data - Account manager data
   * @param {boolean} data.is_account_manager - Account manager status
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  updateAccountManager: async (id, data = {}) => {
    const response = await apiClient.put(ENDPOINTS.RESOURCES.ACCOUNT_MANAGER(id), data);
    return response.data || response;
  },

  /**
   * Update resource tier
   * @param {string} id - Resource ID
   * @param {Object} data - Tier data
   * @param {string} data.tier - Tier value (Synergy|Tier - 1|Tier - 2|Tier - 3|Tier - 4|Intern)
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  updateTier: async (id, data) => {
    const response = await apiClient.put(ENDPOINTS.RESOURCES.TIER(id), data);
    return response.data || response;
  },

  /**
   * Update resource tech stack
   * @param {string} id - Resource ID
   * @param {Object} data - Tech stack data
   * @param {string} data.tech_stack - Tech stack value (.NET|Full Stack|QA|BA/PM|Data Science|Java|React)
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  updateTechStack: async (id, data) => {
    const response = await apiClient.put(ENDPOINTS.RESOURCES.TECH_STACK(id), data);
    return response.data || response;
  },
};

export default resourcesService;
