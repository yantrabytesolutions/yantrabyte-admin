CREATE TABLE IF NOT EXISTS "Form Responses 1" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE "Form Responses 1" ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid errors on reruns
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "Form Responses 1";

-- Create policy for select
CREATE POLICY "Enable read access for authenticated users" ON "Form Responses 1" FOR SELECT TO authenticated USING (true);
