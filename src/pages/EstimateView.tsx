import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QrCodeSvg } from '../components/QrCodeSvg';
import { HardwareBrandsBanner } from '../components/HardwareBrandsBanner';

interface InvoiceItem {
  description: string;
  serial_no?: string;
  qty: number;
  rate: number;
}

interface EstimateData {
  id: string;
  invoice_no: string;
  doc_type: string;
  date: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  round_off: number;
  grand_total: number;
  advance_paid: number;
  balance_due: number;
  payment_status?: string;
  terms_conditions?: string;
  warranty_months?: number;
  pdf_url?: string;
  created_at: string;
}

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

function formatINR(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  // Handle dd/mm/yyyy format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return dateStr;
  }
  // Handle ISO format
  try {
    return new Date(dateStr).toLocaleDateString('en-GB');
  } catch {
    return dateStr;
  }
}

export default function EstimateView() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!id) {
        setError('Invalid estimate link.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !data) {
          setError('This estimate could not be found. It may have been removed or the link is invalid.');
          setLoading(false);
          return;
        }

        // Parse items if stored as string
        let parsedItems = data.items;
        if (typeof parsedItems === 'string') {
          try {
            parsedItems = JSON.parse(parsedItems);
          } catch {
            parsedItems = [];
          }
        }

        setEstimate({ ...data, items: Array.isArray(parsedItems) ? parsedItems : [] });
      } catch {
        setError('Something went wrong. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #f4f6f8 50%, #e3edf7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', Arial, sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #e0e7ef',
            borderTopColor: '#0B5394', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#5f7a99', fontSize: 16, fontWeight: 500 }}>Loading estimate...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #f4f6f8 50%, #e3edf7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', Arial, sans-serif",
        padding: 20
      }}>
        <div style={{
          maxWidth: 480, width: '100%', background: '#fff',
          borderRadius: 16, padding: '48px 32px',
          boxShadow: '0 4px 24px rgba(11,83,148,0.10)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
            Estimate Not Found
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            {error || 'This estimate could not be found.'}
          </p>
          <a
            href="https://yantrabyte.anantatechcare.com"
            style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'linear-gradient(135deg, #0B5394, #1A73E8)',
              color: '#fff', borderRadius: 10, textDecoration: 'none',
              fontWeight: 600, fontSize: 14, transition: 'transform 0.2s'
            }}
          >
            Visit YantraByte
          </a>
        </div>
      </div>
    );
  }

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!estimate?.pdf_url) return;
    const safeCustomer = estimate.customer_name?.trim().replace(/[/\\?%*:|"<>]/g, '-') || `YBS-${estimate.invoice_no}`;
    const filename = `${safeCustomer}.pdf`;
    try {
      const res = await fetch(estimate.pdf_url);
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Direct blob download failed, opening in new window:', err);
      window.open(estimate.pdf_url, '_blank');
    }
  };

  const items: InvoiceItem[] = estimate.items || [];
  const isQuotation = estimate.doc_type === 'Quotation';
  const docLabel = isQuotation ? 'Quotation' : 'Invoice';
  const docTitle = isQuotation ? 'QUOTATION' : 'TAX INVOICE';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f0fe 0%, #f4f6f8 50%, #e3edf7 100%)',
      fontFamily: "'Inter', Arial, sans-serif",
      padding: '20px 16px'
    }}>
      {/* Top Banner */}
      <div style={{
        maxWidth: 800, margin: '0 auto 16px',
        background: 'linear-gradient(135deg, #0B5394, #1A73E8)',
        borderRadius: 12, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        boxShadow: '0 4px 16px rgba(11,83,148,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16
          }}>YB</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>YantraByte Solutions</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{docLabel} #{estimate.invoice_no}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {estimate.pdf_url && (
            <button
              onClick={handleDownloadPdf}
              style={{
                padding: '8px 18px', background: 'rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: 8, textDecoration: 'none',
                fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: "'Inter', Arial, sans-serif"
              }}
            >
              📥 Download PDF
            </button>
          )}
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 18px', background: 'rgba(255,255,255,0.15)',
              color: '#fff', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: "'Inter', Arial, sans-serif"
            }}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div id="estimate-card" style={{
        maxWidth: 800, margin: '0 auto',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 4px 24px rgba(11,83,148,0.10), 0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px', borderBottom: '2px solid #e8f0fe',
          flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #0B5394, #1A73E8)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 20,
              boxShadow: '0 2px 8px rgba(11,83,148,0.3)'
            }}>YB</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0B5394', margin: 0, letterSpacing: -0.3 }}>
                YANTRABYTE SOLUTIONS
              </h1>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru - 560097
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                📱 09986742525 &nbsp;|&nbsp; ✉️ yantrabyte.solutions@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Document Title Banner */}
        <div style={{
          background: isQuotation
            ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
            : 'linear-gradient(135deg, #0B5394, #1A73E8)',
          color: '#fff', textAlign: 'center',
          padding: '12px 0', fontWeight: 700,
          fontSize: 16, letterSpacing: 3, textTransform: 'uppercase'
        }}>
          {docTitle}
        </div>

        {/* Invoice No & Date Row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid #e8f0fe',
          flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>
            {isQuotation ? 'Quotation No: ' : 'Invoice No: '}{estimate.invoice_no}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#374151' }}>
            Date: {formatDate(estimate.date)}
          </div>
        </div>

        {/* Bill To Section */}
        <div style={{ borderBottom: '1px solid #e8f0fe' }}>
          <div style={{
            background: '#D9EAF7', padding: '8px 28px',
            fontWeight: 700, fontSize: 13, color: '#7c3aed',
            borderBottom: '1px solid #e8f0fe'
          }}>
            Bill To:
          </div>
          <div style={{ padding: '14px 28px', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1a1a2e', marginBottom: 4 }}>
              {estimate.customer_name || '—'}
            </div>
            <div style={{ fontSize: 14, color: '#4b5563' }}>
              📱 {estimate.phone || '—'} &nbsp;&nbsp; ✉️ {estimate.email || '—'}
            </div>
            {estimate.address && (
              <div style={{ fontSize: 14, color: '#4b5563' }}>
                📍 {estimate.address}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: 14
          }}>
            <thead>
              <tr style={{
                background: isQuotation
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                  : 'linear-gradient(135deg, #0B5394, #1565c0)',
                color: '#fff'
              }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: 50, fontWeight: 600 }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: 70, fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', width: 110, fontWeight: 600 }}>Rate (₹)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', width: 130, fontWeight: 600 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const amount = (item.qty || 1) * (item.rate || 0);
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '11px 16px', textAlign: 'center', color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>{idx + 1}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#1a1a2e', borderBottom: '1px solid #f0f0f0' }}>
                      <div>{item.description || '—'}</div>
                      {item.serial_no && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                          S/N: {item.serial_no}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #f0f0f0' }}>{item.qty || 1}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', color: '#374151', borderBottom: '1px solid #f0f0f0' }}>{formatINR(item.rate || 0)}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#1a1a2e', borderBottom: '1px solid #f0f0f0' }}>{formatINR(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Amount in Words + Totals */}
        <div style={{
          display: 'flex',
          borderTop: '2px solid #e8f0fe',
          flexWrap: 'wrap'
        }}>
          {/* Amount in Words */}
          <div style={{ flex: '1 1 300px', padding: '16px 28px', borderRight: '1px solid #e8f0fe' }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px',
              background: '#D9EAF7', color: '#b45309',
              fontWeight: 700, fontSize: 12, borderRadius: 4, marginBottom: 8
            }}>
              Amount in Words:
            </div>
            <div style={{ fontStyle: 'italic', color: '#374151', fontSize: 14 }}>
              {numberToWords(estimate.grand_total || 0)} Only
            </div>
          </div>

          {/* Totals */}
          <div style={{ flex: '0 0 280px', minWidth: 250 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: '#6b7280', fontSize: 14 }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>₹{formatINR(estimate.subtotal || 0)}</span>
            </div>
            {Number(estimate.discount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Discount</span>
                <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 14 }}>-₹{formatINR(estimate.discount)}</span>
              </div>
            )}
            {Number(estimate.tax || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Tax</span>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>₹{formatINR(estimate.tax)}</span>
              </div>
            )}
            {Number(estimate.round_off || 0) !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Round Off</span>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>₹{formatINR(estimate.round_off)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 20px', background: '#f0fdf4',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span style={{ fontWeight: 700, color: '#15803d', fontSize: 15 }}>Grand Total</span>
              <span style={{ fontWeight: 700, color: '#15803d', fontSize: 17 }}>₹{formatINR(estimate.grand_total || 0)}</span>
            </div>
            {Number(estimate.advance_paid || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Advance Paid</span>
                <span style={{ fontWeight: 600, color: '#15803d', fontSize: 14 }}>₹{formatINR(estimate.advance_paid)}</span>
              </div>
            )}
            {Number(estimate.balance_due || 0) > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 20px', background: '#fef2f2'
              }}>
                <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 15 }}>Balance Due</span>
                <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 17 }}>₹{formatINR(estimate.balance_due)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Bank Details */}
        <div style={{
          display: 'flex', borderTop: '2px solid #e8f0fe',
          flexWrap: 'wrap'
        }}>
          {/* Terms */}
          <div style={{ flex: '1 1 300px', borderRight: '1px solid #e8f0fe' }}>
            <div style={{
              background: isQuotation
                ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                : 'linear-gradient(135deg, #0B5394, #1A73E8)',
              color: '#fff', padding: '10px 20px',
              fontWeight: 700, fontSize: 13
            }}>
              Terms & Conditions
            </div>
            <div style={{ padding: '14px 20px', fontSize: 13, color: '#4b5563', lineHeight: 1.8 }}>
              {estimate.terms_conditions ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{estimate.terms_conditions}</div>
              ) : isQuotation ? (
                <>
                  <p>1. Estimate valid for 7 days.</p>
                  <p>2. Advance payment of 85% required and remaining against Delivery.</p>
                  <p>3. Final amount may vary if hidden faults are found.</p>
                </>
              ) : (
                <>
                  <p>1. Service warranty is valid for 30 days only.</p>
                  <p>2. No warranty for Windows installation/software issues.</p>
                  <p>3. YantraByte Solutions is not responsible for any data loss.</p>
                  <p>4. Customer should take backup of all important files prior.</p>
                  <p>5. Physical, liquid or burnt damages void warranty.</p>
                </>
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div style={{ flex: '0 0 280px', minWidth: 250 }}>
            <div style={{
              background: isQuotation
                ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                : 'linear-gradient(135deg, #0B5394, #1A73E8)',
              color: '#fff', padding: '10px 20px',
              fontWeight: 700, fontSize: 13
            }}>
              Bank & Payment Details
            </div>
            <div style={{ padding: '14px 20px', fontSize: 12, color: '#374151', lineHeight: 1.9 }}>
              <div><strong>Bank:</strong> North East Small Finance Bank</div>
              <div><strong>A/C Name:</strong> YantraByte Solutions</div>
              <div><strong>A/C No:</strong> 033311501023226</div>
              <div><strong>IFSC:</strong> NESF0000333</div>
              <div><strong>UPI:</strong> s0424237152@slc</div>
            </div>
            <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <QrCodeSvg
                value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${estimate.balance_due || estimate.grand_total}&cu=INR`}
                size={72}
              />
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                Scan to pay<br />via UPI
              </div>
            </div>
          </div>
        </div>

        {/* Brands Banner */}
        <div style={{ padding: '0 16px 8px 16px' }}>
          <HardwareBrandsBanner compact={true} />
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '2px solid #e8f0fe',
          padding: '16px 28px',
          textAlign: 'center',
          background: '#fafbfc'
        }}>
          <p style={{ fontSize: 12, color: '#000000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            THIS IS A SYSTEM GENERATED DOCUMENT, NO SIGNATURE REQUIRED
          </p>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 500 }}>
            © {new Date().getFullYear()} YantraByte Solutions • yantrabyte.anantatechcare.com
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: #fff !important; margin: 0; padding: 0; }
          div[style*="max-width: 800"] { max-width: 100% !important; box-shadow: none !important; border-radius: 0 !important; }
          div[style*="linear-gradient(135deg, #0B5394, #1A73E8)"][style*="border-radius: 12"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
