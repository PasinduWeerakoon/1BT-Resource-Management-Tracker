# Allocation Scheduling & Effective Date Management

**Date:** January 31, 2026  
**Status:** Implementation Specification  
**Version:** 2.0  
**Related Files:**

- `backend/services/allocation-service/src/handlers/allocations.js`
- `backend/services/allocation-service/serverless.yml`
- `frontend/src/pages/Allocations/`
- `frontend/src/components/UserAllocationModal/`

---

## Executive Summary

This document defines an **industry-standard bi-temporal allocation management system** that tracks:

1. **Allocated Date** - When the resource was first assigned to a project
2. **Effective Date** - When a change to the allocation takes effect
3. **Allocation Changed On** - The effective date of the most recent change

This approach follows **Slowly Changing Dimension Type 2 (SCD-2)** principles used in enterprise resource planning systems.

---

## Terminology & Field Definitions

### Database Fields

| Current Field | New Field Name            | Description                                                      |
| ------------- | ------------------------- | ---------------------------------------------------------------- |
| `start_date`  | `allocated_date`          | Date when resource was first allocated to project                |
| `end_date`    | `deallocated_date`        | Date when allocation ends (optional, for scheduled deallocation) |
| NEW           | `effective_date`          | Date when a modification takes effect                            |
| NEW           | `allocation_changed_on`   | Effective date of the last modification                          |
| NEW           | `original_allocated_date` | Preserved original allocation date (never changes)               |

### UI Labels

| Context           | Field Label                   | Database Field                                |
| ----------------- | ----------------------------- | --------------------------------------------- |
| Create Allocation | "Allocated Date"              | `allocated_date`                              |
| Create Allocation | "Deallocated Date" (optional) | `deallocated_date`                            |
| Edit Allocation   | "Effective Date"              | Used to set `allocation_changed_on`           |
| Table Display     | "Project Allocated Date"      | `original_allocated_date` or `allocated_date` |
| Table Display     | "Allocation Changed On"       | `allocation_changed_on`                       |

---

## Core Concepts

### 1. Bi-Temporal Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALLOCATION RECORD                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Transaction Time (System)          │  Valid Time (Business)            │
│  ─────────────────────────          │  ─────────────────────            │
│  created_at: When record created    │  allocated_date: When started     │
│  updated_at: When record modified   │  effective_date: When change      │
│                                     │                  takes effect     │
│                                     │  deallocated_date: When ends      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Allocation Lifecycle States

```
                    ┌──────────────┐
                    │   CREATED    │
                    │  (Pending)   │
                    └──────┬───────┘
                           │ allocated_date arrives
                           ▼
                    ┌──────────────┐
        ┌──────────►│   ACTIVE     │◄──────────┐
        │           └──────┬───────┘           │
        │                  │                   │
   Modified with      Modified with       Modified with
   future effective   today's effective   past effective
   date (scheduled)   date (immediate)    date (backdate)
        │                  │                   │
        ▼                  ▼                   ▼
   ┌──────────┐      ┌──────────┐        ┌──────────┐
   │ PENDING  │      │  ACTIVE  │        │  ACTIVE  │
   │ CHANGE   │      │ (Updated)│        │ (Updated)│
   └──────────┘      └──────────┘        └──────────┘
                           │
                           │ deallocated_date arrives
                           ▼
                    ┌──────────────┐
                    │    ENDED     │
                    └──────────────┘
```

---

## Detailed Scenarios

### Scenario 1: New Allocation (Standard)

**Action:** Create new allocation for resource to Project A at 50% starting Feb 1, 2026

**System Behavior:**

```
CREATE allocation:
├─ allocated_date = 2026-02-01
├─ original_allocated_date = 2026-02-01
├─ allocation_changed_on = 2026-02-01 (same as allocated_date for new)
├─ allocation_percentage = 50%
├─ deallocated_date = NULL (ongoing)
└─ allocation_status = 'Pending' (if future) or 'Active' (if today/past)

IF allocated_date > TODAY:
├─ Create PENDING bench allocation:
│  ├─ allocated_date = 2026-02-01 (same effective date)
│  ├─ allocation_percentage = 50% (100 - 50)
│  └─ allocation_status = 'Pending'
└─ Bench auto-activates when allocated_date arrives
```

### Scenario 2: Reduce Allocation Percentage (Future Effective Date)

**Current State:**

- Resource: Test User
- Project A: 100% allocation (since Jan 1, 2026)
- Bench: 0%

**Action:** Reduce Project A to 75% **effective Feb 1, 2026**

**System Behavior:**

```
TODAY (Jan 31, 2026): User submits change with effective_date = Feb 1, 2026

Option A: Create Scheduled Change Record
├─ Keep current allocation at 100% (active until Feb 1)
├─ Create allocation_schedule record:
│  ├─ allocation_id = [Project A allocation]
│  ├─ scheduled_percentage = 75%
│  ├─ effective_date = 2026-02-01
│  ├─ change_type = 'MODIFY'
│  └─ status = 'PENDING'
│
└─ Create PENDING bench allocation:
   ├─ allocated_date = 2026-02-01
   ├─ allocation_percentage = 25%
   ├─ allocation_status = 'Pending'
   └─ notes = 'Auto-created for scheduled reduction of Project A'

Feb 1, 2026 (1:00 AM UTC): Activation Job
├─ Find pending schedule for Project A
├─ UPDATE Project A allocation:
│  ├─ allocation_percentage = 75%
│  ├─ allocation_changed_on = 2026-02-01
│  └─ allocation_status = 'Active'
├─ UPDATE bench allocation:
│  └─ allocation_status = 'Active'
└─ Delete processed schedule record

Option B: Immediate Record Update (Simpler)
├─ UPDATE Project A allocation:
│  ├─ allocation_percentage = 75%
│  ├─ allocation_changed_on = 2026-02-01 (future effective date)
│  └─ Keep original_allocated_date = 2026-01-01
│
└─ CREATE/UPDATE bench allocation:
   ├─ IF bench exists for this resource:
   │  ├─ UPDATE allocation_percentage += 25%
   │  └─ SET allocation_changed_on = 2026-02-01
   ├─ ELSE:
   │  └─ CREATE bench with 25%, allocated_date = 2026-02-01
   └─ Notes: 'Auto-adjusted for Project A change effective Feb 1'
```

