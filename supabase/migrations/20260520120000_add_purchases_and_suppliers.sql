-- Create suppliers table for the Billing Software
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create purchases table for the Billing Software
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_no TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    date TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    round_off NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    balance_due NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS Policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers table
CREATE POLICY "Allow read access for authenticated users on suppliers" 
    ON public.suppliers FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access for authenticated users on suppliers" 
    ON public.suppliers FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for authenticated users on suppliers" 
    ON public.suppliers FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete access for authenticated users on suppliers" 
    ON public.suppliers FOR DELETE 
    USING (auth.role() = 'authenticated');

-- RLS policies for purchases table
CREATE POLICY "Allow read access for authenticated users on purchases" 
    ON public.purchases FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access for authenticated users on purchases" 
    ON public.purchases FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for authenticated users on purchases" 
    ON public.purchases FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete access for authenticated users on purchases" 
    ON public.purchases FOR DELETE 
    USING (auth.role() = 'authenticated');
