/**
 * TierBreakdownFilters Component
 * Filter section for Tier Breakdown Report
 */

import React from 'react';
import { Row, Col, Select } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;

/**
 * TierBreakdownFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Array} props.projects - List of projects
 * @param {Array} props.accountManagers - List of account managers
 * @param {Array} props.tracks - List of tracks
 * @param {Array} props.tiers - List of tiers
 * @param {Array} props.techStacks - List of tech stacks
 * @param {boolean} props.loadingProjects - Loading state for projects
 * @param {boolean} props.loadingAccountManagers - Loading state for account managers
 */
const TierBreakdownFilters = ({
  filters,
  setFilters,
  projects = [],
  accountManagers = [],
  tracks = [],
  tiers = [],
  techStacks = [],
  loadingProjects = false,
  loadingAccountManagers = false,
}) => {
  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Tier</label>
          <Select
            value={filters.tier}
            onChange={(value) => setFilters({ ...filters, tier: value })}
            style={{ width: '100%' }}
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="All">All</Option>
            {tiers.map((tier) => (
              <Option key={tier.id} value={tier.name} label={tier.name}>
                {tier.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Project Name</label>
          <Select
            value={filters.projectName}
            onChange={(value) => setFilters({ ...filters, projectName: value })}
            style={{ width: '100%' }}
            loading={loadingProjects}
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="All">All</Option>
            {projects.map((project) => (
              <Option key={project.id} value={project.name} label={project.name}>
                {project.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Account Manager</label>
          <Select
            value={filters.accountManager}
            onChange={(value) => setFilters({ ...filters, accountManager: value })}
            style={{ width: '100%' }}
            loading={loadingAccountManagers}
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="All">All</Option>
            {accountManagers.map((am) => (
              <Option key={am.id} value={am.name} label={am.name}>
                {am.name}
              </Option>
            ))}
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
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="All">All</Option>
            {tracks.map((track) => (
              <Option key={track.id} value={track.name} label={track.name}>
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
              <Option key={techStack.name} value={techStack.name} label={techStack.name}>
                {techStack.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
    </Row>
  );
};

TierBreakdownFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  projects: PropTypes.array,
  accountManagers: PropTypes.array,
  tracks: PropTypes.array,
  tiers: PropTypes.array,
  techStacks: PropTypes.array,
  loadingProjects: PropTypes.bool,
  loadingAccountManagers: PropTypes.bool,
};

export default TierBreakdownFilters;
