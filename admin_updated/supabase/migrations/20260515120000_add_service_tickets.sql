-- Create service_tickets table
CREATE TABLE IF NOT EXISTS public.service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  device_type text,
  issue_description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admins) to have full access
CREATE POLICY "Admins have full access to service_tickets"
  ON public.service_tickets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
