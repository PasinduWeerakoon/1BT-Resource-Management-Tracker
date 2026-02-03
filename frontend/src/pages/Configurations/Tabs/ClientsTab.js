/**
 * Clients Tab Component
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Switch, Space, Row, Col } from 'antd';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import { useConfigData } from '../hooks/useConfigData';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { clientsService } from '@api';
import { PAGINATION } from '@constants/app';

const { Option } = Select;

const ClientsTab = () => {
  const [filters, setFilters] = useState({
    search: '',
    is_active: undefined,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    total: 0,
  });

  // Data fetching with pagination
  const fetchClients = async (page = 1, limit = PAGINATION.DEFAULT_PAGE_SIZE) => {
    try {
      const params = {
        page,
        limit,
      };

      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (filters.is_active !== undefined && filters.is_active !== null) {
        params.is_active = filters.is_active;
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

      const transformed = clientsData.map((client) => ({
        key: client.id,
        id: client.id,
        client_name: client.client_name,
        contact_person: client.contact_person,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address,
        is_active: client.is_active !== undefined ? client.is_active : true,
        is_default: client.isDefault !== undefined ? client.isDefault : (client.is_default !== undefined ? client.is_default : false),
      }));

      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });

      return transformed;
    } catch (error) {
      return [];
    }
  };

  const { data: clients, loading: loadingClients, fetchData, setData } = useConfigData({
    fetchFunction: fetchClients,
    autoFetch: false,
  });

  // Fetch on mount and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, pagination.pageSize).then((data) => {
        if (data) setData(data);
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.is_active]);

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
    service: clientsService,
    onFetch: () => {
      fetchData(pagination.current, pagination.pageSize).then((data) => {
        if (data) setData(data);
      });
    },
  });

  // Columns
  const columns = [
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
  ];

  return (
    <>
      <ConfigTable
        columns={columns}
        dataSource={clients}
        loading={loadingClients}
        onEdit={handleEdit}
        onDelete={(record) => handleDelete(record, {
          title: 'Delete Client',
          content: `Are you sure you want to delete "${record.client_name}"? This action cannot be undone.`,
        })}
        isEditDisabled={(record) => record.is_default === true || record.isDefault === true}
        isDeleteDisabled={(record) => record.is_default === true || record.isDefault === true}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} clients`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
            fetchData(page, pageSize).then((data) => {
              if (data) setData(data);
            });
          },
          onShowSizeChange: (current, size) => {
            setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
            fetchData(1, size).then((data) => {
              if (data) setData(data);
            });
          },
        }}
        scroll={{ x: 1000 }}
        title="Clients"
        addButtonText="Add Client"
        onAdd={handleAdd}
        extraActions={
          <Space>
            <Input
              placeholder="Search by name or contact person"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
              }}
              onPressEnter={() => {
                fetchData(1, pagination.pageSize).then((data) => {
                  if (data) setData(data);
                });
              }}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Filter by status"
              value={filters.is_active}
              onChange={(value) => {
                setFilters({ ...filters, is_active: value });
              }}
              allowClear
              style={{ width: 150 }}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Space>
        }
      />

      <ConfigModal
        title={isEditMode ? 'Edit Client' : 'Add New Client'}
        open={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={loading}
        isEditMode={isEditMode}
        form={form}
        width={700}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
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
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Contact Person"
              name="contact_person"
              rules={[
                { required: true, message: 'Contact person is required' },
                { max: 100, message: 'Contact person name must be less than 100 characters' },
              ]}
            >
              <Input placeholder="Enter contact person name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Contact Email"
              name="contact_email"
              rules={[
                { required: true, message: 'Contact email is required' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="Enter contact email" type="email" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Contact Phone"
              name="contact_phone"
              rules={[
                { required: true, message: 'Contact phone is required' },
              ]}
            >
              <Input placeholder="Enter contact phone" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              label="Address"
              name="address"
              rules={[
                { max: 255, message: 'Address must be less than 255 characters' },
              ]}
            >
              <Input.TextArea rows={3} placeholder="Enter client address" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Active"
              name="is_active"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>
        </Row>
      </ConfigModal>
    </>
  );
};

export default ClientsTab;
