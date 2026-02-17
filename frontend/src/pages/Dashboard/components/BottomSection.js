import React from 'react';
import { Row, Col, Card } from 'antd';
import { Doughnut, Bar } from 'react-chartjs-2';
import { UI } from '@constants/app';

const BottomSection = ({
  trackDonutData,
  trackDonutOptions,
  techStackBarData,
  techStackBarOptions,
  labels,
}) => (
  <div className="dashboard-section">
    <Row gutter={[UI.GUTTER_SMALL, UI.GUTTER_SMALL]} className="bottom-section">
      <Col xs={24} lg={12}>
        <Card className="chart-card" title={labels.EMPLOYEES_BY_TRACK}>
          <div className="chart-container">
            <Doughnut data={trackDonutData} options={trackDonutOptions} />
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card className="chart-card" title={labels.EMPLOYEES_BY_TECH_STACK}>
          <div className="chart-container">
            <Bar data={techStackBarData} options={techStackBarOptions} />
          </div>
        </Card>
      </Col>
    </Row>
  </div>
);

export default BottomSection;
