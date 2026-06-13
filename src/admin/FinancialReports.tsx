import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Account, JournalEntryLine } from '../types';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

export default function FinancialReports() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ledgerLines, setLedgerLines] = useState<JournalEntryLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [{ data: accData }, { data: linesData }] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('journal_entry_lines').select('*')
      ]);

      if (accData) setAccounts(accData);
      if (linesData) setLedgerLines(linesData);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAccountBalance = (accountId: string, normalBalance: 'Debit' | 'Credit') => {
    const lines = ledgerLines.filter(l => l.account_id === accountId);
    let balance = 0;
    lines.forEach(l => {
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      if (normalBalance === 'Debit') {
        balance += (debit - credit);
      } else {
        balance += (credit - debit);
      }
    });
    return balance;
  };

  const calculateTypeBalance = (type: string, normalBalance: 'Debit' | 'Credit') => {
    const typeAccounts = accounts.filter(a => a.account_type === type);
    return typeAccounts.reduce((sum, acc) => sum + calculateAccountBalance(acc.id, normalBalance), 0);
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  // --- Profit & Loss Calculations ---
  // Revenue (Credit normal)
  const revenueAccounts = accounts.filter(a => a.account_type === 'Revenue');
  const revenueTotal = calculateTypeBalance('Revenue', 'Credit');

  // Expenses (Debit normal)
  const expenseAccounts = accounts.filter(a => a.account_type === 'Expense');
  const expenseTotal = calculateTypeBalance('Expense', 'Debit');

  const grossProfit = revenueTotal; // Simplifying for now without COGS distinction
  const netProfit = grossProfit - expenseTotal;

  // --- Trial Balance Calculations ---
  const trialBalanceData = accounts.map(acc => {
    const isDebitNormal = ['Asset', 'Expense'].includes(acc.account_type);
    const bal = calculateAccountBalance(acc.id, isDebitNormal ? 'Debit' : 'Credit');
    let debit = 0;
    let credit = 0;

    if (bal !== 0) {
      if (isDebitNormal) {
        if (bal > 0) debit = bal; else credit = Math.abs(bal);
      } else {
        if (bal > 0) credit = bal; else debit = Math.abs(bal);
      }
    }

    return { ...acc, debit, credit };
  }).filter(acc => acc.debit !== 0 || acc.credit !== 0);

  const totalDebit = trialBalanceData.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = trialBalanceData.reduce((sum, acc) => sum + acc.credit, 0);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button onClick={fetchFinancialData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Refresh Data
        </button>
      </div>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Total Revenue</h3>
            <TrendingUp className="text-green-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{revenueTotal.toLocaleString('en-IN')}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Total Expenses</h3>
            <TrendingDown className="text-red-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{expenseTotal.toLocaleString('en-IN')}</p>
        </div>

        <div className={`bg-white rounded-lg shadow p-6 border-t-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Net Profit</h3>
            <Activity className={`${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'} w-6 h-6`} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{Math.abs(netProfit).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit & Loss Statement */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Profit & Loss Statement
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wider mb-2 border-b pb-1">Revenue</h3>
                {revenueAccounts.map(acc => {
                  const bal = calculateAccountBalance(acc.id, 'Credit');
                  if (bal === 0) return null;
                  return (
                    <div key={acc.id} className="flex justify-between text-sm py-1">
                      <span>{acc.name}</span>
                      <span>₹{bal.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t text-green-700">
                  <span>Total Revenue</span>
                  <span>₹{revenueTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wider mb-2 border-b pb-1 mt-4">Expenses</h3>
                {expenseAccounts.map(acc => {
                  const bal = calculateAccountBalance(acc.id, 'Debit');
                  if (bal === 0) return null;
                  return (
                    <div key={acc.id} className="flex justify-between text-sm py-1">
                      <span>{acc.name}</span>
                      <span>₹{bal.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t text-red-700">
                  <span>Total Expenses</span>
                  <span>₹{expenseTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className={`flex justify-between font-bold text-lg mt-6 pt-4 border-t-2 ${netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                <span>Net {netProfit >= 0 ? 'Income' : 'Loss'}</span>
                <span>₹{Math.abs(netProfit).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Balance */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Trial Balance
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (Dr)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {trialBalanceData.map(acc => (
                  <tr key={acc.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-900">{acc.name}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{acc.debit > 0 ? `₹${acc.debit.toLocaleString('en-IN')}` : '-'}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{acc.credit > 0 ? `₹${acc.credit.toLocaleString('en-IN')}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 text-left font-bold text-gray-900">Total</td>
                  <td className={`px-6 py-4 text-right font-bold ${totalDebit === totalCredit ? 'text-green-600' : 'text-red-600'}`}>₹{totalDebit.toLocaleString('en-IN')}</td>
                  <td className={`px-6 py-4 text-right font-bold ${totalDebit === totalCredit ? 'text-green-600' : 'text-red-600'}`}>₹{totalCredit.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {totalDebit !== totalCredit && (
            <div className="p-4 bg-red-50 text-red-700 text-sm text-center">
              Trial Balance does not match. Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
