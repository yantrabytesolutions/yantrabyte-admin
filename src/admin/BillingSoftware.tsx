import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem, ServiceTicket, Product, Customer, Purchase } from '../types';
import { Plus, Trash2, Save, FileText, Download, CheckCircle, RefreshCw, Copy, Users, X, Wrench, Receipt, Mail, FileSpreadsheet, Pencil, MessageSquare, Send, List, Search, Clock, Settings } from 'lucide-react';
import { sendTelegramNotification } from '../utils/telegram';
import html2pdf from 'html2pdf.js';

import { QRCodeSVG } from 'qrcode.react';
import SignatureCanvas from 'react-signature-canvas';
import { PRESET_ITEMS } from './presetItems';
import { downloadExcelWorkbook } from '../utils/spreadsheetXml';
import { appendBackupRow } from '../utils/googleSheetBackup';
import { uploadInvoiceToDrive } from '../utils/googleDriveBackup';
import { ERPUtils } from '../utils/erp';
import CustomerLedgerModal from './components/CustomerLedgerModal';
import { InvoicePdfTemplate } from '../components/InvoicePdfTemplate';

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
  initialTab?: 'editor' | 'history' | 'quotations' | 'pending' | 'settings';
}

type DeliveryPopup = {
  status: 'sending' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
} | null;

