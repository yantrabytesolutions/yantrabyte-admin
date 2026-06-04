import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Shield } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information that you provide directly to us, as well as information that is automatically collected when you interact with our website and services.

Personal Information: When you request a consultation, submit a contact form, schedule a service, or communicate with us, we may collect your name, email address, phone number, company name, service address, and any other information you choose to provide.

Payment Information: When you make a payment for our services, we collect billing information such as your billing address and payment method details. We do not store complete credit card numbers on our servers; payment processing is handled by secure third-party payment processors.

Technical Information: When you visit our website, we automatically collect certain information about your device, including your IP address, browser type, operating system, referring URL, pages visited, and the date and time of your visit.

Usage Information: We collect information about how you use our website and services, including pages viewed, links clicked, features used, and the duration of your visit.`,
  },
  {
    title: '2. How We Use Information',
    content: `We use the information we collect for the following purposes:

To Provide Services: We use your personal information to deliver, maintain, and improve the IT and security services you have requested, including scheduling site visits, dispatching technicians, and providing ongoing support.

To Communicate: We use your contact information to respond to your inquiries, send you service updates, provide technical support, and deliver important notifications about your service agreements.

To Process Payments: We use billing information to process payments for services rendered and to send you invoices and payment receipts.

To Improve Our Services: We use technical and usage information to analyze website performance, diagnose technical issues, improve user experience, and develop new features and services.

For Marketing: With your consent, we may use your information to send you promotional materials, newsletters, and information about new services and special offers. You may opt out of marketing communications at any time.

For Security: We use collected information to protect the security of our website and services, prevent fraud, and ensure compliance with applicable laws and regulations.`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:

Service Providers: We may share information with trusted third-party service providers who assist us in operating our website, conducting business, or servicing you, provided they agree to keep this information confidential.

Business Transfers: If Yantrabyte Solutions is involved in a merger, acquisition, or sale of all or a portion of its assets, your personal information may be transferred as part of that transaction.

Legal Requirements: We may disclose your information when we believe in good faith that disclosure is necessary to comply with applicable law, regulation, legal process, or governmental request.

Protection of Rights: We may disclose information to protect the rights, property, or safety of Yantrabyte Solutions, our customers, or others, including to prevent fraud or security issues.

With Your Consent: We may share your information with your explicit consent or at your direction.`,
  },
  {
    title: '4. Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:

Encryption: We use SSL/TLS encryption to protect data transmitted between your browser and our servers. Sensitive data such as passwords are encrypted using industry-standard hashing algorithms.

Access Controls: We restrict access to personal information to authorized employees, contractors, and agents who need the information to perform their job functions. All authorized personnel are trained on data security practices.

Infrastructure Security: Our servers and databases are protected by enterprise-grade firewalls, intrusion detection systems, and regular security audits. We maintain up-to-date software and apply security patches promptly.

Data Retention: We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements.

While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.`,
  },
  {
    title: '5. Cookies',
    content: `Our website uses cookies and similar tracking technologies to enhance your browsing experience. Cookies are small text files stored on your device that help us recognize you and remember your preferences.

Types of Cookies We Use:

Essential Cookies: These cookies are necessary for the website to function properly, enabling core features such as page navigation and secure access to authenticated areas.

Analytics Cookies: We use analytics cookies to understand how visitors interact with our website, which pages are most visited, and how users navigate between pages. This helps us improve our website and services.

Functional Cookies: These cookies allow the website to remember your choices and preferences, such as language settings or region, providing a more personalized experience.

You can control cookies through your browser settings and may choose to disable cookies. However, disabling certain cookies may affect the functionality of our website. Most browsers allow you to refuse cookies or delete existing cookies.

For more details on how we use cookies, please refer to our Cookie Policy, which supplements this Privacy Policy.`,
  },
  {
    title: '6. Third-Party Services',
    content: `Our website may contain links to third-party websites, services, and applications. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to review the privacy policies of any third-party services you access.

Third-Party Integrations: We may integrate with third-party services such as Google Analytics for website analytics, payment processors for secure transactions, and communication platforms for customer support. Each of these services has its own privacy policy governing the use of your information.

Social Media Features: Our website may include social media features, such as share buttons or embedded content. These features may collect your IP address, the page you are visiting on our site, and may set cookies to enable the feature to function properly.

Google Analytics: We use Google Analytics to collect and analyze website traffic data. Google Analytics uses cookies to collect information about how visitors use our site. This information is aggregated and anonymous. You may opt out of Google Analytics by installing the Google Analytics opt-out browser add-on.`,
  },
  {
    title: '7. Your Rights',
    content: `Depending on your location, you may have certain rights regarding your personal information:

Right to Access: You have the right to request access to the personal information we hold about you and to obtain a copy of that information.

Right to Rectification: You have the right to request that we correct any inaccurate or incomplete personal information we hold about you.

Right to Erasure: You have the right to request that we delete your personal information, subject to certain legal exceptions such as when we are required to retain data by law or for legitimate business purposes.

Right to Restrict Processing: You have the right to request that we limit the processing of your personal information under certain circumstances.

Right to Data Portability: You have the right to request a copy of your personal information in a structured, commonly used, and machine-readable format.

Right to Object: You have the right to object to the processing of your personal information for direct marketing purposes or when processing is based on legitimate interests.

Right to Withdraw Consent: Where we rely on your consent to process your personal information, you have the right to withdraw that consent at any time.

To exercise any of these rights, please contact us using the information provided below. We will respond to your request within 30 days.`,
  },
  {
    title: '8. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Yantrabyte Solutions
Email: privacy@yantrabyte.com
Phone: +91-9986742525
Address: 47A 1st Cross, Sainagar 2nd Stage, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097

Our Data Protection Officer can be reached at the above email address for any privacy-related inquiries or complaints. We take all privacy concerns seriously and will respond to your inquiry promptly.

Changes to This Policy: We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. We will notify you of any material changes by posting the updated policy on our website with a revised "Last Updated" date. Your continued use of our website after such changes constitutes your acceptance of the updated Privacy Policy.`,
  },
];

export default function Privacy() {
  return (
    <div className="bg-[#0B1120]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120] pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0EA5E9]/5 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-2 text-sm text-[#94A3B8] mb-6"
          >
            <Link to="/" className="hover:text-[#0EA5E9] transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0EA5E9]">Privacy Policy</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="w-14 h-14 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#0EA5E9]" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Privacy{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              Policy
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
          >
            Your privacy is important to us. This policy explains how Yantrabyte Solutions collects, uses, and protects your information.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-[#64748B] mt-4"
          >
            Last Updated: January 1, 2025
          </motion.p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent" />
      </section>

      {/* Content */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="py-20 md:py-28"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 mb-8">
            <p className="text-[#94A3B8] leading-relaxed">
              Yantrabyte Solutions ("we," "our," or "us") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, disclose, and protect information when you visit our website, use our services, or otherwise interact with us. By using our website or services, you consent to the practices described in this Privacy Policy.
            </p>
          </motion.div>

          {sections.map((section, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 mb-6 hover:border-[#0EA5E9]/20 transition-colors duration-300"
            >
              <h2 className="text-xl md:text-2xl font-bold text-[#0EA5E9] mb-6">
                {section.title}
              </h2>
              <div className="text-[#94A3B8] leading-relaxed whitespace-pre-line text-sm md:text-base">
                {section.content}
              </div>
            </motion.div>
          ))}

          {/* Bottom CTA */}
          <motion.div variants={fadeInUp} className="text-center mt-12">
            <p className="text-[#64748B] text-sm mb-4">
              Have questions about our privacy practices?
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0EA5E9]/25"
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
