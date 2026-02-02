/**
 * Drizzle ORM Schema
 * Type-safe database schema definitions for 1BT Resource Management
 * 
 * Architecture:
 * - Config-based enums (in backend/configs/): Tracks, Tech Stacks, Tiers
 * - Database Tables (auto-increment IDs): Designations, Billing Statuses, Project Types
 * - Core Tables (UUID): employees, users, clients, projects, allocations
 */

import { pgTable, uuid, varchar, text, boolean, integer, smallint, decimal, date, timestamp, pgEnum, jsonb, inet, serial, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// ============ ENUMS ============

export const userRoleEnum = pgEnum('user_role', ['Super User', 'Admin', 'User']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'Inactive', 'Suspended', 'Pending']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated']);
export const projectStatusEnum = pgEnum('project_status', ['Active', 'Inactive', 'Completed', 'On Hold']);
export const accountTypeEnum = pgEnum('account_type', ['Internal', 'External']);
export const changeTypeEnum = pgEnum('change_type', ['CREATED', 'UPDATED', 'DELETED', 'RESTORED']);
export const allocationChangeTypeEnum = pgEnum('allocation_change_type', [
    'NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING',
    'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT', 'LEGACY'
]);
export const auditActionEnum = pgEnum('audit_action', [
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE'
]);

// ============ LOOKUP TABLES (Serial IDs for performance) ============

// NOTE: Tracks are config-based, stored in backend/configs/tracks.js
// No tracks table needed in database

// Designations table - DB managed with is_default flag
export const designations = pgTable('designations', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    level: smallint('level').notNull().default(1),
    isInternRole: boolean('is_intern_role').notNull().default(false),
    category: varchar('category', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    displayOrder: smallint('display_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    activeIdx: index('idx_designations_active').on(table.isActive).where(sql`is_active = true`),
    levelIdx: index('idx_designations_level').on(table.level),
    categoryIdx: index('idx_designations_category').on(table.category),
}));

// Billing Statuses table - DB managed with is_default flag
export const billingStatuses = pgTable('billing_statuses', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    displayOrder: smallint('display_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    activeIdx: index('idx_billing_statuses_active').on(table.isActive).where(sql`is_active = true`),
}));

// Project Types table - DB managed with is_default flag
export const projectTypes = pgTable('project_types', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    displayOrder: smallint('display_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    activeIdx: index('idx_project_types_active').on(table.isActive).where(sql`is_active = true`),
}));

