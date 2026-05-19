/**
 * Employee Reports
 * 
 * Handlers for employee-related reports:
 * - getEmployeeReport: All employees with allocation details
 * - getExceptionReport: Over/under allocated resources
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
 * Parse a positive integer from query string, or null if missing/invalid.
 */
const parsePositiveInt = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Get employee allocation report
 * Query params:
 * - resource_id: filter by employee id (same as resources list id)
 * - track_id: filter by track
 * - page, limit: pagination (limit capped at 500; omit limit to return all matches)
 */
export const getEmployeeReport = async (event) => {
    const log = logger.child({ handler: 'reports.getEmployeeReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const resourceId = parsePositiveInt(queryParams.resource_id);
        const trackId = parsePositiveInt(queryParams.track_id);
        const page = parsePositiveInt(queryParams.page) ?? 1;
        const rawLimit = parsePositiveInt(queryParams.limit);
        const limit = rawLimit != null ? Math.min(rawLimit, 500) : null;

        const filterParams = [];
        const whereFragments = ['r.deleted_at IS NULL'];

        if (resourceId != null) {
            filterParams.push(resourceId);
            whereFragments.push(`r.id = $${filterParams.length}`);
        }
        if (trackId != null) {
            filterParams.push(trackId);
            whereFragments.push(`r.track_id = $${filterParams.length}`);
        }

        const whereClause = whereFragments.join(' AND ');

        log.info('Getting employee report', {
            resourceId: resourceId ?? null,
            trackId: trackId ?? null,
            page,
            limit: limit ?? 'all',
        });

        const countSql = `
            SELECT COUNT(*)::int AS total
            FROM employees r
            WHERE ${whereClause}
        `;
        const countResult = await db.query(countSql, filterParams);
        const total = countResult.rows[0]?.total ?? 0;

        const selectSql = `
            SELECT 
                r.id,
                r.epf_no,
                r.emp_no,
                r.name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                r.status,
                r.joined_date,
                COALESCE(
                    (SELECT SUM(allocation_percentage) 
                     FROM allocations 
                     WHERE employee_id = r.id 
                     AND is_active = true 
                     AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)),
                    0
                ) as total_allocation,
                COALESCE(r.total_resource_billing, 0) as total_billing,
                COALESCE(
                    (SELECT string_agg(p.project_name, ', ')
                     FROM allocations a
                     JOIN projects p ON a.project_id = p.id
                     WHERE a.employee_id = r.id 
                     AND a.is_active = true 
                     AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)),
                    'None'
                ) as current_projects
            FROM employees r
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE ${whereClause}
            ORDER BY r.name ASC
        `;

        const dataParams = [...filterParams];
        let listSql = selectSql;
        if (limit != null) {
            const offset = (page - 1) * limit;
            const limitPlaceholder = dataParams.length + 1;
            const offsetPlaceholder = dataParams.length + 2;
            dataParams.push(limit, offset);
            listSql += ` LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`;
        }

        const result = await db.query(listSql, dataParams);

        // Transform results with config resolution
        const data = result.rows.map(row => ({
            ...row,
            track: resolveConfigLabel(TRACKS, row.track_id),
            tier: resolveConfigLabel(TIERS, row.tier_id),
            tech_stack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id)
        }));

        return success({
            data,
            total,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get employee report', { error: err.message });
        return error('Failed to get employee report', err);
    }
};

/**
 * Get exception allocation report (over-allocated or under-allocated resources)
 *
 * Query params:
 * - project_id: optional. When set, only employees with at least one **current**
 *   active allocation on that project are returned. Totals and exception_type are
 *   still based on **global** allocation (all active allocations), not only that
 *   project — filtering by project must not change the math used for over/under.
 */
export const getExceptionReport = async (event) => {
    const log = logger.child({ handler: 'reports.getExceptionReport' });

    try {
        const queryParams = event.queryStringParameters || {};
        const rawProjectId = queryParams.project_id;
        const projectIdParsed = rawProjectId !== undefined && rawProjectId !== null && rawProjectId !== ''
            ? parseInt(String(rawProjectId), 10)
            : NaN;
        const projectId = Number.isFinite(projectIdParsed) && projectIdParsed > 0
            ? projectIdParsed
            : null;

        const params = projectId != null ? [projectId] : [];

        let projectFilterSql = '';
        if (projectId != null) {
            projectFilterSql = `
            AND EXISTS (
                SELECT 1
                FROM allocations ap
                WHERE ap.employee_id = r.id
                  AND ap.project_id = $1
                  AND ap.is_active = true
                  AND ap.deleted_at IS NULL
                  AND (ap.deallocated_date IS NULL OR ap.deallocated_date >= CURRENT_DATE)
            )`;
        }

        log.info('Getting exception report', { projectId: projectId ?? null });

        const query = `
            WITH resource_allocations AS (
                SELECT 
                    a.employee_id,
                    SUM(a.allocation_percentage) as total_allocation
                FROM allocations a
                WHERE a.is_active = true
                AND a.deleted_at IS NULL
                AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
                GROUP BY a.employee_id
            )
            SELECT 
                r.id,
                r.epf_no,
                r.name,
                r.email,
                d.name as designation,
                r.track_id,
                r.tier_id,
                r.tech_stack_id,
                r.total_resource_billing,
                COALESCE(ra.total_allocation, 0) as total_allocation,
                CASE 
                    WHEN COALESCE(ra.total_allocation, 0) > 100 THEN 'Over-allocated'
                    WHEN COALESCE(ra.total_allocation, 0) < 100 AND COALESCE(ra.total_allocation, 0) > 0 THEN 'Under-allocated'
                    WHEN COALESCE(ra.total_allocation, 0) = 0 THEN 'Unallocated'
                    ELSE 'Normal'
                END as exception_type
            FROM employees r
            LEFT JOIN resource_allocations ra ON r.id = ra.employee_id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE r.status = 'Active'
            AND r.deleted_at IS NULL
            AND (COALESCE(ra.total_allocation, 0) > 100 OR COALESCE(ra.total_allocation, 0) < 100)
            ${projectFilterSql}
            ORDER BY ra.total_allocation DESC NULLS LAST
        `;

        const result = await db.query(query, params);

        // Transform results with config resolution
        const data = result.rows.map(row => ({
            ...row,
            track: resolveConfigLabel(TRACKS, row.track_id),
            tier: resolveConfigLabel(TIERS, row.tier_id),
            tech_stack: resolveConfigLabel(TECH_STACKS, row.tech_stack_id)
        }));

        // Categorize exceptions
        const overAllocated = data.filter(r => parseFloat(r.total_allocation) > 100);
        const underAllocated = data.filter(r => parseFloat(r.total_allocation) < 100 && parseFloat(r.total_allocation) > 0);
        const unallocated = data.filter(r => parseFloat(r.total_allocation) === 0);

        return success({
            data,
            summary: {
                total: data.length,
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