### Scenario 3: Resource Already on Bench (Increase Project %)

**Current State:**

- Resource: Test User
- Project A: 50% (since Jan 1, 2026)
- Bench: 50% (auto-created)

**Action:** Increase Project A to 75% **effective Feb 15, 2026**

**System Behavior:**

```
TODAY: User submits change

UPDATE Project A allocation:
├─ allocation_percentage = 75%
├─ allocation_changed_on = 2026-02-15
└─ original_allocated_date = 2026-01-01 (unchanged)

UPDATE Bench allocation:
├─ allocation_percentage = 25% (was 50%)
├─ allocation_changed_on = 2026-02-15
└─ notes = 'Reduced due to Project A increase'
```

### Scenario 4: Full Deallocation (Remove from Project)

**Current State:**

- Resource: Test User
- Project A: 100% (since Jan 1, 2026)

**Action:** Remove from Project A **effective Feb 1, 2026**

**System Behavior:**

```
UPDATE Project A allocation:
├─ deallocated_date = 2026-02-01
├─ allocation_changed_on = 2026-02-01
├─ allocation_status = 'Pending' → 'Ended' (on Feb 1)
└─ is_active = true → false (on Feb 1)

CREATE bench allocation:
├─ allocated_date = 2026-02-01
├─ allocation_percentage = 100%
├─ allocation_status = 'Pending'
└─ notes = 'Deallocated from Project A'
```

### Scenario 5: Change Billing Percentage Only

**Current State:**

- Resource: Test User
- Project A: 50% allocation, 50% billing

**Action:** Change billing to 100% **effective Feb 1, 2026**

**System Behavior:**

```
UPDATE Project A allocation:
├─ billing_percentage = 100%
├─ allocation_changed_on = 2026-02-01
└─ All other fields unchanged

Note: Bench is NOT affected by billing changes (only allocation % matters)
```

### Scenario 6: Backdated Change (Past Effective Date)

**Current State:**

- Resource: Test User
- Project A: 100% (since Jan 1, 2026)

**Action:** Correct allocation to 80% **effective Jan 15, 2026** (past date)

**System Behavior:**

```
UPDATE Project A allocation:
├─ allocation_percentage = 80%
├─ allocation_changed_on = 2026-01-15 (past date allowed for corrections)
└─ original_allocated_date = 2026-01-01 (unchanged)

UPDATE/CREATE bench allocation:
├─ allocation_percentage = 20%
├─ allocation_changed_on = 2026-01-15
└─ notes = 'Backdated correction for Project A'

AUDIT LOG: Record shows this was a backdated correction
```

### Scenario 7: Multiple Scheduled Changes

**Current State:**

- Resource: Test User
- Project A: 100%

**Action:** Schedule multiple changes:

1. Reduce to 75% effective Feb 1
2. Reduce to 50% effective Mar 1
3. End allocation effective Apr 1

**System Behavior:**

```
Option A: Use allocation_schedule table
├─ Schedule 1: {effective: Feb 1, percentage: 75%}
├─ Schedule 2: {effective: Mar 1, percentage: 50%}
└─ Schedule 3: {effective: Apr 1, percentage: 0%, type: DEALLOCATE}

Each schedule processes on its effective date

Option B: Create separate allocation records (SCD-2 approach)
├─ Record 1: 100%, valid Jan 1 - Jan 31
├─ Record 2: 75%, valid Feb 1 - Feb 28
├─ Record 3: 50%, valid Mar 1 - Mar 31
└─ Record 4: ENDED, valid Apr 1 onwards
```

---

## Current Implementation Overview

### Bench Auto-Allocation System

The system automatically manages Bench allocations to ensure resources are always at 100% capacity:

- When creating/updating/deleting project allocations, `adjustBenchAllocation()` is called
- Bench allocation is adjusted to fill gaps (e.g., 70% project → 30% bench)
- Nightly `gapDetectionJob` runs at 2:00 AM UTC to detect and fill any gaps

### Key Functions

1. **`adjustBenchAllocation(resourceId, userId, log)`**
   - Calculates bench percentage as: `100 - nonBenchTotal`
   - Uses `new Date().toISOString().split('T')[0]` → **TODAY's date**
   - Updates/creates bench allocation immediately

2. **`calculateNonBenchTotal(resourceId, excludeAllocationId, startDate, endDate)`**
   - Filters allocations where:
     - `is_active = true`
     - `end_date IS NULL OR end_date >= startDate`
     - `start_date <= COALESCE(endDate, '9999-12-31')`

3. **`detectAndFillGaps(resourceId, userId, log)`** (Nightly Job)
   - Filters allocations where:
     - `is_active = true`
     - `end_date IS NULL OR end_date >= CURRENT_DATE`
     - `start_date <= CURRENT_DATE` ← **Key constraint**

---

## Problem Scenarios Identified

### Scenario 1: Partial Deallocation with Future Start Date

**Situation:**

- Resource currently: 100% on Project A (no end date)
- Today (Jan 30): User changes allocation to 50% **starting Feb 1**
- Expected: 50% bench allocation starting Feb 1

**Current Behavior:**

```
Jan 30 (Today - when change is made):
├─ adjustBenchAllocation() called
├─ Uses TODAY's date (Jan 30) for calculation
├─ Query sees: Project A at 100% (start_date in past, end_date in future/null)
├─ Result: nonBenchTotal = 100%
└─ Bench = 0% (no bench created)

Jan 31:
└─ Still shows 100% Project A, 0% Bench (gap detection only runs at 2 AM UTC)

Feb 1 at 2:00 AM UTC:
├─ gapDetectionJob runs
├─ Now sees: Project A at 50% (start_date = Feb 1)
├─ Detects 50% gap
└─ Creates/updates bench to 50% with start_date = CURRENT_DATE (Feb 1)
```

