/**
 * Migration: 003 - Seed Default Data
 * Inserts initial tracks, designations, and admin user
 */

exports.shorthands = undefined;

exports.up = async (pgm) => {
    // =====================================================
    // SEED TRACKS
    // =====================================================
    pgm.sql(`
    INSERT INTO tracks (name, description, is_active) VALUES
    ('FS', 'Full Stack Development', true),
    ('.Net', '.NET Development', true),
    ('DS', 'Data Science', true),
    ('UI/UX', 'UI/UX Design', true),
    ('QA', 'Quality Assurance', true),
    ('PM/BA', 'Project Management / Business Analysis', true);
  `);

    // =====================================================
    // SEED DESIGNATIONS
    // =====================================================
    pgm.sql(`
    INSERT INTO designations (name, level, is_intern_role, is_active) VALUES
    -- Engineering Designations
    ('Intern - SE', 1, true, true),
    ('Associate Software Engineer', 2, false, true),
    ('Software Engineer', 3, false, true),
    ('Senior Software Engineer', 4, false, true),
    ('Associate Technical Lead', 5, false, true),
    ('Technical Lead', 6, false, true),
    ('Senior Technical Lead', 7, false, true),
    ('Architect', 8, false, true),
    
    -- QA Designations
    ('Intern - QA', 1, true, true),
    ('Associate QA Engineer', 2, false, true),
    ('QA Engineer', 3, false, true),
    ('Senior QA Engineer', 4, false, true),
    ('Associate QA Lead', 5, false, true),
    ('QA Lead', 6, false, true),
    
    -- PM/BA Designations
    ('Intern - PM', 1, true, true),
    ('Associate Business Analyst', 2, false, true),
    ('Business Analyst', 3, false, true),
    ('Senior Business Analyst', 4, false, true),
    ('Project Manager', 5, false, true),
    ('Senior Project Manager', 6, false, true),
    
    -- Design Designations
    ('Intern - UI/UX', 1, true, true),
    ('UI/UX Designer', 3, false, true),
    ('Senior UI/UX Designer', 4, false, true),
    ('Lead UI/UX Designer', 5, false, true);
  `);

    // =====================================================
    // SEED SUPER ADMIN USER
    // =====================================================
    // Note: Password should be changed on first login
    // Default password: Admin@123456 (bcrypt hashed)
    pgm.sql(`
    INSERT INTO users (username, email, password_hash, role, status, must_change_password) VALUES
    ('superadmin', 'hirun.dealwis@1billiontech.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4YjKmKCDLNIKQoiG', 'Super User', 'Active', true);
  `);
};

exports.down = (pgm) => {
    pgm.sql(`DELETE FROM users WHERE username = 'superadmin'`);
    pgm.sql(`DELETE FROM designations`);
    pgm.sql(`DELETE FROM tracks`);
};
