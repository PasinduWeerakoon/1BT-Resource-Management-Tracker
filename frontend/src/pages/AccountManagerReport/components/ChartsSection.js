/**
 * ChartsSection Component
 * Charts for AccountManagerReport
 * 
 * @param {Object} props
 * @param {boolean} props.billingStatusExpanded - Whether billing status chart is expanded
 * @param {boolean} props.employeesByTierExpanded - Whether employees by tier chart is expanded
 * @param {Function} props.onToggleBillingStatus - Toggle billing status chart handler
 * @param {Function} props.onToggleEmployeesByTier - Toggle employees by tier chart handler
 * @param {Object} props.billingStatusDonutData - Data for billing status donut chart
 * @param {Object} props.billingStatusDonutOptions - Options for billing status donut chart
 * @param {Object} props.employeesByTierBarData - Data for employees by tier bar chart
 * @param {Object} props.employeesByTierBarOptions - Options for employees by tier bar chart
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';

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

ChartsSection.propTypes = {
  billingStatusExpanded: PropTypes.bool.isRequired,
  employeesByTierExpanded: PropTypes.bool.isRequired,
  onToggleBillingStatus: PropTypes.func.isRequired,
  onToggleEmployeesByTier: PropTypes.func.isRequired,
  billingStatusDonutData: PropTypes.object.isRequired,
  billingStatusDonutOptions: PropTypes.object.isRequired,
  employeesByTierBarData: PropTypes.object.isRequired,
  employeesByTierBarOptions: PropTypes.object.isRequired,
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ChartsSection);
