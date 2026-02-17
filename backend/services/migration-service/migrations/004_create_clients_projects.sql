-- Migration: 004_create_clients_projects
-- Creates clients and projects tables with INTEGER IDs

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
    is_default BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Client indexes
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active) WHERE deleted_at IS NULL;

-- Project indexes
CREATE UNIQUE INDEX IF NOT EXISTS projects_name_unique ON projects(project_name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_code_unique ON projects(project_code) WHERE deleted_at IS NULL AND project_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(account_manager_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_bench ON projects(is_bench_project) WHERE is_bench_project = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_default ON projects(is_default) WHERE is_default = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_billing ON projects(billing_status_id) WHERE deleted_at IS NULL;
