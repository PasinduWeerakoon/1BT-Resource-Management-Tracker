/**
 * Billing & Allocation Step Component
 * Step 4 of the employee form
 */

import React from 'react';
import { Form, InputNumber, Row, Col } from 'antd';
import PropTypes from 'prop-types';

const BillingAllocationStep = ({ form }) => {
  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Total Allocation"
          name="total_allocation"
          rules={[
            { type: 'number', min: 0, message: 'Total allocation must be 0 or greater' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter total allocation"
            min={0}
            step={0.01}
            precision={2}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Total Resource Billing"
          name="total_resource_billing"
          rules={[
            { type: 'number', min: 0, message: 'Total resource billing must be 0 or greater' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter total resource billing"
            min={0}
            step={0.01}
            precision={2}
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

BillingAllocationStep.propTypes = {
  form: PropTypes.object.isRequired,
};

export default BillingAllocationStep;
