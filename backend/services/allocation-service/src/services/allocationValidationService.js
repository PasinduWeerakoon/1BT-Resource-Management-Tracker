/**
 * Allocation Validation Service
 * 
 * Handles all validation logic for allocations including:
 * - Allocation percentage validation
 * - Overallocation severity calculation
 * - Minimum allocation threshold validation
 * - Project capacity checks
 * - Duration validation
 * - Date overlap validation
 */

import * as db from '/opt/nodejs/database/index.js';
import { getBenchProjectId } from './benchService.js';

/**
 * Configuration for allocation validation
 */
export const ALLOCATION_CONFIG = {
    OVERALLOCATION_THRESHOLDS: {
        LOW: 110,      // 101-110%: Warning only
        MEDIUM: 120,   // 111-120%: Requires review
        HIGH: 140,     // 121-140%: Requires notes
        CRITICAL: 141  // >140%: Requires force flag
    },
    MINIMUM_ALLOCATION_PERCENTAGE: 5,
    BENCH_CLEANUP_THRESHOLD_HOURS: 24,
    INDEFINITE_WARNING_DAYS: 365,
    MIN_BILLING_DURATION_DAYS: 14,
    EXEMPT_PROJECT_CODES: ['BENCH', 'LEAVE', 'PTO', 'TRAINING']
};

/**
 * Enhancement 3.2: Calculate overallocation severity based on total allocation
 */
export const calculateOverallocationSeverity = (totalAllocation) => {
    const thresholds = ALLOCATION_CONFIG.OVERALLOCATION_THRESHOLDS;

    if (totalAllocation <= 100) {
        return { severity: 'NORMAL', requiresReview: false, requiresNotes: false, requiresForce: false };
    } else if (totalAllocation <= thresholds.LOW) {
        return { severity: 'LOW', requiresReview: false, requiresNotes: false, requiresForce: false };
    } else if (totalAllocation <= thresholds.MEDIUM) {
        return { severity: 'MEDIUM', requiresReview: true, requiresNotes: false, requiresForce: false };
    } else if (totalAllocation <= thresholds.HIGH) {
        return { severity: 'HIGH', requiresReview: true, requiresNotes: true, requiresForce: false };
    } else {
        return { severity: 'CRITICAL', requiresReview: true, requiresNotes: true, requiresForce: true };
    }
};

/**
 * Validate allocation and return warning if exceeds 100%
 * Enhancement 3.2: Now includes severity levels and required fields
 * Returns { valid: true, warning?: string, ... } instead of blocking
 */
