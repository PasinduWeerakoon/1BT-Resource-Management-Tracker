/**
 * Projects Lambda Handler
 * CRUD operations for Projects
 */

import { withMiddleware } from '../../middleware/index.js';
import projectService from '../../services/projectService.js';
import { success, created, noContent, errors, paginated } from '../../utils/response.js';
import logger from '../../lib/logger/index.js';
import Joi from 'joi';

// Validation schemas
const uuid = Joi.string().uuid();

const projectSchemas = {
    list: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string().max(100),
        client_id: Joi.string().uuid(),
        status: Joi.string().valid('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
        project_type: Joi.string().valid('INTERNAL', 'EXTERNAL', 'BenchProject'),
        is_billable: Joi.boolean(),
    }),
    create: Joi.object({
        project_name: Joi.string().max(100).required(),
        client_id: Joi.string().uuid(),
        project_type: Joi.string().valid('INTERNAL', 'EXTERNAL', 'BenchProject').default('INTERNAL'),
        is_billable: Joi.boolean().default(true),
        status: Joi.string().valid('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED').default('ACTIVE'),
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso().greater(Joi.ref('start_date')),
        description: Joi.string().max(1000),
    }),
    update: Joi.object({
        project_name: Joi.string().max(100),
        client_id: Joi.string().uuid().allow(null),
        project_type: Joi.string().valid('INTERNAL', 'EXTERNAL', 'BenchProject'),
        is_billable: Joi.boolean(),
        status: Joi.string().valid('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso(),
        description: Joi.string().max(1000).allow(null),
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

const listProjects = async (event) => {
    try {
        const params = validate(event.queryStringParameters || {}, projectSchemas.list);
        const result = await projectService.list(params);
        return paginated(result.items, result.total, params.page, params.limit);
    } catch (error) {
        logger.error('Failed to list projects', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const getProject = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: uuid.required() });

        const project = await projectService.getById(id);
        if (!project) return errors.notFound('Project');

        return success(project);
    } catch (error) {
        logger.error('Failed to get project', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const createProject = async (event) => {
    try {
        const data = validate(event.body, projectSchemas.create);
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const project = await projectService.create(data, userId);
        return created(project);
    } catch (error) {
        logger.error('Failed to create project', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const updateProject = async (event) => {
    try {
        const { id } = event.pathParameters;
        const data = validate(event.body, projectSchemas.update);
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const project = await projectService.update(id, data, userId);
        if (!project) return errors.notFound('Project');

        return success(project);
    } catch (error) {
        logger.error('Failed to update project', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        if (error.message === 'VERSION_CONFLICT') {
            return errors.conflict('Project was modified by another user. Please refresh and try again.');
        }
        throw error;
    }
};

const deleteProject = async (event) => {
    try {
        const { id } = event.pathParameters;
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const deleted = await projectService.softDelete(id, userId);
        if (!deleted) return errors.notFound('Project');

        return noContent();
    } catch (error) {
        logger.error('Failed to delete project', { error: error.message });
        throw error;
    }
};

const getProjectAllocations = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: uuid.required() });

        const project = await projectService.getById(id);
        if (!project) return errors.notFound('Project');

        const allocations = await projectService.getAllocations(id);
        return success(allocations);
    } catch (error) {
        logger.error('Failed to get project allocations', { error: error.message });
        throw error;
    }
};

// Route handling
const routes = {
    'GET /api/v1/projects': listProjects,
    'GET /api/v1/projects/{id}': getProject,
    'POST /api/v1/projects': createProject,
    'PUT /api/v1/projects/{id}': updateProject,
    'DELETE /api/v1/projects/{id}': deleteProject,
    'GET /api/v1/projects/{id}/allocations': getProjectAllocations,
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
