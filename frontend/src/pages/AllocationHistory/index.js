import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Select, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import '@styles/pages/AllocationHistory.scss';

const { Option } = Select;

const AllocationHistory = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: 'All',
    customerName: 'All',
    projectName: 'All',
    projectStatus: 'All',
  });

  // Default filter values for comparison
  const defaultFilters = {
    employeeName: 'All',
    customerName: 'All',
    projectName: 'All',
    projectStatus: 'All',
  };

  // Count active filters (filters that differ from defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== defaultFilters[key] && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
  };

  // Generate months from Jul 2020 to Oct 2025
  const generateMonths = () => {
    const months = [];
    const startDate = new Date(2020, 6, 1); // July 2020
    const endDate = new Date(2025, 9, 1); // October 2025
    
    for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
    }
    return months;
  };

  const months = generateMonths();
  // Show every 6 months on x-axis
  const xAxisLabels = months.filter((_, index) => index % 6 === 0);

  // Mock data for the line chart
  const billingData = months.map((month, index) => {
    if (index < 12) return 0;
    if (index < 30) return 100;
    const base = 100;
    const variation = Math.sin(index * 0.2) * 20;
    return Math.max(80, Math.min(120, base + variation));
  });

  const nonBillingData = months.map((month, index) => {
    if (index < 18) return 0;
    if (index < 42) return 3.33;
    if (index < 50) return 20 + (index - 42) * 5;
    if (index < 55) return 77.74;
    return 75.00;
  });

  const trainingData = months.map((month, index) => {
    if (index < 42) return 0;
    const base = 50;
    const variation = Math.sin(index * 0.3) * 40;
    return Math.max(0, Math.min(90, base + variation));
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Billing',
        data: billingData,
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        pointStyle: 'rect',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
      },
      {
        label: 'Non-Billing',
        data: nonBillingData,
        borderColor: colors.secondary,
        backgroundColor: colors.secondary,
        pointStyle: 'circle',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
      },
      {
        label: 'Training',
        data: trainingData,
        borderColor: colors.pink,
        backgroundColor: colors.pink,
        pointStyle: 'triangle',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        ticks: {
          ...commonOptions.scales.x.ticks,
          maxTicksLimit: 12,
          callback: function(value, index) {
            return index % 6 === 0 ? months[index] : '';
          },
        },
      },
      y: {
        ...commonOptions.scales.y,
        min: 0,
        max: 130,
        ticks: {
          ...commonOptions.scales.y.ticks,
          stepSize: 20,
          maxTicksLimit: 8,
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'bottom',
        align: 'end',
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
  };

  return (
    <div className="allocation-history-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">ALLOCATION HISTORY</h1>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <div
          className="filters-header"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <div className="filters-header-left">
            <FilterOutlined className="filter-icon" />
            <span className="filters-title">Slicers</span>
            {activeFiltersCount > 0 && (
              <>
                <Badge count={activeFiltersCount} showZero={false} className="active-filters-badge">
                  <span></span>
                </Badge>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  className="reset-filters-btn"
                >
                  Reset
                </Button>
              </>
            )}
          </div>
          {filtersExpanded ? (
            <UpOutlined className="collapse-icon" />
          ) : (
            <DownOutlined className="collapse-icon" />
          )}
        </div>
        {filtersExpanded && (
          <div className="filters-content">
            <Row gutter={[16, 16]} className="filters-row">
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Employee Name</label>
                  <Select
                    value={filters.employeeName}
                    onChange={(value) => setFilters({ ...filters, employeeName: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="John Doe">John Doe</Option>
                    <Option value="Jane Smith">Jane Smith</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Customer Name</label>
                  <Select
                    value={filters.customerName}
                    onChange={(value) => setFilters({ ...filters, customerName: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Client A">Client A</Option>
                    <Option value="Client B">Client B</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Project Name</label>
                  <Select
                    value={filters.projectName}
                    onChange={(value) => setFilters({ ...filters, projectName: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Project Alpha">Project Alpha</Option>
                    <Option value="Project Beta">Project Beta</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Project Status</label>
                  <Select
                    value={filters.projectStatus}
                    onChange={(value) => setFilters({ ...filters, projectStatus: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Line Chart Section */}
      <Card className="chart-card">
        <div className="chart-title">RESOURCE ALLOCATION PERCENTAGE BY MONTH AND BILLING STATUS</div>
        <div className="line-chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
};

export default AllocationHistory;
