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
        tier: Joi.string().optional(),
        employee_number: Joi.string().optional(),
        name: Joi.string().optional(),
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
        date_of_birth: Joi.date().iso().optional(),
        nic_passport: Joi.string().max(50).optional(),
        is_intern: Joi.boolean().default(false),
        employee_type: Joi.string().valid('Internal', 'External').default('Internal'),
        tier: Joi.string().valid('Synergy', 'Tier - 1', 'Tier - 2', 'Tier - 3', 'Tier - 4', 'Intern').optional(),
        tech_stack: Joi.string().max(50).optional(),
        photo_url: Joi.string().max(500).optional(),
        intern_classification: Joi.string().max(20).optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave').default('Active'),
        tag_ids: Joi.array().items(Joi.string().pattern(uuidPattern)).optional(),
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
        date_of_birth: Joi.date().iso().optional(),
        nic_passport: Joi.string().max(50).optional(),
        is_intern: Joi.boolean().optional(),
        employee_type: Joi.string().valid('Internal', 'External').optional(),
        tier: Joi.string().valid('Synergy', 'Tier - 1', 'Tier - 2', 'Tier - 3', 'Tier - 4', 'Intern').allow(null).optional(),
        tech_stack: Joi.string().max(50).allow(null).optional(),
        photo_url: Joi.string().max(500).allow(null).optional(),
        intern_classification: Joi.string().max(20).optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave').optional(),
        notice_period_end_date: Joi.date().iso().optional(),
        is_account_manager: Joi.boolean().optional(),
        tag_ids: Joi.array().items(Joi.string().pattern(uuidPattern)).optional(),
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

// Tier Schemas
export const tierSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        is_active: Joi.string().valid('true', 'false').optional(),
    }),

    create: Joi.object({
        name: Joi.string().max(50).required(),
        level: Joi.number().integer().min(1).max(100).optional(),
        description: Joi.string().max(500).optional(),
        is_active: Joi.boolean().default(true),
    }),

    update: Joi.object({
        name: Joi.string().max(50).optional(),
        level: Joi.number().integer().min(1).max(100).optional(),
        description: Joi.string().max(500).optional(),
        is_active: Joi.boolean().optional(),
    }),
};

// Client Schemas
export const clientSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        is_active: Joi.string().valid('true', 'false').optional(),
    }),

    create: Joi.object({
        client_name: Joi.string().max(100).required(),
        contact_person: Joi.string().max(100).optional(),
        contact_email: Joi.string().pattern(emailPattern).optional(),
        contact_phone: Joi.string().max(50).optional(),
        address: Joi.string().max(500).optional(),
        is_active: Joi.boolean().default(true),
    }),

    update: Joi.object({
        client_name: Joi.string().max(100).optional(),
        contact_person: Joi.string().max(100).optional(),
        contact_email: Joi.string().pattern(emailPattern).optional(),
        contact_phone: Joi.string().max(50).optional(),
        address: Joi.string().max(500).optional(),
        is_active: Joi.boolean().optional(),
    }),
};

// Project Schemas - matches handler and DB (project_name, project_type, is_billable)
export const projectSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        client_id: Joi.string().pattern(uuidPattern).optional(),
        status: Joi.string().valid('Active', 'Completed', 'On Hold', 'Cancelled', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED').optional(),
        project_type: Joi.string().valid('Client', 'Internal', 'Pre-Sales', 'Bench').optional(),
    }),

    create: Joi.object({
        project_name: Joi.string().max(200).required(),
        project_code: Joi.string().max(50).optional(),
        project_type: Joi.string().valid('Client', 'Bench', 'Training', 'POC', 'Presale', 'Research').default('Client'),
        account_type: Joi.string().valid('Internal', 'External').default('Internal'),
        client_id: Joi.string().pattern(uuidPattern).optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        status: Joi.string().valid('Active', 'Completed', 'On Hold', 'Cancelled', 'ACTIVE').default('Active'),
        is_billable: Joi.boolean().default(true),
        billing_type: Joi.string().valid('Billing', 'Non-Billing').default('Billing'),
        team_size: Joi.number().integer().min(1).default(1),
        account_manager: Joi.string().max(100).optional(),
        account_manager_id: Joi.string().pattern(uuidPattern).required(),
        account_reg_sales_owner: Joi.string().max(100).optional(),
        budget: Joi.number().min(0).optional(),
        description: Joi.string().max(1000).optional(),
    }),

    update: Joi.object({
        project_name: Joi.string().max(200).optional(),
        project_code: Joi.string().max(50).optional(),
        project_type: Joi.string().valid('Client', 'Bench', 'Training', 'POC', 'Presale', 'Research').optional(),
        account_type: Joi.string().valid('Internal', 'External').optional(),
        client_id: Joi.string().pattern(uuidPattern).allow(null).optional(),
        start_date: Joi.date().iso().allow(null).optional(),
        end_date: Joi.date().iso().allow(null).optional(),
        status: Joi.string().valid('Active', 'Completed', 'On Hold', 'Cancelled', 'ACTIVE').optional(),
        is_billable: Joi.boolean().optional(),
        billing_type: Joi.string().valid('Billing', 'Non-Billing').optional(),
        team_size: Joi.number().integer().min(1).optional(),
        account_manager: Joi.string().max(100).optional(),
        account_manager_id: Joi.string().pattern(uuidPattern).optional(),
        account_reg_sales_owner: Joi.string().max(100).optional(),
        budget: Joi.number().min(0).allow(null).optional(),
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
        notes: Joi.string().max(500).allow('').optional(),
        effective_date: Joi.date().iso().optional(), // 3-table architecture: overrides start_date for routing
        forceOverallocation: Joi.boolean().optional(), // Allow force flag for CRITICAL overallocations
    }),

    update: Joi.object({
        allocation_percentage: Joi.number().min(0).max(100).optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        billing_percentage: Joi.number().min(0).max(100).optional(),
        is_active: Joi.boolean().optional(),
        notes: Joi.string().max(500).allow('').optional(),
        effective_date: Joi.date().iso().optional(), // 3-table architecture: overrides start_date for routing
        forceOverallocation: Joi.boolean().optional(), // Allow force flag for CRITICAL overallocations
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
    tierSchemas,
    clientSchemas,
    projectSchemas,
    allocationSchemas,
    userSchemas,
};
