import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
import WhatsAppWidget from "./WhatsAppWidget";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1120] relative overflow-x-hidden">
      {/* Full Page Persistent Hardware Circuit Watermarks */}
      <div 
        className="fixed top-0 left-0 bottom-0 w-48 2xl:w-80 opacity-[0.07] pointer-events-none z-0 bg-repeat-y bg-left-top"
        style={{ 
          backgroundImage: 'url(/hardware_watermark.png)',
          backgroundSize: '340px auto'
        }}
      />
      <div 
        className="fixed top-0 right-0 bottom-0 w-48 2xl:w-80 opacity-[0.07] pointer-events-none z-0 bg-repeat-y bg-right-top transform scale-x-[-1]"
        style={{ 
          backgroundImage: 'url(/hardware_watermark.png)',
          backgroundSize: '340px auto'
        }}
      />
      
      {/* Global Ambient Glow Orbs on Left & Right Margins */}
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
