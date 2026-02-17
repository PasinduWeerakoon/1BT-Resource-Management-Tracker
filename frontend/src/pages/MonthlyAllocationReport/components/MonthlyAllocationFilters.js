/**
 * MonthlyAllocationFilters Component
 * Filter section for Monthly Allocation Report
 */

import React, { useMemo } from 'react';
import { Row, Col, Select } from 'antd';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

const { Option } = Select;

/**
 * MonthlyAllocationFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Array} props.tracksList - List of tracks
 */
const MonthlyAllocationFilters = ({
  filters,
  setFilters,
  tracksList = [],
}) => {
  const currentDate = dayjs();

  // Generate year options (current year and previous 5 years)
  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = currentDate.year();
    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, []);

  // Generate month options
  const monthOptions = useMemo(() => [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ], []);

  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Year</label>
          <Select
            value={filters.year}
            onChange={(value) => setFilters({ ...filters, year: value })}
            style={{ width: '100%' }}
          >
            {yearOptions.map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Month</label>
          <Select
            value={filters.month}
            onChange={(value) => setFilters({ ...filters, month: value })}
            style={{ width: '100%' }}
          >
            {monthOptions.map((month) => (
              <Option key={month.value} value={month.value}>
                {month.label}
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

MonthlyAllocationFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  tracksList: PropTypes.array,
};

export default MonthlyAllocationFilters;
