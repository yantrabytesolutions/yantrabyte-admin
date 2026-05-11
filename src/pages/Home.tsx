import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Camera,
  Laptop,
  Monitor,
  Router,
  Printer,
  Fingerprint,
  Shield,
  FileCheck,
  Zap,
  BadgePercent,
  Users,
  CheckCircle,
  Clock,
  Settings,
  Building,
  ShoppingCart,
  Warehouse,
  Home as HomeIcon,
  GraduationCap,
  HeartPulse,
  Factory,
  Home as HouseIcon,
  Star,
  ArrowRight,
  ChevronDown,
  Phone,
  MessageCircle,
  AlertTriangle,
  Search,
  Wrench,
  TestTube2,
  Headphones,
} from 'lucide-react';
import { useServices, useTestimonials, useFAQs, useIndustries } from '../hooks/useSupabase';
import type { Service, Testimonial, FAQ, Industry } from '../types';

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_SERVICES: Service[] = [
  { id: '1', title: 'CCTV Installation', slug: 'cctv-installation', short_description: 'Professional CCTV camera installation for homes and businesses with remote monitoring.', full_description: '', icon: 'Camera', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', title: 'Laptop Repair', slug: 'laptop-repair', short_description: 'Expert laptop repair services for all brands with quick turnaround.', full_description: '', icon: 'Laptop', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', title: 'Desktop Repair', slug: 'desktop-repair', short_description: 'Comprehensive desktop computer repair and upgrade services.', full_description: '', icon: 'Monitor', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', title: 'Networking', slug: 'networking', short_description: 'Complete networking solutions including LAN, WAN, and Wi-Fi setup.', full_description: '', icon: 'Router', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', title: 'Printer Services', slug: 'printer-services', short_description: 'Printer installation, repair, and maintenance for all brands.', full_description: '', icon: 'Printer', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 5, created_at: '', updated_at: '' },
  { id: '8', title: 'AMC Support', slug: 'amc-support', short_description: 'Annual maintenance contracts for ongoing IT support and peace of mind.', full_description: '', icon: 'FileCheck', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 8, created_at: '', updated_at: '' },
];

const FALLBACK_INDUSTRIES: Industry[] = [
  { id: '1', name: 'Offices', slug: 'offices', description: 'Secure IT infrastructure for corporate offices and coworking spaces.', icon: 'Building', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Retail Stores', slug: 'retail', description: 'CCTV and POS solutions for retail businesses of all sizes.', icon: 'ShoppingCart', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Warehouses', slug: 'warehouses', description: 'Comprehensive security and networking for warehouses.', icon: 'Warehouse', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Apartments', slug: 'apartments', description: 'Smart security and intercom systems for apartment complexes.', icon: 'Home', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Schools', slug: 'schools', description: 'Safe campus solutions with CCTV and access control.', icon: 'GraduationCap', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', name: 'Hospitals', slug: 'hospitals', description: 'Critical IT and security systems for healthcare facilities.', icon: 'HeartPulse', is_published: true, sort_order: 6, created_at: '' },
  { id: '7', name: 'Factories', slug: 'factories', description: 'Industrial-grade security and IT infrastructure for factories.', icon: 'Factory', is_published: true, sort_order: 7, created_at: '' },
  { id: '8', name: 'Homes', slug: 'homes', description: 'Smart home security, Wi-Fi, and IT solutions for residences.', icon: 'House', is_published: true, sort_order: 8, created_at: '' },
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: '1', name: 'Rajesh Kumar', company: 'TechPark Solutions', role: 'Operations Manager', rating: 5, content: 'Yantrabyte installed 32 CCTV cameras across our office campus. The quality of work and professionalism was outstanding. Their team completed the installation in just 2 days with zero downtime.', avatar_url: '', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Priya Sharma', company: 'Metro Retail Group', role: 'Owner', rating: 5, content: 'We have been using their AMC service for over a year now. Response time is excellent and the technicians are very knowledgeable. Highly recommended for any IT support needs.', avatar_url: '', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Mohammed Irfan', company: 'Sunrise Apartments', role: 'Association President', rating: 4, content: 'The biometric access system they installed has transformed our apartment security. Residents feel much safer now. Great after-sales support too.', avatar_url: '', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Anitha Reddy', company: 'Bangalore School of Excellence', role: 'Administrator', rating: 5, content: 'Complete networking and CCTV setup for our school was done perfectly. They understood our requirements and delivered exactly what we needed within budget.', avatar_url: '', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Venkat Rao', company: 'Precision Manufacturing', role: 'Factory Manager', rating: 5, content: 'Their firewall and network security setup has protected our factory from multiple cyber threats. The team is extremely skilled and responsive. Best IT partner in Bangalore.', avatar_url: '', is_published: true, sort_order: 5, created_at: '' },
];

