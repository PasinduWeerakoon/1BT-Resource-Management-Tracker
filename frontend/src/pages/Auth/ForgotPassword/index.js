import React, { useState } from 'react';
import { Form, Input, Button, Modal, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { authService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';

const { Text } = Typography;

const ForgotPassword = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(values.email);

      if (response && (response.success !== false)) {
        setEmailSent(true);
        showSuccessToast('Password reset instructions have been sent to your email');
        if (onSuccess) {
          onSuccess(values.email);
        }
      } else {
        showErrorToast(response?.message || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setEmailSent(false);
    onClose();
  };

  return (
    <Modal
      title="Forgot Password"
      open={visible}
      onCancel={handleClose}
      footer={null}
      closable={!loading}
      maskClosable={!loading}
      width={500}
    >
      {!emailSent ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                type="email"
                disabled={loading}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                Send Reset Instructions
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>
              Check Your Email
            </Text>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary">
              We've sent password reset instructions to <strong>{form.getFieldValue('email')}</strong>.
              Please check your email and follow the instructions to reset your password.
            </Text>
          </div>
          <Button type="primary" onClick={handleClose} block>
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ForgotPassword;
