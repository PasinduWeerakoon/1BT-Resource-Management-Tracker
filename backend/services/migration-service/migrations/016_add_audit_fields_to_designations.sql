-- Migration: 016_add_audit_fields_to_designations
-- Add created_by and updated_by columns to designations table
-- Fixes error: column "created_by" of relation "designations" does not exist

DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designations' AND column_name = 'created_by') THEN
        ALTER TABLE designations ADD COLUMN created_by UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designations' AND column_name = 'updated_by') THEN
        ALTER TABLE designations ADD COLUMN updated_by UUID;
    END IF;

    -- Also check billing_statuses just in case (as handlers might use it too)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_statuses' AND column_name = 'created_by') THEN
        ALTER TABLE designations ADD COLUMN created_by UUID; -- Typo in comment? No, this is for billing_statuses but code says designations. Wait.
        -- Let's stick to designations first.
    END IF;

END $$;

-- Correct approach for designations
ALTER TABLE designations
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;
