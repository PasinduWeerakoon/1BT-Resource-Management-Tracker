/**
 * Tracks Tab Component
 */

import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Input, Switch } from 'antd';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { tracksService } from '@api';
import { selectTracks, selectTracksLoading, fetchTracksData } from '@redux/slices/configSlice';

const TracksTab = () => {
  const dispatch = useDispatch();
  // Get data from Redux
  const tracksData = useSelector(selectTracks);
  const loadingTracks = useSelector(selectTracksLoading);

  useEffect(() => {
    // Fetch data if not already loaded
    if (!tracksData.length && !loadingTracks) {
      dispatch(fetchTracksData({ force: false }));
    }
  }, [dispatch, tracksData.length, loadingTracks]);

  // Transform data for table display
  const tracks = useMemo(() => {
    return tracksData.map((item, index) => ({
      key: item.id || `track-${index}`,
      id: item.id,
      name: item.label || item.name,
      description: item.description || '',
      is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
      is_default: item.isDefault !== undefined ? item.isDefault : (item.is_default !== undefined ? item.is_default : false),
      value: item.value || item.id,
      displayOrder: item.displayOrder || 0,
    }));
  }, [tracksData]);

  // Refetch function for after CRUD operations
  const refetchTracks = async () => {
    await dispatch(fetchTracksData({ force: true })).unwrap();
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
    service: tracksService,
    onFetch: refetchTracks,
    deleteConfig: {
      method: 'update',
      payload: { is_active: false },
    },
  });

  // Columns
  const columns = [
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
  ];

  return (
    <>
      <ConfigTable
        columns={columns}
        dataSource={tracks}
        loading={loadingTracks}
        onEdit={handleEdit}
        onDelete={(record) => handleDelete(record, {
          title: 'Delete Track',
          content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
        })}
        isEditDisabled={(record) => record.is_default === true || record.isDefault === true}
        isDeleteDisabled={(record) => record.is_default === true || record.isDefault === true}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 600 }}
        title="Tracks"
        addButtonText="Add Track"
        onAdd={handleAdd}
      />

      <ConfigModal
        title={isEditMode ? 'Edit Track' : 'Add New Track'}
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
            { max: 100, message: 'Name must be less than 100 characters' },
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

export default TracksTab;
