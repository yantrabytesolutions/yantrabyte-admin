-- Add stock tracking to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count integer DEFAULT 0;

-- Add warranty tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS warranty_months integer;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS warranty_months integer;
