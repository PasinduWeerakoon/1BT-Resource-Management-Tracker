/**
 * Future Allocation Service
 * 
 * Manages allocations scheduled for future dates.
 * Part of the 3-Table Temporal Architecture:
 * - future_allocations (this service) → allocations → allocation_history_archive
 * 
 * Records are created here when effective_date > today.
 * A scheduler job moves them to allocations table on the effective_date.
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';

const SERVICE_NAME = 'future-allocation-service';

/**
 * Create a future allocation record
 * @param {Object} data - Allocation data
 * @param {string} data.employee_id - Resource UUID
 * @param {string} data.project_id - Project UUID
 * @param {number} data.allocation_percentage - Allocation percentage (0-100)
 * @param {number} data.billing_percentage - Billing percentage (0-100)
 * @param {string} data.effective_date - When this should activate (must be > today)
 * @param {string} data.allocated_date - When allocation period starts
 * @param {string} [data.deallocated_date] - When allocation period ends
 * @param {string} data.change_type - NEW_ALLOCATION, MODIFY_PERCENTAGE, etc.
 * @param {string} [data.target_allocation_id] - For modifications, the allocation being modified
 * @param {string} [data.notes] - Optional notes
 * @param {string} data.created_by - User UUID
 * @returns {Promise<Object>} Created future allocation
 */
export const createFutureAllocation = async (data) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'createFutureAllocation' });

    // Support both camelCase and snake_case property names
    const resource_id = data.employee_id || data.resourceId;
    const project_id = data.project_id || data.projectId;
    const allocation_percentage = data.allocation_percentage || data.newAllocationPercentage;
    const billing_percentage = data.billing_percentage ?? data.newBillingPercentage ?? 100;
    const billing_status_id = data.billing_status_id || data.billingStatusId || null;
    const effective_date = data.effective_date || data.effectiveDate;
    const change_type = data.change_type || data.changeType;
    const target_allocation_id = data.target_allocation_id || data.targetAllocationId;
    const notes = data.notes;
    const created_by = data.created_by || data.createdBy;

    // allocated_date defaults to effective_date if not provided
    const allocated_date = data.allocated_date || data.allocatedDate || effective_date;
    const deallocated_date = data.deallocated_date || data.deallocatedDate || data.end_date || data.endDate;

    log.info('Creating future allocation', {
        resource_id,
        project_id,
        effective_date,
        change_type,
        billing_status_id
    });

    const query = `
        INSERT INTO future_allocations (
            employee_id, project_id, allocation_percentage, billing_percentage, billing_status_id,
            effective_date, allocated_date, deallocated_date,
            change_type, status, target_allocation_id, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8::date, $9, 'scheduled', $10, $11, $12)
        RETURNING *, 
            (SELECT name FROM billing_statuses WHERE id = billing_status_id) as billing_status_name
    `;

    const params = [
        resource_id,
        project_id,
        allocation_percentage,
        billing_percentage,
        billing_status_id,
        effective_date,
        allocated_date,
        deallocated_date || null,
        change_type,
        target_allocation_id || null,
        notes || null,
        created_by
    ];

    const result = await db.query(query, params);
    const futureAllocation = result.rows[0];

    log.info('Future allocation created', { id: futureAllocation.id });
    return futureAllocation;
};

/**
 * Create a linked future allocation (e.g., bench adjustment linked to main allocation)
 * @param {Object} mainFutureAllocation - The main future allocation
 * @param {Object} linkedData - Data for the linked allocation
 * @returns {Promise<Object>} Created linked future allocation
 */
export const createLinkedFutureAllocation = async (mainFutureAllocation, linkedData) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'createLinkedFutureAllocation' });

    const query = `
        INSERT INTO future_allocations (
            employee_id, project_id, allocation_percentage, billing_percentage, billing_status_id,
            effective_date, allocated_date, deallocated_date,
            change_type, status, linked_future_id, notes, created_by
        )
        VALUES ($1, $2, $3, $4, 3, $5::date, $6::date, $7::date, $8, 'scheduled', $9, $10, $11)
        RETURNING *
    `;

    const params = [
        linkedData.employee_id,
        linkedData.project_id,
        linkedData.allocation_percentage,
        linkedData.billing_percentage || 0, // Bench is 0
        mainFutureAllocation.effective_date,
        linkedData.allocated_date,
        linkedData.deallocated_date || null,
        'AUTO_BENCH_ADJUSTMENT',
        mainFutureAllocation.id,  // Link to main allocation
        linkedData.notes || 'Auto bench adjustment for future allocation',
        linkedData.created_by
    ];

    const result = await db.query(query, params);
    const linkedAllocation = result.rows[0];

    log.info('Linked future allocation created', {
        id: linkedAllocation.id,
        linkedTo: mainFutureAllocation.id
    });

    return linkedAllocation;
};

