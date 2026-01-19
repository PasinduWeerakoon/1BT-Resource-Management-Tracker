/**
 * Reports Handler
 * Lambda handlers for analytics and reports
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

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
                FROM resources
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
                    COUNT(DISTINCT resource_id) as allocated_resources,
                    COUNT(*) as total_allocations,
                    AVG(allocation_percentage) as avg_allocation
                FROM allocations
                WHERE status = 'ACTIVE'
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
            `),

            // Bench resources count
            db.query(`
                WITH resource_allocations AS (
                    SELECT resource_id, SUM(allocation_percentage) as total
                    FROM allocations
                    WHERE status = 'ACTIVE' AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                    GROUP BY resource_id
                )
                SELECT COUNT(*) as count
                FROM resources r
                LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
                WHERE r.status = 'ACTIVE' AND r.deleted_at IS NULL
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
            whereClause += ` AND (a.end_date IS NULL OR a.end_date >= $${paramIndex})`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereClause += ` AND a.start_date <= $${paramIndex}`;
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
                a.start_date,
                a.end_date,
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
 * Get bench report - resources with available capacity
 */
export const getBenchReport = async (event) => {
    const log = logger.child({ handler: 'reports.getBenchReport' });

    try {
        log.info('Getting bench report');

        const query = `
            WITH resource_allocations AS (
                SELECT 
                    resource_id,
                    SUM(allocation_percentage) as total_allocation
                FROM allocations
                WHERE status = 'ACTIVE' 
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                GROUP BY resource_id
            )
            SELECT 
                r.id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                COALESCE(ra.total_allocation, 0) as current_allocation,
                (100 - COALESCE(ra.total_allocation, 0)) as available_capacity,
                r.join_date,
                r.is_intern,
                EXTRACT(DAY FROM (CURRENT_DATE - r.join_date)) as days_in_company
            FROM resources r
            LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.status = 'ACTIVE'
            AND (ra.total_allocation IS NULL OR ra.total_allocation < 100)
            AND r.deleted_at IS NULL
            ORDER BY available_capacity DESC, r.join_date DESC
        `;

        const result = await db.query(query);

        // Categorize by capacity
        const fullBench = result.rows.filter(r => r.current_allocation === 0);
        const partialBench = result.rows.filter(r => r.current_allocation > 0 && r.current_allocation < 100);

        return success({
            data: result.rows,
            summary: {
                totalOnBench: result.rows.length,
                fullBench: fullBench.length,
                partialBench: partialBench.length,
                avgAvailableCapacity: result.rows.length > 0
                    ? Math.round(result.rows.reduce((sum, r) => sum + parseInt(r.available_capacity), 0) / result.rows.length)
                    : 0
            },
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get bench report', { error: err.message });
        return error('Failed to get bench report', err);
    }
};

/**
 * Get utilization report by track
 */
export const getUtilizationReport = async (event) => {
    const log = logger.child({ handler: 'reports.getUtilizationReport' });

    try {
        log.info('Getting utilization report');

        const query = `
            SELECT 
                t.name as track,
                COUNT(DISTINCT r.id) as total_resources,
                SUM(CASE WHEN p.is_billable = true THEN a.allocation_percentage ELSE 0 END) as billable_allocation_sum,
                SUM(CASE WHEN p.is_billable = false OR p.is_billable IS NULL THEN a.allocation_percentage ELSE 0 END) as non_billable_allocation_sum,
                COALESCE(SUM(a.allocation_percentage), 0) as total_allocated_sum
            FROM resources r
            LEFT JOIN tracks t ON r.track_id = t.id
            LEFT JOIN allocations a ON r.id = a.resource_id 
                AND a.status = 'ACTIVE' 
                AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE r.status = 'ACTIVE' AND r.deleted_at IS NULL
            GROUP BY t.name
            ORDER BY t.name
        `;

        const result = await db.query(query);

        // Calculate percentages
        const data = result.rows.map(row => {
            const totalCapacity = parseInt(row.total_resources) * 100;
            return {
                track: row.track || 'Unassigned',
                totalResources: parseInt(row.total_resources),
                billableUtilization: totalCapacity
                    ? Math.round((parseInt(row.billable_allocation_sum) / totalCapacity) * 100)
                    : 0,
                nonBillableUtilization: totalCapacity
                    ? Math.round((parseInt(row.non_billable_allocation_sum) / totalCapacity) * 100)
                    : 0,
                overallUtilization: totalCapacity
                    ? Math.round((parseInt(row.total_allocated_sum) / totalCapacity) * 100)
                    : 0
            };
        });

        // Calculate totals
        const totalResources = data.reduce((sum, r) => sum + r.totalResources, 0);
        const avgUtilization = data.length > 0
            ? Math.round(data.reduce((sum, r) => sum + r.overallUtilization, 0) / data.length)
            : 0;

        return success({
            data,
            summary: {
                totalResources,
                avgUtilization,
                trackCount: data.length
            },
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get utilization report', { error: err.message });
        return error('Failed to get utilization report', err);
    }
};

/**
 * Get intern report
 */
export const getInternReport = async (event) => {
    const log = logger.child({ handler: 'reports.getInternReport' });

    try {
        log.info('Getting intern report');

        const query = `
            SELECT 
                r.id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                r.join_date,
                EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.join_date)) as months_in_company,
                COALESCE(
                    (SELECT SUM(allocation_percentage) 
                     FROM allocations 
                     WHERE resource_id = r.id 
                     AND status = 'ACTIVE' 
                     AND (end_date IS NULL OR end_date >= CURRENT_DATE)),
                    0
                ) as current_allocation
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.is_intern = true
            AND r.status = 'ACTIVE'
            AND r.deleted_at IS NULL
            ORDER BY r.join_date DESC
        `;

        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get intern report', { error: err.message });
        return error('Failed to get intern report', err);
    }
};

/**
 * Get account manager report
 */
export const getAccountManagerReport = async (event) => {
    const log = logger.child({ handler: 'reports.getAccountManagerReport' });

    try {
        log.info('Getting account manager report');

        const query = `
            SELECT 
                p.account_manager,
                COUNT(DISTINCT p.id) as project_count,
                COUNT(DISTINCT a.resource_id) as resource_count,
                SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_projects,
                SUM(CASE WHEN p.is_billable = true THEN 1 ELSE 0 END) as billable_projects
            FROM projects p
            LEFT JOIN allocations a ON p.id = a.project_id AND a.status = 'ACTIVE'
            WHERE p.deleted_at IS NULL
            AND p.account_manager IS NOT NULL
            GROUP BY p.account_manager
            ORDER BY project_count DESC
        `;

        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get account manager report', { error: err.message });
        return error('Failed to get account manager report', err);
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
                a.start_date,
                a.end_date
            FROM allocations a
            JOIN resources r ON a.resource_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE a.start_date <= $2
            AND (a.end_date IS NULL OR a.end_date >= $1)
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
