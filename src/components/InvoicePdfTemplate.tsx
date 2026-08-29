import { forwardRef } from 'react';
import type { Invoice, InvoiceItem } from '../types';
import { HardwareBrandsBanner } from './HardwareBrandsBanner';
import { YANTRABYTE_LOGO_BASE64, HARDWARE_WATERMARK_BASE64 } from '../assets/invoiceAssets';
import { QrCodeSvg } from './QrCodeSvg';

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

  const targetTotalRows = 11;
  const fillerCount = Math.max(0, targetTotalRows - items.length);

  const safePayable = Math.max(0, Number(balanceDue > 0 ? balanceDue : grandTotal) || 0).toFixed(2);
  const upiUrl = `upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${safePayable}&cu=INR`;

  return (
    <div 
      ref={ref} 
      style={{ 
        width: '794px', 
        height: '1122px',
        maxHeight: '1122px',
        boxSizing: 'border-box', 
        padding: '16px', 
        backgroundColor: '#ffffff', 
        color: '#000000', 
        fontFamily: 'Arial, sans-serif', 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Centered Brand Watermark Emblem */}
      <div style={{
        position: 'absolute',
        top: '48%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0.45
      }}>
        <img 
          src={YANTRABYTE_LOGO_BASE64} 
          alt="Watermark" 
          style={{ width: '460px', height: 'auto', objectFit: 'contain', display: 'block', filter: 'contrast(1.15) brightness(0.92)' }} 
        />
      </div>

      {/* Subtle Background Circuit Pattern */}
      <div style={{
        position: 'absolute',
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundImage: `url(${HARDWARE_WATERMARK_BASE64})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 4,
        opacity: 0.30
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
        borderRadius: '10px',
        padding: '16px 18px',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* Top Section (Header, Customer Box, Table, Totals) */}
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0B5394', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={YANTRABYTE_LOGO_BASE64} 
                alt="YantraByte Solutions" 
                style={{ height: '80px', width: 'auto', display: 'block' }} 
              />
              <div>
                <h1 style={{ color: '#0B5394', fontSize: '21px', fontWeight: '800', margin: 0, letterSpacing: '0.3px' }}>YANTRABYTE SOLUTIONS</h1>
                <div style={{ fontSize: '10.5px', color: '#555555', marginTop: '3px', lineHeight: '1.35' }}>
                  47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br />
                  Chikkabettahalli, Bengaluru - 560097<br />
                  📱 09986742525 | ✉️ yantrabyte.solutions@gmail.com
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', color: isCancelled ? '#DC2626' : '#0B5394', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isCancelled ? 'CANCELLED INVOICE' : (isQuotation ? 'QUOTATION' : 'INVOICE')}
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                {isQuotation ? 'Quote No: ' : (isCancelled ? 'Cancelled No: ' : 'Invoice No: ')} <strong>{invoice.invoice_no || 'DRAFT'}</strong>
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Date: <strong>{formattedDate}</strong>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div style={{ marginBottom: '10px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11.5px', lineHeight: '1.45' }}>
              <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Bill To (Customer Details)</span><br />
              <strong style={{ color: '#0B5394', fontSize: '13.5px' }}>{invoice.customer_name || '—'}</strong><br />
              Phone: {invoice.phone || '—'} &nbsp;|&nbsp; Email: {invoice.email || '—'}<br />
              Address: {invoice.address || '—'}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B5394', color: '#ffffff', height: '30px' }}>
                <th style={{ width: '42px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '5px 4px', fontWeight: 'bold' }}>
                  Sl<br />No.
                </th>
                <th style={{ textAlign: 'left', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '5px 8px', fontWeight: 'bold' }}>
                  Description
                </th>
                <th style={{ width: '50px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '5px 4px', fontWeight: 'bold' }}>
                  Qty
                </th>
                <th style={{ width: '95px', textAlign: 'right', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '5px 8px', fontWeight: 'bold' }}>
                  Rate (₹)
                </th>
                <th style={{ width: '105px', textAlign: 'right', borderBottom: '1px solid #000000', padding: '5px 8px', fontWeight: 'bold' }}>
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
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.7)', minHeight: '30px' }}>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '5px 4px', color: '#000000' }}>
                      {idx + 1}
                    </td>
                    <td style={{ textAlign: 'left', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '5px 8px', color: '#000000', wordBreak: 'break-word' }}>
                      <div style={{ fontWeight: '600' }}>{desc}</div>
                      {it.serial_no && (
                        <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px', fontWeight: 'bold' }}>
                          S/N: {it.serial_no}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '5px 4px', color: '#000000' }}>
                      {qty}
                    </td>
                    <td style={{ textAlign: 'right', borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '5px 8px', color: '#000000' }}>
                      {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '5px 8px', fontWeight: 'bold', color: '#000000' }}>
                      {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {/* Padding rows to fill full A4 height without empty gap */}
              {[...Array(fillerCount)].map((_, idx) => (
                <tr key={`empty-${idx}`} style={{ backgroundColor: (items.length + idx) % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.7)', height: '26px' }}>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '3px 4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '3px 8px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '3px 4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '3px 8px', color: 'transparent' }}>.</td>
                  <td style={{ borderBottom: '1px solid #e2e8f0', padding: '3px 8px', color: 'transparent' }}>.</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '12.5px', backgroundColor: '#ffffff' }}>
            <tbody>
              <tr>
                {/* Left: Amount in Words */}
                <td style={{ width: '58%', verticalAlign: 'top', padding: '8px 10px', borderRight: '1px solid #000000' }}>
                  <div style={{ backgroundColor: '#D9EAF7', color: '#B45309', fontWeight: 'bold', fontSize: '11px', padding: '2px 6px', display: 'inline-block', marginBottom: '6px', borderRadius: '3px' }}>
                    Amount in Words:
                  </div>
                  <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '12.5px', color: '#000000', lineHeight: '1.4' }}>
                    {numberToWords(grandTotal)}
                  </div>
                </td>

                {/* Right: Calculations Breakdown */}
                <td style={{ width: '42%', verticalAlign: 'top', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      {calcRows.map((row, idx) => (
                        <tr 
                          key={row.label}
                          style={{ 
                            backgroundColor: (row.isHighlight || row.isDue) ? '#FFF2CC' : 'transparent',
                            height: '24px'
                          }}
                        >
                          <td style={{ 
                            padding: '4px 8px', 
                            color: row.isHighlight ? '#15803D' : (row.isDue ? '#B91C1C' : '#333333'), 
                            fontWeight: (row.isHighlight || row.isDue) ? 'bold' : 'normal',
                            fontSize: (row.isHighlight || row.isDue) ? '12.5px' : '12px',
                            borderBottom: idx === calcRows.length - 1 ? 'none' : '1px solid #000000'
                          }}>
                            {row.label}
                          </td>
                          <td style={{ 
                            padding: '4px 8px', 
                            textAlign: 'right', 
                            color: row.isHighlight ? '#15803D' : (row.isDue ? '#B91C1C' : '#000000'), 
                            fontWeight: (row.isHighlight || row.isDue) ? 'bold' : 'normal',
                            fontSize: (row.isHighlight || row.isDue) ? '13px' : '12px',
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
        </div>

        {/* Bottom Anchored Section: Terms, Bank Details, System Notice, Hardware Brands */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Terms & Conditions + Bank & Payment Details */}
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px 0', tableLayout: 'fixed' }}>
            <tbody>
              <tr>
                {/* Terms & Conditions Box */}
                <td style={{ width: '48%', verticalAlign: 'top', border: '1px solid #000000', padding: 0, boxSizing: 'border-box' }}>
                  <div style={{ backgroundColor: '#0B5394', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', textAlign: 'center', padding: '4px 0' }}>
                    Terms & Conditions
                  </div>
                  <div style={{ padding: '6px 8px', fontSize: '10px', color: '#333333', lineHeight: '1.4' }}>
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
                        <div style={{ marginBottom: '1px' }}>1. Service warranty is valid for 30 days only.</div>
                        <div style={{ marginBottom: '1px' }}>2. No warranty for Windows installation/software issues.</div>
                        <div style={{ marginBottom: '1px' }}>3. YantraByte Solutions is not responsible for any data loss.</div>
                        <div style={{ marginBottom: '1px' }}>4. Customer should take backup of all important files prior.</div>
                        <div style={{ marginBottom: '1px' }}>5. Physical, liquid or burnt damages void warranty.</div>
                        <div>6. No warranty for swollen batteries or electrical faults.</div>
                      </>
                    )}
                  </div>
                </td>

                {/* Bank & Payment Details Box */}
                <td style={{ width: '52%', verticalAlign: 'top', border: '1px solid #000000', padding: 0, boxSizing: 'border-box' }}>
                  <div style={{ backgroundColor: '#0B5394', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', textAlign: 'center', padding: '4px 0' }}>
                    Bank & Payment Details
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: 'middle', fontSize: '11px', lineHeight: '1.45', color: '#0f172a' }}>
                            <div><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Bank:</span> North East Small Finance Bank</div>
                            <div><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>A/C Name:</span> YantraByte Solutions</div>
                            <div><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>A/C No:</span> <strong style={{ color: '#000000', fontSize: '11.5px' }}>033311501023226</strong></div>
                            <div><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>IFSC:</span> <strong style={{ color: '#000000', fontSize: '11.5px' }}>NESF0000333</strong></div>
                            <div><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>UPI ID:</span> <strong style={{ color: '#047857', fontSize: '11px' }}>s0424237152@slc</strong></div>
                          </td>
                          <td style={{ width: '84px', verticalAlign: 'middle', textAlign: 'center', paddingLeft: '6px' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#0B5394', marginBottom: '2px', letterSpacing: '0.5px' }}>
                              SCAN TO PAY
                            </div>
                            <div style={{ background: '#ffffff', padding: '2px', display: 'inline-block', border: '1.5px solid #0B5394', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              <QrCodeSvg value={upiUrl} size={76} level="M" />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Full-width System Generated Document Notice Bar */}
          <div style={{
            textAlign: 'center',
            padding: '4px 8px',
            backgroundColor: '#F1F5F9',
            border: '1.2px solid #0B5394',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: '900',
              color: '#000000',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              THIS IS A SYSTEM GENERATED DOCUMENT, NO SIGNATURE REQUIRED
            </div>
          </div>

          {/* Bottom Top Hardware Brands Logo Banner */}
          <HardwareBrandsBanner compact={true} />
        </div>
      </div>
    </div>
  );
});

InvoicePdfTemplate.displayName = 'InvoicePdfTemplate';
