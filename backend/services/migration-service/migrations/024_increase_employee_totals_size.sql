-- Migration: 024_increase_employee_totals_size
-- Description: Increases the maximum allowed value for total_allocation and total_resource_billing
-- because legacy Excel allocation data contains dirty overlapping dates that cause totals > 999.99%.

ALTER TABLE employees
ALTER COLUMN total_allocation TYPE DECIMAL(8,2),
ALTER COLUMN total_resource_billing TYPE DECIMAL(8,2);
