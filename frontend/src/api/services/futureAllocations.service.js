/**
 * Future Allocations Service
 * API calls for scheduled/future allocation management
 * Part of the 3-Table Temporal Architecture
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const futureAllocationsService = {
    /**
     * Get all future allocations with filters
     * @param {Object} params - Query parameters
     * @param {string} params.resource_id - Filter by resource ID
     * @param {string} params.project_id - Filter by project ID
     * @param {string} params.status - Filter by status (scheduled, activated, cancelled)
     * @param {string} params.effective_date - Filter by effective date
     * @param {number} params.limit - Items per page
     * @param {number} params.offset - Offset for pagination
     * @returns {Promise<{success: boolean, data: {futureAllocations: Array, total: number}}>}
     */
    getAll: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.FUTURE_ALLOCATIONS.LIST, { params });
        return response.data || response;
    },

    /**
     * Get future allocation by ID
     * @param {string} id - Future allocation ID
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    getById: async (id) => {
        const response = await apiClient.get(ENDPOINTS.FUTURE_ALLOCATIONS.GET_BY_ID(id));
        return response.data || response;
    },

    /**
     * Get future allocations for a specific resource
     * @param {string} resourceId - Resource ID
     * @param {Object} params - Query parameters
     * @param {string} params.status - Filter by status
     * @returns {Promise<{success: boolean, data: {futureAllocations: Array, total: number}}>}
     */
    getByResource: async (resourceId, params = {}) => {
        const response = await apiClient.get(ENDPOINTS.FUTURE_ALLOCATIONS.BY_RESOURCE(resourceId), { params });
        return response.data || response;
    },

    /**
     * Get pending allocations due for activation
     * @param {Object} params - Query parameters
     * @param {string} params.effective_date - Filter by specific date
     * @param {number} params.limit - Limit results
     * @returns {Promise<{success: boolean, data: {pendingAllocations: Array, total: number}}>}
     */
    getPending: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.FUTURE_ALLOCATIONS.PENDING, { params });
        return response.data || response;
    },

    /**
     * Get statistics for future allocations
     * @returns {Promise<{success: boolean, data: {byStatusAndType: Array, upcomingActivations: Array}}>}
     */
    getStats: async () => {
        const response = await apiClient.get(ENDPOINTS.FUTURE_ALLOCATIONS.STATS);
        return response.data || response;
    },

    /**
     * Cancel a scheduled future allocation
     * @param {string} id - Future allocation ID
     * @param {Object} data - Cancellation data
     * @param {string} data.reason - Cancellation reason
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    cancel: async (id, data = {}) => {
        const response = await apiClient.delete(ENDPOINTS.FUTURE_ALLOCATIONS.CANCEL(id), { data });
        return response.data || response;
    },

    /**
     * Manually trigger activation of a future allocation (for testing)
     * @param {string} futureAllocationId - Future allocation ID to activate
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    manualActivate: async (futureAllocationId) => {
        const response = await apiClient.post(ENDPOINTS.ALLOCATIONS.SCHEDULER_ACTIVATE, {
            futureAllocationId,
        });
        return response.data || response;
    },
};

export default futureAllocationsService;
