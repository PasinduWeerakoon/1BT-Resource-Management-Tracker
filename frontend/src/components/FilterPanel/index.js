/**
 * FilterPanel Component
 * Reusable filter panel with expand/collapse, active filter count, and reset functionality
 * 
 * @param {Object} props
 * @param {boolean} props.expanded - Whether filters are expanded
 * @param {Function} props.onToggle - Toggle expand/collapse handler
 * @param {number} props.activeFiltersCount - Number of active filters
 * @param {Function} props.onReset - Reset filters handler
 * @param {ReactNode} props.children - Filter content
 * @param {string} props.title - Filter panel title (default: "Filters")
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <FilterPanel
 *   expanded={filtersExpanded}
 *   onToggle={() => setFiltersExpanded(!filtersExpanded)}
 *   activeFiltersCount={activeFiltersCount}
 *   onReset={handleResetFilters}
 * >
 *   <Row gutter={[16, 16]}>
 *     <Col xs={24} sm={12}>
 *       <Select ... />
 *     </Col>
 *   </Row>
 * </FilterPanel>
 */
import React, { useCallback } from 'react';
import { Card, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import '@styles/components/FilterPanel.scss';

const FilterPanel = ({
  expanded,
  onToggle,
  activeFiltersCount = 0,
  onReset,
  children,
  title = 'Filters',
  className = '',
}) => {
  // Memoize reset handler to prevent unnecessary re-renders
  const handleReset = useCallback((e) => {
    e.stopPropagation();
    if (onReset) {
      onReset(e);
    }
  }, [onReset]);
  return (
    <Card className={`filters-card ${className}`}>
      <div
        className="filters-header"
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
      >
        <div className="filters-header-left">
          <FilterOutlined className="filter-icon" />
          <span className="filters-title">{title}</span>
          {activeFiltersCount > 0 && (
            <>
              <Badge count={activeFiltersCount} showZero={false} className="active-filters-badge">
                <span></span>
              </Badge>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReset}
                className="reset-filters-btn"
              >
                Reset
              </Button>
            </>
          )}
        </div>
        {expanded ? (
          <UpOutlined className="collapse-icon" />
        ) : (
          <DownOutlined className="collapse-icon" />
        )}
      </div>
      {expanded && (
        <div className="filters-content">
          {children}
        </div>
      )}
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(FilterPanel);
