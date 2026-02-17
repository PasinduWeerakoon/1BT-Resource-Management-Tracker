# Allocation Scheduling & Effective Date Management

**Date:** January 31, 2026  
**Status:** Implementation Specification  
**Version:** 3.0  
**Related Files:**

- `backend/services/allocation-service/src/handlers/allocations.js`
- `backend/services/allocation-service/serverless.yml`
- `frontend/src/pages/Allocations/`
- `frontend/src/components/UserAllocationModal/`

---

## Executive Summary

This document defines an **industry-standard temporal allocation management system** using a **3-Table Architecture**:

| Table                  | Purpose                      | Data State                              |
| ---------------------- | ---------------------------- | --------------------------------------- |
| **future_allocations** | Scheduled allocations        | `effective_date > TODAY`                |
| **allocations**        | Current active allocations   | `effective_date <= TODAY` and not ended |
| **allocation_history** | Historical/ended allocations | Deallocated or archived                 |

This approach follows the **Event Sourcing** and **Temporal Tables** pattern used in enterprise HR/ERP systems like SAP, Workday, and Oracle HCM.

### Allocation Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ALLOCATION LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Creates Allocation                                                    │
│            │                                                                 │
│            ▼                                                                 │
│   ┌────────────────────┐                                                    │
│   │ Is effective_date  │                                                    │
│   │   > TODAY?         │                                                    │
│   └─────────┬──────────┘                                                    │
│             │                                                                │
│      ┌──────┴──────┐                                                        │
│      │             │                                                         │
│     YES           NO                                                         │
│      │             │                                                         │
│      ▼             ▼                                                         │
│ ┌──────────┐  ┌──────────┐                                                  │
│ │ FUTURE   │  │ALLOCATIONS│  ← Direct insert (today or past effective)      │
│ │ALLOCATIONS│  └─────┬────┘                                                  │
│ └────┬─────┘        │                                                        │
│      │              │                                                        │
│      │ Scheduler    │ When deallocated                                       │
│      │ (daily 1AM)  │ or ended                                               │
│      │              │                                                        │
│      ▼              ▼                                                        │
│ ┌──────────┐  ┌──────────────┐                                              │
│ │ALLOCATIONS│  │ ALLOCATION   │                                              │
│ │(on eff.  │  │ HISTORY      │                                              │
│ │  date)   │──▶│              │                                              │
│ └──────────┘  └──────────────┘                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Business Scenarios

### Scenario 1: Backdated Allocation (Effective Date < Today)

**Context:** Today is **31/01/2026**  
**Action:** Allocate employee 50% to **ABC Project** with effective date **25/01/2026**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: Backdated Allocation                                            │
│ Today: 31/01/2026 | Effective Date: 25/01/2026 (PAST)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CASE A: Employee was on BENCH (50%+ on bench)                               │
│ ─────────────────────────────────────────────                               │
│                                                                              │
│   AUTOMATIC ACTIONS:                                                         │
│   1. INSERT into allocations:                                               │
│      • resource_id, project_id = ABC                                        │
│      • allocation_percentage = 50%                                          │
│      • effective_date = 25/01/2026                                          │
│      • allocated_date = 25/01/2026                                          │
│                                                                              │
│   2. UPDATE bench allocation:                                               │
│      • allocation_percentage -= 50%                                         │
│      • allocation_changed_on = 25/01/2026                                   │
│      • IF bench becomes 0% → move to allocation_history                     │
│                                                                              │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ CASE B: Employee was on DCB Project (needs capacity freed)                  │
│ ──────────────────────────────────────────────────────────                  │
│                                                                              │
│   MANUAL ACTION REQUIRED:                                                    │
│   ⚠️ System shows warning: "Employee at 100% capacity on 25/01/2026"        │
│   ⚠️ User must first reduce DCB allocation by 50%                           │
│                                                                              │
│   Then same as Case A (allocation created, bench not affected)              │
│                                                                              │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ TABLE FLOW:                                                                  │
│ • Goes DIRECTLY to → allocations (effective_date is past)                   │
│ • Bench adjustment is IMMEDIATE                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Same-Day Allocation (Effective Date = Today)

**Context:** Today is **31/01/2026**  
**Action:** Allocate employee 50% to **ABC Project** with effective date **31/01/2026**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 2: Same-Day Allocation                                             │
│ Today: 31/01/2026 | Effective Date: 31/01/2026 (TODAY)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CASE A: Employee was on BENCH                                               │
│ ─────────────────────────────                                               │
│                                                                              │
│   AUTOMATIC ACTIONS:                                                         │
│   1. INSERT into allocations:                                               │
│      • project_id = ABC, allocation_percentage = 50%                        │
│      • effective_date = 31/01/2026                                          │
│      • allocated_date = 31/01/2026                                          │
│                                                                              │
│   2. UPDATE bench allocation:                                               │
│      • allocation_percentage -= 50%                                         │
│      • allocation_changed_on = 31/01/2026                                   │
│                                                                              │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ CASE B: Employee was on DCB Project                                         │
│ ────────────────────────────────                                            │
│                                                                              │
│   MANUAL ACTION REQUIRED:                                                    │
│   ⚠️ System shows warning: "Employee at 100% capacity"                      │
│   ⚠️ User must first reduce DCB allocation by 50%                           │
│                                                                              │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ TABLE FLOW:                                                                  │
│ • Goes DIRECTLY to → allocations (effective_date is today)                  │
│ • Bench adjustment is IMMEDIATE                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Future Allocation (Effective Date > Today) ⭐ NEW TABLE

