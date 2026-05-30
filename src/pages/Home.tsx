import { useState, useEffect, useRef, useCallback } from 'react';
import SEO from '../components/SEO';
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
  Loader2,
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
  Target,
  Eye,
  Heart,
  Award,
  Cable,
  HardDrive,
  Lock,
  Wifi,
  Server,
  Cloud,
  Send,
  Mail,
  MapPin,
  AlertCircle,
  Building2,
  Store,
  Calendar,
} from 'lucide-react';
import {
  useServices,
  useTestimonials,
  useFAQs,
  useIndustries,
  useTeam,
  useClientLogos,
  useBlogPosts,
  submitContact,
} from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import type {
  Service,
  Testimonial,
  FAQ,
  Industry,
  TeamMember,
  ClientLogo,
  BlogPost,
} from '../types';

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_SERVICES: Service[] = [
  { id: '1', title: 'CCTV Installation', slug: 'cctv-installation', short_description: 'Professional CCTV camera installation for homes and businesses with remote monitoring.', full_description: '', icon: 'Camera', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', title: 'Laptop Repair', slug: 'laptop-repair', short_description: 'Expert laptop repair services for all brands with quick turnaround.', full_description: '', icon: 'Laptop', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', title: 'Desktop Repair', slug: 'desktop-repair', short_description: 'Comprehensive desktop computer repair and upgrade services.', full_description: '', icon: 'Monitor', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', title: 'Networking', slug: 'networking', short_description: 'Complete networking solutions including LAN, WAN, and Wi-Fi setup.', full_description: '', icon: 'Router', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', title: 'Printer Services', slug: 'printer-services', short_description: 'Printer installation, repair, and maintenance for all brands.', full_description: '', icon: 'Printer', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 5, created_at: '', updated_at: '' },
  { id: '8', title: 'AMC Support', slug: 'amc-support', short_description: 'Annual maintenance contracts for ongoing IT support and peace of mind.', full_description: '', icon: 'FileCheck', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 8, created_at: '', updated_at: '' },
  { id: '9', title: 'Wi-Fi Solutions', slug: 'wifi-solutions', short_description: 'High-performance Wi-Fi coverage for offices, apartments, and hotels.', full_description: '', icon: 'Wifi', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 9, created_at: '', updated_at: '' },
  { id: '10', title: 'Server Setup', slug: 'server-setup', short_description: 'On-premise and cloud server configuration and management.', full_description: '', icon: 'Server', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 10, created_at: '', updated_at: '' },
  { id: '11', title: 'Data Recovery', slug: 'data-recovery', short_description: 'Professional data recovery from failed hard drives and SSDs.', full_description: '', icon: 'HardDrive', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 11, created_at: '', updated_at: '' },
  { id: '12', title: 'Cloud Solutions', slug: 'cloud-solutions', short_description: 'Google Workspace, Microsoft 365, and AWS cloud setup and migration.', full_description: '', icon: 'Cloud', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 12, created_at: '', updated_at: '' },
  { id: '13', title: 'Access Control', slug: 'access-control', short_description: 'Smart access control with RFID, biometric, and mobile-based entry.', full_description: '', icon: 'Lock', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 13, created_at: '', updated_at: '' },
  { id: '14', title: 'IT Consulting', slug: 'it-consulting', short_description: 'Strategic IT consulting to optimize technology spending.', full_description: '', icon: 'Zap', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 14, created_at: '', updated_at: '' },
  { id: '15', title: 'Hardware Upgrades', slug: 'hardware-upgrades', short_description: 'RAM, SSD, and component upgrades to extend hardware life.', full_description: '', icon: 'Wrench', features: [], benefits: [], meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 15, created_at: '', updated_at: '' },
];

