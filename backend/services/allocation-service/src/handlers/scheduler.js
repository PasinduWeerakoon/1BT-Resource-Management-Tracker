/**
 * Allocation Scheduler Handler
 * 
 * Scheduled Lambda functions for the 3-Table Temporal Architecture:
 * 
 * 1. activateScheduledAllocations (1:00 AM UTC)
 *    - Moves future_allocations → allocations when effective_date = TODAY
 * 
 * 2. archiveEndedAllocations (3:00 AM UTC)
 *    - Moves ended allocations → allocation_history_archive
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';
import futureAllocationService from '../services/futureAllocationService.js';
import allocationHistoryService from '../services/allocationHistoryService.js';

const SERVICE_NAME = 'allocation-scheduler';

// Fixed Bench project ID - will be looked up by is_bench_project flag
let BENCH_PROJECT_ID = null;

/**
 * Get the Bench project ID
 */
const getBenchProjectId = async () => {
    if (BENCH_PROJECT_ID) {
        return BENCH_PROJECT_ID;
    }

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
    }

    return BENCH_PROJECT_ID;
};

/**
 * Process a single scheduled allocation based on its change_type
 * @param {Object} futureAllocation - The future allocation to process
 * @param {Object} log - Logger instance
 * @returns {Promise<Object>} Result of the processing
 */
