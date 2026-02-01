/**
 * Configurations Page
 * Main page that manages configuration tabs
 * Refactored from 4065 lines to ~150 lines using tab components
 */

import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import '@styles/pages/Configurations.scss';

// Import all tab components
import ProjectsTab from './Tabs/ProjectsTab';
import ClientsTab from './Tabs/ClientsTab';
import DesignationsTab from './Tabs/DesignationsTab';
import TracksTab from './Tabs/TracksTab';
import TiersTab from './Tabs/TiersTab';
import TagsTab from './Tabs/TagsTab';
import BillingStatusesTab from './Tabs/BillingStatusesTab';
import ProjectTypesTab from './Tabs/ProjectTypesTab';
import AccountTypesTab from './Tabs/AccountTypesTab';
import ProjectStatusesTab from './Tabs/ProjectStatusesTab';

const Configurations = () => {
  const [activeTab, setActiveTab] = useState('project-types');

  const tabItems = [
    {
      key: 'project-types',
      label: 'Projects',
      children: <ProjectsTab />,
    },
    {
      key: 'clients',
      label: 'Clients',
      children: <ClientsTab />,
    },
    {
      key: 'designations',
      label: 'Designations',
      children: <DesignationsTab />,
    },
    {
      key: 'tracks',
      label: 'Tracks',
      children: <TracksTab />,
    },
    {
      key: 'tiers',
      label: 'Tier',
      children: <TiersTab />,
    },
    {
      key: 'tags',
      label: 'Tags',
      children: <TagsTab />,
    },
    {
      key: 'billing-statuses',
      label: 'Billing Status',
      children: <BillingStatusesTab />,
    },
    {
      key: 'project-types-config',
      label: 'Project Type',
      children: <ProjectTypesTab />,
    },
    {
      key: 'account-types',
      label: 'Account Type',
      children: <AccountTypesTab />,
    },
    {
      key: 'project-statuses',
      label: 'Project Status',
      children: <ProjectStatusesTab />,
    },
  ];

  return (
    <div className="configurations-page">
      <div className="configurations-header">
        <h1 className="page-title">CONFIGURATIONS</h1>
      </div>

      <Card className="configurations-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default Configurations;
