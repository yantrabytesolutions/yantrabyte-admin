import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone } from "lucide-react";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  {
    name: "Services",
    path: "/services",
    dropdown: [
      { name: "CCTV Installation", path: "/services/cctv-installation" },
      { name: "Laptop Repair", path: "/services/laptop-repair" },
      { name: "Desktop Repair", path: "/services/desktop-repair" },
      { name: "Networking", path: "/services/networking" },
      { name: "Printer Services", path: "/services/printer-services" },
      { name: "AMC Support", path: "/services/amc-support" },
      { name: "View All Services", path: "/services", isHighlight: true },
    ],
  },
  { name: "Products", path: "/products" },
  { name: "Industries", path: "/industries" },
  { name: "Blog", path: "/blog" },
  { name: "Contact", path: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleDropdownEnter = () => {
    if (dropdownTimeout.current) {
      clearTimeout(dropdownTimeout.current);
      dropdownTimeout.current = null;
    }
    setServicesOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setServicesOpen(false);
    }, 150);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B1120]/95 backdrop-blur-xl shadow-lg shadow-black/20"
          : "bg-[#0B1120]/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group">
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              <span className="text-[#0EA5E9] transition-colors group-hover:text-[#38BDF8]">
                Yantrabyte
              </span>
              <span className="text-white"> Solutions</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    to={link.path}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      location.pathname.startsWith(link.path)
                        ? "text-[#0EA5E9]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.name}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        servicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  {/* Services Dropdown */}
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-1/2 top-full mt-1 w-64 -translate-x-1/4 overflow-hidden rounded-xl border border-white/10 bg-[#0F172A]/95 backdrop-blur-xl shadow-2xl shadow-black/40"
                        onMouseEnter={handleDropdownEnter}
                        onMouseLeave={handleDropdownLeave}
                      >
                        <div className="py-2">
                          {link.dropdown.map((item) => (
                            <Link
                              key={item.name}
                              to={item.path}
                              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                                item.isHighlight
                                  ? "border-t border-white/10 mt-1 pt-3 font-semibold text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                                  : "text-gray-300 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {item.name}
                              {item.isHighlight && (
                                <ArrowRight className="ml-auto h-3.5 w-3.5" />
                              )}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "text-[#0EA5E9]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="tel:+919986742525"
              className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden xl:inline">+91 99867 42525</span>
            </a>
            <Link
              to="/contact"
              className="rounded-lg bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition-all hover:bg-[#0284C7] hover:shadow-[#0EA5E9]/40 active:scale-[0.97]"
            >
              Get Quote
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-[#0B1120] shadow-2xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <Link to="/" className="flex items-center gap-1" onClick={() => setMobileOpen(false)}>
                  <span className="text-lg font-bold">
                    <span className="text-[#0EA5E9]">Yantrabyte</span>
                    <span className="text-white"> Solutions</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Navigation */}
              <nav className="px-4 py-4">
                {navLinks.map((link, index) =>
                  link.dropdown ? (
                    <div key={link.name} className="mt-1">
                      <button
                        onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                        className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-base font-medium transition-colors ${
                          location.pathname.startsWith(link.path)
                            ? "bg-[#0EA5E9]/10 text-[#0EA5E9]"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {link.name}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            mobileServicesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {mobileServicesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-3 border-l border-white/10 pl-3 py-1">
                              {link.dropdown.map((item) => (
                                <Link
                                  key={item.name}
                                  to={item.path}
                                  onClick={() => setMobileOpen(false)}
                                  className={`block rounded-lg px-4 py-2.5 text-sm transition-colors ${
                                    item.isHighlight
                                      ? "font-semibold text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={`mt-1 block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        location.pathname === link.path
                          ? "bg-[#0EA5E9]/10 text-[#0EA5E9]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                )}
              </nav>

              {/* Drawer Footer */}
              <div className="border-t border-white/10 px-6 py-6 space-y-4">
                <a
                  href="tel:+919986742525"
                  className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                >
                  <Phone className="h-4 w-4" />
                  +91 99867 42525
                </a>
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full rounded-lg bg-[#0EA5E9] px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition-all hover:bg-[#0284C7] active:scale-[0.97]"
                >
                  Get Quote
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

/* Small helper icon for "View All Services" link */
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
