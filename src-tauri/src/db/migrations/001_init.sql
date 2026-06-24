-- Shop POS System initial schema and seed data

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    unit_price DOUBLE PRECISION NOT NULL CHECK (unit_price >= 0),
    cost_price DOUBLE PRECISION,
    stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    min_stock INTEGER NOT NULL DEFAULT 0,
    barcode TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    receipt_no TEXT NOT NULL UNIQUE,
    subtotal DOUBLE PRECISION NOT NULL,
    discount DOUBLE PRECISION NOT NULL DEFAULT 0,
    total DOUBLE PRECISION NOT NULL,
    amount_paid DOUBLE PRECISION NOT NULL,
    change_amount DOUBLE PRECISION NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit_price DOUBLE PRECISION NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

-- Default settings
INSERT INTO settings (key, value) VALUES ('shop_name', 'Shop POS') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('shop_address', '123 Main Street, Barangay Sample, City') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('shop_contact', '0917-000-0000') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('receipt_prefix', 'RCP') ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (id, name, sort_order) VALUES
    ('a1000001-0000-4000-8000-000000000001', 'Educational — Books', 1),
    ('a1000001-0000-4000-8000-000000000002', 'Educational — Supplies', 2),
    ('a1000001-0000-4000-8000-000000000003', 'Educational — Uniforms', 3),
    ('a1000001-0000-4000-8000-000000000004', 'General — Snacks', 4),
    ('a1000001-0000-4000-8000-000000000005', 'General — Beverages', 5),
    ('a1000001-0000-4000-8000-000000000006', 'General — Household', 6),
    ('a1000001-0000-4000-8000-000000000007', 'General — School Snacks', 7)
ON CONFLICT DO NOTHING;

-- Sample products
INSERT INTO products (id, sku, name, category_id, unit_price, cost_price, stock_qty, min_stock) VALUES
    ('b1000001-0000-4000-8000-000000000001', 'BK-001', 'Grade 1 Math Workbook', 'a1000001-0000-4000-8000-000000000001', 85.00, 55.00, 25, 5),
    ('b1000001-0000-4000-8000-000000000002', 'BK-002', 'English Story Book', 'a1000001-0000-4000-8000-000000000001', 120.00, 75.00, 18, 5),
    ('b1000001-0000-4000-8000-000000000003', 'BK-003', 'Science Reference Book', 'a1000001-0000-4000-8000-000000000001', 250.00, 160.00, 10, 3),
    ('b1000001-0000-4000-8000-000000000004', 'SP-001', 'Spiral Notebook (80 leaves)', 'a1000001-0000-4000-8000-000000000002', 35.00, 20.00, 50, 10),
    ('b1000001-0000-4000-8000-000000000005', 'SP-002', 'Ballpen (Blue)', 'a1000001-0000-4000-8000-000000000002', 12.00, 6.00, 100, 20),
    ('b1000001-0000-4000-8000-000000000006', 'SP-003', 'Bond Paper (1 ream)', 'a1000001-0000-4000-8000-000000000002', 180.00, 130.00, 15, 3),
    ('b1000001-0000-4000-8000-000000000007', 'SP-004', 'Crayons (24 colors)', 'a1000001-0000-4000-8000-000000000002', 65.00, 40.00, 20, 5),
    ('b1000001-0000-4000-8000-000000000008', 'UN-001', 'PE Shirt (Medium)', 'a1000001-0000-4000-8000-000000000003', 350.00, 220.00, 12, 3),
    ('b1000001-0000-4000-8000-000000000009', 'UN-002', 'ID Lace', 'a1000001-0000-4000-8000-000000000003', 25.00, 12.00, 30, 5),
    ('b1000001-0000-4000-8000-000000000010', 'SN-001', 'Potato Chips (small)', 'a1000001-0000-4000-8000-000000000004', 15.00, 10.00, 40, 10),
    ('b1000001-0000-4000-8000-000000000011', 'SN-002', 'Skyflakes Crackers', 'a1000001-0000-4000-8000-000000000004', 8.00, 5.00, 60, 15),
    ('b1000001-0000-4000-8000-000000000012', 'BV-001', 'Bottled Water (500ml)', 'a1000001-0000-4000-8000-000000000005', 15.00, 8.00, 48, 12),
    ('b1000001-0000-4000-8000-000000000013', 'BV-002', 'Juice Drink (pouch)', 'a1000001-0000-4000-8000-000000000005', 12.00, 7.00, 36, 10),
    ('b1000001-0000-4000-8000-000000000014', 'HH-001', 'Safeguard Soap (sachet)', 'a1000001-0000-4000-8000-000000000006', 10.00, 6.00, 50, 10),
    ('b1000001-0000-4000-8000-000000000015', 'SS-001', 'Lucky Me Pancit Canton', 'a1000001-0000-4000-8000-000000000007', 15.00, 11.00, 45, 10)
ON CONFLICT DO NOTHING;

INSERT INTO schema_migrations (version) VALUES (1) ON CONFLICT DO NOTHING;

-- Seed default users (bcrypt hash for "admin" and "cashier" respectively)
-- Note: In a real app, you would hash these dynamically. For the seed:
-- bcrypt("admin")
INSERT INTO users (id, username, password_hash, role) VALUES 
('u1000001-0000-4000-8000-000000000001', 'admin', '$2b$12$.QspaSbcSzzpJ7aGGlh1Ru83byxeCYvUhIWsCaqa5J/NB41AybrfO', 'admin')
ON CONFLICT DO NOTHING;

-- bcrypt("cashier")
INSERT INTO users (id, username, password_hash, role) VALUES 
('u1000001-0000-4000-8000-000000000002', 'cashier', '$2b$12$v0bO.2mg5cTIrErnziFAZOcWffgOjCGDuFlM7n1zxMxrZgmXf9xYa', 'cashier')
ON CONFLICT DO NOTHING;