**Issue:**

- Bench allocation appears on **Feb 1** (when gap detection runs)
- NOT immediately on Jan 30 (when change was scheduled)
- Between Jan 30-31: System shows resource will be only 50% allocated on Feb 1

### Scenario 2: Project Shifting

**Situation:**

- Resource currently: 100% on Project A
- Today (Jan 30):
  - Set Project A end_date = Jan 31
  - Create Project B allocation 100% starting Feb 1

**Current Behavior:**

```
Jan 30 (Today - when changes are made):
├─ UPDATE Project A: end_date = Jan 31
│  ├─ adjustBenchAllocation() called with TODAY (Jan 30)
│  ├─ Query sees Project A at 100% (end_date Jan 31 >= Jan 30)
│  └─ Bench = 0%
│
└─ CREATE Project B: start_date = Feb 1
   ├─ adjustBenchAllocation() called with TODAY (Jan 30)
   ├─ Query ignores Project B (start_date Feb 1 > Jan 30)
   ├─ Query sees Project A at 100%
   └─ Bench = 0%

Feb 1 at 2:00 AM UTC:
├─ gapDetectionJob runs
├─ Project A: end_date = Jan 31 < Feb 1 → NOT counted
├─ Project B: start_date = Feb 1, no end_date → counted at 100%
└─ Result: 100% allocated, 0% bench (CORRECT)
```

**Result:** ✅ **Works correctly** - No bench needed, transition handled properly by nightly job

### Scenario 3: Scheduled Full Deallocation (Future End Date)

**Situation:**

- Resource currently: 100% on Project A (no end date)
- User wants to schedule: "Deallocate this resource from Project A next week (Feb 7)"

**Current System Limitation:**

```
Option A: Set end_date = Feb 7 TODAY
├─ Allocation still shows active until Feb 7
├─ On Feb 7 at 2 AM: Gap detection sees 0% → creates 100% bench
└─ Issue: No way to distinguish "active until Feb 7" from "scheduled to end Feb 7"

Option B: Wait until Feb 7 and manually set end_date
├─ Requires manual action on exact date
└─ No scheduling capability
```

**Missing Feature:** No explicit "scheduled deallocation" status

### Scenario 4: Scheduled Future Allocation

**Situation:**

- User wants to pre-schedule: "Allocate this resource to Project C starting March 1"
- Resource currently on other projects

**Current System:**

- Can create allocation with future start_date ✓
- But capacity warnings/validations use TODAY's date
- Reports may not show accurate future utilization
- Bench won't auto-adjust until start_date arrives

---

## Impact Analysis

### 1. Data Accuracy Gap

**Period:** Between when change is scheduled and when it takes effect

- Reports show incomplete/incorrect allocations for future dates
- Resource utilization projections are inaccurate
- Bench allocations don't reflect scheduled changes

### 2. User Experience

- Users expect immediate feedback when scheduling changes
- Current system: "silent" until effective date
- No way to visualize upcoming allocation changes

### 3. Capacity Planning

- Project managers can't accurately see future resource availability
- Account managers can't plan bench resources in advance
- No way to query "what will allocations look like on [future date]?"

---

## Proposed Solutions

### Solution Option 1: Immediate Future-Dated Bench Creation ⭐ RECOMMENDED

**Approach:** When allocation with future start_date is created/updated, immediately create corresponding bench allocation with matching dates

**Implementation:**

```javascript
// Enhance adjustBenchAllocation to handle future dates
const adjustBenchAllocation = async (
  resourceId,
  userId,
  effectiveDate,
  log,
) => {
  // If effectiveDate is provided, use it; otherwise use TODAY
  const calculationDate =
    effectiveDate || new Date().toISOString().split("T")[0];

  const benchProjectId = await getBenchProjectId();
  const nonBenchTotal = await calculateNonBenchTotal(
    resourceId,
    null,
    calculationDate, // Use effective date for calculation
    null,
  );
  const newBenchPercentage = Math.max(0, 100 - nonBenchTotal);

  // Create/update bench with matching start_date
  if (newBenchPercentage > 0) {
    // Check if bench exists for this date range
    const benchAllocation = await getBenchAllocationForDate(
      resourceId,
      calculationDate,
    );

    if (benchAllocation) {
      // Update existing bench allocation
      await db.query(
        `
                UPDATE allocations 
                SET allocation_percentage = $2, 
                    is_active = true, 
                    updated_by = $3, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `,
        [benchAllocation.id, newBenchPercentage, userId],
      );
    } else {
      // Create new bench allocation with future start_date
      await db.query(
        `
                INSERT INTO allocations (
                    resource_id, project_id, allocation_percentage, 
                    billing_percentage, start_date, is_active, notes, created_by
                )
                VALUES ($1, $2, $3, 0, $4::date, true, 'Auto-created for scheduled change', $5)
            `,
        [
          resourceId,
          benchProjectId,
          newBenchPercentage,
          calculationDate,
          userId,
        ],
      );
    }
  }

  return newBenchPercentage;
};
```

**Changes Required:**

1. Modify `adjustBenchAllocation()` to accept optional `effectiveDate` parameter
2. When creating/updating allocation with future start_date:
   - Pass `validated.start_date` as effectiveDate
   - Create bench allocation with same start_date
3. Update `calculateNonBenchTotal()` to handle date-specific calculations

**Benefits:**

- ✅ Immediate visibility of scheduled changes
- ✅ Accurate future utilization projections
- ✅ Bench allocations align with project allocation dates
- ✅ No waiting for nightly job

**Risks:**

