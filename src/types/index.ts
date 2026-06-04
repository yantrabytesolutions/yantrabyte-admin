export interface Service {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  icon: string;
  features: string[];
  benefits: string[];
  meta_title: string;
  meta_description: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  image_url: string;
  features: string[];
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  stock_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  rating: number;
  content: string;
  avatar_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  published_at: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Career {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  location: string;
  type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  before_url: string;
  after_url: string;
  category: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  logo_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  page_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  device_type: string;
  issue_description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  notes?: string;
  technician_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  product_id?: string;
  description: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  doc_type: string;
  date: string;
  customer_id?: string | null;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  round_off: number;
  grand_total: number;
  advance_paid: number;
  balance_due: number;
  payment_mode?: string;
  payment_status?: string;
  due_date?: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  created_at: string;
}

export interface PurchaseItem {
  product_id?: string;
  description: string;
  qty: number;
  rate: number;
}

export interface Purchase {
  id: string;
  purchase_no: string;
  supplier_id: string | null;
  supplier_name: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  round_off: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  created_at: string;
}

export interface AmcContract {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'renewed' | 'requested';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
}

export interface ExternalRepair {
  id: string;
  ticket_number: string | null;
  material_name: string;
  serial_number: string | null;
  sent_to: string;
  sent_date: string;
  expected_return_date: string | null;
  status: 'sent' | 'received' | 'cancelled';
  received_date: string | null;
  cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
