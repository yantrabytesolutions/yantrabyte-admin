// FIXED v3: Logo insertion — embeds image directly via blob insertImage
// on a SEPARATE unmerged cell, then uses CellImage as backup
function insertLogo_(sheet) {
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) { images[i].remove(); }
  } catch (e) {}

  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);
    var blob = file.getBlob();

    // Ensure public access
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { Logger.log('Sharing error: ' + e.message); }

    // Strategy 1: Upload blob to a NEW temp file, get webContentLink, use CellImage
    try {
      var tempFile = DriveApp.createFile(blob.setName('_invoice_logo_temp.png'));
      tempFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Utilities.sleep(2000); // Wait for sharing to propagate

      // Use webContentLink which is a DIRECT download link (no redirects)
      var directUrl = tempFile.getDownloadUrl();
      Logger.log('Temp file download URL: ' + directUrl);

      var cellImage = SpreadsheetApp.newCellImage()
        .setSourceUrl(directUrl)
        .setAltText('YantraByte Solutions')
        .build();
      sheet.getRange('A1').setValue(cellImage);
      SpreadsheetApp.flush();
      Utilities.sleep(3000);
      Logger.log('CellImage with temp download URL succeeded');
      // Don't trash — keep alive for PDF export
      return;
    } catch (e) {
      Logger.log('Temp file CellImage failed: ' + e.message);
    }

    // Strategy 2: Use blob directly with insertImage (OverGridImage)
    // Position it precisely within the merged A1:B3 area
    try {
      var img = sheet.insertImage(blob, 1, 1);
      img.setWidth(85);
      img.setHeight(85);
      img.setAnchorCellXOffset(0);
      img.setAnchorCellYOffset(0);
      SpreadsheetApp.flush();
      Utilities.sleep(2000);
      Logger.log('OverGridImage inserted');
      return;
    } catch (e) {
      Logger.log('OverGridImage failed: ' + e.message);
    }

    // Strategy 3: =IMAGE() formula with direct URL
    try {
      var imageUrl = 'https://drive.google.com/uc?export=view&id=' + APP.LOGO_FILE_ID;
      sheet.getRange('A1').setFormula('=IMAGE("' + imageUrl + '", 1)');
      SpreadsheetApp.flush();
      Utilities.sleep(2000);
      Logger.log('IMAGE formula set');
      return;
    } catch (e) { Logger.log('IMAGE formula failed: ' + e.message); }

  } catch (e) {
    Logger.log('Logo error: ' + e.message);
  }

  // Final fallback
  sheet.getRange('A1').setValue('YB').setFontSize(22).setFontWeight('bold')
    .setFontColor('#0B5394').setHorizontalAlignment('center');
}
