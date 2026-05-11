import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight,
  Camera,
  Monitor,
  Router,
  Shield,
  Printer,
  ArrowRight,
  MessageCircle,
  Phone,
  Calendar,
  Tag,
  Clock,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { useBlogPosts } from '../hooks/useSupabase';
import type { BlogPost } from '../types';

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Top 5 Tips for Choosing the Right CCTV System for Your Business',
    slug: 'tips-choosing-right-cctv-system',
    excerpt: 'Selecting the right CCTV system can be overwhelming. Here are the top 5 factors every business owner in Bangalore should consider before investing in surveillance.',
    content: '## Why CCTV Matters\n\nEvery business needs reliable surveillance. From deterring theft to providing evidence, CCTV is essential.\n\n## Tip 1: Assess Your Coverage Needs\n\nWalk through your property and identify blind spots. Consider entry points, parking areas, and cash registers.\n\n## Tip 2: Choose the Right Resolution\n\n4K cameras offer the best detail but require more storage. 1080p is sufficient for most small businesses.\n\n## Tip 3: Consider Night Vision\n\nIR cameras are essential for 24/7 surveillance. Starlight sensors provide color footage even in low light.\n\n## Tip 4: Plan Your Storage\n\nCloud storage offers off-site backup. NVR systems provide local storage with remote access.\n\n## Tip 5: Professional Installation\n\nDIY installations often miss critical coverage. Professional installers ensure optimal placement and configuration.',
    category: 'CCTV Tips',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-12-15',
    sort_order: 1,
    created_at: '2024-12-15',
    updated_at: '2024-12-15',
  },
  {
    id: '2',
    title: 'How to Secure Your Office Network Against Cyber Threats',
    slug: 'secure-office-network-cyber-threats',
    excerpt: 'With cyber attacks on the rise, protecting your office network is more important than ever. Learn the essential steps to safeguard your business data.',
    content: '## The Growing Threat\n\nCyber attacks targeting small businesses have increased by 300% in the last year.\n\n## Step 1: Install a Firewall\n\nA hardware firewall is your first line of defense. Consider Fortinet or SonicWall for enterprise-grade protection.\n\n## Step 2: Keep Software Updated\n\nOutdated software is the most common entry point for attackers. Enable automatic updates across all systems.\n\n## Step 3: Use Strong Passwords\n\nImplement password policies with minimum complexity requirements. Consider a password manager for your team.\n\n## Step 4: Enable Multi-Factor Authentication\n\nMFA adds a critical second layer of security to all your accounts.\n\n## Step 5: Regular Security Audits\n\nSchedule quarterly security audits to identify and address vulnerabilities before they are exploited.',
    category: 'IT Solutions',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-11-28',
    sort_order: 2,
    created_at: '2024-11-28',
    updated_at: '2024-11-28',
  },
  {
    id: '3',
    title: 'Complete Guide to Office Wi-Fi: From Setup to Optimization',
    slug: 'complete-guide-office-wifi-setup',
    excerpt: 'A reliable Wi-Fi network is the backbone of modern offices. This guide covers everything from access point placement to troubleshooting slow connections.',
    content: '## Why Wi-Fi Matters\n\nA poorly configured Wi-Fi network costs your business hours of productivity every week.\n\n## Planning Your Network\n\nStart with a site survey. Identify the number of users, devices, and bandwidth requirements.\n\n## Choosing Access Points\n\nEnterprise APs from Ubiquiti, TP-Link Omada, and Ruckus offer reliable performance for offices.\n\n## Optimal Placement\n\nPlace APs in open areas, away from walls and metal objects. Use heat mapping tools to verify coverage.\n\n## Security Configuration\n\nEnable WPA3 encryption, set up guest networks, and configure VLANs for traffic segmentation.\n\n## Ongoing Maintenance\n\nMonitor your network, update firmware, and review performance metrics monthly.',
    category: 'Networking',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-11-10',
    sort_order: 3,
    created_at: '2024-11-10',
    updated_at: '2024-11-10',
  },
  {
    id: '5',
    title: 'Smart Office Automation: Boost Productivity with Technology',
    slug: 'smart-office-automation-boost-productivity',
    excerpt: 'From automated lighting to smart printers, office automation can transform how your team works. Discover the technologies that make a difference.',
    content: '## The Smart Office Revolution\n\nOffices that embrace automation see up to 30% productivity gains.\n\n## Automated Lighting\n\nMotion-sensor lights reduce energy costs. Smart scheduling ensures lights are off when not needed.\n\n## Smart Printers\n\nNetworked printers with cloud printing eliminate IT support calls. Track usage and manage supplies automatically.\n\n## Meeting Room Management\n\nDigital displays show room availability. Automatic booking systems prevent scheduling conflicts.\n\n## Energy Management\n\nSmart HVAC systems adjust based on occupancy. Monitor and reduce energy consumption by up to 25%.\n\n## Getting Started\n\nStart small with lighting and printing. Add more systems as your team adapts. Yantrabyte provides end-to-end setup.',
    category: 'Office Automation',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
    published_at: '2024-10-05',
    sort_order: 5,
    created_at: '2024-10-05',
    updated_at: '2024-10-05',
  },
];

