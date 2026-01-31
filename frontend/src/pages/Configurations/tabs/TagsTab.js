import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, Modal, Form, Input, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { tagsService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const TagsTab = () => {
  // State
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [tagForm] = Form.useForm();

  // Fetch tags
  const fetchTags = async () => {
    try {
      setLoadingTags(true);
      const response = await tagsService.getAll();

      let tagsData = [];

      if (response) {
        if (Array.isArray(response.data)) {
          tagsData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          tagsData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          tagsData = response.data;
        } else if (Array.isArray(response)) {
          tagsData = response;
        }
      }

      const transformedTags = tagsData.map((tag) => ({
        key: tag.id,
        id: tag.id,
        name: tag.name,
        description: tag.description || '',
        is_active: tag.is_active !== undefined ? tag.is_active : true,
        is_default: tag.is_default || false,
      }));

      setTags(transformedTags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      message.error('Failed to load tags');
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Handlers
  const handleAddTag = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    tagForm.resetFields();
    setIsTagModalVisible(true);
  };

  const handleEditTag = (record) => {
    // Prevent editing default tags
    if (record.is_default) {
      showErrorToast('Default tags cannot be edited');
      return;
    }
    setIsEditMode(true);
    setSelectedItem(record);
    tagForm.setFieldsValue({
      name: record.name,
      description: record.description || '',
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsTagModalVisible(true);
  };

  const handleDeleteTag = (record) => {
    // Prevent deleting default tags
    if (record.is_default) {
      showErrorToast('Default tags cannot be deleted');
      return;
    }

    const modal = Modal.confirm({
      title: 'Delete Tag',
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
          const response = await tagsService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            showSuccessToast('Tag deleted successfully');
            await fetchTags();
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete tag');
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
          console.error('Failed to delete tag:', error);
          showErrorToast(error?.message || 'Failed to delete tag');
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

  const handleTagSubmit = async () => {
    try {
      setTagLoading(true);
      const values = await tagForm.validateFields();

      const tagPayload = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        const response = await tagsService.update(selectedItem.id, tagPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Tag updated successfully');
          await fetchTags();
        } else {
          message.error(response?.message || 'Failed to update tag');
        }
      } else {
        const response = await tagsService.create(tagPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Tag created successfully');
          await fetchTags();
        } else {
          message.error(response?.message || 'Failed to create tag');
        }
      }

      setIsTagModalVisible(false);
      tagForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Tag submit error:', error);
      message.error(error?.message || 'Failed to save tag');
    } finally {
      setTagLoading(false);
    }
  };

  // Columns
  const tagColumns = [
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
          <Tooltip title={record.is_default ? 'Default tags cannot be edited' : 'Edit'}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTag(record)}
              className="action-icon-btn"
              disabled={record.is_default}
            />
          </Tooltip>
          <Tooltip title={record.is_default ? 'Default tags cannot be deleted' : 'Delete'}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTag(record)}
              className="action-icon-btn"
              danger
              disabled={record.is_default}
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
          <span className="table-title">Tags</span>
        </div>
        <div className="table-header-actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTag}
          >
            Add Tag
          </Button>
        </div>
      </div>
      <CustomTable
        columns={tagColumns}
        dataSource={tags}
        scroll={{ x: 600 }}
        loading={loadingTags}
        pagination={{ pageSize: 20 }}
      />

      {/* Add/Edit Tag Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Tag' : 'Add New Tag'}
        open={isTagModalVisible}
        onClose={() => {
          setIsTagModalVisible(false);
          tagForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsTagModalVisible(false);
              tagForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleTagSubmit,
            loading: tagLoading,
          },
        ]}
      >
        <Form form={tagForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter tag name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 500, message: 'Description must be less than 500 characters' },
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
        </Form>
      </CustomModal>
    </div>
  );
};

export default TagsTab;

