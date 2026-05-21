import { useRef } from 'react';
import SEO from '../components/SEO';
import { useParams, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ChevronRight, Camera, Monitor, Router, Shield, Printer, ArrowRight, MessageCircle, Phone, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, ChevronLeft, ChevronRight as ChevronRightIcon, BookOpen } from 'lucide-react';
import { useBlogPost, useBlogPosts } from '../hooks/useSupabase';
import type { BlogPost } from '../types';

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_POSTS: Record<string, BlogPost & { author: string }> = {
  'tips-choosing-right-cctv-system': {
    id: '1',
    title: 'Top 5 Tips for Choosing the Right CCTV System for Your Business',
    slug: 'tips-choosing-right-cctv-system',
    excerpt: 'Selecting the right CCTV system can be overwhelming. Here are the top 5 factors every business owner in Bangalore should consider before investing in surveillance.',
    content: '## Why CCTV Matters\n\nEvery business needs reliable surveillance. From deterring theft to providing evidence, CCTV is essential for modern security.\n\nChoosing the right system requires careful planning. With so many brands, resolutions, and features available, making the wrong choice can cost you thousands and leave critical gaps in your security coverage.\n\n## Tip 1: Assess Your Coverage Needs\n\nWalk through your property and identify blind spots. Consider entry points, parking areas, cash registers, and any areas where valuable assets are stored. A professional site survey can map optimal camera positions and ensure complete coverage.\n\n## Tip 2: Choose the Right Resolution\n\n4K cameras offer the best detail but require more storage and bandwidth. 1080p is sufficient for most small businesses and provides clear enough footage for identification purposes. 720p may be adequate for general monitoring but lacks detail for evidence.\n\n## Tip 3: Consider Night Vision\n\nIR cameras are essential for 24/7 surveillance. Starlight sensors provide color footage even in very low light conditions, which can be crucial for identifying intruders at night.\n\n## Tip 4: Plan Your Storage\n\nCloud storage offers off-site backup and easy remote access but requires a monthly subscription. NVR systems provide local storage with remote access capabilities. Consider a hybrid approach for maximum reliability.\n\n## Tip 5: Professional Installation\n\nDIY installations often miss critical coverage areas and create cable management issues. Professional installers ensure optimal placement, proper configuration, and clean cable runs that protect your investment.',
    category: 'CCTV Tips',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-12-15',
    sort_order: 1,
    created_at: '2024-12-15',
    updated_at: '2024-12-15',
    author: 'Priya Nair',
  },
  'secure-office-network-cyber-threats': {
    id: '2',
    title: 'How to Secure Your Office Network Against Cyber Threats',
    slug: 'secure-office-network-cyber-threats',
    excerpt: 'With cyber attacks on the rise, protecting your office network is more important than ever. Learn the essential steps to safeguard your business data.',
    content: '## The Growing Threat\n\nCyber attacks targeting small businesses have increased by 300% in the last year. Bangalore, as India\'s tech capital, is particularly vulnerable. Most small businesses assume they are too small to be targeted, but automated attacks don\'t discriminate by company size.\n\n## Step 1: Install a Firewall\n\nA hardware firewall is your first line of defense. Consider Fortinet or SonicWall for enterprise-grade protection at small business prices. Software firewalls on individual machines provide an additional layer.\n\n## Step 2: Keep Software Updated\n\nOutdated software is the most common entry point for attackers. Enable automatic updates across all systems, including operating systems, browsers, and plugins. Create a patch management schedule for critical applications.\n\n## Step 3: Use Strong Passwords\n\nImplement password policies with minimum 12-character complexity requirements. Consider a password manager like Bitwarden or 1Password for your team. Ban password reuse across services.\n\n## Step 4: Enable Multi-Factor Authentication\n\nMFA adds a critical second layer of security to all your accounts. Even if a password is compromised, the attacker cannot access the account without the second factor. Prioritize MFA on email, financial systems, and admin accounts.\n\n## Step 5: Regular Security Audits\n\nSchedule quarterly security audits to identify and address vulnerabilities before they are exploited. Professional audits test your firewall rules, password policies, access controls, and backup procedures.',
    category: 'IT Solutions',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-11-28',
    sort_order: 2,
    created_at: '2024-11-28',
    updated_at: '2024-11-28',
    author: 'Kavitha Rao',
  },
  'complete-guide-office-wifi-setup': {
    id: '3',
    title: 'Complete Guide to Office Wi-Fi: From Setup to Optimization',
    slug: 'complete-guide-office-wifi-setup',
    excerpt: 'A reliable Wi-Fi network is the backbone of modern offices. This guide covers everything from access point placement to troubleshooting slow connections.',
    content: '## Why Wi-Fi Matters\n\nA poorly configured Wi-Fi network costs your business hours of productivity every week. Dropped connections, slow speeds, and dead zones frustrate employees and impact client meetings.\n\n## Planning Your Network\n\nStart with a site survey. Identify the number of users, devices, and bandwidth requirements. Consider future growth when sizing your network. A properly planned network should serve you well for 3-5 years.\n\n## Choosing Access Points\n\nEnterprise APs from Ubiquiti, TP-Link Omada, and Ruckus offer reliable performance for offices. Consumer-grade routers cannot handle the density of an office environment.\n\n## Optimal Placement\n\nPlace APs in open areas, away from walls and metal objects. Use heat mapping tools to verify coverage. Overlapping coverage zones ensure seamless roaming.\n\n## Security Configuration\n\nEnable WPA3 encryption, set up guest networks with captive portals, and configure VLANs for traffic segmentation. Isolate IoT devices on separate networks.\n\n## Ongoing Maintenance\n\nMonitor your network, update firmware, and review performance metrics monthly. Set up alerts for unusual activity or device failures.',
    category: 'Networking',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-11-10',
    sort_order: 3,
    created_at: '2024-11-10',
    updated_at: '2024-11-10',
    author: 'Ramesh Iyer',
  },
  'smart-office-automation-boost-productivity': {
    id: '5',
    title: 'Smart Office Automation: Boost Productivity with Technology',
    slug: 'smart-office-automation-boost-productivity',
    excerpt: 'From automated lighting to smart printers, office automation can transform how your team works. Discover the technologies that make a difference.',
    content: '## The Smart Office Revolution\n\nOffices that embrace automation see up to 30% productivity gains. Automation reduces manual tasks, eliminates common bottlenecks, and creates a more comfortable work environment.\n\n## Automated Lighting\n\nMotion-sensor lights reduce energy costs by up to 40%. Smart scheduling ensures lights are off when not needed. Daylight harvesting adjusts artificial light based on natural light availability.\n\n## Smart Printers\n\nNetworked printers with cloud printing eliminate IT support calls. Track usage and manage supplies automatically. Implement print quotas to reduce waste.\n\n## Meeting Room Management\n\nDigital displays outside rooms show real-time availability. Automatic booking systems prevent scheduling conflicts. Sensors detect occupancy and auto-release booked but unoccupied rooms.\n\n## Energy Management\n\nSmart HVAC systems adjust based on occupancy and weather forecasts. Monitor and reduce energy consumption by up to 25%. Get alerts for unusual consumption patterns.\n\n## Getting Started\n\nStart small with lighting and printing automation. Add more systems as your team adapts. Yantrabyte provides end-to-end assessment, installation, and training for complete office automation.',
    category: 'Office Automation',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-10-05',
    sort_order: 5,
    created_at: '2024-10-05',
    updated_at: '2024-10-05',
    author: 'Priya Nair',
  },
};

