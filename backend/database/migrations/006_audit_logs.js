/**
 * Migration: 006 - Audit Logs Table
 * Creates comprehensive audit trail table for tracking all user actions
 * Designed for industry-grade compliance and security auditing
 */

export const shorthands = undefined;

export const up = (pgm) => {
    // =====================================================
    // AUDIT ACTION ENUM
    // =====================================================
    pgm.createType('audit_action', [
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'PASSWORD_CHANGE',
        'EXPORT',
        'BULK_UPDATE',
        'RESTORE'
    ]);

    // =====================================================
    // AUDIT LOGS TABLE
    // =====================================================
    pgm.createTable('audit_logs', {
        // Primary key - using ULID format for time-sortable IDs
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },

        // When the action occurred (server time)
        timestamp: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('CURRENT_TIMESTAMP')
        },

        // Who performed the action
        user_id: {
            type: 'uuid',
            notNull: false  // Null for anonymous/system actions
        },
        user_email: {
            type: 'varchar(255)'  // Denormalized for query performance
        },
        user_name: {
            type: 'varchar(255)'  // Denormalized for query performance
        },

        // What action was performed
        action: {
            type: 'audit_action',
            notNull: true
        },

        // What entity was affected
        entity_type: {
            type: 'varchar(50)',
            notNull: true  // e.g., 'resource', 'project', 'allocation'
        },
        entity_id: {
            type: 'uuid',
            notNull: false  // Null for list/bulk operations
        },
        entity_name: {
            type: 'varchar(255)'  // Denormalized for readability
        },

        // What changed (JSONB for flexibility)
        old_values: {
            type: 'jsonb'  // Previous state before change
        },
        new_values: {
            type: 'jsonb'  // New state after change
        },
        changed_fields: {
            type: 'text[]'  // Array of field names that changed
        },

        // Request context for security/debugging
        ip_address: {
            type: 'inet'  // Client IP address
        },
        user_agent: {
            type: 'text'  // Browser/client info
        },
        request_id: {
            type: 'varchar(100)'  // AWS Lambda request ID for tracing
        },

        // Service context
        service_name: {
            type: 'varchar(50)',
            notNull: true  // e.g., 'resource-service', 'auth-service'
        },
        api_endpoint: {
            type: 'varchar(255)'  // e.g., 'POST /api/v1/resources'
        },

        // Additional metadata
        metadata: {
            type: 'jsonb'  // Any additional context-specific data
        },

        // SQS message tracking
        message_id: {
            type: 'varchar(100)'  // SQS message ID for deduplication
        },
        processed_at: {
            type: 'timestamptz',
            default: pgm.func('CURRENT_TIMESTAMP')
        }
    });

    // =====================================================
    // INDEXES FOR COMMON QUERIES
    // =====================================================

    // Query by timestamp (most common - chronological queries)
    pgm.createIndex('audit_logs', 'timestamp', {
        name: 'idx_audit_logs_timestamp'
    });

    // Query by user (who did what)
    pgm.createIndex('audit_logs', 'user_id', {
        name: 'idx_audit_logs_user_id',
        where: 'user_id IS NOT NULL'
    });

    // Query by entity (what happened to this record)
    pgm.createIndex('audit_logs', ['entity_type', 'entity_id'], {
        name: 'idx_audit_logs_entity'
    });

    // Query by action type
    pgm.createIndex('audit_logs', 'action', {
        name: 'idx_audit_logs_action'
    });

    // Compound index for common dashboard queries
    pgm.createIndex('audit_logs', ['timestamp', 'action', 'entity_type'], {
        name: 'idx_audit_logs_dashboard'
    });

    // Prevent duplicate SQS message processing
    pgm.createIndex('audit_logs', 'message_id', {
        name: 'idx_audit_logs_message_id',
        unique: true,
        where: 'message_id IS NOT NULL'
    });

    // GIN index for JSONB metadata queries
    pgm.sql(`CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata jsonb_path_ops)`);

    // =====================================================
    // AUDIT LOGS SUMMARY VIEW (for dashboards)
    // =====================================================
    pgm.sql(`
        CREATE OR REPLACE VIEW audit_logs_daily_summary AS
        SELECT 
            DATE(timestamp) as date,
            action,
            entity_type,
            COUNT(*) as count
        FROM audit_logs
        WHERE timestamp > NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp), action, entity_type
        ORDER BY date DESC, count DESC
    `);

    // =====================================================
    // PARTITION BY RANGE (optional - for large datasets)
    // Uncomment if expecting high volume
    // =====================================================
    /*
    -- Convert to partitioned table for large scale
    pgm.sql(`
        ALTER TABLE audit_logs 
        PARTITION BY RANGE (timestamp)
    `);
    */
};

export const down = (pgm) => {
    pgm.sql('DROP VIEW IF EXISTS audit_logs_daily_summary');
    pgm.dropTable('audit_logs');
    pgm.dropType('audit_action');
};
