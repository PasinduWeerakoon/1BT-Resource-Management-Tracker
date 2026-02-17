/**
 * LoginForm Component
 * Login form component
 */

import React from 'react';
import { Form, Input, Button } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * LoginForm Component
 * @param {Object} props
 * @param {Function} props.onFinish - Form submit handler
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onForgotPassword - Forgot password handler
 */
const LoginForm = ({
  onFinish,
  loading,
  onForgotPassword,
}) => {
  return (
    <>
      <Form
        name="login"
        onFinish={onFinish}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            type="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign In
          </Button>
        </Form.Item>
      </Form>
      {/* <div className="login-info">
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Button
            type="link"
            onClick={onForgotPassword}
            style={{ fontSize: 14, padding: 0 }}
          >
            Forgot Password?
          </Button>
        </div>
      </div> */}
    </>
  );
};

LoginForm.propTypes = {
  onFinish: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  // onForgotPassword: PropTypes.func.isRequired,
};

export default LoginForm;