**Context:** Today is **31/01/2026**  
**Action:** Allocate employee 50% to **ABC Project** with effective date **01/02/2026**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 3: Future Allocation                                               │
│ Today: 31/01/2026 | Effective Date: 01/02/2026 (FUTURE)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ STEP 1: On 31/01/2026 (Today - when user creates allocation)                │
│ ─────────────────────────────────────────────────────────────               │
│                                                                              │
│   1. INSERT into future_allocations:                                        │
│      • resource_id, project_id = ABC                                        │
│      • allocation_percentage = 50%                                          │
│      • effective_date = 01/02/2026                                          │
│      • scheduled_at = 31/01/2026 (when it was scheduled)                    │
│      • scheduled_by = [user_id]                                             │
│      • status = 'SCHEDULED'                                                 │
│                                                                              │
│   2. IF employee on BENCH:                                                  │
│      • INSERT into future_allocations (for bench reduction):                │
│        - project_id = BENCH                                                 │
│        - allocation_percentage = -50% (reduction)                           │
│        - effective_date = 01/02/2026                                        │
│        - change_type = 'AUTO_BENCH_ADJUSTMENT'                              │
│        - linked_allocation_id = [ABC allocation id]                         │
│                                                                              │
│   3. IF employee on DCB Project:                                            │
│      • ⚠️ System shows warning:                                             │
│        "On 01/02/2026, employee will exceed 100% capacity"                  │
│      • ⚠️ User must schedule DCB reduction for 01/02/2026                   │
│                                                                              │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ STEP 2: On 01/02/2026 at 1:00 AM UTC (Scheduler runs)                       │
│ ─────────────────────────────────────────────────────                       │
│                                                                              │
│   The Allocation Activation Scheduler:                                       │
│                                                                              │
│   1. Finds all future_allocations WHERE effective_date = TODAY              │
│                                                                              │
│   2. FOR EACH scheduled allocation:                                         │
│      a. INSERT/UPDATE allocations table                                     │
│      b. UPDATE future_allocations.status = 'ACTIVATED'                      │
│      c. MOVE record to allocation_history (optional, or delete)             │
│                                                                              │
│   3. FOR bench adjustments (change_type = 'AUTO_BENCH_ADJUSTMENT'):         │
│      a. UPDATE existing bench allocation in allocations table               │
│      b. IF bench becomes 0% → move to allocation_history                    │
│                                                                              │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ TABLE FLOW:                                                                  │
│ Day 1 (31/01): future_allocations (SCHEDULED)                               │
│ Day 2 (01/02): Scheduler moves to → allocations (ACTIVE)                    │
│ Later: When ended → allocation_history (ARCHIVED)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

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

## Database Schema - 3-Table Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3-TABLE TEMPORAL ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │  FUTURE_ALLOCATIONS │  ← Scheduled allocations (effective_date > TODAY)  │
│  │  ─────────────────  │                                                    │
│  │  • Holds future     │                                                    │
│  │    scheduled changes│                                                    │
│  │  • Auto bench adj.  │                                                    │
│  │    scheduled here   │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│             │ Scheduler (Daily 1:00 AM UTC)                                  │
│             │ Moves records where effective_date = TODAY                     │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │    ALLOCATIONS      │  ← Current active allocations                       │
│  │  ─────────────────  │                                                    │
│  │  • Active project   │                                                    │
│  │    assignments      │                                                    │
│  │  • Bench allocations│                                                    │
│  │  • Real-time data   │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│             │ When deallocated/ended                                         │
│             │ Or archived (>1 year old)                                      │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │ ALLOCATION_HISTORY  │  ← Historical/ended allocations                     │
│  │  ─────────────────  │                                                    │
│  │  • Past allocations │                                                    │
│  │  • Audit trail      │                                                    │
│  │  • Reporting data   │                                                    │
│  └─────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Table 1: future_allocations (NEW)

```sql
-- Migration: 019_create_future_allocations.sql

CREATE TABLE IF NOT EXISTS future_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core allocation data (same as allocations table)
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    billing_percentage DECIMAL(5,2) DEFAULT 0 CHECK (billing_percentage >= 0 AND billing_percentage <= 100),

    -- Effective date - MUST be in the future
    effective_date DATE NOT NULL,
    CONSTRAINT chk_future_effective_date CHECK (effective_date > CURRENT_DATE),

    -- Original allocation start date (when they first joined the project)
    allocated_date DATE NOT NULL,

    -- Optional end date
    deallocated_date DATE,

    -- Scheduling metadata
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_by UUID REFERENCES users(id),

    -- Change type for understanding what this record represents
    change_type VARCHAR(30) NOT NULL CHECK (change_type IN (
        'NEW_ALLOCATION',           -- Brand new allocation to a project
        'MODIFY_PERCENTAGE',        -- Changing allocation %
        'MODIFY_BILLING',           -- Changing billing %
        'DEALLOCATE',               -- Ending an allocation
        'AUTO_BENCH_ADJUSTMENT'     -- System-generated bench adjustment
    )),

    -- Status of the scheduled allocation
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED',    -- Waiting for effective date
        'ACTIVATED',    -- Moved to allocations table
        'CANCELLED'     -- Cancelled before activation
    )),

    -- Link to related allocation (for modifications) or related future allocation (for bench adj)
    related_allocation_id UUID,  -- References allocations(id) for modifications
    linked_future_id UUID,       -- References future_allocations(id) for auto-bench

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    -- Unique constraint: One scheduled change per resource-project-effective_date
    CONSTRAINT uq_future_allocation UNIQUE (resource_id, project_id, effective_date, change_type)
);

-- Indexes for performance
CREATE INDEX idx_future_allocations_effective ON future_allocations(effective_date);
CREATE INDEX idx_future_allocations_status ON future_allocations(status);
CREATE INDEX idx_future_allocations_resource ON future_allocations(resource_id);
CREATE INDEX idx_future_allocations_project ON future_allocations(project_id);
CREATE INDEX idx_future_allocations_lookup ON future_allocations(resource_id, status, effective_date);

-- Comments
COMMENT ON TABLE future_allocations IS 'Scheduled/future allocations that will be activated on their effective_date';
COMMENT ON COLUMN future_allocations.effective_date IS 'Date when this allocation becomes active (must be > today)';
COMMENT ON COLUMN future_allocations.change_type IS 'Type of change: NEW, MODIFY, DEALLOCATE, or AUTO_BENCH';
COMMENT ON COLUMN future_allocations.linked_future_id IS 'For AUTO_BENCH_ADJUSTMENT, links to the allocation that triggered it';
```

### Table 2: allocations (MODIFIED)

```sql
-- Migration: 020_modify_allocations_table.sql

-- Add new columns to existing allocations table
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS effective_date DATE,
ADD COLUMN IF NOT EXISTS allocated_date DATE,
ADD COLUMN IF NOT EXISTS deallocated_date DATE,
ADD COLUMN IF NOT EXISTS allocation_changed_on DATE,
ADD COLUMN IF NOT EXISTS original_allocated_date DATE;

-- Backfill existing data
UPDATE allocations
SET
    effective_date = COALESCE(start_date, created_at::date),
    allocated_date = start_date,
    original_allocated_date = start_date,
    allocation_changed_on = COALESCE(updated_at::date, start_date)
WHERE effective_date IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_allocations_effective_date ON allocations(effective_date);
CREATE INDEX IF NOT EXISTS idx_allocations_allocated_date ON allocations(allocated_date);
CREATE INDEX IF NOT EXISTS idx_allocations_changed_on ON allocations(allocation_changed_on);
CREATE INDEX IF NOT EXISTS idx_allocations_resource_active ON allocations(resource_id, is_active);

-- Comments
COMMENT ON COLUMN allocations.effective_date IS 'Date when this allocation version became effective';
COMMENT ON COLUMN allocations.allocated_date IS 'Date when resource was allocated (may differ from effective_date for modifications)';
COMMENT ON COLUMN allocations.allocation_changed_on IS 'Most recent change effective date';
COMMENT ON COLUMN allocations.original_allocated_date IS 'Original allocation date (never changes, for audit)';
```

