import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Standard Supabase client
 * Uses the Anon Key. Respects Row Level Security (RLS) policies.
 * Safe to use in Client Components.
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

/**
 * Service Role Supabase client
 * WARNING: Bypasses Row Level Security (RLS) entirely!
 * NEVER use this in Client Components.
 * Only use in Server Components, Server Actions, or API Routes when you explicitly need elevated privileges.
 */
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return createClient(supabaseUrl, serviceKey);
};
