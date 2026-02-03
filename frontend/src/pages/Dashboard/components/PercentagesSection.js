import React from 'react';
import { Row, Col } from 'antd';
import { PercentageOutlined } from '@ant-design/icons';
import MetricCard from './MetricCard';
import { UI } from '@constants/app';

const PercentagesSection = ({ percentages, labels }) => {
  const items = [
    { key: 'allocationPercentage', label: labels.ALLOCATION_PERCENTAGE },
    { key: 'billablePercentage', label: labels.BILLABLE_PERCENTAGE },
    { key: 'shadowPercentage', label: labels.SHADOW_PERCENTAGE },
  ];

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>{labels.PERCENTAGES}</h2>
      </div>
      <Row gutter={[UI.GUTTER_MEDIUM, UI.GUTTER_MEDIUM]} className="percentage-cards">
        {items.map((item) => (
          <Col key={item.key} xs={24} sm={12} md={8}>
            <MetricCard
              className="percentage-card"
              icon={<PercentageOutlined className="metric-icon" />}
              value={`${percentages?.[item.key] ?? 0}%`}
              label={item.label}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PercentagesSection;
