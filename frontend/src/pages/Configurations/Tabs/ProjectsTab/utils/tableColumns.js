/**
 * Projects Tab Table Column Definitions
 */

import React from 'react';
import { Badge } from 'antd';
import dayjs from 'dayjs';

/**
 * Get project table columns
 * @returns {Array} Table columns configuration
 */
export const getProjectColumns = () => [
  {
    title: 'Project Name',
    dataIndex: 'project_name',
    key: 'project_name',
    width: 200,
    fixed: 'left',
  },
  {
    title: 'Project Code',
    dataIndex: 'project_code',
    key: 'project_code',
    width: 150,
  },
  {
    title: 'Client',
    dataIndex: 'client_name',
    key: 'client_name',
    width: 200,
  },
  {
    title: 'Account Manager',
    dataIndex: 'account_manager_name',
    key: 'account_manager_name',
    width: 180,
    render: (name) => name || '-',
  },
  {
    title: 'Type',
    dataIndex: 'project_type',
    key: 'project_type',
    width: 120,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status) => {
      const colorMap = {
        'Active': 'green',
        'On Hold': 'orange',
        'Completed': 'blue',
        'Cancelled': 'red',
      };
      return <Badge status={colorMap[status] || 'default'} text={status} />;
    },
  },
  {
    title: 'Billable',
    dataIndex: 'is_billable',
    key: 'is_billable',
    width: 100,
    render: (isBillable) => (isBillable ? 'Yes' : 'No'),
  },
  {
    title: 'Start Date',
    dataIndex: 'start_date',
    key: 'start_date',
    width: 120,
    render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
  },
  {
    title: 'End Date',
    dataIndex: 'end_date',
    key: 'end_date',
    width: 120,
    render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
  },
];
