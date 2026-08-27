const APP = {
  CUSTOMER_SHEET: 'Form Responses 1',
  INVOICE_SHEET:  'Invoices',
  PURCHASE_SHEET: 'Purchases',
  PRINT_SHEET:    'Print_Invoice',
  PDF_FOLDER_ID:  '1rdQton10P87ZR7RlUAdgtB1QVm8K2qg_',
  LOGO_FILE_ID:   '16R4HC_X6wlhVuIyb4aAgN6sFaseUMzLf',
  TIMEZONE:       Session.getScriptTimeZone() || 'Asia/Kolkata'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('YantraByte Invoice System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ping() {
  return 'Server OK';
}

// Serves logo from Google Drive as base64 data URI for the HTML frontend
function getLogoBase64() {
  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);
    var blob = file.getBlob();
    var contentType = blob.getContentType();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return 'data:' + contentType + ';base64,' + base64;
  } catch (e) {
    Logger.log('Logo load error: ' + e.message);
    return 'ERROR: ' + e.message;
  }
}

function getCustomers() {
  const ss = SpreadsheetApp.openById('17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk');
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
      return {
        customerName: getCell(nameIdx),
        phone:        getCell(phoneIdx),
        email:        getCell(emailIdx),
        address:      getCell(addressIdx)
      };
    })
    .filter(c => c.customerName !== '');
}

function getOrCreateInvoiceSheet_() {
  const ss = SpreadsheetApp.openById('17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk');
  let sh = ss.getSheetByName(APP.INVOICE_SHEET);
  if (!sh) sh = ss.insertSheet(APP.INVOICE_SHEET);

  if (sh.getLastRow() === 0) {
    sh.appendRow([
      'Date', 'Invoice No', 'Customer Name', 'Phone', 'Email',
      'Address', 'Items', 'Subtotal', 'Discount', 'Tax',
      'Round Off', 'Grand Total', 'Advance Paid', 'Balance Due', 'PDF URL'
    ]);
  }
  return sh;
}

// FIX: Invoice number generated ONCE per transaction using lock to prevent race conditions
function generateInvoiceNo_() {
  const sh      = getOrCreateInvoiceSheet_();
  const seq     = Math.max(1, sh.getLastRow());
  const datePart = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd');
  return 'YBS-' + datePart + '-' + ('000' + seq).slice(-3);
}

function getTargetFolder_() {
  return DriveApp.getFolderById(APP.PDF_FOLDER_ID);
}

function calculateTotals_(data) {
  const items       = data.items || [];
  const subtotal    = items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.rate || 0)), 0);
  const discount    = Number(data.discount    || 0);
  const tax         = Number(data.tax         || 0);
  const beforeRound = (subtotal - discount) + tax;
  const grandTotal  = Math.round(beforeRound);
  const roundOff    = grandTotal - beforeRound;
  const advance     = Number(data.advancePaid || 0);
  const balance     = grandTotal - advance;
  return { subtotal, discount, tax, roundOff, grandTotal, advance, balance };
}

// =============================================
// HELPER: Find invoice row by invoice number
// =============================================
function findInvoiceRow_(sh, invoiceNo) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === String(invoiceNo).trim()) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
}

// =============================================
// Build row data array (shared by save/update)
// =============================================
function buildRowData_(date, invoiceNo, data, totals, pdfUrl) {
  var itemsText = (data.items || []).map(function(it, i) {
    return (i+1) + '. ' + it.description + ' | Qty: ' + it.qty + ' | Rate: ' + it.rate + ' | Amount: ' + (Number(it.qty)*Number(it.rate));
  }).join('\n');

  return [
    date, invoiceNo,
    String(data.customerName || ''),
    String(data.phone        || ''),
    String(data.email        || ''),
    String(data.address      || ''),
    itemsText,
    totals.subtotal, totals.discount, totals.tax,
    totals.roundOff, totals.grandTotal, totals.advance, totals.balance,
    pdfUrl || ''
  ];
}

