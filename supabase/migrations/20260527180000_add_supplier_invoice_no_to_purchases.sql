-- Add supplier_invoice_no column to public.purchases table if not exists
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS supplier_invoice_no text;
