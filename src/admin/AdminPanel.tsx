import { useState, useEffect, useCallback } from 'react';
import { renderToString } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import type {
  SiteSetting,
  ServiceTicket,
} from '../types';
import {
  LayoutDashboard, FileText, Wrench, Package, MessageSquareQuote, PenTool,
  Users, Briefcase, Building2, HelpCircle, Image, Award, Mail, Settings,
  LogOut, Plus, Pencil, Trash2, X, Eye, EyeOff, ChevronDown, Save,
  Loader2, AlertCircle, CheckCircle, Search, RefreshCw, Menu, Ticket, Receipt, CreditCard, MessageSquare,
  Truck, ExternalLink, FileSpreadsheet, Activity, Send, UserCircle, IndianRupee, Shield, Sun, Moon, Calendar
} from 'lucide-react';
import { sendTelegramNotification } from '../utils/telegram';
import BillingSoftware from './BillingSoftware';
import PurchaseSoftware from './PurchaseSoftware';
import ExternalRepairs from './ExternalRepairs';
import html2pdf from 'html2pdf.js';
import { downloadExcelWorkbook } from '../utils/spreadsheetXml';
import { appendBackupRow } from '../utils/googleSheetBackup';
import Dashboard from './Dashboard';
import AmcContracts from './AmcContracts';
import CalendarView from './CalendarView';
import Expenses from './Expenses';
import AccountingKhata from './AccountingKhata';
import InventoryMovement from './InventoryMovement';
import FinancialReports from './FinancialReports';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// ─── Types ──────────────────────────────────────────────────────────────────
import { UserRole } from '../types';

type Section =
  | 'dashboard' | 'pages' | 'services' | 'products' | 'testimonials'
  | 'blog' | 'team' | 'careers' | 'industries' | 'faqs' | 'gallery'
  | 'client-logos' | 'contacts' | 'settings' | 'tickets' | 'billing' | 'purchase' | 'external' | 'expenses' | 'khata' | 'inventory' | 'reports' | 'customers' | 'amc' | 'calendar';


interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'json' | 'array';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  rows?: number;
}

// ─── Section Config ─────────────────────────────────────────────────────────

