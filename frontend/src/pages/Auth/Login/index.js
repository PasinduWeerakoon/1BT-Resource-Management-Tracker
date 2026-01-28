import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App, Modal } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { setCredentials, initializeAuth } from '@redux/slices/authSlice';
import { authService } from '@api';
import { storeAuth } from '@utils/auth.utils';
import { getUserFromToken } from '@utils/jwt.utils';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import '@styles/pages/Auth/Login.scss';

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showCompleteInviteModal, setShowCompleteInviteModal] = useState(false);
  const [inviteSession, setInviteSession] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [completeInviteForm] = Form.useForm();
  const [completingInvite, setCompletingInvite] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to dashboard when authenticated (handles page refresh scenarios)
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Call login API
      const response = await authService.login(values.email, values.password);

      // Handle different response structures:
      // 1. { success: true, data: { accessToken, refreshToken, idToken, expiresIn } }
      // 2. { accessToken, refreshToken, idToken, expiresIn } (direct token data)

      console.log('Login response:', response);

      let tokenData = null;

      // Check if response is directly the token data object (most common case)
      if (response && typeof response === 'object' && response.accessToken && response.refreshToken && response.idToken) {
        tokenData = response;
      }
      // Check if response has success flag and data field
      else if (response && response.success === true && response.data) {
        tokenData = response.data;
      }
      // Check if response.data contains tokens directly
      else if (response && response.data && typeof response.data === 'object' && response.data.accessToken) {
        tokenData = response.data;
      }

      // Extract tokens
      if (tokenData) {
        const { accessToken, refreshToken, idToken } = tokenData;

        // Validate that we have the required tokens
        if (accessToken && refreshToken && idToken) {
          // Decode user info from ID token as fallback
          const fallbackUserInfo = getUserFromToken(idToken) || {
            email: values.email,
          };

          // Store tokens (without expiresIn) with fallback user info
          storeAuth({
            accessToken,
            refreshToken,
            idToken,
            user: fallbackUserInfo,
            role: fallbackUserInfo.role || 'USER',
          });

          // Dispatch to Redux with fallback user info first
          dispatch(setCredentials({
            accessToken,
            refreshToken,
            idToken,
            user: fallbackUserInfo,
            role: fallbackUserInfo.role || 'USER',
          }));

          // Fetch current user info from /api/v1/auth/me
          try {
            const { authService } = await import('@api/services/auth.service');
            const meResponse = await authService.getMe();

            // Handle response structure - API returns { success: true, data: {...} }
            let userData = null;
            if (meResponse) {
              if (meResponse.data && typeof meResponse.data === 'object') {
                userData = meResponse.data;
              } else if (meResponse.success && meResponse.data) {
                userData = meResponse.data;
              } else if (typeof meResponse === 'object' && meResponse.id) {
                userData = meResponse;
              }
            }

            // Update user info in Redux if we got valid data
            if (userData) {
              // Parse groups if it's a string (e.g., "[SuperAdmin]")
              let groupsArray = [];
              if (userData.groups) {
                if (Array.isArray(userData.groups)) {
                  groupsArray = userData.groups;
                } else if (typeof userData.groups === 'string') {
                  try {
                    // Try to parse as JSON array string
                    groupsArray = JSON.parse(userData.groups);
                  } catch {
                    // If not JSON, try to extract from string like "[SuperAdmin]"
                    const match = userData.groups.match(/\[(.*?)\]/);
                    if (match && match[1]) {
                      groupsArray = match[1].split(',').map(g => g.trim().replace(/['"]/g, ''));
                    } else {
                      // Fallback: treat as single group
                      groupsArray = [userData.groups.trim()];
                    }
                  }
                }
              }

              // Extract role from groups (first group) or use default
              const role = groupsArray.length > 0 ? groupsArray[0] : (userData.role || fallbackUserInfo.role || 'USER');

              // Use email as name if name is empty
              const displayName = userData.name && userData.name.trim()
                ? userData.name
                : (userData.email || fallbackUserInfo.email || values.email);

              const updatedUserInfo = {
                id: userData.id,
                email: userData.email || fallbackUserInfo.email || values.email,
                name: displayName,
                groups: groupsArray,
                status: userData.status,
                enabled: userData.enabled !== undefined ? userData.enabled : true,
                emailVerified: userData.emailVerified,
                createdAt: userData.createdAt,
                lastModified: userData.lastModified,
                role: role,
              };

              // Update Redux state with complete user info
              dispatch(setCredentials({
                accessToken,
                refreshToken,
                idToken,
                user: updatedUserInfo,
                role: role,
              }));

              // Update stored auth with complete user info
              storeAuth({
                accessToken,
                refreshToken,
                idToken,
                user: updatedUserInfo,
                role: role,
              });
            }
          } catch (meError) {
            // If /auth/me fails, continue with fallback user info from token
            console.warn('Failed to fetch user info from /auth/me:', meError);
            // User info from token is already set, so we can continue
          }

          message.success('Login successful!');

          // Navigate to dashboard - use replace to prevent going back to login
          navigate('/dashboard', { replace: true });
        } else {
          console.error('Missing tokens in response:', tokenData);
          message.error('Invalid response format from server');
        }
      } else {
        // Response indicates failure or unexpected structure
        console.error('Login failed - unexpected response structure:', response);
        message.error(response?.message || 'Invalid credentials');
      }
    } catch (error) {
      // Error is already handled by the API interceptor
      console.error('Login error:', error);

      // Check if this is a NEW_PASSWORD_REQUIRED challenge (invite completion)
      if (error?.response?.data?.challenge === 'NEW_PASSWORD_REQUIRED' ||
        error?.challenge === 'NEW_PASSWORD_REQUIRED' ||
        error?.response?.data?.code === 'NEW_PASSWORD_REQUIRED') {
        // Extract session token from error response
        const session = error?.response?.data?.session || error?.session || error?.response?.data?.Session;

        if (session) {
          setInviteSession(session);
          setInviteEmail(values.email);
          setShowCompleteInviteModal(true);
          setLoading(false);
          return;
        }
      }

      // Check if error response contains tokens (unexpected success in catch)
      if (error && error.accessToken && error.refreshToken && error.idToken) {
        // This shouldn't happen, but handle it just in case
        const { accessToken, refreshToken, idToken } = error;
        const fallbackUserInfo = getUserFromToken(idToken) || {
          email: values.email,
        };

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
          const { authService } = await import('@api/services/auth.service');
          const meResponse = await authService.getMe();

          // Handle response structure - API returns { success: true, data: {...} }
          let userData = null;
          if (meResponse) {
            if (meResponse.data && typeof meResponse.data === 'object') {
              userData = meResponse.data;
            } else if (meResponse.success && meResponse.data) {
              userData = meResponse.data;
            } else if (typeof meResponse === 'object' && meResponse.id) {
              userData = meResponse;
            }
          }

          if (userData) {
            // Parse groups if it's a string (e.g., "[SuperAdmin]")
            let groupsArray = [];
            if (userData.groups) {
              if (Array.isArray(userData.groups)) {
                groupsArray = userData.groups;
              } else if (typeof userData.groups === 'string') {
                try {
                  // Try to parse as JSON array string
                  groupsArray = JSON.parse(userData.groups);
                } catch {
                  // If not JSON, try to extract from string like "[SuperAdmin]"
                  const match = userData.groups.match(/\[(.*?)\]/);
                  if (match && match[1]) {
                    groupsArray = match[1].split(',').map(g => g.trim().replace(/['"]/g, ''));
                  } else {
                    // Fallback: treat as single group
                    groupsArray = [userData.groups.trim()];
                  }
                }
              }
            }

            // Extract role from groups (first group) or use default
            const role = groupsArray.length > 0 ? groupsArray[0] : (userData.role || fallbackUserInfo.role || 'USER');

            // Use email as name if name is empty
            const displayName = userData.name && userData.name.trim()
              ? userData.name
              : (userData.email || fallbackUserInfo.email || values.email);

            const updatedUserInfo = {
              id: userData.id,
              email: userData.email || fallbackUserInfo.email || values.email,
              name: displayName,
              groups: groupsArray,
              status: userData.status,
              enabled: userData.enabled !== undefined ? userData.enabled : true,
              emailVerified: userData.emailVerified,
              createdAt: userData.createdAt,
              lastModified: userData.lastModified,
              role: role,
            };

            dispatch(setCredentials({
              accessToken,
              refreshToken,
              idToken,
              user: updatedUserInfo,
              role: role,
            }));

            storeAuth({
              accessToken,
              refreshToken,
              idToken,
              user: updatedUserInfo,
              role: role,
            });
          }
        } catch (meError) {
          console.warn('Failed to fetch user info from /auth/me:', meError);
        }

        message.success('Login successful!');
        navigate('/dashboard', { replace: true });
      } else {
        message.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
            let userData = null;
            if (meResponse) {
              if (meResponse.data && typeof meResponse.data === 'object') {
                userData = meResponse.data;
              } else if (meResponse.success && meResponse.data) {
                userData = meResponse.data;
              } else if (typeof meResponse === 'object' && meResponse.id) {
                userData = meResponse;
              }
            }

            if (userData) {
              // Parse groups
              let groupsArray = [];
              if (userData.groups) {
                if (Array.isArray(userData.groups)) {
                  groupsArray = userData.groups;
                } else if (typeof userData.groups === 'string') {
                  try {
                    groupsArray = JSON.parse(userData.groups);
                  } catch {
                    const match = userData.groups.match(/\[(.*?)\]/);
                    if (match && match[1]) {
                      groupsArray = match[1].split(',').map(g => g.trim().replace(/['"]/g, ''));
                    } else {
                      groupsArray = [userData.groups.trim()];
                    }
                  }
                }
              }

              const role = groupsArray.length > 0 ? groupsArray[0] : (userData.role || fallbackUserInfo.role || 'USER');
              const displayName = userData.name && userData.name.trim()
                ? userData.name
                : (userData.email || fallbackUserInfo.email || inviteEmail);

              const updatedUserInfo = {
                id: userData.id,
                email: userData.email || fallbackUserInfo.email || inviteEmail,
                name: displayName,
                groups: groupsArray,
                status: userData.status,
                enabled: userData.enabled !== undefined ? userData.enabled : true,
                emailVerified: userData.emailVerified,
                createdAt: userData.createdAt,
                lastModified: userData.lastModified,
                role: role,
              };

              dispatch(setCredentials({
                accessToken,
                refreshToken,
                idToken,
                user: updatedUserInfo,
                role: role,
              }));

              storeAuth({
                accessToken,
                refreshToken,
                idToken,
                user: updatedUserInfo,
                role: role,
              });
            }
          } catch (meError) {
            console.warn('Failed to fetch user info from /auth/me:', meError);
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
      console.error('Failed to complete invite:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to set password. Please try again.');
    } finally {
      setCompletingInvite(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>1billiontech</Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>
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
        <div className="login-info">
          <Text type="secondary" className="info-title">Enter your email and password to sign in</Text>
        </div>
      </Card>

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
