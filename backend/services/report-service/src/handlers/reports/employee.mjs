/**
 * Employee Reports
 * 
 * Handlers for employee-related reports:
 * - getEmployeeReport: All employees with allocation details
 * - getExceptionReport: Over/under allocated resources
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

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
                r.employee_id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                r.status,
                r.date_of_joining,
                COALESCE(
                    (SELECT SUM(allocation_percentage) 
                     FROM allocations 
                     WHERE resource_id = r.id 
                     AND is_active = true 
                     AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)),
                    0
                ) as total_allocation,
                COALESCE(
                    (SELECT string_agg(p.project_name, ', ')
                     FROM allocations a
                     JOIN projects p ON a.project_id = p.id
                     WHERE a.resource_id = r.id 
                     AND a.is_active = true 
                     AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)),
                    'None'
                ) as current_projects
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.deleted_at IS NULL
            ORDER BY r.name ASC
        `;

        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length,
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
                    resource_id,
                    SUM(allocation_percentage) as total_allocation
                FROM allocations
                WHERE is_active = true 
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                GROUP BY resource_id
            )
            SELECT 
                r.id,
                r.employee_id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                COALESCE(ra.total_allocation, 0) as total_allocation,
                CASE 
                    WHEN COALESCE(ra.total_allocation, 0) > 100 THEN 'Over-allocated'
                    WHEN COALESCE(ra.total_allocation, 0) < 100 AND COALESCE(ra.total_allocation, 0) > 0 THEN 'Under-allocated'
                    WHEN COALESCE(ra.total_allocation, 0) = 0 THEN 'Unallocated'
                    ELSE 'Normal'
                END as exception_type
            FROM resources r
            LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            AND (COALESCE(ra.total_allocation, 0) > 100 OR COALESCE(ra.total_allocation, 0) < 100)
            ORDER BY ra.total_allocation DESC NULLS LAST
        `;

        const result = await db.query(query);

        // Categorize exceptions
        const overAllocated = result.rows.filter(r => parseFloat(r.total_allocation) > 100);
        const underAllocated = result.rows.filter(r => parseFloat(r.total_allocation) < 100 && parseFloat(r.total_allocation) > 0);
        const unallocated = result.rows.filter(r => parseFloat(r.total_allocation) === 0);

        return success({
            data: result.rows,
            summary: {
                total: result.rows.length,
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
