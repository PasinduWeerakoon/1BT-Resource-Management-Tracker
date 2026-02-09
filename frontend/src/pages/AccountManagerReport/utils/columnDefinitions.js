/**
 * Column Definitions for AccountManagerReport tables
 */

import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserAddOutlined,
} from '@ant-design/icons';

/**
 * Get project table columns
 * @param {Object} handlers - { onEdit, onAddTeamMembers }
 */
export const getProjectColumns = ({ onEdit, onAddTeamMembers }) => [
  {
    title: 'Project',
    dataIndex: 'project',
    key: 'project',
    width: 150,
  },
  {
    title: 'Customer',
    dataIndex: 'customer',
    key: 'customer',
    width: 150,
  },
  {
    title: 'Project Type',
    dataIndex: 'projectType',
    key: 'projectType',
    width: 150,
  },
  {
    title: 'Team Size',
    dataIndex: 'teamSize',
    key: 'teamSize',
    width: 120,
  },
  {
    title: 'Allocated Resource Count',
    dataIndex: 'allocatedResourceCount',
    key: 'allocatedResourceCount',
    width: 180,
    align: 'center',
    render: (count) => count ?? 0,
  },
  {
    title: 'Billing Count',
    dataIndex: 'billingCount',
    key: 'billingCount',
    width: 130,
    align: 'center',
    render: (count) => count ?? 0,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    fixed: 'right',
    align: 'center',
    render: (_, record) => (
      <Space size="small" style={{ justifyContent: 'center', width: '100%' }}>
        <Tooltip title="Edit">
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); onEdit(record); }}
            size="small"
            className="action-icon-btn"
          />
        </Tooltip>
        <Tooltip title="Add Members">
          <Button
            type="default"
            icon={<UserAddOutlined />}
            onClick={(e) => { e.stopPropagation(); onAddTeamMembers(record); }}
            size="small"
            className="action-icon-btn"
          />
        </Tooltip>
      </Space>
    ),
  },
];

/**
 * Get allocation (BY ALLOCATION) table columns
 * @param {Object} handlers - { onView, onEdit, onDelete }
 */
export const getAllocationColumns = ({ onView, onEdit, onDelete }) => [
  {
    title: 'Employee Name',
    dataIndex: 'employeeName',
    key: 'employeeName',
    width: 180,
  },
  {
    title: 'Project',
    dataIndex: 'project',
    key: 'project',
    width: 150,
  },
  {
    title: 'Project Allocated Date',
    dataIndex: 'allocatedDate',
    key: 'allocatedDate',
    width: 160,
  },
  {
    title: 'Project Deallocated Date',
    dataIndex: 'deallocatedDate',
    key: 'deallocatedDate',
    width: 180,
  },
  {
    title: 'Billing Status',
    dataIndex: 'billingStatus',
    key: 'billingStatus',
    width: 130,
  },
  {
    title: 'Billing Percentage',
    dataIndex: 'billingPercentage',
    key: 'billingPercentage',
    width: 140,
  },
  {
    title: 'Total Billing',
    dataIndex: 'totalBilling',
    key: 'totalBilling',
    width: 140,
  },
  {
    title: 'Project Allocation',
    dataIndex: 'projectAllocation',
    key: 'projectAllocation',
    width: 140,
  },
  {
    title: 'Total Allocation',
    dataIndex: 'totalAllocation',
    key: 'totalAllocation',
    width: 140,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: 'Last Updated',
    dataIndex: 'lastUpdated',
    key: 'lastUpdated',
    width: 140,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    align: 'center',
    fixed: 'right',
    render: (_, record) => (
      <Space size="small" style={{ justifyContent: 'center', width: '100%' }}>
        <Tooltip title="View Allocations">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); onView(record); }}
            className="action-icon-btn"
            size="small"
          />
        </Tooltip>
        <Tooltip title="Edit">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); onEdit(record); }}
            className="action-icon-btn"
            size="small"
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={(e) => { e.stopPropagation(); onDelete(record); }}
            className="action-icon-btn"
            danger
            size="small"
          />
        </Tooltip>
      </Space>
    ),
  },
];

