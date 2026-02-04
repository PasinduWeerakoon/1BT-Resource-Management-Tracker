-- Seed: 001_seed_designations
-- Populates designations table with default values
-- tier_id mapping:
--   5 = Intern, 1 = Entry (Tier-1), 2 = Intermediate (Tier-2), 
--   3 = Senior (Tier-3), 4 = Expert (Tier-4), 6 = None, 7 = Synergy

INSERT INTO designations (name, level, is_intern_role, category, is_active, is_default, display_order, tier_id)
VALUES 
    -- Engineering Track
    ('Intern - SE', 1, true, 'Engineering', true, true, 1, 5),        -- Intern tier
    ('Trainee - SE', 1, false, 'Engineering', true, true, 2, 1),      -- Tier 1 - Entry
    ('ASE', 2, false, 'Engineering', true, true, 6, 1),               -- Tier 1 - Entry
    ('SE', 3, false, 'Engineering', true, true, 11, 2),               -- Tier 2 - Intermediate
    ('SSE', 4, false, 'Engineering', true, true, 14, 3),              -- Tier 3 - Senior
    ('ATL', 5, false, 'Engineering', true, true, 15, 3),              -- Tier 3 - Senior
    ('TL', 6, false, 'Engineering', true, true, 16, 4),               -- Tier 4 - Expert
    ('STL', 7, false, 'Engineering', true, true, 19, 4),              -- Tier 4 - Expert
    ('Architect', 8, false, 'Engineering', true, true, 21, 4),        -- Tier 4 - Expert
    ('Principal Architect', 9, false, 'Engineering', true, true, 22, 4), -- Tier 4 - Expert
    -- QA Track
    ('Intern - QA', 1, true, 'QA', true, true, 25, 5),                -- Intern tier
    ('Trainee - QA', 1, false, 'QA', true, true, 26, 1),              -- Tier 1 - Entry
    ('QAE', 3, false, 'QA', true, true, 27, 2),                       -- Tier 2 - Intermediate
    ('SQAE', 4, false, 'QA', true, true, 28, 3),                      -- Tier 3 - Senior
    ('QAL', 6, false, 'QA', true, true, 30, 4),                       -- Tier 4 - Expert
    ('SQAL', 7, false, 'QA', true, true, 31, 4),                      -- Tier 4 - Expert
    -- BA/PM Track
    ('Intern - BA', 1, true, 'BA/PM', true, true, 35, 5),             -- Intern tier
    ('BA', 3, false, 'BA/PM', true, true, 36, 2),                     -- Tier 2 - Intermediate
    ('SBA', 4, false, 'BA/PM', true, true, 37, 3),                    -- Tier 3 - Senior
    ('PM', 5, false, 'BA/PM', true, true, 41, 3),                     -- Tier 3 - Senior
    ('SPM', 6, false, 'BA/PM', true, true, 42, 4),                    -- Tier 4 - Expert
    ('PPM', 7, false, 'BA/PM', true, true, 43, 4),                    -- Tier 4 - Expert
    -- DevOps Track
    ('Intern - DevOps', 1, true, 'DevOps', true, true, 50, 5),        -- Intern tier
    ('DevOps Engineer', 3, false, 'DevOps', true, true, 51, 2),       -- Tier 2 - Intermediate
    ('Senior DevOps Engineer', 4, false, 'DevOps', true, true, 52, 3), -- Tier 3 - Senior
    ('DevOps Lead', 6, false, 'DevOps', true, true, 53, 4),           -- Tier 4 - Expert
    -- Design Track
    ('Intern - UI/UX', 1, true, 'Design', true, true, 60, 5),         -- Intern tier
    ('UI/UX Designer', 3, false, 'Design', true, true, 61, 2),        -- Tier 2 - Intermediate
    ('Senior UI/UX Designer', 4, false, 'Design', true, true, 62, 3), -- Tier 3 - Senior
    ('Design Lead', 6, false, 'Design', true, true, 63, 4),           -- Tier 4 - Expert
    -- Other
    ('None', 0, false, 'Other', true, true, 82, 6)                    -- Tier 6 - None
ON CONFLICT (name) DO UPDATE SET 
    level = EXCLUDED.level, 
    is_intern_role = EXCLUDED.is_intern_role, 
    category = EXCLUDED.category, 
    display_order = EXCLUDED.display_order,
    tier_id = EXCLUDED.tier_id,
    updated_at = NOW();
