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
    ME: `${BASE_URL}/auth/me`,
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
    ACCOUNT_MANAGER: (id) => `${BASE_URL}/resources/${id}/account-manager`,
    TIER: (id) => `${BASE_URL}/resources/${id}/tier`,
    TECH_STACK: (id) => `${BASE_URL}/resources/${id}/tech-stack`,
  },

  // Account Managers
  ACCOUNT_MANAGERS: {
    LIST: `${BASE_URL}/account-managers`,
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
    MONTHLY: `${BASE_URL}/allocations/monthly`,
    HISTORY: (resourceId) => `${BASE_URL}/allocations/history/${resourceId}`,
  },

  // Reports
  REPORTS: {
    BASE: `${BASE_URL}/reports`,
    BENCH: `${BASE_URL}/reports/bench`,
    ACCOUNT_MANAGER: `${BASE_URL}/reports/account-manager`,
    EMPLOYEE: `${BASE_URL}/reports/employee`,
    MONTHLY_ALLOCATION: `${BASE_URL}/reports/monthly-allocation`,
    EXCEPTION: `${BASE_URL}/reports/exception`,
    NON_BILLING: `${BASE_URL}/reports/non-billing`,
    PRE_SALE: `${BASE_URL}/reports/pre-sale`,
  },

  // Audit Logs
  AUDIT_LOGS: {
    BASE: `${BASE_URL}/audit-logs`,
    GET_BY_ID: (id) => `${BASE_URL}/audit-logs/${id}`,
    GET_BY_ENTITY: (entityType, entityId) => `${BASE_URL}/audit-logs/entity/${entityType}/${entityId}`,
    GET_BY_USER: (userId) => `${BASE_URL}/audit-logs/user/${userId}`,
    STATS: `${BASE_URL}/audit-logs/stats`,
    DLQ: `${BASE_URL}/audit-logs/dlq`,
    REPROCESS_DLQ: (messageId) => `${BASE_URL}/audit-logs/dlq/${messageId}/reprocess`,
  },
};

export default ENDPOINTS;