/**
 * Get resource allocation detail columns (for the Resource Allocations Modal - active)
 */
export const getResourceAllocationColumns = () => [
  {
    title: 'Project',
    dataIndex: 'project',
    key: 'project',
    width: 200,
    ellipsis: true,
  },
  {
    title: 'Allocated Date',
    dataIndex: 'allocatedDate',
    key: 'allocatedDate',
    width: 140,
  },
  {
    title: 'Deallocated Date',
    dataIndex: 'deallocatedDate',
    key: 'deallocatedDate',
    width: 150,
  },
  {
    title: 'Billing Status',
    dataIndex: 'billingStatus',
    key: 'billingStatus',
    width: 120,
    render: (text) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: text === 'Billing' ? '#e6f7ff' :
          text === 'Bench' ? '#fff7e6' :
            text === 'Presale' ? '#f9f0ff' : '#f0f0f0',
        color: text === 'Billing' ? '#1890ff' :
          text === 'Bench' ? '#fa8c16' :
            text === 'Presale' ? '#722ed1' : '#595959'
      }}>
        {text}
      </span>
    ),
  },
  {
    title: 'Billing %',
    dataIndex: 'billingPercentage',
    key: 'billingPercentage',
    width: 100,
    align: 'center',
  },
  {
    title: 'Allocation %',
    dataIndex: 'projectAllocation',
    key: 'projectAllocation',
    width: 110,
    align: 'center',
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    width: 90,
    align: 'center',
    render: (days) => `${days} days`,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 90,
    align: 'center',
    render: (text) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: text === 'Active' ? '#f6ffed' : '#fff1f0',
        color: text === 'Active' ? '#52c41a' : '#ff4d4f'
      }}>
        {text}
      </span>
    ),
  },
];

/**
 * Get future allocation columns (for the Resource Allocations Modal - future)
 */
export const getFutureAllocationColumns = () => [
  {
    title: 'Project',
    dataIndex: 'project',
    key: 'project',
    width: 180,
    ellipsis: true,
  },
  {
    title: 'Effective Date',
    dataIndex: 'effectiveDate',
    key: 'effectiveDate',
    width: 130,
    render: (text, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{text}</div>
        <div style={{ fontSize: 11, color: '#8c8c8c', fontStyle: 'italic' }}>
          {record.daysUntilActivation > 0
            ? `in ${record.daysUntilActivation} days`
            : 'activates today'}
        </div>
      </div>
    ),
  },
  {
    title: 'Allocated Date',
    dataIndex: 'allocatedDate',
    key: 'allocatedDate',
    width: 130,
  },
  {
    title: 'Deallocated Date',
    dataIndex: 'deallocatedDate',
    key: 'deallocatedDate',
    width: 140,
  },
  {
    title: 'Billing Status',
    dataIndex: 'billingStatus',
    key: 'billingStatus',
    width: 120,
    render: (text) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: text === 'Billing' ? '#e6f7ff' :
          text === 'Bench' ? '#fff7e6' :
            text === 'Presale' ? '#f9f0ff' : '#f0f0f0',
        color: text === 'Billing' ? '#1890ff' :
          text === 'Bench' ? '#fa8c16' :
            text === 'Presale' ? '#722ed1' : '#595959'
      }}>
        {text}
      </span>
    ),
  },
  {
    title: 'Allocation %',
    dataIndex: 'projectAllocation',
    key: 'projectAllocation',
    width: 110,
    align: 'center',
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    width: 90,
    align: 'center',
    render: (days) => `${days} days`,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center',
    render: (text) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: '#fffbe6',
        color: '#faad14'
      }}>
        {text}
      </span>
    ),
  },
];
