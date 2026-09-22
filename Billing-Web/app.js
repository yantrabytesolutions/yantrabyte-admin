const SUPABASE_URL = 'https://eyajwjrafudarccvcada.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

async function supabaseFetch(endpoint, options = {}) {
  const url = SUPABASE_URL + endpoint;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error('Supabase Error: ' + await res.text());
  return res.json();
}

let customers = [];
let items = [];
let purItems = [];
let editInvoiceNo = null;
let editPurchaseNo = null;

function normalizeText(value) { return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function fmtINR(n) { return '\u20B9' + Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 2}); }
function setStatus(msg, type) { const el = document.getElementById('status'); el.textContent = msg; el.className = 'status' + (type ? ' ' + type : ''); }
function setPurStatus(msg, type) { const el = document.getElementById('purStatus'); el.textContent = msg; el.className = 'status green-border' + (type ? ' ' + type : ''); }

function switchTab(tab) {
  document.getElementById('panelSales').classList.remove('active');
  document.getElementById('panelPurchase').classList.remove('active');
  document.getElementById('tabSales').classList.remove('active', 'active-purchase');
  document.getElementById('tabPurchase').classList.remove('active', 'active-purchase');

  if (tab === 'sales') {
    document.getElementById('panelSales').classList.add('active');
    document.getElementById('tabSales').classList.add('active');
  } else {
    document.getElementById('panelPurchase').classList.add('active');
    document.getElementById('tabPurchase').classList.add('active-purchase');
    refreshPurchaseList();
  }
}

// ==== CUSTOMERS & INVOICES ====
async function loadCustomers() {
  try {
    const data = await supabaseFetch('/rest/v1/invoices?select=customerName,phone,email,address');
    const map = {};
    data.forEach(row => { if (row.customerName && !map[row.customerName]) map[row.customerName] = row; });
    customers = Object.values(map);
    
    const sel = document.getElementById('customerName');
    sel.innerHTML = '<option value="">— Select Customer —</option>';
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.customerName;
      opt.textContent = c.customerName;
      sel.appendChild(opt);
    });
    setStatus('Loaded ' + customers.length + ' customers.', 'success');
  } catch(e) { setStatus('Error: ' + e.message, 'error'); }
}

document.getElementById('customerName').addEventListener('change', function() {
  const selected = normalizeText(this.value);
  const c = customers.find(x => normalizeText(x.customerName) === selected);
  if (c) {
    document.getElementById('phone').value = c.phone || '';
    document.getElementById('email').value = c.email || '';
    document.getElementById('address').value = c.address || '';
  } else {
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
  }
});

function addItem() {
  const desc = document.getElementById('itemDesc').value.trim();
  const qty = Number(document.getElementById('itemQty').value || 0);
  const rate = Number(document.getElementById('itemRate').value || 0);
  if(!desc || qty<=0) return;
  items.push({ description: desc, qty, rate });
  renderItems();
  document.getElementById('itemDesc').value = '';
  document.getElementById('itemQty').value = 1;
  document.getElementById('itemRate').value = 0;
}

function clearItems() { items = []; renderItems(); }

function renderItems() {
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  if (!items.length) return tbody.innerHTML = '<tr><td colspan="5" align="center">No items</td></tr>';
  let total = 0;
  items.forEach((it, i) => {
    const amt = it.qty * it.rate; total += amt;
    tbody.innerHTML += '<tr><td align="center">+(i+1)+</td><td>+it.description+</td><td align="center">+it.qty+</td><td align="right">+fmtINR(it.rate)+</td><td align="right">+fmtINR(amt)+</td></tr>';
  });
  tbody.innerHTML += '<tr><td colspan="4" align="right"><b>Subtotal</b></td><td align="right"><b>+fmtINR(total)+</b></td></tr>';
}

async function refreshInvoiceList() {
  try {
    const data = await supabaseFetch('/rest/v1/invoices?select=*&order=id.desc');
    const sel = document.getElementById('editInvoiceSelect');
    sel.innerHTML = '<option value="">— Select Invoice to Edit —</option>';
    data.forEach(inv => {
      const opt = document.createElement('option');
      opt.value = inv.invoiceNo;
      opt.textContent = inv.invoiceNo + ' | ' + inv.customerName + ' | ' + fmtINR(inv.grandTotal);
      sel.appendChild(opt);
    });
  } catch(e) {}
}

