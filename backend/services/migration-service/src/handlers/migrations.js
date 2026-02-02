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
 * Custom migrations that can be applied to existing databases
 * These are executed as raw SQL for maximum control
 */
const CUSTOM_MIGRATIONS = {
    '0001_config_ids_migration': `
        -- Step 1: Add new integer columns if they don't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'track_id') THEN
                ALTER TABLE "employees" ADD COLUMN "track_id" integer;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tier_id') THEN
                ALTER TABLE "employees" ADD COLUMN "tier_id" integer;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tech_stack_id') THEN
                ALTER TABLE "employees" ADD COLUMN "tech_stack_id" integer;
            END IF;
        END $$;

        -- Step 2: Migrate existing VARCHAR data to integer IDs (TRACKS mapping)
        UPDATE "employees" SET "track_id" = CASE "track"
            WHEN 'QA' THEN 1
            WHEN 'Dev' THEN 2
            WHEN 'UI' THEN 3
            WHEN 'BA' THEN 4
            WHEN 'PM' THEN 5
            WHEN 'Support' THEN 6
            WHEN 'Synergy' THEN 7
            WHEN 'UX' THEN 8
            WHEN 'Execs' THEN 9
            WHEN 'Delivery' THEN 10
            WHEN 'Functional Consultant - MS Dynamics 365' THEN 11
            ELSE NULL
        END WHERE "track" IS NOT NULL AND "track_id" IS NULL;

        -- Step 3: Migrate TIERS data
        UPDATE "employees" SET "tier_id" = CASE "tier"
            WHEN 'Tier - 1' THEN 1
            WHEN 'Tier - 2' THEN 2
            WHEN 'Tier - 3' THEN 3
            WHEN 'Tier - 4' THEN 4
            WHEN 'Intern' THEN 5
            WHEN 'None' THEN 6
            WHEN 'Synergy' THEN 7
            ELSE NULL
        END WHERE "tier" IS NOT NULL AND "tier_id" IS NULL;

        -- Step 4: Migrate TECH_STACKS data
        UPDATE "employees" SET "tech_stack_id" = CASE "tech_stack"
            WHEN 'QA' THEN 1
            WHEN '.NET' THEN 2
            WHEN 'Full Stack' THEN 3
            WHEN 'Synergy' THEN 4
            WHEN 'PM' THEN 5
            WHEN 'BA' THEN 6
            WHEN 'UI' THEN 7
            WHEN 'Java' THEN 8
            WHEN 'Data Science' THEN 9
            WHEN 'Power Apps' THEN 10
            WHEN 'Finance' THEN 11
            WHEN 'React' THEN 12
            WHEN 'Dynamics' THEN 13
            WHEN 'UX' THEN 14
            WHEN 'BA/PM' THEN 15
            WHEN 'UI/UX' THEN 16
            WHEN 'HR' THEN 17
            WHEN 'Execs' THEN 18
            WHEN 'Admin' THEN 19
            WHEN 'Marketing' THEN 20
            WHEN 'Drupal' THEN 21
            WHEN 'Sales & Marketing' THEN 22
            WHEN 'BC' THEN 23
            WHEN 'Business Central (Functional)' THEN 24
            WHEN 'AI/ML' THEN 25
            WHEN 'Blockchain' THEN 26
            ELSE NULL
        END WHERE "tech_stack" IS NOT NULL AND "tech_stack_id" IS NULL;

        -- Step 5: Drop old VARCHAR columns
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'track') THEN
                ALTER TABLE "employees" DROP COLUMN "track";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tier') THEN
                ALTER TABLE "employees" DROP COLUMN "tier";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tech_stack') THEN
                ALTER TABLE "employees" DROP COLUMN "tech_stack";
            END IF;
        END $$;

        -- Step 6: Create indexes for performance
        CREATE INDEX IF NOT EXISTS "idx_employees_track_id" ON "employees" ("track_id") WHERE "deleted_at" IS NULL;
        CREATE INDEX IF NOT EXISTS "idx_employees_tier_id" ON "employees" ("tier_id") WHERE "deleted_at" IS NULL;
        CREATE INDEX IF NOT EXISTS "idx_employees_tech_stack_id" ON "employees" ("tech_stack_id") WHERE "deleted_at" IS NULL;

        -- Step 7: Update designation_history table
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'previous_track_id') THEN
                ALTER TABLE "designation_history" ADD COLUMN "previous_track_id" integer;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'new_track_id') THEN
                ALTER TABLE "designation_history" ADD COLUMN "new_track_id" integer;
            END IF;
        END $$;

        -- Step 8: Migrate designation_history track data
        UPDATE "designation_history" SET "previous_track_id" = CASE "previous_track"
            WHEN 'QA' THEN 1 WHEN 'Dev' THEN 2 WHEN 'UI' THEN 3 WHEN 'BA' THEN 4
            WHEN 'PM' THEN 5 WHEN 'Support' THEN 6 WHEN 'Synergy' THEN 7 WHEN 'UX' THEN 8
            WHEN 'Execs' THEN 9 WHEN 'Delivery' THEN 10 WHEN 'Functional Consultant - MS Dynamics 365' THEN 11
            ELSE NULL
        END WHERE "previous_track" IS NOT NULL AND "previous_track_id" IS NULL;

        UPDATE "designation_history" SET "new_track_id" = CASE "new_track"
            WHEN 'QA' THEN 1 WHEN 'Dev' THEN 2 WHEN 'UI' THEN 3 WHEN 'BA' THEN 4
            WHEN 'PM' THEN 5 WHEN 'Support' THEN 6 WHEN 'Synergy' THEN 7 WHEN 'UX' THEN 8
            WHEN 'Execs' THEN 9 WHEN 'Delivery' THEN 10 WHEN 'Functional Consultant - MS Dynamics 365' THEN 11
            ELSE NULL
        END WHERE "new_track" IS NOT NULL AND "new_track_id" IS NULL;

        -- Step 9: Drop old designation_history columns
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'previous_track') THEN
                ALTER TABLE "designation_history" DROP COLUMN "previous_track";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'new_track') THEN
                ALTER TABLE "designation_history" DROP COLUMN "new_track";
            END IF;
        END $$;

        -- Step 10: Drop old indexes
        DROP INDEX IF EXISTS "idx_employees_track";
        DROP INDEX IF EXISTS "idx_employees_tier";
        DROP INDEX IF EXISTS "idx_employees_tech_stack";
        DROP INDEX IF EXISTS "idx_employees_active_list";

        -- Step 11: Recreate composite index with new column names
        CREATE INDEX IF NOT EXISTS "idx_employees_active_list" ON "employees" ("status", "track_id", "designation_id") WHERE "deleted_at" IS NULL;
    `
};

