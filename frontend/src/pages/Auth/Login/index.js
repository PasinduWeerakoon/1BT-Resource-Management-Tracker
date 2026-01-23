import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { setCredentials, initializeAuth } from '@redux/slices/authSlice';
import { authService } from '@api';
import { storeAuth } from '@utils/auth.utils';
import { getUserFromToken } from '@utils/jwt.utils';
import '@styles/pages/Auth/Login.scss';

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
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
          // Decode user info from ID token
          const userInfo = getUserFromToken(idToken) || {
            email: values.email,
          };

          // Store tokens (without expiresIn)
          storeAuth({
            accessToken,
            refreshToken,
            idToken,
            user: userInfo,
            role: userInfo.role || 'USER',
          });

          // Dispatch to Redux - this will update isAuthenticated to true
          dispatch(setCredentials({
            accessToken,
            refreshToken,
            idToken,
            user: userInfo,
            role: userInfo.role || 'USER',
          }));

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
      
      // Check if error response contains tokens (unexpected success in catch)
      if (error && error.accessToken && error.refreshToken && error.idToken) {
        // This shouldn't happen, but handle it just in case
        const { accessToken, refreshToken, idToken } = error;
        const userInfo = getUserFromToken(idToken) || {
          email: values.email,
        };

        storeAuth({
          accessToken,
          refreshToken,
          idToken,
          user: userInfo,
          role: userInfo.role || 'USER',
        });

        dispatch(setCredentials({
          accessToken,
          refreshToken,
          idToken,
          user: userInfo,
          role: userInfo.role || 'USER',
        }));

        message.success('Login successful!');
        navigate('/dashboard', { replace: true });
      } else {
        message.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default Login;
