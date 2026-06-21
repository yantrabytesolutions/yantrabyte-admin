import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Service, Product, Testimonial, BlogPost, TeamMember, Career,
  Industry, FAQ, GalleryImage, ClientLogo, SiteSetting, ContactSubmission, Page,
  ServiceTicket,
} from '../types';
import {
  LayoutDashboard, FileText, Wrench, Package, MessageSquareQuote, PenTool,
  Users, Briefcase, Building2, HelpCircle, Image, Award, Mail, Settings,
  LogOut, Plus, Pencil, Trash2, X, Eye, EyeOff, ChevronDown, Save,
  Loader2, AlertCircle, CheckCircle, Search, RefreshCw, Menu, Ticket, Receipt, CreditCard, MessageSquare,
  DollarSign, Clock, Activity, TrendingUp, ArrowRight
} from 'lucide-react';

import BillingSoftware from './BillingSoftware';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// ─── Types ──────────────────────────────────────────────────────────────────

type Section =
  | 'dashboard' | 'pages' | 'services' | 'products' | 'testimonials'
  | 'blog' | 'team' | 'careers' | 'industries' | 'faqs' | 'gallery'
  | 'client-logos' | 'contacts' | 'settings' | 'tickets' | 'billing';

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

const SECTION_CONFIG: Record<Section, { label: string; icon: React.ElementType; table: string; orderField: string; publishedField?: string }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, table: '', orderField: '' },
  pages: { label: 'Pages', icon: FileText, table: 'pages', orderField: 'page_order', publishedField: 'is_published' },
  services: { label: 'Services', icon: Wrench, table: 'services', orderField: 'sort_order', publishedField: 'is_published' },
  products: { label: 'Products', icon: Package, table: 'products', orderField: 'sort_order', publishedField: 'is_published' },
  testimonials: { label: 'Testimonials', icon: MessageSquareQuote, table: 'testimonials', orderField: 'sort_order', publishedField: 'is_published' },
  blog: { label: 'Blog Posts', icon: PenTool, table: 'blog_posts', orderField: 'sort_order', publishedField: 'is_published' },
  team: { label: 'Team Members', icon: Users, table: 'team_members', orderField: 'sort_order', publishedField: 'is_published' },
  careers: { label: 'Careers', icon: Briefcase, table: 'careers', orderField: 'sort_order', publishedField: 'is_active' },
  industries: { label: 'Industries', icon: Building2, table: 'industries', orderField: 'sort_order', publishedField: 'is_published' },
  faqs: { label: 'FAQs', icon: HelpCircle, table: 'faqs', orderField: 'sort_order', publishedField: 'is_published' },
  gallery: { label: 'Gallery', icon: Image, table: 'gallery_images', orderField: 'sort_order', publishedField: 'is_published' },
  'client-logos': { label: 'Client Logos', icon: Award, table: 'client_logos', orderField: 'sort_order', publishedField: 'is_published' },
  contacts: { label: 'Contact Submissions', icon: Mail, table: 'contact_submissions', orderField: 'created_at' },
  tickets: { label: 'Service Ticket', icon: Ticket, table: 'service_tickets', orderField: 'created_at' },
  billing: { label: 'Billing Software', icon: Receipt, table: 'invoices', orderField: 'created_at' },
  settings: { label: 'Site Settings', icon: Settings, table: 'site_settings', orderField: 'key' },
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
  { key: 'device_type', label: 'Device/Service Type', type: 'text' },
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
  { key: 'notes', label: 'Internal Notes', type: 'textarea', rows: 3 }
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
};

// ─── Table Column Configs ──────────────────────────────────────────────────

