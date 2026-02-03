/**
 * ProjectModal Component
 * Modal for creating/editing projects in Account Manager Report
 */

import React from 'react';
import { Form, Row, Col, Input, Select, DatePicker, InputNumber } from 'antd';
import CustomModal from '@components/Modal';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

const { Option } = Select;

/**
 * ProjectModal Component
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {boolean} props.isEditMode - Whether in edit mode
 * @param {Object} props.form - Form instance
 * @param {Function} props.onCancel - Cancel handler
 * @param {Function} props.onSubmit - Submit handler
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.filters - Current filters
 * @param {Array} props.projectStatusesList - List of project statuses
 * @param {Array} props.projectTypesList - List of project types
 * @param {Array} props.accountTypesList - List of account types
 * @param {Array} props.billingStatusesList - List of billing statuses
 * @param {Array} props.clientsList - List of clients
 * @param {Array} props.accountManagersList - List of account managers
 * @param {boolean} props.loadingAccountManagers - Loading state for account managers
 * @param {string} props.accountType - Current account type
 * @param {Function} props.setAccountType - Set account type handler
 * @param {Function} props.setBillingType - Set billing type handler
 */
const ProjectModal = ({
  visible,
  isEditMode,
  form,
  onCancel,
  onSubmit,
  loading,
  filters,
  projectStatusesList = [],
  projectTypesList = [],
  accountTypesList = [],
  billingStatusesList = [],
  clientsList = [],
  accountManagersList = [],
  loadingAccountManagers = false,
  accountType,
  setAccountType,
  setBillingType,
}) => {
  return (
    <CustomModal
      title={isEditMode ? "Edit Project Details" : "Create New Project"}
      open={visible}
      onClose={onCancel}
      width={800}
      buttons={[
        {
          text: 'Cancel',
          type: 'default',
          onClick: onCancel,
        },
        {
          text: isEditMode ? 'Update Details' : 'Create Project',
          type: 'primary',
          htmlType: 'submit',
          onClick: () => {
            form.submit();
          },
          loading: loading,
        },
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          accountManager: filters.accountManager && filters.accountManager !== 'All'
            ? filters.accountManager
            : undefined,
          status: projectStatusesList.find(s => s.name === 'Active')?.id || 'Active',
          billingType: undefined,
          accountType: accountTypesList.find(t => t.name === 'External')?.id || 'External',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Project Name"
              name="projectName"
              rules={[
                { required: true, message: 'Project name is required' },
                { min: 3, message: 'Project name must be at least 3 characters' },
                { max: 200, message: 'Project name must not exceed 200 characters' },
              ]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Status is required' }]}
            >
              <Select placeholder="Select status">
                {projectStatusesList.map((status) => (
                  <Option key={status.id} value={status.id}>
                    {status.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Project Type"
              name="projectType"
              rules={[{ required: true, message: 'Project type is required' }]}
            >
              <Select placeholder="Select project type">
                {projectTypesList.map((type) => (
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
              name="accountType"
              rules={[{ required: true, message: 'Account type is required' }]}
            >
              <Select
                placeholder="Select account type"
                onChange={(value) => {
                  const selectedType = accountTypesList.find(t => t.id === value);
                  setAccountType(selectedType?.name || value);
                }}
              >
                {accountTypesList.map((type) => (
                  <Option key={type.id} value={type.id}>
                    {type.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Project Code"
              name="projectCode"
            >
              <Input placeholder="Enter project code (optional)" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Client Name"
              name="clientName"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const accountTypeId = getFieldValue('accountType');
                    const selectedAccountType = accountTypesList.find(t => t.id === accountTypeId);
                    if (selectedAccountType?.name === 'External' && !value) {
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
                {clientsList.map((client) => (
                  <Option key={client.id} value={client.id} label={client.client_name}>
                    {client.client_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Project Start Date"
              name="projectStartDate"
            >
              <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Project End Date"
              name="projectEndDate"
              dependencies={['projectStartDate']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue('projectStartDate');
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
          <Col xs={24} sm={12}>
            <Form.Item
              label="Billing"
              name="billingType"
              rules={[{ required: true, message: 'Billing type is required' }]}
            >
              <Select
                placeholder="Select billing type"
                onChange={(value) => setBillingType(value)}
              >
                {billingStatusesList.map((status) => (
                  <Option key={status.id} value={status.id}>
                    {status.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Account Manager"
              name="accountManager"
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
                  <Option key={am.id} value={am.id} label={am.name}>
                    {am.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Team Size"
              name="teamSize"
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
          <Col xs={24} sm={12}>
            <Form.Item
              label="Account Reg Sales Owner"
              name="accountRegSalesOwner"
            >
              <Input placeholder="Enter account reg sales owner (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Budget"
              name="budget"
              rules={[
                { type: 'number', min: 0, message: 'Budget must be a positive number' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter budget"
                min={0}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter project description (optional)"
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </CustomModal>
  );
};

ProjectModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  form: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  filters: PropTypes.object.isRequired,
  projectStatusesList: PropTypes.array,
  projectTypesList: PropTypes.array,
  accountTypesList: PropTypes.array,
  billingStatusesList: PropTypes.array,
  clientsList: PropTypes.array,
  accountManagersList: PropTypes.array,
  loadingAccountManagers: PropTypes.bool,
  accountType: PropTypes.string,
  setAccountType: PropTypes.func.isRequired,
  setBillingType: PropTypes.func.isRequired,
};

export default ProjectModal;
