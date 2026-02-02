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
 * Uses raw SQL INSERT ... ON CONFLICT DO NOTHING for reliability
 */
const seedDefaults = async (client) => {
    const log = logger.child({ handler: 'migrations.seedDefaults' });
    log.info('Starting seed defaults');

    // Seed designations using raw SQL
    log.info('Seeding designations...');
    try {
        await client.query(`
            INSERT INTO designations (name, level, is_intern_role, category, is_active, is_default, display_order)
            VALUES 
                ('Intern - SE', 1, true, 'Engineering', true, true, 1),
                ('ASE', 2, false, 'Engineering', true, true, 6),
                ('SE', 3, false, 'Engineering', true, true, 11),
                ('SSE', 4, false, 'Engineering', true, true, 14),
                ('ATL', 5, false, 'Engineering', true, true, 15),
                ('TL', 6, false, 'Engineering', true, true, 16),
                ('STL', 7, false, 'Engineering', true, true, 19),
                ('Architect', 8, false, 'Engineering', true, true, 21),
                ('Intern - QA', 1, true, 'QA', true, true, 25),
                ('QAE', 3, false, 'QA', true, true, 27),
                ('QAL', 6, false, 'QA', true, true, 30),
                ('PM', 5, false, 'BA/PM', true, true, 41),
                ('None', 0, false, 'Other', true, true, 82)
            ON CONFLICT (name) DO NOTHING
        `);
        log.info('Seeded designations');
    } catch (err) {
        log.warn('Designations seed error', { error: err.message });
    }

    // Seed billing statuses
    log.info('Seeding billing statuses...');
    try {
        await client.query(`
            INSERT INTO billing_statuses (name, description, is_active, is_default, display_order)
            VALUES 
                ('Billing', 'Project is billable', true, true, 1),
                ('Non-Billing', 'Project is not billable', true, true, 2),
                ('Bench', 'Bench/Available pool', true, true, 3),
                ('Training', 'Training activities', true, true, 4),
                ('Presale', 'Pre-sales activities', true, true, 5),
                ('Support', 'Support activities', true, true, 6),
                ('Execs', 'Executive activities', true, true, 7)
            ON CONFLICT (name) DO NOTHING
        `);
        log.info('Seeded billing statuses');
    } catch (err) {
        log.warn('Billing statuses seed error', { error: err.message });
    }

    // Seed project types
    log.info('Seeding project types...');
    try {
        await client.query(`
            INSERT INTO project_types (name, description, is_active, is_default, display_order)
            VALUES 
                ('Client', 'External client project', true, true, 1),
                ('Research', 'Research and development', true, true, 2),
                ('Training', 'Training program', true, true, 3),
                ('Pre-Sales', 'Pre-sales activities', true, true, 4),
                ('Investment', 'Investment project', true, true, 5),
                ('Preparations', 'Project preparation phase', true, true, 6)
            ON CONFLICT (name) DO NOTHING
        `);
        log.info('Seeded project types');
    } catch (err) {
        log.warn('Project types seed error', { error: err.message });
    }

    // Seed employee types
    log.info('Seeding employee types...');
    try {
        await client.query(`
            INSERT INTO employee_types (name, description, is_active, is_default)
            VALUES 
                ('Permanent', 'Full-time permanent employee', true, true),
                ('Contract', 'Contract employee', true, false),
                ('Intern', 'Internship employee', true, false),
                ('Consultant', 'External consultant', true, false)
            ON CONFLICT (name) DO NOTHING
        `);
        log.info('Seeded employee types');
    } catch (err) {
        log.warn('Employee types seed error', { error: err.message });
    }

    // Seed tags
    log.info('Seeding tags...');
    try {
        await client.query(`
            INSERT INTO tags (name, description, is_active, is_default)
            VALUES 
                ('Synergy', 'Synergy program participant', true, true),
                ('GDC', 'Global Delivery Center', true, true),
                ('Leaders League', 'Leadership development program', true, true),
                ('High Performer', 'High performing employee', true, false),
                ('Critical Resource', 'Business critical resource', true, false)
            ON CONFLICT (name) DO NOTHING
        `);
        log.info('Seeded tags');
    } catch (err) {
        log.warn('Tags seed error', { error: err.message });
    }

    // Seed universities
    log.info('Seeding universities...');
    try {
        await client.query(`
            INSERT INTO universities (name, short_name, country, is_active)
            VALUES 
                ('University of Colombo', 'UOC', 'Sri Lanka', true),
                ('University of Moratuwa', 'UOM', 'Sri Lanka', true),
                ('University of Peradeniya', 'UOP', 'Sri Lanka', true),
                ('SLIIT', 'SLIIT', 'Sri Lanka', true),
                ('NSBM Green University', 'NSBM', 'Sri Lanka', true),
                ('Other', 'Other', 'Other', true)
            ON CONFLICT (name) DO NOTHING
        `);
        log.info('Seeded universities');
    } catch (err) {
        log.warn('Universities seed error', { error: err.message });
    }

    log.info('Seed defaults completed');
};