const processScheduledAllocation = async (futureAllocation, log) => {
    const {
        id,
        resource_id,
        project_id,
        allocation_percentage,
        billing_percentage,
        effective_date,
        allocated_date,
        deallocated_date,
        change_type,
        target_allocation_id,
        notes,
        created_by,
        is_bench_project
    } = futureAllocation;

    log.info('Processing scheduled allocation', {
        id,
        change_type,
        resource_id,
        project_id
    });

    const systemUserId = '00000000-0000-0000-0000-000000000000';
    const effectiveUserId = created_by || systemUserId;

    switch (change_type) {
        case 'NEW_ALLOCATION': {
            // Create new allocation in allocations table
            const insertQuery = `
                INSERT INTO allocations (
                    resource_id, project_id, allocation_percentage, billing_percentage,
                    allocated_date, deallocated_date, effective_date, allocation_changed_on,
                    original_allocated_date, change_type, source_future_id,
                    is_active, notes, created_by
                )
                VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::date, CURRENT_TIMESTAMP, $5::date, $8, $9, true, $10, $11)
                RETURNING *
            `;

            const result = await db.query(insertQuery, [
                resource_id,
                project_id,
                allocation_percentage,
                billing_percentage,
                allocated_date,
                deallocated_date,
                effective_date,
                change_type,
                id,  // source_future_id
                notes,
                effectiveUserId
            ]);

            // Mark future allocation as activated
            await futureAllocationService.markAsActivated(id);

            log.info('NEW_ALLOCATION processed', {
                futureId: id,
                newAllocationId: result.rows[0].id
            });

            return {
                success: true,
                action: 'NEW_ALLOCATION',
                newAllocationId: result.rows[0].id
            };
        }

        case 'MODIFY_PERCENTAGE': {
            if (!target_allocation_id) {
                throw new Error('MODIFY_PERCENTAGE requires target_allocation_id');
            }

            // Update existing allocation's percentage
            await db.query(`
                UPDATE allocations 
                SET allocation_percentage = $1,
                    effective_date = $2::date,
                    allocation_changed_on = CURRENT_TIMESTAMP,
                    change_type = $3,
                    notes = COALESCE(notes || ' | ', '') || $4,
                    updated_by = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
            `, [
                allocation_percentage,
                effective_date,
                change_type,
                notes || 'Percentage modified by scheduler',
                effectiveUserId,
                target_allocation_id
            ]);

            await futureAllocationService.markAsActivated(id);

            log.info('MODIFY_PERCENTAGE processed', {
                futureId: id,
                targetAllocationId: target_allocation_id,
                newPercentage: allocation_percentage
            });

            return {
                success: true,
                action: 'MODIFY_PERCENTAGE',
                targetAllocationId: target_allocation_id
            };
        }

        case 'MODIFY_BILLING': {
            if (!target_allocation_id) {
                throw new Error('MODIFY_BILLING requires target_allocation_id');
            }

            // Update existing allocation's billing percentage
            await db.query(`
                UPDATE allocations 
                SET billing_percentage = $1,
                    effective_date = $2::date,
                    allocation_changed_on = CURRENT_TIMESTAMP,
                    change_type = $3,
                    notes = COALESCE(notes || ' | ', '') || $4,
                    updated_by = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
            `, [
                billing_percentage,
                effective_date,
                change_type,
                notes || 'Billing modified by scheduler',
                effectiveUserId,
                target_allocation_id
            ]);

            await futureAllocationService.markAsActivated(id);

            log.info('MODIFY_BILLING processed', {
                futureId: id,
                targetAllocationId: target_allocation_id,
                newBillingPercentage: billing_percentage
            });

            return {
                success: true,
                action: 'MODIFY_BILLING',
                targetAllocationId: target_allocation_id
            };
        }

        case 'DEALLOCATE': {
            if (!target_allocation_id) {
                throw new Error('DEALLOCATE requires target_allocation_id');
            }

            // Get the allocation to archive
            const allocationResult = await db.query(
                'SELECT * FROM allocations WHERE id = $1',
                [target_allocation_id]
            );

            if (allocationResult.rows.length > 0) {
                // Set deallocated_date and archive
                await db.query(`
                    UPDATE allocations 
                    SET deallocated_date = $1::date,
                        effective_date = $1::date,
                        allocation_changed_on = CURRENT_TIMESTAMP,
                        change_type = 'DEALLOCATE',
                        updated_by = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [effective_date, effectiveUserId, target_allocation_id]);

                // Archive the allocation
                const updatedAllocation = await db.query(
                    'SELECT * FROM allocations WHERE id = $1',
                    [target_allocation_id]
                );

                await allocationHistoryService.archiveAllocation(
                    updatedAllocation.rows[0],
                    'DEALLOCATED',
                    null
                );
            }

            await futureAllocationService.markAsActivated(id);

            log.info('DEALLOCATE processed', {
                futureId: id,
                targetAllocationId: target_allocation_id
            });

            return {
                success: true,
                action: 'DEALLOCATE',
                targetAllocationId: target_allocation_id
            };
        }

        case 'AUTO_BENCH_ADJUSTMENT': {
            // Handle bench auto-adjustment
            const benchProjectId = await getBenchProjectId();

            // Check if resource already has a bench allocation
            const existingBench = await db.query(`
                SELECT * FROM allocations 
                WHERE resource_id = $1 
                AND project_id = $2 
                AND is_active = true
            `, [resource_id, benchProjectId]);

            if (existingBench.rows.length > 0) {
                // Update existing bench allocation
                await db.query(`
                    UPDATE allocations 
                    SET allocation_percentage = $1,
                        effective_date = $2::date,
                        allocation_changed_on = CURRENT_TIMESTAMP,
                        change_type = 'AUTO_BENCH_ADJUSTMENT',
                        updated_by = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4
                `, [
                    allocation_percentage,
                    effective_date,
                    effectiveUserId,
                    existingBench.rows[0].id
                ]);

                // If bench is now 0%, deactivate it
                if (allocation_percentage === 0) {
                    await db.query(`
                        UPDATE allocations 
                        SET is_active = false
                        WHERE id = $1
                    `, [existingBench.rows[0].id]);
                }

                log.info('AUTO_BENCH_ADJUSTMENT - updated existing', {
                    futureId: id,
                    benchAllocationId: existingBench.rows[0].id,
                    newPercentage: allocation_percentage
                });
            } else if (allocation_percentage > 0) {
                // Create new bench allocation
                await db.query(`
                    INSERT INTO allocations (
                        resource_id, project_id, allocation_percentage, billing_percentage,
                        allocated_date, effective_date, allocation_changed_on,
                        original_allocated_date, change_type, source_future_id,
                        is_active, notes, created_by
                    )
                    VALUES ($1, $2, $3, 0, $4::date, $4::date, CURRENT_TIMESTAMP, $4::date, 'AUTO_BENCH_ADJUSTMENT', $5, true, 'Auto bench adjustment', $6)
                `, [
                    resource_id,
                    benchProjectId,
                    allocation_percentage,
                    effective_date,
                    id,
                    effectiveUserId
                ]);

                log.info('AUTO_BENCH_ADJUSTMENT - created new', {
                    futureId: id,
                    percentage: allocation_percentage
                });
            }

            await futureAllocationService.markAsActivated(id);

            return {
                success: true,
                action: 'AUTO_BENCH_ADJUSTMENT',
                percentage: allocation_percentage
            };
        }

        default:
            throw new Error(`Unknown change_type: ${change_type}`);
    }
};

/**
 * Activate Scheduled Allocations
 * Runs daily at 1:00 AM UTC
 * Moves future_allocations to allocations when effective_date = TODAY
 */
export const activateScheduledAllocations = async (event) => {
    const log = logger.child({ handler: 'activateScheduledAllocations', service: SERVICE_NAME });
    const startTime = Date.now();

    log.info('Starting scheduled allocation activation');

    try {
        // Get all allocations due for activation
        const allocationsToActivate = await futureAllocationService.getAllocationsToActivateToday();

        log.info('Found allocations to activate', {
            count: allocationsToActivate.length
        });

        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            details: [],
            errors: []
        };

        // Process each allocation
        for (const futureAllocation of allocationsToActivate) {
            results.processed++;

            try {
                const result = await processScheduledAllocation(futureAllocation, log);
                results.succeeded++;
                results.details.push({
                    futureId: futureAllocation.id,
                    changeType: futureAllocation.change_type,
                    resourceId: futureAllocation.resource_id,
                    ...result
                });
            } catch (err) {
                results.failed++;
                results.errors.push({
                    futureId: futureAllocation.id,
                    changeType: futureAllocation.change_type,
                    resourceId: futureAllocation.resource_id,
                    error: err.message
                });
                log.error('Failed to process scheduled allocation', {
                    futureId: futureAllocation.id,
                    error: err.message,
                    stack: err.stack
                });
            }
        }

        const duration = Date.now() - startTime;
        log.info('Scheduled allocation activation complete', {
            ...results,
            durationMs: duration
        });

        return success({
            message: `Processed ${results.processed} scheduled allocations`,
            ...results,
            durationMs: duration
        });
    } catch (err) {
        log.error('Scheduled allocation activation failed', {
            error: err.message,
            stack: err.stack
        });
        return error(err.message, 500, 'SCHEDULER_ERROR');
    }
};

/**
 * Archive Ended Allocations
 * Runs daily at 3:00 AM UTC
 * Moves ended allocations to allocation_history_archive
 */
export const archiveEndedAllocations = async (event) => {
    const log = logger.child({ handler: 'archiveEndedAllocations', service: SERVICE_NAME });
    const startTime = Date.now();

    log.info('Starting ended allocation archival');

    try {
        const result = await allocationHistoryService.archiveEndedAllocations();

        const duration = Date.now() - startTime;
        log.info('Ended allocation archival complete', {
            ...result,
            durationMs: duration
        });

        return success({
            message: `Archived ${result.archived} ended allocations`,
            ...result,
            durationMs: duration
        });
    } catch (err) {
        log.error('Ended allocation archival failed', {
            error: err.message,
            stack: err.stack
        });
        return error(err.message, 500, 'ARCHIVE_ERROR');
    }
};

/**
 * Manual trigger for testing - activate specific future allocation
 */
export const manualActivate = async (event) => {
    const log = logger.child({ handler: 'manualActivate', service: SERVICE_NAME });

    try {
        const body = JSON.parse(event.body || '{}');
        const { futureAllocationId } = body;

        if (!futureAllocationId) {
            return error('futureAllocationId is required', 400, 'VALIDATION_ERROR');
        }

        const futureAllocation = await futureAllocationService.getFutureAllocationById(futureAllocationId);

        if (!futureAllocation) {
            return error('Future allocation not found', 404, 'NOT_FOUND');
        }

        if (futureAllocation.status !== 'scheduled') {
            return error(`Cannot activate allocation with status: ${futureAllocation.status}`, 400, 'INVALID_STATUS');
        }

        // Get project info
        const projectResult = await db.query(
            'SELECT is_bench_project FROM projects WHERE id = $1',
            [futureAllocation.project_id]
        );
        futureAllocation.is_bench_project = projectResult.rows[0]?.is_bench_project || false;

        const result = await processScheduledAllocation(futureAllocation, log);

        return success({
            message: 'Future allocation manually activated',
            ...result
        });
    } catch (err) {
        log.error('Manual activation failed', {
            error: err.message,
            stack: err.stack
        });
        return error(err.message, 500, 'ACTIVATION_ERROR');
    }
};
