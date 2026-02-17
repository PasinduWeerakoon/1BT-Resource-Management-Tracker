/**
 * useFetchData Hook
 * Manages data fetching with loading state, error handling, and duplicate call prevention
 * 
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Object} options - Additional options
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: false)
 * @param {Array} options.dependencies - Dependencies array for useEffect (default: [])
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @returns {Object} Fetch state and handlers
 * 
 * @example
 * const { data, loading, error, fetchData, refetch } = useFetchData(
 *   async () => await reportsService.getBench(filters),
 *   { autoFetch: true, dependencies: [filters] }
 * );
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export const useFetchData = (fetchFunction, options = {}) => {
  const {
    autoFetch = false,
    dependencies = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchInProgressRef = useRef(false);

  const fetchData = useCallback(async (...args) => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      const result = await fetchFunction(...args);
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [fetchFunction, onSuccess, onError]);

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

export default useFetchData;
