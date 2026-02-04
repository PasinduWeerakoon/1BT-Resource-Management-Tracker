/**
 * Clients Handler
 * Lambda handlers for client management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import { validate, clientSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'project-service';

/**
 * List clients with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'clients.list' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { page = 1, limit = 20, search, is_active } = queryParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        log.info('Listing clients', { page, limit, search });

        // Build dynamic query
        let whereClause = 'WHERE deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (client_name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (is_active !== undefined) {
            whereClause += ` AND is_active = $${paramIndex}`;
            params.push(is_active === 'true');
            paramIndex++;
        }

        // Optimized: Combined query using window function for count (single round-trip)
        const dataQuery = `
            SELECT *, COUNT(*) OVER() as total_count 
            FROM clients
            ${whereClause}
            ORDER BY client_name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(parseInt(limit), offset);

        const result = await db.query(dataQuery, params);

        // Extract total from first row (or 0 if no results)
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

        // Remove total_count from each row
        const data = result.rows.map(({ total_count, ...row }) => row);

        return success({
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to list clients', { error: err.message });
        return error('Failed to list clients', err);
    }
};

/**
 * Get a single client by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'clients.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting client', { id });

        const query = 'SELECT * FROM clients WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Client not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get client', { id, error: err.message });
        return error('Failed to get client', err);
    }
};

/**
 * Create a new client
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'clients.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, clientSchemas.create);

        // Get user ID from Cognito sub - need to look up in users table
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub;
        let userId = null;

        if (cognitoSub) {
            const userResult = await db.query(
                'SELECT id FROM users WHERE cognito_user_id = $1',
                [cognitoSub]
            );
            if (userResult.rows.length > 0) {
                userId = userResult.rows[0].id;
            }
        }
        // Use system user as fallback
        if (!userId) {
            userId = 1;
        }

        log.info('Creating client', { name: validated.client_name, userId });

        const query = `
            INSERT INTO clients (
                client_name, contact_person, contact_email, contact_phone,
                address, is_active, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const params = [
            validated.client_name,
            validated.contact_person || null,
            validated.contact_email || null,
            validated.contact_phone || null,
            validated.address || null,
            validated.is_active ?? true,
            userId
        ];

        const result = await db.query(query, params);
        const newClient = result.rows[0];

        // Send audit event for client creation
        await audit.create(
            event,
            'client',
            newClient.id,
            newClient.client_name,
            newClient,
            SERVICE_NAME
        );

        log.info('Client created', { id: newClient.id });

        return success(newClient, 201);

    } catch (err) {
        log.error('Failed to create client', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23505') {
            return conflict('A client with this name already exists');
        }

        return error('Failed to create client', err);
    }
};

/**
 * Update an existing client
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'clients.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, clientSchemas.update);

        // Get user ID from Cognito sub - need to look up in users table
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub;
        let userId = null;

        if (cognitoSub) {
            const userResult = await db.query(
                'SELECT id FROM users WHERE cognito_user_id = $1',
                [cognitoSub]
            );
            if (userResult.rows.length > 0) {
                userId = userResult.rows[0].id;
            }
        }

        log.info('Updating client', { id, userId });

        // Check if client exists and get current data for audit
        const existingResult = await db.query(
            'SELECT * FROM clients WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return notFound('Client not found');
        }

        const existing = existingResult.rows[0];

        // Build dynamic update query
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(validated)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return success(existing);
        }

        // Add audit fields
        updates.push(`updated_by = $${paramIndex++}`);
        params.push(userId);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE clients 
            SET ${updates.join(', ')}
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedClient = result.rows[0];

        // Send audit event for client update
        await audit.update(
            event,
            'client',
            id,
            updatedClient.client_name,
            existing,
            updatedClient,
            SERVICE_NAME
        );

        log.info('Client updated', { id });

        return success(updatedClient);

    } catch (err) {
        log.error('Failed to update client', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23505') {
            return conflict('A client with this name already exists');
        }

        return error('Failed to update client', err);
    }
};

/**
 * Soft delete a client
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'clients.remove' });
    const { id } = event.pathParameters;

    // Get user ID from Cognito sub - need to look up in users table
    const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub;
    let userId = null;

    if (cognitoSub) {
        const userResult = await db.query(
            'SELECT id FROM users WHERE cognito_user_id = $1',
            [cognitoSub]
        );
        if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
        }
    }

    try {
        log.info('Deleting client', { id, userId });

        // Get client data for audit before deletion
        const existingResult = await db.query(
            'SELECT * FROM clients WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return notFound('Client not found');
        }

        const existing = existingResult.rows[0];

        await db.query(
            `UPDATE clients 
             SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2 
             WHERE id = $1 AND deleted_at IS NULL`,
            [id, userId]
        );

        // Send audit event for client deletion
        await audit.delete(
            event,
            'client',
            id,
            existing.client_name,
            existing,
            SERVICE_NAME
        );

        log.info('Client deleted', { id });

        return success({ message: 'Client deleted successfully' });

    } catch (err) {
        log.error('Failed to delete client', { id, error: err.message });
        return error('Failed to delete client', err);
    }
};

/**
 * Get all projects for a client
 */
export const getProjects = async (event) => {
    const log = logger.child({ handler: 'clients.getProjects' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting client projects', { id });

        // Check if client exists
        const clientCheck = await db.query(
            'SELECT id, client_name FROM clients WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (clientCheck.rows.length === 0) {
            return notFound('Client not found');
        }

        const query = `
            SELECT * FROM projects
            WHERE client_id = $1 AND deleted_at IS NULL
            ORDER BY project_name ASC
        `;

        const result = await db.query(query, [id]);

        return success({
            client_id: id,
            client_name: clientCheck.rows[0].client_name,
            projects: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get client projects', { id, error: err.message });
        return error('Failed to get client projects', err);
    }
};
