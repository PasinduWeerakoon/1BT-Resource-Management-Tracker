-- Seed: 009_seed_randika_swaris
-- Seeding Randika Swaris and setting him as Bench Account Manager
-- Correction: Update existing Randika (from 008) instead of duplicate insert

-- 1. Insert Designation if not exists
INSERT INTO designations (name, level, is_intern_role, category, is_active, is_default, tier_id)
VALUES ('Delivery Architect / Head of Engineering and overall GDC Lead', 9, false, 'Engineering', true, false, 4)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert University if not exists
INSERT INTO universities (name, country, is_active)
VALUES ('University of Moratuwa / PIM', 'Sri Lanka', true)
ON CONFLICT (name) DO NOTHING;

-- 3. Update or Insert Randika Swaris
-- Logic: Try to update by EmpNo (LE00005). If not found, Insert.
DO $$
DECLARE
    v_designation_id INTEGER;
    v_university_id INTEGER;
    v_permanent_type_id INTEGER;
    v_updated_id INTEGER;
BEGIN
    SELECT id INTO v_designation_id FROM designations WHERE name = 'Delivery Architect / Head of Engineering and overall GDC Lead';
    SELECT id INTO v_university_id FROM universities WHERE name = 'University of Moratuwa / PIM';
    SELECT id INTO v_permanent_type_id FROM employee_types WHERE name = 'Permanent' LIMIT 1;

    -- Update existing Randika if exists (matches LE00005)
    UPDATE employees 
    SET 
        epf_no = '566165',
        name = 'Randika Swaris',
        email = 'randika@1billiontech.com',
        track_id = 10, -- Delivery
        tech_stack_id = 2, -- .NET
        tier_id = 7, -- Synergy
        designation_id = v_designation_id,
        employee_type_id = v_permanent_type_id,
        university_id = v_university_id,
        joined_date = '2014-04-10',
        last_increment_date = '2021-10-01',
        last_promotion_date = '2023-08-01',
        status = 'Active',
        total_allocation = 100.00,
        total_resource_billing = 6.00,
        is_account_manager = true,
        updated_at = NOW()
    WHERE emp_no = 'LE00005'
    RETURNING id INTO v_updated_id;

    -- If no row updated, Insert new
    IF v_updated_id IS NULL THEN
        INSERT INTO employees (
            epf_no, emp_no, name, email,
            track_id, tech_stack_id, tier_id,
            designation_id, employee_type_id, university_id,
            joined_date, last_increment_date, last_promotion_date,
            status, total_allocation, total_resource_billing,
            is_account_manager, is_external
        )
        VALUES (
            '566165', 'LE00005', 'Randika Swaris', 'randika@1billiontech.com',
            10, 2, 7,
            v_designation_id, v_permanent_type_id, v_university_id,
            '2014-04-10', '2021-10-01', '2023-08-01',
            'Active', 100.00, 6.00,
            true, false
        );
    END IF;
END $$;

-- 4. Set Randika as Bench Project Account Manager
UPDATE projects
SET account_manager_id = (SELECT id FROM employees WHERE emp_no = 'LE00005')
WHERE is_bench_project = true;
