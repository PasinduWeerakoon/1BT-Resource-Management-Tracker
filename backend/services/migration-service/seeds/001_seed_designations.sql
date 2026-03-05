-- Seed: 001_seed_designations
-- Production designations - comprehensive list from all tracks
-- tier_id mapping:
--   5 = Intern, 1 = Tier-1 (Entry), 2 = Tier-2 (Intermediate),
--   3 = Tier-3 (Senior), 4 = Tier-4 (Expert), 6 = None, 7 = Synergy

INSERT INTO designations (name, level, is_intern_role, category, is_active, is_default, display_order, tier_id)
VALUES
    -- Engineering - Intern
    ('Intern - SE', 1, true, 'Engineering', true, true, 1, 5),
    ('Intern SE - Data Analytics', 1, true, 'Data Science', true, true, 2, 5),
    ('Intern Software Engineer - Data Analytics', 1, true, 'Data Science', true, true, 3, 5),
    ('Intern - Data Engineer', 1, true, 'Data Science', true, true, 4, 5),
    ('Intern - Analytics & Data Science', 1, true, 'Data Science', true, true, 5, 5),
    -- Engineering - Associate
    ('ASE', 2, false, 'Engineering', true, true, 6, 1),
    ('ASE - Data Analytics', 2, false, 'Data Science', true, true, 7, 1),
    ('ASE - UI', 2, false, 'Design', true, true, 8, 1),
    ('ASE - UI Engineer', 2, false, 'Design', true, true, 9, 1),
    ('Associate Engineer - Analytics and Data Science', 2, false, 'Data Science', true, true, 10, 1),
    -- Engineering - Mid
    ('SE', 3, false, 'Engineering', true, true, 11, 2),
    ('SE - UI', 3, false, 'Design', true, true, 12, 2),
    ('Engineer - Analytics and Data Science', 3, false, 'Data Science', true, true, 13, 2),
    -- Engineering - Senior
    ('SSE', 4, false, 'Engineering', true, true, 14, 3),
    ('ATL', 5, false, 'Engineering', true, true, 15, 3),
    ('TL', 6, false, 'Engineering', true, true, 16, 4),
    ('TL - UI/UX', 6, false, 'Design', true, true, 17, 4),
    ('Technical Lead - Analytics & Data Science', 6, false, 'Data Science', true, true, 18, 4),
    ('STL', 7, false, 'Engineering', true, true, 19, 4),
    ('Associate Architect', 7, false, 'Engineering', true, true, 20, 4),
    ('Architect', 8, false, 'Engineering', true, true, 21, 4),
    ('Principal Solutions Architect', 9, false, 'Engineering', true, true, 22, 4),
    ('Delivery Architect / Head of Engineering and overall GDC Lead', 10, false, 'Engineering', true, true, 23, 4),
    ('External Architect', 8, false, 'Engineering', true, true, 24, 4),
    -- QA
    ('Intern - QA', 1, true, 'QA', true, true, 25, 5),
    ('AQAE', 2, false, 'QA', true, true, 26, 1),
    ('QAE', 3, false, 'QA', true, true, 27, 2),
    ('SQAE', 4, false, 'QA', true, true, 28, 3),
    ('AQAL', 5, false, 'QA', true, true, 29, 3),
    ('QAL', 6, false, 'QA', true, true, 30, 4),
    ('Senior Manager - QA', 8, false, 'QA', true, true, 31, 4),
    -- BA/PM
    ('Intern - BA', 1, true, 'BA/PM', true, true, 32, 5),
    ('Intern - BA/PM', 1, true, 'BA/PM', true, true, 33, 5),
    ('Intern - PM', 1, true, 'BA/PM', true, true, 34, 5),
    ('Associate -BA/PM', 2, false, 'BA/PM', true, true, 35, 1),
    ('Associate - Business Analyst', 2, false, 'BA/PM', true, true, 36, 1),
    ('Associate - Project Management', 2, false, 'BA/PM', true, true, 37, 1),
    ('Associate - Business Consultant', 2, false, 'BA/PM', true, true, 38, 1),
    ('SBA', 4, false, 'BA/PM', true, true, 39, 3),
    ('Senior Business Analyst', 4, false, 'BA/PM', true, true, 40, 3),
    ('PM', 5, false, 'BA/PM', true, true, 41, 3),
    -- Dynamics
    ('BA - BC Functional Consultant', 3, false, 'Dynamics', true, true, 42, 2),
    ('SBA - BC Functional Consultant', 4, false, 'Dynamics', true, true, 43, 3),
    ('Senior Manager Dynamics – F&O', 8, false, 'Dynamics', true, true, 44, 4),
    ('Associate Director - Dynamics F&O', 9, false, 'Dynamics', true, true, 45, 4),
    -- Design
    ('Intern - Graphic Designer', 1, true, 'Design', true, true, 46, 5),
    ('Associate Designer - UI/UX', 2, false, 'Design', true, true, 47, 1),
    ('Associate UI/UX Designer', 2, false, 'Design', true, true, 48, 1),
    ('Associate - Graphic Designer', 2, false, 'Design', true, true, 49, 1),
    ('UI/UX Designer', 3, false, 'Design', true, true, 50, 2),
    ('Senior UI/UX Designer', 4, false, 'Design', true, true, 51, 3),
    ('Senior UX Designer', 4, false, 'Design', true, true, 52, 3),
    ('Lead – UI', 6, false, 'Design', true, true, 53, 4),
    ('Senior Lead - UI', 7, false, 'Design', true, true, 54, 4),
    -- Finance
    ('Accounts Assistant', 1, false, 'Finance', true, true, 55, 6),
    ('Junior Executive - Finance', 2, false, 'Finance', true, true, 56, 1),
    ('Executive-Finance', 3, false, 'Finance', true, true, 57, 2),
    ('Senior Executive-Finance', 4, false, 'Finance', true, true, 58, 3),
    ('Accountant', 4, false, 'Finance', true, true, 59, 3),
    ('Senior Accountant', 5, false, 'Finance', true, true, 60, 3),
    ('Director-Finance', 9, false, 'Finance', true, true, 61, 4),
    ('Director - Finance', 9, false, 'Finance', true, true, 62, 4),
    -- HR
    ('Intern - HR', 1, true, 'HR', true, true, 63, 5),
    ('Junior Executive - HR', 2, false, 'HR', true, true, 64, 1),
    ('Executive - HR', 3, false, 'HR', true, true, 65, 2),
    ('Executive-HR', 3, false, 'HR', true, true, 66, 2),
    ('Senior Executive-HR', 4, false, 'HR', true, true, 67, 3),
    ('Manager-HR', 6, false, 'HR', true, true, 68, 4),
    ('Senior Manager - Human Resources', 8, false, 'HR', true, true, 69, 4),
    ('Director - People & Culture', 9, false, 'HR', true, true, 70, 4),
    -- Admin
    ('Junior Executive -Admin/IT', 2, false, 'Admin', true, true, 71, 1),
    ('Associate Lead - IT & Administration', 5, false, 'Admin', true, true, 72, 3),
    -- Marketing/Sales
    ('Intern - Sales & Marketing', 1, true, 'Marketing', true, true, 73, 5),
    ('Digital Marketing Executive', 3, false, 'Marketing', true, true, 74, 2),
    ('Junior Executive - Sales & Marketing', 2, false, 'Marketing', true, true, 75, 1),
    ('Senior Executive - Business Development', 4, false, 'Marketing', true, true, 76, 3),
    ('Senior Manager - Sales & Marketing', 8, false, 'Marketing', true, true, 77, 4),
    ('Associate Director – Business Development / Head of Client Services', 9, false, 'Marketing', true, true, 78, 4),
    -- Executive
    ('Director / Head of Delivery and Resource Management', 10, false, 'Executive', true, true, 79, 4),
    ('Senior Vice President & COO', 11, false, 'Executive', true, true, 80, 4),
    ('CEO', 12, false, 'Executive', true, true, 81, 4),
    -- Other
    ('External Consultant', 5, false, 'Other', true, true, 82, 6),
    ('None', 0, false, 'Other', true, true, 83, 6)
ON CONFLICT (name) DO UPDATE SET
    level = EXCLUDED.level,
    is_intern_role = EXCLUDED.is_intern_role,
    category = EXCLUDED.category,
    display_order = EXCLUDED.display_order,
    tier_id = EXCLUDED.tier_id,
    updated_at = NOW();
