import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1120]">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
