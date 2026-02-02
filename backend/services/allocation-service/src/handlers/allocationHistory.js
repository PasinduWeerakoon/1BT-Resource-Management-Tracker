/**
 * Allocation History Handler
 * Lambda handlers for querying archived allocations
 * 
 * Part of the 3-Table Temporal Architecture
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import allocationHistoryService from '../services/allocationHistoryService.js';

const SERVICE_NAME = 'allocation-history-handler';

/**
 * Search allocation history with filters
 * GET /api/v1/allocation-history
 */
export const search = async (event) => {
    const log = logger.child({ handler: 'allocationHistory.search' });

    try {
        const params = event.queryStringParameters || {};
        const {
            resource_id,
            project_id,
            client_id,
            change_type,
            archived_after,
            archived_before,
            allocated_after,
            allocated_before,
            limit,
            offset
        } = params;

        let whereConditions = [];
        const queryParams = [];
        let paramIndex = 1;

        if (resource_id) {
            whereConditions.push(`aha.employee_id = $${paramIndex}`);
            queryParams.push(resource_id);
            paramIndex++;
        }

        if (project_id) {
            whereConditions.push(`aha.project_id = $${paramIndex}`);
            queryParams.push(project_id);
            paramIndex++;
        }

        if (client_id) {
            whereConditions.push(`p.client_id = $${paramIndex}`);
            queryParams.push(client_id);
            paramIndex++;
        }

        if (change_type) {
            whereConditions.push(`aha.change_type = $${paramIndex}`);
            queryParams.push(change_type);
            paramIndex++;
        }

        if (archived_after) {
            whereConditions.push(`aha.archived_at >= $${paramIndex}::timestamp`);
            queryParams.push(archived_after);
            paramIndex++;
        }

        if (archived_before) {
            whereConditions.push(`aha.archived_at <= $${paramIndex}::timestamp`);
            queryParams.push(archived_before);
            paramIndex++;
        }

        if (allocated_after) {
            whereConditions.push(`aha.allocated_date >= $${paramIndex}::date`);
            queryParams.push(allocated_after);
            paramIndex++;
        }

        if (allocated_before) {
            whereConditions.push(`aha.allocated_date <= $${paramIndex}::date`);
            queryParams.push(allocated_before);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM allocation_history_archive aha
            LEFT JOIN projects p ON aha.project_id = p.id
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);

        // Get archived allocations
        let query = `
            SELECT aha.*, 
                   r.name as resource_name,
                   r.epf_no,
                   p.name as project_name,
                   p.project_code,
                   c.name as client_name
            FROM allocation_history_archive aha
            JOIN employees r ON aha.employee_id = r.id
            JOIN projects p ON aha.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            ${whereClause}
            ORDER BY aha.archived_at DESC
        `;

        // Clone params for main query (count query used same params)
        const mainQueryParams = [...queryParams];

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            mainQueryParams.push(parseInt(limit, 10));
            paramIndex++;
        } else {
            query += ` LIMIT 100`;  // Default limit
        }

        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            mainQueryParams.push(parseInt(offset, 10));
        }

        const result = await db.query(query, mainQueryParams);

        log.info('Searched allocation history', { count: result.rows.length, total });

        return success({
            history: result.rows,
            total,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0
        });
    } catch (err) {
        log.error('Failed to search allocation history', { error: err.message });
        return error(err.message, 500, 'SEARCH_ERROR');
    }
};

/**
 * Get allocation history for a specific resource
 * GET /api/v1/allocation-history/resource/{resourceId}
 */
export const getByResource = async (event) => {
    const log = logger.child({ handler: 'allocationHistory.getByResource' });

    try {
        const { resourceId } = event.pathParameters;
        const params = event.queryStringParameters || {};

        const history = await allocationHistoryService.getHistoryByResource(resourceId, {
            limit: params.limit ? parseInt(params.limit, 10) : undefined,
            offset: params.offset ? parseInt(params.offset, 10) : undefined
        });

        return success({
            history,
            total: history.length
        });
    } catch (err) {
        log.error('Failed to get history by resource', { error: err.message });
        return error(err.message, 500, 'GET_ERROR');
    }
};

/**
 * Get allocation history for a specific project
 * GET /api/v1/allocation-history/project/{projectId}
 */
export const getByProject = async (event) => {
    const log = logger.child({ handler: 'allocationHistory.getByProject' });

    try {
        const { projectId } = event.pathParameters;
        const params = event.queryStringParameters || {};

        const history = await allocationHistoryService.getHistoryByProject(projectId, {
            limit: params.limit ? parseInt(params.limit, 10) : undefined,
            offset: params.offset ? parseInt(params.offset, 10) : undefined
        });

        return success({
            history,
            total: history.length
        });
    } catch (err) {
        log.error('Failed to get history by project', { error: err.message });
        return error(err.message, 500, 'GET_ERROR');
    }
};

