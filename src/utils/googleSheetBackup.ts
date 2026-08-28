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

export async function appendBackupRow(payload: SheetBackupPayload): Promise<SheetBackupResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

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

  // Fallback to Express backend endpoint
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

  return { ok: true, skipped: true };
}
