/**
 * Database Migration Lambda - Direct SQL Execution
 * Runs SQL migration files directly for reliability
 */

const { Pool } = require('pg');

// Get database connection from environment
const getDbConfig = () => ({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
});

// Migration SQL statements
const MIGRATIONS = {
    '001_initial_schema': `
    -- Extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Enum Types
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('Super User', 'Admin', 'Lead', 'User');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE resource_status AS ENUM ('Active', 'Bench', 'Resigned', 'Terminated');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE project_status AS ENUM ('Active', 'Completed', 'On Hold', 'Cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE project_type AS ENUM ('Internal', 'External');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE allocation_status AS ENUM ('Active', 'Completed', 'Cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Locked');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- Update timestamp function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Tracks Table
    CREATE TABLE IF NOT EXISTS tracks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Designations Table
    CREATE TABLE IF NOT EXISTS designations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
      is_intern_role BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Resources (Employees) Table
    CREATE TABLE IF NOT EXISTS resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      mobile VARCHAR(20),
      nic VARCHAR(20) UNIQUE,
      designation_id UUID NOT NULL REFERENCES designations(id),
      track_id UUID NOT NULL REFERENCES tracks(id),
      join_date DATE NOT NULL,
      status resource_status DEFAULT 'Active',
      is_intern BOOLEAN DEFAULT false,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      created_by UUID,
      updated_by UUID
    );

    CREATE INDEX IF NOT EXISTS idx_resources_track ON resources(track_id);
    CREATE INDEX IF NOT EXISTS idx_resources_designation ON resources(designation_id);
    CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role user_role DEFAULT 'User',
      resource_id UUID UNIQUE REFERENCES resources(id) ON DELETE SET NULL,
      status user_status DEFAULT 'Active',
      last_login TIMESTAMP,
      failed_login_attempts INTEGER DEFAULT 0,
      must_change_password BOOLEAN DEFAULT false,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      created_by UUID,
      updated_by UUID
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE deleted_at IS NULL;

    -- Triggers
    DROP TRIGGER IF EXISTS tracks_updated_at ON tracks;
    CREATE TRIGGER tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS designations_updated_at ON designations;
    CREATE TRIGGER designations_updated_at BEFORE UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS resources_updated_at ON resources;
    CREATE TRIGGER resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS users_updated_at ON users;
    CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `,

    '002_clients_projects_allocations': `
    -- Clients Table
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_name VARCHAR(100) NOT NULL UNIQUE,
      contact_person VARCHAR(100),
      contact_email VARCHAR(100),
      contact_phone VARCHAR(20),
      address TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      created_by UUID,
      updated_by UUID
    );

    -- Projects Table
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_name VARCHAR(100) NOT NULL,
      client_id UUID REFERENCES clients(id),
      project_type project_type DEFAULT 'Internal',
      is_billable BOOLEAN DEFAULT true,
      status project_status DEFAULT 'Active',
      start_date DATE,
      end_date DATE,
      description TEXT,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      created_by UUID,
      updated_by UUID
    );

    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

    -- Allocations Table
    CREATE TABLE IF NOT EXISTS allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      allocation_percentage INTEGER NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
      start_date DATE NOT NULL,
      end_date DATE,
      status allocation_status DEFAULT 'Active',
      notes TEXT,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by UUID,
      updated_by UUID
    );

    CREATE INDEX IF NOT EXISTS idx_allocations_resource ON allocations(resource_id);
    CREATE INDEX IF NOT EXISTS idx_allocations_project ON allocations(project_id);

    -- Allocation History Table
    CREATE TABLE IF NOT EXISTS allocation_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      allocation_id UUID NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL,
      project_id UUID NOT NULL,
      allocation_percentage INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      status allocation_status,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      changed_by UUID,
      change_type VARCHAR(20) NOT NULL
    );

    -- Designation History Table
    CREATE TABLE IF NOT EXISTS designation_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      designation_id UUID NOT NULL REFERENCES designations(id),
      effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by UUID
    );

    CREATE INDEX IF NOT EXISTS idx_designation_history_resource ON designation_history(resource_id);

    -- Permissions Table
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
      can_view BOOLEAN DEFAULT true,
      can_edit BOOLEAN DEFAULT false,
      can_delete BOOLEAN DEFAULT false,
      can_approve BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_user_track ON permissions(user_id, track_id);

    -- Triggers
    DROP TRIGGER IF EXISTS clients_updated_at ON clients;
    CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS projects_updated_at ON projects;
    CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS allocations_updated_at ON allocations;
    CREATE TRIGGER allocations_updated_at BEFORE UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Designation history trigger
    CREATE OR REPLACE FUNCTION capture_designation_history()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO designation_history (resource_id, designation_id, effective_date, created_by)
        VALUES (NEW.id, NEW.designation_id, NEW.join_date, NEW.created_by);
      ELSIF TG_OP = 'UPDATE' AND OLD.designation_id IS DISTINCT FROM NEW.designation_id THEN
        UPDATE designation_history 
        SET end_date = CURRENT_DATE 
        WHERE resource_id = NEW.id AND end_date IS NULL;
        
        INSERT INTO designation_history (resource_id, designation_id, effective_date, created_by)
        VALUES (NEW.id, NEW.designation_id, CURRENT_DATE, NEW.updated_by);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_designation_history ON resources;
    CREATE TRIGGER trg_designation_history
    AFTER INSERT OR UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION capture_designation_history();
  `,

    '003_seed_defaults': `
    -- Seed Tracks
    INSERT INTO tracks (name, description, is_active) VALUES
    ('FS', 'Full Stack Development', true),
    ('.Net', '.NET Development', true),
    ('DS', 'Data Science', true),
    ('UI/UX', 'UI/UX Design', true),
    ('QA', 'Quality Assurance', true),
    ('PM/BA', 'Project Management / Business Analysis', true)
    ON CONFLICT (name) DO NOTHING;

    -- Seed Designations
    INSERT INTO designations (name, level, is_intern_role, is_active) VALUES
    ('Intern - SE', 1, true, true),
    ('Associate Software Engineer', 2, false, true),
    ('Software Engineer', 3, false, true),
    ('Senior Software Engineer', 4, false, true),
    ('Associate Technical Lead', 5, false, true),
    ('Technical Lead', 6, false, true),
    ('Senior Technical Lead', 7, false, true),
    ('Architect', 8, false, true),
    ('Intern - QA', 1, true, true),
    ('Associate QA Engineer', 2, false, true),
    ('QA Engineer', 3, false, true),
    ('Senior QA Engineer', 4, false, true),
    ('QA Lead', 6, false, true),
    ('Intern - PM', 1, true, true),
    ('Associate Business Analyst', 2, false, true),
    ('Business Analyst', 3, false, true),
    ('Senior Business Analyst', 4, false, true),
    ('Project Manager', 5, false, true),
    ('Senior Project Manager', 6, false, true),
    ('Intern - UI/UX', 1, true, true),
    ('UI/UX Designer', 3, false, true),
    ('Senior UI/UX Designer', 4, false, true),
    ('Lead UI/UX Designer', 5, false, true)
    ON CONFLICT (name) DO NOTHING;

    -- Seed Super Admin User (password: Admin@123456)
    INSERT INTO users (username, email, password_hash, role, status, must_change_password) VALUES
    ('superadmin', 'admin@1bt.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4YjKmKCDLNIKQoiG', 'Super User', 'Active', true)
    ON CONFLICT (email) DO NOTHING;
  `
};

