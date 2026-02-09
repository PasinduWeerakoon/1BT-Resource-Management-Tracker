/**
 * ResourceAllocationsModal Component
 * Modal for viewing a resource's current and future allocations
 */

import React from 'react';
import { Row, Col } from 'antd';
import {
  PercentageOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import { getResourceAllocationColumns, getFutureAllocationColumns } from '../utils/columnDefinitions';

const ResourceAllocationsModal = ({
  visible,
  onClose,
  selectedResourceName,
  selectedResourceTotalAllocation,
  selectedResourceTotalBilling,
  resourceAllocationsData,
  loadingResourceAllocations,
}) => {
  const activeAllocations = resourceAllocationsData.filter((a) => a.allocationType === 'active');
  const futureAllocations = resourceAllocationsData.filter((a) => a.allocationType === 'future');

  return (
    <CustomModal
      title={`Project Allocations - ${selectedResourceName}`}
      open={visible}
      onClose={onClose}
      width={1400}
      footer={null}
    >
      {/* Resource Summary Card */}
      <div style={{
        marginBottom: 20,
        padding: '16px 20px',
        backgroundColor: '#fafafa',
        borderRadius: 8,
        border: '1px solid #d9d9d9',
      }}>
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PercentageOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Total Allocation</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#262626' }}>
                  {selectedResourceTotalAllocation.toFixed(0)}%
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DollarOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Total Billing</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#262626' }}>
                  {selectedResourceTotalBilling.toFixed(0)}%
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Current Allocations Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 12,
          padding: '8px 12px',
          backgroundColor: '#f0f5ff',
          borderLeft: '4px solid #1890ff',
          borderRadius: 4,
        }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 8 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>Current Allocations</span>
          <span style={{
            marginLeft: 8,
            padding: '2px 8px',
            backgroundColor: '#52c41a',
            color: 'white',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 500,
          }}>
            {activeAllocations.length}
          </span>
        </div>
        <CustomTable
          columns={getResourceAllocationColumns()}
          dataSource={activeAllocations}
          pagination={false}
          scroll={{ x: 1100 }}
          size="small"
          loading={loadingResourceAllocations}
          locale={{ emptyText: 'No current allocations' }}
        />
      </div>

      {/* Future Allocations Section */}
      {futureAllocations.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 12,
            padding: '8px 12px',
            backgroundColor: '#fff7e6',
            borderLeft: '4px solid #faad14',
            borderRadius: 4,
          }}>
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18, marginRight: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>Future Allocations</span>
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#faad14',
              color: 'white',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
            }}>
              {futureAllocations.length}
            </span>
          </div>
          <CustomTable
            columns={getFutureAllocationColumns()}
            dataSource={futureAllocations}
            pagination={false}
            scroll={{ x: 1100 }}
            size="small"
            loading={loadingResourceAllocations}
            locale={{ emptyText: 'No future allocations' }}
          />
        </div>
      )}
    </CustomModal>
  );
};

export default React.memo(ResourceAllocationsModal);
