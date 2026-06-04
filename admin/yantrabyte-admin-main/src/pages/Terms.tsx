import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, FileText } from 'lucide-react';

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
    title: '1. Acceptance of Terms',
    content: `By accessing or using the website and services of Yantrabyte Solutions ("Company," "we," "our," or "us"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not access or use our website or services.

These Terms constitute a legally binding agreement between you ("Client," "you," or "your") and Yantrabyte Solutions. We reserve the right to modify these Terms at any time by posting updated Terms on our website. Your continued use of our website or services after any such changes constitutes your acceptance of the revised Terms.

It is your responsibility to review these Terms periodically. We will make reasonable efforts to notify you of material changes, but ultimate responsibility for staying informed rests with you. The most current version of these Terms will always be available on our website.`,
  },
  {
    title: '2. Services',
    content: `Yantrabyte Solutions provides IT infrastructure, security, and technology services including but not limited to:

CCTV Installation and Monitoring: Professional installation, configuration, and maintenance of surveillance camera systems for residential and commercial properties.

Computer Repair and Maintenance: Diagnosis and repair of desktop computers, laptops, and peripherals; hardware upgrades; software troubleshooting; and data recovery services.

Networking Solutions: Design, installation, and management of local area networks (LAN), wide area networks (WAN), wireless networks, and network security infrastructure.

Security Systems: Installation and maintenance of biometric access control systems, firewalls, and other security solutions.

Annual Maintenance Contracts (AMCs): Ongoing IT support and maintenance services provided under contractual terms with defined service levels and response times.

Consulting Services: IT consulting, system design, and technology advisory services.

All services are subject to availability and may be modified or discontinued at our discretion. We will make reasonable efforts to provide advance notice of any material changes to our service offerings. Specific terms for individual services may be outlined in separate service agreements or statements of work.`,
  },
  {
    title: '3. Payment Terms',
    content: `Service Fees: All fees for services rendered are as quoted in our formal proposals, quotations, or invoices unless otherwise agreed in writing. Prices are subject to change with prior notice.

Payment Schedule: Unless otherwise specified in a service agreement, payment is due upon completion of service for one-time engagements. For AMC and recurring service contracts, payment is due as per the agreed billing cycle (monthly, quarterly, or annually).

Advance Payments: For certain projects, we may require an advance payment of up to 50% of the estimated project cost before commencement of work. The balance is payable upon completion or at defined milestones as mutually agreed.

Late Payments: Invoices not paid within 30 days of the due date may incur a late payment fee of 1.5% per month on the outstanding balance. We reserve the right to suspend services for accounts that are more than 30 days overdue.

Taxes: All fees are exclusive of applicable taxes, including Goods and Services Tax (GST), unless otherwise stated. You are responsible for all applicable taxes associated with our services.

Refunds: Refund policies vary by service type. For one-time services, refunds are available only if the service has not been commenced. For AMC contracts, refunds for unused portions may be available on a pro-rata basis, subject to a minimum commitment period. Hardware and equipment purchases are subject to manufacturer return policies.`,
  },
  {
    title: '4. Warranty and Disclaimers',
    content: `Service Warranty: We warrant that our services will be performed in a professional and workmanlike manner consistent with industry standards. Our warranty covers workmanship for a period of 12 months from the date of service completion, unless otherwise specified in a service agreement.

Equipment Warranty: Equipment and products supplied by us are covered by the manufacturer's warranty terms. We act as a facilitator for warranty claims but do not guarantee manufacturer warranty terms, which may vary by product and brand.

Limitations: Our warranty does not cover: (a) damage caused by misuse, negligence, unauthorized modifications, or environmental factors; (b) issues arising from third-party software, hardware, or services not provided by us; (c) normal wear and tear; (d) problems resulting from your failure to follow recommended maintenance procedures; or (e) damage caused by force majeure events.

Disclaimer: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OUR SERVICES AND WEBSITE ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM HARMFUL COMPONENTS.`,
  },
  {
    title: '5. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Yantrabyte Solutions and its directors, employees, partners, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from:

(a) Your access to or use of or inability to access or use our website or services;
(b) Any conduct or content of any third party on our website or in connection with our services;
(c) Any content obtained from our website or services;
(d) Unauthorized access, use, or alteration of your transmissions or content;

In no event shall our total liability to you for all claims arising out of or relating to these Terms or our services exceed the amount you have paid us for the specific service giving rise to the claim, or one hundred thousand Indian Rupees (INR 1,00,000), whichever is less.

This limitation of liability applies whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis, even if we have been advised of the possibility of such damage. Some jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, so the above limitations may not apply to you.`,
  },
  {
    title: '6. Intellectual Property',
    content: `Ownership: All content, features, and functionality of our website, including but not limited to text, graphics, logos, images, software, and the compilation thereof, are the exclusive property of Yantrabyte Solutions and are protected by Indian and international copyright, trademark, and other intellectual property laws.

Proprietary Materials: Our service methodologies, technical documentation, proprietary software tools, and trade secrets remain our exclusive property. No license or right is granted to you to use any trademark, service mark, logo, or other proprietary information of Yantrabyte Solutions without our prior written consent.

Client Content: You retain all rights to any content you provide to us, including business information, system configurations, and data. By providing content to us, you grant us a limited, non-exclusive, non-transferable license to use such content solely for the purpose of providing our services.

Restrictions: You may not: (a) copy, modify, or distribute any portion of our website or services; (b) use any data mining, robots, or similar data gathering methods; (c) reverse engineer, decompile, or disassemble any software provided by us; (d) remove, alter, or obscure any proprietary notices on our website or materials; or (e) use our services to develop competing products or services.

Feedback: Any feedback, suggestions, or ideas you provide regarding our services is voluntary and may be used by us without restriction or compensation to you.`,
  },
  {
    title: '7. Privacy',
    content: `Your privacy is important to us. Our collection and use of personal information in connection with our services is as described in our Privacy Policy, which is incorporated into these Terms by reference.

By using our services, you consent to the collection and use of your information as described in our Privacy Policy. We encourage you to review our Privacy Policy to understand our data practices.

Data Processing: In the course of providing our services, we may have access to your systems, networks, and data. We agree to handle such information with the same degree of care as we protect our own confidential information, and in no event less than a reasonable standard of care.

Data Security: We implement appropriate technical and organizational measures to protect your data. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.

Data Retention: We retain your personal and business information only for as long as necessary to fulfill the purposes outlined in our Privacy Policy and as required by applicable laws and regulations.`,
  },
  {
    title: '8. Termination',
    content: `By Us: We may terminate or suspend our services and your access to our website immediately, without prior notice, for conduct that we determine, in our sole discretion, violates these Terms, is harmful to other users or our business interests, or as required by law.

By You: You may terminate your use of our services at any time by providing written notice as specified in your service agreement. Termination of AMC contracts may be subject to early termination fees as outlined in the respective agreement.

Effect of Termination: Upon termination: (a) all licenses and rights granted to you under these Terms will immediately cease; (b) you must pay all outstanding fees and charges; (c) we will provide a reasonable transition period for handover of any systems, data, or materials under our control; and (d) provisions that by their nature should survive termination shall remain in effect.

Equipment Return: Upon termination, any equipment, hardware, or materials provided by us on a rental or loan basis must be returned in good working condition within 14 days. Damage or failure to return may result in replacement charges.

Survival: The following provisions survive termination: Sections 4 (Warranty and Disclaimers), 5 (Limitation of Liability), 6 (Intellectual Property), 8 (Termination), 9 (Governing Law), and any other provision that by its nature should survive.`,
  },
  {
    title: '9. Governing Law',
    content: `These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.

Jurisdiction: Any disputes arising out of or relating to these Terms or our services shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.

Dispute Resolution: Before initiating formal legal proceedings, you agree to attempt to resolve any dispute through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration in Bangalore in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English, and the arbitrator's decision shall be final and binding.

Severability: If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms otherwise remain in full force and effect.

Entire Agreement: These Terms, together with any applicable service agreements, constitute the entire agreement between you and Yantrabyte Solutions regarding the use of our website and services, superseding any prior agreements.

Waiver: Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. Any waiver of these Terms must be in writing and signed by us.`,
  },
  {
    title: '10. Contact Information',
    content: `For any questions, concerns, or notices regarding these Terms and Conditions, please contact us:

Yantrabyte Solutions
Email: legal@yantrabyte.com
Phone: +91-9986742525
Address: 47A 1st Cross, Sainagar 2nd Stage, 2nd Main Rd, Vidyaranyapura Post, Chikkabettahalli, Bengaluru, Karnataka 560097

General Inquiries: yantrabyte.solutions@gmail.com
Support: support@yantrabyte.com

For legal notices, please send written correspondence to the address above with "Legal Notice" clearly marked on the envelope. We will acknowledge receipt of any legal notice within 5 business days.

We recommend that you print or save a copy of these Terms for your records. These Terms were last updated on January 1, 2025.`,
  },
];

export default function Terms() {
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
            <span className="text-[#0EA5E9]">Terms & Conditions</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="w-14 h-14 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-[#0EA5E9]" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Terms &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              Conditions
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
          >
            Please read these terms carefully before using our services. By engaging Yantrabyte Solutions, you agree to these terms.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-[#64748B] mt-4"
          >
            Effective Date: January 1, 2025
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
              These Terms and Conditions govern your use of the website and services provided by Yantrabyte Solutions. By accessing our website or engaging our services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you are using our services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
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
              Questions about our terms? We are here to help.
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