- May create multiple bench allocations for same resource (different date ranges)
- Need to handle bench allocation merging/splitting logic
- Increased complexity in bench management

---

### Solution Option 2: Allocation Status with Pending State

**Approach:** Add `allocation_status` field to differentiate current vs scheduled allocations

**Database Migration 019:**

```sql
ALTER TABLE allocations
ADD COLUMN allocation_status VARCHAR(20) DEFAULT 'Active'
CHECK (allocation_status IN ('Pending', 'Active', 'Ended', 'Cancelled'));

CREATE INDEX idx_allocations_status ON allocations(allocation_status);
```

**Business Logic:**

- `Pending`: start_date > CURRENT_DATE (scheduled, not yet active)
- `Active`: start_date <= CURRENT_DATE AND (end_date IS NULL OR end_date >= CURRENT_DATE)
- `Ended`: end_date < CURRENT_DATE
- `Cancelled`: User cancelled before start_date

**Scheduled Job: Activation Service**

```javascript
// New job: activateScheduledAllocations
// Runs daily at 1:00 AM UTC (before gap detection)
export const activateScheduledAllocations = async (event) => {
  // Find all Pending allocations where start_date = TODAY
  const pendingAllocations = await db.query(`
        SELECT * FROM allocations 
        WHERE allocation_status = 'Pending' 
        AND start_date = CURRENT_DATE
        AND is_active = true
    `);

  // Update status to Active
  for (const allocation of pendingAllocations.rows) {
    await db.query(
      `
            UPDATE allocations 
            SET allocation_status = 'Active',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `,
      [allocation.id],
    );

    // Trigger bench adjustment for resource
    await adjustBenchAllocation(allocation.resource_id, systemUserId, log);
  }

  // Find all Active allocations where end_date = YESTERDAY
  const endingAllocations = await db.query(`
        SELECT * FROM allocations 
        WHERE allocation_status = 'Active' 
        AND end_date = CURRENT_DATE - INTERVAL '1 day'
        AND is_active = true
    `);

  // Update status to Ended
  for (const allocation of endingAllocations.rows) {
    await db.query(
      `
            UPDATE allocations 
            SET allocation_status = 'Ended',
                is_active = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `,
      [allocation.id],
    );

    // Trigger bench adjustment for resource
    await adjustBenchAllocation(allocation.resource_id, systemUserId, log);
  }
};
```

**Validation Updates:**

```javascript
// Exclude Pending allocations from capacity calculations
const calculateNonBenchTotal = async (
  resourceId,
  excludeAllocationId,
  startDate,
  endDate,
) => {
  let query = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE resource_id = $1
        AND project_id != $2
        AND allocation_status = 'Active'  -- Only count Active allocations
        AND is_active = true
        AND (end_date IS NULL OR end_date >= $3::date)
        AND start_date <= COALESCE($4::date, '9999-12-31'::date)
    `;
  // ... rest of logic
};
```

**Benefits:**

- ✅ Clear separation between current and scheduled allocations
- ✅ Easy to query "what's scheduled?" vs "what's active now?"
- ✅ Supports cancellation of scheduled allocations before they start
- ✅ Better audit trail for allocation lifecycle
- ✅ Enables scheduling UI features (calendar view, upcoming changes)

**Risks:**

- Requires database migration
- All existing allocations need status backfilled
- More complex queries (need to consider status in all queries)

---

### Solution Option 3: Hybrid Approach ⭐⭐ MOST COMPREHENSIVE

**Combine both solutions:**

1. Add `allocation_status` field (Solution 2)
2. Implement immediate bench creation for future dates (Solution 1)
3. Add activation scheduled job to transition statuses

**Workflow Example:**

```
TODAY (Jan 30): User changes Project A from 100% to 50% starting Feb 1

Step 1: Update Project A allocation
├─ Set allocation_percentage = 50
├─ Set start_date = Feb 1
├─ Set allocation_status = 'Pending' (since start_date > CURRENT_DATE)
└─ is_active = true

Step 2: Create bench allocation immediately
├─ Calculate: 100% - 50% (Project A) = 50% bench needed
├─ Create bench allocation:
│  ├─ allocation_percentage = 50
│  ├─ start_date = Feb 1 (same as Project A change)
│  ├─ allocation_status = 'Pending'
│  └─ notes = 'Auto-created for scheduled allocation change'
└─ Result: User sees 50% bench scheduled for Feb 1 immediately

Feb 1 at 1:00 AM UTC: Activation Job
├─ Find allocations with status='Pending' and start_date = Feb 1
├─ Update Project A allocation: status = 'Active'
├─ Update bench allocation: status = 'Active'
└─ Both allocations now active

Feb 1 at 2:00 AM UTC: Gap Detection Job (Backup)
├─ Recalculates all active allocations
├─ Verifies bench is at 50%
└─ No changes needed (already correct from activation job)
```

**Benefits:**

- ✅ Immediate visibility (Solution 1)
- ✅ Clear lifecycle management (Solution 2)
- ✅ Robust with backup gap detection
- ✅ Supports all scheduling scenarios
- ✅ Accurate reporting for any date (past, present, future)

---

## API Enhancements Needed

### New Endpoints

1. **GET /api/v1/allocations/scheduled**

   ```javascript
   // Get all scheduled (Pending) allocations
   // Query params: resource_id, project_id, start_date_from, start_date_to
   ```

2. **GET /api/v1/allocations/upcoming**

   ```javascript
   // Get allocations starting soon (next 7/14/30 days)
   // Useful for "What's changing next week?" reports
   ```

3. **GET /api/v1/allocations/ending-soon**

   ```javascript
   // Get allocations ending soon
   // Query param: days (default: 7)
   ```

4. **POST /api/v1/allocations/{id}/cancel**

   ```javascript
   // Cancel a Pending allocation before it starts
   // Sets allocation_status = 'Cancelled', is_active = false
   ```

5. **GET /api/v1/resources/{id}/timeline**
   ```javascript
   // Get allocation timeline for a resource
   // Shows past (Ended), current (Active), and future (Pending) allocations
   // Useful for capacity planning and visualization
   ```

### Enhanced Existing Endpoints

**POST /api/v1/allocations** (Create)

- Auto-set `allocation_status = 'Pending'` if start_date > CURRENT_DATE
- Auto-set `allocation_status = 'Active'` if start_date <= CURRENT_DATE
- Immediately create future-dated bench allocation if needed

**PUT /api/v1/allocations/{id}** (Update)

- If changing start_date to future: update status to 'Pending'
- If changing start_date to past/today: update status to 'Active'
- Adjust bench allocation dates to match

---

## UI/UX Enhancements Needed

### 1. Allocation Form

```
Current:
[Resource] [Project] [%] [Start Date] [End Date]

