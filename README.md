# yantrabyte-bolt

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-dat5ebvd)

## Google Drive and Sheets backups

The invoice email API can optionally back up invoice PDFs to Google Drive and append invoice/service-ticket rows to Google Sheets.

Required server environment variables:

```env
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheet_id
```

Use one Google auth method:

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

or:

```env
GOOGLE_APPLICATION_CREDENTIALS=/var/www/yantrabyte/google-service-account.json
```

or OAuth:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
```

Share the Drive folder and Google Sheet with the service-account email if using service-account auth.

Health checks:

```bash
curl http://localhost:4000/api/drive-health
curl http://localhost:4000/api/sheets-health
```
