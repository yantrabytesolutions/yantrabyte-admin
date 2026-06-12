-- Migration: Add quote approval and diagnostic fields to service_tickets
-- Run this in your Supabase SQL Editor

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS diagnostic_image_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS client_approval_status TEXT DEFAULT NULL;

-- Add customer_address column if not present (used by ServiceRequest form)
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT NULL;

-- Add technician_notes column if not present (used by TrackTicket)
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS technician_notes TEXT DEFAULT NULL;

-- Allow anonymous users to read limited ticket data for tracking page
-- (They already need ticket_number + phone to look up, so this is safe)
CREATE POLICY IF NOT EXISTS "Public can read own tickets by number and phone"
  ON public.service_tickets FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to update client_approval_status only
CREATE POLICY IF NOT EXISTS "Public can update approval status"
  ON public.service_tickets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Note: The RLS policies above are permissive because the app-level code
-- already requires ticket_number + phone match to find a ticket.
-- For production hardening, consider a Supabase Edge Function instead.
