import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Select, DatePicker, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import '@styles/pages/TrainingReport.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TrainingReport = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    designation: 'All',
    track: 'All',
    techStack: 'All',
    dateRange: null,
  });

  // Default filter values for comparison
  const defaultFilters = {
    designation: 'All',
    track: 'All',
    techStack: 'All',
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
  const totalEmployeesInTraining = 18;
  const totalEmployees = 114;
  const trainingPercentage = ((totalEmployeesInTraining / totalEmployees) * 100).toFixed(2);

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
    { track: 'Dev', count: 12, percentage: 66.67 },
    { track: 'Delivery', count: 3, percentage: 16.67 },
    { track: 'QA', count: 2, percentage: 11.11 },
    { track: 'BA', count: 1, percentage: 5.56 },
  ];

  // Tech Stack distribution data for bar chart
  const techStackData = [
    { techStack: '.NET', count: 6 },
    { techStack: 'Full Stack', count: 6 },
    { techStack: 'BA/PM', count: 2 },
    { techStack: 'QA', count: 2 },
    { techStack: 'Data Science', count: 1 },
    { techStack: 'Dynamics', count: 1 },
  ];

  // Designation distribution data for bar chart
  const designationData = [
    { designation: 'ASE', count: 6 },
    { designation: 'SE', count: 2 },
    { designation: 'ATL', count: 1 },
    { designation: 'Intern - QA', count: 1 },
    { designation: 'Intern - SE', count: 1 },
    { designation: 'Associate - Business Analyst', count: 1 },
    { designation: 'Associate Director - Dynamics', count: 1 },
    { designation: 'Associate Director - Project Management', count: 1 },
    { designation: 'Principal Solutions Architect', count: 1 },
    { designation: 'TL', count: 1 },
  ];

  // Calculate max counts for bar chart scaling
  const maxTechStackCount = Math.max(...techStackData.map(item => item.count));
  const maxDesignationCount = Math.max(...designationData.map(item => item.count));

  // Chart.js data for donut chart
  const donutChartData = {
    labels: trackData.map(item => item.track),
    datasets: [
      {
        data: trackData.map(item => item.count),
        backgroundColor: [colors.secondary, colors.primary, colors.gray, colors.purple],
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

  // Chart.js data for tech stack bar chart
  const techStackBarChartData = {
    labels: techStackData.map(item => item.techStack),
    datasets: [
      {
        label: 'Number of Employees',
        data: techStackData.map(item => item.count),
        backgroundColor: techStackData.map((item, index) =>
          index < 2 ? colors.secondary : colors.primary
        ),
        borderRadius: 4,
      },
    ],
  };

  const techStackBarChartOptions = {
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

  // Chart.js data for designation bar chart
  const designationBarChartData = {
    labels: designationData.map(item => item.designation),
    datasets: [
      {
        label: 'Number of Employees',
        data: designationData.map(item => item.count),
        backgroundColor: colors.pink,
        borderRadius: 4,
      },
    ],
  };

  const designationBarChartOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        beginAtZero: true,
        ticks: {
          ...commonOptions.scales.x.ticks,
          stepSize: 1,
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

  // BY DESIGNATION Table Columns
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
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 300,
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

  // Mock data for BY DESIGNATION table
  const designationTableData = [
    {
      key: '1',
      employeeName: 'Akeel Aliyar',
      track: 'Dev',
      techStack: 'Full Stack',
      designation: 'ASE',
    },
    {
      key: '2',
      employeeName: 'Anudi Divarathne',
      track: 'Dev',
      techStack: '.NET',
      designation: 'ASE',
    },
    {
      key: '3',
      employeeName: 'Avanthi Amunugama',
      track: 'Delivery',
      techStack: 'BA/PM',
      designation: 'Associate Director - Project Management and Business Consulting',
    },
    {
      key: '4',
      employeeName: 'Bhashini Wijesinghe',
      track: 'QA',
      techStack: 'QA',
      designation: 'Intern - QA',
    },
    {
      key: '5',
      employeeName: 'Chamalka Gamaralalage',
      track: 'Dev',
      techStack: 'Full Stack',
      designation: 'ATL',
    },
    {
      key: '6',
      employeeName: 'Chamath Randula',
      track: 'Dev',
      techStack: '.NET',
      designation: 'ASE',
    },
    {
      key: '7',
      employeeName: 'Chaminda Pragnarathne',
      track: 'Dev',
      techStack: 'Full Stack',
      designation: 'ASE',
    },
    {
      key: '8',
      employeeName: 'Chanka Sonnadara',
      track: 'Dev',
      techStack: '.NET',
      designation: 'ASE',
    },
    {
      key: '9',
      employeeName: 'Charith Bandara',
      track: 'Dev',
      techStack: 'Full Stack',
      designation: 'SE',
    },
    {
      key: '10',
      employeeName: 'Charith Jayasankha',
      track: 'Dev',
      techStack: '.NET',
      designation: 'ASE',
    },
    {
      key: '11',
      employeeName: 'Dilshan Perera',
      track: 'Dev',
      techStack: 'Full Stack',
      designation: 'SE',
    },
    {
      key: '12',
      employeeName: 'Gayan Silva',
      track: 'Dev',
      techStack: 'Data Science',
      designation: 'Principal Solutions Architect',
    },
    {
      key: '13',
      employeeName: 'Harsha Fernando',
      track: 'Dev',
      techStack: 'Dynamics',
      designation: 'Associate Director - Dynamics',
    },
    {
      key: '14',
      employeeName: 'Ishara Jayasuriya',
      track: 'Delivery',
      techStack: 'BA/PM',
      designation: 'Associate - Business Analyst',
    },
    {
      key: '15',
      employeeName: 'Janith Perera',
      track: 'Delivery',
      techStack: 'BA/PM',
      designation: 'TL',
    },
    {
      key: '16',
      employeeName: 'Kasun Wijesinghe',
      track: 'QA',
      techStack: 'QA',
      designation: 'Intern - SE',
    },
    {
      key: '17',
      employeeName: 'Lakshan De Silva',
      track: 'BA',
      techStack: 'BA/PM',
      designation: 'Associate Director - Project Management',
    },
    {
      key: '18',
      employeeName: 'Madhushan Perera',
      track: 'Dev',
      techStack: 'Full Stack',
      designation: 'ASE',
    },
  ];

  // Mock data for BY ALLOCATION table
  const allocationData = [
    {
      key: '1',
      employeeName: 'Avanthi Amunugama',
      allocatedDate: '02 May 2024',
      deallocatedDate: '02 Jul 2024',
      projectAllocation: '10.00%',
      duration: 20,
    },
    {
      key: '2',
      employeeName: 'Chanka Sonnadara',
      allocatedDate: '02 May 2024',
      deallocatedDate: '02 Jul 2024',
      projectAllocation: '50.00%',
      duration: 20,
    },
    {
      key: '3',
      employeeName: 'Chathurika Sandamali',
      allocatedDate: '02 May 2024',
      deallocatedDate: '02 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '4',
      employeeName: 'Ishadi Ranaweera',
      allocatedDate: '02 May 2024',
      deallocatedDate: '02 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '5',
      employeeName: 'Methmini Abeysekara',
      allocatedDate: '08 Apr 2024',
      deallocatedDate: '29 Nov 2024',
      projectAllocation: '50.00%',
      duration: 20,
    },
    {
      key: '6',
      employeeName: 'Nadeesha Gamage',
      allocatedDate: '15 May 2024',
      deallocatedDate: '15 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '7',
      employeeName: 'Oshada Karunarathne',
      allocatedDate: '01 Jun 2024',
      deallocatedDate: '30 Jun 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '8',
      employeeName: 'Prasanna Jayawardena',
      allocatedDate: '10 May 2024',
      deallocatedDate: '10 Jul 2024',
      projectAllocation: '75.00%',
      duration: 20,
    },
    {
      key: '9',
      employeeName: 'Ravindu Perera',
      allocatedDate: '05 Jun 2024',
      deallocatedDate: '05 Aug 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '10',
      employeeName: 'Sachith Silva',
      allocatedDate: '12 May 2024',
      deallocatedDate: '12 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '11',
      employeeName: 'Tharindu Fernando',
      allocatedDate: '20 May 2024',
      deallocatedDate: '20 Jul 2024',
      projectAllocation: '50.00%',
      duration: 20,
    },
    {
      key: '12',
      employeeName: 'Udayanga Wijesinghe',
      allocatedDate: '01 Jun 2024',
      deallocatedDate: '01 Aug 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '13',
      employeeName: 'Vishwa Perera',
      allocatedDate: '15 May 2024',
      deallocatedDate: '15 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '14',
      employeeName: 'Wasantha Silva',
      allocatedDate: '25 May 2024',
      deallocatedDate: '25 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '15',
      employeeName: 'Yasitha Fernando',
      allocatedDate: '10 Jun 2024',
      deallocatedDate: '10 Aug 2024',
      projectAllocation: '75.00%',
      duration: 20,
    },
    {
      key: '16',
      employeeName: 'Zainab Nazeer',
      allocatedDate: '05 May 2024',
      deallocatedDate: '05 Jul 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '17',
      employeeName: 'Akeel Aliyar',
      allocatedDate: '01 Jun 2024',
      deallocatedDate: '28 Jun 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
    {
      key: '18',
      employeeName: 'Anudi Divarathne',
      allocatedDate: '01 Jun 2024',
      deallocatedDate: '28 Jun 2024',
      projectAllocation: '100.00%',
      duration: 20,
    },
  ];

  return (
    <div className="training-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">TRAINING REPORT</h1>
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
                  <label>Designation</label>
                  <Select
                    value={filters.designation}
                    onChange={(value) => setFilters({ ...filters, designation: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="ASE">ASE</Option>
                    <Option value="SE">SE</Option>
                    <Option value="ATL">ATL</Option>
                    <Option value="TL">TL</Option>
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
                    <Option value="Delivery">Delivery</Option>
                    <Option value="QA">QA</Option>
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
                    <Option value="BA/PM">BA/PM</Option>
                    <Option value="QA">QA</Option>
                    <Option value="Data Science">Data Science</Option>
                    <Option value="Dynamics">Dynamics</Option>
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
          <Card className="chart-card" title="No. of Employees in Training by Track">
            <div className="chart-container">
              <Doughnut data={donutChartData} options={donutChartOptions} />
            </div>
          </Card>
        </Col>

        {/* Center KPI Card */}
        <Col xs={24} lg={8}>
          <Card className="kpi-card-large">
            <div className="kpi-circle">
              <div className="kpi-value-large">{totalEmployeesInTraining}</div>
              <div className="kpi-label-large">EMPLOYEES IN TRAINING</div>
              <div className="kpi-percentage">{trainingPercentage}%</div>
              <div className="kpi-sub-label">OF ALL EMPLOYEES</div>
            </div>
          </Card>
        </Col>

        {/* Right Chart - Bar Chart */}
        <Col xs={24} lg={8}>
          <Card className="chart-card" title="No. of Employees in Training by Tech Stack">
            <div className="chart-container">
              <Bar data={techStackBarChartData} options={techStackBarChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tables Section */}
      <Row gutter={[16, 16]} className="tables-section">
        {/* Left Table - BY DESIGNATION */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="BY DESIGNATION">
            <CustomTable
              columns={designationColumns}
              dataSource={designationTableData}
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

      {/* Designation Chart Section */}
      <Row gutter={[16, 16]} className="designation-chart-section">
        <Col xs={24}>
          <Card className="chart-card" title="No. of Employees by Designation">
            <div className="chart-container">
              <Bar data={designationBarChartData} options={designationBarChartOptions} />
            </div>
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

export default TrainingReport;
