-- Update ticket sequence function to always find the global max suffix,
-- ensuring no duplicate suffixes are generated even if the prefix format changes.

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
  IF EXTRACT(MONTH FROM current_date) >= 4 THEN
    fiscal_start_year := EXTRACT(YEAR FROM current_date)::integer;
  ELSE
    fiscal_start_year := (EXTRACT(YEAR FROM current_date) - 1)::integer;
  END IF;
  fiscal_end_year := fiscal_start_year + 1;

  fiscal_prefix := 'YBS-' || fiscal_start_year::text || '-' || fiscal_end_year::text || '-';

  -- Find the highest trailing number across ALL ticket formats ever used (global maximum)
  SELECT COALESCE(MAX((regexp_replace(ticket_number, '^.*-(\d+)$', '\1'))::integer), 0)
  INTO max_suffix
  FROM public.service_tickets
  WHERE ticket_number ~ '-\d+$';

  next_suffix := max_suffix + 1;

  RETURN fiscal_prefix || lpad(next_suffix::text, 3, '0');
END;
$$;
