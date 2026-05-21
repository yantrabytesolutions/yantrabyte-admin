import { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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
  CheckCircle,
  ChevronDown,
  Search,
  Settings,
  Wrench,
  TestTube2,
  Headphones,
  Star,
} from 'lucide-react';
import { useService, useServices } from '../hooks/useSupabase';
import type { Service } from '../types';

// ─── Fallback Service Data ──────────────────────────────────────────────────

const FALLBACK_SERVICE_DETAILS: Record<string, Service & { features: string[]; benefits: string[] }> = {
  'cctv-installation': {
    id: '1', title: 'CCTV Installation', slug: 'cctv-installation', short_description: 'Professional CCTV camera installation for homes and businesses with remote monitoring and night vision support.', full_description: 'Our CCTV installation service provides end-to-end surveillance solutions for residential and commercial properties across Bangalore. We work with leading brands including Hikvision, Dahua, CP Plus, and Bosch to deliver high-definition camera systems with remote viewing, motion detection, night vision, and cloud backup capabilities. Our certified technicians handle everything from site survey and camera placement planning to installation, configuration, and training.', icon: 'Camera',
    features: ['HD & 4K Camera Options', 'Remote Mobile Viewing', 'Night Vision & IR Cameras', 'Motion Detection Alerts', 'Cloud & Local Storage', 'Multi-Camera Dashboard', 'Weatherproof Outdoor Cameras', 'Free Site Survey'],
    benefits: ['24/7 surveillance for complete peace of mind', 'Deter theft and unauthorized access', 'Remote monitoring from anywhere in the world', 'Admissible evidence in case of incidents', 'Lower insurance premiums with certified installation', 'Scalable systems that grow with your needs'],
    meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 1, created_at: '', updated_at: '',
  },
  'laptop-repair': {
    id: '2', title: 'Laptop Repair', slug: 'laptop-repair', short_description: 'Expert laptop repair services for all brands including Dell, HP, Lenovo, Apple, and Asus with quick turnaround.', full_description: 'Our laptop repair service covers all major brands and models, handling everything from screen replacements and keyboard repairs to motherboard-level fixes and data recovery. Our certified technicians use genuine replacement parts and follow manufacturer guidelines to ensure the highest quality repairs. Most common issues are resolved same-day, and we offer a 90-day warranty on all repairs.', icon: 'Laptop',
    features: ['Screen Replacement', 'Keyboard & Touchpad Repair', 'Battery Replacement', 'Motherboard Repair', 'OS Reinstallation', 'Data Backup & Recovery', 'Virus & Malware Removal', 'Same-Day Service Available'],
    benefits: ['Certified technicians with 10+ years experience', 'Genuine replacement parts with warranty', 'Transparent pricing with no hidden charges', 'Same-day resolution for common issues', 'Free diagnosis before any repair work', '90-day warranty on all repairs'],
    meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 2, created_at: '', updated_at: '',
  },
  'desktop-repair': {
    id: '3', title: 'Desktop Repair', slug: 'desktop-repair', short_description: 'Comprehensive desktop computer repair, upgrade, and maintenance services for optimal performance.', full_description: 'From slow boot times to complete system failures, our desktop repair service addresses every hardware and software issue. We specialize in component-level diagnostics, hardware upgrades, and system optimization. Whether you have a gaming PC, office workstation, or all-in-one desktop, our team can restore it to peak performance.', icon: 'Monitor',
    features: ['Hardware Diagnostics', 'RAM & SSD Upgrades', 'Power Supply Replacement', 'Motherboard Repair', 'Graphics Card Issues', 'OS Installation & Updates', 'Driver Conflicts Resolution', 'Thermal Paste & Cooling'],
    benefits: ['Extend the life of your existing hardware', 'Save money with upgrades instead of replacements', 'Expert diagnosis eliminates guesswork', 'Quick turnaround with minimal downtime', 'Comprehensive post-repair testing', 'Maintenance tips for long-term performance'],
    meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 3, created_at: '', updated_at: '',
  },
  'networking': {
    id: '4', title: 'Networking Solutions', slug: 'networking', short_description: 'Complete LAN, WAN, and Wi-Fi networking solutions for offices, apartments, and commercial spaces.', full_description: 'Our networking solutions cover the full spectrum of connectivity needs, from structured cabling and switch configuration to enterprise-grade Wi-Fi deployment and VPN setup. We design networks that are fast, reliable, and secure, using equipment from Cisco, TP-Link, Netgear, and Ubiquiti. Every project includes detailed documentation, network diagrams, and post-installation support.', icon: 'Router',
    features: ['Structured Cabling', 'LAN & WAN Setup', 'Enterprise Wi-Fi', 'VPN Configuration', 'Network Security', 'Switch & Router Setup', 'Cable Management', 'Network Monitoring'],
    benefits: ['Seamless connectivity across your premises', 'Professional cable management for clean setup', 'Scalable architecture for future growth', 'Enhanced security with proper segmentation', 'Centralized monitoring and management', 'Documented network for easy troubleshooting'],
    meta_title: '', meta_description: '', is_featured: true, is_published: true, sort_order: 4, created_at: '', updated_at: '',
  },
  'printer-services': {
    id: '5', title: 'Printer Services', slug: 'printer-services', short_description: 'Printer installation, repair, and maintenance for HP, Canon, Brother, Epson, and all major brands.', full_description: 'We handle all printer-related needs including installation, configuration, troubleshooting, and regular maintenance. Our technicians are trained on laser printers, inkjet printers, multifunction devices, and large-format printers. We also set up network printing, scanning to email, and cloud print solutions for offices.', icon: 'Printer',
    features: ['Printer Setup & Configuration', 'Network Printing Setup', 'Cartridge & Toner Service', 'Paper Jam Resolution', 'Driver Installation', 'Scanner & Copier Setup', 'Preventive Maintenance', 'Multi-Function Device Setup'],
    benefits: ['Keep your printing infrastructure running smoothly', 'Reduce downtime with preventive maintenance', 'Network printing for office productivity', 'Expert troubleshooting for persistent issues', 'Cost-effective maintenance contracts', 'Same-day service for urgent issues'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 5, created_at: '', updated_at: '',
  },
  'amc-support': {
    id: '8', title: 'AMC Support', slug: 'amc-support', short_description: 'Annual maintenance contracts for ongoing IT support, preventive maintenance, and priority response.', full_description: 'Our Annual Maintenance Contracts provide comprehensive IT support with guaranteed response times, preventive maintenance schedules, and priority access to our engineering team. AMC clients enjoy unlimited remote support, discounted parts, and scheduled site visits to keep their IT infrastructure running at peak performance throughout the year.', icon: 'FileCheck',
    features: ['Unlimited Remote Support', 'Priority On-Site Response', 'Preventive Maintenance', 'Discounted Spare Parts', 'Scheduled Site Visits', 'Dedicated Account Manager', 'Monthly Health Reports', 'Emergency Support'],
    benefits: ['Predictable IT budgeting with fixed annual costs', 'Priority response with guaranteed SLAs', 'Prevent issues before they cause downtime', 'Dedicated team that knows your infrastructure', 'Significant savings on parts and emergency calls', 'Detailed monthly reports on system health'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 8, created_at: '', updated_at: '',
  },
  'wifi-solutions': {
    id: '9', title: 'Wi-Fi Solutions', slug: 'wifi-solutions', short_description: 'High-performance Wi-Fi coverage for offices, apartments, hotels, and commercial spaces with seamless roaming.', full_description: 'We design and deploy high-performance Wi-Fi networks using enterprise-grade access points from Ubiquiti, TP-Link Omada, and Ruckus. Our solutions include site surveys, heat mapping, access point placement, controller configuration, and seamless roaming setup to ensure consistent coverage across your entire premises.', icon: 'Wifi',
    features: ['Site Survey & Heat Mapping', 'Enterprise Access Points', 'Seamless Roaming', 'Guest Network Setup', 'Bandwidth Management', 'Cloud Controller', 'PoE Installation', 'Coverage Optimization'],
    benefits: ['Reliable connectivity in every corner', 'Support hundreds of simultaneous users', 'Guest networks with captive portal', 'Seamless roaming without disconnection', 'Centralized cloud management', 'Scalable to any premises size'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 9, created_at: '', updated_at: '',
  },
  'server-setup': {
    id: '10', title: 'Server Setup', slug: 'server-setup', short_description: 'On-premise and cloud server configuration, migration, and management for businesses of all sizes.', full_description: 'From small business file servers to enterprise application servers, we handle the complete lifecycle of server infrastructure. Our engineers configure, deploy, and manage Windows Server, Linux, and virtualized environments, ensuring high availability, automated backups, and security hardening for your critical business applications.', icon: 'Server',
    features: ['Windows Server Setup', 'Linux Server Configuration', 'Virtualization (VMware/Hyper-V)', 'Active Directory Setup', 'Automated Backup', 'Server Migration', 'Security Hardening', 'Performance Monitoring'],
    benefits: ['Centralized data management and access', 'High availability for business continuity', 'Automated backups prevent data loss', 'Scalable infrastructure for growth', 'Expert security hardening', 'Smooth migration with zero downtime'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 10, created_at: '', updated_at: '',
  },
  'data-recovery': {
    id: '11', title: 'Data Recovery', slug: 'data-recovery', short_description: 'Professional data recovery from failed hard drives, SSDs, RAID arrays, and corrupted storage devices.', full_description: 'When data loss strikes, our data recovery specialists can retrieve your files from failing, damaged, or corrupted storage devices. Using advanced tools and clean-room techniques, we recover data from HDDs, SSDs, RAID arrays, USB drives, and memory cards with a high success rate. We maintain strict confidentiality and provide a no-recovery, no-fee guarantee.', icon: 'HardDrive',
    features: ['HDD Recovery', 'SSD Recovery', 'RAID Array Recovery', 'USB & Flash Recovery', 'Corrupted Partition Fix', 'Deleted File Recovery', 'Clean Room Techniques', 'No Recovery No Fee'],
    benefits: ['Recover critical business data from failed drives', 'No recovery, no fee guarantee', 'Strict confidentiality maintained', 'High success rate across all media types', 'Emergency priority service available', 'Detailed recovery report provided'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 11, created_at: '', updated_at: '',
  },
  'cloud-solutions': {
    id: '12', title: 'Cloud Solutions', slug: 'cloud-solutions', short_description: 'Google Workspace, Microsoft 365, and AWS cloud setup, migration, and management for seamless operations.', full_description: 'Migrate your business to the cloud with our comprehensive cloud solutions service. We specialize in Google Workspace, Microsoft 365, and AWS deployments, handling migration, configuration, security policies, and ongoing management. Our cloud experts ensure a smooth transition with minimal disruption and maximum productivity gains.', icon: 'Cloud',
    features: ['Google Workspace Setup', 'Microsoft 365 Migration', 'AWS Deployment', 'Email Migration', 'Cloud Security Policies', 'Backup & DR Setup', 'Cost Optimization', 'Hybrid Cloud Setup'],
    benefits: ['Access your work from anywhere, anytime', 'Reduce on-premise infrastructure costs', 'Automatic updates and security patches', 'Enterprise-grade email and collaboration', 'Scalable resources that match your needs', 'Expert migration with zero data loss'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 12, created_at: '', updated_at: '',
  },
  'access-control': {
    id: '13', title: 'Access Control', slug: 'access-control', short_description: 'Smart access control systems with RFID, biometric, and mobile-based entry for offices and residential complexes.', full_description: 'Our access control solutions provide layered security for your premises using a combination of RFID cards, biometric readers, and mobile credentials. We install and manage standalone and networked access control systems, integrating them with CCTV, fire alarms, and building management systems for comprehensive security automation.', icon: 'Lock',
    features: ['RFID Card Systems', 'Biometric Readers', 'Mobile Credentials', 'Multi-Door Controllers', 'Time-Based Access Rules', 'CCTV Integration', 'Emergency Lockdown', 'Audit Trail & Reports'],
    benefits: ['Control who enters your premises and when', 'Detailed audit trail of all access events', 'Emergency lockdown capability', 'Integration with existing security systems', 'Eliminate key management hassle', 'Professional security compliance'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 13, created_at: '', updated_at: '',
  },
  'it-consulting': {
    id: '14', title: 'IT Consulting', slug: 'it-consulting', short_description: 'Strategic IT consulting to help businesses optimize technology spending and infrastructure planning.', full_description: 'Our IT consulting service helps businesses make informed technology decisions. We assess your current infrastructure, identify gaps and opportunities, and create a strategic roadmap that aligns IT investments with business goals. Whether you are setting up a new office, upgrading infrastructure, or planning for growth, our consultants provide actionable, budget-conscious recommendations.', icon: 'Zap',
    features: ['Infrastructure Assessment', 'Technology Roadmap', 'Budget Optimization', 'Vendor Selection', 'Office IT Setup Planning', 'Security Audit', 'Cloud Strategy', 'Compliance Review'],
    benefits: ['Align IT spending with business objectives', 'Avoid costly technology mistakes', 'Get expert guidance without hiring full-time CTO', 'Vendor-neutral recommendations', 'Scalable plans for future growth', 'Compliance with industry regulations'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 14, created_at: '', updated_at: '',
  },
  'hardware-upgrades': {
    id: '15', title: 'Hardware Upgrades', slug: 'hardware-upgrades', short_description: 'RAM, SSD, and component upgrades to extend the life and performance of your existing IT infrastructure.', full_description: 'Maximize the performance and lifespan of your existing computers with targeted hardware upgrades. Our technicians assess your current systems, recommend the most impactful upgrades, and install them with minimal downtime. From RAM and SSD upgrades to graphics cards and power supplies, we breathe new life into aging hardware.', icon: 'Wrench',
    features: ['RAM Upgrades', 'SSD Installation', 'Graphics Card Upgrades', 'Power Supply Replacement', 'Cooling System Upgrades', 'Motherboard Upgrades', 'Peripheral Additions', 'Performance Benchmarking'],
    benefits: ['Save 50-70% compared to buying new systems', 'SSD upgrades reduce boot time to seconds', 'Extend usable life of existing hardware', 'Minimal downtime during installation', 'Free assessment and upgrade recommendations', 'Warranty on all upgraded components'],
    meta_title: '', meta_description: '', is_featured: false, is_published: true, sort_order: 15, created_at: '', updated_at: '',
  },
};

// ─── FAQ Data per Service ────────────────────────────────────────────────────

const SERVICE_FAQS: Record<string, { question: string; answer: string }[]> = {
  'cctv-installation': [
    { question: 'How many cameras do I need for my property?', answer: 'The number depends on your property size, layout, and security requirements. We recommend a free site inspection where our experts map optimal camera positions and provide a comprehensive coverage plan.' },
    { question: 'Can I view footage remotely on my phone?', answer: 'Yes, all our installations support remote viewing through mobile apps. You can monitor your property from anywhere using your smartphone, tablet, or computer with an internet connection.' },
    { question: 'What is the warranty on CCTV installations?', answer: 'We provide a 1-year warranty on installation labor. Equipment warranties vary by manufacturer, typically 2-3 years for cameras and DVRs.' },
    { question: 'Do you offer night vision cameras?', answer: 'Yes, we offer a range of IR and starlight night vision cameras that provide clear footage even in complete darkness. Our experts will recommend the best option for your specific environment.' },
  ],
  'laptop-repair': [
    { question: 'How long does a typical laptop repair take?', answer: 'Most common issues like screen replacement, keyboard repair, and software issues are resolved the same day. Complex motherboard repairs may take 2-3 business days.' },
    { question: 'Do you use genuine replacement parts?', answer: 'Yes, we use only genuine or OEM-equivalent parts from authorized suppliers. Every replacement comes with its own warranty.' },
    { question: 'Is there a diagnosis fee?', answer: 'Basic diagnosis is free. If you proceed with the repair, the diagnosis fee is waived. Only advanced motherboard-level diagnostics may incur a nominal fee.' },
    { question: 'What brands do you repair?', answer: 'We repair all major brands including Dell, HP, Lenovo, Asus, Acer, Apple, MSI, and Toshiba for both Windows and Mac systems.' },
  ],
};

// ─── Process Steps per Service ───────────────────────────────────────────────

const PROCESS_STEPS = [
  { icon: Search, title: 'Consultation', description: 'Free consultation to understand your requirements and budget.' },
  { icon: Settings, title: 'Site Inspection', description: 'Our experts visit your location for a detailed assessment.' },
  { icon: Wrench, title: 'Installation', description: 'Professional installation by certified technicians.' },
  { icon: TestTube2, title: 'Testing', description: 'Thorough testing and quality checks before handover.' },
  { icon: Headphones, title: 'Support', description: 'Ongoing support and maintenance for complete peace of mind.' },
];

// ─── Icon Mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck, Wifi, Server, HardDrive, Cloud, Lock, Zap, Wrench,
};

const ALL_ICONS: React.ElementType[] = [Camera, Laptop, Monitor, Router, Printer, Fingerprint, Shield, FileCheck, Wifi, Server, HardDrive, Cloud, Lock, Zap, Wrench];

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

// ─── FAQ Item ────────────────────────────────────────────────────────────────

function FAQItem({ faq, isOpen, onToggle }: { faq: { question: string; answer: string }; isOpen: boolean; onToggle: () => void }) {
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

// ─── 1. Hero Banner ─────────────────────────────────────────────────────────

function HeroBanner({ title }: { title: string }) {
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
          <Link to="/services" className="hover:text-[#0EA5E9] transition-colors">Services</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#0EA5E9]">{title}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25 hover:shadow-[#0EA5E9]/40"
          >
            Get Free Quote <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/919986742525"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#1EB755] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#25D366]/25"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Now
          </a>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── 2. Service Overview ────────────────────────────────────────────────────

function ServiceOverview({ service, index }: { service: Service & { features: string[]; benefits: string[] }; index: number }) {
  const IconComponent = service.icon ? (ICON_MAP[service.icon] || ALL_ICONS[index % ALL_ICONS.length]) : ALL_ICONS[index % ALL_ICONS.length];

  return (
    <Section id="overview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Left: Icon & Title */}
          <motion.div variants={scaleIn} className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center sticky top-28">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mb-6">
                <IconComponent className="w-10 h-10 text-[#0EA5E9]" />
              </div>
              <h2 className="text-white font-bold text-2xl mb-2">{service.title}</h2>
              <p className="text-[#0EA5E9] text-sm font-medium mb-6">Professional Service</p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25"
                >
                  Get Free Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="tel:+919986742525"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 transition-all duration-300"
                >
                  <Phone className="w-4 h-4" /> Call Us
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right: Description */}
          <motion.div variants={staggerContainer} className="lg:col-span-2 space-y-6">
            <motion.div variants={fadeInUp}>
              <h3 className="text-2xl font-bold text-white mb-4">About This Service</h3>
              <p className="text-[#94A3B8] text-base leading-relaxed">{service.full_description}</p>
            </motion.div>

            {/* Features */}
            {service.features.length > 0 && (
              <motion.div variants={fadeInUp}>
                <h3 className="text-2xl font-bold text-white mb-6">What's Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      variants={staggerItem}
                      className="flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#0EA5E9]/30 transition-all duration-300"
                    >
                      <CheckCircle className="w-5 h-5 text-[#0EA5E9] shrink-0" />
                      <span className="text-white text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ─── 3. Benefits Section ────────────────────────────────────────────────────

function BenefitsSection({ benefits }: { benefits: string[] }) {
  if (!benefits.length) return null;

  return (
    <Section id="benefits" className="bg-[#0F172A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Key <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Benefits</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Why businesses and homeowners choose this service
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#0EA5E9]/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center mb-4 group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
                <Star className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{benefit}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 4. Process Steps ───────────────────────────────────────────────────────

function ProcessSection() {
  return (
    <Section id="process">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Process</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            A streamlined approach that delivers consistent results
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#0EA5E9]/20 via-[#0EA5E9]/40 to-[#0EA5E9]/20" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {PROCESS_STEPS.map((step, i) => {
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

// ─── 5. FAQ Section ──────────────────────────────────────────────────────────

function FAQSection({ slug }: { slug: string }) {
  const faqs = SERVICE_FAQS[slug] || [
    { question: 'How quickly can you start this service?', answer: 'We typically begin within 24-48 hours of your confirmation. For emergency requests, we offer same-day service across Bangalore.' },
    { question: 'Do you provide a warranty on this service?', answer: 'Yes, all our services come with a minimum 90-day warranty on labor. Equipment warranties vary by manufacturer and typically range from 1-3 years.' },
    { question: 'Is there a free consultation available?', answer: 'Absolutely! We offer free consultations and site visits for all our services. Our experts will assess your requirements and provide a detailed, no-obligation quotation.' },
    { question: 'What areas in Bangalore do you cover?', answer: 'We serve all major areas in Bangalore including Whitefield, Electronic City, Koramangala, HSR Layout, Marathahalli, and more. We also cover surrounding areas for larger projects.' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" className="bg-[#0F172A]/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Questions</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">Everything you need to know about this service</p>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={staggerItem}>
              <FAQItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 6. Related Services ─────────────────────────────────────────────────────

function RelatedServicesSection({ currentSlug, allServices }: { currentSlug: string; allServices: Service[] }) {
  const related = allServices.filter(s => s.slug !== currentSlug).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <Section id="related">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Related <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Services</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">Other solutions that might interest you</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {related.map((service, i) => {
            const IconComponent = service.icon ? (ICON_MAP[service.icon] || ALL_ICONS[i % ALL_ICONS.length]) : ALL_ICONS[i % ALL_ICONS.length];
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
      </div>
    </Section>
  );
}

// ─── 7. CTA Section (Service-Specific) ──────────────────────────────────────

function ServiceCTASection({ title }: { title: string }) {
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
              Get a Free Quote for {title}
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Our experts will assess your needs and provide a detailed, no-obligation quotation
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

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="bg-[#0B1120] min-h-screen">
      <div className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse mx-auto mb-6" />
          <div className="h-12 w-96 bg-white/5 rounded-lg animate-pulse mx-auto mb-6" />
          <div className="h-12 w-72 bg-white/5 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-32 w-full bg-white/5 rounded-lg animate-pulse" />
            <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ServiceDetail Component ──────────────────────────────────────────

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { service, loading } = useService(slug || '');
  const { services: allServices } = useServices();

  // Build fallback service from the detailed fallback map
  const fallbackService = FALLBACK_SERVICE_DETAILS[slug || ''];

  if (loading && !fallbackService) {
    return <LoadingState />;
  }

  const currentService: (Service & { features: string[]; benefits: string[] }) | null =
    service && service.features?.length > 0
      ? service as Service & { features: string[]; benefits: string[] }
      : fallbackService || null;

  if (!currentService) {
    return (
      <div className="bg-[#0B1120] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Service Not Found</h1>
          <p className="text-[#94A3B8] text-lg mb-8">The service you are looking for does not exist.</p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0EA5E9] text-white font-semibold hover:bg-[#0284C7] transition-all duration-300"
          >
            View All Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const displayAllServices = allServices.length > 0
    ? allServices
    : Object.values(FALLBACK_SERVICE_DETAILS).map(s => ({ ...s, features: [], benefits: [] }));

  // Find service index for icon mapping
  const serviceIndex = Object.keys(FALLBACK_SERVICE_DETAILS).indexOf(slug || '');

  return (
    <div className="bg-[#0B1120]">
      <SEO 
        title={`${currentService.title} | Yantrabyte Solutions`} 
        description={currentService.short_description || `Professional ${currentService.title} by Yantrabyte Solutions in Bangalore.`}
      />
      <HeroBanner title={currentService.title} />
      <ServiceOverview service={currentService} index={serviceIndex >= 0 ? serviceIndex : 0} />
      <BenefitsSection benefits={currentService.benefits || []} />
      <ProcessSection />
      <FAQSection slug={currentService.slug} />
      <RelatedServicesSection currentSlug={currentService.slug} allServices={displayAllServices} />
      <ServiceCTASection title={currentService.title} />
    </div>
  );
}
