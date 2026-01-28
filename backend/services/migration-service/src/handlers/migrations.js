/**
 * Database Migration Handler
 * Lambda functions for running database migrations securely
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

// Migration definitions (inline to avoid file system complexity in Lambda)
const migrations = [
    {
        id: '001_initial_schema',
        name: 'Initial Schema - Extensions, Enums, Base Tables',
        up: async (client) => {
            // Extensions
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

            // Create types if they don't exist
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE user_role AS ENUM ('Super User', 'Admin', 'User');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Suspended', 'Pending');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE resource_status AS ENUM ('Active', 'Inactive', 'Serving Notice Period', 'On Leave');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE project_status AS ENUM ('Active', 'Inactive', 'Completed', 'On Hold');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE project_type AS ENUM ('Client', 'Bench', 'Training', 'POC', 'Presale', 'Research');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE account_type AS ENUM ('Internal', 'External');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE billing_status AS ENUM ('Billing', 'Non-Billing');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE change_type AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);

            // Updated_at trigger function
            await client.query(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `);

            // Tracks table
            await client.query(`
                CREATE TABLE IF NOT EXISTS tracks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID
                )
            `);

            // Designations table
            await client.query(`
                CREATE TABLE IF NOT EXISTS designations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(50) NOT NULL UNIQUE,
                    level INTEGER,
                    is_intern_role BOOLEAN DEFAULT false,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID
                )
            `);

            // Resources table (employees)
            await client.query(`
                CREATE TABLE IF NOT EXISTS resources (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    employee_id VARCHAR(20) NOT NULL,
                    employee_number VARCHAR(20) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    phone_number VARCHAR(100) NOT NULL,
                    email VARCHAR(100),
                    address VARCHAR(500),
                    designation_id UUID NOT NULL REFERENCES designations(id),
                    track_id UUID NOT NULL REFERENCES tracks(id),
                    intern_classification VARCHAR(20),
                    skills TEXT[] DEFAULT '{}',
                    date_of_joining DATE,
                    status resource_status NOT NULL DEFAULT 'Active',
                    notice_period_end_date DATE,
                    deleted_at TIMESTAMPTZ,
                    version INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID NOT NULL,
                    updated_by UUID
                )
            `);

            // Partial unique indexes for soft delete
            await client.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS resources_employee_id_unique 
                ON resources(employee_id) WHERE deleted_at IS NULL
            `);
            await client.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS resources_employee_number_unique 
                ON resources(employee_number) WHERE deleted_at IS NULL
            `);

            // Users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    cognito_user_id VARCHAR(100) NOT NULL UNIQUE,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    role user_role NOT NULL DEFAULT 'User',
                    status user_status NOT NULL DEFAULT 'Active',
                    resource_id UUID REFERENCES resources(id),
                    last_login_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Resource change history
            await client.query(`
                CREATE TABLE IF NOT EXISTS resource_change_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    resource_id UUID NOT NULL,
                    change_type change_type NOT NULL,
                    changed_fields JSONB,
                    old_values JSONB,
                    new_values JSONB,
                    changed_by UUID NOT NULL,
                    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
            `);

            // Designation change history
            await client.query(`
                CREATE TABLE IF NOT EXISTS designation_change_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    resource_id UUID NOT NULL REFERENCES resources(id),
                    old_designation_id UUID REFERENCES designations(id),
                    new_designation_id UUID REFERENCES designations(id),
                    effective_date DATE NOT NULL,
                    changed_by UUID NOT NULL,
                    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
            `);

            logger.info('Migration 001 completed: Initial schema created');
        }
    },
    {
        id: '002_clients_projects_allocations',
        name: 'Clients, Projects, and Allocations Tables',
        up: async (client) => {
            // Clients table
            await client.query(`
                CREATE TABLE IF NOT EXISTS clients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(100) NOT NULL UNIQUE,
                    contact_person VARCHAR(100),
                    contact_email VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    deleted_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID,
                    updated_by UUID
                )
            `);

            // Projects table
            await client.query(`
                CREATE TABLE IF NOT EXISTS projects (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(100) NOT NULL,
                    code VARCHAR(20) UNIQUE,
                    client_id UUID REFERENCES clients(id),
                    type project_type NOT NULL DEFAULT 'Client',
                    status project_status NOT NULL DEFAULT 'Active',
                    billing_status billing_status NOT NULL DEFAULT 'Billing',
                    start_date DATE,
                    end_date DATE,
                    account_manager_id UUID REFERENCES resources(id),
                    description TEXT,
                    deleted_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID,
                    updated_by UUID
                )
            `);

            // Allocations table
            await client.query(`
                CREATE TABLE IF NOT EXISTS allocations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    resource_id UUID NOT NULL REFERENCES resources(id),
                    project_id UUID NOT NULL REFERENCES projects(id),
                    allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
                    billing_percentage DECIMAL(5,2) DEFAULT 100 CHECK (billing_percentage >= 0 AND billing_percentage <= 100),
                    start_date DATE NOT NULL,
                    end_date DATE,
                    is_active BOOLEAN DEFAULT true,
                    notes TEXT,
                    deleted_at TIMESTAMPTZ,
                    version INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID NOT NULL,
                    updated_by UUID,
                    CONSTRAINT unique_active_allocation UNIQUE (resource_id, project_id, start_date)
                )
            `);

            // Allocation change history
            await client.query(`
                CREATE TABLE IF NOT EXISTS allocation_change_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    allocation_id UUID NOT NULL,
                    change_type change_type NOT NULL,
                    changed_fields JSONB,
                    old_values JSONB,
                    new_values JSONB,
                    changed_by UUID NOT NULL,
                    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
            `);

            // Indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_allocations_resource ON allocations(resource_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_allocations_project ON allocations(project_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_allocations_dates ON allocations(start_date, end_date)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id)');

            logger.info('Migration 002 completed: Clients, projects, allocations tables created');
        }
    },
    {
        id: '003_seed_defaults',
        name: 'Seed Default Data',
        up: async (client) => {
            // System user ID for automated operations
            const systemUserId = '00000000-0000-0000-0000-000000000000';

            // Default tracks
            const tracks = [
                { name: 'Engineering', description: 'Software Engineering track' },
                { name: 'QA', description: 'Quality Assurance track' },
                { name: 'DevOps', description: 'DevOps and Infrastructure track' },
                { name: 'Design', description: 'UI/UX Design track' },
                { name: 'Management', description: 'Project and Product Management' },
                { name: 'Data', description: 'Data Science and Analytics track' },
            ];


            for (const track of tracks) {
                await client.query(`
                    INSERT INTO tracks (name, description, created_by)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (name) DO NOTHING
                `, [track.name, track.description, systemUserId]);
            }

            // Default designations
            const designations = [
                { name: 'Intern', level: 1, is_intern_role: true },
                { name: 'Associate Software Engineer', level: 2, is_intern_role: false },
                { name: 'Software Engineer', level: 3, is_intern_role: false },
                { name: 'Senior Software Engineer', level: 4, is_intern_role: false },
                { name: 'Tech Lead', level: 5, is_intern_role: false },
                { name: 'Engineering Manager', level: 6, is_intern_role: false },
                { name: 'Associate QA Engineer', level: 2, is_intern_role: false },
                { name: 'QA Engineer', level: 3, is_intern_role: false },
                { name: 'Senior QA Engineer', level: 4, is_intern_role: false },
                { name: 'QA Lead', level: 5, is_intern_role: false },
            ];

            for (const designation of designations) {
                await client.query(`
                    INSERT INTO designations (name, level, is_intern_role, created_by)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (name) DO NOTHING
                `, [designation.name, designation.level, designation.is_intern_role, systemUserId]);
            }

            // Default Bench project
            await client.query(`
                INSERT INTO projects (name, code, type, status, billing_status, description, created_by)
                VALUES ('Bench', 'BENCH', 'Bench', 'Active', 'Non-Billing', 'Default bench project for unallocated resources', $1)
                ON CONFLICT (code) DO NOTHING
            `, [systemUserId]);

            logger.info('Migration 003 completed: Default data seeded');
        }
    },
    {
        id: '004_fix_schema_columns',
        name: 'Fix schema column names to match handlers',
        up: async (client) => {
            // Rename clients.name to clients.client_name to match handler expectations
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE clients RENAME COLUMN name TO client_name;
                EXCEPTION WHEN undefined_column THEN
                    NULL; -- Column doesn't exist or already renamed
                END $$;
            `);

            // Add missing columns to clients table
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE clients ADD COLUMN contact_phone VARCHAR(50);
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE clients ADD COLUMN address TEXT;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Add updated_at trigger to clients
            await client.query(`
                DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
                CREATE TRIGGER update_clients_updated_at
                    BEFORE UPDATE ON clients
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);

            // Add updated_at trigger to projects
            await client.query(`
                DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
                CREATE TRIGGER update_projects_updated_at
                    BEFORE UPDATE ON projects
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);

            // Add updated_at trigger to allocations
            await client.query(`
                DROP TRIGGER IF EXISTS update_allocations_updated_at ON allocations;
                CREATE TRIGGER update_allocations_updated_at
                    BEFORE UPDATE ON allocations
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);

            logger.info('Migration 004 completed: Schema columns fixed');
        }
    },
    {
        id: '005_fix_projects_schema',
        name: 'Fix projects table schema to match handlers',
        up: async (client) => {
            // Rename projects.name to projects.project_name
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE projects RENAME COLUMN name TO project_name;
                EXCEPTION WHEN undefined_column THEN NULL;
                END $$;
            `);

            // Rename projects.type to projects.project_type
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE projects RENAME COLUMN type TO project_type;
                EXCEPTION WHEN undefined_column THEN NULL;
                END $$;
            `);

            // Rename projects.code to projects.project_code
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE projects RENAME COLUMN code TO project_code;
                EXCEPTION WHEN undefined_column THEN NULL;
                END $$;
            `);

            // Add is_billable column (derived from billing_status)
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE projects ADD COLUMN is_billable BOOLEAN DEFAULT true;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Update is_billable based on billing_status
            await client.query(`
                UPDATE projects SET is_billable = (billing_status = 'Billing');
            `);

            logger.info('Migration 005 completed: Projects schema fixed');
        }
    },
    {
        id: '006_audit_logs',
        name: 'Audit Logs Table - Industry-grade audit trail',
        up: async (client) => {
            // Create audit_action enum type
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE audit_action AS ENUM (
                        'CREATE', 'READ', 'UPDATE', 'DELETE',
                        'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
                        'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE'
                    );
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);

            // Create audit_logs table
            await client.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    user_id UUID,
                    user_email VARCHAR(255),
                    user_name VARCHAR(255),
                    action audit_action NOT NULL,
                    entity_type VARCHAR(100) NOT NULL,
                    entity_id VARCHAR(255),
                    entity_name VARCHAR(500),
                    old_values JSONB,
                    new_values JSONB,
                    changed_fields TEXT[],
                    ip_address INET,
                    user_agent TEXT,
                    request_id VARCHAR(100),
                    service_name VARCHAR(50),
                    api_endpoint VARCHAR(500),
                    metadata JSONB,
                    message_id VARCHAR(100) UNIQUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create indexes for common queries
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_dashboard ON audit_logs(timestamp DESC, action, entity_type);
            `);

            // Create GIN index on metadata for JSONB queries
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN (metadata);
            `);

            logger.info('Migration 006 completed: Audit logs table created');
        }
    },
    {
        id: '007_account_manager_fields',
        name: 'Add account manager fields and tier system',
        up: async (client) => {
            // Add is_account_manager flag to resources
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN is_account_manager BOOLEAN DEFAULT false;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Add tier column to resources for tier tracking (Synergy, Tier-1, Tier-2, etc.)
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN tier VARCHAR(20);
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Add tech_stack column to resources for Full Stack, .NET, etc.
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN tech_stack VARCHAR(50);
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Create index on is_account_manager for faster queries
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_resources_account_manager 
                ON resources(is_account_manager) WHERE is_account_manager = true;
            `);

            // Create index on tier
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_resources_tier ON resources(tier);
            `);

            // Create index on tech_stack
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_resources_tech_stack ON resources(tech_stack);
            `);

            logger.info('Migration 007 completed: Account manager fields and tier system added');
        }
    },
    {
        id: '008_employee_additional_fields',
        name: 'Add date of birth, NIC/passport, is_intern, and photo fields',
        up: async (client) => {
            // Add date_of_birth column
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN date_of_birth DATE;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Add nic_passport column for NIC or Passport number
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN nic_passport VARCHAR(50);
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Add is_intern boolean column
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN is_intern BOOLEAN DEFAULT false;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Add photo_url column for employee photo
            await client.query(`
                DO $$ BEGIN
                    ALTER TABLE resources ADD COLUMN photo_url VARCHAR(500);
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            `);

            // Create index on is_intern for filtering
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_resources_is_intern 
                ON resources(is_intern) WHERE is_intern = true;
            `);

            logger.info('Migration 008 completed: Employee additional fields added');
        }
    },
    {
        id: '009_tiers_table',
        name: 'Create tiers lookup table',
        up: async (client) => {
            // Create tiers table
            await client.query(`
                CREATE TABLE IF NOT EXISTS tiers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT,
                    level INTEGER,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_by UUID
                )
            `);

            // Create updated_at trigger for tiers
            await client.query(`
                DROP TRIGGER IF EXISTS update_tiers_updated_at ON tiers;
                CREATE TRIGGER update_tiers_updated_at
                    BEFORE UPDATE ON tiers
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);

            // Seed default tiers
            await client.query(`
                INSERT INTO tiers (name, level, description) VALUES
                    ('Synergy', 1, 'Synergy tier'),
                    ('Tier - 1', 2, 'Tier 1'),
                    ('Tier - 2', 3, 'Tier 2'),
                    ('Tier - 3', 4, 'Tier 3'),
                    ('Tier - 4', 5, 'Tier 4'),
                    ('Intern', 6, 'Intern tier')
                ON CONFLICT (name) DO NOTHING;
            `);

            // Create index on level for sorting
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_tiers_level ON tiers(level);
            `);

            // Create index on is_active for filtering
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_tiers_active ON tiers(is_active);
            `);

            logger.info('Migration 009 completed: Tiers table created');
        }
    },
    {
        id: '010_bench_project',
        name: 'Create Bench project and internal projects for auto-allocation',
        up: async (client) => {
            // Add is_bench_project column to projects table
            await client.query(`
                ALTER TABLE projects 
                ADD COLUMN IF NOT EXISTS is_bench_project BOOLEAN NOT NULL DEFAULT false;
            `);

            // Get super admin user ID for created_by
            const userResult = await client.query(
                "SELECT id FROM users WHERE email = 'hirun.dealwis@1billiontech.com' LIMIT 1"
            );
            const userId = userResult.rows.length > 0 ? userResult.rows[0].id : '00000000-0000-0000-0000-000000000000';

            // Check if Bench project exists by code
            const benchExists = await client.query("SELECT id FROM projects WHERE project_code = 'BENCH'");

            if (benchExists.rows.length > 0) {
                // Update existing Bench project
                await client.query(`
                    UPDATE projects SET is_bench_project = true WHERE project_code = 'BENCH'
                `);
                logger.info('Updated existing Bench project with is_bench_project flag');
            } else {
                // Insert new Bench project
                await client.query(`
                    INSERT INTO projects (
                        project_name, project_code, project_type, billing_status,
                        status, description, is_bench_project, created_by
                    ) VALUES (
                        'Bench', 'BENCH', 'Bench', 'Non-Billing',
                        'Active',
                        'Default bench allocation for unassigned resources. Resources are automatically allocated 100% to Bench when created.',
                        true, $1
                    )
                `, [userId]);
                logger.info('Created new Bench project');
            }

            // Check and insert Pre-Sales project
            const presalesExists = await client.query("SELECT id FROM projects WHERE project_code = 'PRESALES'");
            if (presalesExists.rows.length === 0) {
                await client.query(`
                    INSERT INTO projects (
                        project_name, project_code, project_type, billing_status,
                        status, description, created_by
                    ) VALUES (
                        'Pre-Sales', 'PRESALES', 'Presale', 'Non-Billing',
                        'Active',
                        'Pre-sales activities including demos, proposals, and client presentations',
                        $1
                    )
                `, [userId]);
            }

            // Check and insert Training project
            const trainingExists = await client.query("SELECT id FROM projects WHERE project_code = 'TRAINING'");
            if (trainingExists.rows.length === 0) {
                await client.query(`
                    INSERT INTO projects (
                        project_name, project_code, project_type, billing_status,
                        status, description, created_by
                    ) VALUES (
                        'Training', 'TRAINING', 'Training', 'Non-Billing',
                        'Active',
                        'Training and skill development activities',
                        $1
                    )
                `, [userId]);
            }

            // Create index on is_bench_project
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_projects_bench 
                ON projects(is_bench_project) WHERE is_bench_project = true;
            `);

            logger.info('Migration 010 completed: Bench and internal projects created');
        }
    }
];

// Migration tracking table
const ensureMigrationTable = async (client) => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_id VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(255),
            executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const getExecutedMigrations = async (client) => {
    const result = await client.query('SELECT migration_id FROM schema_migrations ORDER BY id');
    return result.rows.map(row => row.migration_id);
};

const recordMigration = async (client, migrationId, name) => {
    await client.query(
        'INSERT INTO schema_migrations (migration_id, name) VALUES ($1, $2)',
        [migrationId, name]
    );
};

const removeMigrationRecord = async (client, migrationId) => {
    await client.query('DELETE FROM schema_migrations WHERE migration_id = $1', [migrationId]);
};

/**
 * Run pending migrations
 */