### Table 3: allocation_history (NEW)

```sql
-- Migration: 021_create_allocation_history.sql

CREATE TABLE IF NOT EXISTS allocation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Original allocation ID for traceability
    original_allocation_id UUID NOT NULL,

    -- Core allocation data (copied from allocations)
    resource_id UUID NOT NULL,
    project_id UUID NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL,
    billing_percentage DECIMAL(5,2) DEFAULT 0,

    -- Date fields
    effective_date DATE NOT NULL,
    allocated_date DATE NOT NULL,
    deallocated_date DATE,
    allocation_changed_on DATE,
    original_allocated_date DATE,

    -- Why it was archived
    archive_reason VARCHAR(30) NOT NULL CHECK (archive_reason IN (
        'DEALLOCATED',      -- Normal end of allocation
        'REPLACED',         -- Replaced by new allocation
        'ARCHIVED',         -- Periodic archival (old records)
        'CANCELLED',        -- Cancelled before becoming active
        'RESOURCE_DELETED', -- Resource was deleted
        'PROJECT_DELETED'   -- Project was deleted
    )),

    -- Metadata
    notes TEXT,

    -- Original audit fields
    original_created_at TIMESTAMP,
    original_created_by UUID,
    original_updated_at TIMESTAMP,
    original_updated_by UUID,

    -- Archive audit
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_by UUID REFERENCES users(id),

    -- Indexes on commonly queried fields
    CONSTRAINT idx_history_resource_project UNIQUE (original_allocation_id, archived_at)
);

-- Indexes for reporting and lookups
CREATE INDEX idx_allocation_history_resource ON allocation_history(resource_id);
CREATE INDEX idx_allocation_history_project ON allocation_history(project_id);
CREATE INDEX idx_allocation_history_dates ON allocation_history(allocated_date, deallocated_date);
CREATE INDEX idx_allocation_history_archived ON allocation_history(archived_at);
CREATE INDEX idx_allocation_history_reason ON allocation_history(archive_reason);

-- Comments
COMMENT ON TABLE allocation_history IS 'Historical record of all past allocations for audit and reporting';
COMMENT ON COLUMN allocation_history.original_allocation_id IS 'UUID of the allocation when it was in allocations table';
COMMENT ON COLUMN allocation_history.archive_reason IS 'Why this allocation was moved to history';
```

---

## Scheduler: Allocation Activation Job

### Job Specification

```javascript
// File: backend/services/allocation-service/src/handlers/scheduledJobs.js

/**
 * Allocation Activation Scheduler
 * Runs daily at 1:00 AM UTC (before gap detection at 2:00 AM)
 *
 * Responsibilities:
 * 1. Move future_allocations → allocations when effective_date = TODAY
 * 2. Handle AUTO_BENCH_ADJUSTMENT records
 * 3. Archive ended allocations → allocation_history
 */

export const activateScheduledAllocations = async (event) => {
  const log = createLogger("ActivationScheduler");
  const today = new Date().toISOString().split("T")[0];

  log.info(`Running activation scheduler for ${today}`);

  try {
    // STEP 1: Get all scheduled allocations for today
    const scheduledAllocations = await db.query(
      `
            SELECT * FROM future_allocations 
            WHERE effective_date = $1 
            AND status = 'SCHEDULED'
            ORDER BY 
                CASE change_type 
                    WHEN 'DEALLOCATE' THEN 1      -- Process deallocations first
                    WHEN 'MODIFY_PERCENTAGE' THEN 2
                    WHEN 'NEW_ALLOCATION' THEN 3
                    WHEN 'AUTO_BENCH_ADJUSTMENT' THEN 4  -- Bench last
                    ELSE 5
                END,
                created_at ASC
        `,
      [today],
    );

    log.info(
      `Found ${scheduledAllocations.rows.length} scheduled allocations to activate`,
    );

    for (const scheduled of scheduledAllocations.rows) {
      await processScheduledAllocation(scheduled, today, log);
    }

    // STEP 2: Archive ended allocations (deallocated_date < TODAY)
    await archiveEndedAllocations(today, log);

    // STEP 3: Run gap detection as backup
    await detectAndFillGaps(null, "SYSTEM", log);

    log.info("Activation scheduler completed successfully");
  } catch (error) {
    log.error("Activation scheduler failed", { error: error.message });
    throw error;
  }
};

const processScheduledAllocation = async (scheduled, today, log) => {
  const {
    id,
    resource_id,
    project_id,
    allocation_percentage,
    billing_percentage,
    allocated_date,
    deallocated_date,
    change_type,
    related_allocation_id,
    notes,
  } = scheduled;

  try {
    switch (change_type) {
      case "NEW_ALLOCATION":
        // Insert new allocation into allocations table
        await db.query(
          `
                    INSERT INTO allocations (
                        resource_id, project_id, allocation_percentage, billing_percentage,
                        start_date, end_date, effective_date, allocated_date, 
                        allocation_changed_on, original_allocated_date,
                        is_active, notes, created_by, created_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, CURRENT_TIMESTAMP
                    )
                `,
          [
            resource_id,
            project_id,
            allocation_percentage,
            billing_percentage,
            allocated_date,
            deallocated_date,
            today,
            allocated_date,
            today,
            allocated_date,
            notes,
            scheduled.scheduled_by,
          ],
        );
        break;

      case "MODIFY_PERCENTAGE":
      case "MODIFY_BILLING":
        // Update existing allocation
        await db.query(
          `
                    UPDATE allocations 
                    SET allocation_percentage = $2,
                        billing_percentage = $3,
                        allocation_changed_on = $4,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = $5
                    WHERE id = $1
                `,
          [
            related_allocation_id,
            allocation_percentage,
            billing_percentage,
            today,
            scheduled.scheduled_by,
          ],
        );
        break;

      case "DEALLOCATE":
        // Move to history
        await archiveAllocation(
          related_allocation_id,
          "DEALLOCATED",
          scheduled.scheduled_by,
        );
        break;

      case "AUTO_BENCH_ADJUSTMENT":
        // Update bench allocation
        await adjustBenchFromScheduled(
          resource_id,
          allocation_percentage,
          today,
          log,
        );
        break;
    }

    // Mark as activated
    await db.query(
      `
            UPDATE future_allocations 
            SET status = 'ACTIVATED', updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1
        `,
      [id],
    );

    log.info(`Activated ${change_type} for resource ${resource_id}`);
  } catch (error) {
    log.error(`Failed to process scheduled allocation ${id}`, {
      error: error.message,
    });
    // Don't throw - continue processing other allocations
  }
};

const archiveAllocation = async (allocationId, reason, archivedBy) => {
  // Copy to history
  await db.query(
    `
        INSERT INTO allocation_history (
            original_allocation_id, resource_id, project_id,
            allocation_percentage, billing_percentage,
            effective_date, allocated_date, deallocated_date,
            allocation_changed_on, original_allocated_date,
            archive_reason, notes,
            original_created_at, original_created_by,
            original_updated_at, original_updated_by,
            archived_by
        )
        SELECT 
            id, resource_id, project_id,
            allocation_percentage, billing_percentage,
            effective_date, allocated_date, deallocated_date,
            allocation_changed_on, original_allocated_date,
            $2, notes,
            created_at, created_by,
            updated_at, updated_by,
            $3
        FROM allocations WHERE id = $1
    `,
    [allocationId, reason, archivedBy],
  );

  // Delete from allocations
  await db.query(`DELETE FROM allocations WHERE id = $1`, [allocationId]);
};

const archiveEndedAllocations = async (today, log) => {
  // Find allocations that ended (deallocated_date < today)
  const ended = await db.query(
    `
        SELECT id FROM allocations 
        WHERE deallocated_date IS NOT NULL 
        AND deallocated_date < $1
        AND is_active = true
    `,
    [today],
  );

  for (const allocation of ended.rows) {
    await archiveAllocation(allocation.id, "DEALLOCATED", "SYSTEM");
  }

  log.info(`Archived ${ended.rows.length} ended allocations`);
};
```

