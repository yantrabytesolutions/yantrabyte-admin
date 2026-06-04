import React, { useState } from 'react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Mail, 
  Phone, 
  User, 
  Calculator, 
  Monitor, 
  Camera, 
  Printer, 
  Send, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export default function AmcRequest() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Calculator state
  const [pcs, setPcs] = useState(5);
  const [cameras, setCameras] = useState(8);
  const [printers, setPrinters] = useState(2);
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // AMC Rates (Annual) - Non-Comprehensive
  const RATE_PC = 2000;
  const RATE_CAMERA = 2000;
  const RATE_PRINTER = 2000;

  const computedValue = (pcs * RATE_PC) + (cameras * RATE_CAMERA) + (printers * RATE_PRINTER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    const contractNotes = `Corporate Non-Comprehensive AMC Inquiry.\n` + 
      `- Desktops/Laptops to cover: ${pcs} (Est. ₹${pcs * RATE_PC})\n` +
      `- CCTV Cameras: ${cameras} (Est. ₹${cameras * RATE_CAMERA})\n` +
      `- Printers: ${printers} (Est. ₹${printers * RATE_PRINTER})\n` +
      `Additional Notes: ${notes.trim() || 'None'}`;

    try {
      const payload = {
        client_name: `${companyName} (${contactName})`,
        client_email: email.trim(),
        client_phone: phone.trim(),
        contract_value: computedValue,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        status: 'requested',
        notes: contractNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('amc_contracts')
        .insert([payload]);

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting AMC request:', err);
      setError('Failed to submit your request. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white pt-28 pb-20 relative overflow-hidden">
      <SEO 
        title="Corporate AMC Quote Request | YantraByte Solutions"
        description="Calculate estimated IT Annual Maintenance Contract value and submit quotes online for your office infrastructure support in Bangalore."
      />

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Page Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-4">
            Corporate IT & Security Services
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 leading-tight">
            IT Annual Maintenance Contracts (AMC)
          </h1>
          <p className="text-[#0EA5E9] font-semibold text-lg mt-2">Non-Comprehensive Support Plan</p>
          <p className="text-slate-400 mt-3 text-lg">
            Ensure zero downtime with priority remote & on-site IT support, device repairs, CCTV maintenance, and network management. Use the calculator below to get an instant budget estimate!
          </p>
        </div>

        {success ? (
          <div className="max-w-xl mx-auto bg-white/5 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center backdrop-blur-xl shadow-2xl animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Quote Request Submitted!</h2>
            <p className="text-slate-300 mb-6">
              Thank you for choosing YantraByte Solutions. Our team will review your estimated list, prepare a customized AMC proposal, and get in touch with you within 24 hours.
            </p>
            <div className="text-sm text-slate-400">
              Need immediate assistance? Call us at <a href="tel:+919986742525" className="text-blue-400 font-semibold hover:underline">+91 99867 42525</a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Interactive Calculator (Left) */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <Calculator className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Interactive Non-Comprehensive AMC Calculator</h2>
              </div>

              <div className="space-y-6">
                
                {/* Desktops/Laptops Counter */}
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-blue-400" /> Desktops & Laptops
                    </span>
                    <span className="text-xs text-[#0EA5E9] font-medium">₹{RATE_PC}/yr per unit</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={pcs} 
                      onChange={(e) => setPcs(Number(e.target.value))}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <input 
                      type="number" 
                      value={pcs} 
                      onChange={(e) => setPcs(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>


                {/* CCTV Cameras Counter */}
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" /> CCTV Security Cameras
                    </span>
                    <span className="text-xs text-[#0EA5E9] font-medium">₹{RATE_CAMERA}/yr per unit</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="150" 
                      value={cameras} 
                      onChange={(e) => setCameras(Number(e.target.value))}
                      className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <input 
                      type="number" 
                      value={cameras} 
                      onChange={(e) => setCameras(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Printers Counter */}
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-amber-400" /> Office Printers / Scanners
                    </span>
                    <span className="text-xs text-[#0EA5E9] font-medium">₹{RATE_PRINTER}/yr per unit</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      value={printers} 
                      onChange={(e) => setPrinters(Number(e.target.value))}
                      className="flex-1 accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <input 
                      type="number" 
                      value={printers} 
                      onChange={(e) => setPrinters(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Estimated Box */}
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <div>
                    <h3 className="text-slate-300 text-sm font-medium">Estimated Budget Quote (Non-Comprehensive)</h3>
                    <p className="text-[10px] text-slate-400 mt-1">*Final price may vary based on response SLA & distance</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-white">₹{computedValue.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-400 font-semibold block">/ Year</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Quote Request Form (Right) */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#0EA5E9]" /> 
                Request Proposal
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Company / Organization *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Person Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="work@acmeparts.com"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Specific Needs / Scope</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Included services (e.g. quarterly desktop checks, emergency server issues, CCTV storage setup)"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Quote Request
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