// =============================================
// LIST all saved invoices (for the Edit dropdown)
// =============================================
function getSavedInvoices() {
  var sh = getOrCreateInvoiceSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  var result = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!String(r[1]).trim()) continue;
    result.push({
      date:         String(r[0]  || ''),
      invoiceNo:    String(r[1]  || ''),
      customerName: String(r[2]  || ''),
      grandTotal:   Number(r[11] || 0)
    });
  }
  return result.reverse(); // newest first
}

// =============================================
// LOAD a single invoice for editing
// =============================================
function loadInvoice(invoiceNo) {
  var sh = getOrCreateInvoiceSheet_();
  var rowIdx = findInvoiceRow_(sh, invoiceNo);
  if (rowIdx === -1) throw new Error('Invoice "' + invoiceNo + '" not found.');

  var r = sh.getRange(rowIdx, 1, 1, 15).getValues()[0];

  // Parse items text back into array
  var itemsText = String(r[6] || '');
  var parsedItems = [];
  if (itemsText.trim()) {
    var lines = itemsText.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var stripped = line.replace(/^\d+\.\s*/, '');
      var parts = stripped.split('|');
      var desc = (parts[0] || '').trim();
      var qty = 1, rate = 0;
      for (var p = 1; p < parts.length; p++) {
        var seg = parts[p].trim();
        if (seg.toLowerCase().indexOf('qty:') === 0) {
          qty = Number(seg.replace(/qty:\s*/i, '').trim()) || 1;
        } else if (seg.toLowerCase().indexOf('rate:') === 0) {
          rate = Number(seg.replace(/rate:\s*/i, '').trim()) || 0;
        }
      }
      if (desc) parsedItems.push({ description: desc, qty: qty, rate: rate });
    }
  }

  return {
    invoiceNo:    String(r[1]  || ''),
    date:         String(r[0]  || ''),
    customerName: String(r[2]  || ''),
    phone:        String(r[3]  || ''),
    email:        String(r[4]  || ''),
    address:      String(r[5]  || ''),
    items:        parsedItems,
    discount:     Number(r[8]  || 0),
    tax:          Number(r[9]  || 0),
    advancePaid:  Number(r[12] || 0),
    subtotal:     Number(r[7]  || 0),
    grandTotal:   Number(r[11] || 0),
    balance:      Number(r[13] || 0),
    pdfUrl:       String(r[14] || '')
  };
}

// =============================================
// SAVE invoice (new or update existing)
// =============================================
function saveInvoice(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30 seconds for other processes to finish
  try {
    const sh = getOrCreateInvoiceSheet_();
    if (!data.items || !data.items.length) throw new Error('Add at least one item');

    const totals = calculateTotals_(data);
    var invoiceNo, date;

    if (data.editInvoiceNo) {
      invoiceNo = data.editInvoiceNo;
      var rowIdx = findInvoiceRow_(sh, invoiceNo);
      if (rowIdx === -1) throw new Error('Invoice "' + invoiceNo + '" not found for update.');
      var rawDate = sh.getRange(rowIdx, 1).getValue();
      if (Object.prototype.toString.call(rawDate) === '[object Date]') {
        date = Utilities.formatDate(rawDate, APP.TIMEZONE, 'dd/MM/yyyy');
      } else {
        date = String(rawDate || '');
      }
      var existingPdfUrl = String(sh.getRange(rowIdx, 15).getValue() || '');
      var rowData = buildRowData_(date, invoiceNo, data, totals, existingPdfUrl);
      sh.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    } else {
      invoiceNo = generateInvoiceNo_();
      date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
      var rowData = buildRowData_(date, invoiceNo, data, totals, '');
      sh.appendRow(rowData);
    }

    return {
      ok: true, invoiceNo: invoiceNo,
      subtotal:   totals.subtotal,
      grandTotal: totals.grandTotal,
      balance:    totals.balance,
      isUpdate:   !!data.editInvoiceNo
    };
  } finally {
    lock.releaseLock();
  }
}

