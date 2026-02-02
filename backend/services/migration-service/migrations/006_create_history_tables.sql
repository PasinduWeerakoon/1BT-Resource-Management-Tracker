-- Migration: 006_create_history_tables
-- Creates history and archive tables with INTEGER IDs

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
    previous_track_id INTEGER,  -- Maps to TRACKS config (NOT a DB table)
    new_track_id INTEGER NOT NULL,  -- Maps to TRACKS config (NOT a DB table)
    change_type VARCHAR(30) NOT NULL,
    change_reason TEXT,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by INTEGER,
    changed_by_username VARCHAR(50)
);

-- Allocation history indexes
CREATE INDEX IF NOT EXISTS idx_alloc_history_employee ON allocation_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_alloc_history_project ON allocation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_alloc_history_allocation ON allocation_history(allocation_id);
CREATE INDEX IF NOT EXISTS idx_alloc_history_changed ON allocation_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_alloc_history_effective ON allocation_history(effective_date);

-- Archive indexes
CREATE INDEX IF NOT EXISTS idx_archive_employee ON allocation_history_archive(employee_id);
CREATE INDEX IF NOT EXISTS idx_archive_project ON allocation_history_archive(project_id);
CREATE INDEX IF NOT EXISTS idx_archive_archived_at ON allocation_history_archive(archived_at);

-- Designation history indexes
CREATE INDEX IF NOT EXISTS idx_designation_history_employee ON designation_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_designation_history_employee_date ON designation_history(employee_id, effective_from);
