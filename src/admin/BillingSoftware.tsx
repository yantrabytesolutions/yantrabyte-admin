import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Trash2, Save, FileText, Download, CheckCircle, RefreshCw } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// --- Utility Functions ---
function numberToWords(num: number): string {
  num = Math.round(Number(num || 0));
  if (num === 0) return 'Zero Rupees';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  }
  function three(n: number): string {
    if (n < 100) return two(n);
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '');
  }

  let str = '';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const rest = num;

  if (crore) str += three(crore) + ' Crore ';
  if (lakh) str += three(lakh) + ' Lakh ';
  if (thousand) str += three(thousand) + ' Thousand ';
  if (rest) str += three(rest) + ' ';

  return str.trim() + ' Rupees';
}

export default function BillingSoftware() {
  const [docType, setDocType] = useState('Invoice');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(0);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  
  const [customersList, setCustomersList] = useState<any[]>([]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    // Attempt to fetch from 'Form Responses 1' table
    const { data, error } = await supabase.from('Form Responses 1').select('*');
    if (!error && data && data.length > 0) {
      setCustomersList(data);
    } else {
      // Fallback to service_tickets
      const { data: stData } = await supabase.from('service_tickets').select('*');
      if (stData) {
        setCustomersList(stData.map(st => ({
          full_name: st.customer_name,
          email: st.customer_email,
          phone: st.customer_phone,
          address: ''
        })));
      }
    }
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setInvoices(data);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
    setItems([...items, { description: itemDesc, qty: itemQty, rate: itemRate }]);
    setItemDesc('');
    setItemQty(1);
    setItemRate(0);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setSelectedInvoiceId('');
    setDocType('Invoice');
    setCustomerName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDiscount(0);
    setTax(0);
    setAdvancePaid(0);
    setItems([]);
  };

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = customersList.find(c => c.full_name === e.target.value);
    if (cust) {
      setCustomerName(cust.full_name || '');
      setEmail(cust.email || '');
      setPhone(cust.phone || '');
      setAddress(cust.address || '');
    }
  };

  const loadInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    setSelectedInvoiceId(inv.id);
    setDocType(inv.doc_type);
    setCustomerName(inv.customer_name);
    setPhone(inv.phone || '');
    setEmail(inv.email || '');
    setAddress(inv.address || '');
    setDiscount(inv.discount);
    setTax(inv.tax);
    setAdvancePaid(inv.advance_paid);
    setItems(inv.items || []);
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const beforeRound = (subtotal - discount) + tax;
  const grandTotal = Math.round(beforeRound);
  const roundOff = grandTotal - beforeRound;
  const balanceDue = grandTotal - advancePaid;

  const generateInvoiceNo = () => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = (invoices.length + 1).toString().padStart(3, '0');
    return `YBS-${datePart}-${seq}`;
  };

  const handleSave = async (andPrint = false) => {
    if (!customerName.trim()) {
      showToast('Please enter a customer name.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one item.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = !!selectedInvoiceId;
      const invoiceNo = isUpdate ? invoices.find(i => i.id === selectedInvoiceId)?.invoice_no || generateInvoiceNo() : generateInvoiceNo();
      const date = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

      const payload = {
        invoice_no: invoiceNo,
        doc_type: docType,
        date: date,
        customer_name: customerName,
        phone: phone,
        email: email,
        address: address,
        items: items,
        subtotal,
        discount,
        tax,
        round_off: roundOff,
        grand_total: grandTotal,
        advance_paid: advancePaid,
        balance_due: balanceDue,
      };

      let currentInvoiceId = selectedInvoiceId;

      if (isUpdate) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', selectedInvoiceId);
        if (error) throw error;
        showToast('Invoice updated successfully!');
      } else {
        const { data, error } = await supabase.from('invoices').insert([payload]).select().single();
        if (error) throw error;
        if (data) {
          currentInvoiceId = data.id;
          setSelectedInvoiceId(data.id);
        }
        showToast('Invoice saved successfully!');
      }

      await fetchInvoices();

      if (andPrint) {
        setTimeout(() => {
          generatePdf(payload.invoice_no);
        }, 500);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save invoice', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePdf = (invoiceNumber: string) => {
    if (!printRef.current) return;
    const element = printRef.current;
    
    // We make it temporarily visible for printing
    element.style.display = 'block';

    const opt = {
      margin: 0,
      filename: `YBS-${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 950 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
      showToast('PDF Generated successfully!');
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">YantraByte <span className="text-blue-600">Billing System</span></h2>
          <p className="text-sm text-gray-500">Create, edit, and generate PDF invoices and quotations natively.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={clearForm} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4 mr-2" /> New Document
          </button>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-lg flex items-center shadow-md ${toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-800">Document Details</h3>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${docType === 'Invoice' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
                  onClick={() => setDocType('Invoice')}
                >Invoice</button>
                <button 
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${docType === 'Quotation' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
                  onClick={() => setDocType('Quotation')}
                >Quotation</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <select onChange={handleSelectCustomer} className="text-xs border rounded-md px-2 py-1 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    {customersList.length === 0 ? (
                      <option value="">No customers found...</option>
                    ) : (
                      <>
                        <option value="">Select from Form Responses...</option>
                        {customersList.map((c, i) => (
                          <option key={i} value={c.full_name}>{c.full_name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Email address" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Full address"></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-4">Items & Billing</h3>
            
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={itemDesc} onChange={e => setItemDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="Item description" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                <input type="number" value={itemQty} onChange={e => setItemQty(Number(e.target.value))} min="1" className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Rate (₹)</label>
                <input type="number" value={itemRate || ''} onChange={e => setItemRate(Number(e.target.value))} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
              <div className="col-span-2">
                <button onClick={handleAddItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors text-sm flex justify-center items-center">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
            </div>

            <div className="mt-4 border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-medium w-12">#</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium text-center w-16">Qty</th>
                    <th className="px-4 py-2 font-medium text-right w-24">Rate</th>
                    <th className="px-4 py-2 font-medium text-right w-24">Amount</th>
                    <th className="px-4 py-2 font-medium text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No items added yet.</td></tr>
                  ) : items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{it.description}</td>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount (₹)</label>
                <input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tax (₹)</label>
                <input type="number" value={tax || ''} onChange={e => setTax(Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Advance Paid (₹)</label>
                <input type="number" value={advancePaid || ''} onChange={e => setAdvancePaid(Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600"><span>Discount:</span> <span className="font-medium text-red-600">- ₹{discount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax:</span> <span className="font-medium text-amber-600">+ ₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600"><span>Round Off:</span> <span className="font-medium">₹{roundOff.toLocaleString('en-IN')}</span></div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900"><span>Grand Total:</span> <span>₹{grandTotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-600 pt-2 border-t"><span>Advance Paid:</span> <span className="font-medium">₹{advancePaid.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-bold text-blue-700"><span>Balance Due:</span> <span>₹{balanceDue.toLocaleString('en-IN')}</span></div>
            </div>

            <div className="mt-8 space-y-3">
              <button disabled={isSaving} onClick={() => handleSave(false)} className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors">
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Only
              </button>
              <button disabled={isSaving} onClick={() => handleSave(true)} className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-green-200">
                <Download className="w-4 h-4 mr-2" /> Save & Generate PDF
              </button>
            </div>
          </div>

          <div className="bg-white border p-6 rounded-lg shadow-sm">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-400" /> Saved Invoices
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {invoices.map(inv => (
                <button 
                  key={inv.id} 
                  onClick={() => loadInvoice(inv.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors text-sm flex justify-between items-center ${selectedInvoiceId === inv.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                  <div>
                    <div className="font-semibold text-gray-800">{inv.invoice_no}</div>
                    <div className="text-xs text-gray-500">{inv.customer_name} • {inv.date}</div>
                  </div>
                  <div className="font-bold text-gray-700">₹{inv.grand_total.toLocaleString('en-IN')}</div>
                </button>
              ))}
              {invoices.length === 0 && <div className="text-sm text-gray-400 text-center py-4">No saved invoices</div>}
            </div>
          </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="bg-white p-[10px] w-full text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between border p-3 mb-2" style={{ borderColor: '#000000' }}>
            <div className="flex items-center space-x-4">
              <div className="w-[340px] h-28 flex items-center justify-start ml-2">
                <img src="/logo5.png" alt="YantraByte Solutions" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold" style={{ color: '#0B5394' }}>YANTRABYTE SOLUTIONS</h1>
              <p className="text-xs mt-1" style={{ color: '#333333' }}>47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br/>Chikkabettahalli, Bengaluru - 560097</p>
              <p className="text-xs mt-1" style={{ color: '#333333' }}>Phone: 09986742525 | Email: yantrabyte.solutions@gmail.com</p>
            </div>
          </div>

          <div className="font-bold text-center py-1 border-x border-t text-base tracking-widest uppercase" style={{ backgroundColor: '#0B5394', color: '#ffffff', borderColor: '#000000' }}>
            {docType === 'Quotation' ? 'QUOTATION' : 'INVOICE'}
          </div>

          <div className="flex justify-between border">
            <div className="w-1/2 p-2 border-r font-bold" style={{ borderColor: '#000000', color: '#0B5394' }}>
              {docType === 'Quotation' ? 'Quotation No: ' : 'Invoice No: '} {selectedInvoiceId ? (invoices.find(i=>i.id===selectedInvoiceId)?.invoice_no || 'DRAFT') : 'DRAFT'}
            </div>
            <div className="w-1/2 p-2 text-right font-bold" style={{ color: '#333333' }}>
              Date: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>

          <div className="border-x border-b" style={{ borderColor: '#000000' }}>
            <div className="p-1 px-2 font-bold text-sm border-b" style={{ backgroundColor: '#D9EAF7', borderColor: '#000000', color: '#000000' }}>Bill To:</div>
            <div className="p-2 text-sm leading-tight" style={{ color: '#000000' }}>
              <div className="font-bold text-base mb-1">{customerName || '—'}</div>
              <div>Phone: {phone || '—'} &nbsp;&nbsp;&nbsp; Email: {email || '—'}</div>
              <div>Address: {address || '—'}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mt-2 border text-sm text-left" style={{ borderColor: '#000000', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>
                <th className="border p-1.5 w-10" style={{ borderColor: '#000000' }}>Sl No.</th>
                <th className="border p-1.5 text-left" style={{ borderColor: '#000000' }}>Description</th>
                <th className="border p-1.5 w-12" style={{ borderColor: '#000000' }}>Qty</th>
                <th className="border p-1.5 w-20" style={{ borderColor: '#000000' }}>Rate</th>
                <th className="border p-1.5 w-24 text-right" style={{ borderColor: '#000000' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                  <td className="border p-1.5 text-center" style={{ borderColor: '#000000', color: '#000000' }}>{idx + 1}</td>
                  <td className="border p-1.5 font-medium" style={{ borderColor: '#000000', color: '#000000' }}>{it.description}</td>
                  <td className="border p-1.5 text-center" style={{ borderColor: '#000000', color: '#000000' }}>{it.qty}</td>
                  <td className="border p-1.5 text-right" style={{ borderColor: '#000000', color: '#000000' }}>{it.rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="border p-1.5 text-right font-bold" style={{ borderColor: '#000000', color: '#000000' }}>{(it.qty * it.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
              {/* Padding rows */}
              {[...Array(Math.max(0, 6 - items.length))].map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
                  <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
                  <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
                  <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
                  <td className="border-x p-1.5 text-transparent" style={{ borderColor: '#000000' }}>.</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Box */}
          <div className="flex border-x border-b text-sm" style={{ borderColor: '#000000' }}>
            <div className="w-3/5 p-2 border-r" style={{ borderColor: '#000000' }}>
              <div className="font-bold inline-block px-2 mb-1" style={{ backgroundColor: '#D9EAF7', color: '#000000' }}>Amount in Words:</div>
              <div className="italic ml-2" style={{ color: '#333333' }}>{numberToWords(grandTotal)} Only</div>
            </div>
            <div className="w-2/5 flex flex-col">
              <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Subtotal</span> <span style={{ color: '#000000' }}>{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
              {discount > 0 && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Discount</span> <span style={{ color: '#000000' }}>{discount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>}
              {tax > 0 && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Tax</span> <span style={{ color: '#000000' }}>{tax.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>}
              {roundOff !== 0 && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Round Off</span> <span style={{ color: '#000000' }}>{roundOff.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>}
              <div className="flex justify-between p-1 px-2 font-bold border-y" style={{ backgroundColor: '#FFF2CC', borderColor: '#000000', color: '#000000' }}><span>Grand Total</span> <span className="text-base">{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Advance Paid</span> <span style={{ color: '#000000' }}>{advancePaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-between p-1 px-2 font-bold border-t" style={{ backgroundColor: '#FFF2CC', borderColor: '#000000', color: '#000000' }}><span>Balance Due</span> <span className="text-base">{balanceDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="flex border-x border-b text-xs mt-2" style={{ borderColor: '#000000' }}>
            <div className="w-3/5 p-2 border-r" style={{ borderColor: '#000000' }}>
              <div className="font-bold inline-block w-full p-1 mb-1 text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>Terms & Conditions</div>
              <div className="space-y-0.5 ml-2" style={{ color: '#444444' }}>
                {docType === 'Quotation' ? (
                  <>
                    <p>1. Quotation is valid for 7 days from the date of issue.</p>
                    <p>2. Prices are inclusive of all taxes unless specified.</p>
                    <p>3. 50% advance payment required to confirm order.</p>
                    <p>4. Delivery within 3-5 working days after confirmation.</p>
                    <p>5. Service warranty as per manufacturer policy.</p>
                    <p>6. Subject to Bengaluru Jurisdiction.</p>
                  </>
                ) : (
                  <>
                    <p>1. Service warranty is valid for 30 days only.</p>
                    <p>2. No warranty for Windows installation/software issues.</p>
                    <p>3. YantraByte Solutions is not responsible for any data loss.</p>
                    <p>4. Customer should take backup of all important files prior.</p>
                    <p>5. Physical, liquid or burnt damages void warranty.</p>
                    <p>6. No warranty for swollen batteries or electrical faults.</p>
                  </>
                )}
              </div>
            </div>
            <div className="w-2/5 p-2 flex flex-col justify-between">
              <div>
                <div className="font-bold inline-block w-full p-1 mb-1 text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>Bank & Payment Details</div>
                <div className="flex items-center justify-between ml-2 mt-1">
                  <div className="leading-snug" style={{ color: '#000000', fontSize: '11px' }}>
                    <p><span className="font-bold">Bank:</span> North East Small Finance Bank</p>
                    <p><span className="font-bold">A/C Name:</span> YantraByte Solutions</p>
                    <p><span className="font-bold">A/C No:</span> 033311501023226</p>
                    <p><span className="font-bold">IFSC:</span> NESF0000333</p>
                    <p className="mt-0.5"><span className="font-bold">UPI:</span> s0424237152@slc</p>
                  </div>
                  <div className="w-16 h-16 flex-shrink-0 border p-0.5 mr-2" style={{ borderColor: '#dddddd' }}>
                    <img src="/qr.jpg" alt="Payment QR" style={{ height: '100%', width: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                  </div>
                </div>
              </div>
              <div className="text-center mt-3 pt-1 flex flex-col items-center justify-center relative">
                <p className="font-bold mb-1" style={{ color: '#000000', fontSize: '11px' }}>For YantraByte Solutions</p>
                <div className="h-16 w-32 flex items-center justify-center relative my-0.5">
                  <img src="/seal.png" alt="Seal" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                </div>
                <p className="font-bold mt-1" style={{ color: '#000000', fontSize: '11px' }}>RAMESH A S</p>
                <p style={{ color: '#444444', fontSize: '10px' }}>Authorized Signatory</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
