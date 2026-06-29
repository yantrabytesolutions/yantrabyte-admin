import { supabase } from '../lib/supabase';

export type SheetBackupPayload = {
  sheetName: string;
  headers: Array<string | number>;
  row: Array<string | number | null | undefined>;
<<<<<<< HEAD
  pdfBase64?: string;
  invoiceNo?: string;
=======
  keyColumnIndex?: number;
  keyValue?: string | number;
>>>>>>> 5d7a0115be6279683d293f5780e477fdf33de30a
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

  const { data: result, error } = await supabase.functions.invoke('backup-to-sheets', {
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (error) {
    return {
      ok: false,
      skipped: false,
      error: error.message || 'Supabase Edge Function backup-to-sheets failed',
    };
  }

  return result || { ok: true };
}
