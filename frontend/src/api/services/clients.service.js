/**
 * Clients Service
 * API calls for client management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const clientsService = {
  /**
   * Get all clients with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term (name or contact person)
   * @param {boolean} params.is_active - Filter by active status
   * @returns {Promise<{success: boolean, data: {data: Array, pagination: {total: number, page: number, limit: number, totalPages: number}}}>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.CLIENTS.LIST, {
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
   * Get client by ID
   * @param {string} id - Client ID
   * @returns {Promise<{success: boolean, data: {id: string, client_name: string, contact_person: string, ...}}>}
   */
  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.CLIENTS.GET_BY_ID(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Create a new client
   * @param {Object} clientData - Client data
   * @param {string} clientData.client_name - Client name (must be unique)
   * @param {string} clientData.contact_person - Contact person name
   * @param {string} clientData.contact_email - Contact email
   * @param {string} clientData.contact_phone - Contact phone
   * @param {string} clientData.address - Client address
   * @param {boolean} clientData.is_active - Is active
   * @returns {Promise<{success: boolean, data: {id: string, client_name: string, ...}}>}
   */
  create: async (clientData) => {
    const response = await apiClient.post(ENDPOINTS.CLIENTS.CREATE, clientData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Update client
   * @param {string} id - Client ID
   * @param {Object} clientData - Updated client data
   * @param {string} clientData.client_name - Client name
   * @param {string} clientData.contact_person - Contact person name
   * @param {string} clientData.contact_email - Contact email
   * @param {string} clientData.contact_phone - Contact phone
   * @param {string} clientData.address - Client address
   * @param {boolean} clientData.is_active - Is active
   * @returns {Promise<{success: boolean, data: {id: string, ...}}>}
   */
  update: async (id, clientData) => {
    const response = await apiClient.put(ENDPOINTS.CLIENTS.UPDATE(id), clientData);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Soft delete client
   * @param {string} id - Client ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.CLIENTS.DELETE(id));
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Get client's projects
   * @param {string} id - Client ID
   * @returns {Promise<{success: boolean, data: Array<{id: string, project_name: string, status: string, ...}>}>}
   */
  getProjects: async (id) => {
    const response = await apiClient.get(ENDPOINTS.CLIENTS.PROJECTS(id));
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default clientsService;