// =============================================
// GENERATE PDF (new or re-generate for existing)
// =============================================
function generatePdf(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss       = SpreadsheetApp.openById('17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk');
    const logSheet = getOrCreateInvoiceSheet_();
    if (!data.items || !data.items.length) throw new Error('Add at least one item');

    const totals       = calculateTotals_(data);
    const cleanName    = String(data.customerName || '').trim();
    const cleanPhone   = String(data.phone        || '').trim();
    const cleanEmail   = String(data.email        || '').trim();
    const cleanAddress = String(data.address      || '').trim();

    var invoiceNo, date, isUpdate = false;

    if (data.editInvoiceNo) {
      invoiceNo = data.editInvoiceNo;
      var rowIdx = findInvoiceRow_(logSheet, invoiceNo);
      if (rowIdx === -1) throw new Error('Invoice "' + invoiceNo + '" not found for update.');
      var rawDate = logSheet.getRange(rowIdx, 1).getValue();
      if (Object.prototype.toString.call(rawDate) === '[object Date]') {
        date = Utilities.formatDate(rawDate, APP.TIMEZONE, 'dd/MM/yyyy');
      } else {
        date = String(rawDate || '');
      }
      isUpdate = true;
    } else {
      invoiceNo = generateInvoiceNo_();
      date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
    }

    createPrintableInvoiceSheet_(ss, {
      docType:      data.docType || 'Invoice',
      invoiceNo:    invoiceNo,
      date:         date,
      customerName: cleanName,
      phone:        cleanPhone,
      email:        cleanEmail,
      address:      cleanAddress,
      items:        data.items || [],
      subtotal:     totals.subtotal,
      discount:     totals.discount,
      tax:          totals.tax,
      roundOff:     totals.roundOff,
      grandTotal:   totals.grandTotal,
      advancePaid:  totals.advance,
      balanceDue:   totals.balance
    });

    SpreadsheetApp.flush();
    Utilities.sleep(3000);

    const printSheet = ss.getSheetByName(APP.PRINT_SHEET);
    var pdfFile = exportCurrentSheetToPdf_(ss.getId(), printSheet.getSheetId(), invoiceNo);

    var rowData = buildRowData_(date, invoiceNo,
      { customerName: cleanName, phone: cleanPhone, email: cleanEmail, address: cleanAddress, items: data.items },
      totals, pdfFile.getUrl());

    if (isUpdate) {
      var rowIdx = findInvoiceRow_(logSheet, invoiceNo);
      logSheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    } else {
      logSheet.appendRow(rowData);
    }

    return { ok: true, invoiceNo: invoiceNo, pdfUrl: pdfFile.getUrl(), isUpdate: isUpdate };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// ==================== PURCHASE ENTRY ========================
// ============================================================

function getOrCreatePurchaseSheet_() {
  const ss = SpreadsheetApp.openById('17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk');
  let sh = ss.getSheetByName(APP.PURCHASE_SHEET);
  if (!sh) sh = ss.insertSheet(APP.PURCHASE_SHEET);

  if (sh.getLastRow() === 0) {
    sh.appendRow([
      'Date', 'Purchase No', 'Supplier Name', 'Supplier Invoice No',
      'Phone', 'Category', 'Items', 'Subtotal', 'Discount', 'Tax',
      'Grand Total', 'Paid Amount', 'Balance', 'Payment Mode', 'Notes'
    ]);
    // Style header row
    sh.getRange(1, 1, 1, 15)
      .setBackground('#0B5394')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
  }
  return sh;
}

function generatePurchaseNo_() {
  const sh = getOrCreatePurchaseSheet_();
  const seq = Math.max(1, sh.getLastRow());
  const datePart = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd');
  return 'PUR-' + datePart + '-' + ('000' + seq).slice(-3);
}

function findPurchaseRow_(sh, purchaseNo) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === String(purchaseNo).trim()) {
      return i + 1;
    }
  }
  return -1;
}

function buildPurchaseRowData_(date, purchaseNo, data, totals) {
  var itemsText = (data.items || []).map(function(it, i) {
    return (i+1) + '. ' + it.description + ' | Qty: ' + it.qty + ' | Rate: ' + it.rate + ' | Amount: ' + (Number(it.qty)*Number(it.rate));
  }).join('\n');

  return [
    date,
    purchaseNo,
    String(data.supplierName       || ''),
    String(data.supplierInvoiceNo  || ''),
    String(data.phone              || ''),
    String(data.category           || 'General'),
    itemsText,
    totals.subtotal,
    totals.discount,
    totals.tax,
    totals.grandTotal,
    totals.advance,
    totals.balance,
    String(data.paymentMode        || 'Cash'),
    String(data.notes              || '')
  ];
}

