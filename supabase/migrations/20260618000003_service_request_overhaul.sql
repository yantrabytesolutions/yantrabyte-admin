ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS device_make_model text,
ADD COLUMN IF NOT EXISTS device_password text,
ADD COLUMN IF NOT EXISTS service_method text,
ADD COLUMN IF NOT EXISTS pickup_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS preferred_contact text,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pre_approved_budget text;