### Serverless Configuration

```yaml
# In serverless.yml - allocation-service

functions:
  # ... existing functions ...

  activationScheduler:
    handler: src/handlers/scheduledJobs.activateScheduledAllocations
    description: Activates scheduled allocations and archives ended ones
    timeout: 300 # 5 minutes
    events:
      - schedule:
          rate: cron(0 1 * * ? *) # 1:00 AM UTC daily
          enabled: true
          description: "Daily allocation activation"
    layers:
      - ${self:custom.sharedLayerArn}
    environment:
      DB_HOST: ${self:custom.dbHost}
      DB_NAME: ${self:custom.dbName}
```

---

## API Specification (Updated for 3-Table Architecture)

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

### Page Structure - 3 Tables View

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  ALLOCATIONS                                                               [+ Add Allocation]│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │ 📅 FUTURE ALLOCATIONS (Scheduled)                                    [2 scheduled]   │   │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤   │
│  │ Employee      │ Project      │ Alloc % │ Effective Date │ Scheduled By │ Actions    │   │
│  │───────────────┼──────────────┼─────────┼────────────────┼──────────────┼────────────│   │
│  │ Test User     │ ABC Project  │ 50%     │ 01 Feb 2026    │ Admin        │ ✏️ 🗑️ ❌   │   │
│  │ John Doe      │ XYZ Project  │ 25%     │ 15 Feb 2026    │ Manager      │ ✏️ 🗑️ ❌   │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 CURRENT ALLOCATIONS (Active)                                     [15 active]      │   │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤   │
│  │ Employee      │ Project      │ Alloc % │ Billing % │ Allocated │ Changed On │Actions │   │
│  │───────────────┼──────────────┼─────────┼───────────┼───────────┼────────────┼────────│   │
│  │ Test User     │ DCB Project  │ 100%    │ 100%      │01 Jan 2026│01 Jan 2026 │ 👁️ ✏️ │   │
│  │ Hirun Chamara │ Test Pasindu │ 100%    │ 100%      │01 Jan 2026│01 Jan 2026 │ 👁️ ✏️ │   │
│  │ Pasindu W.    │ Test Pasindu │ 100%    │ 100%      │01 Jan 2026│01 Jan 2026 │ 👁️ ✏️ │   │
│  │ Jane Smith    │ Bench        │ 50%     │ 0%        │15 Jan 2026│15 Jan 2026 │ 👁️    │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │ 📚 ALLOCATION HISTORY (Past)                              [View All] [Export CSV]    │   │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤   │
│  │ Employee      │ Project      │ Alloc % │ Allocated │ Deallocated │ Reason     │View │   │
│  │───────────────┼──────────────┼─────────┼───────────┼─────────────┼────────────┼─────│   │
│  │ Test User     │ Old Project  │ 100%    │01 Jun 2025│ 31 Dec 2025 │Deallocated │ 👁️  │   │
│  │ John Doe      │ Beta Project │ 50%     │01 Mar 2025│ 30 Nov 2025 │Replaced    │ 👁️  │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### By Allocation View (Per Project)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ BY ALLOCATION - Test Pasindu 0001                                                          + Add Allocation   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                │
│  Tabs: [ Active Allocations (3) ] [ Future Scheduled (1) ] [ History (5) ]                                    │
│                                                                                                                │
├──────────────────┬─────────────────┬──────────────────┬────────────────────┬───────────┬──────────┬──────────┤
│ Employee Name    │ Project         │ Allocated Date   │ Allocation Changed │ Billing % │ Alloc %  │ Actions  │
│                  │                 │                  │ On                 │           │          │          │
├──────────────────┼─────────────────┼──────────────────┼────────────────────┼───────────┼──────────┼──────────┤
│ Test User        │ Test Pasindu    │ 01 Jan 2026      │ 01 Jan 2026       │ 100.00%   │ 50.00%   │ 👁️ ✏️   │
│                  │ 0001            │                  │                    │           │          │          │
│                  │                 │                  │ ⏰ 01 Feb: +25%    │           │ → 75%    │          │
├──────────────────┼─────────────────┼──────────────────┼────────────────────┼───────────┼──────────┼──────────┤
│ Hirun Chamara    │ Test Pasindu    │ 01 Jan 2026      │ 01 Jan 2026       │ 100.00%   │ 100.00%  │ 👁️ ✏️   │
│                  │ 0001            │                  │                    │           │          │          │
├──────────────────┼─────────────────┼──────────────────┼────────────────────┼───────────┼──────────┼──────────┤
│ Pasindu W.       │ Test Pasindu    │ 01 Jan 2026      │ 01 Jan 2026       │ 100.00%   │ 100.00%  │ 👁️ ✏️   │
│                  │ 0001            │                  │                    │           │          │          │
└──────────────────┴─────────────────┴──────────────────┴────────────────────┴───────────┴──────────┴──────────┘

