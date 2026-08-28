import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
import WhatsAppWidget from "./WhatsAppWidget";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1120]">
      <Header />
      <main className="flex-1 pt-[90px] lg:pt-[106px]">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
      <WhatsAppWidget />
    </div>
  );
}
