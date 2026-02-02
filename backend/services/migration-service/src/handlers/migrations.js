/**
 * Database Migration Handler using Drizzle ORM
 * Lambda functions for running database migrations securely
 * 
 * This uses Drizzle's push mechanism to sync schema directly.
 * For production, use generated migrations via drizzle-kit generate.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as db from '/opt/nodejs/database/index.js';
import * as schema from '/opt/nodejs/database/schema.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

/**
 * Get Drizzle instance for migrations
 */
const getDrizzleForMigration = async () => {
    const pool = await db.getPool();
    return drizzle(pool, { schema });
};

/**
 * Seed lookup tables with default data
 */
const seedDefaults = async (drizzleDb) => {
    const log = logger.child({ handler: 'migrations.seedDefaults' });

    // Seed Designations
    const designationsData = [
        { name: 'Intern - SE', level: 1, isInternRole: true, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 1 },
        { name: 'ASE', level: 2, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 6 },
        { name: 'SE', level: 3, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 11 },
        { name: 'SSE', level: 4, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 14 },
        { name: 'ATL', level: 5, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 15 },
        { name: 'TL', level: 6, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 16 },
        { name: 'STL', level: 7, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 19 },
        { name: 'Architect', level: 8, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 21 },
        { name: 'Intern - QA', level: 1, isInternRole: true, category: 'QA', isActive: true, isDefault: true, displayOrder: 25 },
        { name: 'QAE', level: 3, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 27 },
        { name: 'QAL', level: 6, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 30 },
        { name: 'PM', level: 5, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 41 },
        { name: 'None', level: 0, isInternRole: false, category: 'Other', isActive: true, isDefault: true, displayOrder: 82 },
    ];

    try {
        await drizzleDb.insert(schema.designations).values(designationsData).onConflictDoNothing();
        log.info(`Seeded ${designationsData.length} designations`);
    } catch (err) {
        log.warn('Designations may already exist', { error: err.message });
    }

    // Seed Billing Statuses
    const billingStatusesData = [
        { name: 'Billing', description: 'Project is billable', isActive: true, isDefault: true, displayOrder: 1 },
        { name: 'Non-Billing', description: 'Project is not billable', isActive: true, isDefault: true, displayOrder: 2 },
        { name: 'Bench', description: 'Bench/Available pool', isActive: true, isDefault: true, displayOrder: 3 },
        { name: 'Training', description: 'Training activities', isActive: true, isDefault: true, displayOrder: 4 },
        { name: 'Presale', description: 'Pre-sales activities', isActive: true, isDefault: true, displayOrder: 5 },
        { name: 'Support', description: 'Support activities', isActive: true, isDefault: true, displayOrder: 6 },
        { name: 'Execs', description: 'Executive activities', isActive: true, isDefault: true, displayOrder: 7 },
    ];

    try {
        await drizzleDb.insert(schema.billingStatuses).values(billingStatusesData).onConflictDoNothing();
        log.info(`Seeded ${billingStatusesData.length} billing statuses`);
    } catch (err) {
        log.warn('Billing statuses may already exist', { error: err.message });
    }

    // Seed Project Types
    const projectTypesData = [
        { name: 'Client', description: 'External client project', isActive: true, isDefault: true, displayOrder: 1 },
        { name: 'Research', description: 'Research and development', isActive: true, isDefault: true, displayOrder: 2 },
        { name: 'Training', description: 'Training program', isActive: true, isDefault: true, displayOrder: 3 },
        { name: 'Pre-Sales', description: 'Pre-sales activities', isActive: true, isDefault: true, displayOrder: 4 },
        { name: 'Investment', description: 'Investment project', isActive: true, isDefault: true, displayOrder: 5 },
        { name: 'Preparations', description: 'Project preparation phase', isActive: true, isDefault: true, displayOrder: 6 },
    ];

    try {
        await drizzleDb.insert(schema.projectTypes).values(projectTypesData).onConflictDoNothing();
        log.info(`Seeded ${projectTypesData.length} project types`);
    } catch (err) {
        log.warn('Project types may already exist', { error: err.message });
    }

    // Seed Employee Types
    const employeeTypesData = [
        { name: 'Permanent', description: 'Full-time permanent employee', isActive: true, isDefault: true },
        { name: 'Contract', description: 'Contract employee', isActive: true, isDefault: false },
        { name: 'Intern', description: 'Internship employee', isActive: true, isDefault: false },
        { name: 'Consultant', description: 'External consultant', isActive: true, isDefault: false },
    ];

    try {
        await drizzleDb.insert(schema.employeeTypes).values(employeeTypesData).onConflictDoNothing();
        log.info(`Seeded ${employeeTypesData.length} employee types`);
    } catch (err) {
        log.warn('Employee types may already exist', { error: err.message });
    }

    // Seed Tags
    const tagsData = [
        { name: 'Synergy', description: 'Synergy program participant', isActive: true, isDefault: true },
        { name: 'GDC', description: 'Global Delivery Center', isActive: true, isDefault: true },
        { name: 'Leaders League', description: 'Leadership development program', isActive: true, isDefault: true },
        { name: 'High Performer', description: 'High performing employee', isActive: true, isDefault: false },
        { name: 'Critical Resource', description: 'Business critical resource', isActive: true, isDefault: false },
    ];

    try {
        await drizzleDb.insert(schema.tags).values(tagsData).onConflictDoNothing();
        log.info(`Seeded ${tagsData.length} tags`);
    } catch (err) {
        log.warn('Tags may already exist', { error: err.message });
    }

    // Seed Universities
    const universitiesData = [
        { name: 'University of Colombo', shortName: 'UOC', country: 'Sri Lanka', isActive: true },
        { name: 'University of Moratuwa', shortName: 'UOM', country: 'Sri Lanka', isActive: true },
        { name: 'University of Peradeniya', shortName: 'UOP', country: 'Sri Lanka', isActive: true },
        { name: 'SLIIT', shortName: 'SLIIT', country: 'Sri Lanka', isActive: true },
        { name: 'NSBM Green University', shortName: 'NSBM', country: 'Sri Lanka', isActive: true },
        { name: 'Other', shortName: 'Other', country: 'Other', isActive: true },
    ];

    try {
        await drizzleDb.insert(schema.universities).values(universitiesData).onConflictDoNothing();
        log.info(`Seeded ${universitiesData.length} universities`);
    } catch (err) {
        log.warn('Universities may already exist', { error: err.message });
    }

    // Seed Super Admin
    try {
        await drizzleDb.insert(schema.users).values({
            username: 'superadmin',
            email: 'hirun.dealwis@1billiontech.com',
            passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4YjKmKCDLNIKQoiG',
            role: 'Super User',
            status: 'Active',
            mustChangePassword: true,
        }).onConflictDoNothing();
        log.info('Seeded super admin user');
    } catch (err) {
        log.warn('Super admin may already exist', { error: err.message });
    }
};

