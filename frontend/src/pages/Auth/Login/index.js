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
import ForgotPassword from '@pages/Auth/ForgotPassword';
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
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
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

  // Debug: Log when modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed - showCompleteInviteModal:', showCompleteInviteModal);
    console.log('🔍 inviteSession:', inviteSession ? 'Set' : 'Not set');
    console.log('🔍 inviteEmail:', inviteEmail);
  }, [showCompleteInviteModal, inviteSession, inviteEmail]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Call login API
      const response = await authService.login(values.email, values.password);

      // IMMEDIATE CHECK: Handle NEW_PASSWORD_REQUIRED challenge BEFORE anything else
      // The interceptor transforms: { success: true, data: { challenge, session } } 
      // to: { success: true, data: { challenge, session }, message: "..." }

      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Full response:', response);
      console.log('response.success:', response?.success);
      console.log('response.message:', response?.message);
      console.log('response.data:', response?.data);
      console.log('response.data?.challenge:', response?.data?.challenge);
      console.log('response.data?.session:', response?.data?.session);
      console.log('===========================');

      // Check for challenge in ALL possible locations IMMEDIATELY
      // Check message first (most reliable since error toast shows it)
      const messageHasPasswordRequired = response?.message &&
        response.message.toLowerCase().includes('new password required');

      const hasChallengeInData = response?.data?.challenge === 'NEW_PASSWORD_REQUIRED' ||
        response?.data?.code === 'NEW_PASSWORD_REQUIRED';

      const hasChallenge = hasChallengeInData ||
        response?.challenge === 'NEW_PASSWORD_REQUIRED' ||
        messageHasPasswordRequired;

      console.log('Challenge detection:');
      console.log('  messageHasPasswordRequired:', messageHasPasswordRequired);
      console.log('  hasChallengeInData:', hasChallengeInData);
      console.log('  hasChallenge:', hasChallenge);

      if (hasChallenge || messageHasPasswordRequired) {
        console.log('🚨 NEW_PASSWORD_REQUIRED DETECTED - Opening modal immediately');
        const session = response?.data?.session ||
          response?.data?.Session ||
          response?.session ||
          response?.data?.data?.session;

        console.log('Session found:', !!session);
        console.log('Session preview:', session ? session.substring(0, 50) + '...' : 'NONE');

        if (session) {
          console.log('✅ Setting modal state synchronously...');
          // Set all state at once
          setInviteSession(session);
          setInviteEmail(values.email);
          setShowCompleteInviteModal(true);
          setLoading(false);

          // Force a check after state update
          setTimeout(() => {
            console.log('✅ After setTimeout - Modal state should be set');
            console.log('   If modal still not showing, check React DevTools');
          }, 100);

          console.log('✅ Returning early - modal should open');
          return;
        } else {
          console.error('❌ Session missing! Full response structure:', JSON.stringify(response, null, 2));
          showErrorToast('Session token missing. Please contact support.');
          setLoading(false);
          return;
        }
      }

      // Check for NEW_PASSWORD_REQUIRED challenge in success response FIRST
      // After interceptor transformation, the response structure is:
      // { success: true, data: { challenge: "NEW_PASSWORD_REQUIRED", session: "..." }, message: "..." }
      // OR the interceptor might have transformed it differently

      // Check multiple possible locations for the challenge
      const challenge = response?.data?.challenge ||
        response?.data?.code ||
        response?.challenge ||
        (response?.message?.toLowerCase().includes('new password required') ? 'NEW_PASSWORD_REQUIRED' : null);

      console.log('Detected challenge:', challenge);

      if (challenge === 'NEW_PASSWORD_REQUIRED') {
        console.log('NEW_PASSWORD_REQUIRED challenge detected!');
        // Extract session token from response (check multiple locations)
        const session = response?.data?.session ||
          response?.data?.Session ||
          response?.session ||
          response?.data?.data?.session;
        console.log('Session token:', session ? 'Found' : 'Missing');
        console.log('Full response for debugging:', JSON.stringify(response, null, 2));

        if (session) {
          console.log('Opening complete invite modal');
          setInviteSession(session);
          setInviteEmail(values.email);
          setShowCompleteInviteModal(true);
          setLoading(false);
          return;
        } else {
          console.error('Session token missing from NEW_PASSWORD_REQUIRED response:', response);
          showErrorToast('Session token missing from response. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Also check if message indicates new password required (fallback check)
      if (response?.message && response.message.toLowerCase().includes('new password required')) {
        console.log('New password required detected from message (fallback)');
        const session = response?.data?.session ||
          response?.data?.Session ||
          response?.session ||
          response?.data?.data?.session;
        console.log('Session from message check:', session ? 'Found' : 'Missing');
        if (session) {
          console.log('Opening modal from message check');
          setInviteSession(session);
          setInviteEmail(values.email);
          setShowCompleteInviteModal(true);
          setLoading(false);
          return;
        } else {
          console.error('Session missing even though message indicates new password required');
        }
      }

      // Final check: if response has success=true but no tokens and has a message about password
      if (response?.success === true &&
        !response?.data?.accessToken &&
        !response?.accessToken &&
        (response?.message?.toLowerCase().includes('password') ||
          response?.data?.challenge === 'NEW_PASSWORD_REQUIRED')) {
        console.log('Final fallback: Detecting challenge from success response without tokens');
        const session = response?.data?.session || response?.session;
        if (session) {
          console.log('Opening modal from final fallback check');
          setInviteSession(session);
          setInviteEmail(values.email);
          setShowCompleteInviteModal(true);
          setLoading(false);
          return;
        }
      }

      let tokenData = null;

      // Check if response is directly the token data object (most common case)
      if (response && typeof response === 'object' && response.accessToken && response.refreshToken && response.idToken) {
        tokenData = response;
      }
      // Check if response has success flag and data field (and no challenge)
      else if (response && response.success === true && response.data) {
        // Only treat as token data if it doesn't have a challenge
        if (!response.data.challenge && !response.data.code && response.data.accessToken) {
          tokenData = response.data;
        }
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
        // BUT check one more time for NEW_PASSWORD_REQUIRED challenge
        // (in case it wasn't caught earlier)
        const challenge = response?.data?.challenge ||
          response?.data?.code ||
          response?.challenge;

        if (challenge === 'NEW_PASSWORD_REQUIRED' ||
          response?.message?.toLowerCase().includes('new password required')) {
          console.log('NEW_PASSWORD_REQUIRED detected in else block!');
          const session = response?.data?.session ||
            response?.data?.Session ||
            response?.session;

          if (session) {
            console.log('Opening complete invite modal from else block');
            setInviteSession(session);
            setInviteEmail(values.email);
            setShowCompleteInviteModal(true);
            setLoading(false);
            return;
          }
        }

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
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Button
              type="link"
              onClick={() => setShowForgotPasswordModal(true)}
              style={{ fontSize: 14, padding: 0 }}
            >
              Forgot Password?
            </Button>
          </div>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      <ForgotPassword
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={(email) => {
          // Optionally handle success (e.g., show additional message)
          console.log('Password reset email sent to:', email);
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
