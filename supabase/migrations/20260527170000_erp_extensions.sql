-- Create serialized_items table to track individual product serials
CREATE TABLE IF NOT EXISTS public.serialized_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'in_stock', -- 'in_stock', 'sold', 'returned_to_vendor', 'written_off'
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  invoice_no text, -- text field referencing invoice_no
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table to track operational costs
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'Rent', 'Salaries', 'Utilities', 'Tools', 'Marketing', 'Other'
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create amc_contracts table to track yearly AMC packages
CREATE TABLE IF NOT EXISTS public.amc_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text,
  client_phone text NOT NULL,
  contract_value numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'active', 'expired', 'renewed'
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS Policies on new tables
ALTER TABLE public.serialized_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_contracts ENABLE ROW LEVEL SECURITY;

-- Admins full access policies
CREATE POLICY "Admins have full access to serialized_items"
  ON public.serialized_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to expenses"
  ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to amc_contracts"
  ON public.amc_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