const PAYMENT_MODES = ['Not specified', 'Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];
const CUSTOMER_MASTER_FRESH_KEY = 'billing_customer_master_fresh_started_at';
const CUSTOMER_MASTER_FRESH_VALUE = '2026-05-22T19:00:00+05:30';
const BILLING_DOCUMENTS_FRESH_KEY = 'billing_documents_fresh_started_at';

const isPersistedCustomerId = (id: string) => !!id && !id.startsWith('legacy-');

const normalizePhone = (value: string) => value.trim().replace(/\s+/g, ' ');

const getPaymentStatus = (docType: string, balanceDue: number, amountPaid: number) => {
  if (docType === 'Cancelled') return 'Cancelled';
  if (docType === 'Quotation') return 'Estimate';
  if (balanceDue <= 0) return 'Paid';
  if (amountPaid > 0) return 'Partial';
  return 'Due';
};

const shouldRetryLegacyInvoiceSave = (error: { message?: string; code?: string }) => {
  const message = String(error.message || '').toLowerCase();
  return error.code === 'PGRST204'
    || error.code === '42703'
    || message.includes('could not find the')
    || message.includes('column')
    || message.includes('customer_id')
    || message.includes('payment_mode')
    || message.includes('payment_status')
    || message.includes('due_date')
    || message.includes('pdf_url')
    || message.includes('is_recurring')
    || message.includes('terms_conditions');
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
  'Invoice Link',
];

export default function BillingSoftware({ initialAutofillTicket, onClearAutofill, initialTab = 'editor' }: BillingSoftwareProps) {
  const [docType, setDocType] = useState('Invoice');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [termsConditions, setTermsConditions] = useState('');
  const [quoteValidityDays, setQuoteValidityDays] = useState('7');
  const [quoteAdvancePercent, setQuoteAdvancePercent] = useState('85');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [companySignatureBase64, setCompanySignatureBase64] = useState<string | null>(null);
  const signatureCanvasRef = useRef<any>(null);
  
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
  const [ledgerCustomerName, setLedgerCustomerName] = useState<string | null>(null);
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [printInvoiceNumber, setPrintInvoiceNumber] = useState('');
  const [deliveryPopup, setDeliveryPopup] = useState<DeliveryPopup>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'quotations' | 'pending' | 'settings'>(initialTab);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyDrawerData, setHistoryDrawerData] = useState<{
    invoices: Invoice[];
    tickets: ServiceTicket[];
    totalSpend: number;
    outstanding: number;
  } | null>(null);

  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);

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
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const loadBillingData = async () => {
      await ensureFreshCustomerMaster();
      // setBillingFreshStartAt removed
      fetchInvoices();
      fetchCustomers();
      fetchServiceTickets();
      fetchProducts();
      fetchCompanySignature();
    };

    const fetchCompanySignature = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'company_signature_url')
          .single();
        if (data && data.value) {
          setCompanySignatureBase64(data.value);
        }
      } catch (err) {
        console.warn('Could not fetch company signature', err);
      }
    };

    loadBillingData();
  }, []);

  const ensureFreshCustomerMaster = async () => {
    let freshStartAt = '';

    try {
      const { data: settings } = await supabase
        .from('site_settings')
        .select('id, key, value')
        .in('key', [CUSTOMER_MASTER_FRESH_KEY, BILLING_DOCUMENTS_FRESH_KEY]);

      const settingByKey = new Map((settings || []).map(setting => [String(setting.key), setting]));
      const customerSetting = settingByKey.get(CUSTOMER_MASTER_FRESH_KEY);
      const documentSetting = settingByKey.get(BILLING_DOCUMENTS_FRESH_KEY);

      freshStartAt = String(documentSetting?.value || new Date().toISOString());

      if (!documentSetting?.id) {
        const { error: insertDocumentSettingError } = await supabase
          .from('site_settings')
          .insert([{ key: BILLING_DOCUMENTS_FRESH_KEY, value: freshStartAt }]);
        if (insertDocumentSettingError) throw insertDocumentSettingError;
      }

      if (customerSetting?.value === CUSTOMER_MASTER_FRESH_VALUE) {
        return freshStartAt;
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

    return freshStartAt;
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
      setInvoiceDate(new Date().toISOString().slice(0, 10));
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

  const fetchServiceTickets = async () => {
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .order('created_at', { ascending: false });
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
    const query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    // We intentionally ignore `freshStartAt` filtering here so that ALL historical bills 
    // and quotations are always visible in the admin panel, as requested.
    // if (freshStartAt) {
    //   query = query.gte('created_at', freshStartAt);
    // }

    const { data, error } = await query;
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
    setItems([...items, { product_id: itemProductId || undefined, description: itemDesc, qty: itemQty, rate: itemRate }]);
    setItemDesc('');
    setItemQty(1);
    setItemRate(0);
    setItemProductId('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    const it = items[index];
    setItemDesc(it.description);
    setItemQty(it.qty);
    setItemRate(it.rate);
    setItemProductId(it.product_id || '');
    removeItem(index);
    // Scroll slightly up to the form inputs to make sure they see it
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearForm = () => {
    setSelectedInvoiceId('');
    setDocType('Invoice');
    setSelectedCustomerId('');
    setCustomerName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDiscount(0);
    setIsRecurring(false);
    setRecurringInterval('monthly');
    setTermsConditions('');
    setWarrantyMonths('');
    setItems([]);
  };

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = customersList.find(c => c.id === e.target.value);
    if (cust) {
      setSelectedCustomerId(isPersistedCustomerId(cust.id) ? cust.id : '');
      setCustomerName(cust.name || '');
      setEmail(cust.email || '');
      setPhone(cust.phone || '');
      setAddress(cust.address || '');
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

      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      showToast(`Invoice ${invoiceNo} deleted successfully.`);
      if (selectedInvoiceId === id) {
        clearForm();
      }
      await fetchInvoices();
      await fetchProducts();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg || 'Failed to delete invoice', 'error');
    }
  };

  const loadInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    setSelectedInvoiceId(inv.id);
    setDocType(inv.doc_type);
    if (inv.date) {
      const parts = inv.date.split('/');
      if (parts.length === 3) {
        setInvoiceDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        setInvoiceDate(inv.date);
      }
    } else {
      setInvoiceDate(new Date().toISOString().slice(0, 10));
    }
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
    setIsRecurring(inv.is_recurring || false);
    setRecurringInterval(inv.recurring_interval || 'monthly');
    setTermsConditions(inv.terms_conditions || '');
    setWarrantyMonths(inv.warranty_months || '');
    
    let parsedItems = inv.items;
    if (typeof parsedItems === 'string') {
      try {
        parsedItems = JSON.parse(parsedItems);
      } catch (e) {
        parsedItems = [];
      }
    }
    setItems(Array.isArray(parsedItems) ? parsedItems : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Invoice ${inv.invoice_no} loaded for editing`);
  };

  const handleConvertToInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    // Clear the selected invoice ID so that we start as a brand new unsaved Invoice!
    setSelectedInvoiceId('');
    
    // Force Document Type to 'Invoice'
    setDocType('Invoice');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    
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
    setWarrantyMonths(inv.warranty_months || '');
    setItems(inv.items || []);
    
    showToast(`Converted quotation ${inv.invoice_no} to a new draft Invoice! Click Save or Print to finalize.`);
  };

  const handleMarkAsPaid = async (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          advance_paid: inv.grand_total,
          balance_due: 0,
          payment_status: 'Paid',
          payment_mode: 'UPI' // default to UPI or keep existing if you want, let's use UPI
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setInvoices(invoices.map(i => i.id === id ? { 
        ...i, 
        advance_paid: i.grand_total, 
        balance_due: 0, 
        payment_status: 'Paid',
        payment_mode: 'UPI'
      } : i));
      
      showToast(`Invoice ${inv.invoice_no} marked as Paid!`);
    } catch (e: any) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const sendWhatsAppInvoiceAlert = (inv: Invoice) => {
    let phone = inv.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '+91' + phone;
    else if (phone.length === 12 && phone.startsWith('91')) phone = '+' + phone;

    if (!phone) { showToast('No phone number available', 'error'); return; }
    
    const pdfUrl = inv.pdf_url;
    let text = `Hi ${inv.customer_name}, your ${inv.doc_type || 'Invoice'} ${inv.invoice_no} for ₹${inv.grand_total} has been generated. Thank you for your business!`;
    if (pdfUrl) text += `\n\nYou can view and download your ${inv.doc_type || 'Invoice'} here: ${pdfUrl}`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendTelegramInvoiceAlert = (inv: Invoice) => {
    let phone = inv.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '+91' + phone;
    else if (phone.length === 12 && phone.startsWith('91')) phone = '+' + phone;

    if (!phone) { showToast('No phone number available', 'error'); return; }
    
    const text = `Hi ${inv.customer_name}, your ${inv.doc_type || 'Invoice'} ${inv.invoice_no} for ₹${inv.grand_total} has been generated. Thank you for your business!`;
    window.open(`https://t.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- Printing & PDF ---

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

  const generateInvoiceNoAsync = async (type: string = docType) => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = type === 'Quotation' ? 'YBQ' : 'YBS';
    const basePrefix = `${prefix}-${datePart}-`;
    
    const { data } = await supabase
      .from('invoices')
      .select('invoice_no')
      .like('invoice_no', `${basePrefix}%`)
      .order('invoice_no', { ascending: false })
      .limit(1);
      
    let seq = 1;
    if (data && data.length > 0 && data[0].invoice_no) {
      const lastSeq = parseInt(data[0].invoice_no.split('-').pop() || '0', 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    return `${basePrefix}${seq.toString().padStart(3, '0')}`;
  };

  const generateInvoiceNo = (type: string = docType) => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let typeCount = 0;
    if (type === 'Quotation') {
      typeCount = invoices.filter(i => i.doc_type === 'Quotation').length;
    } else {
      typeCount = invoices.filter(i => i.doc_type !== 'Quotation').length;
    }
    const seq = (typeCount + 1).toString().padStart(3, '0');
    const prefix = type === 'Quotation' ? 'YBQ' : 'YBS';
    return `${prefix}-${datePart}-${seq}`;
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
    let savedInvoice: Invoice | null = null;
    if (isUpdate) {
      const { error } = await supabase.from('invoices').update(payload).eq('id', selectedInvoiceId);
      if (!error) {
        const { data } = await supabase.from('invoices').select('*').eq('id', selectedInvoiceId).single();
        savedInvoice = data as Invoice;
      } else if (!shouldRetryLegacyInvoiceSave(error)) {
        throw error;
      } else {
        const { error: legacyError } = await supabase.from('invoices').update(legacyPayload).eq('id', selectedInvoiceId);
        if (legacyError) throw legacyError;
        const { data } = await supabase.from('invoices').select('*').eq('id', selectedInvoiceId).single();
        savedInvoice = data as Invoice;
      }
    } else {
      const { data, error } = await supabase.from('invoices').insert([payload]).select().single();
      if (!error) {
        savedInvoice = data as Invoice;
      } else if (!shouldRetryLegacyInvoiceSave(error)) {
        throw error;
      } else {
        const { data: legacyData, error: legacyError } = await supabase.from('invoices').insert([legacyPayload]).select().single();
        if (legacyError) throw legacyError;
        savedInvoice = legacyData as Invoice;
      }
    }

    if (savedInvoice) {
      // Trigger double-entry accounting and inventory reduction
      await ERPUtils.recordInvoice(savedInvoice);
    }
    return savedInvoice;
  };

  const generateRecurringInvoice = async (recurringInvoiceId: string) => {
    setIsSaving(true);
    try {
      const inv = invoices.find(i => i.id === recurringInvoiceId);
      if (!inv) return;

      const date = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy
      const invoiceNo = await generateInvoiceNoAsync('Invoice');
      
      let nextDue: string | null = null;
      if (inv.recurring_interval) {
        const d = new Date();
        if (inv.recurring_interval === 'yearly') d.setFullYear(d.getFullYear() + 1);
        else d.setMonth(d.getMonth() + 1);
        nextDue = d.toISOString().split('T')[0];
      }

      const payload = {
        invoice_no: invoiceNo,
        doc_type: 'Invoice',
        date: date,
        customer_id: inv.customer_id,
        customer_name: inv.customer_name,
        phone: inv.phone,
        email: inv.email,
        address: inv.address,
        items: inv.items,
        subtotal: inv.subtotal,
        discount: inv.discount,
        tax: inv.tax,
        round_off: inv.round_off,
        grand_total: inv.grand_total,
        advance_paid: 0,
        balance_due: inv.grand_total,
        payment_mode: 'Not specified',
        payment_status: 'Unpaid',
        is_recurring: true,
        recurring_interval: inv.recurring_interval,
        next_due_date: nextDue,
        terms_conditions: inv.terms_conditions
      };

      const { error } = await supabase.from('invoices').insert([payload]).select().single();
      if (error) throw error;
      
      await supabase.from('invoices').update({ next_due_date: nextDue }).eq('id', inv.id);

      showToast(`Generated new AMC Invoice ${invoiceNo}`);
      await fetchInvoices();
      setShowRecurringModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate recurring invoice', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      showToast('Please draw a signature first', 'error');
      return;
    }
    const signatureBase64 = signatureCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    setCompanySignatureBase64(signatureBase64);
    
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'company_signature_url').single();
      if (existing) {
        await supabase.from('site_settings').update({ value: signatureBase64 }).eq('id', existing.id);
      } else {
        await supabase.from('site_settings').insert([{ key: 'company_signature_url', value: signatureBase64 }]);
      }
      showToast('Company Signature saved securely!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save signature securely', 'error');
    }
  };

  const handleClearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    setCompanySignatureBase64(null);
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
      const invoiceNo = isUpdate ? (invoices.find(i => i.id === selectedInvoiceId)?.invoice_no || await generateInvoiceNoAsync()) : await generateInvoiceNoAsync();
      const [y, m, d] = invoiceDate.split('-');
      const date = d && m && y ? `${d}/${m}/${y}` : new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy
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
        balance_due: balanceDue
      };

      let calculatedNextDue: string | null = null;
      if (isRecurring) {
        const d = new Date();
        if (recurringInterval === 'yearly') d.setFullYear(d.getFullYear() + 1);
        else d.setMonth(d.getMonth() + 1);
        calculatedNextDue = d.toISOString().split('T')[0];
      }

      const payload = {
        ...legacyPayload,
        customer_id: customerId,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : null,
        next_due_date: calculatedNextDue,
        terms_conditions: termsConditions,
        warranty_months: warrantyMonths === '' ? null : warrantyMonths
      };

      let pdfUrl: string | null = null;
      let pdfBlob: Blob | null = null;

        if (action === 'email') {
          setDeliveryPopup({
            status: 'sending',
            title: 'Sending invoice',
            message: 'Generating the invoice PDF for email.',
          });
        }
        const element = await preparePdfElement(payload.invoice_no);
        if (element) {
          const opt = getPdfOptions(payload.invoice_no);
          try {
            pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob') as Blob;
            pdfUrl = await uploadPdfToSupabase(pdfBlob, payload.invoice_no);
            
            uploadInvoiceToDrive(pdfBlob, payload.invoice_no, payload.date).then(res => {
              if (res.ok) console.log('Backed up to Drive:', res.fileId);
              else console.error('Drive Backup Failed:', res.error);
            });

            if (action === 'download') {
              await html2pdf().set(opt).from(element).save();
              showToast('PDF Generated successfully!');
            }
          } catch (e) {
            console.error('Failed to generate/upload PDF', e);
            if (action === 'download') showToast('Failed to generate PDF', 'error');
          } finally {
            setPrintInvoiceNumber('');
          }
        }

      if (pdfUrl) {
        (payload as Invoice).pdf_url = pdfUrl;
      }

      if (isUpdate) {
        await persistInvoice(true, payload, legacyPayload);
        backupInvoiceToGoogleSheet(payload as unknown as Invoice);
        showToast('Invoice updated successfully!');
      } else {
        const data = await persistInvoice(false, payload, legacyPayload);
        if (data) {
          setSelectedInvoiceId(data.id);
        }
        
        // Auto-deduct stock
        for (const item of items) {
          if (item.product_id && item.qty > 0) {
            const prod = productsList.find(p => p.id === item.product_id);
            if (prod && typeof prod.stock_count === 'number') {
              await supabase
                .from('products')
                .update({ stock_count: Math.max(0, prod.stock_count - item.qty) })
                .eq('id', item.product_id);
            }
          }
        }
        
        backupInvoiceToGoogleSheet(payload as unknown as Invoice);
        showToast('Invoice saved successfully!');
      }

      await fetchInvoices();
      await fetchProducts();
      await fetchCustomers();
      
      if (action === 'download' || action === 'email') {
        // Automated internal Telegram notification for invoices
        if (payload.doc_type !== 'Quotation') {
          sendTelegramNotification(`💰 <b>New Invoice Generated</b>\nInvoice: #${payload.invoice_no}\nCustomer: ${payload.customer_name}\nAmount: ₹${payload.grand_total}\nLink: ${pdfUrl || 'N/A'}`);
        }
      }
      
      if (action === 'email') {
        // We already have pdfBlob, just send the email!
        if (pdfBlob) {
          setDeliveryPopup({
            status: 'sending',
            title: 'Sending invoice',
            message: `Sending email to ${email}.`,
          });
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) throw new Error('Please login again before sending email.');
          
          const pdfBase64 = await blobToBase64(pdfBlob);
          const response = await fetch('/api/invoices/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: email,
              customerName,
              invoiceNumber: payload.invoice_no,
              documentType: docType,
              filename: `YBS-${payload.invoice_no}.pdf`,
              pdfBase64,
            }),
          });
          
          if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            const apiError = typeof result.error === 'string' ? result.error : result.error?.message;
            throw new Error(apiError || `Invoice API failed with HTTP ${response.status}`);
          }
          
          setDeliveryPopup({
            status: 'success',
            title: 'Email sent',
            message: `Invoice was emailed to ${email} successfully.`,
          });
          showToast(`Invoice emailed to ${email}`);
        } else {
          throw new Error('Failed to generate PDF for emailing.');
        }
      }
    } catch (err: any) {
      console.error("handleSave caught error:", err);
      const errorMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      if (action === 'email') {
        setDeliveryPopup({
          status: 'error',
          title: 'Invoice delivery failed',
          message: errorMsg || 'Failed to save invoice before sending email.',
        });
      }
      showToast(errorMsg || 'Failed to save invoice', 'error');
    } finally {
      setIsSaving(false);
      setIsSendingEmail(false);
    }
  };

  const getPdfOptions = (invoiceNumber: string) => ({
      margin: 0,
      filename: `YBS-${invoiceNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794, scrollY: 0, x: 0, y: 0 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
  });

  const preparePdfElement = async (invoiceNumber: string) => {
    if (!printRef.current) return null;
    setPrintInvoiceNumber(invoiceNumber);
    await new Promise(resolve => window.setTimeout(resolve, 0));
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

  const handleViewPdf = async (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    // Open window synchronously to bypass popup blocker
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Loading ${inv.invoice_no}...</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f3f4f6;color:#374151;margin:0;">
            <div style="text-align:center;">
              <svg style="animation: spin 1s linear infinite; margin: 0 auto 1rem; height: 2rem; width: 2rem; color: #0EA5E9;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <h2>Generating PDF... Please wait.</h2>
              <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </div>
          </body>
        </html>
      `);
    }

    loadInvoice(id);

    // Wait for React to render the hidden print template with the newly loaded data
    setTimeout(async () => {
      const element = await preparePdfElement(inv.invoice_no);
      if (!element) {
        if (newWindow) newWindow.close();
        return;
      }
      
      const opt = getPdfOptions(inv.invoice_no);
      try {
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const url = URL.createObjectURL(pdfBlob);
        if (newWindow) {
          newWindow.location.href = url;
        } else {
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error('Error viewing PDF:', err);
        if (newWindow) newWindow.close();
        showToast('Failed to generate PDF for viewing', 'error');
      } finally {
        setPrintInvoiceNumber('');
      }
    }, 500);
  };

  const uploadPdfToSupabase = async (blob: Blob, invoiceNo: string): Promise<string | null> => {
    try {
      const fileName = `pdfs/${invoiceNo}.pdf`;
      const file = new File([blob], `${invoiceNo}.pdf`, { type: 'application/pdf' });
      
      const { error } = await supabase.storage
        .from('invoices')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
        
      if (error) {
        console.error('Supabase upload error:', error);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);
        
      return publicUrl;
    } catch (e) {
      console.error('Failed to upload PDF', e);
      return null;
    }
  };



  const invoiceRow = (inv: Invoice) => [
    inv.invoice_no,
    inv.date,
    inv.customer_name,
    inv.phone ? `'${inv.phone}` : '',
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
    inv.pdf_url || '',
  ];

  const backupInvoiceToGoogleSheet = async (inv: Invoice) => {
    let pdfBase64 = '';
    try {
      const element = document.getElementById('invoice-preview');
      if (element) {
        const opt = getPdfOptions(inv.invoice_no);
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob') as Blob;
        pdfBase64 = await blobToBase64(pdfBlob);
      }
    } catch (e) {
      console.error('Failed to generate PDF for backup', e);
    }

    void appendBackupRow({
      sheetName: inv.doc_type === 'Quotation' ? 'Quotations' : 'Invoices',
      headers: INVOICE_HEADERS,
      row: invoiceRow(inv),
      pdfBase64,
      invoiceNo: inv.invoice_no,
      keyColumnIndex: 0,
      keyValue: inv.invoice_no,
    }).then(result => {
      if (result.ok) {
        showToast('Google Sheet backup updated');
      } else if (!result.skipped) {
        showToast('Sheet backup FAILED: ' + (result.error || 'Unknown error'), 'error');
      } else {
        showToast('Sheet backup skipped: ' + (result.error || 'No session'), 'error');
      }
    }).catch(error => {
      showToast('Sheet backup ERROR: ' + (error?.message || String(error)), 'error');
    });
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
      const errorMsg = err instanceof Error ? err.message : String(err);
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
          <button 
            onClick={() => setShowRecurringModal(true)} 
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Recurring AMCs
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

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('editor')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'editor' ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Pencil className="w-4 h-4 mr-2" /> Document Editor
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'history' ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <List className="w-4 h-4 mr-2" /> All Saved Documents
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'quotations' ? 'border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <FileText className="w-4 h-4 mr-2" /> Quotations
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'pending' ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Clock className="w-4 h-4 mr-2" /> Pending Payments
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'settings' ? 'border-gray-800 text-gray-800 bg-gray-100 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Settings className="w-4 h-4 mr-2" /> Settings
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'editor' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Document Details</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {docType === 'Invoice' && (
                  <div className="flex items-center gap-3 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isRecurring} 
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-blue-800">Recurring (AMC)</span>
                    </label>
                    {isRecurring && (
                      <select 
                        value={recurringInterval} 
                        onChange={(e) => setRecurringInterval(e.target.value)}
                        className="text-xs border-gray-300 rounded-md text-blue-800 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>
                )}
                <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap gap-1">
                  <button 
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${docType === 'Invoice' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
                    onClick={() => setDocType('Invoice')}
                  >Invoice</button>
                  <button 
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${docType === 'Quotation' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
                    onClick={() => setDocType('Quotation')}
                  >Quotation</button>
                  {!!selectedInvoiceId && (
                    <button 
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${docType === 'Cancelled' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-red-700'}`}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to CANCEL this invoice? This will mark it as void.')) {
                          setDocType('Cancelled');
                        }
                      }}
                    >Cancel Invoice</button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2 flex space-x-4">
                <div className="flex-[0.5]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full text-xs border rounded-md px-2 py-[5px] text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Customer Master</label>
                  <select value={selectedCustomerId} onChange={handleSelectCustomer} className="w-full text-xs border rounded-md px-2 py-1.5 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    {customersList.length === 0 ? (
                      <option value="">No customers found...</option>
                    ) : (
                      <>
                        <option value="">Select saved customer...</option>
                        {customersList.map((c, i) => (
                          <option key={`${c.id}-${i}`} value={c.id}>
                            {c.name}{c.phone ? ` - ${c.phone}` : ''}
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
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={openCustomerHistory}
                        className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7] transition-all flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View History
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerCustomerName(customerName);
                          setLedgerCustomerId(selectedCustomerId || null);
                        }}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-all flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Ledger
                      </button>
                    </div>
                  )}
                </div>
                <input 
                  type="text" 
                  list="billing-customers-name-list"
                  value={customerName} 
                  onChange={e => {
                    const val = e.target.value;
                    setCustomerName(val);
                    const customer = customersList.find(c => c.name === val);
                    if (customer) {
                      setPhone(customer.phone || '');
                      setEmail(customer.email || '');
                      setAddress(customer.address || '');
                      setSelectedCustomerId(customer.id);
                    }
                  }} 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter full name or search..." 
                />
                <datalist id="billing-customers-name-list">
                  {customersList.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.phone ? `${c.phone}` : ''}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="text" 
                  list="billing-customers-phone-list"
                  value={phone} 
                  onChange={e => {
                    const val = e.target.value;
                    setPhone(val);
                    const customer = customersList.find(c => c.phone === val || c.name === val);
                    if (customer) {
                      setCustomerName(customer.name || '');
                      setEmail(customer.email || '');
                      setAddress(customer.address || '');
                      setSelectedCustomerId(customer.id);
                    }
                  }} 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Phone number" 
                />
                <datalist id="billing-customers-phone-list">
                  {customersList.map(c => (
                    <option key={c.id} value={c.phone || c.name}>
                      {c.name} {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </datalist>
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
            
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-gray-600">Terms & Conditions</label>
                <div className="flex space-x-2">
                  <button onClick={() => setTermsConditions("1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.")} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">General</button>
                  <button onClick={() => setTermsConditions("1. We are not responsible for any data loss during repair. Please backup your data.\n2. 30 days warranty on repaired parts only.\n3. Physical or liquid damage voids warranty.")} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Service</button>
                  <button onClick={() => setTermsConditions("1. AMC covers standard service visits as per contract.\n2. Spare parts are charged extra unless specified.\n3. Contract is non-transferable.")} className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">AMC</button>
                  <button onClick={() => setTermsConditions(`1. Estimate valid for ${quoteValidityDays} days.\n2. Advance payment of ${quoteAdvancePercent}% required and remaining against Delivery.\n3. Final amount may vary if hidden faults are found.`)} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100">Quotation</button>
                  <button onClick={() => setTermsConditions("")} className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100">Clear</button>
                </div>
              </div>
              <textarea 
                value={termsConditions} 
                onChange={e => setTermsConditions(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 h-20" 
                placeholder="Enter terms and conditions for this invoice..."
              ></textarea>
              {docType === 'Quotation' && (
                <div className="mt-2 flex gap-3 items-end">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Validity (Days)</label>
                    <input type="number" value={quoteValidityDays} onChange={e => setQuoteValidityDays(e.target.value)} className="w-20 text-xs p-1.5 border border-gray-200 rounded" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Advance (%)</label>
                    <input type="number" value={quoteAdvancePercent} onChange={e => setQuoteAdvancePercent(e.target.value)} className="w-20 text-xs p-1.5 border border-gray-200 rounded" />
                  </div>
                  <button 
                    onClick={() => setTermsConditions(`1. Estimate valid for ${quoteValidityDays} days.\n2. Advance payment of ${quoteAdvancePercent}% required and remaining against Delivery.\n3. Final amount may vary if hidden faults are found.`)}
                    className="text-[11px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-100 font-medium"
                  >
                    Apply to Terms
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-4">Items & Billing</h3>
            
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-600">Description</label>
                  <div className="flex space-x-2">
                    <select 
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (selectedVal) {
                          const matched = PRESET_ITEMS.find(item => item.name === selectedVal);
                          if (matched) {
                            setItemDesc(matched.name);
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
                            setItemDesc(matched.name);
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
                <input type="text" value={itemDesc} onChange={e => {
                  setItemDesc(e.target.value);
                  if (itemProductId) {
                    const matched = productsList.find(p => p.id === itemProductId);
                    if (matched && matched.name !== e.target.value) {
                      setItemProductId('');
                    }
                  }
                }} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="Item description" />
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

            <div className="mt-4 border rounded-md overflow-x-auto">
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
                      <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                        <button onClick={() => handleEditItem(idx)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Edit Item"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Item"><Trash2 className="w-4 h-4" /></button>
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
                <label className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
                  <span>Advance Paid (₹)</span>
                  {grandTotal > 0 && advancePaid < grandTotal && (
                    <button type="button" onClick={() => { setAdvancePaid(grandTotal); setPaymentMode('UPI'); }} className="text-[#0EA5E9] hover:underline text-[10px] font-bold">
                      Mark Fully Paid
                    </button>
                  )}
                </label>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Warranty (Months)</label>
                <input type="number" min="0" step="1" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500" placeholder="e.g. 12" />
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
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount > 0 && <div className="flex justify-between text-gray-600"><span>Discount:</span> <span className="font-medium text-green-600">- ₹{discount.toLocaleString('en-IN')}</span></div>}
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
            </div>
          </div>
        </div>
      </div>
      ) : activeTab !== 'settings' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-800">Saved Documents</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRemindersModal(true)}
                className="text-sm flex items-center bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-medium border border-green-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp Reminders
              </button>
              <div className="relative max-w-md w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Search invoice, customer..." 
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.filter(inv => {
                  if (activeTab === 'quotations' && inv.doc_type !== 'Quotation') return false;
                  if (activeTab === 'pending' && (inv.doc_type !== 'Invoice' || (inv.balance_due || 0) <= 0)) return false;
                  return (
                    inv.invoice_no.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                    inv.customer_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                    inv.date.includes(historySearchTerm)
                  );
                }).map(inv => (
                  <tr 
                    key={inv.id} 
                    onClick={() => { loadInvoice(inv.id); setActiveTab('editor'); }}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedInvoiceId === inv.id ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{inv.invoice_no}</div>
                      <div className="text-xs text-gray-500 mt-1">{inv.doc_type}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-800">{inv.customer_name}</td>
                    <td className="px-4 py-4 text-gray-600">{inv.date}</td>
                    <td className="px-4 py-4 font-bold text-gray-900">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4">
                      {inv.doc_type === 'Cancelled' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-medium border border-red-100">Cancelled</span>
                      ) : inv.doc_type === 'Quotation' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-100">Quotation</span>
                      ) : (inv.balance_due || 0) <= 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">Paid</span>
                      ) : (inv.payment_status || getPaymentStatus(inv.doc_type, inv.balance_due || 0, inv.advance_paid || 0)) === 'Partial' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-100">Partial</span>
                      ) : (
                        <span 
                          onClick={(e) => { e.stopPropagation(); setLedgerCustomerName(inv.customer_name); setLedgerCustomerId(inv.customer_id || null); }}
                          className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-100 hover:bg-amber-100 cursor-pointer transition-colors"
                        >
                          ₹{(inv.balance_due || 0).toLocaleString('en-IN')} Due
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); loadInvoice(inv.id); setActiveTab('editor'); }} className="p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors" title="Edit / Load">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleViewPdf(inv.id); }} className="p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors" title="View PDF">
                          <FileText className="w-4 h-4" />
                        </button>
                        {(inv.warranty_months || 0) > 0 && (
                          <button onClick={async (e) => { 
                            e.stopPropagation(); 
                            try {
                              const { generateWarrantyCertificate } = await import('../components/WarrantyCertificate');
                              await generateWarrantyCertificate(inv, null);
                            } catch (err: any) {
                              showToast(err.message, 'error');
                            }
                          }} className="p-1.5 text-gray-500 hover:bg-amber-50 hover:text-amber-600 rounded-md transition-colors" title="Download Warranty Certificate">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {inv.doc_type === 'Quotation' && (
                          <button onClick={(e) => { e.stopPropagation(); handleConvertToInvoice(inv.id); setActiveTab('editor'); }} className="p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-md transition-colors" title="Convert to Invoice">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {inv.doc_type === 'Invoice' && (inv.balance_due || 0) > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(inv.id); }} className="p-1.5 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors" title="Mark as Paid">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); sendWhatsAppInvoiceAlert(inv); }} className="p-1.5 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors" title="WhatsApp Alert">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); sendTelegramInvoiceAlert(inv); }} className="p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors" title="Telegram Alert">
                          <Send className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id, inv.invoice_no); }} className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors" title="Delete Document">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No documents found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Billing Settings</h3>
          
          <div className="max-w-2xl">
            <h4 className="text-lg font-medium text-gray-800 mb-2">Company Signature / Stamp</h4>
            <p className="text-sm text-gray-600 mb-6">Draw your authorized signature or stamp. This will appear at the bottom of all generated invoices and quotations instead of the default seal.</p>
            
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center">
              {companySignatureBase64 ? (
                <div className="text-center w-full">
                  <div className="bg-white p-4 inline-block rounded border mb-4 shadow-sm">
                    <img src={companySignatureBase64} alt="Company Signature" className="max-h-24 object-contain" />
                  </div>
                  <div className="flex justify-center gap-3">
                    <button onClick={handleClearSignature} className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-medium text-sm transition-colors border border-red-200">
                      Remove Signature
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-sm mb-4">
                    <SignatureCanvas 
                      ref={signatureCanvasRef} 
                      canvasProps={{ className: 'w-full h-40 rounded-lg cursor-crosshair' }} 
                      backgroundColor="white"
                    />
                  </div>
                  <div className="flex justify-center gap-3 w-full max-w-sm">
                    <button onClick={handleClearSignature} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm transition-colors">
                      Clear Canvas
                    </button>
                    <button onClick={handleSaveSignature} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm">
                      Save Signature
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '794px', opacity: 0, pointerEvents: 'none', zIndex: -1000 }}>
        <div ref={printRef} className="bg-white p-[24px] text-black flex flex-col" style={{ 
          width: '794px', 
          height: '1115px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          maxWidth: 'none', 
          fontFamily: 'Arial, sans-serif',
          position: 'relative'
        }}>
          {/* Watermark Overlay */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 50,
            overflow: 'hidden',
            opacity: 0.1
          }}>
            <img src="/hardware_watermark.png" alt="Watermark" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          </div>
          
          {docType === 'Cancelled' && (
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              color: 'rgba(220, 38, 38, 0.4)',
              fontSize: '90px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              zIndex: 60,
              whiteSpace: 'nowrap'
            }}>
              CANCELLED
            </div>
          )}

          {/* Outer Border for main content */}
          <div className="flex flex-col relative z-10" style={{ border: '1.5px solid #000' }}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 pb-1" style={{ borderBottom: '1px solid #000' }}>
              <div className="flex items-center justify-start ml-1">
                <img src="/logo6.png" alt="YantraByte Solutions" style={{ height: '110px', width: 'auto' }} crossOrigin="anonymous" />
              </div>
              <div className="text-right">
                <h1 className="text-xl font-bold tracking-wide" style={{ color: '#0B5394' }}>YANTRABYTE SOLUTIONS</h1>
                <p className="text-xs mt-1" style={{ color: '#333333' }}>47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br/>Chikkabettahalli, Bengaluru - 560097</p>
                <p className="text-xs mt-1" style={{ color: '#333333' }}><span style={{ fontSize: "14px" }}>📱</span> Phone: 09986742525 | <span style={{ fontSize: "14px" }}>✉️</span> Email: yantrabyte.solutions@gmail.com</p>
              </div>
            </div>

            {/* INVOICE Title */}
            <div className="font-bold text-center py-1.5 text-base tracking-widest uppercase text-white" style={{ backgroundColor: docType === 'Cancelled' ? '#DC2626' : '#0B5394', borderBottom: '1px solid #000' }}>
              {docType === 'Cancelled' ? 'CANCELLED INVOICE' : (docType === 'Quotation' ? 'QUOTATION' : 'INVOICE')}
            </div>

            {/* Invoice No and Date */}
            <div className="flex justify-between" style={{ borderBottom: '1px solid #000' }}>
              <div className="w-1/2 p-2 font-bold text-base" style={{ borderRight: '1.5px solid #000', color: '#DC2626' }}>
                {docType === 'Quotation' ? 'Quotation No: ' : (docType === 'Cancelled' ? 'Cancelled No: ' : 'Invoice No: ')} {printInvoiceNumber || (selectedInvoiceId ? (invoices.find(i=>i.id===selectedInvoiceId)?.invoice_no || 'DRAFT') : 'DRAFT')}
              </div>
              <div className="w-1/2 p-2 text-right font-bold text-base" style={{ color: '#333333' }}>
                Date: {invoiceDate.split('-').reverse().join('/')}
              </div>
            </div>

            {/* Bill To */}
            <div style={{ borderBottom: '1px solid #000' }}>
              <div className="p-1 px-2 font-bold text-sm" style={{ backgroundColor: '#D9EAF7', color: '#7E22CE', borderBottom: '1px solid #000' }}>
                Bill To:
              </div>
              <div className="p-2 text-sm leading-tight" style={{ color: '#000000' }}>
                <div className="font-bold text-base mb-1">{customerName || '—'}</div>
                <div>Phone: {phone || '—'} &nbsp;&nbsp;&nbsp; Email: {email || '—'}</div>
                <div>Address: {address || '—'}</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="relative mt-2">
              <table className="w-full text-sm text-left relative z-0" style={{ borderCollapse: 'collapse', borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#0B5394' }}>
                  <th className="p-2 w-12 text-center" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>Sl<br/>No.</th>
                  <th className="p-2 text-left" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>Description</th>
                  <th className="p-2 w-16 text-center" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>Qty</th>
                  <th className="p-2 w-24 text-right" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>Rate</th>
                  <th className="p-2 w-28 text-right" style={{ borderBottom: '1px solid #000' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any, idx: number) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.6)' }}>
                    <td className="p-2 text-center" style={{ borderRight: '1px solid #000', color: '#000' }}>{idx + 1}</td>
                    <td className="p-2 font-medium" style={{ borderRight: '1px solid #000', color: '#000' }}>{it.description || it.item || it.name || it.item_name || ''}</td>
                    <td className="p-2 text-center" style={{ borderRight: '1px solid #000', color: '#000' }}>{it.qty || 1}</td>
                    <td className="p-2 text-right" style={{ borderRight: '1px solid #000', color: '#000' }}>{Number(it.rate || it.price || it.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="p-2 text-right font-bold" style={{ color: '#000' }}>{(Number(it.qty || 1) * Number(it.rate || it.price || it.amount || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
                {/* Padding rows to fill table space like the screenshot */}
                {[...Array(Math.max(0, 6 - items.length))].map((_, idx) => (
                  <tr key={`empty-${idx}`} style={{ backgroundColor: 'transparent' }}>
                    <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                    <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                    <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                    <td className="p-2 text-transparent" style={{ borderRight: '1px solid #000' }}>.</td>
                    <td className="p-2 text-transparent">.</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Totals Box */}
            <div className="flex text-sm">
              <div className="w-3/5 p-3 flex flex-col justify-start" style={{ borderRight: '1px solid #000' }}>
                <div className="font-bold inline-block px-2 py-0.5 mb-2" style={{ backgroundColor: '#D9EAF7', color: '#B45309', alignSelf: 'flex-start' }}>Amount in Words:</div>
                <div className="italic text-gray-800">{numberToWords(grandTotal)}</div>
              </div>
              <div className="w-2/5 flex flex-col">
                <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                  <span style={{ color: '#333333' }}>Subtotal</span>
                  <span style={{ color: '#000000' }}>{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                    <span style={{ color: '#333333' }}>Discount</span>
                    <span style={{ color: '#000000' }}>{discount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {roundOff !== 0 && (
                  <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                    <span style={{ color: '#333333' }}>Round Off</span>
                    <span style={{ color: '#000000' }}>{roundOff.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between p-1.5 px-3 font-bold" style={{ backgroundColor: '#FFF2CC', borderBottom: '1px solid #000', color: '#15803D' }}>
                  <span>Grand Total</span>
                  <span className="text-base">{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between p-1.5 px-3" style={{ borderBottom: '1px solid #000' }}>
                  <span style={{ color: '#333333' }}>Advance Paid</span>
                  <span style={{ color: '#000000' }}>{advancePaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between p-1.5 px-3 font-bold" style={{ backgroundColor: '#FFF2CC', color: '#B91C1C' }}>
                  <span>Balance Due</span>
                  <span className="text-base">{balanceDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Two Boxes */}
          <div className="flex mt-auto space-x-3">
            
            {/* Terms Box */}
            <div className="w-3/5 flex flex-col" style={{ border: '1px solid #000' }}>
              <div className="font-bold text-center p-1 text-white text-sm" style={{ backgroundColor: '#0B5394' }}>Terms & Conditions</div>
              <div className="p-3 space-y-1 whitespace-pre-wrap text-[13px]" style={{ color: '#444444' }}>
                {termsConditions || (docType === 'Quotation' ? (
                  `1. Estimate valid for ${quoteValidityDays} days.\n2. Advance payment of ${quoteAdvancePercent}% required and remaining against Delivery.\n3. Final amount may vary if hidden faults are found.`
                ) : (
                  "1. Service warranty is valid for 30 days only.\n2. No warranty for Windows installation/software issues.\n3. YantraByte Solutions is not responsible for any data loss.\n4. Customer should take backup of all important files prior.\n5. Physical, liquid or burnt damages void warranty.\n6. No warranty for swollen batteries or electrical faults."
                ))}
              </div>
            </div>

            {/* Bank & Payment Details Box */}
            <div className="w-2/5 flex flex-col" style={{ border: '1px solid #000' }}>
              <div className="font-bold text-center p-1 text-white text-sm" style={{ backgroundColor: '#0B5394' }}>Bank & Payment Details</div>
              
              <div className="p-2 flex justify-between">
                <div className="text-[12px] leading-relaxed" style={{ color: '#000' }}>
                  <span className="font-bold">Bank:</span> North East Small Finance Bank<br/>
                  <span className="font-bold">A/C Name:</span> YantraByte Solutions<br/>
                  <span className="font-bold">A/C No:</span> 033311501023226<br/>
                  <span className="font-bold">IFSC:</span> NESF0000333<br/>
                  <span className="font-bold">UPI:</span> s0424237152@slc
                </div>
                <div className="w-16 h-16 ml-2 flex-shrink-0 flex justify-center items-center bg-white">
                  <QRCodeSVG 
                    value={`upi://pay?pa=s0424237152@slc&pn=${encodeURIComponent('YantraByte Solutions')}&am=${grandTotal}&cu=INR`} 
                    size={60} 
                  />
                </div>
              </div>
              
              <div className="text-center mt-auto flex flex-col justify-end pb-2">
                <div className="font-bold text-[12px]" style={{ color: '#000' }}>For YantraByte Solutions</div>
                <div className="flex justify-center my-1" style={{ overflow: 'hidden' }}>
                  {companySignatureBase64 ? (
                    <img src={companySignatureBase64} alt="Company Signature" style={{ height: '75px', maxWidth: '150px', width: 'auto', objectFit: 'contain' }} crossOrigin="anonymous" />
                  ) : (
                    <img src="/seal.png" alt="Seal" style={{ height: '75px', maxWidth: '100px', width: 'auto', objectFit: 'contain' }} crossOrigin="anonymous" />
                  )}
                </div>
                <div className="font-bold text-[10px]" style={{ color: '#000', padding: '0 100px' }}>&nbsp;</div>
                <div className="text-[9px]" style={{ color: '#444444' }}>&nbsp;</div>
              </div>
            </div>

          </div>

        </div>
      </div>

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
                          <div 
                            key={inv.id} 
                            onClick={() => {
                              loadInvoice(inv.id);
                              setShowHistoryDrawer(false);
                            }}
                            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-start transition-colors hover:bg-white/10 cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{inv.invoice_no}</span>
                                <span className="text-[10px] text-[#94A3B8]">• {inv.date}</span>
                                {inv.doc_type === 'Cancelled' ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold font-mono">Cancelled</span>
                                ) : inv.doc_type === 'Quotation' ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Quote</span>
                                ) : (inv.balance_due || 0) <= 0 ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">Paid</span>
                                ) : (
                                  <span 
                                    onClick={(e) => { e.stopPropagation(); setLedgerCustomerName(inv.customer_name); setLedgerCustomerId(inv.customer_id || null); }}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono hover:bg-rose-500/20 cursor-pointer"
                                  >
                                    ₹{inv.balance_due} Due
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#94A3B8] mt-2 space-y-1">
                                {(inv.items || []).map((it, idx) => (
                                  <div key={idx} className="font-mono text-[11px] text-[#CBD5E1]">• {it.description} (x{it.qty} at ₹{it.rate})</div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className="text-lg font-bold text-white font-mono">₹{inv.grand_total.toLocaleString('en-IN')}</div>
                              {inv.advance_paid > 0 && (
                                <div className="text-[10px] text-[#94A3B8] mt-1 font-mono">Advance: ₹{inv.advance_paid}</div>
                              )}
                              <div className="flex gap-2 mt-2">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleViewPdf(inv.id);
                                  }} 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className="text-[#94A3B8] hover:text-indigo-400 transition-colors p-1"
                                  title="View PDF"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                {inv.doc_type === 'Invoice' && (inv.balance_due || 0) > 0 && (
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleMarkAsPaid(inv.id);
                                    }} 
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    className="text-[#94A3B8] hover:text-emerald-400 transition-colors p-1"
                                    title="Mark as Paid"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    loadInvoice(inv.id);
                                    setShowHistoryDrawer(false);
                                  }} 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className="text-[#94A3B8] hover:text-[#0EA5E9] transition-colors p-1"
                                  title="Edit Invoice"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
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

      {showRecurringModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowRecurringModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 border border-slate-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Active Recurring Invoices (AMCs)</h3>
                  <p className="text-purple-100 text-xs mt-0.5">Manage and generate invoices for active subscriptions</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecurringModal(false)}
                className="text-purple-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {invoices.filter(i => i.is_recurring).length === 0 ? (
                  <div className="text-center py-10">
                    <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No recurring invoices found</h3>
                    <p className="text-gray-500 mt-1">Enable "Recurring (AMC)" when creating an invoice to see it here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Ref Invoice</th>
                          <th className="px-4 py-3 font-semibold">Customer</th>
                          <th className="px-4 py-3 font-semibold">Interval</th>
                          <th className="px-4 py-3 font-semibold">Next Due Date</th>
                          <th className="px-4 py-3 font-semibold text-right">Amount</th>
                          <th className="px-4 py-3 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoices.filter(i => i.is_recurring).map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_no}</td>
                            <td className="px-4 py-3 text-gray-600">{inv.customer_name}</td>
                            <td className="px-4 py-3 text-gray-600 capitalize">{inv.recurring_interval}</td>
                            <td className="px-4 py-3">
                              {inv.next_due_date ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${new Date(inv.next_due_date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {inv.next_due_date}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">₹{inv.grand_total}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => generateRecurringInvoice(inv.id)}
                                disabled={isSaving}
                                className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                              >
                                Generate Next
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminders Modal */}
      {showRemindersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowRemindersModal(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 sm:px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">WhatsApp Reminders</h2>
                  <p className="text-green-100 text-sm mt-0.5 font-medium">Send payment reminders for overdue invoices</p>
                </div>
              </div>
              <button
                onClick={() => setShowRemindersModal(false)}
                className="text-green-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {invoices.filter(i => (i.balance_due || 0) > 0 && i.doc_type === 'Invoice').length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-500 mt-1">There are no overdue invoices at the moment.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Invoice No</th>
                          <th className="px-4 py-3 font-semibold">Customer</th>
                          <th className="px-4 py-3 font-semibold">Due Date</th>
                          <th className="px-4 py-3 font-semibold text-right">Balance Due</th>
                          <th className="px-4 py-3 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoices.filter(i => (i.balance_due || 0) > 0 && i.doc_type === 'Invoice').map(inv => {
                          const customer = customersList.find(c => c.name === inv.customer_name) || { phone: inv.phone };
                          const phoneNum = customer?.phone?.replace(/\D/g, '');
                          const whatsappUrl = phoneNum ? `https://wa.me/91${phoneNum}?text=${encodeURIComponent(`Dear ${inv.customer_name},\n\nThis is a gentle reminder that your payment of ₹${inv.balance_due?.toLocaleString('en-IN')} for Invoice No. ${inv.invoice_no} is currently due.\n\nPlease arrange for the payment at your earliest convenience.\n\nThank you,\nYantrabyte Solutions`)}` : '#';
                          
                          return (
                            <tr key={inv.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_no}</td>
                              <td className="px-4 py-3 text-gray-600">{inv.customer_name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${new Date(inv.date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {inv.date}
                                </span>
                              </td>
                              <td 
                                className="px-4 py-3 text-right font-bold text-red-600 cursor-pointer hover:bg-red-50"
                                onClick={() => { setShowRemindersModal(false); setLedgerCustomerName(inv.customer_name); setLedgerCustomerId(inv.customer_id || null); }}
                              >
                                ₹{inv.balance_due?.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {phoneNum ? (
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 bg-[#25D366] text-white text-xs font-medium rounded-md hover:bg-[#128C7E] transition-colors shadow-sm"
                                  >
                                    <Send className="w-3 h-3 mr-1.5" /> Send Reminder
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No phone #</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {ledgerCustomerName && (
        <CustomerLedgerModal
          customerName={ledgerCustomerName}
          customerId={ledgerCustomerId}
          onClose={() => { setLedgerCustomerName(null); setLedgerCustomerId(null); }}
          onPaymentAdded={() => fetchInvoices()}
        />
      )}
    </div>
  );
}