// Employee Types table
export const employeeTypes = pgTable('employee_types', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Universities table
export const universities = pgTable('universities', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull().unique(),
    shortName: varchar('short_name', { length: 50 }),
    country: varchar('country', { length: 100 }).default('Sri Lanka'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tags table
export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    color: varchar('color', { length: 7 }),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ CORE TABLES (UUID for distributed systems) ============

// Employees table (main resource table)
// Column names match actual database: epf_no, emp_no, employee_type_id
// Config-based fields store INTEGER IDs that map to shared configs in /opt/nodejs/configs/index.js
export const employees = pgTable('employees', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    epfNo: varchar('epf_no', { length: 20 }).notNull(),       // EPF Number (unique identifier)
    empNo: varchar('emp_no', { length: 20 }).notNull(),       // Employee Number
    globalEmployeeId: varchar('global_employee_id', { length: 50 }),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    // Config-based fields - INTEGER IDs mapping to shared configs
    trackId: integer('track_id'),          // Maps to TRACKS config
    techStackId: integer('tech_stack_id'), // Maps to TECH_STACKS config
    tierId: integer('tier_id'),            // Maps to TIERS config
    // FK to lookup tables (database-managed)
    designationId: integer('designation_id').references(() => designations.id, { onDelete: 'set null' }),
    employeeTypeId: integer('employee_type_id').references(() => employeeTypes.id, { onDelete: 'set null' }),
    universityId: integer('university_id').references(() => universities.id, { onDelete: 'set null' }),
    // Dates
    joinedDate: date('joined_date'),
    lastIncrementDate: date('last_increment_date'),
    lastPromotionDate: date('last_promotion_date'),
    internshipCompletionTargetDate: date('internship_completion_target_date'),
    noticePeriodEndDate: date('notice_period_end_date'),
    // Status and allocation
    status: employeeStatusEnum('status').notNull().default('Active'),
    totalAllocation: decimal('total_allocation', { precision: 5, scale: 2 }).notNull().default('0'),
    totalResourceBilling: decimal('total_resource_billing', { precision: 5, scale: 2 }).notNull().default('0'),
    // Helper relationship
    helperId: uuid('helper_id'),
    helperIsExternal: boolean('helper_is_external').notNull().default(false),
    // Other fields
    skills: text('skills').array().default(sql`'{}'`),
    isAccountManager: boolean('is_account_manager').notNull().default(false),
    photoUrl: varchar('photo_url', { length: 500 }),
    // Soft delete and versioning
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
}, (table) => ({
    // Partial unique indexes for soft delete
    epfNoUnique: uniqueIndex('employees_epf_no_unique').on(table.epfNo).where(sql`deleted_at IS NULL`),
    empNoUnique: uniqueIndex('employees_emp_no_unique').on(table.empNo).where(sql`deleted_at IS NULL`),
    emailUnique: uniqueIndex('employees_email_unique').on(table.email).where(sql`deleted_at IS NULL AND email IS NOT NULL`),
    // Performance indexes
    statusIdx: index('idx_employees_status').on(table.status).where(sql`deleted_at IS NULL`),
    trackIdx: index('idx_employees_track_id').on(table.trackId).where(sql`deleted_at IS NULL`),
    designationIdx: index('idx_employees_designation').on(table.designationId).where(sql`deleted_at IS NULL`),
    tierIdx: index('idx_employees_tier_id').on(table.tierId).where(sql`deleted_at IS NULL`),
    techStackIdx: index('idx_employees_tech_stack_id').on(table.techStackId).where(sql`deleted_at IS NULL`),
    typeIdx: index('idx_employees_type').on(table.employeeTypeId).where(sql`deleted_at IS NULL`),
    allocationIdx: index('idx_employees_allocation').on(table.totalAllocation).where(sql`status = 'Active' AND deleted_at IS NULL`),
    accountManagerIdx: index('idx_employees_account_manager').on(table.isAccountManager).where(sql`is_account_manager = true AND deleted_at IS NULL`),
    nameIdx: index('idx_employees_name').on(table.name),
    activeListIdx: index('idx_employees_active_list').on(table.status, table.trackId, table.designationId).where(sql`deleted_at IS NULL`),
}));

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    username: varchar('username', { length: 50 }).notNull(),
    email: varchar('email', { length: 100 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('User'),
    employeeId: uuid('employee_id').unique().references(() => employees.id, { onDelete: 'set null' }),
    failedLoginAttempts: smallint('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).defaultNow(),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    status: userStatusEnum('status').notNull().default('Pending'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
}, (table) => ({
    usernameUnique: uniqueIndex('users_username_unique').on(table.username).where(sql`deleted_at IS NULL`),
    emailUnique: uniqueIndex('users_email_unique').on(table.email).where(sql`deleted_at IS NULL`),
}));

// Employee Tags junction table
export const employeeTags = pgTable('employee_tags', {
    id: serial('id').primaryKey(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
}, (table) => ({
    uniqueEmployeeTag: uniqueIndex('employee_tags_unique').on(table.employeeId, table.tagId),
    employeeIdx: index('idx_employee_tags_employee').on(table.employeeId),
    tagIdx: index('idx_employee_tags_tag').on(table.tagId),
}));

// Clients table
export const clients = pgTable('clients', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clientName: varchar('client_name', { length: 100 }).notNull().unique(),
    clientCode: varchar('client_code', { length: 20 }).unique(),
    contactPerson: varchar('contact_person', { length: 100 }),
    contactEmail: varchar('contact_email', { length: 100 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    address: varchar('address', { length: 500 }),
    billingAddress: varchar('billing_address', { length: 500 }),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    isActive: boolean('is_active').notNull().default(true),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
    activeIdx: index('idx_clients_active').on(table.isActive).where(sql`deleted_at IS NULL`),
}));

// Projects table
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectName: varchar('project_name', { length: 200 }).notNull(),
    projectCode: varchar('project_code', { length: 50 }),
    projectTypeId: integer('project_type_id').references(() => projectTypes.id, { onDelete: 'restrict' }),
    accountType: accountTypeEnum('account_type').notNull(),
    teamSize: smallint('team_size').notNull().default(1),
    accountManagerId: uuid('account_manager_id').references(() => employees.id, { onDelete: 'set null' }),
    accountRegSalesOwner: varchar('account_reg_sales_owner', { length: 100 }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    projectStartDate: date('project_start_date'),
    projectEndDate: date('project_end_date'),
    billingStatusId: integer('billing_status_id').references(() => billingStatuses.id, { onDelete: 'restrict' }),
    budget: decimal('budget', { precision: 15, scale: 2 }),
    status: projectStatusEnum('status').notNull().default('Active'),
    description: text('description'),
    isBenchProject: boolean('is_bench_project').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
    nameUnique: uniqueIndex('projects_name_unique').on(table.projectName).where(sql`deleted_at IS NULL`),
    codeUnique: uniqueIndex('projects_code_unique').on(table.projectCode).where(sql`deleted_at IS NULL AND project_code IS NOT NULL`),
    statusIdx: index('idx_projects_status').on(table.status).where(sql`deleted_at IS NULL`),
    managerIdx: index('idx_projects_manager').on(table.accountManagerId).where(sql`deleted_at IS NULL`),
    clientIdx: index('idx_projects_client').on(table.clientId).where(sql`deleted_at IS NULL`),
    benchIdx: index('idx_projects_bench').on(table.isBenchProject).where(sql`is_bench_project = true AND deleted_at IS NULL`),
    typeIdx: index('idx_projects_type').on(table.projectTypeId).where(sql`deleted_at IS NULL`),
    billingIdx: index('idx_projects_billing').on(table.billingStatusId).where(sql`deleted_at IS NULL`),
}));

// Allocations table
// Note: DB column is 'employee_id' - matches actual database
export const allocations = pgTable('allocations', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
    allocationPercentage: smallint('allocation_percentage').notNull(),
    billingPercentage: smallint('billing_percentage').notNull(),
    billingStatusId: integer('billing_status_id').references(() => billingStatuses.id, { onDelete: 'restrict' }),
    isBillable: boolean('is_billable').notNull().default(true),
    isCriticalShadow: boolean('is_critical_shadow').notNull().default(false),
    criticalShadowPercentage: smallint('critical_shadow_percentage'),
    allocatedDate: date('allocated_date').notNull().default(sql`CURRENT_DATE`),
    deallocatedDate: date('deallocated_date'),
    effectiveDate: date('effective_date').notNull().default(sql`CURRENT_DATE`),
    originalAllocatedDate: date('original_allocated_date'),
    allocationChangedOn: timestamp('allocation_changed_on', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    changeType: allocationChangeTypeEnum('change_type').default('NEW_ALLOCATION'),
    notes: text('notes'),
    sourceFutureId: uuid('source_future_id'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
    employeeProjectUnique: uniqueIndex('allocations_employee_project_unique').on(table.employeeId, table.projectId).where(sql`deleted_at IS NULL AND is_active = true`),
    employeeIdx: index('idx_allocations_employee').on(table.employeeId).where(sql`is_active = true AND deleted_at IS NULL`),
    projectIdx: index('idx_allocations_project').on(table.projectId).where(sql`is_active = true AND deleted_at IS NULL`),
    effectiveIdx: index('idx_allocations_effective').on(table.effectiveDate),
    datesIdx: index('idx_allocations_dates').on(table.allocatedDate, table.deallocatedDate).where(sql`is_active = true AND deleted_at IS NULL`),
    totalsIdx: index('idx_allocations_totals').on(table.employeeId, table.allocationPercentage, table.billingPercentage).where(sql`is_active = true AND deleted_at IS NULL`),
}));

// Future Allocations table
export const futureAllocations = pgTable('future_allocations', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
    allocationPercentage: smallint('allocation_percentage').notNull(),
    billingPercentage: smallint('billing_percentage').notNull().default(100),
    effectiveDate: date('effective_date').notNull(),
    allocatedDate: date('allocated_date').notNull(),
    deallocatedDate: date('deallocated_date'),
    changeType: allocationChangeTypeEnum('change_type').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('scheduled'),
    linkedFutureId: uuid('linked_future_id'),
    targetAllocationId: uuid('target_allocation_id').references(() => allocations.id),
    notes: text('notes'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    employeeIdx: index('idx_future_alloc_employee').on(table.employeeId),
    projectIdx: index('idx_future_alloc_project').on(table.projectId),
    scheduledIdx: index('idx_future_alloc_scheduled').on(table.effectiveDate, table.status).where(sql`status = 'scheduled'`),
}));

// ============ HISTORY TABLES ============

// Allocation History table
export const allocationHistory = pgTable('allocation_history', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    allocationId: uuid('allocation_id').references(() => allocations.id, { onDelete: 'set null' }),
    employeeId: uuid('employee_id').notNull().references(() => employees.id),
    projectId: uuid('project_id').notNull().references(() => projects.id),
    allocationPercentage: smallint('allocation_percentage').notNull(),
    billingPercentage: smallint('billing_percentage').notNull(),
    billingStatusId: integer('billing_status_id').references(() => billingStatuses.id),
    isCriticalShadow: boolean('is_critical_shadow').default(false),
    criticalShadowPercentage: smallint('critical_shadow_percentage'),
    allocationStartDate: date('allocation_start_date'),
    allocationEndDate: date('allocation_end_date'),
    isActive: boolean('is_active'),
    notes: text('notes'),
    changeType: varchar('change_type', { length: 20 }).notNull(),
    changeReason: text('change_reason'),
    previousValues: jsonb('previous_values'),
    changedFields: text('changed_fields').array(),
    effectiveDate: date('effective_date').notNull().default(sql`CURRENT_DATE`),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBy: uuid('changed_by').references(() => users.id),
    changedByUsername: varchar('changed_by_username', { length: 50 }),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
}, (table) => ({
    employeeIdx: index('idx_alloc_history_employee').on(table.employeeId),
    projectIdx: index('idx_alloc_history_project').on(table.projectId),
    allocationIdx: index('idx_alloc_history_allocation').on(table.allocationId),
    changedIdx: index('idx_alloc_history_changed').on(table.changedAt),
    effectiveIdx: index('idx_alloc_history_effective').on(table.effectiveDate),
}));

