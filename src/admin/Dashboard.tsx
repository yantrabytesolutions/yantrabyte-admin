import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, subMonths, startOfMonth, parseISO } from 'date-fns';
import { Invoice, Purchase, ServiceTicket } from '../types';
import { AlertCircle, IndianRupee, TrendingDown, Clock, CheckCircle, Receipt, MessageSquare, Mail, Loader2, FileText } from 'lucide-react';
import CustomerLedgerModal from './components/CustomerLedgerModal';

interface OutstandingClient {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  balance_due: number;
  invoices: string[];
}

interface OutstandingSupplier {
  supplier_name: string;
  balance_due: number;
  purchases: string[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardProps {
  onNavigate?: (section: string, params?: any) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ticketStatusData, setTicketStatusData] = useState<any[]>([]);
  const [outstandingClients, setOutstandingClients] = useState<OutstandingClient[]>([]);
  const [outstandingSuppliers, setOutstandingSuppliers] = useState<OutstandingSupplier[]>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [ledgerCustomerName, setLedgerCustomerName] = useState<string | null>(null);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [activeTickets, setActiveTickets] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch data for the last 6 months
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();
      
      const [invoicesRes, purchasesRes, ticketsRes, productsRes] = await Promise.all([
        supabase.from('invoices').select('*').gte('created_at', sixMonthsAgo),
        supabase.from('purchases').select('*').gte('created_at', sixMonthsAgo),
        supabase.from('service_tickets').select('*'),
        supabase.from('products').select('*')
      ]);

      const invoices = (invoicesRes.data || []) as Invoice[];
      const purchases = (purchasesRes.data || []) as Purchase[];
      const tickets = (ticketsRes.data || []) as ServiceTicket[];
      const products = (productsRes.data || []);
      
      setLowStockProducts(products.filter(p => typeof p.stock_count === 'number' && p.stock_count < 5));

      // Calculate totals
      let rev = 0;
      let out = 0;
      let invCount = 0;
      invoices.forEach(inv => {
        if (inv.doc_type === 'Invoice') {
          rev += Number(inv.grand_total) || 0;
          out += Number(inv.balance_due) || 0;
          invCount++;
        }
      });
      setTotalRevenue(rev);
      setTotalOutstanding(out);
      setTotalInvoices(invCount);

      let exp = 0;
      purchases.forEach(pur => {
        exp += Number(pur.grand_total) || 0;
      });
      setTotalExpenses(exp);

      setActiveTickets(tickets.filter(t => t.status !== 'closed').length);

      // Get list of outstanding clients
      const clients = invoices
        .filter(inv => inv.doc_type === 'Invoice' && (inv.balance_due || 0) > 0)
        .reduce((acc: OutstandingClient[], inv) => {
          const name = String(inv.customer_name || 'Customer');
          const phone = String(inv.phone || '');
          const email = String(inv.email || '');
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
              customer_email: email,
              balance_due: due,
              invoices: [inv.invoice_no]
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.balance_due - a.balance_due);
      setOutstandingClients(clients);

      // Get list of outstanding suppliers (Sundry Creditors)
      const suppliers = purchases
        .filter(pur => (pur.balance_due || 0) > 0)
        .reduce((acc: OutstandingSupplier[], pur) => {
          const name = String(pur.supplier_name || 'Vendor');
          const due = pur.balance_due || 0;
          
          const existing = acc.find(s => s.supplier_name?.toLowerCase() === name.toLowerCase());
          if (existing) {
            existing.balance_due += due;
            if (!existing.purchases.includes(pur.purchase_no)) {
              existing.purchases.push(pur.purchase_no);
            }
          } else {
            acc.push({
              supplier_name: name,
              balance_due: due,
              purchases: [pur.purchase_no]
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.balance_due - a.balance_due);
      setOutstandingSuppliers(suppliers);

      // Aggregate revenue and expenses by month
      const monthlyData: Record<string, { month: string; revenue: number; expenses: number; tickets: number }> = {};
      
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const monthLabel = format(d, 'MMM yyyy');
        monthlyData[monthLabel] = { month: monthLabel, revenue: 0, expenses: 0, tickets: 0 };
      }

      invoices.filter(i => i.doc_type === 'Invoice').forEach(inv => {
        if (!inv.created_at) return;
        const monthLabel = format(parseISO(inv.created_at), 'MMM yyyy');
        if (monthlyData[monthLabel]) {
          monthlyData[monthLabel].revenue += Number(inv.grand_total) || 0;
        }
      });

      purchases.forEach(pur => {
        if (!pur.created_at) return;
        const monthLabel = format(parseISO(pur.created_at), 'MMM yyyy');
        if (monthlyData[monthLabel]) {
          monthlyData[monthLabel].expenses += Number(pur.grand_total) || 0;
        }
      });

      // Aggregate ticket statuses and monthly trends
      const statusCount: Record<string, number> = {
        'open': 0,
        'in-progress': 0,
        'completed': 0,
        'closed': 0
      };
      tickets.forEach(t => {
        const s = t.status || 'open';
        if (statusCount[s] !== undefined) statusCount[s]++;
        
        if (t.created_at) {
          const monthLabel = format(parseISO(t.created_at), 'MMM yyyy');
          if (monthlyData[monthLabel]) {
            monthlyData[monthLabel].tickets++;
          }
        }
      });
      
      setRevenueData(Object.values(monthlyData));
      setTicketStatusData(Object.keys(statusCount).map(key => ({
        name: key.toUpperCase(),
        value: statusCount[key]
      })));

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  const sendDuesReminder = (client: OutstandingClient) => {
    const name = client.customer_name;
    let phone = client.customer_phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    if (!phone) {
      alert('No phone number available for client');
      return;
    }
    
    const text = `Hi ${name}, this is Ramesh from YantraByte Solutions. A friendly reminder that your outstanding balance of ₹${client.balance_due.toLocaleString('en-IN')} is due. Kindly clear the balance at your earliest convenience via UPI: s0424237152@slc or our bank account details. Thank you!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const sendEmailReminders = async () => {
    if (!window.confirm(`Send email reminders to ${outstandingClients.filter(c => c.customer_email).length} clients?`)) return;
    
    setSendingEmails(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('http://localhost:4000/api/invoices/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ clients: outstandingClients })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send emails');
      
      const successCount = result.results.filter((r: any) => r.ok).length;
      alert(`Successfully sent ${successCount} out of ${result.results.length} reminder emails.`);
    } catch (err: any) {
      alert(err.message || 'Error sending emails');
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial <span className="text-blue-600">Dashboard</span></h2>
          <p className="text-sm text-gray-500">Overview of revenue, expenses, and service operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
           <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><IndianRupee className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase">Total Revenue (6m)</p>
             <h3 className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</h3>
           </div>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
           <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase">Total Expenses (6m)</p>
             <h3 className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString('en-IN')}</h3>
           </div>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
           <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase">Outstanding Dues</p>
             <h3 className="text-2xl font-bold text-amber-600">₹{totalOutstanding.toLocaleString('en-IN')}</h3>
           </div>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
           <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Clock className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase">Active Tickets</p>
             <h3 className="text-2xl font-bold text-gray-900">{activeTickets}</h3>
           </div>
         </div>
         <div 
           className="bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex items-center space-x-4 cursor-pointer hover:bg-blue-50 transition-colors"
           onClick={() => onNavigate && onNavigate('billing', { tab: 'history' })}
         >
           <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Receipt className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase">Generated Invoices</p>
             <h3 className="text-2xl font-bold text-gray-900">{totalInvoices}</h3>
           </div>
         </div>
      </div>
      
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map(p => (
              <div key={p.id} className="bg-white rounded border border-red-100 p-3 flex justify-between items-center shadow-sm">
                <span className="font-medium text-gray-800 text-sm">{p.name}</span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                  {p.stock_count} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="w-full space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue vs Expenses (Last 6 Months)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Service Ticket Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ticketStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ticket Trends (Last 6 Months)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                    <Line type="monotone" dataKey="tickets" name="Tickets Logged" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-500" />
              Sundry Debtors ({outstandingClients.length})
            </h3>
            <button
              onClick={sendEmailReminders}
              disabled={sendingEmails || outstandingClients.length === 0}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {sendingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              {sendingEmails ? 'Sending...' : 'Email Reminders'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {outstandingClients.map((client, i) => (
              <div key={i} className="flex flex-col p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{client.customer_name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Invoices: {client.invoices.join(', ')}</div>
                    {client.customer_email && <div className="text-[10px] text-gray-400">{client.customer_email}</div>}
                  </div>
                  <div 
                    className="font-bold text-rose-500 font-mono text-sm cursor-pointer hover:bg-rose-50 px-2 py-1 rounded"
                    onClick={() => setLedgerCustomerName(client.customer_name)}
                  >
                    ₹{client.balance_due.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    onClick={() => setLedgerCustomerName(client.customer_name)}
                    className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center text-xs font-semibold gap-1"
                    title="View Customer Ledger"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ledger
                  </button>
                  <button
                    onClick={() => sendDuesReminder(client)}
                    className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {outstandingClients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle className="w-10 h-10 text-emerald-100 mb-2" />
                <p className="text-sm">No outstanding dues! All paid.</p>
              </div>
            )}
          </div>
        </div>

        {/* SUNDRY CREDITORS (PAYABLES) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              Sundry Creditors ({outstandingSuppliers.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {outstandingSuppliers.map((supplier, i) => (
              <div key={i} className="flex flex-col p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{supplier.supplier_name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Purchases: {supplier.purchases.join(', ')}</div>
                  </div>
                  <div 
                    className="font-bold text-amber-600 font-mono text-sm cursor-pointer hover:bg-amber-50 px-2 py-1 rounded"
                  >
                    ₹{supplier.balance_due.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
            {outstandingSuppliers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle className="w-10 h-10 text-emerald-100 mb-2" />
                <p className="text-sm">No outstanding payables! All clear.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      </div>

      {ledgerCustomerName && (
        <CustomerLedgerModal
          customerName={ledgerCustomerName}
          customerId={null}
          onClose={() => setLedgerCustomerName(null)}
          onPaymentAdded={() => fetchDashboardData()}
        />
      )}
    </div>
  );
}