/**
 * Run migrations using Drizzle migrate
 * This looks for migrations in the /drizzle folder
 * 
 * Migration Strategy:
 * - For fresh databases: Run all migrations from scratch
 * - For existing databases: Mark baseline as applied then run pending migrations
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

        // Ensure migration tracking table exists (same format as Drizzle)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
                id SERIAL PRIMARY KEY,
                hash text NOT NULL,
                created_at bigint
            );
        `);

        // Get already applied migrations
        const appliedMigrations = await client.query(`
            SELECT hash FROM "__drizzle_migrations" ORDER BY id
        `);
        const appliedHashes = new Set(appliedMigrations.rows.map(r => r.hash));
        log.info('Applied migrations', { count: appliedHashes.size, hashes: [...appliedHashes] });

        if (isExistingDb && !appliedHashes.has('0000_lean_puma')) {
            // Existing database without baseline tracking - mark baseline as applied
            // This prevents Drizzle from trying to run the initial migration
            await client.query(`
                INSERT INTO "__drizzle_migrations" (hash, created_at)
                VALUES ('0000_lean_puma', $1)
            `, [Date.now()]);
            appliedHashes.add('0000_lean_puma');
            log.info('Baseline migration marked as applied for existing database');
        }

        // Run Drizzle migrations - it checks __drizzle_migrations table
        // and skips already applied migrations
        log.info('Running Drizzle migrations');
        try {
            await migrate(drizzleDb, { migrationsFolder: './drizzle' });
            log.info('Drizzle migrations completed');
        } catch (migrationError) {
            // Check if error is "already exists" type - means schema is already up to date
            if (migrationError.message?.includes('already exists')) {
                log.warn('Migration skipped - schema objects already exist', { error: migrationError.message });
            } else {
                throw migrationError;
            }
        }

        // Run custom migrations that weren't handled by Drizzle
        const customMigrationsApplied = [];
        for (const [migrationName, migrationSql] of Object.entries(CUSTOM_MIGRATIONS)) {
            if (!appliedHashes.has(migrationName)) {
                log.info(`Running custom migration: ${migrationName}`);
                try {
                    await client.query(migrationSql);
                    await client.query(`
                        INSERT INTO "__drizzle_migrations" (hash, created_at)
                        VALUES ($1, $2)
                    `, [migrationName, Date.now()]);
                    customMigrationsApplied.push(migrationName);
                    log.info(`Custom migration ${migrationName} completed successfully`);
                } catch (customMigrationError) {
                    log.error(`Custom migration ${migrationName} failed`, { error: customMigrationError.message });
                    throw customMigrationError;
                }
            } else {
                log.info(`Custom migration ${migrationName} already applied, skipping`);
            }
        }

        // Seed default data (uses raw SQL now)
        await seedDefaults(client);

        // Get final migration status
        const finalMigrations = await client.query(`
            SELECT hash FROM "__drizzle_migrations" ORDER BY id
        `);

        return success({
            message: 'Migration completed successfully',
            timestamp: new Date().toISOString(),
            existingDb: isExistingDb,
            migrationsApplied: finalMigrations.rows.map(r => r.hash),
            customMigrationsApplied
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
