/**
 * useConfigData Hook
 * Handles data fetching for configuration items
 */

import { useState, useEffect, useCallback } from 'react';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';

/**
 * Custom hook for fetching configuration data
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchFunction - Function to fetch data
 * @param {Function} options.transformData - Transform data after fetch
 * @param {boolean} options.autoFetch - Whether to fetch on mount
 * @param {Array} options.dependencies - Dependencies for useEffect
 * @returns {Object} Data, loading state, and fetch function
 */
export const useConfigData = (options = {}) => {
  const {
    fetchFunction,
    transformData = (data) => data,
    autoFetch = false,
    dependencies = [],
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (...args) => {
    try {
      setLoading(true);
      const response = await fetchFunction(...args);

      // Handle different response structures
      let items = [];
      if (response) {
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          items = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          items = response.data;
        } else if (Array.isArray(response)) {
          items = response;
        }
      }

      // Transform data
      const transformed = items.map((item, index) => ({
        key: item.id || `item-${index}`,
        ...transformData(item),
      }));

      setData(transformed);
      return transformed;
    } catch (error) {
      logger.error('Failed to fetch data:', error);
      showErrorToast('Failed to load data');
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, transformData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ...dependencies]);

  return {
    data,
    loading,
    fetchData,
    setData,
  };
};

export default useConfigData;
