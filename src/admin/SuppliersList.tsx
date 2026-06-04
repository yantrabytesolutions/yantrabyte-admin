import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Supplier, Purchase } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Award,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGstin, setFormGstin] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setPurchases(data || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormGstin('');
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail view
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormPhone(sup.phone || '');
    setFormEmail(sup.email || '');
    setFormAddress(sup.address || '');
    setFormGstin(sup.gstin || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Supplier Name is required.');
      return;
    }

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      address: formAddress.trim() || null,
      gstin: formGstin.trim() || null
    };

    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', editingSupplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
      alert('Failed to save supplier profile.');
    }
  };

  // Filtered List
  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.phone || '').includes(search) || 
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.gstin || '').toLowerCase().includes(search.toLowerCase())
  );

  // Supplier detail analytics
  const getSupplierPurchases = (supId: string) => {
    return purchases.filter(p => p.supplier_id === supId);
  };

  const getSupplierTotals = (supId: string) => {
    const supPurchases = getSupplierPurchases(supId);
    const totalBilled = supPurchases.reduce((sum, p) => sum + (p.grand_total || 0), 0);
    const outstandingDues = supPurchases.reduce((sum, p) => sum + (p.balance_due || 0), 0);
    return { totalBilled, outstandingDues, count: supPurchases.length };
  };

  if (selectedSupplier) {
    const stats = getSupplierTotals(selectedSupplier.id);
    const supplierPurchases = getSupplierPurchases(selectedSupplier.id);

    return (
      <div className="space-y-6">
        
        {/* Back Button */}
        <button 
          onClick={() => setSelectedSupplier(null)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Supplier Info Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5 h-fit">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">Vendor Profile</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedSupplier.name}</h3>
              {selectedSupplier.gstin && (
                <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-gray-400" /> GSTIN: {selectedSupplier.gstin}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 text-sm text-gray-700">
              {selectedSupplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${selectedSupplier.phone}`} className="hover:text-blue-600 font-medium">{selectedSupplier.phone}</a>
                </div>
              )}
              {selectedSupplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${selectedSupplier.email}`} className="hover:text-blue-600 font-medium">{selectedSupplier.email}</a>
                </div>
              )}
              {selectedSupplier.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600 leading-relaxed">{selectedSupplier.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Ledger Analytics & Purchases History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* mini stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Purchases</span>
                <span className="text-xl font-bold text-gray-900 mt-1">₹{stats.totalBilled.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-gray-400 mt-1">Across {stats.count} bills</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounts Payable</span>
                <span className="text-xl font-bold text-rose-600 mt-1">₹{stats.outstandingDues.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-rose-500 mt-1 font-semibold">Total dues owed</span>
              </div>
            </div>

            {/* Purchases Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Procurement Ledger
              </div>
              
              {supplierPurchases.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">No purchase entries recorded for this vendor.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                      <th className="px-6 py-3">Bill No.</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Bill Total</th>
                      <th className="px-6 py-3 text-right">Dues Owed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {supplierPurchases.map((pur) => (
                      <tr key={pur.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-mono font-semibold">{pur.purchase_no}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{pur.date}</td>
                        <td className="px-6 py-4 text-right font-semibold">₹{pur.grand_total.toLocaleString('en-IN')}</td>
                        <td className={`px-6 py-4 text-right font-bold ${pur.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{pur.balance_due.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Supplier Directory
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage vendor contact profiles, GST registrations, and track procurement invoice ledgers.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-md shadow transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Search suppliers by name, phone, email, or GSTIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading supplier profiles...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 italic bg-white rounded-lg border border-gray-100">No suppliers found in directory.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup) => {
            const stats = getSupplierTotals(sup.id);
            return (
              <div 
                key={sup.id}
                onClick={() => setSelectedSupplier(sup)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">{sup.name}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {sup.gstin && (
                    <div className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border max-w-fit">
                      GST: {sup.gstin}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-50">
                    {sup.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {sup.phone}</div>}
                    {sup.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {sup.email}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                  <div>
                    <div>Billed Total:</div>
                    <div className="font-bold text-gray-900">₹{stats.totalBilled.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div>Dues Owed:</div>
                    <div className={`font-bold ${stats.outstandingDues > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{stats.outstandingDues.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Edit Button overlay */}
                <button
                  onClick={(e) => handleOpenEdit(sup, e)}
                  className="absolute bottom-16 right-4 p-1.5 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 border border-gray-100 transition-colors"
                  title="Edit Supplier Profile"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Hikvision Authorized Distributor"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formGstin}
                  onChange={(e) => setFormGstin(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contact number"
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Vendor email"
                    className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={3}
                  placeholder="Vendor business address"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-55 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
