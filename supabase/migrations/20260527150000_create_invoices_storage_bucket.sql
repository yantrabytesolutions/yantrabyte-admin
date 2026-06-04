-- Create a public storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload invoice PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Allow authenticated users to update/overwrite PDFs
CREATE POLICY "Authenticated users can update invoice PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

-- Allow anyone to read/download invoice PDFs (public access)
CREATE POLICY "Public can read invoice PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');
