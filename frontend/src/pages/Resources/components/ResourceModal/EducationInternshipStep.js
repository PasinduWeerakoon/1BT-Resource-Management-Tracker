/**
 * Education & Internship Step Component
 * Step 3 of the employee form
 */

import React from 'react';
import { Form, Select, DatePicker, Switch, Row, Col } from 'antd';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

const { Option } = Select;

const EducationInternshipStep = ({ form, universities }) => {
  const isIntern = Form.useWatch('is_intern', form);

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          label="University"
          name="university_id"
        >
          <Select
            placeholder="Select university"
            allowClear
            showSearch
            optionFilterProp="children"
            loading={!universities || universities.length === 0}
          >
            {universities?.map((university) => (
              <Option key={university.id} value={university.id}>
                {university.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Is Intern"
          name="is_intern"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>
      </Col>
      {isIntern && (
        <Col xs={24} sm={12}>
          <Form.Item
            label="Internship Completion Target Date"
            name="internship_completion_target_date"
            dependencies={['joined_date']}
            rules={[
              ({ getFieldValue }) => ({
              validator(_, value) {
                const joinDate = getFieldValue('joined_date');
                if (!value || !joinDate || dayjs(value).isAfter(dayjs(joinDate))) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Internship completion date must be after join date'));
              },
              }),
            ]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Select internship completion target date" 
            />
          </Form.Item>
        </Col>
      )}
    </Row>
  );
};

EducationInternshipStep.propTypes = {
  form: PropTypes.object.isRequired,
  universities: PropTypes.array,
};

EducationInternshipStep.defaultProps = {
  universities: [],
};

export default EducationInternshipStep;