Enhanced:
[Resource] [Project] [%] [Start Date] [End Date]
└─ Warning: "This allocation will be Pending until Feb 1, 2026"
└─ Info: "50% bench allocation will be auto-created starting Feb 1"
```

### 2. Resource Allocation View

```
Current:
Project A: 100% (Active)

Enhanced:
━━━ Current (as of Jan 30) ━━━
Project A: 100% (Active)
Total: 100%

━━━ Scheduled (starting Feb 1) ━━━
Project A: 50% (Pending → Active on Feb 1)
Bench: 50% (Pending → Active on Feb 1)
Total: 100%
```

### 3. Calendar/Timeline View

```
┌──────────────────────────────────────────┐
│  January        │  February       │ March│
├─────────────────┼─────────────────┼──────┤
│ Project A 100%  │ Project A 50%   │      │
│                 │ Bench 50%       │      │
│                 │ (starts Feb 1)  │      │
└─────────────────┴─────────────────┴──────┘
         ▲ Today                ▲ Scheduled Change
```

### 4. Status Badges

- 🟢 **Active** - Currently running
- 🟡 **Pending** - Scheduled to start
- ⚫ **Ended** - Completed
- 🔴 **Cancelled** - Cancelled before start

---

## Implementation Recommendations

### Phase 1: Foundation (Week 1)

1. ✅ Document current behavior and gaps (this document)
2. Create Migration 019: Add allocation_status column
3. Backfill existing allocations with correct status
4. Update validation queries to consider status

### Phase 2: Core Scheduling Logic (Week 2)

1. Enhance `adjustBenchAllocation()` to handle future dates
2. Modify create/update handlers to set status based on start_date
3. Implement immediate bench creation for future dates
4. Create `activateScheduledAllocations` scheduled job
5. Update serverless.yml with new schedule (1 AM UTC)

### Phase 3: API Enhancements (Week 3)

1. Add new endpoints: /scheduled, /upcoming, /ending-soon, /cancel
2. Enhance existing endpoints with status handling
3. Add /timeline endpoint for visualization
4. Update API documentation

### Phase 4: UI/UX (Week 4)

1. Add status badges to allocation lists
2. Implement timeline/calendar view
3. Add "scheduled changes" section to resource page
4. Create cancellation UI for pending allocations
5. Add warnings/info messages for future-dated changes

### Phase 5: Testing & Validation (Week 5)

1. Test all scheduling scenarios
2. Verify nightly jobs work correctly
3. Test status transitions (Pending → Active → Ended)
4. Verify bench auto-creation for various date combinations
5. Load test with multiple scheduled changes

---

## Database Schema Changes

### Migration 019: Effective Date & Allocation Tracking

```sql
-- Migration: 019_effective_date_tracking.sql

-- Step 1: Add new columns to allocations table
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS original_allocated_date DATE,
ADD COLUMN IF NOT EXISTS allocation_changed_on DATE,
ADD COLUMN IF NOT EXISTS allocation_status VARCHAR(20) DEFAULT 'Active'
    CHECK (allocation_status IN ('Pending', 'Active', 'Ended', 'Cancelled'));

-- Step 2: Rename existing columns for clarity (optional - can keep as aliases)
-- Note: If renaming, update all queries in codebase
-- ALTER TABLE allocations RENAME COLUMN start_date TO allocated_date;
-- ALTER TABLE allocations RENAME COLUMN end_date TO deallocated_date;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations(allocation_status);
CREATE INDEX IF NOT EXISTS idx_allocations_changed_on ON allocations(allocation_changed_on);
CREATE INDEX IF NOT EXISTS idx_allocations_effective_lookup
    ON allocations(resource_id, allocation_status, start_date);

-- Step 4: Backfill existing data
UPDATE allocations
SET
    original_allocated_date = start_date,
    allocation_changed_on = COALESCE(updated_at::date, start_date),
    allocation_status = CASE
        WHEN start_date > CURRENT_DATE THEN 'Pending'
        WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'Ended'
        WHEN is_active = false THEN 'Ended'
        ELSE 'Active'
    END
WHERE original_allocated_date IS NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN allocations.original_allocated_date IS 'Original date when resource was first allocated to project (never changes)';
COMMENT ON COLUMN allocations.allocation_changed_on IS 'Effective date of the most recent modification';
COMMENT ON COLUMN allocations.allocation_status IS 'Pending=future, Active=current, Ended=past, Cancelled=never activated';
```

### Optional: Allocation Change History Table

```sql
-- For full audit trail of all changes (SCD-2 approach)
CREATE TABLE IF NOT EXISTS allocation_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID NOT NULL REFERENCES allocations(id),

    -- What changed
    previous_percentage DECIMAL(5,2),
    new_percentage DECIMAL(5,2),
    previous_billing_percentage DECIMAL(5,2),
    new_billing_percentage DECIMAL(5,2),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN (
        'CREATE', 'MODIFY_ALLOCATION', 'MODIFY_BILLING',
        'DEALLOCATE', 'REACTIVATE', 'CANCEL'
    )),

    -- When
    effective_date DATE NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Who
    changed_by UUID REFERENCES users(id),

    -- Why
    change_reason TEXT,

    -- Indexes
    CONSTRAINT idx_allocation_changes_lookup
        UNIQUE (allocation_id, effective_date, change_type)
);