const FALLBACK_INDUSTRIES: Industry[] = [
  { id: '1', name: 'Corporate Offices', slug: 'corporate-offices', description: 'Secure IT infrastructure and smart access control for modern office spaces.', icon: 'Building2', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Retail Stores', slug: 'retail-stores', description: 'CCTV surveillance and POS network solutions for retail businesses.', icon: 'Store', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Warehouses', slug: 'warehouses', description: 'Comprehensive security and networking for storage and logistics facilities.', icon: 'Warehouse', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Apartments', slug: 'apartments', description: 'Smart security, intercom, and Wi-Fi solutions for apartment complexes.', icon: 'Building', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Schools', slug: 'schools', description: 'Safe campus solutions with CCTV monitoring and access control.', icon: 'GraduationCap', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', name: 'Hospitals', slug: 'hospitals', description: 'Critical IT and security systems for healthcare facilities.', icon: 'HeartPulse', is_published: true, sort_order: 6, created_at: '' },
  { id: '7', name: 'Factories', slug: 'factories', description: 'Industrial-grade security, networking, and IT infrastructure.', icon: 'Factory', is_published: true, sort_order: 7, created_at: '' },
  { id: '8', name: 'Homes', slug: 'homes', description: 'Smart home security, Wi-Fi, and IT solutions for residences.', icon: 'Home', is_published: true, sort_order: 8, created_at: '' },
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: '1', name: 'Rajesh Kumar', company: 'TechPark Solutions', role: 'Operations Manager', rating: 5, content: 'Yantrabyte installed 32 CCTV cameras across our office campus. The quality of work and professionalism was outstanding. Their team completed the installation in just 2 days with zero downtime.', avatar_url: '', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Priya Sharma', company: 'Metro Retail Group', role: 'Owner', rating: 5, content: 'We have been using their AMC service for over a year now. Response time is excellent and the technicians are very knowledgeable. Highly recommended for any IT support needs.', avatar_url: '', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Mohammed Irfan', company: 'Sunrise Apartments', role: 'Association President', rating: 4, content: 'The biometric access system they installed has transformed our apartment security. Residents feel much safer now. Great after-sales support too.', avatar_url: '', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Anitha Reddy', company: 'Bangalore School of Excellence', role: 'Administrator', rating: 5, content: 'Complete networking and CCTV setup for our school was done perfectly. They understood our requirements and delivered exactly what we needed within budget.', avatar_url: '', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Venkat Rao', company: 'Precision Manufacturing', role: 'Factory Manager', rating: 5, content: 'Their firewall and network security setup has protected our factory from multiple cyber threats. The team is extremely skilled and responsive. Best IT partner in Bangalore.', avatar_url: '', is_published: true, sort_order: 5, created_at: '' },
];

