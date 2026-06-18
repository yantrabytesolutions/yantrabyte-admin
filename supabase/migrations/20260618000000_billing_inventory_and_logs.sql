CREATE TABLE IF NOT EXISTS public.billing_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  default_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Allow authenticated users (admin panel) to read/write inventory
ALTER TABLE public.billing_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to billing_inventory" ON public.billing_inventory FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to billing_inventory" ON public.billing_inventory FOR ALL USING (auth.role() = 'authenticated');

-- Add internal_logs to service_tickets
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS internal_logs jsonb DEFAULT '[]'::jsonb;