export const validateAllocation = async (resourceId, newPercentage, excludeAllocationId, allocatedDate, deallocatedDate) => {
    const allocatedDateStr = allocatedDate instanceof Date ? allocatedDate.toISOString().split('T')[0] : allocatedDate;
    const deallocatedDateStr = deallocatedDate instanceof Date ? deallocatedDate.toISOString().split('T')[0] : deallocatedDate;
    const benchProjectId = await getBenchProjectId();

    // Calculate total excluding bench and current allocation
    let query = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE resource_id = $1
        AND project_id != $2
        AND is_active = true
        AND (deallocated_date IS NULL OR deallocated_date >= $3::date)
        AND allocated_date <= COALESCE($4::date, '9999-12-31'::date)
    `;
    const params = [resourceId, benchProjectId, allocatedDateStr, deallocatedDateStr];

    if (excludeAllocationId) {
        query += ` AND id != $5`;
        params.push(excludeAllocationId);
    }

    const result = await db.query(query, params);
    const currentNonBenchTotal = parseInt(result.rows[0].total, 10);
    const newTotal = currentNonBenchTotal + newPercentage;

    // Enhancement 3.2: Calculate severity and requirements
    const severityInfo = calculateOverallocationSeverity(newTotal);

    // Always valid (unless CRITICAL without force flag), but return warning if exceeds 100%
    const response = {
        valid: true,
        currentTotal: currentNonBenchTotal,
        newTotal,
        benchWillBe: Math.max(0, 100 - newTotal),
        overallocationSeverity: severityInfo.severity,
        requiresReview: severityInfo.requiresReview,
        requiresNotes: severityInfo.requiresNotes,
        requiresForce: severityInfo.requiresForce,
    };

    if (newTotal > 100) {
        // Generate severity-appropriate warning message
        if (severityInfo.severity === 'CRITICAL') {
            response.warning = `CRITICAL overallocation at ${newTotal}%. This requires manager approval (use forceOverallocation flag).`;
        } else if (severityInfo.severity === 'HIGH') {
            response.warning = `HIGH overallocation at ${newTotal}%. Notes are required to explain the business reason.`;
        } else if (severityInfo.severity === 'MEDIUM') {
            response.warning = `MEDIUM overallocation at ${newTotal}%. This allocation requires review.`;
        } else {
            response.warning = `Resource slightly over-allocated at ${newTotal}%.`;
        }
        response.overAllocated = true;
    }

    return response;
};

/**
 * Enhancement 3.7: Validate minimum allocation threshold
 * Returns error if allocation is below minimum for non-exempt projects
 */
export const validateMinimumAllocation = async (allocationPercentage, projectId) => {
    const minThreshold = ALLOCATION_CONFIG.MINIMUM_ALLOCATION_PERCENTAGE;

    if (allocationPercentage >= minThreshold) {
        return { valid: true };
    }

    // Check if project is exempt (Bench, Leave, Training, PTO)
    const projectResult = await db.query(
        'SELECT project_code, is_bench_project FROM projects WHERE id = $1',
        [projectId]
    );

    if (projectResult.rows.length === 0) {
        return { valid: false, error: 'Project not found' };
    }

    const project = projectResult.rows[0];

    // Bench projects and exempt codes are allowed any percentage
    if (project.is_bench_project || ALLOCATION_CONFIG.EXEMPT_PROJECT_CODES.includes(project.project_code)) {
        return { valid: true };
    }

    return {
        valid: false,
        error: `Minimum allocation is ${minThreshold}%. For smaller commitments, use notes instead. Current: ${allocationPercentage}%`
    };
};

/**
 * Enhancement 3.8: Check project capacity and return warning if exceeded
 * Does not block - returns warning for business decision
 */
export const checkProjectCapacity = async (projectId, excludeResourceId = null) => {
    // Get project team_size
    const projectResult = await db.query(
        'SELECT project_name, team_size FROM projects WHERE id = $1',
        [projectId]
    );

    if (projectResult.rows.length === 0 || !projectResult.rows[0].team_size) {
        return { capacityWarning: null };
    }

    const project = projectResult.rows[0];

    // Count distinct resources currently allocated
    let query = `
        SELECT COUNT(DISTINCT resource_id) as current_team_count
        FROM allocations
        WHERE project_id = $1
        AND is_active = true
    `;
    const params = [projectId];

    if (excludeResourceId) {
        query += ' AND resource_id != $2';
        params.push(excludeResourceId);
    }

    const countResult = await db.query(query, params);
    const currentTeamCount = parseInt(countResult.rows[0].current_team_count, 10);
    const newTeamCount = currentTeamCount + 1; // Adding one more resource

    if (newTeamCount > project.team_size) {
        return {
            capacityWarning: `Project "${project.project_name}" at capacity`,
            currentTeamSize: newTeamCount,
            maxTeamSize: project.team_size,
            overCapacity: true
        };
    }

    return { capacityWarning: null };
};

/**
 * Enhancement 3.9: Validate allocation duration and return warnings
 */
export const validateAllocationDuration = (startDate, endDate, projectBillingStatus) => {
    const warnings = [];

    if (!endDate) {
        // Indefinite allocation - check how long it's been running
        const start = new Date(startDate);
        const today = new Date();
        const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));

        if (daysSinceStart > ALLOCATION_CONFIG.INDEFINITE_WARNING_DAYS) {
            warnings.push(`This allocation has been indefinite for over a year (${daysSinceStart} days). Consider setting an end date.`);
        }
    } else {
        // Calculate duration
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

        // Warn about very short billing allocations
        if (durationDays < ALLOCATION_CONFIG.MIN_BILLING_DURATION_DAYS && projectBillingStatus === 'Billing') {
            warnings.push(`Short billing allocation (${durationDays} days). Confirm this is correct.`);
        }
    }

    return warnings.length > 0 ? { durationWarnings: warnings } : { durationWarnings: null };
};

/**
 * Enhancement 3.5: Check for overlapping date ranges with existing allocations
 * Returns conflicting allocation if found, null otherwise
 */
export const checkOverlappingAllocation = async (resourceId, projectId, allocatedDate, deallocatedDate, excludeAllocationId = null) => {
    const allocatedDateStr = allocatedDate instanceof Date ? allocatedDate.toISOString().split('T')[0] : allocatedDate;
    const deallocatedDateStr = deallocatedDate instanceof Date ? deallocatedDate.toISOString().split('T')[0] : deallocatedDate;

    // Two date ranges overlap if:
    // (start1 <= end2 OR end2 IS NULL) AND (start2 <= end1 OR end1 IS NULL)
    let query = `
        SELECT id, allocated_date, deallocated_date, allocation_percentage
        FROM allocations
        WHERE resource_id = $1
        AND project_id = $2
        AND is_active = true
        AND (allocated_date <= COALESCE($4::date, '9999-12-31'))
        AND (COALESCE(deallocated_date, '9999-12-31') >= $3::date)
    `;
    const params = [resourceId, projectId, allocatedDateStr, deallocatedDateStr];

    if (excludeAllocationId) {
        query += ` AND id != $5`;
        params.push(excludeAllocationId);
    }

    const result = await db.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Check resource status for allocation eligibility
 * Returns { allowed: boolean, error?: string }
 */
export const checkResourceStatus = async (resourceId, isBenchAllocation = false) => {
    const resourceResult = await db.query('SELECT status FROM employees WHERE id = $1', [resourceId]);

    if (resourceResult.rows.length === 0) {
        return { allowed: false, error: 'Resource not found' };
    }

    const resourceStatus = resourceResult.rows[0].status;

    // Block new allocations for resources in Notice Period or Inactive status
    if (resourceStatus === 'Serving Notice Period' && !isBenchAllocation) {
        return {
            allowed: false,
            error: 'Cannot create new allocations for resources serving notice period. Only allocation reductions or deletions are allowed.',
            resourceStatus,
            allowedOperations: ['reduce', 'delete']
        };
    }

    if (resourceStatus === 'Inactive') {
        return {
            allowed: false,
            error: 'Cannot create allocations for inactive resources.',
            resourceStatus
        };
    }

    return { allowed: true, resourceStatus };
};
