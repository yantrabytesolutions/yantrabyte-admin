import { forwardRef } from 'react';
import type { Invoice, InvoiceItem } from '../types';
import { YANTRABYTE_LOGO_BASE64, HARDWARE_WATERMARK_BASE64 } from '../assets/invoiceAssets';
import { ANANTATECHCARE_LOGO_BASE64 } from '../assets/anantaLogo';
import { QrCodeRenderer } from './QrCodeRenderer';

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

  return (str.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

interface Props {
  invoice: Invoice;
  companySignature?: string | null;
  quoteValidityDays?: number;
  quoteAdvancePercent?: number;
  brand?: 'yantrabyte' | 'anantatechcare';
}

export const InvoicePdfTemplate = forwardRef<HTMLDivElement, Props>(({ 
  invoice, 
  companySignature: _companySignature,
  quoteValidityDays = 2,
  quoteAdvancePercent = 85,
  brand = 'yantrabyte'
}, ref) => {
  const items: InvoiceItem[] = Array.isArray(invoice.items) ? invoice.items : [];
  const isAnanta = brand === 'anantatechcare' || (Boolean(invoice.invoice_no) && (String(invoice.invoice_no).startsWith('ATC') || String(invoice.invoice_no).startsWith('AT-')));
  const isQuotation = invoice.doc_type === 'Quotation' || invoice.doc_type === 'Estimate' || (Boolean(invoice.invoice_no) && (String(invoice.invoice_no).startsWith('YBQ') || String(invoice.invoice_no).startsWith('ATCQ') || String(invoice.invoice_no).startsWith('AT-QUOTE')));
  const isServiceBill = invoice.doc_type === 'Service Bill' || (Boolean(invoice.invoice_no) && (String(invoice.invoice_no).startsWith('ATC-SRV') || String(invoice.invoice_no).startsWith('YBS-SRV') || String(invoice.invoice_no).startsWith('AT-SRV') || String(invoice.invoice_no).startsWith('SRV')));
  const isCancelled = invoice.doc_type === 'Cancelled';

  const companyEmail = isAnanta
    ? (isServiceBill ? 'service@anantatechcare.com' : 'sales@anantatechcare.com')
    : (isServiceBill ? 'service@anantatechcare.com' : 'yantrabyte.solutions@gmail.com');

  const docTitle = isCancelled 
    ? 'CANCELLED INVOICE' 
    : isQuotation 
      ? 'QUOTATION' 
      : isServiceBill 
        ? 'SERVICE BILL' 
        : 'SALES INVOICE';

  const docNumberLabel = isQuotation 
    ? 'Quote No: ' 
    : isCancelled 
      ? 'Cancelled No: ' 
      : isServiceBill 
        ? 'Service Bill No: ' 
        : 'Invoice No: ';
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

  // ----------------------------------------------------
  // ANANTATECH CARE: CLEAN MODERN ERP FORMAT (MATCHING USER ATTACHED SPECIFICATION)
  // Minimal top header, customer name, posting & due dates, delivery check,
  // and clean items table (Removed: Stock UOM, UOM, Discount Amount, Distributed Discount Amount, Rate of Stock UOM, Grant Commission).
  // ----------------------------------------------------
  const monoFont = "'JetBrains Mono', 'Courier New', monospace";

  if (isAnanta) {
    const totalQty = items.reduce((sum, it: any) => sum + (Number(it.qty || 1)), 0);
    const invoiceNo = invoice.invoice_no || 'DRAFT';
    const postingDate = formattedDate;
    const paymentDueDate = invoice.due_date 
      ? (invoice.due_date.includes('-') ? invoice.due_date.split('-').reverse().join('-') : invoice.due_date)
      : formattedDate;

    return (
      <div 
        ref={ref} 
        style={{ 
          width: '794px', 
          height: '1122px',
          maxHeight: '1122px',
          boxSizing: 'border-box', 
          padding: '28px 32px', 
          backgroundColor: '#ffffff', 
          color: '#1e293b', 
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
          position: 'relative', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Centered Brand Watermark Emblem */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${ANANTATECHCARE_LOGO_BASE64})`,
          backgroundSize: '480px 480px',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.16,
          filter: 'contrast(1.2) brightness(0.92)'
        }} />

        {/* Cancelled Stamp */}
        {isCancelled && (
          <div style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            color: 'rgba(220, 38, 38, 0.4)',
            fontSize: '70px',
            fontWeight: '900',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 60,
            border: '6px dashed rgba(220, 38, 38, 0.45)',
            padding: '8px 36px',
            borderRadius: '14px',
            whiteSpace: 'nowrap'
          }}>
            CANCELLED
          </div>
        )}

        {/* TOP CONTENT AREA */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* 1. Header (Brand Logo & Company Info) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '20px', 
            marginBottom: '16px' 
          }}>
            <img 
              src={ANANTATECHCARE_LOGO_BASE64} 
              alt="AnantaTech Care Logo" 
              style={{ height: '76px', width: 'auto', objectFit: 'contain', display: 'block' }} 
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.03em', lineHeight: '1.2' }}>
                ANANTATECH CARE
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                Your One Stop for Desktop or Laptop Solutions
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                47A 1st Cross, SAI Nagar 2nd Stage, 2nd Main Rd, Vidyaranyapura Post,<br />
                Chikkabettahalli, Bengaluru, Karnataka – 560097
              </div>
              <div style={{ 
                fontSize: '10.5px', 
                color: '#0f172a', 
                marginTop: '4px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                fontWeight: '600'
              }}>
                <span>☎ +91 9986742525</span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span>✉ {companyEmail}</span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span>💬 WhatsApp: 9986742525</span>
              </div>
            </div>
          </div>

          {/* Thin Divider Line */}
          <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }} />

          {/* 2. Document Title & Number */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {docTitle}
            </h2>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontWeight: '500' }}>
              {invoiceNo}
            </div>
          </div>

          {/* 3. Customer Info & Dates */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '20px',
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
            {/* Left: Customer Name */}
            <div style={{ width: '52%' }}>
              <div style={{ color: '#64748b' }}>Customer Name:</div>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>
                {invoice.customer_name || 'Cash'}
              </div>
              {invoice.phone && <div style={{ color: '#475569', fontSize: '11px' }}>Ph: {invoice.phone}</div>}
              {invoice.address && <div style={{ color: '#64748b', fontSize: '10.5px', marginTop: '1px' }}>{invoice.address}</div>}
            </div>

            {/* Right: Posting Date & Payment Due Date */}
            <div style={{ width: '42%', textAlign: 'right' }}>
              <div>
                <span style={{ color: '#64748b' }}>Posting Date: </span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{postingDate}</span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{ color: '#64748b' }}>Payment Due Date: </span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{paymentDueDate}</span>
              </div>
            </div>
          </div>

          {/* 4. Clean Items Table (Removed: Stock UOM, UOM, Discount Amount, Distributed Discount Amount, Rate of Stock UOM, Grant Commission) */}
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '11.5px',
            marginBottom: '16px'
          }}>
            <thead>
              <tr style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '8px 6px', width: '38px', fontWeight: '600' }}>Sr</th>
                <th style={{ padding: '8px 8px', width: '70px', fontWeight: '600' }}>Item</th>
                <th style={{ padding: '8px 10px', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '8px 8px', width: '65px', textAlign: 'center', fontWeight: '600' }}>Quantity</th>
                <th style={{ padding: '8px 10px', width: '90px', textAlign: 'right', fontWeight: '600' }}>Rate</th>
                <th style={{ padding: '8px 10px', width: '105px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '8px 8px', width: '65px', textAlign: 'center', fontWeight: '600' }}>
                  Use Serial No / Batch Fields
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => {
                const desc = it.description || it.item || it.name || it.item_name || '';
                const qty = Number(it.qty || 1);
                const rate = Number(it.rate || it.price || it.amount || 0);
                const amount = qty * rate;
                const itemCode = it.item_code || String(idx + 1).padStart(2, '0');
                const hasSerial = Boolean(it.serial_no);

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                    <td style={{ padding: '10px 6px', color: '#475569' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 8px', fontWeight: '600', color: '#0f172a' }}>{itemCode}</td>
                    <td style={{ padding: '10px 10px', color: '#0f172a' }}>
                      <div style={{ fontWeight: '600' }}>{desc}</div>
                      {hasSerial && (
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          S/N: {it.serial_no}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#0f172a' }}>
                      Nos {qty}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', color: '#0f172a', fontFamily: monoFont }}>
                      ₹ {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: monoFont }}>
                      ₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#0f172a', fontSize: '13px' }}>
                      {hasSerial ? '✓' : '✓'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 5. Summary / Totals Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '12px',
            borderTop: '1px solid #cbd5e1',
            paddingTop: '12px',
            marginBottom: '14px'
          }}>
            {/* Left: Total Quantity */}
            <div>
              <div style={{ color: '#475569', fontWeight: '600' }}>Total Quantity:</div>
              <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{totalQty}</div>
            </div>

            {/* Right: Totals Breakdown */}
            <div style={{ width: '42%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Total:</span>
                <span style={{ fontWeight: '700', color: '#0f172a', fontFamily: monoFont }}>
                  ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#475569' }}>Discount:</span>
                  <span style={{ fontWeight: '600', color: '#dc2626', fontFamily: monoFont }}>
                    - ₹ {discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#475569' }}>Tax:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a', fontFamily: monoFont }}>
                    ₹ {tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#475569', fontWeight: '600' }}>Grand Total:</span>
                <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: monoFont }}>
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontWeight: '600' }}>Rounded Total:</span>
                <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: monoFont }}>
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
                <span style={{ color: '#64748b' }}>In Words:</span>
                <span style={{ fontWeight: '700', textAlign: 'right', maxWidth: '240px' }}>
                  INR {numberToWords(grandTotal).replace(' Rupees Only', '')} only.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ANCHORED SECTION (Payment, Bank, QR Code & Terms) */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            {/* Bank Details */}
            <div style={{ flex: 1, fontSize: '11px', color: '#334155', lineHeight: '1.45' }}>
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '3px', textTransform: 'uppercase', fontSize: '11px' }}>
                Bank &amp; Payment Details
              </div>
              <div><span style={{ color: '#64748b' }}>Company / A/C:</span> <strong>ANANTATECH CARE</strong></div>
              <div><span style={{ color: '#64748b' }}>Bank:</span> AU Small Finance Bank &bull; Branch: Koramangala</div>
              <div><span style={{ color: '#64748b' }}>A/C No:</span> <strong style={{ color: '#0f172a', fontFamily: monoFont }}>260226952682568</strong> &bull; <span style={{ color: '#64748b' }}>IFSC:</span> <strong style={{ color: '#0f172a', fontFamily: monoFont }}>AUBL0002695</strong></div>
              <div style={{ marginTop: '2px', color: '#0f766e', fontWeight: '600' }}>Pay via UPI / GPay / PhonePe / BHIM / IMPS</div>
            </div>

            {/* Scan To Pay QR */}
            <div id="invoice-qr-cell" style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                SCAN TO PAY
              </div>
              <div style={{ background: '#ffffff', padding: '2px', display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <QrCodeRenderer 
                  value="upi://pay?pa=anantatechcare011126@aubiz&pn=ANANTATECH%20CARE&cu=INR" 
                  size={65} 
                />
              </div>
              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>ANY UPI APP</div>
            </div>
          </div>

          {/* System Generated Notice */}
          <div style={{ 
            marginTop: '10px', 
            textAlign: 'center', 
            fontSize: '9.5px', 
            color: '#64748b', 
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            This is a computer generated document, no signature required.
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // YANTRABYTE SOLUTIONS: CLASSIC BLUE BORDER CORPORATE FORMAT
  // ----------------------------------------------------
  const primaryColor = "#0B5394";
  const primaryDark = "#1E3A8A";
  const primaryLight = "#F8FAFC";
  const primaryBorder = "#CBD5E1";
  const fontFam = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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
        fontFamily: fontFam, 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Centered Brand Watermark Emblem */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: isAnanta ? `url(${ANANTATECHCARE_LOGO_BASE64})` : `url(${YANTRABYTE_LOGO_BASE64})`,
        backgroundSize: isAnanta ? '500px 500px' : '560px auto',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: isAnanta ? 0.43 : 0.25,
        filter: isAnanta ? 'contrast(1.30) brightness(0.88)' : 'contrast(1.22) brightness(0.90)'
      }} />

      {/* Full Page Hardware & Circuit Watermark Pattern */}
      <div style={{
        position: 'absolute',
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundImage: `url(${HARDWARE_WATERMARK_BASE64})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 4,
        opacity: isAnanta ? 0.11 : 0.08
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
        border: isAnanta ? '2px solid #DC2626' : '2px solid #0B5394',
        borderRadius: isAnanta ? '16px' : '10px',
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: isAnanta ? '2.5px solid #DC2626' : `2px solid ${primaryColor}`, 
            paddingBottom: '10px', 
            marginBottom: '10px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {!isAnanta ? (
                <img
                  src={YANTRABYTE_LOGO_BASE64}
                  alt="YantraByte Solutions"
                  style={{ height: "82px", width: "auto", display: "block" }}
                />
              ) : (
                <img
                  src={ANANTATECHCARE_LOGO_BASE64}
                  alt="AnantaTech Care"
                  style={{ height: "105px", width: "105px", objectFit: "contain", display: "block" }}
                />
              )}
              <div>
                
                <h1 style={{ 
                  color: primaryColor, 
                  fontSize: isAnanta ? "23px" : "24px", 
                  fontWeight: "900", 
                  margin: 0, 
                  letterSpacing: isAnanta ? "-0.02em" : "0.4px" 
                }}>
                  {isAnanta ? "ANANTATECH CARE" : "YANTRABYTE SOLUTIONS"}
                </h1>
                <div style={{ fontSize: '12px', color: '#333333', marginTop: '3px', lineHeight: '1.35', fontWeight: '500' }}>
                  47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br />
                  Chikkabettahalli, Bengaluru - 560097<br />
                  Phone: 09986742525 | Email: {companyEmail}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontWeight: '900', 
                color: isCancelled ? '#DC2626' : primaryColor, 
                fontSize: isAnanta ? '22px' : '21px', 
                textTransform: 'uppercase', 
                letterSpacing: isAnanta ? '0.04em' : '0.6px' 
              }}>
                {docTitle}
              </div>
              <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>
                {docNumberLabel} 
                <strong style={{ 
                  color: isAnanta ? '#991B1B' : '#000000', 
                  fontSize: isAnanta ? '15px' : '14.5px',
                  fontFamily: isAnanta ? monoFont : 'inherit',
                  letterSpacing: isAnanta ? '0.04em' : 'normal',
                  fontWeight: '700'
                }}>
                  {invoice.invoice_no || 'DRAFT'}
                </strong>
              </div>
              <div style={{ fontSize: '14px', color: '#475569', marginTop: '2px' }}>
                Date: <strong style={{ color: '#000000', fontSize: '14px' }}>{formattedDate}</strong>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div style={{ 
            marginBottom: '10px', 
            backgroundColor: primaryLight, 
            padding: '10px 14px', 
            borderRadius: isAnanta ? '10px' : '6px', 
            border: isAnanta ? `1px solid ${primaryBorder}` : '1px solid #cbd5e1' 
          }}>
            <div style={{ fontSize: '13px', lineHeight: '1.45', color: '#1e293b' }}>
              <span style={{ 
                color: isAnanta ? '#DC2626' : '#64748b', 
                fontSize: '11px', 
                textTransform: 'uppercase', 
                fontWeight: '800', 
                letterSpacing: '0.06em' 
              }}>
                Bill To (Customer Details)
              </span><br />
              <strong style={{ color: primaryColor, fontSize: '16px', fontWeight: '800' }}>{invoice.customer_name || '—'}</strong><br />
              Phone: <strong>{invoice.phone || '—'}</strong> &nbsp;|&nbsp; Email: {invoice.email || '—'}<br />
              Address: {invoice.address || '—'}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ 
            width: '100%', 
            borderCollapse: isAnanta ? 'separate' : 'collapse', 
            borderSpacing: 0,
            tableLayout: 'fixed', 
            borderBottom: isAnanta ? `1px solid ${primaryBorder}` : '1px solid #000000', 
            fontSize: '13.5px',
            borderRadius: isAnanta ? '8px' : '0',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: isAnanta ? '#DC2626' : primaryColor, color: '#ffffff', height: '34px', fontSize: '13px' }}>
                <th style={{ width: '45px', textAlign: 'center', borderRight: isAnanta ? '1px solid rgba(255,255,255,0.2)' : '1px solid #000000', borderBottom: isAnanta ? 'none' : '1px solid #000000', padding: '6px 4px', fontWeight: '700', textTransform: isAnanta ? 'uppercase' : 'none', letterSpacing: isAnanta ? '0.05em' : 'normal' }}>
                  Sl<br />No.
                </th>
                <th style={{ textAlign: 'left', borderRight: isAnanta ? '1px solid rgba(255,255,255,0.2)' : '1px solid #000000', borderBottom: isAnanta ? 'none' : '1px solid #000000', padding: '6px 10px', fontWeight: '700', textTransform: isAnanta ? 'uppercase' : 'none', letterSpacing: isAnanta ? '0.05em' : 'normal' }}>
                  Description
                </th>
                <th style={{ width: '55px', textAlign: 'center', borderRight: isAnanta ? '1px solid rgba(255,255,255,0.2)' : '1px solid #000000', borderBottom: isAnanta ? 'none' : '1px solid #000000', padding: '6px 4px', fontWeight: '700', textTransform: isAnanta ? 'uppercase' : 'none', letterSpacing: isAnanta ? '0.05em' : 'normal' }}>
                  Qty
                </th>
                <th style={{ width: '105px', textAlign: 'right', borderRight: isAnanta ? '1px solid rgba(255,255,255,0.2)' : '1px solid #000000', borderBottom: isAnanta ? 'none' : '1px solid #000000', padding: '6px 10px', fontWeight: '700', textTransform: isAnanta ? 'uppercase' : 'none', letterSpacing: isAnanta ? '0.05em' : 'normal' }}>
                  Rate (₹)
                </th>
                <th style={{ width: '115px', textAlign: 'right', borderBottom: isAnanta ? 'none' : '1px solid #000000', padding: '6px 10px', fontWeight: '700', textTransform: isAnanta ? 'uppercase' : 'none', letterSpacing: isAnanta ? '0.05em' : 'normal' }}>
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
                const rowBg = 'transparent';
                const cellBorder = isAnanta ? `1px solid #E2E8F0` : '1px solid #000000';
                return (
                  <tr key={idx} style={{ backgroundColor: rowBg, minHeight: '30px' }}>
                    <td style={{ textAlign: 'center', borderRight: cellBorder, borderBottom: 'none', padding: '6px 4px', color: '#000000', fontWeight: 'bold', fontSize: '13.5px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ textAlign: 'left', borderRight: cellBorder, borderBottom: 'none', padding: '6px 10px', color: '#000000', wordBreak: 'break-word', fontSize: '13.5px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{desc}</div>
                      {it.serial_no && (
                        <div style={{ fontSize: '12px', color: isAnanta ? '#DC2626' : '#334155', marginTop: '2px', fontWeight: 'bold' }}>
                          S/N: {it.serial_no}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', borderRight: cellBorder, borderBottom: 'none', padding: '6px 4px', color: '#000000', fontWeight: 'bold', fontSize: '13.5px', fontFamily: isAnanta ? monoFont : 'inherit' }}>
                      {qty}
                    </td>
                    <td style={{ textAlign: 'right', borderRight: cellBorder, borderBottom: 'none', padding: '6px 10px', color: '#000000', fontSize: '13.5px', fontFamily: isAnanta ? monoFont : 'inherit' }}>
                      {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', borderBottom: 'none', padding: '6px 10px', fontWeight: 'bold', color: '#000000', fontSize: '14px', fontFamily: isAnanta ? monoFont : 'inherit' }}>
                      {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {/* Padding rows to fill full A4 height without empty gap */}
              {[...Array(fillerCount)].map((_, idx) => (
                <tr key={`fill-${idx}`} style={{ backgroundColor: 'transparent', height: '24px' }}>
                  <td style={{ borderRight: isAnanta ? '1px solid #E2E8F0' : '1px solid #000000', borderBottom: 'none', padding: '2px 4px' }}>&nbsp;</td>
                  <td style={{ borderRight: isAnanta ? '1px solid #E2E8F0' : '1px solid #000000', borderBottom: 'none', padding: '2px 8px' }}>&nbsp;</td>
                  <td style={{ borderRight: isAnanta ? '1px solid #E2E8F0' : '1px solid #000000', borderBottom: 'none', padding: '2px 4px' }}>&nbsp;</td>
                  <td style={{ borderRight: isAnanta ? '1px solid #E2E8F0' : '1px solid #000000', borderBottom: 'none', padding: '2px 8px' }}>&nbsp;</td>
                  <td style={{ borderBottom: 'none', padding: '2px 8px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '13.5px', backgroundColor: 'transparent' }}>
            <tbody>
              <tr>
                {/* Left: Amount in Words */}
                <td style={{ width: '56%', verticalAlign: 'top', padding: '10px 12px', borderRight: isAnanta ? '1px solid #E2E8F0' : '1px solid #000000' }}>
                  <div style={{ 
                    backgroundColor: isAnanta ? '#FEF08A' : '#D9EAF7', 
                    color: isAnanta ? '#854D0E' : '#92400E', 
                    fontWeight: '800', 
                    fontSize: '11px', 
                    padding: '3px 8px', 
                    display: 'inline-block', 
                    marginBottom: '6px', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Amount in Words:
                  </div>
                  <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '13.5px', color: '#000000', lineHeight: '1.4' }}>
                    {numberToWords(grandTotal)}
                  </div>
                </td>

                {/* Right: Calculations Breakdown */}
                <td style={{ width: '44%', verticalAlign: 'top', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', backgroundColor: 'transparent' }}>
                    <tbody>
                      {calcRows.map((row, idx) => (
                        <tr 
                          key={row.label}
                          style={{ 
                            backgroundColor: row.isHighlight ? (isAnanta ? '#FEF9C3' : '#FFFBEB') : 'transparent',
                            height: '26px'
                          }}
                        >
                          <td style={{ 
                            padding: '4px 8px', 
                            color: row.isHighlight ? (isAnanta ? '#DC2626' : '#15803D') : (row.isDue ? '#B91C1C' : '#1e293b'), 
                            fontWeight: (row.isHighlight || row.isDue) ? '800' : '600',
                            fontSize: (row.isHighlight || row.isDue) ? '14px' : '13px',
                            borderBottom: idx === calcRows.length - 1 ? 'none' : (isAnanta ? '1px solid #E2E8F0' : '1px solid #000000')
                          }}>
                            {row.label}
                          </td>
                          <td style={{ 
                            padding: '4px 8px', 
                            textAlign: 'right', 
                            color: row.isHighlight ? (isAnanta ? '#DC2626' : '#15803D') : (row.isDue ? '#B91C1C' : '#000000'), 
                            fontWeight: (row.isHighlight || row.isDue) ? '800' : '700',
                            fontSize: (row.isHighlight || row.isDue) ? '15px' : '13.5px',
                            fontFamily: isAnanta ? monoFont : 'inherit',
                            borderBottom: idx === calcRows.length - 1 ? 'none' : (isAnanta ? '1px solid #E2E8F0' : '1px solid #000000')
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
                <td style={{ 
                  width: '48%', 
                  verticalAlign: 'top', 
                  border: isAnanta ? `1px solid ${primaryBorder}` : '1px solid #000000', 
                  borderRadius: isAnanta ? '8px' : '0', 
                  padding: 0, 
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    backgroundColor: primaryColor, 
                    color: '#ffffff', 
                    fontWeight: 'bold', 
                    fontSize: '12px', 
                    textAlign: 'center', 
                    padding: '5px 0', 
                    letterSpacing: isAnanta ? '0.05em' : '0.4px',
                    textTransform: isAnanta ? 'uppercase' : 'none'
                  }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ padding: '8px 10px', fontSize: '11px', color: '#1e293b', lineHeight: '1.45', fontWeight: '500' }}>
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
                        <div style={{ marginBottom: '1px' }}>3. AnantaTech Care is not responsible for any data loss.</div>
                        <div style={{ marginBottom: '1px' }}>4. Customer should take backup of all important files prior.</div>
                        <div style={{ marginBottom: '1px' }}>5. Physical, liquid or burnt damages void warranty.</div>
                        <div>6. No warranty for swollen batteries or electrical faults.</div>
                      </>
                    )}
                  </div>
                </td>

                {/* Bank & Payment Details Box */}
                <td style={{ 
                  width: '52%', 
                  verticalAlign: 'top', 
                  border: isAnanta ? `1px solid ${primaryBorder}` : '1px solid #000000', 
                  borderRadius: isAnanta ? '8px' : '0', 
                  padding: 0, 
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    backgroundColor: primaryColor, 
                    color: '#ffffff', 
                    fontWeight: 'bold', 
                    fontSize: '12px', 
                    textAlign: 'center', 
                    padding: '5px 0', 
                    letterSpacing: isAnanta ? '0.05em' : '0.4px',
                    textTransform: isAnanta ? 'uppercase' : 'none'
                  }}>
                    {isAnanta ? "Payment Details" : "Bank & Payment Details"}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: 'middle', fontSize: '12px', lineHeight: '1.45', color: '#0f172a' }}>
                            {!isAnanta ? (
                              <>
                                <div><span style={{ fontWeight: "bold", color: "#1e3a8a" }}>Bank:</span> North East Small Finance Bank</div>
                                <div><span style={{ fontWeight: "bold", color: "#1e3a8a" }}>A/C Name:</span> YantraByte Solutions</div>
                                <div><span style={{ fontWeight: "bold", color: "#1e3a8a" }}>A/C No:</span> <strong style={{ color: "#000000", fontSize: "13px" }}>033311501023226</strong></div>
                                <div><span style={{ fontWeight: "bold", color: "#1e3a8a" }}>IFSC:</span> <strong style={{ color: "#000000", fontSize: "13px" }}>NESF0000333</strong></div>
                                <div><span style={{ fontWeight: "bold", color: "#1e3a8a" }}>UPI ID:</span> <strong style={{ color: "#047857", fontSize: "12.5px" }}>s0424237152@slc</strong></div>
                                <div style={{ marginTop: "2px", fontSize: "11px", color: "#4338ca", fontWeight: "bold", lineHeight: "1.25" }}>
                                  Pay via GPay / PhonePe / BHIM / Paytm: <span style={{ color: "#b91c1c", fontSize: "12px" }}>9986742525</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div><span style={{ fontWeight: "bold", color: primaryDark }}>Company / A/C:</span> ANANTATECH CARE</div>
                                <div><span style={{ fontWeight: "bold", color: primaryDark }}>Bank:</span> AU Small Finance Bank</div>
                                <div><span style={{ fontWeight: "bold", color: primaryDark }}>Branch:</span> Koramangala</div>
                                <div><span style={{ fontWeight: "bold", color: primaryDark }}>A/C No:</span> <strong style={{ color: primaryDark, fontSize: "13px" }}>260226952682568</strong></div>
                                <div><span style={{ fontWeight: "bold", color: primaryDark }}>IFSC:</span> <strong style={{ color: primaryDark, fontSize: "13px" }}>AUBL0002695</strong></div>
                                <div style={{ marginTop: "3px", fontSize: "11px", color: isAnanta ? "#B91C1C" : "#0D9488", fontWeight: "bold" }}>Pay via NEFT / RTGS / IMPS / UPI</div>
                              </>
                            )}
                          </td>
                          <td id="invoice-qr-cell" style={{ width: '92px', verticalAlign: 'middle', textAlign: 'center', paddingLeft: '4px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: isAnanta ? primaryDark : '#0B5394', marginBottom: '3px', letterSpacing: '0.5px' }}>
                              SCAN TO PAY
                            </div>
                            <div style={{ background: '#ffffff', padding: '2px', display: 'inline-block', border: `1.5px solid ${isAnanta ? primaryDark : '#0B5394'}`, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              <QrCodeRenderer 
                                value={isAnanta ? "upi://pay?pa=anantatechcare011126@aubiz&pn=ANANTATECH%20CARE&cu=INR" : "upi://pay?pa=s0424237152@slc&pn=YantraByte%20Solutions&cu=INR"} 
                                size={80} 
                              />
                            </div>
                            {isAnanta && <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>ANY UPI APP</div>}
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
            backgroundColor: isAnanta ? '#FEFCE8' : '#F1F5F9',
            border: `1.2px solid ${primaryColor}`,
            borderRadius: isAnanta ? '6px' : '4px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '900',
              color: isAnanta ? '#991B1B' : '#000000',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              THIS IS A SYSTEM GENERATED DOCUMENT, NO SIGNATURE REQUIRED
            </div>
          </div>


        </div>
      </div>
    </div>
  );
});

InvoicePdfTemplate.displayName = 'InvoicePdfTemplate';