// =============================================
// SAVE a purchase entry (new or update)
// =============================================
function savePurchase(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = getOrCreatePurchaseSheet_();
    if (!data.items || !data.items.length) throw new Error('Add at least one item');

    const totals = calculateTotals_(data);
    var purchaseNo, date;

    if (data.editPurchaseNo) {
      purchaseNo = data.editPurchaseNo;
      var rowIdx = findPurchaseRow_(sh, purchaseNo);
      if (rowIdx === -1) throw new Error('Purchase "' + purchaseNo + '" not found for update.');
      var rawDate = sh.getRange(rowIdx, 1).getValue();
      if (Object.prototype.toString.call(rawDate) === '[object Date]') {
        date = Utilities.formatDate(rawDate, APP.TIMEZONE, 'dd/MM/yyyy');
      } else {
        date = String(rawDate || '');
      }
      var rowData = buildPurchaseRowData_(date, purchaseNo, data, totals);
      sh.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    } else {
      purchaseNo = generatePurchaseNo_();
      date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
      var rowData = buildPurchaseRowData_(date, purchaseNo, data, totals);
      sh.appendRow(rowData);
    }

    return {
      ok:          true,
      purchaseNo:  purchaseNo,
      subtotal:    totals.subtotal,
      grandTotal:  totals.grandTotal,
      balance:     totals.balance,
      isUpdate:    !!data.editPurchaseNo
    };
  } finally {
    lock.releaseLock();
  }
}

// =============================================
// LIST all saved purchases
// =============================================
function getSavedPurchases() {
  var sh = getOrCreatePurchaseSheet_();
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  var result = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!String(r[1]).trim()) continue;
    result.push({
      date:         String(r[0]  || ''),
      purchaseNo:   String(r[1]  || ''),
      supplierName: String(r[2]  || ''),
      category:     String(r[5]  || ''),
      grandTotal:   Number(r[10] || 0),
      paymentMode:  String(r[13] || '')
    });
  }
  return result.reverse(); // newest first
}

// =============================================
// LOAD a single purchase for editing
// =============================================
function loadPurchase(purchaseNo) {
  var sh = getOrCreatePurchaseSheet_();
  var rowIdx = findPurchaseRow_(sh, purchaseNo);
  if (rowIdx === -1) throw new Error('Purchase "' + purchaseNo + '" not found.');

  var r = sh.getRange(rowIdx, 1, 1, 15).getValues()[0];

  // Parse items
  var itemsText = String(r[6] || '');
  var parsedItems = [];
  if (itemsText.trim()) {
    var lines = itemsText.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var stripped = line.replace(/^\d+\.\s*/, '');
      var parts = stripped.split('|');
      var desc = (parts[0] || '').trim();
      var qty = 1, rate = 0;
      for (var p = 1; p < parts.length; p++) {
        var seg = parts[p].trim();
        if (seg.toLowerCase().indexOf('qty:') === 0) {
          qty = Number(seg.replace(/qty:\s*/i, '').trim()) || 1;
        } else if (seg.toLowerCase().indexOf('rate:') === 0) {
          rate = Number(seg.replace(/rate:\s*/i, '').trim()) || 0;
        }
      }
      if (desc) parsedItems.push({ description: desc, qty: qty, rate: rate });
    }
  }

  return {
    purchaseNo:       String(r[1]  || ''),
    date:             String(r[0]  || ''),
    supplierName:     String(r[2]  || ''),
    supplierInvoiceNo:String(r[3]  || ''),
    phone:            String(r[4]  || ''),
    category:         String(r[5]  || ''),
    items:            parsedItems,
    discount:         Number(r[8]  || 0),
    tax:              Number(r[9]  || 0),
    advancePaid:      Number(r[11] || 0),
    subtotal:         Number(r[7]  || 0),
    grandTotal:       Number(r[10] || 0),
    balance:          Number(r[12] || 0),
    paymentMode:      String(r[13] || 'Cash'),
    notes:            String(r[14] || '')
  };
}

// ============================================================
// ==================== INVOICE PDF HELPERS ===================
// ============================================================

