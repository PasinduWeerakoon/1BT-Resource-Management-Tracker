/**
 * Allocation Reports
 * 
 * Handlers for allocation-related reports:
 * - getMonthlyAllocationReport: Monthly allocation breakdown
 * 
 * Config ID Resolution:
 * - track_id -> TRACKS config
 * - tier_id -> TIERS config
 * - tech_stack_id -> TECH_STACKS config
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';
import { TRACKS, TIERS, TECH_STACKS, getConfigById } from '/opt/nodejs/configs/index.js';

/**
 * Helper function to resolve config IDs to labels
 */
const resolveConfigLabel = (configArray, id) => {
    if (!id) return null;
    const config = getConfigById(configArray, id);
    return config ? config.label : null;
};

/**
 * Get monthly allocation report
 * Queries both allocations (current) and allocation_history (deallocated) tables
 * to provide a complete picture of allocations for a given month period.
 */
export const getMonthlyAllocationReport = async (event) => {
    const log = logger.child({ handler: 'reports.getMonthlyAllocationReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { year, month, track_id } = queryParams;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

        log.info('Getting monthly allocation report', { year: targetYear, month: targetMonth, track_id });

        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

        // Build parameterized query with optional track filter
        const params = [startDate, endDate];
        let trackFilter = '';
        if (track_id) {
            params.push(parseInt(track_id));
            trackFilter = `AND r.track_id = $${params.length}`;
        }

        // Query 1: Current allocations from 'allocations' table
        // Users still allocated whose allocation overlaps with the given month
        const currentAllocationsQuery = `
            SELECT 
                r.name as resource_name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                p.project_name,
                c.client_name,
                a.allocation_percentage,
                a.allocated_date as start_date,
                a.deallocated_date as end_date,
                'Current' as source
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE a.is_active = true
              AND a.deleted_at IS NULL
              AND r.deleted_at IS NULL
              AND r.status = 'Active'
              AND a.allocated_date <= $2
              AND (a.deallocated_date IS NULL OR a.deallocated_date >= $1)
              ${trackFilter}
        `;

        // Query 2: Historical allocations from 'allocation_history' table
        // Users who were deallocated but had an allocation during the given month
        const historyAllocationsQuery = `
            SELECT 
                r.name as resource_name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                p.project_name,
                c.client_name,
                ah.allocation_percentage,
                ah.allocation_start_date as start_date,
                ah.allocation_end_date as end_date,
                'Historical' as source
            FROM allocation_history ah
            JOIN employees r ON ah.employee_id = r.id
            JOIN projects p ON ah.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE ah.change_type = 'DELETED'
              AND ah.allocation_start_date <= $2
              AND ah.allocation_end_date IS NOT NULL
              AND ah.allocation_end_date >= $1
              AND r.deleted_at IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM allocations a2 
                  WHERE a2.employee_id = ah.employee_id 
                    AND a2.project_id = ah.project_id 
                    AND a2.is_active = true 
                    AND a2.deleted_at IS NULL
              )
              ${trackFilter}
        `;

        // Combined query using UNION ALL
        const combinedQuery = `
            ${currentAllocationsQuery}
            UNION ALL
            ${historyAllocationsQuery}
            ORDER BY resource_name, project_name
        `;

        const result = await db.query(combinedQuery, params);

        // Transform results with config resolution
        const data = result.rows.map(row => ({
            ...row,
            track: resolveConfigLabel(TRACKS, row.track_id),
            tier: resolveConfigLabel(TIERS, row.tier_id),
            tech_stack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id)
        }));

        return success({
            data,
            total: data.length,
            period: {
                year: targetYear,
                month: targetMonth,
                startDate,
                endDate
            },
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get monthly allocation report', { error: err.message });
        return error('Failed to get monthly allocation report', err);
    }
};