CREATE INDEX idx_allocation_changes_date ON allocation_changes(effective_date);
CREATE INDEX idx_allocation_changes_allocation ON allocation_changes(allocation_id);
```

---

## API Specification

### Updated Endpoints

#### POST /api/v1/allocations (Create)

**Request Body:**

```json
{
  "resource_id": "uuid",
  "project_id": "uuid",
  "allocation_percentage": 50,
  "billing_percentage": 100,
  "allocated_date": "2026-02-01", // When allocation starts
  "deallocated_date": "2027-01-01", // Optional: When allocation ends
  "notes": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "resource_id": "uuid",
    "project_id": "uuid",
    "allocation_percentage": 50,
    "billing_percentage": 100,
    "allocated_date": "2026-02-01",
    "deallocated_date": "2027-01-01",
    "original_allocated_date": "2026-02-01",
    "allocation_changed_on": "2026-02-01",
    "allocation_status": "Pending",
    "is_active": true,
    "notes": "string",
    "created_at": "timestamp"
  }
}
```

#### PUT /api/v1/allocations/{id} (Update)

**Request Body:**

```json
{
  "allocation_percentage": 75,
  "billing_percentage": 100,
  "effective_date": "2026-02-15", // NEW: When this change takes effect
  "deallocated_date": null, // Optional: Set/clear end date
  "notes": "Increased allocation per client request"
}
```

**Business Logic:**

```javascript
// If effective_date is provided and in the future:
//   - Update allocation with future effective_date
//   - Set allocation_changed_on = effective_date
//   - Auto-adjust bench with same effective_date
//   - Status remains 'Active' but change is "scheduled"

// If effective_date is today or past:
//   - Update allocation immediately
//   - Set allocation_changed_on = effective_date
//   - Auto-adjust bench immediately
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "allocation_percentage": 75,
    "billing_percentage": 100,
    "allocated_date": "2026-01-01",
    "deallocated_date": null,
    "original_allocated_date": "2026-01-01",
    "allocation_changed_on": "2026-02-15",
    "allocation_status": "Active",
    "is_active": true
  },
  "bench_adjustment": {
    "id": "uuid",
    "new_percentage": 25,
    "effective_date": "2026-02-15",
    "status": "Pending"
  }
}
```

### New Endpoints

#### GET /api/v1/allocations/scheduled

**Query Parameters:**

- `resource_id` (optional): Filter by resource
- `project_id` (optional): Filter by project
- `effective_from` (optional): Changes effective from date
- `effective_to` (optional): Changes effective until date

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "resource_name": "Test User",
      "project_name": "Project A",
      "current_percentage": 100,
      "scheduled_percentage": 75,
      "effective_date": "2026-02-15",
      "change_type": "reduction",
      "days_until_effective": 15
    }
  ]
}
```

#### GET /api/v1/resources/{id}/allocation-timeline

**Query Parameters:**

- `from_date` (optional): Start of timeline
- `to_date` (optional): End of timeline

**Response:**

```json
{
  "success": true,
  "data": {
    "resource_id": "uuid",
    "resource_name": "Test User",
    "timeline": [
      {
        "date_range": { "from": "2026-01-01", "to": "2026-01-31" },
        "allocations": [
          { "project": "Project A", "percentage": 100, "status": "Active" }
        ],
        "total_allocation": 100
      },
      {
        "date_range": { "from": "2026-02-01", "to": null },
        "allocations": [
          { "project": "Project A", "percentage": 75, "status": "Pending" },
          { "project": "Bench", "percentage": 25, "status": "Pending" }
        ],
        "total_allocation": 100
      }
    ]
  }
}
```

---

## Frontend Specifications

