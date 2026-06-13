import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { AlertCircle, ClipboardCheck, Loader2, MapPin, Phone, Send, Wrench, Laptop, Monitor, Printer, Video, Wifi, Fingerprint, Server, Package, UploadCloud } from 'lucide-react';

const DEVICE_CATEGORIES = [
  { id: 'Laptop with charger', label: 'Laptop (w/ charger)', icon: Laptop },
  { id: 'Laptop without charger', label: 'Laptop (no charger)', icon: Laptop },
  { id: 'Desktop', label: 'Desktop', icon: Monitor },
  { id: 'Printer', label: 'Printer', icon: Printer },
  { id: 'CCTV', label: 'CCTV', icon: Video },
  { id: 'Networking', label: 'Network', icon: Wifi },
  { id: 'Wi-Fi', label: 'Wi-Fi', icon: Wifi },
  { id: 'Biometric', label: 'Biometric', icon: Fingerprint },
  { id: 'Server', label: 'Server', icon: Server },
  { id: 'Other', label: 'Other', icon: Package },
];

const PRIORITY_OPTIONS = [
  { label: 'Normal', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

type RequestForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  device_type: string;
  issue_description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
};

const initialForm: RequestForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  customer_address: '',
  device_type: '',
  issue_description: '',
  priority: 'medium',
};



