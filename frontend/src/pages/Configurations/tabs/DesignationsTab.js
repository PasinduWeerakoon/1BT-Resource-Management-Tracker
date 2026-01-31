import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, Modal, Form, Input, Select, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { designationsService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const { Option } = Select;

const DesignationsTab = () => {
  // State
  const [designations, setDesignations] = useState([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [isDesignationModalVisible, setIsDesignationModalVisible] = useState(false);
  const [designationLoading, setDesignationLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [designationForm] = Form.useForm();

  // Fetch designations
  const fetchDesignations = async () => {
    try {
      setLoadingDesignations(true);
      const response = await designationsService.getAll();

      let designationsData = [];

      if (response) {
        if (Array.isArray(response.data)) {
          designationsData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          designationsData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          designationsData = response.data;
        } else if (Array.isArray(response)) {
          designationsData = response;
        }
      }

      const transformedDesignations = designationsData.map((designation) => ({
        key: designation.id,
        id: designation.id,
        name: designation.name,
        level: designation.level,
        tier: designation.level ? `Tier ${String(designation.level).padStart(2, '0')}` : null,
        is_active: designation.is_active !== undefined ? designation.is_active : true,
        is_default: designation.is_default || false,
      }));

      setDesignations(transformedDesignations);
    } catch (error) {
      console.error('Failed to fetch designations:', error);
      message.error('Failed to load designations');
    } finally {
      setLoadingDesignations(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  // Handlers
  const handleAddDesignation = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    designationForm.resetFields();
    setIsDesignationModalVisible(true);
  };

  const handleEditDesignation = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    designationForm.setFieldsValue({
      name: record.name,
      tier: record.tier || (record.level ? `Tier ${String(record.level).padStart(2, '0')}` : 'Tier 01'),
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsDesignationModalVisible(true);
  };

  const handleDeleteDesignation = (record) => {
    const modal = Modal.confirm({
      title: 'Delete Designation',
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

          const response = await designationsService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            showSuccessToast('Designation deleted successfully');
            await fetchDesignations();
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete designation');
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
          console.error('Failed to delete designation:', error);
          showErrorToast(error?.message || 'Failed to delete designation');
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

  const handleDesignationSubmit = async () => {
    try {
      setDesignationLoading(true);
      const values = await designationForm.validateFields();

      // Extract level from tier (e.g., "Tier 01" -> 1)
      const level = values.tier ? parseInt(values.tier.replace('Tier ', '')) : 1;

      const designationPayload = {
        name: values.name,
        level: level,
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        const response = await designationsService.update(selectedItem.id, designationPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Designation updated successfully');
          await fetchDesignations();
        } else {
          message.error(response?.message || 'Failed to update designation');
        }
      } else {
        const response = await designationsService.create(designationPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Designation created successfully');
          await fetchDesignations();
        } else {
          message.error(response?.message || 'Failed to create designation');
        }
      }

      setIsDesignationModalVisible(false);
      designationForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Designation submit error:', error);
      message.error(error?.message || 'Failed to save designation');
    } finally {
      setDesignationLoading(false);
    }
  };

  // Columns
  const designationColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
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
              onClick={() => handleEditDesignation(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteDesignation(record)}
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
          <span className="table-title">Designations</span>
        </div>
        <div className="table-header-actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddDesignation}
          >
            Add Designation
          </Button>
        </div>
      </div>
      <CustomTable
        columns={designationColumns}
        dataSource={designations}
        scroll={{ x: 600 }}
        loading={loadingDesignations}
        pagination={{ pageSize: 20 }}
      />

      {/* Add/Edit Designation Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Designation' : 'Add New Designation'}
        open={isDesignationModalVisible}
        onClose={() => {
          setIsDesignationModalVisible(false);
          designationForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsDesignationModalVisible(false);
              designationForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleDesignationSubmit,
            loading: designationLoading,
          },
        ]}
      >
        <Form form={designationForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter designation name" />
          </Form.Item>

          <Form.Item
            label="Tier"
            name="tier"
            rules={[{ required: true, message: 'Tier is required' }]}
          >
            <Select placeholder="Select tier">
              <Option value="Tier 01">Tier 01</Option>
              <Option value="Tier 02">Tier 02</Option>
              <Option value="Tier 03">Tier 03</Option>
              <Option value="Tier 04">Tier 04</Option>
            </Select>
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

export default DesignationsTab;

