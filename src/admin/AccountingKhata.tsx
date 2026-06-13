import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Account } from '../types';
import { FileText } from 'lucide-react';

export default function AccountingKhata() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchLedger(selectedAccountId);
    } else {
      setLedgerLines([]);
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*').order('name');
    if (!error && data) {
      setAccounts(data);
    }
  };

  const fetchLedger = async (accountId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        id, debit, credit, created_at,
        journal_entries ( id, date, description, reference_type, reference_id )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setLedgerLines(data);
    }
    setLoading(false);
  };

  let runningBalance = 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Khata (Ledgers)</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Chart of Accounts</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {accounts.map(acc => (
              <div 
                key={acc.id} 
                onClick={() => setSelectedAccountId(acc.id)}
                className={`p-3 rounded border cursor-pointer transition-colors ${selectedAccountId === acc.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
              >
                <div className="font-medium text-gray-900">{acc.name}</div>
                <div className="text-xs text-gray-500">{acc.account_type}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
          {!selectedAccountId ? (
            <div className="text-center py-20 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Select an account to view its ledger.</p>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex justify-between items-end border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{accounts.find(a => a.id === selectedAccountId)?.name}</h2>
                  <p className="text-sm text-gray-500">{accounts.find(a => a.id === selectedAccountId)?.account_type} Account</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-10">Loading ledger...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-red-600">Debit (Dr)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600">Credit (Cr)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {ledgerLines.map(line => {
                        runningBalance += (Number(line.debit) - Number(line.credit));
                        return (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">{line.journal_entries?.date ? new Date(line.journal_entries.date).toLocaleDateString('en-IN') : '-'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              <div className="font-medium">{line.journal_entries?.description}</div>
                              <div className="text-xs text-gray-400 capitalize">{line.journal_entries?.reference_type}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{Number(line.debit) > 0 ? `₹${Number(line.debit).toLocaleString('en-IN')}` : ''}</td>
                            <td className="px-4 py-3 text-right text-green-600 whitespace-nowrap">{Number(line.credit) > 0 ? `₹${Number(line.credit).toLocaleString('en-IN')}` : ''}</td>
                            <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                              {Math.abs(runningBalance).toLocaleString('en-IN')} {runningBalance > 0 ? 'Dr' : runningBalance < 0 ? 'Cr' : ''}
                            </td>
                          </tr>
                        );
                      })}
                      {ledgerLines.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No transactions found for this account.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
