import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Supplier, Purchase, PurchaseItem, Product } from '../types';
import { Plus, Trash2, Save, FileText, RefreshCw, Truck, UserPlus, X } from 'lucide-react';
import { ERPUtils } from '../utils/erp';

export default function PurchaseSoftware() {
  const [purchaseNo, setPurchaseNo] = useState('');
  const [date, setDate] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(0);
  const [itemProductId, setItemProductId] = useState<string>('');

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Supplier Add Dialog
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupGstin, setNewSupGstin] = useState('');
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
    setDate(new Date().toLocaleDateString('en-GB')); // dd/mm/yyyy
  }, []);

  const fetchPurchases = async () => {
    const { data, error } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setPurchases(data);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (!error && data) {
      setSuppliers(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (!error && data) {
      setProductsList(data);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const beforeRound = (subtotal - discount) + tax;
  const grandTotal = Math.round(beforeRound);
  const roundOff = grandTotal - beforeRound;
  const balanceDue = grandTotal - amountPaid;

  // Stats dashboard calculations
  const totalPurchasesAmount = purchases.reduce((acc, p) => acc + (p.grand_total || 0), 0);
  const totalSupplierDues = purchases.reduce((acc, p) => acc + (p.balance_due || 0), 0);
  const totalPaidToSuppliers = purchases.reduce((acc, p) => acc + (p.amount_paid || 0), 0);

  const generatePurchaseNo = () => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = (purchases.length + 1).toString().padStart(3, '0');
    return `YBP-${datePart}-${seq}`;
  };

  const handleAddItem = () => {
    if (!itemDesc.trim()) {
      showToast('Please enter an item description.', 'error');
      return;
    }
    if (itemQty <= 0) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }
    setItems([...items, { product_id: itemProductId || undefined, description: itemDesc, qty: itemQty, rate: itemRate }]);
    setItemDesc('');
    setItemQty(1);
    setItemRate(0);
    setItemProductId('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setSelectedPurchaseId('');
    setPurchaseNo('');
    setDate(new Date().toLocaleDateString('en-GB'));
    setSelectedSupplierId('');
    setSupplierName('');
    setDiscount(0);
    setTax(0);
    setAmountPaid(0);
    setItems([]);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }

    setIsSavingSupplier(true);
    try {
      const { data, error } = await supabase.from('suppliers').insert([{
        name: newSupName,
        phone: newSupPhone,
        email: newSupEmail,
        address: newSupAddress,
        gstin: newSupGstin
      }]).select().single();

      if (error) throw error;

      showToast('Supplier added successfully!');
      await fetchSuppliers();
      if (data) {
        setSelectedSupplierId(data.id);
        setSupplierName(data.name);
      }
      setShowSupplierModal(false);
      // Reset form
      setNewSupName('');
      setNewSupPhone('');
      setNewSupEmail('');
      setNewSupAddress('');
      setNewSupGstin('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg || 'Failed to create supplier', 'error');
    } finally {
      setIsSavingSupplier(false);
    }
  };



  const handleSave = async () => {
    if (!supplierName.trim()) {
      showToast('Please select or specify a supplier.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one item.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = !!selectedPurchaseId;
      const pNo = isUpdate ? purchases.find(p => p.id === selectedPurchaseId)?.purchase_no || generatePurchaseNo() : generatePurchaseNo();

      const payload = {
        purchase_no: pNo,
        supplier_id: selectedSupplierId || null,
        supplier_name: supplierName,
        date: date,
        items: items,
        subtotal,
        discount,
        tax,
        round_off: roundOff,
        grand_total: grandTotal,
        amount_paid: amountPaid,
        balance_due: balanceDue,
      };

      if (isUpdate) {
        const { data: savedPurchase, error } = await supabase.from('purchases').update(payload).eq('id', selectedPurchaseId).select().single();
        if (error) throw error;
        if (savedPurchase) await ERPUtils.recordPurchase(savedPurchase as Purchase);
        showToast('Purchase entry updated successfully!');
      } else {
        const { data: savedPurchase, error } = await supabase.from('purchases').insert([payload]).select().single();
        if (error) throw error;
        if (savedPurchase) await ERPUtils.recordPurchase(savedPurchase as Purchase);
        showToast('Purchase entry saved successfully!');
      }

      clearForm();
      await fetchPurchases();
      await fetchProducts();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg || 'Failed to save purchase entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePurchase = async (id: string, pNo: string) => {
    if (!window.confirm(`Are you sure you want to delete purchase entry ${pNo}? This will revert stock increments.`)) {
      return;
    }
    try {


      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
      showToast(`Purchase ${pNo} deleted successfully.`);
      if (selectedPurchaseId === id) {
        clearForm();
      }
      await fetchPurchases();
      await fetchProducts();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg || 'Failed to delete purchase', 'error');
    }
  };

  const loadPurchase = (id: string) => {
    const p = purchases.find(p => p.id === id);
    if (!p) return;
    setSelectedPurchaseId(p.id);
    setPurchaseNo(p.purchase_no);
    setDate(p.date);
    setSelectedSupplierId(p.supplier_id || '');
    setSupplierName(p.supplier_name);
    setDiscount(p.discount);
    setTax(p.tax);
    setAmountPaid(p.amount_paid);
    setItems(p.items || []);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border text-sm transition-all duration-300 transform translate-y-0 ${
          toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          <div className="font-semibold">{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Purchase Entries & Supplier Ledger</h2>
            <p className="text-sm text-gray-500">Record stock purchases from vendors and automatically increment catalog stock levels.</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={clearForm} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4 mr-2" /> New Purchase Entry
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Purchases</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-gray-900">₹{totalPurchasesAmount.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-[10px] text-indigo-600 mt-1 font-medium">Accumulated vendor invoices</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid to Suppliers</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-green-600">₹{totalPaidToSuppliers.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-[10px] text-green-600 mt-1 font-medium">Total payments settled</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dues to Suppliers</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-amber-600">₹{totalSupplierDues.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-[10px] text-amber-600 mt-1 font-medium">Outstanding vendor balance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Purchase Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-4">
              {selectedPurchaseId ? `Edit Purchase Entry (${purchaseNo})` : 'New Purchase Entry'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="DD/MM/YYYY" />
              </div>
              
              {/* Supplier Selection */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-600">Supplier / Vendor</label>
                  <button type="button" onClick={() => setShowSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center font-medium">
                    <UserPlus className="w-3 h-3 mr-1" /> Quick Add Supplier
                  </button>
                </div>
                <div className="flex space-x-2">
                  <select 
                    value={selectedSupplierId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSupplierId(id);
                      const matched = suppliers.find(s => s.id === id);
                      setSupplierName(matched ? matched.name : '');
                    }}
                    className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500"
                  >
                    <option value="">-- Select Registered Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.gstin ? `(${s.gstin})` : ''}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={supplierName}
                    onChange={(e) => {
                      setSupplierName(e.target.value);
                      // Clear supplier ID if custom text is entered
                      const matched = suppliers.find(s => s.name.toLowerCase() === e.target.value.toLowerCase());
                      if (!matched) setSelectedSupplierId('');
                    }}
                    placeholder="Or type Supplier name"
                    className="w-1/3 bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-4">Purchase Items</h3>
            
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-600">Item Description</label>
                  <select 
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const matched = productsList.find(p => p.id === selectedId);
                        if (matched) {
                          setItemDesc(matched.name);
                          // Default rate to its selling price or 0
                          setItemRate(Number(matched.price) || 0);
                          setItemProductId(matched.id);
                        }
                      } else {
                        setItemProductId('');
                      }
                    }}
                    value={itemProductId}
                    className="text-[10px] border rounded px-1.5 py-0.5 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px]"
                  >
                    <option value="">Quick Select Catalog Product...</option>
                    {productsList.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (Stock: {prod.stock_count ?? 0})
                      </option>
                    ))}
                  </select>
                </div>
                <input type="text" value={itemDesc} onChange={e => {
                  setItemDesc(e.target.value);
                  if (itemProductId) {
                    const matched = productsList.find(p => p.id === itemProductId);
                    if (matched && matched.name !== e.target.value) {
                      setItemProductId('');
                    }
                  }
                }} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="Item description or product name" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                <input type="number" value={itemQty} onChange={e => setItemQty(Number(e.target.value))} min="1" className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cost Rate (₹)</label>
                <input type="number" value={itemRate || ''} onChange={e => setItemRate(Number(e.target.value))} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
              <div className="col-span-2">
                <button onClick={handleAddItem} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors text-sm flex justify-center items-center">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-4 border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-medium w-12">#</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium text-center w-16">Qty</th>
                    <th className="px-4 py-2 font-medium text-right w-24">Cost Rate</th>
                    <th className="px-4 py-2 font-medium text-right w-24">Total</th>
                    <th className="px-4 py-2 font-medium text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No items added yet.</td></tr>
                  ) : items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {it.description}
                        {it.product_id && (
                          <span className="ml-2 inline-block text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-normal">Catalog</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">{it.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-600">₹{it.rate.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">₹{(it.qty * it.rate).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount Received (₹)</label>
                <input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (₹)</label>
                <input type="number" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Summary & Ledger */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Purchase Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600"><span>Discount:</span> <span className="font-medium text-red-600">- ₹{discount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600"><span>Round Off:</span> <span className="font-medium">₹{roundOff.toLocaleString('en-IN')}</span></div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900"><span>Grand Total:</span> <span>₹{grandTotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600 pt-2 border-t"><span>Amount Paid:</span> <span className="font-medium">₹{amountPaid.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-bold text-indigo-700"><span>Balance Due:</span> <span>₹{balanceDue.toLocaleString('en-IN')}</span></div>
            </div>

            <div className="mt-8">
              <button disabled={isSaving} onClick={handleSave} className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200">
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Purchase Entry
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white border p-6 rounded-lg shadow-sm">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-400" /> Purchase History
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {purchases.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-6">No purchases recorded.</div>
              ) : purchases.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => loadPurchase(p.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors text-sm flex justify-between items-center cursor-pointer ${selectedPurchaseId === p.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{p.purchase_no}</span>
                      {p.balance_due <= 0 ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Settled</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                          ₹{p.balance_due.toLocaleString('en-IN')} Due
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.supplier_name} • {p.date}</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-1">Total: ₹{p.grand_total.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePurchase(p.id, p.purchase_no);
                      }} 
                      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-blue-600" />
                Add New Supplier
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Name *</label>
                <input type="text" required value={newSupName} onChange={e => setNewSupName(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="e.g. Acme Parts Pvt Ltd" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                  <input type="text" value={newSupPhone} onChange={e => setNewSupPhone(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="e.g. +91 98765 43210" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN Number</label>
                  <input type="text" value={newSupGstin} onChange={e => setNewSupGstin(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="e.g. 29AAAAA0000A1Z1" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input type="email" value={newSupEmail} onChange={e => setNewSupEmail(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="e.g. sales@acmeparts.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Postal Address</label>
                <textarea rows={2} value={newSupAddress} onChange={e => setNewSupAddress(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="Full business address..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSavingSupplier} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center">
                  {isSavingSupplier ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
