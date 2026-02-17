-- Migration: 015_assign_bench_account_manager
-- Assigns Randika Swaris as account manager for the Bench project

DO $$
DECLARE
    v_manager_id INTEGER;
BEGIN
    -- Find Randika Swaris
    SELECT id INTO v_manager_id FROM employees WHERE name = 'Randika Swaris' LIMIT 1;

    IF v_manager_id IS NOT NULL THEN
        -- Update Bench project
        UPDATE projects 
        SET account_manager_id = v_manager_id 
        WHERE is_bench_project = true AND deleted_at IS NULL;
        
        RAISE NOTICE 'Assigned Randika Swaris (ID: %) as Bench project account manager', v_manager_id;
    ELSE
        RAISE NOTICE 'Employee Randika Swaris not found. Skipping assignment.';
    END IF;
END $$;
