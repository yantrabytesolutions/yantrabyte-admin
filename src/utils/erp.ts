import { supabase } from '../lib/supabase';
import { Invoice, Purchase, Expense } from '../types';

export const BILLABLE_DOC_TYPES = ['Invoice', 'Sale Bill', 'Service Bill'] as const;

export const isQuotationDoc = (docType?: string | null): boolean =>
  docType === 'Quotation' || docType === 'Estimate' || docType === 'Quote';

export const isCancelledDoc = (docType?: string | null): boolean =>
  docType === 'Cancelled';

export const isPayableInvoiceDoc = (docType?: string | null): boolean =>
  !isQuotationDoc(docType) && !isCancelledDoc(docType);

export function parseFlexibleDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;

  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toIsoDateString(dateStr?: string | null): string {
  const parsed = parseFlexibleDate(dateStr);
  if (!parsed) return new Date().toISOString().slice(0, 10);
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

  // Remove linked journal entries and inventory transactions; trg_update_stock reverts products.stock_count
  async deleteReferenceEntries(referenceId: string) {
    if (!referenceId) return;
    const { error: jeErr } = await supabase.from('journal_entries').delete().eq('reference_id', referenceId);
    if (jeErr) console.warn('Failed deleting linked journal entries:', jeErr);

    const { error: invErr } = await supabase.from('inventory_transactions').delete().eq('reference_id', referenceId);
    if (invErr) console.warn('Failed deleting linked inventory transactions:', invErr);
  },

  // Record an Invoice Sale
  async recordInvoice(invoice: Invoice) {
    // Always clear previous entries first so updates, cancellations, or conversions to Quotation revert cleanly
    await this.deleteReferenceEntries(invoice.id);

    if (isQuotationDoc(invoice.doc_type) || isCancelledDoc(invoice.doc_type)) {
      return;
    }

    const entryDate = toIsoDateString(invoice.date);
    const accounts = await this.getSystemAccounts();
    const salesAcc = accounts['Sales Revenue'];
    const taxAcc = accounts['Tax Payable'];
    const cashAcc = accounts['Cash/Bank'];

    // 1. Journal Entries (only when chart of accounts is configured)
    if (salesAcc) {
      let customerAccId = null;
      if (invoice.customer_id) {
        const { data: cust } = await supabase.from('customers').select('account_id').eq('id', invoice.customer_id).single();
        customerAccId = cust?.account_id;
        if (!customerAccId) {
          const { data: newAcc } = await supabase.from('accounts').insert([{ name: `Customer: ${invoice.customer_name}`, account_type: 'Asset' }]).select('id').single();
          if (newAcc) {
            customerAccId = newAcc.id;
            await supabase.from('customers').update({ account_id: customerAccId }).eq('id', invoice.customer_id);
          }
        }
      }

      if (customerAccId) {
        const { data: je } = await supabase.from('journal_entries').insert([{
          date: entryDate,
          description: `Invoice Sale #${invoice.invoice_no}`,
          reference_type: 'invoice',
          reference_id: invoice.id
        }]).select('id').single();

        if (je) {
          const grandTotal = Number(invoice.grand_total) || 0;
          const taxAmount = Math.max(0, Number(invoice.tax) || 0);
          const netRevenue = Math.max(0, Number((grandTotal - taxAmount).toFixed(2)));
          const lines = [
            { journal_entry_id: je.id, account_id: customerAccId, debit: grandTotal, credit: 0 },
            { journal_entry_id: je.id, account_id: salesAcc, debit: 0, credit: netRevenue }
          ];
          if (taxAmount > 0 && taxAcc) {
            lines.push({ journal_entry_id: je.id, account_id: taxAcc, debit: 0, credit: taxAmount });
          }
          await supabase.from('journal_entry_lines').insert(lines);
        }

        if ((Number(invoice.advance_paid) || 0) > 0 && cashAcc) {
          const advanceAmount = Number(invoice.advance_paid) || 0;
          const { data: recJe } = await supabase.from('journal_entries').insert([{
            date: entryDate,
            description: `Advance Receipt for #${invoice.invoice_no}`,
            reference_type: 'payment',
            reference_id: invoice.id
          }]).select('id').single();

          if (recJe) {
            await supabase.from('journal_entry_lines').insert([
              { journal_entry_id: recJe.id, account_id: cashAcc, debit: advanceAmount, credit: 0 },
              { journal_entry_id: recJe.id, account_id: customerAccId, debit: 0, credit: advanceAmount }
            ]);
          }
        }
      }
    }

    // 2. Inventory Transactions (PostgreSQL trg_update_stock updates products.stock_count)
    const invTransactions = (invoice.items || [])
      .filter(item => Boolean(item.product_id) && Number(item.qty) > 0)
      .map(item => ({
        product_id: item.product_id,
        transaction_date: entryDate,
        quantity_change: -Math.abs(Number(item.qty)),
        reference_type: 'invoice',
        reference_id: invoice.id,
        unit_cost: Number(item.rate) || 0
      }));

    if (invTransactions.length > 0) {
      await supabase.from('inventory_transactions').insert(invTransactions);
    }
  },

  // Record an Expense
  async recordExpense(expense: Expense) {
    await this.deleteReferenceEntries(expense.id);

    const accounts = await this.getSystemAccounts();
    const cashAcc = accounts['Cash/Bank'];
    let expenseAcc = accounts[expense.category] || accounts['Operational Expenses'];

    if (!expenseAcc) {
      const { data: newAcc } = await supabase.from('accounts').insert([{ name: expense.category, account_type: 'Expense' }]).select('id').single();
      if (newAcc) expenseAcc = newAcc.id;
    }

    if (!cashAcc || !expenseAcc) return;

    const { data: je } = await supabase.from('journal_entries').insert([{
      date: toIsoDateString(expense.date),
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
    // Always clear previous entries first so edits or switches from Bill -> PO revert cleanly
    await this.deleteReferenceEntries(purchase.id);

    if (purchase.doc_type === 'PO') {
      return;
    }

    const entryDate = toIsoDateString(purchase.date);
    const accounts = await this.getSystemAccounts();
    const inventoryAcc = accounts['Inventory Asset'];
    const taxAcc = accounts['Tax Payable'];

    if (inventoryAcc) {
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

      if (supplierAccId) {
        const { data: je } = await supabase.from('journal_entries').insert([{
          date: entryDate,
          description: `Purchase #${purchase.purchase_no}`,
          reference_type: 'purchase',
          reference_id: purchase.id
        }]).select('id').single();

        if (je) {
          const grandTotal = Number(purchase.grand_total) || 0;
          const taxAmount = Math.max(0, Number(purchase.tax) || 0);
          const netInventory = Math.max(0, Number((grandTotal - taxAmount).toFixed(2)));
          const lines = [
            { journal_entry_id: je.id, account_id: inventoryAcc, debit: netInventory, credit: 0 },
            { journal_entry_id: je.id, account_id: supplierAccId, debit: 0, credit: grandTotal }
          ];
          if (taxAmount > 0 && taxAcc) {
            lines.push({ journal_entry_id: je.id, account_id: taxAcc, debit: taxAmount, credit: 0 });
          }
          await supabase.from('journal_entry_lines').insert(lines);
        }
      }
    }

    // Inventory Transactions (PostgreSQL trg_update_stock updates products.stock_count)
    const invTransactions = (purchase.items || [])
      .filter(item => Boolean(item.product_id) && Number(item.qty) > 0)
      .map(item => ({
        product_id: item.product_id,
        transaction_date: entryDate,
        quantity_change: Math.abs(Number(item.qty)),
        reference_type: 'purchase',
        reference_id: purchase.id,
        unit_cost: Number(item.rate) || 0
      }));

    if (invTransactions.length > 0) {
      await supabase.from('inventory_transactions').insert(invTransactions);
    }
  }
};
