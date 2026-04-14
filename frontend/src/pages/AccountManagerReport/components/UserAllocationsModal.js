/**
 * UserAllocationsModal Component
 * Modal for viewing/editing a user's project allocations
 */

import React from 'react';
import { Row, Col, Select, DatePicker, InputNumber, Button, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';

const { Option } = Select;

const UserAllocationsModal = ({
  visible,
  onCancel,
  onSubmit,
  selectedEmployee,
  allocationsList,
  form,
  resourceBillingStatuses,
  onAddRow,
  onRemoveRow,
  onFieldChange,
}) => {
  return (
    <CustomModal
      title={`${selectedEmployee ? selectedEmployee + "'s" : 'User'} Project Allocations`}
      open={visible}
      onClose={onCancel}
      width={1200}
      buttons={[
        { text: 'Cancel', type: 'default', onClick: onCancel },
        { text: 'Save', type: 'primary', onClick: onSubmit },
      ]}
    >
      <Form form={form} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <strong>Employee:</strong> {selectedEmployee || ''} |
          <strong style={{ marginLeft: 16 }}>Total Allocations:</strong> {allocationsList.length}
        </div>

        {allocationsList.map((allocation, index) => (
          <div key={allocation.key} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>Allocation {index + 1}</strong>
              {!allocation.isExisting && (
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => onRemoveRow(allocation.key)}>
                  Remove
                </Button>
              )}
            </div>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Name"
                  name={['allocations', allocation.key, 'projectName']}
                  rules={[{ required: true, message: 'Project name is required' }]}
                  initialValue={allocation.projectName}
                >
                  <Select
                    placeholder="Select project"
                    showSearch
                    value={allocation.projectName}
                    onChange={(value) => onFieldChange(allocation.key, 'projectName', value)}
                    disabled={allocation.isExisting}
                    filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {/* TODO: Replace with actual project list from API */}
                    <Option value="Bench">Bench</Option>
                    <Option value="DXC">DXC</Option>
                    <Option value="Healthfinder">Healthfinder</Option>
                    <Option value="Ideapoint">Ideapoint</Option>
                    <Option value="MillionSpaces">MillionSpaces</Option>
                    <Option value="Presale">Presale</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Allocated Date"
                  name={['allocations', allocation.key, 'allocatedDate']}
                  rules={[{ required: true, message: 'Allocated date is required' }]}
                  initialValue={allocation.allocatedDate}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Select allocated date"
                    value={allocation.allocatedDate}
                    onChange={(date) => onFieldChange(allocation.key, 'allocatedDate', date)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Deallocated Date"
                  name={['allocations', allocation.key, 'deallocatedDate']}
                  initialValue={allocation.deallocatedDate}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Select deallocated date"
                    value={allocation.deallocatedDate}
                    onChange={(date) => onFieldChange(allocation.key, 'deallocatedDate', date)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Billing Status"
                  name={['allocations', allocation.key, 'billingStatus']}
                  initialValue={allocation.billingStatus}
                >
                  <Select
                    placeholder="Select billing status"
                    value={allocation.billingStatus}
                    onChange={(value) => onFieldChange(allocation.key, 'billingStatus', value)}
                  >
                    {resourceBillingStatuses.map((status) => (
                      <Option key={status.id} value={status.name}>{status.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Billing Percentage"
                  name={['allocations', allocation.key, 'billingPercentage']}
                  rules={[
                    { required: true, message: 'Billing percentage is required' },
                    { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                  ]}
                  initialValue={allocation.billingPercentage}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter billing percentage"
                    min={0} max={100}
                    value={allocation.billingPercentage}
                    onChange={(value) => onFieldChange(allocation.key, 'billingPercentage', value)}
                    formatter={(v) => `${v}%`}
                    parser={(v) => v.replace('%', '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Allocation"
                  name={['allocations', allocation.key, 'projectAllocation']}
                  rules={[
                    { required: true, message: 'Project allocation is required' },
                    { type: 'number', min: 0, message: 'Must be 0 or greater' },
                  ]}
                  initialValue={allocation.projectAllocation}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter project allocation"
                    min={0}
                    value={allocation.projectAllocation}
                    onChange={(value) => onFieldChange(allocation.key, 'projectAllocation', value)}
                    formatter={(v) => `${v}%`}
                    parser={(v) => v.replace('%', '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Duration (Days)"
                  name={['allocations', allocation.key, 'duration']}
                  rules={[
                    { required: true, message: 'Duration is required' },
                    { type: 'number', min: 0, message: 'Must be a positive number' },
                  ]}
                  initialValue={allocation.duration}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter duration in days"
                    min={0}
                    value={allocation.duration}
                    onChange={(value) => onFieldChange(allocation.key, 'duration', value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Status"
                  name={['allocations', allocation.key, 'status']}
                  initialValue={allocation.status}
                >
                  <Select
                    placeholder="Select status"
                    value={allocation.status}
                    onChange={(value) => onFieldChange(allocation.key, 'status', value)}
                  >
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        ))}

        <Button type="dashed" icon={<PlusOutlined />} onClick={onAddRow} block style={{ marginTop: 16 }}>
          Add New Allocation
        </Button>
      </Form>
    </CustomModal>
  );
};

export default React.memo(UserAllocationsModal);
