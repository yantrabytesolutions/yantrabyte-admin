-- Start a fresh Customer Master without deleting old invoices, quotations, or purchases.
DO $$
BEGIN
  IF to_regclass('public.invoices') IS NOT NULL
     AND to_regclass('public.customers') IS NOT NULL THEN
    UPDATE public.invoices
    SET customer_id = NULL
    WHERE customer_id IS NOT NULL;

    DELETE FROM public.customers;
  END IF;
END $$;

INSERT INTO public.site_settings (key, value)
VALUES ('billing_customer_master_fresh_started_at', '2026-05-22T19:00:00+05:30')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

INSERT INTO public.site_settings (key, value)
VALUES ('billing_documents_fresh_started_at', NOW()::TEXT)
ON CONFLICT (key) DO NOTHING;
