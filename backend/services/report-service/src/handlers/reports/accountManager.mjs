/**
 * Account Manager Reports
 * 
 * Handlers for account manager related reports:
 * - getAccountManagers: List of all account managers
 * - getAccountManagerReport: Comprehensive account manager dashboard
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

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
            allocationWhereClause += ` AND (a.deallocated_date IS NULL OR a.deallocated_date >= $${allocationParamIndex})`;
            allocationParams.push(start_date);
            allocationParamIndex++;
        }

        if (end_date) {
            allocationWhereClause += ` AND a.allocated_date <= $${allocationParamIndex}`;
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
                allocationWhereClause += ` AND a.allocated_date <= $${allocationParamIndex} AND (a.deallocated_date IS NULL OR a.deallocated_date >= $${allocationParamIndex + 1})`;
                allocationParams.push(monthEnd, monthStart);
                allocationParamIndex += 2;
            } else {
                allocationWhereClause += ` AND EXTRACT(YEAR FROM a.allocated_date) = $${allocationParamIndex}`;
                allocationParams.push(targetYear);
                allocationParamIndex++;
            }
        }

        // Allocation Status filter
        if (allocation_status && allocation_status !== 'All') {
            if (allocation_status === 'Active') {
                allocationWhereClause += ` AND a.is_active = true AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)`;
            } else if (allocation_status === 'Inactive') {
                allocationWhereClause += ` AND (a.is_active = false OR a.deallocated_date < CURRENT_DATE)`;
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
                    r.total_allocation,
                    r.total_billing,
                    p.project_name as project,
                    p.id as project_id,
                    TO_CHAR(a.allocated_date, 'DD Mon YYYY') as project_allocated_date,
                    CASE WHEN a.deallocated_date IS NOT NULL THEN TO_CHAR(a.deallocated_date, 'DD Mon YYYY') ELSE NULL END as project_deallocated_date,
                    p.billing_status,
                    a.billing_percentage,
                    a.allocation_percentage as project_allocation,
                    CASE 
                        WHEN a.deallocated_date IS NOT NULL THEN a.deallocated_date - a.allocated_date
                        ELSE CURRENT_DATE - a.allocated_date
                    END as duration_days,
                    CASE WHEN a.is_active = true AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE) THEN 'Active' ELSE 'Inactive' END as status,
                    a.is_active
                FROM allocations a
                JOIN resources r ON a.resource_id = r.id
                JOIN projects p ON a.project_id = p.id
                ${allocationWhereClause}
                ${account_manager_id && account_manager_id !== 'all' ? `AND p.account_manager_id = $${allocationParamIndex}` : ''}
                ${employee_status && employee_status !== 'All' ? `AND r.status = $${allocationParamIndex + (account_manager_id && account_manager_id !== 'all' ? 1 : 0)}` : ''}
                ORDER BY a.allocated_date DESC
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
                WHERE a.is_active = true AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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
                        WHEN 'Tier - 1' THEN 1 
                        WHEN 'Tier - 2' THEN 2
                        WHEN 'Tier - 3' THEN 3 
                        WHEN 'Tier - 4' THEN 4 
                        ELSE 5
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
