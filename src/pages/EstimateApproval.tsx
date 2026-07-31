import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Invoice } from '../types';
import SEO from '../components/SEO';

export function EstimateApproval() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalResult, setApprovalResult] = useState<'Approved' | 'Rejected' | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await fetch(`/api/invoices/estimate/${id}`);
        if (!res.ok) throw new Error('Estimate not found or link is invalid.');
        const data = await res.json();
        setEstimate(data);
        if (['Approved', 'Rejected'].includes(data.payment_status)) {
          setApprovalResult(data.payment_status as 'Approved' | 'Rejected');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEstimate();
  }, [id]);

  const handleDecision = async (status: 'Approved' | 'Rejected') => {
    if (status === 'Approved' && !signature.trim()) {
      setError('Please type your name as a digital signature to approve.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`/api/invoices/estimate/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, signature: status === 'Approved' ? signature.trim() : '' })
      });
      
      if (!res.ok) throw new Error('Failed to submit decision. Please try again.');
      setApprovalResult(status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !estimate) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Estimate Not Found</h1>
        <p className="text-slate-400 max-w-md">{error}</p>
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-slate-300 py-12 px-4 relative overflow-hidden">
      <SEO title={`Estimate ${estimate.invoice_no}`} description="Review and approve your repair estimate online." />
      
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        
        {approvalResult ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 text-center shadow-2xl animate-fade-in-up max-w-2xl mx-auto">
            {approvalResult === 'Approved' ? (
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            )}
            <h1 className="text-4xl font-bold text-white mb-4">Estimate {approvalResult}</h1>
            
            {approvalResult === 'Approved' ? (
              <div className="text-left bg-black/20 p-6 md:p-8 rounded-xl border border-white/10 mt-8">
                <p className="text-lg text-slate-300 mb-8 text-center">
                  Thank you! Your approval has been recorded. To proceed with the service, please make an advance payment of <strong className="text-white">80%</strong>.
                </p>
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-300 uppercase tracking-wider mb-1">Advance Amount</p>
                      <p className="text-3xl font-bold text-white">₹{(estimate.grand_total * 0.8).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-sm text-slate-300 space-y-2 p-4 bg-white/5 rounded-lg border border-white/5">
                      <p><strong className="text-white">Bank:</strong> North East Small Finance Bank</p>
                      <p><strong className="text-white">A/C Name:</strong> YantraByte Solutions</p>
                      <p><strong className="text-white">A/C No:</strong> 033311501023226</p>
                      <p><strong className="text-white">IFSC Code:</strong> NESF0000333</p>
                      <p className="pt-2 mt-2 border-t border-white/10"><strong className="text-white">UPI ID:</strong> s0424237152@slc</p>
                    </div>
                  </div>
                  <div className="w-48 h-48 bg-white rounded-xl p-2 flex-shrink-0 flex items-center justify-center relative overflow-hidden border-4 border-white/10 shadow-xl">
                    <QRCodeSVG 
                      value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${(estimate.grand_total * 0.8).toFixed(2)}&cu=INR`} 
                      size={170} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-lg text-slate-400 mb-8">
                Your estimate has been rejected. We will contact you to discuss alternatives or return your device.
              </p>
            )}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-white/10">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-400" />
                  Service Estimate
                </h1>
                <p className="text-slate-400 mt-2">#{estimate.invoice_no} • {new Date(estimate.date).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm text-slate-400 uppercase tracking-wider">Prepared For</p>
                <p className="text-lg font-semibold text-white">{estimate.customer_name}</p>
                <p className="text-slate-400">{estimate.phone}</p>
              </div>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Rate (₹)</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {estimate.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">{item.description}</td>
                      <td className="py-4 px-4 text-right">{item.qty}</td>
                      <td className="py-4 px-4 text-right">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-4 text-right font-semibold text-white">{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
              <div className="flex-1 bg-black/20 p-6 rounded-xl border border-white/5">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Terms & Conditions</h3>
                <p className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">
                  {estimate.terms_conditions || "Standard repair terms apply. Prices may vary if hidden faults are discovered during repair."}
                </p>
              </div>
              
              <div className="w-full md:w-64 space-y-3 bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="text-white">₹{estimate.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount:</span>
                    <span>- ₹{estimate.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {estimate.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax (18% GST):</span>
                    <span className="text-white">₹{estimate.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span className="text-blue-400">₹{estimate.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Digital Signature (Type your Full Name)
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Enter your name to approve"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div className="flex gap-3 w-full md:w-auto md:mt-6">
                  <button
                    onClick={() => handleDecision('Rejected')}
                    disabled={isSubmitting}
                    className="flex-1 md:flex-none px-6 py-3 rounded-lg font-semibold border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDecision('Approved')}
                    disabled={isSubmitting}
                    className="flex-1 md:flex-none px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Processing...' : 'Approve Estimate'}
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
