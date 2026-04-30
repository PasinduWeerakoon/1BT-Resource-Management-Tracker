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
        validationError.name = 'ValidationError';
        validationError.details = error.details;
        throw validationError;
    }

    return value;
};

/**
 * Validate request using named schemas
 * @param {string} schemaType - Type of schema (e.g., 'resource', 'project', 'accountType')
 * @param {string} operation - Operation name (e.g., 'create', 'update', 'list')
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data
 */
export const validateRequest = (schemaType, operation, data) => {
    const schemas = {
        resource: resourceSchemas,
        designation: designationSchemas,
        track: trackSchemas,
        tier: tierSchemas,
        client: clientSchemas,
        project: projectSchemas,
        allocation: allocationSchemas,
        user: userSchemas,
        accountType: accountTypeSchemas,
        projectStatus: projectStatusSchemas,
    };

    const schemaGroup = schemas[schemaType];
    if (!schemaGroup) {
        throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const schema = schemaGroup[operation];
    if (!schema) {
        throw new Error(`Unknown operation: ${operation} for schema type: ${schemaType}`);
    }

    return validate(data, schema);
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
// Note: track_id, tier_id, tech_stack_id are INTEGER IDs mapping to configs in /opt/nodejs/configs/index.js
// Note: designation_id, employee_type_id, university_id are INTEGER IDs referencing lookup tables
export const resourceSchemas = {
    list: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(250).default(20), // Resources endpoint allows up to 250
        search: Joi.string().allow('').optional(),
        track_id: Joi.number().integer().min(1).optional(),
        designation_id: Joi.number().integer().min(1).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated').optional(),
        tier_id: Joi.number().integer().min(1).optional(),
        employee_number: Joi.string().optional(),
        name: Joi.string().optional(),
    }),

    create: Joi.object({
        // Required fields
        epf_no: Joi.string().max(20).required(),          // EPF Number (maps to epf_no column)
        emp_no: Joi.string().max(20).required(),          // Employee Number (maps to emp_no column)
        name: Joi.string().max(100).required(),
        email: Joi.string().email().required(),
        // Required INTEGER IDs (config-based)
        track_id: Joi.number().integer().min(1).required(),     // Maps to TRACKS config
        tier_id: Joi.number().integer().min(1).required(),      // Maps to TIERS config
        // Required INTEGER IDs (database lookup tables)
        designation_id: Joi.number().integer().min(1).required(),
        employee_type_id: Joi.number().integer().min(1).required(),
        // Optional fields
        global_employee_id: Joi.string().max(50).allow(null, '').optional(),
        phone_number: Joi.string().max(20).allow(null, '').optional(),
        tech_stack_id: Joi.number().integer().min(1).allow(null).optional(),  // Maps to TECH_STACKS config
        university_id: Joi.number().integer().min(1).allow(null).optional(),
        joined_date: Joi.date().iso().allow(null).optional(),
        date_of_birth: Joi.date().iso().allow(null).optional(),
        last_increment_date: Joi.date().iso().allow(null).optional(),
        last_promotion_date: Joi.date().iso().allow(null).optional(),
        internship_completion_target_date: Joi.date().iso().allow(null).optional(),
        nic_passport: Joi.string().max(50).allow(null, '').optional(),
        is_intern: Joi.boolean().default(false),
        is_external: Joi.boolean().default(false),  // External employee flag
        photo_url: Joi.string().max(500).allow(null, '').optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated').default('Active'),
        tag_ids: Joi.array().items(Joi.number().integer().min(1)).optional(),
        // Billing tab fields
        total_allocation: Joi.number().min(0).max(100).default(0),
        total_resource_billing: Joi.number().min(0).max(100).default(0),
        // Additional fields
        helper_id: Joi.number().integer().min(1).allow(null).optional(),
        helper_is_external: Joi.boolean().default(false),
    }),

    update: Joi.object({
        version: Joi.number().integer().min(1).optional(),
        emp_no: Joi.string().max(20).optional(),
        name: Joi.string().max(100).optional(),
        email: Joi.string().email().allow(null, '').optional(),
        phone_number: Joi.string().max(20).allow(null, '').optional(),
        global_employee_id: Joi.string().max(50).allow(null, '').optional(),
        // INTEGER IDs (config-based)
        track_id: Joi.number().integer().min(1).allow(null).optional(),
        tier_id: Joi.number().integer().min(1).allow(null).optional(),
        tech_stack_id: Joi.number().integer().min(1).allow(null).optional(),
        // INTEGER IDs (database lookup tables)
        designation_id: Joi.number().integer().min(1).allow(null).optional(),
        employee_type_id: Joi.number().integer().min(1).allow(null).optional(),
        university_id: Joi.number().integer().min(1).allow(null).optional(),
        // Dates
        joined_date: Joi.date().iso().allow(null).optional(),
        date_of_birth: Joi.date().iso().allow(null).optional(),
        last_increment_date: Joi.date().iso().allow(null).optional(),
        last_promotion_date: Joi.date().iso().allow(null).optional(),
        internship_completion_target_date: Joi.date().iso().allow(null).optional(),
        notice_period_end_date: Joi.date().iso().allow(null).optional(),
        // Personal info
        nic_passport: Joi.string().max(50).allow(null, '').optional(),
        // Other fields
        is_intern: Joi.boolean().optional(),
        is_external: Joi.boolean().optional(),
        photo_url: Joi.string().max(500).allow(null, '').optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated').optional(),
        is_account_manager: Joi.boolean().optional(),
        tag_ids: Joi.array().items(Joi.number().integer().min(1)).optional(),
        total_allocation: Joi.number().min(0).max(999).optional(),
        total_resource_billing: Joi.number().min(0).max(999).optional(),
        helper_id: Joi.number().integer().min(1).allow(null).optional(),
        helper_is_external: Joi.boolean().optional(),
    }),
};

