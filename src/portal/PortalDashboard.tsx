import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Invoice, ServiceTicket } from '../types';
import { FileText, LogOut, Ticket, Receipt, User, Loader2, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { InvoicePdfTemplate } from '../components/InvoicePdfTemplate';

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [customerName, setCustomerName] = useState('');
  
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [activeInvoiceForPdf, setActiveInvoiceForPdf] = useState<Invoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const phone = sessionStorage.getItem('portal_phone');

  useEffect(() => {
    if (!phone) {
      navigate('/portal');
      return;
    }
    fetchData();
  }, [phone, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .ilike('phone', `%${phone}%`)
        .order('created_at', { ascending: false });

      const { data: ticketData } = await supabase
        .from('service_tickets')
        .select('*')
        .ilike('customer_phone', `%${phone}%`)
        .order('created_at', { ascending: false });

      const fetchedInvoices = (invData || []) as Invoice[];
      const fetchedTickets = (ticketData || []) as ServiceTicket[];

      setInvoices(fetchedInvoices);
      setTickets(fetchedTickets);

      if (fetchedInvoices.length > 0) {
        setCustomerName(fetchedInvoices[0].customer_name);
      } else if (fetchedTickets.length > 0) {
        setCustomerName(fetchedTickets[0].customer_name);
      }
    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('portal_phone');
    navigate('/portal');
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (!printRef.current) return;
    setDownloadingInvoiceId(invoice.id);
    setActiveInvoiceForPdf(invoice);

    // Wait for state to update and react to render the template
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      printRef.current.style.display = 'block';
      
      const opt = {
        margin: 0,
        filename: `YBS-${invoice.invoice_no}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 950 },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(printRef.current).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      if (printRef.current) {
        printRef.current.style.display = 'none';
      }
      setDownloadingInvoiceId(null);
      setActiveInvoiceForPdf(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <User className="h-6 w-6 text-teal-600 mr-2" />
              <span className="font-semibold text-xl text-gray-900">
                Welcome, {customerName || 'Customer'}
              </span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition ease-in-out duration-150"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* --- INVOICES SECTION --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-6 h-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">My Invoices</h2>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            {invoices.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-teal-600 truncate">
                          {inv.invoice_no} ({inv.doc_type})
                        </p>
                        <div className="ml-2 flex-shrink-0 flex gap-2">
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingInvoiceId === inv.id}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                          >
                            {downloadingInvoiceId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-teal-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            )}
                            Download PDF
                          </button>
                          <p className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                            (inv.balance_due || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {(inv.balance_due || 0) > 0 ? 'Due' : 'Paid'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Total: ₹{(inv.grand_total || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Balance: ₹{(inv.balance_due || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            Issued on {inv.date ? format(parseISO(inv.date), 'dd MMM yyyy') : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500">No invoices found.</div>
            )}
          </div>
        </section>

        {/* --- TICKETS SECTION --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-6 h-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Service Tickets</h2>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            {tickets.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-teal-600 truncate">
                          Ticket #{ticket.ticket_number} - {ticket.device_type}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.status === 'completed' || ticket.status === 'resolved' || ticket.status === 'closed'
                              ? 'bg-green-100 text-green-800'
                              : ticket.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ticket.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex flex-col">
                          <p className="flex items-center text-sm text-gray-500">
                            Issue: {ticket.issue_description}
                          </p>
                          {ticket.technician_notes && (
                            <p className="mt-1 flex items-center text-sm text-gray-400">
                              Notes: {ticket.technician_notes}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Created {ticket.created_at ? format(parseISO(ticket.created_at), 'dd MMM yyyy') : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500">No service tickets found.</div>
            )}
          </div>
        </section>

      </div>

      {/* Hidden Invoice Template for PDF Generation */}
      <div style={{ display: 'none' }}>
        {activeInvoiceForPdf && (
          <InvoicePdfTemplate 
            ref={printRef} 
            invoice={activeInvoiceForPdf} 
          />
        )}
      </div>
    </div>
  );
}
