import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, Modal, Form, Input, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { projectTypesService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const ProjectTypesConfigTab = () => {
  // State
  const [projectTypesConfig, setProjectTypesConfig] = useState([]);
  const [loadingProjectTypesConfig, setLoadingProjectTypesConfig] = useState(false);
  const [isProjectTypeConfigModalVisible, setIsProjectTypeConfigModalVisible] = useState(false);
  const [projectTypeConfigLoading, setProjectTypeConfigLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [projectTypeConfigForm] = Form.useForm();

  // Fetch project types
  const fetchProjectTypesConfig = async () => {
    try {
      setLoadingProjectTypesConfig(true);
      const response = await projectTypesService.getAll();

      let projectTypesData = [];

      if (response) {
        if (Array.isArray(response.data)) {
          projectTypesData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          projectTypesData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          projectTypesData = response.data;
        } else if (Array.isArray(response)) {
          projectTypesData = response;
        }
      }

      const transformedProjectTypes = projectTypesData.map((projectType) => ({
        key: projectType.id,
        id: projectType.id,
        name: projectType.name,
        description: projectType.description || '',
        is_active: projectType.is_active !== undefined ? projectType.is_active : true,
        is_default: projectType.is_default === true,
      }));

      setProjectTypesConfig(transformedProjectTypes);
    } catch (error) {
      console.error('Failed to fetch project types:', error);
      showErrorToast('Failed to load project types');
    } finally {
      setLoadingProjectTypesConfig(false);
    }
  };

  useEffect(() => {
    fetchProjectTypesConfig();
  }, []);

  // Handlers
  const handleAddProjectTypeConfig = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    projectTypeConfigForm.resetFields();
    setIsProjectTypeConfigModalVisible(true);
  };

  const handleEditProjectTypeConfig = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    projectTypeConfigForm.setFieldsValue({
      name: record.name,
      description: record.description || '',
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsProjectTypeConfigModalVisible(true);
  };

  const handleDeleteProjectTypeConfig = (record) => {
    const modal = Modal.confirm({
      title: 'Delete Project Type',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
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

          const response = await projectTypesService.delete(record.id);

          if (response && (response.success !== false || response.data)) {
            showSuccessToast('Project type deleted successfully');
            await fetchProjectTypesConfig();
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete project type');
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
          console.error('Failed to delete project type:', error);
          showErrorToast(error?.message || 'Failed to delete project type');
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

  const handleProjectTypeConfigSubmit = async () => {
    try {
      setProjectTypeConfigLoading(true);
      const values = await projectTypeConfigForm.validateFields();

      const projectTypePayload = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        const response = await projectTypesService.update(selectedItem.id, projectTypePayload);

        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project type updated successfully');
          await fetchProjectTypesConfig();
        } else {
          showErrorToast(response?.message || 'Failed to update project type');
        }
      } else {
        const response = await projectTypesService.create(projectTypePayload);

        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project type created successfully');
          await fetchProjectTypesConfig();
        } else {
          showErrorToast(response?.message || 'Failed to create project type');
        }
      }

      setIsProjectTypeConfigModalVisible(false);
      projectTypeConfigForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Project type submit error:', error);
      showErrorToast(error?.message || 'Failed to save project type');
    } finally {
      setProjectTypeConfigLoading(false);
    }
  };

  // Columns
  const projectTypeConfigColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 400,
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
              onClick={() => handleEditProjectTypeConfig(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteProjectTypeConfig(record)}
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
            onClick={handleAddProjectTypeConfig}
          >
            Add Project Type
          </Button>
        </div>
      </div>
      <CustomTable
        columns={projectTypeConfigColumns}
        dataSource={projectTypesConfig}
        scroll={{ x: 600 }}
        loading={loadingProjectTypesConfig}
        pagination={{ pageSize: 20 }}
      />

      {/* Add/Edit Project Type Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Project Type' : 'Add New Project Type'}
        open={isProjectTypeConfigModalVisible}
        onClose={() => {
          setIsProjectTypeConfigModalVisible(false);
          projectTypeConfigForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsProjectTypeConfigModalVisible(false);
              projectTypeConfigForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleProjectTypeConfigSubmit,
            loading: projectTypeConfigLoading,
          },
        ]}
      >
        <Form form={projectTypeConfigForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter project type name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 500, message: 'Description must be less than 500 characters' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Enter project type description (optional)" />
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
    </div>
  );
};

export default ProjectTypesConfigTab;

