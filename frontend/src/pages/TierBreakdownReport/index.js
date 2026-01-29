import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Select, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { accountManagersService, reportsService, projectsService, tracksService, resourcesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
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
  });

  // Default filter values for comparison
  const defaultFilters = {
    projectName: 'All',
    tier: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
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

  // Filter options for dropdowns
  const [accountManagers, setAccountManagers] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [techStacks, setTechStacks] = useState([]);
  const [loadingTechStacks, setLoadingTechStacks] = useState(false);

  // Report data
  const [tierData, setTierData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loadingReport, setLoadingReport] = useState(false);

  // Refs to prevent duplicate API calls
  const fetchReportInProgressRef = useRef(false);

  // Fetch filter options on mount
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
        console.error('Failed to fetch account managers:', error);
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await projectsService.getAll({ limit: 100 });
        let projectsData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            projectsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            projectsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            projectsData = response.data;
          }
        }

        const formatted = projectsData
          .map((project) => ({
            id: project.id,
            name: project.project_name || project.name,
          }))
          .filter((project) => project.id && project.name);

        setProjects(formatted);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchTracks = async () => {
      try {
        setLoadingTracks(true);
        const response = await tracksService.getAll({ limit: 100 });
        let tracksData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            tracksData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            tracksData = response.data.data;
          }
        }

        const formatted = tracksData
          .map((track) => ({
            id: track.id,
            name: track.name,
          }))
          .filter((track) => track.id && track.name);

        setTracks(formatted);
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
      } finally {
        setLoadingTracks(false);
      }
    };

    const fetchTechStacks = async () => {
      try {
        setLoadingTechStacks(true);
        const response = await resourcesService.getAll({ limit: 1000, status: 'Active' });
        let resourcesData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            resourcesData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            resourcesData = response.data.data;
          }
        }

        // Get unique tech stacks
        const uniqueTechStacks = [...new Set(
          resourcesData
            .map((resource) => resource.tech_stack)
            .filter((techStack) => techStack && techStack.trim() !== '')
        )].sort();

        setTechStacks(uniqueTechStacks.map((techStack) => ({ name: techStack })));
      } catch (error) {
        console.error('Failed to fetch tech stacks:', error);
      } finally {
        setLoadingTechStacks(false);
      }
    };

    fetchAccountManagers();
    fetchProjects();
    fetchTracks();
    fetchTechStacks();
  }, []);

  // Fetch tier breakdown report
  const fetchTierBreakdownReport = async () => {
    if (fetchReportInProgressRef.current) {
      return;
    }

    try {
      fetchReportInProgressRef.current = true;
      setLoadingReport(true);

      // Build query params from filters
      const params = {};
      if (filters.tier && filters.tier !== 'All') {
        params.tier = filters.tier;
      }
      if (filters.projectName && filters.projectName !== 'All') {
        params.project_name = filters.projectName;
      }
      if (filters.accountManager && filters.accountManager !== 'All') {
        params.account_manager = filters.accountManager;
      }
      if (filters.track && filters.track !== 'All') {
        params.track = filters.track;
      }
      if (filters.techStack && filters.techStack !== 'All') {
        params.tech_stack = filters.techStack;
      }

      const response = await reportsService.getTierBreakdown(params);

      // Handle response structure
      let reportData = null;
      if (response) {
        if (response.data) {
          reportData = response.data;
        } else if (response.summary || response.tierDistribution) {
          reportData = response;
        }
      }

      if (reportData) {
        // Update tier distribution for chart
        if (reportData.tierDistribution && Array.isArray(reportData.tierDistribution)) {
          setTierData(reportData.tierDistribution);
        }

        // Update employee details for table
        if (reportData.employeeDetails && Array.isArray(reportData.employeeDetails)) {
          setEmployeeData(reportData.employeeDetails);
        }

        // Update total employees
        if (reportData.summary && reportData.summary.totalEmployees !== undefined) {
          setTotalEmployees(reportData.summary.totalEmployees);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tier breakdown report:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load tier breakdown report');
    } finally {
      setLoadingReport(false);
      fetchReportInProgressRef.current = false;
    }
  };

  // Fetch report on mount and when any filter changes
  useEffect(() => {
    fetchTierBreakdownReport();
  }, [filters.tier, filters.projectName, filters.accountManager, filters.track, filters.techStack]);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
  };

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
                    loading={loadingProjects}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {projects.map((project) => (
                      <Option key={project.id} value={project.name} label={project.name}>
                        {project.name}
                      </Option>
                    ))}
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
                    loading={loadingReport}
                  >
                    <Option value="All">All</Option>
                    <Option value="0">Tier 0 (Synergy)</Option>
                    <Option value="1">Tier 1</Option>
                    <Option value="2">Tier 2</Option>
                    <Option value="3">Tier 3</Option>
                    <Option value="4">Tier 4</Option>
                    <Option value="5">Tier 5</Option>
                    <Option value="99">Tier 99 (Intern)</Option>
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
                    loading={loadingTracks}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {tracks.map((track) => (
                      <Option key={track.id} value={track.name} label={track.name}>
                        {track.name}
                      </Option>
                    ))}
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
                    loading={loadingTechStacks}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {techStacks.map((techStack) => (
                      <Option key={techStack.name} value={techStack.name} label={techStack.name}>
                        {techStack.name}
                      </Option>
                    ))}
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
            loading={loadingReport}
          >
            <div className="chart-container">
              {tierData.length > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  No data available
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column - Employee Details Table */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="Employee Details" loading={loadingReport}>
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
