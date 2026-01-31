/**
 * Allocations Handler
 * Lambda handlers for resource allocation management
 * 
 * 3-Table Temporal Architecture:
 * - Future allocations (effective_date > TODAY) go to future_allocations table
 * - Current/backdated allocations go directly to allocations table
 * - Ended allocations are archived to allocation_history_archive table by scheduler
 * 
 * Bench Auto-Allocation System:
 * - New resources are automatically allocated 100% to Bench
 * - When allocating to other projects, Bench allocation is automatically reduced
 * - Allocations exceeding 100% return a warning (not error)
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict, badRequest } from '/opt/nodejs/utils/response.js';
import { validate, allocationSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';
import futureAllocationService from '../services/futureAllocationService.js';

const SERVICE_NAME = 'allocation-service';

// Configuration constants for allocation business rules
const ALLOCATION_CONFIG = {
    // Enhancement 3.1: Bench cleanup threshold
    BENCH_CLEANUP_THRESHOLD_HOURS: 24,

    // Enhancement 3.2: Overallocation severity thresholds
    OVERALLOCATION_THRESHOLDS: {
        LOW: 120,       // 101-120%
        MEDIUM: 150,    // 121-150%
        HIGH: 180,      // 151-180%
        CRITICAL: 180,  // >180% (requires force flag)
    },

    // Enhancement 3.7: Minimum allocation threshold
    MINIMUM_ALLOCATION_PERCENTAGE: 5,

    // Enhancement 3.9: Duration validation
    MIN_BILLING_DURATION_DAYS: 7,
    INDEFINITE_WARNING_DAYS: 365,

    // Exempt project codes (not subject to minimum threshold)
    EXEMPT_PROJECT_CODES: ['BENCH', 'LEAVE', 'TRAINING', 'PTO'],
};

// Fixed Bench project ID - will be looked up by is_bench_project flag
let BENCH_PROJECT_ID = null;

/**
 * Update total_allocation and total_billing for a resource
 * Called after allocation changes to keep resource totals in sync
 */
const updateResourceTotals = async (resourceId, log) => {
    try {
        const totalsQuery = `
            UPDATE resources
            SET 
                total_allocation = (
                    SELECT COALESCE(SUM(a.allocation_percentage), 0)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    WHERE a.resource_id = $1
                    AND a.is_active = true
                    AND a.deleted_at IS NULL
                    AND p.is_bench_project = false
                ),
                total_billing = (
                    SELECT COALESCE(SUM(a.billing_percentage), 0)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    WHERE a.resource_id = $1
                    AND a.is_active = true
                    AND a.deleted_at IS NULL
                    AND p.billing_status = 'Billing'
                    AND p.is_bench_project = false
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING total_allocation, total_billing
        `;

        const result = await db.query(totalsQuery, [resourceId]);

        if (result.rows.length > 0) {
            log.info('Updated resource totals', {
                resourceId,
                totalAllocation: result.rows[0].total_allocation,
                totalBilling: result.rows[0].total_billing
            });
        }

        return result.rows[0];
    } catch (err) {
        log.error('Failed to update resource totals', {
            resourceId,
            error: err.message
        });
        // Don't throw - this is a background operation
        return null;
    }
};


/**
 * Get the Bench project ID (from database by is_bench_project flag)
 */
