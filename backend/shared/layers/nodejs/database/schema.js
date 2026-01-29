/**
 * Drizzle ORM Schema
 * Type-safe database schema definitions for 1BT Resource Management
 */

import { pgTable, uuid, varchar, text, boolean, integer, decimal, date, timestamp, pgEnum, jsonb, inet, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============ ENUMS ============

export const userRoleEnum = pgEnum('user_role', ['Super User', 'Admin', 'User']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'Inactive', 'Suspended', 'Pending']);
export const resourceStatusEnum = pgEnum('resource_status', ['Active', 'Inactive', 'Serving Notice Period', 'On Leave']);
export const projectStatusEnum = pgEnum('project_status', ['Active', 'Inactive', 'Completed', 'On Hold']);
export const projectTypeEnum = pgEnum('project_type', ['Client', 'Bench', 'Training', 'POC', 'Presale', 'Research']);
export const accountTypeEnum = pgEnum('account_type', ['Internal', 'External']);
export const billingStatusEnum = pgEnum('billing_status', ['Billing', 'Non-Billing']);
export const changeTypeEnum = pgEnum('change_type', ['CREATED', 'UPDATED', 'DELETED', 'RESTORED']);
export const auditActionEnum = pgEnum('audit_action', [
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE'
]);

// ============ TABLES ============

// Tracks table
export const tracks = pgTable('tracks', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by'),
});

// Designations table
export const designations = pgTable('designations', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 50 }).notNull().unique(),
    level: integer('level'),
    isInternRole: boolean('is_intern_role').default(false),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by'),
});

// Tiers table
export const tiers = pgTable('tiers', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    level: integer('level'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by'),
});

// Resources table (employees)
export const resources = pgTable('resources', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    employeeId: varchar('employee_id', { length: 20 }).notNull(),
    employeeNumber: varchar('employee_number', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }),
    address: varchar('address', { length: 500 }),
    designationId: uuid('designation_id').notNull().references(() => designations.id),
    trackId: uuid('track_id').notNull().references(() => tracks.id),
    internClassification: varchar('intern_classification', { length: 20 }),
    skills: text('skills').array().default(sql`'{}'`),
    dateOfJoining: date('date_of_joining'),
    dateOfBirth: date('date_of_birth'),
    nicPassport: varchar('nic_passport', { length: 50 }),
    isIntern: boolean('is_intern').default(false),
    isAccountManager: boolean('is_account_manager').default(false),
    tier: varchar('tier', { length: 20 }),
    techStack: varchar('tech_stack', { length: 50 }),
    photoUrl: varchar('photo_url', { length: 500 }),
    status: resourceStatusEnum('status').notNull().default('Active'),
    noticePeriodEndDate: date('notice_period_end_date'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by'),
}, (table) => ({
    employeeIdUnique: uniqueIndex('resources_employee_id_unique').on(table.employeeId).where(sql`deleted_at IS NULL`),
    employeeNumberUnique: uniqueIndex('resources_employee_number_unique').on(table.employeeNumber).where(sql`deleted_at IS NULL`),
    accountManagerIdx: index('idx_resources_account_manager').on(table.isAccountManager).where(sql`is_account_manager = true`),
    tierIdx: index('idx_resources_tier').on(table.tier),
    techStackIdx: index('idx_resources_tech_stack').on(table.techStack),
    isInternIdx: index('idx_resources_is_intern').on(table.isIntern).where(sql`is_intern = true`),
}));

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    cognitoUserId: varchar('cognito_user_id', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull().default('User'),
    status: userStatusEnum('status').notNull().default('Active'),
    resourceId: uuid('resource_id').references(() => resources.id),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Billing Statuses table (configurable)
export const billingStatuses = pgTable('billing_statuses', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    color: varchar('color', { length: 20 }).default('#1890ff'),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false), // System statuses cannot be deleted
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
    isActiveIdx: index('idx_billing_statuses_is_active').on(table.isActive),
    displayOrderIdx: index('idx_billing_statuses_display_order').on(table.displayOrder),
}));

