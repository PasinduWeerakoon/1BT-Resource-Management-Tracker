import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Empty } from 'antd';
import CustomModal from '@components/Modal';
import { resourcesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';

const CurrentAllocationsModal = ({
  visible,
  onClose,
  employeeId,
  employeeName,
  resourceId,
}) => {
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [resource, setResource] = useState(null);
  const [totalAllocation, setTotalAllocation] = useState(0);

  useEffect(() => {
    if (visible && (employeeId || employeeName || resourceId)) {
      fetchCurrentAllocations();
    } else {
      // Reset when modal closes
      setAllocations([]);
      setResource(null);
      setTotalAllocation(0);
    }
  }, [visible, employeeId, employeeName, resourceId]);

  const fetchCurrentAllocations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (resourceId) {
        params.resource_id = resourceId;
      } else if (employeeId) {
        params.employee_id = employeeId;
      } else if (employeeName) {
        params.employee_name = employeeName;
      }

      const response = await resourcesService.getCurrentAllocations(params);

      if (response && response.data) {
        setResource(response.data.resource || response.resource);
        setAllocations(response.data.allocations || response.allocations || []);
        setTotalAllocation(response.data.total_allocation || response.total_allocation || 0);
      } else {
        setAllocations([]);
        setResource(null);
        setTotalAllocation(0);
      }
    } catch (error) {
      console.error('Failed to fetch current allocations:', error);
      showErrorToast(error?.message || 'Failed to load current allocations');
      setAllocations([]);
      setResource(null);
      setTotalAllocation(0);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Project Type',
      dataIndex: 'project_type',
      key: 'project_type',
      width: 120,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Allocation %',
      dataIndex: 'allocation_percentage',
      key: 'allocation_percentage',
      width: 120,
      align: 'right',
      sorter: (a, b) => parseFloat(a.allocation_percentage || 0) - parseFloat(b.allocation_percentage || 0),
      render: (percentage) => `${parseFloat(percentage || 0).toFixed(2)}%`,
    },
    {
      title: 'Billing %',
      dataIndex: 'billing_percentage',
      key: 'billing_percentage',
      width: 120,
      align: 'right',
      sorter: (a, b) => parseFloat(a.billing_percentage || 0) - parseFloat(b.billing_percentage || 0),
      render: (percentage) => `${parseFloat(percentage || 0).toFixed(2)}%`,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billing_status_name',
      key: 'billing_status_name',
      width: 150,
      render: (name, record) => {
        if (!name) return 'N/A';
        const color = record.billing_status_color || '#1890ff';
        return (
          <Tag color={color} style={{ borderColor: color }}>
            {name}
          </Tag>
        );
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date) => date || 'N/A',
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date) => date || 'N/A',
    },
  ];

  return (
    <CustomModal
      title={`Current Allocations - ${resource?.name || employeeName || 'Employee'}`}
      open={visible}
      onClose={onClose}
      width={1000}
      footer={null}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : allocations.length === 0 ? (
        <Empty description="No current allocations found" />
      ) : (
        <>
          {resource && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <strong>Employee:</strong> {resource.name} |{' '}
              <strong>Employee ID:</strong> {resource.employee_id || 'N/A'} |{' '}
              <strong>Total Allocation:</strong> {totalAllocation.toFixed(2)}%
            </div>
          )}
          <Table
            columns={columns}
            dataSource={allocations.map((allocation, index) => ({
              ...allocation,
              key: allocation.id || index,
            }))}
            pagination={false}
            scroll={{ x: 800 }}
            size="small"
          />
        </>
      )}
    </CustomModal>
  );
};

export default CurrentAllocationsModal;

