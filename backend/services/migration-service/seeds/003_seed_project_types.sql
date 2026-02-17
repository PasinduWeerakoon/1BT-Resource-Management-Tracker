-- Seed: 003_seed_project_types
-- Populates project_types table with default values

INSERT INTO project_types (name, description, is_active, is_default, display_order)
VALUES 
    ('Client', 'External client project', true, true, 1),
    ('Research', 'Research and development', true, true, 2),
    ('Training', 'Training program', true, true, 3),
    ('Pre-Sales', 'Pre-sales activities', true, true, 4),
    ('Investment', 'Internal investment project', true, true, 5),
    ('Preparations', 'Project preparation phase', true, true, 6),
    ('Internal', 'Internal company project', true, false, 7),
    ('POC', 'Proof of concept', true, false, 8),
    ('Maintenance', 'Maintenance/support project', true, false, 9)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description, 
    display_order = EXCLUDED.display_order, 
    updated_at = NOW();
