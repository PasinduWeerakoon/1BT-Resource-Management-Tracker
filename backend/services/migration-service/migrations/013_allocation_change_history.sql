-- Migration: Create allocation_change_history table
-- 
-- This table tracks all changes to allocations including:
-- - Manual updates by users
-- - Automatic Bench adjustments
-- - Bulk changes
-- - Deletions
-- 
-- Required for audit trail and Bench auto-adjustment logic

-- Create allocation_change_history table
CREATE TABLE IF NOT EXISTS allocation_change_history (
    id SERIAL PRIMARY KEY,
    allocation_id INTEGER,  -- Nullable because allocation may be deleted
    resource_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    change_type VARCHAR(50) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'BENCH_ADJUST', 'BULK_UPDATE'
    old_allocation_percentage DECIMAL(5,2),
    new_allocation_percentage DECIMAL(5,2),
    old_billing_percentage DECIMAL(5,2),
    new_billing_percentage DECIMAL(5,2),
    old_start_date DATE,
    new_start_date DATE,
    old_end_date DATE,
    new_end_date DATE,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    metadata JSONB,  -- Additional context about the change
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alloc_history_resource ON allocation_change_history(resource_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_alloc_history_project ON allocation_change_history(project_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_alloc_history_allocation ON allocation_change_history(allocation_id) WHERE allocation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alloc_history_change_type ON allocation_change_history(change_type);
CREATE INDEX IF NOT EXISTS idx_alloc_history_changed_at ON allocation_change_history(changed_at DESC);

-- Add comments
COMMENT ON TABLE allocation_change_history IS 'Tracks all changes to allocations for audit trail and analytics';
COMMENT ON COLUMN allocation_change_history.change_type IS 'Type of change: CREATE, UPDATE, DELETE, BENCH_ADJUST, BULK_UPDATE';
COMMENT ON COLUMN allocation_change_history.metadata IS 'Additional context: {trigger: auto|manual, adjusted_bench: true, bulk_operation_id: xyz}';
