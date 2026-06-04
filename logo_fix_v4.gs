// FIXED v4: Logo — uses CellImage with temp file's direct download URL
// The #REF! error was caused by =IMAGE() formula not resolving Drive redirect URLs
function insertLogo_(sheet) {
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) { images[i].remove(); }
  } catch (e) {}

  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);
    var blob = file.getBlob();

    // Ensure original file is shared
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    // Strategy 1: CellImage with blob from the file
    // CellImage renders IN the cell and survives PDF export
    try {
      // Create temp copy with public sharing for a reliable direct URL
      var tempFile = DriveApp.createFile(blob.setName('_logo_temp_' + new Date().getTime() + '.png'));
      tempFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Utilities.sleep(2000); // Wait for sharing to fully propagate

      // Try multiple URL formats for CellImage
      var urls = [
        'https://lh3.googleusercontent.com/d/' + tempFile.getId(),
        'https://drive.google.com/uc?export=view&id=' + tempFile.getId(),
        tempFile.getDownloadUrl()
      ];

      for (var u = 0; u < urls.length; u++) {
        try {
          Logger.log('Strategy 1.' + (u+1) + ' trying URL: ' + urls[u]);
          var cellImage = SpreadsheetApp.newCellImage()
            .setSourceUrl(urls[u])
            .setAltText('YantraByte Solutions')
            .build();
          sheet.getRange('A1').setValue(cellImage);
          SpreadsheetApp.flush();
          Utilities.sleep(2000);
          Logger.log('CellImage succeeded with URL format ' + (u+1));
          return;
        } catch (e) {
          Logger.log('URL format ' + (u+1) + ' failed: ' + e.message);
        }
      }
      // Clean up if all failed
      try { tempFile.setTrashed(true); } catch(e) {}
    } catch (e) {
      Logger.log('Strategy 1 failed: ' + e.message);
    }

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
          Logger.log('Original file CellImage succeeded');
          return;
        } catch (e) {
          Logger.log('Orig URL ' + (u+1) + ' failed: ' + e.message);
        }
      }
    } catch (e) {
      Logger.log('Strategy 2 failed: ' + e.message);
    }

    // Strategy 3: Floating OverGridImage (may not show in PDF but worth trying)
    try {
      var freshBlob = file.getBlob();
      var img = sheet.insertImage(freshBlob, 1, 1);
      img.setWidth(85);
      img.setHeight(85);
      img.setAnchorCellXOffset(0);
      img.setAnchorCellYOffset(0);
      SpreadsheetApp.flush();
      Logger.log('OverGridImage inserted');
      return;
    } catch (e) {
      Logger.log('OverGridImage failed: ' + e.message);
    }

  } catch (e) {
    Logger.log('Logo error: ' + e.message);
  }

  // Final fallback: styled text
  sheet.getRange('A1').setValue('YB').setFontSize(22).setFontWeight('bold')
    .setFontColor('#0B5394').setHorizontalAlignment('center');
}