/**
 * Get all future allocations for a resource
 * @param {string} resourceId - Resource UUID
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status (scheduled, activated, cancelled)
 * @returns {Promise<Array>} List of future allocations
 */
export const getFutureAllocationsByResource = async (resourceId, options = {}) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getFutureAllocationsByResource' });

    let query = `
        SELECT fa.*, 
               r.name as resource_name,
               p.project_name,
               p.project_code
        FROM future_allocations fa
        JOIN employees r ON fa.employee_id = r.id
        JOIN projects p ON fa.project_id = p.id
        WHERE fa.employee_id = $1
    `;
    const params = [resourceId];

    if (options.status) {
        query += ` AND fa.status = $2`;
        params.push(options.status);
    }

    query += ` ORDER BY fa.effective_date ASC, fa.created_at ASC`;

    const result = await db.query(query, params);
    log.info('Retrieved future allocations', { resourceId, count: result.rows.length });
    return result.rows;
};

/**
 * Get all future allocations with status 'scheduled'
 * @param {Object} [options] - Query options
 * @param {string} [options.effectiveDate] - Filter by specific effective date
 * @param {number} [options.limit] - Limit results
 * @returns {Promise<Array>} List of scheduled future allocations
 */
export const getScheduledAllocations = async (options = {}) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getScheduledAllocations' });

    let query = `
        SELECT fa.*, 
               r.name as resource_name,
               p.project_name,
               p.project_code,
               p.is_bench_project
        FROM future_allocations fa
        JOIN employees r ON fa.employee_id = r.id
        JOIN projects p ON fa.project_id = p.id
        WHERE fa.status = 'scheduled'
    `;
    const params = [];

    if (options.effectiveDate) {
        query += ` AND fa.effective_date = $${params.length + 1}::date`;
        params.push(options.effectiveDate);
    }

    query += ` ORDER BY fa.effective_date ASC, fa.change_type ASC, fa.created_at ASC`;

    if (options.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);
    }

    const result = await db.query(query, params);
    log.info('Retrieved scheduled allocations', { count: result.rows.length, options });
    return result.rows;
};

/**
 * Get allocations due for activation today
 * @returns {Promise<Array>} List of allocations to activate
 */
export const getAllocationsToActivateToday = async () => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getAllocationsToActivateToday' });

    const today = new Date().toISOString().split('T')[0];

    const query = `
        SELECT fa.*, 
               r.name as resource_name,
               p.project_name,
               p.project_code,
               p.is_bench_project
        FROM future_allocations fa
        JOIN employees r ON fa.employee_id = r.id
        JOIN projects p ON fa.project_id = p.id
        WHERE fa.status = 'scheduled'
        AND fa.effective_date <= $1::date
        ORDER BY fa.effective_date ASC, 
                 CASE fa.change_type 
                     WHEN 'NEW_ALLOCATION' THEN 1
                     WHEN 'MODIFY_PERCENTAGE' THEN 2
                     WHEN 'MODIFY_BILLING' THEN 3
                     WHEN 'AUTO_BENCH_ADJUSTMENT' THEN 4
                     WHEN 'DEALLOCATE' THEN 5
                 END,
                 fa.created_at ASC
    `;

    const result = await db.query(query, [today]);
    log.info('Retrieved allocations to activate today', { count: result.rows.length, date: today });
    return result.rows;
};

/**
 * Get a specific future allocation by ID
 * @param {string} id - Future allocation UUID
 * @returns {Promise<Object|null>} Future allocation or null
 */
