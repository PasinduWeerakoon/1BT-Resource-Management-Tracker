import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Select, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { accountManagersService } from '@api';
import '@styles/pages/TierBreakdownReport.scss';

const { Option } = Select;

const TierBreakdownReport = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    projectName: 'All',
    tier: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
    designation: 'All',
  });

  // Default filter values for comparison
  const defaultFilters = {
    projectName: 'All',
    tier: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
    designation: 'All',
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

  // Account managers for dropdown
  const [accountManagers, setAccountManagers] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);

  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        const data = response.data || response || [];
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        const formatted = list
          .map((am) => ({
            id: am.id,
            name: am.name,
          }))
          .filter((am) => am.id && am.name);
        setAccountManagers(formatted);
      } catch (error) {
        // silent fail; filters remain usable
        // console.error('Failed to fetch account managers for TierBreakdownReport:', error);
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    fetchAccountManagers();
  }, []);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
  };

  // KPI Data
  const totalEmployees = 114;

  // Tier distribution data
  const tierData = [
    { tier: '0', count: 5 },
    { tier: '1', count: 2 },
    { tier: '2', count: 20 },
    { tier: '3', count: 9 },
    { tier: '4', count: 43 },
    { tier: '5', count: 27 },
    { tier: '99', count: 8 },
  ];

  // Employee Details Table Columns
  const employeeColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 180,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 150,
    },
    {
      title: 'Billing Percentage',
      dataIndex: 'billingPercentage',
      key: 'billingPercentage',
      width: 160,
    },
    {
      title: 'Project Allocation',
      dataIndex: 'projectAllocation',
      key: 'projectAllocation',
      width: 160,
    },
  ];

  // Mock employee data
  const employeeData = [
    {
      key: '1',
      employeeName: 'Akeel Aliyar',
      project: 'Healthfinder',
      billingStatus: 'Non-Billing',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '2',
      employeeName: 'Amaniya Faizal',
      project: 'Bench',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '3',
      employeeName: 'Amir Hafi',
      project: 'Seer Insights',
      billingStatus: 'Billing',
      billingPercentage: '100.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '4',
      employeeName: 'Anudi Divarathne',
      project: 'Seer Home Page',
      billingStatus: 'Billing',
      billingPercentage: '100.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '5',
      employeeName: 'Anudi Divarathne',
      project: 'Seer Insights V2',
      billingStatus: 'Billing',
      billingPercentage: '50.00%',
      projectAllocation: '50.00%',
    },
    {
      key: '6',
      employeeName: 'Anushka Wickramaratne',
      project: 'IGBC Support',
      billingStatus: 'Billing',
      billingPercentage: '100.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '7',
      employeeName: 'Athula Chandrawansha',
      project: 'HR Solution',
      billingStatus: 'Billing',
      billingPercentage: '75.00%',
      projectAllocation: '80.00%',
    },
    {
      key: '8',
      employeeName: 'Avanthi Amunugama',
      project: 'Presale',
      billingStatus: 'Presale',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '9',
      employeeName: 'Avanthi Amunugama',
      project: 'Seer Rom In Port',
      billingStatus: 'Training',
      billingPercentage: '0.00%',
      projectAllocation: '20.00%',
    },
    {
      key: '10',
      employeeName: 'Chamalka Gamaralalage',
      project: 'Ideapoint',
      billingStatus: 'Billing',
      billingPercentage: '100.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '11',
      employeeName: 'Chamath Randula',
      project: 'MillionSpaces',
      billingStatus: 'Billing',
      billingPercentage: '100.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '12',
      employeeName: 'Chaminda Pragnarathne',
      project: 'Bench',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '13',
      employeeName: 'Chanka Sonnadara',
      project: 'Healthfinder',
      billingStatus: 'Non-Billing',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
    },
    {
      key: '14',
      employeeName: 'Charith Bandara',
      project: 'MillionSpaces',
      billingStatus: 'Training',
      billingPercentage: '0.00%',
      projectAllocation: '50.00%',
    },
    {
      key: '15',
      employeeName: 'Charith Bandara',
      project: 'Bench',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '50.00%',
    },
    {
      key: '16',
      employeeName: 'Charith Jayasankha',
      project: 'Seer Insights',
      billingStatus: 'Billing',
      billingPercentage: '100.00%',
      projectAllocation: '100.00%',
    },
  ];

  // Calculate max count for bar chart scaling
  const maxCount = Math.max(...tierData.map(item => item.count));

  // Chart.js data for bar chart
  const barChartData = {
    labels: tierData.map(item => `Tier ${item.tier}`),
    datasets: [
      {
        label: 'Number of Employees',
        data: tierData.map(item => item.count),
        backgroundColor: colors.primary,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        beginAtZero: true,
        ticks: {
          ...commonOptions.scales.x.ticks,
          stepSize: 5,
        },
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

  return (
    <div className="tier-breakdown-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">TIER BREAKDOWN REPORT</h1>
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
            <span className="filters-title">Filters</span>
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
                  <label>Project Name</label>
                  <Select
                    value={filters.projectName}
                    onChange={(value) => setFilters({ ...filters, projectName: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Healthfinder">Healthfinder</Option>
                    <Option value="MillionSpaces">MillionSpaces</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Tier</label>
                  <Select
                    value={filters.tier}
                    onChange={(value) => setFilters({ ...filters, tier: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="0">Tier 0</Option>
                    <Option value="1">Tier 1</Option>
                    <Option value="2">Tier 2</Option>
                    <Option value="3">Tier 3</Option>
                    <Option value="4">Tier 4</Option>
                    <Option value="5">Tier 5</Option>
                    <Option value="99">Tier 99</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Account Manager</label>
                  <Select
                    value={filters.accountManager}
                    onChange={(value) => setFilters({ ...filters, accountManager: value })}
                    style={{ width: '100%' }}
                    loading={loadingAccountManagers}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {accountManagers.map((am) => (
                      <Option key={am.id} value={am.name} label={am.name}>
                        {am.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Track</label>
                  <Select
                    value={filters.track}
                    onChange={(value) => setFilters({ ...filters, track: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Dev">Dev</Option>
                    <Option value="QA">QA</Option>
                    <Option value="PM">PM</Option>
                    <Option value="BA">BA</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Tech Stack</label>
                  <Select
                    value={filters.techStack}
                    onChange={(value) => setFilters({ ...filters, techStack: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value=".NET">.NET</Option>
                    <Option value="Full Stack">Full Stack</Option>
                    <Option value="QA">QA</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Designation</label>
                  <Select
                    value={filters.designation}
                    onChange={(value) => setFilters({ ...filters, designation: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="ASE">ASE</Option>
                    <Option value="SE">SE</Option>
                    <Option value="STL">STL</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* KPI Card */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{totalEmployees}</div>
            <div className="kpi-label">TOTAL EMPLOYEE</div>
          </Card>
        </Col>
      </Row>

      {/* Chart and Table Section */}
      <Row gutter={[16, 16]} className="charts-tables-section">
        {/* Left Column - Tier Chart */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title="No Of Employees by Tier"
          >
            <div className="chart-container">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </Card>
        </Col>

        {/* Right Column - Employee Details Table */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="Employee Details">
            <CustomTable
              columns={employeeColumns}
              dataSource={employeeData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800, y: 400 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TierBreakdownReport;
