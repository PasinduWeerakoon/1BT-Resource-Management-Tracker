/**
 * Migration: Add billing_status_id to future_allocations table
 * 
 * This allows future allocations to capture billing status when scheduled,
 * which will be copied to the allocations table when the scheduler activates them.
 */

exports.up = async (pgm) => {
    // Add billing_status_id column to future_allocations table
    pgm.addColumn('future_allocations', {
        billing_status_id: {
            type: 'integer',
            notNull: false,
            references: '"billing_statuses"',
            onDelete: 'RESTRICT',
            comment: 'FK to billing_statuses table - required for non-bench allocations'
        }
    });

    // Add index for better query performance
    pgm.createIndex('future_allocations', 'billing_status_id', {
        name: 'idx_future_alloc_billing_status'
    });

    console.log('Added billing_status_id column to future_allocations table');
};

exports.down = async (pgm) => {
    // Drop the index first
    pgm.dropIndex('future_allocations', 'billing_status_id', {
        name: 'idx_future_alloc_billing_status'
    });

    // Remove the column
    pgm.dropColumn('future_allocations', 'billing_status_id');

    console.log('Removed billing_status_id column from future_allocations table');
};
