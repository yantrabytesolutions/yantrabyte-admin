import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, RefreshCw, MessageSquare, AlertCircle, Smartphone, ShieldCheck } from 'lucide-react';

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({ isOpen, onClose }) => {
  const [ready, setReady] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/qr-data', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        
        if (isMounted) {
          setReady(!!data.ready);
          setQrDataUrl(data.qrDataUrl || null);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to fetch WhatsApp status:', err);
          setError('Unable to reach WhatsApp service. Checking again...');
          setLoading(false);
        }
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2.5 seconds
    const interval = setInterval(checkStatus, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, refreshKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp Business Integration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Automated invoices, ticket alerts & reminders</p>
          </div>
        </div>

        {/* Status Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Checking connection status...</p>
          </div>
        ) : ready ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-1">WhatsApp Connected!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
              Your server is securely paired and ready to send automated customer messages.
            </p>

            <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3.5 flex items-center gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold block">Session Active</span>
                Automated reminders & PDF delivery are running.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 flex flex-col items-center w-full">
              {qrDataUrl ? (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-inner inline-block">
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-52 h-52 object-contain"
                  />
                </div>
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                  <RefreshCw className="w-7 h-7 animate-spin mb-2 text-emerald-500" />
                  <span className="text-xs">Generating QR Code...</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                Auto-refreshes every 20 seconds
              </p>
            </div>

            {/* Instructions */}
            <div className="text-left w-full space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mb-4">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">To connect:</div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                <span>Open <b>WhatsApp</b> on your phone.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                <span>Go to <b>Settings</b> ➔ <b>Linked Devices</b>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                <span>Tap <b>Link a Device</b> and point your camera here.</span>
              </div>
            </div>

            {error && (
              <div className="w-full text-xs text-rose-500 flex items-center justify-center gap-1.5 mb-3">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