### 1. Create Allocation Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Create Allocation                                      ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  * Resource (Employee)          * Project                   │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ Select Resource   ▼ │        │ Select Project    ▼ │    │
│  └─────────────────────┘        └─────────────────────┘    │
│                                                             │
│  * Allocation Percentage        * Billing Percentage        │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ 50%                 │        │ 100%                │    │
│  └─────────────────────┘        └─────────────────────┘    │
│                                                             │
│  * Allocated Date               Deallocated Date            │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ 📅 2026-02-01      │        │ 📅 (Optional)       │    │
│  └─────────────────────┘        └─────────────────────┘    │
│  ℹ️ When resource starts        ℹ️ When allocation ends    │
│     on this project                (leave empty if ongoing) │
│                                                             │
│  Notes                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter allocation notes (optional)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ This allocation will be PENDING until Feb 1, 2026      │
│  ℹ️ 50% bench allocation will be auto-created              │
│                                                             │
│                              ┌─────────┐  ┌─────────────┐  │
│                              │ Cancel  │  │   Create    │  │
│                              └─────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Edit Allocation Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Allocation                                        ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Resource (Employee)            Project                     │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ Test User        🔒 │        │ Test Pasindu 0001🔒 │    │
│  └─────────────────────┘        └─────────────────────┘    │
│                                                             │
│  * Allocation Percentage        * Billing Percentage        │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ 75%                 │        │ 100%                │    │
│  └─────────────────────┘        └─────────────────────┘    │
│  Currently: 100%                Currently: 100%             │
│                                                             │
│  * Effective Date                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 2026-02-15                                      ⊗│   │
│  └─────────────────────────────────────────────────────┘   │
│  ℹ️ When this change takes effect                          │
│  ⚡ Quick: [Today] [Tomorrow] [Next Week] [Next Month]     │
│                                                             │
│  Deallocated Date (Optional)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 (Not set - allocation ongoing)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Notes                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Reduced allocation per client request                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 CHANGE SUMMARY                                    │   │
│  │ • Allocation: 100% → 75% (-25%)                     │   │
│  │ • Effective: Feb 15, 2026 (in 15 days)              │   │
│  │ • Bench will increase: 0% → 25%                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              ┌─────────┐  ┌─────────────┐  │
│                              │ Cancel  │  │   Update    │  │
│                              └─────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3. By Allocation Table (Updated Columns)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ BY ALLOCATION - Test Pasindu 0001                                                          + Add Allocation   │
├──────────────────┬─────────────────┬──────────────────┬────────────────────┬───────────┬──────────┬──────────┤
│ Employee Name    │ Project         │ Allocated Date   │ Allocation Changed │ Billing % │ Alloc %  │ Status   │
│                  │                 │                  │ On                 │           │          │          │
├──────────────────┼─────────────────┼──────────────────┼────────────────────┼───────────┼──────────┼──────────┤
│ Test User        │ Test Pasindu    │ 01 Jan 2026      │ 15 Feb 2026       │ 100.00%   │ 75.00%   │ 🟡Pending│
│                  │ 0001            │                  │ (in 15 days)       │           │          │          │
├──────────────────┼─────────────────┼──────────────────┼────────────────────┼───────────┼──────────┼──────────┤
│ Hirun Chamara    │ Test Pasindu    │ 01 Jan 2026      │ 01 Jan 2026       │ 100.00%   │ 100.00%  │ 🟢Active │
│                  │ 0001            │                  │                    │           │          │          │
├──────────────────┼─────────────────┼──────────────────┼────────────────────┼───────────┼──────────┼──────────┤
│ Pasindu W.       │ Test Pasindu    │ 01 Jan 2026      │ 01 Jan 2026       │ 100.00%   │ 100.00%  │ 🟢Active │
│                  │ 0001            │                  │                    │           │          │          │
└──────────────────┴─────────────────┴──────────────────┴────────────────────┴───────────┴──────────┴──────────┘
```

### 4. Status Badges

```css
/* Status color scheme */
.status-pending {
  background: #fef3c7; /* Yellow-100 */
  color: #92400e; /* Yellow-800 */
  border: 1px solid #fcd34d;
}

.status-active {
  background: #d1fae5; /* Green-100 */
  color: #065f46; /* Green-800 */
  border: 1px solid #6ee7b7;
}

.status-ended {
  background: #e5e7eb; /* Gray-200 */
  color: #374151; /* Gray-700 */
  border: 1px solid #9ca3af;
}

