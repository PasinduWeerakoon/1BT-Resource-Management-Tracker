/**
 * useLogin Hook
 * Handles login logic and authentication flow
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { authService } from '@api';
import { setCredentials } from '@redux/slices/authSlice';
import { fetchAllConfigData } from '@redux/slices/configSlice';
import { storeAuth } from '@utils/auth.utils';
import { getUserFromToken } from '@utils/jwt.utils';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import {
  hasPasswordRequiredChallenge,
  extractSessionToken,
  extractTokenData,
  normalizeUserData,
  buildUserInfo,
} from '../utils/authHelpers';

/**
 * useLogin Hook
 * @returns {Object} Login state and handlers
 */
export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showCompleteInviteModal, setShowCompleteInviteModal] = useState(false);
  const [inviteSession, setInviteSession] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  /**
   * Handle successful login with tokens
   * @param {Object} tokenData - Token data
   * @param {string} email - User email
   */
  const handleSuccessfulLogin = async (tokenData, email) => {
    const { accessToken, refreshToken, idToken } = tokenData;

    if (!accessToken || !refreshToken || !idToken) {
      logger.error('Missing tokens in response:', tokenData);
      message.error('Invalid response format from server');
      return false;
    }

    // Decode user info from ID token as fallback
    const fallbackUserInfo = getUserFromToken(idToken) || {
      email: email,
    };

    // Store tokens with fallback user info
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
      const { authService: authServiceImport } = await import('@api/services/auth.service');
      const meResponse = await authServiceImport.getMe();
      const userData = normalizeUserData(meResponse);

      if (userData) {
        const updatedUserInfo = buildUserInfo(userData, fallbackUserInfo, email);

        // Update Redux state with complete user info
        dispatch(setCredentials({
          accessToken,
          refreshToken,
          idToken,
          user: updatedUserInfo,
          role: updatedUserInfo.role,
        }));

        // Update stored auth with complete user info
        storeAuth({
          accessToken,
          refreshToken,
          idToken,
          user: updatedUserInfo,
          role: updatedUserInfo.role,
        });
      }
    } catch (meError) {
      // If /auth/me fails, continue with fallback user info from token
      logger.warn('Failed to fetch user info from /auth/me:', meError);
    }

    // Fetch configuration data after successful login
    try {
      await dispatch(fetchAllConfigData()).unwrap();
      logger.debug('Configuration data fetched successfully');
    } catch (configError) {
      // Don't block login if config fetch fails, just log it
      logger.warn('Failed to fetch configuration data on login:', configError);
    }

    message.success('Login successful!');
    navigate('/dashboard', { replace: true });
    return true;
  };

  /**
   * Handle password required challenge
   * @param {Object} response - API response
   * @param {string} email - User email
   * @returns {boolean} True if challenge was handled
   */
  const handlePasswordRequiredChallenge = (response, email) => {
    if (!hasPasswordRequiredChallenge(response)) {
      return false;
    }

    const session = extractSessionToken(response);

    if (session) {
      logger.debug('NEW_PASSWORD_REQUIRED detected - Opening modal');
      setInviteSession(session);
      setInviteEmail(email);
      setShowCompleteInviteModal(true);
      setLoading(false);
      return true;
    } else {
      logger.error('Session token missing from NEW_PASSWORD_REQUIRED response');
      showErrorToast('Session token missing. Please contact support.');
      setLoading(false);
      return false;
    }
  };

  /**
   * Handle login form submission
   * @param {Object} values - Form values
   */
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await authService.login(values.email, values.password);

      logger.debug('Login response:', response);

      // Check for NEW_PASSWORD_REQUIRED challenge FIRST
      if (handlePasswordRequiredChallenge(response, values.email)) {
        return;
      }

      // Extract token data
      const tokenData = extractTokenData(response);

      if (tokenData) {
        await handleSuccessfulLogin(tokenData, values.email);
      } else {
        // Check one more time for challenge (fallback)
        if (handlePasswordRequiredChallenge(response, values.email)) {
          return;
        }

        logger.error('Login failed - unexpected response structure:', response);
        message.error(response?.message || 'Invalid credentials');
      }
    } catch (error) {
      logger.error('Login error:', error);

      // Check if this is a NEW_PASSWORD_REQUIRED challenge
      if (error?.response?.data?.challenge === 'NEW_PASSWORD_REQUIRED' ||
        error?.challenge === 'NEW_PASSWORD_REQUIRED' ||
        error?.response?.data?.code === 'NEW_PASSWORD_REQUIRED') {
        const session = extractSessionToken(error?.response?.data || error);

        if (session) {
          setInviteSession(session);
          setInviteEmail(values.email);
          setShowCompleteInviteModal(true);
          setLoading(false);
          return;
        }
      }

      // Check if error response contains tokens (unexpected success in catch)
      const tokenData = extractTokenData(error);
      if (tokenData) {
        await handleSuccessfulLogin(tokenData, values.email);
      } else {
        message.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    showCompleteInviteModal,
    inviteSession,
    inviteEmail,
    setShowCompleteInviteModal,
    setInviteSession,
    setInviteEmail,
    handleLogin,
  };
};

export default useLogin;
