/**
 * Resource Reports
 * 
 * Handlers for resource-related reports:
 * - getBenchReport: Resources with available capacity
 * - getUtilizationReport: Utilization by track
 * - getInternReport: Intern resources report
 * - getExternalConsultantsReport: External consultants report
 * 
 * Config ID Resolution:
 * - track_id -> TRACKS config
 * - tier_id -> TIERS config
 * - tech_stack_id -> TECH_STACKS config
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';
// Import shared configs for ID-to-label resolution
import { TRACKS, TIERS, TECH_STACKS, getConfigById, BENCH_ELIGIBLE_TRACK_IDS } from '/opt/nodejs/configs/index.js';

/**
 * Helper function to resolve config IDs to labels
 */
const resolveConfigLabel = (configArray, id) => {
    if (!id) return null;
    const config = getConfigById(configArray, id);
    return config ? config.label : null;
};

/**
 * Get bench report - resources with bench allocations (allocation billing_status = Bench OR allocated to Bench project)
 * 
 * Bench resources are those where:
 * 1. The allocation has billing_status_id = 3 (Bench), OR
 * 2. The allocation is to a project with is_bench_project = true
 * 
 * fullBench: 100% allocation to bench
 * partialBench: Less than 100% allocation to bench (has other project allocations)
 */
