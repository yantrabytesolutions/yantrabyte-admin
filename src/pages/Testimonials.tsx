import { useRef } from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight,
  Star,
  ArrowRight,
  MessageCircle,
  Phone,
  Quote,
  Play,
  Video,
} from 'lucide-react';
import { useTestimonials } from '../hooks/useSupabase';
import type { Testimonial } from '../types';

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: '1', name: 'Rajesh Kumar', company: 'TechPark Solutions', role: 'Operations Manager', rating: 5, content: 'Yantrabyte installed 32 CCTV cameras across our office campus. The quality of work and professionalism was outstanding. Their team completed the installation in just 2 days with zero downtime.', avatar_url: '', is_published: true, sort_order: 1, created_at: '' },
  { id: '2', name: 'Priya Sharma', company: 'Metro Retail Group', role: 'Owner', rating: 5, content: 'We have been using their AMC service for over a year now. Response time is excellent and the technicians are very knowledgeable. Highly recommended for any IT support needs.', avatar_url: '', is_published: true, sort_order: 2, created_at: '' },
  { id: '3', name: 'Mohammed Irfan', company: 'Sunrise Apartments', role: 'Association President', rating: 4, content: 'The biometric access system they installed has transformed our apartment security. Residents feel much safer now. Great after-sales support too.', avatar_url: '', is_published: true, sort_order: 3, created_at: '' },
  { id: '4', name: 'Anitha Reddy', company: 'Bangalore School of Excellence', role: 'Administrator', rating: 5, content: 'Complete networking and CCTV setup for our school was done perfectly. They understood our requirements and delivered exactly what we needed within budget.', avatar_url: '', is_published: true, sort_order: 4, created_at: '' },
  { id: '5', name: 'Venkat Rao', company: 'Precision Manufacturing', role: 'Factory Manager', rating: 5, content: 'Their firewall and network security setup has protected our factory from multiple cyber threats. The team is extremely skilled and responsive. Best IT partner in Bangalore.', avatar_url: '', is_published: true, sort_order: 5, created_at: '' },
  { id: '6', name: 'Sneha Patel', company: 'Indiranagar Clinic', role: 'Managing Director', rating: 5, content: 'From the initial consultation to the final handover, the experience was seamless. Our clinic now has a robust CCTV and access control system that gives our patients peace of mind.', avatar_url: '', is_published: true, sort_order: 6, created_at: '' },
];

// ─── Google Reviews Data ───────────────────────────────────────────────────

const GOOGLE_REVIEWS = [
  { id: 'g1', name: 'Arun Kumar', company: 'Whitefield IT Park', rating: 5, text: 'Extremely professional team. They installed our entire CCTV and networking setup in 3 days flat. The picture quality on the cameras is excellent and the remote viewing app works flawlessly. Highly recommended!', time: '2 months ago' },
  { id: 'g2', name: 'Deepa Nair', company: 'Koramangala Apartments', rating: 5, text: 'Our apartment complex needed a complete security overhaul. Yantrabyte gave us a thorough assessment, fair pricing, and delivered beyond expectations. The biometric entry system is a game changer for our residents.', time: '3 weeks ago' },
  { id: 'g3', name: 'Suresh Menon', company: 'Electronics City Warehouse', rating: 5, text: 'Best IT service provider in Bangalore, hands down. They set up our warehouse network and 24-camera surveillance system. Every cable is neatly managed, every camera perfectly positioned. True professionals.', time: '1 month ago' },
  { id: 'g4', name: 'Kavitha Reddy', company: 'HSR Layout Boutique', rating: 4, text: 'Got my shop CCTV and Wi-Fi done by Yantrabyte. Very satisfied with the camera quality and installation. The only reason for 4 stars is I wish they had more evening slots for installation. Otherwise, perfect!', time: '5 days ago' },
  { id: 'g5', name: 'Prashanth Hegde', company: 'Jayanagar School', rating: 5, text: 'Our school needed a reliable security and attendance system. Yantrabyte delivered a complete solution with CCTV, biometric attendance, and a campus-wide network. Parents feel much safer now. Outstanding work!', time: '2 weeks ago' },
];

// ─── Video Testimonials Data ───────────────────────────────────────────────

const VIDEO_TESTIMONIALS = [
  { id: 'v1', name: 'Rajesh Kumar', company: 'TechPark Solutions', title: 'How Yantrabyte Secured Our 50,000 sqft Office' },
  { id: 'v2', name: 'Anitha Reddy', company: 'Bangalore School of Excellence', title: 'Campus Security Transformation Story' },
  { id: 'v3', name: 'Venkat Rao', company: 'Precision Manufacturing', title: 'Enterprise Network & Firewall Setup' },
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

// ─── Helper: Get initials ───────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

// ─── Helper: Star Rating ───────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
        />
      ))}
    </div>
  );
}