export default function ServiceRequest() {
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const updateField = (field: keyof RequestForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.issue_description.trim()) {
      setError('Please enter name, phone number, and issue details.');
      return;
    }
    if (!form.device_type) {
      setError('Please select a device or service type.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl = '';
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-attachments')
          .upload(filePath, attachment, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.warn('Failed to upload attachment:', uploadError);
          // Proceed without attachment if bucket is not created or fails
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('service-attachments')
            .getPublicUrl(filePath);
          uploadedUrl = publicUrl;
        }
      }

      const { data: ticketNumberFromRpc, error: rpcError } = await supabase
        .rpc('get_next_service_ticket_number');

      let ticketNumber = ticketNumberFromRpc;

      // Fallback if RPC fails or doesn't exist yet
      if (rpcError || !ticketNumber) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const prefix = `YBS-TKT-${day}${month}${year}-`;
        const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        ticketNumber = `${prefix}${randomSuffix}`;
        console.warn('RPC get_next_service_ticket_number failed. Falling back to random suffix.', rpcError);
      }

      let finalIssueDesc = form.issue_description.trim();
      if (uploadedUrl) {
        finalIssueDesc += `\n\n[Attachment: ${uploadedUrl}]`;
      }

      const ticketPayload = {
        ticket_number: ticketNumber,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        customer_address: form.customer_address.trim() || null,
        device_type: form.device_type || 'Other',
        issue_description: finalIssueDesc,
        status: 'open',
        priority: form.priority,
      };

      const { error: insertError } = await supabase.from('service_tickets').insert([ticketPayload]);
      if (insertError) throw insertError;

      try {
        const phoneStr = form.customer_phone.trim();
        const { data: existingCust } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', phoneStr)
          .single();

        if (!existingCust) {
          await supabase.from('customers').insert([{
            name: form.customer_name.trim(),
            phone: phoneStr,
            email: form.customer_email.trim() || null,
            address: form.customer_address.trim() || null,
          }]);
        }
      } catch (custError) {
        console.warn('Error syncing to customer master:', custError);
      }

      // Trigger Telegram and Email notification via Supabase Edge Function
      try {
        const { error: edgeError } = await supabase.functions.invoke('send-ticket-email', {
          body: ticketPayload,
        });
        if (edgeError) console.warn('Supabase send-ticket-email failed:', edgeError);
      } catch (e) {
        console.warn('Network error calling send-ticket-email:', e);
      }

      // Trigger Google Sheets backup via Supabase Edge Function
      try {
        const headers = [
          'Ticket No', 'Created At', 'Customer', 'Phone', 'Email',
          'Address', 'Device / Service', 'Issue', 'Priority', 'Status',
          'Assigned To', 'Notes', 'Link'
        ];
        const row = [
          ticketPayload.ticket_number || '',
          new Date().toISOString(),
          ticketPayload.customer_name || '',
          ticketPayload.customer_phone || '',
          ticketPayload.customer_email || '',
          ticketPayload.customer_address || '',
          ticketPayload.device_type || '',
          ticketPayload.issue_description || '',
          ticketPayload.priority || '',
          ticketPayload.status || 'open',
          '', 
          '', 
          `https://yantrabyte.anantatechcare.com/admin`
        ];

        const { error: sheetError } = await supabase.functions.invoke('backup-to-sheets', {
          body: {
            sheetName: 'Service Tickets',
            headers,
            row
          }
        });
        if (sheetError) console.warn('Supabase backup-to-sheets failed:', sheetError);
      } catch (backupError) {
        console.warn('Network error triggering Google Sheet backup:', backupError);
      }

      setCreatedTicket(ticketNumber);
      setForm(initialForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create service ticket.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Service Request | YantraByte Solutions"
        description="Create a YantraByte service ticket for laptop repair, desktop repair, CCTV, networking, printer service, and IT support."
        canonicalUrl="https://yantrabyte.anantatechcare.com/service-request"
      />

      <section className="bg-[#0B1120] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="pt-4 text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0EA5E9]/30 bg-[#0EA5E9]/10 px-3 py-1 text-sm font-semibold text-[#7DD3FC]">
              <ClipboardCheck className="h-4 w-4" />
              Service Ticket
            </div>
            <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Create Your Repair or IT Support Ticket
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#CBD5E1] sm:text-base">
              Submit your device or service issue here. Your ticket number will be generated immediately and sent to our admin dashboard.
            </p>

            <div className="mt-8 grid gap-4 text-sm text-[#CBD5E1]">
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-[#38BDF8]" />
                <div>
                  <div className="font-semibold text-white">Need urgent help?</div>
                  <a className="text-[#7DD3FC] hover:text-white" href="tel:+919986742525">+91 99867 42525</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[#38BDF8]" />
                <div>
                  <div className="font-semibold text-white">Workshop</div>
                  <div>47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="mt-1 h-5 w-5 text-[#38BDF8]" />
                <div>
                  <div className="font-semibold text-white">Supported work</div>
                  <div>Laptop, desktop, printer, CCTV, networking, Wi-Fi, biometric, and server support.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white p-5 shadow-2xl sm:p-6">
            {createdTicket ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                {/* Official Seal */}
                <img
                  src="/seal.png"
                  alt="YantraByte Official Seal"
                  className="w-28 h-28 object-contain mb-2 drop-shadow-lg"
                />
                <h2 className="text-2xl font-bold text-slate-900">Ticket Created!</h2>
                <p className="mt-2 text-sm text-slate-600">Please keep this ticket number for follow-up.</p>
                <div className="mt-4 w-full rounded-md border border-slate-200 bg-slate-50 px-5 py-3 font-mono text-lg font-bold text-slate-900">
                  {createdTicket}
                </div>

                {/* 2-Month Collection Policy */}
                <div className="mt-5 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p>
                    <span className="font-semibold">Important: </span>
                    Customer must collect working or non-working materials within{' '}
                    <span className="font-semibold">2 months</span> from the date given for service.
                    After that, YantraByte Solutions will not be responsible for the items.
                  </p>
                </div>

                <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    to={`/track-ticket?t=${createdTicket}`}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:bg-[#0284C7]"
                  >
                    Track My Ticket
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCreatedTicket('')}
                    className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Create Another
                  </button>
                </div>
              </div>

            ) : (
              <form onSubmit={submitTicket} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Customer Details</h2>
                  <p className="mt-1 text-sm text-slate-500">Fields marked with * are required.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Name *</span>
                    <input
                      value={form.customer_name}
                      onChange={e => updateField('customer_name', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      placeholder="Customer name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Phone *</span>
                    <input
                      value={form.customer_phone}
                      onChange={e => updateField('customer_phone', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      placeholder="Phone number"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Email</span>
                    <input
                      type="email"
                      value={form.customer_email}
                      onChange={e => updateField('customer_email', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      placeholder="Email address"
                    />
                  </label>
                </div>

                <div className="block">
                  <span className="text-sm font-semibold text-slate-700">Device / Service *</span>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {DEVICE_CATEGORIES.map(category => {
                      const isSelected = form.device_type === category.id;
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => updateField('device_type', category.id)}
                          className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all ${
                            isSelected 
                              ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9] shadow-sm ring-1 ring-[#0EA5E9]' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`h-6 w-6 ${isSelected ? 'text-[#0EA5E9]' : 'text-slate-400'}`} />
                          <span className="text-xs font-medium leading-tight">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Address</span>
                  <textarea
                    value={form.customer_address}
                    onChange={e => updateField('customer_address', e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    placeholder="Pickup or billing address"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Issue Details *</span>
                  <textarea
                    value={form.issue_description}
                    onChange={e => updateField('issue_description', e.target.value)}
                    rows={5}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    placeholder="Example: laptop not booting, printer paper jam, CCTV camera offline..."
                  />
                </label>

                <div className="block">
                  <span className="text-sm font-semibold text-slate-700">Upload Photo (Optional)</span>
                  <p className="text-xs text-slate-500 mb-2 mt-1">Upload a picture of the broken device or error screen.</p>
                  <label className="mt-1 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-6 transition hover:bg-slate-100">
                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">
                      {attachment ? attachment.name : 'Click to upload image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Priority</span>
                  <select
                    value={form.priority}
                    onChange={e => updateField('priority', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Create Service Ticket
                </button>

                {/* Policy Notice */}
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p>
                    <span className="font-semibold">Important Notice: </span>
                    Customer must collect working or non-working materials within <span className="font-semibold">2 months</span> from the date given for service.
                    After that, YantraByte Solutions will not be responsible for the items.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
