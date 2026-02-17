/**
 * Allocation History Service
 * API calls for archived allocation history
 * Part of the 3-Table Temporal Architecture
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const allocationHistoryService = {
    /**
     * Search allocation history with filters
     * @param {Object} params - Query parameters
     * @param {string} params.resource_id - Filter by resource ID
     * @param {string} params.project_id - Filter by project ID
     * @param {string} params.client_id - Filter by client ID
     * @param {string} params.change_type - Filter by change type
     * @param {string} params.archived_after - Filter by archive date (after)
     * @param {string} params.archived_before - Filter by archive date (before)
     * @param {string} params.allocated_after - Filter by allocated date (after)
     * @param {string} params.allocated_before - Filter by allocated date (before)
     * @param {number} params.limit - Items per page
     * @param {number} params.offset - Offset for pagination
     * @returns {Promise<{success: boolean, data: {history: Array, total: number}}>}
     */
    search: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.ALLOCATION_HISTORY.LIST, { params });
        return response.data || response;
    },

    /**
     * Get archived allocation by ID
     * @param {string} id - Archived allocation ID
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    getById: async (id) => {
        const response = await apiClient.get(ENDPOINTS.ALLOCATION_HISTORY.GET_BY_ID(id));
        return response.data || response;
    },

    /**
     * Get allocation history for a specific resource
     * @param {string} resourceId - Resource ID
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Limit results
     * @param {number} params.offset - Offset for pagination
     * @returns {Promise<{success: boolean, data: {history: Array, total: number}}>}
     */
    getByResource: async (resourceId, params = {}) => {
        const response = await apiClient.get(ENDPOINTS.ALLOCATION_HISTORY.BY_RESOURCE(resourceId), { params });
        return response.data || response;
    },

    /**
     * Get allocation history for a specific project
     * @param {string} projectId - Project ID
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Limit results
     * @param {number} params.offset - Offset for pagination
     * @returns {Promise<{success: boolean, data: {history: Array, total: number}}>}
     */
    getByProject: async (projectId, params = {}) => {
        const response = await apiClient.get(ENDPOINTS.ALLOCATION_HISTORY.BY_PROJECT(projectId), { params });
        return response.data || response;
    },

    /**
     * Get statistics for allocation history archive
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    getStats: async () => {
        const response = await apiClient.get(ENDPOINTS.ALLOCATION_HISTORY.STATS);
        return response.data || response;
    },

    /**
     * Get complete allocation timeline for a resource
     * Includes archived, current, and future allocations
     * @param {string} resourceId - Resource ID
     * @param {Object} params - Query parameters
     * @param {string} params.from_date - Start date filter
     * @param {string} params.to_date - End date filter
     * @returns {Promise<{success: boolean, data: {resourceId: string, timeline: Array, counts: Object}}>}
     */
    getTimeline: async (resourceId, params = {}) => {
        const response = await apiClient.get(ENDPOINTS.ALLOCATION_HISTORY.TIMELINE(resourceId), { params });
        return response.data || response;
    },
};

export default allocationHistoryService;
