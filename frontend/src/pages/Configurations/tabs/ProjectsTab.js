import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button, Space, Tooltip, Badge, Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { projectsService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const { Option } = Select;
const { TextArea } = Input;

const ProjectsTab = () => {
  // Get data from Redux store
  const { clients, accountManagers, projectTypes: projectTypesConfig } = useSelector((state) => state.configurations);

  // State
  const [projectTypes, setProjectTypes] = useState([]);
  const [loadingProjectTypes, setLoadingProjectTypes] = useState(false);
  const [projectTypePagination, setProjectTypePagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [isProjectTypeModalVisible, setIsProjectTypeModalVisible] = useState(false);
  const [projectTypeLoading, setProjectTypeLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [accountType, setAccountType] = useState('External');

  const [projectTypeForm] = Form.useForm();

  // Transform Redux data for dropdowns
  const clientsList = clients
    .filter(client => client.id && client.client_name)
    .map(client => ({
      id: client.id,
      name: client.client_name,
    }));

  const accountManagersList = accountManagers
    .filter(am => am.id && am.name)
    .map(am => ({
      id: am.id,
      name: am.name,
    }));

  // Project types from Redux or fallback to hardcoded values
  const projectTypeOptions = projectTypesConfig && projectTypesConfig.length > 0
    ? projectTypesConfig.map(pt => ({
        value: pt.name || pt.project_type_name || pt.type,
        label: pt.name || pt.project_type_name || pt.type,
      }))
    : [
        { value: 'Client', label: 'Client' },
        { value: 'Bench', label: 'Bench' },
        { value: 'Training', label: 'Training' },
        { value: 'POC', label: 'POC' },
        { value: 'Presale', label: 'Presale' },
        { value: 'Research', label: 'Research' },
      ];

  // Fetch projects
  const fetchProjectTypes = async (page = 1, limit = 20) => {
    try {
      setLoadingProjectTypes(true);
      const response = await projectsService.getAll({
        page,
        limit,
      });

      let projectsData = [];
      let total = 0;

      if (response) {
        if (Array.isArray(response.data)) {
          projectsData = response.data;
          total = response.pagination?.total || response.data.length;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          projectsData = response.data.data;
          total = response.data.pagination?.total || response.data.data.length;
        } else if (Array.isArray(response)) {
          projectsData = response;
          total = response.length;
        }
      }

      const transformedProjects = projectsData.map((project) => ({
        key: project.id,
        id: project.id,
        project_name: project.project_name,
        project_code: project.project_code,
        client_id: project.client_id,
        client_name: project.client_name,
        project_type: project.project_type,
        account_type: project.account_type,
        account_manager: project.account_manager,
        account_manager_id: project.account_manager_id,
        account_reg_sales_owner: project.account_reg_sales_owner,
        team_size: project.team_size,
        billing_status: project.billing_status,
        is_billable: project.is_billable,
        budget: project.budget,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        description: project.description,
      }));

      setProjectTypes(transformedProjects);
      setProjectTypePagination(prev => ({ ...prev, current: page, pageSize: limit, total }));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      showErrorToast('Failed to load projects');
    } finally {
      setLoadingProjectTypes(false);
    }
  };

  useEffect(() => {
    fetchProjectTypes(1, 20);
  }, []);

  // Handlers
  const handleAddProjectType = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    setAccountType('External');
    projectTypeForm.resetFields();
    projectTypeForm.setFieldsValue({
      account_type: 'External',
      project_type: 'Client',
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
      account_type: record.account_type || 'External',
      account_manager: record.account_manager,
      account_reg_sales_owner: record.account_reg_sales_owner,
      team_size: record.team_size || 1,
      billing_type: record.billing_status === 'Non-Billing' ? 'Non-Billing' : 'Billing',
      budget: record.budget,
      is_billable: record.is_billable !== undefined ? record.is_billable : true,
      status: record.status,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
      description: record.description,
    });
    setAccountType(record.account_type || 'External');
    setIsProjectTypeModalVisible(true);
  };

  const handleDeleteProjectType = (record) => {
    const modal = Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${record.project_name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      okButtonProps: {
        loading: false,
      },
      onOk: async () => {
        try {
          modal.update({
            okButtonProps: {
              loading: true,
              disabled: true,
            },
            cancelButtonProps: {
              disabled: true,
            },
          });
          const response = await projectsService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            showSuccessToast('Project deleted successfully');
            await fetchProjectTypes(projectTypePagination.current, projectTypePagination.pageSize);
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete project');
            modal.update({
              okButtonProps: {
                loading: false,
                disabled: false,
              },
              cancelButtonProps: {
                disabled: false,
              },
            });
          }
        } catch (error) {
          console.error('Failed to delete project:', error);
          showErrorToast(error?.message || 'Failed to delete project');
          modal.update({
            okButtonProps: {
              loading: false,
              disabled: false,
            },
            cancelButtonProps: {
              disabled: false,
            },
          });
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

      // Get account manager ID from name
      const selectedAccountManager = accountManagersList.find(am => am.name === values.account_manager);
      const accountManagerId = selectedAccountManager ? selectedAccountManager.id : '';

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

      // Map project type
      const projectTypeMap = {
        'Client': 'Client',
        'Bench': 'Bench',
        'Training': 'Training',
        'POC': 'POC',
        'Presale': 'Presale',
        'Research': 'Research',
      };

      const project_type = projectTypeMap[values.project_type] || 'Client';

      // Map status
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
          project_type: project_type,
          account_type: values.account_type || 'External',
          account_manager: values.account_manager,
          account_manager_id: accountManagerId,
          account_reg_sales_owner: values.account_reg_sales_owner || null,
          team_size: values.team_size || 1,
          billing_type: values.billing_type || 'Billing',
          budget: values.budget || null,
          status: status,
          description: values.description || '',
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
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
          account_manager_id: accountManagerId,
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

  // Columns
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
      title: 'Account Manager',
      dataIndex: 'account_manager',
      key: 'account_manager',
      width: 180,
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

      {/* Add/Edit Project Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Project' : 'Add New Project'}
        open={isProjectTypeModalVisible}
        onClose={() => {
          setIsProjectTypeModalVisible(false);
          projectTypeForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
          setAccountType('External');
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
              setAccountType('External');
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
        <Form form={projectTypeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Project Name"
                name="project_name"
                rules={[
                  { required: true, message: 'Project name is required' },
                  { max: 200, message: 'Project name must be less than 200 characters' },
                ]}
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Project Code"
                name="project_code"
                rules={[
                  { max: 50, message: 'Project code must be less than 50 characters' },
                ]}
              >
                <Input placeholder="Enter project code (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Account Type"
                name="account_type"
                rules={[{ required: true, message: 'Account type is required' }]}
              >
                <Select
                  placeholder="Select account type"
                  onChange={(value) => setAccountType(value)}
                >
                  <Option value="External">External</Option>
                  <Option value="Internal">Internal</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {accountType === 'External' && (
              <Col span={12}>
                <Form.Item
                  label="Client"
                  name="client_id"
                  rules={[{ required: accountType === 'External', message: 'Client is required for External projects' }]}
                >
                  <Select
                    placeholder="Select client"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {clientsList.map(client => (
                      <Option key={client.id} value={client.id}>
                        {client.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            <Col span={accountType === 'External' ? 12 : 12}>
              <Form.Item
                label="Project Type"
                name="project_type"
                rules={[{ required: true, message: 'Project type is required' }]}
              >
                <Select placeholder="Select project type">
                  {projectTypeOptions.map(pt => (
                    <Option key={pt.value} value={pt.value}>
                      {pt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {accountType === 'Internal' && (
              <Col span={12}></Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Account Manager"
                name="account_manager"
                rules={[{ required: true, message: 'Account manager is required' }]}
              >
                <Select
                  placeholder="Select account manager"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {accountManagersList.map(am => (
                    <Option key={am.id} value={am.name}>
                      {am.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Account Reg/Sales Owner"
                name="account_reg_sales_owner"
                rules={[
                  { max: 100, message: 'Account reg/sales owner must be less than 100 characters' },
                ]}
              >
                <Input placeholder="Enter account reg/sales owner (optional)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Team Size"
                name="team_size"
                rules={[{ required: true, message: 'Team size is required' }]}
              >
                <InputNumber min={1} placeholder="Enter team size" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
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
          </Row>



          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Budget"
                name="budget"
              >
                <InputNumber min={0} placeholder="Enter budget (optional)" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item
                label="Start Date"
                name="start_date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Date"
                name="end_date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
                rules={[
                  { max: 1000, message: 'Description must be less than 1000 characters' },
                ]}
              >
                <TextArea rows={3} placeholder="Enter project description (optional)" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CustomModal>
    </div>
  );
};

export default ProjectsTab;

