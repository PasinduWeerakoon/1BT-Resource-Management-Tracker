/**
 * Project Statuses API Service
 * Handles all API calls related to project statuses configuration
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';
import logger from '@utils/logger';

const projectStatusesService = {
  /**
   * Get all project statuses
   * @returns {Promise} List of project statuses
   */
  getAll: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROJECT_STATUSES.LIST);
      return response.data;
    } catch (error) {
      logger.error('Error fetching project statuses', error);
      throw error;
    }
  },

  /**
   * Get project status by ID
   * @param {string} id - Project status ID
   * @returns {Promise} Project status details
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROJECT_STATUSES.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      logger.error(`Error fetching project status ${id}`, error);
      throw error;
    }
  },

  /**
   * Create new project status
   * @param {Object} data - Project status data
   * @returns {Promise} Created project status
   */
  create: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.PROJECT_STATUSES.CREATE, data);
      return response.data;
    } catch (error) {
      logger.error('Error creating project status', error);
      throw error;
    }
  },

  /**
   * Update project status
   * @param {string} id - Project status ID
   * @param {Object} data - Updated project status data
   * @returns {Promise} Updated project status
   */
  update: async (id, data) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PROJECT_STATUSES.UPDATE(id), data);
      return response.data;
    } catch (error) {
      logger.error(`Error updating project status ${id}`, error);
      throw error;
    }
  },

  /**
   * Delete project status
   * @param {string} id - Project status ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(ENDPOINTS.PROJECT_STATUSES.DELETE(id));
      return response.data;
    } catch (error) {
      logger.error(`Error deleting project status ${id}`, error);
      throw error;
    }
  },
};

export default projectStatusesService;
