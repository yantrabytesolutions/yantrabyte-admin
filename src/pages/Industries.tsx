import { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ChevronRight,
  Building2,
  Store,
  Warehouse,
  Building,
  GraduationCap,
  HeartPulse,
  Factory,
  Home,
  ArrowRight,
  MessageCircle,
  Phone,
  Camera,
  Router,
  Fingerprint,
  Shield,
  Wifi,
  Monitor,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useIndustries } from '../hooks/useSupabase';
import type { Industry } from '../types';

// ─── Fallback Data (8 industries) ───────────────────────────────────────────

const FALLBACK_INDUSTRIES: Industry[] = [
  { id: '1', name: 'Corporate Offices', slug: 'corporate-offices', description: 'Secure IT infrastructure and smart access control for modern office spaces and IT parks.', icon: 'Building2', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Retail Stores', slug: 'retail-stores', description: 'CCTV surveillance and POS network solutions for retail businesses of all sizes.', icon: 'Store', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Warehouses', slug: 'warehouses', description: 'Comprehensive security and networking for storage and logistics facilities.', icon: 'Warehouse', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Apartments', slug: 'apartments', description: 'Smart security, intercom, and Wi-Fi solutions for apartment complexes and gated communities.', icon: 'Building', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Schools', slug: 'schools', description: 'Safe campus solutions with CCTV monitoring, access control, and IT infrastructure.', icon: 'GraduationCap', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', name: 'Hospitals', slug: 'hospitals', description: 'Critical IT and security systems for healthcare facilities and clinics.', icon: 'HeartPulse', is_published: true, sort_order: 6, created_at: '' },
  { id: '7', name: 'Factories', slug: 'factories', description: 'Industrial-grade security, networking, and IT infrastructure for manufacturing units.', icon: 'Factory', is_published: true, sort_order: 7, created_at: '' },
  { id: '8', name: 'Homes', slug: 'homes', description: 'Smart home security, Wi-Fi, and IT solutions for residential properties.', icon: 'Home', is_published: true, sort_order: 8, created_at: '' },
];

// ─── Industry Services Data ─────────────────────────────────────────────────

const INDUSTRY_SERVICES: Record<string, { services: string[]; detail: string }> = {
  'corporate-offices': {
    services: ['CCTV Surveillance', 'Enterprise Networking', 'Server Setup', 'AMC Support'],
    detail: 'End-to-end IT and security solutions for IT parks, coworking spaces, and corporate offices. We design and deploy scalable infrastructure that grows with your business.',
  },
  'retail-stores': {
    services: ['CCTV with Analytics', 'POS Network Setup', 'Wi-Fi for Customers', 'Alarm Systems', 'Remote Monitoring', 'IT AMC'],
    detail: 'Protect your inventory, streamline operations, and enhance customer experience with our retail-specific technology solutions designed for shops, malls, and multiplexes.',
  },
  'warehouses': {
    services: ['Perimeter CCTV', 'Access Control', 'Network Infrastructure', 'Fire Alarm Integration', 'Inventory Tracking Systems', '24/7 Monitoring'],
    detail: 'Comprehensive security and connectivity for warehouses and logistics hubs. Prevent theft, monitor operations, and ensure compliance with industry standards.',
  },
  'apartments': {
    services: ['Gate Intercom Systems', 'CCTV for Common Areas', 'Biometric Entry', 'Wi-Fi Network', 'Visitor Management', 'Smart Locks'],
    detail: 'Modern apartment complexes deserve modern security. We deliver integrated solutions that keep residents safe while providing convenient access for authorized personnel.',
  },
  'schools': {
    services: ['Campus CCTV', 'Student Attendance System', 'Computer Lab Setup', 'Wi-Fi Campus', 'Access Control', 'PA System Integration'],
    detail: 'Create a safe and technology-enabled learning environment. Our solutions for schools and colleges prioritize student safety while enabling digital education.',
  },
  'hospitals': {
    services: ['Critical CCTV Monitoring', 'Access Control for Restricted Areas', 'Network Infrastructure', 'Fire Detection Systems', 'PACS Integration', 'Emergency Communication'],
    detail: 'Healthcare facilities demand the highest reliability. We deliver mission-critical IT and security infrastructure that complies with healthcare standards and never goes down.',
  },
  'factories': {
    services: ['Industrial CCTV', 'Perimeter Security', 'Machine Monitoring Network', 'Access Control', 'Fire & Safety Systems', 'IT Infrastructure'],
    detail: 'Rugged, reliable technology solutions built for the demands of manufacturing environments. From shop floor to server room, we keep your factory running and secure.',
  },
  'homes': {
    services: ['Home CCTV', 'Video Doorbell', 'Smart Locks', 'Wi-Fi Setup', 'Home Automation', 'Remote Monitoring'],
    detail: 'Transform your home into a smart, secure haven. Our residential solutions combine convenience with security, all controllable from your smartphone.',
  },
};

// ─── Icon Mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Store, Warehouse, Building, GraduationCap, HeartPulse, Factory, Home,
};

