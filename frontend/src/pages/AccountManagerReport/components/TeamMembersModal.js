/**
 * TeamMembersModal Component
 * Modal for viewing and managing team members of a project
 */

import React from 'react';
import { Row, Col, Select, DatePicker, InputNumber, Button, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';

const { Option } = Select;

const TeamMembersModal = ({
  visible,
  onCancel,
  onSubmit,
  selectedProject,
  teamMembersList,
  form,
  resourcesList,
  onAddRow,
  onRemoveRow,
  onFieldChange,
}) => {
  return (
    <CustomModal
      title="Add Team Members"
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
          <strong>Project:</strong> {selectedProject?.project || ''} |
          <strong style={{ marginLeft: 16 }}>Team Size:</strong> {selectedProject?.teamSize || 0} |
          <strong style={{ marginLeft: 16 }}>Current Members:</strong> {teamMembersList.length}
        </div>

        {teamMembersList.map((member, index) => (
          <div key={member.key} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>Member {index + 1}</strong>
              {member.key.startsWith('new-') && (
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => onRemoveRow(member.key)}>
                  Remove
                </Button>
              )}
            </div>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Employee Name"
                  name={['members', member.key, 'employeeName']}
                  rules={[{ required: true, message: 'Employee name is required' }]}
                  initialValue={member.employeeName}
                >
                  <Select
                    placeholder="Select employee"
                    showSearch
                    disabled={member.isExisting}
                    value={member.resource_id || member.employeeId}
                    onChange={(value) => onFieldChange(member.key, 'employeeName', value)}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {resourcesList.map((resource) => (
                      <Option key={resource.id} value={resource.id}>{resource.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Project Name" name={['members', member.key, 'projectName']} initialValue={member.projectName}>
                  <Select disabled value={member.projectName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Allocated Date"
                  name={['members', member.key, 'allocatedDate']}
                  rules={[{ required: true, message: 'Allocated date is required' }]}
                  initialValue={member.allocatedDate}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Select allocated date"
                    value={member.allocatedDate}
                    onChange={(date) => onFieldChange(member.key, 'allocatedDate', date)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Deallocated Date"
                  name={['members', member.key, 'deallocatedDate']}
                  initialValue={member.deallocatedDate}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Select deallocated date"
                    value={member.deallocatedDate}
                    onChange={(date) => onFieldChange(member.key, 'deallocatedDate', date)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Billing Status"
                  name={['members', member.key, 'billingStatus']}
                  initialValue={member.billingStatus}
                >
                  <Select placeholder="Select billing status" onChange={(value) => onFieldChange(member.key, 'billingStatus', value)}>
                    <Option value="Billing">Billing</Option>
                    <Option value="Non-Billing">Non-Billing</Option>
                    <Option value="Bench">Bench</Option>
                    <Option value="Training">Training</Option>
                    <Option value="Presale">Presale</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Billing Percentage"
                  name={['members', member.key, 'billingPercentage']}
                  rules={[
                    { required: true, message: 'Billing percentage is required' },
                    { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                  ]}
                  initialValue={member.billingPercentage}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter billing percentage"
                    min={0} max={100}
                    onChange={(value) => onFieldChange(member.key, 'billingPercentage', value)}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace('%', '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Project Allocation"
                  name={['members', member.key, 'projectAllocation']}
                  rules={[
                    { required: true, message: 'Project allocation is required' },
                    { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                  ]}
                  initialValue={member.projectAllocation}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter project allocation"
                    min={0} max={100}
                    value={member.projectAllocation}
                    onChange={(value) => onFieldChange(member.key, 'projectAllocation', value)}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace('%', '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Duration (Days)"
                  name={['members', member.key, 'duration']}
                  rules={[
                    { required: true, message: 'Duration is required' },
                    { type: 'number', min: 0, message: 'Must be a positive number' },
                  ]}
                  initialValue={member.duration}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter duration in days"
                    min={0}
                    value={member.duration}
                    onChange={(value) => onFieldChange(member.key, 'duration', value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Status" name={['members', member.key, 'status']} initialValue={member.status}>
                  <Select placeholder="Select status" onChange={(value) => onFieldChange(member.key, 'status', value)}>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        ))}

        <Button type="dashed" icon={<PlusOutlined />} onClick={onAddRow} block style={{ marginTop: 16 }}>
          Add Member
        </Button>
      </Form>
    </CustomModal>
  );
};

export default React.memo(TeamMembersModal);
