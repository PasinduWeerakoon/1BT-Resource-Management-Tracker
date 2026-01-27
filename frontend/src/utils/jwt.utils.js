/**
 * JWT Utility Functions
 * Helper functions for JWT token operations
 */

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null
 */
export const decodeJWT = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get user info from ID token
 * @param {string} idToken - ID token
 * @returns {Object|null} User information or null
 */
export const getUserFromToken = (idToken) => {
  const decoded = decodeJWT(idToken);
  if (!decoded) return null;

  return {
    id: decoded.sub || decoded.user_id || decoded.id,
    email: decoded.email,
    name: decoded.name || decoded.given_name || decoded.preferred_username,
    role: decoded.role || decoded['cognito:groups']?.[0] || 'USER',
    ...decoded,
  };
};

/**
 * Get expiration time from token
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;

  return new Date(decoded.exp * 1000);
};

export default {
  decodeJWT,
  isTokenExpired,
  getUserFromToken,
  getTokenExpiration,
};
