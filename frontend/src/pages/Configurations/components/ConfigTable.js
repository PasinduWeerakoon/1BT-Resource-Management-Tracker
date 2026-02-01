/**
 * ConfigTable Component
 * Reusable table component for configuration items
 */

import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';

/**
 * Configuration Table Component
 * @param {Object} props
 * @param {Array} props.columns - Table columns
 * @param {Array} props.dataSource - Table data
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Object} props.pagination - Pagination config
 * @param {Object} props.scroll - Scroll config
 * @param {string} props.title - Table title
 * @param {string} props.addButtonText - Add button text
 * @param {Function} props.onAdd - Add handler
 * @param {React.ReactNode} props.extraActions - Extra actions in header
 */
const ConfigTable = ({
  columns,
  dataSource,
  loading,
  onEdit,
  onDelete,
  pagination = { pageSize: 20 },
  scroll = { x: 600 },
  title,
  addButtonText = 'Add New',
  onAdd,
  extraActions,
}) => {
  // Add action column if edit or delete handlers are provided
  const tableColumns = [...columns];
  
  if (onEdit || onDelete) {
    tableColumns.push({
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          {onEdit && (
            <Tooltip title="Edit">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    });
  }

  return (
    <div>
      <div className="table-header-section">
        <div className="table-header-left">
          {title && <span className="table-title">{title}</span>}
        </div>
        <div className="table-header-actions">
          <Space>
            {extraActions}
            {onAdd && (
              <Button type="primary" onClick={onAdd}>
                {addButtonText}
              </Button>
            )}
          </Space>
        </div>
      </div>
      <CustomTable
        columns={tableColumns}
        dataSource={dataSource}
        scroll={scroll}
        loading={loading}
        pagination={pagination}
      />
    </div>
  );
};

export default ConfigTable;
