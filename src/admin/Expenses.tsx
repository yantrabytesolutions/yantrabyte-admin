import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ERPUtils } from '../utils/erp';
import type { Expense } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingDown
} from 'lucide-react';

const CATEGORIES = ['Rent', 'Salaries', 'Utilities', 'Tools', 'Marketing', 'Other'] as const;

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formCategory, setFormCategory] = useState<string>('Rent');
  const [formAmount, setFormAmount] = useState('0');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDescription, setFormDescription] = useState('');
  const [_submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);


  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormCategory('Rent');
    setFormAmount('0');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDescription('');
    setAttachment(null);
    setShowModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormCategory(exp.category);
    setFormAmount(String(exp.amount));
    setFormDate(exp.date);
    setFormDescription(exp.description || '');
    setAttachment(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formAmount) <= 0) {
      alert('Please enter an expense amount greater than 0.');
      return;
    }
    setSubmitting(true);
    let uploadedUrl = editingExpense?.receipt_url || null;

    try {
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('service-attachments')
          .upload(filePath, attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('service-attachments')
          .getPublicUrl(filePath);
        uploadedUrl = publicUrl;
      }

      const payload = {
        category: formCategory,
        amount: Number(formAmount),
        date: formDate,
        description: formDescription.trim() || null,
        receipt_url: uploadedUrl
      };

      if (editingExpense) {
        const { data: savedExp, error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editingExpense.id)
          .select()
          .single();
        if (error) throw error;
        if (savedExp) await ERPUtils.recordExpense(savedExp as Expense);
      } else {
        const { data: savedExp, error } = await supabase
          .from('expenses')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (savedExp) await ERPUtils.recordExpense(savedExp as Expense);
      }
      setShowModal(false);
      fetchExpenses();
      setAttachment(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  // Metrics
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonthExpenses = expenses
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  // Group by category for breakdowns
  const categorySummary = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const filtered = expenses.filter(e => {
    const matchesSearch = (e.description || '').toLowerCase().includes(search.toLowerCase()) || 
                          e.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Operational Expenses
          </h2>
          <p className="text-xs text-gray-500 mt-1">Track rent, utility bills, inventory purchases, marketing, and salary payouts.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-md shadow transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expenses (All Time)</span>
          <span className="text-2xl font-bold text-red-600 mt-2">₹{totalExpenses.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-gray-400 mt-1">Lifetime operating expenses</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expenses (This Month)</span>
          <span className="text-2xl font-bold text-gray-900 mt-2">₹{thisMonthExpenses.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-gray-400 mt-1">For current calendar month</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Category Breakdown</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            {CATEGORIES.slice(0, 4).map(cat => (
              <div key={cat} className="flex justify-between">
                <span>{cat}:</span>
                <span className="font-semibold text-gray-900">₹{categorySummary[cat].toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search expense description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${categoryFilter === 'all' ? 'bg-blue-55 bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${categoryFilter === cat ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading expense logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic">No expenses recorded matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Expense Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {exp.description || '-'}
                      {exp.receipt_url && (
                        <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="ml-2 text-blue-500 hover:underline inline-flex items-center" title="View Receipt">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1 hover:text-blue-600 text-gray-400 transition-colors"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
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

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingExpense ? 'Edit Expense Record' : 'Record Operating Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expense Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount Spent (₹) *</label>
                <input
                  type="number"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description / Memo</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Memo of expense (e.g. Office rent for May 2026)"
                  className="w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Receipt / Invoice Image</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {editingExpense?.receipt_url && !attachment && (
                  <p className="text-xs text-blue-600 mt-2">
                    <a href={editingExpense.receipt_url} target="_blank" rel="noreferrer">View Current Receipt</a>
                  </p>
                )}
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
