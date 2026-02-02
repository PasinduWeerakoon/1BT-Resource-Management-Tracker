/**
 * Configurations Page
 * Main page that manages configuration tabs
 * Organized into two main categories: Employee and Project configurations
 * Each category has its own sub-tabs
 */

import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { UserOutlined, ProjectOutlined } from '@ant-design/icons';
import '@styles/pages/Configurations.scss';

// Import all tab components
// Employee-related tabs
import DesignationsTab from './Tabs/DesignationsTab';
import TracksTab from './Tabs/TracksTab';
import TiersTab from './Tabs/TiersTab';
import TagsTab from './Tabs/TagsTab';

// Project-related tabs
import ProjectsTab from './Tabs/ProjectsTab';
import ClientsTab from './Tabs/ClientsTab';
import BillingStatusesTab from './Tabs/BillingStatusesTab';
import ProjectTypesTab from './Tabs/ProjectTypesTab';

const Configurations = () => {
  // State for main category tab (employee or project)
  const [activeCategory, setActiveCategory] = useState('employee');
  // State for sub-tabs within each category
  const [activeEmployeeTab, setActiveEmployeeTab] = useState('designations');
  const [activeProjectTab, setActiveProjectTab] = useState('clients');

  // Employee configuration sub-tabs
  const employeeTabItems = [
    {
      key: 'designations',
      label: 'Designations',
      children: <DesignationsTab />,
    },
    {
      key: 'tiers',
      label: 'Tier',
      children: <TiersTab />,
    },
    {
      key: 'tracks',
      label: 'Tracks',
      children: <TracksTab />,
    },
    {
      key: 'tags',
      label: 'Tags',
      children: <TagsTab />,
    },
  ];

  // Project configuration sub-tabs
  const projectTabItems = [
    {
      key: 'clients',
      label: 'Clients',
      children: <ClientsTab />,
    },
    {
      key: 'projects',
      label: 'Projects',
      children: <ProjectsTab />,
    },
    {
      key: 'project-types',
      label: 'Project Type',
      children: <ProjectTypesTab />,
    },
    {
      key: 'billing-statuses',
      label: 'Billing Status',
      children: <BillingStatusesTab />,
    },
  ];

  // Main category tabs
  const categoryTabItems = [
    {
      key: 'employee',
      label: (
        <span>
          <UserOutlined /> Employee Configurations
        </span>
      ),
      children: (
        <Tabs
          activeKey={activeEmployeeTab}
          onChange={setActiveEmployeeTab}
          items={employeeTabItems}
          type="card"
        />
      ),
    },
    {
      key: 'project',
      label: (
        <span>
          <ProjectOutlined /> Project Configurations
        </span>
      ),
      children: (
        <Tabs
          activeKey={activeProjectTab}
          onChange={setActiveProjectTab}
          items={projectTabItems}
          type="card"
        />
      ),
    },
  ];

  return (
    <div className="configurations-page">
      <div className="configurations-header">
        <h1 className="page-title">CONFIGURATIONS</h1>
      </div>

      <Card className="configurations-content-card">
        <Tabs
          activeKey={activeCategory}
          onChange={setActiveCategory}
          items={categoryTabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default Configurations;
