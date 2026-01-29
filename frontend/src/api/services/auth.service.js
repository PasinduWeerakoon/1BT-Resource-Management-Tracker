/**
 * Authentication Service
 * API calls for authentication
 */

import apiClient from '../client';
import { ENDPOINTS } from '../endpoints';

export const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, data: {accessToken: string, refreshToken: string, idToken: string, expiresIn: number}}>}
   */
  login: async (email, password) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    // The interceptor transforms the response to: { success: true, data: {...}, message: ... }
    // response.data is the transformed object from the interceptor
    return response.data || response;
  },

  /**
   * Logout user globally
   * @param {string} accessToken - Access token to invalidate
   * @returns {Promise<{success: boolean, message: string}>}
   */
  logout: async (accessToken) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {
      accessToken,
    });
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{success: boolean, data: {accessToken: string, idToken: string}}>}
   */
  refresh: async (refreshToken) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });
    // The interceptor transforms the response to: { success: true, data: {...}, message: ... }
    // response.data is the transformed object from the interceptor
    return response.data || response;
  },

  /**
   * Get current authenticated user info
   * @returns {Promise<{success: boolean, data: {id: string, email: string, name: string, groups: Array, status: string, enabled: boolean}}>}
   */
  getMe: async () => {
    const response = await apiClient.get(ENDPOINTS.AUTH.ME);
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<{success: boolean, message: string}>}
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
    });
    return response.data;
  },

  /**
   * Complete password reset
   * @param {string} email - User email
   * @param {string} code - Reset code
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  resetPassword: async (email, code, newPassword) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      code,
      newPassword,
    });
    return response.data;
  },

  /**
   * Invite a new user (Admin only)
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} role - User role (Admin|User)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  invite: async (email, name, role) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.INVITE, {
      email,
      name,
      role,
    });
    // The interceptor transforms the response
    return response.data || response;
  },

  /**
   * Complete invite registration
   * Handles NEW_PASSWORD_REQUIRED challenge from Cognito
   * @param {string} email - User email
   * @param {string} newPassword - New password
   * @param {string} session - Session token from initial login attempt
   * @returns {Promise<{success: boolean, data: {accessToken: string, idToken: string, refreshToken: string}}>}
   */
  completeInvite: async (email, newPassword, session) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.COMPLETE_INVITE, {
      email,
      newPassword,
      session,
    });
    // The interceptor transforms the response
    return response.data || response;
  },
};

export default authService;
