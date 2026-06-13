import { forwardRef } from 'react';
import type { Invoice, InvoiceItem } from '../types';

function numberToWords(num: number): string {
  num = Math.round(Number(num || 0));
  if (num === 0) return 'Zero Rupees';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  }
  function three(n: number): string {
    if (n < 100) return two(n);
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '');
  }

  let str = '';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const rest = num;

  if (crore) str += three(crore) + ' Crore ';
  if (lakh) str += three(lakh) + ' Lakh ';
  if (thousand) str += three(thousand) + ' Thousand ';
  if (rest) str += three(rest) + ' ';

  return str.trim() + ' Rupees';
}

interface Props {
  invoice: Invoice;
}

export const InvoicePdfTemplate = forwardRef<HTMLDivElement, Props>(({ invoice }, ref) => {
  const items: InvoiceItem[] = Array.isArray(invoice.items) ? invoice.items : [];
  
  return (
    <div ref={ref} className="bg-white p-[10px] text-black" style={{ width: '950px', maxWidth: 'none', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between border p-3 mb-2" style={{ borderColor: '#000000' }}>
        <div className="flex items-center space-x-4">
          <div className="w-[340px] h-28 flex items-center justify-start ml-2">
            <img src="/logo5.png" alt="YantraByte Solutions" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold" style={{ color: '#0B5394' }}>YANTRABYTE SOLUTIONS</h1>
          <p className="text-xs mt-1" style={{ color: '#333333' }}>47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br/>Chikkabettahalli, Bengaluru - 560097</p>
          <p className="text-xs mt-1" style={{ color: '#333333' }}>Phone: 09986742525 | Email: yantrabyte.solutions@gmail.com</p>
        </div>
      </div>

      <div className="font-bold text-center py-1 border-x border-t text-base tracking-widest uppercase" style={{ backgroundColor: '#0B5394', color: '#ffffff', borderColor: '#000000' }}>
        {invoice.doc_type === 'Quotation' ? 'QUOTATION' : 'INVOICE'}
      </div>

      <div className="flex justify-between border">
        <div className="w-1/2 p-2 border-r font-bold" style={{ borderColor: '#000000', color: '#0B5394' }}>
          {invoice.doc_type === 'Quotation' ? 'Quotation No: ' : 'Invoice No: '} {invoice.invoice_no}
        </div>
        <div className="w-1/2 p-2 text-right font-bold" style={{ color: '#333333' }}>
          Date: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
        </div>
      </div>

      <div className="border-x border-b" style={{ borderColor: '#000000' }}>
        <div className="p-1 px-2 font-bold text-sm border-b" style={{ backgroundColor: '#D9EAF7', borderColor: '#000000', color: '#000000' }}>Bill To:</div>
        <div className="p-2 text-sm leading-tight" style={{ color: '#000000' }}>
          <div className="font-bold text-base mb-1">{invoice.customer_name || '—'}</div>
          <div>Phone: {invoice.phone || '—'} &nbsp;&nbsp;&nbsp; Email: {invoice.email || '—'}</div>
          <div>Address: {invoice.address || '—'}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="relative mt-2">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
          <div className="transform -rotate-[35deg] text-[80px] font-black tracking-widest whitespace-nowrap" style={{ color: '#0B5394', opacity: 0.04 }}>
            YANTRABYTE SOLUTIONS
          </div>
        </div>
        <table className="w-full border text-sm text-left relative z-0" style={{ borderColor: '#000000', borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>
            <th className="border p-1.5 w-10" style={{ borderColor: '#000000' }}>#</th>
            <th className="border p-1.5 text-left w-40" style={{ borderColor: '#000000' }}>Item</th>
            <th className="border p-1.5 text-left" style={{ borderColor: '#000000' }}>Description</th>
            <th className="border p-1.5 w-12" style={{ borderColor: '#000000' }}>Qty</th>
            <th className="border p-1.5 w-20" style={{ borderColor: '#000000' }}>Rate</th>
            <th className="border p-1.5 w-24 text-right" style={{ borderColor: '#000000' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: InvoiceItem, idx: number) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
              <td className="border p-1.5 text-center" style={{ borderColor: '#000000', color: '#000000' }}>{idx + 1}</td>
              <td className="border p-1.5 font-medium" style={{ borderColor: '#000000', color: '#000000' }}>{it.description}</td>
              <td className="border p-1.5" style={{ borderColor: '#000000', color: '#000000' }}></td>
              <td className="border p-1.5 text-center" style={{ borderColor: '#000000', color: '#000000' }}>{it.qty}</td>
              <td className="border p-1.5 text-right" style={{ borderColor: '#000000', color: '#000000' }}>{it.rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td className="border p-1.5 text-right font-bold" style={{ borderColor: '#000000', color: '#000000' }}>{(it.qty * it.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
          {/* Padding rows */}
          {[...Array(Math.max(0, 6 - items.length))].map((_, idx) => (
            <tr key={`empty-${idx}`}>
              <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
              <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
              <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
              <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
              <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
              <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Totals Box */}
      <div className="flex border-x border-b text-sm" style={{ borderColor: '#000000' }}>
        <div className="w-3/5 p-2 border-r" style={{ borderColor: '#000000' }}>
          <div className="font-bold inline-block px-2 mb-1" style={{ backgroundColor: '#D9EAF7', color: '#000000' }}>Amount in Words:</div>
          <div className="italic ml-2" style={{ color: '#333333' }}>{numberToWords(invoice.grand_total || 0)} Only</div>
        </div>
        <div className="w-2/5 flex flex-col">
          <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Subtotal</span> <span style={{ color: '#000000' }}>{(invoice.subtotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
          {Number(invoice.discount || 0) > 0 && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Discount</span> <span style={{ color: '#000000' }}>{Number(invoice.discount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>}
          {Number(invoice.tax || 0) > 0 && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Tax</span> <span style={{ color: '#000000' }}>{Number(invoice.tax).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>}
          {Number(invoice.round_off || 0) !== 0 && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Round Off</span> <span style={{ color: '#000000' }}>{Number(invoice.round_off).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>}
          <div className="flex justify-between p-1 px-2 font-bold border-y" style={{ backgroundColor: '#FFF2CC', borderColor: '#000000', color: '#000000' }}><span>Grand Total</span> <span className="text-base">{(invoice.grand_total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
          <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Advance Paid</span> <span style={{ color: '#000000' }}>{((invoice as any).advance_paid || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
          <div className="flex justify-between p-1 px-2 font-bold border-t" style={{ backgroundColor: '#FFF2CC', borderColor: '#000000', color: '#000000' }}><span>Balance Due</span> <span className="text-base">{(invoice.balance_due || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
          <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Status</span> <span style={{ color: '#000000' }}>{invoice.payment_status}</span></div>
          {invoice.payment_mode !== 'Not specified' && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Mode</span> <span style={{ color: '#000000' }}>{invoice.payment_mode}</span></div>}
          {invoice.due_date && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Due Date</span> <span style={{ color: '#000000' }}>{invoice.due_date}</span></div>}
        </div>
      </div>

      {/* Footer Terms */}
      <div className="flex border-x border-b text-xs mt-2" style={{ borderColor: '#000000' }}>
        <div className="w-3/5 p-2 border-r" style={{ borderColor: '#000000' }}>
          <div className="font-bold inline-block w-full p-1 mb-1 text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>Terms & Conditions</div>
          <div className="space-y-0.5 ml-2" style={{ color: '#444444' }}>
            {invoice.doc_type === 'Quotation' ? (
              <>
                <p>1. Estimate valid for 7 days.</p>
                <p>2. Advance payment of 50% required.</p>
                <p>3. Final amount may vary if hidden faults are found.</p>
              </>
            ) : (
              <>
                <p>1. Service warranty is valid for 30 days from the date of service. Covers only the specific issue addressed.</p>
                <p>2. No warranty for software-related services including Windows installation, OS activation, or driver setup.</p>
                <p>3. Customer must take full backup of all important data before service. YantraByte Solutions is not liable for any data loss, corruption, or damage.</p>
                <p>4. Physical damage, liquid damage, burnt components, and swollen batteries are not covered under warranty.</p>
                <p>5. Any tampering or unauthorized repair after service will void the warranty immediately.</p>
                <p>6. Replacement parts carry a 6-month warranty against manufacturing defects only.</p>
                <p>7. Devices not collected within 30 days of completion may incur storage charges at the company's discretion.</p>
                <p>8. All disputes subject to Bengaluru jurisdiction only.</p>
              </>
            )}
          </div>
        </div>
        <div className="w-2/5 p-2 flex flex-col items-center justify-between">
          <div className="font-bold mb-4" style={{ color: '#0B5394' }}>For YANTRABYTE SOLUTIONS</div>
          <div className="mt-8 border-t w-3/4 text-center pt-1" style={{ borderColor: '#000000', color: '#333333' }}>Authorized Signatory</div>
        </div>
      </div>
      <div className="text-center mt-2 font-bold italic" style={{ color: '#0B5394' }}>
        Thank you for your business!
      </div>
    </div>
  );
});

InvoicePdfTemplate.displayName = 'InvoicePdfTemplate';
