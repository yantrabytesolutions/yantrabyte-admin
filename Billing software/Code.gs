const APP = {
  PRINT_SHEET:    'Print_Invoice',
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
  const data = supabaseGet('invoices', 'select=customerName,phone,email,address');
  const map = {};
  data.forEach(function(row) {
    if (row.customerName && !map[row.customerName]) {
      map[row.customerName] = row;
    }
  });
  const result = [];
  for (var k in map) {
    result.push(map[k]);
  }
  return result;
}

function generateInvoiceNo_() {
  const data = supabaseGet('invoices', 'select=id');
  const seq = (data.length || 0) + 1;
  const datePart = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd');
  return 'YBS-' + datePart + '-' + ('000' + seq).slice(-3);
}

function generatePurchaseNo_() {
  const data = supabaseGet('purchases', 'select=id');
  const seq = (data.length || 0) + 1;
  const datePart = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd');
  return 'PUR-' + datePart + '-' + ('000' + seq).slice(-3);
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

function getSavedInvoices() {
  const data = supabaseGet('invoices', 'select=*&order=id.desc');
  return data.map(function(row) {
    return {
      date: row.date || '',
      invoiceNo: row.invoiceNo || '',
      customerName: row.customerName || '',
      grandTotal: Number(row.grandTotal || 0)
    };
  });
}

function getSavedPurchases() {
  const data = supabaseGet('purchases', 'select=*&order=id.desc');
  return data.map(function(row) {
    return {
      date: row.date || '',
      purchaseNo: row.purchaseNo || '',
      supplierName: row.supplierName || '',
      category: row.category || '',
      grandTotal: Number(row.grandTotal || 0),
      paymentMode: row.paymentMode || ''
    };
  });
}

function loadInvoice(invoiceNo) {
  const data = supabaseGet('invoices', 'invoiceNo=eq.' + encodeURIComponent(invoiceNo));
  if (!data || data.length === 0) throw new Error('Invoice "' + invoiceNo + '" not found.');
  
  var r = data[0];
  var itemsText = String(r.itemsText || '');
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
    invoiceNo:    String(r.invoiceNo  || ''),
    date:         String(r.date  || ''),
    customerName: String(r.customerName  || ''),
    phone:        String(r.phone  || ''),
    email:        String(r.email  || ''),
    address:      String(r.address  || ''),
    items:        parsedItems,
    discount:     Number(r.discount  || 0),
    tax:          Number(r.tax  || 0),
    advancePaid:  Number(r.advancePaid || 0),
    subtotal:     Number(r.subtotal  || 0),
    grandTotal:   Number(r.grandTotal || 0),
    balance:      Number(r.balance || 0),
    pdfUrl:       String(r.pdfUrl || '')
  };
}

function loadPurchase(purchaseNo) {
  const data = supabaseGet('purchases', 'purchaseNo=eq.' + encodeURIComponent(purchaseNo));
  if (!data || data.length === 0) throw new Error('Purchase "' + purchaseNo + '" not found.');
  
  var r = data[0];
  var itemsText = String(r.itemsText || '');
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
    purchaseNo:       String(r.purchaseNo  || ''),
    date:             String(r.date  || ''),
    supplierName:     String(r.supplierName  || ''),
    supplierInvoiceNo:String(r.supplierInvoiceNo  || ''),
    phone:            String(r.phone  || ''),
    category:         String(r.category  || ''),
    items:            parsedItems,
    discount:         Number(r.discount  || 0),
    tax:              Number(r.tax  || 0),
    advancePaid:      Number(r.advancePaid || 0),
    subtotal:         Number(r.subtotal  || 0),
    grandTotal:       Number(r.grandTotal || 0),
    balance:          Number(r.balance || 0),
    paymentMode:      String(r.paymentMode || 'Cash'),
    notes:            String(r.notes || '')
  };
}

