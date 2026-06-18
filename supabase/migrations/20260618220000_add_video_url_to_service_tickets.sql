-- Add video_url column to service_tickets for customer video uploads
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS attachment_url text;
