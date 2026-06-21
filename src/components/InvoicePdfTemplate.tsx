import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
    <div ref={ref} className="bg-white text-black" style={{ width: '794px', height: '1115px', overflow: 'hidden', maxWidth: 'none', fontFamily: 'Arial, sans-serif', padding: '15px', position: 'relative', boxSizing: 'border-box' }}>
      
      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
        opacity: 0.15
      }}>
        <img src="/hardware_watermark.png" alt="Watermark" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
      </div>

      {/* Outer Border for main content */}
      <div className="flex flex-col relative z-10" style={{ border: '1.5px solid #000', minHeight: '1085px' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 pb-1" style={{ borderBottom: '1px solid #000' }}>
          <div className="flex items-center justify-start ml-1">
            <img src="/logo6.png" alt="YantraByte Solutions" style={{ height: '110px', width: 'auto' }} crossOrigin="anonymous" />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-wide" style={{ color: '#0B5394' }}>YANTRABYTE SOLUTIONS</h1>
            <p className="text-xs mt-1" style={{ color: '#333333' }}>47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br/>Chikkabettahalli, Bengaluru - 560097</p>
            <p className="text-xs mt-1" style={{ color: '#333333' }}>Phone: 09986742525 | Email: yantrabyte.solutions@gmail.com</p>
          </div>
        </div>

        {/* INVOICE Title */}
        <div className="font-bold text-center py-1.5 text-base tracking-widest uppercase text-white" style={{ backgroundColor: '#0B5394', borderBottom: '1px solid #000' }}>
          {invoice.doc_type === 'Quotation' ? 'QUOTATION' : 'INVOICE'}
        </div>

        {/* Invoice No and Date */}
        <div className="flex justify-between" style={{ borderBottom: '1px solid #000' }}>
          <div className="w-1/2 p-2 font-bold text-base" style={{ borderRight: '1.5px solid #000', color: '#0B5394' }}>
            {invoice.doc_type === 'Quotation' ? 'Quotation No: ' : 'Invoice No: '} {invoice.invoice_no}
          </div>
          <div className="w-1/2 p-2 text-right font-bold text-base" style={{ color: '#333333' }}>
            Date: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
          </div>
        </div>

        {/* Bill To */}
        <div style={{ borderBottom: '1px solid #000' }}>
          <div className="p-1 px-2 font-bold text-sm" style={{ backgroundColor: '#D9EAF7', color: '#000000', borderBottom: '1px solid #000' }}>
            Bill To:
          </div>
          <div className="p-2 text-sm leading-tight" style={{ color: '#000000' }}>
            <div className="font-bold text-base mb-1">{invoice.customer_name || '—'}</div>
            <div>Phone: {invoice.phone || '—'} &nbsp;&nbsp;&nbsp; Email: {invoice.email || '—'}</div>
            <div>Address: {invoice.address || '—'}</div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm text-left" style={{ borderCollapse: 'collapse', borderBottom: '1px solid #000' }}>
          <thead>
            <tr className="text-center text-white" style={{ backgroundColor: '#0B5394' }}>
              <th className="p-2 w-12" style={{ border: '1px solid #000' }}>Sl<br/>No.</th>
              <th className="p-2 text-left" style={{ border: '1px solid #000' }}>Description</th>
              <th className="p-2 w-16" style={{ border: '1px solid #000' }}>Qty</th>
              <th className="p-2 w-24 text-center" style={{ border: '1px solid #000' }}>Rate</th>
              <th className="p-2 w-28 text-right" style={{ border: '1px solid #000', borderRight: 'none' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                <td className="p-2 text-center" style={{ borderRight: '1px solid #000', color: '#000' }}>{idx + 1}</td>
                <td className="p-2 font-medium" style={{ borderRight: '1px solid #000', color: '#000' }}>{it.description || it.item || it.name || it.item_name || ''}</td>
                <td className="p-2 text-center" style={{ borderRight: '1px solid #000', color: '#000' }}>{it.qty || 1}</td>
                <td className="p-2 text-right" style={{ borderRight: '1px solid #000', color: '#000' }}>{Number(it.rate || it.price || it.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td className="p-2 text-right font-bold" style={{ color: '#000' }}>{(Number(it.qty || 1) * Number(it.rate || it.price || it.amount || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
            {/* Padding rows to fill table space like the screenshot */}
            {[...Array(Math.max(0, 6 - items.length))].map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                <td className="p-2 text-transparent">.</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Box */}
        <div className="flex text-sm">
          <div className="w-3/5 p-3 flex flex-col justify-start" style={{ borderRight: '1px solid #000' }}>
            <div className="font-bold inline-block px-2 py-0.5 mb-2" style={{ backgroundColor: '#D9EAF7', color: '#000000', alignSelf: 'flex-start' }}>Amount in Words:</div>
            <div className="italic text-gray-800">{numberToWords(invoice.grand_total || 0)}</div>
          </div>
          <div className="w-2/5 flex flex-col">
            <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
              <span style={{ color: '#333333' }}>Subtotal</span>
              <span style={{ color: '#000000' }}>{(invoice.subtotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            {Number(invoice.discount || 0) > 0 && (
              <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                <span style={{ color: '#333333' }}>Discount</span>
                <span style={{ color: '#000000' }}>{Number(invoice.discount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            )}
            {Number(invoice.tax || 0) > 0 && (
              <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                <span style={{ color: '#333333' }}>Tax</span>
                <span style={{ color: '#000000' }}>{Number(invoice.tax).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            )}
            {Number(invoice.round_off || 0) !== 0 && (
              <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                <span style={{ color: '#333333' }}>Round Off</span>
                <span style={{ color: '#000000' }}>{Number(invoice.round_off).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            )}
            <div className="flex justify-between p-1.5 px-3 font-bold" style={{ backgroundColor: '#FFF2CC', borderBottom: '1px solid #000', color: '#000000' }}>
              <span>Grand Total</span>
              <span className="text-base">{(invoice.grand_total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
              <span style={{ color: '#333333' }}>Advance Paid</span>
              <span style={{ color: '#000000' }}>{((invoice as any).advance_paid || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between p-1.5 px-3 font-bold" style={{ backgroundColor: '#FFF2CC', color: '#000000' }}>
              <span>Balance Due</span>
              <span className="text-base">{(invoice.balance_due || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Two Boxes */}
      <div className="flex mt-3 space-x-3 text-xs">
        
        {/* Terms Box */}
        <div className="w-3/5 flex flex-col" style={{ border: '1px solid #000' }}>
          <div className="font-bold text-center p-1 text-white" style={{ backgroundColor: '#0B5394' }}>Terms & Conditions</div>
          <div className="p-3 space-y-1" style={{ color: '#444444' }}>
            {invoice.doc_type === 'Quotation' ? (
              <>
                <p>1. Estimate valid for 7 days.</p>
                <p>2. Advance payment of 50% required.</p>
                <p>3. Final amount may vary if hidden faults are found.</p>
              </>
            ) : (
              <>
                <p>1. Service warranty is valid for 30 days only.</p>
                <p>2. No warranty for Windows installation/software issues.</p>
                <p>3. YantraByte Solutions is not responsible for any data loss.</p>
                <p>4. Customer should take backup of all important files prior.</p>
                <p>5. Physical, liquid or burnt damages void warranty.</p>
                <p>6. No warranty for swollen batteries or electrical faults.</p>
              </>
            )}
          </div>
        </div>

        {/* Bank & Payment Details Box */}
        <div className="w-2/5 flex flex-col" style={{ border: '1px solid #000' }}>
          <div className="font-bold text-center p-1 text-white" style={{ backgroundColor: '#0B5394' }}>Bank & Payment Details</div>
          
          <div className="p-2 flex justify-between">
            <div className="text-[9px] leading-relaxed" style={{ color: '#000' }}>
              <span className="font-bold">Bank:</span> North East Small Finance Bank<br/>
              <span className="font-bold">A/C Name:</span> YantraByte Solutions<br/>
              <span className="font-bold">A/C No:</span> 033311501023226<br/>
              <span className="font-bold">IFSC:</span> NESF0000333<br/>
              <span className="font-bold">UPI:</span> s0424237152@slc
            </div>
            <div className="w-16 h-16 ml-2 flex-shrink-0 flex justify-center items-center bg-white">
              <QRCodeSVG 
                value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${invoice.grand_total}&cu=INR`} 
                size={60} 
              />
            </div>
          </div>
          
          <div className="text-center mt-auto flex flex-col justify-end pb-2">
            <div className="font-bold text-[10px]" style={{ color: '#000' }}>For YantraByte Solutions</div>
            <div className="flex justify-center my-1" style={{ overflow: 'hidden' }}>
              <img src="/seal.png" alt="Seal" style={{ height: '50px', maxWidth: '75px', width: 'auto', objectFit: 'contain' }} crossOrigin="anonymous" />
            </div>
            <div className="font-bold text-[10px]" style={{ color: '#000' }}>RAMESH A S</div>
            <div className="text-[9px]" style={{ color: '#444444' }}>Authorized Signatory</div>
          </div>
        </div>

      </div>

    </div>
  );
});

InvoicePdfTemplate.displayName = 'InvoicePdfTemplate';
