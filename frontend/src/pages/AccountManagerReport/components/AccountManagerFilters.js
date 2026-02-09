/**
 * AccountManagerFilters Component
 * Filter section for Account Manager Report
 */

import React from 'react';
import { Row, Col, Select } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;

/**
 * AccountManagerFilters Component
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.setFilters - Set filters function
 * @param {Array} props.accountManagersList - List of account managers
 * @param {Array} props.projectsForFilter - List of projects for filter
 * @param {Array} props.clientsList - List of clients
 * @param {Array} props.techStacksList - List of tech stacks
 * @param {Array} props.projectStatusesList - List of project statuses
 * @param {Array} props.billingStatusesList - List of billing statuses
 * @param {boolean} props.loadingAccountManagers - Loading state for account managers
 * @param {boolean} props.loadingProjectsForFilter - Loading state for projects
 */
const AccountManagerFilters = ({
  filters,
  setFilters,
  accountManagersList = [],
  projectsForFilter = [],
  clientsList = [],
  techStacksList = [],
  projectStatusesList = [],
  billingStatusesList = [],
  loadingAccountManagers = false,
  loadingProjectsForFilter = false,
}) => {
  return (
    <Row gutter={[16, 16]} className="filters-row">
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Account Manager</label>
          <Select
            value={filters.accountManager}
            onChange={(value) => setFilters({ ...filters, accountManager: value })}
            style={{ width: '100%' }}
            loading={loadingAccountManagers}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Select Account Manager"
          >
            <Option value="All">All</Option>
            {accountManagersList.map((am) => (
              <Option key={am.id} value={am.id} label={am.name}>
                {am.name}
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
            loading={loadingProjectsForFilter}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Select Project"
          >
            <Option value="All">All</Option>
            {projectsForFilter.map((project) => (
              <Option key={project.id} value={project.id} label={project.name}>
                {project.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Project Status</label>
          <Select
            value={filters.projectStatus}
            onChange={(value) => setFilters({ ...filters, projectStatus: value })}
            style={{ width: '100%' }}
            placeholder="Select Project Status"
          >
            <Option value="All">All</Option>
            {projectStatusesList.map((status) => (
              <Option key={status.id} value={status.id}>
                {status.name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Client Name</label>
          <Select
            value={filters.clientName}
            onChange={(value) => setFilters({ ...filters, clientName: value })}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Select Client"
          >
            <Option value="All">All</Option>
            {clientsList.map((client) => (
              <Option key={client.id} value={client.id} label={client.client_name}>
                {client.client_name}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <div className="filter-item">
          <label>Billing Status</label>
          <Select
            value={filters.billingStatus}
            onChange={(value) => setFilters({ ...filters, billingStatus: value })}
            style={{ width: '100%' }}
            placeholder="Select Billing Status"
          >
            <Option value="All">All</Option>
            {billingStatusesList.map((status) => (
              <Option key={status.id} value={status.id}>
                {status.name}
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
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Select Tech Stack"
          >
            <Option value="All">All</Option>
            {techStacksList.map((techStack) => (
              <Option key={techStack.id} value={techStack.id}>
                {techStack.name || techStack.label}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
    </Row>
  );
};

AccountManagerFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  accountManagersList: PropTypes.array,
  projectsForFilter: PropTypes.array,
  clientsList: PropTypes.array,
  techStacksList: PropTypes.array,
  projectStatusesList: PropTypes.array,
  billingStatusesList: PropTypes.array,
  loadingAccountManagers: PropTypes.bool,
  loadingProjectsForFilter: PropTypes.bool,
};

export default AccountManagerFilters;
