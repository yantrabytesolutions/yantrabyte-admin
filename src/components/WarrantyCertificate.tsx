
import { renderToString } from 'react-dom/server';
import html2pdf from 'html2pdf.js';
import { Invoice } from '../types';

export const generateWarrantyCertificate = async (invoice: Invoice, businessProfile: any) => {
  if (!invoice.warranty_months || invoice.warranty_months <= 0) {
    throw new Error('This invoice does not have a warranty.');
  }

  const warrantyEndDate = new Date(invoice.date);
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + invoice.warranty_months);
  
  const formattedEndDate = warrantyEndDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  
  const formattedStartDate = new Date(invoice.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const Component = () => (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', color: '#1f2937', maxWidth: '800px', margin: '0 auto', border: '2px solid #e5e7eb', borderRadius: '12px', background: '#fff', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', color: '#0369a1', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Warranty Certificate</h1>
        <div style={{ width: '100px', height: '4px', background: '#0369a1', margin: '0 auto' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <div>
          <h3 style={{ color: '#6b7280', fontSize: '14px', textTransform: 'uppercase', marginBottom: '5px' }}>Issued By</h3>
          <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0' }}>{businessProfile?.business_name || 'Yantrabyte Solutions'}</p>
          <p style={{ margin: '5px 0 0', color: '#4b5563', whiteSpace: 'pre-line' }}>{businessProfile?.address || 'India'}</p>
          <p style={{ margin: '5px 0 0', color: '#4b5563' }}>{businessProfile?.phone || ''}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ color: '#6b7280', fontSize: '14px', textTransform: 'uppercase', marginBottom: '5px' }}>Certificate Info</h3>
          <p style={{ margin: '0 0 5px' }}><strong>Invoice Ref:</strong> {invoice.invoice_no}</p>
          <p style={{ margin: '0 0 5px' }}><strong>Issued To:</strong> {invoice.customer_name}</p>
          <p style={{ margin: '0' }}><strong>Phone:</strong> {invoice.phone}</p>
        </div>
      </div>

      <div style={{ marginBottom: '40px', background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#0369a1' }}>Coverage Details</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Start Date</td>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'right' }}>{formattedStartDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>End Date</td>
              <td style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'right', color: '#16a34a' }}>{formattedEndDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 0', color: '#64748b' }}>Duration</td>
              <td style={{ padding: '10px 0', fontWeight: 'bold', textAlign: 'right' }}>{invoice.warranty_months} Months</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: '#0369a1', marginBottom: '15px' }}>Covered Items / Services</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', background: '#e2e8f0', borderBottom: '2px solid #cbd5e1' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '10px', background: '#e2e8f0', borderBottom: '2px solid #cbd5e1' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{item.description}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
        <p>This certificate guarantees the products/services listed above against defects in material and workmanship under normal use during the warranty period.</p>
        <p>Physical damage, liquid damage, or unauthorized tampering voids this warranty.</p>
      </div>
      
      {/* Watermark */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '120px', color: 'rgba(3, 105, 161, 0.05)', whiteSpace: 'nowrap', pointerEvents: 'none', fontWeight: 'bold' }}>
        WARRANTY
      </div>
    </div>
  );

  const htmlString = renderToString(<Component />);
  const element = document.createElement('div');
  element.innerHTML = htmlString;
  
  const opt = {
    margin: 0.5,
    filename: `Warranty-${invoice.invoice_no}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in' as const, format: 'a4', orientation: 'portrait' as const }
  };

  await html2pdf().set(opt).from(element).save();
};
