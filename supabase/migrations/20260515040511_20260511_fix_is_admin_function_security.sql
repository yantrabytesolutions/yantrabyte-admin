/*
  # Fix is_admin() Function Security

  ## Problems
  1. Function has role-mutable search_path, allowing potential path injection attacks
  2. `anon` role can execute the SECURITY DEFINER function via REST API
  3. `authenticated` role can execute the SECURITY DEFINER function via REST API

  ## Solution
  Drop function with CASCADE to remove only admin policies, recreate with:
  - Fixed search_path = 'pg_catalog' (prevents path injection)
  - SECURITY INVOKER (caller's permissions, not admin privileges)
  - REVOKE EXECUTE from anon/authenticated (no direct RPC calls)
  Then recreate only the admin policies (public read policies remain).
*/

-- Drop function and dependent admin policies
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Recreate with secure settings
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'pg_catalog'
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
$$;

-- Revoke dangerous permissions
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres;

-- ─── Recreate admin-only policies ─────────────────────────────────────────────

-- blog_posts
CREATE POLICY "Admin can view blog_posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert blog_posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update blog_posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete blog_posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- careers
CREATE POLICY "Admin can view careers"
  ON public.careers FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert careers"
  ON public.careers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update careers"
  ON public.careers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete careers"
  ON public.careers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- client_logos
CREATE POLICY "Admin can view client_logos"
  ON public.client_logos FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert client_logos"
  ON public.client_logos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update client_logos"
  ON public.client_logos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete client_logos"
  ON public.client_logos FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- contact_submissions
CREATE POLICY "Admin can view contact_submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert contact_submissions"
  ON public.contact_submissions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update contact_submissions"
  ON public.contact_submissions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete contact_submissions"
  ON public.contact_submissions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- faqs
CREATE POLICY "Admin can view faqs"
  ON public.faqs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert faqs"
  ON public.faqs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update faqs"
  ON public.faqs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete faqs"
  ON public.faqs FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- gallery_images
CREATE POLICY "Admin can view gallery_images"
  ON public.gallery_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert gallery_images"
  ON public.gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update gallery_images"
  ON public.gallery_images FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete gallery_images"
  ON public.gallery_images FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- industries
CREATE POLICY "Admin can view industries"
  ON public.industries FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert industries"
  ON public.industries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update industries"
  ON public.industries FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete industries"
  ON public.industries FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- pages
CREATE POLICY "Admin can view pages"
  ON public.pages FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert pages"
  ON public.pages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update pages"
  ON public.pages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete pages"
  ON public.pages FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- products
CREATE POLICY "Admin can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- services
CREATE POLICY "Admin can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete services"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- site_settings
CREATE POLICY "Admin can view site_settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert site_settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update site_settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete site_settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- team_members
CREATE POLICY "Admin can view team_members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert team_members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update team_members"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete team_members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- testimonials
CREATE POLICY "Admin can view testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.is_admin());
