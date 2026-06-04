ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
