import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card } from 'antd';
import { UserOutlined, PercentageOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import {
  RESOURCE_COUNTS,
  PERCENTAGES,
  COLUMN_WIDTHS,
  LABELS
} from '@constants/dashboard';
import { UI, COMMON, TABLE } from '@constants/app';
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
        logger.error('Failed to fetch account manager report', error);
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
      labels: labels.length > 0 ? labels : [COMMON.NO_DATA_LABEL],
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          backgroundColor: backgroundColors.length > 0 ? backgroundColors : [colors.gray],
          borderWidth: UI.CHART_BORDER_WIDTH,
          borderColor: UI.CHART_BORDER_COLOR,
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
      labels: labels.length > 0 ? labels : [COMMON.NO_DATA_LABEL],
      datasets: [
        {
          label: 'Number of Employees',
          data: data.length > 0 ? data : [0],
          backgroundColor: colors.primary,
          borderRadius: UI.CHART_BORDER_RADIUS,
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
      title: LABELS.EMPLOYEE_NAME,
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: COLUMN_WIDTHS.EMPLOYEE_NAME,
    },
    {
      title: LABELS.TRACK,
      dataIndex: 'track',
      key: 'track',
      width: COLUMN_WIDTHS.TRACK,
    },
    {
      title: LABELS.TECH_STACK,
      dataIndex: 'techStack',
      key: 'techStack',
      width: COLUMN_WIDTHS.TECH_STACK,
    },
    {
      title: LABELS.TIER,
      dataIndex: 'tier',
      key: 'tier',
      width: COLUMN_WIDTHS.TIER,
    },
    {
      title: LABELS.DESIGNATION,
      dataIndex: 'designation',
      key: 'designation',
      width: COLUMN_WIDTHS.DESIGNATION,
    },
    {
      title: LABELS.ALLOCATION_COUNT,
      dataIndex: 'allocationCount',
      key: 'allocationCount',
      width: COLUMN_WIDTHS.ALLOCATION_COUNT,
    },
  ];

  // Designation data
  const designationData = useMemo(() => {
    const designations = reportData.designations.data || [];
    return designations.map((item, index) => {
      // Create a unique key using id if available, otherwise use a combination of properties and index
      const uniqueKey = item.id
        ? `designation-${item.id}`
        : `designation-${index}-${item.employee_name || item.name || ''}-${item.track || ''}`;

      return {
        key: uniqueKey,
        employeeName: item.employee_name || item.name || COMMON.N_A_LABEL,
        track: item.track || COMMON.N_A_LABEL,
        techStack: item.tech_stack || COMMON.N_A_LABEL,
        tier: item.tier || COMMON.N_A_LABEL,
        designation: item.designation || COMMON.N_A_LABEL,
        allocationCount: item.allocation_count || 0,
      };
    });
  }, [reportData.designations.data]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{LABELS.SUMMARY_VIEW}</h1>
      </div>

      <div className="dashboard-content">
        {/* Resource Counts Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{LABELS.RESOURCE_COUNTS}</h2>
          </div>
          <div className="resource-cards-container">
            <div className="resource-cards-grid">
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.BILLING_RESOURCE_COUNT}</div>
                <div className="metric-label">{LABELS.BILLING_RESOURCE_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.ALLOCATED_RESOURCE_COUNT}</div>
                <div className="metric-label">{LABELS.ALLOCATED_RESOURCE_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.BILLABLE_RESOURCE_COUNT}</div>
                <div className="metric-label">{LABELS.BILLABLE_RESOURCE_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.SHADOW_COUNT}</div>
                <div className="metric-label">{LABELS.SHADOW_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.EXTERNAL_CONSULTANT_COUNT}</div>
                <div className="metric-label">{LABELS.EXTERNAL_CONSULTANT_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.BENCH_RESOURCE_COUNT}</div>
                <div className="metric-label">{LABELS.BENCH_RESOURCE_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.TRAINING_RESOURCE_COUNT}</div>
                <div className="metric-label">{LABELS.TRAINING_RESOURCE_COUNT}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.INTERNS_COUNT}</div>
                <div className="metric-label">{LABELS.INTERNS}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.SYNERGY_COUNT}</div>
                <div className="metric-label">{LABELS.SYNERGY}</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-icon-wrapper">
                  <UserOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{RESOURCE_COUNTS.SHARED_SERVICES_COUNT}</div>
                <div className="metric-label">{LABELS.SHARED_SERVICES}</div>
              </Card>
            </div>
          </div>
        </div>

        {/* Percentages Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{LABELS.PERCENTAGES}</h2>
          </div>
          <Row gutter={[UI.GUTTER_MEDIUM, UI.GUTTER_MEDIUM]} className="percentage-cards">
            <Col xs={24} sm={12} md={8}>
              <Card className="metric-card percentage-card">
                <div className="metric-icon-wrapper">
                  <PercentageOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{PERCENTAGES.ALLOCATION_PERCENTAGE}%</div>
                <div className="metric-label">{LABELS.ALLOCATION_PERCENTAGE}</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="metric-card percentage-card">
                <div className="metric-icon-wrapper">
                  <PercentageOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{PERCENTAGES.BILLABLE_PERCENTAGE}%</div>
                <div className="metric-label">{LABELS.BILLABLE_PERCENTAGE}</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="metric-card percentage-card">
                <div className="metric-icon-wrapper">
                  <PercentageOutlined className="metric-icon" />
                </div>
                <div className="metric-value">{PERCENTAGES.SHADOW_PERCENTAGE}%</div>
                <div className="metric-label">{LABELS.SHADOW_PERCENTAGE}</div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Bottom Section - Three Columns */}
        <div className="dashboard-section">
          <Row gutter={[UI.GUTTER_SMALL, UI.GUTTER_SMALL]} className="bottom-section">
            <Col xs={24} lg={8}>
              <Card className="table-card" title={LABELS.BY_DESIGNATION}>
                <CustomTable
                  columns={designationColumns}
                  dataSource={designationData}
                  pagination={false}
                  size={TABLE.SIZE_SMALL}
                  scroll={{ x: TABLE.DEFAULT_SCROLL_X }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="chart-card" title={LABELS.EMPLOYEES_BY_TRACK}>
                <div className="chart-container">
                  <Doughnut data={trackDonutData} options={trackDonutOptions} />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="chart-card" title={LABELS.EMPLOYEES_BY_TECH_STACK}>
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
