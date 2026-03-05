-- Migration: 016_add_audit_fields_to_designations
-- Add created_by and updated_by columns to designations table
-- Fixes error: column "created_by" of relation "designations" does not exist

-- Correct approach for designations
ALTER TABLE designations
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Correct approach for billing_statuses
ALTER TABLE billing_statuses
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;