// Designation Schemas
// tier_id must map to TIERS config: 1=Tier-1, 2=Tier-2, 3=Tier-3, 4=Tier-4, 5=Intern, 6=None, 7=Synergy
export const designationSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
    }),

    create: Joi.object({
        name: Joi.string().max(100).required(),
        level: Joi.number().integer().min(0).max(20).required(),
        tier_id: Joi.number().integer().min(1).max(7).required(), // Maps to TIERS config
        is_intern_role: Joi.boolean().default(false),
        category: Joi.string().max(50).optional(),
        description: Joi.string().max(500).optional(),
    }),

    update: Joi.object({
        name: Joi.string().max(100).optional(),
        level: Joi.number().integer().min(0).max(20).optional(),
        tier_id: Joi.number().integer().min(1).max(7).optional(), // Maps to TIERS config
        is_intern_role: Joi.boolean().optional(),
        category: Joi.string().max(50).optional(),
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

// Project Schemas - uses INTEGER IDs for all references
export const projectSchemas = {
    list: Joi.object({
        ...paginationSchema,
        search: Joi.string().allow('').optional(),
        client_id: Joi.number().integer().min(1).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Completed', 'On Hold').optional(),
        project_type_id: Joi.number().integer().min(1).optional(),
        billing_status_id: Joi.number().integer().min(1).optional(),
    }),

    create: Joi.object({
        project_name: Joi.string().max(200).required(),
        project_code: Joi.string().max(50).optional(),
        project_type_id: Joi.number().integer().min(1).optional(), // References project_types table
        account_type: Joi.string().valid('Internal', 'External').default('Internal'),
        client_id: Joi.number().integer().min(1).optional(), // References clients table
        project_start_date: Joi.date().iso().optional(),
        project_end_date: Joi.date().iso().optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Completed', 'On Hold').default('Active'),
        billing_status_id: Joi.number().integer().min(1).optional(), // References billing_statuses table
        team_size: Joi.number().integer().min(1).default(1),
        account_manager_id: Joi.number().integer().min(1).optional(), // References employees table
        account_reg_sales_owner: Joi.string().max(100).optional(),
        budget: Joi.number().min(0).optional(),
        description: Joi.string().max(1000).optional(),
    }),

    update: Joi.object({
        project_name: Joi.string().max(200).optional(),
        project_code: Joi.string().max(50).allow(null, '').optional(),
        project_type_id: Joi.number().integer().min(1).allow(null).optional(),
        account_type: Joi.string().valid('Internal', 'External').optional(),
        client_id: Joi.number().integer().min(1).allow(null).optional(),
        project_start_date: Joi.date().iso().allow(null).optional(),
        project_end_date: Joi.date().iso().allow(null).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Completed', 'On Hold').optional(),
        billing_status_id: Joi.number().integer().min(1).allow(null).optional(),
        team_size: Joi.number().integer().min(1).optional(),
        account_manager_id: Joi.number().integer().min(1).allow(null).optional(),
        account_reg_sales_owner: Joi.string().max(100).allow(null, '').optional(),
        budget: Joi.number().min(0).allow(null).optional(),
        description: Joi.string().max(1000).allow(null, '').optional(),
        version: Joi.number().integer().min(1).optional(), // For optimistic locking
    }),
};

// Allocation Schemas - uses INTEGER IDs for all references
// Note: Uses resource_id as API parameter name (maps to employee_id in DB)
export const allocationSchemas = {
    list: Joi.object({
        ...paginationSchema,
        resource_id: Joi.number().integer().min(1).optional(),
        project_id: Joi.number().integer().min(1).optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        is_active: Joi.boolean().optional(),
    }),

    monthly: Joi.object({
        year: Joi.number().integer().min(2020).max(2100).required(),
        month: Joi.number().integer().min(1).max(12).required(),
        track_id: Joi.number().integer().min(1).optional(),
    }),

    create: Joi.object({
        resource_id: Joi.number().integer().min(1).required(),
        project_id: Joi.number().integer().min(1).required(),
        allocation_percentage: Joi.number().min(0).max(200).required()
            .messages({
                'number.max': 'Allocation percentage cannot exceed 200%',
                'number.min': 'Allocation percentage must be at least 0%'
            }),
        start_date: Joi.date().iso().required(),
        // end_date is always optional — a 0% allocation with billing > 0 is a valid billing-only record
        end_date: Joi.date().iso().allow(null).optional(),
        billing_percentage: Joi.number().min(0).max(100).default(100),
        billing_status_id: Joi.number().integer().min(1).required()
            .messages({ 'any.required': 'billing_status_id is required when creating an allocation' }),
        notes: Joi.string().max(500).allow('').optional(),
        effective_date: Joi.date().iso().allow(null).optional(),
        forceOverallocation: Joi.boolean().optional(),
    }).custom((value, helpers) => {
        // allocation_percentage and billing_percentage cannot both be 0%
        const alloc = value.allocation_percentage;
        // billing_percentage default (100) is applied by Joi before custom() runs
        const billing = value.billing_percentage;
        if (alloc === 0 && billing === 0) {
            return helpers.message(
                'Allocation percentage and Billing percentage cannot both be 0%. At least one must be greater than 0%.'
            );
        }
        return value;
    }),

    update: Joi.object({
        allocation_percentage: Joi.number().min(0).max(200).optional()
            .messages({
                'number.max': 'Allocation percentage cannot exceed 200%',
                'number.min': 'Allocation percentage must be at least 0%'
            }),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().allow(null).optional(),
        billing_percentage: Joi.number().min(0).max(100).optional(),
        billing_status_id: Joi.number().integer().min(1).optional(),
        is_active: Joi.boolean().optional(),
        notes: Joi.string().max(500).allow('').optional(),
        effective_date: Joi.date().iso().allow(null).optional(),
        forceOverallocation: Joi.boolean().optional(),
        version: Joi.number().integer().min(1).optional(),
        // Note: cross-field both=0 check is enforced in the handler where existing values are available
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

// Account Type Schemas
export const accountTypeSchemas = {
    create: Joi.object({
        name: Joi.string().max(100).required(),
        description: Joi.string().max(500).allow('', null).optional(),
        is_active: Joi.boolean().optional().default(true),
    }),

    update: Joi.object({
        name: Joi.string().max(100).optional(),
        description: Joi.string().max(500).allow('', null).optional(),
        is_active: Joi.boolean().optional(),
    }),
};

// Project Status Schemas
export const projectStatusSchemas = {
    create: Joi.object({
        name: Joi.string().max(100).required(),
        description: Joi.string().max(500).allow('', null).optional(),
        is_active: Joi.boolean().optional().default(true),
    }),

    update: Joi.object({
        name: Joi.string().max(100).optional(),
        description: Joi.string().max(500).allow('', null).optional(),
        is_active: Joi.boolean().optional(),
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
    accountTypeSchemas,
    projectStatusSchemas,
};
