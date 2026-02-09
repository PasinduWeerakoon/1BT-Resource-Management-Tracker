/**
 * AllocationsTable Component
 * BY ALLOCATION card with table, pagination, and add button
 */

import React from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';

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

export default React.memo(AllocationsTable);
