import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || (typeof process !== 'undefined' ? (process as any).env?.SUPABASE_SERVICE_ROLE_KEY : undefined);

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn('Supabase non configurato: definisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY per abilitarlo.');
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseClient = supabase;

export const getServiceRoleClient = (): SupabaseClient => {
  if (typeof window !== 'undefined') {
    throw new Error('La service role key non deve essere usata nel browser.');
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY per creare il client sicuro.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
