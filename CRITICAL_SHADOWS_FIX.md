# Critical Shadows Report - Fixed Implementation

**Date:** 2026-02-09
**Issue:** Non-billing report was showing wrong data (billing_status_id = 2 instead of total billing < 100%)

## Problem Statement

The non-billing report (Critical Shadows) was incorrectly filtering by `billing_status_id = 2` (Non-Billing status).

**Correct Definition:** Critical Shadows are resources whose **total billing percentage is less than 100%**.

## Solution

Fixed both the report API and Excel generation to use the correct logic.

### Before (Incorrect):
```sql
-- Wrong: Only showing allocations with billing_status_id = 2
WHERE a.billing_status_id = 2
```

### After (Correct):
```sql
-- Correct: Show all allocations for resources with total billing < 100%
WITH employee_total_billing AS (
    SELECT 
        employee_id,
        SUM(billing_percentage) as total_billing_percentage
    FROM allocations
    WHERE is_active = true
      AND deleted_at IS NULL
      AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
    GROUP BY employee_id
    HAVING SUM(billing_percentage) < 100  -- Key filter
)
SELECT ...
FROM employee_total_billing etb
JOIN employees e ON etb.employee_id = e.id
JOIN allocations a ON a.employee_id = e.id
...
```

## Changes Made

### 1. Backend Report API (`billing.mjs`)

**File:** `backend/services/report-service/src/handlers/reports/billing.mjs`

**Changes:**
- ✅ Uses CTE `employee_total_billing` to calculate total billing per employee
- ✅ Filters employees with `HAVING SUM(billing_percentage) < 100`
- ✅ Shows **all allocations** for these employees (not just non-billing ones)
- ✅ Orders by `total_billing_percentage ASC` (lowest first)
- ✅ Updated chart queries to match new logic
- ✅ Includes `total_billing_percentage` in response

### 2. Excel Generation (`excel_handler.py`)

**File:** `backend/services/document-service/src/handlers/excel_handler.py`

**Changes:**
- ✅ Same CTE logic as report API
- ✅ Added **5th column**: "Total Billing %" to show employee's total
- ✅ Highlights total billing % in red (all are < 100%)
- ✅ Updated title to clarify: "Critical Shadows (Resources with Total Billing < 100%)"
- ✅ Orders by total_billing_percentage ASC

**New Excel Columns:**
1. Name
2. Project
3. Allocation %
4. Billing %
5. **Total Billing %** ← Shows employee's total across all projects

### 3. Updated Frontend (No changes needed)

Frontend already handles the data correctly from the API. No changes required.

## Example Data

### Scenario:
- **Employee A** has 3 allocations:
  - Project X: 50% allocation, 30% billing
  - Project Y: 30% allocation, 20% billing
  - Project Z: 20% allocation, 40% billing
  - **Total Billing: 90%** (< 100% → Critical Shadow)

### Report Output:
```
┌─────────────┬──────────┬────────────┬───────────┬────────────────┐
│ Name        │ Project  │ Allocation │ Billing % │ Total Billing %│
├─────────────┼──────────┼────────────┼───────────┼────────────────┤
│ Employee A  │ Project X│ 50%        │ 30%       │ 90%            │
│ Employee A  │ Project Y│ 30%        │ 20%       │ 90%            │
│ Employee A  │ Project Z│ 20%        │ 40%       │ 90%            │
└─────────────┴──────────┴────────────┴───────────┴────────────────┘
```

**Note:** All rows for Employee A show the same Total Billing % (90%) because it's their total across all projects.

## Key Logic Changes

### Report API Query Flow:
1. **Calculate totals per employee:**
   ```sql
   SUM(billing_percentage) as total_billing_percentage
   GROUP BY employee_id
   HAVING SUM(billing_percentage) < 100
   ```

2. **Join back to get all allocations:**
   - Shows all active allocations for critical shadow employees
   - Not just non-billing allocations

3. **Include total in each row:**
   - Each allocation row includes the employee's `total_billing_percentage`

### Excel Generation Flow:
1. Same CTE query as report API
2. Display total billing % in dedicated column
3. Highlight in red to emphasize critical status
4. Sort by total billing % (ascending) to show most critical first

## Testing

### Test Cases:

1. **Employee with total billing = 100%**
   - ❌ Should NOT appear in report

2. **Employee with total billing = 90%**
   - ✅ Should appear with all their allocations

3. **Employee with total billing = 50%**
   - ✅ Should appear (more critical, shows first)

4. **Employee with 0% billing (all bench)**
   - ✅ Should appear (most critical)

5. **Track filter applied**
   - ✅ Should only show critical shadows from that track

### API Testing:
```bash
# Get all critical shadows
GET /api/v1/reports/non-billing

# Get critical shadows for track 2 (Dev)
GET /api/v1/reports/non-billing?track_id=2

# Download Excel
GET /api/v1/documents/excel/non-billing

# Download Excel with filter
GET /api/v1/documents/excel/non-billing?track_id=2
```

## Deployment

```bash
# Deploy report service
cd backend/services/report-service
serverless deploy --stage dev

# Deploy document service
cd backend/services/document-service
serverless deploy --stage dev
```

## Summary

✅ **Fixed:** Critical Shadows now correctly shows resources with total billing < 100%
✅ **Added:** Total Billing % column to Excel for clarity
✅ **Improved:** Better title explaining the criteria
✅ **Maintained:** Track filtering still works
✅ **Enhanced:** Ordered by total billing % (most critical first)

The report now accurately identifies resources who are not fully billed across all their allocations, which is the true definition of "Critical Shadows".
