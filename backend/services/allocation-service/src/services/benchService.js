/**
 * Bench Allocation Service
 * 
 * Handles all bench-related allocation logic including:
 * - Getting bench project ID
 * - Adjusting bench allocations based on other allocations
 * - Short-stay bench cleanup
 * - Gap detection and filling
 */

import * as db from '/opt/nodejs/database/index.js';

let BENCH_PROJECT_ID = null;

/**
 * Get the Bench project ID (from database by is_bench_project flag)
 * Results are cached for performance
 */
export const getBenchProjectId = async () => {
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
 * Clear cached bench project ID (useful for testing or after project changes)
 */
export const clearBenchProjectIdCache = () => {
    BENCH_PROJECT_ID = null;
};

/**
 * Get the current bench allocation for a resource (including inactive)
 */
export const getBenchAllocation = async (resourceId) => {
    const benchProjectId = await getBenchProjectId();
    // Get any bench allocation for this resource (active or inactive)
    const result = await db.query(`
        SELECT * FROM allocations 
        WHERE employee_id = $1 
        AND project_id = $2 
        ORDER BY is_active DESC, updated_at DESC
        LIMIT 1
    `, [resourceId, benchProjectId]);

    return result.rows[0] || null;
};

/**
 * Calculate total allocation for a resource (excluding bench)
 */
export const calculateNonBenchTotal = async (resourceId, excludeAllocationId, allocatedDate, deallocatedDate) => {
    const benchProjectId = await getBenchProjectId();
    const allocatedDateStr = allocatedDate instanceof Date ? allocatedDate.toISOString().split('T')[0] : allocatedDate;
    const deallocatedDateStr = deallocatedDate instanceof Date ? deallocatedDate.toISOString().split('T')[0] : deallocatedDate;

    let query = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE employee_id = $1
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
 * Enhancement 3.1: Check if bench allocation is a short-stay (< 24 hours)
 * and can be cleaned up (hard deleted) instead of just deactivated
 * @param {string} resourceId - Resource UUID
 * @param {number} thresholdHours - Hours threshold for short-stay (default 24)
 * @param {Object} log - Logger instance
 */
export const isShortStayBench = async (resourceId, thresholdHours, log) => {
    const benchProjectId = await getBenchProjectId();

    // Get the current bench allocation
    const benchResult = await db.query(`
        SELECT id, created_at, allocated_date
        FROM allocations
        WHERE employee_id = $1
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
            SELECT id FROM allocations WHERE employee_id = $1 AND project_id != $2
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
export const cleanupShortStayBench = async (benchAllocationId, log) => {
    await db.query('DELETE FROM allocations WHERE id = $1', [benchAllocationId]);
    log.info('Short-stay bench allocation cleaned up (hard deleted)', { benchAllocationId });
};

/**
 * Auto-adjust bench allocation based on other allocations
 * Returns the new bench percentage after adjustment
 * Enhancement 3.11: Added explicit logging for negative bench calculation
 */
export const adjustBenchAllocation = async (resourceId, userId, log) => {
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
            `, [benchAllocation.id, userId || 1]);
            log.info('Bench allocation deactivated', { resourceId, previousPercentage: benchAllocation.allocation_percentage });
        } else if (benchAllocation.allocation_percentage !== newBenchPercentage) {
            // Update bench allocation percentage
            await db.query(`
                UPDATE allocations 
                SET allocation_percentage = $2, is_active = true, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [benchAllocation.id, newBenchPercentage, userId || 1]);
            log.info('Bench allocation adjusted', {
                resourceId,
                previousPercentage: benchAllocation.allocation_percentage,
                newPercentage: newBenchPercentage
            });
        }
    } else if (newBenchPercentage > 0) {
        // Create bench allocation if it doesn't exist and should have a value
        // Bench allocations have 0% billing and billing_status_id = 3 (Bench)
        await db.query(`
            INSERT INTO allocations (employee_id, project_id, allocation_percentage, billing_percentage, billing_status_id, allocated_date, is_active, notes, created_by, change_type)
            VALUES ($1, $2, $3, 0, 3, CURRENT_DATE, true, 'Auto-created bench allocation', $4, 'NEW_ALLOCATION')
        `, [resourceId, benchProjectId, newBenchPercentage, userId || 1]);
        log.info('Bench allocation created', { resourceId, percentage: newBenchPercentage });
    }

    return newBenchPercentage;
};

/**
 * Enhancement 3.4: Gap Detection & Auto-Bench Fill
 * Detects resources with < 100% allocation and fills gap with Bench
 */
export const detectAndFillGaps = async (resourceId, userId, log) => {
    const benchProjectId = await getBenchProjectId();

    // Calculate current total allocation (excluding bench)
    const totalQuery = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE employee_id = $1
        AND project_id != $2
        AND is_active = true
        AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
        AND allocated_date <= CURRENT_DATE
    `;

    const totalResult = await db.query(totalQuery, [resourceId, benchProjectId]);
    const totalActiveAllocation = parseInt(totalResult.rows[0].total, 10);

    if (totalActiveAllocation >= 100) {
        // Deactivate any existing bench allocation since resource is fully allocated
        const benchAllocation = await getBenchAllocation(resourceId);
        if (benchAllocation && benchAllocation.is_active) {
            await db.query(`
                UPDATE allocations 
                SET is_active = false, allocation_percentage = 0, updated_by = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [benchAllocation.id, userId || 1]);
            log.info('Deactivated stale bench allocation - resource fully allocated', { resourceId, totalActiveAllocation });
        }
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
        `, [benchAllocation.id, gapPercentage, userId || 1]);

        log.info('Reactivated Bench allocation to fill gap', {
            resourceId,
            benchAllocationId: benchAllocation.id,
            gapPercentage
        });
    } else {
        // Create new Bench allocation
        await db.query(`
            INSERT INTO allocations (employee_id, project_id, allocation_percentage, billing_percentage, billing_status_id, allocated_date, is_active, notes, created_by, change_type)
            VALUES ($1, $2, $3, 0, 3, CURRENT_DATE, true, 'Auto-created to fill allocation gap', $4, 'AUTO_BENCH_ADJUSTMENT')
        `, [resourceId, benchProjectId, gapPercentage, userId || 1]);

        log.info('Created new Bench allocation to fill gap', { resourceId, gapPercentage });
    }

    return { gapDetected: true, gapPercentage, totalActiveAllocation };
};