async function saveInvoice() {
  // Logic to save invoice directly to Supabase via fetch (No Google Apps Script)
  const docType = document.querySelector('input[name="docType"]:checked').value;
  const subtotal = items.reduce((s, it) => s + (it.qty * it.rate), 0);
  const discount = Number(document.getElementById('discount').value || 0);
  const tax = Number(document.getElementById('tax').value || 0);
  const advancePaid = Number(document.getElementById('advancePaid').value || 0);
  const grandTotal = Math.round(subtotal - discount + tax);
  const balance = grandTotal - advancePaid;
  const itemsText = items.map((it, i) => (i+1)+'. '+it.description+' | Qty: '+it.qty+' | Rate: '+it.rate).join('\n');

  try {
    setStatus('Saving invoice to Supabase...');
    let invNo = editInvoiceNo;
    if (invNo) {
      await supabaseFetch('/rest/v1/invoices?invoiceNo=eq.'+invNo, {
        method: 'PATCH',
        body: JSON.stringify({
          customerName: document.getElementById('customerName').value,
          phone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          address: document.getElementById('address').value,
          itemsText, subtotal, discount, tax, grandTotal, advancePaid, balance
        })
      });
    } else {
      const idData = await supabaseFetch('/rest/v1/invoices?select=id');
      const seq = (idData.length || 0) + 1;
      const d = new Date();
      invNo = 'YBS-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(seq).padStart(3,'0');
      
      await supabaseFetch('/rest/v1/invoices', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          date: d.toLocaleDateString('en-GB'),
          invoiceNo: invNo,
          customerName: document.getElementById('customerName').value,
          phone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          address: document.getElementById('address').value,
          itemsText, subtotal, discount, tax, grandTotal, advancePaid, balance
        })
      });
    }
    
    document.getElementById('invoiceNoDisplay').textContent = invNo;
    document.getElementById('invoiceBadge').classList.add('show');
    setStatus('Invoice saved! ' + invNo, 'success');
    refreshInvoiceList();
  } catch (e) {
    setStatus('Error: ' + e.message, 'error');
  }
}

async function loadSavedInvoice() {
  const invNo = document.getElementById('editInvoiceSelect').value;
  if(!invNo) return;
  try {
    setStatus('Loading...');
    const data = await supabaseFetch('/rest/v1/invoices?invoiceNo=eq.'+invNo);
    const inv = data[0];
    document.getElementById('customerName').value = inv.customerName || '';
    document.getElementById('phone').value = inv.phone || '';
    document.getElementById('email').value = inv.email || '';
    document.getElementById('address').value = inv.address || '';
    document.getElementById('discount').value = inv.discount || 0;
    document.getElementById('tax').value = inv.tax || 0;
    document.getElementById('advancePaid').value = inv.advancePaid || 0;
    
    items = [];
    if(inv.itemsText) {
      inv.itemsText.split('\n').forEach(line => {
        const parts = line.split('|');
        if(parts.length > 0) {
           const desc = parts[0].replace(/^\d+\.\s*/,'').trim();
           let qty = 1, rate = 0;
           for(let i=1; i<parts.length; i++) {
             if (parts[i].toLowerCase().includes('qty:')) qty = Number(parts[i].split(':')[1].trim());
             if (parts[i].toLowerCase().includes('rate:')) rate = Number(parts[i].split(':')[1].trim());
           }
           items.push({description: desc, qty, rate});
        }
      });
    }
    renderItems();
    editInvoiceNo = inv.invoiceNo;
    document.getElementById('editInvDisplay').textContent = inv.invoiceNo;
    document.getElementById('editModeBadge').classList.add('show');
    setStatus('Loaded ' + inv.invoiceNo, 'success');
  } catch(e) { setStatus('Error: '+e.message, 'error'); }
}

function cancelEdit() {
  editInvoiceNo = null;
  document.getElementById('editModeBadge').classList.remove('show');
  clearItems();
}

