/**
 * Tags Tab Component
 */

import React, { useEffect, useMemo } from 'react';
import { Form, Input, Switch } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { tagsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import { selectTags, selectTagsLoading, fetchTagsData } from '@redux/slices/configSlice';

const TagsTab = () => {
  const dispatch = useDispatch();
  // Get data from Redux
  const tagsData = useSelector(selectTags);
  const loadingTags = useSelector(selectTagsLoading);

  // Transform data for table display
  const tags = useMemo(() => {
    return tagsData.map((item, index) => ({
      key: item.id || `tag-${index}`,
      id: item.id,
      name: item.label || item.name, // Use label from API response as name
      description: item.description || '',
      is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
      is_default: item.isDefault !== undefined ? item.isDefault : (item.is_default !== undefined ? item.is_default : false),
      value: item.value || item.id,
      displayOrder: item.displayOrder || 0,
    }));
  }, [tagsData]);

  useEffect(() => {
    // Fetch data if not already loaded
    if (!tagsData.length && !loadingTags) {
      dispatch(fetchTagsData({ force: false }));
    }
  }, [dispatch, tagsData.length, loadingTags]);

  // Refetch function for after CRUD operations
  const refetchTags = async () => {
    await dispatch(fetchTagsData({ force: true })).unwrap();
  };

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
    service: tagsService,
    onFetch: refetchTags,
  });

  // Custom edit handler to prevent editing default tags
  const handleEditTag = (record) => {
    if (record.is_default) {
      showErrorToast('Default tags cannot be edited');
      return;
    }
    handleEdit(record);
  };

  // Custom delete handler to prevent deleting default tags
  const handleDeleteTag = (record) => {
    if (record.is_default) {
      showErrorToast('Default tags cannot be deleted');
      return;
    }
    handleDelete(record, {
      title: 'Delete Tag',
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
        dataSource={tags}
        loading={loadingTags}
        // onEdit={handleEditTag}
        // onDelete={handleDeleteTag}
        isEditDisabled={(record) => record.is_default === true || record.isDefault === true}
        isDeleteDisabled={(record) => record.is_default === true || record.isDefault === true}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 600 }}
        title="Tags"
        addButtonText="Add Tag"
        // onAdd={handleAdd}
      />

      <ConfigModal
        title={isEditMode ? 'Edit Tag' : 'Add New Tag'}
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
          <Input placeholder="Enter tag name (e.g., Synergy, GDC, Leaders League)" />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 255, message: 'Description must be less than 255 characters' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Enter tag description (optional)" />
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

export default TagsTab;
