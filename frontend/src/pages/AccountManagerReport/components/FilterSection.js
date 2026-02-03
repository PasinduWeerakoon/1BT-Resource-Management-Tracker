/**
 * FilterSection Component
 * Filter UI for AccountManagerReport
 */

import React from 'react';
import { Card, Select, Row, Col, Badge, Button } from 'antd';
import { FilterOutlined, ReloadOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';

const { Option } = Select;

const FilterSection = ({
  filters,
  filtersExpanded,
  activeFiltersCount,
  onToggleExpanded,
  onFilterChange,
  onResetFilters,
  accountManagersList,
  loadingAccountManagers,
  projectsForFilter,
  loadingProjectsForFilter,
  clientsList,
}) => {
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
                onClick={(e) => {
                  e.stopPropagation();
                  onResetFilters(e);
                }}
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
                <label>Account Manager</label>
                <Select
                  value={filters.accountManager}
                  onChange={(value) => onFilterChange('accountManager', value)}
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
                  onChange={(value) => onFilterChange('projectName', value)}
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
                  onChange={(value) => onFilterChange('projectStatus', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Allocation Status</label>
                <Select
                  value={filters.allocationStatus}
                  onChange={(value) => onFilterChange('allocationStatus', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className="filter-item">
                <label>Client Name</label>
                <Select
                  value={filters.clientName}
                  onChange={(value) => onFilterChange('clientName', value)}
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
                  onChange={(value) => onFilterChange('billingStatus', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="All">All</Option>
                  <Option value="Billing">Billing</Option>
                  <Option value="Non-Billing">Non-Billing</Option>
                  <Option value="Bench">Bench</Option>
                  <Option value="Training">Training</Option>
                  <Option value="Presale">Presale</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(FilterSection);
