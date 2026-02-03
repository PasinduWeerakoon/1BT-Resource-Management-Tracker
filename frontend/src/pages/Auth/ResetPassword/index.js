import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { authService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/Auth/Login.scss';

const { Title, Text } = Typography;

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const { message } = App.useApp();

    useEffect(() => {
        // Get email and code/token from URL parameters
        const emailParam = searchParams.get('email');
        const codeParam = searchParams.get('code') || searchParams.get('token');

        if (emailParam) {
            setEmail(emailParam);
            form.setFieldsValue({ email: emailParam });
        }

        if (codeParam) {
            setCode(codeParam);
        }

        // If email or code is missing, show warning (but allow manual entry)
        if (!emailParam || !codeParam) {
            logger.warn('Reset password link missing email or code parameter');
        }
    }, [searchParams, form]);

    const onFinish = async (values) => {
        // Use email from form if URL param is missing
        const resetEmail = email || values.email;
        const resetCode = code || values.code;

        if (!resetEmail || !resetCode) {
            showErrorToast('Email and reset code are required. Please check your reset link or enter them manually.');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.resetPassword(
                resetEmail,
                resetCode,
                values.newPassword
            );

            if (response && (response.success !== false)) {
                showSuccessToast('Password reset successfully! You can now login with your new password.');
                message.success('Password reset successfully!');

                // Redirect to login page after a short delay
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 2000);
            } else {
                showErrorToast(response?.message || 'Failed to reset password');
            }
        } catch (error) {
            logger.error('Reset password error:', error);
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <Card className="login-card">
                <div className="login-header">
                    <Title level={2}>1billiontech</Title>
                    <Text type="secondary">Reset Your Password</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                        Enter your new password below. Make sure it meets the security requirements.
                    </Text>
                </div>
                <Form
                    form={form}
                    name="resetPassword"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    layout="vertical"
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
                            placeholder="Email"
                            disabled={!!email}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Reset Code"
                        name="code"
                        rules={[
                            { required: true, message: 'Please enter the reset code!' }
                        ]}
                        extra={code ? 'Reset code found in URL' : 'Enter the reset code from your email'}
                    >
                        <Input
                            placeholder="Enter reset code"
                            disabled={!!code}
                        />
                    </Form.Item>

                    <Form.Item
                        label="New Password"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Please enter your new password!' },
                            { min: 8, message: 'Password must be at least 8 characters long!' },
                            {
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number!',
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter new password"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm your password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Confirm new password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
                <div className="login-info">
                    <Text type="secondary" className="info-title">
                        Remember your password?{' '}
                        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                            Sign in
                        </a>
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default ResetPassword;