const FALLBACK_FAQS: FAQ[] = [
  { id: '1', question: 'What areas in Bangalore do you serve?', answer: 'We serve all major areas in Bangalore including Whitefield, Electronic City, Koramangala, Indiranagar, HSR Layout, Marathahalli, BTM Layout, Jayanagar, and many more. We also cover surrounding areas for larger projects.', category: 'General', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', question: 'Do you provide free consultations and site visits?', answer: 'Yes, we offer completely free consultations and site visits for all our services. Our experts will visit your location, assess your requirements, and provide a detailed quotation with no obligation.', category: 'General', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', question: 'How many CCTV cameras do I need for my property?', answer: 'The number of cameras depends on your property size, layout, and security requirements. We recommend a site inspection where our experts will map out optimal camera positions and provide a comprehensive coverage plan.', category: 'CCTV', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', question: 'Can I view my CCTV footage remotely on my phone?', answer: 'Absolutely! All our CCTV installations support remote viewing through mobile apps. You can monitor your property from anywhere in the world using your smartphone, tablet, or computer with an internet connection.', category: 'CCTV', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', question: 'What brands of laptops do you repair?', answer: 'We repair all major laptop brands including Dell, HP, Lenovo, Asus, Acer, Apple, MSI, and Toshiba. Our certified technicians handle hardware and software issues for both Windows and Mac systems.', category: 'Repair', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', question: 'What does your Annual Maintenance Contract include?', answer: 'Our AMC includes regular preventive maintenance, priority support with guaranteed response times, discounts on parts, unlimited remote support, and scheduled visits. We offer flexible plans for businesses of all sizes.', category: 'AMC', is_published: true, sort_order: 6, created_at: '' },
  { id: '7', question: 'How quickly can you respond to an emergency IT issue?', answer: 'We offer 24/7 emergency support with a guaranteed response time of under 2 hours within Bangalore city limits. For AMC clients, we guarantee under 1 hour response time for critical issues.', category: 'General', is_published: true, sort_order: 7, created_at: '' },
  { id: '8', question: 'Do you provide warranty on your installations?', answer: 'Yes, all our installations come with a minimum 1-year warranty on labor. Equipment warranties vary by manufacturer, typically ranging from 1-3 years. Extended warranty options are also available.', category: 'General', is_published: true, sort_order: 8, created_at: '' },
];

// ─── Icon Mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck,
  Building, ShoppingCart, Warehouse, Home: HomeIcon, GraduationCap, HeartPulse, Factory, House: HouseIcon,
};

const SERVICE_ICONS: React.ElementType[] = [Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck];

const INDUSTRY_ICONS: React.ElementType[] = [Building, ShoppingCart, Warehouse, HomeIcon, GraduationCap, HeartPulse, Factory, HouseIcon];

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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

// ─── Helper: Animated Counter ───────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Section Wrapper ────────────────────────────────────────────────────────

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

