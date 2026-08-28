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
  companySignature?: string;
  quoteValidityDays?: number;
  quoteAdvancePercent?: number;
}

export const InvoicePdfTemplate = forwardRef<HTMLDivElement, Props>(({ 
  invoice, 
  companySignature,
  quoteValidityDays = 7,
  quoteAdvancePercent = 85
}, ref) => {
  const items: InvoiceItem[] = Array.isArray(invoice.items) ? invoice.items : [];
  const isQuotation = invoice.doc_type === 'Quotation';
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
      {/* Watermark */}
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
        zIndex: 1,
        opacity: 0.18
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
          zIndex: 30,
          border: '6px dashed rgba(220, 38, 38, 0.4)',
          padding: '8px 36px',
          borderRadius: '12px',
          whiteSpace: 'nowrap'
        }}>
          CANCELLED
        </div>
      )}

      {/* Main Container Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Main Box Outer Border */}
        <div style={{ border: '1.5px solid #000000', backgroundColor: 'transparent' }}>
          
          {/* Header Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000' }}>
            <tbody>
              <tr>
                <td style={{ width: '130px', padding: '10px 12px', verticalAlign: 'middle' }}>
                  <img 
                    src="/logo6.png" 
                    alt="YantraByte Solutions" 
                    style={{ height: '95px', width: 'auto', display: 'block' }} 
                    crossOrigin="anonymous" 
                  />
                </td>
                <td style={{ textAlign: 'right', padding: '10px 16px', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px', color: '#0B5394', textTransform: 'uppercase' }}>
                    YANTRABYTE SOLUTIONS
                  </div>
                  <div style={{ fontSize: '12px', color: '#333333', marginTop: '4px', lineHeight: '1.4' }}>
                    47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br />
                    Chikkabettahalli, Bengaluru - 560097
                  </div>
                  <div style={{ fontSize: '12px', color: '#333333', marginTop: '4px' }}>
                    📱 Phone: 09986742525 &nbsp;|&nbsp; ✉️ Email: yantrabyte.solutions@gmail.com
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Document Title Banner */}
          <div style={{
            backgroundColor: isCancelled ? '#DC2626' : '#0B5394',
            color: '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '5px 0',
            fontSize: '15px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderBottom: '1px solid #000000'
          }}>
            {isCancelled ? 'CANCELLED INVOICE' : (isQuotation ? 'QUOTATION' : 'INVOICE')}
          </div>

          {/* Doc Number and Date Row */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', padding: '7px 12px', borderRight: '1px solid #000000', fontWeight: 'bold', fontSize: '14px', color: '#DC2626' }}>
                  {isQuotation ? 'Quotation No: ' : (isCancelled ? 'Cancelled No: ' : 'Invoice No: ')} {invoice.invoice_no || 'DRAFT'}
                </td>
                <td style={{ width: '50%', padding: '7px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#333333' }}>
                  Date: {formattedDate}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bill To Section */}
          <div style={{ borderBottom: '1px solid #000000' }}>
            <div style={{ backgroundColor: '#D9EAF7', color: '#7E22CE', padding: '4px 12px', fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #000000' }}>
              Bill To:
            </div>
            <div style={{ padding: '8px 12px', fontSize: '13px', lineHeight: '1.4', color: '#000000' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '2px', color: '#000000' }}>
                {invoice.customer_name || '—'}
              </div>
              <div style={{ color: '#111827' }}>
                Phone: {invoice.phone || '—'} &nbsp;&nbsp;&nbsp;&nbsp; Email: {invoice.email || '—'}
              </div>
              <div style={{ color: '#111827' }}>
                Address: {invoice.address || '—'}
              </div>
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

              {/* Padding rows to maintain consistent height */}
              {[...Array(Math.max(0, 5 - items.length))].map((_, idx) => (
                <tr key={`empty-${idx}`} style={{ backgroundColor: 'transparent', height: '24px' }}>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                  <td style={{ borderBottom: '1px solid #e2e8f0', padding: '4px', color: 'transparent' }}>.</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section (Flat rowSpan Table - Prevents PDF Overlap) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '13px' }}>
            <tbody>
              {calcRows.map((row, idx) => (
                <tr 
                  key={row.label}
                  style={{ 
                    backgroundColor: (row.isHighlight || row.isDue) ? '#FFF2CC' : 'transparent',
                    height: '24px'
                  }}
                >
                  {/* First row renders the Left: Amount in Words with rowSpan */}
                  {idx === 0 && (
                    <td 
                      rowSpan={calcRows.length} 
                      style={{ 
                        width: '58%', 
                        verticalAlign: 'top', 
                        padding: '8px 12px', 
                        borderRight: '1px solid #000000',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ backgroundColor: '#D9EAF7', color: '#B45309', fontWeight: 'bold', fontSize: '12px', padding: '2px 8px', display: 'inline-block', marginBottom: '6px' }}>
                        Amount in Words:
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '13px', color: '#1f2937', lineHeight: '1.4' }}>
                        {numberToWords(grandTotal)}
                      </div>
                    </td>
                  )}

                  {/* Right: Label */}
                  <td 
                    style={{ 
                      width: '22%', 
                      padding: '4px 10px', 
                      color: row.isHighlight ? '#15803D' : (row.isDue ? '#B91C1C' : '#333333'), 
                      fontWeight: (row.isHighlight || row.isDue) ? 'bold' : 'normal',
                      fontSize: (row.isHighlight || row.isDue) ? '13px' : '12.5px',
                      borderBottom: idx === calcRows.length - 1 ? 'none' : '1px solid #000000'
                    }}
                  >
                    {row.label}
                  </td>

                  {/* Right: Value */}
                  <td 
                    style={{ 
                      width: '20%', 
                      padding: '4px 10px', 
                      textAlign: 'right', 
                      color: row.isHighlight ? '#15803D' : (row.isDue ? '#B91C1C' : '#000000'), 
                      fontWeight: (row.isHighlight || row.isDue) ? 'bold' : 'normal',
                      fontSize: (row.isHighlight || row.isDue) ? '13.5px' : '12.5px',
                      borderBottom: idx === calcRows.length - 1 ? 'none' : '1px solid #000000'
                    }}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* Bottom Section: Terms & Conditions + Bank & Payment Details */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px 0', marginTop: '12px', tableLayout: 'fixed' }}>
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

                  <div style={{ textAlign: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>
                      For YantraByte Solutions
                    </div>
                    <div style={{ height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                      {companySignature ? (
                        <img 
                          src={companySignature} 
                          alt="Company Signature" 
                          style={{ maxHeight: '56px', maxWidth: '130px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
                          crossOrigin="anonymous" 
                        />
                      ) : (
                        <img 
                          src="/seal.png" 
                          alt="Seal" 
                          style={{ maxHeight: '56px', maxWidth: '85px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
                          crossOrigin="anonymous" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
});

InvoicePdfTemplate.displayName = 'InvoicePdfTemplate';
