/**
 * useDebouncedFilters Hook
 * Extends useReportFilters with debouncing for filter changes
 * Useful for filters that trigger API calls
 */

import { useEffect } from 'react';
import { useReportFilters } from './useReportFilters';
import { useDebounce } from '@hooks/useDebounce';

/**
 * useDebouncedFilters Hook
 * @param {Object} defaultFilters - Default filter values
 * @param {Object} options - Hook options
 * @param {boolean} options.initialExpanded - Initial expanded state
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 300)
 * @param {Function} options.onFiltersChange - Callback when debounced filters change
 * @returns {Object} Filter state and handlers with debouncing
 */
export const useDebouncedFilters = (defaultFilters = {}, options = {}) => {
  const {
    initialExpanded = false,
    debounceDelay = 300,
    onFiltersChange,
  } = options;

  const {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    setFiltersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters, { initialExpanded });

  // Debounce filters for API calls
  const debouncedFilters = useDebounce(filters, debounceDelay);

  // Call onFiltersChange when debounced filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(debouncedFilters);
    }
  }, [debouncedFilters, onFiltersChange]);

  return {
    filters,
    setFilters,
    debouncedFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    setFiltersExpanded,
    toggleFiltersExpanded,
  };
};

export default useDebouncedFilters;
