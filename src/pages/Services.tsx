import { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight,
  Camera,
  Laptop,
  Monitor,
  Router,
  Printer,
  Fingerprint,
  Shield,
  FileCheck,
  Zap,
  Wifi,
  Server,
  HardDrive,
  Cloud,
  Lock,
  ArrowRight,
  MessageCircle,
  Phone,
  Star,
  Wrench,
} from 'lucide-react';
import { useServices } from '../hooks/useSupabase';
import type { Service } from '../types';

// ─── Fallback Data (15 services) ───────────────────────────────────────────

const FALLBACK_SERVICES: Service[] = [
  { id: '1', title: 'CCTV Installation', slug: 'cctv-installation', short_description: 'Professional CCTV camera installation for homes and businesses with remote monitoring and night vision support.', full_description: '', icon: 'Camera', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', title: 'Laptop Repair', slug: 'laptop-repair', short_description: 'Expert laptop repair services for all brands including Dell, HP, Lenovo, Apple, and Asus with quick turnaround.', full_description: '', icon: 'Laptop', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', title: 'Desktop Repair', slug: 'desktop-repair', short_description: 'Comprehensive desktop computer repair, upgrade, and maintenance services for optimal performance.', full_description: '', icon: 'Monitor', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', title: 'Networking Solutions', slug: 'networking', short_description: 'Complete LAN, WAN, and Wi-Fi networking solutions for offices, apartments, and commercial spaces.', full_description: '', icon: 'Router', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', title: 'Printer Services', slug: 'printer-services', short_description: 'Printer installation, repair, and maintenance for HP, Canon, Brother, Epson, and all major brands.', full_description: '', icon: 'Printer', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 5, created_at: '', updated_at: '' },
  { id: '8', title: 'AMC Support', slug: 'amc-support', short_description: 'Annual maintenance contracts for ongoing IT support, preventive maintenance, and priority response.', full_description: '', icon: 'FileCheck', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 8, created_at: '', updated_at: '' },
  { id: '9', title: 'Wi-Fi Solutions', slug: 'wifi-solutions', short_description: 'High-performance Wi-Fi coverage for offices, apartments, hotels, and commercial spaces with seamless roaming.', full_description: '', icon: 'Wifi', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 9, created_at: '', updated_at: '' },
  { id: '10', title: 'Server Setup', slug: 'server-setup', short_description: 'On-premise and cloud server configuration, migration, and management for businesses of all sizes.', full_description: '', icon: 'Server', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 10, created_at: '', updated_at: '' },
  { id: '11', title: 'Data Recovery', slug: 'data-recovery', short_description: 'Professional data recovery from failed hard drives, SSDs, RAID arrays, and corrupted storage devices.', full_description: '', icon: 'HardDrive', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 11, created_at: '', updated_at: '' },
  { id: '12', title: 'Cloud Solutions', slug: 'cloud-solutions', short_description: 'Google Workspace, Microsoft 365, and AWS cloud setup, migration, and management for seamless operations.', full_description: '', icon: 'Cloud', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 12, created_at: '', updated_at: '' },
  { id: '13', title: 'Access Control', slug: 'access-control', short_description: 'Smart access control systems with RFID, biometric, and mobile-based entry for offices and residential complexes.', full_description: '', icon: 'Lock', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 13, created_at: '', updated_at: '' },
  { id: '14', title: 'IT Consulting', slug: 'it-consulting', short_description: 'Strategic IT consulting to help businesses optimize technology spending and infrastructure planning.', full_description: '', icon: 'Zap', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 14, created_at: '', updated_at: '' },
  { id: '15', title: 'Hardware Upgrades', slug: 'hardware-upgrades', short_description: 'RAM, SSD, and component upgrades to extend the life and performance of your existing IT infrastructure.', full_description: '', icon: 'Wrench', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 15, created_at: '', updated_at: '' },
];

// ─── Category Mapping ───────────────────────────────────────────────────────

