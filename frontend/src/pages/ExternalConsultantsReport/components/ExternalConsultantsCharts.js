/**
 * ExternalConsultantsCharts Component
 * Charts section for External Consultants Report
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import { Doughnut, Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  getDonutChartData,
  getDonutChartOptions,
  getBarChartData,
  getBarChartOptions,
} from '../utils/chartConfig';

/**
 * ExternalConsultantsCharts Component
 * @param {Object} props
 * @param {Array} props.trackData - Track distribution data
 * @param {Array} props.techStackDistribution - Tech stack distribution data
 * @param {number} props.totalExternalConsultants - Total consultants count
 * @param {string} props.externalConsultantsPercentage - Percentage of all employees
 * @param {boolean} props.loading - Loading state
 */
const ExternalConsultantsCharts = ({
  trackData = [],
  techStackDistribution = [],
  totalExternalConsultants = 0,
  externalConsultantsPercentage = '0.00',
  loading = false,
}) => {
  const donutChartData = getDonutChartData(trackData);
  const donutChartOptions = getDonutChartOptions();
  const barChartData = getBarChartData(techStackDistribution);
  const barChartOptions = getBarChartOptions();

  return (
    <Row gutter={[16, 16]} className="charts-kpi-section">
      {/* Left Chart - Donut Chart */}
      <Col xs={24} lg={8}>
        <Card className="chart-card" title="No. of External Consultants by Track" loading={loading}>
          <div className="chart-container">
            {trackData.length > 0 ? (
              <Doughnut data={donutChartData} options={donutChartOptions} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>No data available</div>
            )}
          </div>
        </Card>
      </Col>

      {/* Center KPI Card */}
      <Col xs={24} lg={8}>
        <Card className="kpi-card-large" loading={loading}>
          <div className="kpi-circle">
            <div className="kpi-value-large">{totalExternalConsultants}</div>
            <div className="kpi-label-large">EXTERNAL CONSULTANTS</div>
            <div className="kpi-percentage">{externalConsultantsPercentage}%</div>
            <div className="kpi-sub-label">OF ALL EMPLOYEES</div>
          </div>
        </Card>
      </Col>

      {/* Right Chart - Bar Chart */}
      <Col xs={24} lg={8}>
        <Card className="chart-card" title="No. of External Consultants by Tech Stack" loading={loading}>
          <div className="chart-container">
            {techStackDistribution.length > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>No data available</div>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

ExternalConsultantsCharts.propTypes = {
  trackData: PropTypes.array,
  techStackDistribution: PropTypes.array,
  totalExternalConsultants: PropTypes.number,
  externalConsultantsPercentage: PropTypes.string,
  loading: PropTypes.bool,
};

export default ExternalConsultantsCharts;
