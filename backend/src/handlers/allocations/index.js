/**
 * Allocations Lambda Handler
 * CRUD operations for Resource Allocations
 */

import { withMiddleware } from '../../middleware/index.js';
import allocationService from '../../services/allocationService.js';
import { success, created, noContent, errors, paginated } from '../../utils/response.js';
import logger from '../../lib/logger/index.js';
import Joi from 'joi';

// Validation schemas
const uuid = Joi.string().uuid();

const allocationSchemas = {
    list: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        resource_id: Joi.string().uuid(),
        project_id: Joi.string().uuid(),
        status: Joi.string().valid('Active', 'Completed', 'Cancelled'),
    }),
    create: Joi.object({
        resource_id: Joi.string().uuid().required(),
        project_id: Joi.string().uuid().required(),
        allocation_percentage: Joi.number().integer().min(1).max(100).required(),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().greater(Joi.ref('start_date')),
        status: Joi.string().valid('Active', 'Completed', 'Cancelled').default('Active'),
        notes: Joi.string().max(500),
    }),
    update: Joi.object({
        allocation_percentage: Joi.number().integer().min(1).max(100),
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso(),
        status: Joi.string().valid('Active', 'Completed', 'Cancelled'),
        notes: Joi.string().max(500).allow(null),
        version: Joi.number().integer().required(),
    }),
};

const validate = (data, schema) => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
        const validationError = new Error('Validation Error');
        validationError.statusCode = 422;
        validationError.details = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
        throw validationError;
    }
    return value;
};

const listAllocations = async (event) => {
    try {
        const params = validate(event.queryStringParameters || {}, allocationSchemas.list);
        const result = await allocationService.list(params);
        return paginated(result.items, result.total, params.page, params.limit);
    } catch (error) {
        logger.error('Failed to list allocations', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const getAllocation = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: uuid.required() });

        const allocation = await allocationService.getById(id);
        if (!allocation) return errors.notFound('Allocation');

        return success(allocation);
    } catch (error) {
        logger.error('Failed to get allocation', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const createAllocation = async (event) => {
    try {
        const data = validate(event.body, allocationSchemas.create);
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const allocation = await allocationService.create(data, userId);
        return created(allocation);
    } catch (error) {
        logger.error('Failed to create allocation', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        if (error.code === 'ALLOCATION_EXCEEDED') return errors.badRequest(error.message);
        if (error.code === '23503') return errors.badRequest('Resource or Project not found');
        throw error;
    }
};

const updateAllocation = async (event) => {
    try {
        const { id } = event.pathParameters;
        const data = validate(event.body, allocationSchemas.update);
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const allocation = await allocationService.update(id, data, userId);
        if (!allocation) return errors.notFound('Allocation');

        return success(allocation);
    } catch (error) {
        logger.error('Failed to update allocation', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        if (error.code === 'ALLOCATION_EXCEEDED') return errors.badRequest(error.message);
        if (error.message === 'VERSION_CONFLICT') {
            return errors.conflict('Allocation was modified by another user. Please refresh and try again.');
        }
        throw error;
    }
};

const deleteAllocation = async (event) => {
    try {
        const { id } = event.pathParameters;
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const deleted = await allocationService.remove(id, userId);
        if (!deleted) return errors.notFound('Allocation');

        return noContent();
    } catch (error) {
        logger.error('Failed to delete allocation', { error: error.message });
        throw error;
    }
};

const getResourceUtilization = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: uuid.required() });

        const utilization = await allocationService.getResourceUtilization(id);
        if (!utilization) return errors.notFound('Resource');

        return success(utilization);
    } catch (error) {
        logger.error('Failed to get resource utilization', { error: error.message });
        throw error;
    }
};

// Route handling
const routes = {
    'GET /api/v1/allocations': listAllocations,
    'GET /api/v1/allocations/{id}': getAllocation,
    'POST /api/v1/allocations': createAllocation,
    'PUT /api/v1/allocations/{id}': updateAllocation,
    'DELETE /api/v1/allocations/{id}': deleteAllocation,
    'GET /api/v1/resources/{id}/utilization': getResourceUtilization,
};

const baseHandler = async (event) => {
    const routeKey = `${event.httpMethod} ${event.resource}`;
    const handler = routes[routeKey];

    if (!handler) {
        return errors.notFound('Route');
    }

    return handler(event);
};

export const handler = withMiddleware(baseHandler);
