import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import MetricCard from './MetricCard';

const ResourceCountsSection = ({ counts, labels }) => {
  const items = [
    { key: 'billingResourceCount', label: labels.BILLING_RESOURCE_COUNT },
    { key: 'allocatedResourceCount', label: labels.ALLOCATED_RESOURCE_COUNT },
    { key: 'billableResourceCount', label: labels.BILLABLE_RESOURCE_COUNT },
    { key: 'shadowCount', label: labels.SHADOW_COUNT },
    { key: 'internalNonBillingCount', label: labels.INTERNAL_NON_BILLING_COUNT },
    { key: 'externalConsultantCount', label: labels.EXTERNAL_CONSULTANT_COUNT },
    { key: 'benchResourceCount', label: labels.BENCH_RESOURCE_COUNT },
    { key: 'trainingResourceCount', label: labels.TRAINING_RESOURCE_COUNT },
    { key: 'internsCount', label: labels.INTERNS },
    { key: 'synergyCount', label: labels.SYNERGY },
    { key: 'sharedServicesCount', label: labels.SHARED_SERVICES },
  ];

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>{labels.RESOURCE_COUNTS}</h2>
      </div>
      <div className="resource-cards-container">
        <div className="resource-cards-grid">
          {items.map((item) => (
            <MetricCard
              key={item.key}
              icon={<UserOutlined className="metric-icon" />}
              value={counts?.[item.key] ?? 0}
              label={item.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceCountsSection;