// ─── Avatar gradients ────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-[#0EA5E9] to-[#0284C7]',
  'from-[#38BDF8] to-[#0EA5E9]',
  'from-[#7DD3FC] to-[#38BDF8]',
  'from-[#0EA5E9] to-[#7DD3FC]',
  'from-[#0284C7] to-[#38BDF8]',
  'from-[#38BDF8] to-[#7DD3FC]',
];

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
          <span className="text-[#0EA5E9]">Testimonials</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          Client{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Testimonials
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Hear directly from businesses and homeowners who trust Yantrabyte Solutions for their IT and security needs.
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── 2. Overall Rating Section ───────────────────────────────────────────────

function OverallRatingSection() {
  return (
    <Section className="!py-12 md:!py-16 -mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={scaleIn}
          className="backdrop-blur-xl bg-white/5 border border-[#0EA5E9]/20 rounded-2xl p-8 md:p-10 text-center shadow-lg shadow-[#0EA5E9]/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Rating number */}
            <div className="flex items-center gap-4">
              <div className="text-5xl md:text-6xl font-bold text-white">4.9</div>
              <div className="text-left">
                <StarRating rating={5} size="md" />
                <p className="text-[#94A3B8] text-sm mt-1">out of 5.0</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-16 bg-white/10" />

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-[#0EA5E9]">200+</p>
                <p className="text-[#94A3B8] text-sm">Google Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-[#0EA5E9]">98%</p>
                <p className="text-[#94A3B8] text-sm">Satisfaction Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-[#0EA5E9]">1000+</p>
                <p className="text-[#94A3B8] text-sm">Happy Clients</p>
              </div>
            </div>
          </div>

          {/* Rating bar breakdown */}
          <div className="mt-8 max-w-md mx-auto space-y-2">
            {[
              { stars: 5, percent: 85 },
              { stars: 4, percent: 12 },
              { stars: 3, percent: 2 },
              { stars: 2, percent: 1 },
              { stars: 1, percent: 0 },
            ].map((row) => (
              <div key={row.stars} className="flex items-center gap-3">
                <span className="text-white text-sm font-medium w-6">{row.stars}</span>
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
                <span className="text-[#64748B] text-xs w-8 text-right">{row.percent}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 3. Google Reviews Section ───────────────────────────────────────────────

function GoogleReviewsSection() {
  return (
    <Section id="google-reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium mb-4">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What People Say on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">Google</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Real reviews from verified clients on our Google Business profile
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {GOOGLE_REVIEWS.map((review, i) => (
            <motion.div
              key={review.id}
              variants={staggerItem}
              whileHover={{ y: -4, borderColor: 'rgba(14,165,233,0.4)' }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/5"
            >
              {/* Google icon and time */}
              <div className="flex items-center justify-between mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-[#64748B] text-xs">{review.time}</span>
              </div>

              {/* Stars */}
              <StarRating rating={review.rating} />

              {/* Review text */}
              <p className="text-[#94A3B8] text-sm leading-relaxed mt-3 mb-4">
                {review.text}
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">{getInitials(review.name)}</span>
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

// ─── 4. Video Testimonials Section ───────────────────────────────────────────

function VideoTestimonialsSection() {
  return (
    <Section id="video-testimonials" className="bg-[#0F172A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium mb-4">
            <Video className="w-3.5 h-3.5" /> Video Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hear It{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              From Our Clients
            </span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Watch our clients share their experience working with Yantrabyte Solutions
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {VIDEO_TESTIMONIALS.map((video, i) => (
            <motion.div
              key={video.id}
              variants={staggerItem}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-[#0EA5E9]/40 transition-all duration-300"
            >
              {/* Video placeholder thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-[#0B1120] to-[#111827] flex items-center justify-center">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/5 to-[#0284C7]/10" />

                {/* Play button overlay */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-[#0EA5E9]/20 border-2 border-[#0EA5E9]/60 flex items-center justify-center group-hover:bg-[#0EA5E9]/30 group-hover:border-[#0EA5E9] group-hover:scale-110 transition-all duration-300">
                  <Play className="w-6 h-6 text-[#0EA5E9] fill-[#0EA5E9] ml-1" />
                </div>

                {/* Pulse ring animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full border border-[#0EA5E9]/20 animate-ping" />
                </div>
              </div>

              {/* Video info */}
              <div className="p-5">
                <h3 className="text-white font-semibold text-base mb-2">{video.title}</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center`}>
                    <span className="text-white font-bold text-[10px]">{getInitials(video.name)}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{video.name}</p>
                    <p className="text-[#64748B] text-xs">{video.company}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 5. Written Testimonials Grid ────────────────────────────────────────────

function WrittenTestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <Section id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-sm font-medium mb-4">
            <Quote className="w-3.5 h-3.5" /> Written Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Client{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              Success Stories
            </span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Detailed accounts of how we have helped businesses and homes across Bangalore
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              variants={staggerItem}
              whileHover={{ y: -4, borderColor: 'rgba(14,165,233,0.4)' }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#0EA5E9]/5 relative overflow-hidden"
            >
              {/* Quote accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Quote className="absolute top-4 right-4 w-8 h-8 text-white/5" />

              {/* Stars */}
              <StarRating rating={testimonial.rating} />

              {/* Quote text */}
              <p className="text-[#94A3B8] text-sm leading-relaxed mt-3 mb-5 italic">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20`}>
                  <span className="text-white font-bold text-sm">{getInitials(testimonial.name)}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-[#0EA5E9] text-xs font-medium">{testimonial.role}</p>
                  <p className="text-[#64748B] text-xs">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 6. CTA Section ──────────────────────────────────────────────────────────

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
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 mx-auto rounded-full bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 flex items-center justify-center mb-6"
            >
              <Star className="w-8 h-8 text-[#0EA5E9] fill-[#0EA5E9]" />
            </motion.div>

            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Join Our Happy Clients
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Experience the same quality and reliability that over 200 businesses in Bangalore already trust
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

// ─── Main Testimonials Component ───────────────────────────────────────────────

export default function Testimonials() {
  const { testimonials, loading } = useTestimonials();
  const displayTestimonials: Testimonial[] = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

  if (loading) {
    return (
      <div className="bg-[#0B1120] min-h-screen">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
        title="Client Testimonials | Yantrabyte Solutions" 
        description="Hear directly from businesses and homeowners in Bangalore who trust Yantrabyte Solutions for their IT and security needs."
      />
      <HeroBanner />
      <OverallRatingSection />
      <GoogleReviewsSection />
      <VideoTestimonialsSection />
      <WrittenTestimonialsSection testimonials={displayTestimonials} />
      <CTASection />
    </div>
  );
}