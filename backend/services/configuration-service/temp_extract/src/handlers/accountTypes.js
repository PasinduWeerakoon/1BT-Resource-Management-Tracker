/**
 * Account Types Handler
 * Lambda handlers for account type management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, conflict } from '/opt/nodejs/utils/response.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'configuration-service';

/**
 * List all account types
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'accountTypes.list' });

    try {
        log.info('Listing account types');

        const query = `
            SELECT * FROM account_types 
            WHERE is_active = true
            ORDER BY is_default DESC, name ASC
        `;
        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list account types', { error: err.message });
        return error('Failed to list account types', err);
    }
};

/**
 * Get an account type by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'accountTypes.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting account type', { id });

        const query = 'SELECT * FROM account_types WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Account type not found');
        }

        return success({ data: result.rows[0] });

    } catch (err) {
        log.error('Failed to get account type', { error: err.message, id });
        return error('Failed to get account type', err);
    }
};

/**
 * Create a new account type
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'accountTypes.create' });
    const userId = event.requestContext?.authorizer?.claims?.sub || 'system';

    try {
        const body = JSON.parse(event.body);
        log.info('Creating account type', { body });

        // Validate required fields
        if (!body.name) {
            return error('Name is required', null, 400);
        }

        // Check for duplicate name
        const checkQuery = 'SELECT id FROM account_types WHERE LOWER(name) = LOWER($1)';
        const checkResult = await db.query(checkQuery, [body.name]);

        if (checkResult.rows.length > 0) {
            return conflict('Account type with this name already exists');
        }

        // Insert new account type
        const insertQuery = `
            INSERT INTO account_types (name, description, is_active, is_default, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(insertQuery, [
            body.name,
            body.description || null,
            body.is_active !== undefined ? body.is_active : true,
            false, // User-created account types are never default
            userId
        ]);

        // Audit log
        await audit.log({
            service: SERVICE_NAME,
            action: 'CREATE',
            entity: 'AccountType',
            entityId: result.rows[0].id,
            userId,
            details: { name: body.name }
        });

        log.info('Account type created', { id: result.rows[0].id });
        return success({ data: result.rows[0] }, 201);

    } catch (err) {
        log.error('Failed to create account type', { error: err.message });
        return error('Failed to create account type', err);
    }
};

/**
 * Update an account type
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'accountTypes.update' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.claims?.sub || 'system';

    try {
        const body = JSON.parse(event.body);
        log.info('Updating account type', { id, body });

        // Check if account type exists and is not default
        const checkQuery = 'SELECT id, is_default FROM account_types WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return notFound('Account type not found');
        }

        if (checkResult.rows[0].is_default) {
            return error('Cannot modify default account types', null, 403);
        }

        // Check for duplicate name (if name is being updated)
        if (body.name) {
            const nameCheckQuery = 'SELECT id FROM account_types WHERE LOWER(name) = LOWER($1) AND id != $2';
            const nameCheckResult = await db.query(nameCheckQuery, [body.name, id]);

            if (nameCheckResult.rows.length > 0) {
                return conflict('Account type with this name already exists');
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (body.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(body.name);
        }
        if (body.description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(body.description);
        }
        if (body.is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(body.is_active);
        }

        updates.push(`updated_by = $${paramCount++}`);
        values.push(userId);
        values.push(id);

        const updateQuery = `
            UPDATE account_types
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;
        const result = await db.query(updateQuery, values);

        // Audit log
        await audit.log({
            service: SERVICE_NAME,
            action: 'UPDATE',
            entity: 'AccountType',
            entityId: id,
            userId,
            details: body
        });

        log.info('Account type updated', { id });
        return success({ data: result.rows[0] });

    } catch (err) {
        log.error('Failed to update account type', { error: err.message, id });
        return error('Failed to update account type', err);
    }
};

/**
 * Delete an account type (soft delete)
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'accountTypes.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.claims?.sub || 'system';

    try {
        log.info('Deleting account type', { id });

        // Check if account type exists and is not default
        const checkQuery = 'SELECT id, is_default, name FROM account_types WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return notFound('Account type not found');
        }

        if (checkResult.rows[0].is_default) {
            return error('Cannot delete default account types', null, 403);
        }

        // Check if account type is in use
        const usageQuery = 'SELECT COUNT(*) as count FROM projects WHERE account_type_id = $1';
        const usageResult = await db.query(usageQuery, [id]);

        if (parseInt(usageResult.rows[0].count) > 0) {
            return error(
                `Cannot delete account type "${checkResult.rows[0].name}" as it is currently used by ${usageResult.rows[0].count} project(s)`,
                null,
                409
            );
        }

        // Soft delete by setting is_active to false
        const deleteQuery = `
            UPDATE account_types
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        await db.query(deleteQuery, [id]);

        // Audit log
        await audit.log({
            service: SERVICE_NAME,
            action: 'DELETE',
            entity: 'AccountType',
            entityId: id,
            userId,
            details: { name: checkResult.rows[0].name }
        });

        log.info('Account type deleted', { id });
        return success({ message: 'Account type deleted successfully' });

    } catch (err) {
        log.error('Failed to delete account type', { error: err.message, id });
        return error('Failed to delete account type', err);
    }
};
