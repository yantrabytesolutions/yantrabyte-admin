-- Add review_requested to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS review_requested BOOLEAN DEFAULT false;

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (since the app uses anon key)
CREATE POLICY "Allow anonymous read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete expenses" ON public.expenses FOR DELETE USING (true);
