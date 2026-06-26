CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode TEXT,
    reference_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (or service role) based on existing policies
CREATE POLICY "Enable read access for all users" ON public.customer_payments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.customer_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.customer_payments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.customer_payments FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_customer_payments_modtime
    BEFORE UPDATE ON public.customer_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
