ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS customer_address text;

DROP POLICY IF EXISTS "Public can create service tickets" ON public.service_tickets;

CREATE POLICY "Public can create service tickets"
  ON public.service_tickets
  FOR INSERT
  TO anon
  WITH CHECK (
    ticket_number LIKE 'YBS-service-Ticket %'
    AND NULLIF(BTRIM(customer_name), '') IS NOT NULL
    AND NULLIF(BTRIM(customer_phone), '') IS NOT NULL
    AND NULLIF(BTRIM(issue_description), '') IS NOT NULL
    AND status = 'open'
    AND priority IN ('low', 'medium', 'high', 'urgent')
    AND assigned_to IS NULL
    AND notes IS NULL
  );
