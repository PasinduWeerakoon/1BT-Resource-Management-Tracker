/**
 * Dashboard Report Handler
 * 
 * Provides dashboard summary data from pre-calculated daily stats.
 * Stats are calculated at midnight UTC by the scheduled job.
 * Falls back to real-time calculation if no cached data exists.
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';
import { TRACKS, TECH_STACKS, BILLABLE_TRACK_IDS } from '/opt/nodejs/configs/index.js';

/**
 * Helper: Get cached stats from dashboard_stats table
 * Returns null if no cached data exists for today
 */
const getCachedStats = async (statsType) => {
    const result = await db.query(`
        SELECT resource_counts, percentages, charts_data, calculated_at, stats_date
        FROM dashboard_stats 
        WHERE stats_type = $1 
        ORDER BY stats_date DESC 
        LIMIT 1
    `, [statsType]);

    return result.rows[0] || null;
};

/**
 * Get dashboard summary data
 */
export const getDashboard = async (event) => {
    const log = logger.child({ handler: 'reports.getDashboard' });

    try {
        log.info('Getting dashboard data');

        // Run all queries in parallel for performance
        const [
            resourceStats,
            projectStats,
            allocationStats,
            benchResources
        ] = await Promise.all([
            // Resource counts by status
            db.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM employees
                WHERE deleted_at IS NULL
                GROUP BY status
            `),

            // Project counts by status
            db.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM projects
                WHERE deleted_at IS NULL
                GROUP BY status
            `),

            // Allocation summary
            db.query(`
                SELECT 
                    COUNT(DISTINCT employee_id) as allocated_resources,
                    COUNT(*) as total_allocations,
                    AVG(allocation_percentage) as avg_allocation
                FROM allocations
                WHERE is_active = true
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
            `),

            // Bench resources count
            db.query(`
                WITH resource_allocations AS (
                    SELECT employee_id, SUM(allocation_percentage) as total
                    FROM allocations
                    WHERE is_active = true AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                    GROUP BY employee_id
                )
                SELECT COUNT(*) as count
                FROM employees r
                LEFT JOIN resource_allocations ra ON r.id = ra.employee_id
                WHERE r.status = 'Active' AND r.deleted_at IS NULL
                AND (ra.total IS NULL OR ra.total < 100)
            `)
        ]);

        // Format response
        const resourcesByStatus = {};
        resourceStats.rows.forEach(row => {
            resourcesByStatus[row.status] = parseInt(row.count);
        });

        const projectsByStatus = {};
        projectStats.rows.forEach(row => {
            projectsByStatus[row.status] = parseInt(row.count);
        });

        return success({
            resources: {
                total: Object.values(resourcesByStatus).reduce((a, b) => a + b, 0),
                byStatus: resourcesByStatus,
                onBench: parseInt(benchResources.rows[0]?.count || 0)
            },
            projects: {
                total: Object.values(projectsByStatus).reduce((a, b) => a + b, 0),
                byStatus: projectsByStatus
            },
            allocations: {
                allocatedResources: parseInt(allocationStats.rows[0]?.allocated_resources || 0),
                totalAllocations: parseInt(allocationStats.rows[0]?.total_allocations || 0),
                avgAllocation: Math.round(parseFloat(allocationStats.rows[0]?.avg_allocation || 0))
            },
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get dashboard', { error: err.message });
        return error('Failed to get dashboard data', err);
    }
};

/**
 * Get dashboard resource counts from cached daily stats
 * Returns: Billing, Allocated, Billable, Shadow, External Consultant, Bench, Training, Interns, Synergy, Shared Services counts
 */
export const getDashboardResourceCounts = async (event) => {
    const log = logger.child({ handler: 'reports.getDashboardResourceCounts' });

    try {
        log.info('Getting dashboard resource counts');

        // Try to get cached stats first
        const cached = await getCachedStats('resource_counts');

        if (cached && cached.resource_counts) {
            log.info('Returning cached resource counts', {
                statsDate: cached.stats_date,
                calculatedAt: cached.calculated_at
            });

            return success({
                data: cached.resource_counts,
                statsDate: cached.stats_date,
                calculatedAt: cached.calculated_at,
                source: 'cached'
            });
        }

        // Fallback: Calculate in real-time if no cached data
        log.warn('No cached resource counts found, calculating in real-time');

        const result = await db.query(`
            WITH 
            active_employees AS (
                SELECT e.*, 
                       COALESCE(e.total_allocation, 0) as current_allocation
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
            ),
            employee_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as total_allocation,
                    SUM(CASE WHEN a.is_critical_shadow THEN a.allocation_percentage ELSE 0 END) as shadow_allocation,
                    BOOL_OR(bs.name = 'Billing') as has_billing_allocation
                FROM allocations a
                LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                GROUP BY a.employee_id
            ),
            synergy_employees AS (
                SELECT DISTINCT et.employee_id
                FROM employee_tags et
                JOIN tags t ON et.tag_id = t.id
                WHERE LOWER(t.name) = 'synergy'
            ),
            consultant_type AS (
                SELECT id FROM employee_types WHERE LOWER(name) LIKE '%consultant%' LIMIT 1
            ),
            intern_designations AS (
                SELECT id FROM designations WHERE is_intern_role = true
            )
            SELECT
                COALESCE(SUM(CASE WHEN ea.has_billing_allocation THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as billing_resource_count,
                COALESCE(SUM(CASE WHEN COALESCE(ea.total_allocation, 0) > 0 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as allocated_resource_count,
                COALESCE(SUM(CASE 
                    WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11)  -- BILLABLE_RESOURCE_TRACK_IDS: excludes Delivery (10)
                    THEN 1 ELSE 0 
                END), 0)::DECIMAL(10,1) as billable_resource_count,
                COALESCE(SUM(CASE WHEN COALESCE(ea.shadow_allocation, 0) > 0 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as shadow_count,
                COALESCE(SUM(CASE WHEN ae.employee_type_id IN (SELECT id FROM consultant_type) THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as external_consultant_count,
                COALESCE(SUM(CASE WHEN COALESCE(ea.total_allocation, 0) < 100 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as bench_resource_count,
                COALESCE(SUM(CASE WHEN ae.designation_id IN (SELECT id FROM intern_designations) THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as interns_count,
                COALESCE(SUM(CASE WHEN ae.id IN (SELECT employee_id FROM synergy_employees) THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as synergy_count,
                COUNT(*)::INTEGER as total_active_employees
            FROM active_employees ae
            LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
        `);

        const row = result.rows[0];
        const resourceCounts = {
            billingResourceCount: parseFloat(row.billing_resource_count) || 0,
            allocatedResourceCount: parseFloat(row.allocated_resource_count) || 0,
            billableResourceCount: parseFloat(row.billable_resource_count) || 0,
            shadowCount: parseFloat(row.shadow_count) || 0,
            externalConsultantCount: parseFloat(row.external_consultant_count) || 0,
            benchResourceCount: parseFloat(row.bench_resource_count) || 0,
            trainingResourceCount: 0,
            internsCount: parseFloat(row.interns_count) || 0,
            synergyCount: parseFloat(row.synergy_count) || 0,
            sharedServicesCount: 0
        };

        return success({
            data: resourceCounts,
            calculatedAt: new Date().toISOString(),
            source: 'realtime'
        });

    } catch (err) {
        log.error('Failed to get dashboard resource counts', { error: err.message, stack: err.stack });
        return error('Failed to get dashboard resource counts', err);
    }
};

/**
 * Get dashboard percentages from cached daily stats
 * Returns: Allocation %, Billable %, Shadow %
 */
export const getDashboardPercentages = async (event) => {
    const log = logger.child({ handler: 'reports.getDashboardPercentages' });

    try {
        log.info('Getting dashboard percentages');

        // Try to get cached stats first
        const cached = await getCachedStats('percentages');

        if (cached && cached.percentages) {
            log.info('Returning cached percentages', {
                statsDate: cached.stats_date,
                calculatedAt: cached.calculated_at
            });

            return success({
                data: cached.percentages,
                statsDate: cached.stats_date,
                calculatedAt: cached.calculated_at,
                source: 'cached'
            });
        }

        // Fallback: Calculate in real-time if no cached data
        log.warn('No cached percentages found, calculating in real-time');

        const result = await db.query(`
            WITH 
            active_employees AS (
                SELECT e.id, e.track_id
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
            totals AS (
                SELECT 
                    COUNT(*) as total_employees,
                    COALESCE(SUM(COALESCE(ea.total_allocation, 0)), 0) as sum_allocation,
                    COALESCE(SUM(COALESCE(ea.total_billing, 0)), 0) as sum_billing,
                    COALESCE(SUM(COALESCE(ea.shadow_percentage, 0)), 0) as sum_shadow,
                    -- Billable count for bench % denominator (excludes Delivery=10)
                    COALESCE(SUM(CASE 
                        WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) THEN 1 ELSE 0 
                    END), 0) as billable_count,
                    -- Bench allocation sum for bench % numerator
                    (
                        SELECT COALESCE(SUM(a.allocation_percentage), 0)
                        FROM allocations a
                        JOIN projects p ON a.project_id = p.id
                        WHERE p.project_name = 'Bench'
                          AND a.is_active = true
                          AND a.deleted_at IS NULL
                          AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                    ) as sum_bench
                FROM active_employees ae
                LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
            )
            SELECT 
                CASE WHEN total_employees > 0 
                    THEN ROUND((sum_allocation::DECIMAL / (total_employees * 100)) * 100, 1)
                    ELSE 0 
                END as allocation_percentage,
                CASE WHEN total_employees > 0 
                    THEN ROUND((sum_billing::DECIMAL / (total_employees * 100)) * 100, 1)
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

        const row = result.rows[0];
        const percentages = {
            allocationPercentage: parseFloat(row.allocation_percentage) || 0,
            billablePercentage: parseFloat(row.billable_percentage) || 0,
            shadowPercentage: parseFloat(row.shadow_percentage) || 0,
            benchPercentage: parseFloat(row.bench_percentage) || 0
        };

        return success({
            data: percentages,
            calculatedAt: new Date().toISOString(),
            source: 'realtime'
        });

    } catch (err) {
        log.error('Failed to get dashboard percentages', { error: err.message, stack: err.stack });
        return error('Failed to get dashboard percentages', err);
    }
};

/**
 * Get dashboard charts data from cached daily stats
 * Returns: Employee accounts managed by Track and Tech Stack
 */
export const getDashboardCharts = async (event) => {
    const log = logger.child({ handler: 'reports.getDashboardCharts' });

    try {
        log.info('Getting dashboard charts data');

        // Try to get cached stats first
        const cached = await getCachedStats('charts');

        if (cached && cached.charts_data) {
            log.info('Returning cached charts data', {
                statsDate: cached.stats_date,
                calculatedAt: cached.calculated_at
            });

            return success({
                data: cached.charts_data,
                statsDate: cached.stats_date,
                calculatedAt: cached.calculated_at,
                source: 'cached'
            });
        }

        // Fallback: Calculate in real-time if no cached data
        log.warn('No cached charts data found, calculating in real-time');

        // Accounts managed by Track
        const trackResult = await db.query(`
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

        const accountsByTrack = trackResult.rows.map(row => ({
            track: TRACKS.find(t => t.id === row.track_id)?.name || `Track ${row.track_id}`,
            trackId: row.track_id,
            count: parseInt(row.count)
        }));

        // Accounts managed by Tech Stack
        const techStackResult = await db.query(`
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

        const accountsByTechStack = techStackResult.rows.map(row => ({
            techStack: TECH_STACKS.find(t => t.id === row.tech_stack_id)?.name || `Tech Stack ${row.tech_stack_id}`,
            techStackId: row.tech_stack_id,
            count: parseInt(row.count)
        }));

        return success({
            data: {
                accountsByTrack,
                accountsByTechStack
            },
            calculatedAt: new Date().toISOString(),
            source: 'realtime'
        });

    } catch (err) {
        log.error('Failed to get dashboard charts', { error: err.message });
        return error('Failed to get dashboard charts', err);
    }
};