Legend: ⏰ = Scheduled change pending
```

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
│  * Effective Date               Deallocated Date            │
│  ┌─────────────────────┐        ┌─────────────────────┐    │
│  │ 📅 2026-02-01      │        │ 📅 (Optional)       │    │
│  └─────────────────────┘        └─────────────────────┘    │
│  ℹ️ When allocation becomes     ℹ️ When allocation ends    │
│     active                         (leave empty if ongoing) │
│  ⚡ Quick: [Today] [Tomorrow] [Next Week] [Next Month]     │
│                                                             │
│  Notes                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter allocation notes (optional)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 ALLOCATION PREVIEW                                │   │
│  │                                                       │   │
│  │ IF effective_date > today:                           │   │
│  │ ⏰ This will be SCHEDULED for Feb 1, 2026            │   │
│  │ • Goes to: Future Allocations table                  │   │
│  │ • Auto-activates on effective date                   │   │
│  │                                                       │   │
│  │ Bench Impact:                                        │   │
│  │ ✅ Employee currently on Bench (100%)                │   │
│  │ ✅ Bench will auto-reduce to 50% on Feb 1           │   │
│  │                                                       │   │
│  │ -- OR --                                             │   │
│  │                                                       │   │
│  │ ⚠️ Employee currently at 100% on DCB Project        │   │
│  │ ⚠️ You must reduce DCB allocation first             │   │
│  │ [→ Edit DCB Allocation]                              │   │
│  └─────────────────────────────────────────────────────┘   │
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
│  Allocated since: 01 Jan 2026                               │
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
│  │                                                       │   │
│  │ Changes:                                             │   │
│  │ • Allocation: 100% → 75% (-25%)                     │   │
│  │ • Effective: Feb 15, 2026 (in 15 days)              │   │
│  │                                                       │   │
│  │ Table Flow:                                          │   │
│  │ • Change scheduled in: Future Allocations           │   │
│  │ • Will update Allocations table on: Feb 15          │   │
│  │                                                       │   │
│  │ Bench Impact:                                        │   │
│  │ • Current bench: 0%                                  │   │
│  │ • Bench on Feb 15: 25% (auto-created)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              ┌─────────┐  ┌─────────────┐  │
│                              │ Cancel  │  │   Update    │  │
│                              └─────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3. Cancel Future Allocation Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Cancel Scheduled Allocation                            ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ You are about to cancel a scheduled allocation         │
│                                                             │
│  Details:                                                   │
│  • Employee: Test User                                     │
│  • Project: ABC Project                                    │
│  • Allocation: 50%                                         │
│  • Scheduled for: Feb 1, 2026                              │
│                                                             │
│  Related Changes:                                           │
│  • Bench reduction (50%) will also be cancelled            │
│                                                             │
│  Reason for cancellation (optional):                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Project requirements changed                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                      ┌──────────────┐  ┌────────────────┐  │
│                      │ Keep Scheduled│  │ Yes, Cancel   │  │
│                      └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4. Status Badges & Indicators

```css
/* Status badges for allocation tables */
.badge-scheduled {
  background: #dbeafe; /* Blue-100 */
  color: #1e40af; /* Blue-800 */
  border: 1px solid #93c5fd;
}
.badge-scheduled::before {
  content: "⏰ ";
}

.badge-active {
  background: #d1fae5; /* Green-100 */
  color: #065f46; /* Green-800 */
  border: 1px solid #6ee7b7;
}
.badge-active::before {
  content: "✓ ";
}

.badge-history {
  background: #e5e7eb; /* Gray-200 */
  color: #374151; /* Gray-700 */
  border: 1px solid #9ca3af;
}
.badge-history::before {
  content: "📚 ";
}

/* Pending change indicator in table */
.pending-change-indicator {
  font-size: 0.75rem;
  color: #2563eb; /* Blue-600 */
  display: flex;
  align-items: center;
  gap: 4px;
}
.pending-change-indicator::before {
  content: "⏰";
}
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

## Implementation Phases (Updated for 3-Table Architecture)

### Phase 1: Database Migration (Week 1) ✅ COMPLETED

**Day 1-2: Create New Tables**

- [x] Migration 019: Create `future_allocations` table
  - All allocation fields plus change_type, status, linked_future_id
  - Indexes: resource_id, project_id, effective_date, status
- [x] Migration 020: Modify `allocations` table
  - Add: effective_date, allocated_date, deallocated_date, allocation_changed_on
  - Add: original_allocated_date, change_type
  - Rename: start_date → allocated_date, end_date → deallocated_date
- [x] Migration 021: Create `allocation_history_archive` table
  - Archive of ended allocations with archive_reason
  - Indexes: resource_id, project_id, archived_at

**Day 3-4: Data Backfill**

- [x] Backfill existing allocations with new fields
  - Set effective_date = allocated_date for existing records
  - Set allocation_changed_on = updated_at
  - Set change_type = 'LEGACY'
- [x] Test migration on staging environment
- [x] Prepare rollback scripts

**Day 5: Validation**

- [x] Verify all tables created correctly
- [x] Verify indexes are working
- [x] Test foreign key constraints

### Phase 2: Backend Core Logic (Week 2) ✅ COMPLETED

**Day 1-2: 3-Table Service Layer**

- [x] Create `futureAllocationService.js`
  - createFutureAllocation()
  - getFutureAllocations()
  - cancelFutureAllocation()
  - processFutureAllocation() - moves to allocations table
- [x] Create `allocationHistoryService.js`
  - archiveAllocation()
  - getHistory()
  - searchHistory()
- [x] Modify `allocationService.js`
  - Route to correct table based on effective_date
  - Handle 3 scenarios (backdated, same-day, future)

**Day 3-4: Scheduler Implementation**