// ─── 1. Hero Section ────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120]">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#0EA5E9] animate-pulse"
            style={{
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0EA5E9]/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
              Bangalore's Trusted IT & Security Partner
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
            >
              Complete IT & Security{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
                Solutions in Bangalore
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg text-[#94A3B8] max-w-xl leading-relaxed"
            >
              Professional CCTV Installation, Computer Repair, Networking & Smart Security Solutions for Homes & Businesses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25 hover:shadow-[#0EA5E9]/40"
              >
                Get Free Consultation <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/919986742525"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#1EB755] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#25D366]/25"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Now
              </a>
              <a
                href="tel:+919986742525"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
              >
                <Phone className="w-4 h-4" /> Call Now
              </a>
            </motion.div>
          </div>

          {/* Right: CCTV Dashboard Mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hidden lg:block"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-[#0EA5E9]/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#0EA5E9]" />
                  <span className="text-white font-semibold text-sm">Live Surveillance Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-xs font-medium">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Front Gate', time: '14:32:05' },
                  { label: 'Parking Lot', time: '14:32:05' },
                  { label: 'Lobby', time: '14:32:04' },
                  { label: 'Server Room', time: '14:32:05' },
                ].map((cam, i) => (
                  <div key={i} className="relative bg-[#0B1120]/80 rounded-lg overflow-hidden aspect-video border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a3a]/50 to-[#0B1120]/80" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-white/70 font-mono">REC</span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-[10px] text-white/50 font-mono">{cam.time}</div>
                    <div className="absolute top-2 right-2 text-[9px] text-white/40 font-mono">CAM-{i + 1}</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white/10" />
                    </div>
                    <div className="absolute bottom-2 right-2 text-[10px] text-[#0EA5E9]/60 font-medium">{cam.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                <span className="font-mono">System Active | 4 Cameras Online</span>
                <span className="font-mono">Storage: 72% | 14:32 IST</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── 2. Trust Stats Section ─────────────────────────────────────────────────

function TrustStatsSection() {
  const stats = [
    { value: 1000, suffix: '+', label: 'Devices Serviced' },
    { value: 500, suffix: '+', label: 'CCTV Installations' },
    { value: 24, suffix: '/7', label: 'Support' },
    { value: 5, suffix: '-Star', label: 'Customer Support' },
  ];

  return (
    <Section className="relative -mt-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="backdrop-blur-xl bg-white/5 border border-[#0EA5E9]/20 rounded-2xl p-6 md:p-8 text-center hover:border-[#0EA5E9]/50 transition-all duration-300 shadow-lg shadow-[#0EA5E9]/5"
            >
              <div className="text-3xl md:text-4xl font-bold text-[#0EA5E9] mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm md:text-base text-[#94A3B8] font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 3. Services Overview ───────────────────────────────────────────────────

function ServicesSection() {
  const { services, loading } = useServices();
  const displayServices: Service[] = services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <Section id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Services</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Comprehensive IT and security solutions tailored for Bangalore's homes and businesses
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayServices.map((service, i) => {
              const IconComponent = service.icon ? (ICON_MAP[service.icon] || SERVICE_ICONS[i % SERVICE_ICONS.length]) : SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <motion.div
                  key={service.id}
                  variants={staggerItem}
                  whileHover={{ scale: 1.04, borderColor: 'rgba(14,165,233,0.5)' }}
                  className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/10 cursor-pointer"
                >
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
            })}
          </motion.div>
        )}
      </div>
    </Section>
  );
}

// ─── 4. Why Choose Us ───────────────────────────────────────────────────────

function WhyChooseUsSection() {
  const features = [
    { icon: Zap, title: 'Same Day Service', description: 'Get your issues resolved the same day you call. Our rapid response team ensures minimal downtime for your business.' },
    { icon: BadgePercent, title: 'Affordable Pricing', description: 'Competitive pricing without compromising quality. Transparent quotes with no hidden charges for any service.' },
    { icon: Users, title: 'Expert Engineers', description: 'Certified professionals with years of experience in IT infrastructure, security systems, and networking.' },
    { icon: CheckCircle, title: 'Genuine Products', description: 'We use only genuine, branded products from authorized distributors with full manufacturer warranty.' },
    { icon: Clock, title: 'Fast Response', description: 'Average response time under 2 hours for emergency calls. Priority support for AMC clients.' },
    { icon: Settings, title: 'Custom Business Solutions', description: 'Tailored IT and security solutions designed specifically for your business requirements and budget.' },
  ];

  return (
    <Section id="why-us">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Yantrabyte</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            We deliver reliability, speed, and expertise that sets us apart from the competition
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#0EA5E9]/30 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 5. Industries Served ───────────────────────────────────────────────────

function IndustriesSection() {
  const { industries, loading } = useIndustries();
  const displayIndustries: Industry[] = industries.length > 0 ? industries : FALLBACK_INDUSTRIES;

  return (
    <Section id="industries">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Industries <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">We Serve</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Specialized IT and security solutions for every industry vertical
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6"
          >
            {displayIndustries.map((industry, i) => {
              const IconComponent = industry.icon ? (ICON_MAP[industry.icon] || INDUSTRY_ICONS[i % INDUSTRY_ICONS.length]) : INDUSTRY_ICONS[i % INDUSTRY_ICONS.length];
              return (
                <motion.div
                  key={industry.id}
                  variants={staggerItem}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-[#0EA5E9]/30 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4 group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
                    <IconComponent className="w-7 h-7 text-[#0EA5E9]" />
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{industry.name}</h3>
                  <p className="text-[#64748B] text-xs leading-relaxed">{industry.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </Section>
  );
}

// ─── 6. Testimonials Carousel ──────────────────────────────────────────────

function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials();
  const displayTestimonials: Testimonial[] = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAuto = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % displayTestimonials.length);
    }, 5000);
  }, [displayTestimonials.length]);

  const stopAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (displayTestimonials.length > 0) {
      startAuto();
      return stopAuto;
    }
  }, [displayTestimonials.length, startAuto, stopAuto]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    stopAuto();
    startAuto();
  };

  if (loading) {
    return (
      <Section id="testimonials">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
        </div>
      </Section>
    );
  }

  const t = displayTestimonials[current];

  return (
    <Section id="testimonials">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Clients Say</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">Trusted by hundreds of businesses across Bangalore</p>
        </motion.div>

        <motion.div variants={scaleIn} className="relative">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10 min-h-[280px] flex flex-col justify-between shadow-lg shadow-[#0EA5E9]/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white/90 text-lg leading-relaxed mb-6 italic">
                  &ldquo;{t.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] font-bold text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-[#94A3B8] text-sm">{t.role}, {t.company}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-6">
            {displayTestimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-[#0EA5E9] w-8' : 'bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 7. Process Section ────────────────────────────────────────────────────

function ProcessSection() {
  const steps = [
    { icon: Search, title: 'Consultation', description: 'Free consultation to understand your requirements and budget.' },
    { icon: Settings, title: 'Site Inspection', description: 'Our experts visit your location for a detailed assessment.' },
    { icon: Wrench, title: 'Installation', description: 'Professional installation by certified technicians.' },
    { icon: TestTube2, title: 'Testing', description: 'Thorough testing and quality checks before handover.' },
    { icon: Headphones, title: 'Support', description: 'Ongoing support and maintenance for complete peace of mind.' },
  ];

  return (
    <Section id="process">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How We <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Work</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            A streamlined process that delivers results every time
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="relative"
        >
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#0EA5E9]/20 via-[#0EA5E9]/40 to-[#0EA5E9]/20" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#0B1120] border-2 border-[#0EA5E9]/40 flex items-center justify-center group-hover:border-[#0EA5E9] transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#0EA5E9]/20 z-10 relative">
                      <Icon className="w-7 h-7 text-[#0EA5E9]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-bold z-20">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed max-w-[180px]">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 8. CTA Banner ──────────────────────────────────────────────────────────

function CTABannerSection() {
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
              Protect Your Business with<br className="hidden sm:block" /> Smart IT & Security Solutions
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Get a free consultation and site visit from our experts today
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-[#0B1120] font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                Request Free Quote <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Schedule Site Visit
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 9. FAQ Section ─────────────────────────────────────────────────────────

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden hover:border-[#0EA5E9]/30 transition-colors duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left group"
      >
        <span className="text-white font-medium pr-4">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#94A3B8] group-hover:text-[#0EA5E9] transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 text-[#94A3B8] text-sm leading-relaxed border-t border-white/5 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  const { faqs, loading } = useFAQs();
  const displayFaqs: FAQ[] = faqs.length > 0 ? faqs : FALLBACK_FAQS;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'General', 'CCTV', 'Repair', 'AMC'];

  const filteredFaqs = activeCategory === 'All'
    ? displayFaqs
    : displayFaqs.filter(f => f.category === activeCategory);

  return (
    <Section id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Questions</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">Find answers to common questions about our services</p>
        </motion.div>

        {/* Category filter */}
        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <motion.div key={faq.id} variants={staggerItem}>
                <FAQItem
                  faq={faq}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Section>
  );
}

// ─── 10. Emergency Support Banner ──────────────────────────────────────────

function EmergencyBanner() {
  return (
    <Section className="!py-0">
      <motion.div
        variants={fadeInUp}
        className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 py-10 md:py-14"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">Emergency IT Support Available 24/7</h3>
              <p className="text-white/80 text-sm mt-1">Critical issue? We respond within 2 hours across Bangalore</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+919986742525" className="text-white font-mono text-lg md:text-xl font-bold hover:underline">
              +91 98765 43210
            </a>
            <a
              href="tel:+919986742525"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-red-600 font-bold hover:bg-white/90 transition-all duration-300 shadow-lg"
            >
              <Phone className="w-4 h-4" /> Call Now
            </a>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

// ─── Main Home Component ───────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="bg-[#0B1120]">
      <HeroSection />
      <TrustStatsSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <IndustriesSection />
      <TestimonialsSection />
      <ProcessSection />
      <CTABannerSection />
      <FAQSection />
      <EmergencyBanner />
    </div>
  );
}