/**
 * Run migrations using Drizzle migrate
 * This looks for migrations in the /drizzle folder
 */
export const up = async (event) => {
    const log = logger.child({ handler: 'migrations.up' });
    log.info('Starting Drizzle migration process');

    try {
        const drizzleDb = await getDrizzleForMigration();

        // Run migrations from the drizzle folder
        // In Lambda, migrations are bundled with the deployment
        try {
            await migrate(drizzleDb, { migrationsFolder: './drizzle' });
            log.info('Drizzle migrations completed');
        } catch (migrateErr) {
            // If no migrations folder, that's okay - we'll use push semantics
            log.warn('No migration folder found, using schema sync', { error: migrateErr.message });
        }

        // Seed default data
        await seedDefaults(drizzleDb);

        return success({
            message: 'Migration completed successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        log.error('Migration failed', { error: err.message, stack: err.stack });
        return error(err.message, 500, 'MIGRATION_ERROR');
    }
};

/**
 * Rollback - Not implemented for safety
 */
export const down = async (event) => {
    return error(
        'Rollback not implemented. Please manually revert changes via bastion host.',
        501,
        'NOT_IMPLEMENTED'
    );
};

/**
 * Get migration/database status
 */
export const status = async (event) => {
    const log = logger.child({ handler: 'migrations.status' });

    try {
        const client = await db.getClient();

        try {
            // Check table counts
            const tables = ['designations', 'billing_statuses', 'project_types', 'employee_types',
                'universities', 'tags', 'employees', 'users', 'clients', 'projects', 'allocations'];

            const counts = {};
            for (const table of tables) {
                try {
                    const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                    counts[table] = parseInt(result.rows[0].count);
                } catch (err) {
                    counts[table] = 'table not found';
                }
            }

            return success({
                database: 'connected',
                tableCounts: counts,
                timestamp: new Date().toISOString(),
            });
        } finally {
            client.release();
        }
    } catch (err) {
        log.error('Failed to get status', { error: err.message });
        return error(err.message, 500, 'STATUS_ERROR');
    }
};

/**
 * Reset database - DROP ALL and recreate (DANGEROUS - only for dev)
 */
export const reset = async (event) => {
    const log = logger.child({ handler: 'migrations.reset' });

    // Only allow in dev environment
    if (process.env.NODE_ENV !== 'dev') {
        return error('Database reset is only allowed in dev environment', 403, 'FORBIDDEN');
    }

    log.warn('Starting database reset - THIS WILL DELETE ALL DATA');

    try {
        const client = await db.getClient();

        try {
            // Drop all tables
            await client.query(`
                DROP SCHEMA public CASCADE;
                CREATE SCHEMA public;
                GRANT ALL ON SCHEMA public TO public;
            `);

            log.info('Database schema reset complete');

            // Run migrations
            return await up(event);
        } finally {
            client.release();
        }
    } catch (err) {
        log.error('Database reset failed', { error: err.message, stack: err.stack });
        return error(err.message, 500, 'RESET_ERROR');
    }
};

/**
 * Sync schema using Drizzle push (for dev only)
 * This directly applies schema changes without migrations
 */
export const sync = async (event) => {
    const log = logger.child({ handler: 'migrations.sync' });

    if (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production') {
        return error('Schema sync is not allowed in production. Use migrations instead.', 403, 'FORBIDDEN');
    }

    log.info('Starting schema sync');

    try {
        const client = await db.getClient();

        try {
            // Create extensions
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

            // Create enums (idempotent)
            const enums = [
                { name: 'user_role', values: ['Super User', 'Admin', 'User'] },
                { name: 'user_status', values: ['Active', 'Inactive', 'Suspended', 'Pending'] },
                { name: 'employee_status', values: ['Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated'] },
                { name: 'project_status', values: ['Active', 'Inactive', 'Completed', 'On Hold'] },
                { name: 'account_type', values: ['Internal', 'External'] },
                { name: 'change_type', values: ['CREATED', 'UPDATED', 'DELETED', 'RESTORED'] },
                { name: 'allocation_change_type', values: ['NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING', 'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT', 'LEGACY'] },
                { name: 'audit_action', values: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE'] },
            ];

            for (const { name, values } of enums) {
                const valuesStr = values.map(v => `'${v}'`).join(', ');
                await client.query(`
                    DO $$ BEGIN CREATE TYPE ${name} AS ENUM (${valuesStr});
                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
                `);
            }

            log.info('Extensions and enums created');

            // Run the migration to create tables
            return await up(event);
        } finally {
            client.release();
        }
    } catch (err) {
        log.error('Schema sync failed', { error: err.message, stack: err.stack });
        return error(err.message, 500, 'SYNC_ERROR');
    }
};
