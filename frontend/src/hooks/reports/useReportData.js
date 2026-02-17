/**
 * useReportData Hook
 * Handles data fetching for report pages with response structure normalization
 * 
 * @param {Function} fetchFunction - Async function to fetch report data
 * @param {Function} transformFunction - Function to transform API data to table format
 * @param {Object} options - Additional options
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: false)
 * @param {Array} options.dependencies - Dependencies array for useEffect (default: [])
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @returns {Object} Report data state and handlers
 * 
 * @example
 * const { data, loading, error, fetchData, refetch } = useReportData(
 *   async (filters) => await reportsService.getException(filters),
 *   (item, index) => ({
 *     key: item.id || `item-${index}`,
 *     name: item.name || 'N/A',
 *   }),
 *   { autoFetch: true, dependencies: [filters] }
 * );
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';

export const useReportData = (fetchFunction, transformFunction = null, options = {}) => {
  const {
    autoFetch = false,
    dependencies = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchInProgressRef = useRef(false);

  /**
   * Normalize API response structure
   * Handles various response formats:
   * - { data: { data: [...] } }
   * - { data: [...] }
   * - [...]
   */
  const normalizeResponse = (response) => {
    if (!response) return [];
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  };

  const fetchData = useCallback(async (...args) => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetchFunction(...args);
      const rawData = normalizeResponse(response);
      
      // Transform data if transform function provided
      const transformedData = transformFunction
        ? rawData.map((item, index) => transformFunction(item, index))
        : rawData;

      setData(transformedData);

      if (onSuccess) {
        onSuccess(transformedData, response);
      }

      return { data: transformedData, rawResponse: response };
    } catch (err) {
      logger.error('Failed to fetch report data', err);
      const errorMessage = err?.message || 'Failed to load report data';
      showErrorToast(errorMessage);
      setError(err);
      setData([]);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [fetchFunction, transformFunction, onSuccess, onError]);

  // Refetch function (same as fetchData but with a different name for clarity)
  const refetch = useCallback((...args) => {
    return fetchData(...args);
  }, [fetchData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ...dependencies]);

  return {
    data,
    setData,
    loading,
    error,
    fetchData,
    refetch,
    fetchInProgressRef, // Expose ref in case it's needed
  };
};

export default useReportData;
