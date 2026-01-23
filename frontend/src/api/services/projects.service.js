/**
 * Projects Service
 * API calls for project management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const projectsService = {
  /**
   * Get all projects with filters and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term
   * @param {string} params.client_id - Filter by client ID
   * @param {string} params.status - Filter by status (ACTIVE|ON_HOLD|COMPLETED|CANCELLED)
   * @param {string} params.project_type - Filter by project type (INTERNAL|EXTERNAL|BenchProject)
   * @param {boolean} params.is_billable - Filter by billable status
   * @returns {Promise<{success: boolean, data: {items: Array, total: number, page: number, limit: number}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.PROJECTS.LIST, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params,
      },
    });
    return response.data;
  },

  /**
   * Get project by ID
   * @param {string} id - Project ID
   * @returns {Promise<{success: boolean, data: {id: string, project_name: string, client_name: string, status: string, ...}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.PROJECTS.GET_BY_ID(id));
    return response.data;
  },

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.project_name - Project name
   * @param {string} projectData.client_id - Client ID (optional for INTERNAL projects)
   * @param {string} projectData.project_type - Project type (INTERNAL|EXTERNAL|BenchProject)
   * @param {boolean} projectData.is_billable - Is billable
   * @param {string} projectData.status - Status (ACTIVE|ON_HOLD|COMPLETED|CANCELLED)
   * @param {string} projectData.start_date - Start date (YYYY-MM-DD)
   * @param {string} projectData.end_date - End date (YYYY-MM-DD)
   * @param {string} projectData.description - Project description
   * @returns {Promise<{success: boolean, data: {id: string, project_name: string, client_name: string, ...}}>}
   */
  create: async (projectData) => {
    const response = await apiClient.post(ENDPOINTS.PROJECTS.CREATE, projectData);
    return response.data;
  },

  /**
   * Update project
   * @param {string} id - Project ID
   * @param {Object} projectData - Updated project data
   * @param {string} projectData.project_name - Project name
   * @param {string} projectData.client_id - Client ID
   * @param {string} projectData.status - Status (ACTIVE|ON_HOLD|COMPLETED|CANCELLED)
   * @param {string} projectData.description - Project description
   * @param {number} projectData.version - Version for optimistic locking
   * @returns {Promise<{success: boolean, data: {id: string, version: number, ...}}>}
   */
  update: async (id, projectData) => {
    const response = await apiClient.put(ENDPOINTS.PROJECTS.UPDATE(id), projectData);
    return response.data;
  },

  /**
   * Soft delete project
   * @param {string} id - Project ID
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.PROJECTS.DELETE(id));
    return response.data;
  },

  /**
   * Get project allocations
   * @param {string} id - Project ID
   * @returns {Promise<{success: boolean, data: Array<{id: string, resource_name: string, allocation_percentage: number, ...}>}>}
   */
  getAllocations: async (id) => {
    const response = await apiClient.get(ENDPOINTS.PROJECTS.ALLOCATIONS(id));
    return response.data;
  },
};

export default projectsService;
