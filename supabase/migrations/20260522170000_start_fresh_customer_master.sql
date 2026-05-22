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
