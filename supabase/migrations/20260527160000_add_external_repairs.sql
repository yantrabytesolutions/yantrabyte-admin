-- Create external_repairs table to track materials sent out for external service
CREATE TABLE IF NOT EXISTS public.external_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text REFERENCES public.service_tickets(ticket_number) ON DELETE SET NULL,
  material_name text NOT NULL,
  serial_number text,
  sent_to text NOT NULL,
  sent_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date date,
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'received', 'cancelled'
  received_date date,
  cost numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_repairs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admins) to have full access
CREATE POLICY "Admins have full access to external_repairs"
  ON public.external_repairs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
