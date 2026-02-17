-- Migration: 014_add_billing_type_to_billing_statuses
-- Adds billing_type TEXT[] array column to billing_statuses table
-- This column specifies whether a billing status applies to "resource", "project", or both

-- Add billing_type column as TEXT array
ALTER TABLE billing_statuses 
ADD COLUMN IF NOT EXISTS billing_type TEXT[] DEFAULT '{}';

-- Update existing billing statuses with appropriate billing_type values
-- These apply to both resources and projects
UPDATE billing_statuses 
SET billing_type = ARRAY['resource', 'project'] 
WHERE name IN ('Billing', 'Non-Billing', 'Training', 'Presale');

-- These apply only to resources
UPDATE billing_statuses 
SET billing_type = ARRAY['resource'] 
WHERE name IN ('Bench', 'Shadow', 'Partial', 'Execs', 'Critical Shadow');

-- These apply only to projects
UPDATE billing_statuses 
SET billing_type = ARRAY['project'] 
WHERE name = 'Support';

-- For any remaining billing statuses with empty billing_type,
-- set them to default to both resource and project
UPDATE billing_statuses 
SET billing_type = ARRAY['resource', 'project'] 
WHERE billing_type IS NULL OR billing_type = '{}';

-- Make the column NOT NULL after populating data
ALTER TABLE billing_statuses 
ALTER COLUMN billing_type SET NOT NULL;

-- Add check constraint: billing_type array must not be empty
ALTER TABLE billing_statuses 
ADD CONSTRAINT billing_type_not_empty CHECK (array_length(billing_type, 1) > 0);

-- Add check constraint: billing_type values must be valid
ALTER TABLE billing_statuses 
ADD CONSTRAINT billing_type_valid_values CHECK (billing_type <@ ARRAY['resource', 'project']::text[]);
