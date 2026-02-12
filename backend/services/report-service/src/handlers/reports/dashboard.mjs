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

/*TODO:REMOVE this*/
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

        // REALTIME ONLY: Bypass cache for instant updates
        /* 
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
        */

        // Fallback: Calculate in real-time if no cached data
        log.info('Calculating resource counts (realtime)');

        const result = await db.query(`
            WITH 
            active_employees AS (
                SELECT e.*, 
                       COALESCE(e.total_allocation, 0) as current_allocation
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
                AND e.is_external = false
                AND e.employee_type_id != 3
            ),
            employee_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(CASE 
                        WHEN LOWER(p.project_name) = 'bench' THEN 0
                        WHEN LOWER(bs.name) = 'training' THEN 0
                        WHEN LOWER(pt.name) = 'training' THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation,
                    SUM(a.billing_percentage) as total_billing,
                    SUM(CASE WHEN a.is_critical_shadow THEN a.allocation_percentage ELSE 0 END) as shadow_allocation,
                    SUM(CASE 
                        WHEN LOWER(pt.name) = 'client' THEN a.allocation_percentage 
                        ELSE 0 
                    END) as shadow_eligible_allocation,
                    SUM(CASE 
                        WHEN LOWER(pt.name) = 'client' THEN a.billing_percentage 
                        ELSE 0 
                    END) as shadow_eligible_billing,
                    BOOL_OR(bs.name = 'Billing') as has_billing_allocation
                FROM allocations a
                LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN project_types pt ON p.project_type_id = pt.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                GROUP BY a.employee_id
            ),
            synergy_employees AS (
                 -- Keeping for reference, but new logic uses tier_id
                 SELECT 1 
            ),
            intern_type AS (
                SELECT id FROM employee_types WHERE id = 3 -- Intern ID as per requirement
            ),
            training_billing_status AS (
                SELECT id FROM billing_statuses WHERE LOWER(name) = 'training' LIMIT 1
            )
            SELECT
                -- Billing Resource Count: Sum of Billing % / 100
                COALESCE(SUM(COALESCE(ea.total_billing, 0) / 100.0), 0)::DECIMAL(10,1) as billing_resource_count,
                
                -- Allocated Resource Count: Sum of Allocation % / 100
                COALESCE(SUM(COALESCE(ea.total_allocation, 0) / 100.0), 0)::DECIMAL(10,1) as allocated_resource_count,
                
                -- Billable Resource Count: Headcount of Billable Tracks (Excl. Support, Delivery, Interns, External)
                COALESCE(SUM(CASE 
                    WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11)  -- BILLABLE_RESOURCE_TRACK_IDS
                    AND ae.employee_type_id != 3 -- Exclude Interns
                    AND ae.is_external = false -- Exclude External Resources
                    THEN 1 ELSE 0 
                END), 0)::DECIMAL(10,1) as billable_resource_count,
                
                -- Shadow Count: Sum of (Allocation % - Billing %) / 100 (Excluding Interns)
                -- Shadow Count: Sum of (Allocation % - Billing %) / 100 on Billable Projects (Excluding Interns)
                COALESCE(SUM(CASE 
                    WHEN ae.employee_type_id != 3 
                    THEN (COALESCE(ea.shadow_eligible_allocation, 0) - COALESCE(ea.shadow_eligible_billing, 0)) / 100.0
                    ELSE 0 
                END), 0)::DECIMAL(10,1) as shadow_count,
                
                -- External Consultant Count: Headcount of Active External Employees
                COALESCE(SUM(CASE WHEN ae.is_external = true THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as external_consultant_count,
                
                -- Bench Resource Count: Sum of Bench Allocation % / 100 (Excl. Interns, External)
                (
                    SELECT COALESCE(SUM(a.allocation_percentage) / 100.0, 0)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    JOIN employees e ON a.employee_id = e.id
                    WHERE p.project_name = 'Bench'
                      AND a.is_active = true
                      AND a.deleted_at IS NULL
                      AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                      AND e.status = 'Active' AND e.deleted_at IS NULL
                      AND e.track_id IN (1, 2, 3, 4, 5, 8, 10, 11) -- BENCH_ELIGIBLE_TRACK_IDS (Includes Delivery)
                      AND e.employee_type_id != 3 -- Exclude Interns
                      AND e.is_external = false -- Exclude External Resources
                )::DECIMAL(10,1) as bench_resource_count,
                
                -- Training Resource Count: Sum of Allocation % / 100 where Billing Status = 'Training'
                COALESCE((
                    SELECT SUM(a.allocation_percentage) / 100.0
                    FROM allocations a
                    JOIN employees e ON a.employee_id = e.id
                    WHERE a.is_active = true 
                      AND a.deleted_at IS NULL
                      AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                      AND a.billing_status_id IN (SELECT id FROM training_billing_status)
                      AND e.status = 'Active' AND e.deleted_at IS NULL
                ), 0)::DECIMAL(10,1) as training_resource_count,

                COALESCE(SUM(CASE WHEN ae.employee_type_id = 3 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as interns_count,
                
                -- Synergy Count: Headcount by Tier ID 7
                COALESCE(SUM(CASE WHEN ae.tier_id = 7 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as synergy_count,
                
                -- Shared Services Count (Headcount): Support Track (ID 6)
                COALESCE(SUM(CASE WHEN ae.track_id = 6 THEN 1 ELSE 0 END), 0)::DECIMAL(10,1) as shared_services_count,
                
                COUNT(*)::INTEGER as total_active_employees
            FROM active_employees ae
            LEFT JOIN employee_allocations ea ON ae.id = ea.employee_id
        `);

        const row = result.rows[0];
        const resourceCounts = {
            billingResourceCount: Math.max(0, parseFloat(row.billing_resource_count) || 0),
            allocatedResourceCount: Math.max(0, parseFloat(row.allocated_resource_count) || 0),
            billableResourceCount: Math.max(0, parseFloat(row.billable_resource_count) || 0),
            shadowCount: Math.max(0, parseFloat(row.shadow_count) || 0),
            externalConsultantCount: Math.max(0, parseFloat(row.external_consultant_count) || 0),
            benchResourceCount: Math.max(0, parseFloat(row.bench_resource_count) || 0),
            trainingResourceCount: 0,
            internsCount: Math.max(0, parseFloat(row.interns_count) || 0),
            synergyCount: Math.max(0, parseFloat(row.synergy_count) || 0),
            sharedServicesCount: Math.max(0, parseFloat(row.shared_services_count) || 0)
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

        // REALTIME ONLY: Bypass cache for instant updates
        /*
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
        */

        // Fallback: Calculate in real-time if no cached data
        log.info('Calculating percentages (realtime)');

        const result = await db.query(`
            WITH 
            active_employees AS (
                SELECT e.id, e.track_id, e.designation_id, e.employee_type_id
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
            ),
            employee_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(CASE 
                        WHEN LOWER(p.project_name) = 'bench' THEN 0
                        WHEN LOWER(bs.name) = 'training' THEN 0
                        WHEN LOWER(pt.name) = 'training' THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation,
                    SUM(a.billing_percentage) as total_billing,
                    SUM(CASE 
                        WHEN LOWER(pt.name) = 'client' THEN a.allocation_percentage 
                        ELSE 0 
                    END) as shadow_eligible_allocation,
                    SUM(CASE 
                        WHEN LOWER(pt.name) = 'client' THEN a.billing_percentage 
                        ELSE 0 
                    END) as shadow_eligible_billing
                FROM allocations a
                LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN project_types pt ON p.project_type_id = pt.id
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
                    -- Exclude Interns from sums to align with billable count denominator and shadow calc
                    COALESCE(SUM(CASE WHEN ae.employee_type_id != 3 THEN COALESCE(ea.total_allocation, 0) ELSE 0 END), 0) as sum_allocation,
                    COALESCE(SUM(CASE WHEN ae.employee_type_id != 3 THEN COALESCE(ea.total_billing, 0) ELSE 0 END), 0) as sum_billing,
                    COALESCE(SUM(CASE WHEN ae.employee_type_id != 3 THEN COALESCE(ea.shadow_eligible_allocation, 0) ELSE 0 END), 0) as sum_shadow_alloc,
                    COALESCE(SUM(CASE WHEN ae.employee_type_id != 3 THEN COALESCE(ea.shadow_eligible_billing, 0) ELSE 0 END), 0) as sum_shadow_bill,
                    -- Billable count for bench % denominator (excludes Delivery=10)
                    -- Billable count for bench % denominator (excludes Delivery=10 & Interns)
                    COALESCE(SUM(CASE 
                        WHEN ae.track_id IN (1, 2, 3, 4, 5, 8, 11) 
                        AND ae.employee_type_id != 3 -- Exclude Interns
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
                          AND e.employee_type_id != 3 -- Exclude interns
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
                -- Shadow % = (Shadow Eligible Allocation - Shadow Eligible Billing) / Billable Count
                CASE WHEN billable_count > 0 
                    THEN ROUND(((sum_shadow_alloc::DECIMAL / 100.0) - (sum_shadow_bill::DECIMAL / 100.0)) / billable_count * 100, 1)
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
            allocationPercentage: Math.max(0, parseFloat(row.allocation_percentage) || 0),
            billablePercentage: Math.max(0, parseFloat(row.billable_percentage) || 0),
            shadowPercentage: Math.max(0, parseFloat(row.shadow_percentage) || 0),
            benchPercentage: Math.max(0, parseFloat(row.bench_percentage) || 0)
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

        // REALTIME ONLY: Bypass cache for instant updates
        /*
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
        */

        // Fallback: Calculate in real-time if no cached data
        log.info('Calculating charts data (realtime)');

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
            track: TRACKS.find(t => t.id === row.track_id)?.label || `Track ${row.track_id}`,
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
            techStack: TECH_STACKS.find(t => t.id === row.tech_stack_id)?.label || `Tech Stack ${row.tech_stack_id}`,
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