.status-cancelled {
  background: #fee2e2; /* Red-100 */
  color: #991b1b; /* Red-800 */
  border: 1px solid #fca5a5;
}
```

### 5. Change Summary Component

```jsx
// ChangeSummary.jsx
const ChangeSummary = ({ currentAllocation, newValues, effectiveDate }) => {
  const changes = [];

  if (
    newValues.allocation_percentage !== currentAllocation.allocation_percentage
  ) {
    const diff =
      newValues.allocation_percentage - currentAllocation.allocation_percentage;
    changes.push({
      label: "Allocation",
      from: `${currentAllocation.allocation_percentage}%`,
      to: `${newValues.allocation_percentage}%`,
      diff: `${diff > 0 ? "+" : ""}${diff}%`,
    });
  }

  if (newValues.billing_percentage !== currentAllocation.billing_percentage) {
    changes.push({
      label: "Billing",
      from: `${currentAllocation.billing_percentage}%`,
      to: `${newValues.billing_percentage}%`,
    });
  }

  const daysUntil = dayjs(effectiveDate).diff(dayjs(), "day");

  return (
    <div className="change-summary">
      <h4>📋 Change Summary</h4>
      {changes.map((change) => (
        <div key={change.label}>
          • {change.label}: {change.from} → {change.to}
          {change.diff && `(${change.diff})`}
        </div>
      ))}
      <div>
        • Effective: {dayjs(effectiveDate).format("MMM D, YYYY")}
        {daysUntil > 0 && ` (in ${daysUntil} days)`}
        {daysUntil === 0 && ` (today)`}
        {daysUntil < 0 && ` (backdated)`}
      </div>
      {/* Bench impact */}
      <BenchImpactPreview
        resourceId={currentAllocation.resource_id}
        newAllocationPercentage={newValues.allocation_percentage}
        effectiveDate={effectiveDate}
      />
    </div>
  );
};
```

---

## Implementation Phases (Updated)

### Phase 1: Database & Backend Core (Week 1)

**Day 1-2: Database Migration**

- [ ] Create Migration 019 with new columns
- [ ] Add indexes for performance
- [ ] Backfill existing data
- [ ] Test migration rollback

**Day 3-4: Backend Model Updates**

- [ ] Update allocation model with new fields
- [ ] Update validation schemas (Joi)
- [ ] Add effective_date to create/update handlers
- [ ] Implement allocation_status logic

**Day 5: Bench Adjustment Logic**

- [ ] Modify `adjustBenchAllocation()` to accept effectiveDate
- [ ] Implement immediate bench creation for future dates
- [ ] Update bench allocation_changed_on field
- [ ] Test all bench scenarios

### Phase 2: API & Scheduled Jobs (Week 2)

**Day 1-2: API Updates**

- [ ] Update POST /allocations with new field names
- [ ] Update PUT /allocations with effective_date
- [ ] Add response field mapping
- [ ] Update API validation

**Day 3-4: New Endpoints**

- [ ] GET /allocations/scheduled
- [ ] GET /resources/{id}/allocation-timeline
- [ ] GET /allocations/upcoming
- [ ] POST /allocations/{id}/cancel

**Day 5: Scheduled Jobs**

- [ ] Create activationJob (1:00 AM UTC)
- [ ] Update gapDetectionJob for new fields
- [ ] Add status transition logic
- [ ] Test job execution

### Phase 3: Frontend - Forms (Week 3)

**Day 1-2: Create Allocation Modal**

- [ ] Rename Start Date → Allocated Date
- [ ] Rename End Date → Deallocated Date
- [ ] Add info tooltips
- [ ] Add pending status warning
- [ ] Add bench preview

**Day 3-4: Edit Allocation Modal**

- [ ] Add Effective Date field
- [ ] Add quick date buttons
- [ ] Add Change Summary component
- [ ] Add bench impact preview
- [ ] Disable Resource/Project fields

**Day 5: Form Validation**

- [ ] Effective date validation
- [ ] Backdating warning/confirmation
- [ ] Capacity validation with effective date
- [ ] Error message updates

### Phase 4: Frontend - Tables & Display (Week 4)

**Day 1-2: Allocation Table Updates**

- [ ] Replace "Deallocated Date" → "Allocation Changed On"
- [ ] Add Status column with badges
- [ ] Add "days until effective" indicator
- [ ] Update column sorting

**Day 3-4: Resource Views**

- [ ] Update resource allocation display
- [ ] Add scheduled changes section
- [ ] Add timeline visualization (optional)

**Day 5: Reports**

- [ ] Update allocation reports
- [ ] Add scheduled changes filter
- [ ] Update export formats

### Phase 5: Testing & Documentation (Week 5)

**Day 1-2: Unit Tests**

- [ ] Test all scenario combinations
- [ ] Test status transitions
- [ ] Test bench auto-adjustment
- [ ] Test effective date edge cases

**Day 3-4: Integration Tests**

- [ ] End-to-end allocation workflows
- [ ] Scheduled job testing
- [ ] API contract tests

**Day 5: Documentation**

- [ ] Update API documentation
- [ ] Update user guide
- [ ] Create release notes

---

## Edge Cases & Validation Rules

### 1. Effective Date Rules

| Scenario                             | Allowed?   | Behavior                                 |
| ------------------------------------ | ---------- | ---------------------------------------- |
| Effective date = today               | ✅ Yes     | Immediate change                         |
| Effective date = future              | ✅ Yes     | Scheduled change                         |
| Effective date = past (last 30 days) | ✅ Yes     | Backdated correction (audit logged)      |
| Effective date = past (>30 days)     | ⚠️ Warning | Requires confirmation                    |
| Effective date before allocated_date | ❌ No      | Error: Cannot be before allocation start |

### 2. Percentage Validation

```javascript
// Capacity validation must consider effective date
const validateCapacity = async (
  resourceId,
  newPercentage,
  effectiveDate,
  excludeId,
) => {
  // Get all active allocations for the resource ON THE EFFECTIVE DATE
  const allocations = await db.query(
    `
        SELECT SUM(allocation_percentage) as total
        FROM allocations
        WHERE resource_id = $1
        AND id != COALESCE($4, '00000000-0000-0000-0000-000000000000')
        AND is_active = true
        AND (
            (allocation_changed_on <= $2 AND start_date <= $2)
            OR 
            (allocation_changed_on > CURRENT_DATE AND allocation_changed_on <= $2)
        )
        AND (end_date IS NULL OR end_date >= $2)
    `,
    [resourceId, effectiveDate, effectiveDate, excludeId],
  );

  const currentTotal = allocations.rows[0].total || 0;
  const newTotal = currentTotal + newPercentage;

  if (newTotal > 100) {
    throw new Error(`Capacity exceeded: ${newTotal}% on ${effectiveDate}`);
  }
};
```

### 3. Conflicting Changes

```javascript
// Prevent overlapping scheduled changes
const checkConflictingChanges = async (allocationId, effectiveDate) => {
  const existing = await db.query(
    `
        SELECT * FROM allocations
        WHERE id = $1
        AND allocation_changed_on > CURRENT_DATE
        AND allocation_changed_on != $2
    `,
    [allocationId, effectiveDate],
  );

  if (existing.rows.length > 0) {
    throw new Error(
      `Conflicting scheduled change exists for ${existing.rows[0].allocation_changed_on}`,
    );
  }
};
```

---

## Success Metrics

1. **Accuracy:** Future utilization projections match actual allocations on effective date
2. **Timeliness:** Scheduled changes visible immediately (not waiting for nightly job)
3. **User Satisfaction:** Can schedule changes in advance without manual intervention
4. **System Health:** Nightly jobs complete successfully with new logic
5. **Data Integrity:** No orphaned bench allocations, all resources at 100% capacity
6. **Audit Compliance:** All changes tracked with effective dates and timestamps

---

## Related Documentation

- [ALLOCATION_LOGIC.md](./ALLOCATION_LOGIC.md) - Current allocation business rules
- [API_DOCUMENTATION.csv](./API_DOCUMENTATION.csv) - API endpoints
- [PRD.md](./PRD.md) - Product requirements

---

## Appendix: Field Mapping Reference

### Database to API

| Database Column           | API Field (Create) | API Field (Update)    | UI Label              |
| ------------------------- | ------------------ | --------------------- | --------------------- |
| `start_date`              | `allocated_date`   | - (not editable)      | Allocated Date        |
| `end_date`                | `deallocated_date` | `deallocated_date`    | Deallocated Date      |
| `original_allocated_date` | auto-set           | - (not editable)      | -                     |
| `allocation_changed_on`   | auto-set           | from `effective_date` | Allocation Changed On |
| `allocation_status`       | auto-calculated    | auto-calculated       | Status                |

### Status Determination Logic

```javascript
const determineStatus = (allocation) => {
  const today = new Date().toISOString().split("T")[0];

  if (allocation.is_active === false) {
    return "Cancelled";
  }

  if (allocation.end_date && allocation.end_date < today) {
    return "Ended";
  }

  if (allocation.start_date > today) {
    return "Pending";
  }

  if (allocation.allocation_changed_on > today) {
    return "Active"; // But with pending changes
  }

  return "Active";
};
```

---

**Document Version:** 2.0  
**Last Updated:** January 31, 2026  
**Status:** Approved for Implementation  
**Author:** Development Team
