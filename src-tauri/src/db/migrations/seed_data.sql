-- Shop POS System seed data (only run on fresh install)

-- Default settings
INSERT INTO settings (key, value) VALUES ('shop_name', 'Shop POS') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('shop_address', '123 Main Street, Barangay Sample, City') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('shop_contact', '0917-000-0000') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('receipt_prefix', 'RCP') ON CONFLICT DO NOTHING;


-- Seed default users (bcrypt hash for "admin" and "cashier" respectively)
-- bcrypt("admin")
INSERT INTO users (id, username, password_hash, role) VALUES 
('u1000001-0000-4000-8000-000000000001', 'admin', '$2b$12$.QspaSbcSzzpJ7aGGlh1Ru83byxeCYvUhIWsCaqa5J/NB41AybrfO', 'admin')
ON CONFLICT DO NOTHING;

-- bcrypt("cashier")
INSERT INTO users (id, username, password_hash, role) VALUES 
('u1000001-0000-4000-8000-000000000002', 'cashier', '$2b$12$v0bO.2mg5cTIrErnziFAZOcWffgOjCGDuFlM7n1zxMxrZgmXf9xYa', 'cashier')
ON CONFLICT DO NOTHING;
