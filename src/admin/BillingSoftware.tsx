import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem, ServiceTicket, Product, Customer, Purchase } from '../types';
import { Plus, Trash2, Save, FileText, Download, CheckCircle, RefreshCw, Copy, Users, X, Wrench, Receipt, Mail, FileSpreadsheet, Eye, FileEdit } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { PRESET_ITEMS } from './presetItems';
import { downloadExcelWorkbook } from '../utils/spreadsheetXml';

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

interface BillingSoftwareProps {
  initialAutofillTicket?: ServiceTicket | null;
  onClearAutofill?: () => void;
}

type DeliveryPopup = {
  status: 'sending' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
} | null;

const PAYMENT_MODES = ['Not specified', 'Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];
const CUSTOMER_MASTER_FRESH_KEY = 'billing_customer_master_fresh_started_at';
const CUSTOMER_MASTER_FRESH_VALUE = '2026-05-22T19:00:00+05:30';

const isPersistedCustomerId = (id: string) => !!id && !id.startsWith('legacy-');

const normalizePhone = (value: string) => value.trim().replace(/\s+/g, ' ');

const getPaymentStatus = (docType: string, balanceDue: number, amountPaid: number) => {
  if (docType === 'Quotation') return 'Estimate';
  if (balanceDue <= 0) return 'Paid';
  if (amountPaid > 0) return 'Partial';
  return 'Due';
};

const shouldRetryLegacyInvoiceSave = (error: { message?: string; code?: string }) => {
  const message = String(error.message || '').toLowerCase();
  return error.code === 'PGRST204'
    || message.includes('customer_id')
    || message.includes('payment_mode')
    || message.includes('payment_status')
    || message.includes('due_date');
};

const formatError = (err: unknown): string => {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const eError = e.error as Record<string, unknown> | undefined;
    const msg = e.message || eError?.message || e.error || e.code || e.statusText;
    if (typeof msg === 'string') return msg;
    try {
      return JSON.stringify(err);
    } catch {
      return 'Error object';
    }
  }
  return String(err);
};

const formatItemsForExcel = (items: Array<{ description: string; qty: number; rate: number }> = []) =>
  items.map(item => `${item.description} x${item.qty} @ ${item.rate}`).join('\n');

const INVOICE_HEADERS = [
  'No',
  'Date',
  'Customer',
  'Phone',
  'Email',
  'Address',
  'Items',
  'Subtotal',
  'Discount',
  'Tax',
  'Round Off',
  'Grand Total',
  'Amount Paid',
  'Balance Due',
  'Payment Status',
  'Payment Mode',
  'Due Date',
  'Link',
];



