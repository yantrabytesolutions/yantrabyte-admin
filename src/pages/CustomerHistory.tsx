import { useState } from 'react';
import { Search, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';

interface InvoiceSummary {
  id: string;
  invoice_no: string;
  doc_type: string;
  date: string;
  customer_name: string;
  grand_total: number;
  payment_status: string;
  created_at: string;
}

export function CustomerHistory() {
  const [phone, setPhone] = useState('');
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE_URL}/api/invoices/customer/${clean}`);
      if (!res.ok) throw new Error('Failed to fetch invoices.');
      const data = await res.json();
      setInvoices(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'Expired':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400"><AlertCircle className="w-3 h-3" /> Expired</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400"><Clock className="w-3 h-3" /> {status}</span>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-slate-300 py-12 px-4 relative overflow-hidden">
      <SEO title="My Invoices — YantraByte Solutions" description="View your past invoices and quotations from YantraByte Solutions." />
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">My Invoices</h1>
          <p className="text-slate-400 text-lg">Enter your phone number to view your invoices and quotations</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter your phone number"
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          {searched && invoices.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No invoices found for this phone number.</p>
            </div>
          )}

          {invoices.length > 0 && (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-white">{inv.invoice_no}</p>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-400">{inv.doc_type}</span>
                      </div>
                      <p className="text-sm text-slate-400">{inv.customer_name} • {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-white">₹{inv.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      {getStatusBadge(inv.payment_status)}
                    </div>
                  </div>
                  {inv.doc_type === 'Quotation' && inv.payment_status === 'Due' && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <a
                        href={`/quotation/${inv.id}`}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View & Approve Quotation →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