const ALL_ICONS: React.ElementType[] = [Building2, Store, Warehouse, Building, GraduationCap, HeartPulse, Factory, Home];

const SERVICE_ICONS: React.ElementType[] = [Camera, Router, Fingerprint, Shield, Wifi, Monitor, Lock, MessageCircle];

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
          <span className="text-[#0EA5E9]">Industries</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          Industries We{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Serve
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Tailored IT and security solutions for every industry vertical. From offices to factories, we understand your unique requirements.
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── Industry Card ────────────────────────────────────────────────────────────

function IndustryCard({ industry, index, isExpanded, onToggle }: { industry: Industry; index: number; isExpanded: boolean; onToggle: () => void }) {
  const IconComponent = industry.icon ? (ICON_MAP[industry.icon] || ALL_ICONS[index % ALL_ICONS.length]) : ALL_ICONS[index % ALL_ICONS.length];
  const industryData = INDUSTRY_SERVICES[industry.slug];

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      className={`backdrop-blur-xl bg-white/5 border rounded-2xl transition-all duration-300 overflow-hidden group cursor-pointer ${
        isExpanded ? 'border-[#0EA5E9]/50 shadow-lg shadow-[#0EA5E9]/10' : 'border-white/10 hover:border-[#0EA5E9]/30'
      }`}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
            <IconComponent className="w-7 h-7 text-[#0EA5E9]" />
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
          </motion.div>
        </div>

        <h3 className="text-white font-bold text-lg mb-2">{industry.name}</h3>
        <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">{industry.description}</p>

        <span className="inline-flex items-center gap-1.5 text-[#0EA5E9] text-sm font-medium hover:gap-2.5 transition-all duration-300">
          Learn More <ArrowRight className="w-4 h-4" />
        </span>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && industryData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-0 border-t border-white/10">
              <div className="pt-5">
                <p className="text-[#94A3B8] text-sm leading-relaxed mb-5">
                  {industryData.detail}
                </p>

                <h4 className="text-white font-semibold text-sm mb-3">Services Offered</h4>
                <div className="grid grid-cols-2 gap-2">
                  {industryData.services.map((service, i) => {
                    const ServiceIcon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                        <ServiceIcon className="w-3.5 h-3.5 text-[#0EA5E9] shrink-0" />
                        <span className="text-[#94A3B8] text-xs font-medium">{service}</span>
                      </div>
                    );
                  })}
                </div>

                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25"
                  onClick={(e) => e.stopPropagation()}
                >
                  Get a Quote <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── 2. Industries Grid Section ──────────────────────────────────────────────

function IndustriesGridSection({ industries }: { industries: Industry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <Section id="industries">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Specialized <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Solutions</span> for Every Industry
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Click on any industry to explore the services we offer for that sector
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {industries.map((industry, i) => (
            <IndustryCard
              key={industry.id}
              industry={industry}
              index={i}
              isExpanded={expandedId === industry.id}
              onToggle={() => handleToggle(industry.id)}
            />
          ))}
        </motion.div>
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
              Industry-Specific Solutions,<br className="hidden sm:block" /> Expertly Delivered
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Tell us your industry and we will design a tailored IT and security package for your business
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

// ─── Main Industries Component ───────────────────────────────────────────────

export default function Industries() {
  const { industries, loading } = useIndustries();
  const displayIndustries: Industry[] = industries.length > 0 ? industries : FALLBACK_INDUSTRIES;

  if (loading) {
    return (
      <div className="bg-[#0B1120] min-h-screen">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1120]">
      <SEO 
        title="Industries We Serve | Yantrabyte Solutions" 
        description="Tailored IT and security solutions for corporate offices, retail stores, warehouses, apartments, schools, and hospitals."
      />
      <HeroBanner />
      <IndustriesGridSection industries={displayIndustries} />
      <CTASection />
    </div>
  );
}
