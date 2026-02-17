/**
 * Base Service Utility
 * Provides common CRUD operations and patterns for API services
 * Reduces boilerplate code across service files
 */

import apiClient from '../client';
import {
  transformResponse,
  extractData,
  extractPagination,
  buildQueryParams,
  handleError,
} from './requestHelpers';
import { PAGINATION } from '@constants/app';

/**
 * Create a base service with common CRUD operations
 * 
 * @param {Object} endpoints - Service endpoints object
 * @param {string} endpoints.LIST - List endpoint
 * @param {Function} endpoints.GET_BY_ID - Get by ID endpoint function
 * @param {string} endpoints.CREATE - Create endpoint
 * @param {Function} endpoints.UPDATE - Update endpoint function
 * @param {Function} endpoints.DELETE - Delete endpoint function
 * @param {Object} options - Service options
 * @param {Object} options.defaultParams - Default query parameters
 * @param {Function} options.transformItem - Transform function for individual items
 * @param {Function} options.transformList - Transform function for list items
 * @returns {Object} Service object with CRUD methods
 * 
 * @example
 * const tracksService = createBaseService({
 *   LIST: ENDPOINTS.TRACKS.LIST,
 *   GET_BY_ID: (id) => ENDPOINTS.TRACKS.GET_BY_ID(id),
 *   CREATE: ENDPOINTS.TRACKS.CREATE,
 *   UPDATE: (id) => ENDPOINTS.TRACKS.UPDATE(id),
 *   DELETE: (id) => ENDPOINTS.TRACKS.DELETE(id),
 * });
 */
export const createBaseService = (endpoints, options = {}) => {
  const {
    defaultParams = {},
    transformItem = null,
    transformList = null,
  } = options;

  /**
   * Get all items with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise} List of items with pagination
   */
  const getAll = async (params = {}) => {
    try {
      const queryParams = buildQueryParams(params, defaultParams);
      
      const response = await apiClient.get(endpoints.LIST, {
        params: queryParams,
      });

      const transformed = transformResponse(response);
      let data = extractData(transformed);
      const pagination = extractPagination(transformed) || extractPagination(response);

      // Transform list items if transform function provided
      if (transformList && Array.isArray(data)) {
        data = data.map(transformList);
      } else if (transformList && data?.data && Array.isArray(data.data)) {
        data = {
          ...data,
          data: data.data.map(transformList),
        };
      }

      // Return consistent structure
      if (pagination) {
        return {
          success: true,
          data: Array.isArray(data) ? data : (data?.data || data),
          pagination,
        };
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : (data?.data || data),
      };
    } catch (error) {
      handleError(error, { logError: true });
      throw error;
    }
  };

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise} Item data
   */
  const getById = async (id) => {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      const response = await apiClient.get(endpoints.GET_BY_ID(id));
      const transformed = transformResponse(response);
      let data = extractData(transformed);

      // Transform item if transform function provided
      if (transformItem && data) {
        data = transformItem(data);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      handleError(error, { logError: true });
      throw error;
    }
  };

  /**
   * Create a new item
   * @param {Object} itemData - Item data
   * @returns {Promise} Created item
   */
  const create = async (itemData) => {
    try {
      const response = await apiClient.post(endpoints.CREATE, itemData);
      const transformed = transformResponse(response);
      let data = extractData(transformed);

      // Transform item if transform function provided
      if (transformItem && data) {
        data = transformItem(data);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      handleError(error, { logError: true });
      throw error;
    }
  };

  /**
   * Update an item
   * @param {string} id - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise} Updated item
   */
  const update = async (id, itemData) => {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      const response = await apiClient.put(endpoints.UPDATE(id), itemData);
      const transformed = transformResponse(response);
      let data = extractData(transformed);

      // Transform item if transform function provided
      if (transformItem && data) {
        data = transformItem(data);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      handleError(error, { logError: true });
      throw error;
    }
  };

  /**
   * Delete an item
   * @param {string} id - Item ID
   * @returns {Promise} Deletion result
   */
  const deleteItem = async (id) => {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      const response = await apiClient.delete(endpoints.DELETE(id));
      const transformed = transformResponse(response);

      return {
        success: true,
        data: extractData(transformed),
        message: transformed?.message || 'Item deleted successfully',
      };
    } catch (error) {
      handleError(error, { logError: true });
      throw error;
    }
  };

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteItem, // Use deleteItem to avoid reserved keyword
  };
};

/**
 * Create a service with custom methods in addition to base CRUD
 * 
 * @param {Object} endpoints - Service endpoints
 * @param {Object} customMethods - Custom service methods
 * @param {Object} options - Service options
 * @returns {Object} Service object with base CRUD and custom methods
 */
export const createService = (endpoints, customMethods = {}, options = {}) => {
  const baseService = createBaseService(endpoints, options);

  return {
    ...baseService,
    ...customMethods,
  };
};

export default {
  createBaseService,
  createService,
};
