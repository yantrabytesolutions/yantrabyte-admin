const APP = {
  CUSTOMER_SHEET: 'Form Responses 1',
  INVOICE_SHEET: 'Invoices',
  PRINT_SHEET: 'Print_Invoice',
  PRINT_TICKET_SHEET: 'Print_Ticket',
  PDF_FOLDER_ID: '1bYata0tAmAwVOIDRQNb8oBOLGvn2efMu',
  TICKET_FOLDER_ID: '1GNJ4_QE_Q83w9ovL68rFQ0ow9A8bm0W4',
  LOGO_FILE_ID: '16R4HC_X6wlhVuIyb4aAgN6sFaseUMzLf',
  SEAL_FILE_ID: '1w4naEw7XOLmPju6GlALW5bHhrg3ij3bF', // Activated Seal ID
  PRODUCT_SHEET: 'Products',
  TIMEZONE: Session.getScriptTimeZone() || 'Asia/Kolkata'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('YantraByte Invoice System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ping() { return 'Server OK'; }

function doOptions(e) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

function doPost(e) {
  var headers = {
    'Access-Control-Allow-Origin': '*'
  };
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'updateTicketStatus') {
      var ticketId = data.ticketId;
      var status = data.status;
      
      // Map frontend lowercase/dashed status to sheet capitalized status
      var statusMap = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'closed': 'Closed'
      };
      
      var mappedStatus = statusMap[status] || status;
      
      updateTicketStatus(ticketId, mappedStatus);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    if (data.action === 'syncDocument') {
      var docData = {
         editInvoiceNo: data.invoiceNo,
         editQuoteNo: data.invoiceNo,
         customerName: data.customerName,
         phone: data.phone,
         email: data.email,
         address: data.address,
         items: data.items,
         discount: data.discount,
         tax: data.tax,
         advance: data.advance,
         recordType: data.recordType,
         isSync: true
      };
      var result;
      if (data.recordType === 'QUOTATION') {
        result = generateQuotationPdf(docData);
      } else {
        result = generatePdf(docData);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, result: result }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

function addDefaultHardwareItems() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(APP.PRODUCT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(APP.PRODUCT_SHEET);
    sh.appendRow(['Product Name', 'Default Rate']);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E8F0FE');
  }
  
  var defaults = [
    ['RAM 8GB DDR4', 2800],
    ['RAM 16GB DDR4', 4500],
    ['SSD 256GB NVMe', 2200],
    ['SSD 512GB NVMe', 3800],
    ['SSD 1TB NVMe', 6500],
    ['Hard Disk 1TB Laptop', 3500],
    ['Laptop Keyboard Replacement', 1500],
    ['Laptop Screen replacement', 4500],
    ['OS Installation & Drivers', 800],
    ['General Service / Cleaning', 500],
    ['CCTV Camera 2MP Hikvision', 1800],
    ['DVR 4 Channel Hikvision', 4500],
    ['DC Jack Replacement', 800],
    ['Power Adapter Laptop', 1200]
  ];
  
  var existing = sh.getDataRange().getValues().map(function(r) { return String(r[0]).toLowerCase(); });
  var count = 0;
  
  defaults.forEach(function(item) {
    if (existing.indexOf(item[0].toLowerCase()) === -1) {
      sh.appendRow(item);
      count++;
    }
  });
  
  return { ok: true, added: count };
}

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
  // Column 15: PDF URL, Column 16: Status
  return [
    date, invoiceNo, String(data.customerName||''), String(data.phone||''), 
    String(data.email||''), String(data.address||''), itemsText, 
    totals.subtotal, totals.discount, totals.tax, totals.roundOff, 
    totals.grandTotal, totals.advance, totals.balance, 
    pdfUrl||'', 'Unpaid'
  ];
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
function saveInvoice(data) {
  const sh = getOrCreateInvoiceSheet_();
  if (!data.items || !data.items.length) throw new Error('Add at least one item');
  const totals = calculateTotals_(data);
  var invoiceNo, date;
  if (data.editInvoiceNo) {
    invoiceNo = data.editInvoiceNo;
    var rowIdx = findInvoiceRow_(sh, invoiceNo);
    if (rowIdx === -1) throw new Error('Invoice "' + invoiceNo + '" not found for update.');
    date = String(sh.getRange(rowIdx, 1).getValue() || '');
    var existingPdfUrl = String(sh.getRange(rowIdx, 15).getValue() || '');
    var rowData = buildRowData_(date, invoiceNo, data, totals, existingPdfUrl);
    sh.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    invoiceNo = generateInvoiceNo_();
    date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
    var rowData = buildRowData_(date, invoiceNo, data, totals, '');
    sh.appendRow(rowData);
  }
  return { ok: true, invoiceNo: invoiceNo, subtotal: totals.subtotal, grandTotal: totals.grandTotal, balance: totals.balance, isUpdate: !!data.editInvoiceNo };
}

function generatePdf(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = getOrCreateInvoiceSheet_();
  if (!data.items || !data.items.length) throw new Error('Add at least one item');
  const totals = calculateTotals_(data);
  const cleanName = String(data.customerName||'').trim();
  const cleanPhone = String(data.phone||'').trim();
  const cleanEmail = String(data.email||'').trim();
  const cleanAddress = String(data.address||'').trim();
  var invoiceNo, date, isUpdate = false;
  if (data.editInvoiceNo) {
    invoiceNo = data.editInvoiceNo;
    var rowIdx = findInvoiceRow_(logSheet, invoiceNo);
    if (rowIdx === -1) {
      if (data.isSync) {
        date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
        isUpdate = false;
      } else {
        throw new Error('Invoice "' + invoiceNo + '" not found for update.');
      }
    } else {
      date = String(logSheet.getRange(rowIdx, 1).getValue() || '');
      isUpdate = true;
    }
  } else {
    invoiceNo = generateInvoiceNo_();
    date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
  }
  createPrintableInvoiceSheet_(ss, {
    invoiceNo: invoiceNo, date: date, customerName: cleanName, phone: cleanPhone,
    email: cleanEmail, address: cleanAddress, items: data.items || [],
    subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax,
    roundOff: totals.roundOff, grandTotal: totals.grandTotal,
    advancePaid: totals.advance, balanceDue: totals.balance
  });
  SpreadsheetApp.flush();
  Utilities.sleep(6000); // FIXED: increased from 3000 for logo rendering
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
}

// FIXED v4: Logo — uses CellImage with temp file direct URL
// =IMAGE() formula caused #REF! error due to Drive URL redirects
function insertLogo_(sheet) {
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) { images[i].remove(); }
  } catch (e) {}

  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);
    var blob = file.getBlob();
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    // Strategy 1: CellImage with temp file (most reliable)
    try {
      var tempFile = DriveApp.createFile(blob.setName('_logo_temp_' + new Date().getTime() + '.png'));
      tempFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Utilities.sleep(2000);
      var urls = [
        'https://lh3.googleusercontent.com/d/' + tempFile.getId(),
        'https://drive.google.com/uc?export=view&id=' + tempFile.getId(),
        tempFile.getDownloadUrl()
      ];
      for (var u = 0; u < urls.length; u++) {
        try {
          Logger.log('Trying CellImage URL ' + (u+1) + ': ' + urls[u]);
          var cellImage = SpreadsheetApp.newCellImage()
            .setSourceUrl(urls[u])
            .setAltText('YantraByte Solutions')
            .build();
          sheet.getRange('A1').setValue(cellImage);
          SpreadsheetApp.flush();
          Utilities.sleep(2000);
          Logger.log('CellImage succeeded with URL ' + (u+1));
          return;
        } catch (e) { Logger.log('URL ' + (u+1) + ' failed: ' + e.message); }
      }
      try { tempFile.setTrashed(true); } catch(e) {}
    } catch (e) { Logger.log('Strategy 1 failed: ' + e.message); }

    // Strategy 2: CellImage with original file URLs
    try {
      var origUrls = [
        'https://lh3.googleusercontent.com/d/' + APP.LOGO_FILE_ID,
        'https://drive.google.com/uc?export=view&id=' + APP.LOGO_FILE_ID
      ];
      for (var u = 0; u < origUrls.length; u++) {
        try {
          var cellImage = SpreadsheetApp.newCellImage()
            .setSourceUrl(origUrls[u])
            .setAltText('YantraByte Solutions')
            .build();
          sheet.getRange('A1').setValue(cellImage);
          SpreadsheetApp.flush();
          Utilities.sleep(2000);
          Logger.log('Original CellImage succeeded');
          return;
        } catch (e) { Logger.log('Orig URL ' + (u+1) + ' failed: ' + e.message); }
      }
    } catch (e) { Logger.log('Strategy 2 failed: ' + e.message); }

    // Strategy 3: Floating OverGridImage
    try {
      var freshBlob = file.getBlob();
      var img = sheet.insertImage(freshBlob, 1, 1);
      img.setWidth(85); img.setHeight(85);
      img.setAnchorCellXOffset(0); img.setAnchorCellYOffset(0);
      SpreadsheetApp.flush();
      Logger.log('OverGridImage inserted');
      return;
    } catch (e) { Logger.log('OverGridImage failed: ' + e.message); }
  } catch (e) { Logger.log('Logo error: ' + e.message); }

  sheet.getRange('A1').setValue('YB').setFontSize(22).setFontWeight('bold')
    .setFontColor('#0B5394').setHorizontalAlignment('center');
}
function createPrintableInvoiceSheet_(ss, data) {
  var sh = ss.getSheetByName(APP.PRINT_SHEET);
  if (!sh) sh = ss.insertSheet(APP.PRINT_SHEET);
  sh.clear();
  try { sh.showColumns(1, sh.getMaxColumns()); } catch(e){}
  try { sh.showRows(1, sh.getMaxRows()); } catch(e){}
  var totalRows = 43, totalCols = 5;
  if (sh.getMaxColumns() > totalCols) sh.deleteColumns(totalCols+1, sh.getMaxColumns()-totalCols);
  if (sh.getMaxRows() > totalRows) sh.deleteRows(totalRows+1, sh.getMaxRows()-totalRows);
  if (sh.getMaxRows() < totalRows) sh.insertRowsAfter(sh.getMaxRows(), totalRows-sh.getMaxRows());
  sh.setHiddenGridlines(true);
  sh.getRange(1,1,totalRows,totalCols)
    .setFontFamily('Arial').setFontSize(9).setVerticalAlignment('middle')
    .setWrap(true).setBackground('#FFFFFF').setFontColor('#000000');
  sh.setColumnWidth(1, 80);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 70);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 120);
  for (var r=1; r<=totalRows; r++) sh.setRowHeight(r, 22);

  // HEADER with logo
  sh.setRowHeight(1, 42); sh.setRowHeight(2, 22); sh.setRowHeight(3, 22);

  // Logo in A1:A3 (merged vertically)
  sh.getRange('A1:A3').merge().setHorizontalAlignment('center').setVerticalAlignment('middle');
  insertLogo_(sh);
  SpreadsheetApp.flush(); // FIXED: flush logo before further rendering

  // Multicolor company name using RichTextValue
  var cell1 = sh.getRange('B1:E1').merge();
  var richText = SpreadsheetApp.newRichTextValue()
    .setText('YANTRABYTE SOLUTIONS')
    .setTextStyle(0, 6, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#0B5394').build())   // YANTRA = deep blue
    .setTextStyle(6, 10, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#E65100').build())   // BYTE = orange
    .setTextStyle(10, 11, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#333333').build())  // space
    .setTextStyle(11, 20, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#1A73E8').build())  // SOLUTIONS = bright blue
    .build();
  cell1.setRichTextValue(richText).setHorizontalAlignment('center').setVerticalAlignment('middle').setFontFamily('Arial');

  sh.getRange('B2:E2').merge()
    .setValue('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Chikkabettahalli, Bengaluru - 560097')
    .setFontSize(8).setHorizontalAlignment('center').setFontColor('#555555').setVerticalAlignment('middle');
  sh.getRange('B3:E3').merge()
    .setValue('Phone: 09986742525  |  Email: yantrabyte.solutions@gmail.com')
    .setFontSize(8).setHorizontalAlignment('center').setFontColor('#555555').setVerticalAlignment('middle');
  sh.getRange('A1:E3').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // INVOICE TITLE
  sh.setRowHeight(4, 25);
  sh.getRange('A4:E4').merge().setValue('TAX INVOICE')
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  sh.getRange('A4:E4').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // INVOICE META
  sh.setRowHeight(5, 25);
  sh.getRange('A5:C5').merge().setValue('  Invoice No: ' + String(data.invoiceNo||'N/A'))
    .setFontWeight('bold').setFontSize(10).setFontColor('#0B5394').setNumberFormat('@');
  sh.getRange('D5:E5').merge().setValue('Date: ' + String(data.date||''))
    .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('right').setNumberFormat('@');
  sh.getRange('A5:E5').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('C5').setBorder(null,null,null,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // CUSTOMER DETAILS
  sh.setRowHeight(6, 22);
  sh.getRange('A6:E6').merge().setValue('  Bill To:')
    .setBackground('#D9EAF7').setFontWeight('bold').setFontSize(10);
  sh.getRange('A6:E6').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(7, 22);
  sh.getRange('A7:E7').merge().setValue('  ' + String(data.customerName||''))
    .setFontWeight('bold').setFontSize(11);
  sh.getRange('A7:E7').setBorder(true,true,false,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(8, 20);
  sh.getRange('A8:B8').merge().setValue('  Phone: ' + String(data.phone||'')).setNumberFormat('@').setFontSize(10);
  sh.getRange('C8:E8').merge().setValue('Email: ' + String(data.email||'')).setNumberFormat('@').setFontSize(10);
  sh.getRange('A8:E8').setBorder(false,true,false,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(9, 20);
  sh.getRange('A9:E9').merge().setValue('  Address: ' + String(data.address||'')).setNumberFormat('@').setFontSize(10);
  sh.getRange('A9:E9').setBorder(false,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // ITEMS TABLE HEADER
  sh.setRowHeight(10, 25);
  sh.getRange('A10:E10').setValues([['Sl No.', 'Description', 'Qty', 'Rate', 'Amount']]);
  sh.getRange('A10:E10').setBackground('#0B5394').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(10)
    .setBorder(true,true,true,true,true,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // ITEMS DATA
  var startRow = 11, maxItems = 15;
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
    if (i % 2 === 1) sh.getRange(row, 1, 1, 5).setBackground('#F8FAFC');
  }
  itemRange.setBorder(true,true,true,true,true,false,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // TOTALS
  var tr = startRow + maxItems;
  sh.getRange(tr,1,1,3).merge().setValue('  Amount in Words:')
    .setBackground('#D9EAF7').setFontWeight('bold').setFontSize(9).setVerticalAlignment('top');
  sh.getRange(tr+1,1,6,3).merge()
    .setValue('  ' + numberToWords_(Number(data.grandTotal||0)) + ' Only')
    .setFontSize(9).setVerticalAlignment('top').setFontStyle('italic');
  sh.getRange(tr,1,7,3).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var lbl = ['Subtotal','Discount','Tax','Round Off','Grand Total','Advance Paid','Balance Due'];
  var val = [data.subtotal||0, data.discount||0, data.tax||0, data.roundOff||0, data.grandTotal||0, data.advancePaid||0, data.balanceDue||0];
  for(var i=0; i<lbl.length; i++) {
    var r = tr + i;
    var h = (lbl[i]==='Grand Total' || lbl[i]==='Balance Due');
    sh.getRange(r,4).setValue(lbl[i]).setBackground(h?'#FFF2CC':'#D9EAF7')
      .setFontWeight(h?'bold':'normal').setFontSize(9).setHorizontalAlignment('right');
    sh.getRange(r,5).setValue(val[i]).setBackground(h?'#FFF2CC':'#FFFFFF')
      .setFontWeight(h?'bold':'normal').setFontSize(h?11:10)
      .setHorizontalAlignment('right').setNumberFormat('#,##0.00');
  }
  sh.getRange(tr,4,7,2).setBorder(true,true,true,true,true,true,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // FOOTER
  var fr = tr + 7;
  sh.getRange(fr,1,1,3).merge().setValue('  Terms & Conditions')
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);
  sh.getRange(fr,4,1,2).merge().setValue('  Bank & Payment Details')
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);
  var trm = [
    '1. Service warranty is valid for 30 days only.',
    '2. No warranty for Windows installation/software issues.',
    '3. YantraByte Solutions is not responsible for any data loss.',
    '4. Customer should take backup of all important files prior.',
    '5. Physical, liquid or burnt damages void warranty.',
    '6. No warranty for swollen batteries or electrical faults.'
  ];
  for(var i=0; i<trm.length; i++) {
    sh.getRange(fr+1+i,1,1,3).merge().setValue('  ' + trm[i]).setFontSize(8).setFontColor('#444444');
  }
  sh.getRange(fr+trm.length+1,1,4,3).merge();
  sh.getRange(fr+1,4,1,2).merge().setValue('  UPI: s0424237152@slc').setFontSize(8).setFontWeight('bold');
  sh.getRange(fr+2,4,1,2).merge().setValue('  A/C Name: YantraByte Solutions').setFontSize(8);
  sh.getRange(fr+3,4,1,2).merge().setValue('  A/C No: 033311501023226').setFontSize(8);
  sh.getRange(fr+4,4,1,2).merge().setValue('  IFSC: NESF0000333 / NESF0000096').setFontSize(8);
  sh.getRange(fr+5,4,6,2).merge().setValue('For YantraByte Solutions')
    .setHorizontalAlignment('center').setVerticalAlignment('bottom').setFontWeight('bold').setFontSize(9);
  sh.getRange(fr,1,11,3).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(fr,4,11,2).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  
  // Insert Seal
  insertSeal_(sh, fr+5, 4, 65);
}

function insertSeal_(sheet, row, col, yOff) {
  try {
    if (!APP.SEAL_FILE_ID) return;
    var file = DriveApp.getFileById(APP.SEAL_FILE_ID);
    var img = sheet.insertImage(file.getBlob(), col, row);
    img.setWidth(60).setHeight(60);
    // Position slightly over the signature area
    img.setAnchorCellXOffset(60).setAnchorCellYOffset(yOff || 5);
  } catch (e) {
    Logger.log('Seal insertion failed: ' + e.message);
  }
}

function numberToWords_(num) {
  num = Math.round(Number(num||0));
  if (num === 0) return 'Zero Rupees';
  var a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  var b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function two(n) { if (n<20) return a[n]; return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:''); }
  function three(n) { if (n<100) return two(n); return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+two(n%100):''); }
  var str = '';
  var crore=Math.floor(num/10000000); num%=10000000;
  var lakh=Math.floor(num/100000); num%=100000;
  var thousand=Math.floor(num/1000); num%=1000;
  var rest=num;
  if (crore) str+=three(crore)+' Crore ';
  if (lakh) str+=three(lakh)+' Lakh ';
  if (thousand) str+=three(thousand)+' Thousand ';
  if (rest) str+=three(rest)+' ';
  return str.trim()+' Rupees';
}

function exportCurrentSheetToPdf_(spreadsheetId, gid, fileName) {
  var folder = getTargetFolder_();
  var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?' + [
    'exportFormat=pdf','format=pdf','size=A4','portrait=true',
    'scale=4','fitw=true','sheetnames=false','printtitle=false',
    'pagenumbers=false','gridlines=false','fzr=false','fzc=false',
    'attachment=false','top_margin=0.50','bottom_margin=0.50',
    'left_margin=0.50','right_margin=0.50','gid=' + gid
  ].join('&');
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  var file = folder.createFile(response.getBlob().setName(fileName + '.pdf'));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Sharing failed: ' + e.message);
  }
  return file;
}
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
  var expData = getExpenses();
  if (values.length < 2) return { totalRevenue: 0, pendingBalance: 0, invoiceCount: 0, paidCount: 0, unpaidCount: 0, partialCount: 0, recentInvoices: [], totalExpenses: expData.totalExpenses };

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
    recentInvoices: recent,
    totalExpenses: expData.totalExpenses
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
    if (rowIdx === -1) {
      if (data.isSync) {
        date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
        isUpdate = false;
      } else {
        throw new Error('Quotation not found for update.');
      }
    } else {
      date = String(logSheet.getRange(rowIdx, 1).getValue() || '');
      isUpdate = true;
    }
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
  Utilities.sleep(6000); // FIXED: increased from 4000 for logo rendering
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
// =============================================
// QUOTATION PRINT TEMPLATE
// =============================================
function createPrintableQuotationSheet_(ss, data) {
  var sh = ss.getSheetByName('Print_Quotation');
  if (!sh) sh = ss.insertSheet('Print_Quotation');
  sh.clear();
  try { sh.showColumns(1, sh.getMaxColumns()); } catch(e){}
  try { sh.showRows(1, sh.getMaxRows()); } catch(e){}
  var totalRows = 38, totalCols = 5;
  if (sh.getMaxColumns() > totalCols) sh.deleteColumns(totalCols+1, sh.getMaxColumns()-totalCols);
  if (sh.getMaxRows() > totalRows) sh.deleteRows(totalRows+1, sh.getMaxRows()-totalRows);
  if (sh.getMaxRows() < totalRows) sh.insertRowsAfter(sh.getMaxRows(), totalRows-sh.getMaxRows());
  sh.setHiddenGridlines(true);
  sh.getRange(1,1,totalRows,totalCols)
    .setFontFamily('Arial').setFontSize(9).setVerticalAlignment('middle')
    .setWrap(true).setBackground('#FFFFFF').setFontColor('#000000');
  sh.setColumnWidth(1, 80);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 70);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 120);
  for (var r=1; r<=totalRows; r++) sh.setRowHeight(r, 22);

  // HEADER with logo
  sh.setRowHeight(1, 42); sh.setRowHeight(2, 22); sh.setRowHeight(3, 22);

  // Logo in A1:A3 (merged vertically)
  sh.getRange('A1:A3').merge().setHorizontalAlignment('center').setVerticalAlignment('middle');
  insertLogo_(sh);
  SpreadsheetApp.flush(); // FIXED: flush logo before further rendering

  // Multicolor company name using RichTextValue
  var cell1 = sh.getRange('B1:E1').merge();
  var richText = SpreadsheetApp.newRichTextValue()
    .setText('YANTRABYTE SOLUTIONS')
    .setTextStyle(0, 6, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#0B5394').build())
    .setTextStyle(6, 10, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#E65100').build())
    .setTextStyle(10, 11, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#333333').build())
    .setTextStyle(11, 20, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#1A73E8').build())
    .build();
  cell1.setRichTextValue(richText).setHorizontalAlignment('center').setVerticalAlignment('middle').setFontFamily('Arial');
  sh.getRange('B2:E2').merge()
    .setValue('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Chikkabettahalli, Bengaluru - 560097')
    .setFontSize(8).setHorizontalAlignment('center').setFontColor('#555555').setVerticalAlignment('middle');
  sh.getRange('B3:E3').merge()
    .setValue('Phone: 09986742525  |  Email: yantrabyte.solutions@gmail.com')
    .setFontSize(8).setHorizontalAlignment('center').setFontColor('#555555').setVerticalAlignment('middle');
  sh.getRange('A1:E3').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // TITLE — QUOTATION instead of TAX INVOICE
  sh.setRowHeight(4, 25);
  sh.getRange('A4:E4').merge().setValue('QUOTATION / ESTIMATE')
    .setBackground('#E65100').setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  sh.getRange('A4:E4').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // QUOTE META
  sh.setRowHeight(5, 25);
  sh.getRange('A5:C5').merge().setValue('  Quote No: ' + String(data.quoteNo||'N/A'))
    .setFontWeight('bold').setFontSize(10).setFontColor('#E65100').setNumberFormat('@');
  sh.getRange('D5:E5').merge().setValue('Date: ' + String(data.date||''))
    .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('right').setNumberFormat('@');
  sh.getRange('A5:E5').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // CUSTOMER
  sh.setRowHeight(6, 22);
  sh.getRange('A6:E6').merge().setValue('  Estimate For:')
    .setBackground('#FFF3E0').setFontWeight('bold').setFontSize(10);
  sh.getRange('A6:E6').setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('A7:E7').merge().setValue('  ' + String(data.customerName||''))
    .setFontWeight('bold').setFontSize(11);
  sh.getRange('A7:E7').setBorder(true,true,false,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('A8:B8').merge().setValue('  Phone: ' + String(data.phone||'')).setNumberFormat('@').setFontSize(10);
  sh.getRange('C8:E8').merge().setValue('Email: ' + String(data.email||'')).setNumberFormat('@').setFontSize(10);
  sh.getRange('A8:E8').setBorder(false,true,false,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('A9:E9').merge().setValue('  Address: ' + String(data.address||'')).setNumberFormat('@').setFontSize(10);
  sh.getRange('A9:E9').setBorder(false,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // ITEMS HEADER
  sh.setRowHeight(10, 25);
  sh.getRange('A10:E10').setValues([['Sl No.', 'Description', 'Qty', 'Rate', 'Amount']]);
  sh.getRange('A10:E10').setBackground('#E65100').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(10)
    .setBorder(true,true,true,true,true,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // ITEMS
  var startRow = 11, maxItems = 12;
  var items = data.items || [];
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
    if (i % 2 === 1) sh.getRange(row, 1, 1, 5).setBackground('#FFF8F0');
  }
  sh.getRange(startRow, 1, maxItems, 5).setBorder(true,true,true,true,true,false,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // TOTALS
  var tr = startRow + maxItems;
  sh.getRange(tr,1,1,3).merge().setValue('  Amount in Words:')
    .setBackground('#FFF3E0').setFontWeight('bold').setFontSize(9).setVerticalAlignment('top');
  sh.getRange(tr+1,1,4,3).merge()
    .setValue('  ' + numberToWords_(Number(data.grandTotal||0)) + ' Only')
    .setFontSize(9).setVerticalAlignment('top').setFontStyle('italic');
  sh.getRange(tr,1,5,3).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  var lbl = ['Subtotal','Discount','Tax','Round Off','Grand Total'];
  var val = [data.subtotal||0, data.discount||0, data.tax||0, data.roundOff||0, data.grandTotal||0];
  for(var i=0; i<lbl.length; i++) {
    var r = tr + i;
    var h = (lbl[i]==='Grand Total');
    sh.getRange(r,4).setValue(lbl[i]).setBackground(h?'#FFF2CC':'#FFF3E0')
      .setFontWeight(h?'bold':'normal').setFontSize(9).setHorizontalAlignment('right');
    sh.getRange(r,5).setValue(val[i]).setBackground(h?'#FFF2CC':'#FFFFFF')
      .setFontWeight(h?'bold':'normal').setFontSize(h?11:10)
      .setHorizontalAlignment('right').setNumberFormat('#,##0.00');
  }
  sh.getRange(tr,4,5,2).setBorder(true,true,true,true,true,true,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // FOOTER
  var fr = tr + 6;
  sh.getRange(fr,1,1,3).merge().setValue('  Notes & Terms')
    .setBackground('#E65100').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);
  sh.getRange(fr,4,1,2).merge().setValue('  Bank & Payment Details')
    .setBackground('#E65100').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);
    
  var notes = [
    '1. This quotation is valid for 15 days.',
    '2. Prices are subject to change without notice.',
    '3. Advance payment may be required.',
    '4. Validity: 1 Week (7 Days).'
  ];
  for(var i=0; i<notes.length; i++) {
    sh.getRange(fr+1+i,1,1,3).merge().setValue('  ' + notes[i]).setFontSize(8).setFontColor('#444444');
  }
  
  sh.getRange(fr+1,4,1,2).merge().setValue('  Bank: Karnataka Bank').setFontSize(8).setFontWeight('bold');
  sh.getRange(fr+2,4,1,2).merge().setValue('  A/C: 5062500103756001').setFontSize(8);
  sh.getRange(fr+3,4,1,2).merge().setValue('  IFSC: KARB0000506').setFontSize(8);
  sh.getRange(fr+4,4,1,2).merge().setValue('  Name: YantraByte Solutions').setFontSize(8);
  
  sh.getRange(fr+6,4,2,2).merge().setValue('For YantraByte Solutions')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold').setFontSize(8);
  
  sh.getRange(fr+8,1,1,5).merge().setValue('Thank you for your business!')
    .setHorizontalAlignment('center').setFontSize(8).setFontColor('#888888').setFontStyle('italic');
  
  sh.getRange(fr,1,8,3).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(fr,4,8,2).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  
  // Insert Seal
  insertSeal_(sh, fr+6, 4, 20);
}
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
    if (headers[i].indexOf('status') >= 0) colStatus = i;
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

function updateServiceTicket(ticketData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(APP.CUSTOMER_SHEET);
  if (!sh) throw new Error('Sheet not found.');
  var values = sh.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });

  function findCol(keys) {
    for (var k = 0; k < keys.length; k++) {
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].indexOf(keys[k].toLowerCase()) >= 0) return i;
      }
    }
    return -1;
  }

  var colTicketId = findCol(['ticket id']);
  if (colTicketId === -1) throw new Error('Ticket ID column not found.');

  var rowIdx = -1;
  var lookupId = String(ticketData.originalTicketId || ticketData.ticketId).trim();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][colTicketId]).trim() === lookupId) {
      rowIdx = i + 1;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Ticket not found: ' + lookupId);

  var colName = findCol(['customer name', 'name']);
  var colPhone = findCol(['phone number', 'phone']);
  var colEmail = findCol(['email']);
  var colDevice = findCol(['device']);
  var colDeviceType = findCol(['device types']);
  var colIssue = findCol(['issue reported', 'issue']);
  var colAddress = findCol(['address']);

  if (colTicketId >= 0) sh.getRange(rowIdx, colTicketId + 1).setValue(ticketData.ticketId);
  if (colName >= 0) sh.getRange(rowIdx, colName + 1).setValue(ticketData.customerName);
  if (colPhone >= 0) sh.getRange(rowIdx, colPhone + 1).setValue(ticketData.phone);
  if (colEmail >= 0) sh.getRange(rowIdx, colEmail + 1).setValue(ticketData.email);
  if (colDevice >= 0) sh.getRange(rowIdx, colDevice + 1).setValue(ticketData.device);
  if (colDeviceType >= 0) sh.getRange(rowIdx, colDeviceType + 1).setValue(ticketData.deviceType);
  if (colIssue >= 0) sh.getRange(rowIdx, colIssue + 1).setValue(ticketData.issue);
  if (colAddress >= 0) sh.getRange(rowIdx, colAddress + 1).setValue(ticketData.address);

  return { ok: true, ticketId: ticketData.ticketId };
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

// =============================================
// SERVICE TRACKER — FORM SUBMIT TRIGGER
// =============================================
function onFormSubmit(e) {
  if (!e || !e.range) return; // Safeguard if run manually
  var sh = e.range.getSheet();
  if (sh.getName() !== APP.CUSTOMER_SHEET) return;
  
  var row = e.range.getRow();
  if (row <= 1) return; // Ignore header row
  
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var hLower = headers.map(function(h) { return String(h).trim().toLowerCase(); });
  
  // 1. Ensure required system columns exist
  var required = ['Ticket ID', 'Status', 'Opened At', 'In Progress At', 'Closed At', 'Last Updated At', 'PDF URL'];
  required.forEach(function(req) {
    if (hLower.indexOf(req.toLowerCase()) === -1) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(req);
      headers.push(req);
      hLower.push(req.toLowerCase());
    }
  });
  
  // 2. Generate Ticket ID: YBS-TKT-DDMMYY-SEQ
  var d = new Date();
  var dd = ('0' + d.getDate()).slice(-2);
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var yy = String(d.getFullYear()).slice(-2);
  var seq = ('000' + row).slice(-3); // Pads to 3 digits (e.g., 039)
  var ticketId = 'YBS-TKT-' + dd + mm + yy + '-' + seq;
  
  var now = Utilities.formatDate(d, APP.TIMEZONE, 'dd/MM/yyyy HH:mm');
  var status = 'Received';
  
  // 3. Populate row with system data
  var colTicket = hLower.indexOf('ticket id') + 1;
  var colStatus = hLower.indexOf('status') + 1;
  var colOpened = hLower.indexOf('opened at') + 1;
  var colLastUpdated = hLower.indexOf('last updated at') + 1;
  
  if (colTicket > 0) sh.getRange(row, colTicket).setValue(ticketId);
  if (colStatus > 0) sh.getRange(row, colStatus).setValue(status);
  if (colOpened > 0) sh.getRange(row, colOpened).setValue(now);
  if (colLastUpdated > 0) sh.getRange(row, colLastUpdated).setValue(now);
  
  // Auto-generate PDF and save to the specified folder
  try {
    generateTicketPdf(ticketId);
  } catch (e) {
    Logger.log('Auto PDF Error: ' + e.message);
  }
}

/**
 * Generates a PDF for a service ticket and saves it to the designated folder.
 */
function generateTicketPdf(ticketId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tickets = getServiceTickets();
  const ticket = tickets.find(t => t.ticketId === ticketId);
  if (!ticket) throw new Error('Ticket not found.');

  createPrintableTicketSheet_(ss, ticket);
  SpreadsheetApp.flush();
  Utilities.sleep(2000);

  const printSheet = ss.getSheetByName(APP.PRINT_TICKET_SHEET);
  const folder = DriveApp.getFolderById(APP.TICKET_FOLDER_ID);
  
  const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?' + [
    'exportFormat=pdf','format=pdf','size=A4','portrait=true',
    'scale=4','fitw=true','sheetnames=false','printtitle=false',
    'pagenumbers=false','gridlines=false','fzr=false','fzc=false',
    'attachment=false','top_margin=0.50','bottom_margin=0.50',
    'left_margin=0.50','right_margin=0.50','gid=' + printSheet.getSheetId()
  ].join('&');
  
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  const pdfFile = folder.createFile(response.getBlob().setName(ticketId + '.pdf'));
  
  // Update PDF URL in the sheet
  const sh = ss.getSheetByName(APP.CUSTOMER_SHEET);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const colTicketId = headers.indexOf('ticket id');
  const colPdfUrl = headers.indexOf('pdf url');
  
  if (colTicketId >= 0 && colPdfUrl >= 0) {
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][colTicketId]).trim() === ticketId) {
        sh.getRange(i + 1, colPdfUrl + 1).setValue(pdfFile.getUrl());
        break;
      }
    }
  }

  // 4. NEW: Email the PDF to the customer
  if (ticket.email && ticket.email.indexOf('@') > 0) {
    try {
      var subject = 'Service Ticket ' + ticketId + ' - YantraByte Solutions';
      var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;">'
        + '<h2 style="color:#0B5394;">YantraByte Solutions</h2>'
        + '<p>Dear ' + ticket.customerName + ',</p>'
        + '<p>Please find attached your service ticket <strong>' + ticketId + '</strong>.</p>'
        + '<p>Our team has received your request and will start working on it shortly.</p>'
        + '<p><strong>Device:</strong> ' + (ticket.device || ticket.deviceType || '—') + '</p>'
        + '<p><strong>Issue:</strong> ' + (ticket.issue || '—') + '</p>'
        + '<p>Thank you for choosing YantraByte Solutions!</p>'
        + '<p style="color:#888;font-size:12px;">YantraByte Solutions | 09986742525 | yantrabyte.solutions@gmail.com</p>'
        + '</div>';
        
      GmailApp.sendEmail(ticket.email, subject, 'Service Ticket ' + ticketId + ' attached.', {
        htmlBody: htmlBody,
        attachments: [pdfFile.getBlob()],
        name: 'YantraByte Solutions'
      });
      Logger.log('Email sent to: ' + ticket.email);
    } catch (e) {
      Logger.log('Email Error: ' + e.message);
    }
  }
  
  return { ok: true, ticketId: ticketId, pdfUrl: pdfFile.getUrl() };
}