/**
 * Get a specific archived allocation by ID
 * GET /api/v1/allocation-history/{id}
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'allocationHistory.getById' });

    try {
        const { id } = event.pathParameters;

        const query = `
            SELECT aha.*, 
                   r.name as resource_name,
                   r.epf_no,
                   p.name as project_name,
                   p.project_code,
                   c.name as client_name,
                   d.name as designation_name
            FROM allocation_history_archive aha
            JOIN employees r ON aha.employee_id = r.id
            JOIN projects p ON aha.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN designations d ON aha.designation_id = d.id
            WHERE aha.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Archived allocation not found');
        }

        return success(result.rows[0]);
    } catch (err) {
        log.error('Failed to get archived allocation', { error: err.message });
        return error(err.message, 500, 'GET_ERROR');
    }
};

/**
 * Get archive statistics
 * GET /api/v1/allocation-history/stats
 */
export const getStats = async (event) => {
    const log = logger.child({ handler: 'allocationHistory.getStats' });

    try {
        const stats = await allocationHistoryService.getArchiveStats();
        return success(stats);
    } catch (err) {
        log.error('Failed to get archive stats', { error: err.message });
        return error(err.message, 500, 'STATS_ERROR');
    }
};

/**
 * Get resource's allocation timeline (combines current + history)
 * GET /api/v1/allocation-history/timeline/{resourceId}
 */
export const getTimeline = async (event) => {
    const log = logger.child({ handler: 'allocationHistory.getTimeline' });

    try {
        const { resourceId } = event.pathParameters;
        const params = event.queryStringParameters || {};
        const { from_date, to_date } = params;

        // Get archived allocations
        let historyQuery = `
            SELECT 
                'archived' as source,
                aha.id,
                aha.employee_id,
                aha.project_id,
                p.name as project_name,
                p.project_code,
                aha.allocated_date,
                aha.deallocated_date,
                aha.allocation_percentage,
                aha.billing_percentage,
                aha.change_type,
                aha.archived_at as status_date
            FROM allocation_history_archive aha
            JOIN projects p ON aha.project_id = p.id
            WHERE aha.employee_id = $1
        `;
        const historyParams = [resourceId];
        let paramIndex = 2;

        if (from_date) {
            historyQuery += ` AND aha.allocated_date >= $${paramIndex}::date`;
            historyParams.push(from_date);
            paramIndex++;
        }
        if (to_date) {
            historyQuery += ` AND aha.deallocated_date <= $${paramIndex}::date`;
            historyParams.push(to_date);
            paramIndex++;
        }

        // Get current allocations
        let currentQuery = `
            SELECT 
                'current' as source,
                a.id,
                a.employee_id,
                a.project_id,
                p.name as project_name,
                p.project_code,
                a.allocated_date,
                a.deallocated_date,
                a.allocation_percentage,
                a.billing_percentage,
                a.change_type,
                a.updated_at as status_date
            FROM allocations a
            JOIN projects p ON a.project_id = p.id
            WHERE a.employee_id = $1
        `;
        const currentParams = [resourceId];
        let currentParamIndex = 2;

        if (from_date) {
            currentQuery += ` AND a.allocated_date >= $${currentParamIndex}::date`;
            currentParams.push(from_date);
            currentParamIndex++;
        }
        if (to_date) {
            currentQuery += ` AND (a.deallocated_date IS NULL OR a.deallocated_date <= $${currentParamIndex}::date)`;
            currentParams.push(to_date);
            currentParamIndex++;
        }

        // Get future allocations
        let futureQuery = `
            SELECT 
                'future' as source,
                fa.id,
                fa.employee_id,
                fa.project_id,
                p.name as project_name,
                p.project_code,
                fa.effective_date as allocated_date,
                NULL as deallocated_date,
                fa.new_allocation_percentage as allocation_percentage,
                fa.new_billing_percentage as billing_percentage,
                fa.change_type,
                fa.effective_date as status_date
            FROM future_allocations fa
            JOIN projects p ON fa.project_id = p.id
            WHERE fa.employee_id = $1 AND fa.status = 'scheduled'
        `;
        const futureParams = [resourceId];

        // Execute all queries
        const [historyResult, currentResult, futureResult] = await Promise.all([
            db.query(historyQuery, historyParams),
            db.query(currentQuery, currentParams),
            db.query(futureQuery, futureParams)
        ]);

        // Combine and sort by date
        const timeline = [
            ...historyResult.rows,
            ...currentResult.rows,
            ...futureResult.rows
        ].sort((a, b) => {
            const dateA = new Date(a.allocated_date || a.status_date);
            const dateB = new Date(b.allocated_date || b.status_date);
            return dateA - dateB;
        });

        return success({
            resourceId,
            timeline,
            counts: {
                archived: historyResult.rows.length,
                current: currentResult.rows.length,
                future: futureResult.rows.length
            }
        });
    } catch (err) {
        log.error('Failed to get allocation timeline', { error: err.message });
        return error(err.message, 500, 'TIMELINE_ERROR');
    }
};
