/**
 * Validation Schemas
 * Joi schemas for request validation
 */

import Joi from 'joi';

// Common field patterns
const uuid = Joi.string().uuid({ version: 'uuidv4' });
const email = Joi.string().email().max(100);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).max(50);
const pagination = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
};

/**
 * Resource (Employee) Schemas - Aligned with DB
 */
const resourceSchemas = {
    create: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().max(100).required(),
        mobile: Joi.string().max(20),
        nic: Joi.string().max(20),
        designation_id: uuid.required(),
        track_id: uuid.required(),
        join_date: Joi.date().iso(),
        status: Joi.string().valid('Active', 'Bench', 'Resigned', 'Terminated'),
        is_intern: Joi.boolean().default(false),
    }),

    update: Joi.object({
        name: Joi.string().min(2).max(100),
        email: Joi.string().email().max(100),
        mobile: Joi.string().max(20),
        nic: Joi.string().max(20),
        designation_id: uuid,
        track_id: uuid,
        join_date: Joi.date().iso(),
        status: Joi.string().valid('Active', 'Bench', 'Resigned', 'Terminated'),
        is_intern: Joi.boolean(),
        version: Joi.number().integer().required(), // For optimistic locking
    }),

    list: Joi.object({
        ...pagination,
        search: Joi.string().max(100),
        track_id: uuid,
        designation_id: uuid,
        status: Joi.string().valid('Active', 'Bench', 'Resigned', 'Terminated'),
        is_intern: Joi.boolean(),
    }),
};

/**
 * Project Schemas
 */
const projectSchemas = {
    create: Joi.object({
        project_name: Joi.string().min(3).max(200).required(),
        project_code: Joi.string().max(50),
        project_type: Joi.string().valid('Client', 'Bench', 'Training', 'POC', 'Presale', 'Research').required(),
        account_type: Joi.string().valid('Internal', 'External').required(),
        team_size: Joi.number().integer().min(1).default(1),
        account_manager: Joi.string().min(2).max(100).required(),
        account_reg_sales_owner: Joi.string().max(100),
        client_id: uuid.when('account_type', {
            is: 'External',
            then: Joi.required(),
        }),
        project_start_date: Joi.date().iso(),
        project_end_date: Joi.date().iso().min(Joi.ref('project_start_date')),
        billing_type: Joi.string().valid('Billing', 'Non-Billing').default('Billing'),
        budget: Joi.number().precision(2).min(0).when('billing_type', {
            is: 'Billing',
            otherwise: Joi.forbidden(),
        }),
        description: Joi.string().max(2000),
    }),

    update: Joi.object({
        project_name: Joi.string().min(3).max(200),
        project_code: Joi.string().max(50),
        team_size: Joi.number().integer().min(1),
        account_manager: Joi.string().min(2).max(100),
        client_id: uuid,
        project_start_date: Joi.date().iso(),
        project_end_date: Joi.date().iso(),
        status: Joi.string().valid('Active', 'Inactive', 'Completed', 'On Hold'),
        description: Joi.string().max(2000),
        version: Joi.number().integer().required(),
    }),
};

/**
 * Allocation Schemas
 */
const allocationSchemas = {
    create: Joi.object({
        resource_id: uuid.required(),
        project_id: uuid.required(),
        project_allocation: Joi.number().precision(2).min(0).max(200).required(),
        billing_percentage: Joi.number().precision(2).min(0).max(100).required(),
        billing_status: Joi.string().valid('Billing', 'Non-Billing').required(),
        is_critical_shadow: Joi.boolean().default(false),
        critical_shadow_percentage: Joi.number().precision(2).min(0).max(100).when('is_critical_shadow', {
            is: true,
            then: Joi.required(),
        }),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().min(Joi.ref('start_date')),
        notes: Joi.string().max(1000),
    }),

    update: Joi.object({
        project_allocation: Joi.number().precision(2).min(0).max(200),
        billing_percentage: Joi.number().precision(2).min(0).max(100),
        billing_status: Joi.string().valid('Billing', 'Non-Billing'),
        is_critical_shadow: Joi.boolean(),
        critical_shadow_percentage: Joi.number().precision(2).min(0).max(100),
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso(),
        status: Joi.string().valid('Active', 'Inactive'),
        notes: Joi.string().max(1000),
        version: Joi.number().integer().required(),
    }),
};

/**
 * Client Schemas
 */
const clientSchemas = {
    create: Joi.object({
        client_name: Joi.string().min(2).max(100).required(),
        client_code: Joi.string().max(20),
        contact_person: Joi.string().max(100),
        contact_email: email,
        contact_phone: phone,
        address: Joi.string().max(500),
        billing_address: Joi.string().max(500),
        currency: Joi.string().length(3).uppercase().default('USD'),
    }),

    update: Joi.object({
        client_name: Joi.string().min(2).max(100),
        client_code: Joi.string().max(20),
        contact_person: Joi.string().max(100),
        contact_email: email,
        contact_phone: phone,
        address: Joi.string().max(500),
        billing_address: Joi.string().max(500),
        currency: Joi.string().length(3).uppercase(),
        status: Joi.string().valid('Active', 'Inactive'),
    }),
};

/**
 * Track Schemas
 */
const trackSchemas = {
    create: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        description: Joi.string().max(255),
        is_active: Joi.boolean().default(true),
    }),
    update: Joi.object({
        name: Joi.string().min(2).max(50),
        description: Joi.string().max(255),
        is_active: Joi.boolean(),
    }),
};

/**
 * Designation Schemas
 */
const designationSchemas = {
    create: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        level: Joi.number().integer().min(1).max(10).required(),
        is_intern_role: Joi.boolean().default(false),
        is_active: Joi.boolean().default(true),
    }),
    update: Joi.object({
        name: Joi.string().min(2).max(100),
        level: Joi.number().integer().min(1).max(10),
        is_intern_role: Joi.boolean(),
        is_active: Joi.boolean(),
    }),
};

/**
 * Validate request data against schema
 * @param {object} data - Data to validate
 * @param {Joi.Schema} schema - Joi schema
 * @returns {object} Validated data or throws error
 */
const validate = (data, schema) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const details = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
        }));
        const validationError = new Error('Validation failed');
        validationError.statusCode = 422;
        validationError.details = details;
        throw validationError;
    }

    return value;
};

export {
    resourceSchemas,
    projectSchemas,
    allocationSchemas,
    clientSchemas,
    trackSchemas,
    designationSchemas,
    validate,
    uuid,
    pagination,
};