// Allocation History Archive table
export const allocationHistoryArchive = pgTable('allocation_history_archive', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    originalAllocationId: uuid('original_allocation_id').notNull(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
    allocationPercentage: smallint('allocation_percentage').notNull(),
    billingStatusId: integer('billing_status_id').references(() => billingStatuses.id),
    isBillable: boolean('is_billable').notNull(),
    effectiveDate: date('effective_date'),
    allocatedDate: date('allocated_date').notNull(),
    deallocatedDate: date('deallocated_date'),
    originalAllocatedDate: date('original_allocated_date'),
    changeType: allocationChangeTypeEnum('change_type'),
    notes: text('notes'),
    originalCreatedBy: uuid('original_created_by').references(() => users.id),
    originalCreatedAt: timestamp('original_created_at', { withTimezone: true }),
    originalUpdatedAt: timestamp('original_updated_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
    archiveReason: varchar('archive_reason', { length: 50 }).notNull(),
    archivedBy: uuid('archived_by').references(() => users.id),
}, (table) => ({
    employeeIdx: index('idx_archive_employee').on(table.employeeId),
    projectIdx: index('idx_archive_project').on(table.projectId),
    archivedAtIdx: index('idx_archive_archived_at').on(table.archivedAt),
}));

// Designation History table
export const designationHistory = pgTable('designation_history', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    previousDesignationId: integer('previous_designation_id').references(() => designations.id),
    newDesignationId: integer('new_designation_id').notNull().references(() => designations.id),
    previousTrackId: integer('previous_track_id'),  // Maps to TRACKS config
    newTrackId: integer('new_track_id').notNull(),  // Maps to TRACKS config
    changeType: varchar('change_type', { length: 30 }).notNull(),
    changeReason: text('change_reason'),
    effectiveFrom: date('effective_from').notNull().default(sql`CURRENT_DATE`),
    effectiveUntil: date('effective_until'),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBy: uuid('changed_by').references(() => users.id),
    changedByUsername: varchar('changed_by_username', { length: 50 }),
}, (table) => ({
    employeeIdx: index('idx_designation_history_employee').on(table.employeeId),
    employeeDateIdx: index('idx_designation_history_employee_date').on(table.employeeId, table.effectiveFrom),
}));

