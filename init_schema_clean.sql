CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- FILE: 20260508113256_001_initial_schema.sql
/*
  # Yantrabyte Solutions - Initial Database Schema

  1. New Tables
    - `pages` - Dynamic page management (title, slug, content, is_published, page_order)
    - `services` - Service listings (title, slug, description, icon, features, is_featured, is_published, sort_order)
    - `products` - Product listings (name, slug, description, category, price, image_url, is_featured, is_published, sort_order)
    - `testimonials` - Customer testimonials (name, company, rating, content, avatar_url, is_published, sort_order)
    - `blog_posts` - Blog articles (title, slug, excerpt, content, category, featured_image, is_published, published_at, sort_order)
    - `team_members` - Team members (name, role, bio, image_url, is_published, sort_order)
    - `careers` - Job listings (title, slug, description, requirements, location, type, is_active, sort_order)
    - `industries` - Industries served (name, slug, description, icon, is_published, sort_order)
    - `faqs` - FAQ entries (question, answer, category, is_published, sort_order)
    - `site_settings` - Global site settings (key, value pairs)
    - `contact_submissions` - Contact form submissions (name, email, phone, service, message, status)
    - `gallery_images` - Before/after gallery (title, before_url, after_url, category, is_published, sort_order)
    - `client_logos` - Client logo carousel (name, logo_url, is_published, sort_order)

  2. Security
    - Enable RLS on all tables
    - Public read access for published content
    - Authenticated admin access for all operations
*/

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content jsonb DEFAULT '{}',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  is_published boolean DEFAULT false,
  page_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text DEFAULT '',
  full_description text DEFAULT '',
  icon text DEFAULT '',
  features jsonb DEFAULT '[]',
  benefits jsonb DEFAULT '[]',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  price text DEFAULT '',
  image_url text DEFAULT '',
  features jsonb DEFAULT '[]',
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text DEFAULT '',
  role text DEFAULT '',
  rating integer DEFAULT 5,
  content text NOT NULL,
  avatar_url text DEFAULT '',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  category text DEFAULT '',
  featured_image text DEFAULT '',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  is_published boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT '',
  bio text DEFAULT '',
  image_url text DEFAULT '',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Careers table
CREATE TABLE IF NOT EXISTS careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  requirements jsonb DEFAULT '[]',
  location text DEFAULT 'Bangalore',
  type text DEFAULT 'Full-time',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Industries table
CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  service text DEFAULT '',
  message text DEFAULT '',
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Gallery images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  before_url text DEFAULT '',
  after_url text DEFAULT '',
  category text DEFAULT '',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Client logos table
CREATE TABLE IF NOT EXISTS client_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text DEFAULT '',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_logos ENABLE ROW LEVEL SECURITY;

-- Public read policies for published content
CREATE POLICY "Public can view published pages" ON pages FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published services" ON services FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published products" ON products FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published team members" ON team_members FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view active careers" ON careers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public can view published industries" ON industries FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published FAQs" ON faqs FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view site settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view published gallery" ON gallery_images FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can view published client logos" ON client_logos FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Public can submit contact forms" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin full access policies (authenticated users)
CREATE POLICY "Admin full access pages" ON pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access testimonials" ON testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access blog_posts" ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access team_members" ON team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access careers" ON careers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access industries" ON industries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access faqs" ON faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access contact_submissions" ON contact_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access gallery_images" ON gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access client_logos" ON client_logos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default site settings
INSERT INTO site_settings (key, value) VALUES
  ('company_name', 'Yantrabyte Solutions'),
  ('tagline', 'Smart Technology. Secure Future.'),
  ('phone', '+91-9876543210'),
  ('email', 'info@yantrabyte.com'),
  ('whatsapp', '919876543210'),
  ('address', 'Bangalore, Karnataka, India'),
  ('google_maps_embed', ''),
  ('facebook', ''),
  ('instagram', ''),
  ('linkedin', ''),
  ('twitter', ''),
  ('youtube', '');

