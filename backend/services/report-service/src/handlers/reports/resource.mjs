/**
 * Resource Reports
 * 
 * Handlers for resource-related reports:
 * - getBenchReport: Resources with available capacity
 * - getUtilizationReport: Utilization by track
 * - getInternReport: Intern resources report
 * - getExternalConsultantsReport: External consultants report
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

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
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                GROUP BY resource_id
            ),
            bench_allocations AS (
                SELECT 
                    a.resource_id,
                    a.allocation_percentage as bench_allocation
                FROM allocations a
                INNER JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                AND p.is_bench_project = true
                AND p.deleted_at IS NULL
            )
            SELECT 
                r.id,
                r.name,
                r.email,
                d.name as designation,
                t.name as track,
                COALESCE(ra.total_allocation, 0) as current_allocation,
                (100 - COALESCE(ra.total_allocation, 0)) as available_capacity,
                COALESCE(ba.bench_allocation, 0) as bench_allocation_percentage,
                r.date_of_joining,
                r.intern_classification,
                CASE WHEN r.date_of_joining IS NOT NULL 
                     THEN (CURRENT_DATE - r.date_of_joining::DATE)
                     ELSE NULL END as days_in_company
            FROM resources r
            LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            LEFT JOIN bench_allocations ba ON r.id = ba.resource_id
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
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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
        const totalInternsQuery = project_name || account_manager
            ? `
                SELECT COUNT(DISTINCT r.id) as total
                FROM resources r
                LEFT JOIN tracks t ON r.track_id = t.id
                INNER JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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
        const internDetailsQuery = project_name || account_manager
            ? `
                SELECT DISTINCT
                    r.id,
                    r.name as employee_name,
                    r.email,
                    d.name as designation,
                    t.name as track,
                    r.tech_stack,
                    r.date_of_joining,
                    CASE WHEN r.date_of_joining IS NOT NULL 
                         THEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.date_of_joining::DATE)) 
                         ELSE NULL END as months_in_company,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.allocated_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.deallocated_date IS NOT NULL THEN TO_CHAR(a.deallocated_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
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
                        WHEN a.deallocated_date IS NOT NULL THEN a.deallocated_date - a.allocated_date
                        ELSE CURRENT_DATE - a.allocated_date
                    END as duration_days,
                    CASE WHEN a.is_active = true AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE) THEN 'Active' ELSE 'Inactive' END as status,
                    a.is_active
                FROM resources r
                LEFT JOIN designations d ON r.designation_id = d.id
                LEFT JOIN tracks t ON r.track_id = t.id
                INNER JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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
                    r.tech_stack,
                    r.date_of_joining,
                    CASE WHEN r.date_of_joining IS NOT NULL 
                         THEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.date_of_joining::DATE)) 
                         ELSE NULL END as months_in_company,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.allocated_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.deallocated_date IS NOT NULL THEN TO_CHAR(a.deallocated_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
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
                        WHEN a.deallocated_date IS NOT NULL THEN a.deallocated_date - a.allocated_date
                        ELSE CURRENT_DATE - a.allocated_date
                    END as duration_days,
                    CASE WHEN a.is_active = true AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE) THEN 'Active' ELSE 'Inactive' END as status,
                    a.is_active
                FROM resources r
                LEFT JOIN designations d ON r.designation_id = d.id
                LEFT JOIN tracks t ON r.track_id = t.id
                LEFT JOIN allocations a ON r.id = a.resource_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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

        // Format intern details - group by intern and collect all their projects
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
                    techStack: row.tech_stack,
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
                    techStack: intern.techStack,
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
                        techStack: intern.techStack,
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
 * Get External Consultants Report
 * Returns comprehensive report of all external consultant resources
 */
