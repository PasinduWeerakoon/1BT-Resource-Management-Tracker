-- Migration: 003_create_employees_users
-- Creates employees and users tables with INTEGER IDs (not UUIDs for faster lookups)
-- Config-based fields (track_id, tier_id, tech_stack_id) map to /opt/nodejs/configs/index.js - NOT DB tables

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    epf_no VARCHAR(20) NOT NULL,
    emp_no VARCHAR(20) NOT NULL,
    global_employee_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone_number VARCHAR(20),
    -- Config-based fields - INTEGER IDs mapping to shared configs (NOT foreign keys)
    track_id INTEGER,
    tech_stack_id INTEGER,
    tier_id INTEGER,
    -- FK to lookup tables
    designation_id INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    employee_type_id INTEGER REFERENCES employee_types(id) ON DELETE SET NULL,
    university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
    -- Dates
    joined_date DATE,
    last_increment_date DATE,
    last_promotion_date DATE,
    internship_completion_target_date DATE,
    notice_period_end_date DATE,
    -- Status and allocation
    status employee_status NOT NULL DEFAULT 'Active',
    total_allocation DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_resource_billing DECIMAL(5,2) NOT NULL DEFAULT 0,
    -- Helper relationship (self-reference)
    helper_id INTEGER,
    helper_is_external BOOLEAN NOT NULL DEFAULT false,
    -- Other fields
    skills TEXT[] DEFAULT '{}',
    is_account_manager BOOLEAN NOT NULL DEFAULT false,
    photo_url VARCHAR(500),
    -- Soft delete and versioning
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

-- Self-referencing foreign key for helper
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

-- Unique indexes with soft delete support
CREATE UNIQUE INDEX IF NOT EXISTS employees_epf_no_unique ON employees(epf_no) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employees_emp_no_unique ON employees(emp_no) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique ON employees(email) WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Performance indexes for employees
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

-- User indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE deleted_at IS NULL;

-- Employee tags indexes
CREATE UNIQUE INDEX IF NOT EXISTS employee_tags_unique ON employee_tags(employee_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_employee_tags_employee ON employee_tags(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tags_tag ON employee_tags(tag_id);
