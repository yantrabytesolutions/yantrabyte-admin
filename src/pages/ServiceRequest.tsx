import { FormEvent, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { AlertCircle, ClipboardCheck, Loader2, MapPin, Phone, Send, Wrench, Laptop, Monitor, Printer, Video, Wifi, Fingerprint, Server, Package, UploadCloud, Film, X, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SignatureCanvas from 'react-signature-canvas';

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
  device_make_model: string;
  device_password: string;
  service_method: 'drop_off' | 'home_pickup';
  pickup_date: string;
  preferred_contact: 'whatsapp' | 'phone' | 'email';
  whatsapp_opt_in: boolean;
  pre_approved_budget: string;
};

const initialForm: RequestForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  customer_address: '',
  device_type: '',
  issue_description: '',
  priority: 'medium',
  device_make_model: '',
  device_password: '',
  service_method: 'drop_off',
  pickup_date: '',
  preferred_contact: 'whatsapp',
  whatsapp_opt_in: true,
  pre_approved_budget: 'No Pre-Approval',
};



export default function ServiceRequest() {
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [videoAttachment, setVideoAttachment] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [captchaA, _setCaptchaA] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaB, _setCaptchaB] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaInput, setCaptchaInput] = useState('');

  const updateField = (field: keyof RequestForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file must be under 50 MB.');
        return;
      }
      setVideoAttachment(file);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoAttachment(null);
    setVideoPreviewUrl(null);
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (parseInt(captchaInput, 10) !== captchaA + captchaB) {
      setError('Incorrect math answer. Please try again.');
      return;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.customer_phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      let uploadedUrl = null;
      let signatureBase64 = null;

      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      }

      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('service-attachments')
          .upload(filePath, attachment);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('service-attachments')
          .getPublicUrl(filePath);
        uploadedUrl = publicUrl;
      }

      let uploadedVideoUrl = null;
      if (videoAttachment) {
        const videoExt = videoAttachment.name.split('.').pop();
        const videoFileName = `videos/${Math.random()}.${videoExt}`;

        const { error: videoUploadError } = await supabase.storage
          .from('service-attachments')
          .upload(videoFileName, videoAttachment, { contentType: videoAttachment.type });

        if (videoUploadError) {
          throw videoUploadError;
        }

        const { data: { publicUrl: videoPublicUrl } } = supabase.storage
          .from('service-attachments')
          .getPublicUrl(videoFileName);
        uploadedVideoUrl = videoPublicUrl;
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
        
        let seq = 1;
        try {
          const { data: latestTickets } = await supabase
            .from('service_tickets')
            .select('ticket_number')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (latestTickets && latestTickets.length > 0 && latestTickets[0].ticket_number) {
            const lastTicket = latestTickets[0].ticket_number;
            const match = lastTicket.match(/-(\d+)$/);
            if (match) {
              seq = parseInt(match[1], 10) + 1;
            }
          }
        } catch (err) {
          console.warn('Failed to fetch latest ticket number, starting at random.', err);
          seq = Math.floor(Math.random() * 900) + 100;
        }

        const paddedSeq = String(seq).padStart(3, '0');
        ticketNumber = `${prefix}${paddedSeq}`;
      }

      const ticketPayload = {
        ticket_number: ticketNumber,
        ...form,
        attachment_url: uploadedUrl,
        video_url: uploadedVideoUrl,
        customer_signature: signatureBase64,
        status: 'open'
      };

      const { error: insertError } = await supabase
        .from('service_tickets')
        .insert([ticketPayload]);

      if (insertError) throw insertError;

      try {
        await supabase.functions.invoke('send-ticket-email', {
          body: {
            ticket_number:    ticketNumber,
            customer_email:   form.customer_email,
            customer_name:    form.customer_name,
            customer_phone:   form.customer_phone,
            device_type:      form.device_type,
            issue_description: form.issue_description,
            priority:         form.priority,
          }
        });
      } catch (e) {
        console.warn('Network error calling send-ticket-email:', e);
      }


      // Trigger Google Sheets backup via client-side fetch (bypassing edge functions)
      try {
        const headers = [
          'Ticket No', 'Created At', 'Customer', 'Phone', 'Email',
          'Address', 'Make/Model', 'Device / Service', 'Issue', 'Priority', 'Status',
          'Assigned To', 'Service Method', 'Budget', 'Notes', 'Link'
        ];
        const row = [
          ticketPayload.ticket_number || '',
          new Date().toISOString(),
          ticketPayload.customer_name || '',
          ticketPayload.customer_phone || '',
          ticketPayload.customer_email || '',
          ticketPayload.customer_address || '',
          ticketPayload.device_make_model || '',
          ticketPayload.device_type || '',
          ticketPayload.issue_description || '',
          ticketPayload.priority || '',
          ticketPayload.status || 'open',
          '', 
          ticketPayload.service_method === 'home_pickup' ? 'Home Pickup' : 'Drop-off',
          ticketPayload.pre_approved_budget || '',
          '', 
          `https://yantrabyte.anantatechcare.com/admin`
        ];

        const { appendBackupRow } = await import('../utils/googleSheetBackup');
        await appendBackupRow({
          sheetName: 'Service Tickets',
          headers,
          row,
          keyColumnIndex: 0,
          keyValue: ticketPayload.ticket_number || '',
        });
      } catch (backupError) {
        console.warn('Network error triggering Google Sheet backup:', backupError);
      }

      setCreatedTicket(ticketNumber);
      setForm(initialForm);
      setAttachment(null);
      removeVideo();
      if (sigCanvas.current) { sigCanvas.current.clear(); }
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
            
            <div className="mt-8 overflow-hidden rounded-xl border border-white/10 shadow-lg">
              <img 
                src="/images/tech_repair_bg.png" 
                alt="Tech Repair Background" 
                className="w-full h-48 object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white p-5 shadow-2xl sm:p-6">
            {createdTicket ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                {/* Official Seal */}
                <img
                  src="/seal.png"
                  alt="YantraByte Official Seal"
                  className="w-32 h-32 object-contain mx-auto drop-shadow-lg"
                />
                <h2 className="text-2xl font-bold text-slate-900">Ticket Created!</h2>
                <p className="mt-2 text-sm text-slate-600">Please keep this ticket number for follow-up.</p>
                <div className="mt-4 w-full rounded-md border border-slate-200 bg-slate-50 px-5 py-3 font-mono text-lg font-bold text-slate-900">
                  {createdTicket}
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Scan to Track</p>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <QRCodeSVG 
                      value={`https://yantrabyte.anantatechcare.com/track-ticket?t=${createdTicket}`} 
                      size={120} 
                      level="H" 
                      includeMargin={false}
                    />
                  </div>
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
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Customer Address</span>
                    <textarea
                      rows={1}
                      value={form.customer_address}
                      onChange={e => updateField('customer_address', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 resize-none"
                      placeholder="e.g. 47A 1st Cross, Bengaluru"
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Make / Model</span>
                    <input
                      value={form.device_make_model}
                      onChange={e => updateField('device_make_model', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      placeholder="e.g., Dell XPS 15, HP LaserJet"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Device Password / PIN</span>
                    <input
                      value={form.device_password}
                      onChange={e => updateField('device_password', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      placeholder="Optional but recommended"
                    />
                  </label>
                </div>

                <div className="block">
                  <span className="text-sm font-semibold text-slate-700">Service Method *</span>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('service_method', 'drop_off')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        form.service_method === 'drop_off' 
                          ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9] shadow-sm ring-1 ring-[#0EA5E9]' 
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className={`h-5 w-5 ${form.service_method === 'drop_off' ? 'text-[#0EA5E9]' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium">I will drop it off at the workshop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('service_method', 'home_pickup')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        form.service_method === 'home_pickup' 
                          ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9] shadow-sm ring-1 ring-[#0EA5E9]' 
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className={`h-5 w-5 ${form.service_method === 'home_pickup' ? 'text-[#0EA5E9]' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium">Request Home Pickup</span>
                    </button>
                  </div>
                </div>

                {form.service_method === 'home_pickup' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Preferred Date & Time</span>
                      <input
                        type="datetime-local"
                        value={form.pickup_date}
                        onChange={e => updateField('pickup_date', e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      />
                    </label>
                  </div>
                )}

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

                {/* Photo Upload */}
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

                {/* Video Upload */}
                <div className="block">
                  <span className="text-sm font-semibold text-slate-700">Upload Video (Optional)</span>
                  <p className="text-xs text-slate-500 mb-2 mt-1">Record a short video showing the issue — MP4 only, max 50 MB.</p>

                  {!videoAttachment ? (
                    <label className="mt-1 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#0EA5E9]/40 bg-[#0EA5E9]/5 py-6 transition hover:bg-[#0EA5E9]/10">
                      <Film className="h-8 w-8 text-[#0EA5E9]/60 mb-2" />
                      <span className="text-sm font-medium text-slate-600">Click to upload video</span>
                      <span className="text-xs text-slate-400 mt-1">MP4 only — up to 50 MB</span>
                      <input
                        type="file"
                        accept="video/mp4"
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="mt-1 rounded-xl border border-[#0EA5E9]/30 bg-[#0EA5E9]/5 overflow-hidden">
                      {/* Video Preview */}
                      <video
                        src={videoPreviewUrl!}
                        controls
                        className="w-full max-h-48 object-contain bg-black"
                      />
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Film className="h-4 w-4 text-[#0EA5E9] shrink-0" />
                          <span className="text-xs text-slate-600 truncate">{videoAttachment.name}</span>
                          <span className="text-xs text-slate-400 shrink-0">({(videoAttachment.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="ml-2 shrink-0 flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 transition"
                        >
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  )}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Preferred Contact Method</span>
                    <select
                      value={form.preferred_contact}
                      onChange={e => updateField('preferred_contact', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="phone">Phone Call</option>
                      <option value="email">Email</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Pre-Approve Minor Repairs</span>
                    <select
                      value={form.pre_approved_budget}
                      onChange={e => updateField('pre_approved_budget', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    >
                      <option value="No Pre-Approval">No Pre-Approval (Call me first)</option>
                      <option value="Up to ₹500">Up to ₹500 (Save time)</option>
                      <option value="Up to ₹1000">Up to ₹1000 (Save time)</option>
                      <option value="Up to ₹2000">Up to ₹2000 (Save time)</option>
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.whatsapp_opt_in}
                    onChange={e => setForm({ ...form, whatsapp_opt_in: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#0EA5E9] focus:ring-[#0EA5E9]"
                  />
                  <span className="text-sm text-slate-700">Opt-in to automatic WhatsApp updates for this ticket</span>
                </label>

                <div className="block bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Anti-Spam Verification *</span>
                  <p className="text-xs text-slate-500 mb-2">Please solve this simple math problem.</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-800">{captchaA} + {captchaB} = </span>
                    <input
                      type="number"
                      value={captchaInput}
                      onChange={e => setCaptchaInput(e.target.value)}
                      className="w-24 rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      placeholder="?"
                    />
                  </div>
                </div>

                <div className="block">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-slate-700">Digital Signature *</span>
                    <button type="button" onClick={clearSignature} className="text-xs text-[#0EA5E9] hover:underline">
                      Clear
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Please sign below to agree to the repair terms and conditions.</p>
                  <div className="border-2 border-dashed border-slate-300 bg-white rounded-xl overflow-hidden touch-none">
                    <SignatureCanvas 
                      ref={sigCanvas}
                      canvasProps={{ className: 'w-full h-32' }}
                      penColor="#0f172a"
                    />
                  </div>
                </div>

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