export const getFutureAllocationById = async (id) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getFutureAllocationById' });

    const query = `
        SELECT fa.*, 
               r.name as resource_name,
               p.project_name,
               p.project_code
        FROM future_allocations fa
        JOIN employees r ON fa.employee_id = r.id
        JOIN projects p ON fa.project_id = p.id
        WHERE fa.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

/**
 * Cancel a future allocation
 * @param {string} id - Future allocation UUID
 * @param {string} [reason] - Cancellation reason
 * @returns {Promise<Object>} Updated future allocation
 */
export const cancelFutureAllocation = async (id, reason = null) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'cancelFutureAllocation' });

    // First get the allocation to check if it has linked allocations
    const existing = await getFutureAllocationById(id);
    if (!existing) {
        throw new Error('Future allocation not found');
    }

    if (existing.status !== 'scheduled') {
        throw new Error(`Cannot cancel allocation with status: ${existing.status}`);
    }

    // Cancel the allocation
    await db.query(`
        UPDATE future_allocations 
        SET status = 'cancelled', 
            notes = COALESCE(notes || ' | ', '') || $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `, [id, `Cancelled: ${reason || 'No reason provided'}`]);

    // Also cancel any linked allocations (e.g., bench adjustments)
    const linkedResult = await db.query(`
        UPDATE future_allocations 
        SET status = 'cancelled',
            notes = COALESCE(notes || ' | ', '') || 'Cancelled: Parent allocation cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE linked_future_id = $1
        AND status = 'scheduled'
        RETURNING id
    `, [id]);

    log.info('Future allocation cancelled', {
        id,
        linkedCancelled: linkedResult.rows.length
    });

    return {
        success: true,
        message: 'Future allocation cancelled',
        linkedCancelled: linkedResult.rows.length
    };
};

/**
 * Mark a future allocation as activated (after moving to allocations table)
 * @param {string} id - Future allocation UUID
 * @returns {Promise<void>}
 */
export const markAsActivated = async (id) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'markAsActivated' });

    await db.query(`
        UPDATE future_allocations 
        SET status = 'activated', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `, [id]);

    log.info('Future allocation marked as activated', { id });
};

/**
 * Check for conflicting future allocations
 * @param {string} resourceId - Resource UUID
 * @param {string} projectId - Project UUID
 * @param {string} effectiveDate - Effective date
 * @param {string} [excludeId] - Exclude this allocation ID
 * @returns {Promise<Object|null>} Conflicting allocation or null
 */
export const checkConflictingFuture = async (resourceId, projectId, effectiveDate, excludeId = null) => {
    let query = `
        SELECT * FROM future_allocations
        WHERE employee_id = $1
        AND project_id = $2
        AND effective_date = $3::date
        AND status = 'scheduled'
    `;
    const params = [resourceId, projectId, effectiveDate];

    if (excludeId) {
        query += ` AND id != $4`;
        params.push(excludeId);
    }

    const result = await db.query(query, params);
    return result.rows[0] || null;
};

/**
 * Calculate total allocation for a resource on a future date
 * Includes both active allocations and scheduled future allocations
 * @param {string} resourceId - Resource UUID
 * @param {string} futureDate - The date to check
 * @param {string} benchProjectId - Bench project UUID to exclude
 * @param {string} [excludeId] - Allocation ID to exclude
 * @returns {Promise<number>} Total allocation percentage
 */
export const calculateFutureCapacity = async (resourceId, futureDate, benchProjectId, excludeId = null) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'calculateFutureCapacity' });

    // Get current active allocations that will still be active on the future date
    const activeQuery = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE employee_id = $1
        AND project_id != $2
        AND is_active = true
        AND allocated_date <= $3::date
        AND (deallocated_date IS NULL OR deallocated_date >= $3::date)
        ${excludeId ? 'AND id != $4' : ''}
    `;
    const activeParams = excludeId
        ? [resourceId, benchProjectId, futureDate, excludeId]
        : [resourceId, benchProjectId, futureDate];

    const activeResult = await db.query(activeQuery, activeParams);
    const activeTotal = parseInt(activeResult.rows[0].total, 10);

    // Get future allocations scheduled to be active on/before that date
    const futureQuery = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM future_allocations
        WHERE employee_id = $1
        AND project_id != $2
        AND status = 'scheduled'
        AND effective_date <= $3::date
        AND change_type = 'NEW_ALLOCATION'
    `;
    const futureParams = [resourceId, benchProjectId, futureDate];

    const futureResult = await db.query(futureQuery, futureParams);
    const futureTotal = parseInt(futureResult.rows[0].total, 10);

    const totalCapacity = activeTotal + futureTotal;

    log.info('Calculated future capacity', {
        resourceId,
        futureDate,
        activeTotal,
        futureTotal,
        totalCapacity
    });

    return totalCapacity;
};

export default {
    createFutureAllocation,
    createLinkedFutureAllocation,
    getFutureAllocationsByResource,
    getScheduledAllocations,
    getAllocationsToActivateToday,
    getFutureAllocationById,
    cancelFutureAllocation,
    markAsActivated,
    checkConflictingFuture,
    calculateFutureCapacity
};
