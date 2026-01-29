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
                WHERE is_active = true
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
            `),

            // Bench resources count
            db.query(`
                WITH resource_allocations AS (
                    SELECT resource_id, SUM(allocation_percentage) as total
                    FROM allocations
                    WHERE is_active = true AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                    GROUP BY resource_id
                )
                SELECT COUNT(*) as count
                FROM resources r
                LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
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
                WHERE is_active = true 
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
                r.date_of_joining,
                r.intern_classification,
                CASE WHEN r.date_of_joining IS NOT NULL 
                     THEN (CURRENT_DATE - r.date_of_joining::DATE)
                     ELSE NULL END as days_in_company
            FROM resources r
            LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.status = 'Active'
            AND (ra.total_allocation IS NULL OR ra.total_allocation < 100)
            AND r.deleted_at IS NULL
            ORDER BY available_capacity DESC, r.date_of_joining DESC
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
                AND a.is_active = true 
                AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE r.status = 'Active' AND r.deleted_at IS NULL
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
 * Returns all interns with their current projects, total intern count, and intern percentage
 * Supports filters: project_name, account_manager, track, tech_stack
 */
export const getInternReport = async (event) => {
    const log = logger.child({ handler: 'reports.getInternReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { project_name, account_manager, track, tech_stack } = queryParams;

        log.info('Getting intern report', { filters: queryParams });

        // Build WHERE clauses for all filters
        let resourceWhereClause = 'WHERE r.intern_classification IS NOT NULL AND r.status = \'Active\' AND r.deleted_at IS NULL';
        let allocationWhereClause = '';
        const params = [];
        let paramIndex = 1;

        // Track filter
        if (track && track !== 'All' && track !== '') {
            resourceWhereClause += ` AND t.name = $${paramIndex}`;
            params.push(track);
            paramIndex++;
        }

        // Tech Stack filter
        if (tech_stack && tech_stack !== 'All' && tech_stack !== '') {
            resourceWhereClause += ` AND r.tech_stack = $${paramIndex}`;
            params.push(tech_stack);
            paramIndex++;
        }

        // Project Name filter (applied to allocation join)
        if (project_name && project_name !== 'All' && project_name !== '') {
            allocationWhereClause += ` AND p.project_name = $${paramIndex}`;
            params.push(project_name);
            paramIndex++;
        }

        // Account Manager filter (applied to allocation join)
        if (account_manager && account_manager !== 'All' && account_manager !== '') {
            allocationWhereClause += ` AND am.name = $${paramIndex}`;
            params.push(account_manager);
            paramIndex++;
        }

        // Get total employee count (for percentage calculation) - no filters applied
        const totalEmployeesQuery = `
            SELECT COUNT(*) as total
            FROM resources
            WHERE status = 'Active'
            AND deleted_at IS NULL
        `;

        // Get total intern count - apply resource filters only
        // If project or account_manager filter is applied, count only interns with matching allocations
        const totalInternsQuery = project_name || account_manager
            ? `
                SELECT COUNT(DISTINCT r.id) as total
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                INNER JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN resources am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
            `
            : `
                SELECT COUNT(DISTINCT r.id) as total
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                ${resourceWhereClause}
            `;

        // Get intern details with their current projects
        // If project or account_manager filter is applied, use INNER JOIN to only show interns with matching allocations
        // Otherwise, use LEFT JOIN to show all interns including those with no projects
        const internDetailsQuery = project_name || account_manager
            ? `
                SELECT DISTINCT
                    r.id,
                    r.name as employee_name,
                    r.email,
                    d.name as designation,
                    t.name as track,
                    r.date_of_joining,
                    CASE WHEN r.date_of_joining IS NOT NULL 
                         THEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.date_of_joining::DATE)) 
                         ELSE NULL END as months_in_company,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.start_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.end_date IS NOT NULL THEN TO_CHAR(a.end_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
                    CASE 
                        WHEN p.project_type = 'Bench' THEN 'Bench'
                        WHEN p.billing_status = 'Non-Billing' THEN 'Non-Billing'
                        WHEN p.project_type = 'Training' THEN 'Training'
                        WHEN p.project_type = 'Presale' THEN 'Presale'
                        WHEN p.billing_status = 'Billing' THEN 'Billing'
                        ELSE 'Non-Billing'
                    END as billing_status,
                    COALESCE(a.billing_percentage, 0) as billing_percentage,
                    COALESCE(a.allocation_percentage, 0) as project_allocation,
                    CASE 
                        WHEN a.end_date IS NOT NULL THEN a.end_date - a.start_date
                        ELSE CURRENT_DATE - a.start_date
                    END as duration_days,
                    CASE WHEN a.is_active = true AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE) THEN 'Active' ELSE 'Inactive' END as status,
                    a.is_active
                FROM resources r
                LEFT JOIN designations d ON r.designation_id = d.id
                LEFT JOIN tracks t ON r.track_id = t.id
                INNER JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN resources am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
                ORDER BY r.name, p.project_name
            `
            : `
                SELECT DISTINCT
                    r.id,
                    r.name as employee_name,
                    r.email,
                    d.name as designation,
                    t.name as track,
                    r.date_of_joining,
                    CASE WHEN r.date_of_joining IS NOT NULL 
                         THEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.date_of_joining::DATE)) 
                         ELSE NULL END as months_in_company,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.start_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.end_date IS NOT NULL THEN TO_CHAR(a.end_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
                    CASE 
                        WHEN p.project_type = 'Bench' THEN 'Bench'
                        WHEN p.billing_status = 'Non-Billing' THEN 'Non-Billing'
                        WHEN p.project_type = 'Training' THEN 'Training'
                        WHEN p.project_type = 'Presale' THEN 'Presale'
                        WHEN p.billing_status = 'Billing' THEN 'Billing'
                        ELSE 'Non-Billing'
                    END as billing_status,
                    COALESCE(a.billing_percentage, 0) as billing_percentage,
                    COALESCE(a.allocation_percentage, 0) as project_allocation,
                    CASE 
                        WHEN a.end_date IS NOT NULL THEN a.end_date - a.start_date
                        ELSE CURRENT_DATE - a.start_date
                    END as duration_days,
                    CASE WHEN a.is_active = true AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE) THEN 'Active' ELSE 'Inactive' END as status,
                    a.is_active
                FROM resources r
                LEFT JOIN designations d ON r.designation_id = d.id
                LEFT JOIN tracks t ON r.track_id = t.id
                LEFT JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
                LEFT JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN resources am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
                ORDER BY r.name, p.project_name
            `;

        // Run queries in parallel
        const [totalEmployeesResult, totalInternsResult, internDetailsResult] = await Promise.all([
            db.query(totalEmployeesQuery),
            db.query(totalInternsQuery, params),
            db.query(internDetailsQuery, params)
        ]);

        const totalEmployees = parseInt(totalEmployeesResult.rows[0]?.total || 0);
        const totalInterns = parseInt(totalInternsResult.rows[0]?.total || 0);
        const internPercentage = totalEmployees > 0
            ? ((totalInterns / totalEmployees) * 100).toFixed(1)
            : '0.0';

        // Format intern details for table
        // Group by intern and collect all their projects
        const internMap = {};
        internDetailsResult.rows.forEach((row) => {
            const internId = row.id;
            if (!internMap[internId]) {
                internMap[internId] = {
                    id: internId,
                    employeeName: row.employee_name,
                    email: row.email,
                    designation: row.designation,
                    track: row.track,
                    dateOfJoining: row.date_of_joining,
                    monthsInCompany: row.months_in_company,
                    projects: []
                };
            }

            // Add project if exists
            if (row.project) {
                internMap[internId].projects.push({
                    project: row.project,
                    projectId: row.project_id,
                    allocatedDate: row.project_allocated_date,
                    deallocatedDate: row.project_deallocated_date,
                    billingStatus: row.billing_status,
                    billingPercentage: row.billing_percentage,
                    projectAllocation: row.project_allocation,
                    duration: row.duration_days,
                    status: row.status
                });
            }
        });

        // Convert to array format for table (one row per project allocation)
        const internData = [];
        Object.values(internMap).forEach((intern) => {
            if (intern.projects.length === 0) {
                // Intern with no projects - show as Bench
                internData.push({
                    key: `${intern.id}-no-project`,
                    employeeName: intern.employeeName,
                    project: 'Bench',
                    allocatedDate: '',
                    deallocatedDate: '',
                    billingStatus: 'Bench',
                    billingPercentage: '0.00%',
                    projectAllocation: '0.00%',
                    duration: 0,
                    status: 'Active'
                });
            } else {
                // Add one row per project
                intern.projects.forEach((project, index) => {
                    internData.push({
                        key: `${intern.id}-${project.projectId}-${index}`,
                        employeeName: intern.employeeName,
                        project: project.project,
                        allocatedDate: project.allocatedDate,
                        deallocatedDate: project.deallocatedDate || '',
                        billingStatus: project.billingStatus,
                        billingPercentage: project.billingPercentage ? `${parseFloat(project.billingPercentage).toFixed(2)}%` : '0.00%',
                        projectAllocation: project.projectAllocation ? `${parseFloat(project.projectAllocation).toFixed(2)}%` : '0.00%',
                        duration: project.duration || 0,
                        status: project.status
                    });
                });
            }
        });

        return success({
            summary: {
                totalInternCount: totalInterns,
                totalEmployees: totalEmployees,
                internPercentage: parseFloat(internPercentage)
            },
            data: internData,
            total: internData.length,
            filters: queryParams,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get intern report', { error: err.message, stack: err.stack });
        return error('Failed to get intern report', err);
    }
};

/**
 * Get list of all account managers
 */
export const getAccountManagers = async (event) => {
    const log = logger.child({ handler: 'reports.getAccountManagers' });

    try {
        log.info('Getting account managers list');

        const query = `
            SELECT 
                r.id,
                r.employee_id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                r.tier,
                r.tech_stack,
                r.is_account_manager,
                (SELECT COUNT(*) FROM projects p WHERE p.account_manager_id = r.id AND p.deleted_at IS NULL) as project_count,
                (SELECT COUNT(DISTINCT a.resource_id) 
                 FROM projects p 
                 JOIN allocations a ON p.id = a.project_id AND a.is_active = true
                 WHERE p.account_manager_id = r.id AND p.deleted_at IS NULL
                ) as resource_count
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.is_account_manager = true
            AND r.deleted_at IS NULL
            AND r.status = 'Active'
            ORDER BY r.name
        `;

        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get account managers', { error: err.message });
        return error('Failed to get account managers', err);
    }
};

/**
 * Get comprehensive account manager report with all data for dashboard
 * Supports filtering by account_manager_id or returns all data
 */
export const getAccountManagerReport = async (event) => {
    const log = logger.child({ handler: 'reports.getAccountManagerReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const {
            account_manager_id,
            project_id,
            project_status,
            allocation_status,
            client_id,
            billing_status,
            year,
            month,
            employee_status,
            start_date,
            end_date,
            track_id,
            page = 1,
            limit = 10
        } = queryParams;

        log.info('Getting account manager report', { filters: queryParams });

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build WHERE clauses for different queries
        let projectWhereClause = 'WHERE p.deleted_at IS NULL';
        let allocationWhereClause = 'WHERE a.deleted_at IS NULL';
        const projectParams = [];
        const allocationParams = [];
        let projectParamIndex = 1;
        let allocationParamIndex = 1;

        // Account Manager filter
        if (account_manager_id && account_manager_id !== 'all') {
            projectWhereClause += ` AND p.account_manager_id = $${projectParamIndex}`;
            projectParams.push(account_manager_id);
            projectParamIndex++;
        }

        // Project Status filter
        if (project_status && project_status !== 'All') {
            projectWhereClause += ` AND p.status = $${projectParamIndex}`;
            projectParams.push(project_status);
            projectParamIndex++;
        }

        // Client filter
        if (client_id && client_id !== 'all') {
            projectWhereClause += ` AND p.client_id = $${projectParamIndex}`;
            projectParams.push(client_id);
            projectParamIndex++;
        }

        // Billing Status filter for projects
        if (billing_status && billing_status !== 'All') {
            projectWhereClause += ` AND p.billing_status = $${projectParamIndex}`;
            projectParams.push(billing_status);
            projectParamIndex++;
        }

        // Date range filter for allocations
        if (start_date) {
            allocationWhereClause += ` AND (a.end_date IS NULL OR a.end_date >= $${allocationParamIndex})`;
            allocationParams.push(start_date);
            allocationParamIndex++;
        }

        if (end_date) {
            allocationWhereClause += ` AND a.start_date <= $${allocationParamIndex}`;
            allocationParams.push(end_date);
            allocationParamIndex++;
        }

        // Year/Month filter
        if (year) {
            const targetYear = parseInt(year);
            const targetMonth = month && month !== 'All' ? parseInt(month) : null;

            if (targetMonth) {
                const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
                const monthEnd = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];
                allocationWhereClause += ` AND a.start_date <= $${allocationParamIndex} AND (a.end_date IS NULL OR a.end_date >= $${allocationParamIndex + 1})`;
                allocationParams.push(monthEnd, monthStart);
                allocationParamIndex += 2;
            } else {
                allocationWhereClause += ` AND EXTRACT(YEAR FROM a.start_date) = $${allocationParamIndex}`;
                allocationParams.push(targetYear);
                allocationParamIndex++;
            }
        }

        // Allocation Status filter
        if (allocation_status && allocation_status !== 'All') {
            if (allocation_status === 'Active') {
                allocationWhereClause += ` AND a.is_active = true AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)`;
            } else if (allocation_status === 'Inactive') {
                allocationWhereClause += ` AND (a.is_active = false OR a.end_date < CURRENT_DATE)`;
            }
        }

        // Run all queries in parallel
        const [
            summaryResult,
            projectsResult,
            projectCountResult,
            allocationsResult,
            allocationCountResult,
            designationsResult,
            billingStatusChart,
            tierChart,
            trackChart,
            techStackChart
        ] = await Promise.all([
            // Summary statistics
            db.query(`
                SELECT 
                    COUNT(DISTINCT CASE WHEN p.billing_status = 'Billing' THEN r.id END) as billable_resources,
                    ROUND(AVG(a.allocation_percentage)::numeric, 1) as avg_allocation,
                    COUNT(DISTINCT CASE WHEN p.billing_status = 'Billing' THEN p.id END) as billable_count,
                    ROUND(AVG(CASE WHEN a.is_active = true THEN a.allocation_percentage ELSE NULL END)::numeric, 1) as avg_project_allocation,
                    ROUND(AVG(CASE WHEN p.billing_status = 'Billing' THEN a.billing_percentage ELSE NULL END)::numeric, 1) as avg_billing_percentage
                FROM projects p
                LEFT JOIN allocations a ON p.id = a.project_id AND a.is_active = true
                LEFT JOIN resources r ON a.resource_id = r.id AND r.deleted_at IS NULL
                ${projectWhereClause}
            `, projectParams),

            // Projects list with pagination
            db.query(`
                SELECT 
                    p.id,
                    p.project_name as project,
                    c.client_name as customer,
                    p.project_type,
                    p.status,
                    p.billing_status,
                    (SELECT COUNT(*) FROM allocations a WHERE a.project_id = p.id AND a.is_active = true) as team_size,
                    p.account_manager_id,
                    am.name as account_manager_name
                FROM projects p
                LEFT JOIN clients c ON p.client_id = c.id
                LEFT JOIN resources am ON p.account_manager_id = am.id
                ${projectWhereClause}
                ORDER BY p.project_name
                LIMIT $${projectParamIndex} OFFSET $${projectParamIndex + 1}
            `, [...projectParams, parseInt(limit), offset]),

            // Projects count
            db.query(`
                SELECT COUNT(*) as total
                FROM projects p
                ${projectWhereClause}
            `, projectParams),

            // Allocations list with pagination
            db.query(`
                SELECT 
                    a.id,
                    r.name as employee_name,
                    r.id as resource_id,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.start_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.end_date IS NOT NULL THEN TO_CHAR(a.end_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
                    p.billing_status,
                    a.billing_percentage,
                    a.allocation_percentage as project_allocation,
                    CASE 
                        WHEN a.end_date IS NOT NULL THEN a.end_date - a.start_date
                        ELSE CURRENT_DATE - a.start_date
                    END as duration_days,
                    CASE WHEN a.is_active = true AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE) THEN 'Active' ELSE 'Inactive' END as status,
                    a.is_active
                FROM allocations a
                JOIN resources r ON a.resource_id = r.id
                JOIN projects p ON a.project_id = p.id
                ${allocationWhereClause}
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $${allocationParamIndex}` : ''}
                ${employee_status && employee_status !== 'All' ? `AND r.status = $${allocationParamIndex + (account_manager_id && account_manager_id !== 'all' ? 1 : 0)}` : ''}
                ORDER BY a.start_date DESC
                LIMIT $${allocationParamIndex + (account_manager_id && account_manager_id !== 'all' ? 1 : 0) + (employee_status && employee_status !== 'All' ? 1 : 0)} 
                OFFSET $${allocationParamIndex + (account_manager_id && account_manager_id !== 'all' ? 1 : 0) + (employee_status && employee_status !== 'All' ? 1 : 0) + 1}
            `, [
                ...allocationParams,
                ...(account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : []),
                ...(employee_status && employee_status !== 'All' ? [employee_status] : []),
                parseInt(limit),
                offset
            ]),

            // Allocations count
            db.query(`
                SELECT COUNT(*) as total
                FROM allocations a
                JOIN projects p ON a.project_id = p.id
                ${allocationWhereClause}
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $${allocationParamIndex}` : ''}
            `, [
                ...allocationParams,
                ...(account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : [])
            ]),

            // By Designation list
            db.query(`
                SELECT DISTINCT
                    r.id,
                    r.name as employee_name,
                    t.name as track,
                    r.tech_stack,
                    r.tier
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                JOIN allocations a ON r.id = a.resource_id AND a.is_active = true
                JOIN projects p ON a.project_id = p.id
                WHERE r.deleted_at IS NULL AND r.status = 'Active'
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $1` : ''}
                ORDER BY r.name
            `, account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : []),

            // Chart: Allocations by Billing Status
            db.query(`
                SELECT 
                    CASE 
                        WHEN p.project_type = 'Bench' THEN 'Bench'
                        WHEN p.billing_status = 'Non-Billing' THEN 'Non-Billing'
                        WHEN p.project_type = 'Training' THEN 'Training'
                        WHEN p.project_type = 'Presale' THEN 'Presale'
                        ELSE 'Billing'
                    END as category,
                    COUNT(*) as count
                FROM allocations a
                JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $1` : ''}
                GROUP BY category
                ORDER BY count DESC
            `, account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : []),

            // Chart: Employees by Tier
            db.query(`
                SELECT 
                    COALESCE(r.tier, 'Unassigned') as tier,
                    COUNT(DISTINCT r.id) as count
                FROM resources r
                JOIN allocations a ON r.id = a.resource_id AND a.is_active = true
                JOIN projects p ON a.project_id = p.id
                WHERE r.deleted_at IS NULL AND r.status = 'Active'
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $1` : ''}
                GROUP BY r.tier
                ORDER BY 
                    CASE r.tier 
                        WHEN 'Synergy' THEN 1 
                        WHEN 'Tier - 1' THEN 2 
                        WHEN 'Tier - 2' THEN 3 
                        WHEN 'Tier - 3' THEN 4 
                        WHEN 'Tier - 4' THEN 5 
                        WHEN 'Intern' THEN 6 
                        ELSE 7 
                    END
            `, account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : []),

            // Chart: Employees by Track
            db.query(`
                SELECT 
                    COALESCE(t.name, 'Unassigned') as track,
                    COUNT(DISTINCT r.id) as count
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                JOIN allocations a ON r.id = a.resource_id AND a.is_active = true
                JOIN projects p ON a.project_id = p.id
                WHERE r.deleted_at IS NULL AND r.status = 'Active'
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $1` : ''}
                GROUP BY t.name
                ORDER BY count DESC
            `, account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : []),

            // Chart: Employees by Tech Stack
            db.query(`
                SELECT 
                    COALESCE(r.tech_stack, 'Unassigned') as tech_stack,
                    COUNT(DISTINCT r.id) as count
                FROM resources r
                JOIN allocations a ON r.id = a.resource_id AND a.is_active = true
                JOIN projects p ON a.project_id = p.id
                WHERE r.deleted_at IS NULL AND r.status = 'Active'
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $1` : ''}
                GROUP BY r.tech_stack
                ORDER BY count DESC
            `, account_manager_id && account_manager_id !== 'all' ? [account_manager_id] : [])
        ]);

        // Format summary
        const summary = {
            billableResources: parseInt(summaryResult.rows[0]?.billable_resources || 0),
            allocatedCount: parseFloat(summaryResult.rows[0]?.avg_allocation || 0),
            billableCount: parseInt(summaryResult.rows[0]?.billable_count || 0),
            averageProjectAllocation: parseFloat(summaryResult.rows[0]?.avg_project_allocation || 0),
            averageBillingPercentage: parseFloat(summaryResult.rows[0]?.avg_billing_percentage || 0)
        };

        // Format charts
        const charts = {
            allocationsByBillingStatus: billingStatusChart.rows.reduce((acc, row) => {
                acc[row.category] = parseInt(row.count);
                return acc;
            }, {}),
            employeesByTier: tierChart.rows.reduce((acc, row) => {
                acc[row.tier] = parseInt(row.count);
                return acc;
            }, {}),
            employeesByTrack: trackChart.rows.reduce((acc, row) => {
                acc[row.track] = parseInt(row.count);
                return acc;
            }, {}),
            employeesByTechStack: techStackChart.rows.reduce((acc, row) => {
                acc[row.tech_stack] = parseInt(row.count);
                return acc;
            }, {})
        };

        return success({
            summary,
            charts,
            projects: {
                data: projectsResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(projectCountResult.rows[0]?.total || 0),
                    totalPages: Math.ceil(parseInt(projectCountResult.rows[0]?.total || 0) / parseInt(limit))
                }
            },
            allocations: {
                data: allocationsResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(allocationCountResult.rows[0]?.total || 0),
                    totalPages: Math.ceil(parseInt(allocationCountResult.rows[0]?.total || 0) / parseInt(limit))
                }
            },
            designations: {
                data: designationsResult.rows
            },
            filters: queryParams,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get account manager report', { error: err.message, stack: err.stack });
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
                     AND (end_date IS NULL OR end_date >= CURRENT_DATE)),
                    0
                ) as total_allocation,
                COALESCE(
                    (SELECT string_agg(p.project_name, ', ')
                     FROM allocations a
                     JOIN projects p ON a.project_id = p.id
                     WHERE a.resource_id = r.id 
                     AND a.is_active = true 
                     AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)),
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
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
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

/**
 * Get non-billing resources report
 */
export const getNonBillingReport = async (event) => {
    const log = logger.child({ handler: 'reports.getNonBillingReport' });

    try {
        log.info('Getting non-billing report');

        // Non-billing resources are those allocated to non-billable projects
        const query = `
            SELECT 
                r.id,
                r.employee_id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                p.project_name,
                a.allocation_percentage,
                a.billing_percentage,
                a.start_date,
                a.end_date
            FROM allocations a
            JOIN resources r ON a.resource_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE a.is_active = true
            AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            AND p.is_billable = false
            AND r.deleted_at IS NULL
            ORDER BY r.name ASC
        `;

        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get non-billing report', { error: err.message });
        return error('Failed to get non-billing report', err);
    }
};

/**
 * Get pre-sale activities report
 */
export const getPreSaleReport = async (event) => {
    const log = logger.child({ handler: 'reports.getPreSaleReport' });

    try {
        log.info('Getting pre-sale report');

        const query = `
            SELECT 
                r.id,
                r.employee_id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                p.project_name,
                p.project_code,
                c.client_name,
                a.allocation_percentage,
                a.start_date,
                a.end_date,
                a.notes
            FROM allocations a
            JOIN resources r ON a.resource_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE a.is_active = true
            AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            AND p.project_type = 'Presale'
            AND r.deleted_at IS NULL
            ORDER BY p.project_name, r.name ASC
        `;

        const result = await db.query(query);

        // Group by project
        const projectGroups = {};
        result.rows.forEach(row => {
            if (!projectGroups[row.project_name]) {
                projectGroups[row.project_name] = {
                    project_name: row.project_name,
                    project_code: row.project_code,
                    client_name: row.client_name,
                    resources: []
                };
            }
            projectGroups[row.project_name].resources.push({
                id: row.id,
                employee_id: row.employee_id,
                name: row.name,
                designation: row.designation,
                track: row.track,
                allocation_percentage: row.allocation_percentage,
                start_date: row.start_date,
                end_date: row.end_date
            });
        });

        return success({
            data: result.rows,
            groupedByProject: Object.values(projectGroups),
            total: result.rows.length,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get pre-sale report', { error: err.message });
        return error('Failed to get pre-sale report', err);
    }
};

/**
 * Get tier breakdown report
 * Returns resources grouped by tier with allocation details
 * Supports filters: project_name, tier, account_manager, track, tech_stack
 */
export const getTierBreakdownReport = async (event) => {
    const log = logger.child({ handler: 'reports.getTierBreakdownReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { tier, project_name, account_manager, track, tech_stack } = queryParams;

        log.info('Getting tier breakdown report', { filters: queryParams });

        // Build WHERE clauses for all filters
        let resourceWhereClause = 'WHERE r.status = \'Active\' AND r.deleted_at IS NULL';
        let allocationWhereClause = '';
        const params = [];
        let paramIndex = 1;

        // Map frontend tier values to database values
        const tierMapping = {
            '0': 'Synergy',
            '1': 'Tier - 1',
            '2': 'Tier - 2',
            '3': 'Tier - 3',
            '4': 'Tier - 4',
            '5': 'Tier - 5',
            '99': 'Intern'
        };

        // Tier filter
        if (tier && tier !== 'All' && tier !== '') {
            const dbTier = tierMapping[tier] || tier;
            resourceWhereClause += ` AND r.tier = $${paramIndex}`;
            params.push(dbTier);
            paramIndex++;
        }

        // Track filter
        if (track && track !== 'All' && track !== '') {
            resourceWhereClause += ` AND t.name = $${paramIndex}`;
            params.push(track);
            paramIndex++;
        }

        // Tech Stack filter
        if (tech_stack && tech_stack !== 'All' && tech_stack !== '') {
            resourceWhereClause += ` AND r.tech_stack = $${paramIndex}`;
            params.push(tech_stack);
            paramIndex++;
        }

        // Project Name filter (applied to allocation join)
        if (project_name && project_name !== 'All' && project_name !== '') {
            allocationWhereClause += ` AND p.project_name = $${paramIndex}`;
            params.push(project_name);
            paramIndex++;
        }

        // Account Manager filter (applied to allocation join)
        if (account_manager && account_manager !== 'All' && account_manager !== '') {
            allocationWhereClause += ` AND am.name = $${paramIndex}`;
            params.push(account_manager);
            paramIndex++;
        }

        // Get tier distribution (for chart)
        // If project or account_manager filter is applied, we need to join with allocations
        // Use INNER JOIN to only count resources that have matching allocations
        const tierDistributionQuery = project_name || account_manager
            ? `
                SELECT 
                    COALESCE(r.tier, 'Unassigned') as tier,
                    COUNT(DISTINCT r.id) as count
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                INNER JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN resources am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
                GROUP BY r.tier
                ORDER BY 
                    CASE r.tier 
                        WHEN 'Synergy' THEN 0
                        WHEN 'Tier - 1' THEN 1
                        WHEN 'Tier - 2' THEN 2
                        WHEN 'Tier - 3' THEN 3
                        WHEN 'Tier - 4' THEN 4
                        WHEN 'Tier - 5' THEN 5
                        WHEN 'Intern' THEN 99
                        ELSE 999
                    END
            `
            : `
                SELECT 
                    COALESCE(r.tier, 'Unassigned') as tier,
                    COUNT(DISTINCT r.id) as count
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                ${resourceWhereClause}
                GROUP BY r.tier
                ORDER BY 
                    CASE r.tier 
                        WHEN 'Synergy' THEN 0
                        WHEN 'Tier - 1' THEN 1
                        WHEN 'Tier - 2' THEN 2
                        WHEN 'Tier - 3' THEN 3
                        WHEN 'Tier - 4' THEN 4
                        WHEN 'Tier - 5' THEN 5
                        WHEN 'Intern' THEN 99
                        ELSE 999
                    END
            `;

        // Get employee details with allocation info (for table)
        const employeeDetailsQuery = `
            SELECT DISTINCT
                r.id,
                r.name as employee_name,
                r.email,
                COALESCE(r.tier, 'Unassigned') as tier,
                d.name as designation,
                t.name as track,
                p.project_name as project,
                CASE 
                    WHEN p.project_type = 'Bench' THEN 'Bench'
                    WHEN p.billing_status = 'Non-Billing' THEN 'Non-Billing'
                    WHEN p.project_type = 'Training' THEN 'Training'
                    WHEN p.project_type = 'Presale' THEN 'Presale'
                    WHEN p.billing_status = 'Billing' THEN 'Billing'
                    ELSE 'Non-Billing'
                END as billing_status,
                COALESCE(a.billing_percentage, 0) as billing_percentage,
                COALESCE(a.allocation_percentage, 0) as project_allocation
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            LEFT JOIN allocations a ON r.id = a.resource_id 
                AND a.is_active = true 
                AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            LEFT JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
            LEFT JOIN resources am ON p.account_manager_id = am.id
            ${resourceWhereClause}
            ${allocationWhereClause}
            ORDER BY r.tier, r.name, p.project_name
        `;

        // Get total employee count
        // If project or account_manager filter is applied, count distinct resources with matching allocations
        const totalCountQuery = project_name || account_manager
            ? `
                SELECT COUNT(DISTINCT r.id) as total
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                INNER JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN resources am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
            `
            : `
                SELECT COUNT(*) as total
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                ${resourceWhereClause}
            `;

        // Run queries in parallel
        const [tierDistribution, employeeDetails, totalCount] = await Promise.all([
            db.query(tierDistributionQuery, params),
            db.query(employeeDetailsQuery, params),
            db.query(totalCountQuery, params)
        ]);

        // Format tier distribution for chart (map database values to frontend format)
        const reverseTierMapping = {
            'Synergy': '0',
            'Tier - 1': '1',
            'Tier - 2': '2',
            'Tier - 3': '3',
            'Tier - 4': '4',
            'Tier - 5': '5',
            'Intern': '99',
            'Unassigned': 'Unassigned'
        };

        const tierData = tierDistribution.rows.map(row => ({
            tier: reverseTierMapping[row.tier] || row.tier,
            count: parseInt(row.count)
        }));

        // Format employee details for table
        const employeeData = employeeDetails.rows.map((row, index) => ({
            key: `${row.id}-${row.project || 'no-project'}-${index}`,
            employeeName: row.employee_name,
            project: row.project || 'Bench',
            billingStatus: row.billing_status || 'Non-Billing',
            billingPercentage: row.billing_percentage ? `${parseFloat(row.billing_percentage).toFixed(2)}%` : '0.00%',
            projectAllocation: row.project_allocation ? `${parseFloat(row.project_allocation).toFixed(2)}%` : '0.00%',
            tier: row.tier,
            designation: row.designation,
            track: row.track
        }));

        return success({
            summary: {
                totalEmployees: parseInt(totalCount.rows[0]?.total || 0)
            },
            tierDistribution: tierData,
            employeeDetails: employeeData,
            filters: queryParams,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get tier breakdown report', { error: err.message, stack: err.stack });
        return error('Failed to get tier breakdown report', err);
    }
};
