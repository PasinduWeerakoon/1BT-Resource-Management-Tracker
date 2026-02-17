/**
 * ExternalConsultantsFilters Component
 * Filter section for External Consultants Report
 */

import React, { useMemo } from 'react';
import { Row, Col, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * ExternalConsultantsFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Array} props.tracksList - List of tracks
 * @param {Array} props.projectsList - List of projects
 * @param {Array} props.uniqueTechStacks - List of unique tech stacks
 */
const ExternalConsultantsFilters = ({
  filters,
  setFilters,
  tracksList = [],
  projectsList = [],
  uniqueTechStacks = [],
}) => {
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({
        ...filters,
        start_date: undefined,
        end_date: undefined,
      });
    }
  };

  // Get date range value for RangePicker
  const dateRangeValue = useMemo(() => {
    if (filters.start_date && filters.end_date) {
      return [dayjs(filters.start_date), dayjs(filters.end_date)];
    }
    return null;
  }, [filters.start_date, filters.end_date]);

  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Track</label>
          <Select
            value={filters.track_id}
            onChange={(value) => setFilters({ ...filters, track_id: value || undefined })}
            style={{ width: '100%' }}
            placeholder="All Tracks"
            allowClear
          >
            {tracksList.map((track) => (
              <Option key={track.id} value={track.id}>
                {track.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Tech Stack</label>
          <Select
            value={filters.tech_stack}
            onChange={(value) => setFilters({ ...filters, tech_stack: value || undefined })}
            style={{ width: '100%' }}
            placeholder="All Tech Stacks"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {uniqueTechStacks.map((techStack) => (
              <Option key={techStack} value={techStack}>
                {techStack}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Project</label>
          <Select
            value={filters.project_id}
            onChange={(value) => setFilters({ ...filters, project_id: value || undefined })}
            style={{ width: '100%' }}
            placeholder="All Projects"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {projectsList.map((project) => (
              <Option key={project.id} value={project.id}>
                {project.project_name || project.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Duration Start and End Date</label>
          <RangePicker
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </div>
      </Col>
    </Row>
  );
};

ExternalConsultantsFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  tracksList: PropTypes.array,
  projectsList: PropTypes.array,
  uniqueTechStacks: PropTypes.array,
};

export default ExternalConsultantsFilters;
