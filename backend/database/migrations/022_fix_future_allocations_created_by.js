/**
 * Migration: 022 - Fix future_allocations created_by constraint
 * 
 * Removes the foreign key constraint on created_by since Cognito user IDs
 * don't match the internal users table UUIDs.
 * Also fixes column mismatches (billing_status/is_billable -> billing_percentage).
 */

export const up = (pgm) => {
    // Drop the foreign key constraint on created_by
    pgm.dropConstraint('future_allocations', 'future_allocations_created_by_fkey', { ifExists: true });

    // Check if billing_status column exists and needs to be replaced with billing_percentage
    pgm.sql(`
        DO $$ 
        BEGIN
            -- Drop billing_status if exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='future_allocations' AND column_name='billing_status') THEN
                ALTER TABLE future_allocations DROP COLUMN billing_status;
            END IF;
            
            -- Drop is_billable if exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='future_allocations' AND column_name='is_billable') THEN
                ALTER TABLE future_allocations DROP COLUMN is_billable;
            END IF;
            
            -- Add billing_percentage if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='future_allocations' AND column_name='billing_percentage') THEN
                ALTER TABLE future_allocations ADD COLUMN billing_percentage integer NOT NULL DEFAULT 100;
            END IF;
        END $$;
    `);

    // Add constraint for billing_percentage range
    pgm.sql(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'future_allocations_billing_range') THEN
                ALTER TABLE future_allocations ADD CONSTRAINT future_allocations_billing_range 
                CHECK (billing_percentage >= 0 AND billing_percentage <= 100);
            END IF;
        END $$;
    `);
};

export const down = (pgm) => {
    // Re-add the foreign key constraint
    pgm.addConstraint('future_allocations', 'future_allocations_created_by_fkey', {
        foreignKeys: { columns: 'created_by', references: 'users(id)' }
    });
};