/**
 * PRODUCT MANAGEMENT
 */
function getProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(APP.PRODUCT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(APP.PRODUCT_SHEET);
    sh.getRange(1, 1, 1, 2).setValues([['Product/Service Name', 'Standard Rate']]).setFontWeight('bold');
  }
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(r => ({ name: r[0], rate: r[1] })).filter(p => p.name);
}

function addProduct(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(APP.PRODUCT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(APP.PRODUCT_SHEET);
    sh.getRange(1, 1, 1, 2).setValues([['Product/Service Name', 'Standard Rate']]).setFontWeight('bold');
  }
  sh.appendRow([p.name, p.rate]);
  return { ok: true, name: p.name };
}

function createPrintableTicketSheet_(ss, t) {
  let sh = ss.getSheetByName(APP.PRINT_TICKET_SHEET);
  if (!sh) sh = ss.insertSheet(APP.PRINT_TICKET_SHEET);
  sh.clear();
  
  // Setup dimensions
  sh.setColumnWidth(1, 150);
  sh.setColumnWidth(2, 450);
  
  // Header with logo
  sh.setRowHeight(1, 50);
  insertLogo_(sh);
  SpreadsheetApp.flush(); // FIXED: flush logo before further rendering
  sh.getRange('B1').setValue('YantraByte Solutions - Service Ticket')
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center').setFontSize(16);
  sh.getRange('A1').setBackground('#0B5394');
  
  const data = [
    ['Ticket ID', t.ticketId],
    ['Date', t.openedAt || t.timestamp],
    ['Customer Name', t.customerName],
    ['Phone', t.phone],
    ['Email', t.email],
    ['Address', t.address],
    ['Device', t.device],
    ['Device Type', t.deviceType],
    ['Issue Reported', t.issue],
    ['Status', t.status]
  ];
  
  sh.getRange(2, 1, data.length, 2).setValues(data);
  sh.getRange(2, 1, data.length, 1).setBackground('#F3F3F3').setFontWeight('bold');
  sh.getRange(2, 1, data.length, 2).setBorder(true, true, true, true, true, true);
  
  sh.getRange(data.length + 3, 1, 1, 2).merge().setValue('For YantraByte Solutions:')
    .setFontWeight('bold').setHorizontalAlignment('right');
  
  // Insert Seal
  insertSeal_(sh, data.length + 3, 2, 5);
  
  sh.getRange(data.length + 4, 1, 1, 2).merge().setValue('Thank you for choosing YantraByte Solutions!')
    .setFontStyle('italic').setHorizontalAlignment('center');
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * CUSTOMER HISTORY
 */
function getCustomerHistory(customerName) {
  if (!customerName) return { tickets: [], invoices: [] };
  var name = customerName.toLowerCase().trim();
  
  // Get tickets
  var tickets = getServiceTickets().filter(function(t) {
    return (t.customerName || '').toLowerCase().trim() === name;
  });
  
  // Get invoices
  var invoices = [];
  try {
    var dash = getDashboardData();
    if (dash && dash.recentInvoices) {
      // In a real scenario, we'd search the whole sheet, 
      // but for now, we search the loaded dashboard data or the sheet directly.
      // Searching the sheet directly is safer.
      var sh = getOrCreateInvoiceSheet_();
      var values = sh.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        var r = values[i];
        if (String(r[2] || '').toLowerCase().trim() === name) {
          invoices.push({
            invoiceNo: String(r[1] || ''),
            grandTotal: Number(r[11] || 0),
            status: String(r[15] || 'Unpaid')
          });
        }
      }
    }
  } catch (e) {
    Logger.log('History Error: ' + e.message);
  }
  
  return { tickets: tickets, invoices: invoices };
}
