/**
 * Employment Details Step Component
 * Step 2 of the employee form
 */

import React from 'react';
import { Form, Input, Select, DatePicker, Switch, Row, Col } from 'antd';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

const { Option } = Select;

const EmploymentDetailsStep = ({ 
  form, 
  isEditMode, 
  designations, 
  tiers, 
  tracks, 
  techStacks,
  employeeTypes,
}) => {

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Employee Number"
          name="emp_no"
          rules={[{ required: true, message: 'Employee number is required' }]}
        >
          <Input placeholder="Enter employee number" disabled={isEditMode} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Employment Type"
          name="employee_type_id"
          rules={[{ required: true, message: 'Employment type is required' }]}
        >
          <Select 
            placeholder="Select employment type"
            showSearch
            optionFilterProp="children"
            loading={!employeeTypes || employeeTypes.length === 0}
          >
            {employeeTypes?.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Designation"
          name="designation_id"
          rules={[{ required: true, message: 'Designation is required' }]}
        >
          <Select 
            placeholder="Select designation" 
            showSearch 
            optionFilterProp="children"
            loading={!designations || designations.length === 0}
          >
            {designations?.map((designation) => (
              <Option key={designation.id} value={designation.id}>
                {designation.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Tier"
          name="tier_id"
          rules={[{ required: true, message: 'Tier is required' }]}
        >
          <Select
            placeholder="Select tier"
            showSearch
            optionFilterProp="children"
            loading={!tiers || tiers.length === 0}
          >
            {tiers?.map((tier) => (
              <Option key={tier.id} value={tier.id}>
                {tier.name}
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
          <Select 
            placeholder="Select track" 
            showSearch 
            optionFilterProp="children"
            loading={!tracks || tracks.length === 0}
          >
            {tracks?.map((track) => (
              <Option key={track.id} value={track.id}>
                {track.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Tech Stack"
          name="tech_stack_id"
        >
          <Select 
            placeholder="Select tech stack" 
            allowClear
            showSearch
            optionFilterProp="children"
            loading={!techStacks || techStacks.length === 0}
          >
            {techStacks?.map((stack) => (
              <Option key={stack.id} value={stack.id}>
                {stack.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Join Date"
          name="joined_date"
        >
          <DatePicker style={{ width: '100%' }} placeholder="Select join date" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Last Increment Date"
          name="last_increment_date"
        >
          <DatePicker style={{ width: '100%' }} placeholder="Select last increment date" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Last Promotion Date"
          name="last_promotion_date"
            dependencies={['joined_date']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const joinDate = getFieldValue('joined_date');
                if (!value || !joinDate || dayjs(value).isAfter(dayjs(joinDate)) || dayjs(value).isSame(dayjs(joinDate))) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Last promotion date must be after or equal to join date'));
              },
            }),
          ]}
        >
          <DatePicker style={{ width: '100%' }} placeholder="Select last promotion date" />
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
    </Row>
  );
};

EmploymentDetailsStep.propTypes = {
  form: PropTypes.object.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  designations: PropTypes.array,
  tiers: PropTypes.array,
  tracks: PropTypes.array,
  techStacks: PropTypes.array,
  employeeTypes: PropTypes.array,
};

EmploymentDetailsStep.defaultProps = {
  designations: [],
  tiers: [],
  tracks: [],
  techStacks: [],
  employeeTypes: [],
};

export default EmploymentDetailsStep;
