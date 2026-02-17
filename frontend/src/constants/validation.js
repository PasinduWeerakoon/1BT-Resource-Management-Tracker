/**
 * Validation Constants
 * Validation rules, limits, and constraints used across the application
 */

/**
 * String Length Limits
 */
export const STRING_LIMITS = {
  // General limits
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 100,
  MAX_PHONE_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TITLE_LENGTH: 200,
  MAX_CODE_LENGTH: 50,
  
  // Employee/Resource limits
  MAX_EMPLOYEE_ID_LENGTH: 20,
  MIN_EMPLOYEE_ID_LENGTH: 3,
  
  // Project limits
  MAX_PROJECT_NAME_LENGTH: 200,
  MAX_PROJECT_CODE_LENGTH: 50,
  MAX_CLIENT_NAME_LENGTH: 200,
};

/**
 * Number Limits
 */
export const NUMBER_LIMITS = {
  // Allocation limits
  MIN_ALLOCATION_PERCENTAGE: 0,
  MAX_ALLOCATION_PERCENTAGE: 200,
  MIN_BILLING_PERCENTAGE: 0,
  MAX_BILLING_PERCENTAGE: 100,
  
  // Team size limits
  MIN_TEAM_SIZE: 1,
  MAX_TEAM_SIZE: 1000,
  
  // Budget limits
  MIN_BUDGET: 0,
  MAX_BUDGET: Number.MAX_SAFE_INTEGER,
  
  // Pagination limits
  MIN_PAGE: 1,
  MAX_PAGE: Number.MAX_SAFE_INTEGER,
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
};

/**
 * Date Validation
 */
export const DATE_VALIDATION = {
  // Minimum date (reasonable past date)
  MIN_DATE: '1900-01-01',
  
  // Maximum date (reasonable future date)
  MAX_DATE: '2100-12-31',
  
  // Minimum duration in days
  MIN_DURATION_DAYS: 1,
  
  // Maximum duration in days (100 years)
  MAX_DURATION_DAYS: 36500,
};

/**
 * Email Validation
 */
export const EMAIL = {
  PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_LENGTH: 100,
};

/**
 * Phone Validation
 */
export const PHONE = {
  // International phone pattern
  PATTERN: /^\+?[1-9]\d{6,14}$/,
  MAX_LENGTH: 20,
};

/**
 * UUID Validation
 */
export const UUID = {
  PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

/**
 * Name Validation
 */
export const NAME = {
  // Allows letters, spaces, hyphens, and apostrophes
  PATTERN: /^[a-zA-Z\s\-']+$/,
  MIN_LENGTH: 2,
  MAX_LENGTH: 100,
};

/**
 * Status Values
 */
export const STATUS_VALUES = {
  RESOURCE: ['Active', 'Inactive', 'Serving Notice Period', 'On Leave'],
  PROJECT: ['Active', 'Completed', 'On Hold', 'Cancelled', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  BILLING: ['Billing', 'Non-Billing', 'Bench', 'Training', 'Presale'],
};

/**
 * Project Types
 */
export const PROJECT_TYPES = {
  VALUES: ['Client', 'Internal', 'Pre-Sales', 'Bench', 'Training', 'POC', 'Presale', 'Research'],
  DEFAULT: 'Client',
};

/**
 * Account Types
 */
export const ACCOUNT_TYPES = {
  VALUES: ['Internal', 'External'],
  DEFAULT: 'Internal',
};

/**
 * Decimal Precision
 */
export const DECIMAL_PRECISION = {
  ALLOCATION: 2,
  PERCENTAGE: 2,
  BILLING: 2,
  MONEY: 2,
};

export default {
  STRING_LIMITS,
  NUMBER_LIMITS,
  DATE_VALIDATION,
  EMAIL,
  PHONE,
  UUID,
  NAME,
  STATUS_VALUES,
  PROJECT_TYPES,
  ACCOUNT_TYPES,
  DECIMAL_PRECISION,
};
