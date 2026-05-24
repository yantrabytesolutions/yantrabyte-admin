CREATE OR REPLACE FUNCTION get_next_service_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_suffix integer := 1;
  last_ticket text;
  today_prefix text;
BEGIN
  today_prefix := 'YBS-TKT-' || to_char(current_date, 'DDMMYY') || '-';

  SELECT ticket_number INTO last_ticket
  FROM public.service_tickets
  WHERE ticket_number LIKE today_prefix || '%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_ticket IS NOT NULL THEN
    next_suffix := (regexp_replace(last_ticket, '^.*-(\d+)$', '\1'))::integer + 1;
  END IF;

  RETURN today_prefix || lpad(next_suffix::text, 3, '0');
END;
$$;