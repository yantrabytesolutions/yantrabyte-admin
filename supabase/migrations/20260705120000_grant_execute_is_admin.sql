-- Fix permission denied for is_admin by granting EXECUTE to authenticated and anon
-- The function was made SECURITY INVOKER in a previous migration,
-- so it is safe to grant execute privileges for RLS to evaluate properly.

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
