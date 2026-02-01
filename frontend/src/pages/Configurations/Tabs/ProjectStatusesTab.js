/**
 * Project Statuses Tab Component
 */

import React from 'react';
import { Form, Input, Switch } from 'antd';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import { useConfigData } from '../hooks/useConfigData';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { projectStatusesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';

const ProjectStatusesTab = () => {
  // Data fetching
  const { data: projectStatuses, loading: loadingProjectStatuses, fetchData: fetchProjectStatuses } = useConfigData({
    fetchFunction: projectStatusesService.getAll,
    transformData: (item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
      is_default: item.is_default === true,
    }),
    autoFetch: true,
  });

  // CRUD operations
  const {
    form,
    isModalVisible,
    isEditMode,
    loading,
    handleAdd,
    handleEdit,
    handleCloseModal,
    handleSubmit,
    handleDelete,
  } = useConfigCRUD({
    service: projectStatusesService,
    onFetch: fetchProjectStatuses,
  });

  // Custom edit handler to prevent editing default project statuses
  const handleEditProjectStatus = (record) => {
    if (record.is_default) {
      showErrorToast('Default project statuses cannot be edited');
      return;
    }
    handleEdit(record);
  };

  // Custom delete handler to prevent deleting default project statuses
  const handleDeleteProjectStatus = (record) => {
    if (record.is_default) {
      showErrorToast('Default project statuses cannot be deleted');
      return;
    }
    handleDelete(record, {
      title: 'Delete Project Status',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
    });
  };

  // Columns
  const columns = [
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
  ];

  return (
    <>
      <ConfigTable
        columns={columns}
        dataSource={projectStatuses}
        loading={loadingProjectStatuses}
        onEdit={handleEditProjectStatus}
        onDelete={handleDeleteProjectStatus}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 600 }}
        title="Project Statuses"
        addButtonText="Add Project Status"
        onAdd={handleAdd}
      />

      <ConfigModal
        title={isEditMode ? 'Edit Project Status' : 'Add New Project Status'}
        open={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={loading}
        isEditMode={isEditMode}
        form={form}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: 'Name is required' },
            { max: 50, message: 'Name must be less than 50 characters' },
          ]}
        >
          <Input placeholder="Enter project status name (e.g., Active, On Hold, Completed)" />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 500, message: 'Description must be less than 500 characters' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Enter description (optional)" />
        </Form.Item>
        <Form.Item
          label="Active"
          name="is_active"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </ConfigModal>
    </>
  );
};

export default ProjectStatusesTab;