const SECTION_COLUMNS: Record<string, { key: string; label: string }[]> = {
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
    { key: 'device_type', label: 'Device' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
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
  const [autofillTicket, setAutofillTicket] = useState<any | null>(null);

  const [financialInvoices, setFinancialInvoices] = useState<any[]>([]);
  const [financialTickets, setFinancialTickets] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // --- Auth ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSession(!!session);
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
  const printJobSheet = (item: Record<string, unknown>) => {
    const ticketNo = String(item.ticket_number || 'DRAFT');
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.width = '790px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#333333';
    element.style.backgroundColor = '#ffffff';

    const dateStr = item.created_at ? new Date(String(item.created_at)).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

    element.innerHTML = `
      <div style="border: 2px solid #000000; padding: 20px; min-height: 1020px; position: relative;">
        <!-- Watermark -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; opacity: 0.15;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 1123" width="100%" height="100%">
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="35" font-weight="900" fill="#0B5394" transform="rotate(-40, 397, 561)" text-anchor="middle" dominant-baseline="middle" letter-spacing="10">YANTRABYTE SOLUTIONS</text>
          </svg>
        </div>
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 60%; vertical-align: top;">
              <div style="font-size: 26px; font-weight: bold; color: #0B5394; text-transform: uppercase; letter-spacing: 0.5px;">Yantrabyte Solutions</div>
              <div style="font-size: 11px; color: #555555; line-height: 1.4; margin-top: 5px;">
                IT service, repair, and network management experts.<br />
                Email: support@yantrabyte.com | Web: www.yantrabyte.com
              </div>
            </td>
            <td style="width: 40%; text-align: right; vertical-align: top;">
              <div style="background-color: #0B5394; color: #ffffff; padding: 8px 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                Job Sheet Drop-off Receipt
              </div>
              <div style="font-size: 12px; font-weight: bold; margin-top: 10px; color: #333333;">
                Ticket No: <span style="color: #c2410c; font-size: 15px;">${ticketNo}</span>
              </div>
              <div style="font-size: 11px; color: #555555; margin-top: 4px;">
                Date: ${dateStr}
              </div>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <div style="height: 2px; background: #000000; margin-bottom: 20px;"></div>

        <!-- Customer & Device Details Grid -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <!-- Customer info -->
            <td style="width: 50%; border: 1px solid #000000; vertical-align: top;">
              <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
                CUSTOMER DETAILS
              </div>
              <div style="padding: 10px; font-size: 12px; line-height: 1.6;">
                <table style="width: 100%;">
                  <tr><td style="font-weight: bold; width: 30%;">Name:</td><td>${item.customer_name || '—'}</td></tr>
                  <tr><td style="font-weight: bold;">Phone:</td><td>${item.customer_phone || '—'}</td></tr>
                  <tr><td style="font-weight: bold;">Email:</td><td>${item.customer_email || '—'}</td></tr>
                </table>
              </div>
            </td>
            <!-- Device Info -->
            <td style="width: 50%; border: 1px solid #000000; border-left: none; vertical-align: top;">
              <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
                DEVICE & SERVICE DETAILS
              </div>
              <div style="padding: 10px; font-size: 12px; line-height: 1.6;">
                <table style="width: 100%;">
                  <tr><td style="font-weight: bold; width: 35%;">Device/Type:</td><td>${item.device_type || '—'}</td></tr>
                  <tr><td style="font-weight: bold;">Priority:</td><td style="text-transform: capitalize; font-weight: bold; color: ${String(item.priority) === 'high' || String(item.priority) === 'urgent' ? '#b91c1c' : '#374151'}">${item.priority || 'Medium'}</td></tr>
                  <tr><td style="font-weight: bold;">Status:</td><td style="text-transform: uppercase; font-weight: bold; color: #0f766e">${item.status || 'Open'}</td></tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- Problem Description -->
        <div style="border: 1px solid #000000; margin-bottom: 25px;">
          <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
            REPORTED CUSTOMER COMPLAINT / ISSUE
          </div>
          <div style="padding: 12px; font-size: 12px; min-height: 80px; line-height: 1.6; color: #111111;">
            ${String(item.issue_description || 'No complaints specified.').replace(/\n/g, '<br />')}
          </div>
        </div>

        <!-- Diagnostics & Internal Notes -->
        <div style="border: 1px solid #000000; margin-bottom: 30px;">
          <div style="background-color: #D9EAF7; padding: 6px 10px; font-weight: bold; font-size: 12px; color: #000000; border-bottom: 1px solid #000000;">
            DIAGNOSTICS & INTERNAL WORKSHOP NOTES
          </div>
          <div style="padding: 12px; font-size: 12px; min-height: 100px; line-height: 1.6; color: #333333; font-style: italic;">
            ${item.notes ? String(item.notes).replace(/\n/g, '<br />') : 'Awaiting diagnostic feedback from the support team.'}
          </div>
        </div>

        <!-- Repair / Drop-off Terms -->
        <div style="border: 1px solid #000000; padding: 12px; margin-bottom: 120px; background-color: #f8fafc;">
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #111111;">TERMS & CONDITIONS:</div>
          <ol style="margin: 0; padding-left: 15px; font-size: 9px; color: #555555; line-height: 1.5;">
            <li>Diagnostic charges are applicable for all devices checked in for repair, even if estimate is rejected.</li>
            <li>Backup all data before drop-off. Yantrabyte Solutions is not liable for data loss or corruption during repair.</li>
            <li>Devices not collected within 30 days of repair completion warning may be subject to storage fees or disposal.</li>
            <li>Any hardware components replaced will carry their respective standard OEM manufacturer warranties.</li>
          </ol>
        </div>

        <!-- Signatures Bottom Section -->
        <div style="position: absolute; bottom: 30px; left: 20px; right: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <!-- Customer Sign -->
              <td style="width: 50%; vertical-align: bottom;">
                <div style="width: 180px; border-bottom: 1px solid #555555; margin-bottom: 8px;"></div>
                <div style="font-size: 11px; font-weight: bold; color: #333333;">Customer Drop-off Signature</div>
                <div style="font-size: 9px; color: #777777; margin-top: 2px;">I agree to the service repair terms above.</div>
              </td>
              <!-- Yantrabyte Sign -->
              <td style="width: 50%; text-align: right; vertical-align: bottom; position: relative;">
                <div style="display: inline-block; text-align: left; position: relative;">
                  <!-- Stamp/Seal overlay -->
                  <div style="position: absolute; bottom: 10px; right: 20px; pointer-events: none; opacity: 0.85;">
                    <img src="/seal.png" style="width: 60px; height: 60px; border-radius: 9999px; object-fit: contain;" crossOrigin="anonymous" />
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
    `;

    document.body.appendChild(element);
    const opt = {
      margin: 0,
      filename: `YBS-JOB-${ticketNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
      showToast('Job sheet drop-off receipt downloaded!');
    });
  };

  const handleInstantBill = (ticket: Record<string, unknown>) => {
    setAutofillTicket(ticket);
    setActiveSection('billing');
    showToast('Switched to billing with pre-filled ticket details!');
  };

  const sendWhatsAppAlert = (item: Record<string, unknown>) => {
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
    if (status === 'open') {
      text = `Hi ${name}, this is Yantrabyte Solutions. We have successfully registered your repair request (Ticket: ${ticketNo}) for your ${device}. Our technician will diagnose it shortly. Thank you!`;
    } else if (status === 'in-progress') {
      text = `Hi ${name}, this is Yantrabyte Solutions. Your ${device} (Ticket: ${ticketNo}) is currently under active diagnostics/repair. We will notify you once completed or if parts are required.`;
    } else if (status === 'completed') {
      text = `Hi ${name}, great news! Your ${device} (Ticket: ${ticketNo}) has been fully repaired and tested. It is ready for pickup at our workshop. Thank you for choosing Yantrabyte Solutions!`;
    } else if (status === 'closed') {
      text = `Hi ${name}, this is Yantrabyte Solutions. Your repair ticket ${ticketNo} for ${device} has been marked as delivered and closed. Please reach out if you have any questions!`;
    } else {
      text = `Hi ${name}, this is Yantrabyte Solutions. Update regarding your repair ticket ${ticketNo} (${device}). Status: ${status.toUpperCase()}.`;
    }

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp chat...');
  };

  // --- Data Fetching ---
  const fetchData = useCallback(async (section: Section) => {
    const config = SECTION_CONFIG[section];
    if (!config.table) return;
    setDataLoading(true);
    const { data: rows, error } = await supabase
      .from(config.table as string)
      .select('*')
      .order(config.orderField as string, { ascending: true });
    if (error) {
      showToast('Error loading data: ' + error.message, 'error');
    } else {
      setData(prev => ({ ...prev, [section]: rows || [] }));
    }
    setDataLoading(false);
  }, [showToast]);

  const [isSyncing, setIsSyncing] = useState(false);

  const syncFromGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      // Fetching the Google Sheet CSV with multi-stage robust fallbacks (direct first, then proxies)
      const csvUrl = 'https://docs.google.com/spreadsheets/d/1y6dyRVn0seq5qZfVmThTXJHiEoyG9kgoLeOj9WZbBOc/export?format=csv&gid=1073064749';
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
      
      const parseCSV = (text: string) => {
        const result = [];
        let row = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];
          if (inQuotes) {
            if (char === '"' && nextChar === '"') { cell += '"'; i++; }
            else if (char === '"') { inQuotes = false; }
            else { cell += char; }
          } else {
            if (char === '"') { inQuotes = true; }
            else if (char === ',') { row.push(cell.trim()); cell = ''; }
            else if (char === '\n' || char === '\r') {
              if (char === '\r' && nextChar === '\n') i++;
              row.push(cell.trim()); result.push(row); row = []; cell = '';
            } else { cell += char; }
          }
        }
        if (cell || row.length > 0) { row.push(cell.trim()); result.push(row); }
        return result;
      };

      const parsedRows = parseCSV(csvText);
      const newTickets = [];
      let headerIndex = -1;
      
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        if (row.length === 0 || row.join('').trim() === '') continue;
        
        if (headerIndex === -1 && (row.includes('Timestamp') || row.includes('Customer Name'))) {
           headerIndex = i;
           continue;
        }
        
        if (headerIndex !== -1 && i > headerIndex) {
          if (row.length > 9) {
            const name = row[1] || '';
            const phone = row[2] || '';
            const email = row[3] || '';
            const device = row[5] || '';
            const issue = row[6] || '';
            let ticketId = row[20] || '';
            const statusRaw = (row[12] || 'open').toLowerCase();
            
            let status = 'open';
            if (statusRaw.includes('progress')) status = 'in-progress';
            if (statusRaw.includes('closed') || statusRaw.includes('resolved') || statusRaw.includes('delivered')) status = 'closed';
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
        const { error } = await supabase.from('service_tickets').upsert(newTickets, { onConflict: 'ticket_number', ignoreDuplicates: false });
        if (error) throw error;
        showToast('Successfully synced from Google Sheet!');
        fetchData('tickets');
      } else {
        showToast('No valid tickets found in sheet');
      }
    } catch (err: any) {
      showToast('Error syncing: ' + err.message, 'error');
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    if (session && activeSection !== 'dashboard') {
      fetchData(activeSection);
    }
  }, [session, activeSection, fetchData]);

  // --- Dashboard Stats ---
  const [stats, setStats] = useState<Record<string, number>>({});
  useEffect(() => {
    if (session && activeSection === 'dashboard') {
      setDashboardLoading(true);
      const tables = ['services', 'blog_posts', 'testimonials', 'contact_submissions', 'pages', 'products', 'team_members', 'careers', 'industries', 'faqs', 'gallery_images', 'client_logos', 'service_tickets'];
      
      Promise.all([
        Promise.all(tables.map(t => supabase.from(t).select('id', { count: 'exact', head: true }))),
        supabase.from('invoices').select('*').order('date', { ascending: false }),
        supabase.from('service_tickets').select('*').order('created_at', { ascending: false })
      ]).then(([results, invoicesRes, ticketsRes]) => {
        const s: Record<string, number> = {};
        tables.forEach((t, i) => { s[t] = results[i].count || 0; });
        setStats(s);
        
        if (invoicesRes.data) {
          setFinancialInvoices(invoicesRes.data);
        }
        if (ticketsRes.data) {
          setFinancialTickets(ticketsRes.data);
        }
        setDashboardLoading(false);
      }).catch(err => {
        console.error('Error loading dashboard financials:', err);
        setDashboardLoading(false);
      });
    }
  }, [session, activeSection]);

  // --- CRUD ---
  const openAddForm = () => {
    const fields = SECTION_FIELDS[activeSection];
    if (!fields) return;
    setEditingItem(null);
    const defaultData = getDefaultForm(fields);
    
    if (activeSection === 'tickets') {
      const tickets = data.tickets || [];
      let maxNum = 100;
      tickets.forEach((t: any) => {
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
        showToast('Item updated successfully');
      } else {
        const { error } = await supabase
          .from(config.table as string)
          .insert([record]);
        if (error) throw error;
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
    const ticket = (data.tickets || []).find((t: any) => String(t.id) === id) as any;
    const ticketNumber = ticket ? ticket.ticket_number : null;

    const { error } = await supabase
      .from('service_tickets')
      .update({ status })
      .eq('id', id);
    if (error) {
      showToast('Error updating status: ' + error.message, 'error');
    } else {
      showToast(`Status updated to ${status}`);
      fetchData('tickets');

      // Sync with Google Sheets
      (async () => {
        let gasUrl = import.meta.env.VITE_GAS_WEBAPP_URL || localStorage.getItem('ybs-gas-url');
        if (!gasUrl) {
          try {
            const { data: setting } = await supabase
              .from('site_settings')
              .select('value')
              .eq('key', 'google_apps_script_url')
              .maybeSingle();
            if (setting && setting.value) {
              gasUrl = setting.value;
              localStorage.setItem('ybs-gas-url', gasUrl);
            }
          } catch (e) {
            console.error('Error fetching settings:', e);
          }
        }

        if (ticketNumber && gasUrl) {
          fetch(gasUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
              action: 'updateTicketStatus',
              ticketId: ticketNumber,
              status: status
            })
          }).catch(syncErr => {
            console.error('Failed to sync to Google Sheets:', syncErr);
          });
        }
      })();
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
  const sidebarItems: { section: Section; label: string; icon: React.ElementType }[] = [
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
    { section: 'tickets', label: 'Service Ticket', icon: Ticket },
    { section: 'billing', label: 'Billing Software', icon: Receipt },
    { section: 'settings', label: 'Site Settings', icon: Settings },
  ];

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
      return <span className="text-yellow-400">{val}</span>;
    }
    if (typeof val === 'object' && val !== null) {
      return <span className="text-[#64748B] text-xs">{truncateStr(JSON.stringify(val), 30)}</span>;
    }
    return <span className="text-white text-sm">{truncateStr(String(val || '-'), 40)}</span>;
  };

  // --- Render Dashboard ---
  const renderDashboard = () => {
    if (dashboardLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-white">
          <Loader2 className="w-10 h-10 text-[#0EA5E9] animate-spin mb-4" />
          <p className="text-sm text-[#94A3B8]">Assembling Financial Ledger & Operational Metrics...</p>
        </div>
      );
    }

    const totalInvoiced = financialInvoices
      .filter(inv => inv.doc_type === 'Invoice')
      .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

    const outstandingDues = financialInvoices
      .filter(inv => inv.doc_type === 'Invoice')
      .reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

    const collectedAmount = totalInvoiced - outstandingDues;

    // Service Ticket Stats
    const openTickets = financialTickets.filter(t => t.status === 'open').length;
    const inProgressTickets = financialTickets.filter(t => t.status === 'in-progress').length;
    const completedTickets = financialTickets.filter(t => t.status === 'completed').length;
    const closedTickets = financialTickets.filter(t => t.status === 'closed').length;
    const pendingTickets = openTickets + inProgressTickets;

    // Get list of outstanding clients
    const outstandingClients = financialInvoices
      .filter(inv => inv.doc_type === 'Invoice' && (inv.balance_due || 0) > 0)
      .reduce((acc: any[], inv) => {
        const name = String(inv.customer_name || 'Customer');
        const phone = String(inv.customer_phone || '');
        const due = inv.balance_due || 0;
        
        const existing = acc.find(c => c.customer_name?.toLowerCase() === name.toLowerCase());
        if (existing) {
          existing.balance_due += due;
          if (!existing.invoices.includes(inv.invoice_no)) {
            existing.invoices.push(inv.invoice_no);
          }
        } else {
          acc.push({
            customer_name: name,
            customer_phone: phone,
            balance_due: due,
            invoices: [inv.invoice_no]
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.balance_due - a.balance_due);

    // Formats and opens direct WhatsApp reminder
    const sendDuesReminder = (client: any) => {
      const name = client.customer_name;
      let phone = client.customer_phone.replace(/\D/g, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }
      if (!phone) {
        showToast('No phone number available for client', 'error');
        return;
      }
      
      const text = `Hi ${name}, this is Ramesh from YantraByte Solutions. A friendly reminder that your outstanding balance of ₹${client.balance_due.toLocaleString('en-IN')} is due. Kindly clear the balance at your earliest convenience via UPI: s0424237152@slc or our bank account details. Thank you!`;
      const encoded = encodeURIComponent(text);
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
      showToast('Opening WhatsApp reminder chat...');
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">YantraByte Solutions • Enterprise Ledger</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Real-time financial collection ledger and workshop diagnostics tracking</p>
        </div>

        {/* --- PREMIUM FINANCIAL KPI CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Total Invoiced</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">₹{totalInvoiced.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-[#64748B] mt-1">Sum of lifetime generated invoices</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Realized Revenue</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">₹{collectedAmount.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-[#64748B] mt-1">Total cash successfully collected</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-rose-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Outstanding Balance</span>
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono font-bold">₹{outstandingDues.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-[#64748B] mt-1">Pending payments collection backlog</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Active Service Tickets</span>
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">{pendingTickets}</div>
            <p className="text-[10px] text-[#64748B] mt-1">{openTickets} open • {inProgressTickets} in-progress</p>
          </div>
        </div>

        {/* --- SECOND LEVEL DETAILS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Outstanding Receivables Ledger */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-[380px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-md font-semibold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                Outstanding Dues Ledger ({outstandingClients.length})
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono">Backlog dues list</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {outstandingClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <div className="font-semibold text-white text-sm">{client.customer_name}</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">Dues for: {client.invoices.join(', ')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-rose-400">₹{client.balance_due.toLocaleString('en-IN')}</span>
                    {client.customer_phone && (
                      <button
                        onClick={() => sendDuesReminder(client)}
                        className="p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] transition-all hover:scale-105"
                        title="Send Dues Reminder WhatsApp Alert"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {outstandingClients.length === 0 && (
                <div className="text-sm text-[#64748B] italic text-center py-10">Excellent! No outstanding balances left!</div>
              )}
            </div>
          </div>

          {/* Workshop Tickets Status Breakdown */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-[380px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-md font-semibold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                Service Tickets Status Board
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold font-mono">Live diagnostics</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                  <span>Open & Registered</span>
                  <span className="font-mono font-semibold">{openTickets}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full" style={{ width: `${financialTickets.length ? (openTickets / financialTickets.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                  <span>In Diagnostic/Repair Progress</span>
                  <span className="font-mono font-semibold">{inProgressTickets}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${financialTickets.length ? (inProgressTickets / financialTickets.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                  <span>Completed (Awaiting Pickup)</span>
                  <span className="font-mono font-semibold">{completedTickets}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${financialTickets.length ? (completedTickets / financialTickets.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                  <span>Closed & Delivered</span>
                  <span className="font-mono font-semibold">{closedTickets}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-gray-400 h-full rounded-full" style={{ width: `${financialTickets.length ? (closedTickets / financialTickets.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Diagnostic Workshop Logs Summary list */}
            <div className="mt-5 border-t border-white/5 pt-4 flex-1 overflow-y-auto">
              <div className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold mb-2">Recent Workshop Diagnostics notes</div>
              <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                {financialTickets.filter(t => t.notes).slice(0, 3).map((ticket, idx) => (
                  <div key={idx} className="text-xs p-2 rounded bg-white/[0.02] border border-white/5 text-[#CBD5E1]">
                    <span className="font-semibold text-blue-400 block mb-0.5">{ticket.ticket_number} ({ticket.device_type}):</span>
                    <span className="italic">"{ticket.notes}"</span>
                  </div>
                ))}
                {financialTickets.filter(t => t.notes).length === 0 && (
                  <div className="text-xs text-[#64748B] italic py-2">No diagnostics notes registered recently.</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* --- RECENT INVOICES LEDGER TIMELINE --- */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0EA5E9]" />
              Recent Billing Transactions
            </h3>
            <button
              onClick={() => setActiveSection('billing')}
              className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7] transition-all flex items-center gap-1 hover:underline"
            >
              Go to Billing panel <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-[#94A3B8] uppercase">
                  <th className="py-3 px-4 font-semibold">Document No</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Doc Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Dues Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {financialInvoices.slice(0, 5).map((inv, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-white">{inv.invoice_no}</td>
                    <td className="py-3 px-4 text-[#CBD5E1]">{inv.customer_name}</td>
                    <td className="py-3 px-4 text-xs text-[#94A3B8]">{inv.date}</td>
                    <td className="py-3 px-4">
                      {inv.doc_type === 'Quotation' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">Quote</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Invoice</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">₹{(inv.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right">
                      {inv.doc_type === 'Quotation' ? (
                        <span className="text-xs text-[#64748B]">—</span>
                      ) : (inv.balance_due || 0) <= 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase font-mono">Paid</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono">₹{(inv.balance_due || 0).toLocaleString('en-IN')} due</span>
                      )}
                    </td>
                  </tr>
                ))}
                {financialInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-sm text-[#64748B] italic text-center">No billing transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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
          <div className="flex items-center gap-3">
            {activeSection === 'tickets' && (
              <button
                onClick={syncFromGoogleSheet}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync from Google Form
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
                {filteredData.map((item, i) => (
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
                                  onClick={() => printJobSheet(item)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748B] hover:text-emerald-400 transition-all"
                                  title="Print Job Sheet / Drop-off Receipt"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
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
                  <input
                    type="text"
                    value={String(formData[field.key] || '')}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={String(formData[field.key] || '')}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={field.rows || 4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]/50 focus:ring-1 focus:ring-[#0EA5E9]/25 transition-all resize-none font-mono"
                  />
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
                      {formData[field.key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
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
    if (activeSection === 'billing') return <BillingSoftware initialAutofillTicket={autofillTicket} onClearAutofill={() => setAutofillTicket(null)} />;
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
                onClick={() => { setActiveSection(item.section); setSearchQuery(''); setShowForm(false); }}
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
              <p className="text-[#64748B] text-xs">Manage your website content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
