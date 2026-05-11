import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { name: "Home", path: "/#hero" },
  { name: "About", path: "/#about" },
  { name: "Services", path: "/#services" },
  { name: "Industries", path: "/#industries" },
  { name: "Blog", path: "/#blog" },
  { name: "Contact", path: "/#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  }, [location]);

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

  const handleNavClick = (path: string) => {
    setMobileOpen(false);
    const hash = path.split("#")[1];
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
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
          <Link to="/" className="flex items-center gap-1 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              <span className="text-[#0EA5E9] transition-colors group-hover:text-[#38BDF8]">
                Yantrabyte
              </span>
              <span className="text-white"> Solutions</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.path);
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-300 hover:bg-white/5 hover:text-white"
              >
                {link.name}
              </a>
            ))}
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
            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); handleNavClick("/#contact"); }}
              className="rounded-lg bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition-all hover:bg-[#0284C7] hover:shadow-[#0EA5E9]/40 active:scale-[0.97]"
            >
              Get Quote
            </a>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-[#0B1120] shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <span className="text-lg font-bold">
                  <span className="text-[#0EA5E9]">Yantrabyte</span>
                  <span className="text-white"> Solutions</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="px-4 py-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.path);
                    }}
                    className="mt-1 block rounded-lg px-4 py-3 text-base font-medium transition-colors text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    {link.name}
                  </a>
                ))}
              </nav>

              <div className="border-t border-white/10 px-6 py-6 space-y-4">
                <a
                  href="tel:+919986742525"
                  className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#0EA5E9]"
                >
                  <Phone className="h-4 w-4" />
                  +91 99867 42525
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); handleNavClick("/#contact"); }}
                  className="block w-full rounded-lg bg-[#0EA5E9] px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition-all hover:bg-[#0284C7] active:scale-[0.97]"
                >
                  Get Quote
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
