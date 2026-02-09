/**
 * Tiers Tab Component
 */

import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Input, InputNumber, Switch } from 'antd';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { tiersService } from '@api';
import { selectTiers, selectTiersLoading, fetchTiersData } from '@redux/slices/configSlice';
import { showErrorToast } from '@utils/toast.utils';

const TiersTab = () => {
  const dispatch = useDispatch();
  // Get data from Redux
  const tiersData = useSelector(selectTiers);
  const loadingTiers = useSelector(selectTiersLoading);

  // Transform data for table display
  const tiers = useMemo(() => {
    return tiersData.map((item, index) => ({
      key: item.id || `tier-${index}`,
      id: item.id,
      name: item.label || item.name,
      level: item.value || item.level,
      description: item.description || '',
      is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
      is_default: item.isDefault !== undefined ? item.isDefault : (item.is_default !== undefined ? item.is_default : false),
      displayOrder: item.displayOrder || 0,
    }));
  }, [tiersData]);

  useEffect(() => {
    // Fetch data if not already loaded
    if (!tiersData.length && !loadingTiers) {
      dispatch(fetchTiersData({ force: false }));
    }
  }, [dispatch, tiersData.length, loadingTiers]);

  // Refetch function for after CRUD operations
  const refetchTiers = async () => {
    await dispatch(fetchTiersData({ force: true })).unwrap();
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
    service: tiersService,
    onFetch: refetchTiers,
  });

  // Custom edit handler to prevent editing default tiers
  const handleEditTier = (record) => {
    if (record.is_default) {
      showErrorToast('Default tiers cannot be edited');
      return;
    }
    form.setFieldsValue({
      name: record.name,
      level: record.level,
      description: record.description,
      is_active: record.is_active !== undefined ? record.is_active : record.isActive,
    });
    handleEdit(record);
  };

  // Custom delete handler to prevent deleting default tiers
  const handleDeleteTier = (record) => {
    if (record.is_default) {
      showErrorToast('Default tiers cannot be deleted');
      return;
    }
    handleDelete(record, {
      title: 'Delete Tier',
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
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      sorter: (a, b) => (a.level || 0) - (b.level || 0),
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
        dataSource={tiers}
        loading={loadingTiers}
        // onEdit={handleEditTier}
        // onDelete={handleDeleteTier}
        isEditDisabled={(record) => record.is_default === true || record.isDefault === true}
        isDeleteDisabled={(record) => record.is_default === true || record.isDefault === true}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 700 }}
        title="Tiers"
        addButtonText="Add Tier"
        // onAdd={handleAdd}
      />

      <ConfigModal
        title={isEditMode ? 'Edit Tier' : 'Add New Tier'}
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
          <Input placeholder="Enter tier name (e.g., Tier - 1, Tier - 2)" />
        </Form.Item>
        <Form.Item
          label="Level"
          name="level"
          rules={[
            { type: 'number', message: 'Level must be a number' },
          ]}
        >
          <InputNumber
            placeholder="Enter tier level (e.g., 1, 2, 3, 4)"
            style={{ width: '100%' }}
            min={1}
          />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 500, message: 'Description must be less than 500 characters' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Enter tier description (optional)" />
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

export default TiersTab;