- [x] Create `activateScheduledAllocations` Lambda function
- [x] Implement `processScheduledAllocation()` with change_type handling
  - NEW_ALLOCATION: Move from future to allocations
  - MODIFY_PERCENTAGE: Update existing allocation
  - MODIFY_BILLING: Update billing status
  - DEALLOCATE: End allocation, move to history
  - AUTO_BENCH_ADJUSTMENT: Handle bench
- [x] Create `archiveEndedAllocations` helper
- [x] Add serverless.yml schedule configuration (1:00 AM UTC)

**Day 5: Bench Logic**

- [x] Modify `adjustBenchAllocation()` for 3-table architecture
- [x] Implement immediate bench creation (same-day/backdated)
- [x] Implement future bench scheduling
- [ ] Test bench auto-adjustment scenarios

### Phase 3: API & Frontend Updates (Week 3) ✅ COMPLETED

**Day 1-2: Modified Endpoints**

- [x] POST /allocations - Route to correct table based on effective_date
- [x] PUT /allocations/{id} - Update with effective_date handling
- [x] DELETE /allocations/{id} - Archive to history
- [x] Update validation schemas (Joi)

**Day 3-4: New Endpoints**

- [x] GET /future-allocations - List scheduled allocations
- [x] GET /future-allocations/{id} - Get specific future allocation
- [x] DELETE /future-allocations/{id} - Cancel scheduled allocation
- [x] GET /allocation-history - List archived allocations
- [x] GET /allocation-history/resource/{id} - Resource's history
- [x] GET /allocation-history/timeline/{id} - Combined view all 3 tables

**Day 5: Frontend API Services**

- [x] Create `futureAllocations.service.js` with all API methods
- [x] Create `allocationHistory.service.js` with all API methods
- [x] Update `allocations.service.js` to use effective_date
- [x] Add new endpoints to `endpoints.js`
- [x] Export services from `api/index.js`

**Day 6: Frontend Component Updates**

- [x] Update `UserAllocationModal` with scheduling indicators
  - Add `getAllocationScheduleStatus()` helper
  - Show "Scheduled", "Active Today", "Active" tags
  - Add tooltip with activation date info
- [x] Add alert for future-dated allocations
- [x] Rename label to "Effective Date" with help tooltip
- [x] Update `useUserAllocationModal` hook
  - Format dates for API (YYYY-MM-DD)
  - Map fields to API names (effective_date, allocation_percentage)
  - Add onSave callback support
  - Show message for future allocations

### Phase 4: Frontend - 3-Table View (Week 4)

**Day 1-2: Allocation Page Structure**

- [ ] Add 3 tabs: "Active Allocations" | "Future Scheduled" | "History"
- [ ] Implement `FutureAllocationsTable` component
- [ ] Implement `AllocationHistoryTable` component
- [ ] Add counts to tab headers

**Day 3-4: Modals**

- [ ] Update Create Allocation Modal
  - Add allocation preview showing target table
  - Add bench impact preview
- [ ] Update Edit Allocation Modal
  - Show which table change will affect
  - Add change summary component
- [ ] Create Cancel Future Allocation Modal
  - Confirmation with impact preview

**Day 5: Resource View**

- [ ] Update resource detail page
- [ ] Show combined timeline from all 3 tables
- [ ] Add scheduled changes indicator

### Phase 5: Frontend - Polish & Reports (Week 5)

**Day 1-2: Status Badges & Indicators**

- [ ] Add status badges (Active, Scheduled, Archived)
- [ ] Add "effective in X days" indicator
- [ ] Add change_type icons

**Day 3-4: Reports**

- [ ] Update allocation reports for 3 tables
- [ ] Add "Include History" toggle
- [ ] Add "Include Scheduled" toggle
- [ ] Update exports (Excel/PDF)

**Day 5: Testing**

- [ ] End-to-end testing all scenarios
- [ ] Test scheduler activation
- [ ] Test concurrent modifications

### Phase 6: Final Testing & Deployment (Week 6)

**Day 1-2: Integration Tests**

- [ ] Test backdated allocation flow
- [ ] Test same-day allocation flow
- [ ] Test future allocation → activation flow
- [ ] Test bench auto-adjustment all cases

**Day 3-4: Performance & Edge Cases**

- [ ] Load test with many scheduled allocations
- [ ] Test scheduler with 1000+ pending activations
- [ ] Test edge cases (midnight, timezone)

**Day 5: Documentation & Deployment**

- [ ] Update API documentation
- [ ] Update user guide with 3-table explanation
- [ ] Create release notes
- [ ] Deploy to staging, then production

---

## Edge Cases & Validation Rules (3-Table Architecture)

### 1. Table Routing Rules

| effective_date   | Target Table         | Immediate Action                             |
| ---------------- | -------------------- | -------------------------------------------- |
| Past (backdated) | `allocations`        | Insert directly, adjust bench immediately    |
| Today            | `allocations`        | Insert directly, adjust bench immediately    |
| Future (> today) | `future_allocations` | Insert as scheduled, scheduler handles later |

### 2. Effective Date Validation

| Scenario                             | Allowed?   | Behavior                                  |
| ------------------------------------ | ---------- | ----------------------------------------- |
| Effective date = today               | ✅ Yes     | Goes to `allocations` table               |
| Effective date = future              | ✅ Yes     | Goes to `future_allocations` table        |
| Effective date = past (last 30 days) | ✅ Yes     | Backdated to `allocations` (audit logged) |
| Effective date = past (>30 days)     | ⚠️ Warning | Requires confirmation dialog              |
| Effective date before allocated_date | ❌ No      | Error: Cannot be before allocation start  |

### 3. Table Routing Logic

```javascript
// Determine which table to use based on effective_date
const routeAllocation = (effectiveDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effective = new Date(effectiveDate);
  effective.setHours(0, 0, 0, 0);

  if (effective > today) {
    return "future_allocations"; // Future - scheduler will move it
  } else {
    return "allocations"; // Today or past - immediate
  }
};

// Usage in create allocation handler
const createAllocation = async (allocationData) => {
  const targetTable = routeAllocation(allocationData.effective_date);

  if (targetTable === "future_allocations") {
    // Insert into future_allocations with status = 'scheduled'
    return await futureAllocationService.create(allocationData);
  } else {
    // Insert directly into allocations
    // Also auto-adjust bench immediately
    return await allocationService.createWithBenchAdjustment(allocationData);
  }
};
```

### 4. Capacity Validation (Cross-Table)

