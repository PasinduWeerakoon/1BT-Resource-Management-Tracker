/**
 * TrainingCharts Component
 * Charts section for Training Report
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import { Doughnut, Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  createDonutChartData,
  createDonutChartOptions,
  createTechStackBarChartData,
  createTechStackBarChartOptions,
  createDesignationBarChartData,
  createDesignationBarChartOptions,
} from '../utils/chartConfig';

/**
 * TrainingCharts Component
 * @param {Object} props
 * @param {Array} props.trackData - Track distribution data
 * @param {Array} props.techStackData - Tech stack distribution data
 * @param {Array} props.designationData - Designation distribution data
 * @param {number} props.totalEmployeesInTraining - Total employees in training
 * @param {string} props.trainingPercentage - Training percentage
 */
const TrainingCharts = ({
  trackData,
  techStackData,
  designationData,
  totalEmployeesInTraining,
  trainingPercentage,
}) => {
  const donutChartData = createDonutChartData(trackData);
  const donutChartOptions = createDonutChartOptions();
  const techStackBarChartData = createTechStackBarChartData(techStackData);
  const techStackBarChartOptions = createTechStackBarChartOptions();
  const designationBarChartData = createDesignationBarChartData(designationData);
  const designationBarChartOptions = createDesignationBarChartOptions();

  return (
    <>
      {/* Charts and KPI Section */}
      <Row gutter={[16, 16]} className="charts-kpi-section">
        {/* Left Chart - Donut Chart */}
        <Col xs={24} lg={8}>
          <Card className="chart-card" title="No. of Employees in Training by Track">
            <div className="chart-container">
              <Doughnut data={donutChartData} options={donutChartOptions} />
            </div>
          </Card>
        </Col>

        {/* Center KPI Card */}
        <Col xs={24} lg={8}>
          <Card className="kpi-card-large">
            <div className="kpi-circle">
              <div className="kpi-value-large">{totalEmployeesInTraining}</div>
              <div className="kpi-label-large">EMPLOYEES IN TRAINING</div>
              <div className="kpi-percentage">{trainingPercentage}%</div>
              <div className="kpi-sub-label">OF ALL EMPLOYEES</div>
            </div>
          </Card>
        </Col>

        {/* Right Chart - Bar Chart */}
        <Col xs={24} lg={8}>
          <Card className="chart-card" title="No. of Employees in Training by Tech Stack">
            <div className="chart-container">
              <Bar data={techStackBarChartData} options={techStackBarChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Designation Chart Section */}
      <Row gutter={[16, 16]} className="designation-chart-section">
        <Col xs={24}>
          <Card className="chart-card" title="No. of Employees by Designation">
            <div className="chart-container">
              <Bar data={designationBarChartData} options={designationBarChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

TrainingCharts.propTypes = {
  trackData: PropTypes.array,
  techStackData: PropTypes.array,
  designationData: PropTypes.array,
  totalEmployeesInTraining: PropTypes.number,
  trainingPercentage: PropTypes.string,
};

export default TrainingCharts;
