import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Industries from './pages/Industries';
import Testimonials from './pages/Testimonials';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import ServiceRequest from './pages/ServiceRequest';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AdminPanel from './admin/AdminPanel';

const DomainGuard = ({ children }: { children: React.ReactNode }) => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname.toLowerCase();

  if (hostname === 'anantatechcare.com' || hostname === 'www.anantatechcare.com') {
    if (pathname.includes('/service-request') || pathname.includes('/servicerequest') || pathname.includes('/admin')) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
          <div className="max-w-md w-full text-center bg-white p-8 rounded-lg shadow-md border border-gray-100">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-6">Page Not Found</p>
            <p className="text-gray-500 mb-8">
              This service is not available on this domain. Please use the correct link.
            </p>
            <a
              href={`https://yantrabyte.anantatechcare.com${window.location.pathname}`}
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
            >
              Go to YantraByte Solutions
            </a>
          </div>
        </div>
      );
    }
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/service-request" element={<ServiceRequest />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>
        <Route path="/admin" element={<DomainGuard><AdminPanel /></DomainGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
