import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Invoice, InvoiceItem } from '../types';
import { HardwareBrandsBanner } from './HardwareBrandsBanner';

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
  companySignature?: string;
  quoteValidityDays?: number;
  quoteAdvancePercent?: number;
}

export const InvoicePdfTemplate = forwardRef<HTMLDivElement, Props>(({ 
  invoice, 
  companySignature: _companySignature,
  quoteValidityDays = 7,
  quoteAdvancePercent = 85
}, ref) => {
  const items: InvoiceItem[] = Array.isArray(invoice.items) ? invoice.items : [];
  const isQuotation = invoice.doc_type === 'Quotation' || invoice.doc_type === 'Estimate' || (Boolean(invoice.invoice_no) && String(invoice.invoice_no).startsWith('YBQ'));
  const isCancelled = invoice.doc_type === 'Cancelled';
  const formattedDate = invoice.date ? (
    invoice.date.includes('-') ? invoice.date.split('-').reverse().join('/') : invoice.date
  ) : new Date().toLocaleDateString('en-GB');

  const grandTotal = Number(invoice.grand_total || 0);
  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const tax = Number(invoice.tax || 0);
  const roundOff = Number(invoice.round_off || 0);
  const advancePaid = Number(invoice.advance_paid || 0);
  const balanceDue = Number(invoice.balance_due || 0);
  const calcRows: { label: string; value: string; isHighlight?: boolean; isDue?: boolean }[] = [
    { label: 'Subtotal', value: subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }
  ];

  if (discount > 0) {
    calcRows.push({ label: 'Discount', value: discount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) });
  }
  if (tax > 0) {
    calcRows.push({ label: 'Tax', value: tax.toLocaleString('en-IN', { minimumFractionDigits: 2 }) });
  }
  if (roundOff !== 0) {
    calcRows.push({ label: 'Round Off', value: roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 }) });
  }

  calcRows.push({
    label: 'Grand Total',
    value: grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    isHighlight: true
  });

  calcRows.push({
    label: 'Advance Paid',
    value: advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })
  });

  calcRows.push({
    label: 'Balance Due',
    value: balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    isDue: true
  });

  return (
    <div 
      ref={ref} 
      style={{ 
        width: '794px', 
        minHeight: '1120px',
        boxSizing: 'border-box', 
        padding: '24px', 
        backgroundColor: '#ffffff', 
        color: '#000000', 
        fontFamily: 'Arial, sans-serif', 
        position: 'relative', 
        overflow: 'hidden' 
      }}
    >
      {/* Centered Brand Watermark Emblem */}
      <div style={{
        position: 'absolute',
        top: '52%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '480px',
        height: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0.22
      }}>
        <img 
          src="/logo6.png" 
          alt="Watermark" 
          style={{ width: '440px', height: 'auto', objectFit: 'contain', display: 'block' }} 
          crossOrigin="anonymous" 
        />
      </div>

      {/* Subtle Background Circuit Pattern */}
      <div style={{
        position: 'absolute',
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundImage: 'url(/hardware_watermark.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 4,
        opacity: 0.15
      }} />

      {/* Cancelled Stamp */}
      {isCancelled && (
        <div style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          color: 'rgba(220, 38, 38, 0.35)',
          fontSize: '75px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          zIndex: 60,
          border: '6px dashed rgba(220, 38, 38, 0.4)',
          padding: '8px 36px',
          borderRadius: '12px',
          whiteSpace: 'nowrap'
        }}>
          CANCELLED
        </div>
      )}

      {/* Main Container Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        border: '2px solid #0B5394',
        borderRadius: '12px',
        padding: '24px',
        backgroundColor: 'transparent',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0B5394', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img 
              src="/logo6.png" 
              alt="YantraByte Solutions" 
              style={{ height: '85px', width: 'auto', display: 'block' }} 
              crossOrigin="anonymous" 
            />
            <div>
              <h1 style={{ color: '#0B5394', fontSize: '22px', fontWeight: '800', margin: 0 }}>YANTRABYTE SOLUTIONS</h1>
              <div style={{ fontSize: '11px', color: '#555555', marginTop: '4px', lineHeight: '1.4' }}>
                47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br />
                Chikkabettahalli, Bengaluru - 560097<br />
                📱 09986742525 | ✉️ yantrabyte.solutions@gmail.com
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', color: isCancelled ? '#DC2626' : '#0B5394', fontSize: '18px', textTransform: 'uppercase' }}>
              {isCancelled ? 'CANCELLED INVOICE' : (isQuotation ? 'QUOTATION' : 'INVOICE')}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              {isQuotation ? 'Quote No: ' : (isCancelled ? 'Cancelled No: ' : 'Invoice No: ')} <strong>{invoice.invoice_no || 'DRAFT'}</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Date: <strong>{formattedDate}</strong>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: '16px', backgroundColor: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Bill To (Customer Details)</span><br />
            <strong style={{ color: '#0B5394', fontSize: '14px' }}>{invoice.customer_name || '—'}</strong><br />
            Phone: {invoice.phone || '—'} &nbsp;|&nbsp; Email: {invoice.email || '—'}<br />
            Address: {invoice.address || '—'}
          </div>
        </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B5394', color: '#ffffff', height: '32px' }}>
                <th style={{ width: '45px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px 4px', fontWeight: 'bold' }}>
                  Sl<br />No.
                </th>
                <th style={{ textAlign: 'left', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px 8px', fontWeight: 'bold' }}>
                  Description
                </th>
                <th style={{ width: '55px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px 4px', fontWeight: 'bold' }}>
                  Qty
                </th>
                <th style={{ width: '95px', textAlign: 'right', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px 8px', fontWeight: 'bold' }}>
                  Rate (₹)
                </th>
                <th style={{ width: '110px', textAlign: 'right', borderBottom: '1px solid #000000', padding: '6px 8px', fontWeight: 'bold' }}>
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => {
                const desc = it.description || it.item || it.name || it.item_name || '';
                const qty = Number(it.qty || 1);
                const rate = Number(it.rate || it.price || it.amount || 0);
                const amount = qty * rate;
                return (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.7)' }}>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '6px 4px', color: '#000000' }}>
                      {idx + 1}
                    </td>
                    <td style={{ textAlign: 'left', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '6px 8px', color: '#000000', wordBreak: 'break-word' }}>
                      <div style={{ fontWeight: '500' }}>{desc}</div>
                      {it.serial_no && (
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: 'bold' }}>
                          S/N: {it.serial_no}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '6px 4px', color: '#000000' }}>
                      {qty}
                    </td>
                    <td style={{ textAlign: 'right', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '6px 8px', color: '#000000' }}>
                      {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '6px 8px', fontWeight: 'bold', color: '#000000' }}>
                      {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {/* Padding rows to fill full A4 height without empty gap */}
              {[...Array(Math.max(0, 8 - items.length))].map((_, idx) => (
                <tr key={`empty-${idx}`} style={{ backgroundColor: 'transparent', height: '28px' }}>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '13px', backgroundColor: '#ffffff' }}>
            <tbody>
              <tr>
                {/* Left: Amount in Words */}
                <td style={{ width: '58%', verticalAlign: 'top', padding: '10px 12px', borderRight: '1px solid #000000' }}>
                  <div style={{ backgroundColor: '#D9EAF7', color: '#B45309', fontWeight: 'bold', fontSize: '12px', padding: '3px 8px', display: 'inline-block', marginBottom: '8px', borderRadius: '3px' }}>
                    Amount in Words:
                  </div>
                  <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '13px', color: '#000000', lineHeight: '1.5' }}>
                    {numberToWords(grandTotal)}
                  </div>
                </td>

                {/* Right: Calculations Breakdown */}
                <td style={{ width: '42%', verticalAlign: 'top', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      {calcRows.map((row, idx) => (
                        <tr 
                          key={row.label}
                          style={{ 
                            backgroundColor: (row.isHighlight || row.isDue) ? '#FFF2CC' : 'transparent',
                            height: '26px'
                          }}
                        >
                          <td style={{ 
                            padding: '5px 10px', 
                            color: row.isHighlight ? '#15803D' : (row.isDue ? '#B91C1C' : '#333333'), 
                            fontWeight: (row.isHighlight || row.isDue) ? 'bold' : 'normal',
                            fontSize: (row.isHighlight || row.isDue) ? '13px' : '12.5px',
                            borderBottom: idx === calcRows.length - 1 ? 'none' : '1px solid #000000'
                          }}>
                            {row.label}
                          </td>
                          <td style={{ 
                            padding: '5px 10px', 
                            textAlign: 'right', 
                            color: row.isHighlight ? '#15803D' : (row.isDue ? '#B91C1C' : '#000000'), 
                            fontWeight: (row.isHighlight || row.isDue) ? 'bold' : 'normal',
                            fontSize: (row.isHighlight || row.isDue) ? '13.5px' : '12.5px',
                            borderBottom: idx === calcRows.length - 1 ? 'none' : '1px solid #000000'
                          }}>
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

        {/* Bottom Section: Terms & Conditions + Bank & Payment Details */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px 0', marginTop: '16px', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {/* Terms & Conditions Box */}
              <td style={{ width: '58%', verticalAlign: 'top', border: '1px solid #000000', padding: 0, boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: '#0B5394', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', padding: '4px 0' }}>
                  Terms & Conditions
                </div>
                <div style={{ padding: '8px 10px', fontSize: '11px', color: '#333333', lineHeight: '1.45' }}>
                  {invoice.terms_conditions ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{invoice.terms_conditions}</div>
                  ) : isQuotation ? (
                    <>
                      <div style={{ marginBottom: '2px' }}>1. Estimate valid for {quoteValidityDays} days.</div>
                      <div style={{ marginBottom: '2px' }}>2. Advance payment of {quoteAdvancePercent}% required and remaining against Delivery.</div>
                      <div>3. Final amount may vary if hidden faults are found.</div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: '2px' }}>1. Service warranty is valid for 30 days only.</div>
                      <div style={{ marginBottom: '2px' }}>2. No warranty for Windows installation/software issues.</div>
                      <div style={{ marginBottom: '2px' }}>3. YantraByte Solutions is not responsible for any data loss.</div>
                      <div style={{ marginBottom: '2px' }}>4. Customer should take backup of all important files prior.</div>
                      <div style={{ marginBottom: '2px' }}>5. Physical, liquid or burnt damages void warranty.</div>
                      <div>6. No warranty for swollen batteries or electrical faults.</div>
                    </>
                  )}
                </div>
              </td>

              {/* Bank & Payment Details Box */}
              <td style={{ width: '42%', verticalAlign: 'top', border: '1px solid #000000', padding: 0, boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: '#0B5394', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', padding: '4px 0' }}>
                  Bank & Payment Details
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: 'top', fontSize: '10.5px', lineHeight: '1.4', color: '#000000' }}>
                          <div><span style={{ fontWeight: 'bold' }}>Bank:</span> North East Small Finance Bank</div>
                          <div><span style={{ fontWeight: 'bold' }}>A/C Name:</span> YantraByte Solutions</div>
                          <div><span style={{ fontWeight: 'bold' }}>A/C No:</span> 033311501023226</div>
                          <div><span style={{ fontWeight: 'bold' }}>IFSC:</span> NESF0000333</div>
                          <div><span style={{ fontWeight: 'bold' }}>UPI:</span> s0424237152@slc</div>
                        </td>
                        <td style={{ width: '56px', verticalAlign: 'middle', textAlign: 'right', paddingLeft: '4px' }}>
                          <div style={{ background: '#ffffff', padding: '2px', display: 'inline-block' }}>
                            <QRCodeSVG 
                              value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${balanceDue > 0 ? balanceDue : grandTotal}&cu=INR`} 
                              size={52} 
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ textAlign: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '900', color: '#0F172A', letterSpacing: '0.4px', textTransform: 'uppercase', lineHeight: '1.4' }}>
                      THIS IS A SYSTEM GENERATED DOCUMENT, NO SIGNATURE REQUIRED
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Top Hardware Brands Logo Banner */}
        <HardwareBrandsBanner />

      </div>
    </div>
  );
});

InvoicePdfTemplate.displayName = 'InvoicePdfTemplate';
