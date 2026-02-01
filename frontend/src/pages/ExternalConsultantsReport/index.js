import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Select, DatePicker, Badge, Button, App } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import { reportsService, tracksService, projectsService, resourcesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import '@styles/pages/ExternalConsultantsReport.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ExternalConsultantsReport = () => {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [tracksList, setTracksList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const fetchInProgressRef = useRef(false);

  const [filters, setFilters] = useState({
    track_id: undefined,
    tech_stack: undefined,
    project_id: undefined,
    start_date: undefined,
    end_date: undefined,
  });

  // Default filter values for comparison
  const defaultFilters = {
    track_id: undefined,
    tech_stack: undefined,
    project_id: undefined,
    start_date: undefined,
    end_date: undefined,
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

  // Fetch tracks for filter dropdown
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await tracksService.getAll({ limit: 100 });
        let tracksData = [];
        
        if (response) {
          if (Array.isArray(response.data)) {
            tracksData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            tracksData = response.data.data;
          }
        }
        
        setTracksList(tracksData);
      } catch (error) {
        logger.error('Failed to fetch tracks', error);
      }
    };
    
    fetchTracks();
  }, []);

  // Fetch projects for filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsService.getAll({ limit: 1000 });
        let projectsData = [];
        
        if (response) {
          if (Array.isArray(response.data)) {
            projectsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            projectsData = response.data.data;
          }
        }
        
        setProjectsList(projectsData);
      } catch (error) {
        logger.error('Failed to fetch projects', error);
      }
    };
    
    fetchProjects();
  }, []);

  // Fetch total employees count for percentage calculation
  useEffect(() => {
    const fetchTotalEmployees = async () => {
      try {
        const response = await resourcesService.getAll({ limit: 1, status: 'Active' });
        if (response && response.data && response.data.pagination) {
          setTotalEmployees(response.data.pagination.total || 0);
        }
      } catch (error) {
        logger.error('Failed to fetch total employees', error);
      }
    };
    
    fetchTotalEmployees();
  }, []);

  // Fetch external consultants report data
  const fetchExternalConsultantsReport = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      
      const queryParams = {};
      
      // Add filters to query params
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      if (filters.tech_stack) {
        queryParams.tech_stack = filters.tech_stack;
      }
      if (filters.project_id) {
        queryParams.project_id = filters.project_id;
      }
      if (filters.start_date) {
        queryParams.start_date = filters.start_date;
      }
      if (filters.end_date) {
        queryParams.end_date = filters.end_date;
      }
      
      const response = await reportsService.getExternalConsultants(queryParams);
      
      if (response && response.success !== false) {
        setReportData(response);
      } else {
        showErrorToast('Failed to load external consultants report');
        setReportData(null);
      }
    } catch (error) {
      logger.error('Failed to fetch external consultants report', error);
      showErrorToast('Failed to load external consultants report');
      setReportData(null);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchExternalConsultantsReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.track_id, filters.tech_stack, filters.project_id, filters.start_date, filters.end_date]);

  // KPI Data - Calculate from API response
  const totalExternalConsultants = reportData?.summary?.totalConsultants || 0;
  const externalConsultantsPercentage = totalEmployees > 0 
    ? ((totalExternalConsultants / totalEmployees) * 100).toFixed(2) 
    : '0.00';

  // Track distribution data for donut chart
  const trackData = reportData?.charts?.trackDistribution || [];
  const donutChartData = {
    labels: trackData.map(item => item.track || 'Unassigned'),
    datasets: [
      {
        data: trackData.map(item => item.count),
        backgroundColor: [
          colors.secondary,
          colors.primary,
          colors.pink,
          colors.error,
          colors.warning,
          colors.info,
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const donutChartOptions = {
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Tech Stack distribution - Calculate from byAllocation data
  const techStackDistribution = useMemo(() => {
    if (!reportData?.tables?.byAllocation) return [];
    
    const techStackMap = new Map();
    reportData.tables.byAllocation.forEach(item => {
      const techStack = item.techStack || 'Unassigned';
      techStackMap.set(techStack, (techStackMap.get(techStack) || 0) + 1);
    });
    
    return Array.from(techStackMap.entries())
      .map(([techStack, count]) => ({ techStack, count }))
      .sort((a, b) => b.count - a.count);
  }, [reportData]);

  // Chart.js data for bar chart
  const barChartData = {
    labels: techStackDistribution.map(item => item.techStack),
    datasets: [
      {
        label: 'Number of Consultants',
        data: techStackDistribution.map(item => item.count),
        backgroundColor: techStackDistribution.map((item, index) =>
          index < 2 ? colors.secondary : colors.primary
        ),
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

  // Transform API data for BY PROJECT table
  const projectData = useMemo(() => {
    if (!reportData?.tables?.byProject) return [];
    
    return reportData.tables.byProject.map((item, index) => ({
      key: item.key || `project-${index}`,
      projectName: item.projectName || 'N/A',
      accountManager: item.accountManager || 'N/A',
      consultantCount: item.consultantCount || 0,
      totalAllocation: item.totalAllocation || '0.00%',
      billingStatus: item.billingStatus || 'Non-Billing',
      consultants: item.consultants || '',
    }));
  }, [reportData]);

  // Transform API data for BY ALLOCATION table
  const allocationData = useMemo(() => {
    if (!reportData?.tables?.byAllocation) return [];
    
    return reportData.tables.byAllocation.map((item, index) => {
      const startDate = item.startDate ? dayjs(item.startDate).format('DD MMM YYYY') : '';
      const endDate = item.endDate ? dayjs(item.endDate).format('DD MMM YYYY') : '';
      
      // Calculate duration in days
      let duration = 0;
      if (item.startDate) {
        const start = dayjs(item.startDate);
        const end = item.endDate ? dayjs(item.endDate) : dayjs();
        duration = end.diff(start, 'day');
      }
      
      return {
        key: item.key || `allocation-${index}`,
        consultantName: item.consultantName || 'N/A',
        email: item.email || '',
        designation: item.designation || 'N/A',
        track: item.track || 'N/A',
        techStack: item.techStack || 'N/A',
        project: item.project || 'Bench',
        accountManager: item.accountManager || 'N/A',
        allocationPercentage: item.allocationPercentage || '0.00%',
        startDate: startDate,
        endDate: endDate,
        duration: duration,
        billingStatus: item.billingStatus || 'Non-Billing',
      };
    });
  }, [reportData]);

  // BY PROJECT Table Columns
  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
    },
    {
      title: 'Account Manager',
      dataIndex: 'accountManager',
      key: 'accountManager',
      width: 150,
    },
    {
      title: 'Consultant Count',
      dataIndex: 'consultantCount',
      key: 'consultantCount',
      width: 120,
      sorter: (a, b) => a.consultantCount - b.consultantCount,
    },
    {
      title: 'Total Allocation',
      dataIndex: 'totalAllocation',
      key: 'totalAllocation',
      width: 120,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 120,
      render: (status) => (
        <Badge
          status={status === 'Billing' ? 'success' : 'default'}
          text={status}
        />
      ),
    },
    {
      title: 'Consultants',
      dataIndex: 'consultants',
      key: 'consultants',
      width: 300,
    },
  ];

  // BY ALLOCATION Table Columns
  const allocationColumns = [
    {
      title: 'Consultant Name',
      dataIndex: 'consultantName',
      key: 'consultantName',
      width: 180,
      sorter: (a, b) => (a.consultantName || '').localeCompare(b.consultantName || ''),
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
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 200,
    },
    {
      title: 'Allocation %',
      dataIndex: 'allocationPercentage',
      key: 'allocationPercentage',
      width: 120,
      sorter: (a, b) => {
        const aVal = parseFloat(a.allocationPercentage) || 0;
        const bVal = parseFloat(b.allocationPercentage) || 0;
        return aVal - bVal;
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: 'Duration (Days)',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      sorter: (a, b) => a.duration - b.duration,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 120,
      render: (status) => (
        <Badge
          status={status === 'Billing' ? 'success' : 'default'}
          text={status}
        />
      ),
    },
  ];

  // User allocation modal hook
  const {
    isUserAllocationModalVisible,
    selectedEmployee,
    userAllocationsList,
    userAllocationsForm,
    handleRowClick,
    handleUserAllocationCancel,
    handleAddUserAllocationRow,
    handleRemoveUserAllocationRow,
    handleUserAllocationFieldChange,
    handleUserAllocationsSubmit,
  } = useUserAllocationModal(allocationData);

  // Get unique tech stacks from allocation data for filter
  const uniqueTechStacks = useMemo(() => {
    if (!reportData?.tables?.byAllocation) return [];
    const techStacks = new Set();
    reportData.tables.byAllocation.forEach(item => {
      if (item.techStack) {
        techStacks.add(item.techStack);
      }
    });
    return Array.from(techStacks).sort();
  }, [reportData]);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({
        ...filters,
        start_date: undefined,
        end_date: undefined,
      });
    }
  };

  // Get date range value for RangePicker
  const dateRangeValue = useMemo(() => {
    if (filters.start_date && filters.end_date) {
      return [dayjs(filters.start_date), dayjs(filters.end_date)];
    }
    return null;
  }, [filters.start_date, filters.end_date]);

  return (
    <div className="external-consultants-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">EXTERNAL CONSULTANTS REPORT</h1>
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
                  <label>Track</label>
                  <Select
                    value={filters.track_id}
                    onChange={(value) => setFilters({ ...filters, track_id: value || undefined })}
                    style={{ width: '100%' }}
                    placeholder="All Tracks"
                    allowClear
                  >
                    {tracksList.map((track) => (
                      <Option key={track.id} value={track.id}>
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
                    value={filters.tech_stack}
                    onChange={(value) => setFilters({ ...filters, tech_stack: value || undefined })}
                    style={{ width: '100%' }}
                    placeholder="All Tech Stacks"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {uniqueTechStacks.map((techStack) => (
                      <Option key={techStack} value={techStack}>
                        {techStack}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Project</label>
                  <Select
                    value={filters.project_id}
                    onChange={(value) => setFilters({ ...filters, project_id: value || undefined })}
                    style={{ width: '100%' }}
                    placeholder="All Projects"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {projectsList.map((project) => (
                      <Option key={project.id} value={project.id}>
                        {project.project_name || project.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Duration Start and End Date</label>
                  <RangePicker
                    value={dateRangeValue}
                    onChange={handleDateRangeChange}
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Charts and KPI Section */}
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

      {/* Tables Section */}
      <Row gutter={[16, 16]} className="tables-section">
        {/* Left Table - BY PROJECT */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="BY PROJECT" loading={loading}>
            <CustomTable
              columns={projectColumns}
              dataSource={projectData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800, y: 400 }}
              size="small"
            />
          </Card>
        </Col>

        {/* Right Table - BY ALLOCATION */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="BY ALLOCATION" loading={loading}>
            <CustomTable
              columns={allocationColumns}
              dataSource={allocationData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900, y: 400 }}
              size="small"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>

      {/* User Allocations Modal */}
      <UserAllocationModal
        visible={isUserAllocationModalVisible}
        selectedEmployee={selectedEmployee}
        allocationsList={userAllocationsList}
        form={userAllocationsForm}
        onCancel={handleUserAllocationCancel}
        onAddRow={handleAddUserAllocationRow}
        onRemoveRow={handleRemoveUserAllocationRow}
        onFieldChange={handleUserAllocationFieldChange}
        onSubmit={handleUserAllocationsSubmit}
      />
    </div>
  );
};

export default ExternalConsultantsReport;
