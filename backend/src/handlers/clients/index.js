/**
 * Clients Lambda Handler
 * CRUD operations for Clients
 */

import { withMiddleware } from '../../middleware/index.js';
import clientService from '../../services/clientService.js';
import { success, created, noContent, errors, paginated } from '../../utils/response.js';
import logger from '../../lib/logger/index.js';
import Joi from 'joi';

// Validation schemas
const uuid = Joi.string().uuid();

const clientSchemas = {
    list: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string().max(100),
        is_active: Joi.boolean(),
    }),
    create: Joi.object({
        client_name: Joi.string().max(100).required(),
        contact_person: Joi.string().max(100),
        contact_email: Joi.string().email().max(100),
        contact_phone: Joi.string().max(20),
        address: Joi.string().max(500),
        is_active: Joi.boolean().default(true),
    }),
    update: Joi.object({
        client_name: Joi.string().max(100),
        contact_person: Joi.string().max(100).allow(null),
        contact_email: Joi.string().email().max(100).allow(null),
        contact_phone: Joi.string().max(20).allow(null),
        address: Joi.string().max(500).allow(null),
        is_active: Joi.boolean(),
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

const listClients = async (event) => {
    try {
        const params = validate(event.queryStringParameters || {}, clientSchemas.list);
        const result = await clientService.list(params);
        return paginated(result.items, result.total, params.page, params.limit);
    } catch (error) {
        logger.error('Failed to list clients', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const getClient = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: uuid.required() });

        const client = await clientService.getById(id);
        if (!client) return errors.notFound('Client');

        return success(client);
    } catch (error) {
        logger.error('Failed to get client', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

const createClient = async (event) => {
    try {
        const data = validate(event.body, clientSchemas.create);
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const client = await clientService.create(data, userId);
        return created(client);
    } catch (error) {
        logger.error('Failed to create client', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        if (error.code === '23505') return errors.conflict('Client with this name already exists');
        throw error;
    }
};

const updateClient = async (event) => {
    try {
        const { id } = event.pathParameters;
        const data = validate(event.body, clientSchemas.update);
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const client = await clientService.update(id, data, userId);
        if (!client) return errors.notFound('Client');

        return success(client);
    } catch (error) {
        logger.error('Failed to update client', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        if (error.code === '23505') return errors.conflict('Client with this name already exists');
        throw error;
    }
};

const deleteClient = async (event) => {
    try {
        const { id } = event.pathParameters;
        const userId = event.user?.id;

        if (!userId) return errors.unauthorized('User context required');

        const deleted = await clientService.softDelete(id, userId);
        if (!deleted) return errors.notFound('Client');

        return noContent();
    } catch (error) {
        logger.error('Failed to delete client', { error: error.message });
        throw error;
    }
};

const getClientProjects = async (event) => {
    try {
        const { id } = event.pathParameters;
        validate({ id }, { id: uuid.required() });

        const client = await clientService.getById(id);
        if (!client) return errors.notFound('Client');

        const projects = await clientService.getProjects(id);
        return success(projects);
    } catch (error) {
        logger.error('Failed to get client projects', { error: error.message });
        throw error;
    }
};

// Route handling
const routes = {
    'GET /api/v1/clients': listClients,
    'GET /api/v1/clients/{id}': getClient,
    'POST /api/v1/clients': createClient,
    'PUT /api/v1/clients/{id}': updateClient,
    'DELETE /api/v1/clients/{id}': deleteClient,
    'GET /api/v1/clients/{id}/projects': getClientProjects,
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
