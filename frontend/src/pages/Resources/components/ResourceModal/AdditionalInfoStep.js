/**
 * Additional Information Step Component
 * Step 5 of the employee form
 */

import React from 'react';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import PropTypes from 'prop-types';

const { Option } = Select;

const AdditionalInfoStep = ({ form, tags }) => {
  return (
    <Row gutter={16}>
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
            {tags?.map((tag) => (
              <Option key={tag.id} value={tag.id}>
                {tag.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Skills"
          name="skills"
        >
          <Select
            mode="tags"
            placeholder="Enter skills (press Enter to add)"
            allowClear
            tokenSeparators={[',']}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Helper ID"
          name="helper_id"
        >
          <Input placeholder="Enter helper ID" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Helper"
          name="helper"
        >
          <Input placeholder="Enter helper name" />
        </Form.Item>
      </Col>
    </Row>
  );
};

AdditionalInfoStep.propTypes = {
  form: PropTypes.object.isRequired,
  tags: PropTypes.array,
};

AdditionalInfoStep.defaultProps = {
  tags: [],
};

export default AdditionalInfoStep;
