import React from 'react';
import { Row, Col, Card } from 'antd';
import { UserOutlined, PercentageOutlined } from '@ant-design/icons';
import '@styles/pages/Dashboard.scss';

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">SUMMARY VIEW</h1>
      </div>

      <div className="dashboard-content">
        {/* Resource Counts Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Resource Counts</h2>
          </div>
          <div className="resource-cards-container">
            <div className="resource-cards-grid">
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">37.8</div>
                <div className="metric-label">Billing Resource Count</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">74.9</div>
                <div className="metric-label">Allocated Resource Count</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">75</div>
                <div className="metric-label">Billable Resource Count (Excluding Consultants, Interns and Synergy)</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">19.5</div>
                <div className="metric-label">Shadow Count</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">14</div>
                <div className="metric-label">External Consultant Count</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">7.8</div>
                <div className="metric-label">Bench Resource Count</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">6.7</div>
                <div className="metric-label">Training Resource Count</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">29</div>
                <div className="metric-label">Interns</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">10</div>
                <div className="metric-label">Synergy</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">15</div>
                <div className="metric-label">Shared Services</div>
              </Card>
            </div>
          </div>
        </div>

        {/* Percentages Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>% Percentages</h2>
          </div>
          <Row gutter={[20, 20]} className="percentage-cards">
            <Col xs={24} sm={12} md={8}>
              <Card className="metric-card percentage-card">
                <div className="metric-icon-wrapper">
                  <PercentageOutlined className="metric-icon" />
                </div>
                <div className="metric-value">99.8%</div>
                <div className="metric-label">Allocation Percentage</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="metric-card percentage-card">
                <div className="metric-icon-wrapper">
                  <PercentageOutlined className="metric-icon" />
                </div>
                <div className="metric-value">51.2%</div>
                <div className="metric-label">Billable Percentage</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="metric-card percentage-card">
                <div className="metric-icon-wrapper">
                  <PercentageOutlined className="metric-icon" />
                </div>
                <div className="metric-value">33.1%</div>
                <div className="metric-label">Shadow Percentage</div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
