# Dashboard Metrics - SQL Queries

## Business Rules
- **Billable Tracks**: 1, 2, 3, 4, 5, 8, 11 (Excludes Delivery=10, Support=6)
- **Intern Type ID**: 3
- **Active Allocations**: `is_active = true AND deleted_at IS NULL`
- **Note**: `deallocated_date` is for viewing purposes only - deallocated resources are removed from allocations table

---

## 1. Total Active Resource Count
**Description**: Count of all active employees (excluding external)

```sql
SELECT COUNT(*) as total_active_resource_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND is_external = false;
```

---

## 2. Total Billable Resource Count
**Description**: Count of employees in billable tracks (excluding interns, external, support, delivery)

```sql
SELECT COUNT(*) as total_billable_resource_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND is_external = false
  AND track_id IN (1, 2, 3, 4, 5, 8, 11)  -- Billable tracks only
  AND employee_type_id != 3;  -- Exclude interns
```

---

## 3. External Resource Count
**Description**: Count of external consultants

```sql
SELECT COUNT(*) as external_resource_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND is_external = true;
```

---

## 4. Intern Resource Count
**Description**: Count of interns

```sql
SELECT COUNT(*) as intern_resource_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND employee_type_id = 3;  -- Intern type
```

---

## 5. Total Allocation Percentage for Each Resource
**Description**: Sum of allocation percentages per employee (excluding bench allocations) - ONLY billable resources

```sql
SELECT 
    e.id as employee_id,
    e.employee_name,
    COALESCE(SUM(
        CASE 
            WHEN p.is_bench = true THEN 0
            ELSE a.allocation_percentage 
        END
    ), 0) as total_allocation_percentage
FROM employees e
LEFT JOIN allocations a ON e.id = a.employee_id
    AND a.is_active = true 
    AND a.deleted_at IS NULL
LEFT JOIN projects p ON a.project_id = p.id
WHERE e.status = 'Active' 
  AND e.deleted_at IS NULL
  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)  -- Only billable tracks
  AND e.employee_type_id != 3  -- Exclude interns
  AND e.is_external = false  -- Exclude external
GROUP BY e.id, e.employee_name
ORDER BY e.employee_name;
```

---

## 6. Total Billing Percentage for Each Resource
**Description**: Sum of billing percentages per employee

**Business Rule**: 
- Count billing from ALL active employees
- ALL projects (no project filtering)

```sql
SELECT 
    e.id as employee_id,
    e.employee_name,
    COALESCE(SUM(a.billing_percentage), 0) as total_billing_percentage
FROM employees e
LEFT JOIN allocations a ON e.id = a.employee_id
    AND a.is_active = true 
    AND a.deleted_at IS NULL
WHERE e.status = 'Active' 
  AND e.deleted_at IS NULL
GROUP BY e.id, e.employee_name
ORDER BY e.employee_name;
```

---

## 7. Total Allocation of the Company
**Description**: Sum of all allocation percentages / 100 (FTE) - ONLY billable tracks, excluding bench

**Business Rule**: 
- Only count allocations from employees in billable tracks (1, 2, 3, 4, 5, 8, 11)
- Exclude interns
- Exclude external employees
- Exclude bench allocations

```sql
SELECT 
    COALESCE(SUM(
        CASE 
            WHEN p.is_bench = true THEN 0
            ELSE a.allocation_percentage 
        END
    ) / 100.0, 0) as total_allocation_fte
FROM allocations a
JOIN employees e ON a.employee_id = e.id
LEFT JOIN projects p ON a.project_id = p.id
WHERE a.is_active = true 
  AND a.deleted_at IS NULL
  AND e.status = 'Active'
  AND e.deleted_at IS NULL
    AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)  -- Only billable tracks
    AND e.employee_type_id != 3  -- Exclude interns
    AND e.is_external = false;  -- Exclude external
```

---

## 8. Total Billing of the Company
**Description**: Sum of all billing percentages / 100 (FTE) - ALL active employees

**Business Rule**: 
- Count billing from ALL active employees (including interns, external, all tracks)
- ALL projects (no project filtering)

```sql
SELECT 
    COALESCE(SUM(a.billing_percentage) / 100.0, 0) as total_billing_fte
FROM allocations a
JOIN employees e ON a.employee_id = e.id
WHERE a.is_active = true 
  AND a.deleted_at IS NULL
  AND e.status = 'Active'
  AND e.deleted_at IS NULL;
```

---

