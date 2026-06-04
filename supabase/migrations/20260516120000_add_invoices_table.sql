-- Create invoices table for the built-in Billing Software
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT UNIQUE NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'Invoice',
    date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    round_off NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    advance_paid NUMERIC NOT NULL DEFAULT 0,
    balance_due NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for admins" 
    ON public.invoices FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access for admins" 
    ON public.invoices FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for admins" 
    ON public.invoices FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete access for admins" 
    ON public.invoices FOR DELETE 
    USING (auth.role() = 'authenticated');