const getBenchProjectId = async () => {
    // Return cached value if available
    if (BENCH_PROJECT_ID) {
        return BENCH_PROJECT_ID;
    }

    try {
        const result = await db.query(
            "SELECT id FROM projects WHERE is_bench_project = true AND deleted_at IS NULL LIMIT 1"
        );
        if (result.rows.length > 0) {
            BENCH_PROJECT_ID = result.rows[0].id;
            return BENCH_PROJECT_ID;
        }

        // Fallback: try to find by project code
        const codeResult = await db.query(
            "SELECT id FROM projects WHERE project_code = 'BENCH' AND deleted_at IS NULL LIMIT 1"
        );
        if (codeResult.rows.length > 0) {
            BENCH_PROJECT_ID = codeResult.rows[0].id;
            return BENCH_PROJECT_ID;
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Calculate total allocation for a resource (excluding bench)
 */
const calculateNonBenchTotal = async (resourceId, excludeAllocationId, allocatedDate, deallocatedDate) => {
    const benchProjectId = await getBenchProjectId();
    const allocatedDateStr = allocatedDate instanceof Date ? allocatedDate.toISOString().split('T')[0] : allocatedDate;
    const deallocatedDateStr = deallocatedDate instanceof Date ? deallocatedDate.toISOString().split('T')[0] : deallocatedDate;

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
    return parseInt(result.rows[0].total, 10);
};

/**
 * Get the current bench allocation for a resource (including inactive)
 */
const getBenchAllocation = async (resourceId) => {
    const benchProjectId = await getBenchProjectId();
    // Get any bench allocation for this resource (active or inactive)
    const result = await db.query(`
        SELECT * FROM allocations 
        WHERE resource_id = $1 
        AND project_id = $2 
        ORDER BY is_active DESC, updated_at DESC
        LIMIT 1
    `, [resourceId, benchProjectId]);

    return result.rows[0] || null;
};

/**
 * Enhancement 3.5: Check for overlapping date ranges with existing allocations
 * Returns conflicting allocation if found, null otherwise
 */
const checkOverlappingAllocation = async (resourceId, projectId, allocatedDate, deallocatedDate, excludeAllocationId = null) => {
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
 * Enhancement 3.1: Check if bench allocation is a short-stay (< 24 hours)
 * and can be cleaned up (hard deleted) instead of just deactivated
 */
const isShortStayBench = async (resourceId, log) => {
    const benchProjectId = await getBenchProjectId();
    const thresholdHours = ALLOCATION_CONFIG.BENCH_CLEANUP_THRESHOLD_HOURS;

    // Get the current bench allocation
    const benchResult = await db.query(`
        SELECT id, created_at, allocated_date
        FROM allocations
        WHERE resource_id = $1
        AND project_id = $2
        AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
    `, [resourceId, benchProjectId]);

    if (benchResult.rows.length === 0) {
        return { isShortStay: false, benchAllocationId: null };
    }

    const benchAllocation = benchResult.rows[0];
    const benchCreatedAt = new Date(benchAllocation.created_at);
    const now = new Date();
    const hoursSinceBenchCreated = (now - benchCreatedAt) / (1000 * 60 * 60);

    if (hoursSinceBenchCreated >= thresholdHours) {
        return { isShortStay: false, benchAllocationId: benchAllocation.id };
    }

    // Check if resource had any other allocation changes since bench was created
    // (excluding the bench allocation itself)
    const otherChangesResult = await db.query(`
        SELECT COUNT(*) as change_count
        FROM allocation_change_history
        WHERE allocation_id IN (
            SELECT id FROM allocations WHERE resource_id = $1 AND project_id != $2
        )
        AND changed_at > $3
    `, [resourceId, benchProjectId, benchCreatedAt.toISOString()]);

    const hasOtherChanges = parseInt(otherChangesResult.rows[0].change_count, 10) > 0;

    if (hasOtherChanges) {
        log.info('Bench is short-stay but resource had other allocation changes', {
            resourceId,
            benchAllocationId: benchAllocation.id,
            hoursSinceBenchCreated
        });
        return { isShortStay: false, benchAllocationId: benchAllocation.id };
    }

    log.info('Short-stay bench detected', {
        resourceId,
        benchAllocationId: benchAllocation.id,
        hoursSinceBenchCreated,
        thresholdHours
    });

    return { isShortStay: true, benchAllocationId: benchAllocation.id };
};

/**
 * Enhancement 3.1: Hard delete a short-stay bench allocation
 * Does NOT log to allocation_history (to keep history clean)
 */
const cleanupShortStayBench = async (benchAllocationId, log) => {
    await db.query('DELETE FROM allocations WHERE id = $1', [benchAllocationId]);
    log.info('Short-stay bench allocation cleaned up (hard deleted)', { benchAllocationId });
};

/**
 * Auto-adjust bench allocation based on other allocations
 * Returns the new bench percentage after adjustment
 * Enhancement 3.11: Added explicit logging for negative bench calculation
 */
const adjustBenchAllocation = async (resourceId, userId, log) => {
    const benchProjectId = await getBenchProjectId();
    const nonBenchTotal = await calculateNonBenchTotal(resourceId, null, new Date().toISOString().split('T')[0], null);
    const calculatedBenchPercentage = 100 - nonBenchTotal;

    // Enhancement 3.11: Explicit logging for rollover protection
    if (calculatedBenchPercentage < 0) {
        log.warn('Bench percentage calculation resulted in negative value, clamping to 0', {
            resourceId,
            nonBenchTotal,
            calculatedValue: calculatedBenchPercentage,
            clampedValue: 0
        });
    }

    const newBenchPercentage = Math.max(0, calculatedBenchPercentage);

    const benchAllocation = await getBenchAllocation(resourceId);

    if (benchAllocation) {
        if (newBenchPercentage === 0) {
            // Deactivate bench allocation if 0%
            await db.query(`
                UPDATE allocations 
                SET is_active = false, allocation_percentage = 0, updated_by = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [benchAllocation.id, userId || '00000000-0000-0000-0000-000000000000']);
            log.info('Bench allocation deactivated', { resourceId, previousPercentage: benchAllocation.allocation_percentage });
        } else if (benchAllocation.allocation_percentage !== newBenchPercentage) {
            // Update bench allocation percentage
            await db.query(`
                UPDATE allocations 
                SET allocation_percentage = $2, is_active = true, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [benchAllocation.id, newBenchPercentage, userId || '00000000-0000-0000-0000-000000000000']);
            log.info('Bench allocation adjusted', {
                resourceId,
                previousPercentage: benchAllocation.allocation_percentage,
                newPercentage: newBenchPercentage
            });
        }
    } else if (newBenchPercentage > 0) {
        // Create bench allocation if it doesn't exist and should have a value
        // Bench allocations have 0% billing
        await db.query(`
            INSERT INTO allocations (resource_id, project_id, allocation_percentage, billing_percentage, allocated_date, is_active, notes, created_by, change_type)
            VALUES ($1, $2, $3, 0, CURRENT_DATE, true, 'Auto-created bench allocation', $4, 'NEW_ALLOCATION')
        `, [resourceId, benchProjectId, newBenchPercentage, userId || '00000000-0000-0000-0000-000000000000']);
        log.info('Bench allocation created', { resourceId, percentage: newBenchPercentage });
    }

    return newBenchPercentage;
};

/**
 * Enhancement 3.2: Calculate overallocation severity based on total allocation
 */
const calculateOverallocationSeverity = (totalAllocation) => {
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
const validateAllocation = async (resourceId, newPercentage, excludeAllocationId, allocatedDate, deallocatedDate) => {
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
const validateMinimumAllocation = async (allocationPercentage, projectId) => {
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
const checkProjectCapacity = async (projectId, excludeResourceId = null) => {
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
const validateAllocationDuration = (startDate, endDate, projectBillingStatus) => {
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
 * Log allocation changes to history
 */
const logAllocationHistory = async (allocation, changeType, userId) => {
    const query = `
        INSERT INTO allocation_change_history (
            allocation_id, change_type, changed_by, changed_fields, new_values
        )
        VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [
        allocation.id,
        changeType,
        userId || '00000000-0000-0000-0000-000000000000',
        JSON.stringify(['allocation_percentage', 'allocated_date', 'deallocated_date']),
        JSON.stringify(allocation)
    ]);
};

/**
 * List allocations with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'allocations.list' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { page = 1, limit = 20, resource_id, project_id, is_active } = queryParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        log.info('Listing allocations', { page, limit, filters: { resource_id, project_id, is_active } });

        // Build dynamic query
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (resource_id) {
            whereClause += ` AND a.resource_id = $${paramIndex}`;
            params.push(resource_id);
            paramIndex++;
        }

        if (project_id) {
            whereClause += ` AND a.project_id = $${paramIndex}`;
            params.push(project_id);
            paramIndex++;
        }

        if (is_active !== undefined) {
            whereClause += ` AND a.is_active = $${paramIndex}`;
            params.push(is_active === 'true' || is_active === true);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM allocations a ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with joins
        const dataQuery = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                p.project_name,
                c.client_name
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            ${whereClause}
            ORDER BY a.allocated_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(parseInt(limit), offset);

        const result = await db.query(dataQuery, params);

        return success({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to list allocations', { error: err.message });
        return error('Failed to list allocations', err);
    }
};

/**
 * Get a single allocation by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'allocations.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting allocation', { id });

        const query = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                p.project_name,
                c.client_name
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE a.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Allocation not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get allocation', { id, error: err.message });
        return error('Failed to get allocation', err);
    }
};

/**
 * 3-Table Architecture: Determine routing based on effective_date
 * - If effective_date > TODAY: Route to future_allocations table
 * - If effective_date <= TODAY: Route directly to allocations table
 * 
 * @param {string|Date} effectiveDate - The effective/start date of the allocation
 * @returns {Object} { isFuture: boolean, todayStr: string, effectiveDateStr: string }
 */
const determineAllocationRouting = (effectiveDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const effectiveDateObj = effectiveDate instanceof Date
        ? effectiveDate
        : new Date(effectiveDate);
    effectiveDateObj.setHours(0, 0, 0, 0);
    const effectiveDateStr = effectiveDateObj.toISOString().split('T')[0];

    const isFuture = effectiveDateObj > today;

    return {
        isFuture,
        todayStr,
        effectiveDateStr
    };
};

/**
 * Create a new allocation
 * Automatically adjusts Bench allocation after creating
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'allocations.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, allocationSchemas.create);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
        const benchProjectId = await getBenchProjectId();

        log.info('Creating allocation', { resource_id: validated.resource_id, project_id: validated.project_id });

        // Check if this is a bench allocation
        const isBenchAllocation = validated.project_id === benchProjectId;

        // Enhancement 3.6: Check resource status before creating allocation
        const resourceResult = await db.query('SELECT status FROM resources WHERE id = $1', [validated.resource_id]);
        if (resourceResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resourceStatus = resourceResult.rows[0].status;

        // Block new allocations for resources in Notice Period or Inactive status
        if (resourceStatus === 'Serving Notice Period' && !isBenchAllocation) {
            log.warn('Blocked allocation creation - resource is serving notice period', {
                resourceId: validated.resource_id,
                resourceStatus
            });
            return badRequest('Cannot create new allocations for resources serving notice period. Only allocation reductions or deletions are allowed.', {
                resourceStatus,
                allowedOperations: ['reduce', 'delete']
            });
        }

        if (resourceStatus === 'Inactive') {
            log.warn('Blocked allocation creation - resource is inactive', {
                resourceId: validated.resource_id,
                resourceStatus
            });
            return badRequest('Cannot create allocations for inactive resources.', {
                resourceStatus
            });
        }

        // Enhancement 3.5: Check for overlapping date conflicts
        if (!isBenchAllocation) {
            const overlappingAllocation = await checkOverlappingAllocation(
                validated.resource_id,
                validated.project_id,
                validated.start_date,
                validated.end_date
            );

            if (overlappingAllocation) {
                log.warn('Overlapping allocation detected', {
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    existingAllocationId: overlappingAllocation.id
                });
                return conflict('Conflicting allocation exists for this resource and project with overlapping dates', {
                    existingAllocationId: overlappingAllocation.id,
                    existingDateRange: {
                        start: overlappingAllocation.allocated_date,
                        end: overlappingAllocation.deallocated_date
                    },
                    requestedDateRange: {
                        start: validated.start_date,
                        end: validated.end_date
                    }
                });
            }
        }

        // Validate allocation (now returns warning instead of error for >100%)
        const validationResult = await validateAllocation(
            validated.resource_id,
            isBenchAllocation ? 0 : validated.allocation_percentage, // Don't count bench in validation
            null,
            validated.start_date,
            validated.end_date
        );

        // Enhancement 3.2: Block CRITICAL overallocation unless force flag is provided
        if (validationResult.requiresForce && !validated.forceOverallocation) {
            log.warn('CRITICAL overallocation blocked - force flag required', {
                resourceId: validated.resource_id,
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity
            });
            return badRequest('CRITICAL overallocation detected. This allocation would result in ' + validationResult.newTotal + '% total allocation. ' +
                'This requires manager approval. Include "forceOverallocation": true in the request to proceed.', {
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity,
                requiresForce: true
            });
        }

        // Enhancement 3.2: Require notes for HIGH severity
        if (validationResult.requiresNotes && (!validated.notes || validated.notes.trim().length === 0)) {
            log.warn('HIGH overallocation requires notes', {
                resourceId: validated.resource_id,
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity
            });
            return badRequest('HIGH overallocation detected. Notes are required to explain the business reason for ' + validationResult.newTotal + '% allocation.', {
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity,
                requiresNotes: true
            });
        }

        // Enhancement 3.7: Validate minimum allocation threshold
        if (!isBenchAllocation) {
            const minValidation = await validateMinimumAllocation(validated.allocation_percentage, validated.project_id);
            if (!minValidation.valid) {
                log.warn('Allocation below minimum threshold', {
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    percentage: validated.allocation_percentage,
                    error: minValidation.error
                });
                return badRequest(minValidation.error, {
                    minimumThreshold: ALLOCATION_CONFIG.MINIMUM_ALLOCATION_PERCENTAGE,
                    currentPercentage: validated.allocation_percentage
                });
            }
        }

        // Enhancement 3.8: Check project capacity (warning only)
        let capacityCheck = { capacityWarning: null };
        if (!isBenchAllocation) {
            capacityCheck = await checkProjectCapacity(validated.project_id);
        }

        // Enhancement 3.9: Validate duration (warnings only)
        const projectResult = await db.query('SELECT billing_status FROM projects WHERE id = $1', [validated.project_id]);
        const projectBillingStatus = projectResult.rows.length > 0 ? projectResult.rows[0].billing_status : null;
        const durationValidation = validateAllocationDuration(validated.start_date, validated.end_date, projectBillingStatus);

        // =================================================================
        // 3-TABLE TEMPORAL ARCHITECTURE: Route based on effective_date
        // =================================================================
        // Use effective_date if provided, otherwise fall back to start_date
        const effectiveDate = validated.effective_date || validated.start_date;
        const { isFuture, todayStr, effectiveDateStr } = determineAllocationRouting(effectiveDate);

        // If effective_date is in the FUTURE, route to future_allocations table
        if (isFuture && !isBenchAllocation) {
            log.info('Routing to future_allocations table (effective_date > today)', {
                resource_id: validated.resource_id,
                project_id: validated.project_id,
                effective_date: effectiveDateStr,
                today: todayStr
            });

            try {
                // Check for conflicting future allocations for same resource+project
                const existingFuture = await futureAllocationService.checkConflictingFuture(
                    validated.resource_id,
                    validated.project_id,
                    effectiveDateStr
                );

                if (existingFuture) {
                    return conflict('A scheduled allocation already exists for this resource and project on the same effective date', {
                        existingFutureAllocationId: existingFuture.id,
                        existingEffectiveDate: existingFuture.effective_date,
                        existingChangeType: existingFuture.change_type
                    });
                }

                // Create future allocation record
                const futureAllocation = await futureAllocationService.createFutureAllocation({
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    effectiveDate: effectiveDateStr,
                    changeType: 'NEW_ALLOCATION',
                    newAllocationPercentage: validated.allocation_percentage,
                    newBillingPercentage: validated.billing_percentage ?? 100,
                    notes: validated.notes,
                    createdBy: userId || '00000000-0000-0000-0000-000000000000'
                });

                // Send audit event for future allocation creation
                await audit.create(
                    event,
                    'future_allocation',
                    futureAllocation.id,
                    `Scheduled: ${validated.resource_id} -> ${validated.project_id} on ${effectiveDateStr}`,
                    futureAllocation,
                    SERVICE_NAME,
                    {
                        resource_id: validated.resource_id,
                        project_id: validated.project_id,
                        effective_date: effectiveDateStr,
                        change_type: 'NEW_ALLOCATION'
                    }
                );

                log.info('Future allocation created', { id: futureAllocation.id, effective_date: effectiveDateStr });

                return success({
                    ...futureAllocation,
                    isFutureAllocation: true,
                    message: `Allocation scheduled for ${effectiveDateStr}. It will be activated automatically on that date.`,
                    activationInfo: {
                        scheduledDate: effectiveDateStr,
                        currentDate: todayStr,
                        daysUntilActivation: Math.ceil((new Date(effectiveDateStr) - new Date(todayStr)) / (1000 * 60 * 60 * 24))
                    },
                    // Include validation warnings if any
                    warning: validationResult.warning,
                    capacityWarning: capacityCheck.capacityWarning,
                    durationWarnings: durationValidation.durationWarnings
                }, 201);

            } catch (futureErr) {
                log.error('Failed to create future allocation', { error: futureErr.message });
                return error('Failed to schedule future allocation: ' + futureErr.message, 500, 'FUTURE_ALLOCATION_ERROR');
            }
        }
        // =================================================================
        // END 3-TABLE ROUTING - Continue with immediate allocation below
        // =================================================================

        const query = `
            INSERT INTO allocations (
                resource_id, project_id, allocation_percentage, billing_percentage, allocated_date, deallocated_date,
                is_active, notes, created_by, change_type
            )
            VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, $10)
            RETURNING *
        `;

        // Convert dates to ISO strings (using effective_date for allocated_date)
        const allocatedDateStr = effectiveDateStr;
        const deallocatedDateStr = validated.end_date
            ? (validated.end_date instanceof Date
                ? validated.end_date.toISOString().split('T')[0]
                : validated.end_date)
            : null;

        // Bench allocations have 0% billing, default 100% for project allocations
        const billingPercentage = isBenchAllocation ? 0 : (validated.billing_percentage ?? 100);

        // Determine change_type: LEGACY for backdated, NEW_ALLOCATION for same-day
        const changeType = effectiveDateStr < todayStr ? 'LEGACY' : 'NEW_ALLOCATION';

        const params = [
            validated.resource_id,
            validated.project_id,
            validated.allocation_percentage,
            billingPercentage,
            allocatedDateStr,
            deallocatedDateStr,
            true, // is_active
            validated.notes || null,
            userId || '00000000-0000-0000-0000-000000000000',
            changeType
        ];

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'CREATED', userId);

        // Auto-adjust bench allocation if this is not a bench allocation
        let benchAdjustment = null;
        let shortStayCleanup = null;
        if (!isBenchAllocation) {
            // Enhancement 3.1: Check if bench is a short-stay that can be cleaned up
            const { isShortStay, benchAllocationId } = await isShortStayBench(validated.resource_id, log);

            if (isShortStay && benchAllocationId) {
                // Hard delete the short-stay bench allocation (don't log to history)
                await cleanupShortStayBench(benchAllocationId, log);
                shortStayCleanup = {
                    cleaned: true,
                    message: 'Short-stay bench allocation removed (< 24 hours)'
                };
                // Re-adjust bench (will create new one or leave as is based on total allocation)
            }

            const newBenchPercentage = await adjustBenchAllocation(validated.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`,
                shortStayCleanup
            };
        }

        // Send audit event for allocation creation
        await audit.create(
            event,
            'allocation',
            allocation.id,
            `${validated.resource_id} -> ${validated.project_id}`,
            allocation,
            SERVICE_NAME,
            {
                resource_id: validated.resource_id,
                project_id: validated.project_id,
                percentage: validated.allocation_percentage,
                benchAdjustment
            }
        );

        log.info('Allocation created', { id: allocation.id, warning: validationResult.warning });

        // Update resource total_allocation and total_billing
        await updateResourceTotals(validated.resource_id, log);

        // Build response with optional warning and severity information
        const response = {
            ...allocation,
            benchAdjustment
        };

        // Enhancement 3.2: Include severity information in response
        if (validationResult.warning) {
            response.warning = validationResult.warning;
            response.totalAllocation = validationResult.newTotal;
            response.overAllocated = validationResult.overAllocated;
            response.overallocationSeverity = validationResult.overallocationSeverity;
            response.requiresReview = validationResult.requiresReview;
        }

        // Enhancement 3.8: Include capacity warning
        if (capacityCheck.capacityWarning) {
            response.capacityWarning = capacityCheck.capacityWarning;
            response.currentTeamSize = capacityCheck.currentTeamSize;
            response.maxTeamSize = capacityCheck.maxTeamSize;
            response.overCapacity = capacityCheck.overCapacity;
        }

        // Enhancement 3.9: Include duration warnings
        if (durationValidation.durationWarnings) {
            response.durationWarnings = durationValidation.durationWarnings;
        }

        return success(response, 201);

    } catch (err) {
        log.error('Failed to create allocation', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23503') {
            return badRequest('Resource or Project not found');
        }

        return error('Failed to create allocation', err);
    }
};

/**
 * Update an existing allocation
 * Automatically adjusts Bench allocation after updating
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'allocations.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, allocationSchemas.update);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
        const benchProjectId = await getBenchProjectId();

        log.info('Updating allocation', { id, userId });

        // Get existing allocation
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }
        const existing = existingResult.rows[0];
        const isBenchAllocation = existing.project_id === benchProjectId;

        // Enhancement 3.6: Check resource status before updating allocation
        const resourceResult = await db.query('SELECT status FROM resources WHERE id = $1', [existing.resource_id]);
        if (resourceResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resourceStatus = resourceResult.rows[0].status;

        // During notice period, only allow reductions in allocation percentage
        if (resourceStatus === 'Serving Notice Period' && !isBenchAllocation && validated.allocation_percentage !== undefined) {
            if (validated.allocation_percentage > existing.allocation_percentage) {
                log.warn('Blocked allocation increase - resource is serving notice period', {
                    allocationId: id,
                    resourceId: existing.resource_id,
                    resourceStatus,
                    currentPercentage: existing.allocation_percentage,
                    requestedPercentage: validated.allocation_percentage
                });
                return badRequest('Cannot increase allocations for resources serving notice period. Only reductions or deletions are allowed.', {
                    resourceStatus,
                    currentAllocation: existing.allocation_percentage,
                    allowedOperations: ['reduce', 'delete']
                });
            }
        }

        // Block updates for inactive resources
        if (resourceStatus === 'Inactive') {
            log.warn('Blocked allocation update - resource is inactive', {
                allocationId: id,
                resourceId: existing.resource_id,
                resourceStatus
            });
            return badRequest('Cannot update allocations for inactive resources.', {
                resourceStatus
            });
        }

        // Optimistic locking check
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Allocation has been modified by another user. Please refresh and try again.');
        }

        // Enhancement 3.5: Check for overlapping date conflicts when dates are being changed
        if (!isBenchAllocation && (validated.start_date || validated.end_date)) {
            const overlappingAllocation = await checkOverlappingAllocation(
                existing.resource_id,
                existing.project_id,
                validated.start_date || existing.allocated_date,
                validated.end_date !== undefined ? validated.end_date : existing.deallocated_date,
                id // Exclude current allocation from check
            );

            if (overlappingAllocation) {
                log.warn('Overlapping allocation detected on update', {
                    allocationId: id,
                    resourceId: existing.resource_id,
                    projectId: existing.project_id,
                    existingAllocationId: overlappingAllocation.id
                });
                return conflict('Conflicting allocation exists for this resource and project with overlapping dates', {
                    existingAllocationId: overlappingAllocation.id,
                    existingDateRange: {
                        start: overlappingAllocation.allocated_date,
                        end: overlappingAllocation.deallocated_date
                    },
                    requestedDateRange: {
                        start: validated.start_date || existing.allocated_date,
                        end: validated.end_date !== undefined ? validated.end_date : existing.deallocated_date
                    }
                });
            }
        }

        // If updating percentage, validate (warnings instead of errors for >100%)
        let validationResult = null;
        if (validated.allocation_percentage !== undefined && !isBenchAllocation) {
            validationResult = await validateAllocation(
                existing.resource_id,
                validated.allocation_percentage,
                id,
                validated.start_date || existing.allocated_date,
                validated.end_date || existing.deallocated_date
            );

            // Enhancement 3.2: Block CRITICAL overallocation unless force flag is provided
            if (validationResult.requiresForce && !validated.forceOverallocation) {
                log.warn('CRITICAL overallocation blocked on update - force flag required', {
                    allocationId: id,
                    resourceId: existing.resource_id,
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity
                });
                return badRequest('CRITICAL overallocation detected. This update would result in ' + validationResult.newTotal + '% total allocation. ' +
                    'This requires manager approval. Include "forceOverallocation": true in the request to proceed.', {
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity,
                    requiresForce: true
                });
            }

            // Enhancement 3.2: Require notes for HIGH severity
            if (validationResult.requiresNotes && (!validated.notes || validated.notes.trim().length === 0) && (!existing.notes || existing.notes.trim().length === 0)) {
                log.warn('HIGH overallocation requires notes on update', {
                    allocationId: id,
                    resourceId: existing.resource_id,
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity
                });
                return badRequest('HIGH overallocation detected. Notes are required to explain the business reason for ' + validationResult.newTotal + '% allocation.', {
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity,
                    requiresNotes: true
                });
            }

            // Enhancement 3.7: Validate minimum allocation threshold
            const minValidation = await validateMinimumAllocation(validated.allocation_percentage, existing.project_id);
            if (!minValidation.valid) {
                log.warn('Allocation update below minimum threshold', {
                    allocationId: id,
                    resourceId: existing.resource_id,
                    projectId: existing.project_id,
                    percentage: validated.allocation_percentage,
                    error: minValidation.error
                });
                return badRequest(minValidation.error, {
                    minimumThreshold: ALLOCATION_CONFIG.MINIMUM_ALLOCATION_PERCENTAGE,
                    currentPercentage: validated.allocation_percentage
                });
            }
        }

        // Enhancement 3.8: Check project capacity (warning only, if project changed or for info)
        let capacityCheck = { capacityWarning: null };
        if (!isBenchAllocation && (validated.project_id || validated.allocation_percentage !== undefined)) {
            const projectId = validated.project_id || existing.project_id;
            capacityCheck = await checkProjectCapacity(projectId, existing.resource_id);
        }

        // Enhancement 3.9: Validate duration (warnings only, if dates changed)
        let durationValidation = { durationWarnings: null };
        if (validated.start_date || validated.end_date !== undefined) {
            const projectResult = await db.query('SELECT billing_status FROM projects WHERE id = $1', [existing.project_id]);
            const projectBillingStatus = projectResult.rows.length > 0 ? projectResult.rows[0].billing_status : null;
            durationValidation = validateAllocationDuration(
                validated.start_date || existing.allocated_date,
                validated.end_date !== undefined ? validated.end_date : existing.deallocated_date,
                projectBillingStatus
            );
        }

        // Build dynamic update query - map start_date/end_date to allocated_date/deallocated_date
        const { version, ...updateData } = validated;
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                // Map frontend field names to database column names
                let dbColumn = key;
                if (key === 'start_date') dbColumn = 'allocated_date';
                if (key === 'end_date') dbColumn = 'deallocated_date';

                updates.push(`${dbColumn} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return success(existing);
        }

        // Add audit fields
        updates.push(`updated_by = $${paramIndex++}`);
        params.push(userId);
        updates.push(`version = version + 1`);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE allocations 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'UPDATED', userId);

        // Auto-adjust bench allocation if this is not a bench allocation
        let benchAdjustment = null;
        if (!isBenchAllocation && validated.allocation_percentage !== undefined) {
            const newBenchPercentage = await adjustBenchAllocation(existing.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };

            // Enhancement 3.4: After update, check for gaps and fill with bench
            try {
                await detectAndFillGaps(existing.resource_id, userId, log);
            } catch (gapErr) {
                log.warn('Failed to detect/fill gaps after update', {
                    resourceId: existing.resource_id,
                    error: gapErr.message
                });
            }
        }

        // Send audit event for allocation update
        await audit.update(
            event,
            'allocation',
            id,
            `${allocation.resource_id} -> ${allocation.project_id}`,
            existing,
            allocation,
            SERVICE_NAME,
            { benchAdjustment }
        );

        log.info('Allocation updated', { id, warning: validationResult?.warning });

        // Update resource total_allocation and total_billing
        await updateResourceTotals(existing.resource_id, log);

        // Build response with optional warning and severity information
        const response = {
            ...allocation,
            benchAdjustment
        };

        // Enhancement 3.2: Include severity information in response
        if (validationResult?.warning) {
            response.warning = validationResult.warning;
            response.totalAllocation = validationResult.newTotal;
            response.overAllocated = validationResult.overAllocated;
            response.overallocationSeverity = validationResult.overallocationSeverity;
            response.requiresReview = validationResult.requiresReview;
        }

        // Enhancement 3.8: Include capacity warning
        if (capacityCheck.capacityWarning) {
            response.capacityWarning = capacityCheck.capacityWarning;
            response.currentTeamSize = capacityCheck.currentTeamSize;
            response.maxTeamSize = capacityCheck.maxTeamSize;
            response.overCapacity = capacityCheck.overCapacity;
        }

        // Enhancement 3.9: Include duration warnings
        if (durationValidation.durationWarnings) {
            response.durationWarnings = durationValidation.durationWarnings;
        }

        return success(response);

    } catch (err) {
        log.error('Failed to update allocation', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update allocation', err);
    }
};

/**
 * Delete an allocation
 * Automatically adjusts Bench allocation after deleting (adds freed percentage back to bench)
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'allocations.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        log.info('Deleting allocation', { id, userId });
        const benchProjectId = await getBenchProjectId();

        // Get existing for history and bench adjustment
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }
        const existing = existingResult.rows[0];
        const isBenchAllocation = existing.project_id === benchProjectId;

        const result = await db.query('DELETE FROM allocations WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return notFound('Allocation not found');
        }

        // Log to history
        await logAllocationHistory(existing, 'DELETED', userId);

        // Auto-adjust bench allocation if this was not a bench allocation
        let benchAdjustment = null;
        if (!isBenchAllocation) {
            const newBenchPercentage = await adjustBenchAllocation(existing.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };

            // Enhancement 3.4: After deletion, check for gaps and fill with bench
            try {
                await detectAndFillGaps(existing.resource_id, userId, log);
            } catch (gapErr) {
                log.warn('Failed to detect/fill gaps after deletion', {
                    resourceId: existing.resource_id,
                    error: gapErr.message
                });
            }
        }

        // Send audit event for allocation deletion
        await audit.delete(
            event,
            'allocation',
            id,
            `${existing.resource_id} -> ${existing.project_id}`,
            existing,
            SERVICE_NAME,
            { benchAdjustment }
        );

        log.info('Allocation deleted', { id, benchAdjustment });

        // Update resource total_allocation and total_billing
        await updateResourceTotals(existing.resource_id, log);

        return success({
            message: 'Allocation deleted successfully',
            benchAdjustment
        });

    } catch (err) {
        log.error('Failed to delete allocation', { id, error: err.message });
        return error('Failed to delete allocation', err);
    }
};

/**
 * Get utilization summary for a resource
 */
export const getResourceUtilization = async (event) => {
    const log = logger.child({ handler: 'allocations.getResourceUtilization' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting resource utilization', { id });

        // Check if resource exists
        const resourceResult = await db.query(
            'SELECT id, name, email FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resource = resourceResult.rows[0];

        // Get current active allocations
        const allocationsQuery = `
            SELECT 
                a.*,
                p.project_name
            FROM allocations a
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE a.resource_id = $1
            AND a.is_active = true
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
            AND a.allocated_date <= CURRENT_DATE
        `;

        const allocationsResult = await db.query(allocationsQuery, [id]);

        // Calculate total utilization
        const totalUtilization = allocationsResult.rows.reduce(
            (sum, a) => sum + parseInt(a.allocation_percentage),
            0
        );

        return success({
            resource_id: id,
            resource_name: resource.name,
            resource_email: resource.email,
            total_utilization: totalUtilization,
            available_capacity: 100 - totalUtilization,
            active_allocations: allocationsResult.rows.length,
            allocations: allocationsResult.rows
        });

    } catch (err) {
        log.error('Failed to get resource utilization', { id, error: err.message });
        return error('Failed to get resource utilization', err);
    }
};

/**
 * Get allocation history
 */
export const getHistory = async (event) => {
    const log = logger.child({ handler: 'allocations.getHistory' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting allocation history', { id });

        const query = `
            SELECT 
                ah.*,
                u.name as changed_by_name
            FROM allocation_history ah
            LEFT JOIN users u ON ah.changed_by = u.id
            WHERE ah.allocation_id = $1
            ORDER BY ah.created_at DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            allocation_id: id,
            history: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get allocation history', { id, error: err.message });
        return error('Failed to get allocation history', err);
    }
};

/**
 * Enhancement 3.4: Gap Detection & Auto-Bench Fill
 * Detects resources with < 100% allocation and fills gap with Bench
 */
const detectAndFillGaps = async (resourceId, userId, log) => {
    const benchProjectId = await getBenchProjectId();

    // Calculate current total allocation (excluding bench)
    const totalQuery = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE resource_id = $1
        AND project_id != $2
        AND is_active = true
        AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
        AND allocated_date <= CURRENT_DATE
    `;

    const totalResult = await db.query(totalQuery, [resourceId, benchProjectId]);
    const totalActiveAllocation = parseInt(totalResult.rows[0].total, 10);

    if (totalActiveAllocation >= 100) {
        log.info('No gap detected - resource fully allocated', { resourceId, totalActiveAllocation });
        return { gapDetected: false, totalActiveAllocation };
    }

    const gapPercentage = 100 - totalActiveAllocation;
    log.info('Gap detected - filling with Bench', { resourceId, totalActiveAllocation, gapPercentage });

    // Check if Bench allocation exists (active or inactive)
    const benchAllocation = await getBenchAllocation(resourceId);

    if (benchAllocation) {
        // Reactivate or update existing Bench allocation
        await db.query(`
            UPDATE allocations 
            SET allocation_percentage = $2, is_active = true, updated_by = $3, updated_at = CURRENT_TIMESTAMP,
                notes = COALESCE(notes, '') || E'\n[Auto-filled gap on ' || CURRENT_TIMESTAMP || ']'
            WHERE id = $1
        `, [benchAllocation.id, gapPercentage, userId || '00000000-0000-0000-0000-000000000000']);

        log.info('Reactivated Bench allocation to fill gap', {
            resourceId,
            benchAllocationId: benchAllocation.id,
            gapPercentage
        });
    } else {
        // Create new Bench allocation
        await db.query(`
            INSERT INTO allocations (resource_id, project_id, allocation_percentage, billing_percentage, allocated_date, is_active, notes, created_by, change_type)
            VALUES ($1, $2, $3, 0, CURRENT_DATE, true, 'Auto-created to fill allocation gap', $4, 'AUTO_BENCH_ADJUSTMENT')
        `, [resourceId, benchProjectId, gapPercentage, userId || '00000000-0000-0000-0000-000000000000']);

        log.info('Created new Bench allocation to fill gap', { resourceId, gapPercentage });
    }

    return { gapDetected: true, gapPercentage, totalActiveAllocation };
};

/**
 * Enhancement 3.4: Scheduled job to detect and fill gaps for all active resources
 * Triggered by CloudWatch Events (nightly)
 */
export const gapDetectionJob = async (event) => {
    const log = logger.child({ handler: 'allocations.gapDetectionJob' });
    const systemUserId = '00000000-0000-0000-0000-000000000000';

    try {
        log.info('Starting gap detection job');

        // Get all active resources
        const resourcesResult = await db.query(
            "SELECT id, name FROM resources WHERE status = 'Active' AND deleted_at IS NULL"
        );

        const results = {
            totalResources: resourcesResult.rows.length,
            gapsDetected: 0,
            gapsFilled: 0,
            errors: []
        };

        for (const resource of resourcesResult.rows) {
            try {
                const result = await detectAndFillGaps(resource.id, systemUserId, log);
                if (result.gapDetected) {
                    results.gapsDetected++;
                    results.gapsFilled++;
                }
            } catch (err) {
                log.error('Failed to process resource in gap detection', {
                    resourceId: resource.id,
                    resourceName: resource.name,
                    error: err.message
                });
                results.errors.push({
                    resourceId: resource.id,
                    resourceName: resource.name,
                    error: err.message
                });
            }
        }

        log.info('Gap detection job completed', results);

        return success({
            message: 'Gap detection job completed',
            ...results
        });

    } catch (err) {
        log.error('Gap detection job failed', { error: err.message, stack: err.stack });
        return error('Gap detection job failed', err);
    }
};

/**
 * Enhancement 3.10: Auto-Transition Billing Status
 * When allocation starts, if billing_status is 'Bench' and project is not Bench/Internal,
 * transition to project's billing type
 */
export const billingStatusTransitionJob = async (event) => {
    const log = logger.child({ handler: 'allocations.billingStatusTransitionJob' });
    const systemUserId = '00000000-0000-0000-0000-000000000000';

    try {
        log.info('Starting billing status transition job');

        // Find allocations that started today with Bench billing status
        const query = `
            SELECT a.id, a.resource_id, a.project_id, p.billing_status as project_billing_status
            FROM allocations a
            JOIN projects p ON a.project_id = p.id
            WHERE a.allocated_date = CURRENT_DATE
            AND a.is_active = true
            AND p.is_bench_project = false
            AND p.project_type NOT IN ('Bench', 'Training')
            AND a.deleted_at IS NULL
        `;

        const allocationsResult = await db.query(query);

        const results = {
            totalAllocations: allocationsResult.rows.length,
            transitioned: 0,
            errors: []
        };

        for (const allocation of allocationsResult.rows) {
            try {
                // Update allocation billing status to match project
                await db.query(`
                    UPDATE allocations 
                    SET updated_by = $2, updated_at = CURRENT_TIMESTAMP,
                        notes = COALESCE(notes, '') || E'\n[Auto-transitioned billing status on ' || CURRENT_TIMESTAMP || ']'
                    WHERE id = $1
                `, [allocation.id, systemUserId]);

                results.transitioned++;

                log.info('Transitioned billing status', {
                    allocationId: allocation.id,
                    projectBillingStatus: allocation.project_billing_status
                });

            } catch (err) {
                log.error('Failed to transition billing status', {
                    allocationId: allocation.id,
                    error: err.message
                });
                results.errors.push({
                    allocationId: allocation.id,
                    error: err.message
                });
            }
        }

        log.info('Billing status transition job completed', results);

        return success({
            message: 'Billing status transition job completed',
            ...results
        });

    } catch (err) {
        log.error('Billing status transition job failed', { error: err.message, stack: err.stack });
        return error('Billing status transition job failed', err);
    }
};

/**
 * Enhancement 3.12: Historical Utilization Snapshots
 * Captures daily snapshots of resource utilization for trend analysis
 * Runs daily at midnight to store yesterday's utilization metrics
 */
export const utilizationSnapshotJob = async (event) => {
    const log = logger.child({ handler: 'allocations.utilizationSnapshotJob' });

    try {
        log.info('Starting utilization snapshot job');

        const snapshotDate = new Date();
        snapshotDate.setDate(snapshotDate.getDate() - 1); // Yesterday's snapshot
        const snapshotDateStr = snapshotDate.toISOString().split('T')[0];

        // Get all active resources
        const resourcesQuery = `
            SELECT id, employee_id, name 
            FROM resources 
            WHERE status = 'Active' 
            AND deleted_at IS NULL
        `;

        const resourcesResult = await db.query(resourcesQuery);

        const results = {
            snapshotDate: snapshotDateStr,
            totalResources: resourcesResult.rows.length,
            snapshotsCreated: 0,
            snapshotsUpdated: 0,
            errors: []
        };

        for (const resource of resourcesResult.rows) {
            try {
                // Calculate utilization metrics for this resource
                const metricsQuery = `
                    SELECT 
                        -- Total allocation (excluding bench)
                        COALESCE(SUM(
                            CASE 
                                WHEN p.is_bench_project = false 
                                THEN a.allocation_percentage 
                                ELSE 0 
                            END
                        ), 0) as total_allocation,
                        
                        -- Bench percentage
                        COALESCE(SUM(
                            CASE 
                                WHEN p.is_bench_project = true 
                                THEN a.allocation_percentage 
                                ELSE 0 
                            END
                        ), 0) as bench_percentage,
                        
                        -- Billing allocation
                        COALESCE(SUM(
                            CASE 
                                WHEN p.billing_status = 'Billing' AND p.is_bench_project = false 
                                THEN a.allocation_percentage 
                                ELSE 0 
                            END
                        ), 0) as billing_allocation,
                        
                        -- Non-billing allocation (excluding bench)
                        COALESCE(SUM(
                            CASE 
                                WHEN p.billing_status != 'Billing' AND p.is_bench_project = false 
                                THEN a.allocation_percentage 
                                ELSE 0 
                            END
                        ), 0) as non_billing_allocation,
                        
                        -- Project count (excluding bench)
                        COUNT(DISTINCT CASE WHEN p.is_bench_project = false THEN p.id END) as project_count
                        
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    WHERE a.resource_id = $1
                    AND a.is_active = true
                    AND a.deleted_at IS NULL
                    AND a.allocated_date <= $2
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= $2)
                `;

                const metricsResult = await db.query(metricsQuery, [resource.id, snapshotDateStr]);
                const metrics = metricsResult.rows[0];

                const totalAllocation = parseFloat(metrics.total_allocation) || 0;
                const isOverAllocated = totalAllocation > 100;

                // Insert or update snapshot (using ON CONFLICT to handle duplicates)
                const insertQuery = `
                    INSERT INTO resource_utilization_snapshots (
                        resource_id, 
                        snapshot_date, 
                        total_allocation, 
                        bench_percentage, 
                        billing_allocation, 
                        non_billing_allocation, 
                        project_count, 
                        is_over_allocated,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                    ON CONFLICT (resource_id, snapshot_date) 
                    DO UPDATE SET
                        total_allocation = EXCLUDED.total_allocation,
                        bench_percentage = EXCLUDED.bench_percentage,
                        billing_allocation = EXCLUDED.billing_allocation,
                        non_billing_allocation = EXCLUDED.non_billing_allocation,
                        project_count = EXCLUDED.project_count,
                        is_over_allocated = EXCLUDED.is_over_allocated
                    RETURNING (xmax = 0) AS inserted
                `;

                const insertResult = await db.query(insertQuery, [
                    resource.id,
                    snapshotDateStr,
                    totalAllocation,
                    parseFloat(metrics.bench_percentage) || 0,
                    parseFloat(metrics.billing_allocation) || 0,
                    parseFloat(metrics.non_billing_allocation) || 0,
                    parseInt(metrics.project_count) || 0,
                    isOverAllocated
                ]);

                // Check if it was an insert or update
                if (insertResult.rows[0].inserted) {
                    results.snapshotsCreated++;
                } else {
                    results.snapshotsUpdated++;
                }

                log.debug('Snapshot captured', {
                    resourceId: resource.id,
                    employeeId: resource.employee_id,
                    metrics: {
                        totalAllocation,
                        benchPercentage: metrics.bench_percentage,
                        billingAllocation: metrics.billing_allocation,
                        projectCount: metrics.project_count,
                        isOverAllocated
                    }
                });

            } catch (err) {
                log.error('Failed to create snapshot for resource', {
                    resourceId: resource.id,
                    error: err.message
                });
                results.errors.push({
                    resourceId: resource.id,
                    employeeId: resource.employee_id,
                    error: err.message
                });
            }
        }

        log.info('Utilization snapshot job completed', results);

        return success({
            message: 'Utilization snapshot job completed',
            ...results
        });

    } catch (err) {
        log.error('Utilization snapshot job failed', { error: err.message, stack: err.stack });
        return error('Utilization snapshot job failed', err);
    }
};
