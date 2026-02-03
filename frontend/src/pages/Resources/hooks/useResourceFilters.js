/**
 * useResourceFilters Hook
 * Manages filter state and logic for Resources page
 */

import { useState, useMemo, useEffect } from 'react';

const defaultFilters = {
  tier: 'All',
  status: 'All',
  employeeNumber: '',
  name: '',
  track_id: undefined,
  designation_id: undefined,
};

export const useResourceFilters = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState({ name: '', employeeNumber: '' });

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== defaultFilters[key] && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
  };

  // Debounce search inputs to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch({
        name: filters.name || '',
        employeeNumber: filters.employeeNumber || '',
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [filters.name, filters.employeeNumber]);

  return {
    filters,
    setFilters,
    debouncedSearch,
    activeFiltersCount,
    handleResetFilters,
    defaultFilters,
  };
};
