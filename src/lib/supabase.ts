import { createClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const defaultAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isNagarathnammaDomain = typeof window !== 'undefined' && window.location.hostname.includes('nagarathnamma-cash-bill');

const supabaseUrl = isNagarathnammaDomain
  ? 'https://ifxjekxawcnczezyjkrd.supabase.co'
  : defaultUrl;

const supabaseAnonKey = isNagarathnammaDomain
  ? 'sb_publishable_hiKKIwgv7aT3jpgfJaby0w_B7_la-ZC'
  : defaultAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