-- Insert default services
INSERT INTO services (title, slug, short_description, icon, features, is_featured, is_published, sort_order) VALUES
  ('CCTV Installation Services', 'cctv-installation-bangalore', 'Professional CCTV camera installation for homes and businesses across Bangalore with HD and 4K options.', 'Camera', '["Site survey & planning","HD/4K camera setup","DVR/NVR configuration","Remote viewing setup","Night vision cameras","Annual maintenance"]', true, true, 1),
  ('IP Camera Installation', 'ip-camera-installation-bangalore', 'Advanced IP camera solutions with remote monitoring, cloud storage, and AI-powered analytics.', 'Wifi', '["IP camera deployment","Cloud storage setup","AI motion detection","Mobile app monitoring","Network configuration","24/7 support"]', true, true, 2),
  ('Laptop Repair Services', 'laptop-repair-bangalore', 'Expert laptop repair for all brands — screen replacement, motherboard repair, data recovery, and more.', 'Laptop', '["Screen replacement","Motherboard repair","Battery replacement","Data recovery","OS installation","Keyboard repair"]', true, true, 3),
  ('Desktop Repair Services', 'desktop-repair-bangalore', 'Complete desktop computer repair including hardware upgrades, virus removal, and performance optimization.', 'Monitor', '["Hardware repair","RAM & SSD upgrade","Virus removal","Power supply fix","Software troubleshooting","Performance optimization"]', true, true, 4),
  ('Printer Repair & Maintenance', 'printer-repair-bangalore', 'Printer repair and maintenance for HP, Canon, Epson, Brother, and all major brands.', 'Printer', '["Cartridge replacement","Paper jam fix","Network printer setup","Driver installation","Toner refill","Preventive maintenance"]', true, true, 5),
  ('WiFi & Networking Solutions', 'networking-solutions-bangalore', 'Complete WiFi and networking solutions for offices, homes, and commercial spaces in Bangalore.', 'Router', '["WiFi network design","Enterprise routing","Network cabling","VPN setup","Bandwidth management","Network security"]', true, true, 6),
  ('Biometric Attendance Systems', 'biometric-installation-bangalore', 'Fingerprint, face recognition, and RFID-based attendance and access control systems.', 'Fingerprint', '["Fingerprint scanners","Face recognition","RFID cards","Attendance software","Payroll integration","Cloud reporting"]', true, true, 7),
  ('Firewall & Network Security', 'firewall-network-security-bangalore', 'Enterprise-grade firewall installation, network security audits, and cyber threat protection.', 'Shield', '["Firewall installation","Network security audit","Intrusion detection","VPN configuration","Content filtering","Threat monitoring"]', true, true, 8),
  ('Office IT Setup', 'office-it-setup-bangalore', 'Complete office IT infrastructure setup including computers, networking, printers, and software.', 'Building', '["IT infrastructure planning","Computer setup","Network installation","Printer configuration","Software deployment","Staff training"]', false, true, 9),
  ('AMC Support Services', 'amc-services-bangalore', 'Annual Maintenance Contracts for IT equipment, CCTV systems, and office technology.', 'FileCheck', '["Regular maintenance","Priority support","Spare parts included","Performance reports","Emergency response","Cost-effective plans"]', false, true, 10),
  ('Server Installation', 'server-installation-bangalore', 'Server setup, configuration, and maintenance for businesses of all sizes.', 'Server', '["Server hardware setup","OS installation","RAID configuration","Backup solutions","Virtualization","Monitoring setup"]', false, true, 11),
  ('Remote IT Support', 'remote-it-support-bangalore', 'Instant remote IT support for troubleshooting, software issues, and system maintenance.', 'Headphones', '["Remote troubleshooting","Software support","System monitoring","Quick response time","Secure remote access","Ticket management"]', false, true, 12),
  ('Home Security Solutions', 'home-security-bangalore', 'Complete home security packages with CCTV, video door phones, and smart locks.', 'Home', '["CCTV for homes","Video door phones","Smart locks","Motion sensors","Mobile alerts","24/7 monitoring"]', false, true, 13),
  ('Smart Office Automation', 'smart-office-automation-bangalore', 'Automate your office with smart lighting, climate control, and IoT solutions.', 'Zap', '["Smart lighting","Climate control","IoT sensors","Energy management","Voice control","Central dashboard"]', false, true, 14),
  ('Access Control Systems', 'access-control-bangalore', 'Card-based, biometric, and mobile access control systems for offices and buildings.', 'KeyRound', '["Card access systems","Biometric access","Mobile credentials","Visitor management","Time zone restrictions","Audit trails"]', false, true, 15);

