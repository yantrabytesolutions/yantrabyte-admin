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
  sh.setColumnWidth(1, 40);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 70);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 120);
  for (var r=1; r<=totalRows; r++) sh.setRowHeight(r, 22);

  // HEADER (centered, multicolor, no logo)
  sh.setRowHeight(1, 42); sh.setRowHeight(2, 22); sh.setRowHeight(3, 22);

  // Multicolor company name using RichTextValue
  var cell1 = sh.getRange('A1:E1').merge();
  var richText = SpreadsheetApp.newRichTextValue()
    .setText('YANTRABYTE SOLUTIONS')
    .setTextStyle(0, 6, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#0B5394').build())   // YANTRA = deep blue
    .setTextStyle(6, 10, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#E65100').build())   // BYTE = orange
    .setTextStyle(10, 11, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#333333').build())  // space
    .setTextStyle(11, 20, SpreadsheetApp.newTextStyle().setFontSize(18).setBold(true).setForegroundColor('#1A73E8').build())  // SOLUTIONS = bright blue
    .build();
  cell1.setRichTextValue(richText).setHorizontalAlignment('center').setVerticalAlignment('middle').setFontFamily('Arial');

  sh.getRange('A2:E2').merge()
    .setValue('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Chikkabettahalli, Bengaluru - 560097')
    .setFontSize(8).setHorizontalAlignment('center').setFontColor('#555555').setVerticalAlignment('middle');
  sh.getRange('A3:E3').merge()
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