// ============ SYSTEM TABLES ============

// Permissions table
export const permissions = pgTable('permissions', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    module: varchar('module', { length: 50 }).notNull(),
    canView: boolean('can_view').notNull().default(false),
    canCreate: boolean('can_create').notNull().default(false),
    canUpdate: boolean('can_update').notNull().default(false),
    canDelete: boolean('can_delete').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userModuleUnique: uniqueIndex('permissions_user_module_unique').on(table.userId, table.module),
}));

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    userId: uuid('user_id'),
    userEmail: varchar('user_email', { length: 255 }),
    userName: varchar('user_name', { length: 255 }),
    action: auditActionEnum('action').notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    entityName: varchar('entity_name', { length: 255 }),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    changedFields: text('changed_fields').array(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 100 }),
    serviceName: varchar('service_name', { length: 50 }).notNull(),
    apiEndpoint: varchar('api_endpoint', { length: 255 }),
    metadata: jsonb('metadata'),
    messageId: varchar('message_id', { length: 100 }),
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    timestampIdx: index('idx_audit_timestamp').on(table.timestamp),
    userIdx: index('idx_audit_user').on(table.userId).where(sql`user_id IS NOT NULL`),
    entityIdx: index('idx_audit_entity').on(table.entityType, table.entityId),
    actionIdx: index('idx_audit_action').on(table.action),
    compositeIdx: index('idx_audit_composite').on(table.timestamp, table.action, table.entityType),
    messageIdUnique: uniqueIndex('idx_audit_message_id').on(table.messageId).where(sql`message_id IS NOT NULL`),
}));

