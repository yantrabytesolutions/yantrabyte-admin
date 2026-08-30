import { forwardRef } from 'react';
import type { ServiceTicket } from '../types';
import { HardwareBrandsBanner } from './HardwareBrandsBanner';
import { YANTRABYTE_LOGO_BASE64, HARDWARE_WATERMARK_BASE64 } from '../assets/invoiceAssets';
import { QrCodeSvg } from './QrCodeSvg';

interface Props {
  ticket: Partial<ServiceTicket & {
    device_make_model?: string;
    service_method?: string;
    pre_approved_budget?: string;
    device_password?: string;
    accessories_received?: string;
    technician_notes?: string;
  }>;
  companySignature?: string;
}

export const ServiceTicketPdfTemplate = forwardRef<HTMLDivElement, Props>(({ 
  ticket, 
  companySignature: _companySignature 
}, ref) => {
  const ticketNo = ticket.ticket_number || 'DRAFT';
  const rawDate = ticket.created_at || new Date().toISOString();
  const dateObj = new Date(rawDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? `${dateObj.toLocaleDateString('en-GB')} ${dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : rawDate;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track-ticket?t=${ticketNo}`
    : `https://yantrabyte.anantatechcare.com/track-ticket?t=${ticketNo}`;

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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
        opacity: 0.12,
        pointerEvents: 'none'
      }}>
        <div style={{
          width: '500px',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src={YANTRABYTE_LOGO_BASE64} 
            alt="Watermark" 
            style={{ width: '460px', height: 'auto', objectFit: 'contain', display: 'block', filter: 'contrast(1.15) brightness(0.92)' }} 
          />
        </div>
      </div>

      {/* Hardware Circuit Watermark */}
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
        zIndex: 1,
        opacity: 0.30
      }} />

      {/* Main Container Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        {/* Main Box Outer Border */}
        <div style={{ border: '1.5px solid #000000', backgroundColor: 'transparent' }}>
          
          {/* Header Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000' }}>
            <tbody>
              <tr>
                <td style={{ width: '130px', padding: '10px 12px', verticalAlign: 'middle' }}>
                  <img 
                    src={YANTRABYTE_LOGO_BASE64} 
                    alt="YantraByte Solutions" 
                    style={{ height: '95px', width: 'auto', display: 'block' }} 
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
            backgroundColor: '#0B5394',
            color: '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '5px 0',
            fontSize: '15px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderBottom: '1px solid #000000'
          }}>
            SERVICE TICKET & JOB SHEET
          </div>

          {/* Doc Number and Date Row */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', padding: '7px 12px', borderRight: '1px solid #000000', fontWeight: 'bold', fontSize: '14px', color: '#DC2626' }}>
                  Ticket No: {ticketNo}
                </td>
                <td style={{ width: '50%', padding: '7px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#333333' }}>
                  Date: {formattedDate}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Customer & Device Information Grid */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderBottom: '1px solid #000000', fontSize: '12.5px' }}>
            <tbody>
              <tr>
                {/* Left 50%: Customer Details */}
                <td style={{ width: '50%', verticalAlign: 'top', borderRight: '1px solid #000000', padding: 0 }}>
                  <div style={{ backgroundColor: '#D9EAF7', color: '#0369A1', padding: '4px 12px', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #000000' }}>
                    Customer Details:
                  </div>
                  <div style={{ padding: '8px 12px', lineHeight: '1.45' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#000000', marginBottom: '3px' }}>
                      {ticket.customer_name || '—'}
                    </div>
                    <div><span style={{ fontWeight: 'bold', color: '#333333' }}>Phone:</span> {ticket.customer_phone || '—'}</div>
                    <div><span style={{ fontWeight: 'bold', color: '#333333' }}>Email:</span> {ticket.customer_email || '—'}</div>
                    <div style={{ marginTop: '2px' }}><span style={{ fontWeight: 'bold', color: '#333333' }}>Address:</span> {ticket.customer_address || '—'}</div>
                  </div>
                </td>

                {/* Right 50%: Device Details */}
                <td style={{ width: '50%', verticalAlign: 'top', padding: 0 }}>
                  <div style={{ backgroundColor: '#D9EAF7', color: '#0369A1', padding: '4px 12px', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #000000' }}>
                    Device & Service Info:
                  </div>
                  <div style={{ padding: '8px 12px', lineHeight: '1.45' }}>
                    <div><span style={{ fontWeight: 'bold', color: '#333333' }}>Device Type:</span> <span style={{ fontWeight: 'bold', color: '#000000' }}>{ticket.device_type || '—'}</span></div>
                    <div><span style={{ fontWeight: 'bold', color: '#333333' }}>Make / Model:</span> {ticket.device_make_model || '—'}</div>
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#333333' }}>Status:</span>{' '}
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#0F766E' }}>{ticket.status || 'Received'}</span>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <span style={{ fontWeight: 'bold', color: '#333333' }}>Priority:</span>{' '}
                      <span style={{ fontWeight: 'bold', textTransform: 'capitalize', color: String(ticket.priority) === 'urgent' || String(ticket.priority) === 'high' ? '#DC2626' : '#2563EB' }}>
                        {ticket.priority || 'Normal'}
                      </span>
                    </div>
                    <div><span style={{ fontWeight: 'bold', color: '#333333' }}>Service Method:</span> {ticket.service_method === 'home_pickup' ? 'Home Pickup' : 'Workshop Drop-off'}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Reported Complaint / Problem Section */}
          <div style={{ borderBottom: '1px solid #000000' }}>
            <div style={{ backgroundColor: '#D9EAF7', color: '#B45309', padding: '4px 12px', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #000000' }}>
              Reported Issue / Customer Complaint:
            </div>
            <div style={{ padding: '10px 12px', fontSize: '13px', lineHeight: '1.5', minHeight: '65px', color: '#111827', whiteSpace: 'pre-wrap' }}>
              {ticket.issue_description || 'No complaint description provided.'}
            </div>
          </div>

          {/* Technical Diagnostics & Checklist Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B5394', color: '#ffffff', height: '28px' }}>
                <th style={{ width: '50%', textAlign: 'left', borderRight: '1px solid #000000', padding: '5px 10px', fontWeight: 'bold' }}>
                  Technician Diagnostics / Checkpoints
                </th>
                <th style={{ width: '50%', textAlign: 'left', padding: '5px 10px', fontWeight: 'bold' }}>
                  Accessories Received Checklist
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', borderRight: '1px solid #000000', padding: '8px 10px', minHeight: '80px', lineHeight: '1.5', color: '#333333' }}>
                  <div>[ ] Power-On & Booting Test</div>
                  <div>[ ] Display & Backlight Check</div>
                  <div>[ ] Keyboard / Touchpad / Ports</div>
                  <div>[ ] Motherboard Short / Diagnostics</div>
                  {ticket.technician_notes && (
                    <div style={{ marginTop: '6px', fontWeight: 'bold', color: '#000000' }}>
                      Notes: {ticket.technician_notes}
                    </div>
                  )}
                </td>
                <td style={{ verticalAlign: 'top', padding: '8px 10px', lineHeight: '1.5', color: '#333333' }}>
                  <div>[ ] Power Adapter / Charger</div>
                  <div>[ ] Laptop Bag / Sleeve</div>
                  <div>[ ] Power Cable / HDMI Cable</div>
                  <div>[ ] External Drive / Flash Media</div>
                  {ticket.pre_approved_budget && (
                    <div style={{ marginTop: '6px', fontWeight: 'bold', color: '#15803D' }}>
                      Pre-Approved Budget: ₹{ticket.pre_approved_budget}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

        </div>

        {/* Bottom Section: Terms & Conditions + QR & Signatures Box */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px 0', marginTop: '16px', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {/* Terms & Conditions Box (58%) */}
              <td style={{ width: '58%', verticalAlign: 'top', border: '1px solid #000000', padding: 0, boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: '#0B5394', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', padding: '4px 0' }}>
                  Terms & Conditions
                </div>
                <div style={{ padding: '8px 10px', fontSize: '10.5px', color: '#333333', lineHeight: '1.45' }}>
                  <div style={{ marginBottom: '3px', fontWeight: 'bold', color: '#B91C1C' }}>
                    1. Customer must collect working or non-working materials within 2 months from date given for service. After 2 months, YantraByte Solutions is not responsible for items.
                  </div>
                  <div style={{ marginBottom: '2px' }}>2. Diagnostic charges are applicable even if estimate is declined.</div>
                  <div style={{ marginBottom: '2px' }}>3. Customer is advised to backup all data prior to service. We are not liable for data loss.</div>
                  <div style={{ marginBottom: '2px' }}>4. Physical, liquid, or burnt component damage voids all repair warranty.</div>
                  <div>5. Hardware replacements carry standard OEM manufacturer warranty.</div>
                </div>
              </td>

              {/* QR Code & Signatures Box (42%) */}
              <td style={{ width: '42%', verticalAlign: 'top', border: '1px solid #000000', padding: 0, boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: '#0B5394', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', padding: '4px 0' }}>
                  Verification & Authorization
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: 'top', fontSize: '10px', lineHeight: '1.35', color: '#000000' }}>
                          <div style={{ fontWeight: 'bold', color: '#0B5394' }}>Scan to Track Ticket Live:</div>
                          <div style={{ color: '#555555', marginTop: '2px' }}>Check repair progress, technician updates & ready for delivery status online.</div>
                        </td>
                        <td style={{ width: '56px', verticalAlign: 'middle', textAlign: 'right', paddingLeft: '4px' }}>
                          <div style={{ background: '#ffffff', padding: '2px', display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                            <QrCodeSvg value={trackingUrl} size={52} />
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
          marginTop: '6px',
          padding: '4px 8px',
          backgroundColor: '#F1F5F9',
          border: '1.2px solid #0B5394',
          borderRadius: '4px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            fontSize: '11px',
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
  );
});

ServiceTicketPdfTemplate.displayName = 'ServiceTicketPdfTemplate';
