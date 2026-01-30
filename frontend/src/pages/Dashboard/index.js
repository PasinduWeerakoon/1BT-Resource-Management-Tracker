import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card } from 'antd';
import { UserOutlined, PercentageOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import '@styles/pages/Dashboard.scss';

const Dashboard = () => {
  const [reportData, setReportData] = useState({
    charts: {
      employeesByTrack: {},
      employeesByTechStack: {},
    },
    designations: { data: [] },
  });
  const [loading, setLoading] = useState(false);
  const fetchInProgressRef = useRef(false);

  // Fetch account manager report data (with "All" filters to get all data)
  useEffect(() => {
    const fetchAccountManagerReport = async () => {
      if (fetchInProgressRef.current) {
        return;
      }

      try {
        fetchInProgressRef.current = true;
        setLoading(true);

        // Fetch with no filters to get all data
        const response = await reportsService.getAccountManager({});

        if (response) {
          const data = response.data || response;
          setReportData({
            charts: data.charts || {
              employeesByTrack: {},
              employeesByTechStack: {},
            },
            designations: data.designations || { data: [] },
          });
        }
      } catch (error) {
        console.error('Failed to fetch account manager report:', error);
        showErrorToast('Failed to load account manager report data');
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchAccountManagerReport();
  }, []);

  // Chart.js data for track donut chart
  const trackDonutData = useMemo(() => {
    const employeesByTrack = reportData.charts.employeesByTrack || {};
    const labels = Object.keys(employeesByTrack);
    const data = Object.values(employeesByTrack);

    const colorPalette = [
      colors.primary,
      colors.error,
      colors.warning,
      colors.success,
      colors.info,
      colors.purple,
      colors.cyan,
    ];

    const backgroundColors = labels.map((_, index) => colorPalette[index % colorPalette.length]);

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          backgroundColor: backgroundColors.length > 0 ? backgroundColors : [colors.gray],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  }, [reportData.charts.employeesByTrack]);

  const trackDonutOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'bottom',
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Chart.js data for tech stack bar chart
  const techStackBarData = useMemo(() => {
    const employeesByTechStack = reportData.charts.employeesByTechStack || {};
    const labels = Object.keys(employeesByTechStack);
    const data = Object.values(employeesByTechStack);

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [
        {
          label: 'Number of Employees',
          data: data.length > 0 ? data : [0],
          backgroundColor: colors.primary,
          borderRadius: 4,
        },
      ],
    };
  }, [reportData.charts.employeesByTechStack]);

  const techStackBarOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        beginAtZero: true,
      },
      y: {
        ...commonOptions.scales.y,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  // Designation columns
  const designationColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
    },
    {
      title: 'Track',
      dataIndex: 'track',
      key: 'track',
      width: 120,
    },
    {
      title: 'Tech Stack',
      dataIndex: 'techStack',
      key: 'techStack',
      width: 150,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 250,
    },
    {
      title: 'Allocation Count',
      dataIndex: 'allocationCount',
      key: 'allocationCount',
      width: 140,
    },
  ];

  // Designation data
  const designationData = useMemo(() => {
    const designations = reportData.designations.data || [];
    return designations.map((item, index) => ({
      key: item.id || `designation-${index}`,
      employeeName: item.employee_name || item.name || 'N/A',
      track: item.track || 'N/A',
      techStack: item.tech_stack || 'N/A',
      tier: item.tier || 'N/A',
      designation: item.designation || 'N/A',
      allocationCount: item.allocation_count || 0,
    }));
  }, [reportData.designations.data]);

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

        {/* Bottom Section - Three Columns */}
        <div className="dashboard-section">
          <Row gutter={[16, 16]} className="bottom-section">
            <Col xs={24} lg={8}>
              <Card className="table-card" title="BY DESIGNATION">
                <CustomTable
                  columns={designationColumns}
                  dataSource={designationData}
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="chart-card" title="No. of Employee Accounts Managed by Track">
                <div className="chart-container">
                  <Doughnut data={trackDonutData} options={trackDonutOptions} />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="chart-card" title="No. of Employee Accounts Managed by Tech Stack">
                <div className="chart-container">
                  <Bar data={techStackBarData} options={techStackBarOptions} />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
