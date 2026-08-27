import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, FileText, IndianRupee, RotateCcw, Send, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ServiceTicket } from '../../types';

interface DigitalJobSheetModalProps {
  ticket: ServiceTicket;
  onClose: () => void;
  onSaved: () => void;
}

export default function DigitalJobSheetModal({ ticket, onClose, onSaved }: DigitalJobSheetModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState(ticket.technician_notes || ticket.notes || '');
  const [partsCost, setPartsCost] = useState(ticket.parts_cost ? String(ticket.parts_cost) : '');
  const [laborCost, setLaborCost] = useState(ticket.labor_cost ? String(ticket.labor_cost) : '');
  const [deviceSerial, setDeviceSerial] = useState(ticket.device_serial_no || '');
  const [warrantyMonths, setWarrantyMonths] = useState(ticket.warranty_months !== undefined ? String(ticket.warranty_months) : '1');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    // Preload existing signature if any
    if (ticket.customer_signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = ticket.customer_signature;
    }
  }, [ticket.customer_signature]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const totalBill = (Number(partsCost) || 0) + (Number(laborCost) || 0);

  const handleSaveJobSheet = async () => {
    setIsSaving(true);
    try {
      let signatureDataUrl = ticket.customer_signature || null;
      if (canvasRef.current && hasSignature) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      }

      const { error } = await supabase
        .from('service_tickets')
        .update({
          status: 'completed',
          technician_notes: technicianNotes.trim(),
          device_serial_no: deviceSerial.trim() || null,
          parts_cost: Number(partsCost) || 0,
          labor_cost: Number(laborCost) || 0,
          warranty_months: Number(warrantyMonths) || 1,
          customer_signature: signatureDataUrl,
          delivery_date: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;

      setSavedSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving job sheet:', err);
      alert('Failed to save job sheet: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendWhatsAppConfirmation = () => {
    let phone = (ticket.customer_phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const msg = `🛠️ *SERVICE DELIVERY CONFIRMATION - Yantrabyte Solutions*\n\nDear *${ticket.customer_name}*,\n\nYour service request *#${ticket.ticket_number}* for *${ticket.device_type}* has been successfully completed and delivered!\n\n*Service Details:*\n• *Device:* ${ticket.device_type} ${deviceSerial ? `(S/N: ${deviceSerial})` : ''}\n• *Work Performed:* ${technicianNotes || 'Diagnostics & Repair'}\n• *Total Service Charge:* ₹${totalBill.toLocaleString('en-IN')}\n• *Service Warranty:* ${warrantyMonths} Month(s)\n\nTrack / View your digital service record:\nhttps://yantrabyte.anantatechcare.com/track-ticket?t=${ticket.ticket_number}\n\n*Review Us:* If you loved our service, please rate us 5-stars: https://g.page/r/yantrabyte/review\n\nThank you for choosing *YantraByte Solutions*!`;

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto border border-slate-200 animate-in fade-in">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg sm:text-xl font-bold">Digital Job Sheet & Sign-off</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Ticket #{ticket.ticket_number} • {ticket.customer_name} ({ticket.device_type})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50 text-slate-800 text-sm">
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3 font-semibold">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              Job Sheet successfully saved and signed!
            </div>
          )}

          {/* Ticket Information */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Customer:</span>
              <span className="font-bold text-slate-900">{ticket.customer_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Contact:</span>
              <span className="font-bold text-slate-900">{ticket.customer_phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Reported Issue:</span>
              <span className="font-medium text-slate-700">{ticket.issue_description}</span>
            </div>
          </div>

          {/* Technician Diagnosis & Work Done */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Technician Diagnosis & Work Performed
            </h3>
            <textarea
              rows={3}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="e.g. Cleaned heat sink, replaced thermal paste, installed new 512GB NVMe SSD, tested 100% OK."
              className="w-full border-slate-200 rounded-lg text-xs p-2.5 focus:border-blue-500 focus:ring-blue-500 text-slate-900"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Device Serial No. / IMEI</label>
                <input
                  type="text"
                  value={deviceSerial}
                  onChange={(e) => setDeviceSerial(e.target.value)}
                  placeholder="e.g. C02G849202Q1"
                  className="w-full border-slate-200 rounded-lg text-xs p-2 focus:border-blue-500 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Service Warranty (Months)</label>
                <select
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  className="w-full border-slate-200 rounded-lg text-xs p-2 focus:border-blue-500 text-slate-900"
                >
                  <option value="1">1 Month (Standard Service)</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year AMC)</option>
                  <option value="0">No Warranty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Service & Spare Parts Charges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Parts Cost (₹)</label>
                <input
                  type="number"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  placeholder="0"
                  className="w-full border-slate-200 rounded-lg text-xs p-2 focus:border-blue-500 text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Labor / Service Fee (₹)</label>
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  placeholder="0"
                  className="w-full border-slate-200 rounded-lg text-xs p-2 focus:border-blue-500 text-slate-900 font-bold"
                />
              </div>
              <div className="bg-slate-900 text-white p-2 rounded-lg text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Total Bill:</span>
                <span className="text-base font-black text-emerald-400">₹{totalBill.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Customer Signature Pad */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Customer Signature on Delivery *
                </h3>
                <p className="text-[11px] text-slate-500">Sign with finger on touchscreen or mouse</p>
              </div>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 cursor-crosshair block"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">
              I acknowledge that I have received my equipment in working condition and agree to the service warranty terms.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 p-4 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSendWhatsAppConfirmation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Share on WhatsApp
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveJobSheet}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save & Sign-off Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
