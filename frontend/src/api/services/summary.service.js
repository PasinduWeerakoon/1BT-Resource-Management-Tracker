/**
 * Summary Service
 * API calls for dashboard summary data
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const summaryService = {
  getResourceCounts: async () => {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.RESOURCE_COUNTS);
    return response.data || response;
  },
  getPercentages: async () => {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.PERCENTAGES);
    return response.data || response;
  },
  getCharts: async () => {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.CHARTS);
    return response.data || response;
  },
};

export default summaryService;
