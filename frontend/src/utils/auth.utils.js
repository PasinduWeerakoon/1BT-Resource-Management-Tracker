import { SAMPLE_USERS } from '@configs/auth.config';

/**
 * Authenticate user (mock function - for development only)
 * In production, use authService.login() instead
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @returns {Object} Authentication result
 */
export const authenticateUser = (username, password) => {
  // Check against sample users
  const user = Object.values(SAMPLE_USERS).find(
    (u) => (u.username === username || u.email === username) && u.password === password
  );

  if (user) {
    return {
      success: true,
      user: {
        id: user.username,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      token: `token_${user.username}_${Date.now()}`,
      accessToken: `token_${user.username}_${Date.now()}`,
      refreshToken: `refresh_${user.username}_${Date.now()}`,
      idToken: `id_${user.username}_${Date.now()}`,
      role: user.role,
    };
  }

  return {
    success: false,
    message: 'Invalid username or password',
  };
};

/**
 * Get stored authentication data
 * Supports both old format (token) and new format (accessToken, refreshToken, idToken)
 * @returns {Object|null} Stored auth data or null
 */
export const getStoredAuth = () => {
  // Try new format first (accessToken)
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const idToken = localStorage.getItem('idToken');
  
  // Fallback to old format (token)
  const token = localStorage.getItem('token');
  
  const user = localStorage.getItem('user');
  const role = localStorage.getItem('role');

  if (accessToken && user && role) {
    return {
      accessToken,
      refreshToken,
      idToken,
      token: accessToken, // For backward compatibility
      user: JSON.parse(user),
      role,
    };
  }

  if (token && user && role) {
    return {
      token,
      accessToken: token, // For backward compatibility
      user: JSON.parse(user),
      role,
    };
  }

  return null;
};

/**
 * Store authentication data
 * @param {Object} authData - Authentication data
 * @param {string} authData.accessToken - Access token
 * @param {string} authData.refreshToken - Refresh token
 * @param {string} authData.idToken - ID token
 * @param {Object} authData.user - User object
 * @param {string} authData.role - User role
 */
export const storeAuth = (authData) => {
  if (authData.accessToken) {
    localStorage.setItem('accessToken', authData.accessToken);
  }
  if (authData.refreshToken) {
    localStorage.setItem('refreshToken', authData.refreshToken);
  }
  if (authData.idToken) {
    localStorage.setItem('idToken', authData.idToken);
  }
  // For backward compatibility
  if (authData.token) {
    localStorage.setItem('token', authData.token);
  } else if (authData.accessToken) {
    localStorage.setItem('token', authData.accessToken);
  }
  if (authData.user) {
    localStorage.setItem('user', JSON.stringify(authData.user));
  }
  if (authData.role) {
    localStorage.setItem('role', authData.role);
  }
};

/**
 * Clear stored authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};
