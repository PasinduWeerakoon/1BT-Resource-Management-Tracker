/**
 * Dashboard Constants
 * Dashboard-specific constants including hardcoded metric values
 * 
 * Note: These values should ideally come from the API, but are kept here
 * as constants for now until the API provides them dynamically.
 */

/**
 * Resource Count Metrics
 * These values represent the current resource counts displayed on the dashboard
 */
export const RESOURCE_COUNTS = {
  BILLING_RESOURCE_COUNT: 37.8,
  ALLOCATED_RESOURCE_COUNT: 74.9,
  BILLABLE_RESOURCE_COUNT: 75, // Excluding Consultants, Interns and Synergy
  SHADOW_COUNT: 19.5,
  INTERNAL_NON_BILLING_COUNT: 0,
  EXTERNAL_CONSULTANT_COUNT: 14,
  BENCH_RESOURCE_COUNT: 7.8,
  TRAINING_RESOURCE_COUNT: 6.7,
  INTERNS_COUNT: 29,
  SYNERGY_COUNT: 10,
  SHARED_SERVICES_COUNT: 15,
};

/**
 * Percentage Metrics
 * These values represent the current percentage metrics displayed on the dashboard
 */
export const PERCENTAGES = {
  ALLOCATION_PERCENTAGE: 99.8,
  BILLABLE_PERCENTAGE: 51.2,
  SHADOW_PERCENTAGE: 33.1,
};

/**
 * Dashboard Table Column Widths
 */
export const COLUMN_WIDTHS = {
  EMPLOYEE_NAME: 200,
  TRACK: 120,
  TECH_STACK: 150,
  TIER: 120,
  DESIGNATION: 250,
  ALLOCATION_COUNT: 140,
};

/**
 * Dashboard Labels
 */
export const LABELS = {
  RESOURCE_COUNTS: 'Resource Counts',
  PERCENTAGES: '% Percentages',
  BY_DESIGNATION: 'BY DESIGNATION',
  EMPLOYEES_BY_TRACK: 'No. of Employee Accounts Managed by Track',
  EMPLOYEES_BY_TECH_STACK: 'No. of Employee Accounts Managed by Tech Stack',
  SUMMARY_VIEW: 'SUMMARY VIEW',

  // Resource count labels
  BILLING_RESOURCE_COUNT: 'Billing Resource Count',
  ALLOCATED_RESOURCE_COUNT: 'Allocated Resource Count',
  BILLABLE_RESOURCE_COUNT: 'Billable Resource Count (Excluding Consultants, Interns and Synergy)',
  SHADOW_COUNT: 'Shadow Count',
  INTERNAL_NON_BILLING_COUNT: 'Internal Non-Billing Count',
  EXTERNAL_CONSULTANT_COUNT: 'External Consultant Count',
  BENCH_RESOURCE_COUNT: 'Bench Resource Count',
  TRAINING_RESOURCE_COUNT: 'Training Resource Count',
  INTERNS: 'Interns',
  SYNERGY: 'Synergy',
  SHARED_SERVICES: 'Shared Services',

  // Percentage labels
  ALLOCATION_PERCENTAGE: 'Allocation Percentage',
  BILLABLE_PERCENTAGE: 'Billable Percentage',
  SHADOW_PERCENTAGE: 'Shadow Percentage',

  // Table column labels
  EMPLOYEE_NAME: 'Employee Name',
  TRACK: 'Track',
  TECH_STACK: 'Tech Stack',
  TIER: 'Tier',
  DESIGNATION: 'Designation',
  ALLOCATION_COUNT: 'Allocation Count',
};

export default {
  RESOURCE_COUNTS,
  PERCENTAGES,
  COLUMN_WIDTHS,
  LABELS,
};
