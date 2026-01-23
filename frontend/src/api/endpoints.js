/**
 * API Endpoints
 * All API endpoint definitions based on actual backend API
 */

import { API_CONFIG } from './config';

const BASE_URL = API_CONFIG.BASE_URL;

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    REFRESH: `${BASE_URL}/auth/refresh`,
    FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
    INVITE: `${BASE_URL}/auth/invite`,
    COMPLETE_INVITE: `${BASE_URL}/auth/complete-invite`,
  },

  // Resources (Employees)
  RESOURCES: {
    BASE: `${BASE_URL}/resources`,
    LIST: `${BASE_URL}/resources`,
    CREATE: `${BASE_URL}/resources`,
    GET_BY_ID: (id) => `${BASE_URL}/resources/${id}`,
    UPDATE: (id) => `${BASE_URL}/resources/${id}`,
    DELETE: (id) => `${BASE_URL}/resources/${id}`,
    ALLOCATIONS: (id) => `${BASE_URL}/resources/${id}/allocations`,
    DESIGNATION_HISTORY: (id) => `${BASE_URL}/resources/${id}/designation-history`,
  },

  // Tracks
  TRACKS: {
    BASE: `${BASE_URL}/tracks`,
    LIST: `${BASE_URL}/tracks`,
    GET_BY_ID: (id) => `${BASE_URL}/tracks/${id}`,
    CREATE: `${BASE_URL}/tracks`,
    UPDATE: (id) => `${BASE_URL}/tracks/${id}`,
  },

  // Designations
  DESIGNATIONS: {
    BASE: `${BASE_URL}/designations`,
    LIST: `${BASE_URL}/designations`,
    GET_BY_ID: (id) => `${BASE_URL}/designations/${id}`,
    CREATE: `${BASE_URL}/designations`,
    UPDATE: (id) => `${BASE_URL}/designations/${id}`,
    HISTORY: (id) => `${BASE_URL}/designations/${id}/history`,
  },

  // Clients
  CLIENTS: {
    BASE: `${BASE_URL}/clients`,
    LIST: `${BASE_URL}/clients`,
    CREATE: `${BASE_URL}/clients`,
    GET_BY_ID: (id) => `${BASE_URL}/clients/${id}`,
    UPDATE: (id) => `${BASE_URL}/clients/${id}`,
    DELETE: (id) => `${BASE_URL}/clients/${id}`,
    PROJECTS: (id) => `${BASE_URL}/clients/${id}/projects`,
  },

  // Projects
  PROJECTS: {
    BASE: `${BASE_URL}/projects`,
    LIST: `${BASE_URL}/projects`,
    CREATE: `${BASE_URL}/projects`,
    GET_BY_ID: (id) => `${BASE_URL}/projects/${id}`,
    UPDATE: (id) => `${BASE_URL}/projects/${id}`,
    DELETE: (id) => `${BASE_URL}/projects/${id}`,
    ALLOCATIONS: (id) => `${BASE_URL}/projects/${id}/allocations`,
  },

  // Allocations
  ALLOCATIONS: {
    BASE: `${BASE_URL}/allocations`,
    LIST: `${BASE_URL}/allocations`,
    CREATE: `${BASE_URL}/allocations`,
    GET_BY_ID: (id) => `${BASE_URL}/allocations/${id}`,
    UPDATE: (id) => `${BASE_URL}/allocations/${id}`,
    DELETE: (id) => `${BASE_URL}/allocations/${id}`,
  },
};

export default ENDPOINTS;
