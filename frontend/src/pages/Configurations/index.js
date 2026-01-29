import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Tabs, Space, Tooltip, Select, Switch, message, Modal, Badge, Row, Col, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import { tracksService, designationsService, projectsService, clientsService, accountManagersService, billingStatusesService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import dayjs from 'dayjs';
import '@styles/pages/Configurations.scss';

const { Option } = Select;

const Configurations = () => {
  const [designationForm] = Form.useForm();
  const [trackForm] = Form.useForm();
  const [projectTypeForm] = Form.useForm();
  const [clientForm] = Form.useForm();
  const [billingStatusForm] = Form.useForm();

  const [isDesignationModalVisible, setIsDesignationModalVisible] = useState(false);
  const [isTrackModalVisible, setIsTrackModalVisible] = useState(false);
  const [isProjectTypeModalVisible, setIsProjectTypeModalVisible] = useState(false);
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isBillingStatusModalVisible, setIsBillingStatusModalVisible] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('project-types');

  const [designations, setDesignations] = useState([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [designationLoading, setDesignationLoading] = useState(false);

  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);

  const [billingStatuses, setBillingStatuses] = useState([]);
  const [loadingBillingStatuses, setLoadingBillingStatuses] = useState(false);
  const [billingStatusLoading, setBillingStatusLoading] = useState(false);

  const [projectTypes, setProjectTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingProjectTypes, setLoadingProjectTypes] = useState(false);
  const [projectTypeLoading, setProjectTypeLoading] = useState(false);
  const [projectTypePagination, setProjectTypePagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [clientsList, setClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientPagination, setClientPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [clientFilters, setClientFilters] = useState({
    search: '',
    is_active: undefined,
  });
  const [accountManagersList, setAccountManagersList] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
  const [accountType, setAccountType] = useState('External');

  // Designation handlers
  const handleAddDesignation = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    designationForm.resetFields();
    setIsDesignationModalVisible(true);
  };

  const handleEditDesignation = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    designationForm.setFieldsValue({
      name: record.name,
      tier: record.tier || (record.level ? `Tier ${String(record.level).padStart(2, '0')}` : 'Tier 01'),
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsDesignationModalVisible(true);
  };

  // Fetch designations from API
  const fetchDesignations = async () => {
    try {
      setLoadingDesignations(true);
      const response = await designationsService.getAll();

      // Handle response structure after interceptor transformation
      let designationsData = [];

      if (response) {
        // Check if response has data array directly (after interceptor transformation)
        if (Array.isArray(response.data)) {
          designationsData = response.data;
        }
        // Check if response has nested data structure
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          designationsData = response.data.data;
        }
        // Check if response is the data object directly
        else if (response.data && Array.isArray(response.data)) {
          designationsData = response.data;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          designationsData = response;
        }
      }

      // Transform designations data to match table format
      // Map level (1-4) to tier display (Tier 01-04)
      const transformedDesignations = designationsData.map((designation) => ({
        key: designation.id,
        id: designation.id,
        name: designation.name,
        level: designation.level,
        tier: designation.level ? `Tier ${String(designation.level).padStart(2, '0')}` : null,
        is_active: designation.is_active !== undefined ? designation.is_active : true,
      }));

      setDesignations(transformedDesignations);
    } catch (error) {
      console.error('Failed to fetch designations:', error);
      message.error('Failed to load designations');
    } finally {
      setLoadingDesignations(false);
    }
  };

  // Fetch designations on component mount and when designations tab is active
  useEffect(() => {
    if (activeTab === 'designations') {
      fetchDesignations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDeleteDesignation = (record) => {
    Modal.confirm({
      title: 'Delete Designation',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Note: API doesn't have DELETE endpoint, so we'll deactivate instead
          await designationsService.update(record.id, {
            name: record.name,
            level: record.level,
            is_active: false,
          });

          message.success('Designation deactivated successfully');
          fetchDesignations();
        } catch (error) {
          console.error('Failed to delete designation:', error);
          message.error(error?.message || 'Failed to delete designation');
        }
      },
    });
  };

  const handleDesignationSubmit = async () => {
    try {
      setDesignationLoading(true);
      const values = await designationForm.validateFields();

      // Convert tier string (Tier 01) to level number (1)
      const level = values.tier ? parseInt(values.tier.replace('Tier ', '')) : 1;

      // Prepare API payload
      const designationPayload = {
        name: values.name,
        level: level,
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        // Update designation
        const response = await designationsService.update(selectedItem.id, designationPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Designation updated successfully');
          await fetchDesignations();
        } else {
          message.error(response?.message || 'Failed to update designation');
        }
      } else {
        // Create designation
        const response = await designationsService.create(designationPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Designation created successfully');
          await fetchDesignations();
        } else {
          message.error(response?.message || 'Failed to create designation');
        }
      }

      setIsDesignationModalVisible(false);
      designationForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Designation submit error:', error);
      message.error(error?.message || 'Failed to save designation');
    } finally {
      setDesignationLoading(false);
    }
  };

  // Track handlers
  const handleAddTrack = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    trackForm.resetFields();
    setIsTrackModalVisible(true);
  };

  const handleEditTrack = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    trackForm.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsTrackModalVisible(true);
  };

  const handleDeleteTrack = (record) => {
    Modal.confirm({
      title: 'Delete Track',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Note: API doesn't have DELETE endpoint, so we'll deactivate instead
          // If DELETE endpoint exists, uncomment below:
          // await tracksService.delete(record.id);

          // For now, update to inactive
          await tracksService.update(record.id, {
            name: record.name,
            description: record.description,
            is_active: false,
          });

          message.success('Track deactivated successfully');
          fetchTracks();
        } catch (error) {
          console.error('Failed to delete track:', error);
          message.error(error?.message || 'Failed to delete track');
        }
      },
    });
  };

  // Fetch tracks from API
  const fetchTracks = async () => {
    try {
      setLoadingTracks(true);
      const response = await tracksService.getAll();

      // Handle response structure after interceptor transformation
      let tracksData = [];

      if (response) {
        // Check if response has data array directly (after interceptor transformation)
        if (Array.isArray(response.data)) {
          tracksData = response.data;
        }
        // Check if response has nested data structure
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          tracksData = response.data.data;
        }
        // Check if response is the data object directly
        else if (response.data && Array.isArray(response.data)) {
          tracksData = response.data;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          tracksData = response;
        }
      }

      // Transform tracks data to match table format
      const transformedTracks = tracksData.map((track) => ({
        key: track.id,
        id: track.id,
        name: track.name,
        description: track.description || '',
        is_active: track.is_active !== undefined ? track.is_active : true,
      }));

      setTracks(transformedTracks);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      message.error('Failed to load tracks');
    } finally {
      setLoadingTracks(false);
    }
  };

  // Fetch tracks on component mount and when tracks tab is active
  useEffect(() => {
    if (activeTab === 'tracks') {
      fetchTracks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Billing Status handlers
  const handleAddBillingStatus = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    billingStatusForm.resetFields();
    setIsBillingStatusModalVisible(true);
  };

  const handleEditBillingStatus = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    billingStatusForm.setFieldsValue({
      name: record.name,
      description: record.description || '',
      color: record.color || '#1890ff',
      display_order: record.display_order || 0,
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsBillingStatusModalVisible(true);
  };

  const handleDeleteBillingStatus = (record) => {
    Modal.confirm({
      title: 'Delete Billing Status',
      content: record.is_system 
        ? `"${record.name}" is a system status and cannot be deleted.`
        : `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      disabled: record.is_system,
      onOk: async () => {
        try {
          await billingStatusesService.delete(record.id);
          message.success('Billing status deleted successfully');
          fetchBillingStatuses();
        } catch (error) {
          console.error('Failed to delete billing status:', error);
          message.error(error?.message || 'Failed to delete billing status');
        }
      },
    });
  };

  // Fetch billing statuses from API
  const fetchBillingStatuses = async () => {
    try {
      setLoadingBillingStatuses(true);
      const response = await billingStatusesService.getAll();

      // Handle response structure after interceptor transformation
      let statusesData = [];

      if (response) {
        if (Array.isArray(response.data)) {
          statusesData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          statusesData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          statusesData = response.data;
        } else if (Array.isArray(response)) {
          statusesData = response;
        }
      }

      // Transform billing statuses data to match table format
      const transformedStatuses = statusesData.map((status) => ({
        key: status.id,
        id: status.id,
        name: status.name,
        description: status.description || '',
        color: status.color || '#1890ff',
        display_order: status.display_order || 0,
        is_active: status.is_active !== undefined ? status.is_active : true,
        is_system: status.is_system || false,
      }));

      // Sort by display_order
      transformedStatuses.sort((a, b) => a.display_order - b.display_order);

      setBillingStatuses(transformedStatuses);
    } catch (error) {
      console.error('Failed to fetch billing statuses:', error);
      message.error('Failed to load billing statuses');
    } finally {
      setLoadingBillingStatuses(false);
    }
  };

  // Fetch billing statuses on component mount and when billing statuses tab is active
  useEffect(() => {
    if (activeTab === 'billing-statuses') {
      fetchBillingStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleBillingStatusSubmit = async () => {
    try {
      setBillingStatusLoading(true);
      const values = await billingStatusForm.validateFields();

      // Prepare API payload
      const statusPayload = {
        name: values.name,
        description: values.description || '',
        color: values.color || '#1890ff',
        display_order: values.display_order || 0,
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        // Update billing status
        const response = await billingStatusesService.update(selectedItem.id, statusPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Billing status updated successfully');
          await fetchBillingStatuses();
        } else {
          message.error(response?.message || 'Failed to update billing status');
        }
      } else {
        // Create billing status
        const response = await billingStatusesService.create(statusPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Billing status created successfully');
          await fetchBillingStatuses();
        } else {
          message.error(response?.message || 'Failed to create billing status');
        }
      }

      setIsBillingStatusModalVisible(false);
      billingStatusForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Billing status submit error:', error);
      message.error(error?.message || 'Failed to save billing status');
    } finally {
      setBillingStatusLoading(false);
    }
  };

  const handleTrackSubmit = async () => {
    try {
      setTrackLoading(true);
      const values = await trackForm.validateFields();

      // Prepare API payload
      const trackPayload = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        // Update track
        const response = await tracksService.update(selectedItem.id, trackPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Track updated successfully');
          await fetchTracks();
        } else {
          message.error(response?.message || 'Failed to update track');
        }
      } else {
        // Create track
        const response = await tracksService.create(trackPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Track created successfully');
          await fetchTracks();
        } else {
          message.error(response?.message || 'Failed to create track');
        }
      }

      setIsTrackModalVisible(false);
      trackForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Track submit error:', error);
      message.error(error?.message || 'Failed to save track');
    } finally {
      setTrackLoading(false);
    }
  };

  // Project Type handlers
  // Fetch projects (project types) from API
  const fetchProjectTypes = async (page = 1, limit = 20) => {
    try {
      setLoadingProjectTypes(true);
      const response = await projectsService.getAll({
        page,
        limit,
      });

      // Handle response structure after interceptor transformation
      let projectsData = [];
      let paginationData = {};

      if (response) {
        // Check if response has data array directly (after interceptor transformation)
        if (Array.isArray(response.data)) {
          projectsData = response.data;
          paginationData = response.pagination || {};
        }
        // Check if response has nested data structure
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          projectsData = response.data.data;
          paginationData = response.data.pagination || {};
        }
        // Check if response is the data object directly
        else if (response.pagination && response.data && Array.isArray(response.data)) {
          projectsData = response.data;
          paginationData = response.pagination;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          projectsData = response;
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

      // Transform projects data to match table format
      const transformedProjects = projectsData.map((project) => ({
        key: project.id,
        id: project.id,
        project_name: project.project_name,
        project_code: project.project_code,
        client_id: project.client_id,
        client_name: project.client_name,
        project_type: project.project_type,
        is_billable: project.is_billable,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        description: project.description,
      }));

      setProjectTypes(transformedProjects);
      setProjectTypePagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      message.error('Failed to load projects');
    } finally {
      setLoadingProjectTypes(false);
    }
  };

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientsService.getAll({ limit: 10 });
        let clientsData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            clientsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            clientsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            clientsData = response.data;
          }
        }

        setClients(clientsData.map(client => ({
          id: client.id,
          name: client.client_name || client.name,
        })));
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };

    if (activeTab === 'project-types') {
      fetchClients();
      fetchProjectTypes(1, 20);
    }
    if (activeTab === 'clients') {
      fetchClientsList(1, 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch clients when filters change
  useEffect(() => {
    if (activeTab === 'clients') {
      const timer = setTimeout(() => {
        fetchClientsList(1, clientPagination.pageSize);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilters.search, clientFilters.is_active]);

  // Fetch account managers for project form
  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        let accountManagersData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            accountManagersData = response.data;
          } else if (response.data && Array.isArray(response.data)) {
            accountManagersData = response.data;
          } else if (Array.isArray(response)) {
            accountManagersData = response;
          }
        }

        const accountManagers = accountManagersData
          .filter(am => am.id && am.name)
          .map(am => ({
            id: am.id,
            name: am.name,
          }));

        setAccountManagersList(accountManagers);
      } catch (error) {
        console.error('Failed to fetch account managers:', error);
        showErrorToast('Failed to load account managers');
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    fetchAccountManagers();
  }, []);

  const handleAddProjectType = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    setAccountType('External');
    projectTypeForm.resetFields();
    projectTypeForm.setFieldsValue({
      account_type: 'External',
      status: 'Active',
      billing_type: 'Billing',
      team_size: 1,
    });
    setIsProjectTypeModalVisible(true);
  };

  const handleEditProjectType = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    projectTypeForm.setFieldsValue({
      project_name: record.project_name,
      project_code: record.project_code,
      client_id: record.client_id,
      project_type: record.project_type,
      is_billable: record.is_billable !== undefined ? record.is_billable : true,
      status: record.status,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
      description: record.description,
    });
    setIsProjectTypeModalVisible(true);
  };

  const handleDeleteProjectType = (record) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${record.project_name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setProjectTypeLoading(true);
          const response = await projectsService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            message.success('Project deleted successfully');
            await fetchProjectTypes(projectTypePagination.current, projectTypePagination.pageSize);
          } else {
            message.error(response?.message || 'Failed to delete project');
          }
        } catch (error) {
          console.error('Failed to delete project:', error);
          message.error(error?.message || 'Failed to delete project');
        } finally {
          setProjectTypeLoading(false);
        }
      },
    });
  };

  const handleProjectTypeSubmit = async () => {
    try {
      setProjectTypeLoading(true);
      const values = await projectTypeForm.validateFields();

      // Validate required fields
      if (!values.project_name) {
        showErrorToast('Project name is required');
        setProjectTypeLoading(false);
        return;
      }

      if (!values.account_manager) {
        showErrorToast('Account manager is required');
        setProjectTypeLoading(false);
        return;
      }

      // Handle client_id - required only for External projects
      let client_id = null;
      if (values.account_type === 'External') {
        if (values.client_id) {
          client_id = values.client_id;
        } else {
          showErrorToast('Client is required for External projects');
          setProjectTypeLoading(false);
          return;
        }
      }

      // Map project type - API expects: Client|Bench|Training|POC|Presale|Research
      const projectTypeMap = {
        'Client': 'Client',
        'Bench': 'Bench',
        'Training': 'Training',
        'POC': 'POC',
        'Presale': 'Presale',
        'Research': 'Research',
      };

      const project_type = projectTypeMap[values.project_type] || 'Client';

      // Map status - API expects: Active|On Hold|Completed|Cancelled
      const statusMap = {
        'Active': 'Active',
        'On Hold': 'On Hold',
        'Completed': 'Completed',
        'Cancelled': 'Cancelled',
      };
      const status = statusMap[values.status] || 'Active';

      if (isEditMode) {
        // Prepare API payload for update
        const updatePayload = {
          project_name: values.project_name,
          client_id: client_id,
          status: status,
          description: values.description || '',
        };

        const response = await projectsService.update(selectedItem.id, updatePayload);

        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project updated successfully');
          await fetchProjectTypes(projectTypePagination.current, projectTypePagination.pageSize);
        } else {
          showErrorToast(response?.message || 'Failed to update project');
        }
      } else {
        // Prepare API payload according to API specification
        const projectPayload = {
          project_name: values.project_name,
          project_code: values.project_code || '',
          client_id: client_id,
          project_type: project_type,
          account_type: values.account_type || 'External',
          account_manager: values.account_manager,
          account_reg_sales_owner: values.account_reg_sales_owner || '',
          team_size: values.team_size || 1,
          billing_type: values.billing_type || 'Billing',
          budget: values.budget || 0,
          status: status,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
          description: values.description || '',
        };

        // Clean up payload: remove empty optional fields
        const cleanedPayload = { ...projectPayload };

        if (!cleanedPayload.project_code || cleanedPayload.project_code === '') {
          delete cleanedPayload.project_code;
        }
        if (!cleanedPayload.account_reg_sales_owner || cleanedPayload.account_reg_sales_owner === '') {
          delete cleanedPayload.account_reg_sales_owner;
        }
        if (!cleanedPayload.description || cleanedPayload.description === '') {
          delete cleanedPayload.description;
        }
        if (!cleanedPayload.start_date) {
          delete cleanedPayload.start_date;
        }
        if (!cleanedPayload.end_date) {
          delete cleanedPayload.end_date;
        }
        if (cleanedPayload.account_type === 'Internal') {
          delete cleanedPayload.client_id;
        }

        const response = await projectsService.create(cleanedPayload);

        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project created successfully');
          await fetchProjectTypes(projectTypePagination.current, projectTypePagination.pageSize);
        } else {
          showErrorToast(response?.message || 'Failed to create project');
        }
      }

      setIsProjectTypeModalVisible(false);
      projectTypeForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
      setAccountType('External');
    } catch (error) {
      console.error('Project submit error:', error);
      showErrorToast(error?.message || 'Failed to save project');
    } finally {
      setProjectTypeLoading(false);
    }
  };

  // Fetch clients from API for Clients tab
  const fetchClientsList = async (page = 1, limit = 20) => {
    try {
      setLoadingClients(true);
      const params = {
        page,
        limit,
      };

      // Add search filter if provided
      if (clientFilters.search && clientFilters.search.trim()) {
        params.search = clientFilters.search.trim();
      }

      // Add is_active filter if provided
      if (clientFilters.is_active !== undefined && clientFilters.is_active !== null) {
        params.is_active = clientFilters.is_active;
      }

      const response = await clientsService.getAll(params);

      // Handle response structure after interceptor transformation
      let clientsData = [];
      let paginationData = {};

      if (response) {
        // Check if response has data array directly (after interceptor transformation)
        if (Array.isArray(response.data)) {
          clientsData = response.data;
          paginationData = response.pagination || {};
        }
        // Check if response has nested data structure
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          clientsData = response.data.data;
          paginationData = response.data.pagination || {};
        }
        // Check if response is the data object directly
        else if (response.pagination && response.data && Array.isArray(response.data)) {
          clientsData = response.data;
          paginationData = response.pagination;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          clientsData = response;
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

      // Transform clients data to match table format
      const transformedClients = clientsData.map((client) => ({
        key: client.id,
        id: client.id,
        client_name: client.client_name,
        contact_person: client.contact_person,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address,
        is_active: client.is_active !== undefined ? client.is_active : true,
      }));

      setClientsList(transformedClients);
      setClientPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      message.error('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch clients on component mount and when clients tab is active
  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClientsList(1, clientPagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch clients when filters change
  useEffect(() => {
    if (activeTab === 'clients') {
      const timer = setTimeout(() => {
        fetchClientsList(1, clientPagination.pageSize);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilters.search, clientFilters.is_active]);

  // Client handlers
  const handleAddClient = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    clientForm.resetFields();
    setIsClientModalVisible(true);
  };

  const handleEditClient = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    clientForm.setFieldsValue({
      client_name: record.client_name,
      contact_person: record.contact_person,
      contact_email: record.contact_email,
      contact_phone: record.contact_phone,
      address: record.address,
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsClientModalVisible(true);
  };

  const handleDeleteClient = (record) => {
    Modal.confirm({
      title: 'Delete Client',
      content: `Are you sure you want to delete "${record.client_name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setClientLoading(true);
          const response = await clientsService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            message.success('Client deleted successfully');
            await fetchClientsList(clientPagination.current, clientPagination.pageSize);
          } else {
            message.error(response?.message || 'Failed to delete client');
          }
        } catch (error) {
          console.error('Failed to delete client:', error);
          message.error(error?.message || 'Failed to delete client');
        } finally {
          setClientLoading(false);
        }
      },
    });
  };

  const handleClientSubmit = async () => {
    try {
      setClientLoading(true);
      const values = await clientForm.validateFields();

      // Prepare API payload
      const clientPayload = {
        client_name: values.client_name,
        contact_person: values.contact_person || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || '',
        address: values.address || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        // Update client - include all fields that can be updated
        const updatePayload = {
          client_name: values.client_name,
          contact_person: values.contact_person || '',
          contact_email: values.contact_email || '',
          contact_phone: values.contact_phone || '',
          address: values.address || '',
          is_active: values.is_active !== undefined ? values.is_active : true,
        };

        const response = await clientsService.update(selectedItem.id, updatePayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Client updated successfully');
          await fetchClientsList(clientPagination.current, clientPagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to update client');
        }
      } else {
        // Create client
        const response = await clientsService.create(clientPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Client created successfully');
          await fetchClientsList(clientPagination.current, clientPagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to create client');
        }
      }

      setIsClientModalVisible(false);
      clientForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Client submit error:', error);
      message.error(error?.message || 'Failed to save client');
    } finally {
      setClientLoading(false);
    }
  };

  // Designation columns
  const designationColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditDesignation(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteDesignation(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Track columns
  const trackColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTrack(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTrack(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Billing Status columns
  const billingStatusColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
      render: (name, record) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: record.color || '#1890ff',
            }}
          />
          {name}
          {record.is_system && (
            <Badge count="System" style={{ backgroundColor: '#52c41a', marginLeft: 8 }} />
          )}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (desc) => desc || '-',
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 24,
              height: 24,
              borderRadius: 4,
              backgroundColor: color || '#1890ff',
              border: '1px solid #d9d9d9',
            }}
          />
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{color || '#1890ff'}</span>
        </div>
      ),
    },
    {
      title: 'Display Order',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 120,
      sorter: (a, b) => a.display_order - b.display_order,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditBillingStatus(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title={record.is_system ? 'System status cannot be deleted' : 'Delete'}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteBillingStatus(record)}
              className="action-icon-btn"
              danger
              disabled={record.is_system}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Client columns
  const clientColumns = [
    {
      title: 'Client Name',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 150,
    },
    {
      title: 'Contact Email',
      dataIndex: 'contact_email',
      key: 'contact_email',
      width: 200,
    },
    {
      title: 'Contact Phone',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 150,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 250,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditClient(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClient(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Project Type columns (Projects)
  const projectTypeColumns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Project Code',
      dataIndex: 'project_code',
      key: 'project_code',
      width: 150,
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'project_type',
      key: 'project_type',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colorMap = {
          'Active': 'green',
          'On Hold': 'orange',
          'Completed': 'blue',
          'Cancelled': 'red',
        };
        return <Badge status={colorMap[status] || 'default'} text={status} />;
      },
    },
    {
      title: 'Billable',
      dataIndex: 'is_billable',
      key: 'is_billable',
      width: 100,
      render: (isBillable) => (isBillable ? 'Yes' : 'No'),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditProjectType(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteProjectType(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="configurations-page">
      <div className="configurations-header">
        <h1 className="page-title">CONFIGURATIONS</h1>
      </div>

      <Card className="configurations-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'project-types',
              label: 'Projects',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Project Types</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddProjectType}
                      >
                        Add New Project
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={projectTypeColumns}
                    dataSource={projectTypes}
                    scroll={{ x: 1200 }}
                    loading={loadingProjectTypes}
                    pagination={{
                      current: projectTypePagination.current,
                      pageSize: projectTypePagination.pageSize,
                      total: projectTypePagination.total,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
                      onChange: (page, pageSize) => {
                        setProjectTypePagination(prev => ({ ...prev, current: page, pageSize }));
                        fetchProjectTypes(page, pageSize);
                      },
                      onShowSizeChange: (current, size) => {
                        setProjectTypePagination(prev => ({ ...prev, current: 1, pageSize: size }));
                        fetchProjectTypes(1, size);
                      },
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'clients',
              label: 'Clients',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Clients</span>
                    </div>
                    <div className="table-header-actions">
                      <Space>
                        <Input
                          placeholder="Search by name or contact person"
                          value={clientFilters.search}
                          onChange={(e) => {
                            setClientFilters({ ...clientFilters, search: e.target.value });
                          }}
                          onPressEnter={() => fetchClientsList(1, clientPagination.pageSize)}
                          style={{ width: 250 }}
                          allowClear
                        />
                        <Select
                          placeholder="Filter by status"
                          value={clientFilters.is_active}
                          onChange={(value) => {
                            setClientFilters({ ...clientFilters, is_active: value });
                          }}
                          allowClear
                          style={{ width: 150 }}
                        >
                          <Option value={true}>Active</Option>
                          <Option value={false}>Inactive</Option>
                        </Select>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAddClient}
                        >
                          Add Client
                        </Button>
                      </Space>
                    </div>
                  </div>
                  <CustomTable
                    columns={clientColumns}
                    dataSource={clientsList}
                    scroll={{ x: 1000 }}
                    loading={loadingClients}
                    pagination={{
                      current: clientPagination.current,
                      pageSize: clientPagination.pageSize,
                      total: clientPagination.total,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} clients`,
                      onChange: (page, pageSize) => {
                        setClientPagination(prev => ({ ...prev, current: page, pageSize }));
                        fetchClientsList(page, pageSize);
                      },
                      onShowSizeChange: (current, size) => {
                        setClientPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                        fetchClientsList(1, size);
                      },
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'designations',
              label: 'Designations',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Designations</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddDesignation}
                      >
                        Add Designation
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={designationColumns}
                    dataSource={designations}
                    scroll={{ x: 600 }}
                    loading={loadingDesignations}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ),
            },
            {
              key: 'tracks',
              label: 'Tracks',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Tracks</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddTrack}
                      >
                        Add Track
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={trackColumns}
                    dataSource={tracks}
                    scroll={{ x: 600 }}
                    loading={loadingTracks}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ),
            },
            {
              key: 'billing-statuses',
              label: 'Billing Statuses',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Billing Statuses</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddBillingStatus}
                      >
                        Add Billing Status
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={billingStatusColumns}
                    dataSource={billingStatuses}
                    scroll={{ x: 800 }}
                    loading={loadingBillingStatuses}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Designation Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Designation' : 'Add New Designation'}
        open={isDesignationModalVisible}
        onClose={() => {
          setIsDesignationModalVisible(false);
          designationForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsDesignationModalVisible(false);
              designationForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleDesignationSubmit,
            loading: designationLoading,
          },
        ]}
      >
        <Form form={designationForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter designation name (e.g., SE, SSE, ATL)" />
          </Form.Item>
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
          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </CustomModal>

      {/* Add/Edit Track Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Track' : 'Add New Track'}
        open={isTrackModalVisible}
        onClose={() => {
          setIsTrackModalVisible(false);
          trackForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsTrackModalVisible(false);
              trackForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleTrackSubmit,
            loading: trackLoading,
          },
        ]}
      >
        <Form form={trackForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter track name (e.g., FS, .Net, QA)" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Description is required' },
              { max: 255, message: 'Description must be less than 255 characters' },
            ]}
          >
            <Input placeholder="Enter track description" />
          </Form.Item>
          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </CustomModal>

      {/* Add/Edit Project Type Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Project' : 'Add New Project'}
        open={isProjectTypeModalVisible}
        onClose={() => {
          setIsProjectTypeModalVisible(false);
          projectTypeForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={800}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsProjectTypeModalVisible(false);
              projectTypeForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleProjectTypeSubmit,
            loading: projectTypeLoading,
          },
        ]}
      >
        <Form form={projectTypeForm} layout="vertical" initialValues={{
          account_type: 'External',
          status: 'Active',
          billing_type: 'Billing',
          team_size: 1,
        }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Project Name"
                name="project_name"
                rules={[{ required: true, message: 'Project name is required' }]}
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
            {!isEditMode && (
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Project Code"
                  name="project_code"
                >
                  <Input placeholder="Enter project code (optional)" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Project Type"
                name="project_type"
                rules={[{ required: true, message: 'Project type is required' }]}
              >
                <Select placeholder="Select project type">
                  <Option value="Client">Client</Option>
                  <Option value="Bench">Bench</Option>
                  <Option value="Training">Training</Option>
                  <Option value="POC">POC</Option>
                  <Option value="Presale">Presale</Option>
                  <Option value="Research">Research</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Account Type"
                name="account_type"
                rules={[{ required: true, message: 'Account type is required' }]}
              >
                <Select
                  placeholder="Select account type"
                  onChange={(value) => setAccountType(value)}
                >
                  <Option value="Internal">Internal</Option>
                  <Option value="External">External</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Client Name"
                name="client_id"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const accountType = getFieldValue('account_type');
                      if (accountType === 'External' && !value) {
                        return Promise.reject(new Error('Client is required for External projects'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select
                  placeholder="Select client"
                  showSearch
                  allowClear
                  disabled={accountType === 'Internal'}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {clients.map((client) => (
                    <Option key={client.id} value={client.id} label={client.name}>
                      {client.name}
                    </Option>
                  ))}
                </Select>
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
                  <Option value="On Hold">On Hold</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Account Manager"
                name="account_manager"
                rules={[{ required: true, message: 'Account manager is required' }]}
              >
                <Select
                  placeholder="Select account manager"
                  showSearch
                  allowClear
                  loading={loadingAccountManagers}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {accountManagersList.map((am) => (
                    <Option key={am.id} value={am.name} label={am.name}>
                      {am.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {!isEditMode && (
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Billing Type"
                  name="billing_type"
                  rules={[{ required: true, message: 'Billing type is required' }]}
                >
                  <Select placeholder="Select billing type">
                    <Option value="Billing">Billing</Option>
                    <Option value="Non-Billing">Non-Billing</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Team Size"
                name="team_size"
                rules={[
                  { required: true, message: 'Team size is required' },
                  { type: 'number', min: 1, message: 'Team size must be at least 1' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter team size"
                  min={1}
                />
              </Form.Item>
            </Col>
            {!isEditMode && (
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Budget"
                  name="budget"
                  rules={[
                    { type: 'number', min: 0, message: 'Budget must be 0 or greater' },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter budget (optional)"
                    min={0}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          {!isEditMode && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Account Reg/Sales Owner"
                  name="account_reg_sales_owner"
                >
                  <Input placeholder="Enter account reg/sales owner (optional)" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Start Date"
                name="start_date"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="End Date"
                name="end_date"
                dependencies={['start_date']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('start_date');
                      if (!value || !startDate || value >= startDate) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('End date must be greater than or equal to start date'));
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select end date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="Description"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="Enter project description" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CustomModal>

      {/* Add/Edit Client Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Client' : 'Add New Client'}
        open={isClientModalVisible}
        onClose={() => {
          setIsClientModalVisible(false);
          clientForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={700}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsClientModalVisible(false);
              clientForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleClientSubmit,
            loading: clientLoading,
          },
        ]}
      >
        <Form form={clientForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Client Name"
                name="client_name"
                rules={[
                  { required: true, message: 'Client name is required' },
                  { max: 100, message: 'Client name must be less than 100 characters' },
                ]}
              >
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Contact Person"
                name="contact_person"
                rules={[
                  { required: true, message: 'Contact person is required' },
                  { max: 100, message: 'Contact person name must be less than 100 characters' },
                ]}
              >
                <Input placeholder="Enter contact person name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Contact Email"
                name="contact_email"
                rules={[
                  { required: true, message: 'Contact email is required' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="Enter contact email" type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Contact Phone"
                name="contact_phone"
                rules={[
                  { required: true, message: 'Contact phone is required' },
                ]}
              >
                <Input placeholder="Enter contact phone" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Address"
                name="address"
                rules={[
                  { max: 255, message: 'Address must be less than 255 characters' },
                ]}
              >
                <Input.TextArea rows={3} placeholder="Enter client address" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Active"
                name="is_active"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CustomModal>

      {/* Add/Edit Billing Status Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Billing Status' : 'Add New Billing Status'}
        open={isBillingStatusModalVisible}
        onClose={() => {
          setIsBillingStatusModalVisible(false);
          billingStatusForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsBillingStatusModalVisible(false);
              billingStatusForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleBillingStatusSubmit,
            loading: billingStatusLoading,
          },
        ]}
      >
        <Form form={billingStatusForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  { required: true, message: 'Billing status name is required' },
                  { max: 50, message: 'Name must be less than 50 characters' },
                ]}
              >
                <Input 
                  placeholder="Enter billing status name" 
                  disabled={isEditMode && selectedItem?.is_system}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Color"
                name="color"
                rules={[
                  { required: true, message: 'Color is required' },
                  { pattern: /^#[0-9A-Fa-f]{6}$/, message: 'Color must be a valid hex code (e.g., #1890ff)' },
                ]}
              >
                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.color !== currentValues.color}>
                  {({ getFieldValue }) => {
                    const colorValue = getFieldValue('color') || '#1890ff';
                    return (
                      <Input 
                        placeholder="#1890ff" 
                        prefix={
                          <span
                            style={{
                              display: 'inline-block',
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              backgroundColor: colorValue,
                              border: '1px solid #d9d9d9',
                              marginRight: 8,
                            }}
                          />
                        }
                      />
                    );
                  }}
                </Form.Item>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Description"
                name="description"
                rules={[
                  { max: 500, message: 'Description must be less than 500 characters' },
                ]}
              >
                <Input.TextArea rows={3} placeholder="Enter description (optional)" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Display Order"
                name="display_order"
                rules={[
                  { required: true, message: 'Display order is required' },
                  { type: 'number', min: 0, message: 'Display order must be 0 or greater' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter display order"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Active"
                name="is_active"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch 
                  checkedChildren="Active" 
                  unCheckedChildren="Inactive"
                  disabled={isEditMode && selectedItem?.is_system}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CustomModal>
    </div>
  );
};

export default Configurations;
