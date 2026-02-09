/**
 * BenchCharts Component
 * Charts section for Bench Report showing tech stacks and tracks wise resource count
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import { Doughnut, Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  createTrackDonutChartData,
  createDonutChartOptions,
  createTechStackBarChartData,
  createTechStackBarChartOptions,
} from '../utils/chartConfig';

/**
 * BenchCharts Component
 * @param {Object} props
 * @param {Array} props.trackData - Track distribution data
 * @param {Array} props.techStackData - Tech stack distribution data
 */
const BenchCharts = ({
  trackData,
  techStackData,
}) => {
  const trackDonutData = createTrackDonutChartData(trackData);
  const trackDonutOptions = createDonutChartOptions();
  const techStackBarData = createTechStackBarChartData(techStackData);
  const techStackBarOptions = createTechStackBarChartOptions();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} lg={12}>
        <Card title="Bench Resources by Track" className="chart-card">
          <div style={{ height: 300, position: 'relative' }}>
            <Doughnut data={trackDonutData} options={trackDonutOptions} />
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Bench Resources by Tech Stack" className="chart-card">
          <div style={{ height: 300, position: 'relative' }}>
            <Bar data={techStackBarData} options={techStackBarOptions} />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

BenchCharts.propTypes = {
  trackData: PropTypes.arrayOf(
    PropTypes.shape({
      track: PropTypes.string,
      count: PropTypes.number,
    })
  ),
  techStackData: PropTypes.arrayOf(
    PropTypes.shape({
      techStack: PropTypes.string,
      count: PropTypes.number,
    })
  ),
};

BenchCharts.defaultProps = {
  trackData: [],
  techStackData: [],
};

export default BenchCharts;