/**
 * Run migrations using Drizzle migrate
 * This looks for migrations in the /drizzle folder
 */
export const up = async (event) => {
    const log = logger.child({ handler: 'migrations.up' });
    log.info('Starting Drizzle migration process');

    let client;
    try {
        const drizzleDb = await getDrizzleForMigration();
        client = await db.getClient();

        // Check if this is a fresh database or existing one
        const tablesExist = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'employees'
            );
        `);

        const isExistingDb = tablesExist.rows[0].exists;
        log.info('Database state', { isExistingDb });

        if (isExistingDb) {
            // Database already has tables - ensure migration tracking table exists
            // and mark initial migration as applied with correct Drizzle hash format
            await client.query(`
                CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
                    id SERIAL PRIMARY KEY,
                    hash text NOT NULL,
                    created_at bigint
                );
            `);

            // Check if initial migration is already recorded
            const migrationCheck = await client.query(`
                SELECT COUNT(*) FROM "__drizzle_migrations"
            `);

            if (parseInt(migrationCheck.rows[0].count) === 0) {
                // For existing databases, we skip running migrations entirely
                // and just mark that the database is at the current schema state.
                await client.query(`
                    INSERT INTO "__drizzle_migrations" (hash, created_at)
                    VALUES ('0000_lean_puma', $1)
                `, [Date.now()]);
                log.info('Baseline migration marked as applied - skipping migration execution for existing database');
            } else {
                log.info('Migrations already tracked - database is up to date');
            }

            // For existing databases, DO NOT run migrate() as the schema already exists
            log.info('Existing database detected - skipping Drizzle migrate() to avoid conflicts');
        } else {
            // Fresh database - run migrations normally
            log.info('Fresh database detected - running Drizzle migrations');
            await migrate(drizzleDb, { migrationsFolder: './drizzle' });
            log.info('Drizzle migrations completed');
        }

        // Seed default data (uses raw SQL now)
        await seedDefaults(client);

        return success({
            message: 'Migration completed successfully',
            timestamp: new Date().toISOString(),
            existingDb: isExistingDb
        });
    } catch (err) {
        log.error('Migration failed', { error: err.message, stack: err.stack });
        return error(err.message, 500, 'MIGRATION_ERROR');
    } finally {
        if (client) client.release();
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

            // Get employees table columns
            let employeesColumns = [];
            try {
                const columnsResult = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'employees' 
                    ORDER BY ordinal_position
                `);
                employeesColumns = columnsResult.rows.map(r => r.column_name);
            } catch (err) {
                employeesColumns = ['error: ' + err.message];
            }

            // Get allocations table columns
            let allocationsColumns = [];
            try {
                const allocResult = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'allocations' 
                    ORDER BY ordinal_position
                `);
                allocationsColumns = allocResult.rows.map(r => r.column_name);
            } catch (err) {
                allocationsColumns = ['error: ' + err.message];
            }

            // Get employee_tags table columns
            let employeeTagsColumns = [];
            try {
                const tagsResult = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'employee_tags' 
                    ORDER BY ordinal_position
                `);
                employeeTagsColumns = tagsResult.rows.map(r => r.column_name);
            } catch (err) {
                employeeTagsColumns = ['error: ' + err.message];
            }

            return success({
                database: 'connected',
                tableCounts: counts,
                employeesColumns: employeesColumns,
                allocationsColumns: allocationsColumns,
                employeeTagsColumns: employeeTagsColumns,
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
