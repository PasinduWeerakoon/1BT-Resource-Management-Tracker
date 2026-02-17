/**
 * LogsTable Component
 * Table component for displaying audit logs
 */

import React from 'react';
import { Card, Badge, Button, Space, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomTable from '@components/Table';
import PropTypes from 'prop-types';

/**
 * Get action badge component
 * @param {string} action - Action type
 * @returns {JSX.Element} Badge component
 */
const getActionBadge = (action) => {
  const actionMap = {
    CREATE: { status: 'success', text: 'CREATE' },
    UPDATE: { status: 'processing', text: 'UPDATE' },
    DELETE: { status: 'error', text: 'DELETE' },
    READ: { status: 'default', text: 'READ' },
  };

  const config = actionMap[action] || { status: 'default', text: action || 'UNKNOWN' };
  return <Badge status={config.status} text={config.text} />;
};

/**
 * LogsTable Component
 * @param {Object} props
 * @param {Array} props.auditLogs - Audit logs data
 * @param {Array} props.columns - Table columns (optional, will use default if not provided)
 * @param {Object} props.pagination - Pagination state
 * @param {Function} props.onPaginationChange - Pagination change handler
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onViewDetail - View detail handler
 */
const LogsTable = ({
  auditLogs,
  columns,
  pagination,
  onPaginationChange,
  loading,
  onViewDetail,
}) => {
  // Default columns if not provided
  const defaultColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateA - dateB;
      },
      render: (text) => (text ? dayjs(text).format('DD MMM YYYY HH:mm:ss') : 'N/A'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => getActionBadge(action),
    },
    {
      title: 'Entity Type',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 150,
    },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onViewDetail(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tableColumns = columns || defaultColumns;

  return (
    <Card className="table-card" title="Audit Logs">
      <CustomTable
        columns={tableColumns}
        dataSource={auditLogs}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={onPaginationChange}
        scroll={{ x: 1200 }}
        size="small"
        loading={loading}
      />
    </Card>
  );
};

LogsTable.propTypes = {
  auditLogs: PropTypes.array.isRequired,
  columns: PropTypes.array,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onViewDetail: PropTypes.func.isRequired,
};

export default LogsTable;
