/**
 * Table Column Definitions for External Consultants Report
 */

import { Badge } from 'antd';

/**
 * BY PROJECT Table Columns
 */
export const getProjectColumns = () => [
  {
    title: 'Project Name',
    dataIndex: 'projectName',
    key: 'projectName',
    width: 200,
    sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
  },
  {
    title: 'Account Manager',
    dataIndex: 'accountManager',
    key: 'accountManager',
    width: 150,
  },
  {
    title: 'Consultant Count',
    dataIndex: 'consultantCount',
    key: 'consultantCount',
    width: 120,
    sorter: (a, b) => a.consultantCount - b.consultantCount,
  },
  {
    title: 'Total Allocation',
    dataIndex: 'totalAllocation',
    key: 'totalAllocation',
    width: 120,
  },
  {
    title: 'Billing Status',
    dataIndex: 'billingStatus',
    key: 'billingStatus',
    width: 120,
    render: (status) => (
      <Badge
        status={status === 'Billing' ? 'success' : 'default'}
        text={status}
      />
    ),
  },
  {
    title: 'Consultants',
    dataIndex: 'consultants',
    key: 'consultants',
    width: 300,
  },
];

/**
 * BY ALLOCATION Table Columns
 */
export const getAllocationColumns = () => [
  {
    title: 'Consultant Name',
    dataIndex: 'consultantName',
    key: 'consultantName',
    width: 180,
    sorter: (a, b) => (a.consultantName || '').localeCompare(b.consultantName || ''),
  },
  {
    title: 'Track',
    dataIndex: 'track',
    key: 'track',
    width: 120,
  },
  {
    title: 'Tech Stack',
    dataIndex: 'techStack',
    key: 'techStack',
    width: 150,
  },
  {
    title: 'Project',
    dataIndex: 'project',
    key: 'project',
    width: 200,
  },
  {
    title: 'Allocation %',
    dataIndex: 'allocationPercentage',
    key: 'allocationPercentage',
    width: 120,
    sorter: (a, b) => {
      const aVal = parseFloat(a.allocationPercentage) || 0;
      const bVal = parseFloat(b.allocationPercentage) || 0;
      return aVal - bVal;
    },
  },
  {
    title: 'Start Date',
    dataIndex: 'startDate',
    key: 'startDate',
    width: 120,
  },
  {
    title: 'End Date',
    dataIndex: 'endDate',
    key: 'endDate',
    width: 120,
  },
  {
    title: 'Duration (Days)',
    dataIndex: 'duration',
    key: 'duration',
    width: 120,
    sorter: (a, b) => a.duration - b.duration,
  },
  {
    title: 'Billing Status',
    dataIndex: 'billingStatus',
    key: 'billingStatus',
    width: 120,
    render: (status) => (
      <Badge
        status={status === 'Billing' ? 'success' : 'default'}
        text={status}
      />
    ),
  },
];
