/**
 * usePagination Hook
 * Manages pagination state and handlers
 * 
 * @param {Object} initialPagination - Initial pagination state
 * @param {number} initialPagination.current - Initial current page (default: 1)
 * @param {number} initialPagination.pageSize - Initial page size (default: 20)
 * @param {number} initialPagination.total - Initial total count (default: 0)
 * @param {Function} onPageChange - Callback when page changes
 * @param {Function} onPageSizeChange - Callback when page size changes
 * @returns {Object} Pagination state and handlers
 * 
 * @example
 * const { pagination, setPagination, handlePageChange, handlePageSizeChange, resetPagination } = usePagination(
 *   { current: 1, pageSize: 20, total: 0 },
 *   (page, pageSize) => fetchData(page, pageSize),
 *   (size) => fetchData(1, size)
 * );
 */
import { useState, useCallback } from 'react';
import { PAGINATION } from '@constants/app';

export const usePagination = (
  initialPagination = {},
  onPageChange = null,
  onPageSizeChange = null
) => {
  const {
    current = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    total = 0,
  } = initialPagination;

  const [pagination, setPagination] = useState({
    current,
    pageSize,
    total,
  });

  // Handle page change
  const handlePageChange = useCallback((page, size) => {
    const newPagination = {
      ...pagination,
      current: page,
      pageSize: size || pagination.pageSize,
    };
    setPagination(newPagination);

    if (onPageChange) {
      onPageChange(page, size || pagination.pageSize);
    }
  }, [pagination, onPageChange]);

  // Handle page size change
  const handlePageSizeChange = useCallback((current, size) => {
    const newPagination = {
      ...pagination,
      current: PAGINATION.DEFAULT_PAGE, // Reset to first page when page size changes
      pageSize: size,
    };
    setPagination(newPagination);

    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  }, [pagination, onPageSizeChange]);

  // Reset pagination to initial state
  const resetPagination = useCallback(() => {
    setPagination({
      current: PAGINATION.DEFAULT_PAGE,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      total: 0,
    });
  }, []);

  // Update pagination total
  const updateTotal = useCallback((total) => {
    setPagination((prev) => ({
      ...prev,
      total,
    }));
  }, []);

  return {
    pagination,
    setPagination,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
    updateTotal,
  };
};

export default usePagination;
