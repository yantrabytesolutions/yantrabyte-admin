// =============================================
// PAYMENT STATUS
// =============================================
function updatePaymentStatus(invoiceNo, status) {
  var sh = getOrCreateInvoiceSheet_();
  var rowIdx = findInvoiceRow_(sh, invoiceNo);
  if (rowIdx === -1) throw new Error('Invoice not found: ' + invoiceNo);
  // Column 16 = Status
  if (sh.getLastColumn() < 16) {
    sh.getRange(1, 16).setValue('Status');
  }
  sh.getRange(rowIdx, 16).setValue(status);
  return { ok: true, invoiceNo: invoiceNo, status: status };
}

// =============================================
// DASHBOARD DATA
// =============================================
function getDashboardData() {
  var sh = getOrCreateInvoiceSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return { totalRevenue: 0, pendingBalance: 0, invoiceCount: 0, paidCount: 0, unpaidCount: 0, partialCount: 0, recentInvoices: [] };

  var totalRevenue = 0, pendingBalance = 0, paidCount = 0, unpaidCount = 0, partialCount = 0;
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var monthCount = 0;
  var recent = [];

  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!String(r[1]).trim()) continue;
    var gt = Number(r[11] || 0);
    var bal = Number(r[13] || 0);
    var status = String(r[15] || 'Unpaid').trim();
    if (!status) status = 'Unpaid';
    totalRevenue += gt;
    pendingBalance += bal;
    if (status === 'Paid') paidCount++;
    else if (status === 'Partial') partialCount++;
    else unpaidCount++;

    try {
      var d = new Date(r[0]);
      if (d >= monthStart) monthCount++;
    } catch(e) {}

    recent.push({
      date: String(r[0] || ''),
      invoiceNo: String(r[1] || ''),
      customerName: String(r[2] || ''),
      phone: String(r[3] || ''),
      email: String(r[4] || ''),
      grandTotal: gt,
      balance: bal,
      status: status,
      pdfUrl: String(r[14] || '')
    });
  }

  recent.reverse();
  if (recent.length > 20) recent = recent.slice(0, 20);

  return {
    totalRevenue: totalRevenue,
    pendingBalance: pendingBalance,
    invoiceCount: values.length - 1,
    monthCount: monthCount,
    paidCount: paidCount,
    unpaidCount: unpaidCount,
    partialCount: partialCount,
    recentInvoices: recent
  };
}

// =============================================
// QUOTATION SYSTEM
// =============================================
function getOrCreateQuotationSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Quotations');
  if (!sh) sh = ss.insertSheet('Quotations');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Date','Quote No','Customer Name','Phone','Email','Address','Items','Subtotal','Discount','Tax','Round Off','Grand Total','Status','PDF URL']);
  }
  return sh;
}

function generateQuoteNo_() {
  var sh = getOrCreateQuotationSheet_();
  var seq = Math.max(1, sh.getLastRow());
  var datePart = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd');
  return 'YBQ-' + datePart + '-' + ('000' + seq).slice(-3);
}

function findQuoteRow_(sh, quoteNo) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === String(quoteNo).trim()) return i + 1;
  }
  return -1;
}

function buildQuoteRowData_(date, quoteNo, data, totals, status, pdfUrl) {
  var itemsText = (data.items || []).map(function(it, i) {
    return (i+1) + '. ' + it.description + ' | Qty: ' + it.qty + ' | Rate: ' + it.rate + ' | Amount: ' + (Number(it.qty)*Number(it.rate));
  }).join('\n');
  return [date, quoteNo, String(data.customerName||''), String(data.phone||''), String(data.email||''), String(data.address||''), itemsText, totals.subtotal, totals.discount, totals.tax, totals.roundOff, totals.grandTotal, status || 'Draft', pdfUrl || ''];
}

