const APP = {
  CUSTOMER_SHEET: 'Form Responses 1',
  INVOICE_SHEET: 'Invoices',
  PRINT_SHEET: 'Print_Invoice',
  PDF_FOLDER_ID: '1bYata0tAmAwVOIDRQNb8oBOLGvn2efMu',
  LOGO_FILE_ID: '16R4HC_X6wlhVuIyb4aAgN6sFaseUMzLf',
  SEAL_FILE_ID: '1w4naEw7XOLmPju6GlALW5bHhrg3ij3bF', // Activated Seal ID
  TIMEZONE: Session.getScriptTimeZone() || 'Asia/Kolkata'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('YantraByte Invoice System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ping() { return 'Server OK'; }

function getLogoBase64() {
  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);
    var blob = file.getBlob();
    var contentType = blob.getContentType();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return 'data:' + contentType + ';base64,' + base64;
  } catch (e) {
    Logger.log('Logo load error: ' + e.message);
    return '';
  }
}

function getSealBase64() {
  try {
    if (!APP.SEAL_FILE_ID) return '';
    var file = DriveApp.getFileById(APP.SEAL_FILE_ID);
    var blob = file.getBlob();
    var contentType = blob.getContentType();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return 'data:' + contentType + ';base64,' + base64;
  } catch (e) {
    Logger.log('Seal load error: ' + e.message);
    return '';
  }
}

function getCustomers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(APP.CUSTOMER_SHEET);
  if (!sh) throw new Error('"Form Responses 1" sheet not found.');
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  function findCol(keys) {
    for (const k of keys) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(k.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  }
  const nameIdx    = findCol(['customer name', 'name', 'full name', 'your name']);
  const phoneIdx   = findCol(['phone', 'mobile', 'contact', 'number']);
  const emailIdx   = findCol(['email', 'e-mail', 'mail']);
  const addressIdx = findCol(['address', 'location', 'area', 'city']);
  return values.slice(1)
    .filter(r => r.join('').trim() !== '')
    .map(r => {
      function getCell(idx) {
        if (idx === -1) return '';
        const v = r[idx];
        if (v === null || v === undefined) return '';
        if (typeof v === 'number') return String(Math.round(v));
        return String(v).trim();
      }
      return { customerName: getCell(nameIdx), phone: getCell(phoneIdx), email: getCell(emailIdx), address: getCell(addressIdx) };
    })
    .filter(c => c.customerName !== '');
}

function getOrCreateInvoiceSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(APP.INVOICE_SHEET);
  if (!sh) sh = ss.insertSheet(APP.INVOICE_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Date','Invoice No','Customer Name','Phone','Email','Address','Items','Subtotal','Discount','Tax','Round Off','Grand Total','Advance Paid','Balance Due','PDF URL']);
  }
  return sh;
}

function generateInvoiceNo_() {
  const sh = getOrCreateInvoiceSheet_();
  const seq = Math.max(1, sh.getLastRow());
  const datePart = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd');
  return 'YBS-' + datePart + '-' + ('000' + seq).slice(-3);
}

function getTargetFolder_() { return DriveApp.getFolderById(APP.PDF_FOLDER_ID); }

function calculateTotals_(data) {
  const items = data.items || [];
  const subtotal = items.reduce((s, it) => s + (Number(it.qty||0) * Number(it.rate||0)), 0);
  const discount = Number(data.discount||0);
  const tax = Number(data.tax||0);
  const beforeRound = (subtotal - discount) + tax;
  const grandTotal = Math.round(beforeRound);
  const roundOff = grandTotal - beforeRound;
  const advance = Number(data.advancePaid||0);
  const balance = grandTotal - advance;
  return { subtotal, discount, tax, roundOff, grandTotal, advance, balance };
}

function findInvoiceRow_(sh, invoiceNo) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === String(invoiceNo).trim()) return i + 1;
  }
  return -1;
}

function buildRowData_(date, invoiceNo, data, totals, pdfUrl) {
  var itemsText = (data.items||[]).map(function(it, i) {
    return (i+1)+'. '+it.description+' | Qty: '+it.qty+' | Rate: '+it.rate+' | Amount: '+(Number(it.qty)*Number(it.rate));
  }).join('\n');
  return [date, invoiceNo, String(data.customerName||''), String(data.phone||''), String(data.email||''), String(data.address||''), itemsText, totals.subtotal, totals.discount, totals.tax, totals.roundOff, totals.grandTotal, totals.advance, totals.balance, pdfUrl||''];
}

function getSavedInvoices() {
  var sh = getOrCreateInvoiceSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!String(r[1]).trim()) continue;
    result.push({ date: String(r[0]||''), invoiceNo: String(r[1]||''), customerName: String(r[2]||''), grandTotal: Number(r[11]||0) });
  }
  return result.reverse();
}

function loadInvoice(invoiceNo) {
  var sh = getOrCreateInvoiceSheet_();
  var rowIdx = findInvoiceRow_(sh, invoiceNo);
  if (rowIdx === -1) throw new Error('Invoice "' + invoiceNo + '" not found.');
  var r = sh.getRange(rowIdx, 1, 1, 15).getValues()[0];
  var itemsText = String(r[6]||'');
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
  return { invoiceNo: String(r[1]||''), date: String(r[0]||''), customerName: String(r[2]||''), phone: String(r[3]||''), email: String(r[4]||''), address: String(r[5]||''), items: parsedItems, discount: Number(r[8]||0), tax: Number(r[9]||0), advancePaid: Number(r[12]||0), subtotal: Number(r[7]||0), grandTotal: Number(r[11]||0), balance: Number(r[13]||0), pdfUrl: String(r[14]||'') };
}
