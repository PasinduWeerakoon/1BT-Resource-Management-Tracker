import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip, Modal, Form, Input, Select, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { clientsService } from '@api';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';

const { Option } = Select;

const ClientsTab = () => {
  // State
  const [clientsList, setClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientPagination, setClientPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [clientFilters, setClientFilters] = useState({
    search: '',
    is_active: undefined,
  });
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [clientForm] = Form.useForm();

  // Fetch clients
  const fetchClientsList = async (page = 1, limit = 20) => {
    try {
      setLoadingClients(true);
      const params = {
        page,
        limit,
      };

      // Add search filter if provided
      if (clientFilters.search && clientFilters.search.trim()) {
        params.search = clientFilters.search.trim();
      }

      // Add is_active filter if provided
      if (clientFilters.is_active !== undefined && clientFilters.is_active !== null) {
        params.is_active = clientFilters.is_active;
      }

      const response = await clientsService.getAll(params);

      let clientsData = [];
      let paginationData = {};

      if (response) {
        if (Array.isArray(response.data)) {
          clientsData = response.data;
          paginationData = response.pagination || {};
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          clientsData = response.data.data;
          paginationData = response.data.pagination || {};
        } else if (response.pagination && response.data && Array.isArray(response.data)) {
          clientsData = response.data;
          paginationData = response.pagination;
        } else if (Array.isArray(response)) {
          clientsData = response;
          paginationData = {};
        }
      }

      paginationData = {
        total: paginationData.total || 0,
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        totalPages: paginationData.totalPages || 0,
      };

      const transformedClients = clientsData.map((client) => ({
        key: client.id,
        id: client.id,
        client_name: client.client_name,
        contact_person: client.contact_person,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address,
        is_active: client.is_active !== undefined ? client.is_active : true,
      }));

      setClientsList(transformedClients);
      setClientPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      message.error('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClientsList(1, clientPagination.pageSize);
  }, []);

  // Fetch clients when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientsList(1, clientPagination.pageSize);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientFilters.search, clientFilters.is_active]);

  // Handlers
  const handleAddClient = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    clientForm.resetFields();
    setIsClientModalVisible(true);
  };

  const handleEditClient = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    clientForm.setFieldsValue({
      client_name: record.client_name,
      contact_person: record.contact_person,
      contact_email: record.contact_email,
      contact_phone: record.contact_phone,
      address: record.address,
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsClientModalVisible(true);
  };

  const handleDeleteClient = (record) => {
    const modal = Modal.confirm({
      title: 'Delete Client',
      content: `Are you sure you want to delete "${record.client_name}"? This action cannot be undone.`,
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
          const response = await clientsService.delete(record.id);

          if (response && (response.success !== false || response.message)) {
            showSuccessToast('Client deleted successfully');
            await fetchClientsList(clientPagination.current, clientPagination.pageSize);
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete client');
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
          console.error('Failed to delete client:', error);
          showErrorToast(error?.message || 'Failed to delete client');
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

  const handleClientSubmit = async () => {
    try {
      setClientLoading(true);
      const values = await clientForm.validateFields();

      const clientPayload = {
        client_name: values.client_name,
        contact_person: values.contact_person || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || '',
        address: values.address || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        const response = await clientsService.update(selectedItem.id, clientPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Client updated successfully');
          await fetchClientsList(clientPagination.current, clientPagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to update client');
        }
      } else {
        const response = await clientsService.create(clientPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Client created successfully');
          await fetchClientsList(clientPagination.current, clientPagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to create client');
        }
      }

      setIsClientModalVisible(false);
      clientForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Client submit error:', error);
      message.error(error?.message || 'Failed to save client');
    } finally {
      setClientLoading(false);
    }
  };

  // Columns
  const clientColumns = [
    {
      title: 'Client Name',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 150,
    },
    {
      title: 'Contact Email',
      dataIndex: 'contact_email',
      key: 'contact_email',
      width: 200,
    },
    {
      title: 'Contact Phone',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 150,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 250,
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
              onClick={() => handleEditClient(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClient(record)}
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
          <span className="table-title">Clients</span>
        </div>
        <div className="table-header-actions">
          <Space>
            <Input
              placeholder="Search by name or contact person"
              value={clientFilters.search}
              onChange={(e) => {
                setClientFilters({ ...clientFilters, search: e.target.value });
              }}
              onPressEnter={() => fetchClientsList(1, clientPagination.pageSize)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Filter by status"
              value={clientFilters.is_active}
              onChange={(value) => {
                setClientFilters({ ...clientFilters, is_active: value });
              }}
              allowClear
              style={{ width: 150 }}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddClient}
            >
              Add Client
            </Button>
          </Space>
        </div>
      </div>
      <CustomTable
        columns={clientColumns}
        dataSource={clientsList}
        scroll={{ x: 1000 }}
        loading={loadingClients}
        pagination={{
          current: clientPagination.current,
          pageSize: clientPagination.pageSize,
          total: clientPagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} clients`,
          onChange: (page, pageSize) => {
            setClientPagination(prev => ({ ...prev, current: page, pageSize }));
            fetchClientsList(page, pageSize);
          },
          onShowSizeChange: (current, size) => {
            setClientPagination(prev => ({ ...prev, current: 1, pageSize: size }));
            fetchClientsList(1, size);
          },
        }}
      />

      {/* Add/Edit Client Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Client' : 'Add New Client'}
        open={isClientModalVisible}
        onClose={() => {
          setIsClientModalVisible(false);
          clientForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={700}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsClientModalVisible(false);
              clientForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleClientSubmit,
            loading: clientLoading,
          },
        ]}
      >
        <Form form={clientForm} layout="vertical">
          <Form.Item
            label="Client Name"
            name="client_name"
            rules={[
              { required: true, message: 'Client name is required' },
              { max: 100, message: 'Client name must be less than 100 characters' },
            ]}
          >
            <Input placeholder="Enter client name" />
          </Form.Item>

          <Form.Item
            label="Contact Person"
            name="contact_person"
            rules={[
              { max: 100, message: 'Contact person must be less than 100 characters' },
            ]}
          >
            <Input placeholder="Enter contact person name (optional)" />
          </Form.Item>

          <Form.Item
            label="Contact Email"
            name="contact_email"
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
              { max: 100, message: 'Email must be less than 100 characters' },
            ]}
          >
            <Input placeholder="Enter contact email (optional)" />
          </Form.Item>

          <Form.Item
            label="Contact Phone"
            name="contact_phone"
            rules={[
              { max: 50, message: 'Phone must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter contact phone (optional)" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[
              { max: 500, message: 'Address must be less than 500 characters' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Enter address (optional)" />
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

export default ClientsTab;

