/**
 * ProjectForm Component
 * Form component for creating/editing projects
 */

import React from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col } from 'antd';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

const { Option } = Select;

/**
 * ProjectForm Component
 * @param {Object} props
 * @param {Object} props.form - Form instance
 * @param {boolean} props.isEditMode - Whether in edit mode
 * @param {string} props.accountType - Current account type
 * @param {Function} props.setAccountType - Set account type handler
 * @param {Array} props.clients - Clients list
 * @param {Array} props.accountManagersList - Account managers list
 * @param {Array} props.projectTypesForModal - Project types list
 * @param {Array} props.billingStatusesForModal - Billing statuses list
 * @param {boolean} props.loadingConfigForModal - Loading state for config
 * @param {boolean} props.loadingAccountManagers - Loading state for account managers
 */
const ProjectForm = ({
  form,
  isEditMode,
  accountType,
  setAccountType,
  clients,
  accountManagersList,
  projectTypesForModal,
  billingStatusesForModal,
  loadingConfigForModal,
  loadingAccountManagers,
}) => {
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Project Name"
            name="project_name"
            rules={[{ required: true, message: 'Project name is required' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
        </Col>
        {!isEditMode && (
          <Col xs={24} sm={12}>
            <Form.Item
              label="Project Code"
              name="project_code"
            >
              <Input placeholder="Enter project code (optional)" />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Project Type"
            name="project_type"
            rules={[{ required: true, message: 'Project type is required' }]}
          >
            <Select placeholder="Select project type" loading={loadingConfigForModal}>
              {projectTypesForModal.map((type) => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Account Type"
            name="account_type"
            rules={[{ required: true, message: 'Account type is required' }]}
            initialValue="External"
          >
            <Select
              placeholder="Select account type"
              onChange={(value) => {
                setAccountType(value || 'External');
              }}
            >
              <Option value="External">External</Option>
              <Option value="Internal">Internal</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Client Name"
            name="client_id"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const accountType = getFieldValue('account_type');
                  if (accountType === 'External' && !value) {
                    return Promise.reject(new Error('Client is required for External projects'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Select
              placeholder="Select client"
              showSearch
              allowClear
              disabled={accountType === 'Internal'}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {clients.map((client) => (
                <Option key={client.id} value={client.id} label={client.name}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status is required' }]}
            initialValue="Active"
          >
            <Select placeholder="Select status">
              <Option value="Active">Active</Option>
              <Option value="On Hold">On Hold</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Account Manager"
            name="account_manager"
            rules={[{ required: true, message: 'Account manager is required' }]}
          >
            <Select
              placeholder="Select account manager"
              showSearch
              allowClear
              loading={loadingAccountManagers}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {accountManagersList.map((am) => (
                <Option key={am.id} value={am.name} label={am.name}>
                  {am.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        {!isEditMode && (
          <Col xs={24} sm={12}>
            <Form.Item
              label="Billing Type"
              name="billing_type"
              rules={[{ required: true, message: 'Billing type is required' }]}
            >
              <Select placeholder="Select billing type" loading={loadingConfigForModal}>
                {billingStatusesForModal.map((billing) => (
                  <Option key={billing.id} value={billing.id}>
                    {billing.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Team Size"
            name="team_size"
            rules={[
              { required: true, message: 'Team size is required' },
              { type: 'number', min: 1, message: 'Team size must be at least 1' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter team size"
              min={1}
            />
          </Form.Item>
        </Col>
        {!isEditMode && (
          <Col xs={24} sm={12}>
            <Form.Item
              label="Budget"
              name="budget"
              rules={[
                { type: 'number', min: 0, message: 'Budget must be 0 or greater' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter budget (optional)"
                min={0}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {!isEditMode && (
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Account Reg/Sales Owner"
              name="account_reg_sales_owner"
            >
              <Input placeholder="Enter account reg/sales owner (optional)" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Start Date"
            name="start_date"
          >
            <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="End Date"
            name="end_date"
            dependencies={['start_date']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue('start_date');
                  if (!value || !startDate || value >= startDate) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End date must be greater than or equal to start date'));
                },
              }),
            ]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="Select end date" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Enter project description (optional)" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

ProjectForm.propTypes = {
  form: PropTypes.object.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  accountType: PropTypes.string.isRequired,
  setAccountType: PropTypes.func.isRequired,
  clients: PropTypes.array.isRequired,
  accountManagersList: PropTypes.array.isRequired,
  projectTypesForModal: PropTypes.array.isRequired,
  billingStatusesForModal: PropTypes.array.isRequired,
  loadingConfigForModal: PropTypes.bool,
  loadingAccountManagers: PropTypes.bool,
};

export default ProjectForm;
