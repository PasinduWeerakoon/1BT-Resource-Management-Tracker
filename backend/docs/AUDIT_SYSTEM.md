# Audit Trail System

Industry-grade audit logging system for the 1BT Resource Management application using AWS SQS with Dead Letter Queue pattern.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Microservices                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │
│  │  Resource  │ │ Allocation │ │  Project   │ │   Auth Service     │ │
│  │  Service   │ │  Service   │ │  Service   │ │                    │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────────┬──────────┘ │
│        │              │              │                  │            │
│        └──────────────┴──────────────┴──────────────────┘            │
│                               │                                      │
│                    ┌──────────▼──────────┐                          │
│                    │  Audit Client       │                          │
│                    │  (Shared Layer)     │                          │
│                    └──────────┬──────────┘                          │
└──────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    AWS SQS          │
                    │  (Audit Queue)      │
                    │                     │
                    │  • 4-day retention  │
                    │  • 60s visibility   │
                    │  • Long polling     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   Lambda    │  │   Lambda    │  │   Lambda    │
     │  Consumer   │  │  Consumer   │  │  Consumer   │
     │  (Batch)    │  │  (Batch)    │  │  (Batch)    │
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │  (audit_logs)   │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
         (Indexes)    (Partitioning)  (Views)
         - timestamp  - By month      - Daily summary
         - user_id    - TTL cleanup   - Dashboard metrics
         - entity
```

## Components

### 1. SQS Queues (Infrastructure)

**Main Queue:**

- Name: `onebt-audit-queue-{stage}`
- Retention: 4 days
- Visibility Timeout: 60 seconds
- Long Polling: 20 seconds
- Max Receive Count: 3 (before DLQ)

**Dead Letter Queue:**

- Name: `onebt-audit-dlq-{stage}`
- Retention: 14 days
- For failed message inspection and reprocessing

### 2. Database Schema

```sql
-- Main audit table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    entity_name VARCHAR(500),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    service_name VARCHAR(50),
    api_endpoint VARCHAR(500),
    metadata JSONB,
    message_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supported actions
CREATE TYPE audit_action AS ENUM (
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'EXPORT', 'IMPORT', 'BULK_UPDATE', 'BULK_DELETE',
    'PERMISSION_CHANGE', 'CONFIG_CHANGE', 'SYSTEM_EVENT'
);
```

### 3. Audit Service API

| Method | Endpoint                                       | Description                  |
| ------ | ---------------------------------------------- | ---------------------------- |
| GET    | `/api/v1/audit`                                | List audit logs with filters |
| GET    | `/api/v1/audit/{id}`                           | Get single audit log         |
| GET    | `/api/v1/audit/entity/{entityType}/{entityId}` | Get entity history           |
| GET    | `/api/v1/audit/user/{userId}`                  | Get user activity            |
| GET    | `/api/v1/audit/stats`                          | Dashboard statistics         |
| GET    | `/api/v1/audit/dlq`                            | View DLQ messages            |
| POST   | `/api/v1/audit/dlq/{messageId}/reprocess`      | Reprocess failed message     |

## Usage

### Basic Usage (Recommended)

```javascript
import { audit } from "/opt/nodejs/index.js";

// CREATE operation
await audit.create(
  event,
  "resource",
  resource.id,
  resource.name,
  resource,
  "resource-service",
);

// UPDATE operation
await audit.update(
  event,
  "resource",
  id,
  resource.name,
  oldValues,
  newValues,
  "resource-service",
);

// DELETE operation
await audit.delete(
  event,
  "resource",
  id,
  resource.name,
  oldValues,
  "resource-service",
);

// LOGIN
await audit.login(event, userId, email, "auth-service");

// LOGOUT
await audit.logout(event, userId, email, "auth-service");

// FAILED LOGIN
await audit.loginFailed(event, email, "auth-service", {
  reason: "Invalid password",
});

// EXPORT
await audit.export(event, "monthly-report", "report-service", {
  filters,
  rowCount: 100,
});
```

### Advanced Usage

```javascript
import { sendAuditEvent, getChangedFields } from "/opt/nodejs/index.js";

await sendAuditEvent(
  event,
  {
    action: "UPDATE",
    entityType: "allocation",
    entityId: allocation.id,
    entityName: `${allocation.resource_name} - ${allocation.project_name}`,
    oldValues: oldAllocation,
    newValues: newAllocation,
    changedFields: getChangedFields(oldAllocation, newAllocation),
    metadata: {
      percentageChange: newAllocation.percentage - oldAllocation.percentage,
      dateRange: {
        start: newAllocation.start_date,
        end: newAllocation.end_date,
      },
    },
  },
  "allocation-service",
);
```

### Using Middleware (Auto-capture)

```javascript
import middy from "@middy/core";
import { auditMiddleware } from "/opt/nodejs/lib/middleware/audit.js";

