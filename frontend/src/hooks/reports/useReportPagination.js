/**
 * useReportPagination Hook
 * Manages pagination state for report tables
 * 
 * @param {Object} options - Pagination options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.initialPageSize - Initial page size (default: 10)
 * @param {number[]} options.pageSizeOptions - Page size options (default: [10, 20, 50, 100])
 * @returns {Object} Pagination state and handlers
 * 
 * @example
 * const { pagination, handleTableChange, resetPagination } = useReportPagination();
 */
import { useState, useCallback } from 'react';

export const useReportPagination = (options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = ['10', '20', '50', '100'],
  } = options;

  const [pagination, setPagination] = useState({
    current: initialPage,
    pageSize: initialPageSize,
    total: 0,
  });

  const handleTableChange = useCallback((newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current || prev.current,
      pageSize: newPagination.pageSize || prev.pageSize,
    }));
  }, []);

  const updateTotal = useCallback((total) => {
    setPagination((prev) => ({
      ...prev,
      total,
    }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      current: initialPage,
    }));
  }, [initialPage]);

  const getPaginationConfig = useCallback(() => ({
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    pageSizeOptions,
  }), [pagination, pageSizeOptions]);

  return {
    pagination,
    setPagination,
    handleTableChange,
    updateTotal,
    resetPagination,
    getPaginationConfig,
  };
};

export default useReportPagination;
