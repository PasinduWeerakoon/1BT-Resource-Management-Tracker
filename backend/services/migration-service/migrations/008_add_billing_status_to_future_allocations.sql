-- Migration: 008_add_billing_status_to_future_allocations
-- Adds billing_status_id column to future_allocations table
-- This allows future allocations to capture billing status when scheduled,
-- which will be copied to the allocations table when the scheduler activates them.

-- Add billing_status_id column to future_allocations table
ALTER TABLE future_allocations 
ADD COLUMN IF NOT EXISTS billing_status_id INTEGER REFERENCES billing_statuses(id) ON DELETE RESTRICT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_future_alloc_billing_status ON future_allocations(billing_status_id);

-- Add comment for documentation
COMMENT ON COLUMN future_allocations.billing_status_id IS 'FK to billing_statuses table - required for non-bench allocations when activated';
