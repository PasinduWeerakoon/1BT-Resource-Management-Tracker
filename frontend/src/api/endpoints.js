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
    ACTIVATE_USER: `${BASE_URL}/auth/activate-user`,
    USERS: `${BASE_URL}/auth/users`,
    UPDATE_ROLE: `${BASE_URL}/auth/update-role`,
    REVOKE_ACCESS: `${BASE_URL}/auth/revoke-access`,
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

  // Tags
  TAGS: {
    BASE: `${BASE_URL}/tags`,
    LIST: `${BASE_URL}/tags`,
    GET_BY_ID: (id) => `${BASE_URL}/tags/${id}`,
    CREATE: `${BASE_URL}/tags`,
    UPDATE: (id) => `${BASE_URL}/tags/${id}`,
    DELETE: (id) => `${BASE_URL}/tags/${id}`,
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

  // Billing Statuses
  BILLING_STATUSES: {
    BASE: `${BASE_URL}/billing-statuses`,
    LIST: `${BASE_URL}/billing-statuses`,
    GET_BY_ID: (id) => `${BASE_URL}/billing-statuses/${id}`,
    CREATE: `${BASE_URL}/billing-statuses`,
    UPDATE: (id) => `${BASE_URL}/billing-statuses/${id}`,
    DELETE: (id) => `${BASE_URL}/billing-statuses/${id}`,
  },

  // Project Types
  PROJECT_TYPES: {
    BASE: `${BASE_URL}/project-types`,
    LIST: `${BASE_URL}/project-types`,
    GET_BY_ID: (id) => `${BASE_URL}/project-types/${id}`,
    CREATE: `${BASE_URL}/project-types`,
    UPDATE: (id) => `${BASE_URL}/project-types/${id}`,
    DELETE: (id) => `${BASE_URL}/project-types/${id}`,
  },

  // Account Types
  ACCOUNT_TYPES: {
    BASE: `${BASE_URL}/account-types`,
    LIST: `${BASE_URL}/account-types`,
    GET_BY_ID: (id) => `${BASE_URL}/account-types/${id}`,
    CREATE: `${BASE_URL}/account-types`,
    UPDATE: (id) => `${BASE_URL}/account-types/${id}`,
    DELETE: (id) => `${BASE_URL}/account-types/${id}`,
  },

  // Project Statuses
  PROJECT_STATUSES: {
    BASE: `${BASE_URL}/project-statuses`,
    LIST: `${BASE_URL}/project-statuses`,
    GET_BY_ID: (id) => `${BASE_URL}/project-statuses/${id}`,
    CREATE: `${BASE_URL}/project-statuses`,
    UPDATE: (id) => `${BASE_URL}/project-statuses/${id}`,
    DELETE: (id) => `${BASE_URL}/project-statuses/${id}`,
  },

  // Tiers
  TIERS: {
    BASE: `${BASE_URL}/tiers`,
    LIST: `${BASE_URL}/tiers`,
    GET_BY_ID: (id) => `${BASE_URL}/tiers/${id}`,
    CREATE: `${BASE_URL}/tiers`,
    UPDATE: (id) => `${BASE_URL}/tiers/${id}`,
    DELETE: (id) => `${BASE_URL}/tiers/${id}`,
  },

  // Configs (Unified endpoint for all configurations)
  CONFIGS: {
    GET_ALL: `${BASE_URL}/configs`,
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
    SCHEDULER_ACTIVATE: `${BASE_URL}/allocations/scheduler/activate`,
  },

  // Future Allocations (3-Table Architecture)
  FUTURE_ALLOCATIONS: {
    BASE: `${BASE_URL}/future-allocations`,
    LIST: `${BASE_URL}/future-allocations`,
    GET_BY_ID: (id) => `${BASE_URL}/future-allocations/${id}`,
    BY_RESOURCE: (resourceId) => `${BASE_URL}/future-allocations/resource/${resourceId}`,
    PENDING: `${BASE_URL}/future-allocations/pending`,
    STATS: `${BASE_URL}/future-allocations/stats`,
    CANCEL: (id) => `${BASE_URL}/future-allocations/${id}`,
  },

  // Allocation History Archive (3-Table Architecture)
  ALLOCATION_HISTORY: {
    BASE: `${BASE_URL}/allocation-history`,
    LIST: `${BASE_URL}/allocation-history`,
    GET_BY_ID: (id) => `${BASE_URL}/allocation-history/${id}`,
    BY_RESOURCE: (resourceId) => `${BASE_URL}/allocation-history/resource/${resourceId}`,
    BY_PROJECT: (projectId) => `${BASE_URL}/allocation-history/project/${projectId}`,
    STATS: `${BASE_URL}/allocation-history/stats`,
    TIMELINE: (resourceId) => `${BASE_URL}/allocation-history/timeline/${resourceId}`,
  },

  // Reports
  REPORTS: {
    BASE: `${BASE_URL}/reports`,
    BENCH: `${BASE_URL}/reports/bench`,
    ACCOUNT_MANAGER: `${BASE_URL}/reports/account-manager`,
    EMPLOYEE: `${BASE_URL}/reports/employee`,
    INTERN: `${BASE_URL}/reports/intern`,
    MONTHLY_ALLOCATION: `${BASE_URL}/reports/monthly-allocation`,
    CLIENT_COST_SNAPSHOT: `${BASE_URL}/reports/client-cost-snapshot`,
    EXCEPTION: `${BASE_URL}/reports/exception`,
    NON_BILLING: `${BASE_URL}/reports/non-billing`,
    PRE_SALE: `${BASE_URL}/reports/pre-sale`,
    TIER_BREAKDOWN: `${BASE_URL}/reports/tier-breakdown`,
    EXTERNAL_CONSULTANTS: `${BASE_URL}/reports/external-consultants`,
    TRAINING: `${BASE_URL}/reports/training`,
  },

  // Dashboard Summary
  DASHBOARD: {
    RESOURCE_COUNTS: `${BASE_URL}/dashboard/resource-counts`,
    PERCENTAGES: `${BASE_URL}/dashboard/percentages`,
    CHARTS: `${BASE_URL}/dashboard/charts`,
  },

  // Documents
  DOCUMENTS: {
    EXCEL_SUMMARY: `${BASE_URL}/documents/excel/summary`,
    EXCEL_NON_BILLING: `${BASE_URL}/documents/excel/non-billing`,
    EXCEL_PROJECTS: `${BASE_URL}/documents/excel/projects`,
    EXCEL_MONTHLY_ALLOCATION: `${BASE_URL}/documents/excel/monthly-allocation`,
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
