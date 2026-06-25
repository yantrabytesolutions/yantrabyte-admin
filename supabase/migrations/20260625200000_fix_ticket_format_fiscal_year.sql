-- Fix ticket number format to use fiscal year based sequential numbering
-- Format: YBS-YYYY-YYYY-XXX (e.g. YBS-2026-2027-037)
-- Fiscal year: April to March (Indian financial year)

-- 1. Replace the ticket number generator function
CREATE OR REPLACE FUNCTION get_next_service_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_suffix integer;
  max_suffix  integer := 0;
  fiscal_prefix text;
  fiscal_start_year integer;
  fiscal_end_year integer;
BEGIN
  -- Determine Indian fiscal year (April to March)
  -- If current month >= April (4), fiscal year starts this calendar year
  -- If current month < April, fiscal year started last calendar year
  IF EXTRACT(MONTH FROM current_date) >= 4 THEN
    fiscal_start_year := EXTRACT(YEAR FROM current_date)::integer;
  ELSE
    fiscal_start_year := (EXTRACT(YEAR FROM current_date) - 1)::integer;
  END IF;
  fiscal_end_year := fiscal_start_year + 1;

  fiscal_prefix := 'YBS-' || fiscal_start_year::text || '-' || fiscal_end_year::text || '-';

  -- Find the highest suffix ONLY among tickets with the current fiscal year prefix
  SELECT COALESCE(MAX((regexp_replace(ticket_number, '^.*-(\d+)$', '\1'))::integer), 0)
  INTO max_suffix
  FROM public.service_tickets
  WHERE ticket_number LIKE fiscal_prefix || '%';

  next_suffix := max_suffix + 1;

  RETURN fiscal_prefix || lpad(next_suffix::text, 3, '0');
END;
$$;

-- 2. Update the RLS policy to accept both old and new ticket formats
DROP POLICY IF EXISTS "Public can create service tickets" ON public.service_tickets;

CREATE POLICY "Public can create service tickets"
  ON public.service_tickets
  FOR INSERT
  TO anon
  WITH CHECK (
    (ticket_number LIKE 'YBS-TKT-%' OR ticket_number ~ '^YBS-\d{4}-\d{4}-\d+$')
    AND NULLIF(BTRIM(customer_name), '') IS NOT NULL
    AND NULLIF(BTRIM(customer_phone), '') IS NOT NULL
    AND NULLIF(BTRIM(issue_description), '') IS NOT NULL
    AND status = 'open'
    AND priority IN ('low', 'medium', 'high', 'urgent')
    AND assigned_to IS NULL
    AND notes IS NULL
  );
