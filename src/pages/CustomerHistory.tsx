import { useState, useEffect } from 'react';
import { 
  Search, FileText, CheckCircle2, XCircle, Clock, AlertCircle, 
  IndianRupee, ShieldCheck, ExternalLink, Wrench, 
  MessageCircle, Phone, Sparkles, ArrowRight, X, QrCode 
} from 'lucide-react';
import { QrCodeSvg } from '../components/QrCodeSvg';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';

interface InvoiceItem {
  name: string;
  qty: number;
  rate: number;
  amount: number;
  warranty?: string;
}

interface CustomerInvoice {
  id: string;
  invoice_no: string;
  doc_type: string;
  date: string;
  customer_name: string;
  phone: string;
  email?: string;
  subtotal: number;
  tax: number;
  discount: number;
  round_off: number;
  grand_total: number;
  advance_paid: number;
  balance_due: number;
  payment_status: string;
  items: InvoiceItem[] | string;
  pdf_url?: string;
  created_at: string;
}

interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  device_type: string;
  brand_model: string;
  issue_description: string;
  status: string;
  estimated_cost?: number;
  created_at: string;
}

export function CustomerHistory() {
  const [phone, setPhone] = useState('');
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'invoices' | 'tickets' | 'warranty'>('invoices');

  // UPI Pay Modal state
  const [payingInvoice, setPayingInvoice] = useState<CustomerInvoice | null>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('yantrabyte_customer_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      fetchCustomerData(savedPhone);
    }
  }, []);

  const fetchCustomerData = async (rawPhone: string) => {
    const clean = rawPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('yantrabyte_customer_phone', clean);
      const last10 = clean.slice(-10);

      // Fetch from Supabase direct
      const [{ data: invData, error: invErr }, { data: tData }] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .ilike('phone', `%${last10}%`)
          .order('created_at', { ascending: false }),
        supabase
          .from('service_tickets')
          .select('*')
          .ilike('customer_phone', `%${last10}%`)
          .order('created_at', { ascending: false })
      ]);

      if (invErr) throw invErr;

      const formattedInvoices: CustomerInvoice[] = (invData || []).map(inv => {
        let parsedItems = inv.items;
        if (typeof parsedItems === 'string') {
          try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
        }
        return {
          ...inv,
          items: Array.isArray(parsedItems) ? parsedItems : []
        };
      });

      setInvoices(formattedInvoices);
      setTickets(tData || []);
      setSearched(true);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Unable to load your documents. Please check your number or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchCustomerData(phone);
  };

  // Calculations
  const totalBilled = invoices.filter(i => i.doc_type === 'Invoice').reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
  const totalPaid = invoices.filter(i => i.doc_type === 'Invoice').reduce((sum, i) => sum + (Number(i.advance_paid) || 0), 0);
  const totalBalanceDue = invoices.filter(i => i.doc_type === 'Invoice').reduce((sum, i) => {
    const bal = (i.balance_due !== undefined && i.balance_due !== null) ? Number(i.balance_due) : Math.max(0, (Number(i.grand_total) || 0) - (Number(i.advance_paid) || 0));
    return sum + bal;
  }, 0);

  // Warranty calculation (30 days from invoice date)
  const getWarrantyInfo = (dateStr: string) => {
    if (!dateStr) return { active: false, daysLeft: 0, expiryDate: '—' };
    let invDate: Date;
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      invDate = new Date(`${y}-${m}-${d}`);
    } else {
      invDate = new Date(dateStr);
    }

    if (isNaN(invDate.getTime())) return { active: false, daysLeft: 0, expiryDate: '—' };

    const expiry = new Date(invDate);
    expiry.setDate(expiry.getDate() + 30); // 30 days service warranty

    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      active: daysLeft > 0,
      daysLeft: Math.max(0, daysLeft),
      expiryDate: expiry.toLocaleDateString('en-IN')
    };
  };

  const getStatusBadge = (status: string, balDue: number = 0) => {
    if (status === 'Paid' || balDue <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
        </span>
      );
    }
    if (status === 'Partial' || (balDue > 0 && status !== 'Draft')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" /> ₹{balDue.toLocaleString('en-IN')} Due
        </span>
      );
    }
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400"><Clock className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 py-10 px-4 sm:px-6 relative overflow-hidden font-sans">
      <SEO 
        title="Customer Self-Service Portal — YantraByte Solutions" 
        description="Access all your invoices, service tickets, warranty status, and pay bills online via UPI." 
      />
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Customer Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Invoices & Service History
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
            View your bills, check service warranty status, track repairs, and pay pending dues via UPI.
          </p>
        </div>

        {/* Search Box */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your 10-digit mobile number"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  View Records
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Customer Content */}
        {searched && (
          <>
            {invoices.length === 0 && tickets.length === 0 ? (
              <div className="text-center py-16 backdrop-blur-xl bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  We couldn't find any invoices or service tickets registered under <strong className="text-white">{phone}</strong>.
                </p>
                <a
                  href="https://wa.me/919986742525?text=Hi%20YantraByte%2C%20I%20need%20help%20finding%20my%20invoice"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Support on WhatsApp
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Invoiced</span>
                    <div className="text-2xl font-black text-white flex items-center">
                      <IndianRupee className="w-5 h-5 text-slate-400" />
                      {totalBilled.toLocaleString('en-IN')}
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">{invoices.filter(i => i.doc_type === 'Invoice').length} total invoices</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Total Paid</span>
                    <div className="text-2xl font-black text-emerald-400 flex items-center">
                      <IndianRupee className="w-5 h-5 text-emerald-500" />
                      {totalPaid.toLocaleString('en-IN')}
                    </div>
                    <span className="text-xs text-emerald-500/70 mt-1 block">Successfully credited</span>
                  </div>

                  <div className={`border rounded-2xl p-5 shadow-lg ${totalBalanceDue > 0 ? 'bg-rose-950/30 border-rose-800/50' : 'bg-emerald-950/20 border-emerald-800/30'}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${totalBalanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {totalBalanceDue > 0 ? 'Outstanding Balance' : 'Account Status'}
                    </span>
                    <div className={`text-2xl font-black flex items-center ${totalBalanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      <IndianRupee className="w-5 h-5" />
                      {totalBalanceDue > 0 ? totalBalanceDue.toLocaleString('en-IN') : '0 (Fully Settled)'}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {totalBalanceDue > 0 ? 'Pay online securely below' : '🎉 Thank you for being a valued client!'}
                    </span>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-800 gap-2">
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'invoices'
                        ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Invoices & Estimates ({invoices.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('warranty')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'warranty'
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Warranty Status
                  </button>
                  {tickets.length > 0 && (
                    <button
                      onClick={() => setActiveTab('tickets')}
                      className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'tickets'
                          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      Service Tickets ({tickets.length})
                    </button>
                  )}
                </div>

                {/* TAB 1: INVOICES LIST */}
                {activeTab === 'invoices' && (
                  <div className="space-y-4">
                    {invoices.map((inv) => {
                      const balDue = (inv.balance_due !== undefined && inv.balance_due !== null) 
                        ? Number(inv.balance_due) 
                        : Math.max(0, (Number(inv.grand_total) || 0) - (Number(inv.advance_paid) || 0));
                      const isInvoice = inv.doc_type === 'Invoice';
                      const itemsList = Array.isArray(inv.items) ? inv.items : [];

                      return (
                        <div 
                          key={inv.id} 
                          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                            <div>
                              <div className="flex items-center gap-2.5 mb-1">
                                <span className="text-base font-extrabold text-white">{inv.invoice_no}</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                                  {inv.doc_type || 'Invoice'}
                                </span>
                                {getStatusBadge(inv.payment_status, balDue)}
                              </div>
                              <p className="text-xs text-slate-400">
                                Date: <strong className="text-slate-300">{inv.date}</strong> • Customer: <strong className="text-slate-300">{inv.customer_name}</strong>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {/* Amount Breakdown */}
                              <div className="text-right mr-2">
                                <div className="text-lg font-black text-white">
                                  ₹{inv.grand_total?.toLocaleString('en-IN')}
                                </div>
                                {balDue > 0 && isInvoice && (
                                  <span className="text-xs font-bold text-rose-400">
                                    ₹{balDue.toLocaleString('en-IN')} pending
                                  </span>
                                )}
                              </div>

                              {/* Pay Now Button (if balance due) */}
                              {balDue > 0 && isInvoice && (
                                <button
                                  onClick={() => setPayingInvoice(inv)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow transition-transform active:scale-95"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  Pay ₹{balDue.toLocaleString('en-IN')}
                                </button>
                              )}

                              {/* Approve Quotation (if quotation) */}
                              {inv.doc_type === 'Quotation' && (
                                <a
                                  href={`/quotation/${inv.id}`}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
                                >
                                  Review Quotation <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* View Online Estimate / Bill */}
                              <a
                                href={`/estimate/${inv.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                View
                              </a>
                            </div>
                          </div>

                          {/* Items Summary preview */}
                          {itemsList.length > 0 && (
                            <div className="mt-3 pt-2">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                                Items / Services Included:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {itemsList.map((item, idx) => (
                                  <span key={idx} className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                                    {item.name} {item.qty > 1 ? `(${item.qty}x)` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 2: WARRANTY TRACKER */}
                {activeTab === 'warranty' && (
                  <div className="space-y-4">
                    {invoices.filter(i => i.doc_type === 'Invoice').map((inv) => {
                      const warranty = getWarrantyInfo(inv.date);
                      const itemsList = Array.isArray(inv.items) ? inv.items : [];

                      return (
                        <div key={inv.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-800">
                            <div>
                              <span className="font-bold text-white text-base">Invoice #{inv.invoice_no}</span>
                              <span className="text-xs text-slate-400 block mt-0.5">Purchased / Serviced on: {inv.date}</span>
                            </div>
                            <div>
                              {warranty.active ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                  Active Warranty ({warranty.daysLeft} days left)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                  <Clock className="w-3.5 h-3.5" />
                                  Warranty Expired ({warranty.expiryDate})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="text-xs text-slate-400 block mb-1">Covered Items:</span>
                            <div className="space-y-1">
                              {itemsList.map((item, idx) => (
                                <div key={idx} className="text-xs text-slate-300 flex justify-between py-1 border-b border-slate-800/50">
                                  <span>• {item.name}</span>
                                  <span className="text-slate-400">{item.warranty || '30 Days Service Warranty'}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 flex justify-end">
                            <a
                              href={`https://wa.me/919986742525?text=${encodeURIComponent(`Hi YantraByte, I need warranty support for Invoice #${inv.invoice_no}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Request Warranty Support →
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 3: SERVICE REPAIR TICKETS */}
                {activeTab === 'tickets' && (
                  <div className="space-y-4">
                    {tickets.map((t) => (
                      <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
                        <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-800">
                          <div>
                            <span className="font-extrabold text-blue-400 text-base">Ticket #{t.ticket_number}</span>
                            <h4 className="text-white font-bold text-sm mt-0.5">{t.device_type} {t.brand_model ? `(${t.brand_model})` : ''}</h4>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            t.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-slate-300">
                          <strong className="text-slate-400">Reported Issue:</strong> {t.issue_description}
                        </div>
                        <div className="mt-4 pt-3 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Registered: {new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                          <a
                            href={`/track-ticket?t=${t.ticket_number}`}
                            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                          >
                            Live Diagnostic Status →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* UPI PAY MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
            <button 
              onClick={() => setPayingInvoice(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <IndianRupee className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white">Pay Invoice #{payingInvoice.invoice_no}</h3>
            <p className="text-xs text-slate-400 mt-1">Scan QR code using any UPI app (GPay, PhonePe, Paytm)</p>

            <div className="bg-white p-4 rounded-2xl inline-block my-5 shadow-inner">
              <QrCodeSvg
                value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${payingInvoice.balance_due || payingInvoice.grand_total}&cu=INR`}
                size={180}
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Payable Balance:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{(payingInvoice.balance_due || payingInvoice.grand_total)?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UPI ID:</span>
                <span className="font-mono text-slate-200">s0424237152@slc</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="text-slate-200">YantraByte Solutions</span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${payingInvoice.balance_due || payingInvoice.grand_total}&cu=INR`}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all block text-center"
              >
                📱 Open UPI App to Pay
              </a>
              <button
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CustomerHistory;
