import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, RefreshCw, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WhatsAppConnectPage() {
  const [ready, setReady] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr-data', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setReady(!!data.ready);
      setQrDataUrl(data.qrDataUrl || null);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch WhatsApp status:', err);
      setError('Checking WhatsApp connection...');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">WhatsApp Integration</h1>
              <p className="text-xs text-slate-400">YantraByte Solutions Automation</p>
            </div>
          </div>
          <Link
            to="/admin"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            title="Back to Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-300">Checking WhatsApp connection...</p>
          </div>
        ) : ready ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">WhatsApp is Connected!</h2>
            <p className="text-xs text-slate-400 max-w-xs mb-6">
              Your server is linked and ready to send automated invoices, service updates, and payment reminders.
            </p>

            <div className="w-full bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 flex items-center gap-3 text-left">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-200">
                <span className="font-semibold block">Automation Online</span>
                Invoices, receipts, and WhatsApp notifications are active.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 mb-5 flex flex-col items-center w-full">
              {qrDataUrl ? (
                <div className="bg-white p-3 rounded-xl border border-slate-600 shadow-md">
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-800/60 rounded-xl text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-3 text-emerald-400" />
                  <span className="text-xs">Generating QR Code...</span>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Auto-refreshes every 20 seconds
              </p>
            </div>

            <div className="text-left w-full space-y-2 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 mb-4">
              <div className="font-semibold text-white mb-1.5">How to pair:</div>
              <div className="flex items-start gap-2.5">
                <span className="bg-emerald-500 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                <span>Open <b>WhatsApp Business</b> or <b>WhatsApp</b> on your phone.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="bg-emerald-500 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                <span>Tap <b>Settings</b> (or 3-dots) ➔ <b>Linked Devices</b>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="bg-emerald-500 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                <span>Tap <b>Link a Device</b> and point camera at the QR code above.</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-amber-400 mb-2">{error}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/80 mt-2">
          <button
            onClick={checkStatus}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Now
          </button>
          <Link
            to="/admin"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Go to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
