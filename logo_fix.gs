// ============================================
// REPLACE your existing insertLogo_ function with this one
// ============================================
function insertLogo_(sheet) {
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) { images[i].remove(); }
  } catch (e) {}

  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Sharing error: ' + e.message);
    }

    // Strategy 1: CellImage with multiple URL formats
    var urls = [
      'https://drive.google.com/uc?export=view&id=' + APP.LOGO_FILE_ID,
      'https://lh3.googleusercontent.com/d/' + APP.LOGO_FILE_ID + '=s200',
      'https://drive.google.com/thumbnail?id=' + APP.LOGO_FILE_ID + '&sz=w200'
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
        Utilities.sleep(1500);
        Logger.log('CellImage succeeded with URL ' + (u+1));
        return;
      } catch (e) {
        Logger.log('URL ' + (u+1) + ' failed: ' + e.message);
      }
    }

    // Strategy 2: Temp file blob approach
    try {
      var blob = file.getBlob();
      var tempFile = DriveApp.createFile(blob.setName('_temp_logo_' + new Date().getTime() + '.png'));
      tempFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var tempUrl = 'https://drive.google.com/uc?export=view&id=' + tempFile.getId();
      var cellImage = SpreadsheetApp.newCellImage()
        .setSourceUrl(tempUrl)
        .setAltText('YantraByte Solutions')
        .build();
      sheet.getRange('A1').setValue(cellImage);
      SpreadsheetApp.flush();
      Utilities.sleep(2000);
      try { tempFile.setTrashed(true); } catch(e) {}
      Logger.log('Temp file CellImage succeeded');
      return;
    } catch (e) {
      Logger.log('Temp file approach failed: ' + e.message);
    }

    // Strategy 3: Floating image (may not appear in PDF)
    try {
      var blob2 = file.getBlob();
      var img = sheet.insertImage(blob2, 1, 1);
      img.setWidth(80);
      img.setHeight(80);
      img.setAnchorCellXOffset(5);
      img.setAnchorCellYOffset(2);
      SpreadsheetApp.flush();
      return;
    } catch (e) {
      Logger.log('Floating image failed: ' + e.message);
    }

  } catch (e) {
    Logger.log('Logo error: ' + e.message);
  }

  sheet.getRange('A1').setValue('YB').setFontSize(22).setFontWeight('bold')
    .setFontColor('#0B5394').setHorizontalAlignment('center');
}
