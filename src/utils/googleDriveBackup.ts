import { supabase } from '../lib/supabase';

export type DriveBackupPayload = {
  fileName: string;
  fileBase64: string;
  parentFolderId: string;
  subFolder: string;
};

export type DriveBackupResult = {
  ok: boolean;
  error?: string;
  fileId?: string;
};

export const GOOGLE_DRIVE_FOLDERS = {
  INVOICES: '1IjLBTnX7z-TJE6LHlDEgz4zyWku6V2nO',
  QUOTATIONS: '1eegykuvfmehqa59LKCIM3YynwPZIQOyy',
  TICKETS: '1aRy8gpeYrYXuyBJb_LxGNBgkSuc5ktGi',
};

export async function uploadInvoiceToDrive(
  blob: Blob, 
  invoiceNo: string, 
  dateStr: string, 
  docType: 'INVOICE' | 'QUOTATION' | 'ESTIMATE' | 'TICKET' = 'INVOICE',
  customerName?: string
): Promise<DriveBackupResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return { ok: false, error: 'No active admin session for Google Drive backup.' };
  }

  // Convert Blob to Base64
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 part from data URL
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // Extract month from dateStr (assuming YYYY-MM-DD or similar logic)
  let subFolder = 'Unknown';
  if (dateStr) {
    // If dateStr is DD/MM/YYYY, convert to YYYY-MM
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      subFolder = `${parts[2]}-${parts[1]}`; // YYYY-MM
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        subFolder = `${parts[0]}-${parts[1]}`; // YYYY-MM
      }
    }
  }

  const isQuote = docType === 'QUOTATION' || docType === 'ESTIMATE';
  const parentFolderId = isQuote ? GOOGLE_DRIVE_FOLDERS.QUOTATIONS : GOOGLE_DRIVE_FOLDERS.INVOICES;
  const filePrefix = isQuote ? 'Quotation' : 'Invoice';
  const safeCustomer = customerName ? customerName.trim().replace(/[/\\?%*:|"<>]/g, '-') : '';
  const fileName = safeCustomer ? `${safeCustomer}.pdf` : `${filePrefix}_${invoiceNo}.pdf`;

  const payload: DriveBackupPayload = {
    fileName,
    fileBase64,
    parentFolderId,
    subFolder
  };

  const { data: result, error } = await supabase.functions.invoke('upload-to-drive', {
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (error) {
    return {
      ok: false,
      error: error.message || 'Supabase Edge Function upload-to-drive failed',
    };
  }

  return result || { ok: true };
}
