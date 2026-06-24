-- Add policy to allow public users to submit service tickets
DROP POLICY IF EXISTS "Public can create service tickets" ON public.service_tickets;
CREATE POLICY "Public can create service tickets" 
  ON public.service_tickets 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);
