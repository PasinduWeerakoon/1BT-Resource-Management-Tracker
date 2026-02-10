/**
 * Allocation Scheduled Jobs
 * 
 * Handles scheduled background jobs:
 * - gapDetectionJob: Nightly job to detect and fill allocation gaps with Bench
 * - billingStatusTransitionJob: Transition billing status when allocations start
 * - utilizationSnapshotJob: Capture daily utilization metrics for trend analysis
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';
import { getBenchProjectId, detectAndFillGaps } from '../../services/benchService.js';
import { BENCH_ELIGIBLE_TRACK_IDS } from '/opt/nodejs/configs/index.js';
import { updateResourceTotals } from '../../services/resourceTotalsService.js';

/**
 * Enhancement 3.4: Scheduled job to detect and fill gaps for all active resources
 * Triggered by CloudWatch Events (nightly)
 */
export const gapDetectionJob = async (event) => {
    const log = logger.child({ handler: 'allocations.gapDetectionJob' });
    const systemUserId = 1; // System user ID (Integer)

    try {
        log.info('Starting gap detection job');

        // Get all active resources from bench-eligible tracks only
        const resourcesResult = await db.query(`
            SELECT id, name, track_id 
            FROM employees 
            WHERE status = 'Active' 
            AND deleted_at IS NULL
            AND track_id = ANY(ARRAY[${BENCH_ELIGIBLE_TRACK_IDS.join(',')}])
        `);

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
                    // Update resource totals after filling gap
                    await updateResourceTotals(resource.id, log);
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
            SELECT a.id, a.employee_id, a.project_id, p.billing_status as project_billing_status
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

                // Update resource totals (billing status change may affect total_billing)
                await updateResourceTotals(allocation.employee_id, log);

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
            FROM employees 
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
                    WHERE a.employee_id = $1
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

