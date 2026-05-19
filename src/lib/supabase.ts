import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Order-Do] Supabase env variables missing. Check your .env.local file.');
}

// SEC-001: Robust client configuration with optimized storage and auth persistence
// This fixes the "Lock not released" issue in development/multi-tab environments
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'order-do-auth-token', // Custom key to prevent conflicts
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: { 'x-application-name': 'order-do' },
  },
});
