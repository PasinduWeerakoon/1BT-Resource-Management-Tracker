/**
 * AllocationsTable Component
 * BY ALLOCATION card with table, pagination, and add button
 */

import React from 'react';
import { Card, Button, Select } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import PropTypes from 'prop-types';

const { Option } = Select;

const ALLOCATION_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const AllocationsTable = ({
  allocationData,
  allocationColumns,
  allocationPagination,
  loadingAllocations,
  expanded,
  onToggleExpanded,
  onAddAllocation,
  onRowClick,
  onPaginationChange,
  displayProjectName,
  allocationStatusFilter = 'Active',
  onAllocationStatusFilterChange,
  isAdmin = false,
}) => {
  return (
    <Card
      className="table-card"
      title={
        <div className="project-overview-header">
          <span className="project-overview-title">
            BY ALLOCATION
            {displayProjectName && (
              <span style={{ marginLeft: '8px', color: '#1890ff', fontWeight: 'normal' }}>
                - {displayProjectName}
              </span>
            )}
          </span>
          <div className="project-overview-actions">
            {expanded && (
              <div className="allocation-status-filter">
                <label htmlFor="allocation-status-select">Status</label>
                <Select
                  id="allocation-status-select"
                  value={allocationStatusFilter}
                  onChange={onAllocationStatusFilterChange}
                  style={{ width: 120 }}
                >
                  {ALLOCATION_STATUS_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
            {expanded && isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAddAllocation}
                className="create-project-btn"
              >
                Add Allocation
              </Button>
            )}
            <div className="collapsible-icon" onClick={onToggleExpanded}>
              {expanded ? <UpOutlined /> : <DownOutlined />}
            </div>
          </div>
        </div>
      }
    >
      {expanded && (
        <CustomTable
          columns={allocationColumns}
          dataSource={allocationData}
          pagination={{
            current: allocationPagination.current,
            pageSize: allocationPagination.pageSize,
            total: allocationPagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} allocations`,
            onChange: (page, pageSize) => onPaginationChange(page, pageSize),
            onShowSizeChange: (_, size) => onPaginationChange(1, size),
          }}
          scroll={{ x: 1200 }}
          size="small"
          loading={loadingAllocations}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      )}
    </Card>
  );
};

AllocationsTable.propTypes = {
  allocationData: PropTypes.array.isRequired,
  allocationColumns: PropTypes.array.isRequired,
  allocationPagination: PropTypes.object.isRequired,
  loadingAllocations: PropTypes.bool,
  expanded: PropTypes.bool.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
  onAddAllocation: PropTypes.func.isRequired,
  onRowClick: PropTypes.func.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
  displayProjectName: PropTypes.string,
  allocationStatusFilter: PropTypes.string,
  onAllocationStatusFilterChange: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

export default React.memo(AllocationsTable);
