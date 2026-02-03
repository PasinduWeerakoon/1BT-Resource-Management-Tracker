/**
 * Database Migration Handler - SQL-based Migration System
 * 
 * This module provides a proper SQL migration system that:
 * - Runs migrations in order based on filename prefix (001_, 002_, etc.)
 * - Tracks executed migrations in schema_migrations table
 * - Supports seeders that run after migrations
 * - Uses INTEGER IDs for employees, users, projects, allocations, clients (faster lookups)
 * - Config-based fields (track_id, tier_id, tech_stack_id) map to /opt/nodejs/configs/index.js
 */

import { createHash } from 'crypto';
import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

// ============================================================================
// MIGRATION FILES - Embedded SQL (INTEGER IDs for all core tables)
// ============================================================================

const MIGRATIONS = {
    '001_create_enums': `-- Migration: 001_create_enums
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('Super User', 'Admin', 'User'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Suspended', 'Pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE employee_status AS ENUM ('Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE project_status AS ENUM ('Active', 'Inactive', 'Completed', 'On Hold'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_type AS ENUM ('Internal', 'External'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE change_type AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE allocation_change_type AS ENUM ('NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING', 'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT', 'LEGACY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit_action AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

    '002_create_lookup_tables': `-- Migration: 002_create_lookup_tables (DB-managed tables)
CREATE TABLE IF NOT EXISTS designations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    level SMALLINT NOT NULL DEFAULT 1,
    is_intern_role BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    display_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS billing_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    display_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS project_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    display_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS employee_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    short_name VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Sri Lanka',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_designations_active ON designations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_designations_level ON designations(level);
CREATE INDEX IF NOT EXISTS idx_designations_category ON designations(category);
CREATE INDEX IF NOT EXISTS idx_billing_statuses_active ON billing_statuses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_project_types_active ON project_types(is_active) WHERE is_active = true;`,

    '003_create_employees_users': `-- Migration: 003_create_employees_users (INTEGER IDs)
-- Config-based fields (track_id, tier_id, tech_stack_id) map to /opt/nodejs/configs/index.js - NOT DB tables
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    epf_no VARCHAR(20) NOT NULL,
    emp_no VARCHAR(20) NOT NULL,
    global_employee_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone_number VARCHAR(20),
    track_id INTEGER,
    tech_stack_id INTEGER,
    tier_id INTEGER,
    designation_id INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    employee_type_id INTEGER REFERENCES employee_types(id) ON DELETE SET NULL,
    university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
    joined_date DATE,
    date_of_birth DATE,
    last_increment_date DATE,
    last_promotion_date DATE,
    internship_completion_target_date DATE,
    notice_period_end_date DATE,
    nic_passport VARCHAR(50),
    is_external BOOLEAN NOT NULL DEFAULT false,
    status employee_status NOT NULL DEFAULT 'Active',
    total_allocation DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_resource_billing DECIMAL(5,2) NOT NULL DEFAULT 0,
    helper_id INTEGER,
    helper_is_external BOOLEAN NOT NULL DEFAULT false,
    skills TEXT[] DEFAULT '{}',
    is_account_manager BOOLEAN NOT NULL DEFAULT false,
    photo_url VARCHAR(500),
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_helper;
ALTER TABLE employees ADD CONSTRAINT fk_employees_helper FOREIGN KEY (helper_id) REFERENCES employees(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'User',
    employee_id INTEGER UNIQUE REFERENCES employees(id) ON DELETE SET NULL,
    failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    status user_status NOT NULL DEFAULT 'Pending',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER
);
CREATE TABLE IF NOT EXISTS employee_tags (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS employees_epf_no_unique ON employees(epf_no) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employees_emp_no_unique ON employees(emp_no) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique ON employees(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_track_id ON employees(track_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_designation ON employees(designation_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_tier_id ON employees(tier_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_tech_stack_id ON employees(tech_stack_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employee_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_allocation ON employees(total_allocation) WHERE status = 'Active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_account_manager ON employees(is_account_manager) WHERE is_account_manager = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_active_list ON employees(status, track_id, designation_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employee_tags_unique ON employee_tags(employee_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_employee_tags_employee ON employee_tags(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tags_tag ON employee_tags(tag_id);`,

    '004_create_clients_projects': `-- Migration: 004_create_clients_projects (INTEGER IDs)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL UNIQUE,
    client_code VARCHAR(20) UNIQUE,
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    address VARCHAR(500),
    billing_address VARCHAR(500),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    project_code VARCHAR(50),
    project_type_id INTEGER REFERENCES project_types(id) ON DELETE RESTRICT,
    account_type account_type NOT NULL,
    team_size SMALLINT NOT NULL DEFAULT 1,
    account_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    account_reg_sales_owner VARCHAR(100),
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_start_date DATE,
    project_end_date DATE,
    billing_status_id INTEGER REFERENCES billing_statuses(id) ON DELETE RESTRICT,
    budget DECIMAL(15,2),
    status project_status NOT NULL DEFAULT 'Active',
    description TEXT,
    is_bench_project BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_name_unique ON projects(project_name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_code_unique ON projects(project_code) WHERE deleted_at IS NULL AND project_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(account_manager_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_bench ON projects(is_bench_project) WHERE is_bench_project = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_billing ON projects(billing_status_id) WHERE deleted_at IS NULL;`,

    '005_create_allocations': `-- Migration: 005_create_allocations (INTEGER IDs)
CREATE TABLE IF NOT EXISTS allocations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    allocation_percentage SMALLINT NOT NULL,
    billing_percentage SMALLINT NOT NULL,
    billing_status_id INTEGER REFERENCES billing_statuses(id) ON DELETE RESTRICT,
    is_billable BOOLEAN NOT NULL DEFAULT true,
    is_critical_shadow BOOLEAN NOT NULL DEFAULT false,
    critical_shadow_percentage SMALLINT,
    allocated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deallocated_date DATE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    original_allocated_date DATE,
    allocation_changed_on TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    change_type allocation_change_type DEFAULT 'NEW_ALLOCATION',
    notes TEXT,
    source_future_id INTEGER,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS future_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    allocation_percentage SMALLINT NOT NULL,
    billing_percentage SMALLINT NOT NULL DEFAULT 100,
    effective_date DATE NOT NULL,
    allocated_date DATE NOT NULL,
    deallocated_date DATE,
    change_type allocation_change_type NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    linked_future_id INTEGER,
    target_allocation_id INTEGER REFERENCES allocations(id),
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS allocations_employee_project_unique ON allocations(employee_id, project_id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_allocations_employee ON allocations(employee_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_project ON allocations(project_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_effective ON allocations(effective_date);
CREATE INDEX IF NOT EXISTS idx_allocations_dates ON allocations(allocated_date, deallocated_date) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_totals ON allocations(employee_id, allocation_percentage, billing_percentage) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_future_alloc_employee ON future_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_future_alloc_project ON future_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_future_alloc_scheduled ON future_allocations(effective_date, status) WHERE status = 'scheduled';`,

    '006_create_history_tables': `-- Migration: 006_create_history_tables (INTEGER IDs)
CREATE TABLE IF NOT EXISTS allocation_history (
    id SERIAL PRIMARY KEY,
    allocation_id INTEGER,
    employee_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    allocation_percentage SMALLINT NOT NULL,
    billing_percentage SMALLINT NOT NULL,
    billing_status_id INTEGER REFERENCES billing_statuses(id),
    is_critical_shadow BOOLEAN DEFAULT false,
    critical_shadow_percentage SMALLINT,
    allocation_start_date DATE,
    allocation_end_date DATE,
    is_active BOOLEAN,
    notes TEXT,
    change_type VARCHAR(20) NOT NULL,
    change_reason TEXT,
    previous_values JSONB,
    changed_fields TEXT[],
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by INTEGER,
    changed_by_username VARCHAR(50),
    ip_address INET,
    user_agent TEXT
);
CREATE TABLE IF NOT EXISTS allocation_history_archive (
    id SERIAL PRIMARY KEY,
    original_allocation_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    allocation_percentage SMALLINT NOT NULL,
    billing_status_id INTEGER REFERENCES billing_statuses(id),
    is_billable BOOLEAN NOT NULL,
    effective_date DATE,
    allocated_date DATE NOT NULL,
    deallocated_date DATE,
    original_allocated_date DATE,
    change_type allocation_change_type,
    notes TEXT,
    original_created_by INTEGER,
    original_created_at TIMESTAMPTZ,
    original_updated_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archive_reason VARCHAR(50) NOT NULL,
    archived_by INTEGER
);
CREATE TABLE IF NOT EXISTS designation_history (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    previous_designation_id INTEGER REFERENCES designations(id),
    new_designation_id INTEGER NOT NULL REFERENCES designations(id),
    previous_track_id INTEGER,
    new_track_id INTEGER NOT NULL,
    change_type VARCHAR(30) NOT NULL,
    change_reason TEXT,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by INTEGER,
    changed_by_username VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS idx_alloc_history_employee ON allocation_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_alloc_history_project ON allocation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_alloc_history_allocation ON allocation_history(allocation_id);
CREATE INDEX IF NOT EXISTS idx_alloc_history_changed ON allocation_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_alloc_history_effective ON allocation_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_archive_employee ON allocation_history_archive(employee_id);
CREATE INDEX IF NOT EXISTS idx_archive_project ON allocation_history_archive(project_id);
CREATE INDEX IF NOT EXISTS idx_archive_archived_at ON allocation_history_archive(archived_at);
CREATE INDEX IF NOT EXISTS idx_designation_history_employee ON designation_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_designation_history_employee_date ON designation_history(employee_id, effective_from);`,

    '007_create_system_tables': `-- Migration: 007_create_system_tables
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_update BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id INTEGER,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    entity_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    service_name VARCHAR(50) NOT NULL,
    api_endpoint VARCHAR(255),
    metadata JSONB,
    message_id VARCHAR(100),
    processed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS permissions_user_module_unique ON permissions(user_id, module);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_composite ON audit_logs(timestamp, action, entity_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_message_id ON audit_logs(message_id) WHERE message_id IS NOT NULL;`,

    '008_create_dashboard_stats': `-- Migration: 008_create_dashboard_stats
-- Daily snapshot table for dashboard statistics (calculated at midnight)
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id SERIAL PRIMARY KEY,
    stats_date DATE NOT NULL,
    stats_type VARCHAR(50) NOT NULL, -- 'resource_counts', 'percentages', 'charts'
    
    -- Resource Counts (stored as JSONB for flexibility)
    resource_counts JSONB,
    
    -- Percentages
    percentages JSONB,
    
    -- Charts Data
    charts_data JSONB,
    
    -- Metadata
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculation_duration_ms INTEGER,
    source VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'manual', 'on_demand'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one record per date per stats_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_date_type ON dashboard_stats(stats_date, stats_type);

-- Index for quick lookups by date
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_date ON dashboard_stats(stats_date DESC);

-- Index for getting latest stats quickly
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_latest ON dashboard_stats(stats_type, stats_date DESC);

-- Cleanup: Keep only last 365 days of data (can be adjusted)
COMMENT ON TABLE dashboard_stats IS 'Daily dashboard statistics snapshots. Calculated at midnight UTC. Retention: 365 days.';`,

    '009_add_employee_personal_fields': `-- Migration: 009_add_employee_personal_fields
-- Add date_of_birth, nic_passport, and is_external columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nic_passport VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_external BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN employees.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN employees.nic_passport IS 'NIC or Passport number';
COMMENT ON COLUMN employees.is_external IS 'Whether the employee is external (contractor/vendor)';`
};

// ============================================================================
// SEED DATA
// ============================================================================

const SEEDS = {
    '001_seed_designations': `INSERT INTO designations (name, level, is_intern_role, category, is_active, is_default, display_order)
VALUES 
    ('Intern - SE', 1, true, 'Engineering', true, true, 1),
    ('Trainee - SE', 1, false, 'Engineering', true, true, 2),
    ('ASE', 2, false, 'Engineering', true, true, 6),
    ('SE', 3, false, 'Engineering', true, true, 11),
    ('SSE', 4, false, 'Engineering', true, true, 14),
    ('ATL', 5, false, 'Engineering', true, true, 15),
    ('TL', 6, false, 'Engineering', true, true, 16),
    ('STL', 7, false, 'Engineering', true, true, 19),
    ('Architect', 8, false, 'Engineering', true, true, 21),
    ('Principal Architect', 9, false, 'Engineering', true, true, 22),
    ('Intern - QA', 1, true, 'QA', true, true, 25),
    ('Trainee - QA', 1, false, 'QA', true, true, 26),
    ('QAE', 3, false, 'QA', true, true, 27),
    ('SQAE', 4, false, 'QA', true, true, 28),
    ('QAL', 6, false, 'QA', true, true, 30),
    ('SQAL', 7, false, 'QA', true, true, 31),
    ('Intern - BA', 1, true, 'BA/PM', true, true, 35),
    ('BA', 3, false, 'BA/PM', true, true, 36),
    ('SBA', 4, false, 'BA/PM', true, true, 37),
    ('PM', 5, false, 'BA/PM', true, true, 41),
    ('SPM', 6, false, 'BA/PM', true, true, 42),
    ('PPM', 7, false, 'BA/PM', true, true, 43),
    ('Intern - DevOps', 1, true, 'DevOps', true, true, 50),
    ('DevOps Engineer', 3, false, 'DevOps', true, true, 51),
    ('Senior DevOps Engineer', 4, false, 'DevOps', true, true, 52),
    ('DevOps Lead', 6, false, 'DevOps', true, true, 53),
    ('Intern - UI/UX', 1, true, 'Design', true, true, 60),
    ('UI/UX Designer', 3, false, 'Design', true, true, 61),
    ('Senior UI/UX Designer', 4, false, 'Design', true, true, 62),
    ('Design Lead', 6, false, 'Design', true, true, 63),
    ('None', 0, false, 'Other', true, true, 82)
ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level, is_intern_role = EXCLUDED.is_intern_role, category = EXCLUDED.category, display_order = EXCLUDED.display_order, updated_at = NOW();`,

    '002_seed_billing_statuses': `INSERT INTO billing_statuses (name, description, is_active, is_default, display_order)
VALUES 
    ('Billing', 'Resource is billable to client', true, true, 1),
    ('Non-Billing', 'Resource is not billable', true, true, 2),
    ('Bench', 'Resource is on bench/available', true, true, 3),
    ('Training', 'Resource is in training', true, true, 4),
    ('Presale', 'Pre-sales activities', true, true, 5),
    ('Support', 'Internal support activities', true, true, 6),
    ('Execs', 'Executive/management activities', true, true, 7),
    ('Shadow', 'Shadow billing (learning)', true, false, 8),
    ('Partial', 'Partially billable', true, false, 9)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, display_order = EXCLUDED.display_order, updated_at = NOW();`,

    '003_seed_project_types': `INSERT INTO project_types (name, description, is_active, is_default, display_order)
VALUES 
    ('Client', 'External client project', true, true, 1),
    ('Research', 'Research and development', true, true, 2),
    ('Training', 'Training program', true, true, 3),
    ('Pre-Sales', 'Pre-sales activities', true, true, 4),
    ('Investment', 'Internal investment project', true, true, 5),
    ('Preparations', 'Project preparation phase', true, true, 6),
    ('Internal', 'Internal company project', true, false, 7),
    ('POC', 'Proof of concept', true, false, 8),
    ('Maintenance', 'Maintenance/support project', true, false, 9)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, display_order = EXCLUDED.display_order, updated_at = NOW();`,

    '004_seed_employee_types': `INSERT INTO employee_types (name, description, is_active, is_default)
VALUES 
    ('Permanent', 'Full-time permanent employee', true, true),
    ('Contract', 'Contract/Fixed-term employee', true, false),
    ('Intern', 'Internship employee', true, false),
    ('Consultant', 'External consultant', true, false),
    ('Part-time', 'Part-time employee', true, false),
    ('Probation', 'Employee on probation period', true, false)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW();`,

    '005_seed_universities': `INSERT INTO universities (name, short_name, country, is_active)
VALUES 
    ('University of Colombo', 'UOC', 'Sri Lanka', true),
    ('University of Moratuwa', 'UOM', 'Sri Lanka', true),
    ('University of Peradeniya', 'UOP', 'Sri Lanka', true),
    ('University of Kelaniya', 'UOK', 'Sri Lanka', true),
    ('University of Sri Jayewardenepura', 'USJ', 'Sri Lanka', true),
    ('University of Ruhuna', 'UOR', 'Sri Lanka', true),
    ('University of Jaffna', 'UOJ', 'Sri Lanka', true),
    ('Rajarata University', 'RUSL', 'Sri Lanka', true),
    ('Sabaragamuwa University', 'SUSL', 'Sri Lanka', true),
    ('Wayamba University', 'WUSL', 'Sri Lanka', true),
    ('Eastern University', 'EUSL', 'Sri Lanka', true),
    ('South Eastern University', 'SEUSL', 'Sri Lanka', true),
    ('Uva Wellassa University', 'UWU', 'Sri Lanka', true),
    ('SLIIT', 'SLIIT', 'Sri Lanka', true),
    ('NSBM Green University', 'NSBM', 'Sri Lanka', true),
    ('IIT Sri Lanka', 'IIT', 'Sri Lanka', true),
    ('APIIT', 'APIIT', 'Sri Lanka', true),
    ('NIBM', 'NIBM', 'Sri Lanka', true),
    ('ESOFT Metro Campus', 'ESOFT', 'Sri Lanka', true),
    ('ICBT Campus', 'ICBT', 'Sri Lanka', true),
    ('CINEC Campus', 'CINEC', 'Sri Lanka', true),
    ('KDU', 'KDU', 'Sri Lanka', true),
    ('Other International', 'INT', 'International', true),
    ('Other', 'Other', 'Other', true)
ON CONFLICT (name) DO UPDATE SET short_name = EXCLUDED.short_name, country = EXCLUDED.country, updated_at = NOW();`,

    '006_seed_tags': `INSERT INTO tags (name, description, color, is_active, is_default)
VALUES 
    ('Synergy', 'Synergy program participant', '#4CAF50', true, true),
    ('GDC', 'Global Delivery Center', '#2196F3', true, true),
    ('Leaders League', 'Leadership development program', '#9C27B0', true, true),
    ('High Performer', 'High performing employee', '#FF9800', true, false),
    ('Critical Resource', 'Business critical resource', '#F44336', true, false),
    ('Mentor', 'Acts as mentor to others', '#00BCD4', true, false),
    ('Remote', 'Works remotely', '#607D8B', true, false),
    ('New Joiner', 'Recently joined employee', '#8BC34A', true, false)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color = EXCLUDED.color, updated_at = NOW();`,

    '007_seed_bench_project': `INSERT INTO users (username, email, password_hash, role, status)
VALUES ('system', 'system@onebt.com', '$2b$10$placeholder', 'Super User', 'Active')
ON CONFLICT DO NOTHING;
INSERT INTO projects (project_name, project_code, account_type, status, is_bench_project, description, team_size, created_by)
SELECT 'Bench', 'BENCH', 'Internal', 'Active', true, 'Default bench project for unallocated resources', 0, 
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE is_bench_project = true AND deleted_at IS NULL);`
};

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
        const seedKeys = Object.keys(SEEDS).sort();

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
