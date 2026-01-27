/**
 * Reports Service
 * API calls for various reports
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const reportsService = {
  /**
   * Get bench resources report
   * Resources with less than 100% allocation
   * @param {Object} params - Query parameters
   * @param {string} params.track_id - Filter by track ID (optional)
   * @returns {Promise<{success: boolean, data: Array<{id: string, name: string, designation: string, track: string, days_on_bench: number}>, total: number, generatedAt: string}>}
   */
  getBench: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.BENCH, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get account manager report
   * Projects grouped by account manager
   * @param {Object} params - Query parameters
   * @param {string} params.account_manager_id - Filter by account manager ID (optional)
   * @returns {Promise<{success: boolean, data: Array<{project_name: string, client_name: string, resources: Array}>, total: number, generatedAt: string}>}
   */
  getAccountManager: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.ACCOUNT_MANAGER, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get employee report
   * Detailed employee allocation breakdown
   * @param {Object} params - Query parameters
   * @param {string} params.resource_id - Filter by resource ID (optional)
   * @param {string} params.track_id - Filter by track ID (optional)
   * @returns {Promise<{success: boolean, data: Array<{id: string, name: string, current_allocations: Array, total_allocation: number}>, total: number, generatedAt: string}>}
   */
  getEmployee: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.EMPLOYEE, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get monthly allocation report
   * Monthly allocation summary
   * @param {Object} params - Query parameters
   * @param {number} params.year - Year (required)
   * @param {number} params.month - Month 1-12 (required)
   * @param {string} params.track_id - Filter by track ID (optional)
   * @returns {Promise<{success: boolean, data: Array<{resource_name: string, allocations: Array, total_percentage: number}>, total: number, generatedAt: string}>}
   */
  getMonthlyAllocation: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.MONTHLY_ALLOCATION, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get exception allocation report
   * Resources with allocation > 100% or anomalies
   * @param {Object} params - Query parameters (none required)
   * @returns {Promise<{success: boolean, data: Array<{id: string, name: string, total_allocation: number, is_over_allocated: boolean}>, total: number, generatedAt: string}>}
   */
  getException: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.EXCEPTION, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get non-billing resources report
   * Resources on non-billable projects
   * @param {Object} params - Query parameters (none required)
   * @returns {Promise<{success: boolean, data: Array<{id: string, name: string, project_name: string, billing_percentage: number}>, total: number, generatedAt: string}>}
   */
  getNonBilling: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.NON_BILLING, {
      params,
    });
    return response.data || response;
  },

  /**
   * Get pre-sale activities report
   * Resources allocated to pre-sale projects
   * @param {Object} params - Query parameters (none required)
   * @returns {Promise<{success: boolean, data: Array<{id: string, name: string, project_name: string, client_name: string}>, total: number, generatedAt: string}>}
   */
  getPreSale: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.REPORTS.PRE_SALE, {
      params,
    });
    return response.data || response;
  },
};

export default reportsService;
