/**
 * EmployeeReportFilters Component
 * Filter section for Employee Report
 */

import React from 'react';
import { Row, Col, Select } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;

/**
 * EmployeeReportFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Array} props.tracksList - List of tracks
 * @param {Array} props.resourcesList - List of resources
 */
const EmployeeReportFilters = ({
  filters,
  setFilters,
  tracksList = [],
  resourcesList = [],
}) => {
  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Employee</label>
          <Select
            value={filters.resource_id}
            onChange={(value) => setFilters({ ...filters, resource_id: value || undefined })}
            style={{ width: '100%' }}
            allowClear
            showSearch
            placeholder="All Employees"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {resourcesList.map((resource) => (
              <Option key={resource.id} value={resource.id}>
                {resource.name}
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
            onChange={(value) => setFilters({ ...filters, track_id: value || undefined })}
            style={{ width: '100%' }}
            allowClear
            placeholder="All Tracks"
          >
            {tracksList.map((track) => (
              <Option key={track.id} value={track.id}>
                {track.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
    </Row>
  );
};

EmployeeReportFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  tracksList: PropTypes.array,
  resourcesList: PropTypes.array,
};

export default EmployeeReportFilters;
