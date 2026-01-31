import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, Modal, Form, Input, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { billingStatusesService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const BillingStatusesTab = () => {
  // State
  const [billingStatuses, setBillingStatuses] = useState([]);
  const [loadingBillingStatuses, setLoadingBillingStatuses] = useState(false);
  const [isBillingStatusModalVisible, setIsBillingStatusModalVisible] = useState(false);
  const [billingStatusLoading, setBillingStatusLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [billingStatusForm] = Form.useForm();

  // Fetch billing statuses
  const fetchBillingStatuses = async () => {
    try {
      setLoadingBillingStatuses(true);
      const response = await billingStatusesService.getAll();

      let billingStatusesData = [];

      if (response) {
        if (Array.isArray(response.data)) {
          billingStatusesData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          billingStatusesData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          billingStatusesData = response.data;
        } else if (Array.isArray(response)) {
          billingStatusesData = response;
        }
      }

      const transformedBillingStatuses = billingStatusesData.map((billingStatus) => ({
        key: billingStatus.id,
        id: billingStatus.id,
        name: billingStatus.name,
        description: billingStatus.description || '',
        is_active: billingStatus.is_active !== undefined ? billingStatus.is_active : true,
        is_default: billingStatus.is_default === true,
      }));

      setBillingStatuses(transformedBillingStatuses);
    } catch (error) {
      console.error('Failed to fetch billing statuses:', error);
      showErrorToast('Failed to load billing statuses');
    } finally {
      setLoadingBillingStatuses(false);
    }
  };

  useEffect(() => {
    fetchBillingStatuses();
  }, []);

  // Handlers
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
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsBillingStatusModalVisible(true);
  };

  const handleDeleteBillingStatus = (record) => {
    const modal = Modal.confirm({
      title: 'Delete Billing Status',
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

          const response = await billingStatusesService.delete(record.id);

          if (response && (response.success !== false || response.data)) {
            showSuccessToast('Billing status deleted successfully');
            await fetchBillingStatuses();
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete billing status');
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
          console.error('Failed to delete billing status:', error);
          showErrorToast(error?.message || 'Failed to delete billing status');
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

  const handleBillingStatusSubmit = async () => {
    try {
      setBillingStatusLoading(true);
      const values = await billingStatusForm.validateFields();

      const billingStatusPayload = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        const response = await billingStatusesService.update(selectedItem.id, billingStatusPayload);

        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Billing status updated successfully');
          await fetchBillingStatuses();
        } else {
          showErrorToast(response?.message || 'Failed to update billing status');
        }
      } else {
        const response = await billingStatusesService.create(billingStatusPayload);

        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Billing status created successfully');
          await fetchBillingStatuses();
        } else {
          showErrorToast(response?.message || 'Failed to create billing status');
        }
      }

      setIsBillingStatusModalVisible(false);
      billingStatusForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Billing status submit error:', error);
      showErrorToast(error?.message || 'Failed to save billing status');
    } finally {
      setBillingStatusLoading(false);
    }
  };

  // Columns
  const billingStatusColumns = [
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
              onClick={() => handleEditBillingStatus(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteBillingStatus(record)}
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
        scroll={{ x: 600 }}
        loading={loadingBillingStatuses}
        pagination={{ pageSize: 20 }}
      />

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
            <Input.TextArea rows={3} placeholder="Enter billing status description (optional)" />
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

export default BillingStatusesTab;

