/**
 * ResourceFilters Component
 * Filter UI for Resources page
 * Optimized with React.memo and useCallback for better performance
 */

import React, { useCallback } from 'react';
import { Card, Select, Input, Row, Col, Badge, Button } from 'antd';
import { FilterOutlined, ReloadOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';

const { Option } = Select;

const ResourceFilters = ({
  filters,
  filtersExpanded,
  activeFiltersCount,
  onToggleExpanded,
  onFilterChange,
  onResetFilters,
  tiers,
  designations,
  tracks,
}) => {
  // Memoize filter change handlers
  const handleTierChange = useCallback((value) => {
    onFilterChange('tier', value);
  }, [onFilterChange]);

  const handleDesignationChange = useCallback((value) => {
    onFilterChange('designation_id', value || undefined);
  }, [onFilterChange]);

  const handleTrackChange = useCallback((value) => {
    onFilterChange('track_id', value || undefined);
  }, [onFilterChange]);

  const handleStatusChange = useCallback((value) => {
    onFilterChange('status', value);
  }, [onFilterChange]);

  const handleEmployeeNumberChange = useCallback((e) => {
    onFilterChange('employeeNumber', e.target.value);
  }, [onFilterChange]);

  const handleNameChange = useCallback((e) => {
    onFilterChange('name', e.target.value);
  }, [onFilterChange]);
  return (
    <Card className="filters-card">
      <div
        className="filters-header"
        onClick={onToggleExpanded}
        style={{ cursor: 'pointer' }}
      >
        <div className="filters-header-left">
          <FilterOutlined className="filter-icon" />
          <span className="filters-title">Filters</span>
          {activeFiltersCount > 0 && (
            <>
              <Badge count={activeFiltersCount} showZero={false} className="active-filters-badge">
                <span></span>
              </Badge>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={onResetFilters}
                className="reset-filters-btn"
              >
                Reset
              </Button>
            </>
          )}
        </div>
        {filtersExpanded ? (
          <UpOutlined className="collapse-icon" />
        ) : (
          <DownOutlined className="collapse-icon" />
        )}
      </div>
      {filtersExpanded && (
        <div className="filters-content">
          <Row gutter={[16, 16]} className="filters-row">
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Tier</label>
                <Select
                  value={filters.tier}
                  onChange={handleTierChange}
                  style={{ width: '100%' }}
                >
                  <Option value="All">All</Option>
                  {tiers.map((tier) => (
                    <Option key={tier.id} value={tier.id}>
                      {tier.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Designation</label>
                <Select
                  value={filters.designation_id}
                  onChange={handleDesignationChange}
                  style={{ width: '100%' }}
                  placeholder="All Designations"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {designations.map((designation) => (
                    <Option key={designation.id} value={designation.id}>
                      {designation.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Track</label>
                <Select
                  value={filters.track_id}
                  onChange={handleTrackChange}
                  style={{ width: '100%' }}
                  placeholder="All Tracks"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {tracks.map((track) => (
                    <Option key={track.id} value={track.id}>
                      {track.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Status</label>
                <Select
                  value={filters.status}
                  onChange={handleStatusChange}
                  style={{ width: '100%' }}
                >
                  <Option value="All">All</Option>
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="Serving Notice Period">Serving Notice Period</Option>
                  <Option value="On Leave">On Leave</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Employee Number</label>
                <Input
                  placeholder="Search by employee number"
                  value={filters.employeeNumber}
                  onChange={handleEmployeeNumberChange}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Name</label>
                <Input
                  placeholder="Search by name"
                  value={filters.name}
                  onChange={handleNameChange}
                  allowClear
                />
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ResourceFilters);
