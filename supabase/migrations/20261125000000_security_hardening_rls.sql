-- Security Hardening Migration (2026-11-25)
-- Replaces overly permissive anonymous / broad authenticated RLS policies
-- with strict public.is_admin() checks and tightens public ticket INSERT rules.

-- 1. Lock down search_path on get_next_service_ticket_number() if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_next_service_ticket_number'
  ) THEN
    ALTER FUNCTION public.get_next_service_ticket_number() SET search_path = 'public', 'pg_catalog';
    GRANT EXECUTE ON FUNCTION public.get_next_service_ticket_number() TO anon, authenticated;
  END IF;
END $$;

-- 2. Service Tickets: allow public INSERT with strict validation, restrict SELECT/UPDATE/DELETE to admins
DO $$
BEGIN
  IF to_regclass('public.service_tickets') IS NOT NULL THEN
    ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can read own tickets by number and phone" ON public.service_tickets;
    DROP POLICY IF EXISTS "Public can update approval status" ON public.service_tickets;
    DROP POLICY IF EXISTS "Admins have full access to service_tickets" ON public.service_tickets;
    DROP POLICY IF EXISTS "Public can create service tickets" ON public.service_tickets;
    DROP POLICY IF EXISTS "Admin full access service_tickets" ON public.service_tickets;

    CREATE POLICY "Admin full access service_tickets"
      ON public.service_tickets FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    CREATE POLICY "Public can create service tickets"
      ON public.service_tickets FOR INSERT
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
  END IF;
END $$;

-- 3. Expenses: admin-only access
DO $$
BEGIN
  IF to_regclass('public.expenses') IS NOT NULL THEN
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow anonymous read expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Allow anonymous insert expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Allow anonymous update expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Allow anonymous delete expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Admins have full access to expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Admin full access expenses" ON public.expenses;

    CREATE POLICY "Admin full access expenses"
      ON public.expenses FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 4. Customer Payments: admin-only access
DO $$
BEGIN
  IF to_regclass('public.customer_payments') IS NOT NULL THEN
    ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Enable read access for all users" ON public.customer_payments;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON public.customer_payments;
    DROP POLICY IF EXISTS "Enable update access for all users" ON public.customer_payments;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON public.customer_payments;
    DROP POLICY IF EXISTS "Admin full access customer_payments" ON public.customer_payments;

    CREATE POLICY "Admin full access customer_payments"
      ON public.customer_payments FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 5. Invoices: admin-only access (public portal/quotations go through backend API)
DO $$
BEGIN
  IF to_regclass('public.invoices') IS NOT NULL THEN
    ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow read access for admins" ON public.invoices;
    DROP POLICY IF EXISTS "Allow insert access for admins" ON public.invoices;
    DROP POLICY IF EXISTS "Allow update access for admins" ON public.invoices;
    DROP POLICY IF EXISTS "Allow delete access for admins" ON public.invoices;
    DROP POLICY IF EXISTS "Admin full access invoices" ON public.invoices;

    CREATE POLICY "Admin full access invoices"
      ON public.invoices FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 6. Customers: admin-only access
DO $$
BEGIN
  IF to_regclass('public.customers') IS NOT NULL THEN
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow read access for authenticated users on customers" ON public.customers;
    DROP POLICY IF EXISTS "Allow insert access for authenticated users on customers" ON public.customers;
    DROP POLICY IF EXISTS "Allow update access for authenticated users on customers" ON public.customers;
    DROP POLICY IF EXISTS "Allow delete access for authenticated users on customers" ON public.customers;
    DROP POLICY IF EXISTS "Admin full access customers" ON public.customers;

    CREATE POLICY "Admin full access customers"
      ON public.customers FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 7. Suppliers & Purchases: admin-only access