const SECTION_CONFIG: Record<Section, { label: string; icon: React.ElementType; table: string; orderField: string; publishedField?: string; subtitle?: string }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, table: '', orderField: '', subtitle: 'Overview of your business metrics' },
  calendar: { label: 'Calendar', icon: Calendar, table: '', orderField: '', subtitle: 'Manage appointments and schedules' },
  pages: { label: 'Pages', icon: FileText, table: 'pages', orderField: 'page_order', publishedField: 'is_published', subtitle: 'Manage your website content pages' },
  services: { label: 'Services', icon: Wrench, table: 'services', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage service offerings' },
  products: { label: 'Products', icon: Package, table: 'products', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage product catalog' },
  testimonials: { label: 'Testimonials', icon: MessageSquareQuote, table: 'testimonials', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage customer testimonials' },
  blog: { label: 'Blog Posts', icon: PenTool, table: 'blog_posts', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage blog content' },
  team: { label: 'Team Members', icon: Users, table: 'team_members', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage team profiles' },
  careers: { label: 'Careers', icon: Briefcase, table: 'careers', orderField: 'sort_order', publishedField: 'is_active', subtitle: 'Manage job postings' },
  industries: { label: 'Industries', icon: Building2, table: 'industries', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage industry verticals' },
  faqs: { label: 'FAQs', icon: HelpCircle, table: 'faqs', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage frequently asked questions' },
  gallery: { label: 'Gallery', icon: Image, table: 'gallery_images', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage image gallery' },
  'client-logos': { label: 'Client Logos', icon: Award, table: 'client_logos', orderField: 'sort_order', publishedField: 'is_published', subtitle: 'Manage client and partner logos' },
  contacts: { label: 'Contact Submissions', icon: Mail, table: 'contact_submissions', orderField: 'created_at', subtitle: 'View customer inquiries' },
  tickets: { label: 'Service Ticket', icon: Ticket, table: 'service_tickets', orderField: 'created_at', subtitle: 'Manage repair and service tickets' },
  billing: { label: 'Billing Software', icon: Receipt, table: '', orderField: '', subtitle: 'Create and manage invoices' },
  purchase: { label: 'Purchase Entry', icon: Truck, table: '', orderField: '', subtitle: 'Manage supplier purchases' },
  external: { label: 'External Repairs', icon: ExternalLink, table: '', orderField: '', subtitle: 'Manage outsourced repairs' },
  inventory: { label: 'Inventory Movement', icon: Package, table: 'inventory_transactions', orderField: 'transaction_date', subtitle: 'Track stock in and out' },
  reports: { label: 'Financial Reports', icon: Activity, table: '', orderField: '', subtitle: 'View accounting reports' },
  expenses: { label: 'Expenses', icon: IndianRupee, table: '', orderField: '', subtitle: 'Track operational expenses' },
  khata: { label: 'Khata', icon: IndianRupee, table: '', orderField: '', subtitle: 'View financial ledgers and accounting' },
  amc: { label: 'AMC Contracts', icon: Shield, table: '', orderField: '', subtitle: 'Manage Annual Maintenance Contracts' },
  settings: { label: 'Site Settings', icon: Settings, table: 'site_settings', orderField: 'key', subtitle: 'Configure global website settings' },
  customers: { label: 'Customers', icon: Users, table: 'customers', orderField: 'created_at', subtitle: 'Manage customer database' },
};

// ─── Form Field Definitions ─────────────────────────────────────────────────

const PAGES_FIELDS: FormField[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'e.g. about-us' },
  { key: 'content', label: 'Content (JSON)', type: 'json', rows: 10 },
  { key: 'meta_title', label: 'Meta Title', type: 'text' },
  { key: 'meta_description', label: 'Meta Description', type: 'textarea', rows: 3 },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'page_order', label: 'Page Order', type: 'number' },
];

const SERVICES_FIELDS: FormField[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'slug', label: 'Slug', type: 'text', required: true },
  { key: 'short_description', label: 'Short Description', type: 'textarea', rows: 3 },
  { key: 'full_description', label: 'Full Description', type: 'textarea', rows: 6 },
  { key: 'icon', label: 'Icon', type: 'text', placeholder: 'Camera, Laptop, Monitor, etc.' },
  { key: 'features', label: 'Features (one per line)', type: 'array' },
  { key: 'benefits', label: 'Benefits (one per line)', type: 'array' },
  { key: 'meta_title', label: 'Meta Title', type: 'text' },
  { key: 'meta_description', label: 'Meta Description', type: 'textarea', rows: 3 },
  { key: 'is_featured', label: 'Featured', type: 'checkbox' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const PRODUCTS_FIELDS: FormField[] = [
  { key: 'name', label: 'Product Name', type: 'text', required: true },
  { key: 'slug', label: 'Slug', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'price', label: 'Price', type: 'text' },
  { key: 'image_url', label: 'Image URL', type: 'text' },
  { key: 'features', label: 'Features (one per line)', type: 'array' },
  { key: 'is_featured', label: 'Featured', type: 'checkbox' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
  { key: 'stock_count', label: 'Stock Quantity', type: 'number', required: true, placeholder: '0' },
];

const TESTIMONIALS_FIELDS: FormField[] = [
  { key: 'name', label: 'Client Name', type: 'text', required: true },
  { key: 'company', label: 'Company', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
  { key: 'rating', label: 'Rating (1-5)', type: 'number' },
  { key: 'content', label: 'Testimonial Content', type: 'textarea', rows: 5, required: true },
  { key: 'avatar_url', label: 'Avatar URL', type: 'text' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const BLOG_FIELDS: FormField[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'slug', label: 'Slug', type: 'text', required: true },
  { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 3 },
  { key: 'content', label: 'Content (HTML)', type: 'textarea', rows: 12 },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'featured_image', label: 'Featured Image URL', type: 'text' },
  { key: 'meta_title', label: 'Meta Title', type: 'text' },
  { key: 'meta_description', label: 'Meta Description', type: 'textarea', rows: 3 },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const TEAM_FIELDS: FormField[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'role', label: 'Role/Title', type: 'text' },
  { key: 'bio', label: 'Bio', type: 'textarea', rows: 4 },
  { key: 'image_url', label: 'Photo URL', type: 'text' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const CAREERS_FIELDS: FormField[] = [
  { key: 'title', label: 'Job Title', type: 'text', required: true },
  { key: 'slug', label: 'Slug', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', rows: 5 },
  { key: 'requirements', label: 'Requirements (one per line)', type: 'array' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'type', label: 'Employment Type', type: 'select', options: [
    { label: 'Full-time', value: 'Full-time' },
    { label: 'Part-time', value: 'Part-time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Internship', value: 'Internship' },
  ]},
  { key: 'is_active', label: 'Active', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const INDUSTRIES_FIELDS: FormField[] = [
  { key: 'name', label: 'Industry Name', type: 'text', required: true },
  { key: 'slug', label: 'Slug', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { key: 'icon', label: 'Icon', type: 'text', placeholder: 'Building, ShoppingCart, etc.' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const FAQS_FIELDS: FormField[] = [
  { key: 'question', label: 'Question', type: 'text', required: true },
  { key: 'answer', label: 'Answer', type: 'textarea', rows: 5, required: true },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const GALLERY_FIELDS: FormField[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'before_url', label: 'Before Image URL', type: 'text' },
  { key: 'after_url', label: 'After Image URL', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const CLIENT_LOGOS_FIELDS: FormField[] = [
  { key: 'name', label: 'Client Name', type: 'text', required: true },
  { key: 'logo_url', label: 'Logo URL', type: 'text' },
  { key: 'is_published', label: 'Published', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number' },
];

const TICKETS_FIELDS: FormField[] = [
  { key: 'ticket_number', label: 'Ticket Number', type: 'text', required: true },
  { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
  { key: 'customer_email', label: 'Customer Email', type: 'text' },
  { key: 'customer_phone', label: 'Customer Phone', type: 'text', required: true },
  { key: 'customer_address', label: 'Customer Address', type: 'textarea', rows: 2 },
  { key: 'device_type', label: 'Device/Service Type', type: 'text' },
  { key: 'device_make_model', label: 'Make / Model', type: 'text' },
  { key: 'device_password', label: 'Device Password / PIN', type: 'text' },
  { key: 'service_method', label: 'Service Method', type: 'select', options: [
    { label: 'Drop-off', value: 'drop_off' },
    { label: 'Home Pickup', value: 'home_pickup' }
  ]},
  { key: 'pickup_date', label: 'Pickup Date', type: 'text' },
  { key: 'preferred_contact', label: 'Preferred Contact', type: 'text' },
  { key: 'whatsapp_opt_in', label: 'WhatsApp Opt-in', type: 'checkbox' },
  { key: 'pre_approved_budget', label: 'Pre-Approved Budget', type: 'text' },
  { key: 'issue_description', label: 'Issue Description', type: 'textarea', rows: 4, required: true },
  { key: 'status', label: 'Status', type: 'select', options: [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Closed', value: 'closed' }
  ]},
  { key: 'priority', label: 'Priority', type: 'select', options: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ]},
  { key: 'warranty_months', label: 'Warranty (Months)', type: 'number' },
  { key: 'notes', label: 'Internal Notes', type: 'textarea', rows: 3 },
  { key: 'technician_notes', label: 'Technician Notes', type: 'textarea', rows: 3 }
];

const CUSTOMERS_FIELDS: FormField[] = [
  { key: 'name', label: 'Customer Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone Number', type: 'text' },
  { key: 'email', label: 'Email Address', type: 'text' },
  { key: 'address', label: 'Address', type: 'textarea', rows: 3 },
];

const SERVICE_TICKET_HEADERS = [
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
  'Assigned To',
  'Notes',
  'Link',
  'Make/Model',
  'Service Method',
  'Budget'
];

const serviceTicketRow = (ticket: Partial<ServiceTicket & { device_make_model?: string; service_method?: string; pre_approved_budget?: string; }>) => [
  ticket.ticket_number || '',
  ticket.created_at || new Date().toISOString(),
  ticket.customer_name || '',
  ticket.customer_phone || '',
  ticket.customer_email || '',
  ticket.customer_address || '',
  ticket.device_type || '',
  ticket.issue_description || '',
  ticket.priority || '',
  ticket.status || '',
  ticket.assigned_to || '',
  ticket.notes || '',
  ticket.ticket_number ? `https://yantrabyte.anantatechcare.com/admin` : '',
  ticket.device_make_model || '',
  ticket.service_method === 'home_pickup' ? 'Home Pickup' : 'Drop-off',
  ticket.pre_approved_budget || '',
];

const SECTION_FIELDS: Record<string, FormField[]> = {
  pages: PAGES_FIELDS,
  services: SERVICES_FIELDS,
  products: PRODUCTS_FIELDS,
  testimonials: TESTIMONIALS_FIELDS,
  blog: BLOG_FIELDS,
  team: TEAM_FIELDS,
  careers: CAREERS_FIELDS,
  industries: INDUSTRIES_FIELDS,
  faqs: FAQS_FIELDS,
  gallery: GALLERY_FIELDS,
  'client-logos': CLIENT_LOGOS_FIELDS,
  tickets: TICKETS_FIELDS,
  customers: CUSTOMERS_FIELDS,
};

// ─── Table Column Configs ──────────────────────────────────────────────────

const SECTION_COLUMNS: Record<string, { key: string; label: string; format?: (val: any) => string }[]> = {
  pages: [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'is_published', label: 'Published' },
    { key: 'page_order', label: 'Order' },
    { key: 'updated_at', label: 'Updated' },
  ],
  services: [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'icon', label: 'Icon' },
    { key: 'is_featured', label: 'Featured' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  products: [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  testimonials: [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'rating', label: 'Rating' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  blog: [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'is_published', label: 'Published' },
    { key: 'published_at', label: 'Published Date' },
    { key: 'sort_order', label: 'Order' },
  ],
  team: [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  careers: [
    { key: 'title', label: 'Title' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Type' },
    { key: 'is_active', label: 'Active' },
    { key: 'sort_order', label: 'Order' },
  ],
  industries: [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  faqs: [
    { key: 'question', label: 'Question' },
    { key: 'category', label: 'Category' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  gallery: [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  'client-logos': [
    { key: 'name', label: 'Client Name' },
    { key: 'is_published', label: 'Published' },
    { key: 'sort_order', label: 'Order' },
  ],
  contacts: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Date' },
  ],
  tickets: [
    { key: 'ticket_number', label: 'Ticket #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_phone', label: 'Phone' },
    { key: 'device_type', label: 'Device' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
  ],
  customers: [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncateStr(str: string, len: number) {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

function getDefaultForm(fields: FormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === 'checkbox') defaults[f.key] = false;
    else if (f.type === 'number') defaults[f.key] = 0;
    else if (f.type === 'array') defaults[f.key] = '';
    else if (f.type === 'json') defaults[f.key] = '{}';
    else defaults[f.key] = '';
  }
  return defaults;
}

function recordToForm(record: Record<string, unknown>, fields: FormField[]): Record<string, unknown> {
  const form: Record<string, unknown> = {};
  for (const f of fields) {
    let val = record[f.key];
    if (f.type === 'array' && Array.isArray(val)) val = (val as string[]).join('\n');
    else if (f.type === 'json' && typeof val === 'object' && val !== null) val = JSON.stringify(val, null, 2);
    else if (f.type === 'checkbox') val = !!val;
    else if (val === null || val === undefined) val = f.type === 'number' ? 0 : '';
    form[f.key] = val;
  }
  return form;
}

function formToRecord(form: Record<string, unknown>, fields: FormField[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const f of fields) {
    let val = form[f.key];
    if (f.type === 'array') val = typeof val === 'string' ? val.split('\n').filter(l => l.trim()) : [];
    else if (f.type === 'json') {
      try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch { val = {}; }
    }
    else if (f.type === 'number') val = Number(val) || 0;
    else if (f.type === 'checkbox') val = !!val;
    else if (val === '') val = null;
    
    record[f.key] = val;
  }
  return record;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [dataLoading, setDataLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autofillTicket, setAutofillTicket] = useState<ServiceTicket | null>(null);
  const [billingInitialTab, setBillingInitialTab] = useState<'editor' | 'history' | 'quotations' | 'pending'>('editor');
  const [allCustomers, setAllCustomers] = useState<any[]>([]);

  const [userRole, setUserRole] = useState<UserRole>('admin');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Auth ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      if (session?.user) {
        setUserRole((session.user.user_metadata?.role as UserRole) || 'admin');
        supabase.from('customers').select('*').order('created_at', { ascending: false }).then(res => {
          if (res.data) setAllCustomers(res.data);
        });
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSession(!!session);
      if (session?.user) {
        setUserRole((session.user.user_metadata?.role as UserRole) || 'admin');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(false);
  };

  // --- Toast ---
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- Print Service Ticket Job Sheet / Drop-off Receipt ---
  const generateTicketPdfElement = (item: Record<string, unknown>) => {
    const ticketNo = String(item.ticket_number || 'DRAFT');
    const safeText = (value: unknown, fallback = '—') => String(value || fallback)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const safeMultiline = (value: unknown, fallback: string) => safeText(value, fallback).replace(/\n/g, '<br />');
    
    // Generate QR code for tracking URL
    const trackUrl = `https://yantrabyte.anantatechcare.com/track?t=${ticketNo}`;
    const qrCodeSvg = renderToString(<QRCodeSVG value={trackUrl} size={70} level="M" />);
    const dateStr = item.created_at ? new Date(String(item.created_at)).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

    const element = document.createElement('div');
    element.style.width = '794px';
    element.style.boxSizing = 'border-box';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#111111';
    element.style.backgroundColor = '#ffffff';

    element.innerHTML = `
      <div style="width: 794px; height: 1080px; padding: 28px; box-sizing: border-box; overflow: hidden; background-color: #ffffff; position: relative;">
        <!-- Watermark -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url(/hardware_watermark.png); background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none; z-index: 50; opacity: 0.2;">
        </div>
        <div style="border: 2px solid #000000; padding: 18px; min-height: 1020px; box-sizing: border-box; position: relative; z-index: 10;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 16px;">
          <tr>
            <td style="width: 56%; vertical-align: top; padding-right: 16px;">
              <div style="font-size: 25px; font-weight: bold; color: #0B5394; text-transform: uppercase; letter-spacing: 0.3px;">YantraByte Solutions</div>
              <div style="font-size: 11px; color: #444444; line-height: 1.45; margin-top: 5px;">
                IT service, repair, and network management experts.<br />
                47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post<br />
                Phone: 09986742525 | Email: yantrabyte.solutions@gmail.com
              </div>
            </td>
            <td style="width: 44%; text-align: right; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: right; padding-right: 10px; vertical-align: top;">
                    <div style="background-color: #0B5394; color: #ffffff; padding: 8px 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; display: inline-block;">
                      Service Ticket Receipt
                    </div>
                    <div style="font-size: 12px; font-weight: bold; margin-top: 10px; color: #111111;">
                      Ticket No: <span style="color: #c2410c; font-size: 15px;">${safeText(ticketNo)}</span>
                    </div>
                    <div style="font-size: 11px; color: #444444; margin-top: 4px;">
                      Date: ${dateStr}
                    </div>
                  </td>
                  <td style="width: 70px; vertical-align: top;">
                    <div style="padding: 4px; background: white; border: 1px solid #ddd; border-radius: 4px; display: inline-block;">
                      ${qrCodeSvg}
                    </div>
                    <div style="font-size: 8px; color: #666; text-align: center; margin-top: 2px;">Track Status</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <div style="height: 2px; background: #000000; margin-bottom: 16px;"></div>

        <!-- Ticket Details -->
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 18px; font-size: 11px;">
          <colgroup>
            <col style="width: 20%;" />
            <col style="width: 30%;" />
            <col style="width: 18%;" />
            <col style="width: 32%;" />
          </colgroup>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Ticket ID</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word; color: #DC2626;">${safeText(ticketNo)}</td>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Date</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word; color: #B45309;">${dateStr}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Customer Name</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${safeText(item.customer_name)}</td>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Phone</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${safeText(item.customer_phone)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Email</td>
            <td colspan="3" style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${safeText(item.customer_email)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Address</td>
            <td colspan="3" style="border: 1px solid #000000; padding: 7px 8px; line-height: 1.45; word-break: break-word;">${safeText(item.address || item.customer_address)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Device</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${safeText(item.device || item.device_type)}</td>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Status</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; text-transform: uppercase; font-weight: bold; color: #0f766e; word-break: break-word;">${safeText(item.status || 'Received')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Make / Model</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${safeText(item.device_make_model)}</td>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Password/PIN</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${safeText(item.device_password)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Service Method</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; word-break: break-word;">${item.service_method === 'home_pickup' ? 'Home Pickup' : 'Drop-off'}</td>
            <td style="border: 1px solid #000000; background: #D9EAF7; padding: 7px 8px; font-weight: bold; color: #0369A1;">Priority</td>
            <td style="border: 1px solid #000000; padding: 7px 8px; text-transform: capitalize; font-weight: bold; color: ${String(item.priority) === 'high' || String(item.priority) === 'urgent' ? '#b91c1c' : '#374151'}; word-break: break-word;">${safeText(item.priority || 'Medium')}</td>
          </tr>
        </table>

        <!-- Customer & Device Details Grid -->
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 18px;">
          <tr>
            <!-- Customer info -->
            <td style="width: 50%; border: 1px solid #000000; vertical-align: top;">
              <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
                CUSTOMER DETAILS
              </div>
              <div style="padding: 10px; font-size: 11px; line-height: 1.6;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                  <tr><td style="font-weight: bold; width: 34%; vertical-align: top;">Name:</td><td style="word-break: break-word;">${safeText(item.customer_name)}</td></tr>
                  <tr><td style="font-weight: bold; vertical-align: top;">Phone:</td><td style="word-break: break-word;">${safeText(item.customer_phone)}</td></tr>
                  <tr><td style="font-weight: bold; vertical-align: top;">Email:</td><td style="word-break: break-word;">${safeText(item.customer_email)}</td></tr>
                </table>
              </div>
            </td>
            <!-- Device Info -->
            <td style="width: 50%; border: 1px solid #000000; border-left: none; vertical-align: top;">
              <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
                DEVICE & SERVICE DETAILS
              </div>
              <div style="padding: 10px; font-size: 11px; line-height: 1.6;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                  <tr><td style="font-weight: bold; width: 38%; vertical-align: top;">Device/Type:</td><td style="word-break: break-word;">${safeText(item.device_type)}</td></tr>
                  <tr><td style="font-weight: bold; vertical-align: top;">Priority:</td><td style="text-transform: capitalize; font-weight: bold; color: ${String(item.priority) === 'high' || String(item.priority) === 'urgent' ? '#b91c1c' : '#374151'}; word-break: break-word;">${safeText(item.priority || 'Medium')}</td></tr>
                  <tr><td style="font-weight: bold; vertical-align: top;">Status:</td><td style="text-transform: uppercase; font-weight: bold; color: #0f766e; word-break: break-word;">${safeText(item.status || 'Open')}</td></tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- Problem Description -->
        <div style="border: 1px solid #000000; margin-bottom: 18px;">
          <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
            REPORTED CUSTOMER COMPLAINT / ISSUE
          </div>
          <div style="padding: 12px; font-size: 12px; min-height: 78px; line-height: 1.6; color: #111111; word-break: break-word;">
            ${safeMultiline(item.issue_description, 'No complaints specified.')}
          </div>
        </div>

        <!-- Diagnostics & Internal Notes -->
        <div style="border: 1px solid #000000; margin-bottom: 18px;">
          <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
            DIAGNOSTICS & INTERNAL WORKSHOP NOTES
          </div>
          <div style="padding: 12px; font-size: 12px; min-height: 90px; line-height: 1.6; color: #333333; font-style: italic; word-break: break-word;">
            (For Technician Use Only - Leave Blank for Handwritten Notes)
            <br/><br/><br/>
          </div>
        </div>

        <!-- Repair / Drop-off Terms -->
        <div style="border: 1px solid #000000; padding: 12px; margin-bottom: 42px; background-color: #f8fafc;">
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #111111;">TERMS & CONDITIONS:</div>
          <ol style="margin: 0; padding-left: 15px; font-size: 12px; color: #555555; line-height: 1.5;">
            <li>Diagnostic charges are applicable for all devices checked in for repair, even if estimate is rejected.</li>
            <li>Backup all data before drop-off. Yantrabyte Solutions is not liable for data loss or corruption during repair.</li>
            <li>Devices not collected within 30 days of repair completion warning may be subject to storage fees or disposal.</li>
            <li>Any hardware components replaced will carry their respective standard OEM manufacturer warranties.</li>
          </ol>
        </div>

        </div>
        <!-- Signatures Bottom Section -->
        <div style="margin-top: 10px;">
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
            <tr>
              <!-- Customer Sign -->
              <td style="width: 50%; vertical-align: bottom; padding-right: 16px;">
                ${item.customer_signature ? `<div style="height: 72px; text-align: left; margin-bottom: 4px;"><img src="${item.customer_signature}" style="max-width: 180px; max-height: 70px; object-fit: contain;" /></div>` : ''}
                <div style="width: 180px; border-bottom: 1px solid #555555; margin-bottom: 8px;"></div>
                <div style="font-size: 13px; font-weight: bold; color: #333333;">Customer Drop-off Signature</div>
                <div style="font-size: 12px; color: #777777; margin-top: 2px;">I agree to the service repair terms above.</div>
              </td>
              <!-- Yantrabyte Sign -->
              <td style="width: 50%; text-align: right; vertical-align: bottom; padding-left: 16px;">
                <div style="display: inline-block; text-align: left;">
                  <div style="height: 72px; text-align: center; margin-bottom: 4px;">
                    <img src="/seal.png" style="max-width: 100px; max-height: 75px; object-fit: contain; opacity: 0.9;" crossOrigin="anonymous" />
                  </div>
                  <div style="width: 220px; border-bottom: 1px solid #555555; margin-bottom: 8px;"></div>
                  <div style="font-size: 11px; font-weight: bold; color: #0B5394;">For Yantrabyte Solutions</div>
                  <div style="font-size: 9px; color: #777777; margin-top: 2px;">Authorized Workshop Executive</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
      </div>
    `;

    document.body.appendChild(element);

    return element;
  };

  const printJobSheet = async (item: Record<string, unknown>) => {
    const element = generateTicketPdfElement(item);
    const ticketFilename = `JobSheet-${item.ticket_number || 'DRAFT'}.pdf`;
    const opt = {
      margin: 0,
      filename: ticketFilename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    await html2pdf().set(opt).from(element).save();
    document.body.removeChild(element);
    showToast('Job sheet drop-off receipt downloaded!');
  };

  const printDeviceLabel = (item: Record<string, unknown>) => {
    const trackingUrl = `${window.location.origin}/track-ticket?t=${item.ticket_number}`;
    const qrSvgString = renderToString(<QRCodeSVG value={trackingUrl} size={64} level="H" />);
    
    const win = window.open('', '_blank', 'width=400,height=300');
    if (!win) {
      showToast('Popup blocker prevented printing. Please allow popups.', 'error');
      return;
    }
    
    win.document.write(`
      <html>
        <head>
          <title>Device Label - ${item.ticket_number}</title>
          <style>
            @page { size: 2in 1in; margin: 0; }
            body { 
              margin: 0; 
              padding: 0.05in; 
              width: 1.9in; 
              height: 0.9in; 
              font-family: sans-serif; 
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: white;
              overflow: hidden;
            }
            .left {
              display: flex;
              flex-direction: column;
              justify-content: center;
              width: 1.1in;
            }
            .brand { font-size: 8px; font-weight: bold; margin-bottom: 2px; }
            .ticket { font-size: 11px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 2px; }
            .name { font-size: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 1in; }
            .qr { width: 0.7in; height: 0.7in; display: flex; align-items: center; justify-content: center; }
            .qr svg { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div class="left">
            <div class="brand">YantraByte Solutions</div>
            <div class="ticket">#${item.ticket_number}</div>
            <div class="name">${item.customer_name || 'Customer'}</div>
          </div>
          <div class="qr">${qrSvgString}</div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 250);
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const uploadTicketPdfToSupabase = async (item: Record<string, unknown>): Promise<string | null> => {
    try {
      const element = generateTicketPdfElement(item);
      const ticketFilename = `JobSheet-${item.ticket_number || 'DRAFT'}.pdf`;
      const opt = {
        margin: 0,
        filename: ticketFilename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob') as Blob;
      document.body.removeChild(element);
      
      const fileName = `pdfs/Ticket-${item.ticket_number || Date.now()}.pdf`;
      const file = new File([pdfBlob], ticketFilename, { type: 'application/pdf' });
      
      const { error } = await supabase.storage
        .from('invoices')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
        
      // Upload to Google Drive
      try {
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(pdfBlob);
        });
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (token) {
          await fetch('/api/backups/ticket-drive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              customerName: item.customer_name,
              ticketNumber: item.ticket_number,
              filename: ticketFilename,
              pdfBase64: base64data
            })
          });
        }
      } catch (err) {
        console.warn('Failed to upload PDF to Google Drive:', err);
      }
      
      if (error) return null;
      
      return supabase.storage.from('invoices').getPublicUrl(fileName).data.publicUrl;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleInstantBill = (ticket: Record<string, unknown>) => {
    setAutofillTicket(ticket as unknown as ServiceTicket);
    setActiveSection('billing');
    showToast('Switched to billing with pre-filled ticket details!');
  };

  const sendWhatsAppAlert = async (item: Record<string, unknown>) => {
    const name = String(item.customer_name || 'Customer');
    let phone = String(item.customer_phone || '');
    const ticketNo = String(item.ticket_number || 'DRAFT');
    const device = String(item.device_type || 'Device');
    const status = String(item.status || 'open');

    // Format phone number to clean digits (assume Indian +91 if length is 10)
    phone = phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    if (!phone) {
      showToast('No phone number available for WhatsApp', 'error');
      return;
    }

    let text = '';
    const trackUrl = `https://yantrabyte.anantatechcare.com/track-ticket?t=${ticketNo}`;
    
    if (status === 'open') {
      text = `Hi ${name}, this is Yantrabyte Solutions. We have successfully registered your repair request (Ticket: ${ticketNo}) for your ${device}. Our technician will diagnose it shortly. Track status here: ${trackUrl}`;
    } else if (status === 'in-progress') {
      text = `Hi ${name}, this is Yantrabyte Solutions. Your ${device} (Ticket: ${ticketNo}) is currently under active diagnostics/repair. Track status here: ${trackUrl}`;
    } else if (status === 'completed') {
      text = `Hi ${name}, great news! Your ${device} (Ticket: ${ticketNo}) has been fully repaired and tested. It is ready for pickup at our workshop. Thank you for choosing Yantrabyte Solutions!`;
    } else if (status === 'closed') {
      text = `Hi ${name}, this is Yantrabyte Solutions. Your repair ticket ${ticketNo} for ${device} has been marked as delivered and closed. Please reach out if you have any questions!`;
      
      try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'google_review_link').single();
        if (data && data.value) {
          text += `\n\nIf you loved our service, please leave us a 5-star review here: ${data.value}`;
        }
      } catch (e) {
        // ignore
      }
    } else {
      text = `Hi ${name}, this is Yantrabyte Solutions. Update regarding your repair ticket ${ticketNo} (${device}). Status: ${status.toUpperCase()}. Track status here: ${trackUrl}`;
    }

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp chat...');
  };

  const sendTelegramAlert = (item: Record<string, unknown>) => {
    const name = String(item.customer_name || 'Customer');
    let phone = String(item.customer_phone || '');
    const ticketNo = String(item.ticket_number || 'DRAFT');
    const device = String(item.device_type || 'Device');
    const status = String(item.status || 'open');

    // Format phone number to clean digits (assume Indian +91 if length is 10)
    phone = phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '+91' + phone;
    } else if (phone.length === 12 && phone.startsWith('91')) {
      phone = '+' + phone;
    }

    if (!phone) {
      showToast('No phone number available for Telegram', 'error');
      return;
    }

    let text = '';
    const trackUrl = `https://yantrabyte.anantatechcare.com/track?t=${ticketNo}`;
    
    if (status === 'open') {
      text = `Hi ${name}, this is Yantrabyte Solutions. We have successfully registered your repair request (Ticket: ${ticketNo}) for your ${device}. Our technician will diagnose it shortly. Track status here: ${trackUrl}`;
    } else if (status === 'in-progress') {
      text = `Hi ${name}, this is Yantrabyte Solutions. Your ${device} (Ticket: ${ticketNo}) is currently under active diagnostics/repair. Track status here: ${trackUrl}`;
    } else if (status === 'completed') {
      text = `Hi ${name}, great news! Your ${device} (Ticket: ${ticketNo}) has been fully repaired and tested. It is ready for pickup at our workshop. Thank you for choosing Yantrabyte Solutions!`;
    } else if (status === 'closed') {
      text = `Hi ${name}, this is Yantrabyte Solutions. Your repair ticket ${ticketNo} for ${device} has been marked as delivered and closed. Please reach out if you have any questions!`;
    } else {
      text = `Hi ${name}, this is Yantrabyte Solutions. Update regarding your repair ticket ${ticketNo} (${device}). Status: ${status.toUpperCase()}. Track status here: ${trackUrl}`;
    }

    const encodedText = encodeURIComponent(text);
    const url = `https://t.me/${phone}?text=${encodedText}`;
    window.open(url, '_blank');
    showToast('Opening Telegram chat...');
  };

  const markTicketCompleted = async (item: Record<string, unknown>) => {
    if (!window.confirm(`Mark ticket ${item.ticket_number} as completed?`)) return;
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: 'completed' })
        .eq('id', item.id);
      
      if (error) throw error;
      showToast('Ticket marked as completed!', 'success');
      
      // Internal automated alert
      sendTelegramNotification(`✅ <b>Ticket Completed</b>\nTicket: #${item.ticket_number}\nCustomer: ${item.customer_name}\nDevice: ${item.device_type}`);
      
      fetchData('tickets');
    } catch (err: any) {
      showToast('Error updating ticket: ' + err.message, 'error');
    }
  };

  // --- Data Fetching ---
  const fetchData = useCallback(async (section: Section) => {
    const config = SECTION_CONFIG[section];
    if (!config.table) return;
    setDataLoading(true);
    
    // Default to descending (newest first) for these tables
    const descendingTables = ['service_tickets', 'invoices', 'purchases', 'inventory_transactions', 'expenses', 'contact_submissions', 'customers'];
    const isAscending = !descendingTables.includes(config.table as string);

    const { data: rows, error } = await supabase
      .from(config.table as string)
      .select('*')
      .order(config.orderField as string, { ascending: isAscending });
      
    if (error) {
      showToast('Error loading data: ' + error.message, 'error');
    } else {
      setData(prev => ({ ...prev, [section]: rows || [] }));
    }
    setDataLoading(false);
  }, [showToast]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isExportingTickets, setIsExportingTickets] = useState(false);

  const exportServiceTicketsExcel = async () => {
    setIsExportingTickets(true);
    try {
      const { data: ticketsData, error } = await supabase
        .from('service_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tickets = (ticketsData || []) as ServiceTicket[];
      downloadExcelWorkbook(`service-tickets-${new Date().toISOString().slice(0, 10)}.xls`, [
        {
          name: 'Service Tickets',
          rows: [
            SERVICE_TICKET_HEADERS,
            ...tickets.map(serviceTicketRow),
          ],
        },
      ]);

      showToast('Service tickets exported to Excel!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(errorMsg || 'Failed to export service tickets', 'error');
    } finally {
      setIsExportingTickets(false);
    }
  };

  const backupTicketToGoogleSheet = (ticket: Partial<ServiceTicket>) => {
    void appendBackupRow({
      sheetName: 'Service Tickets',
      headers: SERVICE_TICKET_HEADERS,
      row: serviceTicketRow(ticket),
      keyColumnIndex: 0,
      keyValue: ticket.ticket_number || '',
    }).then(result => {
      if (result.ok) {
        showToast('Google Sheet backup updated');
      } else if (!result.skipped) {
        console.warn('Google Sheet ticket backup failed:', result.error);
      }
    }).catch(error => {
      console.warn('Google Sheet ticket backup failed:', error);
    });
  };

  const pushAllTicketsToGoogleSheet = async () => {
    setIsSyncing(true);
    showToast('Starting bulk sync of all tickets to Google Sheet... This may take a minute.', 'success');
    try {
      const { data: tickets, error } = await supabase
        .from('service_tickets')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (!tickets || tickets.length === 0) {
        showToast('No tickets found to sync.');
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let firstErrorMsg = '';
      for (const ticket of tickets) {
        const result = await appendBackupRow({
          sheetName: 'Service Tickets',
          headers: SERVICE_TICKET_HEADERS,
          row: serviceTicketRow(ticket as Partial<ServiceTicket>),
          keyColumnIndex: 0,
          keyValue: ticket.ticket_number || '',
        });
        if (result.ok) {
          successCount++;
        } else if (!firstErrorMsg) {
          firstErrorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        }
      }
      
      if (successCount === tickets.length) {
        showToast(`Successfully pushed ${successCount}/${tickets.length} tickets to Google Sheet!`, 'success');
      } else {
        showToast(`Pushed ${successCount}/${tickets.length}. Error: ${firstErrorMsg}`, 'error');
      }
    } catch (err: any) {
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error("Bulk sync error:", err);
      showToast(`Failed to push tickets: ${msg}`, 'error');
    }
    setIsSyncing(false);
  };

  const syncFromGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      // Fetching the Google Sheet CSV with multi-stage robust fallbacks (direct first, then proxies)
      // New Spreadsheet ID: 17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk, gid: 0
      const csvUrl = 'https://docs.google.com/spreadsheets/d/17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk/export?format=csv&gid=0';
      let response;
      let csvText = '';
      
      try {
        // 1. Try Direct Fetch first (Google Sheets exports are public and support CORS directly in modern browsers)
        response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Direct fetch returned status ' + response.status);
        csvText = await response.text();
      } catch (directErr) {
        console.warn('Direct Google Sheet fetch failed, trying corsproxy.io proxy...', directErr);
        try {
          // 2. Try corsproxy.io as the second stage (super fast and highly reliable proxy)
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(csvUrl)}`);
          if (!response.ok) throw new Error('corsproxy.io returned status ' + response.status);
          csvText = await response.text();
        } catch (proxy1Err) {
          console.warn('corsproxy.io proxy failed, trying api.allorigins.win proxy...', proxy1Err);
          // 3. Try allorigins as the third stage fallback
          const targetUrl = encodeURIComponent(csvUrl);
          response = await fetch(`https://api.allorigins.win/raw?url=${targetUrl}`);
          if (!response.ok) throw new Error('allorigins proxy returned status ' + response.status);
          csvText = await response.text();
        }
      }
      
      const lines = csvText.split('\n');
      const newTickets = [];
      let inCsv = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
          inCsv = true;
        }
        if (inCsv && line && !line.includes(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,')) {
          const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const columns = line.split(regex);
          if (columns.length > 9) {
            const name = columns[1]?.replace(/'/g, "''").replace(/^"|"$/g, '') || '';
            const phone = columns[2]?.replace(/'/g, "''").replace(/^"|"$/g, '') || '';
            const email = columns[3]?.replace(/'/g, "''").replace(/^"|"$/g, '') || '';
            const device = columns[5]?.replace(/'/g, "''").replace(/^"|"$/g, '') || '';
            const issue = columns[6]?.replace(/'/g, "''").replace(/^"|"$/g, '') || '';
            let ticketId = columns[20]?.replace(/'/g, "''").replace(/^"|"$/g, '');
            const statusRaw = columns[12]?.replace(/'/g, "''").replace(/^"|"$/g, '').toLowerCase() || 'open';
            
            let status = 'open';
            if (statusRaw.includes('progress')) status = 'in-progress';
            if (statusRaw.includes('closed') || statusRaw.includes('resolved')) status = 'closed';
            if (!ticketId) ticketId = `YBS-FORM-${Date.now()}-${i}`;
            
            if (name) {
              newTickets.push({
                ticket_number: ticketId,
                customer_name: name,
                customer_phone: phone,
                customer_email: email,
                device_type: device,
                issue_description: issue,
                status: status
              });
            }
          }
        }
      }
      
      if (newTickets.length > 0) {
        const { error } = await supabase.from('service_tickets').upsert(newTickets, { onConflict: 'ticket_number', ignoreDuplicates: true });
        if (error) throw error;
        showToast('Successfully synced from Google Form!');
        fetchData('tickets');
      } else {
        showToast('No valid tickets found in sheet');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast('Error syncing: ' + errorMsg, 'error');
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    if (session && activeSection !== 'dashboard') {
      fetchData(activeSection);
    }
  }, [session, activeSection, fetchData]);

  // --- Dashboard Stats ---
  // Dashboard component fetches its own data.

  // --- CRUD ---
  const openAddForm = () => {
    const fields = SECTION_FIELDS[activeSection];
    if (!fields) return;
    setEditingItem(null);
    const defaultData = getDefaultForm(fields);
    
    if (activeSection === 'tickets') {
      const tickets = (data.tickets || []) as ServiceTicket[];
      let maxNum = 100;
      tickets.forEach((t) => {
        const match = String(t.ticket_number || '').match(/YBS-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      defaultData['ticket_number'] = `YBS-${maxNum + 1}`;
      defaultData['status'] = 'open';
      defaultData['priority'] = 'medium';
    }
    
    setFormData(defaultData);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item: Record<string, unknown>) => {
    const fields = SECTION_FIELDS[activeSection];
    if (!fields) return;
    setEditingItem(item);
    setFormData(recordToForm(item, fields));
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const config = SECTION_CONFIG[activeSection];
    const fields = SECTION_FIELDS[activeSection];
    if (!config.table || !fields) return;

    setFormSaving(true);
    setFormError('');

    const record = formToRecord(formData, fields);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from(config.table as string)
          .update(record)
          .eq('id', editingItem.id);
        if (error) throw error;
        if (activeSection === 'tickets') {
          const pdfUrl = await uploadTicketPdfToSupabase(record);
          if (pdfUrl) (record as any).link = pdfUrl;
          backupTicketToGoogleSheet({ ...(editingItem as unknown as Partial<ServiceTicket>), ...(record as Partial<ServiceTicket>) });
          sendTelegramNotification(`🔧 <b>Ticket Updated</b>\nTicket: #${record.ticket_number}\nCustomer: ${record.customer_name}\nDevice: ${record.device_type}\nStatus: ${record.status}`);
          
          // Smart WhatsApp Status Template Prompt
          if (record.status !== editingItem.status) {
            if (window.confirm(`Status changed to ${record.status}. Do you want to send an automatic WhatsApp update to the customer?`)) {
              sendWhatsAppAlert(record);
            }
            if (record.customer_email && window.confirm(`Do you want to send an automated status update email to ${record.customer_email}?`)) {
              try {
                fetch('http://localhost:4000/api/tickets/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ticket_number: record.ticket_number,
                    customer_name: record.customer_name,
                    customer_email: record.customer_email,
                    status: record.status,
                    device_type: record.device_type,
                    supabase_user_token: (await supabase.auth.getSession()).data.session?.access_token || ''
                  })
                }).then(res => res.json()).then(data => {
                  if (data.ok) showToast('Status email sent successfully');
                  else showToast('Failed to send status email', 'error');
                });
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
        showToast('Item updated successfully');
      } else {
        const { error } = await supabase
          .from(config.table as string)
          .insert([record]);
        if (error) throw error;
        if (activeSection === 'tickets') {
          const pdfUrl = await uploadTicketPdfToSupabase(record);
          if (pdfUrl) (record as any).link = pdfUrl;
          backupTicketToGoogleSheet(record as Partial<ServiceTicket>);
          sendTelegramNotification(`🆕 <b>New Ticket Created</b>\nTicket: #${record.ticket_number}\nCustomer: ${record.customer_name}\nDevice: ${record.device_type}\nIssue: ${record.issue_description}`);
        }
        showToast('Item created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      fetchData(activeSection);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Unknown error';
      setFormError(msg);
    }
    setFormSaving(false);
  };

  const handleDelete = async (id: string) => {
    const config = SECTION_CONFIG[activeSection];
    if (!config.table) return;
    const { error } = await supabase
      .from(config.table as string)
      .delete()
      .eq('id', id);
    if (error) {
      showToast('Error deleting: ' + error.message, 'error');
    } else {
      showToast('Item deleted successfully');
      fetchData(activeSection);
    }
    setDeleteConfirm(null);
  };

  const togglePublished = async (item: Record<string, unknown>) => {
    const config = SECTION_CONFIG[activeSection];
    if (!config.table || !config.publishedField) return;
    const newVal = !item[config.publishedField];
    const { error } = await supabase
      .from(config.table as string)
      .update({ [config.publishedField]: newVal })
      .eq('id', item.id);
    if (error) {
      showToast('Error updating: ' + error.message, 'error');
    } else {
      showToast(newVal ? 'Item published' : 'Item unpublished');
      fetchData(activeSection);
    }
  };

  // --- Contact Status ---
  const updateContactStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id);
    if (error) {
      showToast('Error updating status: ' + error.message, 'error');
    } else {
      showToast('Status updated');
      fetchData('contacts');
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('service_tickets')
      .update({ status })
      .eq('id', id);
    if (error) {
      showToast('Error updating status: ' + error.message, 'error');
    } else {
      showToast(`Status updated to ${status}`);
      fetchData('tickets');
    }
  };

  // --- Site Settings ---
  const [settingsRows, setSettingsRows] = useState<SiteSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');

  useEffect(() => {
    if (session && activeSection === 'settings') {
      setSettingsLoading(true);
      supabase.from('site_settings').select('*').order('key').then(({ data, error }) => {
        if (error) showToast('Error loading settings: ' + error.message, 'error');
        else {
          const rows = (data as SiteSetting[]) || [];
          setSettingsRows(rows);
          const form: Record<string, string> = {};
          rows.forEach(s => { form[s.key] = s.value; });
          setSettingsForm(form);
        }
        setSettingsLoading(false);
      });
    }
  }, [session, activeSection, showToast]);

  const saveSettings = async () => {
    setFormSaving(true);
    try {
      for (const row of settingsRows) {
        const newVal = settingsForm[row.key];
        if (newVal !== undefined && newVal !== row.value) {
          const { error } = await supabase.from('site_settings').update({ value: newVal }).eq('id', row.id);
          if (error) throw error;
        }
      }
      showToast('Settings saved successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving settings';
      showToast(msg, 'error');
    }
    setFormSaving(false);
  };

  const addSetting = async () => {
    if (!newSettingKey.trim()) return;
    const { error } = await supabase.from('site_settings').insert([{ key: newSettingKey, value: newSettingValue }]);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    setNewSettingKey('');
    setNewSettingValue('');
    showToast('Setting added');
    // Reload
    const { data } = await supabase.from('site_settings').select('*').order('key');
    const rows = (data as SiteSetting[]) || [];
    setSettingsRows(rows);
    const form: Record<string, string> = {};
    rows.forEach(s => { form[s.key] = s.value; });
    setSettingsForm(form);
  };

  const deleteSetting = async (id: string) => {
    const { error } = await supabase.from('site_settings').delete().eq('id', id);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Setting deleted');
    const { data } = await supabase.from('site_settings').select('*').order('key');
    const rows = (data as SiteSetting[]) || [];
    setSettingsRows(rows);
    const form: Record<string, string> = {};
    rows.forEach(s => { form[s.key] = s.value; });
    setSettingsForm(form);
  };

  // --- Filtered data ---
  const getFilteredData = () => {
    const sectionData = (data[activeSection] || []) as Record<string, unknown>[];
    if (!searchQuery.trim()) return sectionData;
    const q = searchQuery.toLowerCase();
    return sectionData.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  };

  // --- Loading screen ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" />
      </div>
    );
  }

  // --- Login Screen ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8 text-[#0EA5E9]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-[#94A3B8] text-sm mt-2">Yantrabyte Solutions</p>
          </div>
          <form onSubmit={handleLogin} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {authError}
              </div>
            )}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@yantrabyte.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Sidebar ---
  const allSidebarItems: { section: Section; label: string; icon: React.ElementType }[] = [
    { section: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'pages', label: 'Pages', icon: FileText },
    { section: 'services', label: 'Services', icon: Wrench },
    { section: 'products', label: 'Products', icon: Package },
    { section: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { section: 'blog', label: 'Blog Posts', icon: PenTool },
    { section: 'team', label: 'Team Members', icon: Users },
    { section: 'careers', label: 'Careers', icon: Briefcase },
    { section: 'industries', label: 'Industries', icon: Building2 },
    { section: 'faqs', label: 'FAQs', icon: HelpCircle },
    { section: 'gallery', label: 'Gallery', icon: Image },
    { section: 'client-logos', label: 'Client Logos', icon: Award },
    { section: 'contacts', label: 'Contact Submissions', icon: Mail },
    { section: 'customers', label: 'Customers', icon: UserCircle },
    { section: 'tickets', label: 'Service Ticket', icon: Ticket },
    { section: 'billing', label: 'Billing Software', icon: Receipt },
    { section: 'purchase', label: 'Purchase Entry', icon: Truck },
    { section: 'external', label: 'External Repairs', icon: ExternalLink },
    { section: 'inventory', label: 'Inventory Movement', icon: Package },
    { section: 'reports', label: 'Financial Reports', icon: Activity },
    { section: 'amc', label: 'AMC Contracts', icon: Shield },
    { section: 'expenses', label: 'Expenses', icon: CreditCard },
    { section: 'khata', label: 'Accounting (Khata)', icon: FileSpreadsheet },
    { section: 'settings', label: 'Site Settings', icon: Settings },
  ];

  const sidebarItems = allSidebarItems.filter(item => {
    if (userRole === 'admin') return true;
    if (userRole === 'accountant') {
      return ['dashboard', 'billing', 'purchase', 'external', 'inventory', 'reports', 'expenses', 'khata', 'contacts', 'tickets'].includes(item.section);
    }
    if (userRole === 'staff') {
      return ['dashboard', 'tickets', 'services', 'products', 'gallery'].includes(item.section);
    }
    return false;
  });

  const renderCellValue = (item: Record<string, unknown>, colKey: string) => {
    const val = item[colKey];
    if (colKey === 'is_published' || colKey === 'is_active' || colKey === 'is_featured') {
      return val ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#64748B] border border-white/10">
          <X className="w-3 h-3" /> No
        </span>
      );
    }
    if (colKey === 'status') {
      const status = String(val);
      if (activeSection === 'tickets') {
        const colors: Record<string, string> = {
          open: 'bg-blue-500/10 text-blue-400 border-blue-500/20 focus:border-blue-500/50',
          'in-progress': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 focus:border-yellow-500/50',
          completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 focus:border-emerald-500/50',
          closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20 focus:border-gray-500/50',
        };
        return (
          <select
            value={status}
            onChange={e => updateTicketStatus(String(item.id), e.target.value)}
            style={{ colorScheme: 'dark' }}
            className={`px-2 py-0.5 rounded-full text-xs font-medium border bg-[#0F172A] text-white cursor-pointer outline-none transition-all ${colors[status] || 'bg-white/5 text-[#64748B] border-white/10'}`}
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        );
      }
      const colors: Record<string, string> = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        read: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        replied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'in-progress': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      };
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-white/5 text-[#64748B] border-white/10'}`}>
          {status}
        </span>
      );
    }
    if (colKey === 'created_at' || colKey === 'updated_at' || colKey === 'published_at') {
      return <span className="text-[#94A3B8] text-xs">{formatDate(String(val))}</span>;
    }
    if (colKey === 'rating') {
      return <span className="text-yellow-400">{val as React.ReactNode}</span>;
    }
    if (typeof val === 'object' && val !== null) {
      return <span className="text-[#64748B] text-xs">{truncateStr(JSON.stringify(val), 30)}</span>;
    }
    return <span className="text-white text-sm">{truncateStr(String(val || '-'), 40)}</span>;
  };

  const exportCurrentTableToCSV = () => {
    const config = SECTION_CONFIG[activeSection];
    const columns = SECTION_COLUMNS[activeSection];
    if (!config || !columns) return;
    
    // We already have the export utility available
    import('../utils/export').then(({ exportToCSV }) => {
      // Map data to match columns
      const dataToExport = getFilteredData();
      const exportData = dataToExport.map((row: any) => {
        const exportedRow: Record<string, string> = {};
        columns.forEach(col => {
          const val = row[col.key];
          exportedRow[col.label] = col.format ? col.format(val) : String(val || '');
        });
        return exportedRow;
      });
      exportToCSV(exportData, `yantrabyte_${activeSection}_export`);
    });
  };

  // --- Render Dashboard ---
  const renderDashboard = () => {
    return <Dashboard onNavigate={(section, params) => {
      setActiveSection(section as Section);
      if (section === 'billing' && params?.tab) {
        setBillingInitialTab(params.tab);
      }
    }} />;
  };

  // --- Render Data Table ---
  const renderDataTable = () => {
    const config = SECTION_CONFIG[activeSection];
    const columns = SECTION_COLUMNS[activeSection];
    const fields = SECTION_FIELDS[activeSection];
    if (!config || !columns) return null;

    const filteredData = getFilteredData();
    const isReadOnly = activeSection === 'contacts';

    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">{config.label}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {activeSection === 'tickets' && (
              <>
                <a
                  href="/service-request"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Customer Form
                </a>
                <button
                  onClick={pushAllTicketsToGoogleSheet}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Push All to Google Sheet
                </button>
                <button
                  onClick={syncFromGoogleSheet}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20 text-sm font-medium transition-all"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync Old Google Form
                </button>
                <button
                  onClick={exportServiceTicketsExcel}
                  disabled={isExportingTickets}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExportingTickets ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  Export Excel
                </button>
              </>
            )}
            {activeSection !== 'tickets' && (
              <button
                onClick={exportCurrentTableToCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20 text-sm font-medium transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
            )}
            {fields && !isReadOnly && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" /> Add New
              </button>
            )}
            <button
              onClick={() => fetchData(activeSection)}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20 text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 transition-all"
          />
        </div>

        {/* Table */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#0EA5E9] animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-[#64748B]">
            <p className="text-lg">No items found</p>
            <p className="text-sm mt-1">Click "Add New" to create your first item</p>
          </div>
        ) : (
          <div className="overflow-x-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {columns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={String(item.id)} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {renderCellValue(item, col.key)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {config.publishedField && (
                          <button
                            onClick={() => togglePublished(item)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-[#0EA5E9] transition-all"
                            title={item[config.publishedField] ? 'Unpublish' : 'Publish'}
                          >
                            {item[config.publishedField] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        )}
                        {activeSection === 'contacts' && (
                          <select
                            value={String(item.status || 'new')}
                            onChange={e => updateContactStatus(String(item.id), e.target.value)}
                            style={{ colorScheme: 'dark' }}
                            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] text-xs focus:outline-none focus:border-[#0EA5E9]/50"
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                          </select>
                        )}
                        {!isReadOnly && (
                          <>
                            {activeSection === 'tickets' && (
                              <>
                                <button
                                  onClick={() => handleInstantBill(item)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-[#0EA5E9] transition-all"
                                  title="Create Invoice for this Repair"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => sendWhatsAppAlert(item)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-green-400 transition-all"
                                  title="Send WhatsApp Client Alert"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => sendTelegramAlert(item)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-blue-400 transition-all"
                                  title="Send Telegram Client Alert"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => printDeviceLabel(item)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-amber-400 transition-all"
                                  title="Print Device Label"
                                >
                                  <Ticket className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => printJobSheet(item)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-emerald-400 transition-all"
                                  title="Print Job Sheet / Drop-off Receipt"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                                {item.status !== 'completed' && item.status !== 'closed' && (
                                  <button
                                    onClick={() => markTicketCompleted(item)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-green-500 transition-all"
                                    title="Mark as Completed"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => openEditForm(item)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-[#0EA5E9] transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {deleteConfirm === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(String(item.id))}
                                  className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 rounded-lg bg-white/5 text-[#94A3B8] text-xs hover:bg-white/10 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(String(item.id))}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-red-400 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // --- Render Settings ---
  const renderSettings = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Site Settings</h2>
          <button
            onClick={saveSettings}
            disabled={formSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All
          </button>
        </div>

        {/* Telegram Integration Help */}
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-100">
          <h3 className="font-bold mb-2 text-blue-400 flex items-center gap-2">
            <Send className="w-4 h-4" /> Telegram Automated Alerts Setup
          </h3>
          <p className="mb-2">To receive automated internal alerts for new tickets and invoices on Telegram:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Search for <strong>@BotFather</strong> on Telegram, type <code>/newbot</code> to create a bot, and get your HTTP API Token.</li>
            <li>Search for <strong>@userinfobot</strong> on Telegram and type <code>/start</code> to get your numeric Chat ID.</li>
            <li>Add two new settings below: <code>telegram_bot_token</code> (paste your bot token) and <code>telegram_chat_id</code> (paste your chat ID).</li>
          </ul>
          <p className="text-xs text-blue-300">Once added, start a conversation with your newly created bot to allow it to message you.</p>
        </div>

        {/* Add new setting */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-white text-sm font-semibold mb-3">Add New Setting</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Key (e.g. company_name)"
              value={newSettingKey}
              onChange={e => setNewSettingKey(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 transition-all"
            />
            <input
              type="text"
              placeholder="Value"
              value={newSettingValue}
              onChange={e => setNewSettingValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 transition-all"
            />
            <button
              onClick={addSetting}
              className="px-4 py-2 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-medium transition-all"
            >
              Add
            </button>
          </div>
        </div>

        {settingsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#0EA5E9] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {settingsRows.map(row => (
              <div key={row.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-48 shrink-0">
                  <span className="text-[#0EA5E9] text-sm font-mono font-medium">{row.key}</span>
                </div>
                <input
                  type="text"
                  value={settingsForm[row.key] || ''}
                  onChange={e => setSettingsForm(prev => ({ ...prev, [row.key]: e.target.value }))}
                  className="flex-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#0EA5E9]/50 transition-all"
                />
                <button
                  onClick={() => deleteSetting(row.id)}
                  className="p-2 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-red-400 transition-all shrink-0"
                  title="Delete setting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {settingsRows.length === 0 && (
              <p className="text-center py-12 text-[#64748B]">No settings found. Add your first setting above.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- Render Form Modal ---
  const renderFormModal = () => {
    const fields = SECTION_FIELDS[activeSection];
    if (!fields || !showForm) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0F172A] border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {formError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-white text-sm font-medium mb-2">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {field.type === 'text' && (
                  <>
                    <input
                      type="text"
                      list={field.key === 'customer_phone' ? 'customers-phone-list' : undefined}
                      value={String(formData[field.key] || '')}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, [field.key]: val }));
                        // Auto-fill other fields if a customer is selected by phone
                        if (field.key === 'customer_phone' && activeSection === 'tickets') {
                          const customer = allCustomers.find(c => c.phone === val || c.name === val);
                          if (customer) {
                            setFormData(prev => ({
                              ...prev,
                              customer_name: customer.name || prev.customer_name,
                              customer_email: customer.email || prev.customer_email,
                              customer_address: customer.address || prev.customer_address
                            }));
                          }
                        }
                      }}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all"
                    />
                    {field.key === 'customer_phone' && activeSection === 'tickets' && (
                      <datalist id="customers-phone-list">
                        {allCustomers.map(c => (
                          <option key={c.id} value={c.phone || c.name}>
                            {c.name} {c.phone ? `- ${c.phone}` : ''}
                          </option>
                        ))}
                      </datalist>
                    )}
                  </>
                )}

                {field.type === 'textarea' && (
                  (field.key === 'content' || field.key === 'description' || field.key === 'answer') ? (
                    <div className="bg-white text-black rounded-xl overflow-hidden border border-white/10">
                      <ReactQuill
                        theme="snow"
                        value={String(formData[field.key] || '')}
                        onChange={(val) => setFormData(prev => ({ ...prev, [field.key]: val }))}
                        className="h-64 mb-12"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={String(formData[field.key] || '')}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={field.rows || 4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all resize-none font-mono"
                    />
                  )
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={String(formData[field.key] || 0)}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all"
                  />
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        formData[field.key]
                          ? 'bg-[#0EA5E9] border-[#0EA5E9]'
                          : 'border-white/20 hover:border-[#0EA5E9]/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    >
                      {!!formData[field.key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[#94A3B8] text-sm">Enable {field.label}</span>
                  </label>
                )}

                {field.type === 'select' && field.options && (
                  <div className="relative">
                    <select
                      value={String(formData[field.key] || '')}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#0EA5E9]/50 appearance-none pr-10 transition-all"
                    >
                      <option value="" className="bg-[#0F172A]">Select...</option>
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-[#0F172A]">{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                )}

                {field.type === 'json' && (
                  <textarea
                    value={String(formData[field.key] || '{}')}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="{}"
                    rows={field.rows || 8}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all resize-none font-mono"
                  />
                )}

                {field.type === 'array' && (
                  <textarea
                    value={String(formData[field.key] || '')}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="One item per line"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all resize-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#0F172A] border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={formSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {formSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Render content ---
  const renderContent = () => {
    if (activeSection === 'dashboard') return renderDashboard();
    if (activeSection === 'settings') return renderSettings();
    if (activeSection === 'billing') return <BillingSoftware initialAutofillTicket={autofillTicket} onClearAutofill={() => setAutofillTicket(null)} initialTab={billingInitialTab} />;
    if (activeSection === 'purchase') return <PurchaseSoftware />;
    if (activeSection === 'external') return <ExternalRepairs />;
    if (activeSection === 'inventory') return <InventoryMovement />;
    if (activeSection === 'reports') return <FinancialReports />;
    if (activeSection === 'expenses') return <Expenses />;
    if (activeSection === 'khata') return <AccountingKhata />;
    if (activeSection === 'amc') return <AmcContracts onRenewContract={(c) => console.log('Renew', c)} />;
    if (activeSection === 'calendar') return <CalendarView />;
    return renderDataTable();
  };

  // --- Main Layout ---
  return (
    <div className="min-h-screen bg-[#0B1120] flex">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Form Modal */}
      {renderFormModal()}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0F172A] border-r border-white/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}`}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-5 h-5 text-[#0EA5E9]" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm truncate">Yantrabyte</h1>
              <p className="text-[#64748B] text-xs truncate">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            return (
              <button
                key={item.section}
                onClick={() => { setActiveSection(item.section); setSearchQuery(''); setShowForm(false); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-[#94A3B8] hover:text-white transition-all lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {SECTION_CONFIG[activeSection]?.label || 'Dashboard'}
              </h2>
              <p className="text-[#64748B] text-xs">{SECTION_CONFIG[activeSection]?.subtitle || 'Manage your website content'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-white/5 text-[#94A3B8] hover:text-white transition-all"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