```javascript
// Must check capacity across BOTH active allocations AND future_allocations
const validateCapacity = async (
  resourceId,
  newPercentage,
  effectiveDate,
  excludeId,
) => {
  // Step 1: Get active allocations on effective date
  const activeAllocations = await db.query(
    `
    SELECT SUM(allocation_percentage) as total
    FROM allocations
    WHERE resource_id = $1
    AND id != COALESCE($3, '00000000-0000-0000-0000-000000000000')
    AND is_active = true
    AND effective_date <= $2
    AND (deallocated_date IS NULL OR deallocated_date >= $2)
  `,
    [resourceId, effectiveDate, excludeId],
  );

  // Step 2: Get future allocations that will be active on effective date
  const futureAllocations = await db.query(
    `
    SELECT SUM(allocation_percentage) as total
    FROM future_allocations
    WHERE resource_id = $1
    AND linked_future_id != COALESCE($3, '00000000-0000-0000-0000-000000000000')
    AND status = 'scheduled'
    AND effective_date <= $2
    AND change_type = 'NEW_ALLOCATION'
  `,
    [resourceId, effectiveDate, excludeId],
  );

  const activeTotal = activeAllocations.rows[0].total || 0;
  const futureTotal = futureAllocations.rows[0].total || 0;
  const newTotal = activeTotal + futureTotal + newPercentage;

  if (newTotal > 100) {
    throw new Error(`Capacity exceeded: ${newTotal}% on ${effectiveDate}`);
  }
};
```

### 5. Cancellation Rules