export const getBenchReport = async (event) => {
    const log = logger.child({ handler: 'reports.getBenchReport' });

    try {
        log.info('Getting bench report');

        // Extract query parameters
        const queryParams = event.queryStringParameters || {};
        const track_id = queryParams.track_id ? parseInt(queryParams.track_id) : null;

        // Build WHERE clause for track filter
        let trackFilterClause = '';
        const queryParamsArray = [];
        let paramIndex = 1;

        if (track_id) {
            trackFilterClause = `AND r.track_id = $${paramIndex}`;
            queryParamsArray.push(track_id);
            paramIndex++;
        }

        // Query resources with bench allocations
        // Bench = allocation.billing_status_id = 3 OR project.is_bench_project = true
        const query = `
            WITH bench_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as bench_allocation_percentage
                FROM allocations a
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                AND a.deleted_at IS NULL
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                AND (a.billing_status_id = 3 OR p.is_bench_project = true)
                GROUP BY a.employee_id
            ),
            total_allocations AS (
                SELECT 
                    employee_id,
                    SUM(allocation_percentage) as total_allocation
                FROM allocations
                WHERE is_active = true 
                AND deleted_at IS NULL
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                GROUP BY employee_id
            ),
            non_bench_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as non_bench_allocation
                FROM allocations a
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                AND a.deleted_at IS NULL
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                AND a.billing_status_id != 3 
                AND (p.is_bench_project = false OR p.is_bench_project IS NULL)
                GROUP BY a.employee_id
            )
            SELECT 
                r.id,
                r.name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tech_stack_id,
                r.tier_id,
                COALESCE(ba.bench_allocation_percentage, 0) as bench_allocation_percentage,
                COALESCE(nba.non_bench_allocation, 0) as non_bench_allocation,
                COALESCE(ta.total_allocation, 0) as total_allocation,
                (100 - COALESCE(ta.total_allocation, 0)) as available_capacity,
                r.joined_date,
                CASE WHEN r.joined_date IS NOT NULL 
                     THEN (CURRENT_DATE - r.joined_date::DATE)
                     ELSE NULL END as days_in_company
            FROM employees r
            INNER JOIN bench_allocations ba ON r.id = ba.employee_id
            LEFT JOIN total_allocations ta ON r.id = ta.employee_id
            LEFT JOIN non_bench_allocations nba ON r.id = nba.employee_id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            AND r.track_id = ANY(ARRAY[${BENCH_ELIGIBLE_TRACK_IDS.join(',')}])
            ${trackFilterClause}
            ORDER BY ba.bench_allocation_percentage DESC, r.name ASC
        `;

        // Chart queries - Calculate distributions using SQL for better performance
        const trackChartQuery = `
            WITH bench_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as bench_allocation_percentage
                FROM allocations a
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                AND a.deleted_at IS NULL
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                AND (a.billing_status_id = 3 OR p.is_bench_project = true)
                GROUP BY a.employee_id
            )
            SELECT 
                r.track_id,
                COUNT(DISTINCT r.id) as count
            FROM employees r
            INNER JOIN bench_allocations ba ON r.id = ba.employee_id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            AND r.track_id = ANY(ARRAY[${BENCH_ELIGIBLE_TRACK_IDS.join(',')}])
            ${trackFilterClause}
            AND r.track_id IS NOT NULL
            GROUP BY r.track_id
            ORDER BY count DESC
        `;

        const techStackChartQuery = `
            WITH bench_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as bench_allocation_percentage
                FROM allocations a
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.is_active = true 
                AND a.deleted_at IS NULL
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                AND (a.billing_status_id = 3 OR p.is_bench_project = true)
                GROUP BY a.employee_id
            )
            SELECT 
                r.tech_stack_id,
                COUNT(DISTINCT r.id) as count
            FROM employees r
            INNER JOIN bench_allocations ba ON r.id = ba.employee_id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            AND r.track_id = ANY(ARRAY[${BENCH_ELIGIBLE_TRACK_IDS.join(',')}])
            ${trackFilterClause}
            AND r.tech_stack_id IS NOT NULL
            GROUP BY r.tech_stack_id
            ORDER BY count DESC
        `;

        // Execute all queries in parallel for better performance
        const [result, trackChartResult, techStackChartResult] = await Promise.all([
            db.query(query, queryParamsArray),
            db.query(trackChartQuery, queryParamsArray),
            db.query(techStackChartQuery, queryParamsArray)
        ]);

        // Transform results with config resolution
        const data = result.rows.map(row => ({
            ...row,
            track: resolveConfigLabel(TRACKS, row.track_id),
            techStack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id),
            tier: resolveConfigLabel(TIERS, row.tier_id)
        }));

        // Categorize by bench status
        // fullBench: 100% bench allocation (no other project allocations)
        // partialBench: Has bench allocation but also has other project allocations
        const fullBench = data.filter(r => parseInt(r.bench_allocation_percentage) === 100 || parseInt(r.non_bench_allocation) === 0);
        const partialBench = data.filter(r => parseInt(r.bench_allocation_percentage) < 100 && parseInt(r.non_bench_allocation) > 0);

        // Format charts - resolve IDs to labels using configs
        const charts = {
            benchResourcesByTrack: trackChartResult.rows.map(row => {
                const trackLabel = resolveConfigLabel(TRACKS, row.track_id) || 'Unassigned';
                return {
                    track: trackLabel,
                    trackId: row.track_id,
                    count: parseInt(row.count)
                };
            }),
            benchResourcesByTechStack: techStackChartResult.rows.map(row => {
                const techStackLabel = resolveConfigLabel(TECH_STACKS, row.tech_stack_id) || 'Unassigned';
                return {
                    techStack: techStackLabel,
                    techStackId: row.tech_stack_id,
                    count: parseInt(row.count)
                };
            })
        };

        return success({
            data,
            summary: {
                totalOnBench: data.length,
                fullBench: fullBench.length,
                partialBench: partialBench.length,
                avgBenchAllocation: data.length > 0
                    ? Math.round(data.reduce((sum, r) => sum + parseInt(r.bench_allocation_percentage), 0) / data.length)
                    : 0
            },
            charts,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get bench report', { error: err.message, stack: err.stack });
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
                r.track_id,
                COUNT(DISTINCT r.id) as total_resources,
                SUM(CASE WHEN p.is_billable = true THEN a.allocation_percentage ELSE 0 END) as billable_allocation_sum,
                SUM(CASE WHEN p.is_billable = false OR p.is_billable IS NULL THEN a.allocation_percentage ELSE 0 END) as non_billable_allocation_sum,
                COALESCE(SUM(a.allocation_percentage), 0) as total_allocated_sum
            FROM employees r
            
            LEFT JOIN allocations a ON r.id = a.employee_id 
                AND a.is_active = true 
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE r.status = 'Active' AND r.deleted_at IS NULL
            GROUP BY r.track_id
            ORDER BY r.track_id
        `;

        const result = await db.query(query);

        // Calculate percentages and resolve track labels
        const data = result.rows.map(row => {
            const totalCapacity = parseInt(row.total_resources) * 100;
            const trackLabel = resolveConfigLabel(TRACKS, row.track_id);
            return {
                trackId: row.track_id,
                track: trackLabel || 'Unassigned',
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
 * Supports filters: project_name, account_manager, track_id, tech_stack_id
 * 
 * Interns are identified by tier_id = 5 (Intern tier) on the employee
 * The tier_id is set based on the employee's designation which has a tier_id mapping
 */
export const getInternReport = async (event) => {
    const log = logger.child({ handler: 'reports.getInternReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { project_name, account_manager, track, track_id, tech_stack, tech_stack_id } = queryParams;

        log.info('Getting intern report', { filters: queryParams });

        // Build WHERE clauses for all filters
        // Interns are identified by tier_id = 5 (Intern tier)
        let resourceWhereClause = 'WHERE r.tier_id = 5 AND r.status = \'Active\' AND r.deleted_at IS NULL';
        let allocationWhereClause = '';
        const params = [];
        let paramIndex = 1;

        // Track filter - accept both track (label) and track_id
        const trackFilter = track_id || track;
        if (trackFilter && trackFilter !== 'All' && trackFilter !== '') {
            // If it's a number, use as ID; otherwise look up by label
            const trackIdValue = !isNaN(trackFilter) ? parseInt(trackFilter) :
                TRACKS.find(t => t.label === trackFilter)?.id;
            if (trackIdValue) {
                resourceWhereClause += ` AND r.track_id = $${paramIndex}`;
                params.push(trackIdValue);
                paramIndex++;
            }
        }

        // Tech Stack filter - accept both tech_stack (label) and tech_stack_id
        const techStackFilter = tech_stack_id || tech_stack;
        if (techStackFilter && techStackFilter !== 'All' && techStackFilter !== '') {
            const techStackIdValue = !isNaN(techStackFilter) ? parseInt(techStackFilter) :
                TECH_STACKS.find(t => t.label === techStackFilter)?.id;
            if (techStackIdValue) {
                resourceWhereClause += ` AND r.tech_stack_id = $${paramIndex}`;
                params.push(techStackIdValue);
                paramIndex++;
            }
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
            FROM employees
            WHERE status = 'Active'
            AND deleted_at IS NULL
        `;

        // Get total intern count - apply resource filters only
        // Interns are identified by tier_id = 5 only (proper tier mapping from designation)
        const totalInternsQuery = project_name || account_manager
            ? `
                SELECT COUNT(DISTINCT r.id) as total
                FROM employees r
                INNER JOIN allocations a ON r.id = a.employee_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN employees am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
            `
            : `
                SELECT COUNT(DISTINCT r.id) as total
                FROM employees r
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
                    r.track_id,
                    r.tech_stack_id,
                    r.joined_date,
                    CASE WHEN r.joined_date IS NOT NULL 
                         THEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.joined_date::DATE)) 
                         ELSE NULL END as months_in_company,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.allocated_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.deallocated_date IS NOT NULL THEN TO_CHAR(a.deallocated_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
                    CASE 
                        WHEN pt.name = 'Bench' THEN 'Bench'
                        WHEN bs.name = 'Non-Billing' THEN 'Non-Billing'
                        WHEN pt.name = 'Training' THEN 'Training'
                        WHEN pt.name = 'Pre-Sales' THEN 'Presale'
                        WHEN bs.name = 'Billing' THEN 'Billing'
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
                FROM employees r
                LEFT JOIN designations d ON r.designation_id = d.id
                
                INNER JOIN allocations a ON r.id = a.employee_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN project_types pt ON p.project_type_id = pt.id
                LEFT JOIN billing_statuses bs ON p.billing_status_id = bs.id
                LEFT JOIN employees am ON p.account_manager_id = am.id
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
                    r.track_id,
                    r.tech_stack_id,
                    r.joined_date,
                    CASE WHEN r.joined_date IS NOT NULL 
                         THEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.joined_date::DATE)) 
                         ELSE NULL END as months_in_company,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.allocated_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.deallocated_date IS NOT NULL THEN TO_CHAR(a.deallocated_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
                    CASE 
                        WHEN pt.name = 'Bench' THEN 'Bench'
                        WHEN bs.name = 'Non-Billing' THEN 'Non-Billing'
                        WHEN pt.name = 'Training' THEN 'Training'
                        WHEN pt.name = 'Pre-Sales' THEN 'Presale'
                        WHEN bs.name = 'Billing' THEN 'Billing'
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
                FROM employees r
                LEFT JOIN designations d ON r.designation_id = d.id
                
                LEFT JOIN allocations a ON r.id = a.employee_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                LEFT JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN project_types pt ON p.project_type_id = pt.id
                LEFT JOIN billing_statuses bs ON p.billing_status_id = bs.id
                LEFT JOIN employees am ON p.account_manager_id = am.id
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
        // Resolve track_id and tech_stack_id to labels using configs
        const internMap = {};
        internDetailsResult.rows.forEach((row) => {
            const internId = row.id;
            if (!internMap[internId]) {
                internMap[internId] = {
                    id: internId,
                    employeeName: row.employee_name,
                    email: row.email,
                    designation: row.designation,
                    trackId: row.track_id,
                    track: resolveConfigLabel(TRACKS, row.track_id),
                    techStackId: row.tech_stack_id,
                    techStack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id),
                    dateOfJoining: row.joined_date,
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
 * Note: Uses is_external flag to identify external consultants
 */
export const getExternalConsultantsReport = async (event) => {
    const log = logger.child({ handler: 'reports.externalConsultants' });
    log.info('External consultants report handler');

    try {
        // Extract query parameters
        const queryParams = event.queryStringParameters || {};
        const {
            track_id,
            tech_stack_id,
            project_id,
            project_name,
            account_manager,
            start_date,
            end_date
        } = queryParams;

        // Base query for external consultants with their current allocations
        // Uses is_external flag to identify external consultants
        let query = `
            SELECT 
                r.id as resource_id,
                r.name as consultant_name,
                r.email,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                d.name as designation,
                et.name as employee_type,
                p.id as project_id,
                p.project_name,
                p.account_manager_id,
                am.name as account_manager_name,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.is_active,
                pt.name as project_type,
                CASE 
                    WHEN pt.name = 'Client' THEN 'Billing'
                    ELSE 'Non-Billing'
                END as billing_status
            FROM employees r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN employee_types et ON r.employee_type_id = et.id
            LEFT JOIN allocations a ON r.id = a.employee_id AND a.is_active = true
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN project_types pt ON p.project_type_id = pt.id
            LEFT JOIN employees am ON p.account_manager_id = am.id
            WHERE r.is_external = true
                AND r.status = 'Active'
                AND r.deleted_at IS NULL
        `;

        const params = [];
        let paramCount = 0;

        // Apply filters
        if (track_id) {
            paramCount++;
            query += ` AND r.track_id = $${paramCount}`;
            params.push(parseInt(track_id));
        }

        if (tech_stack_id) {
            paramCount++;
            query += ` AND r.tech_stack_id = $${paramCount}`;
            params.push(parseInt(tech_stack_id));
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
                COUNT(DISTINCT CASE WHEN pt.name = 'Client' THEN r.id END) as billing_consultants,
                COUNT(DISTINCT CASE WHEN pt.name != 'Client' OR p.id IS NULL THEN r.id END) as non_billing_consultants,
                COALESCE(SUM(CASE WHEN pt.name = 'Client' THEN a.allocation_percentage ELSE 0 END), 0) as total_billing_allocation,
                COALESCE(SUM(CASE WHEN pt.name != 'Client' THEN a.allocation_percentage ELSE 0 END), 0) as total_non_billing_allocation
            FROM employees r
            LEFT JOIN allocations a ON r.id = a.employee_id AND a.is_active = true
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN project_types pt ON p.project_type_id = pt.id
            WHERE r.is_external = true
                AND r.status = 'Active'
                AND r.deleted_at IS NULL
        `;

        const summaryResult = await db.query(summaryQuery);

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
                track: resolveConfigLabel(TRACKS, row.track_id),
                track_id: row.track_id,
                tier: resolveConfigLabel(TIERS, row.tier_id),
                tier_id: row.tier_id,
                techStack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id),
                tech_stack_id: row.tech_stack_id,
                project: row.project_name || 'Bench',
                accountManager: row.account_manager_name || 'N/A',
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
                r.track_id,
                COUNT(DISTINCT r.id) as count
            FROM employees r
            LEFT JOIN employee_types et ON r.employee_type_id = et.id
            WHERE et.name = 'Consultant'
                AND r.status = 'Active'
                AND r.deleted_at IS NULL
            GROUP BY r.track_id
            ORDER BY count DESC
        `;

        const trackResult = await db.query(trackQuery);
        const trackDistribution = trackResult.rows.map(row => ({
            track_id: row.track_id,
            track: resolveConfigLabel(TRACKS, row.track_id) || 'Unassigned',
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