export default function BillingSoftware({ initialAutofillTicket, onClearAutofill }: BillingSoftwareProps) {
  const [docType, setDocType] = useState('Invoice');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Not specified');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(0);
  const [itemProductId, setItemProductId] = useState<string>('');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');


  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [serviceTicketsList, setServiceTicketsList] = useState<ServiceTicket[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [printInvoiceNumber, setPrintInvoiceNumber] = useState('');
  const [draftInvoiceNo, setDraftInvoiceNo] = useState('');
  const [deliveryPopup, setDeliveryPopup] = useState<DeliveryPopup>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [payments, setPayments] = useState<{ date: string; amount: number; mode: string }[]>([]);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentEntryAmount, setPaymentEntryAmount] = useState(0);
  const [paymentEntryMode, setPaymentEntryMode] = useState('Cash');

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyDrawerData, setHistoryDrawerData] = useState<{
    invoices: Invoice[];
    tickets: ServiceTicket[];
    totalSpend: number;
    outstanding: number;
  } | null>(null);

  const openCustomerHistory = () => {
    if (!customerName.trim()) {
      showToast('Please enter or select a customer name first', 'error');
      return;
    }
    
    const matchedInvoices = invoices.filter(inv => 
      inv.customer_name?.trim().toLowerCase().includes(customerName.trim().toLowerCase())
    );
    
    const matchedTickets = serviceTicketsList.filter(t => 
      t.customer_name?.trim().toLowerCase().includes(customerName.trim().toLowerCase())
    );

    const totalSpend = matchedInvoices
      .filter(inv => inv.doc_type === 'Invoice')
      .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

    const outstanding = matchedInvoices
      .filter(inv => inv.doc_type === 'Invoice')
      .reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

    setHistoryDrawerData({
      invoices: matchedInvoices,
      tickets: matchedTickets,
      totalSpend,
      outstanding
    });
    setShowHistoryDrawer(true);
  };
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadBillingData = async () => {
      await ensureFreshCustomerMaster();
      fetchInvoices();
      fetchCustomers();
      fetchServiceTickets();
      fetchProducts();
    };

    loadBillingData();
    // Fresh-start bootstrapping should run once when the billing screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Realtime Auto-Refresh ---
  useEffect(() => {
    const channel = supabase
      .channel('billing-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_tickets' }, () => {
        fetchServiceTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureFreshCustomerMaster = async () => {
    try {
      const { data: settings } = await supabase
        .from('site_settings')
        .select('id, key, value')
        .in('key', [CUSTOMER_MASTER_FRESH_KEY]);

      const settingByKey = new Map((settings || []).map(setting => [String(setting.key), setting]));
      const customerSetting = settingByKey.get(CUSTOMER_MASTER_FRESH_KEY);

      if (customerSetting?.value === CUSTOMER_MASTER_FRESH_VALUE) {
        return;
      }

      const { error: invoiceClearError } = await supabase
        .from('invoices')
        .update({ customer_id: null })
        .not('customer_id', 'is', null);
      if (invoiceClearError) throw invoiceClearError;

      const { error: customerClearError } = await supabase
        .from('customers')
        .delete()
        .not('id', 'is', null);
      if (customerClearError) throw customerClearError;

      if (customerSetting?.id) {
        const { error: updateSettingError } = await supabase
          .from('site_settings')
          .update({ value: CUSTOMER_MASTER_FRESH_VALUE })
          .eq('id', customerSetting.id);
        if (updateSettingError) throw updateSettingError;
      } else {
        const { error: insertSettingError } = await supabase
          .from('site_settings')
          .insert([{ key: CUSTOMER_MASTER_FRESH_KEY, value: CUSTOMER_MASTER_FRESH_VALUE }]);
        if (insertSettingError) throw insertSettingError;
      }

      setCustomersList([]);
    } catch (err) {
      console.warn('Customer master fresh start check skipped:', err);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) {
      setProductsList(data);
    }
  };

  useEffect(() => {
    if (initialAutofillTicket) {
      setSelectedCustomerId('');
      setCustomerName(initialAutofillTicket.customer_name || '');
      setPhone(initialAutofillTicket.customer_phone || '');
      setEmail(initialAutofillTicket.customer_email || '');
      setAddress(initialAutofillTicket.customer_address || '');
      setPaymentMode('Not specified');
      setDueDate('');
      
      // Auto-set document type to 'Invoice'
      setDocType('Invoice');
      
      // Add dynamic service item for this ticket!
      const defaultDesc = `Service Charge: Repair of ${initialAutofillTicket.device_type || 'Device'} (${initialAutofillTicket.ticket_number})`;
      setItems([{
        description: defaultDesc,
        qty: 1,
        rate: 0
      }]);
      
      // Clear parent state so it doesn't re-trigger on subsequent clicks/switches
      if (onClearAutofill) {
        onClearAutofill();
      }
      
      showToast(`Loaded ticket ${initialAutofillTicket.ticket_number} details! Set the rate for the service item.`);
    }
  }, [initialAutofillTicket, onClearAutofill]);

  useEffect(() => {
    if (payments.length > 0) {
      const sum = payments.reduce((s, p) => s + (p.amount || 0), 0);
      setAdvancePaid(sum);
      const last = payments[payments.length - 1];
      if (last.mode && last.mode !== 'Not specified') {
        setPaymentMode(last.mode);
      }
    }
  }, [payments]);

  const fetchServiceTickets = async () => {
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .order('ticket_number', { ascending: false });
    if (!error && data) {
      setServiceTicketsList(data);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setCustomersList(data);
      return;
    }

    setCustomersList([]);
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInvoices(data);
    } else if (error) {
      const msg = formatError(error);
      if (msg.includes('42501') || msg.includes('row-level security')) {
        showToast('Session expired. Please logout and login again.', 'error');
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddItem = () => {
    if (!itemName.trim() && !itemDesc.trim()) {
      showToast('Please enter an item name or description.', 'error');
      return;
    }
    if (itemQty <= 0) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }
    setItems([...items, { product_id: itemProductId || undefined, item_name: itemName.trim() || undefined, description: itemDesc, qty: itemQty, rate: itemRate }]);
    setItemName('');
    setItemDesc('');
    setItemQty(1);
    setItemRate(0);
    setItemProductId('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddPayment = () => {
    if (!paymentDate) {
      showToast('Please select a payment date.', 'error');
      return;
    }
    if (paymentEntryAmount <= 0) {
      showToast('Payment amount must be greater than 0.', 'error');
      return;
    }
    setPayments([...payments, { date: paymentDate, amount: paymentEntryAmount, mode: paymentEntryMode }]);
    setPaymentDate('');
    setPaymentEntryAmount(0);
    setPaymentEntryMode('Cash');
  };

  const clearForm = () => {
    setSelectedInvoiceId('');
    setDraftInvoiceNo('');
    setDocType('Invoice');
    setSelectedCustomerId('');
    setCustomerName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDiscount(0);
    setTax(0);
    setAdvancePaid(0);
    setPaymentMode('Not specified');
    setDueDate('');
    setItems([]);
    setPayments([]);
    setPaymentDate('');
    setPaymentEntryAmount(0);
    setPaymentEntryMode('Cash');
  };

  const handleSelectServiceTicketCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (!name) return;
    const tickets = serviceTicketsList
      .filter(t => t.customer_name?.trim().toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = tickets[0];
    if (latest) {
      setCustomerName(latest.customer_name || '');
      setPhone(latest.customer_phone || '');
      setEmail(latest.customer_email || '');
      setAddress(latest.customer_address || '');
      setSelectedCustomerId('');
    }
  };

  const handleSelectServiceTicket = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ticket = serviceTicketsList.find(t => t.ticket_number === e.target.value);
    if (ticket) {
      setCustomerName(ticket.customer_name || '');
      setPhone(ticket.customer_phone || '');
      setEmail(ticket.customer_email || '');
      setAddress(ticket.customer_address || '');
      
      const device = ticket.device_type ? ticket.device_type.trim() : '';
      const issue = ticket.issue_description ? ticket.issue_description.trim() : '';
      const desc = `Service & Repair: ${device}${issue ? ` (${issue})` : ''}`;
      
      const matchedCust = customersList.find(c => {
        const samePhone = c.phone && ticket.customer_phone && normalizePhone(c.phone) === normalizePhone(ticket.customer_phone);
        const sameName = c.name?.trim().toLowerCase() === ticket.customer_name?.trim().toLowerCase();
        return samePhone || sameName;
      });
      if (matchedCust) {
        setSelectedCustomerId(isPersistedCustomerId(matchedCust.id) ? matchedCust.id : '');
      } else {
        setSelectedCustomerId('');
      }

      if (matchedCust && matchedCust.address) {
        setAddress(matchedCust.address);
      } else if (ticket.customer_address) {
        setAddress(ticket.customer_address);
      }

      const itemExists = items.some(it => it.description.startsWith('Service & Repair:'));
      if (!itemExists) {
        setItems([{ description: desc, qty: 1, rate: 0 }, ...items]);
      } else {
        setItems([{ description: desc, qty: 1, rate: 0 }, ...items.filter(it => !it.description.startsWith('Service & Repair:'))]);
      }
      
      showToast(`Selected ticket ${ticket.ticket_number} - Details loaded!`);
    }
  };

  const handleDeleteInvoice = async (id: string, invoiceNo: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) {
      return;
    }
    try {
      const inv = invoices.find(i => i.id === id);
      if (inv && inv.doc_type === 'Invoice') {
        await adjustStock(inv.items, 1);
      }

      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      showToast(`Invoice ${invoiceNo} deleted successfully.`);
      if (selectedInvoiceId === id) {
        clearForm();
      }
      await fetchInvoices();
      await fetchProducts();
    } catch (err) {
      const errorMsg = formatError(err);
      showToast(errorMsg || 'Failed to delete invoice', 'error');
    }
  };

  const loadInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    setSelectedInvoiceId(inv.id);
    setDocType(inv.doc_type);
    setSelectedCustomerId(inv.customer_id || '');
    setCustomerName(inv.customer_name);
    setPhone(inv.phone || '');
    setEmail(inv.email || '');
    setAddress(inv.address || '');
    setDiscount(inv.discount);
    setTax(inv.tax);
    setAdvancePaid(inv.advance_paid);
    setPaymentMode(inv.payment_mode || 'Not specified');
    setDueDate(inv.due_date || '');
    setItems(inv.items || []);
    setPayments(inv.payments || []);
    setPaymentDate('');
    setPaymentEntryAmount(0);
    setPaymentEntryMode('Cash');
  };

  const handleConvertToInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    // Clear the selected invoice ID so that we start as a brand new unsaved Invoice!
    setSelectedInvoiceId('');
    setDraftInvoiceNo('');
    
    // Force Document Type to 'Invoice'
    setDocType('Invoice');
    
    // Keep all customer and items details intact!
    setSelectedCustomerId(inv.customer_id || '');
    setCustomerName(inv.customer_name);
    setPhone(inv.phone || '');
    setEmail(inv.email || '');
    setAddress(inv.address || '');
    setDiscount(inv.discount);
    setTax(inv.tax);
    setAdvancePaid(inv.advance_paid);
    setPaymentMode(inv.payment_mode || 'Not specified');
    setDueDate(inv.due_date || '');
    setItems(inv.items || []);
    setPayments(inv.payments || []);
    setPaymentDate('');
    setPaymentEntryAmount(0);
    setPaymentEntryMode('Cash');
    
    showToast(`Converted quotation ${inv.invoice_no} to a new draft Invoice! Click Save or Print to finalize.`);
  };

  // Calculations
  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const beforeRound = (subtotal - discount) + tax;
  const grandTotal = Math.round(beforeRound);
  const roundOff = grandTotal - beforeRound;
  const balanceDue = grandTotal - advancePaid;
  const paymentStatus = getPaymentStatus(docType, balanceDue, advancePaid);

  // Stats dashboard calculations
  const totalBilled = invoices.filter(i => i.doc_type === 'Invoice').reduce((acc, i) => acc + (i.grand_total || 0), 0);
  const totalOutstanding = invoices.filter(i => i.doc_type === 'Invoice').reduce((acc, i) => acc + Math.max(i.balance_due || 0, 0), 0);
  const invoiceCount = invoices.filter(i => i.doc_type === 'Invoice').length;
  const quoteCount = invoices.filter(i => i.doc_type === 'Quotation').length;

  const generateInvoiceNo = async (type: string = docType) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const datePrefix = `${startYear}-${startYear + 1}`;
    
    const prefix = type === 'Quotation' ? 'YBQ' : 'YBS';
    const prefixMatch = `${prefix}-${datePrefix}-`;
    const { data: existing } = await supabase
      .from('invoices')
      .select('invoice_no')
      .ilike('invoice_no', `${prefixMatch}%`);
      
    let maxSeq = 0;
    if (existing) {
      for (const inv of existing) {
        const match = String(inv.invoice_no || '').match(/-(\d+)$/);
        if (match) {
          const seqNum = parseInt(match[1], 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
        }
      }
    }
    const seq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefixMatch}${seq}`;
  };

  const adjustStock = async (itemsList: InvoiceItem[], factor: number) => {
    for (const item of itemsList) {
      if (item.product_id) {
        const { data: prod, error: fetchErr } = await supabase
          .from('products')
          .select('stock_count')
          .eq('id', item.product_id)
          .single();
        
        if (!fetchErr && prod) {
          const currentStock = prod.stock_count || 0;
          const newStock = currentStock + (item.qty * factor);
          await supabase
            .from('products')
            .update({ stock_count: newStock })
            .eq('id', item.product_id);
        }
      }
    }
  };

  const saveCustomerFromForm = async () => {
    const name = customerName.trim();
    if (!name) return null;

    const trimmedPhone = normalizePhone(phone);
    const customerPayload = {
      name,
      phone: trimmedPhone || null,
      email: email.trim() || null,
      address: address.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isPersistedCustomerId(selectedCustomerId)) {
        const { data, error } = await supabase
          .from('customers')
          .update(customerPayload)
          .eq('id', selectedCustomerId)
          .select('id')
          .single();
        if (error) throw error;
        return data?.id || selectedCustomerId;
      }

      if (trimmedPhone) {
        const { data: existingCustomer, error: findError } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', trimmedPhone)
          .maybeSingle();

        if (findError) throw findError;
        if (existingCustomer?.id) {
          const { data, error } = await supabase
            .from('customers')
            .update(customerPayload)
            .eq('id', existingCustomer.id)
            .select('id')
            .single();
          if (error) throw error;
          setSelectedCustomerId(data?.id || existingCustomer.id);
          return data?.id || existingCustomer.id;
        }
      } else {
        const { data: existingByName, error: nameError } = await supabase
          .from('customers')
          .select('id')
          .ilike('name', name)
          .maybeSingle();

        if (nameError) throw nameError;
        if (existingByName?.id) {
          const { data, error } = await supabase
            .from('customers')
            .update(customerPayload)
            .eq('id', existingByName.id)
            .select('id')
            .single();
          if (error) throw error;
          setSelectedCustomerId(data?.id || existingByName.id);
          return data?.id || existingByName.id;
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customerPayload])
        .select('id')
        .single();

      if (error) throw error;
      if (data?.id) {
        setSelectedCustomerId(data.id);
      }
      return data?.id || null;
    } catch (err) {
      console.warn('Customer master save skipped:', err);
      return null;
    }
  };

  const persistInvoice = async (
    isUpdate: boolean,
    payload: Record<string, unknown>,
    legacyPayload: Record<string, unknown>
  ) => {
    if (isUpdate) {
      const { error } = await supabase.from('invoices').update(payload).eq('id', selectedInvoiceId);
      if (!error) return null;
      if (!shouldRetryLegacyInvoiceSave(error)) throw error;

      const { error: legacyError } = await supabase.from('invoices').update(legacyPayload).eq('id', selectedInvoiceId);
      if (legacyError) throw legacyError;
      return null;
    }

    const { data, error } = await supabase.from('invoices').insert([payload]).select().single();
    if (!error) return data as Invoice;
    if (!shouldRetryLegacyInvoiceSave(error)) throw error;

    const { data: legacyData, error: legacyError } = await supabase.from('invoices').insert([legacyPayload]).select().single();
    if (legacyError) throw legacyError;
    return legacyData as Invoice;
  };

  const handleSave = async (action: 'save' | 'download' | 'email' = 'save') => {
    if (!customerName.trim()) {
      showToast('Please enter a customer name.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one item.', 'error');
      return;
    }
    if (action === 'email' && !email.trim()) {
      setDeliveryPopup({
        status: 'error',
        title: 'Email not sent',
        message: 'Please enter the customer email before sending the invoice.',
      });
      showToast('Please enter the customer email before sending the invoice.', 'error');
      return;
    }

    if (action === 'email') {
      setDeliveryPopup({
        status: 'sending',
        title: 'Sending invoice',
        message: 'Saving invoice details before preparing the PDF.',
      });
    }

    setIsSaving(true);
    setIsSendingEmail(action === 'email');
    try {
      const isUpdate = !!selectedInvoiceId;
      let newInvoiceId: string | null = null;
      let invoiceNo: string;
      if (isUpdate) {
        const existing = invoices.find(i => i.id === selectedInvoiceId);
        invoiceNo = existing?.invoice_no || draftInvoiceNo || await generateInvoiceNo();
      } else {
        invoiceNo = draftInvoiceNo || await generateInvoiceNo().then(n => { setDraftInvoiceNo(n); return n; });
      }
      const date = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy
      const customerId = await saveCustomerFromForm();

      const legacyPayload = {
        invoice_no: invoiceNo,
        doc_type: docType,
        date: date,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        items: items,
        subtotal,
        discount,
        tax,
        round_off: roundOff,
        grand_total: grandTotal,
        advance_paid: advancePaid,
        balance_due: balanceDue,
        payments: payments,
      };

      const payload = {
        ...legacyPayload,
        customer_id: customerId,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        due_date: dueDate || null,
      };

      if (isUpdate) {
        if (docType === 'Invoice') {
          const oldInvoice = invoices.find(i => i.id === selectedInvoiceId);
          if (oldInvoice && oldInvoice.doc_type === 'Invoice') {
            await adjustStock(oldInvoice.items, 1);
          }
          await adjustStock(items, -1);
        }

        await persistInvoice(true, payload, legacyPayload);
        backupInvoiceToGoogleSheet(payload as Invoice);
        showToast('Invoice updated successfully!');
      } else {
        if (docType === 'Invoice') {
          await adjustStock(items, -1);
        }

        const data = await persistInvoice(false, payload, legacyPayload);
        if (data) {
          setSelectedInvoiceId(data.id);
          newInvoiceId = data.id;
        }
        backupInvoiceToGoogleSheet(payload as Invoice);
        showToast('Invoice saved successfully!');
        // Keep the saved invoice loaded in the form for editing
      }

      await fetchInvoices();
      await fetchProducts();
      await fetchCustomers();

      const invoiceId = isUpdate ? selectedInvoiceId : newInvoiceId;
      
      if (action === 'download') {
        await new Promise(resolve => window.setTimeout(resolve, 500));
        await generatePdf(payload.invoice_no);
        if (invoiceId) void backupInvoiceToDrive(invoiceId, payload as Invoice);
      } else if (action === 'email') {
        setDeliveryPopup({
          status: 'sending',
          title: 'Sending invoice',
          message: 'Generating the invoice PDF for email.',
        });
        await new Promise(resolve => window.setTimeout(resolve, 500));
        await emailInvoicePdf(payload.invoice_no);
        if (invoiceId) void backupInvoiceToDrive(invoiceId, payload as Invoice);
      } else {
        if (invoiceId) void backupInvoiceToDrive(invoiceId, payload as Invoice);
      }
    } catch (err) {
      const errorMsg = formatError(err);
      const isSessionExpired = errorMsg.includes('42501') || errorMsg.includes('row-level security');
      const displayMsg = isSessionExpired ? 'Session expired. Please logout and login again.' : (errorMsg || 'Failed to save invoice');
      if (action === 'email') {
        setDeliveryPopup({
          status: 'error',
          title: 'Invoice delivery failed',
          message: displayMsg,
        });
      }
      showToast(displayMsg, 'error');
    } finally {
      setIsSaving(false);
      setIsSendingEmail(false);
    }
  };

  const getPdfOptions = (invoiceNumber: string) => ({
      margin: 0,
      filename: `${invoiceNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 950 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
  });

  const preparePdfElement = async (invoiceNumber: string) => {
    if (!printRef.current) return null;
    setPrintInvoiceNumber(invoiceNumber);
    await new Promise(resolve => window.setTimeout(resolve, 0));
    printRef.current.style.display = 'block';
    return printRef.current;
  };

  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  const generatePdf = async (invoiceNumber: string) => {
    const element = await preparePdfElement(invoiceNumber);
    if (!element) return;
    const opt = getPdfOptions(invoiceNumber);

    try {
      await html2pdf().set(opt).from(element).save();
      element.style.display = 'none';
      setPrintInvoiceNumber('');
      showToast('PDF Generated successfully!');
    } catch (err) {
      element.style.display = 'none';
      setPrintInvoiceNumber('');
      const msg = formatError(err);
      showToast('PDF generation failed: ' + msg, 'error');
    }
  };

  const emailInvoicePdf = async (invoiceNumber: string) => {
    const element = await preparePdfElement(invoiceNumber);
    if (!element) return;
    const opt = getPdfOptions(invoiceNumber);

    try {
      setDeliveryPopup({
        status: 'sending',
        title: 'Sending invoice',
        message: 'Creating PDF attachment.',
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Please login again before sending email.');
      }

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob') as Blob;
      const pdfBase64 = await blobToBase64(pdfBlob);
      setDeliveryPopup({
        status: 'sending',
        title: 'Sending invoice',
        message: `Sending email to ${email}.`,
      });
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to: email,
          customerName,
          invoiceNumber,
          documentType: docType,
          filename: `${invoiceNumber}.pdf`,
          pdfBase64,
          grandTotal,
        },
      });
      // Wrap into a response-like object for the existing result handling below
      const response = { ok: !invokeError && invokeData?.ok, json: async () => invokeData || { error: invokeError?.message } } as unknown as Response;

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `Invoice API failed with HTTP ${response.status}`);
      }

      if (result.drive?.ok) {
        setDeliveryPopup({
          status: 'success',
          title: 'Email sent and Drive saved',
          message: `Invoice was emailed to ${email} and backed up to Google Drive.`,
        });
        showToast(`Invoice emailed and saved to Google Drive`);
      } else if (result.drive?.error) {
        setDeliveryPopup({
          status: 'warning',
          title: 'Email sent',
          message: `Invoice was emailed to ${email}. Google Drive backup was not completed: ${result.drive.error}`,
        });
        showToast(`Invoice emailed to ${email}`);
      } else {
        setDeliveryPopup({
          status: 'success',
          title: 'Email sent',
          message: `Invoice was emailed to ${email} successfully.`,
        });
        showToast(`Invoice emailed to ${email}`);
      }
    } catch (err) {
      const errorMsg = formatError(err);
      setDeliveryPopup({
        status: 'error',
        title: 'Invoice delivery failed',
        message: errorMsg || 'Failed to email invoice',
      });
      showToast(errorMsg || 'Failed to email invoice', 'error');
    } finally {
      element.style.display = 'none';
      setPrintInvoiceNumber('');
    }
  };

  const invoiceRow = (inv: Invoice) => [
    inv.invoice_no,
    inv.date,
    inv.customer_name,
    inv.phone || '',
    inv.email || '',
    inv.address || '',
    formatItemsForExcel(inv.items || []),
    inv.subtotal || 0,
    inv.discount || 0,
    inv.tax || 0,
    inv.round_off || 0,
    inv.grand_total || 0,
    inv.advance_paid || 0,
    inv.balance_due || 0,
    inv.payment_status || getPaymentStatus(inv.doc_type, inv.balance_due || 0, inv.advance_paid || 0),
    inv.payment_mode || 'Not specified',
    inv.due_date || '',
    inv.invoice_no ? `https://yantrabyte.com/admin` : '',
  ];

  const unifiedInvoiceRow = (inv: Invoice) => [
    inv.doc_type === 'Quotation' ? 'Quotation' : 'Invoice',
    inv.invoice_no,
    inv.date,
    inv.customer_name,
    inv.phone || '',
    inv.email || '',
    inv.address || '',
    inv.items?.map(i => i.description).filter(Boolean).join(', ') || '',
    inv.items?.map(i => `${i.description} x${i.qty}`).join(', ') || '',
    inv.grand_total || 0,
    inv.payment_status || getPaymentStatus(inv.doc_type, inv.balance_due || 0, inv.advance_paid || 0),
    inv.doc_type,
    '',
    inv.invoice_no ? `https://yantrabyte.com/admin` : '',
  ];

  const INVOICE_SHEET_NAME = 'Invoices';
  const QUOTATION_SHEET_NAME = 'Quotations';
  const INVOICE_SHEET_HEADERS = ['Invoice No', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Items', 'Subtotal', 'Discount', 'Tax', 'Round Off', 'Grand Total', 'Amount Paid', 'Balance Due', 'Payment Status', 'Payment Mode', 'Due Date', 'PDF Link'];

  const backupInvoiceToGoogleSheet = async (inv: Invoice) => {
    try {
      const sheetName = inv.doc_type === 'Quotation' ? QUOTATION_SHEET_NAME : INVOICE_SHEET_NAME;
      const { data, error } = await supabase.functions.invoke('backup-to-sheets', {
        body: { sheetName, headers: INVOICE_SHEET_HEADERS, row: unifiedInvoiceRow(inv) },
      });
      if (error || !data?.ok) {
        console.warn('Sheet backup failed:', error?.message || data?.error);
      }
    } catch (err) {
      console.warn('Sheet backup edge function error:', err);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const backupInvoiceToDrive = async (_invoiceId: string, _invoiceData?: Invoice) => {
    // Drive backup is handled server-side when the invoice email is sent via send-invoice-email edge function
    // This stub is kept for call-site compatibility
  };


  const previewInvoice = async () => {
    let invoiceNo: string;
    if (selectedInvoiceId) {
      const existing = invoices.find(i => i.id === selectedInvoiceId);
      invoiceNo = existing?.invoice_no || draftInvoiceNo || '';
    } else {
      invoiceNo = draftInvoiceNo || await generateInvoiceNo();
      if (!draftInvoiceNo) setDraftInvoiceNo(invoiceNo);
    }
    if (!invoiceNo) {
      showToast('Please save the invoice first or enter a draft number.', 'error');
      return;
    }

    const element = await preparePdfElement(invoiceNo);
    if (!element) return;

    try {
      const opt = getPdfOptions(invoiceNo);
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob') as Blob;
      element.style.display = 'none';

      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      element.style.display = 'none';
      setPrintInvoiceNumber('');
      const msg = formatError(err);
      showToast('PDF preview failed: ' + msg, 'error');
    }
  };

  const handleExportExcelLedger = async () => {
    setIsExportingExcel(true);
    try {
      const [{ data: purchasesData, error: purchasesError }, { data: freshCustomers }] = await Promise.all([
        supabase.from('purchases').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name', { ascending: true }),
      ]);

      if (purchasesError) throw purchasesError;

      const purchases = (purchasesData || []) as Purchase[];
      const customers = ((freshCustomers || customersList) as Customer[])
        .filter(customer => customer.name?.trim());

      const invoiceHeaders = INVOICE_HEADERS;

      const purchaseHeaders = [
        'Purchase No',
        'Date',
        'Supplier',
        'Items',
        'Subtotal',
        'Discount',
        'Tax',
        'Round Off',
        'Grand Total',
        'Amount Paid',
        'Balance Due',
      ];

      const customerHeaders = ['Name', 'Phone', 'Email', 'Address', 'Created At'];
      const ticketHeaders = [
        'Ticket No',
        'Created At',
        'Customer',
        'Phone',
        'Email',
        'Address',
        'Device / Service',
        'Issue',
        'Priority',
        'Status',
        'Notes',
      ];
      const bills = invoices.filter(inv => inv.doc_type === 'Invoice');
      const quotations = invoices.filter(inv => inv.doc_type === 'Quotation');
      const dues = bills.filter(inv => (inv.balance_due || 0) > 0);

      downloadExcelWorkbook(`yantrabyte-ledger-${new Date().toISOString().slice(0, 10)}.xls`, [
        { name: 'Bills', rows: [invoiceHeaders, ...bills.map(invoiceRow)] },
        { name: 'Quotations', rows: [invoiceHeaders, ...quotations.map(invoiceRow)] },
        {
          name: 'Purchase Entries',
          rows: [
            purchaseHeaders,
            ...purchases.map(purchase => [
              purchase.purchase_no,
              purchase.date,
              purchase.supplier_name,
              formatItemsForExcel(purchase.items || []),
              purchase.subtotal || 0,
              purchase.discount || 0,
              purchase.tax || 0,
              purchase.round_off || 0,
              purchase.grand_total || 0,
              purchase.amount_paid || 0,
              purchase.balance_due || 0,
            ]),
          ],
        },
        {
          name: 'Customers',
          rows: [
            customerHeaders,
            ...customers.map(customer => [
              customer.name,
              customer.phone || '',
              customer.email || '',
              customer.address || '',
              customer.created_at || '',
            ]),
          ],
        },
        { name: 'Pending Dues', rows: [invoiceHeaders, ...dues.map(invoiceRow)] },
        {
          name: 'Service Tickets',
          rows: [
            ticketHeaders,
            ...serviceTicketsList.map(ticket => [
              ticket.ticket_number,
              ticket.created_at || '',
              ticket.customer_name,
              ticket.customer_phone,
              ticket.customer_email || '',
              ticket.customer_address || '',
              ticket.device_type || '',
              ticket.issue_description || '',
              ticket.priority || '',
              ticket.status || '',
              ticket.notes || '',
            ]),
          ],
        },
      ]);

      showToast('Excel ledger exported successfully with service tickets!');
    } catch (err) {
      const errorMsg = formatError(err);
      showToast(errorMsg || 'Failed to export Excel ledger', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">YantraByte <span className="text-blue-600">Billing System</span></h2>
          <p className="text-sm text-gray-500">Create, edit, and generate PDF invoices and quotations natively.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportExcelLedger}
            disabled={isExportingExcel}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isExportingExcel ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            Export Excel
          </button>
          <button onClick={clearForm} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4 mr-2" /> New Document
          </button>
        </div>
      </div>

      {/* Financial Statistics Dashboard Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Billed</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-gray-900">₹{totalBilled.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-[10px] text-green-600 mt-1 font-medium">From finalized invoices</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Dues</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-amber-600">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-[10px] text-amber-600 mt-1 font-medium">To be collected</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoices</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-blue-600">{invoiceCount}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1">Generated bills</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quotations</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-bold text-purple-600">{quoteCount}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1">Estimates & Quotes</span>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-lg flex items-center shadow-md ${toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
          {toast.message}
        </div>
      )}

      {deliveryPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                  deliveryPopup.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  deliveryPopup.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                  deliveryPopup.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {deliveryPopup.status === 'sending' ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : deliveryPopup.status === 'error' ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{deliveryPopup.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{deliveryPopup.message}</p>
                </div>
              </div>
              {deliveryPopup.status !== 'sending' && (
                <button
                  type="button"
                  onClick={() => setDeliveryPopup(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close notification"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {deliveryPopup.status !== 'sending' && (
              <button
                type="button"
                onClick={() => setDeliveryPopup(null)}
                className="mt-5 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                OK
              </button>
            )}
          </div>
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
              <div className="col-span-2 flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Customer from Service Ticket</label>
                  <select onChange={handleSelectServiceTicketCustomer} value="" className="w-full text-xs border rounded-md px-2 py-1.5 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    {serviceTicketsList.length === 0 ? (
                      <option value="">No tickets found...</option>
                    ) : (
                      <>
                        <option value="">Select customer from ticket...</option>
                        {serviceTicketsList
                          .filter((t, i, arr) => i === arr.findIndex(x => x.customer_name?.trim().toLowerCase() === t.customer_name?.trim().toLowerCase()))
                          .sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''))
                          .map((t, i) => (
                          <option key={i} value={t.customer_name || ''}>
                            {t.customer_name}{t.customer_phone ? ` - ${t.customer_phone}` : ''}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Link Active Service Ticket</label>
                  <select onChange={handleSelectServiceTicket} className="w-full text-xs border rounded-md px-2 py-1.5 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    {serviceTicketsList.length === 0 ? (
                      <option value="">No tickets found...</option>
                    ) : (
                      <>
                        <option value="">Select Service Ticket...</option>
                        {serviceTicketsList.map((t, i) => (
                          <option key={i} value={t.ticket_number}>
                            {t.ticket_number} - {t.customer_name} ({t.device_type})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  {customerName.trim() && (
                    <button
                      type="button"
                      onClick={openCustomerHistory}
                      className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7] transition-all flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> View History
                    </button>
                  )}
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
              <div className="col-span-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-600">Item</label>
                  <div className="flex space-x-2">
                    <select 
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (selectedVal) {
                          const matched = PRESET_ITEMS.find(item => item.name === selectedVal);
                          if (matched) {
                            setItemName(matched.name);
                            setItemRate(matched.price);
                            setItemProductId('');
                          }
                        }
                      }}
                      value=""
                      className="text-[10px] border rounded px-1.5 py-0.5 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[120px]"
                    >
                      <option value="">Quick Service...</option>
                      {PRESET_ITEMS.map((item, idx) => (
                        <option key={idx} value={item.name}>{item.name} (₹{item.price})</option>
                      ))}
                    </select>

                    <select 
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId) {
                          const matched = productsList.find(p => p.id === selectedId);
                          if (matched) {
                            setItemName(matched.name);
                            setItemRate(Number(matched.price) || 0);
                            setItemProductId(matched.id);
                          }
                        } else {
                          setItemProductId('');
                        }
                      }}
                      value={itemProductId}
                      className="text-[10px] border rounded px-1.5 py-0.5 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[120px]"
                    >
                      <option value="">Quick Product...</option>
                      {productsList.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.stock_count ?? 0})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input type="text" value={itemName} onChange={e => {
                  setItemName(e.target.value);
                  if (itemProductId) {
                    const matched = productsList.find(p => p.id === itemProductId);
                    if (matched && matched.name !== e.target.value) {
                      setItemProductId('');
                    }
                  }
                }} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="Item name" />
              </div>
              <div className="col-span-3">
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
                    <th className="px-4 py-2 font-medium w-10">#</th>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium text-center w-16">Qty</th>
                    <th className="px-4 py-2 font-medium text-right w-24">Rate</th>
                    <th className="px-4 py-2 font-medium text-right w-24">Amount</th>
                    <th className="px-4 py-2 font-medium text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No items added yet.</td></tr>
                  ) : items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">
                        <input
                          type="text"
                          value={it.item_name || ''}
                          onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="Item name"
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-sm">
                        <input
                          type="text"
                          value={it.description || ''}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        <input
                          type="number"
                          value={it.qty || ''}
                          onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                          className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        <input
                          type="number"
                          value={it.rate || ''}
                          onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                          className="w-full text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">₹{(it.qty * it.rate).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t mt-6">
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500">
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                <div className={`w-full border rounded-md px-3 py-2 text-sm font-semibold ${
                  paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  paymentStatus === 'Estimate' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {paymentStatus}
                </div>
              </div>
            </div>

            {/* Payments Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Payments</h4>
                {payments.length > 0 && (
                  <button
                    onClick={() => setPayments([])}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All Payments
                  </button>
                )}
              </div>
              {payments.length > 0 && (
                <div className="mb-3 border rounded-md overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b text-gray-500">
                      <tr>
                        <th className="px-3 py-1.5 font-medium">Date</th>
                        <th className="px-3 py-1.5 font-medium text-right">Amount</th>
                        <th className="px-3 py-1.5 font-medium">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5">{p.date}</td>
                          <td className="px-3 py-1.5 text-right font-medium">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-1.5">{p.mode}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-3 py-1.5">Total</td>
                        <td className="px-3 py-1.5 text-right">₹{payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-1.5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Amount (₹)</label>
                  <input type="number" value={paymentEntryAmount || ''} onChange={e => setPaymentEntryAmount(Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1.5 text-xs" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Mode</label>
                  <select value={paymentEntryMode} onChange={e => setPaymentEntryMode(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1.5 text-xs">
                    {PAYMENT_MODES.filter(m => m !== 'Not specified').map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <button onClick={handleAddPayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded text-xs flex items-center justify-center">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </button>
                </div>
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
              <div className="flex justify-between text-gray-600 pt-2 border-t"><span>Status:</span> <span className="font-semibold">{paymentStatus}</span></div>
              <div className="flex justify-between text-gray-600"><span>Mode:</span> <span className="font-medium">{paymentMode}</span></div>
              {dueDate && <div className="flex justify-between text-gray-600"><span>Due Date:</span> <span className="font-medium">{dueDate}</span></div>}
            </div>

            <div className="mt-8 space-y-3">
              <button disabled={isSaving} onClick={() => handleSave('save')} className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors">
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Only
              </button>
              <button disabled={isSaving} onClick={() => handleSave('download')} className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-green-200">
                <Download className="w-4 h-4 mr-2" /> Save & Generate PDF
              </button>
              <button disabled={isSaving} onClick={() => handleSave('email')} className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-blue-200">
                {isSendingEmail ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Save & Email PDF
              </button>
              <button disabled={isSaving} onClick={previewInvoice} className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-purple-200">
                <Eye className="w-4 h-4 mr-2" /> Preview PDF
              </button>
            </div>
          </div>

          <div className="bg-white border p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-400" /> Saved Invoices
              </h3>
              <button onClick={clearForm} className="text-xs bg-blue-100 text-blue-700 px-2 py-1.5 rounded-md hover:bg-blue-200 transition-colors flex items-center font-semibold">
                <Plus className="w-3 h-3 mr-1" /> New Document
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {invoices.map(inv => (
                <div 
                  key={inv.id} 
                  onClick={() => loadInvoice(inv.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors text-sm flex justify-between items-center cursor-pointer ${selectedInvoiceId === inv.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{inv.invoice_no}</span>
                      {inv.doc_type === 'Quotation' ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">Quote</span>
                      ) : (inv.balance_due || 0) <= 0 ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Paid</span>
                      ) : (inv.payment_status || getPaymentStatus(inv.doc_type, inv.balance_due || 0, inv.advance_paid || 0)) === 'Partial' ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Partial</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                          ₹{(inv.balance_due || 0).toLocaleString('en-IN')} Due
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{inv.customer_name} • {inv.date}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="font-bold text-gray-700">₹{inv.grand_total.toLocaleString('en-IN')}</div>
                    {inv.doc_type === 'Quotation' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToInvoice(inv.id);
                        }} 
                        className="text-[#0EA5E9] hover:text-[#0284C7] transition-colors p-1"
                        title="Convert to Invoice"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        loadInvoice(inv.id);
                      }} 
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Edit Invoice/Quotation"
                    >
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInvoice(inv.id, inv.invoice_no);
                      }} 
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <div className="text-sm text-gray-400 text-center py-4">No saved invoices</div>}
            </div>
          </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <div ref={printRef} className="bg-white p-[10px] w-full text-black" style={{ fontFamily: 'Arial, sans-serif', position: 'relative', overflow: 'hidden', display: 'none' }}>

          <div style={{
            position: 'absolute', top: '35%', left: '-10%', right: '-10%',
            pointerEvents: 'none', zIndex: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-45deg)', opacity: 0.05,
            fontSize: '65px', fontWeight: 900, color: '#0B5394',
            whiteSpace: 'nowrap', userSelect: 'none', letterSpacing: '8px'
          }}>
            YANTRABYTE SOLUTIONS
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border p-3 mb-2" style={{ borderColor: '#000000' }}>
            <div className="flex items-center space-x-4">
              <div className="w-[340px] h-36 flex items-center justify-start ml-2">
                <img src="/logo5.png" alt="YantraByte Solutions" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black" style={{ color: '#0B5394' }}>YANTRABYTE SOLUTIONS</h1>
              <p className="text-xs mt-1" style={{ color: '#333333' }}>47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br/>Chikkabettahalli, Bengaluru - 560097</p>
              <p className="text-xs mt-1" style={{ color: '#333333' }}>Phone: 09986742525 | Email: yantrabyte.solutions@gmail.com</p>
            </div>
          </div>

          <div className="font-bold text-center py-1 border-x border-t text-base tracking-widest uppercase" style={{ backgroundColor: '#0B5394', color: '#ffffff', borderColor: '#000000' }}>
            {docType === 'Quotation' ? 'QUOTATION' : 'INVOICE'}
          </div>

          <div className="flex justify-between border">
            <div className="w-1/2 p-2 border-r font-bold" style={{ borderColor: '#000000', color: '#0B5394' }}>
              {docType === 'Quotation' ? 'Quotation No: ' : 'Invoice No: '} {printInvoiceNumber || (selectedInvoiceId ? (invoices.find(i=>i.id===selectedInvoiceId)?.invoice_no || 'DRAFT') : 'DRAFT')}
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
                <th className="border p-1.5 w-8" style={{ borderColor: '#000000' }}>#</th>
                <th className="border p-1.5 text-left" style={{ borderColor: '#000000' }}>Item</th>
                <th className="border p-1.5 text-left" style={{ borderColor: '#000000' }}>Description</th>
                <th className="border p-1.5 w-12" style={{ borderColor: '#000000' }}>Qty</th>
                <th className="border p-1.5 w-18" style={{ borderColor: '#000000' }}>Rate</th>
                <th className="border p-1.5 w-22 text-right" style={{ borderColor: '#000000' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                  <td className="border p-1.5 text-center" style={{ borderColor: '#000000', color: '#000000' }}>{idx + 1}</td>
                  <td className="border p-1.5 font-medium" style={{ borderColor: '#000000', color: '#000000' }}>{it.item_name || it.description}</td>
                  <td className="border p-1.5 text-xs" style={{ borderColor: '#000000', color: '#555555' }}>{it.item_name ? it.description : '-'}</td>
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
              <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Status</span> <span style={{ color: '#000000' }}>{paymentStatus}</span></div>
              {paymentMode !== 'Not specified' && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Mode</span> <span style={{ color: '#000000' }}>{paymentMode}</span></div>}
              {dueDate && <div className="flex justify-between p-1 px-2"><span style={{ color: '#333333' }}>Due Date</span> <span style={{ color: '#000000' }}>{dueDate}</span></div>}
            </div>
          </div>

          {/* Footer Terms */}
          <div className="flex border-x border-b text-xs mt-2" style={{ borderColor: '#000000' }}>
            <div className="w-3/5 p-2 border-r" style={{ borderColor: '#000000' }}>
              <div className="font-bold inline-block w-full p-1 mb-1 text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>Terms & Conditions</div>
              <div className="space-y-0.5 ml-2" style={{ color: '#444444', lineHeight: '1.4' }}>
                {docType === 'Quotation' ? (
                  <>
                    <p><strong>1.</strong> Quotation is valid for 7 days from the date of issue. Prices are subject to revision after expiry.</p>
                    <p><strong>2.</strong> 50% advance payment required to confirm the order. Balance payable before delivery.</p>
                    <p><strong>3.</strong> Delivery timelines commence after advance payment confirmation and stock availability.</p>
                    <p><strong>4.</strong> Warranty as per manufacturer policy. Physical damage, liquid ingress, and electrical surges void warranty.</p>
                    <p><strong>5.</strong> Customer is responsible for verifying specifications before placing the order.</p>
                    <p><strong>6.</strong> Cancellation charges may apply if order is cancelled after processing has begun.</p>
                    <p><strong>7.</strong> All disputes subject to Bengaluru jurisdiction only.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1.</strong> Service warranty is valid for 30 days from the date of service. Covers only the specific issue addressed.</p>
                    <p><strong>2.</strong> No warranty for software-related services including Windows installation, OS activation, or driver setup.</p>
                    <p><strong>3.</strong> Customer must take full backup of all important data before service. YantraByte Solutions is not liable for any data loss, corruption, or damage.</p>
                    <p><strong>4.</strong> Physical damage, liquid damage, burnt components, and swollen batteries are not covered under warranty.</p>
                    <p><strong>5.</strong> Any tampering or unauthorized repair after service will void the warranty immediately.</p>
                    <p><strong>6.</strong> Replacement parts carry a 6-month warranty against manufacturing defects only.</p>
                    <p><strong>7.</strong> Devices not collected within 30 days of completion may incur storage charges at the company's discretion.</p>
                    <p><strong>8.</strong> All disputes subject to Bengaluru jurisdiction only.</p>
                  </>
                )}
              </div>
            </div>
            <div className="w-2/5 p-2 flex flex-col justify-between">
              <div>
                <div className="font-bold inline-block w-full p-1 mb-1 text-center" style={{ backgroundColor: '#0B5394', color: '#ffffff' }}>Bank & Payment Details</div>
                <div className="flex items-center justify-between ml-1 mt-1">
                  <div className="leading-snug" style={{ color: '#000000', fontSize: '10px' }}>
                    <p><span className="font-bold">Bank:</span> North East Small Finance Bank</p>
                    <p><span className="font-bold">A/C Name:</span> YantraByte Solutions</p>
                    <p><span className="font-bold">A/C No:</span> 033311501023226</p>
                    <p><span className="font-bold">IFSC:</span> NESF0000333</p>
                    <p className="mt-1"><span className="font-bold">UPI:</span> yantrabyte.solutions@okaxis</p>
                  </div>
                  <div className="w-20 h-20 flex-shrink-0 border p-0.5 flex items-center justify-center bg-white" style={{ borderColor: '#dddddd' }}>
                    {balanceDue > 0 ? (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=yantrabyte.solutions@okaxis&pn=YantraByte Solutions&am=${balanceDue}&cu=INR&tn=${docType} ${printInvoiceNumber}`)}`} alt="Payment QR" crossOrigin="anonymous" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div className="text-[10px] font-bold text-emerald-600 text-center uppercase">Paid in<br/>Full</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center mt-2 pt-1 flex flex-col items-center justify-center relative">
                <p className="font-bold mb-1" style={{ color: '#000000', fontSize: '11px' }}>For YantraByte Solutions</p>
                <div style={{ width: '90px', height: '90px', margin: '2px auto' }}>
                  <img src="/seal.png" alt="Company Seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <p className="font-bold mt-0.5" style={{ color: '#000000', fontSize: '11px' }}>RAMESH A S</p>
                <p style={{ color: '#444444', fontSize: '10px' }}>Authorized Signatory</p>
              </div>
            </div>
          </div>

        </div>

      {/* --- INVOICE PREVIEW MODAL --- */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Invoice Preview — {printInvoiceNumber || 'Draft'}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewUrl;
                    a.download = `${printInvoiceNumber || 'invoice'}.pdf`;
                    a.click();
                  }}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <Download className="w-4 h-4 mr-1" /> Download
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  <X className="w-4 h-4 mr-1" /> Close
                </button>
              </div>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" title="Invoice Preview" />
          </div>
        </div>
      )}

      {/* --- CUSTOMER HISTORY DRAWER --- */}
      {showHistoryDrawer && historyDrawerData && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Overlay backdrop with premium glass blur */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setShowHistoryDrawer(false)}></div>
            
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <div className="pointer-events-auto w-screen max-w-2xl">
                <div className="flex h-full flex-col overflow-y-scroll bg-slate-900 border-l border-white/10 p-6 shadow-2xl text-white">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#0EA5E9]" />
                        {customerName} • Customer Profile Ledger
                      </h2>
                      <p className="text-xs text-[#94A3B8] mt-1">Unified historical ledger & workshop service tickets</p>
                    </div>
                    <button
                      onClick={() => setShowHistoryDrawer(false)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-[#94A3B8] hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Customer Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-xs text-[#94A3B8] uppercase font-semibold">Total Invoice Value</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">₹{historyDrawerData.totalSpend.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-xs text-[#94A3B8] uppercase font-semibold">Outstanding Balance</div>
                      <div className="text-2xl font-bold text-rose-400 mt-1">₹{historyDrawerData.outstanding.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Tabbed view for Invoices and Tickets */}
                  <div className="space-y-6">
                    {/* Invoices List */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#0EA5E9]" /> Lifetime Invoices & Quotes ({historyDrawerData.invoices.length})
                      </h3>
                      <div className="space-y-3">
                        {historyDrawerData.invoices.map(inv => (
                          <div key={inv.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{inv.invoice_no}</span>
                                <span className="text-[10px] text-[#94A3B8]">• {inv.date}</span>
                                {inv.doc_type === 'Quotation' ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Quote</span>
                                ) : (inv.balance_due || 0) <= 0 ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">Paid</span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono">₹{inv.balance_due} Due</span>
                                )}
                              </div>
                              <div className="text-xs text-[#94A3B8] mt-2 space-y-1">
                                {(inv.items || []).map((it, idx) => (
                                  <div key={idx} className="font-mono text-[11px] text-[#CBD5E1]">• {it.description} (x{it.qty} at ₹{it.rate})</div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white font-mono">₹{inv.grand_total.toLocaleString('en-IN')}</div>
                              {inv.advance_paid > 0 && (
                                <div className="text-[10px] text-[#94A3B8] mt-1 font-mono">Advance: ₹{inv.advance_paid}</div>
                              )}
                            </div>
                          </div>
                        ))}
                        {historyDrawerData.invoices.length === 0 && (
                          <div className="text-sm text-[#64748B] italic py-3">No invoices generated yet for this client.</div>
                        )}
                      </div>
                    </div>

                    {/* Tickets List */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-400" /> Service Tickets history ({historyDrawerData.tickets.length})
                      </h3>
                      <div className="space-y-3">
                        {historyDrawerData.tickets.map(t => (
                          <div key={t.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{t.ticket_number}</span>
                                  <span className="text-xs text-blue-400 font-semibold">({t.device_type})</span>
                                </div>
                                <div className="text-xs text-[#94A3B8] mt-1">Issue: {t.issue_description}</div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                                t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                t.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                t.status === 'closed' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            {t.notes && (
                              <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-[#94A3B8] italic">
                                <span className="font-semibold not-italic block mb-1 text-white">Diagnostics & Workshop Notes:</span>
                                {t.notes}
                              </div>
                            )}
                          </div>
                        ))}
                        {historyDrawerData.tickets.length === 0 && (
                          <div className="text-sm text-[#64748B] italic py-3">No service tickets registered for this client.</div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
