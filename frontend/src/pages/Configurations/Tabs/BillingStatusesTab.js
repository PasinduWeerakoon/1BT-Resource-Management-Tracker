/**
 * Billing Statuses Tab Component
 */

import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Input, Switch } from 'antd';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { billingStatusesService } from '@api';
import { selectBillingStatuses, selectBillingStatusesLoading, fetchBillingStatusesData } from '@redux/slices/configSlice';
import { showErrorToast } from '@utils/toast.utils';

const BillingStatusesTab = () => {
  const dispatch = useDispatch();
  // Get data from Redux
  const billingStatusesData = useSelector(selectBillingStatuses);
  const loadingBillingStatuses = useSelector(selectBillingStatusesLoading);

  // Transform data for table display
  const billingStatuses = useMemo(() => {
    return billingStatusesData.map((item, index) => ({
      key: item.id || `billing-status-${index}`,
      id: item.id,
      name: item.label || item.name,
      description: item.description || '',
      is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
      is_default: item.isDefault !== undefined ? item.isDefault : (item.is_default !== undefined ? item.is_default : false),
      value: item.value || item.id,
      displayOrder: item.displayOrder || 0,
    }));
  }, [billingStatusesData]);

  // Refetch function for after CRUD operations
  useEffect(() => {
    // Fetch data if not already loaded
    if (!billingStatusesData.length && !loadingBillingStatuses) {
      dispatch(fetchBillingStatusesData({ force: false }));
    }
  }, [dispatch, billingStatusesData.length, loadingBillingStatuses]);

  const refetchBillingStatuses = async () => {
    await dispatch(fetchBillingStatusesData({ force: true })).unwrap();
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
    service: billingStatusesService,
    onFetch: refetchBillingStatuses,
  });

  // Custom edit handler to prevent editing default billing statuses
  const handleEditBillingStatus = (record) => {
    if (record.is_default) {
      showErrorToast('Default billing statuses cannot be edited');
      return;
    }
    handleEdit(record);
  };

  // Custom delete handler to prevent deleting default billing statuses
  const handleDeleteBillingStatus = (record) => {
    if (record.is_default) {
      showErrorToast('Default billing statuses cannot be deleted');
      return;
    }
    handleDelete(record, {
      title: 'Delete Billing Status',
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
        dataSource={billingStatuses}
        loading={loadingBillingStatuses}
        onEdit={handleEditBillingStatus}
        onDelete={handleDeleteBillingStatus}
        isEditDisabled={(record) => record.is_default === true || record.isDefault === true}
        isDeleteDisabled={(record) => record.is_default === true || record.isDefault === true}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 600 }}
        title="Billing Statuses"
        addButtonText="Add Billing Status"
        onAdd={handleAdd}
      />

      <ConfigModal
        title={isEditMode ? 'Edit Billing Status' : 'Add New Billing Status'}
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
          <Input placeholder="Enter billing status name" />
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

export default BillingStatusesTab;