const FALLBACK_FAQS: FAQ[] = [
  { id: '1', question: 'What areas in Bangalore do you serve?', answer: 'We serve all major areas in Bangalore including Whitefield, Electronic City, Koramangala, Indiranagar, HSR Layout, Marathahalli, BTM Layout, Jayanagar, and many more.', category: 'General', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', question: 'Do you provide free consultations and site visits?', answer: 'Yes, we offer completely free consultations and site visits for all our services. Our experts will visit your location, assess your requirements, and provide a detailed quotation with no obligation.', category: 'General', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', question: 'How many CCTV cameras do I need for my property?', answer: 'The number depends on your property size, layout, and security requirements. We recommend a site inspection where our experts will map out optimal camera positions.', category: 'CCTV', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', question: 'Can I view my CCTV footage remotely on my phone?', answer: 'Absolutely! All our CCTV installations support remote viewing through mobile apps. You can monitor your property from anywhere in the world.', category: 'CCTV', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', question: 'What brands of laptops do you repair?', answer: 'We repair all major laptop brands including Dell, HP, Lenovo, Asus, Acer, Apple, MSI, and Toshiba.', category: 'Repair', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', question: 'What does your Annual Maintenance Contract include?', answer: 'Our AMC includes regular preventive maintenance, priority support with guaranteed response times, discounts on parts, unlimited remote support, and scheduled visits.', category: 'AMC', is_published: true, sort_order: 6, created_at: '' },
  { id: '7', question: 'How quickly can you respond to an emergency IT issue?', answer: 'We offer 24/7 emergency support with a guaranteed response time of under 2 hours within Bangalore city limits. For AMC clients, we guarantee under 1 hour.', category: 'General', is_published: true, sort_order: 7, created_at: '' },
  { id: '8', question: 'Do you provide warranty on your installations?', answer: 'Yes, all our installations come with a minimum 1-year warranty on labor. Equipment warranties vary by manufacturer, typically ranging from 1-3 years.', category: 'General', is_published: true, sort_order: 8, created_at: '' },
];

const FALLBACK_TEAM: TeamMember[] = [
  { id: '1', name: 'Arjun Mehta', role: 'CEO & Founder', bio: 'With over 15 years in IT infrastructure and security, Arjun founded Yantrabyte to bring enterprise-grade solutions to businesses of every size across Karnataka.', image_url: '', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Kavitha Rao', role: 'CTO', bio: 'Kavitha leads our technology strategy, bringing deep expertise in cybersecurity, networking, and cloud infrastructure.', image_url: '', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Ramesh Iyer', role: 'Head of Operations', bio: 'Ramesh ensures seamless project delivery and after-sales support, drawing on a decade of experience managing large-scale IT deployments.', image_url: '', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Priya Nair', role: 'Lead Engineer', bio: 'Priya oversees our technical team, specializing in CCTV and access control systems. She holds certifications from Hikvision, Dahua, and Bosch.', image_url: '', is_published: true, sort_order: 4, created_at: '' },
];

const FALLBACK_CLIENT_LOGOS: ClientLogo[] = [
  { id: '1', name: 'TechPark Solutions', logo_url: '', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Metro Retail Group', logo_url: '', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Sunrise Apartments', logo_url: '', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Precision Manufacturing', logo_url: '', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Bangalore School of Excellence', logo_url: '', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', name: 'Karnataka Health Corp', logo_url: '', is_published: true, sort_order: 6, created_at: '' },
];



const FALLBACK_POSTS: BlogPost[] = [
  { id: '1', title: 'Top 5 Tips for Choosing the Right CCTV System', slug: 'tips-choosing-right-cctv-system', excerpt: 'Selecting the right CCTV system can be overwhelming. Here are the top 5 factors every business owner should consider.', content: '', category: 'CCTV Tips', featured_image: '', meta_title: '', meta_description: '', is_published: true, published_at: '2024-12-15', sort_order: 1, created_at: '2024-12-15', updated_at: '2024-12-15' },
  { id: '2', title: 'How to Secure Your Office Network Against Cyber Threats', slug: 'secure-office-network-cyber-threats', excerpt: 'With cyber attacks on the rise, protecting your office network is more important than ever.', content: '', category: 'IT Solutions', featured_image: '', meta_title: '', meta_description: '', is_published: true, published_at: '2024-11-28', sort_order: 2, created_at: '2024-11-28', updated_at: '2024-11-28' },
  { id: '3', title: 'Complete Guide to Office Wi-Fi', slug: 'complete-guide-office-wifi-setup', excerpt: 'A reliable Wi-Fi network is the backbone of modern offices. This guide covers everything from setup to optimization.', content: '', category: 'Networking', featured_image: '', meta_title: '', meta_description: '', is_published: true, published_at: '2024-11-10', sort_order: 3, created_at: '2024-11-10', updated_at: '2024-11-10' },
];

const GOOGLE_REVIEWS = [
  { id: 'g1', name: 'Arun Kumar', company: 'Whitefield IT Park', rating: 5, text: 'Extremely professional team. They installed our entire CCTV and networking setup in 3 days flat. Highly recommended!', time: '2 months ago' },
  { id: 'g2', name: 'Deepa Nair', company: 'Koramangala Apartments', rating: 5, text: 'Our apartment complex needed a complete security overhaul. Yantrabyte delivered beyond expectations.', time: '3 weeks ago' },
  { id: 'g3', name: 'Suresh Menon', company: 'Electronics City Warehouse', rating: 5, text: 'Best IT service provider in Bangalore, hands down. Every cable is neatly managed, every camera perfectly positioned.', time: '1 month ago' },
];

const ALL_SERVICES_LIST = [
  'CCTV Installation', 'Laptop Repair', 'Desktop Repair', 'Networking Solutions',
  'Printer Services', 'AMC Support', 'Wi-Fi Solutions', 'Server Setup',
  'Data Recovery', 'Cloud Solutions', 'Access Control', 'IT Consulting', 'Hardware Upgrades',
];

// ─── Icon Mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck,
  Building, ShoppingCart, Warehouse, Home: HomeIcon, GraduationCap, HeartPulse, Factory, House: HouseIcon,
  Building2, Store, Wifi, Server, HardDrive, Cloud, Lock, Zap, Wrench, Cable,
};

const SERVICE_ICONS: React.ElementType[] = [Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck];
const INDUSTRY_ICONS: React.ElementType[] = [Building2, Store, Warehouse, Building, GraduationCap, HeartPulse, Factory, HomeIcon];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'CCTV Tips': Camera, 'IT Solutions': Monitor, 'Networking': Router,
  'Security Systems': Shield, 'Office Automation': Printer,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  'CCTV Tips': 'from-[#0EA5E9] to-[#0284C7]', 'IT Solutions': 'from-[#38BDF8] to-[#0EA5E9]',
  'Networking': 'from-[#0EA5E9] to-[#7DD3FC]', 'Security Systems': 'from-[#0284C7] to-[#38BDF8]',
  'Office Automation': 'from-[#7DD3FC] to-[#0EA5E9]',
};

const AVATAR_GRADIENTS = [
  'from-[#0EA5E9] to-[#0284C7]', 'from-[#38BDF8] to-[#0EA5E9]',
  'from-[#7DD3FC] to-[#38BDF8]', 'from-[#0EA5E9] to-[#7DD3FC]',
  'from-[#0284C7] to-[#38BDF8]', 'from-[#38BDF8] to-[#7DD3FC]',
];

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
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
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
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
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    device_type: '',
    issue_description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.issue_description.trim()) {
      setError('Please fill in Name, Phone, and Issue Description.');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
      const datePrefix = `${startYear}-${startYear + 1}`;
      const prefixString = `YBS-${datePrefix}-`;

      const { data: existing } = await supabase
        .from('service_tickets')
        .select('ticket_number')
        .ilike('ticket_number', `${prefixString}%`);
        
      let maxSeq = 0;
      if (existing) {
        for (const t of existing) {
          const match = String(t.ticket_number || '').match(/-(\d+)$/);
          if (match) {
            const seqNum = parseInt(match[1], 10);
            if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
          }
        }
      }
      const seq = (maxSeq + 1).toString().padStart(3, '0');
      const ticketNumber = `${prefixString}${seq}`;

      const ticketPayload = {
        ticket_number: ticketNumber,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        customer_address: form.customer_address.trim() || null,
        device_type: form.device_type || 'Other',
        issue_description: form.issue_description.trim(),
        status: 'open',
        priority: 'medium',
      };

      const { error: insertError } = await supabase.from('service_tickets').insert([ticketPayload]);
      if (insertError) throw insertError;

      supabase.functions.invoke('send-ticket-email', { body: ticketPayload }).catch((err) => {
        console.warn('Edge function error:', err);
      });

      setSuccessTicket(ticketNumber);
      setForm({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '', device_type: '', issue_description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120]">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-[#0EA5E9] animate-pulse"
            style={{
              width: Math.random() * 4 + 1 + 'px', height: Math.random() * 4 + 1 + 'px',
              left: Math.random() * 100 + '%', top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's', animationDuration: Math.random() * 3 + 2 + 's',
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0EA5E9]/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
              Bangalore's Trusted IT & Security Partner
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Complete IT & Security{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Solutions in Bangalore</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg text-[#94A3B8] max-w-xl leading-relaxed">
              Professional CCTV Installation, Computer Repair, Networking & Smart Security Solutions for Homes & Businesses.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap gap-4">
              <a href="/service-request" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] hover:from-[#0F766E] hover:to-[#0284C7] text-white font-bold tracking-wider uppercase transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25 hover:shadow-[#0EA5E9]/40">
                Service Request
              </a>
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300">
                Get Free Consultation <ArrowRight className="w-4 h-4" />
              </a>
              <a href="https://wa.me/919986742525" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#1EB755] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#25D366]/25">
                <MessageCircle className="w-4 h-4" /> WhatsApp Now
              </a>
              <a href="tel:+919986742525"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300">
                <Phone className="w-4 h-4" /> Call Now
              </a>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="hidden lg:block">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-[#0EA5E9]/10 max-w-lg mx-auto">
              {successTicket ? (
                <div className="text-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Ticket Submitted!</h3>
                    <p className="text-sm text-[#94A3B8]">We have received your service request.</p>
                  </div>
                  <div className="bg-[#0B1120]/80 border border-white/5 rounded-xl p-4 font-mono text-center">
                    <span className="text-xs text-white/50 block mb-1">YOUR TICKET NUMBER</span>
                    <span className="text-lg font-bold text-[#0EA5E9]">{successTicket}</span>
                  </div>
                  <button
                    onClick={() => setSuccessTicket('')}
                    className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Quick Service Request</h3>
                    <p className="text-xs text-[#94A3B8]">Request repair or assistance instantly</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-white/70 font-semibold mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh"
                        value={form.customer_name}
                        onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                        className="w-full bg-[#0B1120]/60 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:border-[#0EA5E9] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/70 font-semibold mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Phone number"
                        value={form.customer_phone}
                        onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                        className="w-full bg-[#0B1120]/60 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:border-[#0EA5E9] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/70 font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. ramesh@example.com"
                        value={form.customer_email}
                        onChange={e => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
                        className="w-full bg-[#0B1120]/60 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:border-[#0EA5E9] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/70 font-semibold mb-1">Customer Address</label>
                      <textarea
                        rows={1}
                        placeholder="e.g. 47A 1st Cross, Bengaluru"
                        value={form.customer_address}
                        onChange={e => setForm(prev => ({ ...prev, customer_address: e.target.value }))}
                        className="w-full bg-[#0B1120]/60 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:border-[#0EA5E9] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs text-white/70 font-semibold mb-1">Device / Service</label>
                        <select
                          required
                          value={form.device_type}
                          onChange={e => setForm(prev => ({ ...prev, device_type: e.target.value }))}
                          className="w-full bg-[#0B1120] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-[#0EA5E9] focus:outline-none transition-colors"
                        >
                          <option value="" disabled hidden>Select type</option>
                          {['Laptop with charger', 'Laptop without charger', 'Desktop', 'Printer', 'CCTV', 'Networking', 'Wi-Fi', 'Biometric', 'Server', 'Other'].map(opt => (
                            <option key={opt} value={opt} className="bg-[#0B1120]">{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/70 font-semibold mb-1">Issue Description *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Describe the issue you are facing..."
                        value={form.issue_description}
                        onChange={e => setForm(prev => ({ ...prev, issue_description: e.target.value }))}
                        className="w-full bg-[#0B1120]/60 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:border-[#0EA5E9] focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] hover:from-[#0F766E] hover:to-[#0284C7] text-white font-bold transition-all duration-300 shadow-md shadow-[#0EA5E9]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Service Request
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── 2. Trust Stats ─────────────────────────────────────────────────────────

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
        <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={staggerItem}
              className="backdrop-blur-xl bg-white/5 border border-[#0EA5E9]/20 rounded-2xl p-6 md:p-8 text-center hover:border-[#0EA5E9]/50 transition-all duration-300 shadow-lg shadow-[#0EA5E9]/5">
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

// ─── 3. Services ────────────────────────────────────────────────────────────

function ServicesSection() {
  const { services, loading } = useServices();
  const displayServices: Service[] = services.length > 0 ? services : FALLBACK_SERVICES;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? displayServices : displayServices.slice(0, 8);

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
          <>
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayed.map((service, i) => {
                const IconComponent = service.icon ? (ICON_MAP[service.icon] || SERVICE_ICONS[i % SERVICE_ICONS.length]) : SERVICE_ICONS[i % SERVICE_ICONS.length];
                return (
                  <motion.div key={service.id} variants={staggerItem}
                    whileHover={{ scale: 1.04, borderColor: 'rgba(14,165,233,0.5)' }}
                    className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/10 cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4 group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-[#0EA5E9]" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{service.title}</h3>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{service.short_description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
            {displayServices.length > 8 && (
              <div className="text-center mt-10">
                <button onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-[#0EA5E9]/30 transition-all duration-300">
                  {showAll ? 'Show Less' : `View All ${displayServices.length} Services`} <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-[-90deg]' : ''}`} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Section>
  );
}

// ─── 4. Why Choose Us ────────────────────────────────────────────────────────

function WhyChooseUsSection() {
  const features = [
    { icon: Zap, title: 'Same Day Service', description: 'Get your issues resolved the same day you call. Our rapid response team ensures minimal downtime.' },
    { icon: BadgePercent, title: 'Affordable Pricing', description: 'Competitive pricing without compromising quality. Transparent quotes with no hidden charges.' },
    { icon: Users, title: 'Expert Engineers', description: 'Certified professionals with years of experience in IT infrastructure and security systems.' },
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
            We deliver reliability, speed, and expertise that sets us apart
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div key={i} variants={staggerItem} whileHover={{ y: -4 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#0EA5E9]/30 transition-all duration-300 group">
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

// ─── 5. About / Company Story ────────────────────────────────────────────────

function AboutSection() {
  const { team, loading: teamLoading } = useTeam();
  const displayTeam: TeamMember[] = team.length > 0 ? team : FALLBACK_TEAM;
  const { logos, loading: logosLoading } = useClientLogos();
  const displayLogos: ClientLogo[] = logos.length > 0 ? logos : FALLBACK_CLIENT_LOGOS;

  return (
    <>
      <Section id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div variants={staggerContainer} className="space-y-6">
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium mb-4">
                  Our Story
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Building a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Secure Future</span> for Bangalore
                </h2>
              </motion.div>
              <motion.p variants={staggerItem} className="text-[#94A3B8] text-base leading-relaxed">
                Founded in Bangalore, Yantrabyte Solutions has been providing trusted IT and security solutions to businesses and homes across Karnataka. Our mission is to make technology accessible, reliable, and secure for everyone.
              </motion.p>
              <motion.p variants={staggerItem} className="text-[#94A3B8] text-base leading-relaxed">
                From our early days installing CCTV systems in local shops to deploying enterprise-grade firewalls and networking infrastructure for multinational corporations, our journey has been defined by a relentless commitment to quality and customer satisfaction.
              </motion.p>

              <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: Camera, label: '500+ CCTV Installations' },
                  { icon: Laptop, label: '1000+ Devices Serviced' },
                  { icon: Router, label: '200+ Networks Built' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-[#0EA5E9]/30 transition-all duration-300">
                      <Icon className="w-6 h-6 text-[#0EA5E9] mx-auto mb-2" />
                      <p className="text-white text-xs font-semibold">{item.label}</p>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            <motion.div variants={scaleIn} className="relative">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-[#0EA5E9]/10">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Target, title: 'Our Mission', desc: 'Democratize access to professional IT and security solutions.' },
                    { icon: Eye, title: 'Our Vision', desc: 'Become the most trusted IT services brand in South India.' },
                    { icon: Heart, title: 'Our Values', desc: 'Integrity, Excellence, and Customer-First in everything we do.' },
                    { icon: Award, title: 'Certifications', desc: 'ISO 9001, Google Partner, Microsoft Certified, TSSC.' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div key={i} whileHover={{ scale: 1.05 }}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:border-[#0EA5E9]/30 transition-all duration-300">
                        <Icon className="w-7 h-7 text-[#0EA5E9] mx-auto mb-3" />
                        <h3 className="text-white text-sm font-bold mb-1">{item.title}</h3>
                        <p className="text-[#64748B] text-xs leading-relaxed">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div><p className="text-white font-bold text-2xl">8+</p><p className="text-[#94A3B8] text-sm">Years of Excellence</p></div>
                  <div><p className="text-white font-bold text-2xl">50+</p><p className="text-[#94A3B8] text-sm">Expert Engineers</p></div>
                  <div><p className="text-white font-bold text-2xl">4.9</p><p className="text-[#94A3B8] text-sm">Google Rating</p></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Team */}
      <Section id="team" className="bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Team</span>
            </h2>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">The skilled professionals behind every successful project</p>
          </motion.div>

          {teamLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />))}
            </div>
          ) : (
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayTeam.map((member, i) => (
                <motion.div key={member.id} variants={staggerItem} whileHover={{ y: -8 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-[#0EA5E9]/40 transition-all duration-300 group">
                  <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center mb-5 shadow-lg shadow-[#0EA5E9]/20 group-hover:shadow-[#0EA5E9]/40 transition-shadow duration-300`}>
                    <span className="text-white font-bold text-2xl">{member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                  <p className="text-[#0EA5E9] text-sm font-medium mb-4">{member.role}</p>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">{member.bio}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </Section>

      {/* Client Logos */}
      <Section id="clients">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Leading Businesses</span>
            </h2>
          </motion.div>

          {!logosLoading && (
            <div className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0B1120] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0B1120] to-transparent z-10 pointer-events-none" />
              <div className="flex animate-marquee">
                {[...displayLogos, ...displayLogos].map((logo, i) => (
                  <div key={`${logo.id}-${i}`}
                    className="flex-shrink-0 mx-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-8 py-5 flex items-center justify-center hover:border-[#0EA5E9]/30 transition-all duration-300 min-w-[200px]">
                    <span className="text-white/60 font-semibold text-sm tracking-wide">{logo.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

// ─── 6. Industries ────────────────────────────────────────────────────────────

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
            {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/5" />))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {displayIndustries.map((industry, i) => {
              const IconComponent = industry.icon ? (ICON_MAP[industry.icon] || INDUSTRY_ICONS[i % INDUSTRY_ICONS.length]) : INDUSTRY_ICONS[i % INDUSTRY_ICONS.length];
              return (
                <motion.div key={industry.id} variants={staggerItem}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-[#0EA5E9]/30 transition-all duration-300 group">
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

// ─── 8. Testimonials ────────────────────────────────────────────────────────

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
    if (displayTestimonials.length > 0) { startAuto(); return stopAuto; }
  }, [displayTestimonials.length, startAuto, stopAuto]);

  const goTo = (idx: number) => { setCurrent(idx); stopAuto(); startAuto(); };

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
              <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <p className="text-white/90 text-lg leading-relaxed mb-6 italic">&ldquo;{t.content}&rdquo;</p>
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
          <div className="flex justify-center gap-2 mt-6">
            {displayTestimonials.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-[#0EA5E9] w-8' : 'bg-white/20 hover:bg-white/40'}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 9. Google Reviews ────────────────────────────────────────────────────────

function GoogleReviewsSection() {
  return (
    <Section id="reviews" className="bg-[#0F172A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What People Say on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Google</span>
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GOOGLE_REVIEWS.map((review, i) => (
            <motion.div key={review.id} variants={staggerItem}
              whileHover={{ y: -4, borderColor: 'rgba(14,165,233,0.4)' }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`w-4 h-4 ${si < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <span className="text-[#64748B] text-xs">{review.time}</span>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">{review.text}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">{review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{review.name}</p>
                  <p className="text-[#64748B] text-xs">{review.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 10. Process ────────────────────────────────────────────────────────────

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
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">A streamlined process that delivers results every time</p>
        </motion.div>

        <motion.div variants={staggerContainer} className="relative">
          <div className="hidden md:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#0EA5E9]/20 via-[#0EA5E9]/40 to-[#0EA5E9]/20" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i} variants={staggerItem} className="flex flex-col items-center text-center group">
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

// ─── 11. Blog ────────────────────────────────────────────────────────────────

function BlogSection() {
  const { posts, loading } = useBlogPosts();
  const displayPosts: BlogPost[] = posts.length > 0 ? posts : FALLBACK_POSTS;

  return (
    <Section id="blog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Blog & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Insights</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Expert tips, guides, and industry insights to help you make informed technology decisions
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPosts.slice(0, 3).map((post) => {
              const CategoryIcon = CATEGORY_ICONS[post.category] || Camera;
              const gradient = CATEGORY_GRADIENTS[post.category] || 'from-[#0EA5E9] to-[#38BDF8]';
              return (
                <motion.div key={post.id} variants={staggerItem}
                  whileHover={{ y: -6, borderColor: 'rgba(14,165,233,0.5)' }}
                  className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/10">
                  <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <CategoryIcon className="w-16 h-16 text-white/30 relative z-10" />
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-[#64748B] mb-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{post.published_at}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />5 min read</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-3 leading-snug group-hover:text-[#0EA5E9] transition-colors duration-300 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[#94A3B8] text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </Section>
  );
}

// ─── 12. FAQ ────────────────────────────────────────────────────────────────

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden hover:border-[#0EA5E9]/30 transition-colors duration-300">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left group">
        <span className="text-white font-medium pr-4">{faq.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0">
          <ChevronDown className="w-5 h-5 text-[#94A3B8] group-hover:text-[#0EA5E9] transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <div className="px-5 pb-5 text-[#94A3B8] text-sm leading-relaxed border-t border-white/5 pt-4">{faq.answer}</div>
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

  const filteredFaqs = activeCategory === 'All' ? displayFaqs : displayFaqs.filter(f => f.category === activeCategory);

  return (
    <Section id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Questions</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">Find answers to common questions about our services</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeCategory === cat ? 'bg-[#0EA5E9] text-white' : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white border border-white/10'
              }`}>
              {cat}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <motion.div key={faq.id} variants={staggerItem}>
                <FAQItem faq={faq} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Section>
  );
}

// ─── 13. Contact ────────────────────────────────────────────────────────────

function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: submitError } = await submitContact(formData);
      if (submitError) { setError('Something went wrong. Please try again.'); setSubmitting(false); return; }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClasses = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all duration-300';

  return (
    <Section id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get In <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Touch</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Fill out the form below and we will get back to you within 2 hours
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Phone, label: 'Phone', value: '+91-9986742525', link: 'tel:+919986742525' },
            { icon: Mail, label: 'Email', value: 'yantrabyte.solutions@gmail.com', link: 'mailto:yantrabyte.solutions@gmail.com' },
            { icon: MapPin, label: 'Address', value: '47A 1st Cross, Sainagar 2nd Stage, Bengaluru 560097', link: null },
            { icon: Clock, label: 'Business Hours', value: 'Mon-Sat 9AM-7PM, Emergency 24/7', link: null },
          ].map((item, i) => {
            const Icon = item.icon;
            const content = (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#0EA5E9]/30 transition-all duration-300 group h-full">
                <Icon className="w-6 h-6 text-[#0EA5E9] mb-3" />
                <h3 className="text-white font-bold text-sm mb-1">{item.label}</h3>
                <p className="text-[#94A3B8] text-sm">{item.value}</p>
              </div>
            );
            if (item.link) {
              return <motion.a key={i} href={item.link} variants={staggerItem} whileHover={{ y: -4 }} className="block">{content}</motion.a>;
            }
            return <motion.div key={i} variants={staggerItem} whileHover={{ y: -4 }}>{content}</motion.div>;
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div variants={fadeInUp}>
            {submitted ? (
              <div className="backdrop-blur-xl bg-white/5 border border-[#0EA5E9]/30 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[#0EA5E9]" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Message Sent!</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed max-w-sm">
                  Thank you for reaching out. Our team will get back to you within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name" className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className={inputClasses} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 99867 42525" className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Service Needed *</label>
                    <select name="service" value={formData.service} onChange={handleChange} required className={`${inputClasses} appearance-none`}>
                      <option value="" className="bg-[#0B1120]">Select a service</option>
                      {ALL_SERVICES_LIST.map(service => (
                        <option key={service} value={service} className="bg-[#0B1120]">{service}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Message *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} placeholder="Describe your requirements or issue..." className={`${inputClasses} resize-none`} />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}
                <button type="submit" disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" />Send Message</>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Map + Quick Actions */}
          <motion.div variants={scaleIn} className="flex flex-col gap-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex-1 min-h-[300px] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-[#0EA5E9]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Our Location</h3>
                  <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
                    47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097
                  </p>
                  <a href="https://maps.google.com/?q=Bangalore+Karnataka+India" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#0EA5E9] text-sm font-medium mt-3 hover:gap-2.5 transition-all duration-300">
                    Open in Google Maps <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <a href="https://wa.me/919986742525" target="_blank" rel="noopener noreferrer"
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[#25D366]/50 hover:bg-[#25D366]/5 transition-all duration-300 group">
                <MessageCircle className="w-6 h-6 text-[#25D366] mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white text-sm font-medium block">WhatsApp</span>
              </a>
              <a href="tel:+919986742525"
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[#0EA5E9]/50 hover:bg-[#0EA5E9]/5 transition-all duration-300 group">
                <Phone className="w-6 h-6 text-[#0EA5E9] mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white text-sm font-medium block">Call</span>
              </a>
              <a href="mailto:yantrabyte.solutions@gmail.com"
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/5 transition-all duration-300 group">
                <Mail className="w-6 h-6 text-[#38BDF8] mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white text-sm font-medium block">Email</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ─── 14. CTA Banner ────────────────────────────────────────────────────────

function CTABannerSection() {
  return (
    <Section className="!py-16 md:!py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={scaleIn}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1120] via-[#111827] to-[#0284C7] p-8 md:p-14 text-center">
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
              <a href="#contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-[#0B1120] font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg">
                Request Free Quote <ArrowRight className="w-4 h-4" />
              </a>
              <a href="tel:+919986742525"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300">
                <Phone className="w-4 h-4" /> Call Now
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 15. Emergency Banner ──────────────────────────────────────────────────

function EmergencyBanner() {
  return (
    <Section className="!py-0">
      <motion.div variants={fadeInUp} className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 py-10 md:py-14">
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
            <a href="tel:+919986742525" className="text-white font-mono text-lg md:text-xl font-bold hover:underline">+91 99867 42525</a>
            <a href="tel:+919986742525"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-red-600 font-bold hover:bg-white/90 transition-all duration-300 shadow-lg">
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
      <SEO 
        title="Yantrabyte Solutions | IT & Security Solutions in Bangalore" 
        description="Yantrabyte Solutions offers professional CCTV installation, laptop repair, desktop repair, networking, biometric systems, and smart security solutions in Bangalore."
      />
      <HeroSection />
      <TrustStatsSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <AboutSection />
      <IndustriesSection />
      <TestimonialsSection />
      <GoogleReviewsSection />
      <ProcessSection />
      <BlogSection />
      <CTABannerSection />
      <FAQSection />
      <ContactSection />
      <EmergencyBanner />
    </div>
  );
}