export const up = async (event) => {
    const log = logger.child({ handler: 'migrations.up' });
    log.info('Starting migration process');

    try {
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // Ensure migration tracking table exists
            await ensureMigrationTable(client);

            // Get already executed migrations
            const executed = await getExecutedMigrations(client);
            log.info('Already executed migrations', { count: executed.length, migrations: executed });

            // Run pending migrations
            const pending = migrations.filter(m => !executed.includes(m.id));
            log.info('Pending migrations', { count: pending.length, migrations: pending.map(m => m.id) });

            const results = [];
            for (const migration of pending) {
                log.info(`Running migration: ${migration.id} - ${migration.name}`);
                await migration.up(client);
                await recordMigration(client, migration.id, migration.name);
                results.push({ id: migration.id, name: migration.name, status: 'success' });
            }

            await client.query('COMMIT');
            log.info('All migrations completed successfully', { count: results.length });

            return success({
                message: `Successfully ran ${results.length} migration(s)`,
                migrations: results,
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        log.error('Migration failed', { error: err.message, stack: err.stack });
        return error(err.message, 500, 'MIGRATION_ERROR');
    }
};

/**
 * Rollback last migration
 */
export const down = async (event) => {
    const log = logger.child({ handler: 'migrations.down' });
    log.info('Starting rollback process');

    // Note: Rollback not implemented for safety
    // To rollback, manually connect to the database and revert changes
    return error(
        'Rollback not implemented. Please manually revert changes via bastion host.',
        501,
        'NOT_IMPLEMENTED'
    );
};

/**
 * Get migration status
 */
export const status = async (event) => {
    const log = logger.child({ handler: 'migrations.status' });

    try {
        const client = await db.getClient();

        try {
            // Ensure migration tracking table exists
            await ensureMigrationTable(client);

            const executed = await getExecutedMigrations(client);
            const pending = migrations.filter(m => !executed.includes(m.id));

            // Get detailed info
            const result = await client.query(`
                SELECT migration_id, name, executed_at 
                FROM schema_migrations 
                ORDER BY id
            `);

            return success({
                totalMigrations: migrations.length,
                executedCount: executed.length,
                pendingCount: pending.length,
                executed: result.rows,
                pending: pending.map(m => ({ id: m.id, name: m.name })),
            });
        } finally {
            client.release();
        }
    } catch (err) {
        log.error('Failed to get migration status', { error: err.message });
        return error(err.message, 500, 'STATUS_ERROR');
    }
};