DO $$
BEGIN
  IF to_regclass('public.suppliers') IS NOT NULL THEN
    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow read access for authenticated users on suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Allow insert access for authenticated users on suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Allow update access for authenticated users on suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Allow delete access for authenticated users on suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Admin full access suppliers" ON public.suppliers;

    CREATE POLICY "Admin full access suppliers"
      ON public.suppliers FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.purchases') IS NOT NULL THEN
    ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow read access for authenticated users on purchases" ON public.purchases;
    DROP POLICY IF EXISTS "Allow insert access for authenticated users on purchases" ON public.purchases;
    DROP POLICY IF EXISTS "Allow update access for authenticated users on purchases" ON public.purchases;
    DROP POLICY IF EXISTS "Allow delete access for authenticated users on purchases" ON public.purchases;
    DROP POLICY IF EXISTS "Admin full access purchases" ON public.purchases;

    CREATE POLICY "Admin full access purchases"
      ON public.purchases FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 8. External Repairs, Serialized Items, AMC Contracts: admin-only access
DO $$
BEGIN
  IF to_regclass('public.external_repairs') IS NOT NULL THEN
    ALTER TABLE public.external_repairs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access to external_repairs" ON public.external_repairs;
    DROP POLICY IF EXISTS "Admin full access external_repairs" ON public.external_repairs;
    CREATE POLICY "Admin full access external_repairs"
      ON public.external_repairs FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.serialized_items') IS NOT NULL THEN
    ALTER TABLE public.serialized_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access to serialized_items" ON public.serialized_items;
    DROP POLICY IF EXISTS "Admin full access serialized_items" ON public.serialized_items;
    CREATE POLICY "Admin full access serialized_items"
      ON public.serialized_items FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.amc_contracts') IS NOT NULL THEN
    ALTER TABLE public.amc_contracts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access to amc_contracts" ON public.amc_contracts;
    DROP POLICY IF EXISTS "Admin full access amc_contracts" ON public.amc_contracts;
    CREATE POLICY "Admin full access amc_contracts"
      ON public.amc_contracts FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 9. Accounting & Inventory Ledger Tables: admin-only access
DO $$
BEGIN
  IF to_regclass('public.accounts') IS NOT NULL THEN
    ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for all users on accounts" ON public.accounts;
    DROP POLICY IF EXISTS "Enable full access for authenticated users on accounts" ON public.accounts;
    DROP POLICY IF EXISTS "Admin full access accounts" ON public.accounts;
    CREATE POLICY "Admin full access accounts"
      ON public.accounts FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.journal_entries') IS NOT NULL THEN
    ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for all users on journal_entries" ON public.journal_entries;
    DROP POLICY IF EXISTS "Enable full access for authenticated users on journal_entries" ON public.journal_entries;
    DROP POLICY IF EXISTS "Admin full access journal_entries" ON public.journal_entries;
    CREATE POLICY "Admin full access journal_entries"
      ON public.journal_entries FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.journal_entry_lines') IS NOT NULL THEN
    ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for all users on journal_entry_lines" ON public.journal_entry_lines;
    DROP POLICY IF EXISTS "Enable full access for authenticated users on journal_entry_lines" ON public.journal_entry_lines;
    DROP POLICY IF EXISTS "Admin full access journal_entry_lines" ON public.journal_entry_lines;
    CREATE POLICY "Admin full access journal_entry_lines"
      ON public.journal_entry_lines FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.inventory_transactions') IS NOT NULL THEN
    ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for all users on inventory_transactions" ON public.inventory_transactions;
    DROP POLICY IF EXISTS "Enable full access for authenticated users on inventory_transactions" ON public.inventory_transactions;
    DROP POLICY IF EXISTS "Admin full access inventory_transactions" ON public.inventory_transactions;
    CREATE POLICY "Admin full access inventory_transactions"
      ON public.inventory_transactions FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.billing_inventory') IS NOT NULL THEN
    ALTER TABLE public.billing_inventory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access to billing_inventory" ON public.billing_inventory;
    DROP POLICY IF EXISTS "Allow authenticated full access to billing_inventory" ON public.billing_inventory;
    DROP POLICY IF EXISTS "Admin full access billing_inventory" ON public.billing_inventory;
    CREATE POLICY "Admin full access billing_inventory"
      ON public.billing_inventory FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 10. Form Responses 1: admin-only SELECT
DO $$
BEGIN
  IF to_regclass('public."Form Responses 1"') IS NOT NULL THEN
    ALTER TABLE public."Form Responses 1" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public."Form Responses 1";
    DROP POLICY IF EXISTS "Admin read Form Responses 1" ON public."Form Responses 1";
    CREATE POLICY "Admin read Form Responses 1"
      ON public."Form Responses 1" FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
