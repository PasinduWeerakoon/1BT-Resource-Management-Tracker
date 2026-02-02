import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Modal, Form, Input, Button, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { initializeAuth } from '@redux/slices/authSlice';
import { authService } from '@api';
import { storeAuth } from '@utils/auth.utils';
import { getUserFromToken } from '@utils/jwt.utils';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import ForgotPassword from '@pages/Auth/ForgotPassword';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import useLogin from './hooks/useLogin';
import { normalizeUserData, buildUserInfo } from './utils/authHelpers';
import '@styles/pages/Auth/Login.scss';

const { Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [completeInviteForm] = Form.useForm();
  const [completingInvite, setCompletingInvite] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Use login hook
  const {
    loading,
    showCompleteInviteModal,
    inviteSession,
    inviteEmail,
    setShowCompleteInviteModal,
    setInviteSession,
    setInviteEmail,
    handleLogin,
  } = useLogin();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to dashboard when authenticated (handles page refresh scenarios)
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Debug: Log when modal state changes
  useEffect(() => {
    logger.debug('🔍 Modal state changed - showCompleteInviteModal:', showCompleteInviteModal);
    logger.debug('🔍 inviteSession:', inviteSession ? 'Set' : 'Not set');
    logger.debug('🔍 inviteEmail:', inviteEmail);
  }, [showCompleteInviteModal, inviteSession, inviteEmail]);

  // Use handleLogin from hook
  const onFinish = handleLogin;

  // Handle complete invite (set new password)
  const handleCompleteInvite = async (values) => {
    if (!inviteSession || !inviteEmail) {
      showErrorToast('Missing session information. Please try logging in again.');
      return;
    }

    setCompletingInvite(true);
    try {
      const response = await authService.completeInvite(
        inviteEmail,
        values.newPassword,
        inviteSession
      );

      if (response && (response.success !== false || response.data)) {
        // Extract tokens from response
        let tokenData = null;
        if (response.data && typeof response.data === 'object' && response.data.accessToken) {
          tokenData = response.data;
        } else if (response.accessToken) {
          tokenData = response;
        }

        if (tokenData && tokenData.accessToken && tokenData.refreshToken && tokenData.idToken) {
          const { accessToken, refreshToken, idToken } = tokenData;
          const fallbackUserInfo = getUserFromToken(idToken) || {
            email: inviteEmail,
          };

          // Store tokens
          storeAuth({
            accessToken,
            refreshToken,
            idToken,
            user: fallbackUserInfo,
            role: fallbackUserInfo.role || 'USER',
          });

          dispatch(setCredentials({
            accessToken,
            refreshToken,
            idToken,
            user: fallbackUserInfo,
            role: fallbackUserInfo.role || 'USER',
          }));

          // Fetch current user info from /api/v1/auth/me
          try {
            const meResponse = await authService.getMe();
            const userData = normalizeUserData(meResponse);

            if (userData) {
              const updatedUserInfo = buildUserInfo(userData, fallbackUserInfo, inviteEmail);

              dispatch(setCredentials({
                accessToken,
                refreshToken,
                idToken,
                user: updatedUserInfo,
                role: updatedUserInfo.role,
              }));

              storeAuth({
                accessToken,
                refreshToken,
                idToken,
                user: updatedUserInfo,
                role: updatedUserInfo.role,
              });
            }
          } catch (meError) {
            logger.warn('Failed to fetch user info from /auth/me:', meError);
          }

          showSuccessToast('Password set successfully! You are now logged in.');
          setShowCompleteInviteModal(false);
          completeInviteForm.resetFields();
          setInviteSession(null);
          setInviteEmail('');
          navigate('/dashboard', { replace: true });
        } else {
          showErrorToast('Invalid response format. Please try again.');
        }
      } else {
        showErrorToast(response?.message || 'Failed to complete invitation. Please try again.');
      }
    } catch (error) {
      logger.error('Failed to complete invite:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to set password. Please try again.');
    } finally {
      setCompletingInvite(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <LoginHeader />
        <LoginForm
          onFinish={onFinish}
          loading={loading}
          onForgotPassword={() => setShowForgotPasswordModal(true)}
        />
      </Card>

      {/* Forgot Password Modal */}
      <ForgotPassword
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={(email) => {
          // Optionally handle success (e.g., show additional message)
          logger.debug('Password reset email sent to:', email);
        }}
      />

      {/* Complete Invite Modal - Set New Password */}
      <Modal
        title="Set Your Password"
        open={showCompleteInviteModal}
        onCancel={() => {
          setShowCompleteInviteModal(false);
          completeInviteForm.resetFields();
          setInviteSession(null);
          setInviteEmail('');
        }}
        footer={null}
        closable={!completingInvite}
        maskClosable={!completingInvite}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            You've been invited to join the system. Please set a new password to complete your registration.
          </Text>
        </div>
        <Form
          form={completeInviteForm}
          layout="vertical"
          onFinish={handleCompleteInvite}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
          >
            <Input value={inviteEmail} disabled />
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
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={completingInvite}
            >
              Set Password & Continue
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
