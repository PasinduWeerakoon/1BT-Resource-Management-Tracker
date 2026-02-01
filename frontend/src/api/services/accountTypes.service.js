/**
 * Account Types API Service
 * Handles all API calls related to account types configuration
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';
import logger from '@utils/logger';

const accountTypesService = {
  /**
   * Get all account types
   * @returns {Promise} List of account types
   */
  getAll: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.ACCOUNT_TYPES.LIST);
      return response.data;
    } catch (error) {
      logger.error('Error fetching account types', error);
      throw error;
    }
  },

  /**
   * Get account type by ID
   * @param {string} id - Account type ID
   * @returns {Promise} Account type details
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ACCOUNT_TYPES.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      logger.error(`Error fetching account type ${id}`, error);
      throw error;
    }
  },

  /**
   * Create new account type
   * @param {Object} data - Account type data
   * @returns {Promise} Created account type
   */
  create: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.ACCOUNT_TYPES.CREATE, data);
      return response.data;
    } catch (error) {
      logger.error('Error creating account type', error);
      throw error;
    }
  },

  /**
   * Update account type
   * @param {string} id - Account type ID
   * @param {Object} data - Updated account type data
   * @returns {Promise} Updated account type
   */
  update: async (id, data) => {
    try {
      const response = await apiClient.put(ENDPOINTS.ACCOUNT_TYPES.UPDATE(id), data);
      return response.data;
    } catch (error) {
      logger.error(`Error updating account type ${id}`, error);
      throw error;
    }
  },

  /**
   * Delete account type
   * @param {string} id - Account type ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(ENDPOINTS.ACCOUNT_TYPES.DELETE(id));
      return response.data;
    } catch (error) {
      logger.error(`Error deleting account type ${id}`, error);
      throw error;
    }
  },
};

export default accountTypesService;
