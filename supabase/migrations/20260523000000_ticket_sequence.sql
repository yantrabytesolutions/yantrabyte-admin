CREATE OR REPLACE FUNCTION get_next_service_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_suffix integer := 1;
  last_ticket text;
  month_start date;
  month_end date;
BEGIN
  month_start := date_trunc('month', current_date)::date;
  month_end := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;

  SELECT ticket_number INTO last_ticket
  FROM public.service_tickets
  WHERE created_at >= month_start AND created_at <= month_end
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_ticket IS NOT NULL THEN
    next_suffix := (regexp_replace(last_ticket, '^.*-(\d+)$', '\1'))::integer + 1;
  END IF;

  RETURN 'YBS-service-Ticket ' || to_char(current_date, 'DDMMYYYY') || '-' || lpad(next_suffix::text, 3, '0');
END;
$$;