-- Insert default industries
INSERT INTO industries (name, slug, description, icon, is_published, sort_order) VALUES
  ('Corporate Offices', 'corporate-offices', 'Complete IT infrastructure and security solutions for modern corporate offices.', 'Building', true, 1),
  ('Retail Stores', 'retail-stores', 'CCTV surveillance, POS systems, and networking for retail businesses.', 'ShoppingCart', true, 2),
  ('Warehouses', 'warehouses', 'Security cameras, access control, and network infrastructure for warehouses.', 'Warehouse', true, 3),
  ('Apartments & Residences', 'apartments-residences', 'Home security, WiFi, and IT support for residential complexes.', 'Home', true, 4),
  ('Schools & Colleges', 'schools-colleges', 'Campus security, IT labs, and networking for educational institutions.', 'GraduationCap', true, 5),
  ('Hospitals & Clinics', 'hospitals-clinics', 'Healthcare IT, security systems, and biometric attendance for medical facilities.', 'HeartPulse', true, 6),
  ('Factories & Manufacturing', 'factories-manufacturing', 'Industrial security, networking, and IT support for manufacturing units.', 'Factory', true, 7),
  ('Homes', 'homes', 'Smart home security, WiFi setup, and computer repair for residences.', 'House', true, 8);

-- Insert default testimonials
INSERT INTO testimonials (name, company, role, rating, content, is_published, sort_order) VALUES
  ('Rajesh Kumar', 'TechCorp Solutions', 'Operations Manager', 5, 'Yantrabyte installed CCTV across our 3 office floors. The quality is outstanding and their team was extremely professional. Remote viewing works flawlessly!', true, 1),
  ('Priya Sharma', 'RetailMax India', 'Owner', 5, 'Best laptop repair service in Bangalore! They fixed my MacBook the same day at a very reasonable price. Highly recommended.', true, 2),
  ('Mohammed Irfan', 'Green Valley Apartments', 'Secretary', 5, 'Complete WiFi and CCTV setup for our 200-apartment complex. Excellent work and great after-sales support.', true, 3),
  ('Dr. Anitha Rao', 'MediCare Clinic', 'Director', 5, 'Their biometric attendance system integrated perfectly with our payroll. The team understood our requirements and delivered beyond expectations.', true, 4),
  ('Vikram Patel', 'Patel Industries', 'MD', 5, 'We have been using their AMC service for 2 years now. Response time is excellent and they keep all our IT systems running smoothly.', true, 5);

-- Insert default FAQs
INSERT INTO faqs (question, answer, category, is_published, sort_order) VALUES
  ('What areas in Bangalore do you serve?', 'We serve all areas in Bangalore including Whitefield, Electronic City, Koramangala, Indiranagar, HSR Layout, Marathahalli, BTM Layout, Jayanagar, and more.', 'general', true, 1),
  ('Do you provide same-day service?', 'Yes! We offer same-day service for most repair and installation requests. Emergency support is available 24/7.', 'general', true, 2),
  ('What brands of CCTV cameras do you install?', 'We install all major brands including Hikvision, Dahua, CP Plus, Godrej, and Samsung. We recommend the best option based on your requirements and budget.', 'cctv', true, 3),
  ('How much does CCTV installation cost?', 'CCTV installation costs vary based on the number of cameras, type (analog/IP), and features required. Contact us for a free site survey and customized quote.', 'cctv', true, 4),
  ('Do you provide warranty on repairs?', 'Yes, we provide a 90-day warranty on all repair services and 1-year warranty on new installations.', 'repair', true, 5),
  ('What is included in AMC support?', 'Our AMC includes regular maintenance visits, priority support, spare parts (select plans), performance reports, and emergency response within 4 hours.', 'amc', true, 6),
  ('Can I monitor CCTV from my phone?', 'Absolutely! All our CCTV installations come with mobile app setup so you can monitor your property from anywhere in the world.', 'cctv', true, 7),
  ('Do you offer free consultations?', 'Yes, we offer free on-site consultations for CCTV, networking, and office IT setup projects. Call us to schedule yours.', 'general', true, 8);

