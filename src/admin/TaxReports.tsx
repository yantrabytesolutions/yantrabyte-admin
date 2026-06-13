import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calculator, RefreshCw, IndianRupee } from 'lucide-react';
import { Invoice, Purchase } from '../types';

export default function TaxReports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: invData } = await supabase.from('invoices').select('*').order('date', { ascending: false });
      const { data: purData } = await supabase.from('purchases').select('*').order('date', { ascending: false });
      
      if (invData) setInvoices(invData as Invoice[]);
      if (purData) setPurchases(purData as Purchase[]);
    } catch (error) {
      console.error('Error fetching tax data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // dd/mm/yyyy
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(dateStr);
  };

  const getFilteredData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filterFn = (dateStr: string) => {
      if (period === 'all') return true;
      const d = parseDate(dateStr);
      if (period === 'this_month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      if (period === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      }
      if (period === 'this_year') return d.getFullYear() === currentYear;
      return true;
    };

    // Only include real Invoices (not Quotations) for tax
    const filteredInvoices = invoices.filter(i => (i.doc_type === 'Invoice' || i.doc_type === 'Receipt') && filterFn(i.date));
    const filteredPurchases = purchases.filter(p => filterFn(p.date));

    return { filteredInvoices, filteredPurchases };
  };

  const { filteredInvoices, filteredPurchases } = getFilteredData();

  const totalOutputTax = filteredInvoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
  const totalInputTax = filteredPurchases.reduce((sum, pur) => sum + (pur.tax || 0), 0);
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const totalPurchases = filteredPurchases.reduce((sum, pur) => sum + (pur.subtotal || 0), 0);

  const netTaxLiability = totalOutputTax - totalInputTax;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" /> GST & Tax Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">Calculate your net tax liability automatically based on Sales and Purchases.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => setPeriod('this_month')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === 'this_month' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>This Month</button>
            <button onClick={() => setPeriod('last_month')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === 'last_month' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Last Month</button>
            <button onClick={() => setPeriod('this_year')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === 'this_year' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>This Year</button>
            <button onClick={() => setPeriod('all')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All Time</button>
          </div>
          <button onClick={fetchData} disabled={isLoading} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Output Tax (From Sales)</h3>
          <div className="text-3xl font-bold text-gray-900 flex items-center">
            <IndianRupee className="w-6 h-6 mr-1" />
            {totalOutputTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Collected from {filteredInvoices.length} invoices (₹{totalSales.toLocaleString('en-IN')} sales)</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Input Tax (From Purchases)</h3>
          <div className="text-3xl font-bold text-gray-900 flex items-center">
            <IndianRupee className="w-6 h-6 mr-1" />
            {totalInputTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Paid on {filteredPurchases.length} purchases (₹{totalPurchases.toLocaleString('en-IN')} purchased)</p>
        </div>

        <div className={`p-6 rounded-xl shadow-sm border ${netTaxLiability > 0 ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${netTaxLiability > 0 ? 'text-blue-800' : 'text-emerald-800'}`}>
            {netTaxLiability > 0 ? 'Net Tax Liability (Payable)' : 'Net Tax Credit (Refundable)'}
          </h3>
          <div className={`text-3xl font-bold flex items-center ${netTaxLiability > 0 ? 'text-blue-900' : 'text-emerald-900'}`}>
            <IndianRupee className="w-6 h-6 mr-1" />
            {Math.abs(netTaxLiability).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p className={`text-xs mt-2 ${netTaxLiability > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
            (Output Tax - Input Tax)
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Tax Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-tl-lg">Date</th>
                <th className="px-4 py-3 font-semibold">Document No</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Party Name</th>
                <th className="px-4 py-3 font-semibold text-right">Taxable Value</th>
                <th className="px-4 py-3 font-semibold text-right">Output Tax (+)</th>
                <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Input Tax (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Combine and sort Invoices and Purchases by date */}
              {[...filteredInvoices.map(i => ({ ...i, isSale: true })), ...filteredPurchases.map(p => ({ ...p, isSale: false }))]
                .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
                .map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.isSale ? item.invoice_no : item.purchase_no}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isSale ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {item.isSale ? 'Sales' : 'Purchase'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.isSale ? item.customer_name : item.supplier_name}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-mono">₹{(item.subtotal || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600 font-mono">
                      {item.isSale && item.tax > 0 ? `+ ₹${item.tax.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600 font-mono">
                      {!item.isSale && item.tax > 0 ? `- ₹${item.tax.toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                ))}
              {filteredInvoices.length === 0 && filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">No tax records found for the selected period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
