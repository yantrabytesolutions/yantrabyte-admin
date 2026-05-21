import { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { submitContact } from '../hooks/useSupabase';

// ─── Service List ───────────────────────────────────────────────────────────

const ALL_SERVICES = [
  'CCTV Installation',
  'Laptop Repair',
  'Desktop Repair',
  'Networking Solutions',
  'Printer Services',
  'AMC Support',
  'Wi-Fi Solutions',
  'Server Setup',
  'Data Recovery',
  'Cloud Solutions',
  'Access Control',
  'IT Consulting',
  'Hardware Upgrades',
];

// ─── Contact FAQs ───────────────────────────────────────────────────────────

const CONTACT_FAQS = [
  {
    question: 'How quickly can you respond to a service request?',
    answer: 'We respond to all inquiries within 2 hours during business hours. For emergency IT issues, we offer 24/7 support with guaranteed under-2-hour response time within Bangalore city limits. AMC clients enjoy priority support with under-1-hour response time.',
  },
  {
    question: 'Do you offer free consultations and site visits?',
    answer: 'Yes, absolutely! We provide completely free consultations and site visits for all our services. Our experts will visit your location, assess your requirements, and provide a detailed, no-obligation quotation tailored to your needs and budget.',
  },
  {
    question: 'What areas in Bangalore do you serve?',
    answer: 'We serve all major areas in Bangalore including Whitefield, Electronic City, Koramangala, Indiranagar, HSR Layout, Marathahalli, BTM Layout, Jayanagar, and many more. We also cover surrounding areas like Mysore, Tumkur, and Mandya for larger projects.',
  },
  {
    question: 'What are your payment options?',
    answer: 'We accept all major payment methods including bank transfers, UPI, credit/debit cards, and cash. For larger projects, we offer flexible payment plans with milestone-based billing. All invoices include GST compliance documentation.',
  },
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
          <span className="text-[#0EA5E9]">Contact Us</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
        >
          Contact{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
            Us
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Get in touch with our team for a free consultation, site visit, or support request. We are here to help you find the right solution.
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
    </section>
  );
}

// ─── 2. Contact Info Cards ───────────────────────────────────────────────────

function ContactInfoSection() {
  const contactInfo = [
    {
      icon: Phone,
      label: 'Phone',
      value: '+91-9986742525',
      link: 'tel:+919986742525',
      color: 'from-[#0EA5E9] to-[#0284C7]',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'yantrabyte.solutions@gmail.com',
      link: 'mailto:yantrabyte.solutions@gmail.com',
      color: 'from-[#38BDF8] to-[#0EA5E9]',
    },
    {
      icon: MapPin,
      label: 'Address',
      value: '47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097',
      link: null,
      color: 'from-[#0EA5E9] to-[#7DD3FC]',
    },
    {
      icon: Clock,
      label: 'Business Hours',
      value: 'Mon-Sat 9AM-7PM, Emergency 24/7',
      link: null,
      color: 'from-[#0284C7] to-[#38BDF8]',
    },
  ];

  return (
    <Section id="contact-info" className="!py-12 md:!py-16 -mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {contactInfo.map((item, i) => {
            const Icon = item.icon;
            const content = (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#0EA5E9]/30 transition-all duration-300 group h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-[#0EA5E9]/20 transition-all duration-300`}
                  style={{ background: `linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))` }}
                >
                  <Icon className="w-6 h-6 text-[#0EA5E9]" />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{item.label}</h3>
                <p className="text-[#94A3B8] text-sm">{item.value}</p>
              </div>
            );

            if (item.link) {
              return (
                <motion.a key={i} href={item.link} variants={staggerItem} whileHover={{ y: -4 }} className="block">
                  {content}
                </motion.a>
              );
            }
            return (
              <motion.div key={i} variants={staggerItem} whileHover={{ y: -4 }}>
                {content}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}

// ─── 3. Contact Form + Map ──────────────────────────────────────────────────

function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { error: submitError } = await submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        message: formData.message,
      });

      if (submitError) {
        setError('Something went wrong. Please try again or contact us directly.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClasses = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all duration-300';

  return (
    <Section id="contact-form">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Send Us a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              Message
            </span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Fill out the form below and we will get back to you within 2 hours
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div variants={fadeInUp}>
            {submitted ? (
              <div className="backdrop-blur-xl bg-white/5 border border-[#0EA5E9]/30 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[#0EA5E9]" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Message Sent!</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed max-w-sm">
                  Thank you for reaching out. Our team will get back to you within 2 hours during business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 99867 42525"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Service Needed *</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className={`${inputClasses} appearance-none`}
                    >
                      <option value="" className="bg-[#0B1120]">Select a service</option>
                      {ALL_SERVICES.map(service => (
                        <option key={service} value={service} className="bg-[#0B1120]">{service}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Describe your requirements or issue..."
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Google Maps Placeholder */}
          <motion.div variants={scaleIn} className="flex flex-col gap-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex-1 min-h-[400px] relative">
              {/* Map placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-[#0EA5E9]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Google Maps</h3>
                  <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
                    Yantrabyte Solutions, 47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097
                  </p>
                  <a
                    href="https://maps.google.com/?q=Bangalore+Karnataka+India"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#0EA5E9] text-sm font-medium mt-3 hover:gap-2.5 transition-all duration-300"
                  >
                    Open in Google Maps <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Grid overlay for map aesthetic */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }} />
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <a
                href="https://wa.me/919986742525"
                target="_blank"
                rel="noopener noreferrer"
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[#25D366]/50 hover:bg-[#25D366]/5 transition-all duration-300 group"
              >
                <MessageCircle className="w-6 h-6 text-[#25D366] mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white text-sm font-medium block">WhatsApp</span>
              </a>
              <a
                href="tel:+919986742525"
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[#0EA5E9]/50 hover:bg-[#0EA5E9]/5 transition-all duration-300 group"
              >
                <Phone className="w-6 h-6 text-[#0EA5E9] mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white text-sm font-medium block">Call</span>
              </a>
              <a
                href="mailto:yantrabyte.solutions@gmail.com"
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/5 transition-all duration-300 group"
              >
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

// ─── 4. FAQ Section ─────────────────────────────────────────────────────────

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

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" className="bg-[#0F172A]/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              Questions
            </span>
          </h2>
          <p className="text-[#94A3B8] text-lg">Common questions about contacting us and our services</p>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {CONTACT_FAQS.map((faq, i) => (
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

// ─── 5. CTA Section ──────────────────────────────────────────────────────────

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
              Ready to Get Started?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              Our team is standing by to help you find the perfect IT and security solution
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

// ─── Main Contact Component ─────────────────────────────────────────────────

export default function Contact() {
  return (
    <div className="bg-[#0B1120]">
      <SEO 
        title="Contact Us | Yantrabyte Solutions" 
        description="Get in touch with Yantrabyte Solutions for a free consultation, site visit, or support request for your IT and security needs in Bangalore."
      />
      <HeroBanner />
      <ContactInfoSection />
      <ContactFormSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