```javascript
// Only future_allocations can be cancelled
const cancelFutureAllocation = async (futureAllocationId) => {
  const future = await db.query(
    `SELECT * FROM future_allocations WHERE id = $1 AND status = 'scheduled'`,
    [futureAllocationId],
  );

  if (!future.rows[0]) {
    throw new Error("Future allocation not found or already processed");
  }

  // Mark as cancelled (don't delete - keep audit trail)
  await db.query(
    `UPDATE future_allocations SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [futureAllocationId],
  );

  // If this was for a bench adjustment, also cancel that
  if (future.rows[0].linked_future_id) {
    await db.query(
      `UPDATE future_allocations SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [future.rows[0].linked_future_id],
    );
  }

  return { success: true, message: "Future allocation cancelled" };
};
```

### 6. Archive Rules

```javascript
// Move ended allocations to history (run nightly at 3:00 AM UTC)
const archiveEndedAllocations = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Find allocations that ended yesterday or before
  const ended = await db.query(
    `
    SELECT * FROM allocations 
    WHERE deallocated_date IS NOT NULL 
    AND deallocated_date <= $1
    AND is_active = true
  `,
    [yesterday],
  );

  for (const allocation of ended.rows) {
    // Insert into history
    await db.query(
      `
      INSERT INTO allocation_history (
        id, original_allocation_id, resource_id, project_id,
        allocation_percentage, billing_status, is_billable,
        allocated_date, deallocated_date, effective_date,
        change_type, notes, created_by, archived_at, archive_reason
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'ALLOCATION_ENDED'
      )
    `,
      [
        allocation.id,
        allocation.resource_id,
        allocation.project_id,
        allocation.allocation_percentage,
        allocation.billing_status,
        allocation.is_billable,
        allocation.allocated_date,
        allocation.deallocated_date,
        allocation.effective_date,
        allocation.change_type,
        allocation.notes,
        allocation.created_by,
      ],
    );

    // Mark original as inactive (or delete if preferred)
    await db.query(`UPDATE allocations SET is_active = false WHERE id = $1`, [
      allocation.id,
    ]);
  }

  return { archived: ended.rows.length };
};
```

### 7. Conflicting Future Allocations

```javascript
// Prevent overlapping scheduled changes for same resource+project
const checkConflictingFuture = async (
  resourceId,
  projectId,
  effectiveDate,
  excludeId,
) => {
  const existing = await db.query(
    `
    SELECT * FROM future_allocations
    WHERE resource_id = $1
    AND project_id = $2
    AND effective_date = $3
    AND status = 'scheduled'
    AND id != COALESCE($4, '00000000-0000-0000-0000-000000000000')
  `,
    [resourceId, projectId, effectiveDate, excludeId],
  );

  if (existing.rows.length > 0) {
    throw new Error(
      `A scheduled allocation already exists for this resource on ${effectiveDate}`,
    );
  }
};
```

---

## Success Metrics

1. **Accuracy:** Future utilization projections match actual allocations on effective date
2. **Timeliness:** Scheduled allocations activate exactly on effective date (1:00 AM UTC)
3. **User Satisfaction:** Can schedule changes in advance without manual intervention
4. **System Health:** Scheduler completes successfully even with 1000+ pending activations
5. **Data Integrity:**
   - All 3 tables maintain referential integrity
   - No orphaned bench allocations
   - Resources always sum to 100% capacity
6. **Audit Compliance:** Full audit trail across all 3 tables with timestamps
7. **Query Performance:** All table queries complete in <100ms with proper indexing

---

## Related Documentation

- [ALLOCATION_LOGIC.md](./ALLOCATION_LOGIC.md) - Current allocation business rules
- [API_DOCUMENTATION.csv](./API_DOCUMENTATION.csv) - API endpoints
- [PRD.md](./PRD.md) - Product requirements

---

## Appendix A: 3-Table Field Mapping Reference

### Table 1: future_allocations

| Column                  | Type        | Description                                 |
| ----------------------- | ----------- | ------------------------------------------- |
| `id`                    | UUID (PK)   | Unique identifier                           |
| `resource_id`           | UUID (FK)   | Reference to resources table                |
| `project_id`            | UUID (FK)   | Reference to projects table                 |
| `allocation_percentage` | INTEGER     | 0-100                                       |
| `billing_status`        | VARCHAR(50) | Billable/Non-Billable/Shadow                |
| `is_billable`           | BOOLEAN     | true/false                                  |
| `effective_date`        | DATE        | When this should activate (must be > today) |
| `allocated_date`        | DATE        | When allocation period starts               |
| `deallocated_date`      | DATE        | When allocation period ends (nullable)      |
| `change_type`           | VARCHAR(50) | NEW_ALLOCATION, MODIFY_PERCENTAGE, etc.     |
| `status`                | VARCHAR(20) | scheduled, activated, cancelled             |
| `linked_future_id`      | UUID        | Links bench adjustment to main allocation   |
| `notes`                 | TEXT        | Optional notes                              |
| `created_by`            | UUID (FK)   | User who created                            |
| `created_at`            | TIMESTAMP   | Creation timestamp                          |
| `updated_at`            | TIMESTAMP   | Last update timestamp                       |

### Table 2: allocations (Modified)

| Column                    | Type        | Description                                    |
| ------------------------- | ----------- | ---------------------------------------------- |
| `id`                      | UUID (PK)   | Unique identifier                              |
| `resource_id`             | UUID (FK)   | Reference to resources table                   |
| `project_id`              | UUID (FK)   | Reference to projects table                    |
| `allocation_percentage`   | INTEGER     | 0-100                                          |
| `billing_status`          | VARCHAR(50) | Billable/Non-Billable/Shadow                   |
| `is_billable`             | BOOLEAN     | true/false                                     |
| `effective_date`          | DATE        | **NEW** - When change became effective         |
| `allocated_date`          | DATE        | **RENAMED** from start_date                    |
| `deallocated_date`        | DATE        | **RENAMED** from end_date (nullable)           |
| `original_allocated_date` | DATE        | **NEW** - Original start (for tracking)        |
| `allocation_changed_on`   | TIMESTAMP   | **NEW** - When this record was created/changed |
| `change_type`             | VARCHAR(50) | **NEW** - Type of change that created record   |
| `notes`                   | TEXT        | Optional notes                                 |
| `is_active`               | BOOLEAN     | Active status                                  |
| `created_by`              | UUID (FK)   | User who created                               |
| `created_at`              | TIMESTAMP   | Creation timestamp                             |
| `updated_at`              | TIMESTAMP   | Last update timestamp                          |

### Table 3: allocation_history

| Column                    | Type        | Description                          |
| ------------------------- | ----------- | ------------------------------------ |
| `id`                      | UUID (PK)   | Unique identifier for history record |
| `original_allocation_id`  | UUID        | ID from allocations table            |
| `resource_id`             | UUID (FK)   | Reference to resources table         |
| `project_id`              | UUID (FK)   | Reference to projects table          |
| `allocation_percentage`   | INTEGER     | 0-100 at time of archive             |
| `billing_status`          | VARCHAR(50) | Billable/Non-Billable/Shadow         |
| `is_billable`             | BOOLEAN     | true/false                           |
| `effective_date`          | DATE        | When change was effective            |
| `allocated_date`          | DATE        | When allocation started              |
| `deallocated_date`        | DATE        | When allocation ended                |
| `original_allocated_date` | DATE        | Original start date                  |
| `change_type`             | VARCHAR(50) | Type of change                       |
| `notes`                   | TEXT        | Optional notes                       |
| `created_by`              | UUID (FK)   | User who created original            |
| `archived_at`             | TIMESTAMP   | When moved to history                |
| `archive_reason`          | VARCHAR(50) | ALLOCATION_ENDED, DEALLOCATED, etc.  |

---

## Appendix B: API Field Mapping

### POST /allocations (Create)

| Request Field           | Target Table Logic                      | Notes           |
| ----------------------- | --------------------------------------- | --------------- |
| `resource_id`           | Both tables                             | Required        |
| `project_id`            | Both tables                             | Required        |
| `allocation_percentage` | Both tables                             | Required, 0-100 |
| `billing_status`        | Both tables                             | Required        |
| `effective_date`        | Determines table: future or allocations | Required        |
| `allocated_date`        | Both tables                             | Required        |
| `deallocated_date`      | Both tables                             | Optional        |
| `notes`                 | Both tables                             | Optional        |

### GET /allocations Response

```javascript
// Response includes allocations + future_allocations combined
{
  "allocations": [
    {
      "id": "uuid",
      "resource_id": "uuid",
      "project_id": "uuid",
      "allocation_percentage": 50,
      "billing_status": "Billable",
      "effective_date": "2026-01-25",
      "allocated_date": "2026-01-25",
      "deallocated_date": null,
      "change_type": "NEW_ALLOCATION",
      "status": "active",           // calculated
      "source_table": "allocations" // indicates which table
    },
    {
      "id": "uuid",
      "resource_id": "uuid",
      "project_id": "uuid",
      "allocation_percentage": 30,
      "billing_status": "Non-Billable",
      "effective_date": "2026-02-01",
      "allocated_date": "2026-02-01",
      "deallocated_date": null,
      "change_type": "NEW_ALLOCATION",
      "status": "scheduled",         // calculated
      "source_table": "future_allocations"
    }
  ]
}
```

---

## Appendix C: Status Determination Logic

```javascript
const determineAllocationStatus = (allocation, sourceTable) => {
  const today = new Date().toISOString().split("T")[0];

  // Future allocations
  if (sourceTable === "future_allocations") {
    if (allocation.status === "cancelled") return "Cancelled";
    if (allocation.status === "activated") return "Activated";
    return "Scheduled"; // Pending activation
  }

  // Active allocations
  if (sourceTable === "allocations") {
    if (allocation.is_active === false) return "Inactive";
    if (allocation.deallocated_date && allocation.deallocated_date < today) {
      return "Ended"; // Should be in history
    }
    return "Active";
  }

  // History
  if (sourceTable === "allocation_history") {
    return "Archived";
  }

  return "Unknown";
};

// UI Badge colors
const statusBadgeColors = {
  Scheduled: "bg-blue-100 text-blue-800", // Future
  Active: "bg-green-100 text-green-800", // Current
  Ended: "bg-gray-100 text-gray-800", // Past
  Archived: "bg-gray-100 text-gray-600", // History
  Cancelled: "bg-red-100 text-red-800", // Cancelled future
  Inactive: "bg-yellow-100 text-yellow-800", // Deactivated
};
```

---

## Appendix D: Scheduler Job Schedule

| Job Name                       | Schedule    | Description                                 |
| ------------------------------ | ----------- | ------------------------------------------- |
| `activateScheduledAllocations` | 1:00 AM UTC | Move future_allocations → allocations       |
| `archiveEndedAllocations`      | 3:00 AM UTC | Move ended allocations → allocation_history |
| `gapDetectionJob`              | 2:00 AM UTC | Detect bench allocation gaps (existing)     |

**Job Order:** Activation (1 AM) → Gap Detection (2 AM) → Archive (3 AM)

This ensures:

1. Future allocations activate first
2. Gap detection runs on fresh data
3. Archive runs last to clean up ended allocations

---

**Document Version:** 3.0  
**Last Updated:** January 31, 2026  
**Status:** Approved for Implementation - 3-Table Architecture  
**Author:** Development Team
