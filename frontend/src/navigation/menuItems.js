import React from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ExceptionOutlined,
  PieChartOutlined,
  HistoryOutlined,
  BookOutlined,
  GlobalOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';

export const getMenuItems = (role) => {
  const reportItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Summary',
    },
    {
      key: '/account-manager-report',
      icon: <UserOutlined />,
      label: 'Account Manager Report',
    },
    {
      key: '/bench-report',
      icon: <BarChartOutlined />,
      label: 'Bench Report',
    },
    {
      key: '/non-billing-report',
      icon: <FileTextOutlined />,
      label: 'Non-Billing Report',
    },
    {
      key: '/tier-breakdown-report',
      icon: <PieChartOutlined />,
      label: 'Tier Breakdown Report',
    },
    {
      key: '/exception-allocation-report',
      icon: <ExceptionOutlined />,
      label: 'Exception-Allocation Report',
    },
    {
      key: '/intern-report',
      icon: <UserOutlined />,
      label: 'Intern Report',
    },
    // Temporarily hidden - will be enabled later
    // {
    //   key: '/allocation-history',
    //   icon: <HistoryOutlined />,
    //   label: 'Allocation History',
    // },
    {
      key: '/training-report',
      icon: <BookOutlined />,
      label: 'Training Report',
    },
    {
      key: '/external-consultants-report',
      icon: <GlobalOutlined />,
      label: 'External Consultants Report',
    },
    {
      key: '/employee-report',
      icon: <UserOutlined />,
      label: 'Employee Report',
    },
    {
      key: '/monthly-allocation-report',
      icon: <CalendarOutlined />,
      label: 'Monthly Allocation Report',
    },
    {
      key: '/presale-report',
      icon: <ShoppingOutlined />,
      label: 'PreSale Report',
    },
  ];

  // Determine which items to show based on role
  // All roles now only see report items
  return reportItems;
};