## 9. Total Billable Resources Count
**Description**: Count of billable resources (same as query #2, provided separately for clarity)

```sql
SELECT COUNT(*) as total_billable_resources_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND is_external = false
  AND track_id IN (1, 2, 3, 4, 5, 8, 11)  -- Billable tracks only
  AND employee_type_id != 3;  -- Exclude interns
```

---

## 10. Shadow Count
**Description**: (Total allocation % from all projects - Total billing % from billing projects only) / 100 for FTE

**Business Rule**: 
- **Allocation**: From billable employees on ALL projects (excluding bench)
- **Billing**: From billable employees on BILLING projects only (project.billing_status = 'Billing')
- Only billable tracks (1, 2, 3, 4, 5, 8, 11)
- Exclude interns and external

```sql
WITH 
billable_allocation AS (
    SELECT COALESCE(SUM(
        CASE 
            WHEN p.is_bench = true THEN 0
            ELSE a.allocation_percentage 
        END
    ), 0) as total_allocation
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
      AND e.employee_type_id != 3
      AND e.is_external = false
      AND LOWER(pbs.name) = 'billing'
),
billable_billing AS (
    SELECT COALESCE(SUM(a.billing_percentage), 0) as total_billing
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN projects p ON a.project_id = p.id
    JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND LOWER(pbs.name) = 'billing'  -- Only billing projects
)
SELECT 
    COALESCE(
        ((SELECT total_allocation FROM billable_allocation) - (SELECT total_billing FROM billable_billing)) / 100.0,
        0
    ) as shadow_count_fte;
```

---

## 11. Bench Resource Count
**Description**: FTE count of resources allocated to bench project

```sql
SELECT 
    COALESCE(SUM(a.allocation_percentage) / 100.0, 0) as bench_resource_count_fte
FROM allocations a
JOIN employees e ON a.employee_id = e.id
JOIN projects p ON a.project_id = p.id
WHERE a.is_active = true 
  AND a.deleted_at IS NULL
  AND e.status = 'Active'
  AND e.deleted_at IS NULL
  AND p.is_bench = true;
  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
  AND e.employee_type_id != 3
  AND e.is_external = false
```

---

## 12. Internal Non-Billing Count
**Description**: Total allocation FTE on non-billing projects (excluding bench)

**Business Rule**: 
- All active employees
- Projects where billing_status != 'Billing'
- Exclude bench projects

```sql
SELECT 
    COALESCE(SUM(a.allocation_percentage) / 100.0, 0) as internal_non_billing_count_fte
FROM allocations a
JOIN employees e ON a.employee_id = e.id
JOIN projects p ON a.project_id = p.id
LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
WHERE a.is_active = true 
  AND a.deleted_at IS NULL
  AND e.status = 'Active'
  AND e.deleted_at IS NULL
  AND p.is_bench = false
  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
  AND e.employee_type_id != 3
  AND e.is_external = false
  AND (pbs.name IS NULL OR LOWER(pbs.name) != 'billing');
```

---

## 13. Training Resource Count
**Description**: FTE count of resources allocated to training projects (project_type = 'training')

```sql
SELECT 
    COALESCE(SUM(a.allocation_percentage) / 100.0, 0) as training_resource_count_fte
FROM allocations a
JOIN employees e ON a.employee_id = e.id
JOIN projects p ON a.project_id = p.id
JOIN project_types pt ON p.project_type_id = pt.id
WHERE a.is_active = true 
  AND a.deleted_at IS NULL
  AND e.status = 'Active'
  AND e.deleted_at IS NULL
  AND LOWER(pt.name) = 'training';
```

---

## 14. Interns Count
**Description**: Headcount of interns (same as query #4)

```sql
SELECT COUNT(*) as interns_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND employee_type_id = 3;
```

---

## 15. Synergy Count
**Description**: Headcount of synergy resources (tier_id = 7)

```sql
SELECT COUNT(*) as synergy_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND tier_id = 7;
```

---

## 16. Shared Services Count
**Description**: Headcount of shared services resources (support track_id = 6)

```sql
SELECT COUNT(*) as shared_services_count
FROM employees
WHERE status = 'Active' 
  AND deleted_at IS NULL
  AND track_id = 6;
```

---

## Combined Dashboard Query
**Description**: Get all 16 metrics in a single query for efficiency

This query combines:
- Queries 1-4, 9, 14-16: Headcounts from active_employees
- Query 7: Total allocation from billable_allocations
- Query 8: Total billing from all_billing
- Query 10: Shadow count from shadow_allocation - shadow_billing
- Query 11: Bench count from bench_allocations
- Query 12: Internal non-billing from internal_non_billing
- Query 13: Training count from training_allocations

```sql
WITH 
active_employees AS (
    SELECT 
        e.id,
        e.track_id,
        e.employee_type_id,
        e.is_external
    FROM employees e
    WHERE e.status = 'Active' AND e.deleted_at IS NULL
),
-- Query #7: Total allocation from billable employees (all projects, excluding bench)
billable_allocations AS (
    SELECT 
        SUM(CASE 
            WHEN p.is_bench = true THEN 0
            ELSE a.allocation_percentage 
        END) as total_allocation
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN projects p ON a.project_id = p.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
      AND e.employee_type_id != 3
      AND e.is_external = false
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
),
-- Query #8: Total billing from ALL employees (all projects)
all_billing AS (
    SELECT 
        SUM(a.billing_percentage) as total_billing
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
),
-- Query #10: Shadow allocation - billable employees on BILLING projects only
shadow_allocation AS (
    SELECT 
        SUM(CASE 
            WHEN p.is_bench = true THEN 0
            ELSE a.allocation_percentage 
        END) as total_allocation
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
      AND e.employee_type_id != 3
      AND e.is_external = false
      AND LOWER(pbs.name) = 'billing'
),
-- Query #10: Shadow billing - ALL employees on BILLING projects only
shadow_billing AS (
    SELECT 
        SUM(a.billing_percentage) as total_billing
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN projects p ON a.project_id = p.id
    JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND LOWER(pbs.name) = 'billing'
),
-- Query #11: Bench resource count (billable tracks only)
bench_allocations AS (
    SELECT 
        SUM(a.allocation_percentage) as total_bench
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN projects p ON a.project_id = p.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND p.is_bench = true
      AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
      AND e.employee_type_id != 3
      AND e.is_external = false
),
-- Query #12: Internal non-billing count (billable tracks only)
internal_non_billing AS (
    SELECT 
        SUM(a.allocation_percentage) as total_allocation
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN projects p ON a.project_id = p.id
    LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND p.is_bench = false
      AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
      AND e.employee_type_id != 3
      AND e.is_external = false
      AND (pbs.name IS NULL OR LOWER(pbs.name) != 'billing')
),
-- Query #13: Training resource count (project_type = 'training')
training_allocations AS (
    SELECT 
        SUM(a.allocation_percentage) as total_training
    FROM allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN projects p ON a.project_id = p.id
    JOIN project_types pt ON p.project_type_id = pt.id
    WHERE a.is_active = true 
      AND a.deleted_at IS NULL
      AND e.status = 'Active'
      AND e.deleted_at IS NULL
      AND LOWER(pt.name) = 'training'
)
SELECT
    -- 1. Total Active Resource Count
    COUNT(CASE WHEN ae.is_external = false THEN 1 END) as total_active_resource_count,
    
    -- 2. Total Billable Resource Count
    COUNT(CASE 
        WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) 
        AND ae.employee_type_id != 3 
        AND ae.is_external = false 
        THEN 1 
    END) as total_billable_resource_count,
    
    -- 3. External Resource Count
    COUNT(CASE WHEN ae.is_external = true THEN 1 END) as external_resource_count,
    
    -- 4. Intern Resource Count
    COUNT(CASE WHEN ae.employee_type_id = 3 THEN 1 END) as intern_resource_count,
    
    -- 7. Total Allocation of Company (FTE)
    COALESCE((SELECT total_allocation / 100.0 FROM billable_allocations), 0)::DECIMAL(10,2) as total_allocation_fte,
    
    -- 8. Total Billing of Company (FTE)
    COALESCE((SELECT total_billing / 100.0 FROM all_billing), 0)::DECIMAL(10,2) as total_billing_fte,
    
    -- 9. Total Billable Resources Count (same as #2)
    COUNT(CASE 
        WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) 
        AND ae.employee_type_id != 3 
        AND ae.is_external = false 
        THEN 1 
    END) as total_billable_resources_count,
    
    -- 10. Shadow Count (FTE) - Allocation (billing projects) minus Billing (billing projects, all employees)
    COALESCE(
        ((SELECT total_allocation FROM shadow_allocation) - (SELECT total_billing FROM shadow_billing)) / 100.0,
        0
    )::DECIMAL(10,2) as shadow_count_fte,
    
    -- 11. Bench Resource Count (FTE)
    COALESCE((SELECT total_bench / 100.0 FROM bench_allocations), 0)::DECIMAL(10,2) as bench_resource_count_fte,
    
    -- 12. Internal Non-Billing Count (FTE)
    COALESCE((SELECT total_allocation / 100.0 FROM internal_non_billing), 0)::DECIMAL(10,2) as internal_non_billing_count_fte,
    
    -- 13. Training Resource Count (FTE)
    COALESCE((SELECT total_training / 100.0 FROM training_allocations), 0)::DECIMAL(10,2) as training_resource_count_fte,
    
    -- 14. Interns Count (Headcount)
    COUNT(CASE WHEN ae.employee_type_id = 3 THEN 1 END) as interns_count,
    
    -- 15. Synergy Count (Headcount)
    COUNT(CASE WHEN ae.tier_id = 7 THEN 1 END) as synergy_count,
    
    -- 16. Shared Services Count (Headcount)
    COUNT(CASE WHEN ae.track_id = 6 THEN 1 END) as shared_services_count
FROM active_employees ae;
```

---

## Notes
1. **FTE Calculation**: Divide percentage by 100 (e.g., 150% = 1.5 FTE)
2. **Bench Exclusion**: Bench allocations are excluded from total allocation calculations
3. **Billing vs Allocation**: 
   - **Billing** = ALL employees (no track filter)
   - **Allocation** = ONLY billable tracks (1,2,3,4,5,8,11), excluding interns and external
