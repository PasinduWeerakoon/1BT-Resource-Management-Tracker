/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';
import { API_CONFIG } from './config';
import { getStoredAuth, clearAuth, storeAuth } from '@utils/auth.utils';
import { authService } from './services/auth.service';
import { store } from '@redux/store';
import { logoutUser } from '@redux/slices/authSlice';
import { showErrorToast, getErrorMessage } from '@utils/toast.utils';
import logger from '@utils/logger';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const auth = getStoredAuth();
    if (auth && auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle response format and errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from response format: {success: true, data: {...}}
    // Return the data directly for easier usage
    if (response.data && response.data.success !== undefined) {
      return {
        ...response,
        data: response.data.data || response.data, // Return data field if exists, otherwise full response
        success: response.data.success,
        message: response.data.message,
      };
    }
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      const originalRequest = error.config || {};

      switch (status) {
        case 400:
          // Bad Request - Don't show toast for 401 as it's handled separately
          if (!originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')) {
            showErrorToast(getErrorMessage({ response: { data } }));
          }
          logger.error('Bad request', new Error(data?.message || 'Invalid request parameters'));
          break;
        case 401:
          // Unauthorized - Try to refresh token if refreshToken exists
          // Don't retry if it's already a refresh request or login request
          if (originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/login') ||
            originalRequest._retry) {
            // Dispatch logout thunk to call API and clear state
            store.dispatch(logoutUser());
            // Don't use window.location.href - let React Router handle navigation
            return Promise.reject(error);
          }

          // If we're already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          // Try to refresh the token
          const auth = getStoredAuth();
          if (auth && auth.refreshToken) {
            originalRequest._retry = true;
            isRefreshing = true;

            return authService
              .refresh(auth.refreshToken)
              .then((response) => {
                // Handle different response structures (same as login)
                let tokenData = null;

                // Check if response has success flag and data field
                if (response && response.success === true && response.data) {
                  tokenData = response.data;
                }
                // Check if response is directly the token data object
                else if (response && typeof response === 'object' && response.accessToken && response.idToken) {
                  tokenData = response;
                }
                // Check if response.data contains tokens directly
                else if (response && response.data && typeof response.data === 'object' && response.data.accessToken) {
                  tokenData = response.data;
                }

                if (tokenData && tokenData.accessToken && tokenData.idToken) {
                  const { accessToken, idToken } = tokenData;

                  // Update stored auth
                  storeAuth({
                    ...auth,
                    accessToken,
                    idToken,
                  });

                  // Update the original request header
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                  // Process queued requests
                  processQueue(null, accessToken);
                  isRefreshing = false;

                  return apiClient(originalRequest);
                } else {
                  throw new Error('Token refresh failed - invalid response structure');
                }
              })
              .catch((refreshError) => {
                // Refresh failed - logout user
                processQueue(refreshError, null);
                isRefreshing = false;
                // Dispatch logout thunk to call API and clear state
                store.dispatch(logoutUser());
                // Don't use window.location.href - let React Router handle navigation
                return Promise.reject(refreshError);
              });
          } else {
            // No refresh token - logout user
            // Dispatch logout thunk to call API and clear state
            store.dispatch(logoutUser());
            // Don't use window.location.href - let React Router handle navigation
            return Promise.reject(error);
          }
        case 403:
          // Forbidden
          showErrorToast(getErrorMessage({ response: { data } }));
          logger.error('Access forbidden', new Error(data?.message || 'You do not have permission to access this resource'));
          break;
        case 404:
          // Not found
          showErrorToast(getErrorMessage({ response: { data } }));
          logger.error('Resource not found', new Error(data?.message || 'The requested resource was not found'));
          break;
        case 409:
          // Conflict
          showErrorToast(getErrorMessage({ response: { data } }));
          logger.error('Conflict', new Error(data?.message || 'Resource conflict occurred'));
          break;
        case 422:
          // Validation Error
          showErrorToast(getErrorMessage({ response: { data } }));
          logger.error('Validation error', new Error(data?.message || 'Validation failed'));
          break;
        case 500:
          // Server error
          showErrorToast(getErrorMessage({ response: { data } }));
          logger.error('Server error', new Error(data?.message || 'An internal server error occurred'));
          break;
        default:
          showErrorToast(getErrorMessage({ response: { data }, message: error.message }));
          logger.error('API error', new Error(data?.message || error.message));
      }

      // Return error with formatted response data
      return Promise.reject({
        ...error,
        message: data?.message || error.message,
        errors: data?.errors || [],
      });
    } else if (error.request) {
      // Request made but no response received
      const networkError = 'Network error: No response received from server';
      showErrorToast(networkError);
      logger.error('Network error', new Error(networkError));
      return Promise.reject({
        ...error,
        message: networkError,
      });
    } else {
      // Something else happened
      showErrorToast(error.message || 'An unexpected error occurred');
      logger.error('Error', error);
      return Promise.reject(error);
    }
  }
);

export default apiClient;
