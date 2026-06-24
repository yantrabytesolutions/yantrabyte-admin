-- Restore the financial year ticket format (YBS-YYYY-YYYY-SEQ)
CREATE OR REPLACE FUNCTION get_next_service_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_suffix integer := 1;
  max_suffix  integer := 0;
  fy_prefix text;
  current_month integer;
  current_year integer;
  start_year integer;
  end_year integer;
BEGIN
  current_month := EXTRACT(MONTH FROM current_date);
  current_year := EXTRACT(YEAR FROM current_date);
  
  IF current_month < 4 THEN
    start_year := current_year - 1;
    end_year := current_year;
  ELSE
    start_year := current_year;
    end_year := current_year + 1;
  END IF;

  fy_prefix := 'YBS-' || start_year::text || '-' || end_year::text || '-';

  -- Find the highest trailing number ONLY for this financial year prefix
  SELECT COALESCE(MAX((regexp_replace(ticket_number, '^.*-(\d+)$', '\1'))::integer), 0)
  INTO max_suffix
  FROM public.service_tickets
  WHERE ticket_number LIKE fy_prefix || '%';

  next_suffix := max_suffix + 1;

  RETURN fy_prefix || lpad(next_suffix::text, 3, '0');
END;
$$;
