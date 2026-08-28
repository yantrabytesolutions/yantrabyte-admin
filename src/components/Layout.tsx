import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
import WhatsAppWidget from "./WhatsAppWidget";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1120] relative overflow-x-hidden">
      {/* Global Subtle Ambient Glow on Left & Right Margins */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-[#0EA5E9]/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-2/3 -right-32 w-96 h-96 bg-[#38BDF8]/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <Header />
      <main className="flex-1 pt-[90px] lg:pt-[106px] relative z-10">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
      <WhatsAppWidget />
    </div>
  );
}