async function generateInvoice() {
  const docType = document.querySelector('input[name="docType"]:checked').value;
  const subtotal = items.reduce((s, it) => s + (it.qty * it.rate), 0);
  const discount = Number(document.getElementById('discount').value || 0);
  const tax = Number(document.getElementById('tax').value || 0);
  const advancePaid = Number(document.getElementById('advancePaid').value || 0);
  const grandTotal = Math.round(subtotal - discount + tax);
  const balance = grandTotal - advancePaid;
  const itemsText = items.map((it, i) => (i+1)+'. '+it.description+' | Qty: '+it.qty+' | Rate: '+it.rate).join('\n');
  
  if (!document.getElementById('customerName').value || items.length === 0) {
    setStatus('Please select customer and add items.', 'error'); return;
  }

  try {
    setStatus('Generating PDF and Saving...');
    
    // 1. Get or Generate ID
    let invNo = editInvoiceNo;
    const d = new Date();
    if (!invNo) {
      const idData = await supabaseFetch('/rest/v1/invoices?select=id');
      const seq = (idData.length || 0) + 1;
      invNo = 'YBS-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(seq).padStart(3,'0');
    }

    // 2. Populate Template
    document.getElementById('pdf-doc-title').innerText = docType.toUpperCase();
    document.getElementById('pdf-inv-no').innerText = invNo;
    document.getElementById('pdf-date').innerText = d.toLocaleDateString('en-GB');
    document.getElementById('pdf-cust-name').innerText = document.getElementById('customerName').value;
    document.getElementById('pdf-cust-phone').innerText = document.getElementById('phone').value;
    document.getElementById('pdf-cust-email').innerText = document.getElementById('email').value;
    document.getElementById('pdf-cust-address').innerText = document.getElementById('address').value;
    
    document.getElementById('pdf-subtotal').innerText = fmtINR(subtotal);
    document.getElementById('pdf-discount').innerText = fmtINR(discount);
    document.getElementById('pdf-tax').innerText = fmtINR(tax);
    document.getElementById('pdf-grand').innerText = fmtINR(grandTotal);
    document.getElementById('pdf-advance').innerText = fmtINR(advancePaid);
    document.getElementById('pdf-balance').innerText = fmtINR(balance);
    
    const upiString = 'upi://pay?pa=s0424237152@slc&pn=YantraByte%20Solutions&am=' + grandTotal;
    const qrImg = document.getElementById('pdf-qr');
    const qrContainer = document.getElementById('pdf-qr-container');
    if (qrImg) {
      qrImg.onerror = function() {
        if (qrContainer) qrContainer.style.display = 'none';
      };
      qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(upiString);
    }

    let tbody = '';
    items.forEach((it, i) => {
      tbody += '<tr><td style="border: 1px solid #000; padding: 8px; text-align: center;">'+(i+1)+'</td>';
      tbody += '<td style="border: 1px solid #000; padding: 8px;">'+it.description+'</td>';
      tbody += '<td style="border: 1px solid #000; padding: 8px; text-align: center;">'+it.qty+'</td>';
      tbody += '<td style="border: 1px solid #000; padding: 8px; text-align: right;">'+fmtINR(it.rate)+'</td>';
      tbody += '<td style="border: 1px solid #000; padding: 8px; text-align: right;">'+fmtINR(it.qty*it.rate)+'</td></tr>';
    });
    document.getElementById('pdf-items').innerHTML = tbody;

    // 3. Generate PDF Blob
    const element = document.getElementById('pdf-template');
    element.style.display = 'block';
    
    const opt = {
      margin:       0.5,
      filename:     invNo + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    element.style.display = 'none';

    // 4. Upload to Supabase Storage
    const bucket = 'invoices';
    const filePath = encodeURIComponent(invNo + '.pdf');
    const storageRes = await fetch(SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + filePath, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/pdf'
      },
      body: pdfBlob
    });
    
    const pdfUrl = SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + filePath;

    // 5. Save to Database
    const dbPayload = {
      customerName: document.getElementById('customerName').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
      address: document.getElementById('address').value,
      itemsText, subtotal, discount, tax, grandTotal, advancePaid, balance, pdfUrl
    };

    if (editInvoiceNo) {
      await supabaseFetch('/rest/v1/invoices?invoiceNo=eq.'+invNo, {
        method: 'PATCH', body: JSON.stringify(dbPayload)
      });
    } else {
      dbPayload.date = d.toLocaleDateString('en-GB');
      dbPayload.invoiceNo = invNo;
      await supabaseFetch('/rest/v1/invoices', {
        method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(dbPayload)
      });
    }
    
    document.getElementById('invoiceNoDisplay').textContent = invNo;
    document.getElementById('invoiceBadge').classList.add('show');
    setStatus('PDF Generated and Saved! ' + invNo, 'success');
    refreshInvoiceList();
    
    // Open PDF
    window.open(pdfUrl, '_blank');

  } catch (e) {
    document.getElementById('pdf-template').style.display = 'none';
    setStatus('Error: ' + e.message, 'error');
  }
}

window.onload = function() {
  loadCustomers();
  refreshInvoiceList();
};


