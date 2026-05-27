import { FormEvent, useState } from 'react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, ClipboardCheck, Loader2, MapPin, Phone, Send, Wrench } from 'lucide-react';

const DEVICE_OPTIONS = [
  'Laptop',
  'Desktop',
  'Printer',
  'CCTV',
  'Networking',
  'Wi-Fi',
  'Biometric',
  'Server',
  'Other',
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

  const updateField = (field: keyof RequestForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.issue_description.trim()) {
      setError('Please enter name, phone number, and issue details.');
      return;
    }

    setSubmitting(true);
    try {
      let ticketNumber = '';

      if (!ticketNumber) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        const datePrefix = `${startYear}-${startYear + 1}`;
        const prefixString = `YBS-${datePrefix}-`;

        const { data: existing } = await supabase
          .from('service_tickets')
          .select('ticket_number')
          .ilike('ticket_number', `${prefixString}%`);
          
        let maxSeq = 0;
        if (existing) {
          for (const t of existing) {
            const match = String(t.ticket_number || '').match(/-(\d+)$/);
            if (match) {
              const seqNum = parseInt(match[1], 10);
              if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
            }
          }
        }
        const seq = (maxSeq + 1).toString().padStart(3, '0');
        ticketNumber = `${prefixString}${seq}`;
      }

      const ticketPayload = {
        ticket_number: ticketNumber,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        customer_address: form.customer_address.trim() || null,
        device_type: form.device_type || 'Other',
        issue_description: form.issue_description.trim(),
        status: 'open',
        priority: form.priority,
      };

      const { error: insertError } = await supabase.from('service_tickets').insert([ticketPayload]);
      if (insertError) throw insertError;

      // Fire Telegram notification + customer email via Supabase Edge Function (24/7 online)
      supabase.functions.invoke('send-ticket-email', { body: ticketPayload }).catch((err) => {
        console.warn('Ticket notification edge function failed:', err);
      });

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
            <div className="mb-6">
              <img src="/logo5.png" alt="YantraByte Solutions" className="h-16 w-auto object-contain sm:h-20" />
            </div>
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
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Ticket Created</h2>
                <p className="mt-3 text-sm text-slate-600">Please keep this ticket number for follow-up.</p>
                <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-5 py-3 font-mono text-lg font-bold text-slate-900">
                  {createdTicket}
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedTicket('')}
                  className="mt-8 rounded-md bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0284C7]"
                >
                  Create Another Ticket
                </button>
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
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Device / Service</span>
                    <select
                      value={form.device_type}
                      onChange={e => updateField('device_type', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    >
                      <option value="">Select type</option>
                      {DEVICE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
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
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
