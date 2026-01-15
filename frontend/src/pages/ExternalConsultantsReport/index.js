import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Select, DatePicker, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import '@styles/pages/ExternalConsultantsReport.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ExternalConsultantsReport = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    track: 'All',
    techStack: 'All',
    project: 'All',
    dateRange: null,
  });

  // Default filter values for comparison
  const defaultFilters = {
    track: 'All',
    techStack: 'All',
    project: 'All',
    dateRange: null,
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

  // KPI Data
  const totalExternalConsultants = 13;
  const totalEmployees = 114;
  const externalConsultantsPercentage = ((totalExternalConsultants / totalEmployees) * 100).toFixed(2);

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

  // Track distribution data for donut chart
  const trackData = [
    { track: 'Dev', count: 9, percentage: 69.23 },
    { track: 'PM', count: 2, percentage: 15.38 },
    { track: 'Support', count: 1, percentage: 7.69 },
    { track: 'UX', count: 1, percentage: 7.69 },
  ];

  // Tech Stack distribution data for bar chart
  const techStackData = [
    { techStack: 'Dynamics', count: 6 },
    { techStack: '.NET', count: 2 },
    { techStack: 'BA/PM', count: 2 },
    { techStack: 'HR', count: 1 },
    { techStack: 'Power Apps', count: 1 },
    { techStack: 'UX', count: 1 },
  ];

  // Calculate max count for bar chart scaling
  const maxTechStackCount = Math.max(...techStackData.map(item => item.count));

  // Chart.js data for donut chart
  const donutChartData = {
    labels: trackData.map(item => item.track),
    datasets: [
      {
        data: trackData.map(item => item.count),
        backgroundColor: [colors.secondary, colors.primary, colors.pink, colors.error],
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
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Chart.js data for bar chart
  const barChartData = {
    labels: techStackData.map(item => item.techStack),
    datasets: [
      {
        label: 'Number of Consultants',
        data: techStackData.map(item => item.count),
        backgroundColor: techStackData.map((item, index) =>
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

  // BY PROJECT Table Columns
  const projectColumns = [
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
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 200,
    },
  ];

  // BY ALLOCATION Table Columns
  const allocationColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
    },
    {
      title: 'Project Allocated Date',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      width: 180,
    },
    {
      title: 'Project Deallocated Date',
      dataIndex: 'deallocatedDate',
      key: 'deallocatedDate',
      width: 180,
    },
    {
      title: 'Project Allocation',
      dataIndex: 'projectAllocation',
      key: 'projectAllocation',
      width: 150,
    },
    {
      title: 'Duration (Days)',
      dataIndex: 'duration',
      key: 'duration',
      width: 150,
    },
  ];

  // Mock data for BY PROJECT table
  const projectData = [
    {
      key: '1',
      employeeName: 'Burhanudheen Thassim',
      track: 'PM',
      techStack: 'BA/PM',
      project: 'Bench/Presale',
    },
    {
      key: '2',
      employeeName: 'Dilukshika Liyanage',
      track: 'Support',
      techStack: 'HR',
      project: 'Support',
    },
    {
      key: '3',
      employeeName: 'Gayan Coomasaru',
      track: 'Dev',
      techStack: '.NET',
      project: 'DXC Technology',
    },
    {
      key: '4',
      employeeName: 'Gayan Wimalarathna',
      track: 'Dev',
      techStack: 'Power Apps',
      project: 'Clearly Cloudy/Extrensica Global',
    },
    {
      key: '5',
      employeeName: 'Hasith Wanniarachchi',
      track: 'Dev',
      techStack: 'Dynamics',
      project: 'Extrensica Global',
    },
    {
      key: '6',
      employeeName: 'Ismail Tunca',
      track: 'Dev',
      techStack: 'Dynamics',
      project: 'F&O Update Project/Mint',
    },
    {
      key: '7',
      employeeName: 'Manoharalingam Muhunthan',
      track: 'Dev',
      techStack: 'Dynamics',
      project: 'Presale - Power Intel',
    },
    {
      key: '8',
      employeeName: 'Nuwan Sampath',
      track: 'Dev',
      techStack: 'Dynamics',
      project: 'Mint - Support',
    },
    {
      key: '9',
      employeeName: 'Prasanna Jayawardena',
      track: 'Dev',
      techStack: 'Dynamics',
      project: 'Extrensica Global',
    },
    {
      key: '10',
      employeeName: 'Ravindu Perera',
      track: 'Dev',
      techStack: '.NET',
      project: 'DXC Technology',
    },
    {
      key: '11',
      employeeName: 'Sachith Silva',
      track: 'PM',
      techStack: 'BA/PM',
      project: 'Presale',
    },
    {
      key: '12',
      employeeName: 'Srihan De Mel',
      track: 'Dev',
      techStack: 'Dynamics',
      project: 'Extrensica Global',
    },
    {
      key: '13',
      employeeName: 'Tharindu Fernando',
      track: 'UX',
      techStack: 'UX',
      project: 'Presale',
    },
  ];

  // Mock data for BY ALLOCATION table
  const allocationData = [
    {
      key: '1',
      employeeName: 'Burhanudheen Thassim',
      allocatedDate: '01 Jul 2020',
      deallocatedDate: '31 May 2024',
      projectAllocation: '0.00%',
      duration: 1023,
    },
    {
      key: '2',
      employeeName: 'Gayan Coomasaru',
      allocatedDate: '01 Jan 2024',
      deallocatedDate: '01 Apr 2025',
      projectAllocation: '75.00%',
      duration: 144,
    },
    {
      key: '3',
      employeeName: 'Srihan De Mel',
      allocatedDate: '01 Jan 2024',
      deallocatedDate: '04 Aug 2025',
      projectAllocation: '200.00%',
      duration: 144,
    },
    {
      key: '4',
      employeeName: 'Ismail Tunca',
      allocatedDate: '01 Mar 2024',
      deallocatedDate: '31 May 2024',
      projectAllocation: '25.00%',
      duration: 66,
    },
    {
      key: '5',
      employeeName: 'Hasith Wanniarachchi',
      allocatedDate: '01 Jun 2024',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '6',
      employeeName: 'Gayan Wimalarathna',
      allocatedDate: '01 Sep 2024',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '7',
      employeeName: 'Manoharalingam Muhunthan',
      allocatedDate: '01 Oct 2024',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '8',
      employeeName: 'Nuwan Sampath',
      allocatedDate: '01 Nov 2024',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '9',
      employeeName: 'Dilukshika Liyanage',
      allocatedDate: '01 Dec 2024',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '10',
      employeeName: 'Prasanna Jayawardena',
      allocatedDate: '01 Jan 2025',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '11',
      employeeName: 'Ravindu Perera',
      allocatedDate: '01 Feb 2025',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '12',
      employeeName: 'Sachith Silva',
      allocatedDate: '01 Mar 2025',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
    {
      key: '13',
      employeeName: 'Tharindu Fernando',
      allocatedDate: '01 Apr 2025',
      deallocatedDate: '',
      projectAllocation: '100.00%',
      duration: 1,
    },
  ];

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
                    value={filters.track}
                    onChange={(value) => setFilters({ ...filters, track: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Dev">Dev</Option>
                    <Option value="PM">PM</Option>
                    <Option value="Support">Support</Option>
                    <Option value="UX">UX</Option>
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
                    <Option value="Dynamics">Dynamics</Option>
                    <Option value=".NET">.NET</Option>
                    <Option value="BA/PM">BA/PM</Option>
                    <Option value="HR">HR</Option>
                    <Option value="Power Apps">Power Apps</Option>
                    <Option value="UX">UX</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Project</label>
                  <Select
                    value={filters.project}
                    onChange={(value) => setFilters({ ...filters, project: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Extrensica Global">Extrensica Global</Option>
                    <Option value="DXC Technology">DXC Technology</Option>
                    <Option value="Presale">Presale</Option>
                    <Option value="Mint">Mint</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Duration Start and End Date</label>
                  <RangePicker
                    value={filters.dateRange}
                    onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
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
          <Card className="chart-card" title="No. of External Consultants by Track">
            <div className="chart-container">
              <Doughnut data={donutChartData} options={donutChartOptions} />
            </div>
          </Card>
        </Col>

        {/* Center KPI Card */}
        <Col xs={24} lg={8}>
          <Card className="kpi-card-large">
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
          <Card className="chart-card" title="No. of External Consultants by Tech Stack">
            <div className="chart-container">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tables Section */}
      <Row gutter={[16, 16]} className="tables-section">
        {/* Left Table - BY PROJECT */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="BY PROJECT">
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
          <Card className="table-card" title="BY ALLOCATION">
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