const SERVICE_CATEGORIES: Record<string, string[]> = {
  Security: ['cctv-installation', 'access-control'],
  Repair: ['laptop-repair', 'desktop-repair', 'printer-services', 'data-recovery', 'hardware-upgrades'],
  Networking: ['networking', 'wifi-solutions', 'server-setup'],
  Office: ['amc-support', 'cloud-solutions', 'it-consulting'],
};

type CategoryFilter = 'All' | 'Security' | 'Repair' | 'Networking' | 'Office';

// ─── Icon Mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck, Wifi, Server, HardDrive, Cloud, Lock, Zap, Wrench,
};

const ALL_ICONS: React.ElementType[] = [Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck, Wifi, Server, HardDrive, Cloud, Lock, Zap, Wrench, Wrench];

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
          <span className="text-[#0EA5E9]">Services</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          Our{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Services
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Comprehensive IT and security solutions tailored for Bangalore's homes and businesses. From CCTV to cloud, we have you covered.
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── Service Card ────────────────────────────────────────────────────────────

function ServiceCard({ service, index, isFeatured }: { service: Service; index: number; isFeatured: boolean }) {
  const IconComponent = service.icon ? (ICON_MAP[service.icon] || ALL_ICONS[index % ALL_ICONS.length]) : ALL_ICONS[index % ALL_ICONS.length];

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.04, borderColor: 'rgba(14,165,233,0.5)' }}
      className={`group backdrop-blur-xl bg-white/5 border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/10 cursor-pointer relative overflow-hidden ${
        isFeatured ? 'border-[#0EA5E9]/30' : 'border-white/10'
      }`}
    >
      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Star className="w-3 h-3 fill-[#0EA5E9]" /> Featured
        </div>
      )}

      {/* Gradient accent for featured */}
      {isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]" />
      )}

      <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4 group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
        <IconComponent className="w-6 h-6 text-[#0EA5E9]" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{service.title}</h3>
      <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">{service.short_description}</p>
      <Link
        to={`/services/${service.slug}`}
        className="inline-flex items-center gap-1.5 text-[#0EA5E9] text-sm font-medium hover:gap-2.5 transition-all duration-300"
      >
        Learn More <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

// ─── 2. Featured Services ───────────────────────────────────────────────────

function FeaturedServicesSection({ services }: { services: Service[] }) {
  const featured = services.filter(s => s.is_featured);

  if (featured.length === 0) return null;

  return (
    <Section id="featured" className="!py-12 md:!py-16 -mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium">
            <Star className="w-3.5 h-3.5 fill-[#0EA5E9]" /> Most Popular Services
          </span>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {featured.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} isFeatured={true} />
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 3. All Services Grid ───────────────────────────────────────────────────

function AllServicesSection({ services: allServices }: { services: Service[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const categories: CategoryFilter[] = ['All', 'Security', 'Repair', 'Networking', 'Office'];

  const filteredServices = activeCategory === 'All'
    ? allServices
    : allServices.filter(s => SERVICE_CATEGORIES[activeCategory]?.includes(s.slug));

  return (
    <Section id="all-services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Explore All <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Services</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            From security to support, find the right solution for your needs
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(cat => (
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

        {/* Services grid */}
        <motion.div
          key={activeCategory}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredServices.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} isFeatured={false} />
          ))}
        </motion.div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#94A3B8] text-lg">No services found in this category.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── 4. CTA Section ──────────────────────────────────────────────────────────

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
              Need a Custom Solution?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Our experts will design a tailored IT and security package for your business
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

// ─── Main Services Component ───────────────────────────────────────────────

export default function Services() {
  const { services, loading } = useServices();
  const displayServices: Service[] = services.length > 0 ? services : FALLBACK_SERVICES;

  if (loading) {
    return (
      <div className="bg-[#0B1120] min-h-screen">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1120]">
      <SEO 
        title="Our Services | Yantrabyte Solutions" 
        description="Comprehensive IT and security solutions tailored for Bangalore's homes and businesses. From CCTV to cloud, we have you covered."
      />
      <HeroBanner />
      <FeaturedServicesSection services={displayServices} />
      <AllServicesSection services={displayServices} />
      <CTASection />
    </div>
  );
}