// ─── Category Config ────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'CCTV Tips': Camera,
  'IT Solutions': Monitor,
  'Networking': Router,
  'Security Systems': Shield,
  'Office Automation': Printer,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  'CCTV Tips': 'from-[#0EA5E9] to-[#0284C7]',
  'IT Solutions': 'from-[#38BDF8] to-[#0EA5E9]',
  'Networking': 'from-[#0EA5E9] to-[#7DD3FC]',
  'Security Systems': 'from-[#0284C7] to-[#38BDF8]',
  'Office Automation': 'from-[#7DD3FC] to-[#0EA5E9]',
};

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};


const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Helper: Section Wrapper ────────────────────────────────────────────────

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={`relative py-20 md:py-28 ${className}`}
    >
      {children}
    </motion.section>
  );
}

// ─── Markdown-Like Renderer ─────────────────────────────────────────────────

function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        elements.push(
          <p key={`p-${elements.length}`} className="text-[#94A3B8] text-base leading-relaxed mb-4">
            {text}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4">
          {trimmed.replace('## ', '')}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushParagraph();
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl md:text-2xl font-bold text-white mt-6 mb-3">
          {trimmed.replace('### ', '')}
        </h3>
      );
    } else if (trimmed === '') {
      flushParagraph();
    } else {
      currentParagraph.push(trimmed);
    }
  });

  flushParagraph();

  return elements;
}

