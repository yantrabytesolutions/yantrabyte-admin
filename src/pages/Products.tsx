import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight,
  Camera,
  Router,
  Fingerprint,
  Cable,
  HardDrive,
  Monitor,
  Lock,
  ArrowRight,
  MessageCircle,
  Phone,
  Star,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { useProducts } from '../hooks/useSupabase';
import type { Product } from '../types';

// ─── Fallback Data (8 products) ───────────────────────────────────────────

const FALLBACK_PRODUCTS: Product[] = [
  { id: '1', name: 'Hikvision 4MP Camera', slug: 'hikvision-4mp-camera', description: 'High-definition 4-megapixel dome camera with night vision, motion detection, and remote viewing via mobile app.', category: 'CCTV Cameras', price: '3,499', image_url: '', features: ['4MP HD Resolution', 'Night Vision up to 30m', 'Motion Detection & Alerts', 'Mobile Remote Viewing', 'Weatherproof IP67'], is_featured: true, is_published: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', name: 'Dahua 16-Channel NVR', slug: 'dahua-16ch-nvr', description: 'Professional 16-channel network video recorder with 4TB storage, AI-powered analytics, and remote access.', category: 'CCTV Cameras', price: '14,999', image_url: '', features: ['16-Channel Recording', '4TB HDD Included', 'AI-Powered Analytics', 'H.265+ Compression', 'Remote Access via App'], is_featured: true, is_published: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', name: 'TP-Link Business Router', slug: 'tp-link-business-router', description: 'Enterprise-grade VPN router with dual-WAN, VLAN support, and advanced security features for offices.', category: 'Networking', price: '8,999', image_url: '', features: ['Dual-WAN Failover', 'VPN Support (IPSec/PPTP/L2TP)', 'VLAN Segmentation', 'Bandwidth Control', 'Guest Network Isolation'], is_featured: false, is_published: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', name: 'CP Plus 8-Channel DVR', slug: 'cp-plus-8ch-dvr', description: 'Reliable 8-channel digital video recorder with 1TB storage, motion-triggered recording, and easy playback.', category: 'CCTV Cameras', price: '6,499', image_url: '', features: ['8-Channel Input', '1TB HDD Included', 'Motion-Triggered Recording', 'Smart Search Playback', 'USB Backup Support'], is_featured: false, is_published: true, sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', name: 'eSSL Biometric System', slug: 'essl-biometric-system', description: 'Advanced fingerprint and RFID access control with attendance management, ideal for offices and apartments.', category: 'Biometric', price: '11,999', image_url: '', features: ['Fingerprint + RFID', '5000 User Capacity', 'Attendance Management', 'TCP/IP Network', 'LCD Display & Voice Prompt'], is_featured: true, is_published: true, sort_order: 5, created_at: '', updated_at: '' },
  { id: '6', name: 'D-Link 24-Port Switch', slug: 'd-link-24port-switch', description: 'Managed 24-port Gigabit switch with VLAN, QoS, and comprehensive network management for growing businesses.', category: 'Networking', price: '12,499', image_url: '', features: ['24 Gigabit Ports', 'Layer 2 Management', 'VLAN & QoS Support', 'IGMP Snooping', 'Rack-Mountable Design'], is_featured: false, is_published: true, sort_order: 6, created_at: '', updated_at: '' },
  { id: '7', name: 'Godrej Smart Lock', slug: 'godrej-smart-lock', description: 'Digital smart lock with fingerprint, PIN, and Bluetooth access for homes and offices with tamper alert.', category: 'Accessories', price: '15,999', image_url: '', features: ['Fingerprint + PIN + Bluetooth', 'Anti-Peep PIN Code', 'Tamper Alert Alarm', 'Low Battery Warning', 'Emergency Power Backup'], is_featured: false, is_published: true, sort_order: 7, created_at: '', updated_at: '' },
  { id: '8', name: 'Samsung 24" LED Monitor', slug: 'samsung-24-led-monitor', description: 'Full HD 24-inch LED monitor with slim bezel, eye-care technology, and versatile connectivity for office use.', category: 'Accessories', price: '9,999', image_url: '', features: ['Full HD 1920x1080', 'Slim Bezel Design', 'Eye Saver Mode', 'HDMI + VGA Ports', '75Hz Refresh Rate'], is_featured: false, is_published: true, sort_order: 8, created_at: '', updated_at: '' },
];