-- Insert default blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, category, is_published, published_at, sort_order) VALUES
  ('Best CCTV Camera for Office in Bangalore 2025', 'best-cctv-camera-office-bangalore', 'A comprehensive guide to choosing the right CCTV cameras for your Bangalore office, covering features, pricing, and installation tips.', '## Why Your Bangalore Office Needs CCTV\n\nIn today''s business environment, security is not optional — it''s essential. CCTV cameras protect your assets, monitor employee activity, and provide crucial evidence if incidents occur.\n\n## Top CCTV Cameras for Offices\n\n### 1. Hikvision DS-2CE5AD0T\nBest for: Budget-conscious offices\n- 2MP resolution\n- Night vision up to 40m\n- Weather-resistant\n- Price: Starting ₹2,500/camera\n\n### 2. Dahua IPC-HDW2431T\nBest for: High-quality surveillance\n- 4MP resolution\n- Smart motion detection\n- PoE support\n- Price: Starting ₹4,500/camera\n\n### 3. CP Plus CP-URC-DC24PL3\nBest for: Indian conditions\n- 2.4MP resolution\n- Wide dynamic range\n- Works in extreme heat\n- Price: Starting ₹2,200/camera\n\n## Installation Tips\n\n1. Place cameras at all entry/exit points\n2. Cover parking areas\n3. Install at reception and common areas\n4. Ensure proper lighting for night vision\n5. Use NVR for better recording quality\n\n## Why Choose Yantrabyte\n\nWe provide professional CCTV installation across Bangalore with:\n- Free site survey\n- Same-day installation\n- 1-year warranty\n- 24/7 support\n\nContact us today for a free consultation!', 'CCTV Tips', true, now(), 1),
  ('Laptop Running Slow? Here''s the Fix', 'laptop-running-slow-fix', 'Is your laptop crawling? Learn the most common causes and proven fixes to speed up your laptop without spending a fortune.', '## Common Reasons Your Laptop is Slow\n\n### 1. Too Many Startup Programs\nMany programs start automatically when you boot your laptop. Disable unnecessary startup items to speed up boot time.\n\n### 2. Low RAM\nIf your laptop has less than 8GB RAM, it may struggle with modern applications. Upgrading RAM is one of the cheapest and most effective upgrades.\n\n### 3. Hard Drive vs SSD\nIf your laptop still uses a mechanical hard drive, upgrading to an SSD can make it 5-10x faster.\n\n### 4. Malware & Viruses\nMalware runs in the background, consuming resources. Run a full system scan with a reliable antivirus.\n\n### 5. Overheating\nDust buildup causes overheating, which slows down your CPU. Regular cleaning can restore performance.\n\n## Quick Fixes You Can Try\n\n1. Uninstall unused programs\n2. Clear temporary files\n3. Disable visual effects\n4. Update drivers\n5. Run disk cleanup\n\n## When to Call a Professional\n\nIf your laptop is still slow after trying these fixes, it may have:\n- Failing hard drive\n- Motherboard issues\n- Corrupted OS\n- Hardware damage\n\nAt Yantrabyte Solutions, we diagnose and fix laptop issues the same day. Call us for a free diagnosis!', 'IT Solutions', true, now(), 2),
  ('Top Office Networking Solutions in Bangalore', 'top-office-networking-bangalore', 'Discover the best networking solutions for Bangalore offices, from WiFi 6 to enterprise-grade setups.', '## Why Office Networking Matters\n\nA reliable network is the backbone of modern business operations. Slow or unreliable WiFi leads to lost productivity and frustrated employees.\n\n## Top Networking Solutions\n\n### 1. Enterprise WiFi (WiFi 6)\n- Faster speeds\n- More device support\n- Better range\n- Reduced interference\n\n### 2. Mesh Network Systems\n- Seamless coverage\n- No dead zones\n- Easy expansion\n- Central management\n\n### 3. Structured Cabling\n- Cat6/Cat6a cables\n- Future-proof infrastructure\n- Reliable connections\n- Professional installation\n\n### 4. VPN & Remote Access\n- Secure remote work\n- Encrypted connections\n- Multi-site connectivity\n- Cloud VPN options\n\n## Choosing the Right Solution\n\nConsider these factors:\n1. Number of users\n2. Building size and layout\n3. Bandwidth requirements\n4. Budget\n5. Future growth plans\n\nYantrabyte Solutions provides end-to-end networking services for Bangalore offices. Get a free network assessment today!', 'Networking', true, now(), 3),
  ('DVR vs NVR Explained: Which is Right for You?', 'dvr-vs-nvr-explained', 'Understanding the difference between DVR and NVR systems is crucial for choosing the right CCTV setup for your property.', '## What is a DVR?\n\nDVR (Digital Video Recorder) works with analog cameras. It converts analog signals to digital for recording and storage.\n\n**Pros:**\n- Lower cost\n- Simple setup\n- Works with existing coaxial cables\n\n**Cons:**\n- Lower image quality\n- Limited smart features\n- Single cable per camera\n\n## What is an NVR?\n\nNVR (Network Video Recorder) works with IP cameras. It records digital video sent over a network.\n\n**Pros:**\n- Higher resolution (up to 4K)\n- Smart features (motion detection, analytics)\n- PoE — power + data over one cable\n- Remote access\n- Scalable\n\n**Cons:**\n- Higher cost\n- Requires network infrastructure\n- More bandwidth usage\n\n## Which Should You Choose?\n\n**Choose DVR if:**\n- Budget is tight\n- Small setup (4-8 cameras)\n- Basic monitoring is enough\n\n**Choose NVR if:**\n- You need high-quality footage\n- Smart features are important\n- You plan to expand\n- Remote monitoring is needed\n\nAt Yantrabyte, we help you choose the best system for your needs. Contact us for a free consultation!', 'Security Systems', true, now(), 4),
  ('How to Improve Business Security in Bangalore', 'improve-business-security-bangalore', 'Essential security measures every Bangalore business should implement to protect assets, data, and people.', '## Business Security Challenges in Bangalore\n\nBangalore''s rapid growth brings unique security challenges for businesses.\n\n## Essential Security Measures\n\n### 1. CCTV Surveillance\n- Cover all entry points\n- Use high-resolution cameras\n- Enable remote monitoring\n- Keep 30+ days of recordings\n\n### 2. Access Control\n- Restrict unauthorized entry\n- Track employee movement\n- Visitor management\n- Time-based access\n\n### 3. Network Security\n- Enterprise firewall\n- Regular security audits\n- Employee training\n- Data encryption\n\n### 4. Physical Security\n- Smart locks\n- Motion sensors\n- Alarm systems\n- Security signage\n\n### 5. Cyber Security\n- Antivirus & anti-malware\n- Email security\n- Backup systems\n- Incident response plan\n\n## Cost of Poor Security\n\n- Asset theft\n- Data breaches\n- Legal liability\n- Insurance premium increases\n- Reputation damage\n\nYantrabyte Solutions provides comprehensive security assessments for Bangalore businesses. Schedule yours today!', 'Security Systems', true, now(), 5);

