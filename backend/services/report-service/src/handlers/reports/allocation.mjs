/**
 * Allocation Reports
 * 
 * Handlers for allocation-related reports:
 * - getAllocationReport: General allocation report with filters
 * - getMonthlyAllocationReport: Monthly allocation breakdown
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

/**
 * Get allocation report with filters
 */
export const getAllocationReport = async (event) => {
    const log = logger.child({ handler: 'reports.getAllocationReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { start_date, end_date, project_type, client_id } = queryParams;

        log.info('Getting allocation report', { filters: queryParams });

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (project_type) {
            whereClause += ` AND p.project_type = $${paramIndex}`;
            params.push(project_type);
            paramIndex++;
        }

        if (client_id) {
            whereClause += ` AND p.client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }

        if (start_date) {
            whereClause += ` AND (a.deallocated_date IS NULL OR a.deallocated_date >= $${paramIndex})`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereClause += ` AND a.allocated_date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        const query = `
            SELECT 
                p.project_name,
                p.project_type,
                c.client_name,
                r.name as resource_name,
                r.email as resource_email,
                d.name as designation_name,
                t.name as track_name,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.status
            FROM allocations a
            JOIN projects p ON a.project_id = p.id
            JOIN resources r ON a.resource_id = r.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            ${whereClause}
            ORDER BY p.project_name, r.name
        `;

        const result = await db.query(query, params);

        return success({
            data: result.rows,
            total: result.rows.length,
            filters: queryParams,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get allocation report', { error: err.message });
        return error('Failed to get allocation report', err);
    }
};

/**
 * Get monthly allocation report
 */
export const getMonthlyAllocationReport = async (event) => {
    const log = logger.child({ handler: 'reports.getMonthlyAllocationReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { year, month } = queryParams;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

        log.info('Getting monthly allocation report', { year: targetYear, month: targetMonth });

        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

        const query = `
            SELECT 
                r.name as resource_name,
                r.email,
                d.name as designation,
                t.name as track,
                p.project_name,
                c.client_name,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date
            FROM allocations a
            JOIN resources r ON a.resource_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE a.allocated_date <= $2
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= $1)
            AND r.deleted_at IS NULL
            ORDER BY r.name, p.project_name
        `;

        const result = await db.query(query, [startDate, endDate]);

        return success({
            data: result.rows,
            total: result.rows.length,
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