// ============ RELATIONS ============

export const employeesRelations = relations(employees, ({ one, many }) => ({
    designation: one(designations, {
        fields: [employees.designationId],
        references: [designations.id],
    }),
    employeeType: one(employeeTypes, {
        fields: [employees.employeeTypeId],
        references: [employeeTypes.id],
    }),
    university: one(universities, {
        fields: [employees.universityId],
        references: [universities.id],
    }),
    helper: one(employees, {
        fields: [employees.helperId],
        references: [employees.id],
    }),
    user: one(users, {
        fields: [employees.id],
        references: [users.employeeId],
    }),
    tags: many(employeeTags),
    allocations: many(allocations),
    managedProjects: many(projects),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
    employee: one(employees, {
        fields: [users.employeeId],
        references: [employees.id],
    }),
    permissions: many(permissions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    projectType: one(projectTypes, {
        fields: [projects.projectTypeId],
        references: [projectTypes.id],
    }),
    billingStatus: one(billingStatuses, {
        fields: [projects.billingStatusId],
        references: [billingStatuses.id],
    }),
    accountManager: one(employees, {
        fields: [projects.accountManagerId],
        references: [employees.id],
    }),
    client: one(clients, {
        fields: [projects.clientId],
        references: [clients.id],
    }),
    allocations: many(allocations),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
    employee: one(employees, {
        fields: [allocations.employeeId],
        references: [employees.id],
    }),
    project: one(projects, {
        fields: [allocations.projectId],
        references: [projects.id],
    }),
    billingStatus: one(billingStatuses, {
        fields: [allocations.billingStatusId],
        references: [billingStatuses.id],
    }),
}));

export const employeeTagsRelations = relations(employeeTags, ({ one }) => ({
    employee: one(employees, {
        fields: [employeeTags.employeeId],
        references: [employees.id],
    }),
    tag: one(tags, {
        fields: [employeeTags.tagId],
        references: [tags.id],
    }),
}));

// ============ EXPORTS ============

export const schema = {
    // Enums
    userRoleEnum,
    userStatusEnum,
    employeeStatusEnum,
    projectStatusEnum,
    accountTypeEnum,
    changeTypeEnum,
    allocationChangeTypeEnum,
    auditActionEnum,
    // Lookup tables
    designations,
    billingStatuses,
    projectTypes,
    employeeTypes,
    universities,
    tags,
    // Core tables
    employees,
    users,
    employeeTags,
    clients,
    projects,
    allocations,
    futureAllocations,
    // History tables
    allocationHistory,
    allocationHistoryArchive,
    designationHistory,
    // System tables
    permissions,
    auditLogs,
};

export default schema;
