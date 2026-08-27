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
  sh.setColumnWidth(1, 40);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 70);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 120);
  for (var r=1; r<=totalRows; r++) sh.setRowHeight(r, 22);

  // HEADER (multicolor centered)
  sh.setRowHeight(1, 42); sh.setRowHeight(2, 22); sh.setRowHeight(3, 22);
  var cell1 = sh.getRange('A1:E1').merge();
  var richText = SpreadsheetApp.newRichTextValue()
    .setText('YANTRABYTE SOLUTIONS')
    .setTextStyle(0, 6, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#0B5394').build())
    .setTextStyle(6, 10, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#E65100').build())
    .setTextStyle(10, 11, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#333333').build())
    .setTextStyle(11, 20, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#1A73E8').build())
    .build();
  cell1.setRichTextValue(richText).setHorizontalAlignment('center').setVerticalAlignment('middle').setFontFamily('Arial');
  sh.getRange('A2:E2').merge()
    .setValue('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Chikkabettahalli, Bengaluru - 560097')
    .setFontSize(8).setHorizontalAlignment('center').setFontColor('#555555').setVerticalAlignment('middle');
  sh.getRange('A3:E3').merge()
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
  var fr = tr + 5;
  sh.getRange(fr,1,1,5).merge().setValue('  Notes & Terms')
    .setBackground('#E65100').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9);
  var notes = [
    '1. This quotation is valid for 15 days from the date of issue.',
    '2. Prices are subject to change without prior notice.',
    '3. GST/taxes as applicable at the time of invoicing.',
    '4. Advance payment may be required before service begins.',
    '5. YantraByte Solutions reserves the right to modify the scope.'
  ];
  for(var i=0; i<notes.length; i++) {
    sh.getRange(fr+1+i,1,1,5).merge().setValue('  ' + notes[i]).setFontSize(8).setFontColor('#444444');
  }
  sh.getRange(fr+notes.length+1,1,1,5).merge();
  sh.getRange(fr+notes.length+2,4,2,2).merge().setValue('For YantraByte Solutions')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold').setFontSize(8);
  
  sh.getRange(fr+notes.length+4,1,1,5).merge().setValue('Thank you for your business!')
    .setHorizontalAlignment('center').setFontSize(8).setFontColor('#888888').setFontStyle('italic');
  sh.getRange(fr,1,notes.length+3,5).setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID);

  // Insert Seal
  insertSeal_(sh, fr+notes.length+2, 4, 20);
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
