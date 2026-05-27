import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ExternalRepair, ServiceTicket } from '../types';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeftRight 
} from 'lucide-react';

export default function ExternalRepairs() {
  const [repairs, setRepairs] = useState<ExternalRepair[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'received' | 'cancelled'>('all');
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<ExternalRepair | null>(null);
  const [formTicketNumber, setFormTicketNumber] = useState('');
  const [formMaterialName, setFormMaterialName] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formSentTo, setFormSentTo] = useState('');
  const [formSentDate, setFormSentDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpectedReturn, setFormExpectedReturn] = useState('');
  const [formStatus, setFormStatus] = useState<'sent' | 'received' | 'cancelled'>('sent');
  const [formReceivedDate, setFormReceivedDate] = useState('');
  const [formCost, setFormCost] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  // Receive Dialog State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingRepair, setReceivingRepair] = useState<ExternalRepair | null>(null);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiveCost, setReceiveCost] = useState('0');
  const [receiveNotes, setReceiveNotes] = useState('');

  useEffect(() => {
    fetchRepairs();
    fetchTickets();
  }, []);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('external_repairs')
        .select('*')
        .order('sent_date', { ascending: false });
      if (error) throw error;
      setRepairs(data || []);
    } catch (err) {
      console.error('Error fetching external repairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*')
        .order('ticket_number', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching service tickets:', err);
    }
  };

  const resetForm = () => {
    setEditingRepair(null);
    setFormTicketNumber('');
    setFormMaterialName('');
    setFormSerialNumber('');
    setFormSentTo('');
    setFormSentDate(new Date().toISOString().slice(0, 10));
    setFormExpectedReturn('');
    setFormStatus('sent');
    setFormReceivedDate('');
    setFormCost('0');
    setFormNotes('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (repair: ExternalRepair) => {
    setEditingRepair(repair);
    setFormTicketNumber(repair.ticket_number || '');
    setFormMaterialName(repair.material_name);
    setFormSerialNumber(repair.serial_number || '');
    setFormSentTo(repair.sent_to);
    setFormSentDate(repair.sent_date);
    setFormExpectedReturn(repair.expected_return_date || '');
    setFormStatus(repair.status);
    setFormReceivedDate(repair.received_date || '');
    setFormCost(String(repair.cost || 0));
    setFormNotes(repair.notes || '');
    setShowModal(true);
  };

  const handleOpenReceive = (repair: ExternalRepair) => {
    setReceivingRepair(repair);
    setReceiveDate(new Date().toISOString().slice(0, 10));
    setReceiveCost(String(repair.cost || 0));
    setReceiveNotes(repair.notes || '');
    setShowReceiveModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMaterialName.trim() || !formSentTo.trim()) {
      alert('Material Name and Sent To (Vendor) are required.');
      return;
    }

    const payload = {
      ticket_number: formTicketNumber.trim() || null,
      material_name: formMaterialName.trim(),
      serial_number: formSerialNumber.trim() || null,
      sent_to: formSentTo.trim(),
      sent_date: formSentDate,
      expected_return_date: formExpectedReturn || null,
      status: formStatus,
      received_date: formStatus === 'received' ? (formReceivedDate || new Date().toISOString().slice(0, 10)) : null,
      cost: Number(formCost) || 0,
      notes: formNotes.trim() || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingRepair) {
        const { error } = await supabase
          .from('external_repairs')
          .update(payload)
          .eq('id', editingRepair.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('external_repairs')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchRepairs();
    } catch (err) {
      console.error('Error saving external repair tracking:', err);
      alert('Failed to save record.');
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingRepair) return;

    try {
      const { error } = await supabase
        .from('external_repairs')
        .update({
          status: 'received',
          received_date: receiveDate,
          cost: Number(receiveCost) || 0,
          notes: receiveNotes.trim() || receivingRepair.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', receivingRepair.id);
      
      if (error) throw error;
      
      setShowReceiveModal(false);
      setReceivingRepair(null);
      fetchRepairs();
    } catch (err) {
      console.error('Error updating receive status:', err);
      alert('Failed to mark repair as received.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this external service record?')) return;
    try {
      const { error } = await supabase
        .from('external_repairs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchRepairs();
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  // Stats calculation
  const totalSent = repairs.length;
  const pendingRepairs = repairs.filter(r => r.status === 'sent').length;
  const completedRepairs = repairs.filter(r => r.status === 'received').length;
  const totalCost = repairs.reduce((acc, r) => acc + (r.cost || 0), 0);

  // Filtered list
  const filtered = repairs.filter(r => {
    const matchesSearch = 
      r.material_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.serial_number || '').toLowerCase().includes(search.toLowerCase()) ||
      r.sent_to.toLowerCase().includes(search.toLowerCase()) ||
      (r.ticket_number || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            External Repairs Tracking
          </h2>
          <p className="text-xs text-gray-500 mt-1">Track materials and client devices sent out for third-party servicing and warranty claims.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-md shadow transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Send Material Out
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sent Out</span>
          <span className="text-2xl font-bold text-gray-900 mt-2">{totalSent}</span>
          <span className="text-[10px] text-gray-400 mt-1">All registered items</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Currently Sent (Pending)</span>
          <span className="text-2xl font-bold text-amber-600 mt-2">{pendingRepairs}</span>
          <span className="text-[10px] text-amber-600 mt-1 font-medium">Waiting to receive back</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Received / Returned</span>
          <span className="text-2xl font-bold text-emerald-600 mt-2">{completedRepairs}</span>
          <span className="text-[10px] text-emerald-600 mt-1">Completed services</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Service Expenses</span>
          <span className="text-2xl font-bold text-blue-600 mt-2">₹{totalCost.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-gray-400 mt-1">Cost of third-party repairs</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search material name, serial #, ticket #, or service center..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'sent', 'received', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-all capitalize ${statusFilter === st ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading external service tracking...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic">No external repairs found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="px-6 py-3">Material / Device</th>
                  <th className="px-6 py-3">Sent To (Vendor)</th>
                  <th className="px-6 py-3">Date Sent</th>
                  <th className="px-6 py-3">Exp. Return</th>
                  <th className="px-6 py-3">Linked Ticket</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Cost</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{rep.material_name}</div>
                      {rep.serial_number && (
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">S/N: {rep.serial_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{rep.sent_to}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(rep.sent_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {rep.expected_return_date ? (
                        new Date(rep.expected_return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {rep.ticket_number ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-semibold">{rep.ticket_number}</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rep.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold uppercase">
                          <Send className="w-2.5 h-2.5" /> Sent Out
                        </span>
                      )}
                      {rep.status === 'received' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase" title={`Received on ${rep.received_date || ''}`}>
                          <CheckCircle className="w-2.5 h-2.5" /> Received
                        </span>
                      )}
                      {rep.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold uppercase">
                          <XCircle className="w-2.5 h-2.5" /> Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {rep.cost > 0 ? `₹${rep.cost.toLocaleString('en-IN')}` : <span className="text-gray-400">₹0</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        {rep.status === 'sent' && (
                          <button
                            onClick={() => handleOpenReceive(rep)}
                            className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 px-2 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors"
                          >
                            Receive Item
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(rep)}
                          className="p-1 hover:text-blue-600 text-gray-400 transition-colors"
                          title="Edit Service Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rep.id)}
                          className="p-1 hover:text-red-600 text-gray-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingRepair ? 'Edit External Service Details' : 'Send Material Out for Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Link Customer Service Ticket (Optional)</label>
                <select
                  value={formTicketNumber}
                  onChange={(e) => {
                    setFormTicketNumber(e.target.value);
                    // Autofill material name if linked ticket matches
                    if (e.target.value) {
                      const matched = tickets.find(t => t.ticket_number === e.target.value);
                      if (matched && !formMaterialName) {
                        setFormMaterialName(matched.device_type || '');
                      }
                    }
                  }}
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- No Linked Ticket --</option>
                  {tickets.map((t) => (
                    <option key={t.id} value={t.ticket_number}>
                      {t.ticket_number} - {t.customer_name} ({t.device_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Material / Device Name *</label>
                <input
                  type="text"
                  required
                  value={formMaterialName}
                  onChange={(e) => setFormMaterialName(e.target.value)}
                  placeholder="e.g. Dell Laptop Motherboard, Hikvision DVR"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Serial Number / Tag</label>
                  <input
                    type="text"
                    value={formSerialNumber}
                    onChange={(e) => setFormSerialNumber(e.target.value)}
                    placeholder="S/N or Item Barcode"
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sent to (Service Center) *</label>
                  <input
                    type="text"
                    required
                    value={formSentTo}
                    onChange={(e) => setFormSentTo(e.target.value)}
                    placeholder="e.g. Dell Authorized, local supplier"
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Sent</label>
                  <input
                    type="date"
                    value={formSentDate}
                    onChange={(e) => setFormSentDate(e.target.value)}
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={formExpectedReturn}
                    onChange={(e) => setFormExpectedReturn(e.target.value)}
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editingRepair && (
                <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'sent' | 'received' | 'cancelled')}
                      className="w-full bg-white border rounded-md px-2 py-1.5 text-xs text-gray-900 focus:outline-none"
                    >
                      <option value="sent">Sent</option>
                      <option value="received">Received</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Received Date</label>
                    <input
                      type="date"
                      value={formReceivedDate}
                      onChange={(e) => setFormReceivedDate(e.target.value)}
                      disabled={formStatus !== 'received'}
                      className="w-full bg-white border rounded-md px-2 py-1 text-xs text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Service Cost (₹)</label>
                    <input
                      type="number"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      className="w-full bg-white border rounded-md px-2 py-1 text-xs text-gray-900 font-semibold text-right"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Internal Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Service description, technician diagnostic notes, external repair ticket #"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-55 shadow-sm bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Receive Modal */}
      {showReceiveModal && receivingRepair && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Receive Serviced Material
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-emerald-700 hover:text-emerald-900 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border border-gray-200">
                <div><span className="font-semibold text-gray-800">Material:</span> {receivingRepair.material_name}</div>
                {receivingRepair.serial_number && <div><span className="font-semibold text-gray-800">S/N:</span> {receivingRepair.serial_number}</div>}
                <div><span className="font-semibold text-gray-800">Sent to:</span> {receivingRepair.sent_to}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Return Received Date</label>
                <input
                  type="date"
                  required
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Servicing Cost (₹) *</label>
                <input
                  type="number"
                  required
                  value={receiveCost}
                  onChange={(e) => setReceiveCost(e.target.value)}
                  placeholder="0 if free/warranty repair"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Add Return/Diagnostic Notes</label>
                <textarea
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes about repair outcome, parts replaced, vendor invoice no. etc."
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 border rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold shadow"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