// Create migrations tracking table if not exists
const ensureMigrationsTable = async (pool) => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS pgmigrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Get list of already run migrations
const getRunMigrations = async (pool) => {
    const result = await pool.query('SELECT name FROM pgmigrations ORDER BY id');
    return result.rows.map(row => row.name);
};

// Record migration as complete
const recordMigration = async (pool, name) => {
    await pool.query('INSERT INTO pgmigrations (name) VALUES ($1)', [name]);
};

// Main migration handler
exports.handler = async (event) => {
    console.log('Starting database migrations...');
    console.log('Database host:', process.env.DATABASE_HOST);

    const pool = new Pool(getDbConfig());

    try {
        // Test connection
        const client = await pool.connect();
        console.log('Connected to database successfully');
        client.release();

        // Ensure migrations table exists
        await ensureMigrationsTable(pool);

        // Get already run migrations
        const runMigrations = await getRunMigrations(pool);
        console.log('Already run migrations:', runMigrations);

        // Run pending migrations
        const results = [];
        const migrationOrder = ['001_initial_schema', '002_clients_projects_allocations', '003_seed_defaults'];

        for (const migrationName of migrationOrder) {
            if (runMigrations.includes(migrationName)) {
                console.log(`Skipping ${migrationName} (already run)`);
                results.push({ name: migrationName, status: 'skipped' });
                continue;
            }

            console.log(`Running migration: ${migrationName}`);

            try {
                const sql = MIGRATIONS[migrationName];
                await pool.query(sql);
                await recordMigration(pool, migrationName);

                console.log(`Migration ${migrationName} completed successfully`);
                results.push({ name: migrationName, status: 'success' });

            } catch (error) {
                console.error(`Migration ${migrationName} failed:`, error);
                results.push({ name: migrationName, status: 'failed', error: error.message });
                throw error;
            }
        }

        console.log('All migrations completed');

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Migrations completed successfully',
                results
            })
        };

    } catch (error) {
        console.error('Migration error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Migration failed',
                error: error.message
            })
        };

    } finally {
        await pool.end();
    }
};
