import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, Modal, Form, Input, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { tracksService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const TracksTab = () => {
  // State
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [isTrackModalVisible, setIsTrackModalVisible] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [trackForm] = Form.useForm();

  // Fetch tracks
  const fetchTracks = async () => {
    try {
      setLoadingTracks(true);
      const response = await tracksService.getAll();

      let tracksData = [];

      if (response) {
        if (Array.isArray(response.data)) {
          tracksData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          tracksData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          tracksData = response.data;
        } else if (Array.isArray(response)) {
          tracksData = response;
        }
      }

      const transformedTracks = tracksData.map((track) => ({
        key: track.id,
        id: track.id,
        name: track.name,
        description: track.description || '',
        is_active: track.is_active !== undefined ? track.is_active : true,
        is_default: track.is_default !== undefined ? track.is_default : false,
      }));

      setTracks(transformedTracks);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      message.error('Failed to load tracks');
    } finally {
      setLoadingTracks(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  // Handlers
  const handleAddTrack = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    trackForm.resetFields();
    setIsTrackModalVisible(true);
  };

  const handleEditTrack = (record) => {
    // Prevent editing default tracks
    if (record.is_default) {
      showErrorToast('Default tracks cannot be edited');
      return;
    }
    setIsEditMode(true);
    setSelectedItem(record);
    trackForm.setFieldsValue({
      name: record.name,
      description: record.description || '',
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsTrackModalVisible(true);
  };

  const handleDeleteTrack = (record) => {
    // Prevent deleting default tracks
    if (record.is_default) {
      showErrorToast('Default tracks cannot be deleted');
      return;
    }

    const modal = Modal.confirm({
      title: 'Delete Track',
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

          const response = await tracksService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            showSuccessToast('Track deleted successfully');
            await fetchTracks();
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete track');
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
          console.error('Failed to delete track:', error);
          showErrorToast(error?.message || 'Failed to delete track');
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

  const handleTrackSubmit = async () => {
    try {
      setTrackLoading(true);
      const values = await trackForm.validateFields();

      const trackPayload = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        const response = await tracksService.update(selectedItem.id, trackPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Track updated successfully');
          await fetchTracks();
        } else {
          message.error(response?.message || 'Failed to update track');
        }
      } else {
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

  // Columns
  const trackColumns = [
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
          <Tooltip title={record.is_default ? 'Default tracks cannot be edited' : 'Edit'}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTrack(record)}
              className="action-icon-btn"
              disabled={record.is_default}
            />
          </Tooltip>
          <Tooltip title={record.is_default ? 'Default tracks cannot be deleted' : 'Delete'}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTrack(record)}
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
            <Input placeholder="Enter track name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 500, message: 'Description must be less than 500 characters' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Enter track description (optional)" />
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

export default TracksTab;

