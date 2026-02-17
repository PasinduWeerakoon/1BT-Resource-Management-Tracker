/**
 * TrainingReportFilters Component
 * Filter section for Training Report
 */

import React from 'react';
import { Row, Col, Select } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;

/**
 * TrainingReportFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Array} props.tracks - List of tracks from Redux
 * @param {Array} props.techStacks - List of tech stacks from Redux
 */
const TrainingReportFilters = ({
  filters,
  setFilters,
  tracks = [],
  techStacks = [],
}) => {
  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Track</label>
          <Select
            value={filters.track}
            onChange={(value) => setFilters({ ...filters, track: value })}
            style={{ width: '100%' }}
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="All">All</Option>
            {tracks.map((track) => (
              <Option key={track.id} value={track.id} label={track.name || track.label}>
                {track.name || track.label}
              </Option>
            ))}
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
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="All">All</Option>
            {techStacks.map((techStack) => (
              <Option key={techStack.id} value={techStack.id} label={techStack.name || techStack.label}>
                {techStack.name || techStack.label}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
    </Row>
  );
};

TrainingReportFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  tracks: PropTypes.array,
  techStacks: PropTypes.array,
};

export default TrainingReportFilters;
