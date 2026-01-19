/**
 * Reports Lambda Handler
 * Analytics and operational reports
 */

import { withMiddleware } from '../../middleware/index.js';
import reportsService from '../../services/reportsService.js';
import { success, errors } from '../../utils/response.js';
import logger from '../../lib/logger/index.js';
import Joi from 'joi';

// Validation for report filters
const reportSchemas = {
    allocations: Joi.object({
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso(),
        project_type: Joi.string().valid('INTERNAL', 'EXTERNAL'),
        department: Joi.string()
    })
};

const validate = (data, schema) => {
    const { error, value } = schema.validate(data || {}, { abortEarly: false, stripUnknown: true });
    if (error) {
        const validationError = new Error('Validation Error');
        validationError.statusCode = 422;
        validationError.details = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
        throw validationError;
    }
    return value;
};

/**
 * GET /api/v1/reports/allocations
 */
const getAllocationReport = async (event) => {
    try {
        console.log('getAllocationReport: START');
        const filters = validate(event.queryStringParameters, reportSchemas.allocations);
        console.log('getAllocationReport: Validated Filters', filters);
        const data = await reportsService.getAllocationReport(filters);
        console.log('getAllocationReport: Data fetched', data?.length);
        return success(data);
    } catch (error) {
        logger.error('Failed to generate allocation report', { error: error.message });
        if (error.statusCode === 422) return errors.validationError(error.details);
        throw error;
    }
};

/**
 * GET /api/v1/reports/bench
 */
const getBenchReport = async (event) => {
    try {
        const data = await reportsService.getBenchReport();
        return success(data);
    } catch (error) {
        logger.error('Failed to generate bench report', { error: error.message });
        throw error;
    }
};

/**
 * GET /api/v1/reports/utilization
 */
const getUtilizationReport = async (event) => {
    try {
        const data = await reportsService.getUtilizationReport();
        return success(data);
    } catch (error) {
        logger.error('Failed to generate utilization report', { error: error.message });
        throw error;
    }
};

// Route handling
const routes = {
    'GET /api/v1/reports/allocations': getAllocationReport,
    'GET /api/v1/reports/bench': getBenchReport,
    'GET /api/v1/reports/utilization': getUtilizationReport
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
