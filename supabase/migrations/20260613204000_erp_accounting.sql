-- Tally-Like ERP Double-Entry Accounting and Inventory Migration

-- 1. Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  parent_id uuid REFERENCES accounts(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on accounts" ON accounts FOR SELECT USING (true);
CREATE POLICY "Enable full access for authenticated users on accounts" ON accounts FOR ALL USING (auth.role() = 'authenticated');

-- 2. Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text,
  reference_type text, -- 'invoice', 'payment', 'purchase', 'expense', 'manual'
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on journal_entries" ON journal_entries FOR SELECT USING (true);
CREATE POLICY "Enable full access for authenticated users on journal_entries" ON journal_entries FOR ALL USING (auth.role() = 'authenticated');

-- 3. Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id),
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on journal_entry_lines" ON journal_entry_lines FOR SELECT USING (true);
CREATE POLICY "Enable full access for authenticated users on journal_entry_lines" ON journal_entry_lines FOR ALL USING (auth.role() = 'authenticated');

-- 4. Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  transaction_date date NOT NULL,
  quantity_change numeric NOT NULL, -- negative for sales, positive for purchases/returns
  reference_type text,
  reference_id uuid,
  unit_cost numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Enable full access for authenticated users on inventory_transactions" ON inventory_transactions FOR ALL USING (auth.role() = 'authenticated');

-- 5. Trigger to automatically update products.stock_count
CREATE OR REPLACE FUNCTION update_product_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET stock_count = COALESCE(stock_count, 0) + NEW.quantity_change WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET stock_count = COALESCE(stock_count, 0) - OLD.quantity_change WHERE id = OLD.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products SET stock_count = COALESCE(stock_count, 0) - OLD.quantity_change + NEW.quantity_change WHERE id = NEW.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER INSERT OR UPDATE OR DELETE ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_transaction();

-- 6. Customer and Supplier Links to Accounts
-- Add account_id to customers and suppliers so they have a ledger
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

-- 7. Seed Default System Accounts
-- We will insert a few core accounts. Since UUIDs are generated, we don't know them in advance.
-- But we can identify them by name later.
INSERT INTO accounts (name, account_type) VALUES 
('Sales Revenue', 'Revenue'),
('Service Income', 'Revenue'),
('Cost of Goods Sold', 'Expense'),
('Inventory Asset', 'Asset'),
('Tax Payable', 'Liability'),
('Cash/Bank', 'Asset'),
('Opening Balance Equity', 'Equity')
ON CONFLICT DO NOTHING;
