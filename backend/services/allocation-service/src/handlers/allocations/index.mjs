/**
 * Allocations Handler - Index
 * 
 * Re-exports all allocation handlers for use by serverless.yml
 * This file provides backward compatibility with existing handler references
 * 
 * Structure:
 * - crud.js: CRUD operations (list, getById, create, update, remove)
 * - jobs.js: Scheduled jobs (gapDetectionJob, billingStatusTransitionJob, utilizationSnapshotJob)
 * - utilization.js: Utilization handlers (getResourceUtilization, getHistory)
 */

// CRUD Operations
export { list, getById, create, update, remove } from './crud.mjs';

// Scheduled Jobs
export { gapDetectionJob, billingStatusTransitionJob, utilizationSnapshotJob } from './jobs.mjs';

// Utilization & History
export { getResourceUtilization, getHistory } from './utilization.mjs';
