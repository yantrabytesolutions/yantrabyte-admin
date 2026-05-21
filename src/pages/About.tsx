import { useState, useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ChevronRight,
  Shield,
  Eye,
  Heart,
  Award,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Phone,
  Camera,
  Laptop,
  Router,
  Target,
  Star,
} from 'lucide-react';
import { useTeam, useClientLogos, useGallery } from '../hooks/useSupabase';
import type { TeamMember, ClientLogo, GalleryImage } from '../types';

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_TEAM: TeamMember[] = [
  { id: '1', name: 'Arjun Mehta', role: 'CEO & Founder', bio: 'With over 15 years in IT infrastructure and security, Arjun founded Yantrabyte to bring enterprise-grade solutions to businesses of every size across Karnataka.', image_url: '', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Kavitha Rao', role: 'CTO', bio: 'Kavitha leads our technology strategy, bringing deep expertise in cybersecurity, networking, and cloud infrastructure from her tenure at leading tech firms.', image_url: '', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Ramesh Iyer', role: 'Head of Operations', bio: 'Ramesh ensures seamless project delivery and after-sales support, drawing on a decade of experience managing large-scale IT deployments across South India.', image_url: '', is_published: true, sort_order: 3, created_at: '' },
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

const FALLBACK_GALLERY: GalleryImage[] = [
  { id: '1', title: 'Office CCTV Installation', before_url: '', after_url: '', category: 'Security', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', title: 'Server Room Networking', before_url: '', after_url: '', category: 'Networking', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', title: 'Biometric Access System', before_url: '', after_url: '', category: 'Security', is_published: true, sort_order: 3, created_at: '' },
];

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
          <span className="text-[#0EA5E9]">About Us</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          About{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Yantrabyte Solutions
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Bangalore's trusted IT and security partner, delivering reliable technology solutions to businesses and homes across Karnataka since 2015.
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── 2. Company Story ────────────────────────────────────────────────────────

function CompanyStorySection() {
  return (
    <Section id="story">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div variants={staggerContainer} className="space-y-6">
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium mb-4">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Building a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
                  Secure Future
                </span>{' '}
                for Bangalore
              </h2>
            </motion.div>

            <motion.p variants={staggerItem} className="text-[#94A3B8] text-base leading-relaxed">
              Founded in Bangalore, Yantrabyte Solutions has been providing trusted IT and security solutions to businesses and homes across Karnataka. Our mission is to make technology accessible, reliable, and secure for everyone. What started as a small team of passionate engineers has grown into one of the city's most dependable IT service providers, serving over 1,000 clients across diverse industries.
            </motion.p>

            <motion.p variants={staggerItem} className="text-[#94A3B8] text-base leading-relaxed">
              From our early days installing CCTV systems in local shops to deploying enterprise-grade firewalls and networking infrastructure for multinational corporations, our journey has been defined by a relentless commitment to quality and customer satisfaction. We believe that every business, regardless of size, deserves access to world-class technology and the peace of mind that comes with knowing their digital and physical assets are fully protected.
            </motion.p>

            <motion.p variants={staggerItem} className="text-[#94A3B8] text-base leading-relaxed">
              Our team of certified engineers and technicians brings together decades of combined experience across cybersecurity, networking, hardware repair, and smart automation. We partner with globally recognized brands including Hikvision, Dell, Cisco, and Fortinet to deliver solutions that meet the highest standards of performance and reliability. Every installation is backed by rigorous testing, comprehensive documentation, and our signature after-sales support.
            </motion.p>

            <motion.p variants={staggerItem} className="text-[#94A3B8] text-base leading-relaxed">
              As Bangalore continues to grow as India's technology capital, Yantrabyte Solutions grows alongside it, constantly evolving our service offerings and investing in the latest tools and training. We are proud to be a locally rooted company that understands the unique challenges faced by businesses in this dynamic city, and we remain dedicated to providing the personalized attention and rapid response that larger, national firms simply cannot match.
            </motion.p>
          </motion.div>

          {/* Right: Visual element */}
          <motion.div variants={scaleIn} className="relative">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-[#0EA5E9]/10">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Camera, label: '500+ CCTV Installations', color: '#0EA5E9' },
                  { icon: Laptop, label: '1000+ Devices Serviced', color: '#38BDF8' },
                  { icon: Router, label: '200+ Networks Built', color: '#0EA5E9' },
                  { icon: Shield, label: '99.9% Uptime SLA', color: '#38BDF8' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:border-[#0EA5E9]/30 transition-all duration-300"
                    >
                      <Icon className="w-8 h-8 text-[#0EA5E9] mx-auto mb-3" />
                      <p className="text-white text-sm font-semibold">{item.label}</p>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-2xl">8+</p>
                  <p className="text-[#94A3B8] text-sm">Years of Excellence</p>
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">50+</p>
                  <p className="text-[#94A3B8] text-sm">Expert Engineers</p>
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">4.9</p>
                  <p className="text-[#94A3B8] text-sm">Google Rating</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ─── 3. Mission, Vision, Values ──────────────────────────────────────────────

function MissionVisionValuesSection() {
  const items = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To democratize access to professional IT and security solutions, ensuring every business and home in Karnataka can leverage technology that is reliable, affordable, and future-ready. We bridge the gap between complex enterprise technology and the everyday needs of our clients.',
      gradient: 'from-[#0EA5E9] to-[#0284C7]',
    },
    {
      icon: Eye,
      title: 'Our Vision',
      description: 'To become the most trusted IT services brand in South India, recognized for our unwavering commitment to quality, innovation, and customer success. We envision a future where technology empowers every organization to operate without fear of security threats or infrastructure failure.',
      gradient: 'from-[#38BDF8] to-[#0EA5E9]',
    },
    {
      icon: Heart,
      title: 'Our Values',
      description: 'Integrity, Excellence, and Customer-First define everything we do. We believe in transparent pricing, honest recommendations, and going the extra mile. Our values drive us to treat every project, whether a single laptop repair or a full campus deployment, with the same dedication.',
      gradient: 'from-[#0EA5E9] to-[#7DD3FC]',
    },
  ];

  return (
    <Section id="mission" className="bg-[#0F172A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Drives Us</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            The principles and purpose behind every solution we deliver
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                whileHover={{ y: -8, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#0EA5E9]/40 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Gradient accent top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient}`} />

                <div className="w-14 h-14 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center mb-6 group-hover:bg-[#0EA5E9]/20 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-[#0EA5E9]" />
                </div>
                <h3 className="text-white font-bold text-xl mb-4">{item.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 4. Team Section ─────────────────────────────────────────────────────────

function TeamSection() {
  const { team, loading } = useTeam();
  const displayTeam: TeamMember[] = team.length > 0 ? team : FALLBACK_TEAM;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const gradients = [
    'from-[#0EA5E9] to-[#0284C7]',
    'from-[#38BDF8] to-[#0EA5E9]',
    'from-[#7DD3FC] to-[#38BDF8]',
    'from-[#0EA5E9] to-[#7DD3FC]',
  ];

  return (
    <Section id="team">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Team</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            The skilled professionals behind every successful project
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayTeam.map((member, i) => (
              <motion.div
                key={member.id}
                variants={staggerItem}
                whileHover={{ y: -8 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-[#0EA5E9]/40 transition-all duration-300 group"
              >
                {/* Avatar with gradient circle */}
                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center mb-5 shadow-lg shadow-[#0EA5E9]/20 group-hover:shadow-[#0EA5E9]/40 transition-shadow duration-300`}>
                  <span className="text-white font-bold text-2xl">{getInitials(member.name)}</span>
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
  );
}

// ─── 5. Certifications Section ───────────────────────────────────────────────

function CertificationsSection() {
  const certifications = [
    { name: 'ISO 9001', description: 'Quality Management System', icon: Award },
    { name: 'Google Partner', description: 'Certified Google Cloud Partner', icon: Star },
    { name: 'Microsoft Certified', description: 'Microsoft Solutions Partner', icon: CheckCircle },
    { name: 'TSSC Certified', description: 'Telecom Sector Skill Council', icon: Shield },
  ];

  return (
    <Section id="certifications" className="bg-[#0F172A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Certifications</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Industry-recognized certifications that validate our commitment to quality and excellence
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {certifications.map((cert, i) => {
            const Icon = cert.icon;
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                whileHover={{ scale: 1.05 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-[#0EA5E9]/40 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Badge glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#0EA5E9]/10 rounded-full blur-[40px] group-hover:bg-[#0EA5E9]/20 transition-colors duration-300" />

                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#0EA5E9]/20 to-[#0EA5E9]/5 border border-[#0EA5E9]/30 flex items-center justify-center mb-4 group-hover:border-[#0EA5E9]/60 transition-all duration-300">
                    <Icon className="w-7 h-7 text-[#0EA5E9]" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">{cert.name}</h3>
                  <p className="text-[#64748B] text-xs">{cert.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 6. Client Logos Marquee ────────────────────────────────────────────────

function ClientLogosSection() {
  const { logos, loading } = useClientLogos();
  const displayLogos: ClientLogo[] = logos.length > 0 ? logos : FALLBACK_CLIENT_LOGOS;

  return (
    <Section id="clients">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Leading Businesses</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Partnering with organizations across industries
          </p>
        </motion.div>

        {loading ? (
          <div className="flex gap-6 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0B1120] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0B1120] to-transparent z-10 pointer-events-none" />

            {/* Marquee track */}
            <div className="flex animate-marquee">
              {[...displayLogos, ...displayLogos].map((logo, i) => (
                <div
                  key={`${logo.id}-${i}`}
                  className="flex-shrink-0 mx-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-8 py-5 flex items-center justify-center hover:border-[#0EA5E9]/30 transition-all duration-300 min-w-[200px]"
                >
                  <span className="text-white/60 font-semibold text-sm tracking-wide">{logo.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── 7. Gallery Section (Before/After) ───────────────────────────────────────

function GallerySection() {
  const { gallery, loading } = useGallery();
  const displayGallery: GalleryImage[] = gallery.length > 0 ? gallery : FALLBACK_GALLERY;
  const [activeIndex, setActiveIndex] = useState(0);

  const beforeColors = [
    'from-red-900/40 to-red-950/60',
    'from-orange-900/40 to-orange-950/60',
    'from-amber-900/40 to-amber-950/60',
  ];

  const afterColors = [
    'from-[#0EA5E9]/20 to-[#0284C7]/30',
    'from-emerald-900/30 to-emerald-950/40',
    'from-[#0EA5E9]/20 to-[#38BDF8]/30',
  ];

  return (
    <Section id="gallery" className="bg-[#0F172A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Work</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            See the transformation our installations bring to every space
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <>
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {displayGallery.map((item, i) => (
                <motion.div
                  key={item.id}
                  variants={staggerItem}
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#0EA5E9]/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setActiveIndex(i)}
                >
                  {/* Before / After split */}
                  <div className="relative h-48 flex">
                    {/* Before */}
                    <div className={`w-1/2 bg-gradient-to-br ${beforeColors[i % beforeColors.length]} flex items-center justify-center border-r border-white/10 relative`}>
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-red-400/60 mx-auto mb-2" />
                        <span className="text-xs font-medium text-red-300/60 uppercase tracking-wider">Before</span>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-red-500/20 text-red-300 text-[10px] font-bold uppercase">Before</div>
                    </div>
                    {/* After */}
                    <div className={`w-1/2 bg-gradient-to-br ${afterColors[i % afterColors.length]} flex items-center justify-center relative`}>
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-[#0EA5E9]/60 mx-auto mb-2" />
                        <span className="text-xs font-medium text-[#0EA5E9]/60 uppercase tracking-wider">After</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-[#0EA5E9]/20 text-[#0EA5E9] text-[10px] font-bold uppercase">After</div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-white font-semibold text-base mb-1">{item.title}</h3>
                    <span className="text-[#0EA5E9] text-xs font-medium">{item.category}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Expanded view */}
            <AnimatePresence>
              {displayGallery[activeIndex] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
                >
                  <p className="text-[#94A3B8] text-sm">
                    <span className="text-[#0EA5E9] font-semibold">{displayGallery[activeIndex].title}</span> — Professional installation with meticulous cable management and clean setup.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </Section>
  );
}

// ─── 8. CTA Banner ──────────────────────────────────────────────────────────

function CTABanner() {
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
              Ready to Secure Your Business?
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

// ─── Main About Component ───────────────────────────────────────────────────

export default function About() {
  return (
    <div className="bg-[#0B1120]">
      <SEO 
        title="About Us | Yantrabyte Solutions" 
        description="Learn about Yantrabyte Solutions, Bangalore's trusted IT & Security partner providing professional services since 2018."
      />
      <HeroBanner />
      <CompanyStorySection />
      <MissionVisionValuesSection />
      <TeamSection />
      <CertificationsSection />
      <ClientLogosSection />
      <GallerySection />
      <CTABanner />
    </div>
  );
}
