/**
 * Billing Reports
 * 
 * Handlers for billing-related reports:
 * - getNonBillingReport: Non-billing resources
 * - getPreSaleReport: Pre-sale activities
 * - getTierBreakdownReport: Resources by tier with billing details
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

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
                r.epf_no,
                r.name,
                r.email,
                d.name as designation,
                r.track,
                p.project_name,
                a.allocation_percentage,
                a.billing_percentage,
                a.allocated_date,
                a.deallocated_date
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN designations d ON r.designation_id = d.id
            
            WHERE a.is_active = true
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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
                r.epf_no,
                r.name,
                r.email,
                d.name as designation,
                r.track,
                p.project_name,
                p.project_code,
                c.client_name,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.notes
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            
            WHERE a.is_active = true
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
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
                allocated_date: row.allocated_date,
                deallocated_date: row.deallocated_date
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
        const tierDistributionQuery = project_name || account_manager
            ? `
                SELECT 
                    COALESCE(r.tier, 'Unassigned') as tier,
                    COUNT(DISTINCT r.id) as count
                FROM employees r
                
                INNER JOIN allocations a ON r.id = a.employee_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN employees am ON p.account_manager_id = am.id
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
                FROM employees r
                
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
            SELECT 
                r.id,
                r.name as employee_name,
                r.email,
                COALESCE(r.tier, 'Unassigned') as tier,
                r.tech_stack,
                d.name as designation,
                r.track,
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
            FROM employees r
            LEFT JOIN designations d ON r.designation_id = d.id
            
            LEFT JOIN allocations a ON r.id = a.employee_id 
                AND a.is_active = true 
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
            LEFT JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
            LEFT JOIN employees am ON p.account_manager_id = am.id
            ${resourceWhereClause}
            ${allocationWhereClause}
            ORDER BY 
                CASE COALESCE(r.tier, 'Unassigned')
                    WHEN 'Synergy' THEN 0
                    WHEN 'Tier - 1' THEN 1
                    WHEN 'Tier - 2' THEN 2
                    WHEN 'Tier - 3' THEN 3
                    WHEN 'Tier - 4' THEN 4
                    WHEN 'Tier - 5' THEN 5
                    WHEN 'Intern' THEN 99
                    ELSE 999
                END,
                r.name,
                p.project_name
        `;

        // Get total employee count
        const totalCountQuery = project_name || account_manager
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
                SELECT COUNT(*) as total
                FROM employees r
                
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
            track: row.track,
            techStack: row.tech_stack
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
