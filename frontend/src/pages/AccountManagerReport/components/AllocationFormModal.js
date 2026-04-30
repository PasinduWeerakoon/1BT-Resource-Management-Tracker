/**
 * AllocationFormModal Component
 * Modal for creating/editing an allocation
 */

import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Row, Col, Select, DatePicker, InputNumber, Form, Switch, Input, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import { selectBillingStatuses } from '@redux/slices/configSlice';

const { Option } = Select;
const { useWatch } = Form;

const AllocationFormModal = ({
  visible,
  isEditMode,
  onCancel,
  onSubmit,
  form,
  isSubmitting,
  resourcesList,
  projectsForFilter,
}) => {
  // Billing status options from Redux config (same as Configurations -> Billing Statuses)
  const billingStatuses = useSelector(selectBillingStatuses) || [];

  // Watch the billing_status_id to determine if billing percentage should be disabled
  const billingStatusId = useWatch('billing_status_id', form);

  // Find the selected billing status name (use name or label from config)
  const selectedBillingStatus = useMemo(() => {
    if (!billingStatusId) return null;
    const status = billingStatuses.find((s) => s.id === billingStatusId);
    return status ? (status.name || status.label) : null;
  }, [billingStatusId, billingStatuses]);
  
  const isBillingDisabled = selectedBillingStatus === 'Non-Billing';

  // Effect to auto-set billing percentage to 0 when Non-Billing is selected
  useEffect(() => {
    if (isBillingDisabled) {
      const currentBillingPercentage = form.getFieldValue('billing_percentage');
      if (currentBillingPercentage !== 0) {
        form.setFieldValue('billing_percentage', 0);
      }
    }
  }, [isBillingDisabled, form]);
  return (
    <CustomModal
      title={isEditMode ? 'Edit Allocation' : 'Add New Allocation'}
      open={visible}
      onClose={onCancel}
      width={700}
      buttons={[
        { text: 'Cancel', type: 'default', onClick: onCancel },
        { text: isEditMode ? 'Update' : 'Add', type: 'primary', onClick: onSubmit, loading: isSubmitting },
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Resource (Employee)" name="resource_id" rules={[{ required: true, message: 'Resource is required' }]}>
              <Select
                placeholder="Select resource"
                showSearch
                optionFilterProp="children"
                disabled={isEditMode}
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
              >
                {resourcesList.length > 0 ? (
                  resourcesList.map((r) => (
                    <Option key={r.id} value={r.id}>{r.name}</Option>
                  ))
                ) : (
                  <Option disabled value="">Loading resources...</Option>
                )}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Project" name="project_id" rules={[{ required: true, message: 'Project is required' }]}>
              <Select
                placeholder="Select project"
                showSearch
                optionFilterProp="children"
                allowClear
                disabled={isEditMode}
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
              >
                {projectsForFilter.length > 0 ? (
                  projectsForFilter.map((p) => (
                    <Option key={p.id} value={p.id}>{p.project_name || p.name}</Option>
                  ))
                ) : (
                  <Option disabled value="">Loading projects...</Option>
                )}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Allocation Percentage"
              name="allocation_percentage"
              dependencies={['billing_percentage']}
              rules={[
                { required: true, message: 'Allocation percentage is required' },
                { type: 'number', min: 0, message: 'Must be 0 or greater' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const billing = getFieldValue('billing_percentage');
                    if (value === 0 && (billing === 0 || billing === null || billing === undefined)) {
                      return Promise.reject(
                        new Error('Allocation and Billing percentage cannot both be 0%. At least one must be greater than 0%.')
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter allocation percentage"
                min={0}
                formatter={(v) => `${v}%`}
                parser={(v) => v.replace('%', '')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Billing Status" name="billing_status_id">
              <Select
                placeholder="Select billing status"
                showSearch
                optionFilterProp="children"
                allowClear
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
              >
                {billingStatuses.map((s) => (
                  <Option key={s.id} value={s.id}>{s.label || s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <span>
                  Billing Percentage
                  {isBillingDisabled && (
                    <span style={{ marginLeft: 8, color: '#999', fontSize: '12px' }}>
                      (Auto-set to 0% for Non-Billing)
                    </span>
                  )}
                </span>
              }
              name="billing_percentage"
              dependencies={['allocation_percentage']}
              rules={[
                { required: true, message: 'Billing percentage is required' },
                { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const alloc = getFieldValue('allocation_percentage');
                    if (value === 0 && (alloc === 0 || alloc === null || alloc === undefined)) {
                      return Promise.reject(
                        new Error('Allocation and Billing percentage cannot both be 0%.')
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={isBillingDisabled ? 'Auto-set to 0%' : 'Enter billing percentage'}
                min={0} max={100}
                formatter={(v) => `${v}%`}
                parser={(v) => v.replace('%', '')}
                disabled={isBillingDisabled}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <span>
                  Effective Date{' '}
                  <Tooltip title="When the allocation takes effect. Future dates will be scheduled for automatic activation.">
                    <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              name="start_date"
              rules={[{ required: true, message: 'Effective date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="Select effective date" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Deallocation Date"
              name="end_date"
              dependencies={['start_date']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue('start_date');
                    if (value && startDate && value < startDate) {
                      return Promise.reject(new Error('Deallocation date must be after effective date'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select deallocation date (optional)"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          {isEditMode && (
            <Col xs={24} sm={12}>
              <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          )}
          <Col xs={24}>
            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={3} placeholder="Enter allocation notes (optional)" maxLength={500} showCount />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </CustomModal>
  );
};

export default React.memo(AllocationFormModal);
