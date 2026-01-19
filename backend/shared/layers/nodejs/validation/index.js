/**
 * Validation module
 * Provides schema validation for API requests
 */

import Joi from 'joi';

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {Joi.Schema} schema - Joi schema
 * @returns {Object} Validated data with defaults applied
 * @throws {Error} If validation fails
 */
export const validate = (data, schema) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        const validationError = new Error(messages);
        validationError.statusCode = 400;
        validationError.isValidationError = true;
        throw validationError;
    }

    return value;
};

// Common validation patterns
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pagination schema
const paginationSchema = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
};

// Resource Schemas
export const resourceSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        track_id: Joi.string().pattern(uuidPattern).optional(),
        designation_id: Joi.string().pattern(uuidPattern).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave').optional(),
        intern_classification: Joi.string().optional(),
    }),

    create: Joi.object({
        employee_id: Joi.string().max(20).required(),
        employee_number: Joi.string().max(20).required(),
        name: Joi.string().max(100).required(),
        phone_number: Joi.string().max(100).required(),
        email: Joi.string().pattern(emailPattern).optional(),
        address: Joi.string().max(500).optional(),
        track_id: Joi.string().pattern(uuidPattern).required(),
        designation_id: Joi.string().pattern(uuidPattern).required(),
        date_of_joining: Joi.date().iso().optional(),
        intern_classification: Joi.string().max(20).optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave').default('Active'),
    }),

    update: Joi.object({
        version: Joi.number().integer().min(1).optional(),
        employee_number: Joi.string().max(20).optional(),
        name: Joi.string().max(100).optional(),
        phone_number: Joi.string().max(100).optional(),
        email: Joi.string().pattern(emailPattern).optional(),
        address: Joi.string().max(500).optional(),
        track_id: Joi.string().pattern(uuidPattern).optional(),
        designation_id: Joi.string().pattern(uuidPattern).optional(),
        date_of_joining: Joi.date().iso().optional(),
        intern_classification: Joi.string().max(20).optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave').optional(),
        notice_period_end_date: Joi.date().iso().optional(),
    }),
};

// Designation Schemas
export const designationSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
    }),

    create: Joi.object({
        name: Joi.string().max(100).required(),
        level: Joi.number().integer().min(1).max(20).required(),
        description: Joi.string().max(500).optional(),
    }),

    update: Joi.object({
        name: Joi.string().max(100).optional(),
        level: Joi.number().integer().min(1).max(20).optional(),
        description: Joi.string().max(500).optional(),
    }),
};

// Track Schemas
export const trackSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
    }),

    create: Joi.object({
        name: Joi.string().max(100).required(),
        code: Joi.string().max(20).required(),
        description: Joi.string().max(500).optional(),
    }),

    update: Joi.object({
        name: Joi.string().max(100).optional(),
        code: Joi.string().max(20).optional(),
        description: Joi.string().max(500).optional(),
    }),
};

// Client Schemas
export const clientSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        status: Joi.string().valid('active', 'inactive').optional(),
    }),

    create: Joi.object({
        name: Joi.string().max(200).required(),
        code: Joi.string().max(20).required(),
        contact_email: Joi.string().pattern(emailPattern).optional(),
        contact_phone: Joi.string().max(20).optional(),
        status: Joi.string().valid('active', 'inactive').default('active'),
    }),

    update: Joi.object({
        name: Joi.string().max(200).optional(),
        code: Joi.string().max(20).optional(),
        contact_email: Joi.string().pattern(emailPattern).optional(),
        contact_phone: Joi.string().max(20).optional(),
        status: Joi.string().valid('active', 'inactive').optional(),
    }),
};

// Project Schemas
export const projectSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        client_id: Joi.string().pattern(uuidPattern).optional(),
        status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').optional(),
        billing_type: Joi.string().valid('billable', 'non_billable', 'pre_sales', 'internal').optional(),
    }),

    create: Joi.object({
        name: Joi.string().max(200).required(),
        code: Joi.string().max(20).required(),
        client_id: Joi.string().pattern(uuidPattern).required(),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().optional(),
        status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').default('active'),
        billing_type: Joi.string().valid('billable', 'non_billable', 'pre_sales', 'internal').required(),
        account_manager_id: Joi.string().pattern(uuidPattern).optional(),
        description: Joi.string().max(1000).optional(),
    }),

    update: Joi.object({
        name: Joi.string().max(200).optional(),
        code: Joi.string().max(20).optional(),
        client_id: Joi.string().pattern(uuidPattern).optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').optional(),
        billing_type: Joi.string().valid('billable', 'non_billable', 'pre_sales', 'internal').optional(),
        account_manager_id: Joi.string().pattern(uuidPattern).optional(),
        description: Joi.string().max(1000).optional(),
    }),
};

// Allocation Schemas
export const allocationSchemas = {
    list: Joi.object({
        ...paginationSchema,
        resource_id: Joi.string().pattern(uuidPattern).optional(),
        project_id: Joi.string().pattern(uuidPattern).optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        status: Joi.string().valid('active', 'completed', 'planned').optional(),
    }),

    monthly: Joi.object({
        year: Joi.number().integer().min(2020).max(2100).required(),
        month: Joi.number().integer().min(1).max(12).required(),
        track_id: Joi.string().pattern(uuidPattern).optional(),
    }),

    create: Joi.object({
        resource_id: Joi.string().pattern(uuidPattern).required(),
        project_id: Joi.string().pattern(uuidPattern).required(),
        allocation_percentage: Joi.number().min(0).max(100).required(),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().optional(),
        billing_percentage: Joi.number().min(0).max(100).default(100),
        notes: Joi.string().max(500).optional(),
    }),

    update: Joi.object({
        allocation_percentage: Joi.number().min(0).max(100).optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        billing_percentage: Joi.number().min(0).max(100).optional(),
        is_active: Joi.boolean().optional(),
        notes: Joi.string().max(500).optional(),
    }),
};

// User Schemas
export const userSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        role: Joi.string().valid('SuperAdmin', 'Admin', 'Manager', 'User').optional(),
    }),

    create: Joi.object({
        email: Joi.string().pattern(emailPattern).required(),
        name: Joi.string().max(200).required(),
        role: Joi.string().valid('SuperAdmin', 'Admin', 'Manager', 'User').required(),
        resource_id: Joi.string().pattern(uuidPattern).optional(),
    }),

    update: Joi.object({
        name: Joi.string().max(200).optional(),
        role: Joi.string().valid('SuperAdmin', 'Admin', 'Manager', 'User').optional(),
        resource_id: Joi.string().pattern(uuidPattern).optional(),
    }),
};

export default {
    validate,
    resourceSchemas,
    designationSchemas,
    trackSchemas,
    clientSchemas,
    projectSchemas,
    allocationSchemas,
    userSchemas,
};