-- Insert default careers
INSERT INTO careers (title, slug, description, requirements, location, type, is_active, sort_order) VALUES
  ('CCTV Installation Technician', 'cctv-installation-technician', 'We are looking for experienced CCTV installation technicians to join our growing team in Bangalore.', '["2+ years CCTV installation experience","Knowledge of DVR/NVR systems","Driving license preferred","Good communication skills","Own vehicle preferred"]', 'Bangalore', 'Full-time', true, 1),
  ('IT Support Engineer', 'it-support-engineer', 'Join our IT support team to help businesses across Bangalore with their technology needs.', '["1+ year IT support experience","Knowledge of Windows/Mac OS","Networking basics","Good problem-solving skills","Customer-friendly attitude"]', 'Bangalore', 'Full-time', true, 2),
  ('Network Engineer', 'network-engineer', 'We need a skilled network engineer to design and implement networking solutions for our clients.', '["3+ years networking experience","CCNA certification preferred","Knowledge of enterprise WiFi","VPN and firewall experience","Strong troubleshooting skills"]', 'Bangalore', 'Full-time', true, 3);


-- FILE: 20260511072034_20260511_fix_rls_policies.sql
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


-- FILE: 20260515040511_20260511_fix_is_admin_function_security.sql
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


-- FILE: 20260515120000_add_service_tickets.sql
-- Create service_tickets table
CREATE TABLE IF NOT EXISTS public.service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  device_type text,
  issue_description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admins) to have full access