// Clients table
export const clients = pgTable('clients', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clientName: varchar('client_name', { length: 100 }).notNull().unique(),
    contactPerson: varchar('contact_person', { length: 100 }),
    contactEmail: varchar('contact_email', { length: 100 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    address: text('address'),
    isActive: boolean('is_active').default(true),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
});

// Projects table
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectName: varchar('project_name', { length: 100 }).notNull(),
    projectCode: varchar('project_code', { length: 20 }).unique(),
    clientId: uuid('client_id').references(() => clients.id),
    projectType: projectTypeEnum('project_type').notNull().default('Client'),
    accountType: accountTypeEnum('account_type').notNull().default('Internal'),
    status: projectStatusEnum('status').notNull().default('Active'),
    billingStatus: billingStatusEnum('billing_status').notNull().default('Billing'),
    isBillable: boolean('is_billable').default(true),
    isBenchProject: boolean('is_bench_project').notNull().default(false),
    teamSize: integer('team_size').notNull().default(1),
    accountManager: varchar('account_manager', { length: 100 }),
    accountManagerId: uuid('account_manager_id').references(() => resources.id),
    accountRegSalesOwner: varchar('account_reg_sales_owner', { length: 100 }),
    budget: decimal('budget', { precision: 15, scale: 2 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    description: text('description'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
}, (table) => ({
    clientIdx: index('idx_projects_client').on(table.clientId),
    benchIdx: index('idx_projects_bench').on(table.isBenchProject).where(sql`is_bench_project = true`),
}));

// Allocations table
export const allocations = pgTable('allocations', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    resourceId: uuid('resource_id').notNull().references(() => resources.id),
    projectId: uuid('project_id').notNull().references(() => projects.id),
    allocationPercentage: decimal('allocation_percentage', { precision: 5, scale: 2 }).notNull(),
    billingPercentage: decimal('billing_percentage', { precision: 5, scale: 2 }).default(sql`100`),
    billingStatusId: uuid('billing_status_id').notNull().references(() => billingStatuses.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isActive: boolean('is_active').default(true),
    notes: text('notes'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by'),
}, (table) => ({
    resourceIdx: index('idx_allocations_resource').on(table.resourceId),
    projectIdx: index('idx_allocations_project').on(table.projectId),
    billingStatusIdx: index('idx_allocations_billing_status').on(table.billingStatusId),
    datesIdx: index('idx_allocations_dates').on(table.startDate, table.endDate),
    uniqueAllocation: uniqueIndex('unique_active_allocation').on(table.resourceId, table.projectId, table.startDate),
}));

// Resource change history
export const resourceChangeHistory = pgTable('resource_change_history', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    resourceId: uuid('resource_id').notNull(),
    changeType: changeTypeEnum('change_type').notNull(),
    changedFields: jsonb('changed_fields'),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    changedBy: uuid('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
});

// Allocation change history
export const allocationChangeHistory = pgTable('allocation_change_history', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    allocationId: uuid('allocation_id').notNull(),
    changeType: changeTypeEnum('change_type').notNull(),
    changedFields: jsonb('changed_fields'),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    changedBy: uuid('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
});

// Designation change history
export const designationChangeHistory = pgTable('designation_change_history', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    resourceId: uuid('resource_id').notNull().references(() => resources.id),
    oldDesignationId: uuid('old_designation_id').references(() => designations.id),
    newDesignationId: uuid('new_designation_id').references(() => designations.id),
    effectiveDate: date('effective_date').notNull(),
    changedBy: uuid('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    userId: uuid('user_id'),
    userEmail: varchar('user_email', { length: 255 }),
    userName: varchar('user_name', { length: 255 }),
    action: auditActionEnum('action').notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }),
    entityName: varchar('entity_name', { length: 500 }),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    changedFields: text('changed_fields').array(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 100 }),
    serviceName: varchar('service_name', { length: 50 }),
    apiEndpoint: varchar('api_endpoint', { length: 500 }),
    metadata: jsonb('metadata'),
    messageId: varchar('message_id', { length: 100 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    timestampIdx: index('idx_audit_logs_timestamp').on(table.timestamp),
    userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    entityIdx: index('idx_audit_logs_entity').on(table.entityType, table.entityId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    dashboardIdx: index('idx_audit_logs_dashboard').on(table.timestamp, table.action, table.entityType),
}));

// Schema migrations tracking
export const schemaMigrations = pgTable('schema_migrations', {
    id: integer('id').primaryKey(),
    migrationId: varchar('migration_id', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
});

// Export all tables for easy access
export const schema = {
    tracks,
    designations,
    tiers,
    billingStatuses,
    resources,
    users,
    clients,
    projects,
    allocations,
    resourceChangeHistory,
    allocationChangeHistory,
    designationChangeHistory,
    auditLogs,
    schemaMigrations,
};

export default schema;