export const handler = middy(baseHandler).use(
  auditMiddleware({
    entityType: "project",
    serviceName: "project-service",
    auditReads: false, // Don't audit GET requests
    getEntityId: (req) => req.event.pathParameters?.id,
    getEntityName: (req) => req.response?.body?.data?.name,
  }),
);
```

### Batch Operations

```javascript
import { sendAuditEventBatch } from "/opt/nodejs/index.js";

const auditEvents = results.map((result) => ({
  action: "UPDATE",
  entityType: "resource",
  entityId: result.id,
  entityName: result.name,
  newValues: result,
}));

await sendAuditEventBatch(event, auditEvents, "resource-service");
```

## Query Examples

### List Recent Audit Logs

```
GET /api/v1/audit?page=1&limit=50&action=CREATE&entityType=resource
```

### Get Entity History

```
GET /api/v1/audit/entity/project/uuid-123
```

### Get User Activity

```
GET /api/v1/audit/user/user-uuid-456?days=30
```

### Dashboard Stats

```
GET /api/v1/audit/stats?days=7
```

Returns:

```json
{
    "totalEvents": 1250,
    "byAction": {
        "CREATE": 200,
        "UPDATE": 800,
        "DELETE": 50,
        "READ": 200
    },
    "byEntityType": {
        "resource": 500,
        "allocation": 400,
        "project": 350
    },
    "activeUsers": 25,
    "recentActivity": [...]
}
```

## Deployment

### 1. Deploy Infrastructure (SQS Queues)

```bash
cd backend/infrastructure
serverless deploy --stage dev
```

### 2. Run Database Migration

```bash
# Via API
curl -X POST https://api.example.com/dev/api/v1/migrations/run \
  -H "Authorization: Bearer $TOKEN"

# Or via bastion
ssh -i infrastructure/onebt-bastion-dev.pem ec2-user@<bastion-ip>
psql -h <rds-endpoint> -U onebt_admin -d onebt_dev
\i migrations/005_audit_logs.sql
```

### 3. Deploy Shared Layer

```bash
cd backend/shared
npm install
serverless deploy --stage dev
```

### 4. Deploy Audit Service

```bash
cd backend/services/audit-service
npm install
serverless deploy --stage dev
```

### 5. Redeploy Other Services

```bash
# Each service needs IAM permissions and environment variable
cd backend/services/resource-service
serverless deploy --stage dev
# Repeat for other services
```

## Monitoring

### CloudWatch Metrics

- `AuditQueue/NumberOfMessagesSent` - Events published
- `AuditQueue/NumberOfMessagesReceived` - Events processed
- `AuditDLQ/ApproximateNumberOfMessagesVisible` - Failed events

### DLQ Monitoring

```bash
# View DLQ messages
curl https://api.example.com/dev/api/v1/audit/dlq \
  -H "Authorization: Bearer $TOKEN"

# Reprocess a message
curl -X POST https://api.example.com/dev/api/v1/audit/dlq/{messageId}/reprocess \
  -H "Authorization: Bearer $TOKEN"
```

## Best Practices

1. **Don't Audit Sensitive Data**: Redact passwords, tokens, PII before sending
2. **Non-Blocking**: Audit calls are fire-and-forget; failures don't impact main request
3. **Batch When Possible**: Use `sendAuditEventBatch` for bulk operations
4. **Meaningful Entity Names**: Include human-readable names for easier investigation
5. **Include Changed Fields**: For UPDATEs, track which fields changed
6. **Add Metadata**: Include business context that helps investigation
7. **Regular DLQ Monitoring**: Set up alerts for DLQ message count > 0

## Retention Policy

| Environment | Main Table | Archive      |
| ----------- | ---------- | ------------ |
| Dev         | 30 days    | None         |
| QA          | 90 days    | None         |
| UAT         | 180 days   | Cold storage |
| Prod        | 365 days   | 7 years cold |

## Security

- Audit logs are immutable (no UPDATE/DELETE on audit_logs table)
- Access to audit APIs requires authentication
- Sensitive fields are automatically redacted
- Message deduplication prevents duplicate entries
- All access to audit logs is itself audited (meta-audit)

## Troubleshooting

### Events Not Appearing

1. Check `AUDIT_QUEUE_URL` environment variable is set
2. Verify IAM permissions allow `sqs:SendMessage`
3. Check CloudWatch logs for Lambda errors

### High DLQ Count

1. View DLQ messages for error patterns
2. Check database connectivity
3. Verify migration has run
4. Check for constraint violations

### Slow Queries

1. Verify indexes exist on audit_logs table
2. Use appropriate filters (timestamp, entityType)
3. Consider partitioning for large datasets
