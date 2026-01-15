import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Select, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import '@styles/pages/BenchReport.scss';

const { Option } = Select;

const BenchReport = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    projectName: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
    designation: 'All',
    tier: 'All',
  });

  // Default filter values for comparison
  const defaultFilters = {
    projectName: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
    designation: 'All',
    tier: 'All',
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

  // KPI Data - Mock data for bench
  const totalBenchCount = 15;
  const totalEmployees = 114;
  const benchPercentage = ((totalBenchCount / totalEmployees) * 100).toFixed(1);

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
  } = useUserAllocationModal(benchData);

  // Table Columns - Same as BY ALLOCATION
  const allocationColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 150,
    },
    {
      title: 'Project Allocated Date',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      width: 160,
    },
    {
      title: 'Project Deallocated Date',
      dataIndex: 'deallocatedDate',
      key: 'deallocatedDate',
      width: 180,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 130,
    },
    {
      title: 'Billing Percentage',
      dataIndex: 'billingPercentage',
      key: 'billingPercentage',
      width: 140,
    },
    {
      title: 'Project Allocation',
      dataIndex: 'projectAllocation',
      key: 'projectAllocation',
      width: 140,
    },
    {
      title: 'Duration (Days)',
      dataIndex: 'duration',
      key: 'duration',
      width: 130,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
  ];

  // Mock bench data - filtered to show only Bench billing status
  const benchData = [
    {
      key: '1',
      employeeName: 'Amaniya Faizal',
      project: 'Bench',
      allocatedDate: '02 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '2',
      employeeName: 'Anushka Wickramaratne',
      project: 'Bench',
      allocatedDate: '01 Nov 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '3',
      employeeName: 'Chaminda Pragnarathne',
      project: 'Bench',
      allocatedDate: '15 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '4',
      employeeName: 'Charith Bandara',
      project: 'Bench',
      allocatedDate: '20 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '50.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '5',
      employeeName: 'Dilshan Perera',
      project: 'Bench',
      allocatedDate: '10 Nov 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '6',
      employeeName: 'Gayan Silva',
      project: 'Bench',
      allocatedDate: '05 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '7',
      employeeName: 'Harsha Fernando',
      project: 'Bench',
      allocatedDate: '18 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '8',
      employeeName: 'Ishara Jayasuriya',
      project: 'Bench',
      allocatedDate: '22 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '9',
      employeeName: 'Janith Perera',
      project: 'Bench',
      allocatedDate: '08 Nov 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '10',
      employeeName: 'Kasun Wijesinghe',
      project: 'Bench',
      allocatedDate: '12 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '11',
      employeeName: 'Lakshan De Silva',
      project: 'Bench',
      allocatedDate: '25 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '12',
      employeeName: 'Madhushan Perera',
      project: 'Bench',
      allocatedDate: '30 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '13',
      employeeName: 'Nadeesha Gamage',
      project: 'Bench',
      allocatedDate: '14 Nov 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '14',
      employeeName: 'Oshada Karunarathne',
      project: 'Bench',
      allocatedDate: '03 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '15',
      employeeName: 'Prasanna Jayawardena',
      project: 'Bench',
      allocatedDate: '28 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Bench',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
  ];

  return (
    <div className="bench-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">BENCH REPORT</h1>
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
                    <Option value="Bench">Bench</Option>
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
                  >
                    <Option value="All">All</Option>
                    <Option value="Randika Swaris">Randika Swaris</Option>
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
            </Row>
          </div>
        )}
      </Card>

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{totalBenchCount}</div>
            <div className="kpi-label">TOTAL BENCH COUNT</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{benchPercentage}%</div>
            <div className="kpi-label">BENCH PERCENTAGE</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="BY ALLOCATION">
        <CustomTable
          columns={allocationColumns}
          dataSource={benchData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          size="small"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

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

export default BenchReport;
