// =============================================
// SEARCH — invoices and tickets
// =============================================
function searchInvoices(query) {
  if (!query || !String(query).trim()) return getSavedInvoices();
  var sh = getOrCreateInvoiceSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var q = String(query).toLowerCase().trim();
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var invNo = String(r[1]||'').trim();
    if (!invNo) continue;
    var searchStr = (String(r[0]||'')+' '+invNo+' '+String(r[2]||'')+' '+String(r[3]||'')+' '+String(r[4]||'')).toLowerCase();
    if (searchStr.indexOf(q) >= 0) {
      result.push({ date: String(r[0]||''), invoiceNo: invNo, customerName: String(r[2]||''), grandTotal: Number(r[11]||0), status: String(r[15]||'Unpaid') });
    }
  }
  return result.reverse();
}

function searchTickets(query) {
  if (!query || !String(query).trim()) return getServiceTickets();
  var tickets = getServiceTickets();
  var q = String(query).toLowerCase().trim();
  return tickets.filter(function(t) {
    var searchStr = (t.ticketId+' '+t.customerName+' '+t.phone+' '+t.device+' '+t.deviceType+' '+t.issue+' '+t.status).toLowerCase();
    return searchStr.indexOf(q) >= 0;
  });
}

// =============================================
// DELETE — invoice and quotation
// =============================================
function deleteInvoice(invoiceNo) {
  if (!invoiceNo) throw new Error('Invoice number required.');
  var sh = getOrCreateInvoiceSheet_();
  var rowIdx = findInvoiceRow_(sh, invoiceNo);
  if (rowIdx === -1) throw new Error('Invoice not found: ' + invoiceNo);
  sh.deleteRow(rowIdx);
  return { ok: true, deleted: invoiceNo };
}

function deleteQuotation(quoteNo) {
  if (!quoteNo) throw new Error('Quote number required.');
  var sh = getOrCreateQuotationSheet_();
  var rowIdx = findQuoteRow_(sh, quoteNo);
  if (rowIdx === -1) throw new Error('Quotation not found: ' + quoteNo);
  sh.deleteRow(rowIdx);
  return { ok: true, deleted: quoteNo };
}

// =============================================
// ADD NEW CUSTOMER
// =============================================
function addCustomer(data) {
  if (!data.customerName) throw new Error('Customer name is required.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(APP.CUSTOMER_SHEET);
  if (!sh) throw new Error('Customer sheet not found.');
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var headersLower = headers.map(function(h) { return String(h).trim().toLowerCase(); });

  function findCol(keys) {
    for (var k = 0; k < keys.length; k++) {
      for (var i = 0; i < headersLower.length; i++) {
        if (headersLower[i].indexOf(keys[k].toLowerCase()) >= 0) return i;
      }
    }
    return -1;
  }

  var colName = findCol(['customer name', 'name']);
  var colPhone = findCol(['phone number', 'phone']);
  var colEmail = findCol(['email']);
  var colAddress = findCol(['address']);
  var colTimestamp = findCol(['timestamp']);

  var newRow = new Array(headers.length).fill('');
  if (colTimestamp >= 0) newRow[colTimestamp] = new Date();
  if (colName >= 0) newRow[colName] = data.customerName;
  if (colPhone >= 0) newRow[colPhone] = data.phone || '';
  if (colEmail >= 0) newRow[colEmail] = data.email || '';
  if (colAddress >= 0) newRow[colAddress] = data.address || '';

  sh.appendRow(newRow);
  return { ok: true, customerName: data.customerName };
}

// =============================================
// EXPENSES — reads from Purchases sheet
// =============================================
function getExpenses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Purchases');
  if (!sh) return { expenses: [], totalExpenses: 0, monthExpenses: 0 };
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return { expenses: [], totalExpenses: 0, monthExpenses: 0 };

  var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });

  function findCol(keys) {
    for (var k = 0; k < keys.length; k++) {
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].indexOf(keys[k].toLowerCase()) >= 0) return i;
      }
    }
    return -1;
  }

  var colDate = findCol(['date', 'timestamp']);
  var colDesc = findCol(['description', 'item', 'particular', 'details', 'product']);
  var colAmount = findCol(['amount', 'total', 'cost', 'price']);
  var colVendor = findCol(['vendor', 'supplier', 'shop', 'from']);
  var colCategory = findCol(['category', 'type']);

  var totalExpenses = 0, monthExpenses = 0;
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var expenses = [];

  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var amt = colAmount >= 0 ? Number(r[colAmount] || 0) : 0;
    totalExpenses += amt;

    var dateStr = colDate >= 0 ? String(r[colDate] || '') : '';
    try {
      var d = new Date(r[colDate >= 0 ? colDate : 0]);
      if (d >= monthStart) monthExpenses += amt;
    } catch(e) {}

    expenses.push({
      date: dateStr,
      description: colDesc >= 0 ? String(r[colDesc] || '') : '',
      amount: amt,
      vendor: colVendor >= 0 ? String(r[colVendor] || '') : '',
      category: colCategory >= 0 ? String(r[colCategory] || '') : ''
    });
  }

  expenses.reverse();
  if (expenses.length > 50) expenses = expenses.slice(0, 50);

  return { expenses: expenses, totalExpenses: totalExpenses, monthExpenses: monthExpenses };
}

