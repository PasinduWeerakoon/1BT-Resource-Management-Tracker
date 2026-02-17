# Database Migrations with Drizzle ORM

This project uses **Drizzle ORM** as the single source of truth for database schema management.

## Architecture

```
backend/
├── shared/layers/nodejs/database/
│   ├── schema.js        # 🎯 SINGLE SOURCE OF TRUTH - Drizzle schema
│   ├── drizzle.js       # Drizzle ORM client & exports
│   └── index.js         # Connection pool management
├── drizzle.config.ts    # Drizzle-Kit configuration
├── database/
│   ├── drizzle/         # Generated migrations (via drizzle-kit generate)
│   └── seed.js          # Seed script
└── configs/
    ├── tracks.config.js     # Static enum: Tracks
    ├── techStacks.config.js # Static enum: Tech Stacks
    ├── tiers.config.js      # Static enum: Tiers
    └── index.js             # Config exports
```

## Design Decisions

### Config Files vs Database Tables

| Config Files (Static Enums) | Database Tables (Editable)  |
| --------------------------- | --------------------------- |
| Tracks (11 values)          | Designations (82 values)    |
| Tech Stacks (26 values)     | Billing Statuses (7 values) |
| Tiers (7 values)            | Project Types (6 values)    |
|                             | Employee Types (4 values)   |
|                             | Tags (5 values)             |
|                             | Universities (9 values)     |

**Rationale:**

- Config files: Values rarely change, validated at application level
- Database tables: Values may be added/edited by admins, need auto-increment IDs for JOIN performance

### ID Strategy

| Entity Type   | ID Type  | Reason                                          |
| ------------- | -------- | ----------------------------------------------- |
| Lookup tables | `SERIAL` | Fast INTs for frequent JOINs                    |
| Core entities | `UUID`   | Distributed scalability, no sequential guessing |

## Commands

### Local Development

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (dev only, no migration files)
npm run db:push

# Open Drizzle Studio (visual database browser)
npm run db:studio

# Run seed script
npm run db:seed

# Reset database (dangerous!)
npm run db:reset
```

### Lambda-based Migrations

```bash
# Deploy migration service
cd services/migration-service && serverless deploy --stage dev

# Run migrations via Lambda
aws lambda invoke \
  --function-name onebt-migration-service-dev-runMigrations \
  --payload '{}' \
  response.json

# Check migration status
aws lambda invoke \
  --function-name onebt-migration-service-dev-getMigrationStatus \
  --payload '{}' \
  response.json

# Sync schema directly (dev only)
aws lambda invoke \
  --function-name onebt-migration-service-dev-syncSchema \
  --payload '{}' \
  response.json
```

## Schema Structure

### Enums (PostgreSQL ENUM types)

- `user_role`: Super User, Admin, User
- `user_status`: Active, Inactive, Suspended, Pending
- `employee_status`: Active, Inactive, Serving Notice Period, On Leave, Terminated
- `project_status`: Active, Inactive, Completed, On Hold
- `account_type`: Internal, External
- `change_type`: CREATED, UPDATED, DELETED, RESTORED
- `allocation_change_type`: NEW_ALLOCATION, MODIFY_PERCENTAGE, etc.
- `audit_action`: CREATE, READ, UPDATE, DELETE, LOGIN, etc.

### Core Tables

- `employees` (UUID) - Employee/resource records
- `users` (UUID) - System users with authentication
- `clients` (UUID) - Client organizations
- `projects` (UUID) - Projects with foreign keys to clients
- `allocations` (UUID) - Employee-Project allocation mappings
- `future_allocations` - Scheduled future allocations

### Lookup Tables (Serial IDs)

- `designations` - Job titles/designations
- `billing_statuses` - Billing status options
- `project_types` - Project type categories
- `employee_types` - Employment types
- `universities` - Education institutions
- `tags` - Employee tags (many-to-many via employee_tags)

### History/Audit Tables

- `allocation_history` - Allocation change tracking
- `allocation_history_archive` - Archived allocation history
- `designation_history` - Employee designation change tracking
- `audit_logs` - System-wide audit trail

## Workflow for Schema Changes

1. **Edit** `shared/layers/nodejs/database/schema.js`
2. **Generate** migration: `npm run db:generate`
3. **Review** generated SQL in `database/drizzle/`
4. **Test locally**: `npm run db:push` or `npm run db:migrate`
5. **Deploy** shared layer: `./publish-layer.sh` or `./publish-layer.ps1`
6. **Deploy** migration service: `cd services/migration-service && serverless deploy`
7. **Run** migration Lambda

## Performance Optimizations

- **Partial indexes** on `deleted_at IS NULL` for soft-delete queries
- **Composite indexes** for common query patterns
- **Integer FKs** for lookup tables (faster than UUID JOINs)
- **Connection pooling** via `index.js` pool management
- **Lambda-optimized** schema with 30s API Gateway timeout in mind

## Environment Variables

```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=onebt_resources
DB_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:name
```
