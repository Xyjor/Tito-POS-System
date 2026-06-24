ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_products BOOLEAN NOT NULL DEFAULT FALSE;

-- By default, admin has full access
UPDATE users SET can_manage_products = TRUE WHERE role = 'admin';

INSERT INTO schema_migrations (version) VALUES (2) ON CONFLICT DO NOTHING;
