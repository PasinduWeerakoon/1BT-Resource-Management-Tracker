/**
 * Migration: Add tier_id to designations table
 * 
 * This migration adds a tier_id column to the designations table to properly
 * map designations to tiers from the TIERS config.
 * 
 * Tier Mapping:
 * - Tier 5 (Intern): All designations with is_intern_role = true
 * - Tier 1 (Entry): Trainee roles, ASE, QAE equivalent
 * - Tier 2 (Intermediate): SE, mid-level roles  
 * - Tier 3 (Senior): SSE, ATL, senior roles
 * - Tier 4 (Expert): TL, STL, Architects, leads
 * - Tier 6 (None): Administrative/support roles
 * - Tier 7 (Synergy): Synergy program roles
 */

export const up = async (db) => {
    // Add tier_id column to designations table
    await db.query(`
        ALTER TABLE designations 
        ADD COLUMN IF NOT EXISTS tier_id INTEGER;
    `);

    // Update existing designations with correct tier_id based on level and is_intern_role
    // Intern roles (is_intern_role = true) -> Tier 5 (Intern)
    await db.query(`
        UPDATE designations 
        SET tier_id = 5 
        WHERE is_intern_role = true;
    `);

    // Level-based mapping for non-intern roles:
    // Level 1 (Trainee) -> Tier 1 (Entry)
    await db.query(`
        UPDATE designations 
        SET tier_id = 1 
        WHERE is_intern_role = false AND level = 1;
    `);

    // Level 2-3 (ASE, SE, QAE, BA) -> Tier 2 (Intermediate)
    await db.query(`
        UPDATE designations 
        SET tier_id = 2 
        WHERE is_intern_role = false AND level IN (2, 3);
    `);

    // Level 4-5 (SSE, SQAE, ATL, PM, SBA) -> Tier 3 (Senior)
    await db.query(`
        UPDATE designations 
        SET tier_id = 3 
        WHERE is_intern_role = false AND level IN (4, 5);
    `);

    // Level 6-7 (TL, STL, QAL, SQAL, SPM, PPM) -> Tier 4 (Expert)
    await db.query(`
        UPDATE designations 
        SET tier_id = 4 
        WHERE is_intern_role = false AND level IN (6, 7);
    `);

    // Level 8-9 (Architect, Principal) -> Tier 4 (Expert)
    await db.query(`
        UPDATE designations 
        SET tier_id = 4 
        WHERE is_intern_role = false AND level IN (8, 9);
    `);

    // Level 0 (None/Other) -> Tier 6 (None)
    await db.query(`
        UPDATE designations 
        SET tier_id = 6 
        WHERE level = 0 OR level IS NULL;
    `);

    // Set default for any remaining nulls
    await db.query(`
        UPDATE designations 
        SET tier_id = 6 
        WHERE tier_id IS NULL;
    `);

    // Add NOT NULL constraint after setting defaults
    await db.query(`
        ALTER TABLE designations 
        ALTER COLUMN tier_id SET NOT NULL;
    `);

    // Add default value for new rows
    await db.query(`
        ALTER TABLE designations 
        ALTER COLUMN tier_id SET DEFAULT 6;
    `);

    console.log('Migration 020: Added tier_id to designations table');
};

export const down = async (db) => {
    await db.query(`
        ALTER TABLE designations DROP COLUMN IF EXISTS tier_id;
    `);
    console.log('Migration 020: Removed tier_id from designations table');
};

export default { up, down };
