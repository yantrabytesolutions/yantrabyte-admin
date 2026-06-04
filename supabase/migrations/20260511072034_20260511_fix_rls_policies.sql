/*
  # Fix RLS Security Policies

  ## Problem
  Multiple tables had "Admin full access" policies using `USING (true)` and
  `WITH CHECK (true)`, which effectively bypasses row-level security for ALL
  authenticated users — not just admins. Any authenticated user could perform
  any operation (SELECT, INSERT, UPDATE, DELETE) on these tables.

  Additionally:
  - `contact_submissions` had a public INSERT policy with `WITH CHECK (true)`,
    allowing anyone to insert arbitrary data without validation.
  - `site_settings` had a public SELECT policy with `USING (true)`, exposing
    all settings (potentially including sensitive config) to everyone.

  ## Changes

  ### 1. Admin Role Mechanism
  - Set `is_admin = true` in `app_metadata` for the existing admin user
    (yantrabyte.solutions@gmail.com). This is stored in `raw_app_meta_data`
    which cannot be modified by the user.
  - Created helper function `public.is_admin()` that checks
    `auth.jwt() -> 'app_metadata' ->> 'is_admin'` for the current session.

  ### 2. Replaced Insecure "Admin full access" Policies
  For each of these 12 tables, the `FOR ALL USING (true) WITH CHECK (true)`
  policy was dropped and replaced with 4 separate restrictive policies:
  - SELECT: only for admin users (via `is_admin()`)
  - INSERT: only for admin users
  - UPDATE: only for admin users
  - DELETE: only for admin users

  Tables affected:
  - blog_posts, careers, client_logos, contact_submissions, faqs,
    gallery_images, industries, pages, products, services,
    site_settings, team_members, testimonials

  ### 3. Fixed contact_submissions Public INSERT Policy
  - Dropped: `Public can submit contact forms` (WITH CHECK = true)
  - Created: `Public can submit contact forms` with WITH CHECK requiring
    non-null `name`, `email`, and `message` fields — prevents empty/spam rows.

  ### 4. Fixed site_settings Public SELECT Policy
  - Dropped: `Public can view site settings` (USING = true)
  - Created: `Public can view site settings` restricted to non-sensitive
    keys only (keys that do NOT contain 'secret', 'key', 'password',
    'token', 'api_key', 'private', or 'credential').

  ### 5. Security Notes
  - All admin policies use `is_admin()` which reads from `app_metadata`
    (server-controlled, user cannot modify).
  - Public read policies for published content remain unchanged and are
    already properly restrictive (checking `is_published = true`, etc.).
  - RLS remains enabled on all tables.
*/

-- ─── 1. Set admin flag in app_metadata ────────────────────────────────────────

UPDATE auth.users
SET raw_app_meta_data =
  raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'yantrabyte.solutions@gmail.com';

-- ─── 2. Create is_admin() helper function ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
$$;

-- ─── 3. Drop all insecure "Admin full access" policies ───────────────────────

DROP POLICY IF EXISTS "Admin full access blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin full access careers" ON public.careers;
DROP POLICY IF EXISTS "Admin full access client_logos" ON public.client_logos;
DROP POLICY IF EXISTS "Admin full access contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin full access faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admin full access gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admin full access industries" ON public.industries;
DROP POLICY IF EXISTS "Admin full access pages" ON public.pages;
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
DROP POLICY IF EXISTS "Admin full access services" ON public.services;
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access team_members" ON public.team_members;
DROP POLICY IF EXISTS "Admin full access testimonials" ON public.testimonials;

-- ─── 4. Drop insecure public policies ────────────────────────────────────────

DROP POLICY IF EXISTS "Public can submit contact forms" ON public.contact_submissions;
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;

-- ─── 5. Create secure admin policies (per table, per operation) ─────────────

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

-- ─── 6. Create secure public policies ────────────────────────────────────────

-- contact_submissions: public can insert with required field validation
CREATE POLICY "Public can submit contact forms"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND name <> ''
    AND email IS NOT NULL AND email <> ''
    AND message IS NOT NULL AND message <> ''
  );

-- site_settings: public can only view non-sensitive settings
CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key NOT ILIKE '%secret%'
    AND key NOT ILIKE '%key%'
    AND key NOT ILIKE '%password%'
    AND key NOT ILIKE '%token%'
    AND key NOT ILIKE '%api_key%'
    AND key NOT ILIKE '%private%'
    AND key NOT ILIKE '%credential%'
  );
