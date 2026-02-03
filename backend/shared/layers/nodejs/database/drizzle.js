/**
 * Drizzle ORM Client
 * Type-safe database client with transaction support
 * Version: 1.0.2 - Full query logging for debugging
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { getPool } from './index.js';
import * as schema from './schema.js';
import logger from '../logger/index.js';

let drizzleInstance = null;

/**
 * Get or create Drizzle ORM instance
 * @returns {Promise<import('drizzle-orm/node-postgres').NodePgDatabase>}
 */
export const getDrizzle = async () => {
    if (drizzleInstance) {
        return drizzleInstance;
    }

    const pool = await getPool();
    drizzleInstance = drizzle(pool, {
        schema,
        logger: {
            logQuery: (query, params) => {
                logger.info('Drizzle SQL', {
                    query: query,
                    params: params
                });
            }
        }
    });

    logger.info('Drizzle ORM instance created');
    return drizzleInstance;
};

/**
 * Execute operations within a transaction with automatic rollback on error
 * @template T
 * @param {(tx: import('drizzle-orm/node-postgres').NodePgDatabase) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export const withTransaction = async (callback) => {
    const db = await getDrizzle();

    return await db.transaction(async (tx) => {
        try {
            const result = await callback(tx);
            logger.debug('Transaction committed successfully');
            return result;
        } catch (error) {
            logger.error('Transaction failed, rolling back', { error: error.message });
            throw error;
        }
    });
};

/**
 * Execute operations within a transaction with custom isolation level
 * @template T
 * @param {(tx: import('drizzle-orm/node-postgres').NodePgDatabase) => Promise<T>} callback
 * @param {{ isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable' }} options
 * @returns {Promise<T>}
 */
export const withTransactionOptions = async (callback, options = {}) => {
    const db = await getDrizzle();

    return await db.transaction(async (tx) => {
        try {
            const result = await callback(tx);
            logger.debug('Transaction committed successfully', { isolationLevel: options.isolationLevel });
            return result;
        } catch (error) {
            logger.error('Transaction failed, rolling back', {
                error: error.message,
                isolationLevel: options.isolationLevel
            });
            throw error;
        }
    }, options);
};

// Re-export schema for convenience
export { schema };

// Export individual tables and enums
export {
    // Enums
    userRoleEnum,
    userStatusEnum,
    employeeStatusEnum,
    projectStatusEnum,
    accountTypeEnum,
    changeTypeEnum,
    allocationChangeTypeEnum,
    auditActionEnum,

    // Lookup tables (serial IDs)
    designations,
    billingStatuses,
    projectTypes,
    employeeTypes,
    universities,
    tags,

    // Core tables (UUIDs)
    employees,
    employeeTags,
    users,
    clients,
    projects,
    allocations,
    futureAllocations,

    // History tables
    allocationHistory,
    allocationHistoryArchive,
    designationHistory,

    // System tables
    permissions,
    auditLogs,

    // Relations
    employeesRelations,
    usersRelations,
    projectsRelations,
    allocationsRelations,
    employeeTagsRelations,
} from './schema.js';

export default {
    getDrizzle,
    withTransaction,
    withTransactionOptions,
    schema,
};
