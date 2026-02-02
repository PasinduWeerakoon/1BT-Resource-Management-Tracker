-- Seed: 002_seed_billing_statuses
-- Populates billing_statuses table with default values

INSERT INTO billing_statuses (name, description, is_active, is_default, display_order)
VALUES 
    ('Billing', 'Resource is billable to client', true, true, 1),
    ('Non-Billing', 'Resource is not billable', true, true, 2),
    ('Bench', 'Resource is on bench/available', true, true, 3),
    ('Training', 'Resource is in training', true, true, 4),
    ('Presale', 'Pre-sales activities', true, true, 5),
    ('Support', 'Internal support activities', true, true, 6),
    ('Execs', 'Executive/management activities', true, true, 7),
    ('Shadow', 'Shadow billing (learning)', true, false, 8),
    ('Partial', 'Partially billable', true, false, 9)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description, 
    display_order = EXCLUDED.display_order, 
    updated_at = NOW();
