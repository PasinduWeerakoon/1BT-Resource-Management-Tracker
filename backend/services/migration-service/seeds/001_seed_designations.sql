-- Seed: 001_seed_designations
-- Populates designations table with default values

INSERT INTO designations (name, level, is_intern_role, category, is_active, is_default, display_order)
VALUES 
    -- Engineering Track
    ('Intern - SE', 1, true, 'Engineering', true, true, 1),
    ('Trainee - SE', 1, false, 'Engineering', true, true, 2),
    ('ASE', 2, false, 'Engineering', true, true, 6),
    ('SE', 3, false, 'Engineering', true, true, 11),
    ('SSE', 4, false, 'Engineering', true, true, 14),
    ('ATL', 5, false, 'Engineering', true, true, 15),
    ('TL', 6, false, 'Engineering', true, true, 16),
    ('STL', 7, false, 'Engineering', true, true, 19),
    ('Architect', 8, false, 'Engineering', true, true, 21),
    ('Principal Architect', 9, false, 'Engineering', true, true, 22),
    -- QA Track
    ('Intern - QA', 1, true, 'QA', true, true, 25),
    ('Trainee - QA', 1, false, 'QA', true, true, 26),
    ('QAE', 3, false, 'QA', true, true, 27),
    ('SQAE', 4, false, 'QA', true, true, 28),
    ('QAL', 6, false, 'QA', true, true, 30),
    ('SQAL', 7, false, 'QA', true, true, 31),
    -- BA/PM Track
    ('Intern - BA', 1, true, 'BA/PM', true, true, 35),
    ('BA', 3, false, 'BA/PM', true, true, 36),
    ('SBA', 4, false, 'BA/PM', true, true, 37),
    ('PM', 5, false, 'BA/PM', true, true, 41),
    ('SPM', 6, false, 'BA/PM', true, true, 42),
    ('PPM', 7, false, 'BA/PM', true, true, 43),
    -- DevOps Track
    ('Intern - DevOps', 1, true, 'DevOps', true, true, 50),
    ('DevOps Engineer', 3, false, 'DevOps', true, true, 51),
    ('Senior DevOps Engineer', 4, false, 'DevOps', true, true, 52),
    ('DevOps Lead', 6, false, 'DevOps', true, true, 53),
    -- Design Track
    ('Intern - UI/UX', 1, true, 'Design', true, true, 60),
    ('UI/UX Designer', 3, false, 'Design', true, true, 61),
    ('Senior UI/UX Designer', 4, false, 'Design', true, true, 62),
    ('Design Lead', 6, false, 'Design', true, true, 63),
    -- Other
    ('None', 0, false, 'Other', true, true, 82)
ON CONFLICT (name) DO UPDATE SET 
    level = EXCLUDED.level, 
    is_intern_role = EXCLUDED.is_intern_role, 
    category = EXCLUDED.category, 
    display_order = EXCLUDED.display_order, 
    updated_at = NOW();
