import { useState, useEffect, useCallback, FormEvent } from 'react';
import { X, Plus, Clock, CheckCircle, FileText, IndianRupee, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types';

const parseDateToTimestamp = (dateStr: string): number => {
  if (!dateStr) return 0;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m}-${d}`).getTime();
  }
  return new Date(dateStr).getTime();
};

const formatDateForUI = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN');
};

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

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMode, setPayMode] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceiptUrl, setLastReceiptUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch Invoices for this customer
    let invQuery = supabase.from('invoices').select('*').eq('customer_name', customerName).eq('doc_type', 'Invoice');
    if (customerId) invQuery = invQuery.or(`customer_id.eq.${customerId},customer_name.eq."${customerName}"`);
    
    const { data: invData } = await invQuery.order('date', { ascending: true });
    
    // Fetch Payments
    let payData: any[] = [];
    try {
      let pQuery = supabase.from('customer_payments').select('*').eq('customer_name', customerName);
      if (customerId) pQuery = pQuery.or(`customer_id.eq.${customerId},customer_name.eq."${customerName}"`);
      
      const { data: pResp, error } = await pQuery.order('payment_date', { ascending: true });
      if (!error && pResp) payData = pResp;
    } catch (e) {
      console.warn('Could not fetch customer_payments', e);
    }

    const filteredInvoices = (invData || []).filter((i: Invoice) => i.doc_type === 'Invoice');
    setInvoices(filteredInvoices);
    setPayments(payData || []);

    // Detect phone & email
    const foundPhone = filteredInvoices.find((i: Invoice) => i.phone)?.phone || '';
    const foundEmail = filteredInvoices.find((i: Invoice) => i.email)?.email || '';
    setCustomerPhone(foundPhone);
    setCustomPhone(foundPhone);
    setCustomerEmail(foundEmail);

    setLoading(false);
  }, [customerName, customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateReceiptText = (amount: number, dateStr: string, mode: string, refNote: string, finalBalance: number, totalBilledAmount: number, totalPaidAmount: number) => {
    let msg = `🧾 *PAYMENT RECEIPT - Yantrabyte Solutions*\n\n`;
    msg += `Dear *${customerName}*,\n\n`;
    msg += `Thank you! We have received your payment of *₹${amount.toLocaleString('en-IN')}*.\n\n`;
    msg += `*Payment Details:*\n`;
    msg += `• *Date:* ${formatDateForUI(dateStr)}\n`;
    msg += `• *Amount Received:* ₹${amount.toLocaleString('en-IN')}\n`;
    msg += `• *Payment Mode:* ${mode}\n`;
    if (refNote) msg += `• *Reference / Note:* ${refNote}\n`;
    msg += `\n*Account Summary:*\n`;
    if (totalBilledAmount > 0) msg += `• *Total Billed:* ₹${totalBilledAmount.toLocaleString('en-IN')}\n`;
    if (totalPaidAmount > 0) msg += `• *Total Paid:* ₹${totalPaidAmount.toLocaleString('en-IN')}\n`;
    msg += `• *Outstanding Balance:* ${finalBalance > 0 ? `*₹${finalBalance.toLocaleString('en-IN')}*` : '*₹0 (Fully Cleared 🎉)*'}\n\n`;
    msg += `You can view your complete ledger & invoice history online here:\nhttps://yantrabyte.anantatechcare.com/my-invoices\n\n`;
    msg += `Thank you for your business!\n*YantraByte Solutions*`;
    return msg;
  };

  const handleSendWhatsAppReceipt = (amount: number, dateStr: string, mode: string, refNote: string, targetPhone?: string) => {
    let phone = (targetPhone || customPhone || customerPhone || '').replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    const totalB = invoices.reduce((sum: number, inv: Invoice) => sum + (Number(inv.grand_total) || 0), 0);
    const totalP = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) + amount;
    const finalBal = Math.max(0, totalB - totalP);

    const msg = generateReceiptText(amount, dateStr, mode, refNote, finalBal, totalB, totalP);

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert('No phone number found for this customer. Please enter a phone number.');
    }
  };

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    setIsSubmitting(true);
    setLastReceiptUrl(null);

    const amountNum = Number(payAmount);

    try {
      // 1. Insert into customer_payments
      const paymentPayload = {
        customer_id: customerId || null,
        customer_name: customerName,
        amount: amountNum,
        payment_date: payDate || new Date().toISOString().slice(0, 10),
        payment_mode: payMode,
        reference_note: payRef.trim() || null
      };

      const { error: payErr } = await supabase.from('customer_payments').insert([paymentPayload]);
      if (payErr) throw payErr;

      // 2. Distribute payment across unpaid invoices (FIFO)
      let remainingAmount = amountNum;
      const unpaidInvoices = [...invoices].filter((i: Invoice) => (i.balance_due || 0) > 0).sort((a: Invoice, b: Invoice) => parseDateToTimestamp(a.date) - parseDateToTimestamp(b.date));

      for (const inv of unpaidInvoices) {
        if (remainingAmount <= 0) break;
        const bal = (inv.balance_due !== undefined && inv.balance_due !== null) ? Number(inv.balance_due) : Math.max(0, (inv.grand_total || 0) - (inv.advance_paid || 0));
        const toApply = Math.min(bal, remainingAmount);
        
        const newAdvance = (inv.advance_paid || 0) + toApply;
        const newBalance = Math.max(0, (inv.grand_total || 0) - newAdvance);
        
        const paymentStatus = newBalance <= 0 ? 'Paid' : 'Partial';

        await supabase.from('invoices').update({
          advance_paid: newAdvance,
          balance_due: newBalance,
          payment_status: paymentStatus
        }).eq('id', inv.id);

        remainingAmount -= toApply;
      }

      // Calculate totals for receipt
      const totalBilled = invoices.reduce((sum: number, inv: Invoice) => sum + (Number(inv.grand_total) || 0), 0);
      const totalPaid = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) + amountNum;
      const finalBalance = Math.max(0, totalBilled - totalPaid);

      // 3. Send Instant Receipt via Server API
      const targetPhone = (customPhone || customerPhone || '').replace(/\D/g, '');
      if (sendWhatsApp && targetPhone) {
        try {
          await fetch('/api/invoices/payment-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName,
              customerPhone: targetPhone,
              customerEmail,
              amount: amountNum,
              paymentDate: payDate,
              paymentMode: payMode,
              referenceNote: payRef.trim(),
              balanceDue: finalBalance,
              totalBilled,
              totalPaid
            })
          });
        } catch (apiErr) {
          console.warn('Server automated WhatsApp dispatch skipped:', apiErr);
        }

        // Prepare direct wa.me URL
        let cleanP = targetPhone;
        if (cleanP.length === 10) cleanP = '91' + cleanP;
        const receiptMsg = generateReceiptText(amountNum, payDate, payMode, payRef.trim(), finalBalance, totalBilled, totalPaid);
        setLastReceiptUrl(`https://wa.me/${cleanP}?text=${encodeURIComponent(receiptMsg)}`);
      }

      setShowPaymentForm(false);
      setPayAmount('');
      setPayRef('');
      await fetchData();
      onPaymentAdded();
    } catch (err) {
      console.error('Error saving payment:', err);
      alert('Failed to save payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build unified ledger timeline
  const ledgerLines: any[] = [];
  const totalAdvancesOnInvoices = invoices.reduce((sum: number, inv: Invoice) => sum + (Number(inv.advance_paid) || 0), 0);

  invoices.forEach((inv: Invoice) => {
    ledgerLines.push({
      id: `inv-${inv.id}`,
      date: parseDateToTimestamp(inv.date),
      dateStr: inv.date,
      type: 'invoice',
      ref: inv.invoice_no,
      debit: inv.grand_total || 0,
      credit: 0,
      phone: inv.phone
    });
  });

  if (payments.length > 0) {
    payments.forEach((p: any) => {
      ledgerLines.push({
        id: `pay-${p.id}`,
        date: parseDateToTimestamp(p.payment_date || p.created_at),
        dateStr: p.payment_date || (p.created_at ? p.created_at.slice(0, 10) : ''),
        type: 'payment',
        ref: `Payment (${p.payment_mode || 'Cash'})${p.reference_note ? ` - ${p.reference_note}` : ''}`,
        debit: 0,
        credit: Number(p.amount) || 0,
        amount: Number(p.amount) || 0,
        mode: p.payment_mode || 'UPI',
        note: p.reference_note || ''
      });
    });
  } else if (totalAdvancesOnInvoices > 0) {
    invoices.forEach((inv: Invoice) => {
      if ((inv.advance_paid || 0) > 0) {
        ledgerLines.push({
          id: `adv-${inv.id}`,
          date: parseDateToTimestamp(inv.date),
          dateStr: inv.date,
          type: 'payment',
          ref: `Advance/Payment for #${inv.invoice_no}`,
          debit: 0,
          credit: inv.advance_paid || 0,
          amount: inv.advance_paid || 0,
          mode: 'Advance',
          note: `Invoice #${inv.invoice_no}`
        });
      }
    });
  }

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
            <div className="flex items-center gap-3 text-slate-400 text-sm mt-0.5">
              <span className="font-semibold text-white">{customerName}</span>
              {customerPhone && <span>• 📱 {customerPhone}</span>}
              {customerEmail && <span>• ✉️ {customerEmail}</span>}
            </div>
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
              {/* Last Receipt Action Banner */}
              {lastReceiptUrl && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">Payment Recorded Successfully!</span>
                      <span className="text-xs text-emerald-700">Instant WhatsApp payment receipt drafted for {customerName}.</span>
                    </div>
                  </div>
                  <a
                    href={lastReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-lg shadow transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Send on WhatsApp
                  </a>
                </div>
              )}

              {/* Payment Form */}
              {showPaymentForm ? (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    Record New Payment & Issue Receipt
                  </h3>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          required 
                          placeholder="e.g. 5000"
                          value={payAmount} 
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setPayAmount(val);
                            }
                          }} 
                          className="w-full border-slate-300 rounded-lg text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-blue-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date</label>
                        <input
                          type="date"
                          value={payDate}
                          onChange={e => setPayDate(e.target.value)}
                          className="w-full border-slate-300 rounded-lg text-slate-900 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
                        <select 
                          value={payMode} 
                          onChange={e => setPayMode(e.target.value)} 
                          className="w-full border-slate-300 rounded-lg text-slate-900 text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="UPI">UPI / GPay / PhonePe</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Mobile #</label>
                        <input
                          type="text"
                          placeholder="10-digit mobile"
                          value={customPhone}
                          onChange={e => setCustomPhone(e.target.value)}
                          className="w-full border-slate-300 rounded-lg text-slate-900 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Ref / Note</label>
                        <input 
                          type="text" 
                          value={payRef} 
                          onChange={e => setPayRef(e.target.value)} 
                          placeholder="e.g. UTR # 4239847293 or Part payment" 
                          className="w-full border-slate-300 rounded-lg text-slate-900 text-sm focus:border-blue-500 focus:ring-blue-500" 
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors w-full">
                          <input
                            type="checkbox"
                            checked={sendWhatsApp}
                            onChange={e => setSendWhatsApp(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>📱 Send Instant WhatsApp Payment Receipt</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setShowPaymentForm(false)} 
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        {isSubmitting ? 'Recording...' : 'Record Payment & Send Receipt'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mb-6 flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    Lifetime statement of account and payment settlements.
                  </div>
                  <button 
                    onClick={() => setShowPaymentForm(true)} 
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                  >
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
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-sm">
                    {ledgerLines.map(line => {
                      runningBalance += (line.debit - line.credit);
                      return (
                        <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap text-slate-700 font-medium">{formatDateForUI(line.dateStr)}</td>
                          <td className="px-5 py-3 text-slate-700">
                            {line.type === 'invoice' ? (
                              <div className="font-semibold text-blue-700">Invoice #{line.ref}</div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{line.ref}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-900">{line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN')}` : '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-600">{line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN')}` : '-'}</td>
                          <td className={`px-5 py-3 text-right font-bold ${runningBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ₹{runningBalance.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {line.type === 'payment' && line.credit > 0 ? (
                              <button
                                onClick={() => handleSendWhatsAppReceipt(line.amount || line.credit, line.dateStr, line.mode || 'UPI', line.note || '', line.phone)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-semibold transition-colors"
                                title="Send WhatsApp Payment Receipt"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                Receipt
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {ledgerLines.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">No transactions found for this customer.</td>
                      </tr>
                    )}
                  </tbody>
                  {ledgerLines.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={4} className="px-5 py-4 text-right text-slate-700">Total Outstanding Balance:</td>
                        <td className={`px-5 py-4 text-right text-lg ${runningBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{runningBalance.toLocaleString('en-IN')}
                        </td>
                        <td></td>
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
