/**
 * Configs Service
 * API calls for fetching all configurations from unified endpoint
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

const configsService = {
  /**
   * Get all configurations
   * Returns all config types: tracks, techStacks, tiers, designations, billingStatuses, 
   * projectTypes, employeeTypes, tags, universities, employeeStatuses, projectStatuses, 
   * accountTypes, userRoles, userStatuses
   * @returns {Promise} API response with all configurations
   */
  getAll: async () => {
    const response = await apiClient.get(ENDPOINTS.CONFIGS.GET_ALL);
    return response;
  },
};

export default configsService;
