# Allocation Logic Documentation

## 1BT Resource Management System

**Version:** 1.0  
**Date:** January 2026  
**Status:** Proposal for Review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current Implementation](#2-current-implementation)
3. [Proposed Enhancements](#3-proposed-enhancements)
4. [Implementation Priority](#4-implementation-priority)
5. [Database Changes Required](#5-database-changes-required)

---

## 1. Overview

This document outlines the business logic for resource allocation management in the 1BT Resource Management System. It covers the current implementation and proposed enhancements to optimize allocation workflows.

### Core Concepts

| Term                     | Definition                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| **Allocation**           | Assignment of a resource (employee) to a project with a percentage |
| **Bench**                | Default internal project for unassigned resources                  |
| **Project Allocation %** | Percentage of resource's time allocated to a project (1-200%)      |
| **Billing %**            | Percentage of allocation that is billable (0-100%)                 |
| **Overallocation**       | When total allocation exceeds 100%                                 |

---

## 2. Current Implementation

### 2.1 Auto-Bench on Resource Creation ✅

**Behavior**: When a new resource is created, they are automatically allocated 100% to the Bench project.

**Applicable Tracks**: This auto-bench logic applies **only** to the following tracks:

- **Dev** (FS, .Net, DS, UI/UX)
- **QA**
- **BA/PM**

> ⚠️ **Note**: Resources in other tracks (e.g., HR, Finance, Admin, Sales) are **not** auto-allocated to Bench.

**Implementation**: `resource-service/src/handlers/resources.js`

```javascript
// Transaction ensures atomic operation
const result = await withTransaction(async (tx) => {
    // 1. Create resource
    const [newResource] = await tx.insert(resources).values({...}).returning();

    // 2. Auto-assign 100% to Bench (within same transaction)
    const benchAllocation = await createInitialBenchAllocation(tx, newResource.id, userId, log);

    return { newResource, benchAllocation };
});
```

**Business Rule**: Every active resource must have allocations totaling at least 100% (with Bench filling gaps).

---

### 2.2 Auto-Adjust Bench on Allocation ✅

**Behavior**: When allocating a resource to a project, the Bench allocation is automatically reduced.

**Formula**:

```
New Bench % = MAX(0, 100 - Sum of all non-bench allocations)
```

**Examples**:

| Scenario           | Before                     | Action                    | After                                          |
| ------------------ | -------------------------- | ------------------------- | ---------------------------------------------- |
| New resource       | Bench: 100%                | Allocate 60% to Project A | Bench: 40%, Project A: 60%                     |
| Partial allocation | Bench: 40%, A: 60%         | Allocate 30% to Project B | Bench: 10%, A: 60%, B: 30%                     |
| Full allocation    | Bench: 10%, A: 60%, B: 30% | Allocate 20% to Project C | Bench: 0%, A: 60%, B: 30%, C: 20% (110% total) |

**Implementation**: `allocation-service/src/handlers/allocations.js` - `adjustBenchAllocation()`

---

### 2.3 Overallocation Warning (Not Error) ✅

**Behavior**: Total allocation can exceed 100%. System returns a warning but allows the operation.

**Response Format**:

```json
{
  "id": "allocation-uuid",
  "resource_id": "resource-uuid",
  "project_id": "project-uuid",
  "allocation_percentage": 30,
  "warning": "Total allocation exceeds 100%. Non-bench allocations: 80% + new: 30% = 110%. Resource may be over-allocated.",
  "totalAllocation": 110,
  "overAllocated": true,
  "benchAdjustment": {
    "benchPercentage": 0,
    "message": "Bench allocation adjusted to 0%"
  }
}
```

**Business Rule**: Users are informed of overallocation but can proceed with their business decision.

---

### 2.4 Bench Restoration on Deallocation ✅

**Behavior**: When an allocation is deleted, the freed percentage is automatically added back to Bench.

**Example**:

```
Before: Bench: 0%, Project A: 60%, Project B: 40%
Action: Delete Project B allocation
After:  Bench: 40%, Project A: 60%
```

---

### 2.5 Allocation History Tracking ✅

**Behavior**: All allocation changes are logged to `allocation_history` table.

**Tracked Events**:

- `CREATED` - New allocation created
- `UPDATED` - Allocation modified
- `DELETED` - Allocation removed

**Fields Captured**:

- Previous values (JSON)
- Changed fields
- User who made the change
- Timestamp
- IP address (if available)

---

### 2.6 Optimistic Locking ✅

**Behavior**: Version field prevents concurrent update conflicts.

**Implementation**:

```javascript
// Check version before update
if (validated.version !== undefined && existing.version !== validated.version) {
  return conflict(
    "Allocation has been modified by another user. Please refresh and try again.",
  );
}

// Increment version on update
updates.push(`version = version + 1`);
```

---

### 2.7 Resource-Level Allocation Totals (Denormalized) 🆕

**Behavior**: Store `total_allocation` and `total_billing` directly on the resource record (excluding Bench). This allows instant access to a resource's allocation summary without calculating from allocations table.

**Fields on Resource**:

| Field              | Type         | Description                                                    |
| ------------------ | ------------ | -------------------------------------------------------------- |
| `total_allocation` | DECIMAL(5,2) | Sum of all active non-bench allocation percentages             |
| `total_billing`    | DECIMAL(5,2) | Sum of all active billing percentages (weighted by allocation) |

**Calculation Formula**:

```
total_allocation = SUM(allocation_percentage) WHERE project.is_bench_project = false AND is_active = true
total_billing = SUM(billing_percentage) WHERE project.is_bench_project = false AND is_active = true
```

**Example**:

```
Resource: John Doe
Allocations:
  - Bench: 20% (excluded from totals)
  - Project A: 50% allocation, 100% billing
  - Project B: 30% allocation, 50% billing

Resource Record:
  total_allocation = 50 + 30 = 80%
  total_billing = 100 + 50 = 150% (sum of billing %)
```

**Update Triggers**: These fields are automatically updated when:

- Allocation is created
- Allocation is updated
- Allocation is deleted
- Allocation is deactivated

**Implementation**: Update in `allocation-service` after every allocation change:

```javascript
const updateResourceTotals = async (resourceId) => {
  const result = await db.query(
    `
        SELECT 
            COALESCE(SUM(a.allocation_percentage), 0) as total_allocation,
            COALESCE(SUM(a.billing_percentage), 0) as total_billing
        FROM allocations a
        JOIN projects p ON a.project_id = p.id
        WHERE a.resource_id = $1
        AND a.is_active = true
        AND p.is_bench_project = false
        AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
        AND a.start_date <= CURRENT_DATE
    `,
    [resourceId],
  );

  await db.query(
    `
        UPDATE resources 
        SET total_allocation = $2, total_billing = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `,
    [resourceId, result.rows[0].total_allocation, result.rows[0].total_billing],
  );
};
```

**Benefits**:

- Instant access to resource allocation summary
- No need to join/aggregate allocations table for basic resource views
- Faster reporting and dashboard queries
- Easy overallocation detection (`total_allocation > 100`)

**API Response Enhancement**:

```json
{
  "id": "resource-uuid",
  "name": "John Doe",
  "employee_id": "LE00521",
  "designation": "SSE",
  "track": "FS",
  "total_allocation": 80,
  "total_billing": 150,
  "is_over_allocated": false,
  "bench_percentage": 20
}
```

---

## 3. Proposed Enhancements

### 3.1 Short-Stay Bench Cleanup (< 24 hours) ✅

**Status**: Implemented in `allocation-service/src/handlers/allocations.js`

**Problem**: Resource allocated to Bench, then allocated to a project within 24 hours creates meaningless Bench records that pollute history.

**Proposed Logic**:

```
When allocating a resource to a new project:
  IF resource has a Bench allocation that started < 24 hours ago
  AND this is their ONLY allocation change since Bench was created
  THEN:
    - Delete the Bench record entirely (hard delete)
    - Do NOT log to allocation_history
  ELSE:
    - Update/deactivate the Bench allocation normally
    - Log change to history
```

**Configuration**:

```javascript
const BENCH_CLEANUP_THRESHOLD_HOURS = 24;
```

**Benefit**:

- Cleaner allocation history
- Prevents noise from quick reassignments
- New hire → immediate project assignment doesn't show brief Bench period

**Edge Cases**:

- If resource was explicitly edited while on Bench → keep the record
- If resource had other allocations during Bench period → keep the record

---

### 3.2 Overallocation Severity Levels

**Problem**: Current system treats all overallocation equally. A 101% allocation is very different from 180%.

**Proposed Severity Levels**:

| Total Allocation | Severity   | Response Code | Action                                              |
| ---------------- | ---------- | ------------- | --------------------------------------------------- |
| ≤ 100%           | `NORMAL`   | 200           | Normal response                                     |
| 101-120%         | `LOW`      | 200           | Warning in response                                 |
| 121-150%         | `MEDIUM`   | 200           | Warning + `requiresReview: true` flag               |
| 151-180%         | `HIGH`     | 200           | Warning + require `notes` field                     |
| > 180%           | `CRITICAL` | 400           | Block unless `forceOverallocation: true` in request |

**Response Format Enhancement**:

```json
{
  "id": "allocation-uuid",
  "warning": "Resource is significantly over-allocated at 165%",
  "overallocationSeverity": "HIGH",
  "totalAllocation": 165,
  "overAllocated": true,
  "requiresReview": true,
  "requiredFields": ["notes"]
}
```

**Configuration**:

```javascript
const OVERALLOCATION_THRESHOLDS = {
  LOW: 120,
  MEDIUM: 150,
  HIGH: 180,
  CRITICAL: 180, // Above this requires force flag
};
```

---

### 3.3 Auto End Date from Project

**Problem**: Allocations without end dates remain "active" forever even if the project ends.

**Proposed Logic**:

```
When project.end_date is SET or UPDATED:
  FOR each active allocation to that project:
    IF allocation.end_date IS NULL:
      SET allocation.end_date = project.end_date
      LOG: "Auto-set end date from project"

    ELSE IF allocation.end_date > project.end_date:
      SET allocation.end_date = project.end_date
      LOG: "Adjusted end date to match project end"
```

**Trigger Points**:

1. Project update API
2. Nightly scheduled job (catch-up)

**Audit Trail**:

```json
{
  "changeType": "AUTO_ADJUSTED",
  "reason": "Project end date changed",
  "previousEndDate": null,
  "newEndDate": "2026-03-31"
}
```

---

### 3.4 Gap Detection & Auto-Bench Fill

**Problem**: Resource has allocations that end, leaving gaps where they have 0% total allocation.

**Proposed Logic**:

```
Trigger: Nightly job OR when any allocation ends

FOR each active resource:
  totalActiveAllocation = SUM(active allocations where start_date <= today AND (end_date IS NULL OR end_date >= today))

  IF totalActiveAllocation < 100%:
    gapPercentage = 100 - totalActiveAllocation

    IF resource has inactive Bench allocation:
      REACTIVATE Bench allocation with gapPercentage
    ELSE:
      CREATE new Bench allocation with gapPercentage

    LOG: "Auto-filled allocation gap with Bench"
```

**Example**:

```
Resource had:
  - Project A: 60% (ended yesterday)
  - Project B: 40% (ongoing)

After job runs:
  - Bench: 60% (auto-created)
  - Project B: 40%
```

---

### 3.5 Overlapping Date Conflict Detection ✅

**Status**: Implemented in `allocation-service/src/handlers/allocations.js`

**Problem**: Same resource could be allocated to the same project with overlapping date ranges, causing duplicate records.

**Proposed Logic**:

```
On CREATE or UPDATE allocation:

  existingAllocation = SELECT FROM allocations
    WHERE resource_id = :resourceId
    AND project_id = :projectId
    AND id != :currentId (for updates)
    AND is_active = true
    AND date_ranges_overlap(start_date, end_date, :newStartDate, :newEndDate)

  IF existingAllocation EXISTS:
    RETURN error(409, "Conflicting allocation exists", {
      existingAllocationId: existingAllocation.id,
      existingDateRange: { start: existingAllocation.start_date, end: existingAllocation.end_date },
      requestedDateRange: { start: newStartDate, end: newEndDate }
    })
```

**Date Overlap Function**:

```sql
-- Two date ranges overlap if:
-- (start1 <= end2 OR end2 IS NULL) AND (start2 <= end1 OR end1 IS NULL)
CREATE FUNCTION date_ranges_overlap(start1 DATE, end1 DATE, start2 DATE, end2 DATE)
RETURNS BOOLEAN AS $$
  SELECT (start1 <= COALESCE(end2, '9999-12-31') AND start2 <= COALESCE(end1, '9999-12-31'))
$$ LANGUAGE SQL;
```

---

### 3.6 Resource Status-Based Allocation Restrictions

**Problem**: Resources in certain statuses shouldn't have certain allocation operations.

**Proposed Rules**:

| Resource Status         | Create Allocation | Update Allocation | Delete Allocation | Special Behavior                          |
| ----------------------- | ----------------- | ----------------- | ----------------- | ----------------------------------------- |
| `Active`                | ✅ Allowed        | ✅ Allowed        | ✅ Allowed        | Normal operations                         |
| `Serving Notice Period` | ❌ Blocked        | ⚠️ Reduce only    | ✅ Allowed        | Can only reduce/end allocations           |
| `Inactive`              | ❌ Blocked        | ❌ Blocked        | ✅ Allowed        | Auto-end all allocations on status change |

**Auto-End on Inactive**:

```
When resource.status changes to 'Inactive':
  FOR each active allocation:
    SET end_date = today
    SET is_active = false
    LOG: "Auto-ended due to resource deactivation"

  Reactivate Bench at 100% (for record keeping)
```

---

### 3.7 Minimum Allocation Threshold

**Problem**: Allocations like 1% or 2% are practically meaningless but create noise in reports.

**Proposed Logic**:

```
const MINIMUM_ALLOCATION_PERCENTAGE = 5;

On CREATE or UPDATE allocation:
  IF allocation_percentage < MINIMUM_ALLOCATION_PERCENTAGE
  AND project.is_bench_project = false
  AND project.project_code NOT IN ('LEAVE', 'TRAINING'):
    RETURN validationError("Minimum allocation is 5%. For smaller commitments, use notes instead.")
```

**Exceptions**:

- Bench project (can be any percentage including 0)
- Leave/PTO project (can be any percentage)
- Training project (can be any percentage)

---

### 3.8 Project Capacity Tracking

**Problem**: Projects have `team_size` defined but it's not enforced during allocation.

**Proposed Logic**:

```
On CREATE allocation:
  currentTeamCount = SELECT COUNT(DISTINCT resource_id)
                     FROM allocations
                     WHERE project_id = :projectId AND is_active = true

  IF currentTeamCount >= project.team_size:
    RETURN success with warning: {
      ...allocationData,
      capacityWarning: "Project at capacity",
      currentTeamSize: currentTeamCount,
      maxTeamSize: project.team_size,
      overCapacity: true
    }
```

**Note**: This is a warning, not a block. Business may intentionally exceed capacity.

---

### 3.9 Allocation Duration Validation

**Problem**: Allocations created for unreasonably short or long periods may indicate data entry errors.

**Proposed Logic**:

```
const MIN_BILLING_DURATION_DAYS = 7;
const INDEFINITE_WARNING_DAYS = 365;

On CREATE or UPDATE allocation:
  duration = end_date - start_date (or "indefinite" if no end_date)

  IF duration < MIN_BILLING_DURATION_DAYS AND billing_status = 'Billing':
    RETURN warning: "Short billing allocation ({duration} days). Confirm this is correct."

  IF end_date IS NULL AND duration_since_start > INDEFINITE_WARNING_DAYS:
    RETURN warning: "This allocation has been indefinite for over a year. Consider setting an end date."
```

---

### 3.10 Auto-Transition Billing Status

**Problem**: Billing status sometimes needs to change automatically based on project or date changes.

**Proposed Logic**:

```
When allocation starts (start_date = today, via scheduled job):
  IF billing_status = 'Bench' AND project.project_type NOT IN ('Bench', 'Internal'):
    SET billing_status = project.billing_type  -- 'Billing' or 'Non-Billing'
    LOG: "Auto-transitioned billing status based on project type"

When allocation ends (end_date = today, via scheduled job):
  -- Handled by Gap Detection (3.4) which creates Bench allocation
```

---

### 3.11 Rollover Protection (Bench ≥ 0) ✅

**Status**: Fully implemented with logging in `allocation-service/src/handlers/allocations.js`

**Problem**: Mathematical edge case where Bench percentage could theoretically go negative.

**Proposed Logic**:

```
Function adjustBenchAllocation(resourceId):
  nonBenchTotal = SUM(non-bench active allocations)
  newBenchPercentage = MAX(0, 100 - nonBenchTotal)  // NEVER negative

  IF newBenchPercentage = 0:
    DEACTIVATE bench allocation (is_active = false)
  ELSE:
    UPDATE bench allocation to newBenchPercentage

  RETURN newBenchPercentage
```

**Current Implementation**: ✅ Already handles this with `Math.max(0, 100 - nonBenchTotal)`

**Enhancement**: Add explicit check and logging:

```javascript
if (newBenchPercentage < 0) {
  log.warn(
    "Bench percentage calculation resulted in negative value, clamping to 0",
    {
      resourceId,
      calculatedValue: 100 - nonBenchTotal,
      clampedValue: 0,
    },
  );
}
```

---

### 3.12 Historical Utilization Snapshots

**Problem**: No historical view of resource utilization trends over time.

**Proposed Logic**:

```
Daily scheduled job (e.g., 1:00 AM):
  FOR each active resource:
    snapshot = {
      resource_id: resource.id,
      snapshot_date: today,
      total_allocation: SUM(active allocations),
      bench_percentage: bench allocation percentage,
      billing_allocation: SUM(allocations WHERE billing_status = 'Billing'),
      non_billing_allocation: SUM(allocations WHERE billing_status != 'Billing'),
      project_count: COUNT(DISTINCT active projects),
      is_over_allocated: total_allocation > 100
    }

    INSERT INTO resource_utilization_snapshots(snapshot)
```

**New Table**:

```sql
CREATE TABLE resource_utilization_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  snapshot_date DATE NOT NULL,
  total_allocation DECIMAL(5,2) NOT NULL,
  bench_percentage DECIMAL(5,2) NOT NULL,
  billing_allocation DECIMAL(5,2) NOT NULL,
  non_billing_allocation DECIMAL(5,2) NOT NULL,
  project_count INTEGER NOT NULL,
  is_over_allocated BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_resource_date UNIQUE (resource_id, snapshot_date)
);

CREATE INDEX idx_snapshots_resource ON resource_utilization_snapshots(resource_id);
CREATE INDEX idx_snapshots_date ON resource_utilization_snapshots(snapshot_date);
```

**Benefits**:

- Trend analysis for dashboards
- Bench time reporting
- Utilization efficiency metrics
- Historical data for audits

---

## 4. Implementation Priority

### Phase 1: Critical (Implement First) ✅ COMPLETE

| #    | Enhancement                         | Priority | Complexity | Business Value          | Status  |
| ---- | ----------------------------------- | -------- | ---------- | ----------------------- | ------- |
| 3.1  | Short-Stay Bench Cleanup            | **HIGH** | Low        | Cleaner data, better UX | ✅ Done |
| 3.5  | Overlapping Date Conflict Detection | **HIGH** | Low        | Data integrity          | ✅ Done |
| 3.11 | Rollover Protection (Bench ≥ 0)     | **HIGH** | Low        | Bug prevention          | ✅ Done |

### Phase 2: High Value (Implement Second)

| #   | Enhancement                    | Priority   | Complexity | Business Value   | Status     |
| --- | ------------------------------ | ---------- | ---------- | ---------------- | ---------- |
| 3.2 | Overallocation Severity Levels | **HIGH**   | Medium     | Risk management  | ⏳ Pending |
| 3.3 | Auto End Date from Project     | **HIGH**   | Low        | Data consistency | ⏳ Pending |
| 3.6 | Resource Status Restrictions   | **MEDIUM** | Low        | Business rules   | ⏳ Pending |

### Phase 3: Optimization (Implement Later)

| #    | Enhancement                      | Priority   | Complexity | Business Value     | Status     |
| ---- | -------------------------------- | ---------- | ---------- | ------------------ | ---------- |
| 3.4  | Gap Detection & Auto-Bench Fill  | **MEDIUM** | Medium     | Accurate reporting | ⏳ Pending |
| 3.8  | Project Capacity Tracking        | **MEDIUM** | Low        | Resource planning  | ⏳ Pending |
| 3.10 | Auto-Transition Billing Status   | **MEDIUM** | Medium     | Automation         | ⏳ Pending |
| 3.12 | Historical Utilization Snapshots | **MEDIUM** | Medium     | Analytics          | ⏳ Pending |

### Phase 4: Nice-to-Have

| #   | Enhancement                    | Priority | Complexity | Business Value | Status     |
| --- | ------------------------------ | -------- | ---------- | -------------- | ---------- |
| 3.7 | Minimum Allocation Threshold   | **LOW**  | Low        | Data quality   | ⏳ Pending |
| 3.9 | Allocation Duration Validation | **LOW**  | Low        | Data quality   | ⏳ Pending |

---

## 5. Database Changes Required

### New Tables

```sql
-- For Enhancement 3.12: Historical Utilization Snapshots
CREATE TABLE resource_utilization_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  snapshot_date DATE NOT NULL,
  total_allocation DECIMAL(5,2) NOT NULL,
  bench_percentage DECIMAL(5,2) NOT NULL,
  billing_allocation DECIMAL(5,2) NOT NULL,
  non_billing_allocation DECIMAL(5,2) NOT NULL,
  project_count INTEGER NOT NULL,
  is_over_allocated BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_resource_date UNIQUE (resource_id, snapshot_date)
);
```

### Schema Modifications

```sql
-- For Section 2.7: Resource-Level Allocation Totals (Denormalized)
-- Store total allocation and billing on resource for quick access
ALTER TABLE resources
ADD COLUMN total_allocation DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN total_billing DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Index for quick overallocation queries
CREATE INDEX idx_resources_allocation ON resources (total_allocation) WHERE status = 'Active';

-- For Enhancement 3.2: Add severity tracking to allocation_history
ALTER TABLE allocation_history
ADD COLUMN overallocation_severity VARCHAR(10);

-- For Enhancement 3.4: Track auto-generated allocations
ALTER TABLE allocations
ADD COLUMN auto_generated BOOLEAN DEFAULT false;

-- For Enhancement 3.8: Track capacity warnings
ALTER TABLE allocations
ADD COLUMN capacity_warning_acknowledged BOOLEAN DEFAULT false;
```

### New Indexes

```sql
-- For better conflict detection (3.5)
CREATE INDEX idx_allocations_date_overlap
ON allocations (resource_id, project_id, start_date, end_date)
WHERE is_active = true;

-- For gap detection job (3.4)
CREATE INDEX idx_allocations_active_dates
ON allocations (resource_id, start_date, end_date)
WHERE is_active = true;
```

---

## Appendix A: Configuration Constants

```javascript
// allocation-config.js

export const ALLOCATION_CONFIG = {
  // Enhancement 3.1
  BENCH_CLEANUP_THRESHOLD_HOURS: 24,

  // Enhancement 3.2
  OVERALLOCATION_THRESHOLDS: {
    LOW: 120,
    MEDIUM: 150,
    HIGH: 180,
    CRITICAL: 180,
  },

  // Enhancement 3.7
  MINIMUM_ALLOCATION_PERCENTAGE: 5,

  // Enhancement 3.9
  MIN_BILLING_DURATION_DAYS: 7,
  INDEFINITE_WARNING_DAYS: 365,

  // Exempt project codes
  EXEMPT_PROJECT_CODES: ["BENCH", "LEAVE", "TRAINING", "PTO"],
};
```

---

## Appendix B: API Response Format Changes

### Current Response (Overallocation)

```json
{
  "id": "uuid",
  "warning": "Total allocation exceeds 100%...",
  "overAllocated": true
}
```

### Enhanced Response (With Severity)

```json
{
  "id": "uuid",
  "warning": "Resource is over-allocated at 145%",
  "overAllocated": true,
  "overallocationSeverity": "MEDIUM",
  "totalAllocation": 145,
  "requiresReview": true,
  "capacityInfo": {
    "projectTeamSize": 5,
    "currentTeamCount": 6,
    "atCapacity": true
  },
  "benchAdjustment": {
    "benchPercentage": 0,
    "message": "Bench allocation deactivated"
  }
}
```

---

## Document History

| Version | Date     | Author | Changes          |
| ------- | -------- | ------ | ---------------- |
| 1.0     | Jan 2026 | System | Initial document |
