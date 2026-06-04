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
    if (rowIdx === -1) throw new Error('Invoice "' + invoiceNo + '" not found for update.');
    date = String(logSheet.getRange(rowIdx, 1).getValue() || '');
    isUpdate = true;
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