// =============================================
// EXPORT CSV
// =============================================
function getInvoicesCSV() {
  var sh = getOrCreateInvoiceSheet_();
  var values = sh.getDataRange().getValues();
  var csv = values.map(function(row) {
    return row.map(function(cell) {
      var s = String(cell||'').replace(/"/g, '""');
      if (s.indexOf(',') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('"') >= 0) s = '"' + s + '"';
      return s;
    }).join(',');
  }).join('\n');
  return csv;
}

// =============================================
// PAYMENT REMINDERS — get overdue invoices
// =============================================
function getOverdueInvoices() {
  var sh = getOrCreateInvoiceSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var result = [];
  var now = new Date();
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var invNo = String(r[1]||'').trim();
    if (!invNo) continue;
    var status = String(r[15]||'Unpaid').trim();
    if (status === 'Paid') continue;
    var balance = Number(r[13]||0);
    if (balance <= 0) continue;
    var daysSince = 0;
    try {
      var invDate = new Date(r[0]);
      daysSince = Math.floor((now - invDate) / (1000*60*60*24));
    } catch(e) {}
    result.push({
      invoiceNo: invNo,
      customerName: String(r[2]||''),
      phone: String(r[3]||''),
      email: String(r[4]||''),
      grandTotal: Number(r[11]||0),
      balance: balance,
      status: status,
      daysSince: daysSince
    });
  }
  result.sort(function(a,b) { return b.daysSince - a.daysSince; });
  return result;
}

// =============================================
// AUTO EMAIL ON STATUS CHANGE
// =============================================
function emailTicketStatusUpdate(ticketId, newStatus) {
  var ticket = loadServiceTicket(ticketId);
  var email = String(ticket.email || '').trim();
  if (!email) return { ok: false, reason: 'No email' };

  var subject = 'Service Ticket ' + ticketId + ' Status Update - YantraByte Solutions';
  var statusColor = newStatus === 'Ready' || newStatus === 'Delivered' ? '#2e7d32' : newStatus === 'In Progress' ? '#e65100' : '#0B5394';
  var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;">'
    + '<h2 style="color:#0B5394;">YantraByte Solutions</h2>'
    + '<p>Dear ' + ticket.customerName + ',</p>'
    + '<p>Your service ticket <strong>' + ticketId + '</strong> status has been updated:</p>'
    + '<div style="background:#f5f5f5;border-left:4px solid ' + statusColor + ';padding:16px;margin:16px 0;font-size:18px;font-weight:bold;color:' + statusColor + ';">' + newStatus + '</div>'
    + '<table style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Device</td><td style="padding:8px;border:1px solid #ddd;">' + (ticket.device || ticket.deviceType || '—') + '</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Issue</td><td style="padding:8px;border:1px solid #ddd;">' + (ticket.issue || '—') + '</td></tr>'
    + '</table>'
    + (newStatus === 'Ready' ? '<p style="color:#2e7d32;font-weight:bold;">Your device is ready for pickup! Please collect it at your earliest convenience.</p>' : '')
    + (newStatus === 'Delivered' ? '<p>Thank you for choosing YantraByte Solutions!</p>' : '')
    + '<p style="color:#888;font-size:12px;">YantraByte Solutions | 09986742525 | yantrabyte.solutions@gmail.com</p>'
    + '</div>';

  GmailApp.sendEmail(email, subject, 'Ticket ' + ticketId + ' status: ' + newStatus, {
    htmlBody: htmlBody,
    name: 'YantraByte Solutions'
  });
  return { ok: true, sentTo: email };
}
