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
 * Get dashboard resource counts from cached daily stats
 * Returns: Billing, Allocated, Billable, Shadow, External Consultant, Bench, Training, Interns, Synergy, Shared Services counts
 */
export const getDashboardResourceCounts = async (event) => {
    const log = logger.child({ handler: 'reports.getDashboardResourceCounts' });

    try {
        log.info('Getting dashboard resource counts');

        // Calculate in real-time
        log.info('Calculating resource counts (realtime)');

        const result = await db.query(`
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
                  AND e.track_id IN (${BILLABLE_TRACK_IDS.join(',')})
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
                  AND e.track_id IN (${BILLABLE_TRACK_IDS.join(',')})
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
                  AND e.track_id IN (${BILLABLE_TRACK_IDS.join(',')})
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
                  AND e.track_id IN (${BILLABLE_TRACK_IDS.join(',')})
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
                    WHEN ae.track_id IN (${BILLABLE_TRACK_IDS.join(',')}) 
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
                
                -- 2 (duplicate). Billable resource count
                GREATEST(COUNT(CASE 
                    WHEN ae.track_id IN (${BILLABLE_TRACK_IDS.join(',')}) 
                    AND ae.employee_type_id != 3 
                    AND ae.is_external = false 
                    AND ae.tier_id != 7
                    THEN 1 
                END), 0) as billable_resource_count,
                
                -- 10. Shadow Count (FTE)
                GREATEST(
                    COALESCE(
                        ((SELECT total_allocation FROM shadow_allocation) - (SELECT total_billing FROM shadow_billing)) / 100.0,
                        0
                    ),
                    0
                )::DECIMAL(10,2) as shadow_count,
                
                -- 12. Internal Non-Billing Count (FTE)
                GREATEST(COALESCE((SELECT total_allocation / 100.0 FROM internal_non_billing), 0), 0)::DECIMAL(10,2) as internal_non_billing_count,
                
                -- 3 (duplicate). External Consultant Count
                GREATEST(COUNT(CASE WHEN ae.is_external = true THEN 1 END), 0) as external_consultant_count,
                
                -- 11. Bench Resource Count (FTE)
                GREATEST(COALESCE((SELECT total_bench / 100.0 FROM bench_allocations), 0), 0)::DECIMAL(10,2) as bench_resource_count,
                
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

        const row = result.rows[0];
        const resourceCounts = {
            billingResourceCount: Math.max(0, parseFloat(row.billing_resource_count) || 0),
            allocatedResourceCount: Math.max(0, parseFloat(row.allocated_resource_count) || 0),
            billableResourceCount: Math.max(0, parseFloat(row.billable_resource_count) || 0),
            shadowCount: Math.max(0, parseFloat(row.shadow_count) || 0),
            internalNonBillingCount: Math.max(0, parseFloat(row.internal_non_billing_count) || 0),
            externalConsultantCount: Math.max(0, parseFloat(row.external_consultant_count) || 0),
            benchResourceCount: Math.max(0, parseFloat(row.bench_resource_count) || 0),
            trainingResourceCount: Math.max(0, parseFloat(row.training_resource_count) || 0),
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

        // Calculate in real-time
        log.info('Calculating percentages (realtime)');

        const result = await db.query(`
            WITH 
            active_employees AS (
                SELECT e.id, e.track_id, e.designation_id, e.employee_type_id
                FROM employees e
                WHERE e.status = 'Active' AND e.deleted_at IS NULL
            ),
            -- Allocation: ONLY billable tracks (excl. interns, bench, training)
            billable_employee_allocations_pct AS (
                SELECT 
                    a.employee_id,
                    SUM(CASE 
                        WHEN LOWER(p.project_name) = 'bench' THEN 0
                        WHEN LOWER(bs.name) = 'training' THEN 0
                        WHEN LOWER(pt.name) = 'training' THEN 0
                        ELSE a.allocation_percentage 
                    END) as total_allocation,
                    -- Shadow eligible: Projects with billing status = 'Billing'
                    SUM(CASE 
                        WHEN LOWER(pbs.name) = 'billing' THEN a.allocation_percentage 
                        ELSE 0 
                    END) as shadow_eligible_allocation,
                    SUM(CASE 
                        WHEN LOWER(pbs.name) = 'billing' THEN a.billing_percentage 
                        ELSE 0 
                    END) as shadow_eligible_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id  -- allocation billing status
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN billing_statuses pbs ON p.billing_status_id = pbs.id  -- project billing status
                LEFT JOIN project_types pt ON p.project_type_id = pt.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                  AND e.track_id IN (${BILLABLE_TRACK_IDS.join(',')})
                  AND e.employee_type_id != 3
                  AND e.is_external = false
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                GROUP BY a.employee_id
            ),
            -- Billing: ALL employees (no track filtering)
            all_employee_billing_pct AS (
                SELECT 
                    a.employee_id,
                    SUM(a.billing_percentage) as total_billing
                FROM allocations a
                JOIN employees e ON a.employee_id = e.id
                WHERE a.is_active = true 
                  AND a.deleted_at IS NULL
                  AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                  AND e.status = 'Active'
                  AND e.deleted_at IS NULL
                GROUP BY a.employee_id
            ),
            intern_designations AS (
                SELECT id FROM designations WHERE is_intern_role = true
            ),
            totals AS (
                SELECT 
                    COUNT(*) as total_employees,
                    -- Sum allocation only from billable tracks
                    COALESCE((SELECT SUM(total_allocation) FROM billable_employee_allocations_pct), 0) as sum_allocation,
                    -- Sum billing from ALL employees
                    COALESCE((SELECT SUM(total_billing) FROM all_employee_billing_pct), 0) as sum_billing,
                    -- Shadow calculation only for billable tracks
                    COALESCE((SELECT SUM(shadow_eligible_allocation) FROM billable_employee_allocations_pct), 0) as sum_shadow_alloc,
                    COALESCE((SELECT SUM(shadow_eligible_billing) FROM billable_employee_allocations_pct), 0) as sum_shadow_bill,
                    -- Billable count (excludes Delivery=10 & Interns)
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

        // Calculate in real-time
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
