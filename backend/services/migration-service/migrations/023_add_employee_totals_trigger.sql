-- Migration: 023_add_employee_totals_trigger
-- Description: Adds a PostgreSQL trigger to allocations table to automatically update employee totals

-- 1. Create the function to calculate and update totals
CREATE OR REPLACE FUNCTION update_employee_totals_func(emp_id INTEGER) RETURNS VOID AS $$
DECLARE
    v_total_allocation NUMERIC;
    v_total_billing NUMERIC;
BEGIN
    -- Calculate Total Allocation
    -- Sum of allocation_percentage for all active allocations in non-bench projects
    SELECT COALESCE(SUM(a.allocation_percentage), 0)
    INTO v_total_allocation
    FROM allocations a
    JOIN projects p ON a.project_id = p.id
    WHERE a.employee_id = emp_id
    AND a.is_active = true
    AND a.deleted_at IS NULL
    AND p.is_bench_project = false;

    -- Calculate Total Billing
    -- Sum of billing_percentage for all active allocations in non-bench projects
    -- where the PROJECT billing status is 'Billing'
    SELECT COALESCE(SUM(a.billing_percentage), 0)
    INTO v_total_billing
    FROM allocations a
    JOIN projects p ON a.project_id = p.id
    JOIN billing_statuses bs ON p.billing_status_id = bs.id
    WHERE a.employee_id = emp_id
    AND a.is_active = true
    AND a.deleted_at IS NULL
    AND bs.name = 'Billing'
    AND p.is_bench_project = false;

    -- Update Employees table with calculated values
    UPDATE employees
    SET 
        total_allocation = v_total_allocation,
        total_resource_billing = v_total_billing,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = emp_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger handler function
CREATE OR REPLACE FUNCTION trigger_allocations_update_totals() RETURNS TRIGGER AS $$
BEGIN
    -- For DELETE, update the OLD employee
    IF (TG_OP = 'DELETE') THEN
        PERFORM update_employee_totals_func(OLD.employee_id);
        RETURN OLD;
    
    -- For UPDATE, update NEW employee, and OLD employee if different
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM update_employee_totals_func(NEW.employee_id);
        IF (OLD.employee_id IS DISTINCT FROM NEW.employee_id) THEN
            PERFORM update_employee_totals_func(OLD.employee_id);
        END IF;
        RETURN NEW;
    
    -- For INSERT, update the NEW employee
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM update_employee_totals_func(NEW.employee_id);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger on allocations table
DROP TRIGGER IF EXISTS trg_allocations_totals ON allocations;

CREATE TRIGGER trg_allocations_totals
AFTER INSERT OR UPDATE OR DELETE ON allocations
FOR EACH ROW
EXECUTE FUNCTION trigger_allocations_update_totals();

-- 4. Initial Recalculation
-- Recalculate for all employees who have allocations to ensure data consistency immediately
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN SELECT DISTINCT employee_id FROM allocations LOOP
        PERFORM update_employee_totals_func(emp.employee_id);
    END LOOP;
END $$;
