/**
 * ChartsSection Component
 * Charts for AccountManagerReport
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';

const ChartsSection = ({
  billingStatusExpanded,
  employeesByTierExpanded,
  onToggleBillingStatus,
  onToggleEmployeesByTier,
  billingStatusDonutData,
  billingStatusDonutOptions,
  employeesByTierBarData,
  employeesByTierBarOptions,
}) => {
  return (
    <Row gutter={[16, 16]} className="charts-tables-section">
      {/* Left Column - Charts */}
      <Col xs={24} lg={12}>
        <Card
          className="chart-card"
          title={
            <div
              className="collapsible-header"
              onClick={onToggleBillingStatus}
            >
              <span>No. of Allocations by Billing Status</span>
              {billingStatusExpanded ? <UpOutlined /> : <DownOutlined />}
            </div>
          }
        >
          {billingStatusExpanded && (
            <div className="chart-container">
              <Doughnut data={billingStatusDonutData} options={billingStatusDonutOptions} />
            </div>
          )}
        </Card>
      </Col>

      {/* Right Column - Bar Chart */}
      <Col xs={24} lg={12}>
        <Card
          className="chart-card"
          title={
            <div
              className="collapsible-header"
              onClick={onToggleEmployeesByTier}
            >
              <span>No. of Employees by Tier</span>
              {employeesByTierExpanded ? <UpOutlined /> : <DownOutlined />}
            </div>
          }
        >
          {employeesByTierExpanded && (
            <div className="chart-container">
              <Bar data={employeesByTierBarData} options={employeesByTierBarOptions} />
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ChartsSection);
