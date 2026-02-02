/**
 * Billing Reports
 * 
 * Handlers for billing-related reports:
 * - getNonBillingReport: Non-billing resources
 * - getPreSaleReport: Pre-sale activities
 * - getTierBreakdownReport: Resources by tier with billing details
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
 * Get non-billing resources report
 * Non-billing resources are those allocated to projects with Non-Billing billing status
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
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                p.project_name,
                a.allocation_percentage,
                a.billing_percentage,
                a.allocated_date,
                a.deallocated_date,
                bs.name as billing_status
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN billing_statuses bs ON p.billing_status_id = bs.id
            WHERE a.is_active = true
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
            AND bs.name = 'Non-Billing'
            AND r.deleted_at IS NULL
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
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                p.project_name,
                p.project_code,
                c.client_name,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.notes,
                pt.name as project_type
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN project_types pt ON p.project_type_id = pt.id
            WHERE a.is_active = true
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
            AND pt.name = 'Pre-Sales'
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
                name: row.name,
                designation: row.designation,
                track: resolveConfigLabel(TRACKS, row.track_id),
                tier: resolveConfigLabel(TIERS, row.tier_id),
                allocation_percentage: row.allocation_percentage,
                allocated_date: row.allocated_date,
                deallocated_date: row.deallocated_date
            });
        });

        // Transform results with config resolution
        const data = result.rows.map(row => ({
            ...row,
            track: resolveConfigLabel(TRACKS, row.track_id),
            tier: resolveConfigLabel(TIERS, row.tier_id),
            tech_stack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id)
        }));

        return success({
            data,
            groupedByProject: Object.values(projectGroups),
            total: data.length,
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
 * Supports filters: project_name, tier_id, account_manager, track_id, tech_stack_id
 */
export const getTierBreakdownReport = async (event) => {
    const log = logger.child({ handler: 'reports.getTierBreakdownReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { tier_id, project_name, account_manager, track_id, tech_stack_id } = queryParams;

        log.info('Getting tier breakdown report', { filters: queryParams });

        // Build WHERE clauses for all filters
        let resourceWhereClause = "WHERE r.status = 'Active' AND r.deleted_at IS NULL";
        let allocationWhereClause = '';
        const params = [];
        let paramIndex = 1;

        // Tier filter (using tier_id now)
        if (tier_id && tier_id !== 'All' && tier_id !== '') {
            resourceWhereClause += ` AND r.tier_id = $${paramIndex}`;
            params.push(parseInt(tier_id));
            paramIndex++;
        }

        // Track filter (using track_id now)
        if (track_id && track_id !== 'All' && track_id !== '') {
            resourceWhereClause += ` AND r.track_id = $${paramIndex}`;
            params.push(parseInt(track_id));
            paramIndex++;
        }

        // Tech Stack filter (using tech_stack_id now)
        if (tech_stack_id && tech_stack_id !== 'All' && tech_stack_id !== '') {
            resourceWhereClause += ` AND r.tech_stack_id = $${paramIndex}`;
            params.push(parseInt(tech_stack_id));
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
                    r.tier_id,
                    COUNT(DISTINCT r.id) as count
                FROM employees r
                INNER JOIN allocations a ON r.id = a.employee_id 
                    AND a.is_active = true 
                    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                INNER JOIN projects p ON a.project_id = p.id AND p.deleted_at IS NULL
                LEFT JOIN employees am ON p.account_manager_id = am.id
                ${resourceWhereClause}
                ${allocationWhereClause}
                GROUP BY r.tier_id
                ORDER BY r.tier_id NULLS LAST
            `
            : `
                SELECT 
                    r.tier_id,
                    COUNT(DISTINCT r.id) as count
                FROM employees r
                ${resourceWhereClause}
                GROUP BY r.tier_id
                ORDER BY r.tier_id NULLS LAST
            `;

        // Get employee details with allocation info (for table)
        const employeeDetailsQuery = `
            SELECT 
                r.id,
                r.name as employee_name,
                r.email,
                r.tier_id,
                r.tech_stack_id,
                r.track_id,
                d.name as designation,
                p.project_name as project,
                pt.name as project_type,
                bs.name as billing_status,
                COALESCE(a.billing_percentage, 0) as billing_percentage,
                COALESCE(a.allocation_percentage, 0) as project_allocation
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
            ORDER BY r.tier_id NULLS LAST, r.name, p.project_name
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

        // Format tier distribution for chart - resolve tier_id to label
        const tierData = tierDistribution.rows.map(row => ({
            tier_id: row.tier_id,
            tier: resolveConfigLabel(TIERS, row.tier_id) || 'Unassigned',
            count: parseInt(row.count)
        }));

        // Format employee details for table - resolve IDs to labels
        const employeeData = employeeDetails.rows.map((row, index) => ({
            key: `${row.id}-${row.project || 'no-project'}-${index}`,
            employeeName: row.employee_name,
            project: row.project || 'Bench',
            billingStatus: row.billing_status || 'Non-Billing',
            billingPercentage: row.billing_percentage ? `${parseFloat(row.billing_percentage).toFixed(2)}%` : '0.00%',
            projectAllocation: row.project_allocation ? `${parseFloat(row.project_allocation).toFixed(2)}%` : '0.00%',
            tier: resolveConfigLabel(TIERS, row.tier_id) || 'Unassigned',
            tier_id: row.tier_id,
            designation: row.designation,
            track: resolveConfigLabel(TRACKS, row.track_id),
            track_id: row.track_id,
            techStack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id),
            tech_stack_id: row.tech_stack_id
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
