/**
 * TrainingReportFilters Component
 * Filter section for Training Report
 */

import React from 'react';
import { Row, Col, Select, DatePicker } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * TrainingReportFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 */
const TrainingReportFilters = ({
  filters,
  setFilters,
}) => {
  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Designation</label>
          <Select
            value={filters.designation}
            onChange={(value) => setFilters({ ...filters, designation: value })}
            style={{ width: '100%' }}
          >
            <Option value="All">All</Option>
            <Option value="ASE">ASE</Option>
            <Option value="SE">SE</Option>
            <Option value="ATL">ATL</Option>
            <Option value="TL">TL</Option>
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Track</label>
          <Select
            value={filters.track}
            onChange={(value) => setFilters({ ...filters, track: value })}
            style={{ width: '100%' }}
          >
            <Option value="All">All</Option>
            <Option value="Dev">Dev</Option>
            <Option value="Delivery">Delivery</Option>
            <Option value="QA">QA</Option>
            <Option value="BA">BA</Option>
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Tech Stack</label>
          <Select
            value={filters.techStack}
            onChange={(value) => setFilters({ ...filters, techStack: value })}
            style={{ width: '100%' }}
          >
            <Option value="All">All</Option>
            <Option value=".NET">.NET</Option>
            <Option value="Full Stack">Full Stack</Option>
            <Option value="BA/PM">BA/PM</Option>
            <Option value="QA">QA</Option>
            <Option value="Data Science">Data Science</Option>
            <Option value="Dynamics">Dynamics</Option>
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Duration Start and End Date</label>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </div>
      </Col>
    </Row>
  );
};

TrainingReportFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
};

export default TrainingReportFilters;