function saveInvoice(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!data.items || !data.items.length) throw new Error('Add at least one item');

    const totals = calculateTotals_(data);
    var invoiceNo, date;

    var itemsText = (data.items || []).map(function(it, i) {
      return (i+1) + '. ' + it.description + ' | Qty: ' + it.qty + ' | Rate: ' + it.rate + ' | Amount: ' + (Number(it.qty)*Number(it.rate));
    }).join('\n');

    if (data.editInvoiceNo) {
      invoiceNo = data.editInvoiceNo;
      const existing = supabaseGet('invoices', 'invoiceNo=eq.' + encodeURIComponent(invoiceNo));
      if (!existing || existing.length === 0) throw new Error('Invoice not found');
      date = existing[0].date;
      var existingPdfUrl = existing[0].pdfUrl || '';
      
      supabasePatch('invoices', {
        customerName: data.customerName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        itemsText: itemsText,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advance,
        balance: totals.balance,
        pdfUrl: existingPdfUrl
      }, 'invoiceNo=eq.' + encodeURIComponent(invoiceNo));
      
    } else {
      invoiceNo = generateInvoiceNo_();
      date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
      
      supabasePost('invoices', {
        date: date,
        invoiceNo: invoiceNo,
        customerName: data.customerName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        itemsText: itemsText,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advance,
        balance: totals.balance,
        pdfUrl: ''
      });
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

function savePurchase(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!data.items || !data.items.length) throw new Error('Add at least one item');

    const totals = calculateTotals_(data);
    var purchaseNo, date;

    var itemsText = (data.items || []).map(function(it, i) {
      return (i+1) + '. ' + it.description + ' | Qty: ' + it.qty + ' | Rate: ' + it.rate + ' | Amount: ' + (Number(it.qty)*Number(it.rate));
    }).join('\n');

    if (data.editPurchaseNo) {
      purchaseNo = data.editPurchaseNo;
      const existing = supabaseGet('purchases', 'purchaseNo=eq.' + encodeURIComponent(purchaseNo));
      if (!existing || existing.length === 0) throw new Error('Purchase not found');
      date = existing[0].date;
      
      supabasePatch('purchases', {
        supplierName: data.supplierName || '',
        supplierInvoiceNo: data.supplierInvoiceNo || '',
        phone: data.phone || '',
        category: data.category || 'General',
        itemsText: itemsText,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advance,
        balance: totals.balance,
        paymentMode: data.paymentMode || 'Cash',
        notes: data.notes || ''
      }, 'purchaseNo=eq.' + encodeURIComponent(purchaseNo));
      
    } else {
      purchaseNo = generatePurchaseNo_();
      date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
      
      supabasePost('purchases', {
        date: date,
        purchaseNo: purchaseNo,
        supplierName: data.supplierName || '',
        supplierInvoiceNo: data.supplierInvoiceNo || '',
        phone: data.phone || '',
        category: data.category || 'General',
        itemsText: itemsText,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advance,
        balance: totals.balance,
        paymentMode: data.paymentMode || 'Cash',
        notes: data.notes || ''
      });
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

// ============================================================
// ==================== INVOICE PDF ===========================
// ============================================================

function generatePdf(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  
  // Use the exact original template spreadsheet so we keep the watermarks and brands!
  const tempSs = SpreadsheetApp.openById('17nAWzE_OZ6b0ANksVsAn08aqTcMGncbMqgKJAdjdejk');
  try {
    if (!data.items || !data.items.length) throw new Error('Add at least one item');

    const totals       = calculateTotals_(data);
    const cleanName    = String(data.customerName || '').trim();
    const cleanPhone   = String(data.phone        || '').trim();
    const cleanEmail   = String(data.email        || '').trim();
    const cleanAddress = String(data.address      || '').trim();

    var invoiceNo, date, isUpdate = false;

    if (data.editInvoiceNo) {
      invoiceNo = data.editInvoiceNo;
      const existing = supabaseGet('invoices', 'invoiceNo=eq.' + encodeURIComponent(invoiceNo));
      if (!existing || existing.length === 0) throw new Error('Invoice not found');
      date = existing[0].date;
      isUpdate = true;
    } else {
      invoiceNo = generateInvoiceNo_();
      date = Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy');
    }

    createPrintableInvoiceSheet_(tempSs, {
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

    const printSheet = tempSs.getSheetByName(APP.PRINT_SHEET);
    var pdfBlob = getPdfBlob_(tempSs.getId(), printSheet.getSheetId());
    
    // Upload PDF to Supabase Storage
    const bucket = 'invoices'; // Supabase storage bucket name
    const path = invoiceNo + '.pdf';
    var pdfUrl = supabaseUploadStorage(bucket, path, pdfBlob);

    // Save to database
    var itemsText = (data.items || []).map(function(it, i) {
      return (i+1) + '. ' + it.description + ' | Qty: ' + it.qty + ' | Rate: ' + it.rate + ' | Amount: ' + (Number(it.qty)*Number(it.rate));
    }).join('\n');

    if (isUpdate) {
      supabasePatch('invoices', {
        customerName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        itemsText: itemsText,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advance,
        balance: totals.balance,
        pdfUrl: pdfUrl
      }, 'invoiceNo=eq.' + encodeURIComponent(invoiceNo));
    } else {
      supabasePost('invoices', {
        date: date,
        invoiceNo: invoiceNo,
        customerName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        itemsText: itemsText,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        advancePaid: totals.advance,
        balance: totals.balance,
        pdfUrl: pdfUrl
      });
    }

    return { ok: true, invoiceNo: invoiceNo, pdfUrl: pdfUrl, isUpdate: isUpdate };
  } finally {
    lock.releaseLock();
  }
}

function insertLogo_(sheet) {
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) {
      var anchor = images[i].getAnchorCell();
      if (anchor && anchor.getRow() <= 3 && anchor.getColumn() <= 2) {
        images[i].remove();
      }
    }
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

function createPrintableInvoiceSheet_(ss, data) {
  var sh = ss.getSheetByName(APP.PRINT_SHEET);
  if (!sh) sh = ss.insertSheet(APP.PRINT_SHEET);
  sh.clear();
  try { sh.showColumns(1, sh.getMaxColumns()); } catch(e){}
  try { sh.showRows(1, sh.getMaxRows()); } catch(e){}

  var totalRows = 43;
  var totalCols = 5;

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

  sh.getRange(fr+1,4,1,1).setValue('  Bank: North East Small Finance Bank').setFontSize(8).setFontWeight('bold');
  sh.getRange(fr+2,4,1,1).setValue('  A/C Name: YantraByte Solutions').setFontSize(8);
  sh.getRange(fr+3,4,1,1).setValue('  A/C No: 033311501023226').setFontSize(8);
  sh.getRange(fr+4,4,1,1).setValue('  IFSC: NESF0000333').setFontSize(8);
  sh.getRange(fr+5,4,1,1).setValue('  UPI: s0424237152@slc').setFontSize(8).setFontWeight('bold');

  // Generate UPI QR Code in column 5
  var upiString = 'upi://pay?pa=s0424237152@slc&pn=YantraByte%20Solutions&am=' + (data.grandTotal || 0);
  var qrUrl = 'https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=' + encodeURIComponent(upiString);
  
  sh.getRange(fr+1,5,5,1).merge();
  try {
    var images = sh.getImages();
    for (var i = 0; i < images.length; i++) {
      var anchor = images[i].getAnchorCell();
      if (anchor && anchor.getColumn() === 5 && anchor.getRow() >= fr && anchor.getRow() <= fr + 5) {
        images[i].remove();
      }
    }
    
    var qrBlob = UrlFetchApp.fetch(qrUrl).getBlob();
    var qrImg = sh.insertImage(qrBlob, 5, fr+1);
    // Center it in the cell (approx)
    qrImg.setAnchorCellXOffset(10);
    qrImg.setAnchorCellYOffset(10);
  } catch(e) {}

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

function getPdfBlob_(spreadsheetId, gid) {
  var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?exportFormat=pdf&format=pdf'
    + '&size=A4'
    + '&portrait=true'
    + '&fitw=true'
    + '&sheetnames=false&printtitle=false&pagenumbers=false'
    + '&gridlines=false'
    + '&fzr=false'
    + '&gid=' + gid;
    
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('PDF Generation failed: ' + response.getContentText());
  }
  
  return response.getBlob();
}
