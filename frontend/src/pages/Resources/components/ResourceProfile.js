/**
 * ResourceProfile Component
 * Employee profile modal with tabs
 */

import React, { useState, useEffect } from 'react';
import { Tabs, Card, Avatar, Row, Col } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import ResourceCharts from './ResourceCharts';
import { resourcesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import dayjs from 'dayjs';

const ResourceProfile = ({
  selectedEmployee,
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [employeeAllocations, setEmployeeAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  // Fetch employee allocations
  const fetchEmployeeAllocations = async (employeeId) => {
    if (!employeeId) {
      setEmployeeAllocations([]);
      return;
    }

    try {
      setLoadingAllocations(true);
      const response = await resourcesService.getAllocations(employeeId);

      let allocationsData = [];

      if (response) {
        if (response.allocations && Array.isArray(response.allocations)) {
          allocationsData = response.allocations;
        } else if (response.data && response.data.allocations && Array.isArray(response.data.allocations)) {
          allocationsData = response.data.allocations;
        } else if (Array.isArray(response.data)) {
          allocationsData = response.data;
        } else if (Array.isArray(response)) {
          allocationsData = response;
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          if (response.data.allocations && Array.isArray(response.data.allocations)) {
            allocationsData = response.data.allocations;
          } else if (response.data.id) {
            allocationsData = [response.data];
          }
        }
      }

      // Transform allocations data
      const transformedAllocations = allocationsData.map((allocation, index) => {
        let duration = 0;
        if (allocation.start_date) {
          const startDate = dayjs(allocation.start_date);
          const endDate = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
          duration = endDate.diff(startDate, 'day');
        }

        const allocationPercentage = typeof allocation.allocation_percentage === 'string'
          ? parseFloat(allocation.allocation_percentage)
          : (allocation.allocation_percentage || 0);
        const billingPercentage = typeof allocation.billing_percentage === 'string'
          ? parseFloat(allocation.billing_percentage)
          : (allocation.billing_percentage || 0);

        let billingStatus = 'Non-Billing';
        if (allocation.project_type === 'Client' || allocation.project_is_billable) {
          billingStatus = 'Billing';
        } else if (allocation.project_type === 'Bench') {
          billingStatus = 'Bench';
        } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
          billingStatus = 'Presale';
        } else if (allocation.project_type === 'Training') {
          billingStatus = 'Training';
        }

        return {
          key: allocation.id || `allocation-${index}`,
          id: allocation.id,
          project: allocation.project_name || 'N/A',
          allocatedDate: allocation.start_date ? dayjs(allocation.start_date).format('YYYY-MM-DD') : '-',
          deallocatedDate: allocation.end_date ? dayjs(allocation.end_date).format('YYYY-MM-DD') : '-',
          billingStatus: billingStatus,
          billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
          projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
          duration: duration,
        };
      });

      setEmployeeAllocations(transformedAllocations);
    } catch (error) {
      logger.error('Failed to fetch employee allocations', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load employee allocations');
      setEmployeeAllocations([]);
    } finally {
      setLoadingAllocations(false);
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'allocations' && selectedEmployee?.id) {
      fetchEmployeeAllocations(selectedEmployee.id);
    }
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isVisible) {
      setActiveTab('overview');
      setEmployeeAllocations([]);
    }
  }, [isVisible]);

  if (!selectedEmployee) return null;

  const allocationColumns = [
    { title: 'Project', dataIndex: 'project', key: 'project', width: 150, fixed: 'left' },
    { title: 'Project Allocated Date', dataIndex: 'allocatedDate', key: 'allocatedDate', width: 150 },
    { title: 'Project Deallocated Date', dataIndex: 'deallocatedDate', key: 'deallocatedDate', width: 180 },
    { title: 'Billing Status', dataIndex: 'billingStatus', key: 'billingStatus', width: 130 },
    { title: 'Billing Percentage', dataIndex: 'billingPercentage', key: 'billingPercentage', width: 150 },
    { title: 'Project Allocation', dataIndex: 'projectAllocation', key: 'projectAllocation', width: 150 },
    { title: 'Duration (Days)', dataIndex: 'duration', key: 'duration', width: 130 },
  ];

  // Mock history data (replace with API data)
  const historyData = [
    {
      key: '1',
      project: 'Project A',
      allocatedDate: '2024-01-15',
      deallocatedDate: '2024-06-30',
      billingStatus: 'Billing',
      billingPercentage: '50%',
      projectAllocation: '50%',
      duration: '165',
    },
    {
      key: '2',
      project: 'Project B',
      allocatedDate: '2024-02-01',
      deallocatedDate: '2024-05-31',
      billingStatus: 'Billing',
      billingPercentage: '30%',
      projectAllocation: '30%',
      duration: '120',
    },
    {
      key: '3',
      project: 'Project C',
      allocatedDate: '2023-06-01',
      deallocatedDate: '2023-12-31',
      billingStatus: 'Billing',
      billingPercentage: '100%',
      projectAllocation: '100%',
      duration: '214',
    },
  ];

  return (
    <CustomModal
      title={`${selectedEmployee.name} - Employee Profile`}
      open={isVisible}
      onClose={onClose}
      width={1400}
      className="employee-profile-modal"
      buttons={[
        {
          text: 'Close',
          type: 'default',
          onClick: onClose,
        },
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <Row gutter={24}>
                  <Col xs={24} md={8}>
                    <Card>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <Avatar
                          size={120}
                          src={selectedEmployee.photo}
                          icon={<UserOutlined />}
                        />
                        <h2 style={{ marginTop: 16, marginBottom: 8 }}>{selectedEmployee.name}</h2>
                        <p style={{ color: '#8c8c8c' }}>{selectedEmployee.position}</p>
                      </div>
                      <div style={{ marginTop: 20 }}>
                        <p><strong>Employee Number:</strong> {selectedEmployee.employeeNumber}</p>
                        <p><strong>Tier:</strong> {selectedEmployee.tier}</p>
                        <p><strong>Join Date:</strong> {selectedEmployee.joinDate}</p>
                        <p><strong>Status:</strong> {selectedEmployee.status}</p>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={16}>
                    <ResourceCharts employeeKey={selectedEmployee.key} />
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'allocations',
            label: 'Project Allocations',
            children: (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <CustomTable
                  columns={allocationColumns}
                  dataSource={employeeAllocations}
                  scroll={{ x: 1000 }}
                  pagination={false}
                  loading={loadingAllocations}
                />
              </div>
            ),
          },
          {
            key: 'history',
            label: 'Projects History',
            children: (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <CustomTable
                  columns={allocationColumns}
                  dataSource={historyData}
                  scroll={{ x: 1000 }}
                  pagination={false}
                />
              </div>
            ),
          },
        ]}
      />
    </CustomModal>
  );
};

export default ResourceProfile;
