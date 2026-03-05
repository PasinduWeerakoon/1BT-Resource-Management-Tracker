/**
 * Database Migration Handler - File-based SQL Migration System
 * 
 * This module provides a proper SQL migration system that:
 * - Loads SQL files from migrations/ and seeds/ directories
 * - Runs migrations in order based on filename prefix (001_, 002_, etc.)
 * - Tracks executed migrations in schema_migrations table
 * - Supports seeders that run after migrations
 * 
 * Directory Structure:
 * - migrations/*.sql - Database schema migrations (run once, tracked)
 * - seeds/*.sql - Seed data (can be re-run, uses ON CONFLICT)
 */

import { createHash } from 'crypto';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '../../migrations');
const SEEDS_DIR = join(__dirname, '../../seeds');

// ============================================================================
// FILE LOADING FUNCTIONS
// ============================================================================

/**
 * Load all SQL files from a directory, sorted by filename
 */
const loadSqlFiles = (dirPath, type = 'migration') => {
    const log = logger.child({ function: 'loadSqlFiles', type, dirPath });

    if (!existsSync(dirPath)) {
        log.warn(`Directory does not exist: ${dirPath}`);
        return {};
    }

    const files = readdirSync(dirPath)
        .filter(f => f.endsWith('.sql'))
        .sort();

    const sqlMap = {};
    for (const file of files) {
        const key = file.replace('.sql', '');
        try {
            const filePath = join(dirPath, file);
            sqlMap[key] = readFileSync(filePath, 'utf8');
            log.debug(`Loaded ${type}: ${key}`);
        } catch (err) {
            log.error(`Failed to load ${type} file: ${file}`, { error: err.message });
        }
    }

    log.info(`Loaded ${Object.keys(sqlMap).length} ${type} files`);
    return sqlMap;
};

/**
 * Load migrations from SQL files
 */
const loadMigrations = () => loadSqlFiles(MIGRATIONS_DIR, 'migration');

/**
 * Load seeds from SQL files
 */
const loadSeeds = () => loadSqlFiles(SEEDS_DIR, 'seed');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate checksum for SQL content
 */
const calculateChecksum = (sql) => {
    return createHash('sha256').update(sql).digest('hex').substring(0, 64);
};

/**
 * Ensure schema_migrations table exists
 */
