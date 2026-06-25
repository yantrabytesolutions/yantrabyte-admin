-- Trigger to sync service ticket customers to customer master
CREATE OR REPLACE FUNCTION sync_ticket_to_customer()
RETURNS trigger AS $$
BEGIN
  IF NEW.customer_name IS NOT NULL THEN
    INSERT INTO customers (name, phone, email, address, updated_at)
    VALUES (
      NEW.customer_name, 
      NULLIF(TRIM(NEW.customer_phone), ''), 
      NULLIF(TRIM(NEW.customer_email), ''), 
      NULLIF(TRIM(NEW.customer_address), ''), 
      NOW()
    )
    ON CONFLICT (phone) DO UPDATE 
    SET 
      name = EXCLUDED.name,
      email = COALESCE(customers.email, EXCLUDED.email),
      address = COALESCE(customers.address, EXCLUDED.address),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_ticket_to_customer ON service_tickets;
CREATE TRIGGER trg_sync_ticket_to_customer
AFTER INSERT OR UPDATE ON service_tickets
FOR EACH ROW
EXECUTE FUNCTION sync_ticket_to_customer();

-- Backfill missing customers from service tickets
INSERT INTO customers (name, phone, email, address)
SELECT DISTINCT ON (NULLIF(BTRIM(customer_phone), ''))
    customer_name,
    NULLIF(BTRIM(customer_phone), ''),
    NULLIF(BTRIM(customer_email), ''),
    NULLIF(BTRIM(customer_address), '')
FROM service_tickets
WHERE NULLIF(BTRIM(customer_phone), '') IS NOT NULL
ORDER BY NULLIF(BTRIM(customer_phone), ''), created_at DESC
ON CONFLICT (phone) DO NOTHING;
