/**
 * Scheduled Jobs Handler
 * 
 * Handles scheduled tasks like daily dashboard stats calculation.
 * Runs via CloudWatch Events (EventBridge) at midnight UTC.
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { TRACKS, TECH_STACKS } from '/opt/nodejs/configs/index.js';

/**
 * Calculate and store daily dashboard statistics
 * Scheduled to run at midnight UTC daily
 */
export const calculateDailyStats = async (event) => {
    const log = logger.child({ handler: 'scheduledJobs.calculateDailyStats' });
    const startTime = Date.now();

    // Use today's date in UTC
    const statsDate = new Date().toISOString().split('T')[0];

    log.info('Starting daily dashboard stats calculation', { statsDate, event: event?.source || 'manual' });

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // ========================================================================
        // 1. RESOURCE COUNTS
        // ========================================================================
        const resourceCountsStart = Date.now();

        const resourceCountsResult = await client.query(`
            WITH 
            active_employees AS (
                SELECT 
                    e.id,
                    e.track_id,
                    e.employee_type_id,
                    e.is_external,
                    e.tier_id
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
            ),
            -- Query #7: Total allocation from billable employees (all projects, excluding bench)
            billable_allocations AS (
                SELECT 
                    SUM(CASE 
                        WHEN p.is_bench_project = true THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
            ),
            -- Query #8: Total billing from ALL employees (all projects)
            all_billing AS (
                SELECT 
                    SUM(a.billing_percentage) as total_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
            ),
            -- Query #10: Shadow allocation - billable employees on BILLING projects only
            shadow_allocation AS (
                SELECT 
                    SUM(CASE 
                        WHEN p.is_bench_project = true THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND LOWER(pbs.name) = 'billing'
            ),
            -- Query #10: Shadow billing - ALL employees on BILLING projects only
            shadow_billing AS (
                SELECT 
                    SUM(a.billing_percentage) as total_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND LOWER(pbs.name) = 'billing'
            ),
            -- Query #11: Bench resource count (billable tracks only)
            bench_allocations AS (
                SELECT 
                    SUM(a.allocation_percentage) as total_bench
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND p.is_bench_project = true
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                  AND e.employee_type_id != 3
                  AND e.is_external = false
            ),
            -- Query #12: Internal non-billing count (billable tracks only)
            internal_non_billing AS (
                SELECT 
                    SUM(a.allocation_percentage) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND p.is_bench_project = false
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND (pbs.name IS NULL OR LOWER(pbs.name) != 'billing')
            ),
            -- Query #13: Training resource count (project_type = 'training')
            training_allocations AS (
                SELECT 
                    SUM(a.allocation_percentage) as total_training
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                JOIN projects p ON a.project_id = p.id
                JOIN project_types pt ON p.project_type_id = pt.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                  AND LOWER(pt.name) = 'training'
            )
            SELECT
                -- 1. Total Active Resource Count
                GREATEST(COUNT(CASE WHEN ae.is_external = false THEN 1 END), 0) as total_active_resource_count,
                
                -- 2. Total Billable Resource Count
                GREATEST(COUNT(CASE 
                    WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) 
                    AND ae.employee_type_id != 3 
                    AND ae.is_external = false 
                    AND ae.tier_id != 7
                    THEN 1 
                END), 0) as total_billable_resource_count,
                
                -- 3. External Resource Count
                GREATEST(COUNT(CASE WHEN ae.is_external = true THEN 1 END), 0) as external_resource_count,
                
                -- 4. Intern Resource Count
                GREATEST(COUNT(CASE WHEN ae.employee_type_id = 3 THEN 1 END), 0) as intern_resource_count,
                
                -- 7. Total Allocation of Company (FTE)
                GREATEST(COALESCE((SELECT total_allocation / 100.0 FROM billable_allocations), 0), 0)::DECIMAL(10,2) as allocated_resource_count,
                
                -- 8. Total Billing of Company (FTE)
                GREATEST(COALESCE((SELECT total_billing / 100.0 FROM all_billing), 0), 0)::DECIMAL(10,2) as billing_resource_count,
                
                -- 10. Shadow Count (FTE)
                GREATEST(
                    COALESCE(
                        ((SELECT total_allocation FROM shadow_allocation) - (SELECT total_billing FROM shadow_billing)) / 100.0,
                        0
                    ),
                    0
                )::DECIMAL(10,2) as shadow_count,
                
                -- 11. Bench Resource Count (FTE)
                GREATEST(COALESCE((SELECT total_bench / 100.0 FROM bench_allocations), 0), 0)::DECIMAL(10,2) as bench_resource_count,
                
                -- 12. Internal Non-Billing Count (FTE)
                GREATEST(COALESCE((SELECT total_allocation / 100.0 FROM internal_non_billing), 0), 0)::DECIMAL(10,2) as internal_non_billing_count,
                
                -- 13. Training Resource Count (FTE)
                GREATEST(COALESCE((SELECT total_training / 100.0 FROM training_allocations), 0), 0)::DECIMAL(10,2) as training_resource_count,
                
                -- 14. Interns Count (Headcount)
                GREATEST(COUNT(CASE WHEN ae.employee_type_id = 3 THEN 1 END), 0) as interns_count,
                
                -- 15. Synergy Count (Headcount)
                GREATEST(COUNT(CASE WHEN ae.tier_id = 7 THEN 1 END), 0) as synergy_count,
                
                -- 16. Shared Services Count (Headcount)
                GREATEST(COUNT(CASE WHEN ae.track_id = 6 THEN 1 END), 0) as shared_services_count,
                
                -- Total active employees (excluding external)
                GREATEST(COUNT(CASE WHEN ae.is_external = false THEN 1 END), 0)::INTEGER as total_active_employees
            FROM active_employees ae
        `);

        const resourceCounts = resourceCountsResult.rows[0];
        const resourceCountsDuration = Date.now() - resourceCountsStart;
        log.info('Resource counts calculated', { duration: resourceCountsDuration });

        // ========================================================================
        // 2. PERCENTAGES
        // ========================================================================
        const percentagesStart = Date.now();

        const percentagesResult = await client.query(`
            WITH 
            active_employees AS (
                SELECT e.id, 
                       e.track_id, 
                       e.designation_id,
                       e.employee_type_id
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL AND e.is_external = false
            ),
            employee_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(CASE 
                        WHEN p.is_bench_project = true THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                GROUP BY a.employee_id
            ),
            all_employee_billing_pct AS (
                SELECT 
                    a.employee_id,
                    SUM(a.billing_percentage) as total_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                GROUP BY a.employee_id
            ),
            totals AS (
                SELECT 
                    COUNT(*) as total_employees,
                    -- Sum allocation only from billable tracks
                    COALESCE(SUM(COALESCE(ea.total_allocation, 0)), 0) as sum_allocation,
                    -- Sum billing from ALL employees
                    COALESCE((SELECT SUM(total_billing) FROM all_employee_billing_pct), 0) as sum_billing,
                    -- Billable count for bench % denominator
                    COALESCE(SUM(CASE 
                        WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) 
                        AND ae.employee_type_id != 3
                        THEN 1 ELSE 0 
                    END), 0) as billable_count,
                    -- Bench allocation sum for bench % numerator
                    (
                        SELECT COALESCE(SUM(a.allocation_percentage), 0)
                        FROM allocations a
                        JOIN projects p ON a.project_id = p.id
                        JOIN employees e ON a.employee_id = e.id
                        WHERE p.is_bench_project = true
                          AND a.is_active = true
                          AND a.deleted_at IS NULL
                          AND e.track_id IN (1, 2, 3, 4, 5, 8, 11)
                          AND e.employee_type_id != 3
                          AND e.is_external = false
                          AND e.status = 'Active'
                          AND e.deleted_at IS NULL
                    ) as sum_bench
                FROM active_employees ae
                LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
            )
            SELECT 
                GREATEST(
                    CASE WHEN billable_count > 0 
                        THEN ROUND((sum_allocation::DECIMAL / 100.0) / billable_count * 100, 1)
                        ELSE 0 
                    END,
                    0
                ) as allocation_percentage,
                GREATEST(
                    CASE WHEN billable_count > 0 
                        THEN ROUND((sum_billing::DECIMAL / 100.0) / billable_count * 100, 1)
                        ELSE 0 
                    END,
                    0
                ) as billable_percentage,
                -- Shadow % = Allocation % - Billable %
                GREATEST(
                    CASE WHEN billable_count > 0 
                        THEN ROUND(((sum_allocation::DECIMAL / 100.0) / billable_count * 100) - ((sum_billing::DECIMAL / 100.0) / billable_count * 100), 1)
                        ELSE 0 
                    END,
                    0
                ) as shadow_percentage,
                GREATEST(
                    CASE WHEN billable_count > 0 
                        THEN ROUND((sum_bench / 100.0) / billable_count * 100, 1)
                        ELSE 0 
                    END,
                    0
                ) as bench_percentage
            FROM totals
        `);

        const percentages = percentagesResult.rows[0];
        const percentagesDuration = Date.now() - percentagesStart;
        log.info('Percentages calculated', { duration: percentagesDuration });

        // ========================================================================
        // 3. CHARTS DATA - Accounts by Track and Tech Stack
        // ========================================================================
        const chartsStart = Date.now();

        // Accounts managed by Track (Excl. External)
        const trackResult = await client.query(`
            SELECT 
                e.track_id,
                COUNT(*) as count
            FROM employees e
            WHERE e.status = 'Active' 
              AND e.deleted_at IS NULL
              AND e.track_id IS NOT NULL
              AND e.is_external = false -- Exclude External Employees
            GROUP BY e.track_id
            ORDER BY count DESC
        `);

        // Map track_id to track names from config
        const accountsByTrack = trackResult.rows.map(row => ({
            track: TRACKS.find(t => t.id === row.track_id)?.name || `Track ${row.track_id}`,
            trackId: row.track_id,
            count: parseInt(row.count)
        }));

        // Accounts managed by Tech Stack (Excl. External)
        const techStackResult = await client.query(`
            SELECT 
                e.tech_stack_id,
                COUNT(*) as count
            FROM employees e
            WHERE e.status = 'Active' 
              AND e.deleted_at IS NULL
              AND e.tech_stack_id IS NOT NULL
              AND e.is_external = false -- Exclude External Employees
            GROUP BY e.tech_stack_id
            ORDER BY count DESC
        `);

        // Map tech_stack_id to tech stack names from config
        const accountsByTechStack = techStackResult.rows.map(row => ({
            techStack: TECH_STACKS.find(t => t.id === row.tech_stack_id)?.name || `Tech Stack ${row.tech_stack_id}`,
            techStackId: row.tech_stack_id,
            count: parseInt(row.count)
        }));

        const chartsDuration = Date.now() - chartsStart;
        log.info('Charts data calculated', { duration: chartsDuration });

        // ========================================================================
        // 4. STORE IN DATABASE
        // ========================================================================

        // Delete existing records for today (in case of re-run)
        await client.query(
            `DELETE FROM dashboard_stats WHERE stats_date = $1`,
            [statsDate]
        );

        const totalDuration = Date.now() - startTime;

        // Insert resource counts
        await client.query(`
            INSERT INTO dashboard_stats (stats_date, stats_type, resource_counts, calculation_duration_ms, source)
            VALUES ($1, 'resource_counts', $2, $3, $4)
        `, [
            statsDate,
            JSON.stringify({
                billingResourceCount: parseFloat(resourceCounts.billing_resource_count) || 0,
                allocatedResourceCount: parseFloat(resourceCounts.allocated_resource_count) || 0,
                billableResourceCount: parseFloat(resourceCounts.billable_resource_count) || 0,
                shadowCount: parseFloat(resourceCounts.shadow_count) || 0,
                internalNonBillingCount: parseFloat(resourceCounts.internal_non_billing_count) || 0,
                externalConsultantCount: parseFloat(resourceCounts.external_consultant_count) || 0,
                benchResourceCount: parseFloat(resourceCounts.bench_resource_count) || 0,
                trainingResourceCount: parseFloat(resourceCounts.training_resource_count) || 0,
                internsCount: parseFloat(resourceCounts.interns_count) || 0,
                synergyCount: parseFloat(resourceCounts.synergy_count) || 0,
                sharedServicesCount: parseFloat(resourceCounts.shared_services_count) || 0,
                totalActiveEmployees: parseInt(resourceCounts.total_active_employees) || 0
            }),
            resourceCountsDuration,
            event?.source === 'aws.events' ? 'scheduled' : 'manual'
        ]);

        // Insert percentages
        await client.query(`
            INSERT INTO dashboard_stats (stats_date, stats_type, percentages, calculation_duration_ms, source)
            VALUES ($1, 'percentages', $2, $3, $4)
        `, [
            statsDate,
            JSON.stringify({
                allocationPercentage: parseFloat(percentages.allocation_percentage) || 0,
                billablePercentage: parseFloat(percentages.billable_percentage) || 0,
                shadowPercentage: parseFloat(percentages.shadow_percentage) || 0,
                benchPercentage: parseFloat(percentages.bench_percentage) || 0
            }),
            percentagesDuration,
            event?.source === 'aws.events' ? 'scheduled' : 'manual'
        ]);

        // Insert charts data
        await client.query(`
            INSERT INTO dashboard_stats (stats_date, stats_type, charts_data, calculation_duration_ms, source)
            VALUES ($1, 'charts', $2, $3, $4)
        `, [
            statsDate,
            JSON.stringify({
                accountsByTrack,
                accountsByTechStack
            }),
            chartsDuration,
            event?.source === 'aws.events' ? 'scheduled' : 'manual'
        ]);

        await client.query('COMMIT');

        log.info('Daily dashboard stats calculation completed', {
            statsDate,
            totalDuration,
            resourceCountsDuration,
            percentagesDuration,
            chartsDuration
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Daily dashboard stats calculated successfully',
                data: {
                    statsDate,
                    totalDurationMs: totalDuration,
                    resourceCounts: {
                        ...resourceCounts,
                        calculationDurationMs: resourceCountsDuration
                    },
                    percentages: {
                        ...percentages,
                        calculationDurationMs: percentagesDuration
                    },
                    charts: {
                        accountsByTrack,
                        accountsByTechStack,
                        calculationDurationMs: chartsDuration
                    }
                }
            })
        };

    } catch (err) {
        await client.query('ROLLBACK');
        log.error('Failed to calculate daily dashboard stats', {
            error: err.message,
            stack: err.stack
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: err.message
            })
        };
    } finally {
        client.release();
    }
};

/**
 * Cleanup old dashboard stats (retention: 365 days)
 * Can be scheduled weekly or monthly
 */
export const cleanupOldStats = async (event) => {
    const log = logger.child({ handler: 'scheduledJobs.cleanupOldStats' });

    log.info('Starting cleanup of old dashboard stats');

    try {
        const result = await db.query(`
            DELETE FROM dashboard_stats 
            WHERE stats_date < CURRENT_DATE - INTERVAL '365 days'
            RETURNING id
        `);

        const deletedCount = result.rowCount;
        log.info('Cleanup completed', { deletedRecords: deletedCount });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Cleaned up ${deletedCount} old dashboard stats records`
            })
        };

    } catch (err) {
        log.error('Failed to cleanup old stats', { error: err.message });
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: err.message
            })
        };
    }
};

export default { calculateDailyStats, cleanupOldStats };
