/**
 * ActivityLogFilters Component
 * Filter section for Activity Log
 */

import React from 'react';
import { Row, Col, Select, Input, DatePicker } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * ActivityLogFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Function} props.handleDateRangeChange - Date range change handler
 */
const ActivityLogFilters = ({
  filters,
  setFilters,
  handleDateRangeChange,
}) => {
  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Action</label>
          <Select
            placeholder="Select Action"
            allowClear
            style={{ width: '100%' }}
            value={filters.action}
            onChange={(value) => setFilters({ ...filters, action: value })}
          >
            <Option value="CREATE">CREATE</Option>
            <Option value="UPDATE">UPDATE</Option>
            <Option value="DELETE">DELETE</Option>
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Entity Type</label>
          <Select
            placeholder="Select Entity Type"
            allowClear
            style={{ width: '100%' }}
            value={filters.entityType}
            onChange={(value) => setFilters({ ...filters, entityType: value })}
          >
            <Option value="resource">Resource</Option>
            <Option value="project">Project</Option>
            <Option value="allocation">Allocation</Option>
            <Option value="client">Client</Option>
            <Option value="track">Track</Option>
            <Option value="designation">Designation</Option>
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Entity ID</label>
          <Input
            placeholder="Enter Entity ID"
            value={filters.entityId}
            onChange={(e) => setFilters({ ...filters, entityId: e.target.value || undefined })}
            allowClear
          />
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>User ID</label>
          <Input
            placeholder="Enter User ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
            allowClear
          />
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={12}>
        <div className="filter-item">
          <label>Date Range</label>
          <RangePicker
            style={{ width: '100%' }}
            value={filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : null}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
          />
        </div>
      </Col>
    </Row>
  );
};

ActivityLogFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  handleDateRangeChange: PropTypes.func.isRequired,
};

export default ActivityLogFilters;
