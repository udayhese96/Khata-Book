-- =============================================
-- SQL Queries for B2B Expense Tracker
-- 3 Tables: companies, product_purchases, transaction_details
-- =============================================

-- =============================================
-- TABLE 1: companies (Company / Firm)
-- =============================================
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    firm_name VARCHAR NOT NULL,
    owner_name VARCHAR NOT NULL,
    owner_phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    contact_persons JSONB DEFAULT '[]',
    -- contact_persons format: [{"name": "John", "phone": "9876543210", "post": "Manager"}, ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- TABLE 2: product_purchases (Product Purchase)
-- =============================================
CREATE TABLE IF NOT EXISTS product_purchases (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    products JSONB DEFAULT '[]',
    -- products format: [{"name": "Cement", "quantity": 10, "unit": "bags", "price_per_unit": 350, "subtotal": 3500}, ...]
    vehicle_number VARCHAR(20),
    notes TEXT,
    bill JSONB DEFAULT '{"total_amount": 0, "amount_paid": 0, "remaining": 0}',
    -- bill format: {"total_amount": 5000, "amount_paid": 2000, "remaining": 3000}
    purchase_date VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_purchases_company_id ON product_purchases(company_id);

-- =============================================
-- TABLE 3: transaction_details (Transaction / Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS transaction_details (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    amount NUMERIC(12, 2) NOT NULL,
    net_amount NUMERIC(12, 2) NOT NULL,
    -- net_amount: negative = firm owes us, positive = we owe firm
    transaction_notes TEXT,
    product_details JSONB,
    -- product_details format: {"products": [{"name": "Cement", "quantity": 10, ...}], "vehicle_number": "MH12AB1234", "notes": "..."}
    vehicle_number VARCHAR(20),
    notes TEXT,
    amount_paid NUMERIC(12, 2),
    transaction_done JSONB,
    -- transaction_done format: {"amount_paid": 2000, "paid_by": "firm", "payment_method": "cash", "timestamp": "2024-12-28 15:30:00"}
    timestamp_ist VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_details_company_id ON transaction_details(company_id);


-- =============================================
-- DROP OLD TABLES (if migrating from old schema)
-- =============================================
-- WARNING: This will delete all existing data!
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;


-- =============================================
-- SAMPLE INSERT QUERIES
-- =============================================

-- Insert a company with multiple contact persons
INSERT INTO companies (firm_name, owner_name, owner_phone, address, contact_persons)
VALUES (
    'ABC Trading Co.',
    'Ramesh Patel',
    '9876543210',
    '123 Market Road, Pune, Maharashtra',
    '[{"name": "Suresh Kumar", "phone": "9876543211", "post": "Manager"}, {"name": "Amit Sharma", "phone": "9876543212", "post": "Accountant"}]'::jsonb
);

-- Insert a product purchase for company_id = 1
INSERT INTO product_purchases (company_id, products, vehicle_number, notes, bill, purchase_date)
VALUES (
    1,
    '[{"name": "Cement", "quantity": 100, "unit": "bags", "price_per_unit": 350, "subtotal": 35000}, {"name": "Steel Rods", "quantity": 50, "unit": "pieces", "price_per_unit": 500, "subtotal": 25000}]'::jsonb,
    'MH12AB1234',
    'Delivered to site A',
    '{"total_amount": 60000, "amount_paid": 20000, "remaining": 40000}'::jsonb,
    '2026-03-07 12:00:00'
);

-- Insert a debit transaction (firm owes us money for a purchase)
INSERT INTO transaction_details (company_id, transaction_type, amount, net_amount, transaction_notes, product_details, vehicle_number, notes, amount_paid, transaction_done, timestamp_ist)
VALUES (
    1,
    'debit',
    60000,
    -60000,
    'Purchase of cement and steel rods',
    '{"products": [{"name": "Cement", "quantity": 100, "unit": "bags", "price_per_unit": 350, "subtotal": 35000}], "vehicle_number": "MH12AB1234", "notes": "Delivered to site A"}'::jsonb,
    'MH12AB1234',
    'Delivered to construction site A',
    20000,
    '{"amount_paid": 20000, "paid_by": "firm", "payment_method": "cash", "timestamp": "2026-03-07 12:00:00"}'::jsonb,
    '2026-03-07 12:00:00'
);

-- Insert a credit transaction (firm pays us)
INSERT INTO transaction_details (company_id, transaction_type, amount, net_amount, transaction_notes, amount_paid, transaction_done, timestamp_ist)
VALUES (
    1,
    'credit',
    25000,
    -35000,  -- was -60000, now -60000 + 25000 = -35000 (firm still owes us 35000)
    'Partial payment received from ABC Trading',
    25000,
    '{"amount_paid": 25000, "paid_by": "firm", "payment_method": "upi", "timestamp": "2026-03-07 14:00:00"}'::jsonb,
    '2026-03-07 14:00:00'
);


-- =============================================
-- USEFUL SELECT QUERIES
-- =============================================

-- Get all companies
SELECT * FROM companies;

-- Get company with contact persons
SELECT id, firm_name, owner_name, owner_phone, address, contact_persons FROM companies WHERE id = 1;

-- Get individual contact persons from JSON
SELECT id, firm_name,
    jsonb_array_elements(contact_persons)->>'name' AS contact_name,
    jsonb_array_elements(contact_persons)->>'phone' AS contact_phone,
    jsonb_array_elements(contact_persons)->>'post' AS contact_post
FROM companies WHERE id = 1;

-- Get all purchases for a company
SELECT * FROM product_purchases WHERE company_id = 1 ORDER BY created_at DESC;

-- Get purchase bill details
SELECT id, company_id,
    bill->>'total_amount' AS total,
    bill->>'amount_paid' AS paid,
    bill->>'remaining' AS remaining,
    vehicle_number
FROM product_purchases WHERE company_id = 1;

-- Get all products from a purchase (explode JSON array)
SELECT pp.id, pp.company_id,
    p->>'name' AS product_name,
    p->>'quantity' AS quantity,
    p->>'unit' AS unit,
    p->>'price_per_unit' AS price,
    p->>'subtotal' AS subtotal
FROM product_purchases pp, jsonb_array_elements(pp.products) AS p
WHERE pp.company_id = 1;

-- Get all transactions for a company
SELECT * FROM transaction_details WHERE company_id = 1 ORDER BY created_at DESC;

-- Get net balance for a company (latest transaction has the running net)
SELECT company_id, net_amount AS current_net_balance
FROM transaction_details
WHERE company_id = 1
ORDER BY created_at DESC
LIMIT 1;

-- Get net balance using SUM (more accurate)
SELECT company_id,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) AS total_credit,
    SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) AS total_debit,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) AS net_balance
FROM transaction_details
WHERE company_id = 1
GROUP BY company_id;

-- Get all companies with their net balance
SELECT c.id, c.firm_name,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END), 0) AS net_balance,
    CASE
        WHEN COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END), 0) < 0 THEN 'Firm owes us'
        WHEN COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END), 0) > 0 THEN 'We owe firm'
        ELSE 'Settled'
    END AS status
FROM companies c
LEFT JOIN transaction_details t ON c.id = t.company_id
GROUP BY c.id, c.firm_name;

-- Get transaction with payment done details
SELECT id, company_id, transaction_type, amount, net_amount,
    transaction_done->>'amount_paid' AS settled_amount,
    transaction_done->>'paid_by' AS paid_by,
    transaction_done->>'payment_method' AS method,
    transaction_done->>'timestamp' AS payment_time
FROM transaction_details
WHERE company_id = 1;
