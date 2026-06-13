import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Package } from 'lucide-react';

export default function InventoryMovement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchTransactions(selectedProductId);
    } else {
      setTransactions([]);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchTransactions = async (productId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('product_id', productId)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  let runningStock = 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Movement</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Products</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {products.map(prod => (
              <div 
                key={prod.id} 
                onClick={() => setSelectedProductId(prod.id)}
                className={`p-3 rounded border cursor-pointer transition-colors ${selectedProductId === prod.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
              >
                <div className="font-medium text-gray-900">{prod.name}</div>
                <div className="text-xs flex justify-between text-gray-500">
                  <span>Current Stock:</span>
                  <span className={`font-bold ${(prod.stock_count || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>{prod.stock_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
          {!selectedProductId ? (
            <div className="text-center py-20 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Select a product to view its stock ledger.</p>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex justify-between items-end border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{products.find(p => p.id === selectedProductId)?.name}</h2>
                  <p className="text-sm text-gray-500">Stock Item Register</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Closing Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{products.find(p => p.id === selectedProductId)?.stock_count}</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-10">Loading transactions...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600">Inwards</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-red-600">Outwards</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {transactions.map(txn => {
                        const qty = Number(txn.quantity_change);
                        runningStock += qty;
                        return (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">{new Date(txn.transaction_date).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3 text-gray-900 capitalize">
                              {txn.reference_type}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600 font-medium">{qty > 0 ? qty : ''}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium">{qty < 0 ? Math.abs(qty) : ''}</td>
                            <td className="px-4 py-3 text-right font-bold">{runningStock}</td>
                          </tr>
                        );
                      })}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No stock movements found for this product.</td>
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
