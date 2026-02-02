/**
 * FilterSection Component
 * Reusable collapsible filter section for report pages
 * Supports custom title, optional refresh button, and flexible content
 * Optimized with React.memo for better performance
 */

import React, { memo, useCallback } from 'react';
import { Card, Badge, Button, Space } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * FilterSection Component
 * @param {Object} props
 * @param {boolean} props.expanded - Whether filters are expanded
 * @param {Function} props.onToggle - Toggle expanded state
 * @param {number} props.activeFiltersCount - Number of active filters
 * @param {Function} props.onReset - Reset filters handler
 * @param {Function} props.onRefresh - Optional refresh button handler
 * @param {React.ReactNode} props.children - Filter content
 * @param {string} props.className - Additional CSS class
 * @param {string} props.title - Custom title (default: "Filters")
 * @param {boolean} props.showRefresh - Whether to show refresh button (default: false)
 */
const FilterSection = ({
  expanded,
  onToggle,
  activeFiltersCount = 0,
  onReset,
  onRefresh,
  children,
  className = '',
  title = 'Filters',
  showRefresh = false,
}) => {
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReset) {
                    onReset(e);
                  }
                }}
                className="reset-filters-btn"
              >
                Reset
              </Button>
            </>
          )}
        </div>
        <div className="filters-header-right">
          {showRefresh && onRefresh && (
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onRefresh(e);
              }}
              className="refresh-filters-btn"
            >
              Refresh
            </Button>
          )}
          {expanded ? (
            <UpOutlined className="collapse-icon" />
          ) : (
            <DownOutlined className="collapse-icon" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="filters-content">
          {children || (
            <p style={{ padding: '16px', color: '#999' }}>No filters available</p>
          )}
        </div>
      )}
    </Card>
  );
};

FilterSection.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  activeFiltersCount: PropTypes.number,
  onReset: PropTypes.func,
  onRefresh: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string,
  showRefresh: PropTypes.bool,
};

// Memoize component to prevent unnecessary re-renders
export default memo(FilterSection, (prevProps, nextProps) => {
  return (
    prevProps.expanded === nextProps.expanded &&
    prevProps.activeFiltersCount === nextProps.activeFiltersCount &&
    prevProps.className === nextProps.className &&
    prevProps.title === nextProps.title &&
    prevProps.showRefresh === nextProps.showRefresh &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onReset === nextProps.onReset &&
    prevProps.onRefresh === nextProps.onRefresh
  );
});