const ensureMigrationTable = async (client) => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            version VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            checksum VARCHAR(64),
            execution_time_ms INTEGER,
            success BOOLEAN NOT NULL DEFAULT true
        );
    `);
};

/**
 * Get list of already executed migrations
 */
const getExecutedMigrations = async (client) => {
    const result = await client.query(`
        SELECT version FROM schema_migrations WHERE success = true ORDER BY version
    `);
    return new Set(result.rows.map(r => r.version));
};

/**
 * Record a migration as executed
 */
const recordMigration = async (client, version, name, checksum, executionTimeMs, success) => {
    await client.query(`
        INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (version) DO UPDATE SET
            checksum = EXCLUDED.checksum,
            execution_time_ms = EXCLUDED.execution_time_ms,
            success = EXCLUDED.success,
            executed_at = NOW()
    `, [version, name, checksum, executionTimeMs, success]);
};

// ============================================================================
// MAIN HANDLERS
// ============================================================================

/**
 * Run all pending migrations
 */
export const up = async (event) => {
    const log = logger.child({ handler: 'migrations.up' });
    log.info('Starting database migrations');

    const client = await db.getClient();
    const results = {
        migrations: [],
        seeds: [],
        errors: []
    };

    try {
        // Load migrations and seeds from files
        const MIGRATIONS = loadMigrations();
        const SEEDS = loadSeeds();

        log.info('Loaded migration files', {
            migrationsCount: Object.keys(MIGRATIONS).length,
            seedsCount: Object.keys(SEEDS).length
        });

        // Ensure migration tracking table exists
        await ensureMigrationTable(client);

        // Get executed migrations
        const executedMigrations = await getExecutedMigrations(client);
        log.info('Already executed migrations', { count: executedMigrations.size });

        // Sort migrations by version number
        const migrationKeys = Object.keys(MIGRATIONS).sort();

        // Run pending migrations
        for (const key of migrationKeys) {
            if (executedMigrations.has(key)) {
                log.info('Skipping already executed migration', { migration: key });
                results.migrations.push({ version: key, status: 'skipped' });
                continue;
            }

            const sql = MIGRATIONS[key];
            const checksum = calculateChecksum(sql);
            const startTime = Date.now();

            log.info('Running migration', { migration: key });

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('COMMIT');

                const executionTime = Date.now() - startTime;
                await recordMigration(client, key, key, checksum, executionTime, true);

                results.migrations.push({ version: key, status: 'success', executionTimeMs: executionTime });
                log.info('Migration completed', { migration: key, executionTimeMs: executionTime });
            } catch (err) {
                await client.query('ROLLBACK');
                await recordMigration(client, key, key, checksum, Date.now() - startTime, false);

                results.migrations.push({ version: key, status: 'failed', error: err.message });
                results.errors.push({ migration: key, error: err.message });
                log.error('Migration failed', { migration: key, error: err.message });

                // Stop on first error
                throw err;
            }
        }

        // Run seeds after all migrations
        log.info('Running seeds');
        const seedKeys = Object.keys(SEEDS).sort();

        for (const key of seedKeys) {
            const sql = SEEDS[key];
            log.info('Running seed', { seed: key });

            try {
                await client.query(sql);
                results.seeds.push({ name: key, status: 'success' });
                log.info('Seed completed', { seed: key });
            } catch (err) {
                results.seeds.push({ name: key, status: 'failed', error: err.message });
                log.warn('Seed failed (non-fatal)', { seed: key, error: err.message });
            }
        }

        return success({
            message: 'Migrations completed successfully',
            results
        });

    } catch (err) {
        log.error('Migration process failed', { error: err.message, stack: err.stack });
        return error(err.message, 500, { results });
    } finally {
        client.release();
    }
};

/**
 * Get migration status
 */
export const status = async (event) => {
    const log = logger.child({ handler: 'migrations.status' });
    log.info('Checking migration status');

    const client = await db.getClient();

    try {
        const hirun = await client.query(`SELECT id, name, total_allocation, total_resource_billing FROM employees WHERE emp_no = 'LE00566'`);
        const hirunAllocs = await client.query(`SELECT a.id, a.project_id, a.allocation_percentage, a.allocated_date, a.deallocated_date, a.is_active, p.project_name FROM allocations a JOIN projects p ON a.project_id = p.id WHERE a.employee_id = (SELECT id FROM employees WHERE emp_no = 'LE00566' LIMIT 1)`);
        const sumAllocs = await client.query(`
            SELECT COALESCE(SUM(a.allocation_percentage), 0) as total
            FROM allocations a
            JOIN projects p ON a.project_id = p.id
            WHERE a.employee_id = (SELECT id FROM employees WHERE emp_no = 'LE00566' LIMIT 1)
            AND a.is_active = true
            AND a.deleted_at IS NULL
            AND p.is_bench_project = false
        `);

        return success({
            hirun: hirun.rows,
            hirunAllocs: hirunAllocs.rows,
            sumAllocs: sumAllocs.rows
        });
        // Load migrations from files
        const MIGRATIONS = loadMigrations();

        await ensureMigrationTable(client);

        const result = await client.query(`
            SELECT version, name, executed_at, checksum, execution_time_ms, success
            FROM schema_migrations
            ORDER BY version
        `);

        const executedMigrations = new Set(result.rows.filter(r => r.success).map(r => r.version));
        const allMigrations = Object.keys(MIGRATIONS).sort();

        const pending = allMigrations.filter(m => !executedMigrations.has(m));
        const completed = result.rows.filter(r => r.success);
        const failed = result.rows.filter(r => !r.success);

        return success({
            status: pending.length === 0 ? 'up-to-date' : 'pending',
            totalMigrations: allMigrations.length,
            completedCount: completed.length,
            pendingCount: pending.length,
            failedCount: failed.length,
            completed: completed.map(m => ({
                version: m.version,
                executedAt: m.executed_at,
                executionTimeMs: m.execution_time_ms
            })),
            pending,
            failed: failed.map(m => ({
                version: m.version,
                executedAt: m.executed_at
            }))
        });

    } catch (err) {
        log.error('Error checking migration status', { error: err.message });
        return error(err.message, 500);
    } finally {
        client.release();
    }
};

/**
 * Reset database (DANGER - drops all tables)
 */
export const reset = async (event) => {
    const log = logger.child({ handler: 'migrations.reset' });

    // Safety check - require explicit confirmation
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (body?.confirm !== 'RESET_DATABASE') {
        return error('Database reset requires confirmation. Send { "confirm": "RESET_DATABASE" }', 400);
    }

    log.warn('RESETTING DATABASE - Dropping all tables');

    const client = await db.getClient();

    try {
        // Drop all tables in reverse order of dependencies
        const dropStatements = [
            'DROP TABLE IF EXISTS dashboard_stats CASCADE',
            'DROP TABLE IF EXISTS audit_logs CASCADE',
            'DROP TABLE IF EXISTS permissions CASCADE',
            'DROP TABLE IF EXISTS schema_migrations CASCADE',
            'DROP TABLE IF EXISTS designation_history CASCADE',
            'DROP TABLE IF EXISTS allocation_history_archive CASCADE',
            'DROP TABLE IF EXISTS allocation_history CASCADE',
            'DROP TABLE IF EXISTS future_allocations CASCADE',
            'DROP TABLE IF EXISTS allocations CASCADE',
            'DROP TABLE IF EXISTS projects CASCADE',
            'DROP TABLE IF EXISTS clients CASCADE',
            'DROP TABLE IF EXISTS employee_tags CASCADE',
            'DROP TABLE IF EXISTS users CASCADE',
            'DROP TABLE IF EXISTS employees CASCADE',
            'DROP TABLE IF EXISTS tags CASCADE',
            'DROP TABLE IF EXISTS universities CASCADE',
            'DROP TABLE IF EXISTS employee_types CASCADE',
            'DROP TABLE IF EXISTS project_types CASCADE',
            'DROP TABLE IF EXISTS billing_statuses CASCADE',
            'DROP TABLE IF EXISTS designations CASCADE',
            'DROP TYPE IF EXISTS audit_action CASCADE',
            'DROP TYPE IF EXISTS allocation_change_type CASCADE',
            'DROP TYPE IF EXISTS change_type CASCADE',
            'DROP TYPE IF EXISTS account_type CASCADE',
            'DROP TYPE IF EXISTS project_status CASCADE',
            'DROP TYPE IF EXISTS employee_status CASCADE',
            'DROP TYPE IF EXISTS user_status CASCADE',
            'DROP TYPE IF EXISTS user_role CASCADE'
        ];

        for (const stmt of dropStatements) {
            try {
                await client.query(stmt);
            } catch (err) {
                log.warn('Drop statement warning', { statement: stmt, error: err.message });
            }
        }

        log.info('Database reset complete');
        return success({ message: 'Database reset complete. Run migrations to recreate schema.' });

    } catch (err) {
        log.error('Database reset failed', { error: err.message });
        return error(err.message, 500);
    } finally {
        client.release();
    }
};

/**
 * Run only seeders (useful for refreshing seed data)
 */
export const seed = async (event) => {
    const log = logger.child({ handler: 'migrations.seed' });
    log.info('Running seeders');

    const client = await db.getClient();
    const results = [];

    try {
        // Load seeds from files
        const SEEDS = loadSeeds();
        const seedKeys = Object.keys(SEEDS).sort();

        log.info('Loaded seed files', { count: seedKeys.length });

        for (const key of seedKeys) {
            const sql = SEEDS[key];
            log.info('Running seed', { seed: key });

            try {
                await client.query(sql);
                results.push({ name: key, status: 'success' });
                log.info('Seed completed', { seed: key });
            } catch (err) {
                results.push({ name: key, status: 'failed', error: err.message });
                log.warn('Seed failed', { seed: key, error: err.message });
            }
        }

        return success({
            message: 'Seeding completed',
            results
        });

    } catch (err) {
        log.error('Seeding failed', { error: err.message });
        return error(err.message, 500);
    } finally {
        client.release();
    }
};

export default { up, status, reset, seed };
