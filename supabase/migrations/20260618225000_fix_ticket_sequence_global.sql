-- Fix the ticket sequence function to always pick the highest suffix number
-- across ALL ticket number formats, preventing duplicates or resets.
CREATE OR REPLACE FUNCTION get_next_service_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_suffix integer := 1;
  max_suffix  integer := 0;
  today_prefix text;
BEGIN
  today_prefix := 'YBS-TKT-' || to_char(current_date, 'DDMMYY') || '-';

  -- Find the highest trailing number across ALL ticket formats ever used
  SELECT COALESCE(MAX((regexp_replace(ticket_number, '^.*-(\d+)$', '\1'))::integer), 0)
  INTO max_suffix
  FROM public.service_tickets
  WHERE ticket_number ~ '-\d+$';

  next_suffix := max_suffix + 1;

  RETURN today_prefix || lpad(next_suffix::text, 3, '0');
END;
$$;
