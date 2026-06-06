import { MessageCircle } from 'lucide-react';

export default function WhatsAppWidget() {
  const phoneNumber = '919986742525';
  const defaultMessage = 'Hello Yantrabyte! I need some assistance.';
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5C] text-white shadow-lg shadow-[#25D366]/40 hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-4 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl border border-white/10">
        Chat with us
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-8 border-transparent border-l-gray-900"></div>
      </span>
    </a>
  );
}
