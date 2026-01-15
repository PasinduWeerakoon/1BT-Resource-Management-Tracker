import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Table, Space, Form, Input, InputNumber, Select, DatePicker, Upload, Avatar, Tooltip, Tabs, Badge } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, UserOutlined, UploadOutlined, FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import dayjs from 'dayjs';
import '@styles/pages/Resources.scss';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Resources = () => {
  const [form] = Form.useForm();
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    tier: 'All',
    position: 'All',
    status: 'All',
    joinDateRange: null,
    employeeNumber: '',
    name: '',
  });

  // Default filter values for comparison
  const defaultFilters = {
    tier: 'All',
    position: 'All',
    status: 'All',
    joinDateRange: null,
    employeeNumber: '',
    name: '',
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

  const [employees, setEmployees] = useState([
    // Mock data - will be replaced with API call
    {
      key: '1',
      employeeNumber: 'EMP001',
      name: 'John Doe',
      tier: 'Tier 01',
      position: 'Senior Software Engineer',
      joinDate: '2023-01-15',
      status: 'Active',
      photo: null,
    },
    {
      key: '2',
      employeeNumber: 'EMP002',
      name: 'Jane Smith',
      tier: 'Tier 02',
      position: 'Software Engineer',
      joinDate: '2023-03-20',
      status: 'Active',
      photo: null,
    },
  ]);

  // Handle Add Employee
  const handleAddEmployee = () => {
    setIsEditMode(false);
    setSelectedEmployee(null);
    form.resetFields();
    setIsAddEmployeeModalVisible(true);
  };

  // Handle Edit Employee
  const handleEditEmployee = (record) => {
    setIsEditMode(true);
    setSelectedEmployee(record);
    form.setFieldsValue({
      ...record,
      joinDate: record.joinDate ? dayjs(record.joinDate) : null,
      bod: record.bod ? dayjs(record.bod) : null,
    });
    setIsAddEmployeeModalVisible(true);
  };

  // Handle View Profile
  const handleViewProfile = (record) => {
    setSelectedEmployee(record);
    setIsProfileModalVisible(true);
  };

  // Handle Add/Edit Employee Submit
  const handleEmployeeSubmit = async () => {
    try {
      const values = await form.validateFields();
      const employeeData = {
        ...values,
        joinDate: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null,
        bod: values.bod ? values.bod.format('YYYY-MM-DD') : null,
        photo: values.photo ? values.photo.fileList?.[0]?.thumbUrl : null,
      };

      if (isEditMode) {
        // Update existing employee
        setEmployees(employees.map(emp => 
          emp.key === selectedEmployee.key 
            ? { ...emp, ...employeeData, key: emp.key }
            : emp
        ));
      } else {
        // Add new employee
        const newEmployee = {
          ...employeeData,
          key: `EMP${String(employees.length + 1).padStart(3, '0')}`,
          employeeNumber: employeeData.employeeNumber || `EMP${String(employees.length + 1).padStart(3, '0')}`,
          status: employeeData.status || 'Active',
        };
        setEmployees([...employees, newEmployee]);
        
        // Auto-assign new employee to Bench project
        // This should be done via API call in production
        // For now, we log it - the backend should handle this automatically
        console.log('New employee added, auto-assigning to Bench project:', {
          employeeNumber: newEmployee.employeeNumber,
          employeeName: newEmployee.name,
          project: 'Bench',
          allocation: 100,
          billingStatus: 'Bench',
          status: 'Active',
        });
        
        // TODO: Make API call to create allocation
        // await createAllocation({
        //   employeeId: newEmployee.employeeNumber,
        //   projectId: 'BENCH_PROJECT_ID',
        //   projectAllocation: 100,
        //   billingStatus: 'Bench',
        //   status: 'Active',
        // });
      }

      setIsAddEmployeeModalVisible(false);
      form.resetFields();
      setSelectedEmployee(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    setIsAddEmployeeModalVisible(false);
    form.resetFields();
    setSelectedEmployee(null);
    setIsEditMode(false);
  };

  // Filter employees based on active filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      if (filters.tier !== 'All' && employee.tier !== filters.tier) return false;
      if (filters.position !== 'All' && employee.position !== filters.position) return false;
      if (filters.status !== 'All' && employee.status !== filters.status) return false;
      if (filters.employeeNumber && !employee.employeeNumber.toLowerCase().includes(filters.employeeNumber.toLowerCase())) return false;
      if (filters.name && !employee.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.joinDateRange && filters.joinDateRange.length === 2) {
        const joinDate = dayjs(employee.joinDate);
        const startDate = filters.joinDateRange[0];
        const endDate = filters.joinDateRange[1];
        if (!joinDate.isBetween(startDate, endDate, 'day', '[]')) return false;
      }
      return true;
    });
  }, [employees, filters]);

  // Get unique values for filter dropdowns
  const uniqueTiers = useMemo(() => {
    return [...new Set(employees.map(emp => emp.tier))].sort();
  }, [employees]);

  const uniquePositions = useMemo(() => {
    return [...new Set(employees.map(emp => emp.position))].sort();
  }, [employees]);

  // Table columns
  const columns = [
    {
      title: 'Employee Number',
      dataIndex: 'employeeNumber',
      key: 'employeeNumber',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 200,
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Profile">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewProfile(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditEmployee(record)}
              className="action-icon-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Mock allocation data for profile
  const getAllocationData = (employeeKey) => {
    return [
      { month: 'Jan 2024', billing: 100, nonBilling: 0, training: 0 },
      { month: 'Feb 2024', billing: 95, nonBilling: 5, training: 0 },
      { month: 'Mar 2024', billing: 90, nonBilling: 10, training: 0 },
      { month: 'Apr 2024', billing: 85, nonBilling: 15, training: 0 },
      { month: 'May 2024', billing: 80, nonBilling: 20, training: 0 },
      { month: 'Jun 2024', billing: 75, nonBilling: 25, training: 0 },
    ];
  };

  // Chart data for profile
  const getProfileChartData = (employeeKey) => {
    const allocationData = getAllocationData(employeeKey);
    
    return {
      allocationHistory: {
        labels: allocationData.map(d => d.month),
        datasets: [
          {
            label: 'Billing',
            data: allocationData.map(d => d.billing),
            borderColor: colors.primary,
            backgroundColor: colors.primary,
            tension: 0.1,
          },
          {
            label: 'Non-Billing',
            data: allocationData.map(d => d.nonBilling),
            borderColor: colors.secondary,
            backgroundColor: colors.secondary,
            tension: 0.1,
          },
          {
            label: 'Training',
            data: allocationData.map(d => d.training),
            borderColor: colors.pink,
            backgroundColor: colors.pink,
            tension: 0.1,
          },
        ],
      },
      projectDistribution: {
        labels: ['Billing', 'Non-Billing', 'Training', 'Bench'],
        datasets: [{
          data: [60, 20, 10, 10],
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.pink,
            colors.gray,
          ],
        }],
      },
      allocationByProject: {
        labels: ['Project A', 'Project B', 'Project C', 'Bench'],
        datasets: [{
          label: 'Allocation %',
          data: [50, 30, 20, 0],
          backgroundColor: colors.primary,
        }],
      },
    };
  };

  return (
    <div className="resources-page">
      <div className="resources-header">
        <h1 className="page-title">EMPLOYEE MANAGEMENT</h1>
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
                  <label>Tier</label>
                  <Select
                    value={filters.tier}
                    onChange={(value) => setFilters({ ...filters, tier: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    {uniqueTiers.map(tier => (
                      <Option key={tier} value={tier}>{tier}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Position</label>
                  <Select
                    value={filters.position}
                    onChange={(value) => setFilters({ ...filters, position: value })}
                    style={{ width: '100%' }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {uniquePositions.map(position => (
                      <Option key={position} value={position}>{position}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Status</label>
                  <Select
                    value={filters.status}
                    onChange={(value) => setFilters({ ...filters, status: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                    <Option value="Serving Notice Period">Serving Notice Period</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Join Date Range</label>
                  <RangePicker
                    style={{ width: '100%' }}
                    value={filters.joinDateRange}
                    onChange={(dates) => setFilters({ ...filters, joinDateRange: dates })}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Employee Number</label>
                  <Input
                    placeholder="Search by employee number"
                    value={filters.employeeNumber}
                    onChange={(e) => setFilters({ ...filters, employeeNumber: e.target.value })}
                    allowClear
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Name</label>
                  <Input
                    placeholder="Search by name"
                    value={filters.name}
                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    allowClear
                  />
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <Card className="employees-table-card">
        <div className="employees-table-header">
          <div className="table-header-left">
            <span className="table-title">Employee List</span>
          </div>
          <div className="table-header-actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddEmployee}
            >
              Add New Employee
            </Button>
          </div>
        </div>
        <CustomTable
          columns={columns}
          dataSource={filteredEmployees}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Add/Edit Employee Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Employee Details' : 'Add New Employee'}
        open={isAddEmployeeModalVisible}
        onClose={handleCancel}
        width={900}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: handleCancel,
          },
          {
            text: isEditMode ? 'Update Details' : 'Add Employee',
            type: 'primary',
            onClick: handleEmployeeSubmit,
          },
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Employee Number"
                name="employeeNumber"
                rules={[{ required: true, message: 'Employee number is required' }]}
              >
                <Input placeholder="Enter employee number" disabled={isEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tier"
                name="tier"
                rules={[{ required: true, message: 'Tier is required' }]}
              >
                <Select placeholder="Select tier">
                  <Option value="Tier 01">Tier 01</Option>
                  <Option value="Tier 02">Tier 02</Option>
                  <Option value="Tier 03">Tier 03</Option>
                  <Option value="Tier 04">Tier 04</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Position"
                name="position"
                rules={[{ required: true, message: 'Position is required' }]}
              >
                <Input placeholder="Enter position" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Join Date"
                name="joinDate"
                rules={[{ required: true, message: 'Join date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select join date" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Date of Birth (BOD)"
                name="bod"
                rules={[{ required: true, message: 'Date of birth is required' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="NIC or Passport"
                name="nicOrPassport"
                rules={[{ required: true, message: 'NIC or Passport is required' }]}
              >
                <Input placeholder="Enter NIC or Passport number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Status is required' }]}
              >
                <Select placeholder="Select status">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="Serving Notice Period">Serving Notice Period</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Address"
                name="address"
              >
                <TextArea rows={3} placeholder="Enter address" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Photo"
                name="photo"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) {
                    return e;
                  }
                  return e?.fileList;
                }}
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CustomModal>

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <CustomModal
          title={`${selectedEmployee.name} - Employee Profile`}
          open={isProfileModalVisible}
          onClose={() => {
            setIsProfileModalVisible(false);
            setSelectedEmployee(null);
          }}
          width={1400}
          className="employee-profile-modal"
          buttons={[
            {
              text: 'Close',
              type: 'default',
              onClick: () => {
                setIsProfileModalVisible(false);
                setSelectedEmployee(null);
              },
            },
          ]}
        >
          <Tabs
            defaultActiveKey="overview"
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Row gutter={24}>
                      <Col xs={24} md={8}>
                        <Card>
                          <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <Avatar
                              size={120}
                              src={selectedEmployee.photo}
                              icon={<UserOutlined />}
                            />
                            <h2 style={{ marginTop: 16, marginBottom: 8 }}>{selectedEmployee.name}</h2>
                            <p style={{ color: '#8c8c8c' }}>{selectedEmployee.position}</p>
                          </div>
                          <div style={{ marginTop: 20 }}>
                            <p><strong>Employee Number:</strong> {selectedEmployee.employeeNumber}</p>
                            <p><strong>Tier:</strong> {selectedEmployee.tier}</p>
                            <p><strong>Join Date:</strong> {selectedEmployee.joinDate}</p>
                            <p><strong>Status:</strong> {selectedEmployee.status}</p>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} md={16}>
                        <Card title="Allocation History" style={{ marginBottom: 16 }}>
                          <div style={{ height: 300 }}>
                            <Line
                              data={getProfileChartData(selectedEmployee.key).allocationHistory}
                              options={{
                                ...commonOptions,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    ...commonOptions.scales.y,
                                    min: 0,
                                    max: 100,
                                    ticks: {
                                      ...commonOptions.scales.y.ticks,
                                      callback: (value) => value + '%',
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                        </Card>
                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Card title="Project Distribution">
                              <div style={{ height: 250 }}>
                                <Doughnut
                                  data={getProfileChartData(selectedEmployee.key).projectDistribution}
                                  options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                  }}
                                />
                              </div>
                            </Card>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Card title="Allocation by Project">
                              <div style={{ height: 250 }}>
                                <Bar
                                  data={getProfileChartData(selectedEmployee.key).allocationByProject}
                                  options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                    scales: {
                                      y: {
                                        ...commonOptions.scales.y,
                                        min: 0,
                                        max: 100,
                                        ticks: {
                                          ...commonOptions.scales.y.ticks,
                                          callback: (value) => value + '%',
                                        },
                                      },
                                    },
                                  }}
                                />
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'allocations',
                label: 'Project Allocations',
                children: (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <CustomTable
                      columns={[
                        { title: 'Project', dataIndex: 'project', key: 'project', width: 150, fixed: 'left' },
                        { title: 'Project Allocated Date', dataIndex: 'allocatedDate', key: 'allocatedDate', width: 150 },
                        { title: 'Project Deallocated Date', dataIndex: 'deallocatedDate', key: 'deallocatedDate', width: 180 },
                        { title: 'Billing Status', dataIndex: 'billingStatus', key: 'billingStatus', width: 130 },
                        { title: 'Billing Percentage', dataIndex: 'billingPercentage', key: 'billingPercentage', width: 150 },
                        { title: 'Project Allocation', dataIndex: 'projectAllocation', key: 'projectAllocation', width: 150 },
                        { title: 'Duration (Days)', dataIndex: 'duration', key: 'duration', width: 130 },
                      ]}
                      dataSource={[
                        {
                          key: '1',
                          project: 'Project A',
                          allocatedDate: '2024-01-15',
                          deallocatedDate: '-',
                          billingStatus: 'Billing',
                          billingPercentage: '50%',
                          projectAllocation: '50%',
                          duration: '165',
                        },
                        {
                          key: '2',
                          project: 'Project B',
                          allocatedDate: '2024-02-01',
                          deallocatedDate: '2024-05-31',
                          billingStatus: 'Billing',
                          billingPercentage: '30%',
                          projectAllocation: '30%',
                          duration: '120',
                        },
                        {
                          key: '3',
                          project: 'Bench',
                          allocatedDate: '2024-06-01',
                          deallocatedDate: '-',
                          billingStatus: 'Bench',
                          billingPercentage: '0%',
                          projectAllocation: '20%',
                          duration: '90',
                        },
                      ]}
                      scroll={{ x: 1000 }}
                      pagination={false}
                    />
                  </div>
                ),
              },
              {
                key: 'history',
                label: 'Projects History',
                children: (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <CustomTable
                      columns={[
                        { title: 'Project', dataIndex: 'project', key: 'project', width: 150, fixed: 'left' },
                        { title: 'Project Allocated Date', dataIndex: 'allocatedDate', key: 'allocatedDate', width: 150 },
                        { title: 'Project Deallocated Date', dataIndex: 'deallocatedDate', key: 'deallocatedDate', width: 180 },
                        { title: 'Billing Status', dataIndex: 'billingStatus', key: 'billingStatus', width: 130 },
                        { title: 'Billing Percentage', dataIndex: 'billingPercentage', key: 'billingPercentage', width: 150 },
                        { title: 'Project Allocation', dataIndex: 'projectAllocation', key: 'projectAllocation', width: 150 },
                        { title: 'Duration (Days)', dataIndex: 'duration', key: 'duration', width: 130 },
                      ]}
                      dataSource={[
                        {
                          key: '1',
                          project: 'Project A',
                          allocatedDate: '2024-01-15',
                          deallocatedDate: '2024-06-30',
                          billingStatus: 'Billing',
                          billingPercentage: '50%',
                          projectAllocation: '50%',
                          duration: '165',
                        },
                        {
                          key: '2',
                          project: 'Project B',
                          allocatedDate: '2024-02-01',
                          deallocatedDate: '2024-05-31',
                          billingStatus: 'Billing',
                          billingPercentage: '30%',
                          projectAllocation: '30%',
                          duration: '120',
                        },
                        {
                          key: '3',
                          project: 'Project C',
                          allocatedDate: '2023-06-01',
                          deallocatedDate: '2023-12-31',
                          billingStatus: 'Billing',
                          billingPercentage: '100%',
                          projectAllocation: '100%',
                          duration: '214',
                        },
                      ]}
                      scroll={{ x: 1000 }}
                      pagination={false}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CustomModal>
      )}
    </div>
  );
};

export default Resources;
