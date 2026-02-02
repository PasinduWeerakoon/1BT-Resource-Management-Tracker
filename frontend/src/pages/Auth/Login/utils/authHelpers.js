/**
 * Auth Helpers
 * Utility functions for authentication
 */

/**
 * Parse groups from various formats
 * @param {string|Array} groups - Groups data
 * @returns {Array} Parsed groups array
 */
export const parseGroups = (groups) => {
  if (!groups) return [];

  if (Array.isArray(groups)) {
    return groups;
  }

  if (typeof groups === 'string') {
    try {
      // Try to parse as JSON array string
      return JSON.parse(groups);
    } catch {
      // If not JSON, try to extract from string like "[SuperAdmin]"
      const match = groups.match(/\[(.*?)\]/);
      if (match && match[1]) {
        return match[1].split(',').map(g => g.trim().replace(/['"]/g, ''));
      } else {
        // Fallback: treat as single group
        return [groups.trim()];
      }
    }
  }

  return [];
};

/**
 * Extract role from groups
 * @param {Array} groupsArray - Groups array
 * @param {string} fallbackRole - Fallback role
 * @returns {string} Role
 */
export const extractRole = (groupsArray, fallbackRole = 'USER') => {
  return groupsArray.length > 0 ? groupsArray[0] : fallbackRole;
};

/**
 * Get display name from user data
 * @param {Object} userData - User data
 * @param {string} fallbackEmail - Fallback email
 * @returns {string} Display name
 */
export const getDisplayName = (userData, fallbackEmail) => {
  if (userData.name && userData.name.trim()) {
    return userData.name;
  }
  return userData.email || fallbackEmail || '';
};

/**
 * Normalize user data from API response
 * @param {Object} meResponse - API response from /auth/me
 * @returns {Object|null} Normalized user data
 */
export const normalizeUserData = (meResponse) => {
  if (!meResponse) return null;

  if (meResponse.data && typeof meResponse.data === 'object') {
    return meResponse.data;
  } else if (meResponse.success && meResponse.data) {
    return meResponse.data;
  } else if (typeof meResponse === 'object' && meResponse.id) {
    return meResponse;
  }

  return null;
};

/**
 * Build user info object
 * @param {Object} userData - User data from API
 * @param {Object} fallbackUserInfo - Fallback user info
 * @param {string} email - Email
 * @returns {Object} Complete user info
 */
export const buildUserInfo = (userData, fallbackUserInfo, email) => {
  const groupsArray = parseGroups(userData.groups);
  const role = extractRole(groupsArray, fallbackUserInfo?.role || 'USER');
  const displayName = getDisplayName(userData, email);

  return {
    id: userData.id,
    email: userData.email || fallbackUserInfo?.email || email,
    name: displayName,
    groups: groupsArray,
    status: userData.status,
    enabled: userData.enabled !== undefined ? userData.enabled : true,
    emailVerified: userData.emailVerified,
    createdAt: userData.createdAt,
    lastModified: userData.lastModified,
    role: role,
  };
};

/**
 * Extract token data from response
 * @param {Object} response - API response
 * @returns {Object|null} Token data
 */
export const extractTokenData = (response) => {
  if (!response) return null;

  // Check if response is directly the token data object
  if (response && typeof response === 'object' && response.accessToken && response.refreshToken && response.idToken) {
    return response;
  }

  // Check if response has success flag and data field (and no challenge)
  if (response && response.success === true && response.data) {
    if (!response.data.challenge && !response.data.code && response.data.accessToken) {
      return response.data;
    }
  }

  // Check if response.data contains tokens directly
  if (response && response.data && typeof response.data === 'object' && response.data.accessToken) {
    return response.data;
  }

  return null;
};

/**
 * Check if response indicates NEW_PASSWORD_REQUIRED challenge
 * @param {Object} response - API response
 * @returns {boolean} True if challenge detected
 */
export const hasPasswordRequiredChallenge = (response) => {
  if (!response) return false;

  const messageHasPasswordRequired = response?.message &&
    response.message.toLowerCase().includes('new password required');

  const hasChallengeInData = response?.data?.challenge === 'NEW_PASSWORD_REQUIRED' ||
    response?.data?.code === 'NEW_PASSWORD_REQUIRED';

  return hasChallengeInData ||
    response?.challenge === 'NEW_PASSWORD_REQUIRED' ||
    messageHasPasswordRequired;
};

/**
 * Extract session token from response
 * @param {Object} response - API response
 * @returns {string|null} Session token
 */
export const extractSessionToken = (response) => {
  if (!response) return null;

  return response?.data?.session ||
    response?.data?.Session ||
    response?.session ||
    response?.data?.data?.session;
};
