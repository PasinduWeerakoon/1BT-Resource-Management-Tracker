/**
 * Shared Library Entry Point
 * Re-exports all shared modules for easy importing
 */

export * as db from './lib/database/index.js';
export { default as config } from './lib/config/index.js';
export { default as logger } from './lib/logger/index.js';
export * from './lib/middleware/index.js';
export * from './lib/utils/response.js';
export { default as audit, sendAuditEvent, sendAuditEventBatch, getChangedFields } from './lib/audit/index.js';