function insertLogo_(sheet) {
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) { images[i].remove(); }
    sheet.getRange('A1').clearContent();
  } catch (e) {}

  const logoId = APP.LOGO_FILE_ID;

  try {
    var file = DriveApp.getFileById(logoId);
    var blob = file.getBlob();
    var img = sheet.insertImage(blob, 1, 1);
    img.setWidth(100);
    img.setHeight(100);
    img.setAnchorCellXOffset(10);
    img.setAnchorCellYOffset(5);
    return;
  } catch (e) {
    Logger.log('insertImage failed: ' + e.message);
  }

  try {
    var thumbUrl = 'https://drive.google.com/thumbnail?id=' + logoId + '&sz=w500';
    var cellImage = SpreadsheetApp.newCellImage()
      .setSourceUrl(thumbUrl)
      .setAltText('YantraByte Solutions')
      .build();
    sheet.getRange('A1').setValue(cellImage);
    return;
  } catch (e) {
    Logger.log('CellImage failed: ' + e.message);
  }

  try {
    var ucUrl = 'https://drive.google.com/uc?export=view&id=' + logoId;
    sheet.getRange('A1').setFormula('=IMAGE("' + ucUrl + '")');
    return;
  } catch (e) {}

  sheet.getRange('A1').setValue('YB').setFontSize(22).setFontWeight('bold')
    .setFontColor('#0B5394').setHorizontalAlignment('center');
}

