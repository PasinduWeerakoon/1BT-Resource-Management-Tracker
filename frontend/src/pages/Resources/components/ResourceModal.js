/**
 * ResourceModal Component
 * Add/Edit Employee form modal
 */

import React from 'react';
import { Form, Input, Select, DatePicker, Upload, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';

const { Option } = Select;

const ResourceModal = ({
  isVisible,
  isEditMode,
  loading,
  form,
  onClose,
  onSubmit,
  tiers,
  designations,
  tracks,
  tags,
}) => {
  return (
    <CustomModal
      title={isEditMode ? 'Edit Employee Details' : 'Add New Employee'}
      open={isVisible}
      onClose={onClose}
      width={900}
      buttons={[
        {
          text: 'Cancel',
          type: 'default',
          onClick: onClose,
        },
        {
          text: isEditMode ? 'Update Details' : 'Add Employee',
          type: 'primary',
          onClick: onSubmit,
          loading: loading,
        },
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          {!isEditMode && (
            <Col xs={24} sm={12}>
              <Form.Item
                label="Employee ID"
                name="employee_id"
                rules={[{ required: true, message: 'Employee ID is required' }]}
              >
                <Input placeholder="Enter employee ID" />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={12}>
            <Form.Item
              label="Employee Number"
              name="employeeNumber"
              rules={[{ required: true, message: 'Employee number is required' }]}
            >
              <Input placeholder="Enter employee number" disabled={isEditMode} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Tier"
              name="tier"
              rules={[{ required: true, message: 'Tier is required' }]}
            >
              <Select
                placeholder="Select tier"
                loading={tiers.length === 0}
                notFoundContent={tiers.length === 0 ? 'Loading tiers...' : 'No tiers available'}
                showSearch
                optionFilterProp="children"
              >
                {tiers.map((tier) => (
                  <Option key={tier.id} value={tier.name}>
                    {tier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="Enter email address" type="email" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Mobile"
              name="mobile"
              rules={[{ required: true, message: 'Mobile number is required' }]}
            >
              <Input placeholder="Enter mobile number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Designation"
              name="designation_id"
              rules={[{ required: true, message: 'Designation is required' }]}
            >
              <Select placeholder="Select designation" showSearch optionFilterProp="children">
                {designations.map((designation) => (
                  <Option key={designation.id} value={designation.id}>
                    {designation.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Track"
              name="track_id"
              rules={[{ required: true, message: 'Track is required' }]}
            >
              <Select placeholder="Select track" showSearch optionFilterProp="children">
                {tracks.map((track) => (
                  <Option key={track.id} value={track.id}>
                    {track.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Join Date"
              name="joinDate"
              rules={[{ required: true, message: 'Join date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="Select join date" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Date of Birth (BOD)"
              name="bod"
              rules={[{ required: true, message: 'Date of birth is required' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="NIC or Passport"
              name="nicOrPassport"
              rules={[{ required: true, message: 'NIC or Passport is required' }]}
            >
              <Input placeholder="Enter NIC or Passport number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Employee Type"
              name="employee_type"
              initialValue="Internal"
              rules={[{ required: true, message: 'Employee type is required' }]}
            >
              <Select placeholder="Select employee type">
                <Option value="Internal">Internal</Option>
                <Option value="External">External</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Is Intern"
              name="is_intern"
              initialValue={false}
            >
              <Select placeholder="Select intern status">
                <Option value={false}>No</Option>
                <Option value={true}>Yes</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Tech Stack"
              name="tech_stack"
            >
              <Select placeholder="Select tech stack" allowClear>
                <Option value=".NET">.NET</Option>
                <Option value="Full Stack">Full Stack</Option>
                <Option value="QA">QA</Option>
                <Option value="BA/PM">BA/PM</Option>
                <Option value="Data Science">Data Science</Option>
                <Option value="Java">Java</Option>
                <Option value="React">React</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Tags"
              name="tag_ids"
            >
              <Select
                mode="multiple"
                placeholder="Select tags"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {tags.map((tag) => (
                  <Option key={tag.id} value={tag.id}>
                    {tag.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {isEditMode && (
            <Col xs={24} sm={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Status is required' }]}
              >
                <Select placeholder="Select status">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="Serving Notice Period">Serving Notice Period</Option>
                  <Option value="On Leave">On Leave</Option>
                </Select>
              </Form.Item>
            </Col>
          )}
          <Col xs={24}>
            <Form.Item
              label="Photo"
              name="photo"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e?.fileList;
              }}
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </CustomModal>
  );
};

export default ResourceModal;
