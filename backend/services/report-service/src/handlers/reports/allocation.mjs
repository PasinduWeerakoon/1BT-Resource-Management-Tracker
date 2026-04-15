/**
 * Allocation Reports
 * 
 * Handlers for allocation-related reports:
 * - getMonthlyAllocationReport: Monthly allocation breakdown
 * - getClientCostSnapshot: Current allocation lines grouped by employee
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
 * Get monthly allocation report
 * Queries both allocations (current) and allocation_history (deallocated) tables
 * to provide a complete picture of allocations for a given month period.
 */
export const getMonthlyAllocationReport = async (event) => {
    const log = logger.child({ handler: 'reports.getMonthlyAllocationReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { year, month, track_id } = queryParams;

        const targetYear = year ? Number.parseInt(year, 10) : new Date().getFullYear();
        const targetMonth = month ? Number.parseInt(month, 10) : new Date().getMonth() + 1;

        log.info('Getting monthly allocation report', { year: targetYear, month: targetMonth, track_id });

        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

        // Build parameterized query with optional track filter
        const params = [startDate, endDate];
        let trackFilter = '';
        if (track_id) {
            params.push(Number.parseInt(track_id, 10));
            trackFilter = `AND r.track_id = $${params.length}`;
        }

        // Query 1: Current allocations from 'allocations' table
        // Users still allocated whose allocation overlaps with the given month
        const currentAllocationsQuery = `
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
                a.allocated_date as start_date,
                a.deallocated_date as end_date,
                'Current' as source
            FROM allocations a
            JOIN employees r ON a.employee_id = r.id
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE a.is_active = true
              AND a.deleted_at IS NULL
              AND r.deleted_at IS NULL
              AND r.status = 'Active'
              AND a.allocated_date <= $2
              AND (a.deallocated_date IS NULL OR a.deallocated_date >= $1)
              ${trackFilter}
        `;

        // Query 2: Historical allocations from 'allocation_history' table
        // Users who were deallocated but had an allocation during the given month
        const historyAllocationsQuery = `
            SELECT 
                r.name as resource_name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                p.project_name,
                c.client_name,
                ah.allocation_percentage,
                ah.allocation_start_date as start_date,
                ah.allocation_end_date as end_date,
                'Historical' as source
            FROM allocation_history ah
            JOIN employees r ON ah.employee_id = r.id
            JOIN projects p ON ah.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE ah.change_type = 'DELETED'
              AND ah.allocation_start_date <= $2
              AND ah.allocation_end_date IS NOT NULL
              AND ah.allocation_end_date >= $1
              AND r.deleted_at IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM allocations a2 
                  WHERE a2.employee_id = ah.employee_id 
                    AND a2.project_id = ah.project_id 
                    AND a2.is_active = true 
                    AND a2.deleted_at IS NULL
              )
              ${trackFilter}
        `;

        // Combined query using UNION ALL
        const combinedQuery = `
            ${currentAllocationsQuery}
            UNION ALL
            ${historyAllocationsQuery}
            ORDER BY resource_name, project_name
        `;

        const result = await db.query(combinedQuery, params);

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

const parseIntegerList = (value) => {
    if (!value) return [];

    const raw = Array.isArray(value) ? value.join(',') : String(value);
    return raw
        .split(',')
        .map(v => Number.parseInt(v.trim(), 10))
        .filter(v => Number.isInteger(v) && v > 0);
};

/**
 * Client cost snapshot report.
 * Returns employees with their current allocation lines.
 * Salary and cost math are intentionally done in frontend only.
 */
export const getClientCostSnapshot = async (event) => {
    const log = logger.child({ handler: 'reports.getClientCostSnapshot' });

    try {
        const queryParams = event.queryStringParameters || {};
        const page = Math.max(Number.parseInt(queryParams.page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(queryParams.limit || '50', 10) || 50, 1), 200);
        const offset = (page - 1) * limit;
        const billingFilter = String(queryParams.billing_filter || 'all').toLowerCase();
        const projectIds = parseIntegerList(queryParams.project_ids || queryParams.project_id);
        const resourceIds = parseIntegerList(queryParams.resource_ids);
        const searchTerm = String(queryParams.q || queryParams.search || '').trim();

        const employeeParams = [];
        const employeeWhere = ['e.deleted_at IS NULL'];

        if (searchTerm) {
            employeeParams.push(`%${searchTerm}%`);
            const searchRef = `$${employeeParams.length}`;
            employeeWhere.push(`(
                e.name ILIKE ${searchRef}
                OR COALESCE(e.email, '') ILIKE ${searchRef}
                OR COALESCE(e.emp_no, '') ILIKE ${searchRef}
                OR COALESCE(e.epf_no, '') ILIKE ${searchRef}
            )`);
        }

        if (resourceIds.length > 0) {
            employeeParams.push(resourceIds);
            employeeWhere.push(`e.id = ANY($${employeeParams.length}::int[])`);
        }

        const allocationParams = [...employeeParams];
        const allocationFilters = [
            'a.deleted_at IS NULL',
            'a.is_active = true',
            'a.allocated_date <= CURRENT_DATE',
            '(a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)',
        ];

        if (projectIds.length > 0) {
            allocationParams.push(projectIds);
            allocationFilters.push(`a.project_id = ANY($${allocationParams.length}::int[])`);
        }

        if (billingFilter === 'billing') {
            allocationFilters.push('COALESCE(a.is_billable, false) = true');
        } else if (billingFilter === 'non_billing') {
            allocationFilters.push('COALESCE(a.is_billable, false) = false');
        }

        const rowsQuery = `
            SELECT
                e.id AS employee_id,
                e.epf_no,
                e.emp_no,
                e.name AS employee_name,
                e.email,
                e.status,
                d.name AS designation,
                e.track_id,
                e.tier_id,
                e.tech_stack_id,
                a.id AS allocation_id,
                a.project_id,
                a.allocation_percentage,
                a.billing_percentage,
                a.is_billable,
                a.allocated_date,
                a.deallocated_date,
                p.project_name,
                c.client_name,
                bs.name AS billing_status
            FROM employees e
            LEFT JOIN designations d ON e.designation_id = d.id
            LEFT JOIN allocations a ON a.employee_id = e.id
                AND ${allocationFilters.join(' AND ')}
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
            WHERE ${employeeWhere.join(' AND ')}
            ORDER BY e.name ASC, p.project_name ASC NULLS LAST, a.id ASC
        `;

        const result = await db.query(rowsQuery, allocationParams);

        const grouped = new Map();
        for (const row of result.rows) {
            const employeeId = row.employee_id;
            if (!grouped.has(employeeId)) {
                grouped.set(employeeId, {
                    employee_id: employeeId,
                    epf_no: row.epf_no,
                    emp_no: row.emp_no,
                    name: row.employee_name,
                    email: row.email,
                    status: row.status,
                    designation: row.designation,
                    track_id: row.track_id,
                    tier_id: row.tier_id,
                    tech_stack_id: row.tech_stack_id,
                    track: resolveConfigLabel(TRACKS, row.track_id),
                    tier: resolveConfigLabel(TIERS, row.tier_id),
                    tech_stack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id),
                    allocations: [],
                });
            }

            if (row.allocation_id) {
                grouped.get(employeeId).allocations.push({
                    allocation_id: row.allocation_id,
                    project_id: row.project_id,
                    project_name: row.project_name,
                    client_name: row.client_name,
                    allocation_percentage: Number(row.allocation_percentage || 0),
                    billing_percentage: Number(row.billing_percentage || 0),
                    is_billable: Boolean(row.is_billable),
                    billing_status: row.billing_status,
                    allocated_date: row.allocated_date,
                    deallocated_date: row.deallocated_date,
                });
            }
        }

        let employees = Array.from(grouped.values());
        if (projectIds.length > 0 || billingFilter !== 'all') {
            employees = employees.filter(emp => emp.allocations.length > 0);
        }

        const total = employees.length;
        const pagedEmployees = employees.slice(offset, offset + limit);

        log.info('Client cost snapshot loaded', {
            page,
            limit,
            total,
            billingFilter,
            projectCount: projectIds.length,
            searchApplied: Boolean(searchTerm),
        });

        return success({
            employees: pagedEmployees,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            },
            filters: {
                billing_filter: billingFilter,
                project_ids: projectIds,
                resource_ids: resourceIds,
                q: searchTerm || null,
            },
            generatedAt: new Date().toISOString(),
        });
    } catch (err) {
        log.error('Failed to get client cost snapshot', { error: err.message });
        return error('Failed to get client cost snapshot', err);
    }
};
