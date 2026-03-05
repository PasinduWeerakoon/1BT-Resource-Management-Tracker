-- Seed: 008_seed_system_user
-- Creates a system user for production (needed by Bench project and imports)

INSERT INTO users (username, email, password_hash, role, status)
VALUES ('system', 'hirun.dealwis@1billiontech.com', '$2b$10$placeholder.not.used.for.login', 'Super User', 'Active')
ON CONFLICT DO NOTHING;
