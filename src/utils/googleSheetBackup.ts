import { supabase } from '../lib/supabase';

export type SheetBackupPayload = {
  sheetName: string;
  headers: Array<string | number>;
  row: Array<string | number | null | undefined>;
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
  if (!token) {
    return { ok: false, skipped: true, error: 'No active admin session for Google Sheet backup.' };
  }

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${baseUrl}/api/backups/sheet-row`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      error: result.error || `Google Sheet backup failed with HTTP ${response.status}`,
    };
  }

  return result;
}
