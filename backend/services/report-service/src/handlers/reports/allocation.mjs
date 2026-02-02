/**
 * Allocation Reports
 * 
 * Handlers for allocation-related reports:
 * - getAllocationReport: General allocation report with filters
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
 * Get allocation report with filters
 */
export const getAllocationReport = async (event) => {
    const log = logger.child({ handler: 'reports.getAllocationReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { start_date, end_date, project_type_id, client_id } = queryParams;

        log.info('Getting allocation report', { filters: queryParams });

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (project_type_id) {
            whereClause += ` AND p.project_type_id = $${paramIndex}`;
            params.push(project_type_id);
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
                pt.name as project_type,
                c.client_name,
                r.name as resource_name,
                r.email as resource_email,
                d.name as designation_name,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.is_active
            FROM allocations a
            JOIN projects p ON a.project_id = p.id
            JOIN employees r ON a.employee_id = r.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN project_types pt ON p.project_type_id = pt.id
            ${whereClause}
            ORDER BY p.project_name, r.name
        `;

        const result = await db.query(query, params);

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
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                p.project_name,
                c.client_name,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE a.allocated_date <= $2
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= $1)
            AND r.deleted_at IS NULL
            ORDER BY r.name, p.project_name
        `;

        const result = await db.query(query, [startDate, endDate]);

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
