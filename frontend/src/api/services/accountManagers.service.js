/**
 * Account Managers Service
 * API calls for account manager management
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const accountManagersService = {
  /**
   * Get all account managers
   * @returns {Promise<{success: boolean, data: Array<{id: string, employee_id: string, name: string, email: string, designation: string, track: string, tier: string, project_count: number, resource_count: number}>, total: number, generatedAt: string}>}
   */
  getAll: async () => {
    const response = await apiClient.get(ENDPOINTS.ACCOUNT_MANAGERS.LIST);
    // The interceptor transforms the response
    // Response structure: {success: true, data: [...], total: 0, generatedAt: "datetime"}
    return response.data || response;
  },
};

export default accountManagersService;
