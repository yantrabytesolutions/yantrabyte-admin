import { supabase } from '../lib/supabase';

/**
 * Sends a message to the configured Telegram chat via the secured Edge Function.
 * Fails silently to prevent breaking the application flow.
 */
export const sendTelegramNotification = async (message: string): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return false;
    }

    const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const { data, error } = await supabase.functions.invoke('notify-telegram', {
      body: {
        message: escapeHtml(message),
        parse_mode: 'HTML',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error || !data?.ok) {
      if (error) console.error('Telegram Edge Function error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception in sendTelegramNotification:', err);
    return false;
  }
};
