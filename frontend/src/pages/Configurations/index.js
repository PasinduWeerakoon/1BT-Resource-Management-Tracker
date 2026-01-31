import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import {
  ProjectsTab,
  ClientsTab,
  DesignationsTab,
  TracksTab,
  TagsTab,
  BillingStatusesTab,
  ProjectTypesConfigTab,
} from './tabs';
import '@styles/pages/Configurations.scss';

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
      key: 'tags',
      label: 'Tags',
      children: <TagsTab />,
    },
    {
      key: 'billing-statuses',
      label: 'Billing Statuses',
      children: <BillingStatusesTab />,
    },
    {
      key: 'project-types-config',
      label: 'Project Types',
      children: <ProjectTypesConfigTab />,
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

