// =============================================
// SERVICE TRACKER — reads from Form Responses 1
// =============================================
function getServiceTickets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(APP.CUSTOMER_SHEET);
  if (!sh) throw new Error('Form Responses 1 not found.');
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });

  // Find column indices
  function findCol(keys) {
    for (var k = 0; k < keys.length; k++) {
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].indexOf(keys[k].toLowerCase()) >= 0) return i;
      }
    }
    return -1;
  }

  var colTicketId = findCol(['ticket id']);
  var colName = findCol(['customer name', 'name']);
  var colPhone = findCol(['phone number', 'phone']);
  var colEmail = findCol(['email']);
  var colDevice = findCol(['device']);
  var colDeviceType = findCol(['device types']);
  var colIssue = findCol(['issue reported', 'issue']);
  var colStatus = findCol(['status']);
  var colAddress = findCol(['address']);
  var colTimestamp = findCol(['timestamp']);
  var colOpenedAt = findCol(['opened at']);
  var colInProgressAt = findCol(['in progress at']);
  var colClosedAt = findCol(['closed at']);
  var colLastUpdated = findCol(['last updated at']);
  var colPdfUrl = findCol(['pdf url']);
  var colInvoiceNo = findCol(['invoice no']);

  var result = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var ticketId = colTicketId >= 0 ? String(r[colTicketId] || '').trim() : '';
    var name = colName >= 0 ? String(r[colName] || '').trim() : '';
    if (!name && !ticketId) continue;

    result.push({
      row: i + 1,
      ticketId: ticketId,
      customerName: name,
      phone: colPhone >= 0 ? String(r[colPhone] || '') : '',
      email: colEmail >= 0 ? String(r[colEmail] || '') : '',
      device: colDevice >= 0 ? String(r[colDevice] || '') : '',
      deviceType: colDeviceType >= 0 ? String(r[colDeviceType] || '') : '',
      issue: colIssue >= 0 ? String(r[colIssue] || '') : '',
      status: colStatus >= 0 ? String(r[colStatus] || 'Received') : 'Received',
      address: colAddress >= 0 ? String(r[colAddress] || '') : '',
      timestamp: colTimestamp >= 0 ? String(r[colTimestamp] || '') : '',
      openedAt: colOpenedAt >= 0 ? String(r[colOpenedAt] || '') : '',
      inProgressAt: colInProgressAt >= 0 ? String(r[colInProgressAt] || '') : '',
      closedAt: colClosedAt >= 0 ? String(r[colClosedAt] || '') : '',
      lastUpdated: colLastUpdated >= 0 ? String(r[colLastUpdated] || '') : '',
      pdfUrl: colPdfUrl >= 0 ? String(r[colPdfUrl] || '') : '',
      invoiceNo: colInvoiceNo >= 0 ? String(r[colInvoiceNo] || '') : ''
    });
  }
  return result.reverse();
}

function updateTicketStatus(ticketId, newStatus) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(APP.CUSTOMER_SHEET);
  if (!sh) throw new Error('Sheet not found.');
  var values = sh.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });

  // Find columns
  var colTicketId = -1, colStatus = -1, colInProgressAt = -1, colClosedAt = -1, colLastUpdated = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].indexOf('ticket id') >= 0) colTicketId = i;
    if (headers[i] === 'status') colStatus = i;
    if (headers[i].indexOf('in progress at') >= 0) colInProgressAt = i;
    if (headers[i].indexOf('closed at') >= 0) colClosedAt = i;
    if (headers[i].indexOf('last updated at') >= 0) colLastUpdated = i;
  }

  if (colTicketId === -1 || colStatus === -1) throw new Error('Required columns not found.');

  // Find the row
  var rowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][colTicketId]).trim() === String(ticketId).trim()) {
      rowIdx = i + 1;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Ticket not found: ' + ticketId);

  var now = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy HH:mm');

  // Update status
  sh.getRange(rowIdx, colStatus + 1).setValue(newStatus);

  // Update timestamp columns
  if (newStatus === 'In Progress' && colInProgressAt >= 0) {
    sh.getRange(rowIdx, colInProgressAt + 1).setValue(now);
  }
  if ((newStatus === 'Closed' || newStatus === 'Delivered') && colClosedAt >= 0) {
    sh.getRange(rowIdx, colClosedAt + 1).setValue(now);
  }
  if (colLastUpdated >= 0) {
    sh.getRange(rowIdx, colLastUpdated + 1).setValue(now);
  }

  return { ok: true, ticketId: ticketId, status: newStatus };
}

function loadServiceTicket(ticketId) {
  var tickets = getServiceTickets();
  var ticket = tickets.find(function(t) { return t.ticketId === ticketId; });
  if (!ticket) throw new Error('Ticket not found: ' + ticketId);
  return ticket;
}

// =============================================
// PRINT — generates printable HTML for invoice
// =============================================
function getInvoicePrintData(invoiceNo) {
  var sh = getOrCreateInvoiceSheet_();
  var rowIdx = findInvoiceRow_(sh, invoiceNo);
  if (rowIdx === -1) throw new Error('Invoice not found.');
  var r = sh.getRange(rowIdx, 1, 1, 16).getValues()[0];
  var itemsText = String(r[6] || '');
  var parsedItems = [];
  if (itemsText.trim()) {
    var lines = itemsText.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var stripped = line.replace(/^\d+\.\s*/, '');
      var parts = stripped.split('|');
      var desc = (parts[0]||'').trim();
      var qty = 1, rate = 0;
      for (var p = 1; p < parts.length; p++) {
        var seg = parts[p].trim();
        if (seg.toLowerCase().indexOf('qty:') === 0) qty = Number(seg.replace(/qty:\s*/i,'').trim()) || 1;
        else if (seg.toLowerCase().indexOf('rate:') === 0) rate = Number(seg.replace(/rate:\s*/i,'').trim()) || 0;
      }
      if (desc) parsedItems.push({ description: desc, qty: qty, rate: rate, amount: qty * rate });
    }
  }
  return {
    invoiceNo: String(r[1]||''), date: String(r[0]||''),
    customerName: String(r[2]||''), phone: String(r[3]||''),
    email: String(r[4]||''), address: String(r[5]||''),
    items: parsedItems,
    subtotal: Number(r[7]||0), discount: Number(r[8]||0),
    tax: Number(r[9]||0), roundOff: Number(r[10]||0),
    grandTotal: Number(r[11]||0), advance: Number(r[12]||0),
    balance: Number(r[13]||0), status: String(r[15]||'Unpaid')
  };
}
