import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AmcContract } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Phone,
  Mail,
  Copy
} from 'lucide-react';

interface AmcContractsProps {
  onRenewContract: (contract: AmcContract) => void;
}

export default function AmcContracts({ onRenewContract }: AmcContractsProps) {
  const [contracts, setContracts] = useState<AmcContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'requested'>('all');
  const [copied, setCopied] = useState(false);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<AmcContract | null>(null);
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formContractValue, setFormContractValue] = useState('0');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)
  );
  const [formStatus, setFormStatus] = useState<'active' | 'expired' | 'renewed' | 'requested'>('active');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('amc_contracts')
        .select('*')
        .order('end_date', { ascending: true });
      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Error fetching AMC contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingContract(null);
    setFormClientName('');
    setFormClientEmail('');
    setFormClientPhone('');
    setFormContractValue('0');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate(
      new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)
    );
    setFormStatus('active');
    setFormNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (contract: AmcContract) => {
    setEditingContract(contract);
    setFormClientName(contract.client_name);
    setFormClientEmail(contract.client_email || '');
    setFormClientPhone(contract.client_phone);
    setFormContractValue(String(contract.contract_value));
    setFormStartDate(contract.start_date);
    setFormEndDate(contract.end_date);
    setFormStatus(contract.status);
    setFormNotes(contract.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim() || !formClientPhone.trim()) {
      alert('Client Name and Phone Number are required.');
      return;
    }

    const payload = {
      client_name: formClientName.trim(),
      client_email: formClientEmail.trim() || null,
      client_phone: formClientPhone.trim(),
      contract_value: Number(formContractValue) || 0,
      start_date: formStartDate,
      end_date: formEndDate,
      status: formStatus,
      notes: formNotes.trim() || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingContract) {
        const { error } = await supabase
          .from('amc_contracts')
          .update(payload)
          .eq('id', editingContract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('amc_contracts')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchContracts();
    } catch (err) {
      console.error('Error saving AMC contract:', err);
      alert('Failed to save AMC contract.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AMC contract?')) return;
    try {
      const { error } = await supabase
        .from('amc_contracts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchContracts();
    } catch (err) {
      console.error('Error deleting contract:', err);
    }
  };

  const getContractExpiringDays = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Metrics
  const activeContractsCount = contracts.filter(c => c.status === 'active' && getContractExpiringDays(c.end_date) > 30).length;
  const expiringContractsCount = contracts.filter(c => c.status === 'active' && getContractExpiringDays(c.end_date) <= 30 && getContractExpiringDays(c.end_date) >= 0).length;
  const expiredContractsCount = contracts.filter(c => c.status === 'expired' || (c.status === 'active' && getContractExpiringDays(c.end_date) < 0)).length;
  const requestedContractsCount = contracts.filter(c => c.status === 'requested').length;
  const amcTotalPortfolioValue = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.contract_value || 0), 0);

  // Filtered list
  const filtered = contracts.filter(c => {
    const matchesSearch = 
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_phone.includes(search) ||
      (c.client_email || '').toLowerCase().includes(search.toLowerCase());

    const daysLeft = getContractExpiringDays(c.end_date || '');
    const isActuallyExpired = c.status === 'expired' || (c.status === 'active' && daysLeft < 0);
    const isActuallyExpiring = c.status === 'active' && daysLeft <= 30 && daysLeft >= 0;
    const isActuallyActive = c.status === 'active' && daysLeft > 30;
    const isActuallyRequested = c.status === 'requested';

    if (statusFilter === 'active') return matchesSearch && isActuallyActive;
    if (statusFilter === 'expiring') return matchesSearch && isActuallyExpiring;
    if (statusFilter === 'expired') return matchesSearch && isActuallyExpired;
    if (statusFilter === 'requested') return matchesSearch && isActuallyRequested;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            AMC Scheduler & Contracts
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage corporate IT annual maintenance contracts, track renewal schedules, and auto-generate invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText("https://yantrabyte.com/amc-request");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`flex items-center px-4 py-2 border rounded-md text-sm font-semibold transition-all duration-300 ${
              copied 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
            title="Copy AMC Request page link to send to clients"
          >
            <Copy className="w-4 h-4 mr-1.5" />
            {copied ? 'Copied Link!' : 'Copy AMC Link'}
          </button>
          <button 
            onClick={handleOpenAdd} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-md shadow transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Contract
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active AMC Contracts</span>
          <span className="text-2xl font-bold text-emerald-600 mt-2">{activeContractsCount}</span>
          <span className="text-[10px] text-emerald-600 mt-1 font-medium">Safe & active contracts</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiring (Next 30 Days)</span>
          <span className="text-2xl font-bold text-amber-500 mt-2">{expiringContractsCount}</span>
          <span className="text-[10px] text-amber-500 mt-1 font-semibold">Requires outreach</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired AMC Contracts</span>
          <span className="text-2xl font-bold text-rose-600 mt-2">{expiredContractsCount}</span>
          <span className="text-[10px] text-rose-500 mt-1 font-semibold">Overdue for renewal</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AMC Inquiries</span>
          <span className="text-2xl font-bold text-blue-500 mt-2">{requestedContractsCount}</span>
          <span className="text-[10px] text-blue-500 mt-1 font-semibold">Requested via website</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Portfolio Value</span>
          <span className="text-2xl font-bold text-blue-600 mt-2">₹{amcTotalPortfolioValue.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-gray-400 mt-1">Total value of active contracts</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search AMC client name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'expiring', 'expired', 'requested'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-all capitalize ${statusFilter === st ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
            >
              {st === 'expiring' ? 'Expiring Soon' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading AMC contracts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic">No AMC contracts found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Contract Value</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((con) => {
                  const daysLeft = getContractExpiringDays(con.end_date);
                  const isExpired = con.status === 'expired' || daysLeft < 0;
                  const isExpiring = con.status === 'active' && daysLeft <= 30 && daysLeft >= 0;

                  return (
                    <tr key={con.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{con.client_name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5 font-medium">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {con.client_phone}</span>
                          {con.client_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {con.client_email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{con.contract_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {con.start_date ? new Date(con.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-900">
                          {con.end_date ? new Date(con.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                        {con.status === 'active' && (
                          <div className={`text-[10px] font-semibold mt-1 ${isExpiring ? 'text-amber-600' : daysLeft < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {con.status === 'requested' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold uppercase">
                            <Clock className="w-2.5 h-2.5" /> Requested
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold uppercase">
                            <AlertTriangle className="w-2.5 h-2.5" /> Expired
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold uppercase animate-pulse">
                            <Clock className="w-2.5 h-2.5" /> Expiring
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase">
                            <CheckCircle className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => onRenewContract(con)}
                            className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 px-2 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1"
                            title="Generate renewal invoice / bill"
                          >
                            <RefreshCw className="w-3 h-3" /> Renew / Bill
                          </button>
                          <button
                            onClick={() => handleOpenEdit(con)}
                            className="p-1 hover:text-blue-600 text-gray-400 transition-colors"
                            title="Edit Contract Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(con.id)}
                            className="p-1 hover:text-red-600 text-gray-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingContract ? 'Edit AMC Contract' : 'Register New AMC Contract'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  placeholder="e.g. Acme Tech Solutions Office"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    placeholder="Client email address"
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contract Value (₹) *</label>
                <input
                  type="number"
                  required
                  value={formContractValue}
                  onChange={(e) => setFormContractValue(e.target.value)}
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editingContract && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'expired' | 'renewed' | 'requested')}
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                  >
                    <option value="requested">Requested</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="renewed">Renewed</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes / Terms</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Included services (e.g. 4 quarterly visits, desktop servicing, CCTV maintenance)"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