function saveQuotation(data) {
  var sh = getOrCreateQuotationSheet_();
  if (!data.items || !data.items.length) throw new Error('Add at least one item');
  var totals = calculateTotals_(data);
  var quoteNo, date;
  if (data.editQuoteNo) {
    quoteNo = data.editQuoteNo;
    var rowIdx = findQuoteRow_(sh, quoteNo);
    if (rowIdx === -1) throw new Error('Quotation not found: ' + quoteNo);
    date = String(sh.getRange(rowIdx, 1).getValue() || '');
    var existingStatus = String(sh.getRange(rowIdx, 13).getValue() || 'Draft');
    var existingPdf = String(sh.getRange(rowIdx, 14).getValue() || '');
    var rowData = buildQuoteRowData_(date, quoteNo, data, totals, existingStatus, existingPdf);
    sh.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    quoteNo = generateQuoteNo_();
    date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
    var rowData = buildQuoteRowData_(date, quoteNo, data, totals, 'Draft', '');
    sh.appendRow(rowData);
  }
  return { ok: true, quoteNo: quoteNo, subtotal: totals.subtotal, grandTotal: totals.grandTotal, isUpdate: !!data.editQuoteNo };
}

function getSavedQuotations() {
  var sh = getOrCreateQuotationSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!String(r[1]).trim()) continue;
    result.push({ date: String(r[0]||''), quoteNo: String(r[1]||''), customerName: String(r[2]||''), grandTotal: Number(r[11]||0), status: String(r[12]||'Draft') });
  }
  return result.reverse();
}

function loadQuotation(quoteNo) {
  var sh = getOrCreateQuotationSheet_();
  var rowIdx = findQuoteRow_(sh, quoteNo);
  if (rowIdx === -1) throw new Error('Quotation not found: ' + quoteNo);
  var r = sh.getRange(rowIdx, 1, 1, 14).getValues()[0];
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
      if (desc) parsedItems.push({ description: desc, qty: qty, rate: rate });
    }
  }
  return { quoteNo: String(r[1]||''), date: String(r[0]||''), customerName: String(r[2]||''), phone: String(r[3]||''), email: String(r[4]||''), address: String(r[5]||''), items: parsedItems, discount: Number(r[8]||0), tax: Number(r[9]||0), subtotal: Number(r[7]||0), grandTotal: Number(r[11]||0), status: String(r[12]||'Draft'), pdfUrl: String(r[13]||'') };
}

function updateQuotationStatus(quoteNo, status) {
  var sh = getOrCreateQuotationSheet_();
  var rowIdx = findQuoteRow_(sh, quoteNo);
  if (rowIdx === -1) throw new Error('Quotation not found: ' + quoteNo);
  sh.getRange(rowIdx, 13).setValue(status);
  return { ok: true, quoteNo: quoteNo, status: status };
}

// =============================================
// QUOTATION PDF
// =============================================
function generateQuotationPdf(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = getOrCreateQuotationSheet_();
  if (!data.items || !data.items.length) throw new Error('Add at least one item');
  var totals = calculateTotals_(data);
  var quoteNo, date, isUpdate = false;
  if (data.editQuoteNo) {
    quoteNo = data.editQuoteNo;
    var rowIdx = findQuoteRow_(logSheet, quoteNo);
    if (rowIdx === -1) throw new Error('Quotation not found for update.');
    date = String(logSheet.getRange(rowIdx, 1).getValue() || '');
    isUpdate = true;
  } else {
    quoteNo = generateQuoteNo_();
    date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
  }
  createPrintableQuotationSheet_(ss, {
    quoteNo: quoteNo, date: date,
    customerName: String(data.customerName||'').trim(),
    phone: String(data.phone||'').trim(),
    email: String(data.email||'').trim(),
    address: String(data.address||'').trim(),
    items: data.items || [],
    subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax,
    roundOff: totals.roundOff, grandTotal: totals.grandTotal
  });
  SpreadsheetApp.flush();
  Utilities.sleep(4000);
  var printSheet = ss.getSheetByName('Print_Quotation');
  var pdfFile = exportCurrentSheetToPdf_(ss.getId(), printSheet.getSheetId(), quoteNo);
  var rowData = buildQuoteRowData_(date, quoteNo, data, totals, 'Sent', pdfFile.getUrl());
  if (isUpdate) {
    var rowIdx = findQuoteRow_(logSheet, quoteNo);
    logSheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    logSheet.appendRow(rowData);
  }
  return { ok: true, quoteNo: quoteNo, pdfUrl: pdfFile.getUrl(), isUpdate: isUpdate };
}

