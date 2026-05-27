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

/**
 * Appends a row to a Google Sheet via the Supabase Edge Function (backup-to-sheets).
 * Works 24/7 from Supabase cloud — no local server needed.
 */
export async function appendBackupRow(payload: SheetBackupPayload): Promise<SheetBackupResult> {
  try {
    const { data, error } = await supabase.functions.invoke('backup-to-sheets', {
      body: payload,
    });

    if (error) {
      return { ok: false, skipped: false, error: error.message || 'Edge Function error' };
    }

    return data as SheetBackupResult;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, skipped: false, error: msg };
  }
}

/**
 * Sends a Telegram notification via the notify-telegram Edge Function.
 * Fire-and-forget — failures are silently swallowed.
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  try {
    await supabase.functions.invoke('notify-telegram', {
      body: { message },
    });
  } catch {
    // Non-fatal — never block the main action for a notification failure
  }
}
