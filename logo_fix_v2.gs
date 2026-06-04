// FIXED insertLogo_ — uses =IMAGE() formula which is most reliable for PDF export
function insertLogo_(sheet) {
  // Remove any existing floating images
  try {
    var images = sheet.getImages();
    for (var i = 0; i < images.length; i++) { images[i].remove(); }
  } catch (e) {}

  try {
    var file = DriveApp.getFileById(APP.LOGO_FILE_ID);

    // Ensure public access
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { Logger.log('Sharing error: ' + e.message); }

    // Strategy 1: =IMAGE() formula (MOST RELIABLE for PDF export)
    // Mode 1 = fit to cell, preserving aspect ratio
    try {
      var imageUrl = 'https://drive.google.com/uc?export=view&id=' + APP.LOGO_FILE_ID;
      // Test if URL is accessible first
      var testResponse = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true, followRedirects: true });
      var finalUrl = imageUrl;
      
      // If redirected, get the final URL content type to verify it's an image
      if (testResponse.getResponseCode() === 200) {
        Logger.log('Image URL accessible, content type: ' + testResponse.getHeaders()['Content-Type']);
      }
      
      sheet.getRange('A1').setFormula('=IMAGE("' + finalUrl + '", 1)');
      SpreadsheetApp.flush();
      Utilities.sleep(2000);
      Logger.log('IMAGE formula set successfully');
      return;
    } catch (e) {
      Logger.log('IMAGE formula failed: ' + e.message);
    }

    // Strategy 2: =IMAGE() with thumbnail URL
    try {
      var thumbUrl = 'https://drive.google.com/thumbnail?id=' + APP.LOGO_FILE_ID + '&sz=w200';
      sheet.getRange('A1').setFormula('=IMAGE("' + thumbUrl + '", 1)');
      SpreadsheetApp.flush();
      Utilities.sleep(2000);
      Logger.log('IMAGE formula (thumbnail) set successfully');
      return;
    } catch (e) {
      Logger.log('Thumbnail IMAGE formula failed: ' + e.message);
    }

    // Strategy 3: =IMAGE() with blob uploaded to a temp public file
    try {
      var blob = file.getBlob();
      var tempFile = DriveApp.createFile(blob.setName('_temp_logo_' + new Date().getTime() + '.png'));
      tempFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Utilities.sleep(1000); // wait for sharing to propagate
      var tempUrl = 'https://drive.google.com/uc?export=view&id=' + tempFile.getId();
      sheet.getRange('A1').setFormula('=IMAGE("' + tempUrl + '", 1)');
      SpreadsheetApp.flush();
      Utilities.sleep(3000); // extra wait for temp file
      Logger.log('Temp file IMAGE formula succeeded');
      // Don't trash immediately — need it alive during PDF export
      // Will be cleaned up on next run
      return;
    } catch (e) {
      Logger.log('Temp file IMAGE failed: ' + e.message);
    }

    // Strategy 4: CellImage API fallback
    try {
      var cellImageUrl = 'https://drive.google.com/uc?export=view&id=' + APP.LOGO_FILE_ID;
      var cellImage = SpreadsheetApp.newCellImage()
        .setSourceUrl(cellImageUrl)
        .setAltText('YantraByte Solutions')
        .build();
      sheet.getRange('A1').setValue(cellImage);
      SpreadsheetApp.flush();
      Utilities.sleep(1500);
      Logger.log('CellImage succeeded');
      return;
    } catch (e) {
      Logger.log('CellImage failed: ' + e.message);
    }

  } catch (e) {
    Logger.log('Logo error: ' + e.message);
  }

  // Final fallback: text
  sheet.getRange('A1').setValue('YB').setFontSize(22).setFontWeight('bold')
    .setFontColor('#0B5394').setHorizontalAlignment('center');
}
