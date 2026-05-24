-- Add customer master records and payment tracking to invoices.
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users on customers"
    ON public.customers FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access for authenticated users on customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for authenticated users on customers"
    ON public.customers FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete access for authenticated users on customers"
    ON public.customers FOR DELETE
    USING (auth.role() = 'authenticated');

ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'Not specified',
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Due',
    ADD COLUMN IF NOT EXISTS due_date TEXT;

-- Populate customers from invoices
INSERT INTO public.customers (name, phone, email, address)
SELECT DISTINCT ON (COALESCE(NULLIF(BTRIM(phone), ''), LOWER(BTRIM(customer_name))))
    customer_name,
    NULLIF(BTRIM(phone), ''),
    NULLIF(BTRIM(email), ''),
    NULLIF(BTRIM(address), '')
FROM public.invoices
WHERE NULLIF(BTRIM(customer_name), '') IS NOT NULL
ORDER BY COALESCE(NULLIF(BTRIM(phone), ''), LOWER(BTRIM(customer_name))), created_at DESC
ON CONFLICT (phone) DO NOTHING;

UPDATE public.invoices inv
SET customer_id = cust.id
FROM public.customers cust
WHERE inv.customer_id IS NULL
  AND NULLIF(BTRIM(inv.phone), '') IS NOT NULL
  AND cust.phone = NULLIF(BTRIM(inv.phone), '');

UPDATE public.invoices inv
SET customer_id = cust.id
FROM public.customers cust
WHERE inv.customer_id IS NULL
  AND LOWER(BTRIM(inv.customer_name)) = LOWER(BTRIM(cust.name));

UPDATE public.invoices
SET payment_status = CASE
    WHEN doc_type = 'Quotation' THEN 'Estimate'
    WHEN COALESCE(balance_due, 0) <= 0 THEN 'Paid'
    WHEN COALESCE(advance_paid, 0) > 0 THEN 'Partial'
    ELSE 'Due'
END
WHERE payment_status IS NULL OR payment_status = 'Due';
