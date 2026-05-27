import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, PackageSearch, AlertCircle, Clock, CheckCircle2, MonitorPlay } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ServiceTicket } from '../types';
import { Helmet } from 'react-helmet-async';

export function TrackTicket() {
  const [searchParams] = useSearchParams();
  const [ticketNo, setTicketNo] = useState(searchParams.get('t') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNo.trim() || !phone.trim()) {
      setError('Please enter both ticket number and phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setTicket(null);

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const cleanTicket = ticketNo.trim();

      const { data, error: fetchError } = await supabase
        .from('service_tickets')
        .select('*')
        .ilike('ticket_number', cleanTicket)
        .like('customer_phone', `%${cleanPhone}%`)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('No ticket found matching this number and phone combination.');
      } else {
        setTicket(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch ticket status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <AlertCircle className="w-8 h-8 text-amber-500" />;
      case 'in progress':
        return <Clock className="w-8 h-8 text-blue-500" />;
      case 'ready':
      case 'closed':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      default:
        return <MonitorPlay className="w-8 h-8 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'in progress':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'ready':
      case 'closed':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Helmet>
        <title>Track Repair Status | YantraByte Solutions</title>
        <meta name="description" content="Track your device repair status at YantraByte Solutions." />
      </Helmet>

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Track Your Repair
          </h1>
          <p className="text-slate-400 mt-2">Enter your details to check real-time status</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Service Ticket No.</label>
              <input
                type="text"
                value={ticketNo}
                onChange={(e) => setTicketNo(e.target.value)}
                placeholder="e.g. YBS-2026-2027-032"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Track Status
                </>
              )}
            </button>
          </form>
        </div>

        {ticket && (
          <div className="mt-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                {getStatusIcon(ticket.status || 'open')}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{ticket.device_type}</h3>
                <p className="text-sm text-slate-400">Ticket: <span className="font-mono text-slate-300">{ticket.ticket_number}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Current Status</div>
                <div className={`inline-flex px-3 py-1 rounded-full border font-semibold text-sm capitalize ${getStatusColor(ticket.status || 'open')}`}>
                  {ticket.status || 'Open'}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Reported Issue</div>
                <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-sm text-slate-300">
                  {ticket.issue_description}
                </div>
              </div>

              {ticket.technician_notes && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Technician Notes</div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-sm text-blue-200">
                    {ticket.technician_notes}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
                <span>Received: {new Date(ticket.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {ticket.status === 'closed' && <span>Completed</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
