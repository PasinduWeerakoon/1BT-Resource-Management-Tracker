/**
 * Resources Lambda Handler
 * Entry point for Resource (Employee) CRUD operations
 */

const { withMiddleware } = require('../../middleware');
const resourceService = require('../../services/resourceService');
const { resourceSchemas, validate } = require('../../lib/validation');
const { success, created, noContent, errors, paginated } = require('../../utils/response');
const logger = require('../../lib/logger');

/**
 * List resources with pagination and filtering
 * GET /api/v1/resources
 */
const listResources = async (event) => {
    try {
        const params = validate(event.queryStringParameters || {}, resourceSchemas.list);
        const result = await resourceService.list(params);

        return paginated(
            result.items,
            result.total,
            params.page,
            params.limit
        );
    } catch (error) {
        logger.error('Failed to list resources', { error: error.message });
        if (error.statusCode === 422) {
            return errors.validationError(error.details);
        }
        throw error;
    }
};

/**
 * Get a single resource by ID
 * GET /api/v1/resources/{id}
 */
const getResource = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: require('../../lib/validation').uuid.required() });

        const resource = await resourceService.getById(id);

        if (!resource) {
            return errors.notFound('Resource');
        }

        return success(resource);
    } catch (error) {
        logger.error('Failed to get resource', { error: error.message, id: event.pathParameters?.id });
        if (error.statusCode === 422) {
            return errors.validationError(error.details);
        }
        throw error;
    }
};

/**
 * Create a new resource
 * POST /api/v1/resources
 */
const createResource = async (event) => {
    try {
        const data = validate(event.body, resourceSchemas.create);
        const userId = event.user?.id;

        if (!userId) {
            return errors.unauthorized('User context required');
        }

        const resource = await resourceService.create(data, userId);

        return created(resource);
    } catch (error) {
        logger.error('Failed to create resource', { error: error.message });
        if (error.statusCode === 422) {
            return errors.validationError(error.details);
        }
        if (error.code === '23505') { // Unique violation
            return errors.conflict('Resource with this employee ID or number already exists');
        }
        throw error;
    }
};

/**
 * Update an existing resource
 * PUT /api/v1/resources/{id}
 */
const updateResource = async (event) => {
    try {
        const { id } = event.pathParameters;
        const data = validate(event.body, resourceSchemas.update);
        const userId = event.user?.id;

        if (!userId) {
            return errors.unauthorized('User context required');
        }

        const resource = await resourceService.update(id, data, userId);

        if (!resource) {
            return errors.notFound('Resource');
        }

        return success(resource);
    } catch (error) {
        logger.error('Failed to update resource', { error: error.message, id: event.pathParameters?.id });
        if (error.statusCode === 422) {
            return errors.validationError(error.details);
        }
        if (error.message === 'VERSION_CONFLICT') {
            return errors.conflict('Resource was modified by another user. Please refresh and try again.');
        }
        throw error;
    }
};

/**
 * Soft delete a resource
 * DELETE /api/v1/resources/{id}
 */
const deleteResource = async (event) => {
    try {
        const { id } = event.pathParameters;
        const userId = event.user?.id;

        if (!userId) {
            return errors.unauthorized('User context required');
        }

        const deleted = await resourceService.softDelete(id, userId);

        if (!deleted) {
            return errors.notFound('Resource');
        }

        return noContent();
    } catch (error) {
        logger.error('Failed to delete resource', { error: error.message, id: event.pathParameters?.id });
        throw error;
    }
};

/**
 * Get resource allocations
 * GET /api/v1/resources/{id}/allocations
 */
const getResourceAllocations = async (event) => {
    try {
        const { id } = event.pathParameters;
        const allocations = await resourceService.getAllocations(id);

        return success(allocations);
    } catch (error) {
        logger.error('Failed to get resource allocations', { error: error.message });
        throw error;
    }
};

/**
 * Get resource designation history
 * GET /api/v1/resources/{id}/designation-history
 */
const getDesignationHistory = async (event) => {
    try {
        const { id } = event.pathParameters;
        const history = await resourceService.getDesignationHistory(id);

        return success(history);
    } catch (error) {
        logger.error('Failed to get designation history', { error: error.message });
        throw error;
    }
};

/**
 * Main handler - routes requests to appropriate function
 */
const handler = async (event, context) => {
    const { httpMethod, path, resource } = event;

    // Route based on method and path pattern
    if (httpMethod === 'GET' && !event.pathParameters?.id) {
        return listResources(event);
    }

    if (httpMethod === 'GET' && path.includes('/allocations')) {
        return getResourceAllocations(event);
    }

    if (httpMethod === 'GET' && path.includes('/designation-history')) {
        return getDesignationHistory(event);
    }

    if (httpMethod === 'GET' && event.pathParameters?.id) {
        return getResource(event);
    }

    if (httpMethod === 'POST') {
        return createResource(event);
    }

    if (httpMethod === 'PUT') {
        return updateResource(event);
    }

    if (httpMethod === 'DELETE') {
        return deleteResource(event);
    }

    return errors.notFound('Endpoint');
};

// Export wrapped handler with middleware
module.exports.handler = withMiddleware(handler);

// Export individual functions for testing
module.exports = {
    listResources,
    getResource,
    createResource,
    updateResource,
    deleteResource,
    getResourceAllocations,
    getDesignationHistory,
};
