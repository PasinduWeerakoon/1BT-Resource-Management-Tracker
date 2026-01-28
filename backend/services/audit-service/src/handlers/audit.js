/**
 * Audit Logs API Handler
 * REST endpoints for querying audit logs
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import { withMiddleware } from '/opt/nodejs/middleware/index.js';

/**
 * List audit logs with pagination and filters
 */
const listHandler = async (event) => {
    const log = logger.child({ handler: 'audit.list' });

    try {
        const params = event.queryStringParameters || {};
        const {
            page = 1,
            limit = 50,
            action,
            entity_type,
            entity_id,
            user_id,
            start_date,
            end_date,
            search
        } = params;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        log.info('Listing audit logs', { page, limit, filters: { action, entity_type, user_id } });

        // Build dynamic query
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        if (action) {
            whereClause += ` AND action = $${paramIndex}::audit_action`;
            queryParams.push(action);
            paramIndex++;
        }

        if (entity_type) {
            whereClause += ` AND entity_type = $${paramIndex}`;
            queryParams.push(entity_type);
            paramIndex++;
        }

        if (entity_id) {
            whereClause += ` AND entity_id = $${paramIndex}`;
            queryParams.push(entity_id);
            paramIndex++;
        }

        if (user_id) {
            whereClause += ` AND user_id = $${paramIndex}`;
            queryParams.push(user_id);
            paramIndex++;
        }

        if (start_date) {
            whereClause += ` AND timestamp >= $${paramIndex}::timestamptz`;
            queryParams.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereClause += ` AND timestamp <= $${paramIndex}::timestamptz`;
            queryParams.push(end_date);
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND (
                entity_name ILIKE $${paramIndex}
                OR user_email ILIKE $${paramIndex}
                OR user_name ILIKE $${paramIndex}
            )`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results
        const dataQuery = `
            SELECT 
                id,
                timestamp,
                user_id,
                user_email,
                user_name,
                action,
                entity_type,
                entity_id,
                entity_name,
                changed_fields,
                service_name,
                api_endpoint,
                request_id
            FROM audit_logs
            ${whereClause}
            ORDER BY timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(parseInt(limit), offset);

        const result = await db.query(dataQuery, queryParams);

        return success({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to list audit logs', { error: err.message });
        return error('Failed to list audit logs', err);
    }
};

/**
 * Get a single audit log by ID
 */
const getByIdHandler = async (event) => {
    const log = logger.child({ handler: 'audit.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting audit log', { id });

        const query = `
            SELECT *
            FROM audit_logs
            WHERE id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Audit log not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get audit log', { id, error: err.message });
        return error('Failed to get audit log', err);
    }
};

/**
 * Get audit history for a specific entity
 */
const getEntityHistoryHandler = async (event) => {
    const log = logger.child({ handler: 'audit.getEntityHistory' });
    const { entityType, entityId } = event.pathParameters;
    const params = event.queryStringParameters || {};
    const { page = 1, limit = 50 } = params;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        log.info('Getting entity history', { entityType, entityId });

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM audit_logs 
            WHERE entity_type = $1 AND entity_id = $2
        `;
        const countResult = await db.query(countQuery, [entityType, entityId]);
        const total = parseInt(countResult.rows[0].total);

        const query = `
            SELECT 
                id,
                timestamp,
                user_id,
                user_email,
                user_name,
                action,
                entity_name,
                old_values,
                new_values,
                changed_fields,
                service_name
            FROM audit_logs
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY timestamp DESC
            LIMIT $3 OFFSET $4
        `;

        const result = await db.query(query, [entityType, entityId, parseInt(limit), offset]);

        return success({
            entityType,
            entityId,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to get entity history', { entityType, entityId, error: err.message });
        return error('Failed to get entity history', err);
    }
};

/**
 * Get activity for a specific user
 */
const getUserActivityHandler = async (event) => {
    const log = logger.child({ handler: 'audit.getUserActivity' });
    const { userId } = event.pathParameters;
    const params = event.queryStringParameters || {};
    const { page = 1, limit = 50, start_date, end_date } = params;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        log.info('Getting user activity', { userId });

        let whereClause = 'WHERE user_id = $1';
        const queryParams = [userId];
        let paramIndex = 2;

        if (start_date) {
            whereClause += ` AND timestamp >= $${paramIndex}::timestamptz`;
            queryParams.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereClause += ` AND timestamp <= $${paramIndex}::timestamptz`;
            queryParams.push(end_date);
            paramIndex++;
        }

        const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        const query = `
            SELECT 
                id,
                timestamp,
                action,
                entity_type,
                entity_id,
                entity_name,
                service_name,
                api_endpoint
            FROM audit_logs
            ${whereClause}
            ORDER BY timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(parseInt(limit), offset);

        const result = await db.query(query, queryParams);

        return success({
            userId,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to get user activity', { userId, error: err.message });
        return error('Failed to get user activity', err);
    }
};

/**
 * Get audit statistics for dashboard
 */
const getStatsHandler = async (event) => {
    const log = logger.child({ handler: 'audit.getStats' });
    const params = event.queryStringParameters || {};
    const { days = 30 } = params;

    try {
        log.info('Getting audit stats', { days });

        // Action distribution
        const actionStats = await db.query(`
            SELECT action, COUNT(*) as count
            FROM audit_logs
            WHERE timestamp > NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY action
            ORDER BY count DESC
        `);

        // Entity type distribution
        const entityStats = await db.query(`
            SELECT entity_type, COUNT(*) as count
            FROM audit_logs
            WHERE timestamp > NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY entity_type
            ORDER BY count DESC
        `);

        // Daily activity
        const dailyStats = await db.query(`
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as total,
                COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as creates,
                COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as updates,
                COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as deletes
            FROM audit_logs
            WHERE timestamp > NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
            LIMIT 30
        `);

        // Top active users
        const userStats = await db.query(`
            SELECT 
                user_id,
                user_email,
                user_name,
                COUNT(*) as action_count
            FROM audit_logs
            WHERE timestamp > NOW() - INTERVAL '${parseInt(days)} days'
            AND user_id IS NOT NULL
            GROUP BY user_id, user_email, user_name
            ORDER BY action_count DESC
            LIMIT 10
        `);

        // Total counts
        const totalStats = await db.query(`
            SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT entity_type) as entity_types
            FROM audit_logs
            WHERE timestamp > NOW() - INTERVAL '${parseInt(days)} days'
        `);

        return success({
            period: `${days} days`,
            summary: totalStats.rows[0],
            byAction: actionStats.rows,
            byEntityType: entityStats.rows,
            dailyActivity: dailyStats.rows,
            topUsers: userStats.rows
        });

    } catch (err) {
        log.error('Failed to get audit stats', { error: err.message });
        return error('Failed to get audit stats', err);
    }
};

// Export with middleware
export const list = withMiddleware(listHandler, {
    requireAuth: true,
    serviceName: 'audit-service',
    parseBody: false
});

export const getById = withMiddleware(getByIdHandler, {
    requireAuth: true,
    serviceName: 'audit-service',
    parseBody: false
});

export const getEntityHistory = withMiddleware(getEntityHistoryHandler, {
    requireAuth: true,
    serviceName: 'audit-service',
    parseBody: false
});

export const getUserActivity = withMiddleware(getUserActivityHandler, {
    requireAuth: true,
    serviceName: 'audit-service',
    parseBody: false
});

export const getStats = withMiddleware(getStatsHandler, {
    requireAuth: true,
    serviceName: 'audit-service',
    parseBody: false
});
