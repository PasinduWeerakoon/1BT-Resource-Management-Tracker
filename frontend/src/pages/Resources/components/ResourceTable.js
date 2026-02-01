/**
 * ResourceTable Component
 * Table component for displaying resources/employees
 * Optimized with React.memo and useMemo for better performance
 */

import React, { useMemo, useCallback } from 'react';
import { Space, Button, Tooltip, Badge, Switch } from 'antd';
import { EditOutlined, EyeOutlined, SettingOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import dayjs from 'dayjs';

const ResourceTable = ({
  employees,
  loading,
  pagination,
  onPaginationChange,
  onEdit,
  onViewProfile,
  onQuickActions,
  onToggleAccountManager,
  updatingAccountManager,
  columns: customColumns,
}) => {
  // Memoize default columns to avoid recreation on every render
  const defaultColumns = useMemo(() => [
    {
      title: 'Employee Number',
      dataIndex: 'employeeNumber',
      key: 'employeeNumber',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 200,
    },
    {
      title: 'Tech Stack',
      dataIndex: 'tech_stack',
      key: 'tech_stack',
      width: 150,
      render: (techStack) => techStack || '-',
    },
    {
      title: 'Employee Type',
      dataIndex: 'employee_type',
      key: 'employee_type',
      width: 120,
      render: (type) => (
        <Badge
          status={type === 'Internal' ? 'success' : 'warning'}
          text={type || 'Internal'}
        />
      ),
      filters: [
        { text: 'Internal', value: 'Internal' },
        { text: 'External', value: 'External' },
      ],
      onFilter: (value, record) => record.employee_type === value,
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
      render: (date) => date || '-',
      sorter: (a, b) => {
        if (!a.joinDate) return 1;
        if (!b.joinDate) return -1;
        return dayjs(a.joinDate).unix() - dayjs(b.joinDate).unix();
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: 'Account Manager',
      key: 'accountManager',
      width: 130,
      render: (_, record) => (
        <Switch
          checked={record.is_account_manager || false}
          onChange={(checked) => onToggleAccountManager(record, checked)}
          checkedChildren="Yes"
          unCheckedChildren="No"
          loading={updatingAccountManager[record.id]}
          disabled={updatingAccountManager[record.id]}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Profile">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onViewProfile(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Quick Actions">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => onQuickActions(record)}
              className="action-icon-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [onEdit, onViewProfile, onQuickActions, onToggleAccountManager, updatingAccountManager]);

  // Memoize columns
  const columns = useMemo(() => customColumns || defaultColumns, [customColumns, defaultColumns]);

  // Memoize pagination config
  const paginationConfig = useMemo(() => ({
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
    onChange: onPaginationChange,
    onShowSizeChange: (current, size) => {
      onPaginationChange(1, size);
    },
  }), [pagination, onPaginationChange]);

  // Memoize scroll config
  const scrollConfig = useMemo(() => ({ x: 1000 }), []);

  return (
    <CustomTable
      columns={columns}
      dataSource={employees}
      scroll={scrollConfig}
      loading={loading}
      pagination={paginationConfig}
    />
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ResourceTable);
