-- Seed: 005_seed_universities
-- Populates universities table with Sri Lankan universities

INSERT INTO universities (name, short_name, country, is_active)
VALUES 
    ('University of Colombo', 'UOC', 'Sri Lanka', true),
    ('University of Moratuwa', 'UOM', 'Sri Lanka', true),
    ('University of Peradeniya', 'UOP', 'Sri Lanka', true),
    ('University of Kelaniya', 'UOK', 'Sri Lanka', true),
    ('University of Sri Jayewardenepura', 'USJ', 'Sri Lanka', true),
    ('University of Ruhuna', 'UOR', 'Sri Lanka', true),
    ('University of Jaffna', 'UOJ', 'Sri Lanka', true),
    ('Rajarata University', 'RUSL', 'Sri Lanka', true),
    ('Sabaragamuwa University', 'SUSL', 'Sri Lanka', true),
    ('Wayamba University', 'WUSL', 'Sri Lanka', true),
    ('Eastern University', 'EUSL', 'Sri Lanka', true),
    ('South Eastern University', 'SEUSL', 'Sri Lanka', true),
    ('Uva Wellassa University', 'UWU', 'Sri Lanka', true),
    ('SLIIT', 'SLIIT', 'Sri Lanka', true),
    ('NSBM Green University', 'NSBM', 'Sri Lanka', true),
    ('IIT Sri Lanka', 'IIT', 'Sri Lanka', true),
    ('APIIT', 'APIIT', 'Sri Lanka', true),
    ('NIBM', 'NIBM', 'Sri Lanka', true),
    ('ESOFT Metro Campus', 'ESOFT', 'Sri Lanka', true),
    ('ICBT Campus', 'ICBT', 'Sri Lanka', true),
    ('CINEC Campus', 'CINEC', 'Sri Lanka', true),
    ('KDU', 'KDU', 'Sri Lanka', true),
    ('Other International', 'INT', 'International', true),
    ('Other', 'Other', 'Other', true)
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name, 
    country = EXCLUDED.country, 
    updated_at = NOW();
