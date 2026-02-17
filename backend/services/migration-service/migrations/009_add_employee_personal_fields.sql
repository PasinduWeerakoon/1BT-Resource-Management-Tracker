-- Migration: 009_add_employee_personal_fields
-- Add date_of_birth, nic_passport, and is_external columns to employees table

ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nic_passport VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_external BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN employees.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN employees.nic_passport IS 'NIC or Passport number';
COMMENT ON COLUMN employees.is_external IS 'Whether the employee is external (contractor/vendor)';
