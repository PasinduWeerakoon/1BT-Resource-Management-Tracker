import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Button, Table, Space, Form, Input, InputNumber, Select, DatePicker, Upload, Avatar, Tooltip, Tabs, Badge, App, Switch, Modal } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, UserOutlined, UploadOutlined, FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import { resourcesService, designationsService, tracksService, tagsService } from '@api';
import { showErrorToast, showWarningToast } from '@utils/toast.utils';
import dayjs from 'dayjs';
import '@styles/pages/Resources.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Resources = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    tier: 'All',
    status: 'All',
    employeeNumber: '',
    name: '',
    track_id: undefined,
    designation_id: undefined,
  });

  // Refs to prevent duplicate API calls
  const dropdownDataFetched = useRef(false);

  // Default filter values for comparison
  const defaultFilters = {
    tier: 'All',
    status: 'All',
    employeeNumber: '',
    name: '',
    track_id: undefined,
    designation_id: undefined,
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

  const [employees, setEmployees] = useState([]);
  const [employeeAllocations, setEmployeeAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [updatingAccountManager, setUpdatingAccountManager] = useState({});
  const [updatingTier, setUpdatingTier] = useState({});
  const [updatingTechStack, setUpdatingTechStack] = useState({});

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

    // Extract tag IDs from tags array
    const tagIds = record.tags && Array.isArray(record.tags)
      ? record.tags.map(tag => tag.id || tag).filter(Boolean)
      : [];

    form.setFieldsValue({
      ...record,
      // Map API field names to form field names
      mobile: record.phone_number || record.mobile,
      nicOrPassport: record.nic_passport || record.nic,
      bod: record.date_of_birth ? dayjs(record.date_of_birth) : (record.bod ? dayjs(record.bod) : null),
      joinDate: record.date_of_joining ? dayjs(record.date_of_joining) : (record.joinDate ? dayjs(record.joinDate) : null),
      employee_type: record.employee_type || 'Internal',
      tag_ids: tagIds,
    });
    setIsAddEmployeeModalVisible(true);
  };

  // Handle View Profile
  const handleViewProfile = (record) => {
    setSelectedEmployee(record);
    setIsProfileModalVisible(true);
    setActiveTab('overview');
    setEmployeeAllocations([]);
  };

  // Fetch employee allocations
  const fetchEmployeeAllocations = async (employeeId) => {
    if (!employeeId) {
      setEmployeeAllocations([]);
      return;
    }

    try {
      setLoadingAllocations(true);
      const response = await resourcesService.getAllocations(employeeId);

      // Handle response structure after interceptor transformation
      let allocationsData = [];

      if (response) {
        // Check if response has allocations array directly
        if (response.allocations && Array.isArray(response.allocations)) {
          allocationsData = response.allocations;
        }
        // Check if response.data has allocations array
        else if (response.data && response.data.allocations && Array.isArray(response.data.allocations)) {
          allocationsData = response.data.allocations;
        }
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          allocationsData = response.data;
        }
        // Check if response is an array directly
        else if (Array.isArray(response)) {
          allocationsData = response;
        }
        // Check if response.data is a single object with allocations property
        else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          if (response.data.allocations && Array.isArray(response.data.allocations)) {
            allocationsData = response.data.allocations;
          }
          // If it's a single allocation object, wrap it in array
          else if (response.data.id) {
            allocationsData = [response.data];
          }
        }
      }

      // Transform allocations data to match table format
      const transformedAllocations = allocationsData.map((allocation, index) => {
        // Calculate duration in days
        let duration = 0;
        if (allocation.start_date) {
          const startDate = dayjs(allocation.start_date);
          const endDate = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
          duration = endDate.diff(startDate, 'day');
        }

        // Handle allocation_percentage and billing_percentage as strings or numbers
        const allocationPercentage = typeof allocation.allocation_percentage === 'string'
          ? parseFloat(allocation.allocation_percentage)
          : (allocation.allocation_percentage || 0);
        const billingPercentage = typeof allocation.billing_percentage === 'string'
          ? parseFloat(allocation.billing_percentage)
          : (allocation.billing_percentage || 0);

        // Determine billing status based on project_type
        let billingStatus = 'Non-Billing';
        if (allocation.project_type === 'Client' || allocation.project_is_billable) {
          billingStatus = 'Billing';
        } else if (allocation.project_type === 'Bench') {
          billingStatus = 'Bench';
        } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
          billingStatus = 'Presale';
        } else if (allocation.project_type === 'Training') {
          billingStatus = 'Training';
        }

        return {
          key: allocation.id || `allocation-${index}`,
          id: allocation.id,
          project: allocation.project_name || 'N/A',
          allocatedDate: allocation.start_date ? dayjs(allocation.start_date).format('YYYY-MM-DD') : '-',
          deallocatedDate: allocation.end_date ? dayjs(allocation.end_date).format('YYYY-MM-DD') : '-',
          billingStatus: billingStatus,
          billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
          projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
          duration: duration,
        };
      });

      setEmployeeAllocations(transformedAllocations);
    } catch (error) {
      console.error('Failed to fetch employee allocations:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load employee allocations');
      setEmployeeAllocations([]);
    } finally {
      setLoadingAllocations(false);
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'allocations' && selectedEmployee?.id) {
      fetchEmployeeAllocations(selectedEmployee.id);
    }
  };

  // Fetch designations, tracks, and tags on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      // Prevent duplicate calls
      if (dropdownDataFetched.current) return;
      dropdownDataFetched.current = true;

      try {
        const [designationsRes, tracksRes, tagsRes] = await Promise.all([
          designationsService.getAll(),
          tracksService.getAll(),
          tagsService.getAll(),
        ]);

        if (designationsRes && designationsRes.data) {
          setDesignations(designationsRes.data);
        }
        if (tracksRes && tracksRes.data) {
          setTracks(tracksRes.data);
        }
        if (tagsRes && tagsRes.data) {
          // Handle different response structures
          let tagsData = [];
          if (Array.isArray(tagsRes.data)) {
            tagsData = tagsRes.data;
          } else if (tagsRes.data && tagsRes.data.data && Array.isArray(tagsRes.data.data)) {
            tagsData = tagsRes.data.data;
          }
          setTags(tagsData);
        }
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch employees from API
  const fetchEmployees = async (page = 1, limit = 20) => {
    // Prevent duplicate calls if already fetching
    if (fetchingEmployees) return;

    try {
      setFetchingEmployees(true);

      // Build query params
      const queryParams = {
        page,
        limit,
      };

      // Add search if name or employeeNumber is provided
      // Convert to lowercase for case-insensitive search
      if (filters.name || filters.employeeNumber) {
        const searchValue = filters.name || filters.employeeNumber;
        queryParams.search = searchValue ? searchValue.toLowerCase().trim() : '';
      }

      // Add filters
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      if (filters.designation_id) {
        queryParams.designation_id = filters.designation_id;
      }
      if (filters.status && filters.status !== 'All') {
        queryParams.status = filters.status;
      }
      if (filters.tier && filters.tier !== 'All') {
        queryParams.tier = filters.tier;
      }
      if (filters.employeeNumber) {
        queryParams.employee_number = filters.employeeNumber;
      }
      if (filters.name) {
        queryParams.name = filters.name;
      }

      const response = await resourcesService.getAll(queryParams);

      // Handle response structure after interceptor transformation
      // API returns: {success: true, data: {data: [...], pagination: {...}}}
      // Interceptor: response.data = response.data.data || response.data
      // For resources API: response.data = {data: [...], pagination: {...}}
      // Service returns: response.data || response
      // So we get: {data: [...], pagination: {...}}

      let employeesData = [];
      let paginationData = {};

      if (response) {
        // Most likely case: response = {data: [...], pagination: {...}}
        if (response.data && Array.isArray(response.data)) {
          employeesData = response.data;
          paginationData = response.pagination || {};
        }
        // Case: response = {success: true, data: {data: [...], pagination: {...}}}
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          employeesData = response.data.data;
          paginationData = response.data.pagination || {};
        }
        // Case: response is the data object directly {data: [...], pagination: {...}}
        else if (response.pagination && response.data && Array.isArray(response.data)) {
          employeesData = response.data;
          paginationData = response.pagination;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          employeesData = response;
          paginationData = {};
        }
      }

      // Ensure pagination has default values
      paginationData = {
        total: paginationData.total || 0,
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        totalPages: paginationData.totalPages || 0,
      };


      // Transform employees data to match table format
      const transformedEmployees = employeesData.map((employee) => {
        // Format tier from designation_level (1-4) to "Tier 01" format
        const tier = employee.designation_level
          ? `Tier ${String(employee.designation_level).padStart(2, '0')}`
          : null;

        // Format date_of_joining from ISO string to YYYY-MM-DD
        const joinDate = employee.date_of_joining
          ? dayjs(employee.date_of_joining).format('YYYY-MM-DD')
          : null;

        return {
          key: employee.id || employee.employee_number,
          id: employee.id,
          employee_id: employee.employee_id,
          employeeNumber: employee.employee_number || employee.employeeNumber,
          name: employee.name,
          email: employee.email,
          mobile: employee.phone_number || employee.mobile,
          phone_number: employee.phone_number, // Keep API field name
          tier: tier,
          position: employee.designation_name || employee.position,
          designation_id: employee.designation_id,
          designation_name: employee.designation_name,
          designation_level: employee.designation_level,
          track_id: employee.track_id,
          track_name: employee.track_name,
          joinDate: joinDate,
          status: employee.status,
          photo: employee.photo,
          photo_url: employee.photo_url || employee.photo, // Map photo_url
          nic: employee.nic_passport || employee.nic, // Map nic_passport to nic for form
          nic_passport: employee.nic_passport, // Keep API field name
          date_of_birth: employee.date_of_birth, // Keep API field name
          address: employee.address,
          is_intern: employee.is_intern !== undefined ? employee.is_intern : (employee.intern_classification !== null ? employee.intern_classification : false),
          intern_classification: employee.intern_classification,
          tech_stack: employee.tech_stack, // Keep API field name
          skills: employee.skills || [],
          employee_type: employee.employee_type || 'Internal',
          tags: employee.tags || [],
          notice_period_end_date: employee.notice_period_end_date,
          date_of_joining: employee.date_of_joining,
          // Keep all original data for reference
          ...employee,
        };
      });

      setEmployees(transformedEmployees);
      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error('Failed to load employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  // Fetch employees on component mount and when filters change
  useEffect(() => {
    // Reset to page 1 when filters change (but not on initial mount)
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchEmployees(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.name, filters.employeeNumber, filters.track_id, filters.designation_id, filters.status, filters.tier]);

  // Handle Add/Edit Employee Submit
  const handleEmployeeSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (isEditMode) {
        // Prepare API payload for update
        const updatePayload = {
          name: values.name,
          email: values.email || '',
          phone_number: values.mobile || values.phone_number || '',
          designation_id: values.designation_id,
          date_of_birth: values.bod ? values.bod.format('YYYY-MM-DD') : values.date_of_birth || undefined,
          nic_passport: values.nicOrPassport || values.nic_passport || '',
          is_intern: values.is_intern !== undefined ? values.is_intern : false,
          employee_type: values.employee_type || 'Internal',
          tier: values.tier || undefined,
          tech_stack: values.tech_stack || undefined,
          photo_url: values.photo_url || undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) ? values.tag_ids : undefined,
        };

        // Remove undefined fields
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined || updatePayload[key] === '') {
            delete updatePayload[key];
          }
        });

        // Call update resource API
        const response = await resourcesService.update(selectedEmployee.id, updatePayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Employee updated successfully');

          // Refresh employee list from API
          await fetchEmployees(pagination.current, pagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to update employee');
        }
      } else {
        // Prepare API payload for create
        const apiPayload = {
          employee_id: values.employee_id || values.employeeNumber || '',
          employee_number: values.employeeNumber || '',
          name: values.name,
          phone_number: values.mobile || '',
          email: values.email || '',
          designation_id: values.designation_id,
          track_id: values.track_id,
          date_of_joining: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null,
          date_of_birth: values.bod ? values.bod.format('YYYY-MM-DD') : null,
          nic_passport: values.nicOrPassport || '',
          is_intern: values.is_intern || false,
          employee_type: values.employee_type || 'Internal',
          tier: values.tier || undefined,
          tech_stack: values.tech_stack || undefined,
          photo_url: values.photo_url || undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) && values.tag_ids.length > 0 ? values.tag_ids : undefined,
        };

        // Remove undefined fields (but keep required fields even if empty)
        Object.keys(apiPayload).forEach(key => {
          if (apiPayload[key] === undefined) {
            delete apiPayload[key];
          }
        });

        // Call create resource API
        const response = await resourcesService.create(apiPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Employee created successfully');

          // Refresh employee list from API
          await fetchEmployees(pagination.current, pagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to create employee');
        }
      }

      setIsAddEmployeeModalVisible(false);
      form.resetFields();
      setSelectedEmployee(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Employee submit error:', error);
      message.error(error.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    setIsAddEmployeeModalVisible(false);
    form.resetFields();
    setSelectedEmployee(null);
    setIsEditMode(false);
  };

  // Handle Account Manager Toggle
  const handleToggleAccountManager = async (record, isAccountManager) => {
    try {
      setUpdatingAccountManager(prev => ({ ...prev, [record.id]: true }));
      const response = await resourcesService.updateAccountManager(record.id, {
        is_account_manager: isAccountManager,
      });
      if (response && (response.success !== false || response.data)) {
        message.success(isAccountManager ? 'Resource assigned as account manager' : 'Account manager status removed');
        await fetchEmployees(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.message || 'Failed to update account manager status');
      }
    } catch (error) {
      console.error('Account manager toggle error:', error);
      message.error(error.message || 'Failed to update account manager status');
    } finally {
      setUpdatingAccountManager(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // Handle Tier Update
  const handleUpdateTier = async (record, newTier) => {
    try {
      setUpdatingTier(prev => ({ ...prev, [record.id]: true }));
      const response = await resourcesService.updateTier(record.id, { tier: newTier });
      if (response && (response.success !== false || response.data)) {
        message.success('Resource tier updated successfully');
        await fetchEmployees(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.message || 'Failed to update tier');
      }
    } catch (error) {
      console.error('Tier update error:', error);
      message.error(error.message || 'Failed to update tier');
    } finally {
      setUpdatingTier(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // Handle Tech Stack Update
  const handleUpdateTechStack = async (record, newTechStack) => {
    try {
      setUpdatingTechStack(prev => ({ ...prev, [record.id]: true }));
      const response = await resourcesService.updateTechStack(record.id, { tech_stack: newTechStack });
      if (response && (response.success !== false || response.data)) {
        message.success('Resource tech stack updated successfully');
        await fetchEmployees(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.message || 'Failed to update tech stack');
      }
    } catch (error) {
      console.error('Tech stack update error:', error);
      message.error(error.message || 'Failed to update tech stack');
    } finally {
      setUpdatingTechStack(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // Handle Quick Actions (Tier and Tech Stack updates)
  const handleQuickActions = (record) => {
    Modal.confirm({
      title: 'Quick Actions',
      width: 500,
      content: (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Update Tier:</label>
            <Select
              style={{ width: '100%' }}
              defaultValue={record.tier}
              onChange={(value) => {
                handleUpdateTier(record, value);
                Modal.destroyAll();
              }}
            >
              <Option value="Synergy">Synergy</Option>
              <Option value="Tier - 1">Tier - 1</Option>
              <Option value="Tier - 2">Tier - 2</Option>
              <Option value="Tier - 3">Tier - 3</Option>
              <Option value="Tier - 4">Tier - 4</Option>
              <Option value="Intern">Intern</Option>
            </Select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Update Tech Stack:</label>
            <Select
              style={{ width: '100%' }}
              defaultValue={record.tech_stack}
              placeholder="Select tech stack"
              allowClear
              onChange={(value) => {
                if (value !== undefined) {
                  handleUpdateTechStack(record, value);
                  Modal.destroyAll();
                }
              }}
            >
              <Option value=".NET">.NET</Option>
              <Option value="Full Stack">Full Stack</Option>
              <Option value="QA">QA</Option>
              <Option value="BA/PM">BA/PM</Option>
              <Option value="Data Science">Data Science</Option>
              <Option value="Java">Java</Option>
              <Option value="React">React</Option>
            </Select>
          </div>
        </div>
      ),
      okText: 'Close',
      cancelButtonProps: { style: { display: 'none' } },
    });
  };

  // All filters are now handled by the backend API
  // No need for client-side filtering

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
      title: 'Tech Stack',
      dataIndex: 'tech_stack',
      key: 'tech_stack',
      width: 150,
      render: (techStack) => techStack || '-',
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
      render: (date) => date || '-',
      sorter: (a, b) => {
        if (!a.joinDate) return 1;
        if (!b.joinDate) return -1;
        return dayjs(a.joinDate).unix() - dayjs(b.joinDate).unix();
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: 'Account Manager',
      key: 'accountManager',
      width: 130,
      render: (_, record) => (
        <Switch
          checked={record.is_account_manager || false}
          onChange={(checked) => handleToggleAccountManager(record, checked)}
          checkedChildren="Yes"
          unCheckedChildren="No"
          loading={updatingAccountManager[record.id]}
          disabled={updatingAccountManager[record.id]}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
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
          <Tooltip title="Quick Actions">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleQuickActions(record)}
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
                    <Option value="Synergy">Synergy</Option>
                    <Option value="Tier - 1">Tier - 1</Option>
                    <Option value="Tier - 2">Tier - 2</Option>
                    <Option value="Tier - 3">Tier - 3</Option>
                    <Option value="Tier - 4">Tier - 4</Option>
                    <Option value="Intern">Intern</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Designation</label>
                  <Select
                    value={filters.designation_id}
                    onChange={(value) => setFilters({ ...filters, designation_id: value || undefined })}
                    style={{ width: '100%' }}
                    placeholder="All Designations"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {designations.map((designation) => (
                      <Option key={designation.id} value={designation.id}>
                        {designation.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Track</label>
                  <Select
                    value={filters.track_id}
                    onChange={(value) => setFilters({ ...filters, track_id: value || undefined })}
                    style={{ width: '100%' }}
                    placeholder="All Tracks"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {tracks.map((track) => (
                      <Option key={track.id} value={track.id}>
                        {track.name}
                      </Option>
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
                    <Option value="On Leave">On Leave</Option>
                  </Select>
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
          dataSource={employees}
          scroll={{ x: 1000 }}
          loading={fetchingEmployees}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
              fetchEmployees(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              fetchEmployees(1, size);
            },
          }}
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
            loading: loading,
          },
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {!isEditMode && (
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Employee ID"
                  name="employee_id"
                  rules={[{ required: true, message: 'Employee ID is required' }]}
                >
                  <Input placeholder="Enter employee ID" />
                </Form.Item>
              </Col>
            )}
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
                  <Option value="Synergy">Synergy</Option>
                  <Option value="Tier - 1">Tier - 1</Option>
                  <Option value="Tier - 2">Tier - 2</Option>
                  <Option value="Tier - 3">Tier - 3</Option>
                  <Option value="Tier - 4">Tier - 4</Option>
                  <Option value="Intern">Intern</Option>
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
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter email address" type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mobile"
                name="mobile"
                rules={[{ required: true, message: 'Mobile number is required' }]}
              >
                <Input placeholder="Enter mobile number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Designation"
                name="designation_id"
                rules={[{ required: true, message: 'Designation is required' }]}
              >
                <Select placeholder="Select designation" showSearch optionFilterProp="children">
                  {designations.map((designation) => (
                    <Option key={designation.id} value={designation.id}>
                      {designation.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Track"
                name="track_id"
                rules={[{ required: true, message: 'Track is required' }]}
              >
                <Select placeholder="Select track" showSearch optionFilterProp="children">
                  {tracks.map((track) => (
                    <Option key={track.id} value={track.id}>
                      {track.name}
                    </Option>
                  ))}
                </Select>
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
                label="Employee Type"
                name="employee_type"
                initialValue="Internal"
                rules={[{ required: true, message: 'Employee type is required' }]}
              >
                <Select placeholder="Select employee type">
                  <Option value="Internal">Internal</Option>
                  <Option value="External">External</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Is Intern"
                name="is_intern"
                initialValue={false}
              >
                <Select placeholder="Select intern status">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tech Stack"
                name="tech_stack"
              >
                <Select placeholder="Select tech stack" allowClear>
                  <Option value=".NET">.NET</Option>
                  <Option value="Full Stack">Full Stack</Option>
                  <Option value="QA">QA</Option>
                  <Option value="BA/PM">BA/PM</Option>
                  <Option value="Data Science">Data Science</Option>
                  <Option value="Java">Java</Option>
                  <Option value="React">React</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tags"
                name="tag_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Select tags"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      {tag.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {isEditMode && (
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
                    <Option value="On Leave">On Leave</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
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
            activeKey={activeTab}
            onChange={handleTabChange}
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
                      dataSource={employeeAllocations}
                      scroll={{ x: 1000 }}
                      pagination={false}
                      loading={loadingAllocations}
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
