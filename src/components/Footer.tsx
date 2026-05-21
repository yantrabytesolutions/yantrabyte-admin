import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ArrowRight,
} from "lucide-react";

const quickLinks = [
  { name: "Home", path: "/#hero" },
  { name: "About Us", path: "/#about" },
  { name: "Services", path: "/#services" },
  { name: "Blog", path: "/#blog" },
  { name: "Contact", path: "/#contact" },
];

const serviceLinks = [
  { name: "CCTV Installation", path: "/#services" },
  { name: "Laptop Repair", path: "/#services" },
  { name: "Networking", path: "/#services" },
  { name: "AMC Support", path: "/#services" },
];

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/yantrabyte" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/yantrabyte" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/yantrabyte" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/yantrabyte" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#0B1120] text-gray-300">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20"
        >
          {/* Company Info */}
          <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-[#0EA5E9]">Yantrabyte</span>
                <span className="text-white"> Solutions</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Smart Technology. Secure Future.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Bangalore's trusted IT services partner delivering cutting-edge security,
              infrastructure, and support solutions for businesses of all sizes.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-all hover:border-[#0EA5E9]/50 hover:bg-[#0EA5E9]/10 hover:text-[#0EA5E9]"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Services
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info + Newsletter */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0EA5E9]" />
                    <span>
                      47A 1st Cross, Sainagar 2nd Stage,
                      <br />
                      2nd Main Rd, Vidyaranyapura Post,
                      <br />
                      Chikkabettahalli, Bengaluru 560097
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919986742525"
                    className="flex items-center gap-3 text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-[#0EA5E9]" />
                    +91 99867 42525
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:yantrabyte.solutions@gmail.com"
                    className="flex items-center gap-3 text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-[#0EA5E9]" />
                    yantrabyte.solutions@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
                Newsletter
              </h3>
              <p className="mb-3 text-xs text-gray-400">
                Stay updated with the latest in IT solutions and offers.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/30"
                />
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center rounded-lg bg-[#0EA5E9] px-3.5 text-white shadow-lg shadow-[#0EA5E9]/20 transition-all hover:bg-[#0284C7] active:scale-[0.97]"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              {subscribed && (
                <p className="mt-2 text-xs font-medium text-[#0EA5E9]">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Yantrabyte Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link to="/privacy" className="transition-colors hover:text-[#0EA5E9]">
              Privacy Policy
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/terms" className="transition-colors hover:text-[#0EA5E9]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* WhatsApp CTA is now handled by FloatingButtons component */}
    </footer>
  );
}
