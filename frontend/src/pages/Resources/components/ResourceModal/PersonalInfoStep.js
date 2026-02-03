/**
 * Personal Information Step Component
 * Step 1 of the employee form
 */

import React from 'react';
import { Form, Input, DatePicker, Upload, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const PersonalInfoStep = ({ form, isEditMode }) => {
  return (
    <Row gutter={16}>
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
        >
          <Input placeholder="Enter mobile number" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Date of Birth"
          name="bod"
        >
          <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="NIC or Passport"
          name="nicOrPassport"
        >
          <Input placeholder="Enter NIC or Passport number" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="EPF No"
          name="epf_no"
        >
          <Input placeholder="Enter EPF number" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Global Employee ID"
          name="global_employeeid"
        >
          <Input placeholder="Enter global employee ID" />
        </Form.Item>
      </Col>
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
  );
};

PersonalInfoStep.propTypes = {
  form: PropTypes.object.isRequired,
  isEditMode: PropTypes.bool.isRequired,
};

export default PersonalInfoStep;
