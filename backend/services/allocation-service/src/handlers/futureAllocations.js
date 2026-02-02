/**
 * Future Allocations Handler
 * Lambda handlers for managing scheduled/future allocations
 * 
 * Part of the 3-Table Temporal Architecture
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, badRequest } from '/opt/nodejs/utils/response.js';
import futureAllocationService from '../services/futureAllocationService.js';

const SERVICE_NAME = 'future-allocation-handler';

/**
 * List all future allocations
 * GET /api/v1/future-allocations
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'futureAllocations.list' });

    try {
        const params = event.queryStringParameters || {};
        const { resource_id, project_id, status, effective_date, limit, offset } = params;

        let whereConditions = [];
        const queryParams = [];
        let paramIndex = 1;

        if (resource_id) {
            whereConditions.push(`fa.employee_id = $${paramIndex}`);
            queryParams.push(resource_id);
            paramIndex++;
        }

        if (project_id) {
            whereConditions.push(`fa.project_id = $${paramIndex}`);
            queryParams.push(project_id);
            paramIndex++;
        }

        if (status) {
            whereConditions.push(`fa.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (effective_date) {
            whereConditions.push(`fa.effective_date = $${paramIndex}::date`);
            queryParams.push(effective_date);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM future_allocations fa ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);

        // Get future allocations
        let query = `
            SELECT fa.*, 
                   r.name as resource_name,
                   r.epf_no,
                   p.name as project_name,
                   p.project_code,
                   p.is_bench_project,
                   u.name as created_by_name
            FROM future_allocations fa
            JOIN employees r ON fa.employee_id = r.id
            JOIN projects p ON fa.project_id = p.id
            LEFT JOIN users u ON fa.created_by = u.id
            ${whereClause}
            ORDER BY fa.effective_date ASC, fa.created_at ASC
        `;

        // Clone params for main query
        const mainQueryParams = [...queryParams];

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            mainQueryParams.push(parseInt(limit, 10));
            paramIndex++;
        }

        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            mainQueryParams.push(parseInt(offset, 10));
        }

        const result = await db.query(query, mainQueryParams);

        log.info('Listed future allocations', { count: result.rows.length, total });

        return success({
            futureAllocations: result.rows,
            total,
            limit: limit ? parseInt(limit, 10) : null,
            offset: offset ? parseInt(offset, 10) : 0
        });
    } catch (err) {
        log.error('Failed to list future allocations', { error: err.message });
        return error(err.message, 500, 'LIST_ERROR');
    }
};

/**
 * Get a future allocation by ID
 * GET /api/v1/future-allocations/{id}
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'futureAllocations.getById' });

    try {
        const { id } = event.pathParameters;

        const futureAllocation = await futureAllocationService.getFutureAllocationById(id);

        if (!futureAllocation) {
            return notFound('Future allocation not found');
        }

        return success(futureAllocation);
    } catch (err) {
        log.error('Failed to get future allocation', { error: err.message });
        return error(err.message, 500, 'GET_ERROR');
    }
};

/**
 * Get future allocations for a specific resource
 * GET /api/v1/future-allocations/resource/{resourceId}
 */
export const getByResource = async (event) => {
    const log = logger.child({ handler: 'futureAllocations.getByResource' });

    try {
        const { resourceId } = event.pathParameters;
        const params = event.queryStringParameters || {};

        const futureAllocations = await futureAllocationService.getFutureAllocationsByResource(
            resourceId,
            { status: params.status }
        );

        return success({
            futureAllocations,
            total: futureAllocations.length
        });
    } catch (err) {
        log.error('Failed to get future allocations by resource', { error: err.message });
        return error(err.message, 500, 'GET_ERROR');
    }
};

/**
 * Cancel a future allocation
 * DELETE /api/v1/future-allocations/{id}
 */
export const cancel = async (event) => {
    const log = logger.child({ handler: 'futureAllocations.cancel' });

    try {
        const { id } = event.pathParameters;
        const body = JSON.parse(event.body || '{}');
        const { reason } = body;

        const result = await futureAllocationService.cancelFutureAllocation(id, reason);

        log.info('Future allocation cancelled', { id, reason });

        return success(result);
    } catch (err) {
        log.error('Failed to cancel future allocation', { error: err.message });

        if (err.message.includes('not found')) {
            return notFound(err.message);
        }
        if (err.message.includes('Cannot cancel')) {
            return badRequest(err.message);
        }

        return error(err.message, 500, 'CANCEL_ERROR');
    }
};

/**
 * Get scheduled allocations due for activation
 * GET /api/v1/future-allocations/pending
 */
export const getPending = async (event) => {
    const log = logger.child({ handler: 'futureAllocations.getPending' });

    try {
        const params = event.queryStringParameters || {};

        const pendingAllocations = await futureAllocationService.getScheduledAllocations({
            effectiveDate: params.effective_date,
            limit: params.limit ? parseInt(params.limit, 10) : undefined
        });

        return success({
            pendingAllocations,
            total: pendingAllocations.length
        });
    } catch (err) {
        log.error('Failed to get pending allocations', { error: err.message });
        return error(err.message, 500, 'GET_ERROR');
    }
};

/**
 * Get summary statistics for future allocations
 * GET /api/v1/future-allocations/stats
 */
export const getStats = async (event) => {
    const log = logger.child({ handler: 'futureAllocations.getStats' });

    try {
        const query = `
            SELECT 
                status,
                change_type,
                COUNT(*) as count,
                MIN(effective_date) as earliest_date,
                MAX(effective_date) as latest_date
            FROM future_allocations
            GROUP BY status, change_type
            ORDER BY status, change_type
        `;

        const result = await db.query(query);

        // Also get upcoming activations count
        const today = new Date().toISOString().split('T')[0];
        const upcomingQuery = `
            SELECT 
                effective_date,
                COUNT(*) as count
            FROM future_allocations
            WHERE status = 'scheduled'
            AND effective_date >= $1::date
            GROUP BY effective_date
            ORDER BY effective_date
            LIMIT 7
        `;
        const upcomingResult = await db.query(upcomingQuery, [today]);

        return success({
            byStatusAndType: result.rows,
            upcomingActivations: upcomingResult.rows
        });
    } catch (err) {
        log.error('Failed to get future allocation stats', { error: err.message });
        return error(err.message, 500, 'STATS_ERROR');
    }
};
