-- Seed: 002_seed_billing_statuses
-- Populates billing_statuses table with default values

INSERT INTO billing_statuses (name, description, billing_type, is_active, is_default, display_order)
VALUES 
    ('Billing', 'Resource is billable to client', ARRAY['resource', 'project'], true, true, 1),
    ('Non-Billing', 'Resource is not billable', ARRAY['resource', 'project'], true, true, 2),
    ('Bench', 'Resource is on bench/available', ARRAY['resource'], true, true, 3),
    ('Training', 'Resource is in training', ARRAY['resource', 'project'], true, true, 4),
    ('Presale', 'Pre-sales activities', ARRAY['resource', 'project'], true, true, 5),
    ('Support', 'Internal support activities', ARRAY['project'], true, true, 6),
    ('Execs', 'Executive/management activities', ARRAY['resource'], true, true, 7),
    ('Shadow', 'Shadow billing (learning)', ARRAY['resource'], true, false, 8),
    ('Partial', 'Partially billable', ARRAY['resource'], true, false, 9)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    billing_type = EXCLUDED.billing_type,
    display_order = EXCLUDED.display_order, 
    updated_at = NOW();