// Tally-style invoice — 5 columns, clean borders
function createPrintableInvoiceSheet_(ss, data) {
  var sh = ss.getSheetByName(APP.PRINT_SHEET);
  if (!sh) sh = ss.insertSheet(APP.PRINT_SHEET);
  sh.clear();
  try { sh.showColumns(1, sh.getMaxColumns()); } catch(e){}
  try { sh.showRows(1, sh.getMaxRows()); } catch(e){}

  var totalRows = 43;
  var totalCols = 5;

  if (sh.getMaxColumns() > totalCols) sh.deleteColumns(totalCols+1, sh.getMaxColumns()-totalCols);
  if (sh.getMaxRows() > totalRows) sh.deleteRows(totalRows+1, sh.getMaxRows()-totalRows);
  if (sh.getMaxRows() < totalRows) sh.insertRowsAfter(sh.getMaxRows(), totalRows-sh.getMaxRows());

  sh.setHiddenGridlines(true);
  sh.getRange(1,1,totalRows,totalCols)
    .setFontFamily('Arial').setFontSize(9).setVerticalAlignment('middle')
    .setWrap(true).setBackground('#FFFFFF').setFontColor('#000000');

  sh.setColumnWidth(1, 40);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 70);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 120);

  for (var r=1; r<=totalRows; r++) sh.setRowHeight(r, 22);

  sh.setRowHeight(1, 35);
  sh.setRowHeight(2, 25);
  sh.setRowHeight(3, 25);

  sh.getRange('A1:B3').merge();
  insertLogo_(sh);

  sh.getRange('C1:E1').merge().setValue('YANTRABYTE SOLUTIONS')
    .setFontSize(18).setFontWeight('bold').setFontColor('#0B5394')
    .setHorizontalAlignment('right').setVerticalAlignment('bottom');

  sh.getRange('C2:E2').merge()
    .setValue('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Chikkabettahalli, Bengaluru - 560097')
    .setFontSize(8).setHorizontalAlignment('right').setFontColor('#555555').setVerticalAlignment('middle');

  sh.getRange('C3:E3').merge()
    .setValue('Phone: 09986742525  |  Email: yantrabyte.solutions@gmail.com')
    .setFontSize(8).setHorizontalAlignment('right').setFontColor('#555555').setVerticalAlignment('top');

  sh.getRange('A1:E3').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var docTitle = (data.docType === 'Quotation') ? 'QUOTATION' : 'TAX INVOICE';
  sh.setRowHeight(4, 25);
  sh.getRange('A4:E4').merge().setValue(docTitle)
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  sh.getRange('A4:E4').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var noLabel = (data.docType === 'Quotation') ? '  Quotation No: ' : '  Invoice No: ';
  sh.setRowHeight(5, 25);
  sh.getRange('A5:C5').merge().setValue(noLabel + String(data.invoiceNo || 'N/A'))
    .setFontWeight('bold').setFontSize(10).setFontColor('#0B5394').setNumberFormat('@');
  sh.getRange('D5:E5').merge().setValue('Date: ' + String(data.date || ''))
    .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('right').setNumberFormat('@');
  sh.getRange('A5:E5').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('C5').setBorder(null,null,null,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  sh.setRowHeight(6, 22);
  sh.getRange('A6:E6').merge().setValue('  Bill To:')
    .setBackground('#D9EAF7').setFontWeight('bold').setFontSize(10);
  sh.getRange('A6:E6').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  sh.setRowHeight(7, 22);
  sh.getRange('A7:E7').merge().setValue('  ' + String(data.customerName || ''))
    .setFontWeight('bold').setFontSize(11);
  sh.getRange('A7:E7').setBorder(true,true,false,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  sh.setRowHeight(8, 20);
  sh.getRange('A8:B8').merge().setValue('  Phone: ' + String(data.phone || ''))
    .setNumberFormat('@').setFontSize(10);
  sh.getRange('C8:E8').merge().setValue('Email: ' + String(data.email || ''))
    .setNumberFormat('@').setFontSize(10);
  sh.getRange('A8:E8').setBorder(false,true,false,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  sh.setRowHeight(9, 20);
  sh.getRange('A9:E9').merge().setValue('  Address: ' + String(data.address || ''))
    .setNumberFormat('@').setFontSize(10);
  sh.getRange('A9:E9').setBorder(false,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  sh.setRowHeight(10, 25);
  sh.getRange('A10:E10').setValues([['Sl No.', 'Description', 'Qty', 'Rate', 'Amount']]);
  sh.getRange('A10:E10').setBackground('#0B5394').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(10)
    .setBorder(true,true,true,true,true,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var startRow = 11;
  var maxItems = 15;
  var items = data.items || [];

  var itemRange = sh.getRange(startRow, 1, maxItems, 5);
  itemRange.setVerticalAlignment('top');

  for (var i = 0; i < maxItems; i++) {
    var row = startRow + i;
    if (i < items.length) {
      var it = items[i];
      var q = Number(it.qty||0), rt = Number(it.rate||0), amt = q*rt;
      sh.getRange(row, 1).setValue(i+1).setHorizontalAlignment('center');
      sh.getRange(row, 2).setValue(' ' + String(it.description||''));
      sh.getRange(row, 3).setValue(q).setHorizontalAlignment('center');
      sh.getRange(row, 4).setValue(rt).setHorizontalAlignment('right').setNumberFormat('#,##0.00');
      sh.getRange(row, 5).setValue(amt).setHorizontalAlignment('right').setNumberFormat('#,##0.00');
    }
    if (i % 2 === 1) {
      sh.getRange(row, 1, 1, 5).setBackground('#F8FAFC');
    }
  }

  itemRange.setBorder(true,true,true,true,true,false,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var tr = startRow + maxItems;

  sh.getRange(tr,1,1,3).merge().setValue('  Amount in Words:')
    .setBackground('#D9EAF7').setFontWeight('bold').setFontSize(9)
    .setVerticalAlignment('top');
  sh.getRange(tr+1,1,6,3).merge()
    .setValue('  ' + numberToWords_(Number(data.grandTotal||0)) + ' Only')
    .setFontSize(9).setVerticalAlignment('top').setFontStyle('italic');
  sh.getRange(tr,1,7,3).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var lbl = ['Subtotal', 'Discount', 'Tax', 'Round Off', 'Grand Total', 'Advance Paid', 'Balance Due'];
  var val = [data.subtotal||0, data.discount||0, data.tax||0, data.roundOff||0,
             data.grandTotal||0, data.advancePaid||0, data.balanceDue||0];

  for(var i=0; i<lbl.length; i++) {
    var r = tr + i;
    var h = (lbl[i] === 'Grand Total' || lbl[i] === 'Balance Due');
    sh.getRange(r,4).setValue(lbl[i]).setBackground(h?'#FFF2CC':'#D9EAF7')
      .setFontWeight(h?'bold':'normal').setFontSize(9).setHorizontalAlignment('right');
    sh.getRange(r,5).setValue(val[i]).setBackground(h?'#FFF2CC':'#FFFFFF')
      .setFontWeight(h?'bold':'normal').setFontSize(h?11:10)
      .setHorizontalAlignment('right').setNumberFormat('#,##0.00');
  }
  sh.getRange(tr,4,7,2).setBorder(true,true,true,true,true,true,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var fr = tr + 7;

  sh.getRange(fr,1,1,3).merge().setValue('  Terms & Conditions')
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);
  sh.getRange(fr,4,1,2).merge().setValue('  Bank & Payment Details')
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);

  var trm = (data.docType === 'Quotation') ? [
    '1. Quotation is valid for 7 days from the date of issue.',
    '2. Prices are inclusive of all taxes unless specified.',
    '3. 50% advance payment required to confirm order.',
    '4. Delivery within 3-5 working days after confirmation.',
    '5. Service warranty as per manufacturer policy.',
    '6. Subject to Bengaluru Jurisdiction.'
  ] : [
    '1. Service warranty is valid for 30 days only.',
    '2. No warranty for Windows installation/software issues.',
    '3. YantraByte Solutions is not responsible for any data loss.',
    '4. Customer should take backup of all important files prior.',
    '5. Physical, liquid or burnt damages void warranty.',
    '6. No warranty for swollen batteries or electrical faults.'
  ];

  for(var i=0; i<trm.length; i++) {
    sh.getRange(fr+1+i,1,1,3).merge().setValue('  ' + trm[i])
      .setFontSize(8).setFontColor('#444444');
  }
  sh.getRange(fr+trm.length+1,1,4,3).merge();

  sh.getRange(fr+1,4,1,2).merge().setValue('  Bank: North East Small Finance Bank').setFontSize(8).setFontWeight('bold');
  sh.getRange(fr+2,4,1,2).merge().setValue('  A/C Name: YantraByte Solutions').setFontSize(8);
  sh.getRange(fr+3,4,1,2).merge().setValue('  A/C No: 033311501023226').setFontSize(8);
  sh.getRange(fr+4,4,1,2).merge().setValue('  IFSC: NESF0000333').setFontSize(8);
  sh.getRange(fr+5,4,1,2).merge().setValue('  UPI: s0424237152@slc').setFontSize(8).setFontWeight('bold');

  sh.getRange(fr+6,4,5,2).merge().setValue('For YantraByte Solutions')
    .setHorizontalAlignment('center').setVerticalAlignment('bottom')
    .setFontWeight('bold').setFontSize(9);

  sh.getRange(fr,1,11,3).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(fr,4,11,2).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
}

function numberToWords_(num) {
  num = Math.round(Number(num || 0));
  if (num === 0) return 'Zero Rupees';

  var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  }
  function three(n) {
    if (n < 100) return two(n);
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '');
  }

  var str = '';
  var crore    = Math.floor(num / 10000000); num %= 10000000;
  var lakh     = Math.floor(num / 100000);   num %= 100000;
  var thousand = Math.floor(num / 1000);     num %= 1000;
  var rest     = num;

  if (crore)    str += three(crore)    + ' Crore ';
  if (lakh)     str += three(lakh)     + ' Lakh ';
  if (thousand) str += three(thousand) + ' Thousand ';
  if (rest)     str += three(rest)     + ' ';

  return str.trim() + ' Rupees';
}

function exportCurrentSheetToPdf_(spreadsheetId, gid, fileName) {
  var folder = getTargetFolder_();
  var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?' + [
    'exportFormat=pdf', 'format=pdf', 'size=A4', 'portrait=true',
    'scale=4', 'fitw=true', 'sheetnames=false', 'printtitle=false',
    'pagenumbers=false', 'gridlines=false', 'fzr=false', 'fzc=false',
    'attachment=false', 'top_margin=0.50', 'bottom_margin=0.50',
    'left_margin=0.50', 'right_margin=0.50', 'gid=' + gid
  ].join('&');

  var token    = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  var file = folder.createFile(response.getBlob().setName(fileName + '.pdf'));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Sharing failed: ' + e.message);
  }
  return file;
}