CREATE POLICY "Admins have full access to service_tickets"
  ON public.service_tickets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow public users to submit service tickets
CREATE POLICY "Public can create service tickets" 
  ON public.service_tickets 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);


-- FILE: 20260516120000_add_invoices_table.sql
-- Create invoices table for the built-in Billing Software
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT UNIQUE NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'Invoice',
    date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    round_off NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    advance_paid NUMERIC NOT NULL DEFAULT 0,
    balance_due NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for admins" 
    ON public.invoices FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access for admins" 
    ON public.invoices FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for admins" 
    ON public.invoices FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete access for admins" 
    ON public.invoices FOR DELETE 
    USING (auth.role() = 'authenticated');


-- FILE: 20260516130000_form_responses_1.sql
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


-- FILE: 20260516140000_insert_form_responses.sql
INSERT INTO "Form Responses 1" (full_name, phone, email, address) VALUES 
('Manjesh', '8660701899', 'tmanjesh. 7712@gmail.com', 'Chamundeswari layout'),
('Dr Sreelekshmi ', '9207199609', 'vidyaranyapuraclinicreception@gmail.com', 'Dr Sreelekshmi Kerala Ayurveda Centre Vidyaranyapura '),
('Girish Malige', '9886253098', 'girimalige@yahoo.co.in', '14, SaNa, Sri Saraswathi Nivasa, 2nd Main, Sri Dhanalakshmi Layout, Virupakshapura '),
('Mallarswami nonvinkere', '9731846846', 'mailar@gmail.com', 'Defence layout vidyaranyapura '),
('Sagar', '9591451419', 'sagar.venkatesh1989@gmail.com', 'Vidyaranyapura, bangalore '),
('Girish', '9945408547', 'giri1119@gmail.com', 'Babu house road, 5th cross,Raghavendra colony, Vidyaranyapura'),
('Pawan ', '9901733369', 'YantraByte.solutions@gmail.com', 'Vidyaranyapura'),
('Iibs', '9901733369', 'rameshas2105@gmail.com', 'Vidyaranyapura '),
('Akhil Rajput ', '8548035733', 'Andajay200@gmail.com', 'Flat no 201, Durga Nivas,kanshiram nagar 560097, '),
('yashwant', '9901733369', 'rameshas2105@gmail.com', 'ms playa'),
('test', '99999999999', 'rameshas2105@gmail.com', 'ms playa'),
('test ', '9999999999', 'rameshas2105@gmail.com', 'vr pura'),
('test', '9999999999', 'sysadmin@iibsonline.com', 'yelekhanka'),
('Ramesh ', '9901733369', 'rameshas@anantatech.com', 'Yelekhan'),
('Swarna', '9632595904', 'rameshas2105@gmail.com', 'Vidyaranyapura '),
('RAmesh', '9901733369', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('test', '9901733369', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('ramesh', '9901733369', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('test', 'test', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('Test', 'Test', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('RAMESH', '9901733369', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('Ramesh', '9901733369', 'rameshas2105@gmail.com', '47A 1st, Cross ,SAINAGAR 2ND STAGE, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097'),
('Guru Raghavendran S ', '9535633007', 'sguragha@gmail.com', 'Vidyaranyapura '),
('Kanishk', '7019863826', 'kanishk.cse@skit.org.in', '001 viswas paradigam Ms palya vidyranayapura bangalore'),
('Sagar', '9591451419', 'Sagar.venkatesh1989@gmail.com', 'Vidyaranyapura Bangalore '),
('YantraByte Solutions ', '9901733369', 'yantrabyte.solutions@gmail.com', 'Vidyaranyapura '),
('Riyaz', '8147773763', 'riyaz.shaikk@gmail.com', 'Singapura,M.s.palya, Bangalore '),
('N Prashanth ', '9164154505', 'prashanthraju2004@gmail.com', '#417/7 , G2 , 4th cross , A sector , Yelahanka - Newtown'),
('Aarmour Surveillance', '9902583833', 'info@aarmour.asia', 'Sheshadripuram'),
('Aarmour Surveillance ', '9902583833', 'info@aarmour.asia', 'Sheshadripuram'),
('Aarmour Surveillance ', '9902583833', 'info@aarmour.asia', 'Sheshadripuram') ON CONFLICT DO NOTHING;

-- FILE: 20260516150000_migrate_service_tickets.sql
INSERT INTO "service_tickets" (ticket_number, customer_name, customer_phone, customer_email, device_type, issue_description, status) VALUES 
('YBS-OLD-40006', 'Manjesh', '8660701899', 'tmanjesh. 7712@gmail.com', 'Hp', 'Software installation', 'in-progress'),
('YBS-OLD-92677', 'Dr Sreelekshmi ', '9207199609', 'vidyaranyapuraclinicreception@gmail.com', 'CPU ', 'Not working - ', 'open'),
('YBS-OLD-21878', 'Girish Malige', '9886253098', 'girimalige@yahoo.co.in', 'HP Laptop ', 'Not booting ', 'open'),
('YBS-OLD-80302', 'Mallarswami nonvinkere', '9731846846', 'mailar@gmail.com', 'Lenovo ideapad laptop', 'Keyboard ', 'open'),
('YBS-OLD-85705', 'Sagar', '9591451419', 'sagar.venkatesh1989@gmail.com', 'Dell', 'Not working', 'open'),
('YBS-OLD-34063', 'Girish', '9945408547', 'giri1119@gmail.com', 'CPU', 'CPU Not starting. Some burning smell detected after UPS switched on.', 'open'),
('YBS-OLD-79312', 'Pawan ', '9901733369', 'YantraByte.solutions@gmail.com', 'Dell laptop with charger ', 'No display', 'open'),
('YBS-OLD-36258', 'Iibs', '9901733369', 'rameshas2105@gmail.com', 'Dell laptop ', 'Bios password need to be removed', 'open'),
('YBS-OLD-28847', 'Akhil Rajput ', '8548035733', 'Andajay200@gmail.com', 'Printer', 'Printer head issue, and service', 'open'),
('YBS-OLD-89123', 'yashwant', '9901733369', 'rameshas2105@gmail.com', 'Monitor', 'not working', 'open'),
('YBS-2026-2027-001', 'test', '99999999999', 'rameshas2105@gmail.com', 'monitor', 'not working', 'open'),
('YBS-2026-2027-002', 'test ', '9999999999', 'rameshas2105@gmail.com', 'printer', 'not working', 'open'),
('YBS-2026-2027-003', 'test', '9999999999', 'sysadmin@iibsonline.com', 'printer', 'not working', 'open'),
('YBS-OLD-97026', 'Ramesh ', '9901733369', 'rameshas@anantatech.com', 'OPEN', 'https://drive.google.com/file/d/1oZJW8wlIvSuF5e7iT4yX5tJ37u2RB5nB/view?usp=drivesdk', 'open'),
('YBS-OLD-76973', 'Swarna', '9632595904', 'rameshas2105@gmail.com', 'OPEN', 'https://drive.google.com/file/d/1iKiv0B2Xhy45vQqa6ibW2j5dAuQOtJxo/view?usp=drivesdk', 'open'),
('YBS-2027', 'RAmesh', '9901733369', 'rameshas2105@gmail.com', 'Laptop', 'NOt booting', 'open'),
('YBS-120', 'test', '9901733369', 'rameshas2105@gmail.com', 'Laptop', 'not booting', 'open'),
('YBS-120', 'ramesh', '9901733369', 'rameshas2105@gmail.com', 'Laptop', 'not working', 'open'),
('YBS-121', 'test', 'test', 'rameshas2105@gmail.com', 'CPU', 'not working', 'open'),
('YBS-122', 'Test', 'Test', 'rameshas2105@gmail.com', 'Desktop', 'not working', 'open'),
('YBS-123', 'RAMESH', '9901733369', 'rameshas2105@gmail.com', 'Desktop', ' not booting', 'closed'),
('YBS-OLD-11092', 'Ramesh', '9901733369', 'rameshas2105@gmail.com', 'Printer', 'Not printing', 'open'),
('YBS-OLD-98412', 'Guru Raghavendran S ', '9535633007', 'sguragha@gmail.com', 'HP', 'Windows not working ', 'open'),
('YBS-OLD-17922', 'Kanishk', '7019863826', 'kanishk.cse@skit.org.in', 'Cpu', 'Can''t boot the system ', 'open'),
('YBS-OLD-89834', 'Sagar', '9591451419', 'Sagar.venkatesh1989@gmail.com', 'Lenovo laptop', 'System slow, bottom panel not showing', 'open'),
('YBS-OLD-53397', 'YantraByte Solutions ', '9901733369', 'yantrabyte.solutions@gmail.com', 'Printer', 'Not working ', 'open'),
('YBS-OLD-62846', 'Riyaz', '8147773763', 'riyaz.shaikk@gmail.com', 'Lenovo laptop ', 'Sudden shutdown ', 'open'),
('YBS-OLD-92851', 'N Prashanth ', '9164154505', 'prashanthraju2004@gmail.com', 'Dell Laptop ', 'Laptop for service  ', 'open'),
('YBS-TKT-140526-035', 'Aarmour Surveillance', '9902583833', 'info@aarmour.asia', 'Hp Laptop', 'Laptop charging pin damaged and laptop hanging issue', 'in-progress'),
('YBS-TKT-140526-033', 'Aarmour Surveillance ', '9902583833', 'info@aarmour.asia', 'DELL laptop ', 'Not powering on ', 'in-progress'),
('YBS-TKT-140526-034', 'Aarmour Surveillance ', '9902583833', 'info@aarmour.asia', 'Hp Laptop', 'Laptop charging pin damaged and laptop hanging issue', 'in-progress') ON CONFLICT (ticket_number) DO NOTHING;


-- ADMIN USER CREATION
DO $$
DECLARE
    uid uuid;
BEGIN
    SELECT id INTO uid FROM auth.users WHERE email = 'admin@yantrabyte.com';
    
    IF uid IS NULL THEN
        uid := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'admin@yantrabyte.com', crypt('Yantra$2025', gen_salt('bf')), now(), now(), now(), '{"provider": "email", "providers": ["email"], "is_admin": true}', '{}', now(), now(), '', '', '', ''
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = uid) THEN
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), uid, format('{"sub":"%s","email":"%s"}', uid::text, 'admin@yantrabyte.com')::jsonb, 'email', uid::text, now(), now(), now()
        );
    END IF;
END $$;
