/**
 * Audit Integration Examples
 * This file shows how to integrate audit logging into service handlers
 * 
 * IMPORTANT: Import audit from the shared layer
 */

// ======================================================================
// EXAMPLE 1: Using audit convenience methods (Recommended)
// ======================================================================

import { audit } from '/opt/nodejs/index.js';

// In a CREATE handler:
export const createExample = async (event) => {
    // ... validation and creation logic ...
    const resource = await createResourceInDb(event.body);

    // Send audit event (non-blocking)
    await audit.create(
        event,                    // Lambda event for user context
        'resource',               // Entity type
        resource.id,              // Entity ID
        resource.name,            // Entity name (for human readability)
        resource,                 // New values
        'resource-service'        // Service name
    );

    return success(resource, 201);
};

// In an UPDATE handler:
export const updateExample = async (event) => {
    const { id } = event.pathParameters;

    // Get old values BEFORE update
    const oldResource = await getResourceById(id);

    // Perform update
    const newResource = await updateResourceInDb(id, event.body);

    // Send audit event with both old and new values
    await audit.update(
        event,
        'resource',
        id,
        newResource.name,
        oldResource,              // Old values
        newResource,              // New values (changed fields auto-detected)
        'resource-service'
    );

    return success(newResource);
};

// In a DELETE handler:
export const deleteExample = async (event) => {
    const { id } = event.pathParameters;

    // Get resource BEFORE delete
    const resource = await getResourceById(id);

    // Perform soft delete
    await softDeleteResource(id);

    // Send audit event
    await audit.delete(
        event,
        'resource',
        id,
        resource.name,
        resource,                 // Old values (what was deleted)
        'resource-service'
    );

    return success({ message: 'Resource deleted' });
};


// ======================================================================
// EXAMPLE 2: Using sendAuditEvent directly (More control)
// ======================================================================

import { sendAuditEvent, getChangedFields } from '/opt/nodejs/index.js';

export const customAuditExample = async (event) => {
    const { id } = event.pathParameters;
    const oldAllocation = await getAllocation(id);
    const newAllocation = await updateAllocation(id, event.body);

    // Custom audit event with metadata
    await sendAuditEvent(event, {
        action: 'UPDATE',
        entityType: 'allocation',
        entityId: id,
        entityName: `${oldAllocation.resource_name} - ${oldAllocation.project_name}`,
        oldValues: oldAllocation,
        newValues: newAllocation,
        changedFields: getChangedFields(oldAllocation, newAllocation),
        metadata: {
            allocationPercentage: newAllocation.percentage,
            startDate: newAllocation.start_date,
            endDate: newAllocation.end_date,
            previousPercentage: oldAllocation.percentage
        }
    }, 'allocation-service');

    return success(newAllocation);
};


// ======================================================================
// EXAMPLE 3: Using auditMiddleware (Automatic capture)
// ======================================================================

import middy from '@middy/core';
import { auditMiddleware } from '/opt/nodejs/lib/middleware/audit.js';

// Auto-capture audit events for all successful operations
const baseHandler = async (event) => {
    const { id } = event.pathParameters;
    const project = await getProjectById(id);
    return success(project);
};

export const getProjectWithAutoAudit = middy(baseHandler)
    .use(auditMiddleware({
        entityType: 'project',
        serviceName: 'project-service',
        auditReads: true,  // Enable audit for GET requests
        getEntityId: (request) => request.event.pathParameters?.id,
        getEntityName: (request) => request.response?.body?.data?.name
    }));


// ======================================================================
// EXAMPLE 4: Auth service integration (Login/Logout)
// ======================================================================

export const loginHandler = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);
        const authResult = await authenticateUser(email, password);

        // Audit successful login
        await audit.login(
            event,
            authResult.userId,
            email,
            'auth-service',
            { provider: 'cognito' }
        );

        return success(authResult);

    } catch (err) {
        // Audit failed login attempt
        await audit.loginFailed(
            event,
            email,
            'auth-service',
            { reason: err.message }
        );

        return error('Authentication failed');
    }
};

export const logoutHandler = async (event) => {
    const user = event.user;
    await signOutUser(user.id);

    await audit.logout(
        event,
        user.id,
        user.email,
        'auth-service'
    );

    return success({ message: 'Logged out successfully' });
};


// ======================================================================
// EXAMPLE 5: Bulk operations with batch audit
// ======================================================================

import { sendAuditEventBatch } from '/opt/nodejs/index.js';

export const bulkUpdateHandler = async (event) => {
    const { updates } = JSON.parse(event.body);

    // Perform bulk update
    const results = await Promise.all(
        updates.map(u => updateResource(u.id, u.data))
    );

    // Prepare batch audit events
    const auditEvents = results.map((result, index) => ({
        action: 'UPDATE',
        entityType: 'resource',
        entityId: result.id,
        entityName: result.name,
        oldValues: updates[index].oldData,
        newValues: result,
        changedFields: getChangedFields(updates[index].oldData, result)
    }));

    // Send all audit events in batch
    await sendAuditEventBatch(event, auditEvents, 'resource-service');

    return success({ updated: results.length });
};


// ======================================================================
// EXAMPLE 6: Report generation with export audit
// ======================================================================

export const generateReportHandler = async (event) => {
    const { reportType, filters } = JSON.parse(event.body);

    // Generate report
    const reportData = await generateReport(reportType, filters);

    // Audit the export
    await audit.export(
        event,
        reportType,
        'report-service',
        {
            filters,
            rowCount: reportData.length,
            generatedAt: new Date().toISOString()
        }
    );

    return success(reportData);
};


// ======================================================================
// Placeholder functions (replace with actual implementations)
// ======================================================================

const createResourceInDb = async (data) => ({ id: 'new-id', ...data });
const getResourceById = async (id) => ({ id, name: 'Test' });
const updateResourceInDb = async (id, data) => ({ id, ...data });
const softDeleteResource = async (id) => true;
const getAllocation = async (id) => ({ id, resource_name: 'John', project_name: 'Project A' });
const updateAllocation = async (id, data) => ({ id, ...data });
const getProjectById = async (id) => ({ id, name: 'Project' });
const authenticateUser = async (email, password) => ({ userId: 'user-id', token: 'jwt' });
const signOutUser = async (id) => true;
const updateResource = async (id, data) => ({ id, ...data });
const generateReport = async (type, filters) => [{ row: 1 }];
const success = (data, code = 200) => ({ statusCode: code, body: JSON.stringify({ data }) });
const error = (msg) => ({ statusCode: 500, body: JSON.stringify({ error: msg }) });
