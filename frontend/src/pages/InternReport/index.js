import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Select, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { accountManagersService } from '@api';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import '@styles/pages/InternReport.scss';

const { Option } = Select;

const InternReport = () => {
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
        // console.error('Failed to fetch account managers for InternReport:', error);
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

  // KPI Data - Mock data for interns
  const totalInternCount = 8;
  const totalEmployees = 114;
  const internPercentage = ((totalInternCount / totalEmployees) * 100).toFixed(1);

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
  } = useUserAllocationModal(internData);

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

  // Mock intern data
  const internData = [
    {
      key: '1',
      employeeName: 'Amali Perera',
      project: 'Training',
      allocatedDate: '01 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Training',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '2',
      employeeName: 'Buddhika Silva',
      project: 'Seer Insights',
      allocatedDate: '15 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Non-Billing',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '3',
      employeeName: 'Chamara Fernando',
      project: 'Training',
      allocatedDate: '20 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Training',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '4',
      employeeName: 'Dilani Jayasuriya',
      project: 'Healthfinder',
      allocatedDate: '05 Nov 2025',
      deallocatedDate: '',
      billingStatus: 'Non-Billing',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '5',
      employeeName: 'Eranda Wijesinghe',
      project: 'Training',
      allocatedDate: '10 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Training',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '6',
      employeeName: 'Fathima Nazeer',
      project: 'MillionSpaces',
      allocatedDate: '25 Oct 2025',
      deallocatedDate: '',
      billingStatus: 'Non-Billing',
      billingPercentage: '0.00%',
      projectAllocation: '50.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '7',
      employeeName: 'Gayani Perera',
      project: 'Training',
      allocatedDate: '12 Nov 2025',
      deallocatedDate: '',
      billingStatus: 'Training',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
    {
      key: '8',
      employeeName: 'Harshani De Silva',
      project: 'Seer Home Page',
      allocatedDate: '18 Sep 2025',
      deallocatedDate: '',
      billingStatus: 'Non-Billing',
      billingPercentage: '0.00%',
      projectAllocation: '100.00%',
      duration: 1,
      status: 'Active',
    },
  ];

  return (
    <div className="intern-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">INTERN REPORT</h1>
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
                    <Option value="Training">Training</Option>
                    <Option value="Seer Insights">Seer Insights</Option>
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
            <div className="kpi-value">{totalInternCount}</div>
            <div className="kpi-label">TOTAL INTERN COUNT</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{internPercentage}%</div>
            <div className="kpi-label">INTERN PERCENTAGE</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="BY ALLOCATION">
        <CustomTable
          columns={allocationColumns}
          dataSource={internData}
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

export default InternReport;