// =============================================
// EMAIL INVOICE / QUOTATION
// =============================================
function emailInvoice(invoiceNo) {
  var sh = getOrCreateInvoiceSheet_();
  var rowIdx = findInvoiceRow_(sh, invoiceNo);
  if (rowIdx === -1) throw new Error('Invoice not found.');
  var r = sh.getRange(rowIdx, 1, 1, 16).getValues()[0];
  var email = String(r[4] || '').trim();
  var name = String(r[2] || '');
  var pdfUrl = String(r[14] || '');
  var grandTotal = Number(r[11] || 0);
  if (!email) throw new Error('No email address for this customer.');
  if (!pdfUrl) throw new Error('No PDF generated. Generate PDF first.');

  var pdfFileId = pdfUrl.match(/[-\w]{25,}/);
  if (!pdfFileId) throw new Error('Invalid PDF URL.');
  var pdfFile = DriveApp.getFileById(pdfFileId[0]);
  var pdfBlob = pdfFile.getBlob();

  var subject = 'Invoice ' + invoiceNo + ' from YantraByte Solutions';
  var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;">'
    + '<h2 style="color:#0B5394;">YantraByte Solutions</h2>'
    + '<p>Dear ' + name + ',</p>'
    + '<p>Please find attached your invoice <strong>' + invoiceNo + '</strong>.</p>'
    + '<table style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Invoice No</td><td style="padding:8px;border:1px solid #ddd;">' + invoiceNo + '</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #ddd;">\u20B9' + grandTotal.toLocaleString('en-IN') + '</td></tr>'
    + '</table>'
    + '<p>Thank you for your business!</p>'
    + '<p style="color:#888;font-size:12px;">YantraByte Solutions | 09986742525 | yantrabyte.solutions@gmail.com</p>'
    + '</div>';

  GmailApp.sendEmail(email, subject, 'Invoice ' + invoiceNo + ' attached.', {
    htmlBody: htmlBody,
    attachments: [pdfBlob],
    name: 'YantraByte Solutions'
  });
  return { ok: true, sentTo: email };
}

function emailQuotation(quoteNo) {
  var sh = getOrCreateQuotationSheet_();
  var rowIdx = findQuoteRow_(sh, quoteNo);
  if (rowIdx === -1) throw new Error('Quotation not found.');
  var r = sh.getRange(rowIdx, 1, 1, 14).getValues()[0];
  var email = String(r[4] || '').trim();
  var name = String(r[2] || '');
  var pdfUrl = String(r[13] || '');
  var grandTotal = Number(r[11] || 0);
  if (!email) throw new Error('No email address for this customer.');
  if (!pdfUrl) throw new Error('No PDF generated. Generate PDF first.');

  var pdfFileId = pdfUrl.match(/[-\w]{25,}/);
  if (!pdfFileId) throw new Error('Invalid PDF URL.');
  var pdfFile = DriveApp.getFileById(pdfFileId[0]);
  var pdfBlob = pdfFile.getBlob();

  var subject = 'Quotation ' + quoteNo + ' from YantraByte Solutions';
  var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;">'
    + '<h2 style="color:#0B5394;">YantraByte Solutions</h2>'
    + '<p>Dear ' + name + ',</p>'
    + '<p>Please find attached your quotation <strong>' + quoteNo + '</strong>.</p>'
    + '<table style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Quote No</td><td style="padding:8px;border:1px solid #ddd;">' + quoteNo + '</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Estimated Amount</td><td style="padding:8px;border:1px solid #ddd;">\u20B9' + grandTotal.toLocaleString('en-IN') + '</td></tr>'
    + '</table>'
    + '<p>This quotation is valid for 15 days.</p>'
    + '<p style="color:#888;font-size:12px;">YantraByte Solutions | 09986742525 | yantrabyte.solutions@gmail.com</p>'
    + '</div>';

  GmailApp.sendEmail(email, subject, 'Quotation ' + quoteNo + ' attached.', {
    htmlBody: htmlBody,
    attachments: [pdfBlob],
    name: 'YantraByte Solutions'
  });
  sh.getRange(rowIdx, 13).setValue('Sent');
  return { ok: true, sentTo: email };
}
