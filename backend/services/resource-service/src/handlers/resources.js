/**
 * Resources Handler
 * Lambda handlers for resource (employee) management
 * Uses shared layer for database, logger, and utilities
 * 
 * Bench Auto-Allocation:
 * - New resources are automatically allocated 100% to Bench project
 */

// Import from Lambda Layer (mounted at /opt/nodejs)
import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import { validate, resourceSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

// Fixed Bench project ID - will be looked up by is_bench_project flag
let BENCH_PROJECT_ID = null;

/**
 * Get the Bench project ID (from database by is_bench_project flag)
 */
const getBenchProjectId = async () => {
    // Return cached value if available
    if (BENCH_PROJECT_ID) {
        return BENCH_PROJECT_ID;
    }

    try {
        const result = await db.query(
            "SELECT id FROM projects WHERE is_bench_project = true AND deleted_at IS NULL LIMIT 1"
        );
        if (result.rows.length > 0) {
            BENCH_PROJECT_ID = result.rows[0].id;
            return BENCH_PROJECT_ID;
        }

        // Fallback: try to find by project code
        const codeResult = await db.query(
            "SELECT id FROM projects WHERE project_code = 'BENCH' AND deleted_at IS NULL LIMIT 1"
        );
        if (codeResult.rows.length > 0) {
            BENCH_PROJECT_ID = codeResult.rows[0].id;
            return BENCH_PROJECT_ID;
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Create initial bench allocation for a new resource at 100%
 */
const createInitialBenchAllocation = async (resourceId, userId, log) => {
    try {
        const benchProjectId = await getBenchProjectId();

        // Check if Bench project exists
        const benchExists = await db.query('SELECT id FROM projects WHERE id = $1', [benchProjectId]);
        if (benchExists.rows.length === 0) {
            log.warn('Bench project not found, skipping auto-allocation', { benchProjectId });
            return null;
        }

        const result = await db.query(`
            INSERT INTO allocations (
                resource_id, project_id, allocation_percentage, start_date, 
                is_active, notes, created_by
            )
            VALUES ($1, $2, 100, CURRENT_DATE, true, 'Auto-created bench allocation for new resource', $3)
            RETURNING *
        `, [resourceId, benchProjectId, userId]);

        log.info('Initial bench allocation created', { resourceId, allocationId: result.rows[0].id });
        return result.rows[0];
    } catch (err) {
        log.error('Failed to create initial bench allocation', { resourceId, error: err.message });
        // Don't fail resource creation if bench allocation fails
        return null;
    }
};

/**
 * List resources with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'resources.list' });

    try {
        const queryParams = event.queryStringParameters || {};

        // Validate query parameters
        const validated = validate(queryParams, resourceSchemas.list);
        const { page, limit, search, track_id, designation_id, status, intern_classification } = validated;
        const offset = (page - 1) * limit;

        log.info('Listing resources', { page, limit, filters: { search, track_id, status } });

        // Build dynamic query
        let whereClause = 'WHERE r.deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (r.name ILIKE $${paramIndex} OR r.email ILIKE $${paramIndex} OR r.employee_id ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (track_id) {
            whereClause += ` AND r.track_id = $${paramIndex}`;
            params.push(track_id);
            paramIndex++;
        }

        if (designation_id) {
            whereClause += ` AND r.designation_id = $${paramIndex}`;
            params.push(designation_id);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND r.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (intern_classification) {
            whereClause += ` AND r.intern_classification = $${paramIndex}`;
            params.push(intern_classification);
            paramIndex++;
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM resources r 
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with joins
        const dataQuery = `
            SELECT 
                r.*,
                d.name as designation_name,
                d.level as designation_level,
                t.name as track_name
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            ${whereClause}
            ORDER BY r.name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        const result = await db.query(dataQuery, params);

        return success({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        log.error('Failed to list resources', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to list resources', err);
    }
};

/**
 * Get a single resource by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'resources.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting resource', { id });

        const query = `
            SELECT 
                r.*,
                d.name as designation_name,
                d.level as designation_level,
                t.name as track_name
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.id = $1 AND r.deleted_at IS NULL
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Resource not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get resource', { id, error: err.message });
        return error('Failed to get resource', err);
    }
};

/**
 * Create a new resource
 * Automatically assigns 100% to Bench project
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'resources.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, resourceSchemas.create);

        log.info('Creating resource', { email: validated.email, employee_id: validated.employee_id });

        // Check for duplicate employee_id
        const existingEmployeeId = await db.query(
            'SELECT id FROM resources WHERE employee_id = $1 AND deleted_at IS NULL',
            [validated.employee_id]
        );

        if (existingEmployeeId.rows.length > 0) {
            return conflict('A resource with this employee_id already exists');
        }

        // Check for duplicate employee_number
        const existingEmployeeNumber = await db.query(
            'SELECT id FROM resources WHERE employee_number = $1 AND deleted_at IS NULL',
            [validated.employee_number]
        );

        if (existingEmployeeNumber.rows.length > 0) {
            return conflict('A resource with this employee_number already exists');
        }

        // Get user info from auth context for created_by
        // JWT claims from Cognito authorizer
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub
            || event.requestContext?.authorizer?.claims?.sub;
        // For user ID, we need to look up the user by cognito_user_id or use a default UUID
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
        // Use a system UUID if no user found (00000000-0000-0000-0000-000000000000)
        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000000';
        }

        const query = `
            INSERT INTO resources (
                employee_id, employee_number, name, phone_number, email, address,
                designation_id, track_id, intern_classification, skills,
                date_of_joining, date_of_birth, nic_passport, is_intern,
                tier, tech_stack, photo_url, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `;

        const params = [
            validated.employee_id,
            validated.employee_number,
            validated.name,
            validated.phone_number,
            validated.email || null,
            validated.address || null,
            validated.designation_id,
            validated.track_id,
            validated.intern_classification || null,
            validated.skills || [],
            validated.date_of_joining || null,
            validated.date_of_birth || null,
            validated.nic_passport || null,
            validated.is_intern || false,
            validated.tier || null,
            validated.tech_stack || null,
            validated.photo_url || null,
            validated.status || 'Active',
            userId
        ];

        const result = await db.query(query, params);
        const newResource = result.rows[0];

        log.info('Resource created', { id: newResource.id });

        // Auto-assign 100% to Bench project
        const benchAllocation = await createInitialBenchAllocation(newResource.id, userId, log);

        // Send audit event for resource creation
        await audit.create(
            event,
            'resource',
            newResource.id,
            newResource.name,
            newResource,
            SERVICE_NAME,
            { employee_id: newResource.employee_id, benchAllocation: benchAllocation?.id }
        );

        // Include bench allocation info in response
        const response = {
            ...newResource,
            benchAllocation: benchAllocation ? {
                id: benchAllocation.id,
                percentage: benchAllocation.allocation_percentage,
                message: 'Automatically allocated 100% to Bench'
            } : null
        };

        return success(response, 201);

    } catch (err) {
        log.error('Failed to create resource', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to create resource', err);
    }
};

/**
 * Update an existing resource
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'resources.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, resourceSchemas.update);

        log.info('Updating resource', { id });

        // Check if resource exists and get current data for audit
        const existingResult = await db.query(
            'SELECT * FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const existing = existingResult.rows[0];

        // Optimistic locking check (only if version is provided)
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Resource has been modified by another user. Please refresh and try again.');
        }

        // Build dynamic update query
        const { version, ...updateData } = validated;
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        // Get user info for updated_by - use system UUID as fallback
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub
            || event.requestContext?.authorizer?.claims?.sub
            || '00000000-0000-0000-0000-000000000000';

        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return success(existing);
        }

        // Increment version and set updated_by
        updates.push(`version = version + 1`);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        updates.push(`updated_by = $${paramIndex}`);
        params.push(userId);

        const query = `
            UPDATE resources 
            SET ${updates.join(', ')}
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedResource = result.rows[0];

        // Send audit event for resource update
        await audit.update(
            event,
            'resource',
            id,
            updatedResource.name,
            existing,
            updatedResource,
            SERVICE_NAME
        );

        log.info('Resource updated', { id });

        return success(updatedResource);

    } catch (err) {
        log.error('Failed to update resource', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update resource', err);
    }
};

/**
 * Soft delete a resource
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'resources.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting resource', { id });

        // Check if resource exists and get data for audit
        const existingResult = await db.query(
            'SELECT * FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const existing = existingResult.rows[0];

        // Soft delete
        await db.query(
            'UPDATE resources SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        // Send audit event for resource deletion
        await audit.delete(
            event,
            'resource',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Resource deleted', { id });

        return success({ message: 'Resource deleted successfully' });

    } catch (err) {
        log.error('Failed to delete resource', { id, error: err.message });
        return error('Failed to delete resource', err);
    }
};

/**
 * Get allocations for a resource
 */
export const getAllocations = async (event) => {
    const log = logger.child({ handler: 'resources.getAllocations' });
    const { id } = event.pathParameters;
    const queryParams = event.queryStringParameters || {};
    const includeHistory = queryParams.includeHistory === 'true';

    try {
        log.info('Getting resource allocations', { id, includeHistory });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        let whereClause = 'WHERE a.resource_id = $1';
        if (!includeHistory) {
            whereClause += " AND a.is_active = true";
        }

        const query = `
            SELECT 
                a.*,
                p.project_name,
                p.project_code,
                p.project_type,
                c.client_name
            FROM allocations a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            ${whereClause}
            ORDER BY a.start_date DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            resource_id: id,
            allocations: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get resource allocations', { id, error: err.message });
        return error('Failed to get resource allocations', err);
    }
};

/**
 * Get designation history for a resource
 */
export const getDesignationHistory = async (event) => {
    const log = logger.child({ handler: 'resources.getDesignationHistory' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting designation history', { id });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const query = `
            SELECT 
                dh.*,
                d.name as designation_name,
                d.level as designation_level
            FROM designation_history dh
            LEFT JOIN designations d ON dh.designation_id = d.id
            WHERE dh.resource_id = $1
            ORDER BY dh.effective_date DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            resource_id: id,
            resource_name: resourceCheck.rows[0].name,
            history: result.rows
        });

    } catch (err) {
        log.error('Failed to get designation history', { id, error: err.message });
        return error('Failed to get designation history', err);
    }
};

/**
 * Toggle account manager status for a resource
 */
export const toggleAccountManager = async (event) => {
    const log = logger.child({ handler: 'resources.toggleAccountManager' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { is_account_manager } = body;

        log.info('Toggling account manager status', { id, is_account_manager });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, is_account_manager FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resource = resourceCheck.rows[0];
        const newStatus = is_account_manager !== undefined ? is_account_manager : !resource.is_account_manager;

        // Update resource
        const updateQuery = `
            UPDATE resources 
            SET is_account_manager = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, email, is_account_manager
        `;

        const result = await db.query(updateQuery, [newStatus, id]);

        log.info('Account manager status updated', { id, is_account_manager: newStatus });

        return success({
            message: `Resource ${newStatus ? 'assigned as' : 'removed from'} account manager`,
            data: result.rows[0]
        });

    } catch (err) {
        log.error('Failed to toggle account manager status', { id, error: err.message });
        return error('Failed to toggle account manager status', err);
    }
};

/**
 * Update resource tier
 */
export const updateTier = async (event) => {
    const log = logger.child({ handler: 'resources.updateTier' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { tier } = body;

        const validTiers = ['Synergy', 'Tier - 1', 'Tier - 2', 'Tier - 3', 'Tier - 4', 'Intern'];
        if (!tier || !validTiers.includes(tier)) {
            return validationError(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
        }

        log.info('Updating resource tier', { id, tier });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, tier FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Update resource
        const updateQuery = `
            UPDATE resources 
            SET tier = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, tier
        `;

        const result = await db.query(updateQuery, [tier, id]);

        log.info('Resource tier updated', { id, tier });

        return success({
            message: 'Resource tier updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        log.error('Failed to update resource tier', { id, error: err.message });
        return error('Failed to update resource tier', err);
    }
};

/**
 * Update resource tech stack
 */
export const updateTechStack = async (event) => {
    const log = logger.child({ handler: 'resources.updateTechStack' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { tech_stack } = body;

        if (!tech_stack || typeof tech_stack !== 'string') {
            return validationError('Tech stack is required and must be a string');
        }

        log.info('Updating resource tech stack', { id, tech_stack });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, tech_stack FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Update resource
        const updateQuery = `
            UPDATE resources 
            SET tech_stack = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, tech_stack
        `;

        const result = await db.query(updateQuery, [tech_stack, id]);

        log.info('Resource tech stack updated', { id, tech_stack });

        return success({
            message: 'Resource tech stack updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        log.error('Failed to update resource tech stack', { id, error: err.message });
        return error('Failed to update resource tech stack', err);
    }
};
