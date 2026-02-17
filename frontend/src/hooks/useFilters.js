/**
 * useFilters Hook
 * Manages filter state, active filter count, and filter reset functionality
 * 
 * @param {Object} defaultFilters - Default filter values
 * @param {Object} options - Additional options
 * @param {boolean} options.initialExpanded - Whether filters should be expanded initially (default: false)
 * @returns {Object} Filter state and handlers
 * 
 * @example
 * const { filters, setFilters, activeFiltersCount, handleResetFilters, filtersExpanded, setFiltersExpanded } = useFilters({
 *   track_id: undefined,
 *   status: 'All'
 * });
 */
import { useState, useMemo } from 'react';

export const useFilters = (defaultFilters = {}, options = {}) => {
  const { initialExpanded = false } = options;
  
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(initialExpanded);

  // Count active filters (filters that differ from defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key];
      const defaultValue = defaultFilters[key];
      
      // Consider a filter active if:
      // 1. It's different from the default value
      // 2. It's not empty string
      // 3. It's not null
      // 4. It's not undefined
      if (
        filterValue !== defaultValue &&
        filterValue !== '' &&
        filterValue !== null &&
        filterValue !== undefined
      ) {
        count++;
      }
    });
    return count;
  }, [filters, defaultFilters]);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setFilters({ ...defaultFilters });
  };

  // Toggle filters expanded state
  const toggleFiltersExpanded = () => {
    setFiltersExpanded((prev) => !prev);
  };

  return {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    setFiltersExpanded,
    toggleFiltersExpanded,
  };
};

export default useFilters;
