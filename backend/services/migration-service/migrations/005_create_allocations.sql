-- Migration: 005_create_allocations
-- Creates allocations and future_allocations tables with INTEGER IDs

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

-- Allocation indexes
CREATE UNIQUE INDEX IF NOT EXISTS allocations_employee_project_unique ON allocations(employee_id, project_id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_allocations_employee ON allocations(employee_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_project ON allocations(project_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_effective ON allocations(effective_date);
CREATE INDEX IF NOT EXISTS idx_allocations_dates ON allocations(allocated_date, deallocated_date) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_allocations_totals ON allocations(employee_id, allocation_percentage, billing_percentage) WHERE is_active = true AND deleted_at IS NULL;

-- Future allocation indexes
CREATE INDEX IF NOT EXISTS idx_future_alloc_employee ON future_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_future_alloc_project ON future_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_future_alloc_scheduled ON future_allocations(effective_date, status) WHERE status = 'scheduled';
