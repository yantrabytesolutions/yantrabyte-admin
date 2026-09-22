-- Schema Setup for Nagarathnamma Cash Bill & Standalone Billing App
-- Project: https://ifxjekxawcnczezyjkrd.supabase.co

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Invoices Table
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
    payment_status TEXT NOT NULL DEFAULT 'Due',
    payment_mode TEXT NOT NULL DEFAULT 'Not specified',
    due_date TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    payments JSONB DEFAULT '[]'::jsonb,
    terms_conditions TEXT,
    warranty_months INTEGER,
    pdf_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval TEXT DEFAULT 'monthly',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Service Tickets Table (for prefill integration)
CREATE TABLE IF NOT EXISTS public.service_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    device_type TEXT,
    device_make_model TEXT,
    device_password TEXT,
    service_method TEXT DEFAULT 'drop_off',
    pickup_date TEXT,
    preferred_contact TEXT,
    whatsapp_opt_in BOOLEAN DEFAULT false,
    pre_approved_budget TEXT,
    issue_description TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    warranty_months INTEGER,
    notes TEXT,
    technician_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT,
    price NUMERIC DEFAULT 0,
    stock_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security Policies (Allow access with publishable/anon key)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on customers" ON public.customers;
CREATE POLICY "Public full access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on invoices" ON public.invoices;
CREATE POLICY "Public full access on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on service_tickets" ON public.service_tickets;
CREATE POLICY "Public full access on service_tickets" ON public.service_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on products" ON public.products;
CREATE POLICY "Public full access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on site_settings" ON public.site_settings;
CREATE POLICY "Public full access on site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- 8. Insert Nagarathnamma Customer & initial record if desired
INSERT INTO public.customers (name, phone, address)
VALUES ('Nagarathnamma KN', '', 'Bengaluru')
ON CONFLICT DO NOTHING;
