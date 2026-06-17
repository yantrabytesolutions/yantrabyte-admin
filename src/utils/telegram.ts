import { supabase } from '../lib/supabase';

/**
 * Sends a message to the configured Telegram chat.
 * Fails silently to prevent breaking the application flow.
 */
export const sendTelegramNotification = async (message: string): Promise<boolean> => {
  try {
    // 1. Fetch settings from Supabase
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['telegram_bot_token', 'telegram_chat_id']);

    if (error || !settings) {
      console.error('Failed to fetch Telegram settings:', error);
      return false;
    }

    const tokenSetting = settings.find(s => s.key === 'telegram_bot_token');
    const chatSetting = settings.find(s => s.key === 'telegram_chat_id');

    if (!tokenSetting?.value || !chatSetting?.value) {
      // Telegram is not configured yet. Just return silently.
      return false;
    }

    const token = tokenSetting.value.trim();
    const chatId = chatSetting.value.trim();

    // 2. Send the message via Telegram Bot API
    const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: escapeHtml(message),
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Telegram API error:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception in sendTelegramNotification:', err);
    return false;
  }
};
