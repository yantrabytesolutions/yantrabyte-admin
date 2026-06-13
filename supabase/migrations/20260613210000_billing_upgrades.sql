-- Add recurring invoice fields for AMC subscriptions
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS recurring_interval TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS next_due_date DATE;
