import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";

export default function FloatingButtons() {
  const [whatsappHovered, setWhatsappHovered] = useState(false);
  const [callHovered, setCallHovered] = useState(false);

  return (
    <>
      {/* WhatsApp Floating Button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Tooltip */}
        <AnimatePresence>
          {whatsappHovered && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none whitespace-nowrap rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white shadow-lg"
            >
              Chat on WhatsApp
            </motion.span>
          )}
        </AnimatePresence>

        <a
          href="https://wa.me/919986742525?text=Hi%20Yantrabyte%2C%20I%20need%20IT%20support"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          onMouseEnter={() => setWhatsappHovered(true)}
          onMouseLeave={() => setWhatsappHovered(false)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/30 transition-all hover:scale-110 hover:shadow-[#25D366]/50 active:scale-95"
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-[ping_1.5s_ease-out_infinite] opacity-30" />
          <MessageCircle className="relative h-6 w-6" />
        </a>
      </motion.div>

      {/* Call Floating Button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-3"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <a
          href="tel:+919986742525"
          aria-label="Call us"
          onMouseEnter={() => setCallHovered(true)}
          onMouseLeave={() => setCallHovered(false)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0EA5E9] text-white shadow-xl shadow-[#0EA5E9]/30 transition-all hover:scale-110 hover:shadow-[#0EA5E9]/50 active:scale-95"
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#0EA5E9] animate-[ping_1.5s_ease-out_0.75s_infinite] opacity-30" />
          <Phone className="relative h-6 w-6" />
        </a>

        {/* Tooltip */}
        <AnimatePresence>
          {callHovered && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none whitespace-nowrap rounded-lg bg-[#0EA5E9] px-3 py-1.5 text-xs font-medium text-white shadow-lg"
            >
              Call Us Now
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