export const getExternalConsultantsReport = async (event) => {
    const log = logger.child({ handler: 'reports.externalConsultants' });
    log.info('External consultants report handler');

    try {
        // Extract query parameters
        const queryParams = event.queryStringParameters || {};
        const {
            track_id,
            tech_stack,
            project_id,
            project_name,
            account_manager,
            start_date,
            end_date
        } = queryParams;

        // Base query for external consultants with their current allocations
        let query = `
            SELECT 
                r.id as resource_id,
                r.name as consultant_name,
                r.email,
                t.name as track,
                r.tech_stack,
                d.name as designation,
                p.id as project_id,
                p.project_name,
                p.account_manager_id,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.is_active,
                CASE 
                    WHEN p.project_type = 'Client' THEN 'Billing'
                    ELSE 'Non-Billing'
                END as billing_status
            FROM resources r
            LEFT JOIN tracks t ON r.track_id = t.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN allocations a ON r.id = a.resource_id AND a.is_active = true
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE r.is_external_consultant = true
                AND r.status = 'Active'
        `;

        const params = [];
        let paramCount = 0;

        // Apply filters
        if (track_id) {
            paramCount++;
            query += ` AND r.track_id = $${paramCount}`;
            params.push(track_id);
        }

        if (tech_stack) {
            paramCount++;
            query += ` AND r.tech_stack ILIKE $${paramCount}`;
            params.push(`%${tech_stack}%`);
        }

        if (project_id) {
            paramCount++;
            query += ` AND p.id = $${paramCount}`;
            params.push(project_id);
        }

        if (project_name) {
            paramCount++;
            query += ` AND p.project_name ILIKE $${paramCount}`;
            params.push(`%${project_name}%`);
        }

        if (account_manager) {
            paramCount++;
            query += ` AND p.account_manager_id = $${paramCount}`;
            params.push(account_manager);
        }

        if (start_date) {
            paramCount++;
            query += ` AND (a.deallocated_date >= $${paramCount} OR a.deallocated_date IS NULL)`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND a.allocated_date <= $${paramCount}`;
            params.push(end_date);
        }

        query += ` ORDER BY consultant_name, COALESCE(project_name, 'Unallocated')`;

        // Execute main query
        log.info('Executing query', { queryPreview: query.substring(0, 500), paramCount: params.length });
        const consultantsResult = await db.query(query, params);

        // Calculate summary statistics
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT r.id) as total_consultants,
                COUNT(DISTINCT CASE WHEN p.project_type = 'Client' THEN r.id END) as billing_consultants,
                COUNT(DISTINCT CASE WHEN p.project_type != 'Client' OR p.id IS NULL THEN r.id END) as non_billing_consultants,
                COALESCE(SUM(CASE WHEN p.project_type = 'Client' THEN a.allocation_percentage ELSE 0 END), 0) as total_billing_allocation,
                COALESCE(SUM(CASE WHEN p.project_type != 'Client' THEN a.allocation_percentage ELSE 0 END), 0) as total_non_billing_allocation
            FROM resources r
            LEFT JOIN allocations a ON r.id = a.resource_id AND a.is_active = true
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE r.is_external_consultant = true
                AND r.status = 'Active'
        `;

        const summaryResult = await db.query(summaryQuery + (params.length > 0 ? ' AND 1=1' : ''), []);

        // Group data by project for the byProject table
        const byProjectMap = new Map();
        const byAllocationData = [];

        consultantsResult.rows.forEach(row => {
            // Add to allocation-level data
            byAllocationData.push({
                key: `${row.resource_id}-${row.project_id || 'bench'}`,
                consultantName: row.consultant_name,
                email: row.email,
                designation: row.designation,
                track: row.track,
                techStack: row.tech_stack,
                project: row.project_name || 'Bench',
                accountManager: row.account_manager || 'N/A',
                allocationPercentage: row.allocation_percentage ? `${parseFloat(row.allocation_percentage).toFixed(2)}%` : '0.00%',
                startDate: row.allocated_date,
                endDate: row.deallocated_date,
                billingStatus: row.billing_status || 'Non-Billing'
            });

            // Aggregate by project
            if (row.project_id) {
                if (!byProjectMap.has(row.project_id)) {
                    byProjectMap.set(row.project_id, {
                        key: row.project_id,
                        projectName: row.project_name,
                        accountManager: row.account_manager,
                        consultantCount: 0,
                        totalAllocation: 0,
                        billingStatus: row.billing_status,
                        consultants: []
                    });
                }
                const projectData = byProjectMap.get(row.project_id);
                projectData.consultantCount++;
                projectData.totalAllocation += parseFloat(row.allocation_percentage || 0);
                projectData.consultants.push(row.consultant_name);
            }
        });

        // Convert project map to array and format
        const byProjectData = Array.from(byProjectMap.values()).map(p => ({
            ...p,
            totalAllocation: `${p.totalAllocation.toFixed(2)}%`,
            consultants: p.consultants.join(', ')
        }));

        // Chart data - consultants by track
        const trackQuery = `
            SELECT 
                t.name as track,
                COUNT(DISTINCT r.id) as count
            FROM resources r
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.is_external_consultant = true
                AND r.status = 'Active'
            GROUP BY t.name
            ORDER BY count DESC
        `;

        const trackResult = await db.query(trackQuery);
        const trackDistribution = trackResult.rows.map(row => ({
            track: row.track || 'Unassigned',
            count: parseInt(row.count)
        }));

        return success({
            summary: {
                totalConsultants: parseInt(summaryResult.rows[0]?.total_consultants || 0),
                billingConsultants: parseInt(summaryResult.rows[0]?.billing_consultants || 0),
                nonBillingConsultants: parseInt(summaryResult.rows[0]?.non_billing_consultants || 0),
                totalBillingAllocation: parseFloat(summaryResult.rows[0]?.total_billing_allocation || 0).toFixed(2),
                totalNonBillingAllocation: parseFloat(summaryResult.rows[0]?.total_non_billing_allocation || 0).toFixed(2)
            },
            charts: {
                trackDistribution
            },
            tables: {
                byProject: byProjectData,
                byAllocation: byAllocationData
            },
            filters: queryParams,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get external consultants report', { error: err.message, stack: err.stack });
        return error('Failed to get external consultants report', err);
    }
};
