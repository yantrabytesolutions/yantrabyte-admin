import { FormEvent, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { AlertCircle, ClipboardCheck, Loader2, MapPin, Phone, Send, Wrench, Laptop, Monitor, Printer, Video, Wifi, Fingerprint, Server, Package, UploadCloud, Film, X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
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

const QUICK_BRANDS = ['Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'Asus'];

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otherDeviceType, setOtherDeviceType] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragActivePhoto, setDragActivePhoto] = useState(false);
  const [dragActiveVideo, setDragActiveVideo] = useState(false);

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.customer_name || !form.customer_phone || !form.customer_address) {
        setError('Please fill in all required contact fields (Name, Phone, Address) before proceeding.');
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(form.customer_phone.replace(/\D/g, ''))) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }
    }
    if (step === 2) {
      if (!form.device_type) {
        setError('Please select a device type.');
        return;
      }
      if (form.device_type === 'Other' && !otherDeviceType.trim()) {
        setError('Please specify the "Other" device type.');
        return;
      }
      if (!form.issue_description.trim()) {
        setError('Please describe the issue.');
        return;
      }
    }
    setStep(prev => (prev < 3 ? prev + 1 : prev) as 1 | 2 | 3);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => (prev > 1 ? prev - 1 : prev) as 1 | 2 | 3);
  };

  const handleDragPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActivePhoto(true);
    else if (e.type === 'dragleave') setDragActivePhoto(false);
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePhoto(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachment(e.dataTransfer.files[0]);
    }
  };

  const handleDragVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActiveVideo(true);
    else if (e.type === 'dragleave') setDragActiveVideo(false);
  };

  const handleDropVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveVideo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file must be under 50 MB.');
        return;
      }
      setVideoAttachment(file);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

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
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to proceed.');
      return;
    }

    if (parseInt(captchaInput, 10) !== captchaA + captchaB) {
      setError('Incorrect math answer. Please try again.');
      return;
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setError('Please sign the document before submitting.');
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
        signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
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

      let ticketNumber = '';
      let insertSuccess = false;
      let insertError = null;
      const maxRetries = 3;
      let currentTry = 0;

      while (!insertSuccess && currentTry < maxRetries) {
        currentTry++;
        
        const { data: ticketNumberFromRpc, error: rpcError } = await supabase
          .rpc('get_next_service_ticket_number');

        ticketNumber = ticketNumberFromRpc;

        // Fallback if RPC fails or doesn't exist yet
        if (rpcError || !ticketNumber) {
          console.warn('RPC get_next_service_ticket_number failed or returned empty:', rpcError);
          const now = new Date();
          const month = now.getMonth() + 1;
          const fullYear = now.getFullYear();
          
          let startYear = fullYear;
          let endYear = fullYear + 1;
          if (month < 4) {
            startYear = fullYear - 1;
            endYear = fullYear;
          }
          
          const prefix = `YBS-${startYear}-${endYear}-`;
          
          let seq = 1;
          try {
            const { data: latestTickets, error: selectError } = await supabase
              .from('service_tickets')
              .select('ticket_number')
              .like('ticket_number', `${prefix}%`)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (selectError) {
              console.warn('Fallback select error:', selectError);
            }
              
            if (latestTickets && latestTickets.length > 0 && latestTickets[0].ticket_number) {
              const lastTicket = latestTickets[0].ticket_number;
              const match = lastTicket.match(/-(\d+)$/);
              if (match) {
                seq = parseInt(match[1], 10) + 1;
              }
            } else {
               // If we can't find previous tickets, use a random sequence to avoid unique constraint violations
               seq = Math.floor(Math.random() * 900) + 100;
            }
          } catch (err) {
            console.warn('Failed to fetch latest ticket number, starting at random.', err);
            seq = Math.floor(Math.random() * 900) + 100;
          }

          const paddedSeq = String(seq).padStart(3, '0');
          ticketNumber = `${prefix}${paddedSeq}`;
        }

    const finalDeviceType = form.device_type === 'Other' && otherDeviceType.trim() 
      ? otherDeviceType.trim() 
      : form.device_type;

    const ticketPayload = {
      ticket_number: ticketNumber,
      ...form,
      device_type: finalDeviceType,
      pickup_date: form.pickup_date || null,
      attachment_url: uploadedUrl,
      video_url: uploadedVideoUrl,
      customer_signature: signatureBase64,
      status: 'open'
    };

    const { error: err } = await supabase
      .from('service_tickets')
      .insert([ticketPayload]);

    if (err) {
      if (err.code === '23505' || String(err.message).includes('unique constraint') || String(err.message).includes('duplicate key')) {
         console.warn(`Retry ${currentTry} due to unique constraint on ticket number:`, ticketNumber);
         insertError = err;
      } else {
         throw err;
      }
    } else {
      insertSuccess = true;
      insertError = null;
    }
  }

  if (!insertSuccess && insertError) {
    console.error('Insert Error after retries:', insertError);
        throw insertError;
      }

      try {
        await supabase.functions.invoke('send-ticket-email', {
          body: {
            ticket_number:     ticketNumber,
            customer_email:    form.customer_email,
            customer_name:     form.customer_name,
            customer_phone:    form.customer_phone,
            customer_address:  form.customer_address,
            device_type:       finalDeviceType,
            device_make_model: form.device_make_model,
            issue_description: form.issue_description,
            priority:          form.priority,
            terms_accepted:    true,
          }
        });
      } catch (e) {
        console.warn('Network error calling send-ticket-email:', e);
      }


      // Trigger Google Sheets backup via client-side fetch (bypassing edge functions)
      try {
        const headers = [
          'Ticket No', 'Created At', 'Customer', 'Phone', 'Email',
          'Address', 'Device / Service', 'Issue', 'Priority', 'Status',
          'Assigned To', 'Notes', 'Link', 'Make/Model', 'Service Method', 'Budget'
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
          `https://yantrabyte.anantatechcare.com/admin`,
          ticketPayload.device_make_model || '',
          ticketPayload.pre_approved_budget ? `₹${ticketPayload.pre_approved_budget}` : 'N/A'
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
      setOtherDeviceType('');
      setAttachment(null);
      setTermsAccepted(false);
      removeVideo();
      if (sigCanvas.current) { sigCanvas.current.clear(); }
      setStep(1);
    } catch (err: any) {
      console.error('Submit Ticket Error:', err);
      const message = err?.message || 'Unable to create service ticket.';
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

      <section className="bg-gradient-brand relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#0EA5E9]/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-40 -right-40 h-96 w-96 rounded-full bg-[#38BDF8]/10 blur-[100px] pointer-events-none"></div>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="pt-4 text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0EA5E9]/30 bg-[#0EA5E9]/10 px-3 py-1 text-sm font-semibold text-[#7DD3FC]">
              <ClipboardCheck className="h-4 w-4" />
              Service Ticket
            </div>
            <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl text-gradient">
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

          <div className="rounded-2xl glass-strong p-5 shadow-2xl sm:p-6 glow-blue-sm border-t border-l border-white/20">
            {createdTicket ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                {/* Official Seal */}
                <img
                  src="/seal.png"
                  alt="YantraByte Official Seal"
                  className="w-32 h-32 object-contain mx-auto drop-shadow-lg"
                />
                <h2 className="text-2xl font-bold text-white">Ticket Created!</h2>
                <p className="mt-2 text-sm text-slate-400">Please keep this ticket number for follow-up.</p>
                <div className="mt-4 w-full rounded-md border border-white/10 bg-white/5 px-5 py-3 font-mono text-lg font-bold text-white">
                  {createdTicket}
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Scan to Track</p>
                  <div className="p-2 bg-white rounded-lg border border-white/10 shadow-sm">
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
                    className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                  >
                    Create Another
                  </button>
                </div>
              </div>

            ) : (              <form onSubmit={submitTicket} className="space-y-5">
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? 'bg-[#0EA5E9] text-white shadow-md' : 'bg-white/10 text-slate-400'}`}>1</div>
                      <span className={`text-xs font-medium mt-1 ${step >= 1 ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>Contact</span>
                    </div>
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${step >= 2 ? 'bg-[#0EA5E9]' : 'bg-white/10'}`}></div>
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= 2 ? 'bg-[#0EA5E9] text-white shadow-md' : 'bg-white/10 text-slate-400'}`}>2</div>
                      <span className={`text-xs font-medium mt-1 transition-colors ${step >= 2 ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>Device</span>
                    </div>
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${step >= 3 ? 'bg-[#0EA5E9]' : 'bg-white/10'}`}></div>
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= 3 ? 'bg-[#0EA5E9] text-white shadow-md' : 'bg-white/10 text-slate-400'}`}>3</div>
                      <span className={`text-xs font-medium mt-1 transition-colors ${step >= 3 ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>Submit</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* STEP 1: Contact Information */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-white">Contact Information</h2>
                      <p className="mt-1 text-sm text-slate-400">How can we reach you?</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Name *</span>
                        <input
                          value={form.customer_name}
                          onChange={e => updateField('customer_name', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="Customer name"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Phone *</span>
                        <input
                          value={form.customer_phone}
                          onChange={e => updateField('customer_phone', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="10-digit number"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Email (Optional)</span>
                        <input
                          type="email"
                          value={form.customer_email}
                          onChange={e => updateField('customer_email', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="Email address"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Preferred Contact Method</span>
                        <select
                          value={form.preferred_contact}
                          onChange={e => updateField('preferred_contact', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="phone">Phone Call</option>
                          <option value="email">Email</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">Customer Address *</span>
                      <textarea
                        rows={2}
                        value={form.customer_address}
                        onChange={e => updateField('customer_address', e.target.value)}
                        className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 resize-none"
                        placeholder="Full address for pickup or record"
                      />
                    </label>
                    
                    <label className="flex items-start gap-3 mt-4 rounded-lg border border-white/10 p-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.whatsapp_opt_in}
                        onChange={e => setForm({ ...form, whatsapp_opt_in: e.target.checked })}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/10 text-[#0EA5E9] focus:ring-[#0EA5E9]"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-300">WhatsApp Updates</span>
                        <span className="text-xs text-slate-400">Opt-in to automatic WhatsApp status updates for this ticket.</span>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#0EA5E9]/20 transition hover:bg-[#0284C7]"
                    >
                      Next Step <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: Device Details */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-white">Device & Issue</h2>
                      <p className="mt-1 text-sm text-slate-400">What needs to be fixed?</p>
                    </div>

                    <div className="block">
                      <span className="text-sm font-semibold text-slate-300">Device / Service *</span>
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
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
                              }`}
                            >
                              <Icon className={`h-6 w-6 ${isSelected ? 'text-[#0EA5E9]' : 'text-slate-400'}`} />
                              <span className="text-xs font-medium leading-tight">{category.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {form.device_type === 'Other' && (
                      <label className="block mt-4 mb-2 animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-semibold text-slate-300">Please specify what you are giving for service *</span>
                        <input
                          value={otherDeviceType}
                          onChange={e => setOtherDeviceType(e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="e.g. Projector, Scanner, etc."
                        />
                      </label>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Make / Model</span>
                        {(form.device_type.includes('Laptop') || form.device_type === 'Desktop') && (
                          <div className="mt-1.5 flex flex-wrap gap-2 mb-2 animate-in fade-in">
                            {QUICK_BRANDS.map(brand => (
                              <button
                                key={brand}
                                type="button"
                                onClick={() => updateField('device_make_model', brand)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400 transition hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5 hover:text-[#0EA5E9]"
                              >
                                {brand}
                              </button>
                            ))}
                          </div>
                        )}
                        <input
                          value={form.device_make_model}
                          onChange={e => updateField('device_make_model', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="e.g., Dell XPS 15, HP LaserJet"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Device Password / PIN</span>
                        <input
                          value={form.device_password}
                          onChange={e => updateField('device_password', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="Optional but recommended for testing"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">Issue Details *</span>
                      <textarea
                        value={form.issue_description}
                        onChange={e => updateField('issue_description', e.target.value)}
                        rows={4}
                        className="mt-1 w-full rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                        placeholder="Describe the problem in detail..."
                      />
                    </label>

                    {/* Drag and Drop Media Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Photo Upload */}
                      <div className="block">
                        <span className="text-sm font-semibold text-slate-300">Photo (Optional)</span>
                        <label 
                          onDragEnter={handleDragPhoto}
                          onDragOver={handleDragPhoto}
                          onDragLeave={handleDragPhoto}
                          onDrop={handleDropPhoto}
                          className={`mt-1 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-5 transition-colors ${dragActivePhoto ? 'border-[#0EA5E9] bg-[#0EA5E9]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                        >
                          {attachment ? (
                            <div className="flex flex-col items-center text-center px-2">
                              <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
                              <span className="text-xs font-semibold text-slate-300 truncate w-full px-2">{attachment.name}</span>
                              <span className="text-[10px] text-slate-400 mt-1">Click to replace</span>
                            </div>
                          ) : (
                            <>
                              <UploadCloud className={`h-6 w-6 mb-2 ${dragActivePhoto ? 'text-[#0EA5E9]' : 'text-slate-400'}`} />
                              <span className="text-sm font-medium text-slate-400">Drag or click photo</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>

                      {/* Video Upload */}
                      <div className="block">
                        <span className="text-sm font-semibold text-slate-300">Video (Optional)</span>
                        {!videoAttachment ? (
                          <label 
                            onDragEnter={handleDragVideo}
                            onDragOver={handleDragVideo}
                            onDragLeave={handleDragVideo}
                            onDrop={handleDropVideo}
                            className={`mt-1 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-5 transition-colors ${dragActiveVideo ? 'border-[#0EA5E9] bg-[#0EA5E9]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                          >
                            <Film className={`h-6 w-6 mb-2 ${dragActiveVideo ? 'text-[#0EA5E9]' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium text-slate-400">Drag or click video</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Max 50MB</span>
                            <input type="file" accept="video/mp4" onChange={handleVideoChange} className="hidden" />
                          </label>
                        ) : (
                          <div className="mt-1 rounded-xl border border-[#0EA5E9]/30 bg-[#0EA5E9]/5 overflow-hidden h-[104px] relative group">
                            <video src={videoPreviewUrl!} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={removeVideo}
                                className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-red-700 transition"
                              >
                                <X className="h-3 w-3" /> Remove Video
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pt-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Priority Level</span>
                        <select
                          value={form.priority}
                          onChange={e => updateField('priority', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                        >
                          {PRIORITY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {/* Dynamic Priority Banners */}
                        <div className="mt-2">
                          {form.priority === 'urgent' && (
                            <div className="flex items-center gap-1.5 rounded bg-red-50 px-2 py-1.5 text-xs text-red-700 border border-red-100 animate-in fade-in">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Bumped to front of queue. Express fee may apply.
                            </div>
                          )}
                          {form.priority === 'high' && (
                            <div className="flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-700 border border-amber-100 animate-in fade-in">
                              <Loader2 className="h-3.5 w-3.5 shrink-0" /> Target completion: 24-48 hours.
                            </div>
                          )}
                          {form.priority === 'medium' && (
                            <div className="flex items-center gap-1.5 rounded bg-green-50 px-2 py-1.5 text-xs text-green-700 border border-green-100 animate-in fade-in">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Target completion: 2-3 business days.
                            </div>
                          )}
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-300">Pre-Approve Minor Repairs</span>
                        <select
                          value={form.pre_approved_budget}
                          onChange={e => updateField('pre_approved_budget', e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                        >
                          <option value="No Pre-Approval">No Pre-Approval (Call me first)</option>
                          <option value="Up to ₹500">Up to ₹500 (Save time)</option>
                          <option value="Up to ₹1000">Up to ₹1000 (Save time)</option>
                          <option value="Up to ₹2000">Up to ₹2000 (Save time)</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 shadow-sm transition hover:bg-white/5"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#0EA5E9]/20 transition hover:bg-[#0284C7]"
                      >
                        Next Step <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Terms & Signature */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-white">Verification & Submit</h2>
                      <p className="mt-1 text-sm text-slate-400">Please review terms and sign below.</p>
                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div className={`rounded-xl border-2 p-4 transition-all ${
                      termsAccepted
                        ? 'border-green-400 bg-green-50'
                        : 'border-amber-300 bg-amber-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          id="terms-checkbox"
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={e => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-white/10 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor="terms-checkbox" className="cursor-pointer text-xs leading-relaxed text-slate-300">
                          <span className="font-bold text-amber-700">⚠ Important Notice — I Agree: </span>
                          Customer must collect working or non-working materials within{' '}
                          <span className="font-bold">2 months</span> from the date given for service.
                          After that, <span className="font-bold">YantraByte Solutions will not be responsible for the items.</span>
                          {' '}By checking this box, I acknowledge and accept these terms.
                        </label>
                      </div>
                      {!termsAccepted && (
                        <p className="mt-2 text-xs font-semibold text-amber-700 pl-8">
                          ✗ You must accept this notice before submitting.
                        </p>
                      )}
                      {termsAccepted && (
                        <p className="mt-2 text-xs font-semibold text-green-700 pl-8">
                          ✓ Terms accepted
                        </p>
                      )}
                    </div>

                    <div className="block bg-white/5 p-4 rounded-xl border border-white/10">
                      <span className="text-sm font-semibold text-slate-300">Anti-Spam Verification *</span>
                      <p className="text-xs text-slate-400 mb-2">Please solve this simple math problem.</p>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-200">{captchaA} + {captchaB} = </span>
                        <input
                          type="number"
                          value={captchaInput}
                          onChange={e => setCaptchaInput(e.target.value)}
                          className="w-24 rounded-md border border-white/10 px-3 py-2 text-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                          placeholder="?"
                        />
                      </div>
                    </div>

                    <div className="block">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="text-sm font-semibold text-slate-300">Digital Signature *</span>
                          <p className="text-xs text-slate-400 mt-0.5">Please sign below to agree to the terms.</p>
                        </div>
                      </div>
                      <div className="relative border-2 border-dashed border-[#0EA5E9]/50 bg-[#0EA5E9]/5 rounded-xl overflow-hidden touch-none group transition-colors hover:border-[#0EA5E9]">
                        <button 
                          type="button" 
                          onClick={clearSignature} 
                          className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded bg-white/5/80 backdrop-blur border border-white/10 px-2 py-1 text-xs font-medium text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3 w-3" /> Clear
                        </button>
                        <SignatureCanvas 
                          ref={sigCanvas}
                          canvasProps={{ className: 'w-full h-36 cursor-crosshair' }}
                          penColor="#ffffff"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 shadow-sm transition hover:bg-white/5"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#0EA5E9]/20 transition hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-60 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-white/5/20 translate-y-full transition-transform group-hover:translate-y-0"></div>
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="relative">Create Service Ticket</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
