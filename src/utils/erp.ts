import { supabase } from '../lib/supabase';
import { Invoice, Purchase, Expense } from '../types';

export const ERPUtils = {
  // Get core accounts
  async getSystemAccounts() {
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) {
      console.error('Error fetching accounts:', error);
      return {};
    }
    const accounts: Record<string, string> = {};
    data.forEach(acc => {
      accounts[acc.name] = acc.id;
    });
    return accounts;
  },

  // Record an Invoice Sale
  async recordInvoice(invoice: Invoice) {
    const accounts = await this.getSystemAccounts();
    const salesAcc = accounts['Sales Revenue'];
    const taxAcc = accounts['Tax Payable'];
    const cashAcc = accounts['Cash/Bank'];
    
    if (!salesAcc) return; // Ensure accounts exist

    // 1. Get or create Customer Account
    let customerAccId = null;
    if (invoice.customer_id) {
      const { data: cust } = await supabase.from('customers').select('account_id').eq('id', invoice.customer_id).single();
      customerAccId = cust?.account_id;
      if (!customerAccId) {
        // Create ledger for customer
        const { data: newAcc } = await supabase.from('accounts').insert([{ name: `Customer: ${invoice.customer_name}`, account_type: 'Asset' }]).select('id').single();
        if (newAcc) {
          customerAccId = newAcc.id;
          await supabase.from('customers').update({ account_id: customerAccId }).eq('id', invoice.customer_id);
        }
      }
    }

    // Delete any existing journal entries for this invoice to handle updates
    await supabase.from('journal_entries').delete().eq('reference_id', invoice.id);
    await supabase.from('inventory_transactions').delete().eq('reference_id', invoice.id);

    // 2. Journal Entry for the Sale
    const { data: je } = await supabase.from('journal_entries').insert([{
      date: invoice.date || new Date().toISOString(),
      description: `Invoice Sale #${invoice.invoice_no}`,
      reference_type: 'invoice',
      reference_id: invoice.id
    }]).select('id').single();

    if (je && customerAccId) {
      const lines = [
        // Debit Customer (Total amount owed)
        { journal_entry_id: je.id, account_id: customerAccId, debit: invoice.grand_total, credit: 0 },
        // Credit Sales Revenue (Subtotal)
        { journal_entry_id: je.id, account_id: salesAcc, debit: 0, credit: invoice.subtotal }
      ];
      if (invoice.tax > 0 && taxAcc) {
        lines.push({ journal_entry_id: je.id, account_id: taxAcc, debit: 0, credit: invoice.tax });
      }
      await supabase.from('journal_entry_lines').insert(lines);
    }

    // 3. Receipt for Advance Paid (if any)
    if (invoice.advance_paid > 0 && cashAcc && customerAccId) {
      const { data: recJe } = await supabase.from('journal_entries').insert([{
        date: invoice.date || new Date().toISOString(),
        description: `Advance Receipt for #${invoice.invoice_no}`,
        reference_type: 'payment',
        reference_id: invoice.id
      }]).select('id').single();

      if (recJe) {
        await supabase.from('journal_entry_lines').insert([
          { journal_entry_id: recJe.id, account_id: cashAcc, debit: invoice.advance_paid, credit: 0 },
          { journal_entry_id: recJe.id, account_id: customerAccId, debit: 0, credit: invoice.advance_paid }
        ]);
      }
    }

    // 4. Inventory Transactions
    const invTransactions = [];
    for (const item of invoice.items) {
      if (item.product_id) {
        invTransactions.push({
          product_id: item.product_id,
          transaction_date: invoice.date || new Date().toISOString(),
          quantity_change: -Math.abs(item.qty), // Sale reduces stock
          reference_type: 'invoice',
          reference_id: invoice.id,
          unit_cost: item.rate
        });
      }
    }
    if (invTransactions.length > 0) {
      await supabase.from('inventory_transactions').insert(invTransactions);
    }
  },

  // Record an Expense
  async recordExpense(expense: Expense) {
    const accounts = await this.getSystemAccounts();
    const cashAcc = accounts['Cash/Bank'];
    let expenseAcc = accounts[expense.category] || accounts['Operational Expenses'];

    if (!expenseAcc) {
      // Create new expense account dynamically if needed
      const { data: newAcc } = await supabase.from('accounts').insert([{ name: expense.category, account_type: 'Expense' }]).select('id').single();
      if (newAcc) expenseAcc = newAcc.id;
    }

    if (!cashAcc || !expenseAcc) return;

    await supabase.from('journal_entries').delete().eq('reference_id', expense.id);

    const { data: je } = await supabase.from('journal_entries').insert([{
      date: expense.date,
      description: expense.description || `Expense: ${expense.category}`,
      reference_type: 'expense',
      reference_id: expense.id
    }]).select('id').single();

    if (je) {
      await supabase.from('journal_entry_lines').insert([
        { journal_entry_id: je.id, account_id: expenseAcc, debit: expense.amount, credit: 0 },
        { journal_entry_id: je.id, account_id: cashAcc, debit: 0, credit: expense.amount }
      ]);
    }
  },

  // Record a Purchase
  async recordPurchase(purchase: Purchase) {
    const accounts = await this.getSystemAccounts();
    const inventoryAcc = accounts['Inventory Asset'];
    const taxAcc = accounts['Tax Payable'];
    
    if (!inventoryAcc) return;

    // Supplier Ledger
    let supplierAccId = null;
    if (purchase.supplier_id) {
      const { data: supp } = await supabase.from('suppliers').select('account_id').eq('id', purchase.supplier_id).single();
      supplierAccId = supp?.account_id;
      if (!supplierAccId) {
        const { data: newAcc } = await supabase.from('accounts').insert([{ name: `Supplier: ${purchase.supplier_name}`, account_type: 'Liability' }]).select('id').single();
        if (newAcc) {
          supplierAccId = newAcc.id;
          await supabase.from('suppliers').update({ account_id: supplierAccId }).eq('id', purchase.supplier_id);
        }
      }
    }

    await supabase.from('journal_entries').delete().eq('reference_id', purchase.id);
    await supabase.from('inventory_transactions').delete().eq('reference_id', purchase.id);

    // Journal Entry for Purchase
    const { data: je } = await supabase.from('journal_entries').insert([{
      date: purchase.date || new Date().toISOString(),
      description: `Purchase #${purchase.purchase_no}`,
      reference_type: 'purchase',
      reference_id: purchase.id
    }]).select('id').single();

    if (je && supplierAccId) {
      const lines = [
        { journal_entry_id: je.id, account_id: inventoryAcc, debit: purchase.subtotal, credit: 0 },
        { journal_entry_id: je.id, account_id: supplierAccId, debit: 0, credit: purchase.grand_total }
      ];
      if (purchase.tax > 0 && taxAcc) {
        lines.push({ journal_entry_id: je.id, account_id: taxAcc, debit: purchase.tax, credit: 0 }); // Input tax is a debit (Asset/reduces liability)
      }
      await supabase.from('journal_entry_lines').insert(lines);
    }

    // Inventory Transactions (increase stock)
    const invTransactions = [];
    for (const item of purchase.items) {
      if (item.product_id) {
        invTransactions.push({
          product_id: item.product_id,
          transaction_date: purchase.date || new Date().toISOString(),
          quantity_change: Math.abs(item.qty), // Purchase increases stock
          reference_type: 'purchase',
          reference_id: purchase.id,
          unit_cost: item.rate
        });
      }
    }
    if (invTransactions.length > 0) {
      await supabase.from('inventory_transactions').insert(invTransactions);
    }
  }
};
