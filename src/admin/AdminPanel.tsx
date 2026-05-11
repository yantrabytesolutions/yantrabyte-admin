import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Service, Product, Testimonial, BlogPost, TeamMember, Career,
  Industry, FAQ, GalleryImage, ClientLogo, SiteSetting, ContactSubmission, Page,
} from '../types';
import {
  LayoutDashboard, FileText, Wrench, Package, MessageSquareQuote, PenTool,
  Users, Briefcase, Building2, HelpCircle, Image, Award, Mail, Settings,
  LogOut, Plus, Pencil, Trash2, X, Eye, EyeOff, ChevronDown, Save,
  Loader2, AlertCircle, CheckCircle, Search, RefreshCw, Menu,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type Section =
  | 'dashboard' | 'pages' | 'services' | 'products' | 'testimonials'
  | 'blog' | 'team' | 'careers' | 'industries' | 'faqs' | 'gallery'
  | 'client-logos' | 'contacts' | 'settings';

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

  useEffect(() => {
    if (session && activeSection !== 'dashboard') {
      fetchData(activeSection);
    }
  }, [session, activeSection, fetchData]);

  // --- Dashboard Stats ---
  const [stats, setStats] = useState<Record<string, number>>({});
  useEffect(() => {
    if (session && activeSection === 'dashboard') {
      const tables = ['services', 'blog_posts', 'testimonials', 'contact_submissions', 'pages', 'products', 'team_members', 'careers', 'industries', 'faqs', 'gallery_images', 'client_logos'];
      Promise.all(
        tables.map(t => supabase.from(t).select('id', { count: 'exact', head: true }))
      ).then(results => {
        const s: Record<string, number> = {};
        tables.forEach((t, i) => { s[t] = results[i].count || 0; });
        setStats(s);
      });
    }
  }, [session, activeSection]);

  // --- CRUD ---
  const openAddForm = () => {
    const fields = SECTION_FIELDS[activeSection];
    if (!fields) return;
    setEditingItem(null);
    setFormData(getDefaultForm(fields));
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
      const colors: Record<string, string> = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        read: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        replied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
    const statCards = [
      { label: 'Services', value: stats['services'] || 0, icon: Wrench, color: 'from-[#0EA5E9] to-[#0284C7]' },
      { label: 'Blog Posts', value: stats['blog_posts'] || 0, icon: PenTool, color: 'from-[#8B5CF6] to-[#6D28D9]' },
      { label: 'Testimonials', value: stats['testimonials'] || 0, icon: MessageSquareQuote, color: 'from-[#F59E0B] to-[#D97706]' },
      { label: 'Contact Submissions', value: stats['contact_submissions'] || 0, icon: Mail, color: 'from-[#10B981] to-[#059669]' },
      { label: 'Pages', value: stats['pages'] || 0, icon: FileText, color: 'from-[#EC4899] to-[#DB2777]' },
      { label: 'Products', value: stats['products'] || 0, icon: Package, color: 'from-[#F97316] to-[#EA580C]' },
      { label: 'Team Members', value: stats['team_members'] || 0, icon: Users, color: 'from-[#06B6D4] to-[#0891B2]' },
      { label: 'Careers', value: stats['careers'] || 0, icon: Briefcase, color: 'from-[#8B5CF6] to-[#7C3AED]' },
      { label: 'Industries', value: stats['industries'] || 0, icon: Building2, color: 'from-[#14B8A6] to-[#0D9488]' },
      { label: 'FAQs', value: stats['faqs'] || 0, icon: HelpCircle, color: 'from-[#6366F1] to-[#4F46E5]' },
      { label: 'Gallery Images', value: stats['gallery_images'] || 0, icon: Image, color: 'from-[#E11D48] to-[#BE123C]' },
      { label: 'Client Logos', value: stats['client_logos'] || 0, icon: Award, color: 'from-[#0EA5E9] to-[#0369A1]' },
    ];

    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#0EA5E9]/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-10 flex items-center justify-center`}
                    style={{ background: `linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))` }}
                  >
                    <Icon className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-2xl font-bold text-white">{card.value}</span>
                </div>
                <p className="text-[#94A3B8] text-sm">{card.label}</p>
              </div>
            );
          })}
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
