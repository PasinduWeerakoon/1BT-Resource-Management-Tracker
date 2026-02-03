-- Seed: 006_seed_tags
-- Populates tags table with default values

INSERT INTO tags (name, description, color, is_active, is_default)
VALUES 
    ('Synergy', 'Synergy program participant', '#4CAF50', true, true),
    ('GDC', 'Global Delivery Center', '#2196F3', true, true),
    ('Leaders League', 'Leadership development program', '#9C27B0', true, true),
    ('High Performer', 'High performing employee', '#FF9800', true, false),
    ('Critical Resource', 'Business critical resource', '#F44336', true, false),
    ('Mentor', 'Acts as mentor to others', '#00BCD4', true, false),
    ('Remote', 'Works remotely', '#607D8B', true, false),
    ('New Joiner', 'Recently joined employee', '#8BC34A', true, false)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description, 
    color = EXCLUDED.color, 
    updated_at = NOW();