// ─── 1. Article Hero ────────────────────────────────────────────────────────

function ArticleHero({ post }: { post: BlogPost & { author: string } }) {
  const CategoryIcon = CATEGORY_ICONS[post.category] || BookOpen;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120] pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0EA5E9]/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-2 text-sm text-[#94A3B8] mb-6"
        >
          <Link to="/" className="hover:text-[#0EA5E9] transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/blog" className="hover:text-[#0EA5E9] transition-colors">Blog</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#0EA5E9]">{post.category}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium">
            <CategoryIcon className="w-3.5 h-3.5" />
            {post.category}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto"
        >
          {post.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#94A3B8]"
        >
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#0EA5E9]" />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0EA5E9]" />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#0EA5E9]" />
            5 min read
          </span>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── Featured Image Placeholder ─────────────────────────────────────────────

function FeaturedImage({ post }: { post: BlogPost }) {
  const CategoryIcon = CATEGORY_ICONS[post.category] || BookOpen;
  const gradient = CATEGORY_GRADIENTS[post.category] || 'from-[#0EA5E9] to-[#38BDF8]';

  return (
    <Section className="!py-8 -mt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={scaleIn}
          className={`relative h-64 md:h-96 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden shadow-2xl shadow-[#0EA5E9]/10`}
        >
          <div className="absolute inset-0 bg-black/20" />
          <CategoryIcon className="w-24 h-24 text-white/20 relative z-10" />
          <div className="absolute bottom-4 left-4 z-10">
            <span className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
              {post.category}
            </span>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Article Content ────────────────────────────────────────────────────────

function ArticleContent({ post }: { post: BlogPost & { author: string } }) {
  return (
    <Section id="article" className="!pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="prose prose-invert max-w-none">
                {renderContent(post.content)}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={staggerContainer} className="lg:col-span-1 space-y-6">
            {/* Author Info */}
            <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-5">About the Author</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white font-bold text-xl">
                  {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-semibold">{post.author}</p>
                  <p className="text-[#64748B] text-sm">Yantrabyte Solutions</p>
                </div>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Expert insights from the Yantrabyte team, bringing you the latest in IT solutions, security systems, and technology best practices.
              </p>
            </motion.div>

            {/* Share Buttons */}
            <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#0EA5E9]" />
                Share This Article
              </h3>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-lg bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2]/30 transition-all duration-300">
                  <Facebook className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] flex items-center justify-center hover:bg-[#1DA1F2]/30 transition-all duration-300">
                  <Twitter className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#0A66C2] flex items-center justify-center hover:bg-[#0A66C2]/30 transition-all duration-300">
                  <Linkedin className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/30 transition-all duration-300">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Related Posts */}
            <RelatedPosts currentSlug={post.slug} />
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ─── Related Posts ──────────────────────────────────────────────────────────

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const { posts } = useBlogPosts();
  const allPosts = posts.length > 0 ? posts : Object.values(FALLBACK_POSTS);
  const related = allPosts.filter(p => p.slug !== currentSlug).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-white font-bold text-lg mb-5">Related Posts</h3>
      <div className="space-y-4">
        {related.map((post) => {
          const Icon = CATEGORY_ICONS[post.category] || BookOpen;
          return (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="flex items-start gap-3 group"
            >
              <div className="w-10 h-10 shrink-0 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white text-sm font-medium leading-snug group-hover:text-[#0EA5E9] transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-[#64748B] text-xs mt-1">{post.published_at}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Post Navigation ────────────────────────────────────────────────────────

function PostNavigation({ currentSlug }: { currentSlug: string }) {
  const allPostSlugs = Object.keys(FALLBACK_POSTS);
  const currentIndex = allPostSlugs.indexOf(currentSlug);
  const prevSlug = currentIndex > 0 ? allPostSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < allPostSlugs.length - 1 ? allPostSlugs[currentIndex + 1] : null;

  const prevPost = prevSlug ? FALLBACK_POSTS[prevSlug] : null;
  const nextPost = nextSlug ? FALLBACK_POSTS[nextSlug] : null;

  return (
    <Section className="!py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prevPost ? (
            <Link
              to={`/blog/${prevPost.slug}`}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#0EA5E9]/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-2 text-[#64748B] text-sm mb-2">
                <ChevronLeft className="w-4 h-4" />
                Previous Post
              </div>
              <h4 className="text-white font-medium group-hover:text-[#0EA5E9] transition-colors line-clamp-2">
                {prevPost.title}
              </h4>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link
              to={`/blog/${nextPost.slug}`}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#0EA5E9]/30 transition-all duration-300 group text-right"
            >
              <div className="flex items-center justify-end gap-2 text-[#64748B] text-sm mb-2">
                Next Post
                <ChevronRightIcon className="w-4 h-4" />
              </div>
              <h4 className="text-white font-medium group-hover:text-[#0EA5E9] transition-colors line-clamp-2">
                {nextPost.title}
              </h4>
            </Link>
          ) : (
            <div />
          )}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── CTA Section ────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <Section className="!py-16 md:!py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1120] via-[#111827] to-[#0284C7] p-8 md:p-14 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#0EA5E9]/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#0284C7]/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Ready to Implement These Solutions?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Our experts can help you put these insights into practice with tailored solutions
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-[#0B1120] font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                Get Free Consultation <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/919986742525"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#1EB755] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#25D366]/25"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Us
              </a>
              <a
                href="tel:+919986742525"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
              >
                <Phone className="w-4 h-4" /> Call Now
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Loading State ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="bg-[#0B1120] min-h-screen">
      <div className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse mx-auto mb-6" />
          <div className="h-12 w-96 bg-white/5 rounded-lg animate-pulse mx-auto mb-6" />
          <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="h-64 rounded-2xl bg-white/5 animate-pulse mb-8" />
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-4" />
          <div className="h-32 w-full bg-white/5 rounded-lg animate-pulse mb-4" />
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-4" />
          <div className="h-24 w-full bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Main BlogPost Component ───────────────────────────────────────────────

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = useBlogPost(slug || '');
  const fallbackPost = FALLBACK_POSTS[slug || ''];

  if (loading && !fallbackPost) {
    return <LoadingState />;
  }

  const currentPost = post
    ? { ...post, author: (fallbackPost?.author || 'Yantrabyte Team') }
    : fallbackPost || null;

  if (!currentPost) {
    return (
      <div className="bg-[#0B1120] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-[#64748B] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-[#94A3B8] text-lg mb-8">The blog post you are looking for does not exist.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0EA5E9] text-white font-semibold hover:bg-[#0284C7] transition-all duration-300"
          >
            Back to Blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const postWithAuthor = {
    ...currentPost,
    author: (currentPost as typeof fallbackPost)?.author || 'Yantrabyte Team',
  };

  return (
    <div className="bg-[#0B1120]">
      <SEO 
        title={`${postWithAuthor.title} | Yantrabyte Blog`} 
        description={postWithAuthor.excerpt || "Read our latest blog post about IT and security solutions in Bangalore."}
        type="article"
        imageUrl={postWithAuthor.featured_image}
      />
      <ArticleHero post={postWithAuthor} />
      <FeaturedImage post={currentPost} />
      <ArticleContent post={postWithAuthor} />
      <PostNavigation currentSlug={currentPost.slug} />
      <CTASection />
    </div>
  );
}