// ─── Category Filter ───────────────────────────────────────────────────────

type CategoryFilter = 'All' | 'CCTV Cameras' | 'Networking' | 'Biometric' | 'Accessories';

const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'CCTV Cameras', 'Networking', 'Biometric', 'Accessories'];

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  'CCTV Cameras': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Networking': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Biometric': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Accessories': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

// ─── Icon Mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Camera, Router, Fingerprint, Cable, HardDrive, Monitor, Lock, ShoppingCart,
};

const ALL_ICONS: React.ElementType[] = [Camera, HardDrive, Router, Camera, Fingerprint, Router, Lock, Monitor];

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
          <span className="text-[#0EA5E9]">Products</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          Our{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Products
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Premium IT and security products from globally trusted brands, backed by our expert installation and warranty support.
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({ product, index }: { product: Product; index: number }) {
  const IconComponent = ALL_ICONS[index % ALL_ICONS.length];
  const badgeColor = CATEGORY_BADGE_COLORS[product.category] || 'bg-[#0EA5E9]/20 text-[#0EA5E9] border-[#0EA5E9]/30';

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`group backdrop-blur-xl bg-white/5 border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/10 relative overflow-hidden ${
        product.is_featured ? 'border-[#0EA5E9]/30' : 'border-white/10'
      }`}
    >
      {/* Featured badge */}
      {product.is_featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]" />
      )}

      {product.is_featured && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Star className="w-3 h-3 fill-[#0EA5E9]" /> Best Seller
        </div>
      )}

      {/* Product icon area */}
      <div className="w-14 h-14 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center mb-5 group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
        <IconComponent className="w-7 h-7 text-[#0EA5E9]" />
      </div>

      {/* Category badge */}
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badgeColor} mb-3`}>
        {product.category}
      </span>

      {/* Product name */}
      <h3 className="text-white font-bold text-lg mb-2">{product.name}</h3>

      {/* Description */}
      <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">{product.description}</p>

      {/* Features list */}
      <ul className="space-y-2 mb-5">
        {product.features.slice(0, 4).map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
            <Check className="w-4 h-4 text-[#0EA5E9] shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
        {product.features.length > 4 && (
          <li className="text-sm text-[#64748B]">+{product.features.length - 4} more features</li>
        )}
      </ul>

      {/* Price and CTA */}
      <div className="flex items-end justify-between pt-4 border-t border-white/10">
        <div>
          <span className="text-[#64748B] text-xs">Starting from</span>
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-xl">&#8377;{product.price}</span>
          </div>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25 hover:shadow-[#0EA5E9]/40"
        >
          Get Quote <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── 2. Products Grid Section ───────────────────────────────────────────────

function ProductsGridSection({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <Section id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Products</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Genuine products from authorized distributors with full manufacturer warranty
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORY_FILTERS.map(cat => (
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

        {/* Products grid */}
        <motion.div
          key={activeCategory}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-[#94A3B8] text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── 3. CTA Section ──────────────────────────────────────────────────────────

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
              Need a Custom Product Package?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Our experts will help you select the right products and design a complete solution for your needs
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-[#0B1120] font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                Request Free Quote <ArrowRight className="w-4 h-4" />
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

// ─── Main Products Component ───────────────────────────────────────────────

export default function Products() {
  const { products, loading } = useProducts();
  const displayProducts: Product[] = products.length > 0 ? products : FALLBACK_PRODUCTS;

  if (loading) {
    return (
      <div className="bg-[#0B1120] min-h-screen">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1120]">
      <HeroBanner />
      <ProductsGridSection products={displayProducts} />
      <CTASection />
    </div>
  );
}
