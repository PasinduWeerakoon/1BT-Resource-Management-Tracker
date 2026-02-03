/**
 * Employee Reports
 * 
 * Handlers for employee-related reports:
 * - getEmployeeReport: All employees with allocation details
 * - getExceptionReport: Over/under allocated resources
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
 * Get employee allocation report
 */
export const getEmployeeReport = async (event) => {
    const log = logger.child({ handler: 'reports.getEmployeeReport' });

    try {
        log.info('Getting employee report');

        const query = `
            SELECT 
                r.id,
                r.epf_no,
                r.name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                r.status,
                r.joined_date,
                COALESCE(
                    (SELECT SUM(allocation_percentage) 
                     FROM allocations 
                     WHERE employee_id = r.id 
                     AND is_active = true 
                     AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)),
                    0
                ) as total_allocation,
                COALESCE(
                    (SELECT string_agg(p.project_name, ', ')
                     FROM allocations a
                     JOIN projects p ON a.project_id = p.id
                     WHERE a.employee_id = r.id 
                     AND a.is_active = true 
                     AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)),
                    'None'
                ) as current_projects
            FROM employees r
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE r.deleted_at IS NULL
            ORDER BY r.name ASC
        `;

        const result = await db.query(query);

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
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get employee report', { error: err.message });
        return error('Failed to get employee report', err);
    }
};

/**
 * Get exception allocation report (over-allocated or under-allocated resources)
 */
export const getExceptionReport = async (event) => {
    const log = logger.child({ handler: 'reports.getExceptionReport' });

    try {
        log.info('Getting exception report');

        const query = `
            WITH resource_allocations AS (
                SELECT 
                    employee_id,
                    SUM(allocation_percentage) as total_allocation
                FROM allocations
                WHERE is_active = true 
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                GROUP BY employee_id
            )
            SELECT 
                r.id,
                r.epf_no,
                r.name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                COALESCE(ra.total_allocation, 0) as total_allocation,
                CASE 
                    WHEN COALESCE(ra.total_allocation, 0) > 100 THEN 'Over-allocated'
                    WHEN COALESCE(ra.total_allocation, 0) < 100 AND COALESCE(ra.total_allocation, 0) > 0 THEN 'Under-allocated'
                    WHEN COALESCE(ra.total_allocation, 0) = 0 THEN 'Unallocated'
                    ELSE 'Normal'
                END as exception_type
            FROM employees r
            LEFT JOIN resource_allocations ra ON r.id = ra.employee_id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            AND (COALESCE(ra.total_allocation, 0) > 100 OR COALESCE(ra.total_allocation, 0) < 100)
            ORDER BY ra.total_allocation DESC NULLS LAST
        `;

        const result = await db.query(query);

        // Transform results with config resolution
        const data = result.rows.map(row => ({
            ...row,
            track: resolveConfigLabel(TRACKS, row.track_id),
            tier: resolveConfigLabel(TIERS, row.tier_id),
            tech_stack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id)
        }));

        // Categorize exceptions
        const overAllocated = data.filter(r => parseFloat(r.total_allocation) > 100);
        const underAllocated = data.filter(r => parseFloat(r.total_allocation) < 100 && parseFloat(r.total_allocation) > 0);
        const unallocated = data.filter(r => parseFloat(r.total_allocation) === 0);

        return success({
            data,
            summary: {
                total: data.length,
                overAllocated: overAllocated.length,
                underAllocated: underAllocated.length,
                unallocated: unallocated.length
            },
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get exception report', { error: err.message });
        return error('Failed to get exception report', err);
    }
};
