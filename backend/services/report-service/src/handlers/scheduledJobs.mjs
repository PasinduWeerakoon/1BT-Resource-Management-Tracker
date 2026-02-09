/**
 * Scheduled Jobs Handler
 * 
 * Handles scheduled tasks like daily dashboard stats calculation.
 * Runs via CloudWatch Events (EventBridge) at midnight UTC.
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { TRACKS, TIERS, TECH_STACKS } from '/opt/nodejs/configs/index.js';

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
            -- Active employees base
            active_employees AS (
                SELECT e.*, 
                       COALESCE(e.total_allocation, 0) as current_allocation,
                       COALESCE(e.total_resource_billing, 0) as current_billing
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
            ),
            -- Get allocation details per employee
            employee_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as total_allocation,
                    SUM(a.billing_percentage) as total_billing,
                    SUM(CASE WHEN a.is_critical_shadow THEN a.allocation_percentage ELSE 0 END) as shadow_allocation,
                    COUNT(DISTINCT a.project_id) as project_count,
                    BOOL_OR(bs.name = 'Billing') as has_billing_allocation
                FROM allocations a
                LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                GROUP BY a.employee_id
            ),
            -- Employee tags for Synergy detection
            synergy_employees AS (
                SELECT DISTINCT et.employee_id
                FROM employee_tags et
                JOIN tags t ON et.tag_id = t.id
                WHERE LOWER(t.name) = 'synergy'
            ),
            -- Get employee types
            consultant_type AS (
                SELECT id FROM employee_types WHERE LOWER(name) LIKE '%consultant%' LIMIT 1
            ),
            intern_designations AS (
                SELECT id FROM designations WHERE is_intern_role = true
            )
            SELECT
                -- Billing Resource Count (employees with billing allocations)
                COALESCE(SUM(CASE WHEN ea.has_billing_allocation THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as billing_resource_count,
                
                -- Allocated Resource Count (employees with any allocation > 0)
                COALESCE(SUM(COALESCE(ea.total_allocation, 0) / 100.0), 0)::DECIMAL(10,1) as allocated_resource_count,
                
                -- Billable Resource Count (excludes Delivery=10 & Interns)
                COALESCE(SUM(CASE 
                    WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11)  -- BILLABLE_RESOURCE_TRACK_IDS: excludes Delivery
                    AND ae.designation_id NOT IN (SELECT id FROM intern_designations)
                    THEN 1 ELSE 0 
                END), 0)::DECIMAL(10,1) as billable_resource_count,
                
                -- Shadow Count (employees with shadow allocations)
                COALESCE(SUM(CASE WHEN COALESCE(ea.shadow_allocation, 0) > 0 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as shadow_count,
                
                -- External Consultant Count
                COALESCE(SUM(CASE WHEN ae.employee_type_id IN (SELECT id FROM consultant_type) THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as external_consultant_count,
                
                -- Bench Resource Count (allocation < 100 or no allocation)
                -- Bench Resource Count (allocation < 100, eligible tracks only, no interns)
                COALESCE(SUM(CASE 
                    WHEN COALESCE(ea.total_allocation, 0) < 100 
                    AND ae.track_id IN (1, 2, 3, 4, 5, 8, 10, 11) -- BENCH_ELIGIBLE_TRACK_IDS
                    AND ae.designation_id NOT IN (SELECT id FROM intern_designations)
                    THEN 1 ELSE 0 
                END), 0)::DECIMAL(10,1) as bench_resource_count,
                
                -- Training Resource Count (employees allocated to training projects)
                COALESCE((
                    SELECT COUNT(DISTINCT a.employee_id)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    JOIN project_types pt ON p.project_type_id = pt.id
                    WHERE a.is_active = true 
                      AND a.deleted_at IS NULL
                      AND LOWER(pt.name) = 'training'
                      AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                ), 0)::DECIMAL(10,1) as training_resource_count,
                
                -- Interns Count
                COALESCE(SUM(CASE WHEN ae.designation_id IN (SELECT id FROM intern_designations) THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as interns_count,
                
                -- Synergy Count
                COALESCE(SUM(CASE WHEN ae.id IN (SELECT employee_id FROM synergy_employees) THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as synergy_count,
                
                -- Shared Services Count (employees allocated to internal projects)
                COALESCE((
                    SELECT COUNT(DISTINCT a.employee_id)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    WHERE a.is_active = true 
                      AND a.deleted_at IS NULL
                      AND p.account_type = 'Internal'
                      AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                ), 0)::DECIMAL(10,1) as shared_services_count,
                
                -- Total active employees for percentage calculations
                COUNT(*)::INTEGER as total_active_employees
            FROM active_employees ae
            LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
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
                       COALESCE(e.total_allocation, 0) as current_allocation,
                       COALESCE(e.total_resource_billing, 0) as current_billing,
                       e.track_id, 
                       e.designation_id
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
            ),
            employee_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as total_allocation,
                    SUM(a.billing_percentage) as total_billing,
                    SUM(CASE WHEN a.is_critical_shadow THEN a.allocation_percentage ELSE 0 END) as shadow_percentage
                FROM allocations a
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                GROUP BY a.employee_id
            ),
            intern_designations AS (
                SELECT id FROM designations WHERE is_intern_role = true
            ),
            totals AS (
                SELECT 
                    COUNT(*) as total_employees,
                    -- Sum of all allocation percentages / (total employees * 100) * 100
                    COALESCE(SUM(COALESCE(ea.total_allocation, 0)), 0) as sum_allocation,
                    COALESCE(SUM(COALESCE(ea.total_billing, 0)), 0) as sum_billing,
                    COALESCE(SUM(COALESCE(ea.shadow_percentage, 0)), 0) as sum_shadow,
                    -- Billable count for bench % denominator (excludes Delivery=10 & Interns)
                    COALESCE(SUM(CASE 
                        WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) 
                        AND ae.designation_id NOT IN (SELECT id FROM intern_designations)
                        THEN 1 ELSE 0 
                    END), 0) as billable_count,
                    -- Bench allocation sum for bench % numerator
                    (
                        SELECT COALESCE(SUM(a.allocation_percentage), 0)
                        FROM allocations a
                        JOIN projects p ON a.project_id = p.id
                        JOIN employees e ON a.employee_id = e.id
                        WHERE p.project_name = 'Bench'
                          AND a.is_active = true
                          AND a.deleted_at IS NULL
                          AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                          AND e.track_id IN (1, 2, 3, 4, 5, 8, 11) -- Only billable tracks
                          AND e.designation_id NOT IN (SELECT id FROM intern_designations) -- Exclude interns
                    ) as sum_bench
                FROM active_employees ae
                LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
            )
            SELECT 
                CASE WHEN billable_count > 0 
                    THEN ROUND((sum_allocation::DECIMAL / 100.0) / billable_count * 100, 1)
                    ELSE 0 
                END as allocation_percentage,
                CASE WHEN billable_count > 0 
                    THEN ROUND((sum_billing::DECIMAL / 100.0) / billable_count * 100, 1)
                    ELSE 0 
                END as billable_percentage,
                CASE WHEN sum_allocation > 0 
                    THEN ROUND((sum_shadow::DECIMAL / sum_allocation) * 100, 1)
                    ELSE 0 
                END as shadow_percentage,
                CASE WHEN billable_count > 0 
                    THEN ROUND((sum_bench / 100.0) / billable_count * 100, 1)
                    ELSE 0 
                END as bench_percentage
            FROM totals
        `);

        const percentages = percentagesResult.rows[0];
        const percentagesDuration = Date.now() - percentagesStart;
        log.info('Percentages calculated', { duration: percentagesDuration });

        // ========================================================================
        // 3. CHARTS DATA - Accounts by Track and Tech Stack
        // ========================================================================
        const chartsStart = Date.now();

        // Accounts managed by Track
        const trackResult = await client.query(`
            SELECT 
                e.track_id,
                COUNT(*) as count
            FROM employees e
            WHERE e.status = 'Active' 
              AND e.deleted_at IS NULL
              AND e.track_id IS NOT NULL
            GROUP BY e.track_id
            ORDER BY count DESC
        `);

        // Map track_id to track names from config
        const accountsByTrack = trackResult.rows.map(row => ({
            track: TRACKS.find(t => t.id === row.track_id)?.name || `Track ${row.track_id}`,
            trackId: row.track_id,
            count: parseInt(row.count)
        }));

        // Accounts managed by Tech Stack
        const techStackResult = await client.query(`
            SELECT 
                e.tech_stack_id,
                COUNT(*) as count
            FROM employees e
            WHERE e.status = 'Active' 
              AND e.deleted_at IS NULL
              AND e.tech_stack_id IS NOT NULL
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
