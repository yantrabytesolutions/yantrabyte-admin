import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';
import type { Invoice } from '../types';
import SEO from '../components/SEO';

export function QuotationApproval() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalResult, setApprovalResult] = useState<'Approved' | 'Rejected' | 'Expired' | null>(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE_URL}/api/invoices/quotation/${id}`);
        if (!res.ok) throw new Error('Quotation not found or link is invalid.');
        const data = await res.json();
        setQuotation(data);
        if (['Approved', 'Rejected', 'Expired'].includes(data.payment_status)) {
          setApprovalResult(data.payment_status as 'Approved' | 'Rejected' | 'Expired');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuotation();
  }, [id]);

  const handleDecision = async (status: 'Approved' | 'Rejected') => {
    if (status === 'Approved' && !signature.trim()) {
      setError('Please type your name as a digital signature to approve.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE_URL}/api/invoices/quotation/${id}/approve`, {
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

  const handleDownloadPDF = () => {
    if (!quotation) return;
    const element = document.getElementById('quotation-content');
    if (!element) return;
    const cleanInv = (quotation.invoice_no || 'Quotation').replace(/[^\w-]/g, '_');
    const cleanName = (quotation.customer_name || '').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const filename = cleanName ? `Quotation_${cleanInv}_${cleanName}.pdf` : `Quotation_${cleanInv}.pdf`;
    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Quotation Not Found</h1>
        <p className="text-slate-400 max-w-md">{error}</p>
      </div>
    );
  }

  if (!quotation) return null;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-slate-300 py-12 px-4 relative overflow-hidden">
      <SEO title={`Quotation ${quotation.invoice_no}`} description="Review and approve your repair quotation online." />
      
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        
        {approvalResult ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 text-center shadow-2xl animate-fade-in-up max-w-2xl mx-auto">
            {approvalResult === 'Expired' ? (
              <>
                <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">Quotation Expired</h1>
                <p className="text-lg text-slate-400 mb-8">
                  This quotation has expired as it was not approved within 7 days. Please contact us for a fresh quotation.
                </p>
                <a href="tel:+919986742525" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors">
                  📞 Call Us: 9986742525
                </a>
              </>
            ) : approvalResult === 'Approved' ? (
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            )}
            
            {approvalResult !== 'Expired' && (
              <h1 className="text-4xl font-bold text-white mb-4">Quotation {approvalResult}</h1>
            )}
            
            {approvalResult === 'Approved' ? (
              <div className="text-left bg-black/20 p-6 md:p-8 rounded-xl border border-white/10 mt-8">
                <p className="text-lg text-slate-300 mb-8 text-center">
                  Thank you! Your approval has been recorded. To proceed with the service, please make an advance payment of <strong className="text-white">85%</strong> and the remaining balance at the time of delivery.
                </p>
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-300 uppercase tracking-wider mb-1">Advance Amount</p>
                      <p className="text-3xl font-bold text-white">₹{(quotation.grand_total * 0.85).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
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
                      value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${(quotation.grand_total * 0.85).toFixed(2)}&cu=INR`} 
                      size={170} 
                    />
                  </div>
                </div>
                <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-slate-400 mb-2">Payment Status</p>
                  {quotation.advance_paid > 0 ? (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-emerald-400">✓ Advance Paid</span>
                        <span className="text-white font-semibold">₹{quotation.advance_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min((quotation.advance_paid / quotation.grand_total) * 100, 100)}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Balance: ₹{quotation.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  ) : (
                    <p className="text-yellow-400 text-sm">⏳ Awaiting advance payment</p>
                  )}
                </div>
              </div>
            ) : approvalResult === 'Rejected' ? (
              <p className="text-lg text-slate-400 mb-8">
                Your quotation has been rejected. We will contact you to discuss alternatives or return your device.
              </p>
            ) : null}
          </div>
        ) : (
          <div id="quotation-content" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-white/10">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-400" />
                  Service Quotation
                </h1>
                <p className="text-slate-400 mt-2">#{quotation.invoice_no} • {new Date(quotation.date).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm text-slate-400 uppercase tracking-wider">Prepared For</p>
                <p className="text-lg font-semibold text-white">{quotation.customer_name}</p>
                <p className="text-slate-400">{quotation.phone}</p>
              </div>
            </div>
            
            <div className="flex justify-end mb-4">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Download PDF
              </button>
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
                  {quotation.items.map((item, idx) => (
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
                  {quotation.terms_conditions || "Standard repair terms apply. Prices may vary if hidden faults are discovered during repair."}
                </p>
              </div>
              
              <div className="w-full md:w-64 space-y-3 bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="text-white">₹{quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount:</span>
                    <span>- ₹{quotation.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {quotation.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax (18% GST):</span>
                    <span className="text-white">₹{quotation.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span className="text-blue-400">₹{quotation.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                    {isSubmitting ? 'Processing...' : 'Approve Quotation'}
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
