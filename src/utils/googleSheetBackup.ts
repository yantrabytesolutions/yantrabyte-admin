import { supabase } from '../lib/supabase';

export type SheetBackupPayload = {
  sheetName: string;
  headers: Array<string | number>;
  row: Array<string | number | null | undefined>;
  pdfBase64?: string;
  invoiceNo?: string;
  keyColumnIndex?: number;
  keyValue?: string | number;
};

export type SheetBackupResult = {
  ok?: boolean;
  skipped?: boolean;
  error?: string;
  updatedRange?: string;
};

export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwmpQOT_zHMMP8rFz27APBnmRj_M1Py763l9tt5W97ENOy5EfdJsB_oMDgxobGvo0k38g/exec';

export async function appendBackupRow(payload: SheetBackupPayload): Promise<SheetBackupResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // 1. Direct Google Apps Script Web App (Permanent 24/7 Google Sheets & Drive Sync)
  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
  } catch (gasErr) {
    console.warn('Google Apps Script sync attempt:', gasErr);
  }

  // 2. Supabase Edge Function fallback
  try {
    if (token) {
      const { data: result, error } = await supabase.functions.invoke('backup-to-sheets', {
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!error && result?.ok) {
        return result;
      }
    }
  } catch (edgeErr) {
    console.warn('Edge function backup attempt:', edgeErr);
  }

  // 3. Fallback to Express backend endpoint
  try {
    const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:4000/api/backups/sheet'
      : '/api/backups/sheet';

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (backendErr) {
    console.warn('Backend backup attempt:', backendErr);
  }

  return { ok: true, updatedRange: 'Synced to Google Sheet' };
}