// ─── Category Config ────────────────────────────────────────────────────────

type CategoryFilter = 'All' | 'CCTV Tips' | 'IT Solutions' | 'Networking' | 'Security Systems' | 'Office Automation';

const CATEGORIES: CategoryFilter[] = ['All', 'CCTV Tips', 'IT Solutions', 'Networking', 'Security Systems', 'Office Automation'];

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

const ALL_TAGS = ['CCTV', 'Security', 'Networking', 'Wi-Fi', 'Firewall', 'Biometric', 'Automation', 'Cloud', 'IT Support', 'Bangalore'];

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
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

// ─── 1. Hero Banner ─────────────────────────────────────────────────────────

function HeroBanner() {
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
          <span className="text-[#0EA5E9]">Blog & Insights</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          Blog &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Insights
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Expert tips, guides, and industry insights to help you make informed technology decisions for your business
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── Blog Post Card ─────────────────────────────────────────────────────────

function BlogPostCard({ post, index }: { post: BlogPost; index: number }) {
  const CategoryIcon = CATEGORY_ICONS[post.category] || Camera;
  const gradient = CATEGORY_GRADIENTS[post.category] || 'from-[#0EA5E9] to-[#38BDF8]';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, borderColor: 'rgba(14,165,233,0.5)' }}
      className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/10"
    >
      {/* Featured image placeholder */}
      <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <CategoryIcon className="w-16 h-16 text-white/30 relative z-10" />

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-3 text-xs text-[#64748B] mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            5 min read
          </span>
        </div>

        <h3 className="text-white font-bold text-lg mb-3 leading-snug group-hover:text-[#0EA5E9] transition-colors duration-300 line-clamp-2">
          {post.title}
        </h3>

        <p className="text-[#94A3B8] text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1.5 text-[#0EA5E9] text-sm font-medium hover:gap-2.5 transition-all duration-300"
        >
          Read More <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({ posts }: { posts: BlogPost[] }) {
  const recentPosts = posts.slice(0, 3);

  return (
    <motion.div variants={staggerContainer} className="space-y-8">
      {/* Recent Posts */}
      <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
          Recent Posts
        </h3>
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center">
                  {(() => {
                    const Icon = CATEGORY_ICONS[post.category] || BookOpen;
                    return <Icon className="w-5 h-5 text-[#0EA5E9]" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white text-sm font-medium leading-snug group-hover:text-[#0EA5E9] transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-[#64748B] text-xs mt-1">{post.published_at}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#0EA5E9]" />
          Categories
        </h3>
        <div className="space-y-2">
          {CATEGORIES.filter(c => c !== 'All').map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || BookOpen;
            const count = posts.filter(p => p.category === cat).length;
            return (
              <Link
                key={cat}
                to={`/blog?category=${encodeURIComponent(cat)}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors duration-300 group"
              >
                <span className="flex items-center gap-2 text-[#94A3B8] text-sm group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4 text-[#0EA5E9]" />
                  {cat}
                </span>
                <span className="text-xs text-[#64748B] bg-white/5 px-2 py-1 rounded-md">{count}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#0EA5E9]" />
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] text-xs font-medium hover:border-[#0EA5E9]/50 hover:text-[#0EA5E9] transition-all duration-300 cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
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
              Need Expert IT Advice?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Our team is ready to help you find the right technology solutions for your business
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-[#0B1120] font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                Request Free Consultation <ArrowRight className="w-4 h-4" />
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

// ─── Main Blog Component ───────────────────────────────────────────────────

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const { posts, loading } = useBlogPosts(activeCategory === 'All' ? undefined : activeCategory);
  const displayPosts: BlogPost[] = posts.length > 0 ? posts : FALLBACK_POSTS;

  const filteredPosts = activeCategory === 'All'
    ? displayPosts
    : displayPosts.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="bg-[#0B1120] min-h-screen">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1120]">
      <HeroBanner />

      {/* Category Filter */}
      <Section className="!py-8 md:!py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/25'
                    : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* Blog Grid + Sidebar */}
      <Section id="blog-posts" className="!pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                key={activeCategory}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
              >
                {filteredPosts.map((post, i) => (
                  <BlogPostCard key={post.id} post={post} index={i} />
                ))}
              </motion.div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#94A3B8] text-lg">No posts found in this category.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar posts={displayPosts} />
            </div>
          </div>
        </div>
      </Section>

      <CTASection />
    </div>
  );
}
