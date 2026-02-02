-- Seed: 004_seed_employee_types
-- Populates employee_types table with default values

INSERT INTO employee_types (name, description, is_active, is_default)
VALUES 
    ('Permanent', 'Full-time permanent employee', true, true),
    ('Contract', 'Contract/Fixed-term employee', true, false),
    ('Intern', 'Internship employee', true, false),
    ('Consultant', 'External consultant', true, false),
    ('Part-time', 'Part-time employee', true, false),
    ('Probation', 'Employee on probation period', true, false)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description, 
    updated_at = NOW();
