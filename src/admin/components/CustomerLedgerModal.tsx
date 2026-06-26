import React, { useState, useEffect } from 'react';
import { X, Plus, Clock, CheckCircle, FileText, IndianRupee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types';

interface CustomerLedgerModalProps {
  customerName: string;
  customerId: string | null;
  onClose: () => void;
  onPaymentAdded: () => void;
}

export default function CustomerLedgerModal({ customerName, customerId, onClose, onPaymentAdded }: CustomerLedgerModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [customerName, customerId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Invoices for this customer
    let invQuery = supabase.from('invoices').select('*').eq('customer_name', customerName).eq('doc_type', 'Invoice');
    if (customerId) invQuery = invQuery.or(`customer_id.eq.${customerId},customer_name.eq."${customerName}"`);
    
    const { data: invData } = await invQuery.order('date', { ascending: true });
    
    // Fetch Payments (if table exists, otherwise it will just return empty or error which we catch)
    let payData: any[] = [];
    try {
      let pQuery = supabase.from('customer_payments').select('*').eq('customer_name', customerName);
      if (customerId) pQuery = pQuery.or(`customer_id.eq.${customerId},customer_name.eq."${customerName}"`);
      
      const { data: pResp, error } = await pQuery.order('payment_date', { ascending: true });
      if (!error && pResp) payData = pResp;
    } catch (e) {
      console.warn('Could not fetch customer_payments, table might not exist yet.');
    }

    setInvoices(invData || []);
    setPayments(payData || []);
    setLoading(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    setIsSubmitting(true);

    try {
      // 1. Insert into customer_payments
      const paymentPayload = {
        customer_id: customerId || null,
        customer_name: customerName,
        amount: Number(payAmount),
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: payMode,
        reference_note: payRef.trim() || null
      };

      const { error: payErr } = await supabase.from('customer_payments').insert([paymentPayload]);
      if (payErr) throw payErr;

      // 2. Distribute payment across unpaid invoices (FIFO)
      let remainingAmount = Number(payAmount);
      const unpaidInvoices = [...invoices].filter(i => (i.balance_due || 0) > 0).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const inv of unpaidInvoices) {
        if (remainingAmount <= 0) break;
        const bal = inv.balance_due || 0;
        const toApply = Math.min(bal, remainingAmount);
        
        const newAdvance = (inv.advance_paid || 0) + toApply;
        const newBalance = (inv.grand_total || 0) - newAdvance;
        
        const paymentStatus = newBalance <= 0 ? 'Paid' : 'Partial';

        await supabase.from('invoices').update({
          advance_paid: newAdvance,
          balance_due: newBalance,
          payment_status: paymentStatus
        }).eq('id', inv.id);

        remainingAmount -= toApply;
      }

      setShowPaymentForm(false);
      setPayAmount('');
      setPayRef('');
      await fetchData();
      onPaymentAdded();
    } catch (err) {
      console.error('Error saving payment:', err);
      alert('Failed to save payment. Ensure customer_payments table exists.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build unified ledger timeline
  const ledgerLines: any[] = [];
  
  invoices.forEach(inv => {
    ledgerLines.push({
      id: \`inv-\${inv.id}\`,
      date: new Date(inv.date).getTime(),
      dateStr: inv.date,
      type: 'invoice',
      ref: inv.invoice_no,
      debit: inv.grand_total || 0,
      credit: 0
    });
    // If they made an initial advance payment on the invoice itself (before we had a payments table)
    if (inv.advance_paid && inv.advance_paid > 0 && payments.length === 0) {
      ledgerLines.push({
        id: \`inv-adv-\${inv.id}\`,
        date: new Date(inv.date).getTime() + 1000, // slightly after invoice
        dateStr: inv.date,
        type: 'initial_advance',
        ref: \`Advance for \${inv.invoice_no}\`,
        debit: 0,
        credit: inv.advance_paid
      });
    }
  });

  payments.forEach(p => {
    ledgerLines.push({
      id: \`pay-\${p.id}\`,
      date: new Date(p.payment_date).getTime(),
      dateStr: p.payment_date,
      type: 'payment',
      ref: p.reference_note ? \`Payment (\${p.payment_mode}) - \${p.reference_note}\` : \`Payment (\${p.payment_mode})\`,
      debit: 0,
      credit: p.amount
    });
  });

  ledgerLines.sort((a, b) => a.date - b.date);

  let runningBalance = 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Customer Ledger
            </h2>
            <p className="text-slate-400 text-sm">{customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Clock className="w-6 h-6 animate-spin mr-2" />
              Loading ledger details...
            </div>
          ) : (
            <>
              {/* Payment Form */}
              {showPaymentForm ? (
                <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-100 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    Record New Payment
                  </h3>
                  <form onSubmit={handleRecordPayment} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs text-slate-500 mb-1">Amount (₹)</label>
                      <input type="number" required min="1" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-slate-500 mb-1">Mode</label>
                      <select value={payMode} onChange={e => setPayMode(e.target.value)} className="w-full border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500">
                        <option>UPI</option>
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                      </select>
                    </div>
                    <div className="flex-2 min-w-[200px]">
                      <label className="block text-xs text-slate-500 mb-1">Reference / Note</label>
                      <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. Cleared Inv-001" className="w-full border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowPaymentForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mb-6 flex justify-end">
                  <button onClick={() => setShowPaymentForm(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Payment
                  </button>
                </div>
              )}

              {/* Ledger Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Particulars</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit (Dr)</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit (Cr)</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-sm">
                    {ledgerLines.map(line => {
                      runningBalance += (line.debit - line.credit);
                      return (
                        <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap text-slate-700 font-medium">{new Date(line.dateStr).toLocaleDateString('en-IN')}</td>
                          <td className="px-5 py-3 text-slate-700">
                            {line.type === 'invoice' ? (
                              <div className="font-semibold text-blue-700">Invoice #{line.ref}</div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{line.ref}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-900">{line.debit > 0 ? \`₹\${line.debit.toLocaleString('en-IN')}\` : '-'}</td>
                          <td className="px-5 py-3 text-right font-medium text-emerald-600">{line.credit > 0 ? \`₹\${line.credit.toLocaleString('en-IN')}\` : '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-rose-600">
                            ₹{runningBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                    {ledgerLines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-500">No transactions found for this customer.</td>
                      </tr>
                    )}
                  </tbody>
                  {ledgerLines.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={4} className="px-5 py-4 text-right text-slate-700">Total Outstanding Balance:</td>
                        <td className="px-5 py-4 text-right text-rose-600 text-lg">₹{runningBalance.toLocaleString('en-IN')}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
